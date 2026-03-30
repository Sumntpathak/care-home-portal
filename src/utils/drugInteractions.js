/**
 * DRUG INTERACTION ENGINE
 * ========================
 * Based on: FDA drug interaction guidelines, WHO Essential Medicines interactions,
 * and Indian National List of Essential Medicines (NLEM) standards.
 *
 * Severity levels: "major" | "moderate" | "minor"
 *
 * Designed for use in Indian nursing homes / care homes where polypharmacy
 * in elderly patients is common and interaction checking is critical.
 */

// ---------------------------------------------------------------------------
// BRAND-TO-GENERIC MAPPING (common Indian brands)
// ---------------------------------------------------------------------------

/** @type {Object<string, string>} */
const BRAND_TO_GENERIC = {
  // Antidiabetics
  glycomet: "metformin",
  glucophage: "metformin",
  "glycomet gp": "metformin + glimepiride",
  amaryl: "glimepiride",
  "amaryl m": "metformin + glimepiride",
  glynase: "glipizide",
  "glucotrol xl": "glipizide",
  lantus: "insulin glargine",
  basalog: "insulin glargine",
  januvia: "sitagliptin",
  istavel: "sitagliptin",
  "janumet": "sitagliptin + metformin",
  actos: "pioglitazone",
  pioz: "pioglitazone",

  // Antihypertensives
  amlong: "amlodipine",
  amlip: "amlodipine",
  stamlo: "amlodipine",
  telma: "telmisartan",
  telmikind: "telmisartan",
  "telma h": "telmisartan + hydrochlorothiazide",
  repace: "losartan",
  losacar: "losartan",
  "repace h": "losartan + hydrochlorothiazide",
  envas: "enalapril",
  aten: "atenolol",
  "met xl": "metoprolol",
  betaloc: "metoprolol",
  cardace: "ramipril",
  "cardace h": "ramipril + hydrochlorothiazide",
  aquazide: "hydrochlorothiazide",

  // Anticoagulants / Antiplatelets
  ecosprin: "aspirin",
  "ecosprin av": "aspirin + atorvastatin",
  "ecosprin gold": "aspirin + clopidogrel + atorvastatin",
  disprin: "aspirin",
  clavix: "clopidogrel",
  deplatt: "clopidogrel",
  "deplatt a": "aspirin + clopidogrel",
  warf: "warfarin",
  "s warin": "warfarin",
  xarelto: "rivaroxaban",

  // Statins
  atorva: "atorvastatin",
  lipitor: "atorvastatin",
  tonact: "atorvastatin",
  storvas: "atorvastatin",
  crestor: "rosuvastatin",
  rosuvas: "rosuvastatin",
  rozavel: "rosuvastatin",

  // Neurological
  syndopa: "levodopa",
  "syndopa plus": "levodopa",
  sinemet: "levodopa",
  "madopar": "levodopa",
  pacitane: "trihexyphenidyl",
  aricept: "donepezil",
  donecept: "donepezil",
  admenta: "memantine",
  namenda: "memantine",

  // Anxiolytics / Sedatives
  alprax: "alprazolam",
  restyl: "alprazolam",
  valium: "diazepam",
  calmpose: "diazepam",
  rivotril: "clonazepam",
  epitril: "clonazepam",
  meloset: "melatonin",
  zolfresh: "zolpidem",
  stilnox: "zolpidem",

  // Analgesics
  crocin: "paracetamol",
  dolo: "paracetamol",
  "dolo 650": "paracetamol",
  calpol: "paracetamol",
  brufen: "ibuprofen",
  combiflam: "ibuprofen + paracetamol",
  voveran: "diclofenac",
  "voveran sr": "diclofenac",
  ultracet: "tramadol + paracetamol",
  contramal: "tramadol",

  // Antacids / PPI
  omez: "omeprazole",
  "omez d": "omeprazole + domperidone",
  pantodac: "pantoprazole",
  "pan d": "pantoprazole + domperidone",
  domstal: "domperidone",
  "pan 40": "pantoprazole",
  rantac: "ranitidine",
  zinetac: "ranitidine",
  aciloc: "ranitidine",

  // Supplements
  shelcal: "calcium + vitamin d3",
  "shelcal 500": "calcium + vitamin d3",
  calcimax: "calcium + vitamin d3",
  gemcal: "calcium + vitamin d3",
  "autrin": "iron",
  orofer: "iron",
  "fefol z": "iron",
  neurobion: "vitamin b12",
  "methylcobal": "vitamin b12",
  "methycobal": "vitamin b12",
  zincovit: "multivitamins",
  "a to z": "multivitamins",
  supradyn: "multivitamins",
  becosules: "multivitamins",

  // Respiratory
  asthalin: "salbutamol",
  ventolin: "salbutamol",
  duolin: "salbutamol + ipratropium",
  ipravent: "ipratropium",
  atrovent: "ipratropium",
  montair: "montelukast",
  singulair: "montelukast",

  // Antibiotics
  amoxyclav: "amoxicillin",
  "augmentin": "amoxicillin",
  mox: "amoxicillin",
  azee: "azithromycin",
  zithromax: "azithromycin",
  azicip: "azithromycin",
  azithral: "azithromycin",
  ciplox: "ciprofloxacin",
  cifran: "ciprofloxacin",
  "sporidex": "cephalexin",
  keflex: "cephalexin",

  // Cardiac
  digoxin: "digoxin",
  lanoxin: "digoxin",
  lasix: "furosemide",
  fruselac: "furosemide",
  aldactone: "spironolactone",
  lasilactone: "spironolactone",
  spiromide: "spironolactone",
  dytide: "spironolactone",
  entresto: "sacubitril",
  vymada: "sacubitril",
  "sacubitril/valsartan": "sacubitril",
  "sacubitril valsartan": "sacubitril",
  rcin: "rifampicin",
  binex: "rifampicin",
  "r-cin": "rifampicin",
  "r cin": "rifampicin",
  rifadin: "rifampicin",

  // Thyroid
  thyronorm: "levothyroxine",
  eltroxin: "levothyroxine",
  thyrox: "levothyroxine",

  // Ophthalmic
  "alphagan": "brimonidine",
  "iotim": "timolol",
  "timolol": "timolol",
  "xalatan": "latanoprost",

  // Steroids
  omnacortil: "prednisolone",
  wysolone: "prednisolone",
  "dexona": "dexamethasone",
  decadron: "dexamethasone",
};

// ---------------------------------------------------------------------------
// DRUG DATABASE
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} DrugEntry
 * @property {string} name - Generic drug name
 * @property {string} class - Pharmacological class
 * @property {string} subclass - More specific sub-classification
 * @property {string[]} commonDoses - Typical dosage strings
 * @property {string[]} sideEffects - Common adverse effects
 * @property {string[]} contraindications - When drug must not be used
 * @property {string[]} interactionKeys - Keys into INTERACTION_DB for quick lookup
 */

