// ═══════════════════════════════════════════════════════
//  INVOICE GENERATOR
//  Generates monthly invoices for care home residents
//  Includes: Room charges, medication, consultation fees,
//  lab tests, and miscellaneous services
// ═══════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────
//  CONSTANTS & CONFIG
// ─────────────────────────────────────────────────────

const GST_RATE_SERVICES = 0.18; // 18% GST on room, consultation, services
const GST_RATE_MEDICINES = 0.05; // 5% GST on medicines
const PAYMENT_TERMS_DAYS = 15; // Invoice due in 15 days
const INVOICE_SEQUENCE_KEY = "care_home_invoice_seq";

/**
 * Hospital / Care Home details shown on invoices
 */
const FACILITY_INFO = {
  name: "Shree Care Home & Rehabilitation Centre",
  address: "Plot 12, Sector 7, Dwarka, New Delhi - 110077",
  phone: "+91 11 4567 8900",
  email: "billing@shreecarehome.in",
  gstin: "07AABCS1234F1ZP",
  pan: "AABCS1234F",
  regNo: "DL/MED/2024/00847",
  bankDetails: {
    bankName: "State Bank of India",
    branch: "Dwarka Sector 7, New Delhi",
    accountName: "Shree Care Home & Rehabilitation Centre",
    accountNo: "30927845610",
    ifsc: "SBIN0070421",
    upiId: "shreecarehome@sbi",
  },
};

/**
 * Default consultation fee schedule
 */
const CONSULTATION_FEES = {
  "General Physician": 500,
  "Specialist Visit": 1000,
  "Physiotherapy Session": 600,
  "Psychiatrist Consultation": 1200,
  "Dietician Consultation": 400,
  "Wound Dressing": 300,
  "Emergency Consultation": 1500,
  "Tele-Consultation": 350,
  "Dental Checkup": 800,
  "Eye Checkup": 700,
};

/**
 * Standard service charges
 */
const SERVICE_CHARGES = {
  laundry: { description: "Laundry Service (Monthly)", amount: 2000 },
  meals: { description: "Meals & Nutrition (Included)", amount: 0 },
  nursing24x7: { description: "24x7 Nursing Care", amount: 8000 },
  oxygensupply: { description: "Oxygen Supply (Per Day)", amount: 500 },
  dialysistransport: { description: "Dialysis Transport (Per Trip)", amount: 800 },
  ambulance: { description: "Ambulance Service", amount: 2500 },
  wheelchair: { description: "Wheelchair Rental (Monthly)", amount: 1500 },
  airMattress: { description: "Air Mattress Rental (Monthly)", amount: 3000 },
  diapers: { description: "Adult Diapers (Per Pack of 10)", amount: 450 },
  suctionMachine: { description: "Suction Machine Rental (Monthly)", amount: 4000 },
};

/**
 * Month name to number mapping
 */
const MONTH_MAP = {
  January: 0, February: 1, March: 2, April: 3,
  May: 4, June: 5, July: 6, August: 7,
  September: 8, October: 9, November: 10, December: 11,
};

// ─────────────────────────────────────────────────────
//  HELPER FUNCTIONS
// ─────────────────────────────────────────────────────

/**
 * Get the number of days in a given month/year
 * @param {number} month - 0-indexed month
 * @param {number} year
 * @returns {number}
 */
