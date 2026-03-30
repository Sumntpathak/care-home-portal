/**
 * VITALS ENGINE - Clinical-grade vital signs analysis
 * Standards: WHO, AHA (American Heart Association), JNC-8, ADA (American Diabetes Association)
 *
 * Tracks vital signs over time, detects trends via linear regression,
 * generates alerts based on international clinical standards,
 * and produces chart-ready data for SVG line/area charts.
 */

// ---------------------------------------------------------------------------
// Clinical reference ranges
// ---------------------------------------------------------------------------

const RANGES = {
  temperature: {
    // WHO standards (Fahrenheit)
    hypothermia: { max: 96.0 },
    normal: { min: 97.0, max: 99.0 },
    lowGradeFever: { min: 99.1, max: 100.3 },
    fever: { min: 100.4, max: 103.0 },
    highFever: { min: 103.0 },
  },
  systolic: {
    // AHA / JNC-8
    hypotension: { max: 90 },
    normal: { min: 90, max: 120 },
    elevated: { min: 120, max: 129 },
    hypertensionStage1: { min: 130, max: 139 },
    hypertensionStage2: { min: 140, max: 180 },
    crisis: { min: 180 },
  },
  diastolic: {
    hypotension: { max: 60 },
    normal: { min: 60, max: 80 },
    hypertensionStage1: { min: 80, max: 89 },
    hypertensionStage2: { min: 90, max: 120 },
    crisis: { min: 120 },
  },
  pulse: {
    // AHA
    severeBradycardia: { max: 50 },
    bradycardia: { min: 50, max: 60 },
    normal: { min: 60, max: 100 },
    tachycardia: { min: 100, max: 120 },
    severeTachycardia: { min: 120 },
  },
  spo2: {
    // WHO
    normal: { min: 95, max: 100 },
    mildHypoxemia: { min: 90, max: 94 },
    moderateHypoxemia: { min: 85, max: 89 },
    severeHypoxemia: { max: 85 },
  },
  glucose: {
    // ADA
    criticalLow: { max: 54 },
    hypoglycemia: { min: 54, max: 70 },
    normalFasting: { min: 70, max: 100 },
    preDiabetic: { min: 100, max: 125 },
    diabetic: { min: 126, max: 200 },
    high: { min: 200, max: 300 },
    dkaRisk: { min: 300 },
  },
};

// ---------------------------------------------------------------------------
// Chart configuration per vital type
// ---------------------------------------------------------------------------