/** @type {Object<string, DrugEntry>} */
const DRUG_DATABASE = {
  // ===== ANTIDIABETICS =====
  metformin: {
    name: "Metformin",
    class: "antidiabetic",
    subclass: "biguanide",
    commonDoses: ["500mg BD", "500mg TDS", "1000mg BD"],
    sideEffects: ["nausea", "diarrhoea", "abdominal pain", "lactic acidosis (rare)", "vitamin B12 deficiency"],
    contraindications: ["severe renal impairment (eGFR<30)", "metabolic acidosis", "hepatic failure", "acute heart failure", "alcoholism"],
    interactionKeys: ["metformin"],
  },
  glimepiride: {
    name: "Glimepiride",
    class: "antidiabetic",
    subclass: "sulfonylurea",
    commonDoses: ["1mg OD", "2mg OD", "4mg OD"],
    sideEffects: ["hypoglycemia", "weight gain", "dizziness", "nausea"],
    contraindications: ["type 1 diabetes", "diabetic ketoacidosis", "severe hepatic impairment", "severe renal impairment"],
    interactionKeys: ["glimepiride", "sulfonylurea"],
  },
  glipizide: {
    name: "Glipizide",
    class: "antidiabetic",
    subclass: "sulfonylurea",
    commonDoses: ["2.5mg OD", "5mg OD", "10mg BD"],
    sideEffects: ["hypoglycemia", "weight gain", "nausea", "dizziness"],
    contraindications: ["type 1 diabetes", "diabetic ketoacidosis", "severe hepatic impairment"],
    interactionKeys: ["glipizide", "sulfonylurea"],
  },
  "insulin glargine": {
    name: "Insulin Glargine",
    class: "antidiabetic",
    subclass: "long-acting insulin",
    commonDoses: ["10 units SC OD", "20 units SC OD", "dose titrated to fasting glucose"],
    sideEffects: ["hypoglycemia", "injection site reactions", "weight gain", "lipodystrophy"],
    contraindications: ["hypoglycemia episodes"],
    interactionKeys: ["insulin"],
  },
  sitagliptin: {
    name: "Sitagliptin",
    class: "antidiabetic",
    subclass: "DPP-4 inhibitor",
    commonDoses: ["50mg OD", "100mg OD"],
    sideEffects: ["headache", "nasopharyngitis", "upper respiratory infection", "pancreatitis (rare)"],
    contraindications: ["history of pancreatitis"],
    interactionKeys: ["sitagliptin", "dpp4_inhibitor"],
  },
  pioglitazone: {
    name: "Pioglitazone",
    class: "antidiabetic",
    subclass: "thiazolidinedione",
    commonDoses: ["15mg OD", "30mg OD"],
    sideEffects: ["weight gain", "oedema", "fracture risk", "heart failure exacerbation", "bladder cancer (rare)"],
    contraindications: ["heart failure (NYHA III-IV)", "bladder cancer", "hepatic impairment"],
    interactionKeys: ["pioglitazone"],
  },

  // ===== ANTIHYPERTENSIVES =====
  amlodipine: {
    name: "Amlodipine",
    class: "antihypertensive",
    subclass: "calcium channel blocker",
    commonDoses: ["2.5mg OD", "5mg OD", "10mg OD"],
    sideEffects: ["peripheral oedema", "headache", "flushing", "dizziness", "palpitations"],
    contraindications: ["severe aortic stenosis", "cardiogenic shock", "unstable angina"],
    interactionKeys: ["amlodipine", "ccb"],
  },
  telmisartan: {
    name: "Telmisartan",
    class: "antihypertensive",
    subclass: "ARB",
    commonDoses: ["20mg OD", "40mg OD", "80mg OD"],
    sideEffects: ["dizziness", "hyperkalemia", "hypotension", "back pain"],
    contraindications: ["pregnancy", "bilateral renal artery stenosis", "hyperkalemia"],
    interactionKeys: ["telmisartan", "arb"],
  },
  losartan: {
    name: "Losartan",
    class: "antihypertensive",
    subclass: "ARB",
    commonDoses: ["25mg OD", "50mg OD", "100mg OD"],
    sideEffects: ["dizziness", "hyperkalemia", "hypotension", "fatigue"],
    contraindications: ["pregnancy", "bilateral renal artery stenosis", "hyperkalemia"],
    interactionKeys: ["losartan", "arb"],
  },
  enalapril: {
    name: "Enalapril",
    class: "antihypertensive",
    subclass: "ACE inhibitor",
    commonDoses: ["2.5mg OD", "5mg OD", "10mg BD"],
    sideEffects: ["dry cough", "hyperkalemia", "dizziness", "angioedema (rare)", "hypotension"],
    contraindications: ["pregnancy", "bilateral renal artery stenosis", "angioedema history", "hyperkalemia"],
    interactionKeys: ["enalapril", "ace_inhibitor"],
  },
  atenolol: {
    name: "Atenolol",
    class: "antihypertensive",
    subclass: "beta-blocker",
    commonDoses: ["25mg OD", "50mg OD", "100mg OD"],
    sideEffects: ["bradycardia", "fatigue", "cold extremities", "dizziness", "depression"],
    contraindications: ["severe bradycardia", "heart block (2nd/3rd degree)", "uncontrolled heart failure", "cardiogenic shock"],
    interactionKeys: ["atenolol", "beta_blocker"],
  },
  metoprolol: {
    name: "Metoprolol",
    class: "antihypertensive",
    subclass: "beta-blocker",
    commonDoses: ["25mg BD", "50mg BD", "100mg BD", "25mg XL OD", "50mg XL OD"],
    sideEffects: ["bradycardia", "fatigue", "dizziness", "depression", "cold extremities"],
    contraindications: ["severe bradycardia", "heart block (2nd/3rd degree)", "cardiogenic shock", "decompensated heart failure"],
    interactionKeys: ["metoprolol", "beta_blocker"],
  },
  ramipril: {
    name: "Ramipril",
    class: "antihypertensive",
    subclass: "ACE inhibitor",
    commonDoses: ["1.25mg OD", "2.5mg OD", "5mg OD", "10mg OD"],
    sideEffects: ["dry cough", "dizziness", "hyperkalemia", "angioedema (rare)", "hypotension"],
    contraindications: ["pregnancy", "bilateral renal artery stenosis", "angioedema history", "hyperkalemia"],
    interactionKeys: ["ramipril", "ace_inhibitor"],
  },
  hydrochlorothiazide: {
    name: "Hydrochlorothiazide",
    class: "antihypertensive",
    subclass: "thiazide diuretic",
    commonDoses: ["12.5mg OD", "25mg OD"],
    sideEffects: ["hypokalemia", "hyperuricemia", "hyponatremia", "hyperglycemia", "photosensitivity"],
    contraindications: ["anuria", "severe renal impairment", "severe hepatic impairment", "sulfa allergy"],
    interactionKeys: ["hydrochlorothiazide", "thiazide"],
  },

  // ===== ANTICOAGULANTS / ANTIPLATELETS =====
  aspirin: {
    name: "Aspirin",
    class: "antiplatelet",
    subclass: "COX inhibitor",
    commonDoses: ["75mg OD", "150mg OD", "325mg OD"],
    sideEffects: ["GI bleeding", "dyspepsia", "bruising", "tinnitus (high doses)"],
    contraindications: ["active GI bleeding", "peptic ulcer", "bleeding disorders", "aspirin allergy", "children (Reye syndrome)"],
    interactionKeys: ["aspirin", "antiplatelet", "nsaid_like"],
  },
  clopidogrel: {
    name: "Clopidogrel",
    class: "antiplatelet",
    subclass: "P2Y12 inhibitor",
    commonDoses: ["75mg OD"],
    sideEffects: ["bleeding", "bruising", "dyspepsia", "diarrhoea", "rash"],
    contraindications: ["active bleeding", "severe hepatic impairment"],
    interactionKeys: ["clopidogrel", "antiplatelet"],
  },
  warfarin: {
    name: "Warfarin",
    class: "anticoagulant",
    subclass: "vitamin K antagonist",
    commonDoses: ["1mg OD", "2mg OD", "5mg OD", "dose adjusted to INR 2-3"],
    sideEffects: ["bleeding", "bruising", "skin necrosis (rare)", "purple toe syndrome (rare)"],
    contraindications: ["active bleeding", "pregnancy", "severe hepatic disease", "recent surgery", "haemorrhagic stroke"],
    interactionKeys: ["warfarin", "anticoagulant"],
  },
  rivaroxaban: {
    name: "Rivaroxaban",
    class: "anticoagulant",
    subclass: "direct factor Xa inhibitor",
    commonDoses: ["10mg OD", "15mg OD", "20mg OD"],
    sideEffects: ["bleeding", "bruising", "anaemia", "nausea", "dizziness"],
    contraindications: ["active bleeding", "severe hepatic disease", "pregnancy", "prosthetic heart valves"],
    interactionKeys: ["rivaroxaban", "anticoagulant"],
  },

  // ===== STATINS =====
  atorvastatin: {
    name: "Atorvastatin",
    class: "lipid-lowering",
    subclass: "statin",
    commonDoses: ["10mg OD", "20mg OD", "40mg OD", "80mg OD"],
    sideEffects: ["myalgia", "elevated liver enzymes", "rhabdomyolysis (rare)", "headache", "GI upset"],
    contraindications: ["active liver disease", "pregnancy", "breastfeeding", "unexplained elevated transaminases"],
    interactionKeys: ["atorvastatin", "statin"],
  },
  rosuvastatin: {
    name: "Rosuvastatin",
    class: "lipid-lowering",
    subclass: "statin",
    commonDoses: ["5mg OD", "10mg OD", "20mg OD", "40mg OD"],
    sideEffects: ["myalgia", "headache", "dizziness", "elevated liver enzymes", "rhabdomyolysis (rare)"],
    contraindications: ["active liver disease", "pregnancy", "breastfeeding", "severe renal impairment (40mg dose)"],
    interactionKeys: ["rosuvastatin", "statin"],
  },

  // ===== NEUROLOGICAL =====
  levodopa: {
    name: "Levodopa/Carbidopa",
    class: "antiparkinsonian",
    subclass: "dopamine precursor",
    commonDoses: ["110mg (100/10) TDS", "275mg (250/25) TDS", "Syndopa Plus TDS"],
    sideEffects: ["nausea", "dyskinesia", "orthostatic hypotension", "hallucinations", "impulse control disorders", "on-off phenomenon"],
    contraindications: ["narrow-angle glaucoma", "pheochromocytoma", "concurrent MAOIs"],
    interactionKeys: ["levodopa"],
  },
  trihexyphenidyl: {
    name: "Trihexyphenidyl",
    class: "antiparkinsonian",
    subclass: "anticholinergic",
    commonDoses: ["1mg BD", "2mg TDS"],
    sideEffects: ["dry mouth", "blurred vision", "urinary retention", "constipation", "confusion (elderly)", "cognitive impairment"],
    contraindications: ["narrow-angle glaucoma", "GI obstruction", "urinary retention", "dementia"],
    interactionKeys: ["trihexyphenidyl", "anticholinergic"],
  },
  donepezil: {
    name: "Donepezil",
    class: "anti-dementia",
    subclass: "cholinesterase inhibitor",
    commonDoses: ["5mg OD", "10mg OD"],
    sideEffects: ["nausea", "diarrhoea", "insomnia", "muscle cramps", "bradycardia"],
    contraindications: ["known hypersensitivity"],
    interactionKeys: ["donepezil", "cholinesterase_inhibitor"],
  },
  memantine: {
    name: "Memantine",
    class: "anti-dementia",
    subclass: "NMDA receptor antagonist",
    commonDoses: ["5mg OD", "10mg BD", "titrate over 4 weeks"],
    sideEffects: ["dizziness", "headache", "constipation", "confusion"],
    contraindications: ["severe renal impairment"],
    interactionKeys: ["memantine"],
  },

  // ===== ANXIOLYTICS / SEDATIVES =====
  alprazolam: {
    name: "Alprazolam",
    class: "anxiolytic",
    subclass: "benzodiazepine",
    commonDoses: ["0.25mg OD-BD", "0.5mg OD-BD"],
    sideEffects: ["drowsiness", "dizziness", "dependence", "cognitive impairment", "fall risk (elderly)", "paradoxical agitation"],
    contraindications: ["severe respiratory insufficiency", "sleep apnoea", "myasthenia gravis", "severe hepatic impairment"],
    interactionKeys: ["alprazolam", "benzodiazepine"],
  },
  diazepam: {
    name: "Diazepam",
    class: "anxiolytic",
    subclass: "benzodiazepine",
    commonDoses: ["2mg BD-TDS", "5mg BD", "5-10mg HS"],
    sideEffects: ["drowsiness", "muscle weakness", "dependence", "cognitive impairment", "fall risk (elderly)"],
    contraindications: ["severe respiratory insufficiency", "sleep apnoea", "myasthenia gravis", "severe hepatic impairment"],
    interactionKeys: ["diazepam", "benzodiazepine"],
  },
  clonazepam: {
    name: "Clonazepam",
    class: "anxiolytic",
    subclass: "benzodiazepine",
    commonDoses: ["0.25mg BD", "0.5mg BD", "1mg BD"],
    sideEffects: ["drowsiness", "ataxia", "dependence", "cognitive impairment", "fall risk (elderly)"],
    contraindications: ["severe respiratory insufficiency", "sleep apnoea", "myasthenia gravis"],
    interactionKeys: ["clonazepam", "benzodiazepine"],
  },
  melatonin: {
    name: "Melatonin",
    class: "sleep aid",
    subclass: "hormone supplement",
    commonDoses: ["2mg OD HS", "3mg OD HS", "5mg OD HS"],
    sideEffects: ["drowsiness", "headache", "dizziness", "nausea"],
    contraindications: ["autoimmune disorders (relative)"],
    interactionKeys: ["melatonin"],
  },
  zolpidem: {
    name: "Zolpidem",
    class: "sedative",
    subclass: "non-benzodiazepine hypnotic",
    commonDoses: ["5mg HS", "10mg HS"],
    sideEffects: ["drowsiness", "dizziness", "sleepwalking", "amnesia", "fall risk (elderly)"],
    contraindications: ["severe respiratory insufficiency", "sleep apnoea", "severe hepatic impairment", "myasthenia gravis"],
    interactionKeys: ["zolpidem", "sedative"],
  },

  // ===== ANALGESICS =====
  paracetamol: {
    name: "Paracetamol",
    class: "analgesic",
    subclass: "non-opioid analgesic",
    commonDoses: ["500mg TDS-QDS", "650mg TDS", "1000mg TDS (max 4g/day)"],
    sideEffects: ["hepatotoxicity (overdose)", "rarely skin rash"],
    contraindications: ["severe hepatic impairment", "known hypersensitivity"],
    interactionKeys: ["paracetamol"],
  },
  ibuprofen: {
    name: "Ibuprofen",
    class: "analgesic",
    subclass: "NSAID",
    commonDoses: ["200mg TDS", "400mg TDS", "600mg TDS"],
    sideEffects: ["GI upset", "GI bleeding", "renal impairment", "hypertension", "oedema"],
    contraindications: ["active GI bleeding", "peptic ulcer", "severe renal impairment", "severe heart failure", "third trimester pregnancy", "aspirin allergy"],
    interactionKeys: ["ibuprofen", "nsaid"],
  },
  diclofenac: {
    name: "Diclofenac",
    class: "analgesic",
    subclass: "NSAID",
    commonDoses: ["50mg BD-TDS", "75mg BD", "100mg SR OD"],
    sideEffects: ["GI upset", "GI bleeding", "renal impairment", "cardiovascular risk", "hypertension"],
    contraindications: ["active GI bleeding", "peptic ulcer", "severe renal impairment", "severe heart failure", "ischaemic heart disease", "aspirin allergy"],
    interactionKeys: ["diclofenac", "nsaid"],
  },
  tramadol: {
    name: "Tramadol",
    class: "analgesic",
    subclass: "opioid analgesic",
    commonDoses: ["50mg BD-TDS", "100mg BD"],
    sideEffects: ["nausea", "dizziness", "constipation", "drowsiness", "seizures (rare)", "serotonin syndrome (rare)", "dependence"],
    contraindications: ["epilepsy (uncontrolled)", "concurrent MAOIs", "severe respiratory depression", "acute intoxication"],
    interactionKeys: ["tramadol", "opioid"],
  },

  // ===== ANTACIDS / PPI =====
  omeprazole: {
    name: "Omeprazole",
    class: "antacid",
    subclass: "proton pump inhibitor",
    commonDoses: ["20mg OD", "40mg OD"],
    sideEffects: ["headache", "nausea", "diarrhoea", "vitamin B12 deficiency (long-term)", "hypomagnesemia (long-term)", "fracture risk (long-term)"],
    contraindications: ["known hypersensitivity"],
    interactionKeys: ["omeprazole", "ppi"],
  },
  pantoprazole: {
    name: "Pantoprazole",
    class: "antacid",
    subclass: "proton pump inhibitor",
    commonDoses: ["20mg OD", "40mg OD"],
    sideEffects: ["headache", "diarrhoea", "nausea", "abdominal pain", "hypomagnesemia (long-term)"],
    contraindications: ["known hypersensitivity"],
    interactionKeys: ["pantoprazole", "ppi"],
  },
  ranitidine: {
    name: "Ranitidine",
    class: "antacid",
    subclass: "H2 receptor antagonist",
    commonDoses: ["150mg BD", "300mg HS"],
    sideEffects: ["headache", "dizziness", "constipation", "diarrhoea"],
    contraindications: ["known hypersensitivity", "porphyria"],
    interactionKeys: ["ranitidine", "h2_blocker"],
  },

  // ===== SUPPLEMENTS =====
  "calcium + vitamin d3": {
    name: "Calcium + Vitamin D3",
    class: "supplement",
    subclass: "mineral + vitamin",
    commonDoses: ["500mg + 250IU OD-BD", "1000mg + 500IU OD"],
    sideEffects: ["constipation", "bloating", "hypercalcemia (excess)", "kidney stones (excess)"],
    contraindications: ["hypercalcemia", "severe hypercalciuria", "calcium-containing kidney stones"],
    interactionKeys: ["calcium", "vitamin_d"],
  },
  iron: {
    name: "Iron (Ferrous Sulphate/Fumarate)",
    class: "supplement",
    subclass: "mineral",
    commonDoses: ["200mg OD-BD (elemental iron 60-65mg)", "100mg elemental iron OD"],
    sideEffects: ["constipation", "nausea", "black stools", "abdominal pain"],
    contraindications: ["haemochromatosis", "haemolytic anaemia", "repeated blood transfusions"],
    interactionKeys: ["iron"],
  },
  "vitamin b12": {
    name: "Vitamin B12 (Methylcobalamin)",
    class: "supplement",
    subclass: "vitamin",
    commonDoses: ["500mcg OD", "1500mcg OD", "1000mcg IM weekly"],
    sideEffects: ["rarely injection site pain"],
    contraindications: ["known hypersensitivity"],
    interactionKeys: ["vitamin_b12"],
  },
  multivitamins: {
    name: "Multivitamins",
    class: "supplement",
    subclass: "vitamin + mineral complex",
    commonDoses: ["1 tablet OD"],
    sideEffects: ["nausea", "constipation", "discoloured urine"],
    contraindications: ["hypervitaminosis"],
    interactionKeys: ["multivitamins"],
  },

  // ===== RESPIRATORY =====
  salbutamol: {
    name: "Salbutamol",
    class: "bronchodilator",
    subclass: "short-acting beta-2 agonist",
    commonDoses: ["100mcg 2 puffs PRN", "2.5mg nebulised PRN", "4mg oral TDS"],
    sideEffects: ["tremor", "palpitations", "tachycardia", "headache", "hypokalemia (high doses)"],
    contraindications: ["known hypersensitivity"],
    interactionKeys: ["salbutamol", "beta2_agonist"],
  },
  ipratropium: {
    name: "Ipratropium",
    class: "bronchodilator",
    subclass: "anticholinergic bronchodilator",
    commonDoses: ["20mcg 2 puffs QDS", "500mcg nebulised QDS"],
    sideEffects: ["dry mouth", "urinary retention", "constipation", "headache"],
    contraindications: ["known hypersensitivity to atropine"],
    interactionKeys: ["ipratropium", "anticholinergic"],
  },
  montelukast: {
    name: "Montelukast",
    class: "respiratory",
    subclass: "leukotriene receptor antagonist",
    commonDoses: ["10mg OD HS"],
    sideEffects: ["headache", "abdominal pain", "neuropsychiatric events (rare)", "sleep disturbances"],
    contraindications: ["known hypersensitivity", "phenylketonuria (chewable tabs)"],
    interactionKeys: ["montelukast"],
  },

  // ===== ANTIBIOTICS =====
  amoxicillin: {
    name: "Amoxicillin",
    class: "antibiotic",
    subclass: "penicillin",
    commonDoses: ["250mg TDS", "500mg TDS", "875mg BD"],
    sideEffects: ["diarrhoea", "nausea", "rash", "allergic reaction", "C. difficile infection"],
    contraindications: ["penicillin allergy", "infectious mononucleosis (rash risk)"],
    interactionKeys: ["amoxicillin", "penicillin"],
  },
  azithromycin: {
    name: "Azithromycin",
    class: "antibiotic",
    subclass: "macrolide",
    commonDoses: ["500mg OD x 3 days", "500mg day1 then 250mg x 4 days"],
    sideEffects: ["nausea", "diarrhoea", "abdominal pain", "QT prolongation", "hepatotoxicity (rare)"],
    contraindications: ["known hypersensitivity to macrolides", "severe hepatic impairment"],
    interactionKeys: ["azithromycin", "macrolide"],
  },
  ciprofloxacin: {
    name: "Ciprofloxacin",
    class: "antibiotic",
    subclass: "fluoroquinolone",
    commonDoses: ["250mg BD", "500mg BD", "750mg BD"],
    sideEffects: ["nausea", "diarrhoea", "tendon rupture", "QT prolongation", "photosensitivity", "C. difficile", "peripheral neuropathy"],
    contraindications: ["concurrent tizanidine", "children (relative)", "tendon disorders", "myasthenia gravis", "epilepsy (relative)"],
    interactionKeys: ["ciprofloxacin", "fluoroquinolone"],
  },
  cephalexin: {
    name: "Cephalexin",
    class: "antibiotic",
    subclass: "cephalosporin",
    commonDoses: ["250mg QDS", "500mg QDS"],
    sideEffects: ["diarrhoea", "nausea", "rash", "allergic reaction"],
    contraindications: ["cephalosporin allergy", "penicillin allergy (use caution, ~10% cross-reactivity)"],
    interactionKeys: ["cephalexin", "cephalosporin"],
  },

  // ===== CARDIAC =====
  digoxin: {
    name: "Digoxin",
    class: "cardiac glycoside",
    subclass: "cardiac glycoside",
    commonDoses: ["0.125mg OD", "0.25mg OD"],
    sideEffects: ["nausea", "vomiting", "arrhythmias", "visual disturbances (yellow vision)", "confusion"],
    contraindications: ["hypertrophic obstructive cardiomyopathy", "ventricular tachycardia", "WPW syndrome", "hypokalemia (increases toxicity)"],
    interactionKeys: ["digoxin"],
  },
  furosemide: {
    name: "Furosemide",
    class: "diuretic",
    subclass: "loop diuretic",
    commonDoses: ["20mg OD", "40mg OD-BD", "80mg OD"],
    sideEffects: ["hypokalemia", "hyponatremia", "dehydration", "hypotension", "ototoxicity (high IV doses)", "hyperuricemia"],
    contraindications: ["anuria", "severe hyponatremia", "severe hypokalemia", "hepatic encephalopathy", "sulfa allergy (caution)"],
    interactionKeys: ["furosemide", "loop_diuretic"],
  },
  spironolactone: {
    name: "Spironolactone",
    class: "diuretic",
    subclass: "potassium-sparing diuretic",
    commonDoses: ["25mg OD", "50mg OD", "100mg OD"],
    sideEffects: ["hyperkalemia", "gynaecomastia", "menstrual irregularities", "dizziness", "GI upset"],
    contraindications: ["hyperkalemia", "Addison disease", "severe renal impairment", "concurrent potassium supplements"],
    interactionKeys: ["spironolactone", "potassium_sparing"],
  },

  // ===== THYROID =====
  levothyroxine: {
    name: "Levothyroxine",
    class: "thyroid hormone",
    subclass: "thyroid hormone replacement",
    commonDoses: ["25mcg OD", "50mcg OD", "75mcg OD", "100mcg OD"],
    sideEffects: ["palpitations", "tachycardia", "weight loss", "tremor", "insomnia", "osteoporosis (excess)"],
    contraindications: ["thyrotoxicosis", "uncorrected adrenal insufficiency"],
    interactionKeys: ["levothyroxine"],
  },

  // ===== OPHTHALMIC =====
  brimonidine: {
    name: "Brimonidine",
    class: "ophthalmic",
    subclass: "alpha-2 agonist (eye drops)",
    commonDoses: ["0.2% 1 drop BD-TDS"],
    sideEffects: ["eye irritation", "dry mouth", "drowsiness", "allergic conjunctivitis"],
    contraindications: ["concurrent MAOIs", "neonates/infants"],
    interactionKeys: ["brimonidine"],
  },
  timolol: {
    name: "Timolol",
    class: "ophthalmic",
    subclass: "beta-blocker (eye drops)",
    commonDoses: ["0.25% 1 drop BD", "0.5% 1 drop BD"],
    sideEffects: ["burning/stinging", "bradycardia", "bronchospasm", "hypotension"],
    contraindications: ["asthma", "COPD (severe)", "bradycardia", "heart block", "decompensated heart failure"],
    interactionKeys: ["timolol", "beta_blocker"],
  },
  latanoprost: {
    name: "Latanoprost",
    class: "ophthalmic",
    subclass: "prostaglandin analogue",
    commonDoses: ["0.005% 1 drop OD HS"],
    sideEffects: ["iris pigmentation change", "eyelash growth", "eye irritation", "conjunctival hyperaemia"],
    contraindications: ["known hypersensitivity"],
    interactionKeys: ["latanoprost"],
  },

  // ===== STEROIDS =====
  prednisolone: {
    name: "Prednisolone",
    class: "corticosteroid",
    subclass: "glucocorticoid",
    commonDoses: ["5mg OD", "10mg OD", "20mg OD", "40mg OD (tapering)"],
    sideEffects: ["weight gain", "hyperglycemia", "osteoporosis", "cushingoid features", "immunosuppression", "GI upset", "mood changes", "adrenal suppression"],
    contraindications: ["systemic fungal infections", "live vaccines (high dose)"],
    interactionKeys: ["prednisolone", "corticosteroid"],
  },
  dexamethasone: {
    name: "Dexamethasone",
    class: "corticosteroid",
    subclass: "glucocorticoid",
    commonDoses: ["0.5mg OD", "4mg OD", "8mg OD"],
    sideEffects: ["weight gain", "hyperglycemia", "osteoporosis", "immunosuppression", "mood changes", "insomnia", "adrenal suppression"],
    contraindications: ["systemic fungal infections", "live vaccines (high dose)"],
    interactionKeys: ["dexamethasone", "corticosteroid"],
  },

  // ===== ARNI =====
  sacubitril: {
    name: "Sacubitril/Valsartan (Entresto)",
    class: "ARNI",
    subclass: "neprilysin-inhibitor + ARB",
    commonDoses: ["24/26mg", "49/51mg", "97/103mg"],
    sideEffects: ["hypotension", "hyperkalemia", "dizziness", "cough", "renal impairment"],
    contraindications: ["pregnancy", "bilateral renal artery stenosis", "severe hepatic impairment", "history of angioedema"],
    interactionKeys: ["sacubitril", "valsartan", "arb", "arni", "raas-blocker"],
  },
};