function getDaysInMonth(month, year) {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Parse a date string into a Date object
 * Handles ISO strings, "DD/MM/YYYY", "YYYY-MM-DD", and Date objects
 * @param {string|Date} dateStr
 * @returns {Date}
 */
function parseDate(dateStr) {
  if (dateStr instanceof Date) return dateStr;
  if (!dateStr) return null;

  // Handle DD/MM/YYYY
  const ddmmyyyy = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
  const match = String(dateStr).match(ddmmyyyy);
  if (match) {
    return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
  }

  return new Date(dateStr);
}

/**
 * Format a Date object to DD/MM/YYYY string
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format currency amount to Indian Rupees string
 * @param {number} amount
 * @returns {string}
 */
function formatCurrency(amount) {
  if (typeof amount !== "number" || isNaN(amount)) return "0.00";
  return amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Generate a sequential invoice number
 * Format: INV-YYYY-MM-XXXX
 * @param {number} year
 * @param {string} month - Month name
 * @param {string|number} [sequence] - Optional sequence number override
 * @returns {string}
 */
function generateInvoiceNumber(year, month, sequence) {
  const monthNum = String((MONTH_MAP[month] ?? 0) + 1).padStart(2, "0");
  let seq;

  if (sequence !== undefined && sequence !== null) {
    seq = String(sequence).padStart(4, "0");
  } else {
    // Auto-generate from timestamp for uniqueness
    const now = new Date();
    const dayPart = String(now.getDate()).padStart(2, "0");
    const hourPart = String(now.getHours()).padStart(2, "0");
    seq = `${dayPart}${hourPart}`;
  }

  return `INV-${year}-${monthNum}-${seq}`;
}

/**
 * Round a number to 2 decimal places
 * @param {number} value
 * @returns {number}
 */
function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Convert rupees to paisa for integer arithmetic */
function toPaisa(rupees) {
  return Math.round(Number(rupees || 0) * 100);
}

/** Convert paisa back to rupees */
function toRupees(paisa) {
  return paisa / 100;
}

/** Safe multiplication: amount * rate (e.g., for GST) */
function safeMultiply(amount, rate) {
  return toRupees(Math.round(toPaisa(amount) * rate));
}

// ─────────────────────────────────────────────────────
//  ROOM CHARGE CALCULATION
// ─────────────────────────────────────────────────────

/**
 * Calculate room charges for a specific month, with pro-rating
 * for mid-month admission or discharge.
 *
 * @param {Object} patient - Patient record with admitDate, room, dischargeDate
 * @param {Array<Object>} rooms - Room data [{id, roomNumber, type, rate, ...}]
 * @param {string} month - Month name (e.g. "March")
 * @param {number} year - Year (e.g. 2026)
 * @returns {Object} - {description, days, rate, amount, breakdown}
 */
function calculateRoomCharges(patient, rooms, month, year) {
  const monthIndex = MONTH_MAP[month];
  if (monthIndex === undefined) {
    return { description: "Room Charges", days: 0, rate: 0, amount: 0, breakdown: [] };
  }

  const totalDaysInMonth = getDaysInMonth(monthIndex, year);
  const monthStart = new Date(year, monthIndex, 1);
  const monthEnd = new Date(year, monthIndex, totalDaysInMonth);

  // Parse patient dates
  const admitDate = parseDate(patient.admitDate);
  const dischargeDate = patient.dischargeDate ? parseDate(patient.dischargeDate) : null;

  // Determine chargeable period within this month
  let startDate = monthStart;
  let endDate = monthEnd;

  if (admitDate && admitDate > monthStart) {
    startDate = admitDate;
  }

  if (dischargeDate && dischargeDate < monthEnd) {
    endDate = dischargeDate;
  }

  // If patient was not admitted during this month at all
  if (startDate > monthEnd || (dischargeDate && dischargeDate < monthStart)) {
    return { description: "Room Charges", days: 0, rate: 0, amount: 0, breakdown: [] };
  }

  // Calculate days stayed (inclusive of start date)
  const daysStayed = Math.max(
    0,
    Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1
  );

  // Find the patient's room and its rate
  const roomId = patient.room || patient.roomId || patient.roomNumber;
  const roomData = rooms.find(
    (r) =>
      r.id === roomId ||
      r.roomNumber === roomId ||
      r.number === roomId ||
      String(r.id) === String(roomId) ||
      String(r.roomNumber) === String(roomId)
  );

  const dailyRate = roomData?.rate || roomData?.dailyRate || roomData?.price || 0;
  const roomType = roomData?.type || roomData?.category || "Standard";
  const roomNumber = roomData?.roomNumber || roomData?.number || roomId || "N/A";

  const amount = round2(daysStayed * dailyRate);

  const breakdown = [];

  // Check for room transfers (patient may have roomHistory)
  if (patient.roomHistory && Array.isArray(patient.roomHistory) && patient.roomHistory.length > 1) {
    let transferTotal = 0;
    patient.roomHistory.forEach((stay, idx) => {
      const stayStart = parseDate(stay.from);
      const stayEnd = stay.to ? parseDate(stay.to) : monthEnd;

      // Clip to current month
      const effectiveStart = stayStart > monthStart ? stayStart : monthStart;
      const effectiveEnd = stayEnd < monthEnd ? stayEnd : monthEnd;

      if (effectiveStart > monthEnd || effectiveEnd < monthStart) return;

      const stayDays = Math.max(
        0,
        Math.ceil((effectiveEnd - effectiveStart) / (1000 * 60 * 60 * 24)) + 1
      );

      const stayRoom = rooms.find(
        (r) =>
          r.id === stay.roomId ||
          r.roomNumber === stay.roomId ||
          String(r.id) === String(stay.roomId)
      );
      const stayRate = stayRoom?.rate || stayRoom?.dailyRate || dailyRate;
      const stayAmount = round2(stayDays * stayRate);
      transferTotal += stayAmount;

      breakdown.push({
        roomNumber: stayRoom?.roomNumber || stay.roomId,
        roomType: stayRoom?.type || "Standard",
        from: formatDate(effectiveStart),
        to: formatDate(effectiveEnd),
        days: stayDays,
        rate: stayRate,
        amount: stayAmount,
      });
    });

    if (breakdown.length > 0) {
      return {
        description: `Room Charges — ${roomType} (Room ${roomNumber})`,
        days: daysStayed,
        rate: dailyRate,
        amount: transferTotal,
        breakdown,
        proRated: daysStayed < totalDaysInMonth,
      };
    }
  }

  return {
    description: `Room Charges — ${roomType} (Room ${roomNumber})`,
    days: daysStayed,
    rate: dailyRate,
    amount,
    breakdown: [
      {
        roomNumber,
        roomType,
        from: formatDate(startDate),
        to: formatDate(endDate),
        days: daysStayed,
        rate: dailyRate,
        amount,
      },
    ],
    proRated: daysStayed < totalDaysInMonth,
  };
}

// ─────────────────────────────────────────────────────
//  MEDICATION CHARGE CALCULATION
// ─────────────────────────────────────────────────────

/**
 * Calculate total medication costs from prescriptions and daily care notes.
 * Matches prescribed drug names against medicine inventory to get prices.
 *
 * @param {Array<Object>} prescriptions - [{medications: [{name, dosage, frequency, ...}], date, ...}]
 * @param {Array<Object>} medicines - [{name, price, genericName, ...}] (inventory)
 * @param {Array<Object>} notes - [{date, medications: [{name, dosage, administered}], ...}] (care notes)
 * @param {string} month - Month name
 * @param {number} year
 * @returns {Object} - {items: [{name, qty, unitPrice, amount}], total}
 */
function calculateMedicationCharges(prescriptions, medicines, notes, month, year) {
  const monthIndex = MONTH_MAP[month];
  const monthStart = new Date(year, monthIndex, 1);
  const monthEnd = new Date(year, monthIndex, getDaysInMonth(monthIndex, year));

  // Build a medicine price lookup (case-insensitive)
  const priceLookup = {};
  if (medicines && Array.isArray(medicines)) {
    medicines.forEach((med) => {
      const name = (med.name || "").toLowerCase().trim();
      const generic = (med.genericName || "").toLowerCase().trim();
      const price = med.price || med.unitPrice || med.cost || 0;

      if (name) priceLookup[name] = price;
      if (generic) priceLookup[generic] = price;
    });
  }

  /**
   * Find medicine price by name (fuzzy matching)
   * @param {string} medName
   * @returns {number}
   */
  function findMedicinePrice(medName) {
    if (!medName) return 0;
    const searchName = medName.toLowerCase().trim();

    // Exact match
    if (priceLookup[searchName] !== undefined) return priceLookup[searchName];

    // Partial match — search key contains medicine name or vice versa
    for (const key of Object.keys(priceLookup)) {
      if (key.includes(searchName) || searchName.includes(key)) {
        return priceLookup[key];
      }
    }

    // Match first word (generic name often is first word)
    const firstWord = searchName.split(/[\s\-\(]/)[0];
    if (firstWord.length >= 3) {
      for (const key of Object.keys(priceLookup)) {
        if (key.startsWith(firstWord)) return priceLookup[key];
      }
    }

    return 0;
  }

  // Aggregate medication usage: {medName: {qty, unitPrice}}
  const medAggregation = {};

  /**
   * Add a medication entry to the aggregation map
   * @param {string} name
   * @param {number} qty
   * @param {number} [overridePrice]
   */
  function addMedication(name, qty, overridePrice) {
    if (!name) return;
    const key = name.trim();
    const unitPrice = overridePrice !== undefined ? overridePrice : findMedicinePrice(key);

    if (!medAggregation[key]) {
      medAggregation[key] = { qty: 0, unitPrice };
    }
    medAggregation[key].qty += qty;
    // Use the higher price if there's a discrepancy
    if (unitPrice > medAggregation[key].unitPrice) {
      medAggregation[key].unitPrice = unitPrice;
    }
  }

  // Process prescriptions — each prescription lists medications with frequency
  if (prescriptions && Array.isArray(prescriptions)) {
    prescriptions.forEach((rx) => {
      const rxDate = parseDate(rx.date);

      // Only count prescriptions within the billing month
      if (rxDate && (rxDate < monthStart || rxDate > monthEnd)) return;

      const meds = rx.medications || rx.medicines || rx.drugs || [];
      meds.forEach((med) => {
        const name = med.name || med.medicine || med.drug || "";
        const qty = med.quantity || med.qty || 1;
        const price = med.price || med.unitPrice || undefined;
        addMedication(name, qty, price);
      });
    });
  }

  // Process daily care notes — medications actually administered
  if (notes && Array.isArray(notes)) {
    notes.forEach((note) => {
      const noteDate = parseDate(note.date);
      if (noteDate && (noteDate < monthStart || noteDate > monthEnd)) return;

      const meds = note.medications || note.medicationsGiven || note.meds || [];
      if (Array.isArray(meds)) {
        meds.forEach((med) => {
          if (typeof med === "string") {
            addMedication(med, 1);
          } else {
            const name = med.name || med.medicine || "";
            const qty = med.quantity || med.qty || 1;
            const price = med.price || undefined;
            addMedication(name, qty, price);
          }
        });
      }
    });
  }

  // Build the items array
  const items = Object.entries(medAggregation)
    .map(([name, data]) => ({
      name,
      qty: data.qty,
      unitPrice: round2(data.unitPrice),
      amount: round2(data.qty * data.unitPrice),
    }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const total = round2(items.reduce((sum, item) => sum + item.amount, 0));

  return { items, total };
}

// ─────────────────────────────────────────────────────
//  CONSULTATION CHARGES
// ─────────────────────────────────────────────────────

/**
 * Extract consultation charges from billing records
 *
 * @param {Array<Object>} billing - Billing entries [{receiptNo, amount, type, date, status, doctor, ...}]
 * @param {string} month
 * @param {number} year
 * @returns {Object} - {items: [{date, doctor, type, amount}], total}
 */
function calculateConsultationCharges(billing, month, year) {
  const monthIndex = MONTH_MAP[month];
  const monthStart = new Date(year, monthIndex, 1);
  const monthEnd = new Date(year, monthIndex, getDaysInMonth(monthIndex, year));

  const consultationTypes = [
    "consultation", "doctor visit", "specialist", "physiotherapy",
    "psychiatrist", "dietician", "wound dressing", "tele-consultation",
    "emergency", "checkup", "dental", "eye",
  ];

  const items = [];

  if (billing && Array.isArray(billing)) {
    billing.forEach((entry) => {
      const entryDate = parseDate(entry.date);
      if (entryDate && (entryDate < monthStart || entryDate > monthEnd)) return;

      const entryType = (entry.type || entry.category || "").toLowerCase();
      const isConsultation = consultationTypes.some((ct) => entryType.includes(ct));

      if (isConsultation) {
        const doctor = entry.doctor || entry.provider || entry.consultant || "Visiting Doctor";
        const type = entry.type || entry.category || "Consultation";
        const amount = entry.amount || CONSULTATION_FEES[type] || CONSULTATION_FEES["General Physician"];

        items.push({
          date: formatDate(entryDate),
          doctor,
          type,
          amount: round2(amount),
          receiptNo: entry.receiptNo || null,
        });
      }
    });
  }

  const total = round2(items.reduce((sum, item) => sum + item.amount, 0));
  return { items, total };
}

// ─────────────────────────────────────────────────────
//  LAB TEST CHARGES
// ─────────────────────────────────────────────────────

/**
 * Extract lab test charges from billing records
 *
 * @param {Array<Object>} billing - Billing entries
 * @param {string} month
 * @param {number} year
 * @returns {Object} - {items: [{name, date, amount}], total}
 */
function calculateLabTestCharges(billing, month, year) {
  const monthIndex = MONTH_MAP[month];
  const monthStart = new Date(year, monthIndex, 1);
  const monthEnd = new Date(year, monthIndex, getDaysInMonth(monthIndex, year));

  const labKeywords = [
    "lab", "test", "blood", "urine", "x-ray", "xray", "scan", "mri",
    "ct scan", "ecg", "echo", "ultrasound", "pathology", "biopsy",
    "culture", "hba1c", "cbc", "lipid", "thyroid", "creatinine",
    "dialysis", "investigation",
  ];

  const items = [];

  if (billing && Array.isArray(billing)) {
    billing.forEach((entry) => {
      const entryDate = parseDate(entry.date);
      if (entryDate && (entryDate < monthStart || entryDate > monthEnd)) return;

      const entryType = (entry.type || entry.category || entry.description || "").toLowerCase();
      const isLab = labKeywords.some((kw) => entryType.includes(kw));

      if (isLab) {
        items.push({
          name: entry.type || entry.description || entry.category || "Lab Test",
          date: formatDate(entryDate),
          amount: round2(entry.amount || 0),
          receiptNo: entry.receiptNo || null,
        });
      }
    });
  }

  const total = round2(items.reduce((sum, item) => sum + item.amount, 0));
  return { items, total };
}

// ─────────────────────────────────────────────────────
//  SERVICE CHARGES
// ─────────────────────────────────────────────────────

/**
 * Calculate miscellaneous service charges from billing records
 *
 * @param {Array<Object>} billing - Billing entries
 * @param {string} month
 * @param {number} year
 * @returns {Object} - {items: [{description, amount}], total}
 */
function calculateServiceCharges(billing, month, year) {
  const monthIndex = MONTH_MAP[month];
  const monthStart = new Date(year, monthIndex, 1);
  const monthEnd = new Date(year, monthIndex, getDaysInMonth(monthIndex, year));

  const excludeTypes = [
    "consultation", "doctor", "specialist", "physiotherapy",
    "lab", "test", "blood", "scan", "x-ray", "pathology",
    "payment", "deposit", "advance", "refund",
  ];

  const items = [];

  if (billing && Array.isArray(billing)) {
    billing.forEach((entry) => {
      const entryDate = parseDate(entry.date);
      if (entryDate && (entryDate < monthStart || entryDate > monthEnd)) return;

      const entryType = (entry.type || entry.category || "").toLowerCase();
      const isExcluded = excludeTypes.some((et) => entryType.includes(et));
      const isPayment = (entry.status || "").toLowerCase() === "payment";

      if (!isExcluded && !isPayment && entry.amount > 0) {
        items.push({
          description: entry.type || entry.description || entry.category || "Service Charge",
          amount: round2(entry.amount),
          receiptNo: entry.receiptNo || null,
        });
      }
    });
  }

  const total = round2(items.reduce((sum, item) => sum + item.amount, 0));
  return { items, total };
}

// ─────────────────────────────────────────────────────
//  PAYMENT HISTORY
// ─────────────────────────────────────────────────────

/**
 * Extract payments made during the billing month
 *
 * @param {Array<Object>} billing - Billing entries
 * @param {string} month
 * @param {number} year
 * @returns {Object} - {payments: [{date, amount, method, receiptNo}], totalPaid}
 */
function extractPaymentHistory(billing, month, year) {
  const monthIndex = MONTH_MAP[month];
  const monthStart = new Date(year, monthIndex, 1);
  const monthEnd = new Date(year, monthIndex, getDaysInMonth(monthIndex, year));

  const paymentKeywords = ["payment", "deposit", "advance", "paid", "receipt"];
  const payments = [];

  if (billing && Array.isArray(billing)) {
    billing.forEach((entry) => {
      const entryDate = parseDate(entry.date);
      if (entryDate && (entryDate < monthStart || entryDate > monthEnd)) return;

      const entryType = (entry.type || entry.category || "").toLowerCase();
      const entryStatus = (entry.status || "").toLowerCase();
      const isPayment =
        paymentKeywords.some((kw) => entryType.includes(kw)) ||
        entryStatus === "payment" ||
        entryStatus === "paid";

      if (isPayment) {
        payments.push({
          date: formatDate(entryDate),
          amount: round2(Math.abs(entry.amount || 0)),
          method: entry.method || entry.paymentMethod || entry.mode || "Cash",
          receiptNo: entry.receiptNo || null,
        });
      }
    });
  }

  const totalPaid = round2(payments.reduce((sum, p) => sum + p.amount, 0));
  return { payments, totalPaid };
}

// ─────────────────────────────────────────────────────
//  TAX CALCULATION
// ─────────────────────────────────────────────────────

/**
 * Calculate GST on services and medicines separately
 *
 * @param {number} serviceAmount - Total of room + consultations + lab + services
 * @param {number} medicineAmount - Total of medications
 * @returns {Object} - {serviceGST, medicineGST, totalGST, breakdown}
 */
function calculateTax(serviceAmount, medicineAmount) {
  const serviceGST = safeMultiply(serviceAmount, GST_RATE_SERVICES);
  const medicineGST = safeMultiply(medicineAmount, GST_RATE_MEDICINES);
  const totalGST = round2(serviceGST + medicineGST);

  return {
    serviceGST,
    serviceGSTRate: GST_RATE_SERVICES * 100,
    medicineGST,
    medicineGSTRate: GST_RATE_MEDICINES * 100,
    totalGST,
    breakdown: [
      {
        category: "Services (Room, Consultation, Lab, Others)",
        taxableAmount: round2(serviceAmount),
        rate: `${GST_RATE_SERVICES * 100}%`,
        cgst: safeMultiply(serviceGST, 0.5),
        sgst: safeMultiply(serviceGST, 0.5),
        total: serviceGST,
      },
      {
        category: "Medicines & Pharmaceutical Supplies",
        taxableAmount: round2(medicineAmount),
        rate: `${GST_RATE_MEDICINES * 100}%`,
        cgst: safeMultiply(medicineGST, 0.5),
        sgst: safeMultiply(medicineGST, 0.5),
        total: medicineGST,
      },
    ],
  };
}

// ─────────────────────────────────────────────────────
//  MAIN INVOICE GENERATOR
// ─────────────────────────────────────────────────────

/**
 * Generate a complete monthly invoice for a care home resident.
 *
 * @param {Object} patient - Patient record
 *   @param {string|number} patient.id - Patient identifier
 *   @param {string} patient.name - Patient full name
 *   @param {string|number} patient.room - Room number or ID
 *   @param {string|Date} patient.admitDate - Date of admission
 *   @param {string} [patient.guardian] - Guardian/NOK name
 *   @param {string|Date} [patient.dischargeDate] - Discharge date if applicable
 *   @param {Array<Object>} [patient.roomHistory] - Room transfer history
 *
 * @param {string} month - Month name (e.g., "March")
 * @param {number} year - Year (e.g., 2026)
 *
 * @param {Object} data - Supporting data
 *   @param {Array<Object>} data.rooms - Room inventory [{id, roomNumber, type, rate, ...}]
 *   @param {Array<Object>} [data.billing] - Billing entries [{receiptNo, amount, type, date, status, ...}]
 *   @param {Array<Object>} [data.prescriptions] - Prescription records [{medications, date, ...}]
 *   @param {Array<Object>} [data.medicines] - Medicine inventory [{name, price, ...}]
 *   @param {Array<Object>} [data.notes] - Home care notes [{date, medications, ...}]
 *   @param {Object} [data.discount] - Discount info {amount, reason}
 *   @param {number} [data.sequenceNumber] - Invoice sequence number override
 *
 * @returns {Object} Complete invoice object
 */
function generateMonthlyInvoice(patient, month, year, data) {
  if (!patient || !month || !year || !data) {
    throw new Error("Missing required parameters: patient, month, year, and data are all required.");
  }

  const monthIndex = MONTH_MAP[month];
  if (monthIndex === undefined) {
    throw new Error(`Invalid month name: "${month}". Use full month name (e.g., "March").`);
  }

  const rooms = data.rooms || [];
  const billing = data.billing || [];
  const prescriptions = data.prescriptions || [];
  const medicines = data.medicines || [];
  const notes = data.notes || [];

  // ── Period Calculation ──
  const totalDaysInMonth = getDaysInMonth(monthIndex, year);
  const periodFrom = new Date(year, monthIndex, 1);
  const periodTo = new Date(year, monthIndex, totalDaysInMonth);

  const admitDate = parseDate(patient.admitDate);
  const effectiveStart = admitDate && admitDate > periodFrom ? admitDate : periodFrom;
  const dischargeDate = patient.dischargeDate ? parseDate(patient.dischargeDate) : null;
  const effectiveEnd = dischargeDate && dischargeDate < periodTo ? dischargeDate : periodTo;

  const daysStayed = Math.max(
    0,
    Math.ceil((effectiveEnd - effectiveStart) / (1000 * 60 * 60 * 24)) + 1
  );

  // ── Generate Invoice Number ──
  const invoiceNo = generateInvoiceNumber(year, month, data.sequenceNumber);

  // ── Calculate All Charges ──
  const roomCharges = calculateRoomCharges(patient, rooms, month, year);
  const consultationCharges = calculateConsultationCharges(billing, month, year);
  const medicationCharges = calculateMedicationCharges(prescriptions, medicines, notes, month, year);
  const labTestCharges = calculateLabTestCharges(billing, month, year);
  const serviceCharges = calculateServiceCharges(billing, month, year);

  // ── Calculate Subtotals ──
  const serviceSubtotal = round2(
    roomCharges.amount +
    consultationCharges.total +
    labTestCharges.total +
    serviceCharges.total
  );
  const medicineSubtotal = medicationCharges.total;
  const subtotal = round2(serviceSubtotal + medicineSubtotal);

  // ── Tax Calculation ──
  const tax = calculateTax(serviceSubtotal, medicineSubtotal);

  // ── Discount ──
  const discount = {
    amount: data.discount?.amount || 0,
    reason: data.discount?.reason || "",
  };

  // ── Total ──
  const total = round2(subtotal + tax.totalGST - discount.amount);

  // ── Payment History ──
  const paymentData = extractPaymentHistory(billing, month, year);
  const paid = paymentData.totalPaid;
  const balance = round2(total - paid);

  // ── Due Date ──
  const dueDate = new Date(year, monthIndex + 1, PAYMENT_TERMS_DAYS);

  // ── Build Invoice ──
  const invoice = {
    invoiceNo,
    facility: { ...FACILITY_INFO },
    patient: {
      id: patient.id,
      name: patient.name,
      room: patient.room || patient.roomNumber,
      guardian: patient.guardian || patient.nextOfKin || "",
      admitDate: formatDate(admitDate),
      dischargeDate: dischargeDate ? formatDate(dischargeDate) : null,
    },
    period: {
      month,
      year,
      from: formatDate(effectiveStart),
      to: formatDate(effectiveEnd),
      daysStayed,
      totalDaysInMonth,
    },
    charges: {
      room: roomCharges,
      consultations: consultationCharges.items,
      medications: medicationCharges.items,
      labTests: labTestCharges.items,
      services: serviceCharges.items,
    },
    subtotals: {
      room: roomCharges.amount,
      consultations: consultationCharges.total,
      medications: medicationCharges.total,
      labTests: labTestCharges.total,
      services: serviceCharges.total,
    },
    subtotal,
    tax: {
      gst: tax.totalGST,
      rate: `${GST_RATE_SERVICES * 100}% Services / ${GST_RATE_MEDICINES * 100}% Medicines`,
      breakdown: tax.breakdown,
    },
    discount,
    total,
    paid,
    balance,
    paymentHistory: paymentData.payments,
    dueDate: formatDate(dueDate),
    notes: balance <= 0
      ? "Payment received in full. Thank you."
      : `Please settle the outstanding balance of Rs. ${formatCurrency(balance)} by ${formatDate(dueDate)}.`,
    generatedAt: new Date().toISOString(),
  };

  return invoice;
}

// ─────────────────────────────────────────────────────
//  PRINT FORMATTER
// ─────────────────────────────────────────────────────

/**
 * Format an invoice object into a structured layout ready for a print component.
 * Returns all sections needed to render a printable invoice.
 *
 * @param {Object} invoice - Invoice object returned by generateMonthlyInvoice
 * @returns {Object} Print-ready structured data with all sections
 */
function formatInvoiceForPrint(invoice) {
  if (!invoice) {
    throw new Error("Invoice object is required for formatting.");
  }

  // ── Header Section ──
  const header = {
    facilityName: invoice.facility.name,
    address: invoice.facility.address,
    phone: invoice.facility.phone,
    email: invoice.facility.email,
    gstin: invoice.facility.gstin,
    regNo: invoice.facility.regNo,
    invoiceNo: invoice.invoiceNo,
    invoiceDate: formatDate(new Date()),
    dueDate: invoice.dueDate,
  };

  // ── Patient Section ──
  const patientDetails = {
    name: invoice.patient.name,
    patientId: invoice.patient.id,
    room: invoice.patient.room,
    guardian: invoice.patient.guardian,
    admitDate: invoice.patient.admitDate,
    billingPeriod: `${invoice.period.from} to ${invoice.period.to}`,
    daysStayed: invoice.period.daysStayed,
  };

  // ── Itemized Charges Table ──
  const lineItems = [];
  let serialNo = 1;

  // Room charges
  if (invoice.charges.room.amount > 0) {
    lineItems.push({
      sno: serialNo++,
      description: invoice.charges.room.description,
      details: `${invoice.charges.room.days} days @ Rs. ${formatCurrency(invoice.charges.room.rate)}/day`,
      hsn: "9963",
      gstRate: `${GST_RATE_SERVICES * 100}%`,
      amount: formatCurrency(invoice.charges.room.amount),
      rawAmount: invoice.charges.room.amount,
    });
  }

  // Consultations
  invoice.charges.consultations.forEach((c) => {
    lineItems.push({
      sno: serialNo++,
      description: `${c.type} — Dr. ${c.doctor}`,
      details: `Date: ${c.date}`,
      hsn: "9993",
      gstRate: `${GST_RATE_SERVICES * 100}%`,
      amount: formatCurrency(c.amount),
      rawAmount: c.amount,
    });
  });

  // Lab Tests
  invoice.charges.labTests.forEach((t) => {
    lineItems.push({
      sno: serialNo++,
      description: t.name,
      details: `Date: ${t.date}`,
      hsn: "9993",
      gstRate: `${GST_RATE_SERVICES * 100}%`,
      amount: formatCurrency(t.amount),
      rawAmount: t.amount,
    });
  });

  // Medications
  invoice.charges.medications.forEach((m) => {
    lineItems.push({
      sno: serialNo++,
      description: m.name,
      details: `Qty: ${m.qty} x Rs. ${formatCurrency(m.unitPrice)}`,
      hsn: "3004",
      gstRate: `${GST_RATE_MEDICINES * 100}%`,
      amount: formatCurrency(m.amount),
      rawAmount: m.amount,
    });
  });

  // Services
  invoice.charges.services.forEach((s) => {
    lineItems.push({
      sno: serialNo++,
      description: s.description,
      details: "",
      hsn: "9963",
      gstRate: `${GST_RATE_SERVICES * 100}%`,
      amount: formatCurrency(s.amount),
      rawAmount: s.amount,
    });
  });

  // ── Tax Section ──
  const taxSection = {
    subtotal: formatCurrency(invoice.subtotal),
    breakdown: invoice.tax.breakdown.map((b) => ({
      category: b.category,
      taxableAmount: formatCurrency(b.taxableAmount),
      rate: b.rate,
      cgst: formatCurrency(b.cgst),
      sgst: formatCurrency(b.sgst),
      totalTax: formatCurrency(b.total),
    })),
    totalGST: formatCurrency(invoice.tax.gst),
  };

  // ── Discount Section ──
  const discountSection =
    invoice.discount.amount > 0
      ? {
          amount: formatCurrency(invoice.discount.amount),
          reason: invoice.discount.reason,
        }
      : null;

  // ── Payment Summary ──
  const paymentSummary = {
    subtotal: formatCurrency(invoice.subtotal),
    gst: formatCurrency(invoice.tax.gst),
    discount: invoice.discount.amount > 0 ? formatCurrency(invoice.discount.amount) : null,
    total: formatCurrency(invoice.total),
    paid: formatCurrency(invoice.paid),
    balance: formatCurrency(invoice.balance),
    status: invoice.balance <= 0 ? "PAID" : invoice.balance < invoice.total ? "PARTIALLY PAID" : "UNPAID",
  };

  // ── Payment History ──
  const paymentHistory = invoice.paymentHistory.map((p) => ({
    date: p.date,
    amount: formatCurrency(p.amount),
    method: p.method,
    receiptNo: p.receiptNo,
  }));

  // ── Bank Details ──
  const bankDetails = { ...invoice.facility.bankDetails };

  // ── Amount in Words ──
  const amountInWords = convertAmountToWords(invoice.total);

  // ── Terms & Conditions ──
  const termsAndConditions = [
    "Payment is due within 15 days of invoice date.",
    "Late payments may attract interest at 1.5% per month.",
    "All disputes are subject to New Delhi jurisdiction.",
    "This is a computer-generated invoice and does not require a physical signature.",
    "Please quote the invoice number in all correspondence and payments.",
    "Medication charges are non-refundable once administered.",
    "Room charges are calculated on a per-day basis; partial days are charged as full days.",
    "GST is charged as per applicable Government of India rates.",
  ];

  return {
    header,
    patientDetails,
    lineItems,
    taxSection,
    discountSection,
    paymentSummary,
    paymentHistory,
    bankDetails,
    amountInWords,
    termsAndConditions,
    notes: invoice.notes,
    generatedAt: invoice.generatedAt,
  };
}

// ─────────────────────────────────────────────────────
//  AMOUNT IN WORDS (Indian numbering)
// ─────────────────────────────────────────────────────

/**
 * Convert a numeric amount to words (Indian system: Lakh, Crore)
 * @param {number} amount
 * @returns {string}
 */
function convertAmountToWords(amount) {
  if (typeof amount !== "number" || isNaN(amount)) return "Zero Rupees Only";

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
  ];

  if (amount === 0) return "Zero Rupees Only";

  const rupees = Math.floor(Math.abs(amount));
  const paise = Math.round((Math.abs(amount) - rupees) * 100);

  /**
   * Convert a number below 1000 to words
   * @param {number} n
   * @returns {string}
   */
  function convertHundreds(n) {
    let str = "";
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + " Hundred";
      n %= 100;
      if (n > 0) str += " and ";
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)];
      n %= 10;
      if (n > 0) str += " " + ones[n];
    } else if (n > 0) {
      str += ones[n];
    }
    return str;
  }

  let words = "";

  // Crores
  if (rupees >= 10000000) {
    words += convertHundreds(Math.floor(rupees / 10000000)) + " Crore ";
  }

  // Lakhs
  const afterCrore = rupees % 10000000;
  if (afterCrore >= 100000) {
    words += convertHundreds(Math.floor(afterCrore / 100000)) + " Lakh ";
  }

  // Thousands
  const afterLakh = afterCrore % 100000;
  if (afterLakh >= 1000) {
    words += convertHundreds(Math.floor(afterLakh / 1000)) + " Thousand ";
  }

  // Hundreds and below
  const afterThousand = afterLakh % 1000;
  if (afterThousand > 0) {
    words += convertHundreds(afterThousand);
  }

  words = words.trim();
  if (!words) words = "Zero";

  let result = `Rupees ${words}`;
  if (paise > 0) {
    result += ` and ${convertHundreds(paise)} Paise`;
  }
  result += " Only";

  return result;
}

// ─────────────────────────────────────────────────────
//  EXPORTS
// ─────────────────────────────────────────────────────

export {
  generateMonthlyInvoice,
  calculateRoomCharges,
  calculateMedicationCharges,
  calculateConsultationCharges,
  calculateLabTestCharges,
  calculateServiceCharges,
  calculateTax,
  extractPaymentHistory,
  formatInvoiceForPrint,
  convertAmountToWords,
  generateInvoiceNumber,
  formatCurrency,
  formatDate,
  parseDate,
  FACILITY_INFO,
  CONSULTATION_FEES,
  SERVICE_CHARGES,
  GST_RATE_SERVICES,
  GST_RATE_MEDICINES,
  toPaisa,
  toRupees,
  safeMultiply,
};