const CHART_CONFIGS = {
  temperature: {
    label: "Temperature",
    unit: "\u00b0F",
    color: "#e74c3c",
    normalRange: [97.0, 99.0],
    cautionRange: [96.0, 100.3],
    criticalRange: [93.0, 105.0],
  },
  systolic: {
    label: "Systolic BP",
    unit: "mmHg",
    color: "#e67e22",
    normalRange: [90, 120],
    cautionRange: [80, 139],
    criticalRange: [60, 200],
  },
  diastolic: {
    label: "Diastolic BP",
    unit: "mmHg",
    color: "#f39c12",
    normalRange: [60, 80],
    cautionRange: [50, 89],
    criticalRange: [40, 130],
  },
  pulse: {
    label: "Heart Rate",
    unit: "bpm",
    color: "#c0392b",
    normalRange: [60, 100],
    cautionRange: [50, 120],
    criticalRange: [40, 150],
  },
  spo2: {
    label: "Oxygen Saturation",
    unit: "%",
    color: "#2980b9",
    normalRange: [95, 100],
    cautionRange: [90, 100],
    criticalRange: [80, 100],
  },
  glucose: {
    label: "Blood Glucose",
    unit: "mg/dL",
    color: "#8e44ad",
    normalRange: [70, 140],
    cautionRange: [54, 200],
    criticalRange: [30, 400],
  },
  weight: {
    label: "Weight",
    unit: "kg",
    color: "#27ae60",
    normalRange: [0, 0], // patient-specific
    cautionRange: [0, 0],
    criticalRange: [0, 0],
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse a blood pressure string into systolic and diastolic values.
 * Accepted formats: "140/85", "140 / 85", "140-85"
 * @param {string} bpString
 * @returns {{ systolic: number, diastolic: number } | null}
 */
function parseBP(bpString) {
  if (!bpString || typeof bpString !== "string") return null;
  const match = bpString.trim().match(/^(\d{2,3})\s*[/\-]\s*(\d{2,3})$/);
  if (!match) return null;
  const systolic = parseInt(match[1], 10);
  const diastolic = parseInt(match[2], 10);
  if (isNaN(systolic) || isNaN(diastolic)) return null;
  if (systolic < 40 || systolic > 300 || diastolic < 20 || diastolic > 200) return null;
  return { systolic, diastolic };
}

/**
 * Classify a single temperature reading (WHO).
 * @param {number} value - Temperature in Fahrenheit
 * @returns {"normal"|"caution"|"critical"}
 */
function classifyTemperature(value) {
  if (value < 96.0 || value > 103.0) return "critical";
  if (value < 97.0 || (value > 99.0 && value <= 103.0)) return "caution";
  return "normal";
}

/**
 * Classify a single systolic BP reading (AHA / JNC-8).
 * @param {number} value
 * @returns {"normal"|"caution"|"critical"}
 */
function classifySystolic(value) {
  if (value >= 180 || value < 80) return "critical";
  if (value >= 130 || value < 90) return "caution";
  if (value >= 120) return "caution"; // elevated
  return "normal";
}

/**
 * Classify a single diastolic BP reading (AHA / JNC-8).
 * @param {number} value
 * @returns {"normal"|"caution"|"critical"}
 */
function classifyDiastolic(value) {
  if (value > 120 || value < 50) return "critical";
  if (value >= 80 || value < 60) return "caution";
  return "normal";
}

/**
 * Classify a single pulse reading (AHA).
 * @param {number} value - bpm
 * @returns {"normal"|"caution"|"critical"}
 */
function classifyPulse(value) {
  if (value < 50 || value > 120) return "critical";
  if (value < 60 || value > 100) return "caution";
  return "normal";
}

/**
 * Classify a single SpO2 reading (WHO).
 * @param {number} value - percentage
 * @returns {"normal"|"caution"|"critical"}
 */
function classifySpo2(value) {
  if (value < 90) return "critical";
  if (value < 95) return "caution";
  return "normal";
}

/**
 * Classify a single blood glucose reading (ADA).
 * Uses random/non-fasting ranges by default (70-140 normal).
 * @param {number} value - mg/dL
 * @returns {"normal"|"caution"|"critical"}
 */
function classifyGlucose(value) {
  if (value < 54 || value > 300) return "critical";
  if (value < 70 || value > 200) return "caution";
  if (value > 140) return "caution";
  return "normal";
}

/**
 * Return a classifier function for a given vital type.
 * @param {string} vitalType
 * @returns {Function}
 */
function getClassifier(vitalType) {
  const classifiers = {
    temperature: classifyTemperature,
    systolic: classifySystolic,
    diastolic: classifyDiastolic,
    pulse: classifyPulse,
    spo2: classifySpo2,
    glucose: classifyGlucose,
  };
  return classifiers[vitalType] || (() => "normal");
}

/**
 * Format a Date (or date-like string) to "YYYY-MM-DD".
 * @param {string|Date} d
 * @returns {string}
 */
function toDateString(d) {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return String(d);
  return date.toISOString().slice(0, 10);
}

/**
 * Compute day offset from a reference date (for regression).
 * @param {string} dateStr
 * @param {string} refDateStr
 * @returns {number}
 */
function daysBetween(dateStr, refDateStr) {
  const ms = new Date(dateStr).getTime() - new Date(refDateStr).getTime();
  return ms / (1000 * 60 * 60 * 24);
}

/**
 * Simple descriptive statistics for an array of numbers.
 * @param {number[]} values
 * @returns {{ mean: number, min: number, max: number, stdDev: number }}
 */
function stats(values) {
  if (!values.length) return { mean: 0, min: 0, max: 0, stdDev: 0 };
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length;
  const stdDev = Math.sqrt(variance);
  return { mean: Math.round(mean * 100) / 100, min, max, stdDev: Math.round(stdDev * 100) / 100 };
}

/**
 * Ordinary least-squares linear regression.
 * @param {number[]} xs - independent variable (day offsets)
 * @param {number[]} ys - dependent variable (vital values)
 * @returns {{ slope: number, intercept: number, r2: number }}
 */
function linearRegression(xs, ys) {
  const n = xs.length;
  if (n < 2) return { slope: 0, intercept: ys[0] || 0, r2: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += xs[i];
    sumY += ys[i];
    sumXY += xs[i] * ys[i];
    sumX2 += xs[i] * xs[i];
    sumY2 += ys[i] * ys[i];
  }

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n, r2: 0 };

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  // R-squared
  const yMean = sumY / n;
  const ssTotal = ys.reduce((acc, y) => acc + (y - yMean) ** 2, 0);
  const ssResidual = ys.reduce((acc, y, i) => acc + (y - (slope * xs[i] + intercept)) ** 2, 0);
  const r2 = ssTotal === 0 ? 0 : 1 - ssResidual / ssTotal;

  return {
    slope: Math.round(slope * 1000) / 1000,
    intercept: Math.round(intercept * 100) / 100,
    r2: Math.round(r2 * 1000) / 1000,
  };
}

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

/**
 * Convert daily care notes into time-series data organized by vital sign.
 *
 * @param {Array<Object>} notes - Array of daily care note objects. Each may contain:
 *   date, shift, temp, bp, pulse, spo2, glucose, weight, and other fields.
 * @returns {Object} Parsed vitals history with keys:
 *   temperature, systolic, diastolic, pulse, spo2, glucose, weight.
 *   Each value is an array of { date: string, value: number, status: string }.
 */
function parseVitalsHistory(notes) {
  const result = {
    temperature: [],
    systolic: [],
    diastolic: [],
    pulse: [],
    spo2: [],
    glucose: [],
    weight: [],
  };

  if (!Array.isArray(notes)) return result;

  // Sort notes chronologically
  const sorted = [...notes].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  for (const note of sorted) {
    const date = toDateString(note.date);

    // Temperature
    if (note.temp != null && !isNaN(Number(note.temp))) {
      const value = Number(note.temp);
      result.temperature.push({ date, value, status: classifyTemperature(value) });
    }

    // Blood Pressure
    if (note.bp) {
      const parsed = parseBP(String(note.bp));
      if (parsed) {
        result.systolic.push({ date, value: parsed.systolic, status: classifySystolic(parsed.systolic) });
        result.diastolic.push({ date, value: parsed.diastolic, status: classifyDiastolic(parsed.diastolic) });
      }
    }

    // Pulse / Heart Rate
    if (note.pulse != null && !isNaN(Number(note.pulse))) {
      const value = Number(note.pulse);
      result.pulse.push({ date, value, status: classifyPulse(value) });
    }

    // SpO2
    if (note.spo2 != null && !isNaN(Number(note.spo2))) {
      const value = Number(note.spo2);
      result.spo2.push({ date, value, status: classifySpo2(value) });
    }

    // Blood Glucose
    if (note.glucose != null && !isNaN(Number(note.glucose))) {
      const value = Number(note.glucose);
      result.glucose.push({ date, value, status: classifyGlucose(value) });
    }

    // Weight (no clinical classification — tracked for change detection)
    if (note.weight != null && !isNaN(Number(note.weight))) {
      const value = Number(note.weight);
      result.weight.push({ date, value });
    }
  }

  return result;
}

/**
 * Determine whether a given vital is "improving" or "worsening" based on the
 * direction of its slope relative to the normal range midpoint.
 *
 * @param {string} vitalType
 * @param {number} slope
 * @param {number} currentValue
 * @returns {"improving"|"worsening"}
 */
function slopeDirection(vitalType, slope, currentValue) {
  const config = CHART_CONFIGS[vitalType];
  if (!config) return slope > 0 ? "worsening" : "improving";

  const [normalMin, normalMax] = config.normalRange;
  const mid = (normalMin + normalMax) / 2;

  // If currently above normal, a negative slope is improving
  if (currentValue > normalMax) {
    return slope < 0 ? "improving" : "worsening";
  }
  // If currently below normal, a positive slope is improving
  if (currentValue < normalMin) {
    return slope > 0 ? "improving" : "worsening";
  }
  // Within normal range — any large slope is slightly concerning
  // but we consider moving toward the midpoint as improving
  if (currentValue > mid) {
    return slope <= 0 ? "improving" : "worsening";
  }
  return slope >= 0 ? "improving" : "worsening";
}

/**
 * Detect trend in a vital sign time series using linear regression.
 *
 * @param {Array<{date: string, value: number}>} series - At least 3 data points recommended.
 * @param {string} [vitalType] - Optional vital type key for directional context.
 * @returns {Object} Trend analysis result:
 *   - trend: "improving" | "worsening" | "stable" | "fluctuating"
 *   - slope: number (change per day)
 *   - prediction: string (projected trajectory)
 *   - alert: string | null (clinical alert if concerning)
 *   - confidence: "high" | "medium" | "low"
 */
function analyzeVitalsTrend(series, vitalType) {
  if (!Array.isArray(series) || series.length === 0) {
    return {
      trend: "stable",
      slope: 0,
      prediction: "Insufficient data for trend analysis.",
      alert: null,
      confidence: "low",
    };
  }

  if (series.length < 3) {
    return {
      trend: "stable",
      slope: 0,
      prediction: "Need at least 3 data points for reliable trend analysis.",
      alert: null,
      confidence: "low",
    };
  }

  const refDate = series[0].date;
  const xs = series.map((p) => daysBetween(p.date, refDate));
  const ys = series.map((p) => p.value);

  const reg = linearRegression(xs, ys);
  const { mean, stdDev } = stats(ys);
  const currentValue = ys[ys.length - 1];

  // Coefficient of variation to detect fluctuation
  const cv = mean !== 0 ? stdDev / Math.abs(mean) : 0;

  // Determine confidence from R-squared
  let confidence = "low";
  if (reg.r2 >= 0.7) confidence = "high";
  else if (reg.r2 >= 0.4) confidence = "medium";

  // Determine trend
  let trend = "stable";
  const slopeThreshold = Math.abs(mean) * 0.05; // 5% of mean per day is the stability threshold

  if (cv > 0.15 && reg.r2 < 0.4) {
    trend = "fluctuating";
  } else if (Math.abs(reg.slope) <= slopeThreshold / Math.max(xs[xs.length - 1], 1)) {
    trend = "stable";
  } else if (vitalType) {
    trend = slopeDirection(vitalType, reg.slope, currentValue);
  } else {
    trend = reg.slope > 0 ? "worsening" : "improving";
  }

  // Build prediction string
  let prediction = "";
  if (trend === "stable") {
    prediction = `Vital sign is stable around ${mean}.`;
  } else if (trend === "fluctuating") {
    prediction = `Readings are fluctuating (std dev ${stdDev}). Closer monitoring recommended.`;
  } else {
    const daysToProject = 7;
    const projectedValue = Math.round((currentValue + reg.slope * daysToProject) * 10) / 10;
    const direction = reg.slope > 0 ? "increase" : "decrease";
    const config = vitalType ? CHART_CONFIGS[vitalType] : null;
    const unitStr = config ? ` ${config.unit}` : "";
    prediction = `At current rate (${reg.slope > 0 ? "+" : ""}${reg.slope}/day), value will ${direction} to ~${projectedValue}${unitStr} in ${daysToProject} days.`;
  }

  // Generate alert if trend is concerning
  let alert = null;
  if (trend === "worsening") {
    const config = vitalType ? CHART_CONFIGS[vitalType] : null;
    const label = config ? config.label : "Vital sign";
    alert = `${label} is trending in a concerning direction (slope: ${reg.slope > 0 ? "+" : ""}${reg.slope}/day). Review and consider intervention.`;
  } else if (trend === "fluctuating") {
    alert = "Highly variable readings detected. Consider more frequent monitoring.";
  }

  const result = { trend, slope: reg.slope, prediction, alert, confidence };

  // Sudden change detection (spike/drop alert)
  if (ys.length >= 3) {
    const last = ys[ys.length - 1];
    const secondLast = ys[ys.length - 2];

    if (stdDev > 0) {
      const zScore = Math.abs(last - mean) / stdDev;
      const change = last - secondLast;
      const changePercent = Math.abs(change / secondLast) * 100;

      if (zScore > 2 || changePercent > 20) {
        const direction = change > 0 ? "spike" : "drop";
        result.anomaly = {
          detected: true,
          type: direction,
          zScore: Math.round(zScore * 10) / 10,
          changePercent: Math.round(changePercent),
          message: `Sudden ${direction} detected: ${secondLast} → ${last} (${changePercent.toFixed(0)}% change, z-score ${zScore.toFixed(1)}). Verify reading and assess patient.`,
        };
      }
    }
  }

  return { ...result, anomaly: result.anomaly || null };
}

/**
 * Produce a complete vitals analysis report from care notes and patient info.
 *
 * @param {Array<Object>} notes - Daily care notes with vital sign fields.
 * @param {Object} patient - Patient info: { name, age, gender, condition }.
 * @returns {Object} Full report object (see module-level JSDoc for shape).
 */
function generateVitalsReport(notes, patient) {
  const history = parseVitalsHistory(notes);
  const criticalAlerts = [];
  const recommendations = [];

  /**
   * Build analysis block for one vital type.
   */
  function analyzeVital(key, label) {
    const series = history[key];
    if (!series || series.length === 0) {
      return null;
    }

    const values = series.map((p) => p.value);
    const { mean, min, max, stdDev } = stats(values);
    const current = values[values.length - 1];
    const trendResult = analyzeVitalsTrend(series, key);

    // Collect any critical-status readings
    const alerts = [];
    for (const point of series) {
      if (point.status === "critical") {
        alerts.push(`Critical ${label} reading of ${point.value} on ${point.date}.`);
      }
    }

    // If trend is worsening add to critical alerts
    if (trendResult.alert) {
      alerts.push(trendResult.alert);
    }

    // Push critical alerts to the top-level list
    for (const a of alerts) {
      if (a.startsWith("Critical")) {
        criticalAlerts.push(a);
      }
    }

    return {
      current,
      avg: mean,
      min,
      max,
      trend: trendResult,
      alerts,
      chartData: series,
    };
  }

  // Analyze each vital sign
  const temperature = analyzeVital("temperature", "Temperature");
  const systolic = analyzeVital("systolic", "Systolic BP");
  const diastolic = analyzeVital("diastolic", "Diastolic BP");
  const pulse = analyzeVital("pulse", "Heart Rate");
  const spo2 = analyzeVital("spo2", "SpO2");
  const glucose = analyzeVital("glucose", "Blood Glucose");
  const weight = analyzeVital("weight", "Weight");

  // --- Blood pressure combined analysis ---
  let bpCategory = "Unknown";
  if (systolic && diastolic) {
    const sys = systolic.current;
    const dia = diastolic.current;
    if (sys > 180 || dia > 120) {
      bpCategory = "Hypertensive Crisis";
      criticalAlerts.push(`Hypertensive crisis: ${sys}/${dia} mmHg. Immediate medical attention required.`);
    } else if (sys >= 140 || dia >= 90) {
      bpCategory = "Hypertension Stage 2";
      recommendations.push("Blood pressure is at Hypertension Stage 2. Review antihypertensive regimen.");
    } else if (sys >= 130 || dia >= 80) {
      bpCategory = "Hypertension Stage 1";
      recommendations.push("Blood pressure is at Hypertension Stage 1. Consider lifestyle modifications and medication review.");
    } else if (sys >= 120 && dia < 80) {
      bpCategory = "Elevated";
      recommendations.push("Blood pressure is elevated. Encourage dietary modifications and exercise.");
    } else if (sys < 90 || dia < 60) {
      bpCategory = "Hypotension";
      criticalAlerts.push(`Hypotension detected: ${sys}/${dia} mmHg. Assess for orthostatic changes and dehydration.`);
    } else {
      bpCategory = "Normal";
    }
  }

  const bloodPressure =
    systolic && diastolic
      ? {
          current: `${systolic.current}/${diastolic.current}`,
          avg: `${systolic.avg}/${diastolic.avg}`,
          min: `${systolic.min}/${diastolic.min}`,
          max: `${systolic.max}/${diastolic.max}`,
          trend: systolic.trend, // primary trend driven by systolic
          alerts: [...(systolic.alerts || []), ...(diastolic.alerts || [])],
          chartData: systolic.chartData.map((s, i) => ({
            date: s.date,
            systolic: s.value,
            diastolic: diastolic.chartData[i] ? diastolic.chartData[i].value : null,
            status: s.status === "critical" || (diastolic.chartData[i] && diastolic.chartData[i].status === "critical")
              ? "critical"
              : s.status === "caution" || (diastolic.chartData[i] && diastolic.chartData[i].status === "caution")
                ? "caution"
                : "normal",
          })),
          category: bpCategory,
        }
      : null;

  // --- Weight change detection ---
  if (weight && weight.chartData.length >= 2) {
    const weightSeries = weight.chartData;
    const latest = weightSeries[weightSeries.length - 1];
    const baseline = weightSeries[0];

    // Check for >2 kg change in most recent 7 days
    const recentStart = new Date(latest.date);
    recentStart.setDate(recentStart.getDate() - 7);
    const weekAgoEntries = weightSeries.filter((w) => new Date(w.date) >= recentStart);
    if (weekAgoEntries.length >= 2) {
      const weekChange = Math.abs(latest.value - weekAgoEntries[0].value);
      if (weekChange > 2) {
        criticalAlerts.push(
          `Weight changed by ${weekChange.toFixed(1)} kg in the past week. Possible fluid retention or loss — assess immediately.`
        );
      }
    }

    // Check for >5% loss over recording period
    const totalDays = daysBetween(latest.date, baseline.date);
    if (totalDays >= 7) {
      const pctChange = ((latest.value - baseline.value) / baseline.value) * 100;
      if (pctChange < -5) {
        recommendations.push(
          `Weight has decreased by ${Math.abs(pctChange).toFixed(1)}% since ${baseline.date}. Evaluate nutritional status.`
        );
      }
    }
  }

  // --- SpO2 specific alerts ---
  if (spo2 && spo2.current < 90) {
    criticalAlerts.push(`SpO2 at ${spo2.current}%. Immediate intervention required per WHO guidelines.`);
  }

  // --- Glucose specific alerts ---
  if (glucose) {
    if (glucose.current < 54) {
      criticalAlerts.push(`Severe hypoglycemia: glucose at ${glucose.current} mg/dL. Administer fast-acting glucose immediately.`);
    } else if (glucose.current < 70) {
      recommendations.push("Hypoglycemia detected. Provide carbohydrate intake and recheck in 15 minutes.");
    }
    if (glucose.current > 300) {
      criticalAlerts.push(`Glucose at ${glucose.current} mg/dL. Risk of diabetic ketoacidosis. Check ketones and contact physician.`);
    }
  }

  // --- Temperature specific ---
  if (temperature) {
    if (temperature.current > 103.0) {
      criticalAlerts.push(`High fever: ${temperature.current}\u00b0F. Initiate cooling measures and contact physician.`);
    } else if (temperature.current < 96.0) {
      criticalAlerts.push(`Hypothermia: ${temperature.current}\u00b0F. Initiate warming protocols.`);
    }
  }

  // --- Heart rate specific ---
  if (pulse) {
    if (pulse.current < 50) {
      criticalAlerts.push(`Severe bradycardia: pulse at ${pulse.current} bpm. Assess for hemodynamic instability.`);
    }
    if (pulse.current > 120) {
      criticalAlerts.push(`Severe tachycardia: pulse at ${pulse.current} bpm. Evaluate for underlying cause.`);
    }
  }

  // --- Overall status ---
  let overallStatus = "stable";
  if (criticalAlerts.length > 0) {
    overallStatus = "critical";
  } else {
    const allAlerts = [
      ...(temperature?.alerts || []),
      ...(bloodPressure?.alerts || []),
      ...(pulse?.alerts || []),
      ...(spo2?.alerts || []),
      ...(glucose?.alerts || []),
    ];
    if (allAlerts.length > 0) {
      overallStatus = "needs attention";
    }
  }

  // --- General recommendations based on patient context ---
  if (patient && patient.age && patient.age >= 65) {
    if (bloodPressure && bpCategory !== "Normal" && bpCategory !== "Elevated") {
      recommendations.push("For patients aged 65+, JNC-8 suggests a BP target of <150/90. Discuss with physician.");
    }
  }

  // Age-specific adjustments
  if (patient && patient.age) {
    if (patient.age < 18 && bloodPressure && vitals.systolic > 120) {
      recommendations.push("Pediatric patient: BP >120 systolic may indicate hypertension. Use age/height percentile charts for accurate classification.");
    }
    if (patient.age >= 80 && bloodPressure && vitals.systolic < 120) {
      recommendations.push("Geriatric patient (80+): Systolic <120 may be overly aggressive. JNC-8 suggests <150/90 for ages ≥60. Review antihypertensive doses.");
    }
    if (patient.age >= 65 && glucose && vitals.glucose < 80) {
      recommendations.push("Elderly patient: Fasting glucose <80 increases fall risk and cognitive events. ADA recommends less stringent glycemic targets (HbA1c <8%) in elderly.");
    }
  }

  if (patient && patient.condition) {
    const conditions = patient.condition.toLowerCase();
    if (conditions.includes("diabetes") && glucose) {
      recommendations.push("ADA recommends HbA1c testing every 3 months for diabetic patients. Ensure lab work is current.");
    }
    if (conditions.includes("copd") && spo2) {
      recommendations.push("For COPD patients, an SpO2 target of 88-92% may be appropriate. Verify with physician's orders.");
    }
    if (conditions.includes("heart failure") && weight) {
      recommendations.push("Monitor daily weight closely. Report gain >1 kg/day or >2 kg/week to physician.");
    }
  }

  // --- Build summary ---
  const patientName = patient?.name || "Patient";
  const vitalCount = [temperature, bloodPressure, pulse, spo2, glucose, weight].filter(Boolean).length;
  const summary = `Vitals report for ${patientName}: ${vitalCount} vital sign categories analyzed across ${notes.length} records. Overall status: ${overallStatus}. ${criticalAlerts.length} critical alert(s), ${recommendations.length} recommendation(s).`;

  return {
    summary,
    vitals: {
      temperature,
      bloodPressure,
      pulse,
      spo2,
      glucose,
      weight,
    },
    criticalAlerts,
    recommendations,
    overallStatus,
  };
}

/**
 * Get chart rendering configuration for a given vital type.
 *
 * @param {string} vitalType - One of: temperature, systolic, diastolic, pulse, spo2, glucose, weight
 * @returns {Object} Chart configuration:
 *   { label, unit, color, normalRange: [min, max], cautionRange: [min, max], criticalRange: [min, max] }
 */
function getChartConfig(vitalType) {
  const config = CHART_CONFIGS[vitalType];
  if (!config) {
    return {
      label: vitalType || "Unknown",
      unit: "",
      color: "#7f8c8d",
      normalRange: [0, 0],
      cautionRange: [0, 0],
      criticalRange: [0, 0],
    };
  }
  // Return a shallow copy to prevent mutation
  return { ...config };
}

// ---------------------------------------------------------------------------
// qSOFA (Quick Sequential Organ Failure Assessment) — Sepsis Screening
// Criteria: ≥2 of: Systolic BP ≤100, RR ≥22, Altered mentation (GCS <15)
// Reference: Singer M, et al. JAMA 2016;315(8):801-810
// ---------------------------------------------------------------------------

/**
 * Calculate qSOFA score from vitals.
 * @param {Object} vitals - { systolic, respiratoryRate, gcs }
 * @returns {Object} { score, criteria, risk, recommendation }
 */
function calculateQSOFA(vitals = {}) {
  const criteria = [];
  let score = 0;

  // Criterion 1: Systolic BP ≤ 100 mmHg
  if (vitals.systolic != null && vitals.systolic <= 100) {
    criteria.push({ name: "Hypotension", detail: `Systolic BP ${vitals.systolic} mmHg (≤100)`, met: true });
    score++;
  } else if (vitals.systolic != null) {
    criteria.push({ name: "Hypotension", detail: `Systolic BP ${vitals.systolic} mmHg (>100)`, met: false });
  }

  // Criterion 2: Respiratory Rate ≥ 22 breaths/min
  if (vitals.respiratoryRate != null && vitals.respiratoryRate >= 22) {
    criteria.push({ name: "Tachypnea", detail: `RR ${vitals.respiratoryRate}/min (≥22)`, met: true });
    score++;
  } else if (vitals.respiratoryRate != null) {
    criteria.push({ name: "Tachypnea", detail: `RR ${vitals.respiratoryRate}/min (<22)`, met: false });
  }

  // Criterion 3: Altered mentation (GCS < 15)
  if (vitals.gcs != null && vitals.gcs < 15) {
    criteria.push({ name: "Altered Mentation", detail: `GCS ${vitals.gcs} (<15)`, met: true });
    score++;
  } else if (vitals.gcs != null) {
    criteria.push({ name: "Altered Mentation", detail: `GCS ${vitals.gcs} (=15)`, met: false });
  }

  // Track which criteria couldn't be assessed
  const assessed = criteria.length;
  const missing = 3 - assessed;
  const missingParams = [];
  if (vitals.systolic == null) missingParams.push("Systolic BP");
  if (vitals.respiratoryRate == null) missingParams.push("Respiratory Rate");
  if (vitals.gcs == null) missingParams.push("GCS");

  // Risk assessment
  let risk = "low";
  let recommendation = "No sepsis concern based on qSOFA.";
  if (score >= 2) {
    risk = "high";
    recommendation = "qSOFA ≥ 2: High suspicion for sepsis. Obtain blood cultures, lactate level, and initiate sepsis bundle. Consider ICU transfer.";
  } else if (score === 1) {
    risk = "moderate";
    recommendation = "qSOFA = 1: Monitor closely. Re-assess vitals frequently. Consider infection workup if clinical picture is concerning.";
  }

  if (missing > 0) {
    recommendation += ` Note: ${missing} of 3 criteria not assessed (${missingParams.join(", ")} not recorded). True score may be higher.`;
  }

  return { score, maxScore: 3, criteria, risk, recommendation, assessed, missing, missingParams: missingParams.length > 0 ? missingParams : null };
}

// ---------------------------------------------------------------------------
// Cardiorenal Syndrome Detection (Type 1-5)
// Reference: Ronco C, et al. JACC 2008;52(19):1527-39
// ---------------------------------------------------------------------------

/**
 * Screen for cardiorenal syndrome indicators from vitals and conditions.
 * @param {Object} vitals - { systolic, diastolic, spo2, weight, creatinine, bnp }
 * @param {Object} patient - { conditions: string[], age }
 * @param {Array} history - previous vitals for trend detection
 * @returns {Object} { detected, type, indicators, recommendation }
 */
function screenCardiorenalSyndrome(vitals = {}, patient = {}, history = []) {
  const indicators = [];
  const conditions = (patient.conditions || []).map(c => c.toLowerCase());
  const hasHF = conditions.some(c => c.includes("heart failure") || c.includes("hf") || c.includes("chf"));
  const hasCKD = conditions.some(c => c.includes("kidney") || c.includes("ckd") || c.includes("renal"));

  // Weight gain trend (fluid retention)
  if (history.length >= 3) {
    const recentWeights = history.slice(-7).map(h => h.weight).filter(Boolean);
    if (recentWeights.length >= 3) {
      const weeklyGain = recentWeights[recentWeights.length - 1] - recentWeights[0];
      if (weeklyGain > 2) {
        indicators.push({ sign: "Rapid weight gain", detail: `+${weeklyGain.toFixed(1)} kg over ${recentWeights.length} readings — fluid retention`, severity: "high" });
      } else if (weeklyGain > 1) {
        indicators.push({ sign: "Weight trending up", detail: `+${weeklyGain.toFixed(1)} kg — monitor for fluid overload`, severity: "moderate" });
      }
    }
  }

  // SpO2 declining (pulmonary congestion)
  if (vitals.spo2 != null && vitals.spo2 < 93) {
    indicators.push({ sign: "Low SpO2", detail: `SpO₂ ${vitals.spo2}% — possible pulmonary congestion`, severity: vitals.spo2 < 88 ? "critical" : "high" });
  }

  // Elevated BP with renal disease
  if (hasCKD && vitals.systolic && vitals.systolic > 160) {
    indicators.push({ sign: "Uncontrolled HTN + CKD", detail: `Systolic ${vitals.systolic} mmHg with renal disease — Type 4 cardiorenal risk`, severity: "high" });
  }

  // Low BP with heart failure (cardiogenic shock risk)
  if (hasHF && vitals.systolic && vitals.systolic < 90) {
    indicators.push({ sign: "Hypotension + HF", detail: `Systolic ${vitals.systolic} mmHg with heart failure — Type 1 cardiorenal risk`, severity: "critical" });
  }

  // Combined HF + CKD = Type 5
  if (hasHF && hasCKD) {
    indicators.push({ sign: "Co-existing HF + CKD", detail: "Type 5 cardiorenal syndrome — systemic condition affecting both organs", severity: "high" });
  }

  // Elevated creatinine with heart failure
  if (hasHF && vitals.creatinine && vitals.creatinine > 1.5) {
    indicators.push({ sign: "Rising creatinine + HF", detail: `Creatinine ${vitals.creatinine} mg/dL — renal dysfunction secondary to cardiac failure (Type 1/2)`, severity: "high" });
  }

  // Determine type
  let type = null;
  let recommendation = "No cardiorenal syndrome indicators detected.";
  if (indicators.length > 0) {
    // Type classification requires clinical assessment — per Ronco 2008:
    // Type 1: Acute HF → AKI; Type 2: Chronic HF → CKD
    // Type 3: AKI → acute cardiac; Type 4: CKD → cardiomyopathy
    // Type 5: Systemic (sepsis, diabetes, amyloid) → both organs
    // HF+CKD ≠ automatic Type 5 — could be Type 1,2,3, or 4
    if (hasHF && hasCKD) type = "HF + CKD co-existing — type requires clinical assessment (could be Type 1-5 per Ronco classification)";
    else if (hasHF) type = "Possible Type 1/2 (cardiac → renal) — requires nephrology review";
    else if (hasCKD) type = "Possible Type 3/4 (renal → cardiac) — requires cardiology review";
    else type = "Possible cardiorenal involvement — evaluate cardiac and renal function";

    recommendation = `Possible cardiorenal syndrome (${type}) — requires nephrology/cardiology review. Recommend: BNP/NT-proBNP, serum creatinine, eGFR, echocardiogram. Nephrology + cardiology consult if not already involved. Fluid balance monitoring essential.`;
  }

  return {
    possible: indicators.length > 0,
    detected: indicators.length > 0,
    type,
    indicators,
    recommendation,
  };
}

// ---------------------------------------------------------------------------
// Over-Medication Detection (Elderly)
// Detects polypharmacy + vital sign patterns suggesting medication toxicity
// ---------------------------------------------------------------------------

/**
 * Screen for over-medication in elderly patients.
 * @param {Object} vitals - { systolic, pulse, glucose }
 * @param {Object} patient - { age, medications: [] }
 * @returns {Object} { detected, indicators, recommendation }
 */
function screenOvermedication(vitals = {}, patient = {}) {
  const indicators = [];
  const age = patient.age || 0;
  const medCount = patient.medications?.length || 0;

  if (age < 60) return { detected: false, indicators: [], recommendation: "" };

  // Polypharmacy
  if (medCount >= 10) {
    indicators.push({ sign: "Severe polypharmacy", detail: `${medCount} concurrent medications (≥10)`, severity: "high" });
  } else if (medCount >= 5) {
    indicators.push({ sign: "Polypharmacy", detail: `${medCount} concurrent medications (≥5)`, severity: "moderate" });
  }

  // Low BP + Bradycardia = possible antihypertensive/beta-blocker toxicity
  if (vitals.systolic && vitals.systolic < 100 && vitals.pulse && vitals.pulse < 55) {
    indicators.push({ sign: "Hypotension + Bradycardia", detail: `BP ${vitals.systolic} mmHg, Pulse ${vitals.pulse} bpm — possible beta-blocker or calcium channel blocker toxicity`, severity: "high" });
  }

  // Hypoglycemia in elderly = possible insulin/sulfonylurea over-dosing
  if (vitals.glucose && vitals.glucose < 70) {
    indicators.push({ sign: "Hypoglycemia in elderly", detail: `Glucose ${vitals.glucose} mg/dL — possible insulin or sulfonylurea over-dosing`, severity: "high" });
  }

  // Low BP + normal/low pulse in elderly
  if (vitals.systolic && vitals.systolic < 90 && age >= 75) {
    indicators.push({ sign: "Severe hypotension in elderly", detail: `Systolic ${vitals.systolic} mmHg, age ${age} — medication review urgent`, severity: "critical" });
  }

  // AGS Beers Criteria 2023 — Potentially Inappropriate Medications (PIMs) in elderly
  const BEERS_CLASSES = {
    anticholinergics: { drugs: ["diphenhydramine", "hydroxyzine", "chlorpheniramine", "promethazine", "cyproheptadine", "brompheniramine", "doxylamine"], risk: "Increased confusion, urinary retention, constipation, falls in elderly" },
    benzodiazepines: { drugs: ["diazepam", "lorazepam", "alprazolam", "clonazepam", "temazepam", "nitrazepam", "chlordiazepoxide", "clobazam"], risk: "Cognitive impairment, delirium, falls, fractures, motor vehicle accidents in elderly" },
    longActingNSAIDs: { drugs: ["piroxicam", "indomethacin", "ketorolac", "naproxen", "meloxicam"], risk: "GI bleeding, renal impairment, fluid retention, hypertension exacerbation in elderly" },
    tricyclicAntidepressants: { drugs: ["amitriptyline", "imipramine", "doxepin", "nortriptyline", "clomipramine"], risk: "Anticholinergic effects, orthostatic hypotension, sedation, cardiac conduction abnormalities" },
    firstGenAntipsychotics: { drugs: ["haloperidol", "chlorpromazine", "thioridazine", "fluphenazine", "trifluoperazine"], risk: "Increased mortality in dementia patients, extrapyramidal symptoms, tardive dyskinesia" },
    muscleRelaxants: { drugs: ["methocarbamol", "cyclobenzaprine", "orphenadrine", "metaxalone", "chlorzoxazone"], risk: "Anticholinergic effects, sedation, fracture risk — poorly tolerated in elderly" },
    barbiturates: { drugs: ["phenobarbital", "butalbital"], risk: "High addiction potential, falls, cognitive impairment" },
    meperidine: { drugs: ["meperidine", "pethidine"], risk: "Neurotoxic metabolite normeperidine — seizures, confusion in elderly/renal impairment" },
    slidingScaleInsulin: { drugs: ["insulin regular", "actrapid", "huminsulin-r", "insuman rapid"], risk: "Sliding scale insulin (regular insulin alone): higher risk of hypoglycemia without improved glycemic control in elderly — ADA/AGS recommend basal-bolus or basal-plus regimen instead" },
    metoclopramide: { drugs: ["metoclopramide"], risk: "Extrapyramidal effects, tardive dyskinesia — avoid unless gastroparesis with no alternatives" },
  };

  if (age >= 65) {
    const medNames = (patient.medications || []).map(m => (m.name || m || "").toLowerCase());
    for (const [className, { drugs, risk }] of Object.entries(BEERS_CLASSES)) {
      const found = medNames.filter(m => drugs.some(d => m.includes(d)));
      if (found.length > 0) {
        indicators.push({
          sign: `Beers Criteria: ${className}`,
          detail: `${found.join(", ")} — ${risk} (AGS Beers Criteria 2023)`,
          severity: className === "meperidine" || className === "barbiturates" ? "critical" : "high",
          beersClass: className,
        });
      }
    }
  }

  return {
    detected: indicators.length > 0,
    indicators,
    recommendation: indicators.length > 0
      ? `Over-medication risk detected${indicators.some(i => i.beersClass) ? " including AGS Beers Criteria potentially inappropriate medications" : ""}. Recommend: comprehensive medication review by pharmacist/physician per AGS Beers Criteria 2023. Check for drug-drug interactions, dose adjustments for renal function, and deprescribing opportunities.`
      : "",
  };
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export {
  parseVitalsHistory,
  analyzeVitalsTrend,
  generateVitalsReport,
  getChartConfig,
  parseBP,
  classifyTemperature,
  classifySystolic,
  classifyDiastolic,
  classifyPulse,
  classifySpo2,
  classifyGlucose,
  linearRegression,
  calculateQSOFA,
  screenCardiorenalSyndrome,
  screenOvermedication,
  RANGES,
  CHART_CONFIGS,
};