// ---------------------------------------------------------------------------
// DRUG INTERACTION DATABASE
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} Interaction
 * @property {string[]} drugs - Array of two drug keys / class keys that interact
 * @property {"major"|"moderate"|"minor"} severity
 * @property {string} description
 * @property {string} recommendation
 * @property {string} mechanism
 */

/** @type {Interaction[]} */
const INTERACTION_DB = [
  // ===== MAJOR INTERACTIONS =====
  {
    drugs: ["warfarin", "aspirin"],
    severity: "major",
    description: "Concurrent use significantly increases bleeding risk, including life-threatening GI and intracranial haemorrhage.",
    recommendation: "Avoid combination unless specifically indicated (e.g., mechanical heart valve). Monitor INR closely. Consider PPI co-prescription.",
    mechanism: "Aspirin inhibits platelet aggregation while warfarin inhibits clotting factor synthesis, leading to additive antihaemostatic effects.",
  },
  {
    drugs: ["warfarin", "nsaid"],
    severity: "major",
    description: "NSAIDs increase bleeding risk with warfarin through GI mucosal damage and antiplatelet effects.",
    recommendation: "Avoid NSAIDs in patients on warfarin. Use paracetamol for pain relief. If unavoidable, use lowest dose for shortest duration with PPI cover.",
    mechanism: "NSAIDs inhibit COX-1-dependent platelet function and cause GI mucosal erosion, compounding warfarin's anticoagulant effect.",
  },
  {
    drugs: ["warfarin", "fluoroquinolone"],
    severity: "major",
    description: "Fluoroquinolones can potentiate warfarin's anticoagulant effect, increasing INR and bleeding risk.",
    recommendation: "Monitor INR frequently during and after antibiotic course. Consider dose reduction of warfarin.",
    mechanism: "Fluoroquinolones inhibit CYP1A2 and CYP3A4, reducing warfarin metabolism. Also reduce gut flora vitamin K synthesis.",
  },
  {
    drugs: ["metformin", "contrast_dye"],
    severity: "major",
    description: "Iodinated contrast media can cause acute kidney injury, leading to metformin accumulation and lactic acidosis.",
    recommendation: "Withhold metformin 48 hours before and after contrast administration. Check renal function before restarting.",
    mechanism: "Contrast-induced nephropathy impairs renal excretion of metformin, leading to accumulation and lactic acidosis.",
  },
  {
    drugs: ["metformin", "alcohol"],
    severity: "major",
    description: "Alcohol potentiates metformin's effect on lactate metabolism, increasing lactic acidosis risk.",
    recommendation: "Advise patients to limit alcohol intake. Avoid binge drinking. Monitor for symptoms of lactic acidosis.",
    mechanism: "Alcohol inhibits gluconeogenesis and increases lactate production, compounding metformin's inhibition of hepatic lactate metabolism.",
  },
  {
    drugs: ["ace_inhibitor", "potassium_sparing"],
    severity: "major",
    description: "Combination significantly increases risk of life-threatening hyperkalemia.",
    recommendation: "If combination essential, monitor serum potassium closely (within 1 week, then regularly). Avoid potassium supplements.",
    mechanism: "ACE inhibitors reduce aldosterone secretion while potassium-sparing diuretics block potassium excretion, causing dangerous potassium retention.",
  },
  {
    drugs: ["ace_inhibitor", "arb"],
    severity: "major",
    description: "Dual RAAS blockade increases risks of hyperkalemia, hypotension, and renal failure without clear benefit.",
    recommendation: "Avoid concurrent use. Use one agent only. ONTARGET trial showed no benefit with increased harm.",
    mechanism: "Both block the renin-angiotensin system at different points, causing excessive RAAS suppression.",
  },
  {
    drugs: ["digoxin", "amiodarone"],
    severity: "major",
    description: "Amiodarone significantly increases digoxin levels, risking fatal digoxin toxicity (arrhythmias).",
    recommendation: "Reduce digoxin dose by 50% when starting amiodarone. Monitor digoxin levels and ECG closely.",
    mechanism: "Amiodarone inhibits P-glycoprotein and renal tubular secretion of digoxin, raising serum levels by 70-100%.",
  },
  {
    drugs: ["digoxin", "hypokalemia"],
    severity: "major",
    description: "Hypokalemia (from diuretics or other causes) markedly increases digoxin toxicity risk.",
    recommendation: "Monitor potassium regularly in patients on digoxin + diuretics. Supplement potassium as needed. Target K+ >4.0 mEq/L.",
    mechanism: "Digoxin and potassium compete for the same binding site on Na+/K+ ATPase. Low potassium increases digoxin binding and toxicity.",
  },
  {
    drugs: ["digoxin", "loop_diuretic"],
    severity: "major",
    description: "Loop diuretics cause hypokalemia which markedly increases digoxin toxicity risk.",
    recommendation: "Monitor potassium closely. Consider potassium supplementation or potassium-sparing diuretic. Target K+ >4.0 mEq/L.",
    mechanism: "Furosemide causes renal potassium loss. Hypokalemia increases myocardial sensitivity to digoxin, causing arrhythmias.",
  },
  {
    drugs: ["digoxin", "thiazide"],
    severity: "major",
    description: "Thiazide diuretics cause hypokalemia which increases digoxin toxicity risk.",
    recommendation: "Monitor potassium closely. Consider potassium supplementation. Target K+ >4.0 mEq/L.",
    mechanism: "Thiazides cause renal potassium wasting. Resultant hypokalemia increases digoxin binding to cardiac Na+/K+ ATPase.",
  },
  {
    drugs: ["levodopa", "metoclopramide"],
    severity: "major",
    description: "Metoclopramide is a dopamine antagonist that directly opposes levodopa's mechanism of action.",
    recommendation: "Avoid metoclopramide in Parkinson patients. Use domperidone instead (does not cross blood-brain barrier).",
    mechanism: "Metoclopramide blocks central dopamine D2 receptors, counteracting the dopaminergic effect of levodopa and worsening parkinsonism.",
  },
  {
    drugs: ["benzodiazepine", "opioid"],
    severity: "major",
    description: "Concurrent use causes additive CNS and respiratory depression. FDA boxed warning issued.",
    recommendation: "Avoid combination if possible. If essential, use lowest effective doses and shortest duration. Monitor respiratory rate and sedation.",
    mechanism: "Both act on CNS: benzodiazepines enhance GABA-A receptor activity while opioids depress brainstem respiratory centres, causing synergistic depression.",
  },
  {
    drugs: ["benzodiazepine", "alcohol"],
    severity: "major",
    description: "Alcohol potentiates CNS depressant effects of benzodiazepines, risking fatal respiratory depression.",
    recommendation: "Strictly advise against alcohol consumption. Monitor for excessive sedation.",
    mechanism: "Both enhance GABA-A receptor activity, causing synergistic CNS depression.",
  },
  {
    drugs: ["tramadol", "ssri"],
    severity: "major",
    description: "Combination increases risk of serotonin syndrome (agitation, hyperthermia, clonus, diaphoresis).",
    recommendation: "Use with caution. Monitor for signs of serotonin syndrome. Consider alternative analgesic.",
    mechanism: "Tramadol inhibits serotonin reuptake; combined with SSRIs causes excessive serotonergic activity.",
  },
  {
    drugs: ["tramadol", "maoi"],
    severity: "major",
    description: "Potentially fatal serotonin syndrome and seizures.",
    recommendation: "Absolutely contraindicated. Allow 14-day washout from MAOI before starting tramadol.",
    mechanism: "MAOIs prevent serotonin breakdown while tramadol inhibits serotonin reuptake, causing dangerous serotonin accumulation.",
  },
  {
    drugs: ["fluoroquinolone", "nsaid"],
    severity: "major",
    description: "Combination increases seizure risk, especially in elderly and patients with CNS disorders.",
    recommendation: "Avoid combination if possible. Use alternative antibiotic or analgesic. Monitor for neurological symptoms.",
    mechanism: "Both drugs inhibit GABA-A receptor activity in the CNS, lowering the seizure threshold synergistically.",
  },
  {
    drugs: ["ssri", "maoi"],
    severity: "major",
    description: "Life-threatening serotonin syndrome: hyperthermia, rigidity, autonomic instability, potentially fatal.",
    recommendation: "Absolutely contraindicated. Allow 14-day washout (5 weeks for fluoxetine) between agents.",
    mechanism: "MAOIs prevent serotonin metabolism while SSRIs block serotonin reuptake, causing dangerous serotonin accumulation in synaptic cleft.",
  },
  {
    drugs: ["anticoagulant", "antiplatelet"],
    severity: "major",
    description: "Combination significantly increases risk of major bleeding events.",
    recommendation: "Avoid unless clearly indicated (e.g., recent ACS with AF). Use shortest dual therapy duration. Add PPI.",
    mechanism: "Anticoagulants inhibit clotting cascade while antiplatelets inhibit platelet function, creating additive bleeding risk.",
  },

  // ===== MODERATE INTERACTIONS =====
  {
    drugs: ["metformin", "sulfonylurea"],
    severity: "moderate",
    description: "Combined use increases hypoglycemia risk, especially in elderly and renal impairment.",
    recommendation: "Common therapeutic combination but monitor blood glucose closely. Educate patient on hypoglycemia symptoms. Reduce sulfonylurea dose in elderly.",
    mechanism: "Metformin reduces hepatic glucose output while sulfonylureas stimulate insulin secretion, causing additive glucose-lowering effect.",
  },
  {
    drugs: ["ccb", "beta_blocker"],
    severity: "moderate",
    description: "Combination may cause excessive bradycardia, hypotension, and heart block.",
    recommendation: "Monitor heart rate and blood pressure closely. Avoid with non-dihydropyridine CCBs (verapamil/diltiazem). Amlodipine + beta-blocker is generally safer.",
    mechanism: "Both reduce heart rate and cardiac contractility. CCBs reduce SA/AV node conduction while beta-blockers reduce sympathetic drive.",
  },
  {
    drugs: ["omeprazole", "clopidogrel"],
    severity: "moderate",
    description: "Omeprazole reduces antiplatelet efficacy of clopidogrel, increasing cardiovascular event risk.",
    recommendation: "Use pantoprazole instead (less CYP2C19 inhibition). If PPI needed, avoid omeprazole/esomeprazole.",
    mechanism: "Omeprazole strongly inhibits CYP2C19, the enzyme required to convert clopidogrel prodrug to its active metabolite.",
  },
  {
    drugs: ["ppi", "clopidogrel"],
    severity: "moderate",
    description: "PPIs (especially omeprazole) may reduce clopidogrel activation via CYP2C19 inhibition.",
    recommendation: "If PPI needed, prefer pantoprazole (weaker CYP2C19 inhibition). Time doses 12 hours apart.",
    mechanism: "PPIs inhibit CYP2C19 to varying degrees, reducing conversion of clopidogrel to active thiol metabolite.",
  },
  {
    drugs: ["calcium", "levothyroxine"],
    severity: "moderate",
    description: "Calcium significantly reduces levothyroxine absorption, leading to inadequate thyroid control.",
    recommendation: "Space administration by at least 4 hours. Take levothyroxine on empty stomach in the morning, calcium with meals later.",
    mechanism: "Calcium forms insoluble chelation complexes with levothyroxine in the GI tract, reducing bioavailability by up to 25%.",
  },
  {
    drugs: ["iron", "levothyroxine"],
    severity: "moderate",
    description: "Iron reduces levothyroxine absorption, leading to inadequate thyroid control.",
    recommendation: "Space administration by at least 4 hours. Take levothyroxine on empty stomach in the morning.",
    mechanism: "Iron forms insoluble complexes with levothyroxine in the GI tract, significantly reducing absorption.",
  },
  {
    drugs: ["iron", "calcium"],
    severity: "moderate",
    description: "Concurrent calcium significantly reduces iron absorption.",
    recommendation: "Space administration by at least 2 hours. Take iron on empty stomach for best absorption.",
    mechanism: "Calcium competes with iron for absorption in the duodenum and inhibits iron transporter DMT1.",
  },
  {
    drugs: ["iron", "fluoroquinolone"],
    severity: "moderate",
    description: "Iron reduces fluoroquinolone absorption, potentially causing treatment failure.",
    recommendation: "Take fluoroquinolone 2 hours before or 6 hours after iron supplements.",
    mechanism: "Iron chelates fluoroquinolones in the GI tract, forming insoluble complexes that are not absorbed.",
  },
  {
    drugs: ["atorvastatin", "grapefruit"],
    severity: "moderate",
    description: "Grapefruit juice increases atorvastatin levels, raising risk of myopathy and rhabdomyolysis.",
    recommendation: "Avoid grapefruit juice or limit to small quantities. Monitor for muscle pain/weakness.",
    mechanism: "Grapefruit inhibits intestinal CYP3A4, reducing first-pass metabolism and increasing atorvastatin bioavailability.",
  },
  {
    drugs: ["statin", "macrolide"],
    severity: "moderate",
    description: "Macrolide antibiotics increase statin levels, raising myopathy and rhabdomyolysis risk.",
    recommendation: "Consider temporarily holding statin during short antibiotic course. Monitor for muscle pain/weakness/dark urine.",
    mechanism: "Macrolides inhibit CYP3A4 and P-glycoprotein, reducing statin metabolism and increasing systemic exposure.",
  },
  {
    drugs: ["statin", "corticosteroid"],
    severity: "moderate",
    description: "Corticosteroids may increase statin levels and both can cause myopathy.",
    recommendation: "Monitor for muscle symptoms. Check CK if myalgia develops.",
    mechanism: "Potential CYP3A4 competition and additive myopathy risk.",
  },
  {
    drugs: ["alprazolam", "omeprazole"],
    severity: "moderate",
    description: "Omeprazole inhibits alprazolam metabolism, increasing sedation and CNS depression.",
    recommendation: "Monitor for excessive sedation. Consider dose reduction of alprazolam or use lorazepam (not hepatically metabolised).",
    mechanism: "Omeprazole inhibits CYP3A4, reducing alprazolam clearance and increasing plasma levels.",
  },
  {
    drugs: ["alprazolam", "ppi"],
    severity: "moderate",
    description: "PPIs may inhibit alprazolam metabolism, increasing sedation.",
    recommendation: "Monitor for excessive sedation. Use lowest effective benzodiazepine dose.",
    mechanism: "CYP3A4 and CYP2C19 inhibition by PPIs reduces alprazolam hepatic clearance.",
  },
  {
    drugs: ["nsaid", "ace_inhibitor"],
    severity: "moderate",
    description: "NSAIDs reduce antihypertensive efficacy of ACE inhibitors and increase renal impairment risk.",
    recommendation: "Avoid long-term NSAID use. Monitor blood pressure and renal function. Use paracetamol for pain if possible.",
    mechanism: "NSAIDs inhibit renal prostaglandin synthesis, counteracting the vasodilatory and natriuretic effects of ACE inhibitors.",
  },
  {
    drugs: ["nsaid", "arb"],
    severity: "moderate",
    description: "NSAIDs reduce antihypertensive efficacy of ARBs and increase renal impairment risk.",
    recommendation: "Avoid long-term NSAID use. Monitor blood pressure and renal function.",
    mechanism: "NSAIDs inhibit renal prostaglandins, counteracting ARB-mediated renal vasodilation and sodium excretion.",
  },
  {
    drugs: ["nsaid", "loop_diuretic"],
    severity: "moderate",
    description: "NSAIDs reduce diuretic efficacy and increase risk of acute kidney injury.",
    recommendation: "Avoid combination in dehydrated or elderly patients. Monitor renal function.",
    mechanism: "NSAIDs inhibit renal prostaglandin-mediated vasodilation, reducing renal blood flow and diuretic response.",
  },
  {
    drugs: ["nsaid", "anticoagulant"],
    severity: "major",
    description: "NSAIDs increase bleeding risk with anticoagulants through GI mucosal damage and antiplatelet effects.",
    recommendation: "Avoid combination. Use paracetamol for analgesia. If essential, add PPI and monitor closely.",
    mechanism: "NSAIDs cause GI mucosal erosion and inhibit platelet function, compounding anticoagulant bleeding risk.",
  },
  {
    drugs: ["metformin", "ace_inhibitor"],
    severity: "moderate",
    description: "ACE inhibitors may enhance glucose-lowering effect of metformin, increasing hypoglycemia risk.",
    recommendation: "Monitor blood glucose, especially when initiating ACE inhibitor. Adjust antidiabetic dose if needed.",
    mechanism: "ACE inhibitors may increase insulin sensitivity and bradykinin levels, enhancing glucose uptake.",
  },
  {
    drugs: ["corticosteroid", "nsaid"],
    severity: "moderate",
    description: "Combination significantly increases risk of GI bleeding and peptic ulceration.",
    recommendation: "Avoid combination if possible. If needed, co-prescribe PPI for gastroprotection.",
    mechanism: "Corticosteroids impair gastric mucosal repair while NSAIDs inhibit protective prostaglandins, causing synergistic GI damage.",
  },
  {
    drugs: ["corticosteroid", "antidiabetic"],
    severity: "moderate",
    description: "Corticosteroids cause hyperglycemia, counteracting antidiabetic medications.",
    recommendation: "Monitor blood glucose closely during steroid therapy. Adjust antidiabetic dose as needed. Glucose may rise within hours of steroid dose.",
    mechanism: "Corticosteroids increase hepatic gluconeogenesis, reduce peripheral glucose uptake, and cause insulin resistance.",
  },
  {
    drugs: ["levothyroxine", "ppi"],
    severity: "moderate",
    description: "PPIs reduce gastric acid, potentially reducing levothyroxine absorption.",
    recommendation: "Take levothyroxine on empty stomach, 30-60 minutes before PPI. Monitor TSH levels.",
    mechanism: "Levothyroxine absorption requires acidic gastric pH. PPIs raise gastric pH, reducing dissolution and absorption.",
  },
  {
    drugs: ["fluoroquinolone", "calcium"],
    severity: "moderate",
    description: "Calcium chelates fluoroquinolones, significantly reducing antibiotic absorption.",
    recommendation: "Take fluoroquinolone 2 hours before or 6 hours after calcium supplements.",
    mechanism: "Divalent cations (Ca2+) form insoluble chelation complexes with fluoroquinolones in the GI tract.",
  },
  {
    drugs: ["fluoroquinolone", "iron"],
    severity: "moderate",
    description: "Iron chelates fluoroquinolones, reducing antibiotic absorption and efficacy.",
    recommendation: "Take fluoroquinolone 2 hours before or 6 hours after iron supplements.",
    mechanism: "Iron forms insoluble complexes with fluoroquinolones, preventing GI absorption.",
  },
  {
    drugs: ["beta_blocker", "antidiabetic"],
    severity: "moderate",
    description: "Beta-blockers may mask hypoglycemia symptoms (tachycardia, tremor) and prolong hypoglycemic episodes.",
    recommendation: "Educate patient to rely on sweating and hunger as hypoglycemia indicators. Monitor blood glucose more frequently.",
    mechanism: "Beta-blockers block adrenergic response to hypoglycemia, masking warning symptoms and impairing glycogenolysis.",
  },
  {
    drugs: ["donepezil", "anticholinergic"],
    severity: "moderate",
    description: "Anticholinergics directly oppose the cholinergic mechanism of donepezil, reducing its efficacy.",
    recommendation: "Avoid anticholinergics in patients on cholinesterase inhibitors. Review all medications for anticholinergic burden.",
    mechanism: "Donepezil increases acetylcholine by inhibiting cholinesterase; anticholinergics block muscarinic receptors, negating the effect.",
  },
  {
    drugs: ["cholinesterase_inhibitor", "beta_blocker"],
    severity: "moderate",
    description: "Both may cause bradycardia; combination increases risk of symptomatic bradycardia and syncope.",
    recommendation: "Monitor heart rate regularly. Use beta-blocker with caution. Consider ECG monitoring.",
    mechanism: "Cholinesterase inhibitors increase vagal tone while beta-blockers reduce sympathetic drive, both slowing heart rate.",
  },
  {
    drugs: ["warfarin", "macrolide"],
    severity: "moderate",
    description: "Macrolides increase warfarin levels, raising INR and bleeding risk.",
    recommendation: "Monitor INR closely during and after antibiotic course. May need warfarin dose reduction.",
    mechanism: "Macrolides inhibit CYP3A4 and reduce gut flora vitamin K synthesis, potentiating warfarin effect.",
  },
  {
    drugs: ["warfarin", "corticosteroid"],
    severity: "moderate",
    description: "Corticosteroids may increase warfarin effect and INR, especially at high doses.",
    recommendation: "Monitor INR closely when starting or stopping corticosteroids. Adjust warfarin dose as needed.",
    mechanism: "Corticosteroids may affect vitamin K-dependent clotting factor synthesis and warfarin protein binding.",
  },

  // ===== MINOR INTERACTIONS =====
  {
    drugs: ["paracetamol", "caffeine"],
    severity: "minor",
    description: "Caffeine enhances analgesic effect of paracetamol (often combined intentionally).",
    recommendation: "No clinical concern. Combination is used therapeutically in some formulations.",
    mechanism: "Caffeine enhances GI absorption of paracetamol and has independent analgesic properties via adenosine receptor blockade.",
  },
  {
    drugs: ["calcium", "vitamin_d"],
    severity: "minor",
    description: "Vitamin D enhances calcium absorption (beneficial interaction).",
    recommendation: "Intentionally combined. This is a desirable, beneficial interaction for bone health.",
    mechanism: "Vitamin D increases expression of intestinal calcium-binding proteins, enhancing active calcium absorption.",
  },
  {
    drugs: ["melatonin", "benzodiazepine"],
    severity: "minor",
    description: "Additive sedation possible. Melatonin may allow benzodiazepine dose reduction.",
    recommendation: "May be used together under supervision. Monitor for excessive drowsiness.",
    mechanism: "Both act on sleep-wake pathways: melatonin via MT1/MT2 receptors, benzodiazepines via GABA-A receptors.",
  },
  {
    drugs: ["multivitamins", "levothyroxine"],
    severity: "minor",
    description: "Multivitamins containing iron or calcium may reduce levothyroxine absorption.",
    recommendation: "Space by at least 4 hours. Take levothyroxine on empty stomach in morning.",
    mechanism: "Iron and calcium in multivitamins chelate levothyroxine, reducing GI absorption.",
  },

  // Hyperkalemia risk — ARB/ARNI + Potassium-sparing diuretic
  { drugs: ["valsartan", "spironolactone"], severity: "major",
    description: "Valsartan (or Sacubitril/Valsartan) + Spironolactone: Dual RAAS blockade with potassium-sparing diuretic. Extremely high risk of life-threatening Hyperkalemia, especially in CKD.",
    recommendation: "Monitor potassium URGENTLY (target <5.0 mEq/L). In CKD Stage 4, consider stopping Spironolactone. If both needed, check K+ twice weekly. Avoid potassium-rich foods.",
    mechanism: "Both drugs independently raise serum potassium. Valsartan blocks aldosterone (potassium retention), Spironolactone blocks aldosterone receptors (potassium retention). Combined effect is additive and dangerous in renal impairment."
  },
  { drugs: ["sacubitril", "spironolactone"], severity: "major",
    description: "Sacubitril/Valsartan (Entresto) + Spironolactone: Triple potassium-raising mechanism. Life-threatening Hyperkalemia risk, especially in CKD Stage 3+.",
    recommendation: "CHECK POTASSIUM IMMEDIATELY. In CKD Stage 3-4, this combination is generally CONTRAINDICATED. If clinically necessary, monitor K+ at least twice weekly and maintain strict low-potassium diet.",
    mechanism: "Sacubitril inhibits neprilysin (raises natriuretic peptides, mild K+ retention), Valsartan blocks RAAS (K+ retention), Spironolactone blocks aldosterone (K+ retention). Triple mechanism in impaired kidneys → Hyperkalemia crisis >6.0 mEq/L."
  },
];

// ---------------------------------------------------------------------------
// CONDITION-BASED WARNINGS DATABASE
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} ConditionWarning
 * @property {string[]} drugKeys - Drug keys or class keys that trigger this warning
 * @property {string} condition - The medical condition (normalized)
 * @property {"major"|"moderate"|"minor"} severity
 * @property {string} note
 */

/** @type {ConditionWarning[]} */
const CONDITION_WARNINGS = [
  // NSAID warnings
  { drugKeys: ["nsaid"], condition: "kidney disease", severity: "major", note: "NSAIDs are nephrotoxic and can cause acute kidney injury. Contraindicated in CKD stages 4-5." },
  { drugKeys: ["nsaid"], condition: "renal impairment", severity: "major", note: "NSAIDs reduce renal blood flow via prostaglandin inhibition. Contraindicated in significant renal impairment." },
  { drugKeys: ["nsaid"], condition: "peptic ulcer", severity: "major", note: "NSAIDs cause gastric mucosal damage and are contraindicated in active peptic ulcer disease." },
  { drugKeys: ["nsaid"], condition: "gi bleeding", severity: "major", note: "NSAIDs are contraindicated in active GI bleeding. They impair platelet function and damage gastric mucosa." },
  { drugKeys: ["nsaid"], condition: "heart failure", severity: "major", note: "NSAIDs cause sodium and water retention, worsening heart failure. Contraindicated in NYHA III-IV." },
  { drugKeys: ["nsaid"], condition: "hypertension", severity: "moderate", note: "NSAIDs can raise blood pressure by 3-5 mmHg via renal sodium retention." },
  { drugKeys: ["nsaid"], condition: "asthma", severity: "moderate", note: "Up to 20% of asthmatics have aspirin-exacerbated respiratory disease (AERD)." },

  // Metformin
  { drugKeys: ["metformin"], condition: "kidney disease", severity: "major", note: "Metformin is contraindicated if eGFR <30. Reduce dose if eGFR 30-45. Risk of lactic acidosis." },
  { drugKeys: ["metformin"], condition: "renal impairment", severity: "major", note: "Dose adjustment required. Contraindicated in severe renal impairment (eGFR <30)." },
  { drugKeys: ["metformin"], condition: "liver disease", severity: "major", note: "Hepatic impairment reduces lactate clearance, increasing lactic acidosis risk with metformin." },
  { drugKeys: ["metformin"], condition: "heart failure", severity: "moderate", note: "Use with caution in stable heart failure. Contraindicated in acute/decompensated heart failure." },
  { drugKeys: ["metformin"], condition: "alcoholism", severity: "major", note: "Alcohol potentiates metformin's effect on lactate metabolism. Contraindicated in alcoholism." },

  // Beta-blockers
  { drugKeys: ["beta_blocker"], condition: "asthma", severity: "major", note: "Beta-blockers can cause severe bronchospasm in asthma. Even cardioselective agents carry risk. Contraindicated." },
  { drugKeys: ["beta_blocker"], condition: "copd", severity: "moderate", note: "Use cardioselective beta-blockers (bisoprolol, metoprolol) with caution. Avoid non-selective agents." },
  { drugKeys: ["beta_blocker"], condition: "diabetes", severity: "moderate", note: "Beta-blockers can mask hypoglycemia symptoms (tachycardia, tremor). Use cardioselective agents." },
  { drugKeys: ["beta_blocker"], condition: "bradycardia", severity: "major", note: "Beta-blockers worsen bradycardia. Contraindicated if resting HR <50 bpm." },
  { drugKeys: ["beta_blocker"], condition: "peripheral vascular disease", severity: "moderate", note: "Beta-blockers may worsen peripheral vascular symptoms. Use with caution." },

  // Benzodiazepines
  { drugKeys: ["benzodiazepine"], condition: "elderly", severity: "moderate", note: "Beers Criteria: benzodiazepines increase fall risk, fractures, and cognitive impairment in elderly. Avoid if possible." },
  { drugKeys: ["benzodiazepine"], condition: "dementia", severity: "major", note: "Benzodiazepines worsen cognitive impairment and increase fall risk in dementia. Strongly avoid." },
  { drugKeys: ["benzodiazepine"], condition: "sleep apnoea", severity: "major", note: "Benzodiazepines worsen sleep apnoea by depressing respiratory drive. Contraindicated." },
  { drugKeys: ["benzodiazepine"], condition: "respiratory failure", severity: "major", note: "Benzodiazepines can cause fatal respiratory depression. Contraindicated." },
  { drugKeys: ["benzodiazepine"], condition: "liver disease", severity: "moderate", note: "Most benzodiazepines are hepatically metabolised. Use lorazepam or oxazepam (glucuronidation only)." },

  // ACE inhibitors
  { drugKeys: ["ace_inhibitor"], condition: "pregnancy", severity: "major", note: "ACE inhibitors are teratogenic (renal dysgenesis, oligohydramnios). Absolutely contraindicated in pregnancy." },
  { drugKeys: ["ace_inhibitor"], condition: "bilateral renal artery stenosis", severity: "major", note: "ACE inhibitors can cause acute renal failure in bilateral renal artery stenosis by removing efferent arteriolar tone." },
  { drugKeys: ["ace_inhibitor"], condition: "hyperkalemia", severity: "major", note: "ACE inhibitors reduce potassium excretion. Contraindicated if K+ >5.5 mEq/L." },
  { drugKeys: ["ace_inhibitor"], condition: "angioedema", severity: "major", note: "History of ACE inhibitor-related angioedema: absolutely contraindicated. Consider ARB with caution." },

  // ARBs
  { drugKeys: ["arb"], condition: "pregnancy", severity: "major", note: "ARBs are teratogenic. Absolutely contraindicated in pregnancy." },
  { drugKeys: ["arb"], condition: "bilateral renal artery stenosis", severity: "major", note: "ARBs can cause acute renal failure in bilateral renal artery stenosis." },
  { drugKeys: ["arb"], condition: "hyperkalemia", severity: "major", note: "ARBs reduce potassium excretion. Contraindicated if K+ >5.5 mEq/L." },

  // Digoxin
  { drugKeys: ["digoxin"], condition: "hypokalemia", severity: "major", note: "Hypokalemia dramatically increases digoxin toxicity. Maintain K+ >4.0 mEq/L." },
  { drugKeys: ["digoxin"], condition: "renal impairment", severity: "moderate", note: "Digoxin is renally cleared. Reduce dose and monitor levels in renal impairment (target 0.5-0.9 ng/mL)." },
  { drugKeys: ["digoxin"], condition: "hypothyroidism", severity: "moderate", note: "Hypothyroidism increases sensitivity to digoxin. Reduced doses may be needed." },

  // Warfarin
  { drugKeys: ["warfarin", "anticoagulant"], condition: "liver disease", severity: "major", note: "Liver disease impairs clotting factor synthesis, potentiating anticoagulant effect. High bleeding risk." },
  { drugKeys: ["warfarin", "anticoagulant"], condition: "elderly", severity: "moderate", note: "Elderly are more sensitive to warfarin. Use lower doses and monitor INR more frequently." },
  { drugKeys: ["warfarin", "anticoagulant"], condition: "falls risk", severity: "major", note: "Anticoagulants in fall-prone patients increase risk of serious haemorrhage, especially intracranial." },

  // Opioids
  { drugKeys: ["opioid"], condition: "elderly", severity: "moderate", note: "Elderly are more sensitive to opioid effects. Start with lower doses. Increased fall and respiratory depression risk." },
  { drugKeys: ["opioid"], condition: "respiratory failure", severity: "major", note: "Opioids depress respiratory drive. Contraindicated in severe respiratory insufficiency." },
  { drugKeys: ["opioid"], condition: "liver disease", severity: "moderate", note: "Opioid metabolism is impaired in liver disease. Reduce dose and increase dosing interval." },

  // Corticosteroids
  { drugKeys: ["corticosteroid"], condition: "diabetes", severity: "moderate", note: "Corticosteroids cause dose-dependent hyperglycemia. Monitor blood glucose closely and adjust diabetic medications." },
  { drugKeys: ["corticosteroid"], condition: "osteoporosis", severity: "moderate", note: "Corticosteroids accelerate bone loss. Co-prescribe calcium + vitamin D. Consider bisphosphonate for long-term use." },
  { drugKeys: ["corticosteroid"], condition: "peptic ulcer", severity: "moderate", note: "Corticosteroids impair mucosal healing. Co-prescribe PPI if risk factors present." },
  { drugKeys: ["corticosteroid"], condition: "glaucoma", severity: "moderate", note: "Corticosteroids can raise intraocular pressure. Monitor IOP in at-risk patients." },
  { drugKeys: ["corticosteroid"], condition: "immunocompromised", severity: "moderate", note: "Corticosteroids further suppress immunity. Monitor closely for infections." },

  // Sedatives in elderly
  { drugKeys: ["sedative", "zolpidem"], condition: "elderly", severity: "moderate", note: "Zolpidem increases fall risk and confusion in elderly. Use lowest dose (5mg). Beers Criteria: avoid if possible." },

  // Thiazides
  { drugKeys: ["thiazide"], condition: "gout", severity: "moderate", note: "Thiazides raise uric acid levels and can precipitate gout attacks." },
  { drugKeys: ["thiazide"], condition: "diabetes", severity: "moderate", note: "Thiazides can worsen glucose tolerance at higher doses. Monitor blood glucose." },

  // Spironolactone
  { drugKeys: ["potassium_sparing", "spironolactone"], condition: "hyperkalemia", severity: "major", note: "Potassium-sparing diuretics are contraindicated in hyperkalemia (K+ >5.5)." },
  { drugKeys: ["potassium_sparing", "spironolactone"], condition: "renal impairment", severity: "major", note: "Risk of life-threatening hyperkalemia in renal impairment. Monitor K+ closely." },
  { drugKeys: ["spironolactone"], condition: "kidney disease", severity: "major", note: "Spironolactone in CKD Stage 4-5: Hyperkalemia risk is EXTREME (>50% incidence). Generally contraindicated. If used, monitor potassium twice weekly and keep K+ <5.0." },
  { drugKeys: ["spironolactone"], condition: "ckd", severity: "major", note: "Spironolactone in CKD: Hyperkalemia risk is EXTREME. Generally contraindicated in Stage 4-5. Monitor potassium twice weekly." },

  // Levothyroxine
  { drugKeys: ["levothyroxine"], condition: "adrenal insufficiency", severity: "major", note: "Correct adrenal insufficiency before starting levothyroxine. Risk of adrenal crisis." },
  { drugKeys: ["levothyroxine"], condition: "ischaemic heart disease", severity: "moderate", note: "Start with low dose (25mcg) and titrate slowly. Risk of angina/arrhythmia in coronary disease." },
];

// ---------------------------------------------------------------------------
// ALLERGY CROSS-REACTIVITY DATABASE
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} AllergyCrossReactivity
 * @property {string} allergen - Normalized allergen name
 * @property {string[]} avoidDrugKeys - Drug keys to flag
 * @property {"major"|"moderate"|"minor"} severity
 * @property {string} note
 */

/** @type {AllergyCrossReactivity[]} */
const ALLERGY_CROSS_REACTIVITY = [
  {
    allergen: "penicillin",
    avoidDrugKeys: ["penicillin", "amoxicillin"],
    severity: "major",
    note: "Known penicillin allergy. Amoxicillin is a penicillin — absolutely contraindicated.",
  },
  {
    allergen: "penicillin",
    avoidDrugKeys: ["cephalosporin", "cephalexin"],
    severity: "moderate",
    note: "Penicillin allergy: ~2-5% cross-reactivity with cephalosporins (historically quoted as 10%). Use with caution; consider skin testing.",
  },
  {
    allergen: "sulfa",
    avoidDrugKeys: ["hydrochlorothiazide", "thiazide"],
    severity: "moderate",
    note: "Sulfa allergy: thiazide diuretics contain sulfonamide moiety. Cross-reactivity is debated but caution advised.",
  },
  {
    allergen: "sulfa",
    avoidDrugKeys: ["furosemide", "loop_diuretic"],
    severity: "moderate",
    note: "Sulfa allergy: furosemide has sulfonamide structure. Cross-reactivity risk is low but monitor for reactions.",
  },
  {
    allergen: "sulfonamide",
    avoidDrugKeys: ["hydrochlorothiazide", "thiazide", "furosemide", "loop_diuretic"],
    severity: "moderate",
    note: "Sulfonamide allergy: caution with thiazide and loop diuretics due to structural similarity.",
  },
  {
    allergen: "aspirin",
    avoidDrugKeys: ["aspirin", "nsaid", "ibuprofen", "diclofenac"],
    severity: "major",
    note: "Aspirin allergy: cross-reactive with all NSAIDs due to COX inhibition. Use paracetamol for analgesia.",
  },
  {
    allergen: "nsaid",
    avoidDrugKeys: ["nsaid", "aspirin", "ibuprofen", "diclofenac", "nsaid_like"],
    severity: "major",
    note: "NSAID allergy: avoid all NSAIDs and aspirin. Use paracetamol or tramadol for pain.",
  },
  {
    allergen: "codeine",
    avoidDrugKeys: ["tramadol", "opioid"],
    severity: "moderate",
    note: "Codeine allergy: tramadol has partial opioid activity. Use with caution. True cross-reactivity is uncommon but possible.",
  },
  {
    allergen: "morphine",
    avoidDrugKeys: ["tramadol", "opioid"],
    severity: "moderate",
    note: "Morphine allergy: caution with all opioids including tramadol. Cross-reactivity varies by opioid class.",
  },
  {
    allergen: "iodine",
    avoidDrugKeys: [],
    severity: "minor",
    note: "Iodine allergy: note for contrast media procedures. Not directly drug-related but clinically important.",
  },
  {
    allergen: "macrolide",
    avoidDrugKeys: ["azithromycin", "macrolide"],
    severity: "major",
    note: "Macrolide allergy: avoid azithromycin and other macrolides.",
  },
  {
    allergen: "fluoroquinolone",
    avoidDrugKeys: ["ciprofloxacin", "fluoroquinolone"],
    severity: "major",
    note: "Fluoroquinolone allergy: avoid ciprofloxacin and other fluoroquinolones.",
  },
];

// ---------------------------------------------------------------------------
// DUPLICATE THERAPY DETECTION RULES
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} DuplicateTherapyRule
 * @property {string} class - Drug class to check
 * @property {string} subclass - More specific subclass (optional)
 * @property {string} note - Clinical note about duplicate therapy
 */

/** @type {DuplicateTherapyRule[]} */
const DUPLICATE_THERAPY_RULES = [
  { class: "antihypertensive", subclass: "calcium channel blocker", note: "Two calcium channel blockers prescribed. Risk of excessive hypotension and peripheral oedema. Usually not indicated." },
  { class: "antihypertensive", subclass: "ACE inhibitor", note: "Two ACE inhibitors prescribed. Duplicate therapy — no additional benefit, increased side effect risk." },
  { class: "antihypertensive", subclass: "ARB", note: "Two ARBs prescribed. Duplicate therapy — no additional benefit, increased hyperkalemia risk." },
  { class: "antihypertensive", subclass: "beta-blocker", note: "Two beta-blockers prescribed. Risk of severe bradycardia and heart block." },
  { class: "antiplatelet", subclass: null, note: "Multiple antiplatelets prescribed. Ensure dual antiplatelet therapy (DAPT) is indicated (e.g., post-stent). Increases bleeding risk." },
  { class: "anxiolytic", subclass: "benzodiazepine", note: "Multiple benzodiazepines prescribed. High risk of excessive sedation, falls, and dependence. Strongly discouraged." },
  { class: "antidiabetic", subclass: "sulfonylurea", note: "Two sulfonylureas prescribed. Duplicate therapy — increases hypoglycemia risk without added benefit." },
  { class: "lipid-lowering", subclass: "statin", note: "Two statins prescribed. Duplicate therapy — use one statin at appropriate dose. Increased myopathy risk." },
  { class: "antacid", subclass: "proton pump inhibitor", note: "Two PPIs prescribed. Duplicate therapy — no additional benefit." },
  { class: "analgesic", subclass: "NSAID", note: "Two NSAIDs prescribed. Increased GI bleeding and renal toxicity risk without added analgesic benefit." },
  { class: "anticoagulant", subclass: null, note: "Two anticoagulants prescribed. Major bleeding risk. Review indication — typically only one anticoagulant should be used." },
  { class: "sedative", subclass: null, note: "Multiple sedative/hypnotics prescribed. Excessive CNS depression risk. Review and consolidate." },
  { class: "corticosteroid", subclass: null, note: "Multiple systemic corticosteroids prescribed. Review for duplicate therapy." },
  { class: "diuretic", subclass: "loop diuretic", note: "Two loop diuretics prescribed. Duplicate therapy — increased electrolyte derangement risk." },
];

// ---------------------------------------------------------------------------
// HELPER: DRUG NAME NORMALIZATION
// ---------------------------------------------------------------------------

/**
 * Normalize a drug name: lowercase, strip dose info, resolve brand to generic.
 *
 * @param {string} rawName - Raw drug name as entered (e.g., "Metformin 500mg", "Syndopa Plus")
 * @returns {string} Normalized generic drug name
 *
 * @example
 * normalizeDrugName("Metformin 500mg")  // "metformin"
 * normalizeDrugName("Syndopa Plus")     // "levodopa"
 * normalizeDrugName("Ecosprin 75")      // "aspirin"
 * normalizeDrugName("DOLO 650")         // "paracetamol"
 */
function normalizeDrugName(rawName) {
  if (!rawName || typeof rawName !== "string") return "";

  // Lowercase and trim
  let name = rawName.toLowerCase().trim();

  // Remove dosage info: numbers followed by units
  name = name.replace(/\d+\s*(mg|mcg|ml|iu|units?|%)\b/gi, "").trim();

  // Remove trailing numbers (e.g., "Dolo 650" → "dolo")
  name = name.replace(/\s+\d+\s*$/, "").trim();

  // Remove common suffixes like "SR", "XL", "CR", "OD", "ER", "tablets", "capsules"
  name = name.replace(/\b(sr|xl|cr|od|er|mr|la|tablets?|capsules?|injection|syrup|drops|inhaler|suspension)\b/gi, "").trim();

  // Remove extra whitespace
  name = name.replace(/\s+/g, " ").trim();

  // Check brand-to-generic mapping
  if (BRAND_TO_GENERIC[name]) {
    return BRAND_TO_GENERIC[name];
  }

  // Partial brand match: check if name starts with any known brand
  for (const [brand, generic] of Object.entries(BRAND_TO_GENERIC)) {
    if (name.startsWith(brand) || brand.startsWith(name)) {
      return generic;
    }
  }

  // Check if it directly matches a key in DRUG_DATABASE
  if (DRUG_DATABASE[name]) {
    return name;
  }

  // Fuzzy: check if name is contained in any drug database key or vice versa
  for (const key of Object.keys(DRUG_DATABASE)) {
    if (name.includes(key) || key.includes(name)) {
      return key;
    }
  }

  return name;
}

/**
 * Get all matching drug keys and class keys for a normalized drug name.
 * Returns interaction keys from the drug database entry.
 *
 * @param {string} normalizedName - Normalized generic drug name
 * @returns {string[]} Array of interaction keys
 */
function getDrugInteractionKeys(normalizedName) {
  const entry = DRUG_DATABASE[normalizedName];
  if (entry) {
    return [...entry.interactionKeys];
  }

  // Handle combination drugs (e.g., "metformin + glimepiride")
  if (normalizedName.includes("+")) {
    const parts = normalizedName.split("+").map((p) => p.trim());
    const keys = [];
    for (const part of parts) {
      const partEntry = DRUG_DATABASE[part];
      if (partEntry) {
        keys.push(...partEntry.interactionKeys);
      }
    }
    return keys;
  }

  return [normalizedName];
}

/**
 * Get the DrugEntry for a normalized drug name, including resolution
 * of combination drugs.
 *
 * @param {string} normalizedName
 * @returns {DrugEntry[]} Array of matching drug entries
 */
function resolveDrugEntries(normalizedName) {
  const entry = DRUG_DATABASE[normalizedName];
  if (entry) return [entry];

  if (normalizedName.includes("+")) {
    const parts = normalizedName.split("+").map((p) => p.trim());
    const entries = [];
    for (const part of parts) {
      if (DRUG_DATABASE[part]) entries.push(DRUG_DATABASE[part]);
    }
    return entries;
  }

  return [];
}

// ---------------------------------------------------------------------------
// MAIN: checkInteractions
// ---------------------------------------------------------------------------

/**
 * Check a list of medications for drug-drug interactions, allergy alerts,
 * condition-based warnings, and duplicate therapy.
 */

// ---------------------------------------------------------------------------
// CYP450 METABOLIC INTERACTION ENGINE
// Catches pharmacokinetic interactions that direct rule lookup misses.
// Based on FDA Table of Substrates, Inhibitors, and Inducers.
// ---------------------------------------------------------------------------

/**
 * CYP450 enzyme profiles for drugs.
 * substrate: drug is metabolized by this enzyme (levels INCREASE if enzyme inhibited)
 * inhibitor: drug BLOCKS this enzyme (raises levels of substrates)
 * inducer: drug SPEEDS UP this enzyme (lowers levels of substrates)
 */
const CYP_PROFILES = {
  // --- CYP3A4 (most important, metabolizes ~50% of drugs) ---
  simvastatin:   { substrate: ["3A4"], inhibitor: [], inducer: [] },
  lovastatin:    { substrate: ["3A4"], inhibitor: [], inducer: [] },
  atorvastatin:  { substrate: ["3A4"], inhibitor: [], inducer: [] },
  midazolam:     { substrate: ["3A4"], inhibitor: [], inducer: [] },
  alprazolam:    { substrate: ["3A4"], inhibitor: [], inducer: [] },
  triazolam:     { substrate: ["3A4"], inhibitor: [], inducer: [] },
  nifedipine:    { substrate: ["3A4"], inhibitor: [], inducer: [] },
  amlodipine:    { substrate: ["3A4"], inhibitor: [], inducer: [] },
  felodipine:    { substrate: ["3A4"], inhibitor: [], inducer: [] },
  cyclosporine:  { substrate: ["3A4"], inhibitor: [], inducer: [] },
  tacrolimus:    { substrate: ["3A4"], inhibitor: [], inducer: [] },
  sildenafil:    { substrate: ["3A4"], inhibitor: [], inducer: [] },
  apixaban:      { substrate: ["3A4"], inhibitor: [], inducer: [] },
  rivaroxaban:   { substrate: ["3A4"], inhibitor: [], inducer: [] },
  quetiapine:    { substrate: ["3A4"], inhibitor: [], inducer: [] },
  fentanyl:      { substrate: ["3A4"], inhibitor: [], inducer: [] },
  budesonide:    { substrate: ["3A4"], inhibitor: [], inducer: [] },
  dexamethasone: { substrate: ["3A4"], inhibitor: [], inducer: ["3A4"] },

  fluconazole:   { substrate: [], inhibitor: ["3A4", "2C9", "2C19"], inducer: [] },
  itraconazole:  { substrate: [], inhibitor: ["3A4"], inducer: [] },
  ketoconazole:  { substrate: [], inhibitor: ["3A4"], inducer: [] },
  voriconazole:  { substrate: ["2C19"], inhibitor: ["3A4", "2C19"], inducer: [] },
  erythromycin:  { substrate: ["3A4"], inhibitor: ["3A4"], inducer: [] },
  clarithromycin:{ substrate: ["3A4"], inhibitor: ["3A4"], inducer: [] },
  azithromycin:  { substrate: [], inhibitor: [], inducer: [] }, // minimal CYP
  diltiazem:     { substrate: ["3A4"], inhibitor: ["3A4"], inducer: [] },
  verapamil:     { substrate: ["3A4"], inhibitor: ["3A4"], inducer: [] },
  amiodarone:    { substrate: ["3A4"], inhibitor: ["3A4", "2C9", "2D6"], inducer: [] },
  ritonavir:     { substrate: ["3A4"], inhibitor: ["3A4", "2D6"], inducer: [] },

  rifampicin:    { substrate: [], inhibitor: [], inducer: ["3A4", "2C9", "2C19", "1A2"] },
  rifampin:      { substrate: [], inhibitor: [], inducer: ["3A4", "2C9", "2C19", "1A2"] },
  carbamazepine: { substrate: ["3A4"], inhibitor: [], inducer: ["3A4", "2C9"] },
  phenytoin:     { substrate: ["2C9", "2C19"], inhibitor: [], inducer: ["3A4"] },
  phenobarbital: { substrate: ["2C9"], inhibitor: [], inducer: ["3A4", "2C9"] },
  "st john's wort": { substrate: [], inhibitor: [], inducer: ["3A4", "2C9"] },

  // --- CYP2D6 ---
  codeine:       { substrate: ["2D6"], inhibitor: [], inducer: [] },
  tramadol:      { substrate: ["2D6", "3A4"], inhibitor: [], inducer: [] },
  metoprolol:    { substrate: ["2D6"], inhibitor: [], inducer: [] },
  propranolol:   { substrate: ["2D6", "1A2"], inhibitor: [], inducer: [] },
  carvedilol:    { substrate: ["2D6"], inhibitor: [], inducer: [] },
  haloperidol:   { substrate: ["2D6"], inhibitor: [], inducer: [] },
  risperidone:   { substrate: ["2D6"], inhibitor: [], inducer: [] },
  tamoxifen:     { substrate: ["2D6"], inhibitor: [], inducer: [] },

  fluoxetine:    { substrate: ["2D6"], inhibitor: ["2D6", "2C19"], inducer: [] },
  paroxetine:    { substrate: ["2D6"], inhibitor: ["2D6"], inducer: [] },
  bupropion:     { substrate: [], inhibitor: ["2D6"], inducer: [] },
  duloxetine:    { substrate: ["2D6", "1A2"], inhibitor: ["2D6"], inducer: [] },
  sertraline:    { substrate: [], inhibitor: ["2D6"], inducer: [] },

  // --- CYP2C9 ---
  warfarin:      { substrate: ["2C9", "3A4"], inhibitor: [], inducer: [] },
  glipizide:     { substrate: ["2C9"], inhibitor: [], inducer: [] },
  glimepiride:   { substrate: ["2C9"], inhibitor: [], inducer: [] },
  losartan:      { substrate: ["2C9"], inhibitor: [], inducer: [] },
  irbesartan:    { substrate: ["2C9"], inhibitor: [], inducer: [] },
  diclofenac:    { substrate: ["2C9"], inhibitor: [], inducer: [] },
  ibuprofen:     { substrate: ["2C9"], inhibitor: [], inducer: [] },
  celecoxib:     { substrate: ["2C9"], inhibitor: [], inducer: [] },

  // --- CYP2C19 ---
  omeprazole:    { substrate: ["2C19"], inhibitor: ["2C19"], inducer: [] },
  esomeprazole:  { substrate: ["2C19"], inhibitor: ["2C19"], inducer: [] },
  pantoprazole:  { substrate: ["2C19"], inhibitor: [], inducer: [] }, // weak
  clopidogrel:   { substrate: ["2C19"], inhibitor: [], inducer: [] }, // prodrug activation
  diazepam:      { substrate: ["2C19", "3A4"], inhibitor: [], inducer: [] },
  citalopram:    { substrate: ["2C19"], inhibitor: [], inducer: [] },
  escitalopram:  { substrate: ["2C19"], inhibitor: [], inducer: [] },

  // --- CYP1A2 ---
  theophylline:  { substrate: ["1A2"], inhibitor: [], inducer: [] },
  caffeine:      { substrate: ["1A2"], inhibitor: [], inducer: [] },
  clozapine:     { substrate: ["1A2"], inhibitor: [], inducer: [] },
  olanzapine:    { substrate: ["1A2"], inhibitor: [], inducer: [] },
  tizanidine:    { substrate: ["1A2"], inhibitor: [], inducer: [] },

  ciprofloxacin: { substrate: [], inhibitor: ["1A2", "3A4"], inducer: [] },
  fluvoxamine:   { substrate: [], inhibitor: ["1A2", "2C19"], inducer: [] },

  // --- Drugs with no significant CYP interaction ---
  metformin:     { substrate: [], inhibitor: [], inducer: [] }, // renally cleared
  lisinopril:    { substrate: [], inhibitor: [], inducer: [] },
  ramipril:      { substrate: [], inhibitor: [], inducer: [] },
  enalapril:     { substrate: [], inhibitor: [], inducer: [] },
  hydrochlorothiazide: { substrate: [], inhibitor: [], inducer: [] },
  furosemide:    { substrate: [], inhibitor: [], inducer: [] },
  spironolactone:{ substrate: [], inhibitor: [], inducer: [] },
  paracetamol:   { substrate: [], inhibitor: [], inducer: [] }, // mostly glucuronidation
  insulin:       { substrate: [], inhibitor: [], inducer: [] },
  levothyroxine: { substrate: [], inhibitor: [], inducer: [] },
};

// ---------------------------------------------------------------------------
// DRUG TRANSPORTER PROFILES (Pass 3)
// P-glycoprotein (P-gp/MDR1), OATP1B1, OATP1B3, BCRP
// Based on FDA Transporter-Mediated DDI Guidance (2020)
// ---------------------------------------------------------------------------

/**
 * Transporter roles:
 * - P-gp (intestinal/renal): pumps drugs OUT of cells. Inhibition → drug accumulates (toxicity).
 *   Induction → drug expelled faster (therapeutic failure).
 * - OATP1B1/1B3 (hepatic uptake): transports drugs INTO liver for metabolism/excretion.
 *   Inhibition → drug stays in blood (systemic toxicity).
 *   Induction → drug cleared faster (reduced effect).
 * - BCRP (breast cancer resistance protein): similar to P-gp, efflux transporter.
 */
const TRANSPORTER_PROFILES = {
  // --- P-gp substrates (narrow therapeutic index drugs are critical) ---
  digoxin:       { pgp_substrate: true, oatp_substrate: false, pgp_inhibitor: false, pgp_inducer: false, oatp_inhibitor: false, oatp_inducer: false, narrowIndex: true },
  dabigatran:    { pgp_substrate: true, oatp_substrate: false, pgp_inhibitor: false, pgp_inducer: false, oatp_inhibitor: false, oatp_inducer: false, narrowIndex: true },
  colchicine:    { pgp_substrate: true, oatp_substrate: false, pgp_inhibitor: false, pgp_inducer: false, oatp_inhibitor: false, oatp_inducer: false, narrowIndex: true },
  tacrolimus:    { pgp_substrate: true, oatp_substrate: false, pgp_inhibitor: false, pgp_inducer: false, oatp_inhibitor: false, oatp_inducer: false, narrowIndex: true },
  cyclosporine:  { pgp_substrate: true, oatp_substrate: false, pgp_inhibitor: true, pgp_inducer: false, oatp_inhibitor: true, oatp_inducer: false, narrowIndex: true },
  fexofenadine:  { pgp_substrate: true, oatp_substrate: false, pgp_inhibitor: false, pgp_inducer: false, oatp_inhibitor: false, oatp_inducer: false, narrowIndex: false },
  loperamide:    { pgp_substrate: true, oatp_substrate: false, pgp_inhibitor: false, pgp_inducer: false, oatp_inhibitor: false, oatp_inducer: false, narrowIndex: false },
  apixaban:      { pgp_substrate: true, oatp_substrate: false, pgp_inhibitor: false, pgp_inducer: false, oatp_inhibitor: false, oatp_inducer: false, narrowIndex: false },
  rivaroxaban:   { pgp_substrate: true, oatp_substrate: false, pgp_inhibitor: false, pgp_inducer: false, oatp_inhibitor: false, oatp_inducer: false, narrowIndex: false },
  edoxaban:      { pgp_substrate: true, oatp_substrate: false, pgp_inhibitor: false, pgp_inducer: false, oatp_inhibitor: false, oatp_inducer: false, narrowIndex: false },

  // --- OATP substrates (statins are the classic example) ---
  rosuvastatin:  { pgp_substrate: false, oatp_substrate: true, pgp_inhibitor: false, pgp_inducer: false, oatp_inhibitor: false, oatp_inducer: false, narrowIndex: false },
  atorvastatin:  { pgp_substrate: false, oatp_substrate: true, pgp_inhibitor: false, pgp_inducer: false, oatp_inhibitor: false, oatp_inducer: false, narrowIndex: false },
  simvastatin:   { pgp_substrate: false, oatp_substrate: true, pgp_inhibitor: false, pgp_inducer: false, oatp_inhibitor: false, oatp_inducer: false, narrowIndex: false },
  pravastatin:   { pgp_substrate: false, oatp_substrate: true, pgp_inhibitor: false, pgp_inducer: false, oatp_inhibitor: false, oatp_inducer: false, narrowIndex: false },
  pitavastatin:  { pgp_substrate: false, oatp_substrate: true, pgp_inhibitor: false, pgp_inducer: false, oatp_inhibitor: false, oatp_inducer: false, narrowIndex: false },
  methotrexate:  { pgp_substrate: true, oatp_substrate: true, pgp_inhibitor: false, pgp_inducer: false, oatp_inhibitor: false, oatp_inducer: false, narrowIndex: true },
  repaglinide:   { pgp_substrate: false, oatp_substrate: true, pgp_inhibitor: false, pgp_inducer: false, oatp_inhibitor: false, oatp_inducer: false, narrowIndex: false },
  valsartan:     { pgp_substrate: false, oatp_substrate: true, pgp_inhibitor: false, pgp_inducer: false, oatp_inhibitor: false, oatp_inducer: false, narrowIndex: false },
  olmesartan:    { pgp_substrate: false, oatp_substrate: true, pgp_inhibitor: false, pgp_inducer: false, oatp_inhibitor: false, oatp_inducer: false, narrowIndex: false },

  // --- P-gp INHIBITORS (increase substrate levels) ---
  amiodarone:    { pgp_substrate: false, oatp_substrate: false, pgp_inhibitor: true, pgp_inducer: false, oatp_inhibitor: false, oatp_inducer: false, narrowIndex: false },
  verapamil:     { pgp_substrate: false, oatp_substrate: false, pgp_inhibitor: true, pgp_inducer: false, oatp_inhibitor: false, oatp_inducer: false, narrowIndex: false },
  diltiazem:     { pgp_substrate: false, oatp_substrate: false, pgp_inhibitor: true, pgp_inducer: false, oatp_inhibitor: false, oatp_inducer: false, narrowIndex: false },
  clarithromycin:{ pgp_substrate: false, oatp_substrate: false, pgp_inhibitor: true, pgp_inducer: false, oatp_inhibitor: true, oatp_inducer: false, narrowIndex: false },
  erythromycin:  { pgp_substrate: false, oatp_substrate: false, pgp_inhibitor: true, pgp_inducer: false, oatp_inhibitor: false, oatp_inducer: false, narrowIndex: false },
  itraconazole:  { pgp_substrate: false, oatp_substrate: false, pgp_inhibitor: true, pgp_inducer: false, oatp_inhibitor: false, oatp_inducer: false, narrowIndex: false },
  ketoconazole:  { pgp_substrate: false, oatp_substrate: false, pgp_inhibitor: true, pgp_inducer: false, oatp_inhibitor: false, oatp_inducer: false, narrowIndex: false },
  ritonavir:     { pgp_substrate: false, oatp_substrate: false, pgp_inhibitor: true, pgp_inducer: false, oatp_inhibitor: true, oatp_inducer: false, narrowIndex: false },
  quinidine:     { pgp_substrate: false, oatp_substrate: false, pgp_inhibitor: true, pgp_inducer: false, oatp_inhibitor: false, oatp_inducer: false, narrowIndex: false },
  ranolazine:    { pgp_substrate: false, oatp_substrate: false, pgp_inhibitor: true, pgp_inducer: false, oatp_inhibitor: false, oatp_inducer: false, narrowIndex: false },
  dronedarone:   { pgp_substrate: false, oatp_substrate: false, pgp_inhibitor: true, pgp_inducer: false, oatp_inhibitor: false, oatp_inducer: false, narrowIndex: false },

  // --- P-gp INDUCERS (decrease substrate levels) ---
  rifampicin:    { pgp_substrate: false, oatp_substrate: false, pgp_inhibitor: false, pgp_inducer: true, oatp_inhibitor: false, oatp_inducer: true, narrowIndex: false },
  rifampin:      { pgp_substrate: false, oatp_substrate: false, pgp_inhibitor: false, pgp_inducer: true, oatp_inhibitor: false, oatp_inducer: true, narrowIndex: false },
  carbamazepine: { pgp_substrate: false, oatp_substrate: false, pgp_inhibitor: false, pgp_inducer: true, oatp_inhibitor: false, oatp_inducer: false, narrowIndex: false },
  phenytoin:     { pgp_substrate: false, oatp_substrate: false, pgp_inhibitor: false, pgp_inducer: true, oatp_inhibitor: false, oatp_inducer: false, narrowIndex: false },
  "st john's wort": { pgp_substrate: false, oatp_substrate: false, pgp_inhibitor: false, pgp_inducer: true, oatp_inhibitor: false, oatp_inducer: false, narrowIndex: false },
  tipranavir:    { pgp_substrate: false, oatp_substrate: false, pgp_inhibitor: false, pgp_inducer: true, oatp_inhibitor: false, oatp_inducer: false, narrowIndex: false },

  // --- OATP INHIBITORS (increase statin levels — rhabdomyolysis risk) ---
  gemfibrozil:   { pgp_substrate: false, oatp_substrate: false, pgp_inhibitor: false, pgp_inducer: false, oatp_inhibitor: true, oatp_inducer: false, narrowIndex: false },
  eltrombopag:   { pgp_substrate: false, oatp_substrate: false, pgp_inhibitor: false, pgp_inducer: false, oatp_inhibitor: true, oatp_inducer: false, narrowIndex: false },
};

/**
 * Check transporter-mediated drug interactions (Pass 3).
 * Catches P-gp and OATP interactions missed by CYP450 logic.
 */
function checkTransporterInteraction(drugA, drugB) {
  const tA = TRANSPORTER_PROFILES[drugA];
  const tB = TRANSPORTER_PROFILES[drugB];
  if (!tA && !tB) return [];

  const hits = [];

  // Helper to generate hit
  const addHit = (perpetrator, victim, transporter, effect, victimNarrow) => {
    const severity = victimNarrow ? "major" : "moderate";
    if (effect === "inhibition") {
      hits.push({
        severity,
        description: `${perpetrator} inhibits ${transporter}. ${victim} is a ${transporter} substrate. Inhibition will increase ${victim} plasma levels${victimNarrow ? " — NARROW THERAPEUTIC INDEX drug, high toxicity risk" : ""}.`,
        recommendation: victimNarrow
          ? `Reduce ${victim} dose by 50% or avoid combination. Monitor ${victim} levels closely (target trough levels). Watch for toxicity signs.`
          : `Monitor for ${victim} side effects. Consider dose reduction.`,
        mechanism: `Transporter-mediated: ${perpetrator} inhibits ${transporter} → reduced ${victim} efflux/clearance → elevated systemic levels.`,
      });
    } else if (effect === "induction") {
      hits.push({
        severity: victimNarrow ? "major" : "moderate",
        description: `${perpetrator} induces ${transporter}. ${victim} is a ${transporter} substrate. Induction will decrease ${victim} plasma levels${victimNarrow ? " — NARROW THERAPEUTIC INDEX drug, risk of therapeutic failure" : ""}.`,
        recommendation: victimNarrow
          ? `${victim} dose may need significant increase. Monitor levels closely. Consider alternative therapy during ${perpetrator} treatment.`
          : `Monitor therapeutic response. May need ${victim} dose increase.`,
        mechanism: `Transporter-mediated: ${perpetrator} induces ${transporter} → increased ${victim} efflux/clearance → reduced plasma levels.`,
      });
    }
  };

  // A affects B via P-gp
  if (tA && tB) {
    if (tA.pgp_inhibitor && tB.pgp_substrate) addHit(drugA, drugB, "P-glycoprotein (P-gp)", "inhibition", tB.narrowIndex);
    if (tA.pgp_inducer && tB.pgp_substrate)  addHit(drugA, drugB, "P-glycoprotein (P-gp)", "induction", tB.narrowIndex);
    if (tB.pgp_inhibitor && tA.pgp_substrate) addHit(drugB, drugA, "P-glycoprotein (P-gp)", "inhibition", tA.narrowIndex);
    if (tB.pgp_inducer && tA.pgp_substrate)  addHit(drugB, drugA, "P-glycoprotein (P-gp)", "induction", tA.narrowIndex);

    // A affects B via OATP
    if (tA.oatp_inhibitor && tB.oatp_substrate) addHit(drugA, drugB, "OATP1B1/1B3", "inhibition", tB.narrowIndex);
    if (tA.oatp_inducer && tB.oatp_substrate)  addHit(drugA, drugB, "OATP1B1/1B3", "induction", tB.narrowIndex);
    if (tB.oatp_inhibitor && tA.oatp_substrate) addHit(drugB, drugA, "OATP1B1/1B3", "inhibition", tA.narrowIndex);
    if (tB.oatp_inducer && tA.oatp_substrate)  addHit(drugB, drugA, "OATP1B1/1B3", "induction", tA.narrowIndex);
  }

  // SPECIAL: Opposing forces detection
  // If drug A induces P-gp and drug C inhibits P-gp, and drug B is substrate → unpredictable
  // This is handled at the checkInteractions level by detecting contradicting hits

  return hits;
}

const ENZYME_NAMES = {
  "3A4": "CYP3A4",
  "2D6": "CYP2D6",
  "2C9": "CYP2C9",
  "2C19": "CYP2C19",
  "1A2": "CYP1A2",
};

/**
 * Check CYP450 metabolic interactions between two drugs.
 * Returns array of interaction objects if found.
 */
function checkCYP450Interaction(drugA, drugB) {
  const profileA = CYP_PROFILES[drugA];
  const profileB = CYP_PROFILES[drugB];
  if (!profileA || !profileB) return [];

  const hits = [];

  // Strong inducers/inhibitors that warrant MAJOR severity regardless of enzyme
  const STRONG_INDUCERS = ["rifampicin", "rifampin", "carbamazepine", "phenytoin", "phenobarbital", "st john's wort"];
  const STRONG_INHIBITORS = ["ketoconazole", "itraconazole", "ritonavir", "clarithromycin", "fluconazole", "voriconazole"];

  // Check: A inhibits enzyme that metabolizes B
  for (const enzyme of profileA.inhibitor) {
    if (profileB.substrate.includes(enzyme)) {
      const enzName = ENZYME_NAMES[enzyme] || `CYP${enzyme}`;
      const isStrong = STRONG_INHIBITORS.includes(drugA);
      const severity = isStrong || enzyme === "3A4" || enzyme === "2D6" ? "major" : "moderate";
      hits.push({
        severity,
        description: `${drugA} is a ${isStrong ? "potent " : ""}${enzName} inhibitor. ${drugB} is metabolized by ${enzName}. Inhibition will ${isStrong ? "significantly " : ""}increase ${drugB} plasma levels, risking toxicity.`,
        recommendation: isStrong
          ? `Avoid combination if possible. ${drugB} levels may increase 2-5x. Use alternative not metabolized by ${enzName}, or reduce ${drugB} dose significantly with close monitoring.`
          : `Monitor for ${drugB} toxicity. Consider dose reduction or alternative drug not metabolized by ${enzName}.`,
        mechanism: `Pharmacokinetic: ${drugA} ${isStrong ? "strongly " : ""}inhibits ${enzName} → decreased ${drugB} clearance → elevated plasma concentration${isStrong ? " (can increase AUC 2-5x)" : ""}.`,
      });
    }
  }

  // Check: B inhibits enzyme that metabolizes A
  for (const enzyme of profileB.inhibitor) {
    if (profileA.substrate.includes(enzyme)) {
      const enzName = ENZYME_NAMES[enzyme] || `CYP${enzyme}`;
      const isStrong = STRONG_INHIBITORS.includes(drugB);
      const severity = isStrong || enzyme === "3A4" || enzyme === "2D6" ? "major" : "moderate";
      hits.push({
        severity,
        description: `${drugB} is a ${isStrong ? "potent " : ""}${enzName} inhibitor. ${drugA} is metabolized by ${enzName}. Inhibition will ${isStrong ? "significantly " : ""}increase ${drugA} plasma levels, risking toxicity.`,
        recommendation: isStrong
          ? `Avoid combination if possible. ${drugA} levels may increase 2-5x. Use alternative not metabolized by ${enzName}, or reduce ${drugA} dose significantly with close monitoring.`
          : `Monitor for ${drugA} toxicity. Consider dose reduction or alternative drug not metabolized by ${enzName}.`,
        mechanism: `Pharmacokinetic: ${drugB} ${isStrong ? "strongly " : ""}inhibits ${enzName} → decreased ${drugA} clearance → elevated plasma concentration${isStrong ? " (can increase AUC 2-5x)" : ""}.`,
      });
    }
  }

  // Check: A induces enzyme that metabolizes B (reduces B's effect)
  for (const enzyme of profileA.inducer) {
    if (profileB.substrate.includes(enzyme)) {
      const enzName = ENZYME_NAMES[enzyme] || `CYP${enzyme}`;
      const isStrong = STRONG_INDUCERS.includes(drugA);
      hits.push({
        severity: isStrong ? "major" : "moderate",
        description: `${drugA} is a ${isStrong ? "potent" : ""} ${enzName} inducer. ${drugB} is metabolized by ${enzName}. Induction will ${isStrong ? "significantly" : ""} decrease ${drugB} plasma levels, ${isStrong ? "potentially causing therapeutic failure" : "reducing its effectiveness"}.`,
        recommendation: isStrong
          ? `Avoid combination if possible. ${drugB} levels may drop by 50-80%. Use alternative not metabolized by ${enzName}, or significantly increase ${drugB} dose with close monitoring.`
          : `May need increased ${drugB} dose. Monitor therapeutic response. Consider alternative not metabolized by ${enzName}.`,
        mechanism: `Pharmacokinetic: ${drugA} ${isStrong ? "strongly " : ""}induces ${enzName} → increased ${drugB} metabolism → reduced plasma concentration${isStrong ? " (can reduce AUC by >50%)" : ""}.`,
      });
    }
  }

  // Check: B induces enzyme that metabolizes A
  for (const enzyme of profileB.inducer) {
    if (profileA.substrate.includes(enzyme)) {
      const enzName = ENZYME_NAMES[enzyme] || `CYP${enzyme}`;
      const isStrong = STRONG_INDUCERS.includes(drugB);
      hits.push({
        severity: isStrong ? "major" : "moderate",
        description: `${drugB} is a ${isStrong ? "potent" : ""} ${enzName} inducer. ${drugA} is metabolized by ${enzName}. Induction will ${isStrong ? "significantly" : ""} decrease ${drugA} plasma levels, ${isStrong ? "potentially causing therapeutic failure" : "reducing its effectiveness"}.`,
        recommendation: isStrong
          ? `Avoid combination if possible. ${drugA} levels may drop by 50-80%. Use alternative not metabolized by ${enzName}, or significantly increase ${drugA} dose with close monitoring.`
          : `May need increased ${drugA} dose. Monitor therapeutic response. Consider alternative not metabolized by ${enzName}.`,
        mechanism: `Pharmacokinetic: ${drugB} ${isStrong ? "strongly " : ""}induces ${enzName} → increased ${drugA} metabolism → reduced plasma concentration${isStrong ? " (can reduce AUC by >50%)" : ""}.`,
      });
    }
  }

  return hits;
}

/**
 * @param {Array<{name: string, dose?: string, frequency?: string}>} medications
 *   List of prescribed medications. Each must have at least a `name` property.
 * @param {Object} [patientData={}] Optional patient context.
 * @param {number} [patientData.age] Patient's age in years.
 * @param {string[]} [patientData.conditions] Active medical conditions (e.g., ["diabetes", "kidney disease"]).
 * @param {string[]} [patientData.allergies] Known drug allergies (e.g., ["penicillin", "sulfa"]).
 * @param {Array<{name: string}>} [patientData.currentMeds] Current medications not in the new list.
 * @returns {{
 *   interactions: Array<{drug1: string, drug2: string, severity: string, description: string, recommendation: string, mechanism: string}>,
 *   allergyAlerts: Array<{drug: string, allergen: string, severity: string, note: string}>,
 *   conditionWarnings: Array<{drug: string, condition: string, severity: string, note: string}>,
 *   duplicateTherapy: Array<{drug1: string, drug2: string, class: string, note: string}>,
 *   overallRisk: "safe"|"caution"|"high-risk",
 *   summary: string
 * }}
 */
function checkInteractions(medications, patientData = {}) {
  if (!Array.isArray(medications) || medications.length === 0) {
    return {
      interactions: [],
      allergyAlerts: [],
      conditionWarnings: [],
      duplicateTherapy: [],
      overallRisk: "safe",
      summary: "No medications provided for interaction checking.",
    };
  }

  const { age, conditions = [], allergies = [], currentMeds = [] } = patientData;

  // Combine prescribed medications with current medications
  const allMeds = [
    ...medications.map((m) => ({ ...m, source: "prescribed" })),
    ...currentMeds.map((m) => ({ ...m, source: "current" })),
  ];

  // Normalize all drug names and collect interaction keys
  const normalizedMeds = allMeds.map((med) => {
    const normalized = normalizeDrugName(med.name);
    const keys = getDrugInteractionKeys(normalized);
    const entries = resolveDrugEntries(normalized);
    return {
      original: med.name,
      normalized,
      keys,
      entries,
      source: med.source,
    };
  });

  // Normalize conditions
  const normalizedConditions = conditions.map((c) => c.toLowerCase().trim());

  // Add "elderly" condition if age >= 65
  if (age && age >= 65 && !normalizedConditions.includes("elderly")) {
    normalizedConditions.push("elderly");
  }

  // Normalize allergies
  const normalizedAllergies = allergies.map((a) => a.toLowerCase().trim());

  // Check for unrecognized drugs — CRITICAL safety check
  // A drug is "recognized" if it exists in DRUG_DATABASE, CYP_PROFILES, or TRANSPORTER_PROFILES
  const unrecognizedDrugs = normalizedMeds.filter(m => {
    const inDrugDB = !!DRUG_DATABASE[m.normalized];
    const inCYP = !!CYP_PROFILES[m.normalized];
    const inTransport = !!TRANSPORTER_PROFILES[m.normalized];
    // Check if brand was resolved to a known generic
    const resolved = BRAND_TO_GENERIC[m.normalized];
    const resolvedKnown = resolved && (!!DRUG_DATABASE[resolved] || !!CYP_PROFILES[resolved] || !!TRANSPORTER_PROFILES[resolved]);
    return !inDrugDB && !inCYP && !inTransport && !resolvedKnown;
  });

  const interactions = [];
  const allergyAlerts = [];
  const conditionWarnings = [];
  const duplicateTherapy = [];

  // --- 1) DRUG-DRUG INTERACTIONS ---
  // Check each pair of medications
  for (let i = 0; i < normalizedMeds.length; i++) {
    for (let j = i + 1; j < normalizedMeds.length; j++) {
      const medA = normalizedMeds[i];
      const medB = normalizedMeds[j];

      // Check every interaction rule
      for (const rule of INTERACTION_DB) {
        const [ruleKey1, ruleKey2] = rule.drugs;

        const aMatchesFirst = medA.keys.includes(ruleKey1);
        const aMatchesSecond = medA.keys.includes(ruleKey2);
        const bMatchesFirst = medB.keys.includes(ruleKey1);
        const bMatchesSecond = medB.keys.includes(ruleKey2);

        if ((aMatchesFirst && bMatchesSecond) || (aMatchesSecond && bMatchesFirst)) {
          // Avoid duplicate interaction entries
          const alreadyFound = interactions.some(
            (existing) =>
              (existing.drug1 === medA.original && existing.drug2 === medB.original && existing.description === rule.description) ||
              (existing.drug1 === medB.original && existing.drug2 === medA.original && existing.description === rule.description)
          );
          if (!alreadyFound) {
            interactions.push({
              drug1: medA.original,
              drug2: medB.original,
              severity: rule.severity,
              description: rule.description,
              recommendation: rule.recommendation,
              mechanism: rule.mechanism,
            });
          }
        }
      }
    }
  }

  // --- 1b) CYP450 METABOLIC INTERACTION CHECK ---
  // This catches pharmacokinetic interactions that rule-based lookup misses
  for (let i = 0; i < normalizedMeds.length; i++) {
    for (let j = i + 1; j < normalizedMeds.length; j++) {
      const medA = normalizedMeds[i];
      const medB = normalizedMeds[j];
      // Check if already found by rule-based engine
      const pairAlreadyFound = interactions.some(
        (x) => (x.drug1 === medA.original && x.drug2 === medB.original) || (x.drug1 === medB.original && x.drug2 === medA.original)
      );
      // Previously skipped pairs with existing Pass 1 interactions.
      // REMOVED per audit: CYP450 mechanism may be MORE severe than generic rule.
      // Example: Warfarin+Fluconazole — Pass 1 finds generic bleeding risk,
      // but Pass 2 CYP2C9 inhibition causes 2-3x warfarin level increase.
      // Deduplication now happens at display level, not engine level.

      const cypHits = checkCYP450Interaction(medA.normalized, medB.normalized);
      for (const hit of cypHits) {
        interactions.push({
          drug1: medA.original,
          drug2: medB.original,
          severity: hit.severity,
          description: hit.description,
          recommendation: hit.recommendation,
          mechanism: hit.mechanism,
        });
      }
    }
  }

  // --- 1c) TRANSPORTER-MEDIATED INTERACTION CHECK (P-gp, OATP) ---
  for (let i = 0; i < normalizedMeds.length; i++) {
    for (let j = i + 1; j < normalizedMeds.length; j++) {
      const medA = normalizedMeds[i];
      const medB = normalizedMeds[j];
      const transporterHits = checkTransporterInteraction(medA.normalized, medB.normalized);
      for (const hit of transporterHits) {
        const alreadyCovered = interactions.some(
          (x) => (x.drug1 === medA.original && x.drug2 === medB.original && x.mechanism === hit.mechanism) ||
                 (x.drug1 === medB.original && x.drug2 === medA.original && x.mechanism === hit.mechanism)
        );
        if (!alreadyCovered) {
          interactions.push({
            drug1: medA.original,
            drug2: medB.original,
            severity: hit.severity,
            description: hit.description,
            recommendation: hit.recommendation,
            mechanism: hit.mechanism,
          });
        }
      }
    }
  }

  // --- 1d) OPPOSING FORCES DETECTION ---
  // If drug X induces a transporter/enzyme AND drug Y inhibits the SAME one,
  // and drug Z is a substrate → levels become UNPREDICTABLE
  const inducers = new Map(); // transporter/enzyme → [drugName]
  const inhibitors = new Map();
  for (const med of normalizedMeds) {
    const tp = TRANSPORTER_PROFILES[med.normalized];
    if (tp) {
      if (tp.pgp_inducer) { if (!inducers.has("P-gp")) inducers.set("P-gp", []); inducers.get("P-gp").push(med.original); }
      if (tp.pgp_inhibitor) { if (!inhibitors.has("P-gp")) inhibitors.set("P-gp", []); inhibitors.get("P-gp").push(med.original); }
      if (tp.oatp_inducer) { if (!inducers.has("OATP")) inducers.set("OATP", []); inducers.get("OATP").push(med.original); }
      if (tp.oatp_inhibitor) { if (!inhibitors.has("OATP")) inhibitors.set("OATP", []); inhibitors.get("OATP").push(med.original); }
    }
    const cyp = CYP_PROFILES[med.normalized];
    if (cyp) {
      for (const e of cyp.inducer) { const k = `CYP${e}`; if (!inducers.has(k)) inducers.set(k, []); inducers.get(k).push(med.original); }
      for (const e of cyp.inhibitor) { const k = `CYP${e}`; if (!inhibitors.has(k)) inhibitors.set(k, []); inhibitors.get(k).push(med.original); }
    }
  }
  for (const [pathway, inds] of inducers) {
    const inhs = inhibitors.get(pathway);
    if (inhs && inhs.length > 0) {
      // Find substrates affected by this pathway
      const substrates = normalizedMeds.filter(m => {
        const tp = TRANSPORTER_PROFILES[m.normalized];
        const cyp = CYP_PROFILES[m.normalized];
        if (pathway === "P-gp" && tp?.pgp_substrate) return true;
        if (pathway === "OATP" && tp?.oatp_substrate) return true;
        if (pathway.startsWith("CYP") && cyp?.substrate.includes(pathway.replace("CYP", ""))) return true;
        return false;
      });
      for (const sub of substrates) {
        interactions.push({
          drug1: `${inds[0]} + ${inhs[0]}`,
          drug2: sub.original,
          severity: "major",
          description: `OPPOSING FORCES: ${inds[0]} INDUCES ${pathway} while ${inhs[0]} INHIBITS ${pathway}. ${sub.original} is a ${pathway} substrate. The net effect on ${sub.original} levels is UNPREDICTABLE and clinically dangerous.`,
          recommendation: `Avoid this three-drug combination. ${sub.original} levels cannot be reliably predicted. If unavoidable, monitor ${sub.original} levels very frequently and watch for both toxicity and therapeutic failure.`,
          mechanism: `${inds[0]} (inducer) and ${inhs[0]} (inhibitor) exert opposing effects on ${pathway}. The dominant effect depends on relative potency, timing, and dose — making ${sub.original} levels unpredictable.`,
        });
      }
    }
  }

  // --- 1e) PHARMACODYNAMIC SYNERGY CHECK (QT prolongation, CNS depression, bleeding, serotonin) ---
  const QT_PROLONGING = {
    amiodarone: { risk: "high", note: "Class III antiarrhythmic. QTc prolongation is dose-dependent. Half-life 40-55 days — effects persist weeks after discontinuation." },
    sotalol: { risk: "high", note: "Beta-blocker with Class III activity. High QT risk." },
    clarithromycin: { risk: "moderate", note: "Macrolide antibiotic. QT risk increases with dose and renal impairment." },
    erythromycin: { risk: "moderate", note: "Macrolide antibiotic with known QT prolongation risk." },
    azithromycin: { risk: "low", note: "Lower QT risk than other macrolides but still present." },
    ciprofloxacin: { risk: "moderate", note: "Fluoroquinolone with moderate QT prolongation risk." },
    levofloxacin: { risk: "moderate", note: "Fluoroquinolone. Avoid in patients with risk factors." },
    moxifloxacin: { risk: "high", note: "Highest QT risk among fluoroquinolones." },
    haloperidol: { risk: "high", note: "Antipsychotic. IV route has highest QT risk." },
    quetiapine: { risk: "moderate", note: "Atypical antipsychotic with moderate QT risk." },
    risperidone: { risk: "low", note: "Lower QT risk but still clinically relevant." },
    ondansetron: { risk: "moderate", note: "5-HT3 antagonist. Dose-dependent QT prolongation." },
    domperidone: { risk: "high", note: "Prokinetic agent. Banned in US (FDA) due to serious cardiac arrhythmias and sudden death. High QT prolongation risk — EMA recommends ≤30mg/day, max 7 days." },
    methadone: { risk: "high", note: "Opioid with significant QT prolongation at higher doses." },
    escitalopram: { risk: "moderate", note: "SSRI with dose-dependent QT prolongation. Max 20mg in elderly." },
    citalopram: { risk: "moderate", note: "SSRI. FDA max 20mg in elderly and CYP2C19 poor metabolizers." },
    fluconazole: { risk: "moderate", note: "Azole antifungal with QT prolongation risk at high doses." },
  };

  // Check QT prolongation synergy
  const qtDrugs = normalizedMeds.filter(m => QT_PROLONGING[m.normalized]);
  if (qtDrugs.length >= 2) {
    for (let i = 0; i < qtDrugs.length; i++) {
      for (let j = i + 1; j < qtDrugs.length; j++) {
        const a = qtDrugs[i], b = qtDrugs[j];
        const infoA = QT_PROLONGING[a.normalized], infoB = QT_PROLONGING[b.normalized];
        const combinedRisk = (infoA.risk === "high" || infoB.risk === "high") ? "major" : "moderate";
        const alreadyHas = interactions.some(x =>
          x.description.includes("QT") && ((x.drug1 === a.original && x.drug2 === b.original) || (x.drug1 === b.original && x.drug2 === a.original))
        );
        if (!alreadyHas) {
          let desc = `QT PROLONGATION SYNERGY: Both ${a.original} and ${b.original} independently prolong the QT interval. Combined use significantly increases risk of Torsades de Pointes (TdP), a life-threatening ventricular arrhythmia.`;
          if (a.normalized === "amiodarone" || b.normalized === "amiodarone") {
            desc += ` CRITICAL: Amiodarone has a half-life of 40-55 days. QT prolongation risk persists for WEEKS after discontinuation.`;
          }
          interactions.push({
            drug1: a.original,
            drug2: b.original,
            severity: combinedRisk,
            description: desc,
            recommendation: `Avoid combination if possible. If clinically necessary: obtain baseline ECG, monitor QTc closely (target <500ms), correct electrolytes (K⁺ >4.0, Mg²⁺ >2.0), and have defibrillator available. ${a.normalized === "amiodarone" || b.normalized === "amiodarone" ? "Amiodarone effects persist weeks — monitor QTc even after stopping." : ""}`,
            mechanism: `Pharmacodynamic synergy: Both drugs independently block cardiac hERG potassium channels (IKr), delaying ventricular repolarization. Combined effect is additive/synergistic, not merely additive. ${infoA.note} ${infoB.note}`,
          });
        }
      }
    }
  }

  // --- 2) ALLERGY ALERTS ---
  for (const allergen of normalizedAllergies) {
    for (const rule of ALLERGY_CROSS_REACTIVITY) {
      if (rule.allergen === allergen || allergen.includes(rule.allergen) || rule.allergen.includes(allergen)) {
        for (const med of normalizedMeds) {
          const hasOverlap = rule.avoidDrugKeys.some((key) => med.keys.includes(key));
          if (hasOverlap) {
            const alreadyFound = allergyAlerts.some(
              (existing) => existing.drug === med.original && existing.allergen === allergen
            );
            if (!alreadyFound) {
              allergyAlerts.push({
                drug: med.original,
                allergen,
                severity: rule.severity,
                note: rule.note,
              });
            }
          }
        }
      }
    }
  }

  // --- 3) CONDITION-BASED WARNINGS ---
  for (const condition of normalizedConditions) {
    for (const rule of CONDITION_WARNINGS) {
      // Check if the condition matches
      const conditionMatches =
        rule.condition === condition ||
        condition.includes(rule.condition) ||
        rule.condition.includes(condition);

      if (conditionMatches) {
        for (const med of normalizedMeds) {
          const hasOverlap = rule.drugKeys.some((key) => med.keys.includes(key));
          if (hasOverlap) {
            const alreadyFound = conditionWarnings.some(
              (existing) => existing.drug === med.original && existing.condition === rule.condition
            );
            if (!alreadyFound) {
              conditionWarnings.push({
                drug: med.original,
                condition: rule.condition,
                severity: rule.severity,
                note: rule.note,
              });
            }
          }
        }
      }
    }
  }

  // --- 4) DUPLICATE THERAPY DETECTION ---
  for (const rule of DUPLICATE_THERAPY_RULES) {
    const matchingMeds = normalizedMeds.filter((med) => {
      return med.entries.some((entry) => {
        const classMatch = entry.class.toLowerCase() === rule.class.toLowerCase();
        if (rule.subclass) {
          return classMatch && entry.subclass.toLowerCase() === rule.subclass.toLowerCase();
        }
        return classMatch;
      });
    });

    if (matchingMeds.length >= 2) {
      // Report each duplicate pair
      for (let i = 0; i < matchingMeds.length; i++) {
        for (let j = i + 1; j < matchingMeds.length; j++) {
          // Avoid flagging the same drug with itself (different entries of same med)
          if (matchingMeds[i].normalized === matchingMeds[j].normalized) continue;

          const alreadyFound = duplicateTherapy.some(
            (existing) =>
              (existing.drug1 === matchingMeds[i].original && existing.drug2 === matchingMeds[j].original) ||
              (existing.drug1 === matchingMeds[j].original && existing.drug2 === matchingMeds[i].original)
          );
          if (!alreadyFound) {
            duplicateTherapy.push({
              drug1: matchingMeds[i].original,
              drug2: matchingMeds[j].original,
              class: rule.subclass ? `${rule.class} (${rule.subclass})` : rule.class,
              note: rule.note,
            });
          }
        }
      }
    }
  }

  // --- 5) CALCULATE OVERALL RISK ---
  const majorCount =
    interactions.filter((i) => i.severity === "major").length +
    allergyAlerts.filter((a) => a.severity === "major").length +
    conditionWarnings.filter((w) => w.severity === "major").length;

  const moderateCount =
    interactions.filter((i) => i.severity === "moderate").length +
    allergyAlerts.filter((a) => a.severity === "moderate").length +
    conditionWarnings.filter((w) => w.severity === "moderate").length;

  const duplicateCount = duplicateTherapy.length;

  let overallRisk = "safe";
  if (majorCount > 0 || duplicateCount >= 2) {
    overallRisk = "high-risk";
  } else if (moderateCount > 0 || duplicateCount >= 1) {
    overallRisk = "caution";
  }

  // If ANY drug is unrecognized, never say "safe" — say "unknown"
  if (unrecognizedDrugs.length > 0 && overallRisk === "safe") {
    overallRisk = "unknown";
  }

  // --- 6) BUILD SUMMARY ---
  const totalIssues = interactions.length + allergyAlerts.length + conditionWarnings.length + duplicateTherapy.length;

  let summary = "";
  const unrecNames = unrecognizedDrugs.map(u => `"${u.original}"`).join(", ");

  if (unrecognizedDrugs.length > 0) {
    summary = `⚠ ${unrecNames} not found in our database (${Object.keys(DRUG_DATABASE).length} drugs). We CANNOT confirm safety. Consult a pharmacist or use a comprehensive drug reference.`;
    if (totalIssues > 0) {
      summary += ` Additionally found ${totalIssues} issue(s) among recognized drugs.`;
    }
  } else if (totalIssues === 0) {
    summary = `Checked ${medications.length} medication(s). No interactions, allergy alerts, condition warnings, or duplicate therapies detected.`;
  } else {
    const parts = [];
    if (interactions.length > 0) {
      parts.push(`${interactions.length} drug interaction(s) [${interactions.filter((i) => i.severity === "major").length} major]`);
    }
    if (allergyAlerts.length > 0) {
      parts.push(`${allergyAlerts.length} allergy alert(s)`);
    }
    if (conditionWarnings.length > 0) {
      parts.push(`${conditionWarnings.length} condition warning(s)`);
    }
    if (duplicateTherapy.length > 0) {
      parts.push(`${duplicateTherapy.length} duplicate therapy issue(s)`);
    }
    summary = `Checked ${medications.length} medication(s): ${parts.join(", ")}. Overall risk: ${overallRisk.toUpperCase()}.`;
  }

  return {
    interactions,
    allergyAlerts,
    conditionWarnings,
    duplicateTherapy,
    unrecognizedDrugs: unrecognizedDrugs.map(u => u.original),
    overallRisk,
    summary,
  };
}

// ---------------------------------------------------------------------------
// getDrugInfo
// ---------------------------------------------------------------------------

/**
 * Look up comprehensive drug information by name (generic or brand).
 *
 * @param {string} drugName - Drug name (generic or brand, any casing, with or without dose).
 * @returns {{
 *   name: string,
 *   class: string,
 *   subclass: string,
 *   commonDoses: string[],
 *   sideEffects: string[],
 *   contraindications: string[],
 *   interactions: Array<{withDrug: string, severity: string, description: string}>,
 *   found: boolean
 * }}
 *
 * @example
 * getDrugInfo("Syndopa Plus")
 * // Returns info for Levodopa/Carbidopa including interactions
 *
 * getDrugInfo("Ecosprin 75")
 * // Returns info for Aspirin
 */
function getDrugInfo(drugName) {
  const normalized = normalizeDrugName(drugName);
  const entries = resolveDrugEntries(normalized);

  if (entries.length === 0) {
    return {
      name: drugName,
      class: "unknown",
      subclass: "unknown",
      commonDoses: [],
      sideEffects: [],
      contraindications: [],
      interactions: [],
      found: false,
    };
  }

  // Use first entry as primary (for combination drugs, merge info)
  const primary = entries[0];
  const allKeys = getDrugInteractionKeys(normalized);

  // Find all interactions involving this drug
  const relevantInteractions = [];
  for (const rule of INTERACTION_DB) {
    const [key1, key2] = rule.drugs;
    if (allKeys.includes(key1) || allKeys.includes(key2)) {
      const otherKey = allKeys.includes(key1) ? key2 : key1;
      relevantInteractions.push({
        withDrug: otherKey,
        severity: rule.severity,
        description: rule.description,
      });
    }
  }

  // Merge info for combination drugs
  const mergedSideEffects = [...new Set(entries.flatMap((e) => e.sideEffects))];
  const mergedContraindications = [...new Set(entries.flatMap((e) => e.contraindications))];

  return {
    name: primary.name,
    class: primary.class,
    subclass: primary.subclass,
    commonDoses: primary.commonDoses,
    sideEffects: mergedSideEffects,
    contraindications: mergedContraindications,
    interactions: relevantInteractions,
    found: true,
  };
}

// ---------------------------------------------------------------------------
// ADDITIONAL UTILITIES
// ---------------------------------------------------------------------------

/**
 * Get the full list of drugs in the database.
 *
 * @returns {Array<{name: string, generic: string, class: string, subclass: string}>}
 */
function listAllDrugs() {
  return Object.entries(DRUG_DATABASE).map(([key, entry]) => ({
    name: entry.name,
    generic: key,
    class: entry.class,
    subclass: entry.subclass,
  }));
}

/**
 * Search drugs by name, class, or subclass.
 *
 * @param {string} query - Search query (partial match, case-insensitive).
 * @returns {Array<{name: string, generic: string, class: string, subclass: string}>}
 *
 * @example
 * searchDrugs("beta-blocker")
 * // Returns atenolol, metoprolol, timolol
 *
 * searchDrugs("diabet")
 * // Returns all antidiabetic drugs
 */
function searchDrugs(query) {
  if (!query) return [];
  const q = query.toLowerCase().trim();

  return Object.entries(DRUG_DATABASE)
    .filter(([key, entry]) => {
      return (
        key.includes(q) ||
        entry.name.toLowerCase().includes(q) ||
        entry.class.toLowerCase().includes(q) ||
        entry.subclass.toLowerCase().includes(q)
      );
    })
    .map(([key, entry]) => ({
      name: entry.name,
      generic: key,
      class: entry.class,
      subclass: entry.subclass,
    }));
}

/**
 * Resolve a brand name to its generic equivalent.
 *
 * @param {string} brandName - Brand name (e.g., "Ecosprin", "Syndopa Plus")
 * @returns {string} Generic name or original name if not found
 *
 * @example
 * resolveGenericName("Ecosprin")  // "aspirin"
 * resolveGenericName("Dolo 650")  // "paracetamol"
 */
function resolveGenericName(brandName) {
  return normalizeDrugName(brandName);
}

/**
 * Get condition-specific drug warnings for a set of conditions.
 *
 * @param {string[]} conditions - List of medical conditions
 * @returns {Array<{drugKeys: string[], condition: string, severity: string, note: string}>}
 */
function getConditionWarnings(conditions) {
  if (!Array.isArray(conditions) || conditions.length === 0) return [];

  const normalizedConditions = conditions.map((c) => c.toLowerCase().trim());
  const results = [];

  for (const condition of normalizedConditions) {
    for (const rule of CONDITION_WARNINGS) {
      if (
        rule.condition === condition ||
        condition.includes(rule.condition) ||
        rule.condition.includes(condition)
      ) {
        results.push({ ...rule });
      }
    }
  }

  return results;
}

/**
 * Check a single drug against a patient's allergy list.
 *
 * @param {string} drugName - Drug name (generic or brand)
 * @param {string[]} allergies - List of known allergies
 * @returns {Array<{allergen: string, severity: string, note: string}>}
 */
function checkAllergyForDrug(drugName, allergies) {
  if (!drugName || !Array.isArray(allergies) || allergies.length === 0) return [];

  const normalized = normalizeDrugName(drugName);
  const keys = getDrugInteractionKeys(normalized);
  const normalizedAllergies = allergies.map((a) => a.toLowerCase().trim());
  const alerts = [];

  for (const allergen of normalizedAllergies) {
    for (const rule of ALLERGY_CROSS_REACTIVITY) {
      if (rule.allergen === allergen || allergen.includes(rule.allergen) || rule.allergen.includes(allergen)) {
        const hasOverlap = rule.avoidDrugKeys.some((key) => keys.includes(key));
        if (hasOverlap) {
          alerts.push({
            allergen,
            severity: rule.severity,
            note: rule.note,
          });
        }
      }
    }
  }

  return alerts;
}

// ---------------------------------------------------------------------------
// EXPORTS
// ---------------------------------------------------------------------------

export {
  checkInteractions,
  getDrugInfo,
  normalizeDrugName,
  resolveGenericName,
  listAllDrugs,
  searchDrugs,
  getConditionWarnings,
  checkAllergyForDrug,
  BRAND_TO_GENERIC,
  DRUG_DATABASE,
  INTERACTION_DB,
  CONDITION_WARNINGS,
  ALLERGY_CROSS_REACTIVITY,
  DUPLICATE_THERAPY_RULES,
};
