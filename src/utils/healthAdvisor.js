// ═══════════════════════════════════════════════════════
//  HEALTH ADVISORY ENGINE
//  Auto-generates diet plans, health advice, and warnings
//  based on patient conditions, vitals, and diagnosis
// ═══════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────
//  CONDITION-SPECIFIC DIET DATABASES
// ─────────────────────────────────────────────────────

const DIET_PROFILES = {
  diabetes: {
    dietType: "Diabetic-Friendly (Low Glycemic Index)",
    calories: "1500-1800 kcal/day",
    meals: {
      breakfast: "Moong dal chilla (2 pcs) with mint chutney, 1 boiled egg or paneer slice, green tea (no sugar)",
      midMorning: "1 small apple or guava, handful of almonds (5-6), buttermilk (unsweetened)",
      lunch: "2 multigrain roti, lauki/tori sabzi, dal (1 katori), cucumber-tomato salad, curd (low fat)",
      evening: "Roasted chana (1 katori), green tea or lemon water, 1 small fruit (jamun, orange)",
      dinner: "1 multigrain roti or small bowl of brown rice, palak/methi sabzi, grilled fish or tofu, dal soup",
      bedtime: "1 glass warm turmeric milk (low fat, no sugar) or chamomile tea",
    },
    restrictions: [
      "No white sugar, jaggery, or honey in excess",
      "Avoid white rice, maida, white bread",
      "No fruit juices or sweetened beverages",
      "Limit potato, sweet potato, and starchy vegetables",
      "Avoid fried snacks (samosa, pakora, bhatura)",
      "No sugary desserts (gulab jamun, jalebi, halwa)",
    ],
    tips: [
      "Eat at regular intervals — never skip meals",
      "Include fibre-rich foods (oats, barley, vegetables) to slow sugar absorption",
      "Prefer whole grains over refined grains",
      "Monitor blood sugar before and after meals",
      "Walk for 15 minutes after each major meal",
      "Keep a small snack handy in case of hypoglycemia",
    ],
    warnings: [
      "Watch for signs of low blood sugar: dizziness, sweating, confusion",
      "Report any persistent blood sugar above 250 mg/dL",
    ],
  },

  hypertension: {
    dietType: "DASH Diet (Low Sodium, Heart Healthy)",
    calories: "1600-2000 kcal/day",
    meals: {
      breakfast: "Oats porridge with flaxseeds, 1 banana, green tea (no sugar)",
      midMorning: "Coconut water or buttermilk, handful of unsalted walnuts",
      lunch: "2 roti (whole wheat), lauki or parwal sabzi (low oil, no salt added at table), moong dal, salad with lemon dressing",
      evening: "1 bowl of fruit chaat (banana, pomegranate, papaya), herbal tea",
      dinner: "1 roti, bottle gourd soup, grilled/steamed fish or paneer bhurji (low salt), sauteed vegetables",
      bedtime: "Warm milk with a pinch of cardamom or chamomile tea",
    },
    restrictions: [
      "Limit sodium to under 1500 mg/day",
      "No pickles (achaar), papad, or chutneys with salt",
      "Avoid processed/packaged foods (chips, namkeen, instant noodles)",
      "No added table salt — use herbs and lemon for flavour",
      "Limit caffeine (max 1 cup tea/coffee per day)",
      "Avoid red meat and fried foods",
    ],
    tips: [
      "Eat potassium-rich foods: banana, sweet potato, spinach, coconut water",
      "Use garlic, ginger, cumin, and coriander for flavouring instead of salt",
      "Practice deep breathing or light yoga daily",
      "Monitor BP twice daily (morning and evening)",
      "Reduce stress through meditation or light activities",
    ],
    warnings: [
      "Seek immediate help if BP exceeds 180/120 mmHg",
      "Watch for headaches, blurred vision, or chest pain",
    ],
  },

  kidney_disease: {
    dietType: "Renal Diet (Low Potassium, Low Phosphorus, Protein Restricted)",
    calories: "1500-1800 kcal/day",
    meals: {
      breakfast: "White rice idli (2 pcs) with coconut chutney, 1 cup tea (limited milk)",
      midMorning: "1 small apple (peeled) or white bread toast with light butter",
      lunch: "White rice (1 cup), lauki/tinda sabzi (boiled, low potassium), thin dal (limited), small salad (cucumber only)",
      evening: "Arrowroot biscuits (2-3), lemon water (limited quantity)",
      dinner: "1 white flour roti or rice, cabbage sabzi, egg white omelette or small portion of chicken (50g)",
      bedtime: "Small portion of rice kheer (made with limited milk) or plain biscuit",
    },
    restrictions: [
      "Limit potassium: avoid banana, orange, coconut water, tomato, potato",
      "Limit phosphorus: avoid dairy in excess, cola, nuts, whole grains",
      "Restrict fluid intake as advised by doctor (typically 1-1.5L/day)",
      "Limit protein to 0.6-0.8g per kg body weight",
      "Avoid salt substitutes (they contain potassium chloride)",
      "No processed or canned foods",
    ],
    tips: [
      "Leach vegetables by soaking in water for 2 hours before cooking",
      "Track daily fluid intake including soups, dal, and water in foods",
      "Weigh daily to monitor fluid retention",
      "Cook with small amounts of oil rather than ghee",
      "Keep a food diary to track potassium and phosphorus intake",
    ],
    warnings: [
      "Report sudden weight gain (>1 kg/day) — may indicate fluid retention",
      "Watch for swelling in feet, hands, or face",
      "Report any decrease in urine output immediately",
    ],
  },

  heart_failure: {
    dietType: "Cardiac Diet (Low Sodium, Fluid Restricted, Heart Healthy Fats)",
    calories: "1500-1800 kcal/day",
    meals: {
      breakfast: "Dalia (broken wheat porridge) with vegetables, green tea",
      midMorning: "1 small fruit (apple, pear), 3-4 almonds",
      lunch: "1 roti (whole wheat), tori/parwal sabzi (minimal oil), moong dal, small curd",
      evening: "Vegetable soup (low sodium), 2 whole wheat crackers",
      dinner: "1 small roti, steamed fish or paneer tikka (grilled), sauteed greens (palak, methi)",
      bedtime: "Warm water with ajwain or herbal tea",
    },
    restrictions: [
      "Strict sodium limit: under 1500 mg/day",
      "Fluid restriction: typically 1.5-2L/day (as advised)",
      "No fried or deep-fried foods",
      "Avoid saturated fats (ghee, butter, cream in excess)",
      "No pickles, papad, processed meats",
      "Limit caffeine to 1 cup/day",
    ],
    tips: [
      "Use olive oil or mustard oil in moderation for cooking",
      "Eat omega-3 rich foods: flaxseeds, walnuts, fatty fish",
      "Monitor weight daily — sudden increase may mean fluid buildup",
      "Elevate legs when resting to reduce swelling",
      "Eat smaller, more frequent meals to reduce strain on the heart",
    ],
    warnings: [
      "Report sudden breathlessness, especially when lying down",
      "Watch for rapid weight gain (>1 kg in a day or >2 kg in a week)",
      "Seek help for chest pain, dizziness, or fainting",
    ],
  },

  parkinsons: {
    dietType: "Parkinson's Supportive (Soft/Pureed, Protein-Timed)",
    calories: "1600-2000 kcal/day",
    meals: {
      breakfast: "Soft dalia or suji upma (well-cooked), mashed banana, warm milk or tea (LOW PROTEIN — take Levodopa 30 min before)",
      midMorning: "Fruit smoothie (banana, papaya) or soft chiku, buttermilk",
      lunch: "Soft khichdi with ghee (low protein), well-cooked lauki sabzi (pureed if needed), thin curd, fruit",
      evening: "Soft idli with sambar (mashed), warm soup",
      dinner: "High-protein dinner (dal, paneer, chicken) — schedule protein at dinner when Levodopa timing is least critical",
      bedtime: "Warm turmeric milk or badam milk",
    },
    restrictions: [
      "Avoid hard, crunchy, or dry foods that are difficult to chew",
      "Time protein intake — take protein-rich meals AWAY from levodopa medication (1 hour gap)",
      "Avoid excessive protein at lunch if taking midday medication",
      "No sticky foods (peanut butter, sticky rice) that increase choking risk",
    ],
    tips: [
      "Serve meals in small, frequent portions (6 meals/day)",
      "Use thickened liquids if swallowing is difficult",
      "Sit upright during and 30 minutes after meals",
      "Add fibre (isabgol) to prevent constipation — a common issue",
      "Ensure adequate hydration — offer water frequently",
      "Coordinate meal timing with medication schedule",
      "PROTEIN REDISTRIBUTION: Keep daytime meals low in protein (<10g). Concentrate protein intake at dinner. Protein competes with Levodopa for absorption in the gut.",
    ],
    warnings: [
      "Watch for choking or coughing during meals",
      "Report significant weight loss or refusal to eat",
      "Monitor for constipation and report if lasting >3 days",
    ],
  },

  stroke_recovery: {
    dietType: "Stroke Recovery (Dysphagia-Safe, High Protein)",
    calories: "1800-2200 kcal/day",
    meals: {
      breakfast: "Soft suji halwa (low sugar) or porridge, scrambled eggs (soft), warm milk",
      midMorning: "Banana smoothie with protein powder, or soft custard",
      lunch: "Soft khichdi with extra dal, mashed vegetables (lauki, pumpkin), curd, soft fruit",
      evening: "Thick vegetable soup with bread soaked in it, or soft upma",
      dinner: "Mashed rice with dal and ghee, well-cooked fish (mashed) or soft paneer, pureed sabzi",
      bedtime: "Warm milk with honey (small amount) or protein supplement drink",
    },
    restrictions: [
      "Avoid thin liquids unless cleared by speech therapist (use thickener)",
      "No hard, crunchy, or crumbly foods",
      "Avoid very hot foods (reduced sensation may cause burns)",
      "Low sodium to prevent recurrent stroke",
      "Limit saturated fats and cholesterol",
    ],
    tips: [
      "Serve food on the unaffected side if there is facial weakness",
      "Maintain upright position during meals and 30 min after",
      "Increase protein intake to support tissue recovery",
      "Include vitamin B12, folate, and omega-3 for neural health",
      "Ensure adequate calories — healing requires energy",
      "Monitor swallowing ability and adjust food texture accordingly",
    ],
    warnings: [
      "Watch for coughing, choking, or wet voice quality during/after meals",
      "Report any sudden weakness, speech changes, or confusion immediately",
      "Monitor BP closely — target as advised by physician",
    ],
  },

  dementia: {
    dietType: "Dementia-Friendly (Simple, Supervised, High Calorie)",
    calories: "1800-2200 kcal/day",
    meals: {
      breakfast: "Paratha (stuffed, soft) cut into small pieces, warm milk with sugar, soft boiled egg",
      midMorning: "Banana or chiku, biscuits with tea, small ladoo",
      lunch: "Rice with dal (mixed together), soft sabzi, curd, small piece of jaggery",
      evening: "Bread with butter and jam, fruit custard, chai",
      dinner: "Soft roti torn into pieces with dal poured over, mashed aloo/paneer, kheer",
      bedtime: "Warm milk with elaichi and a spoon of ghee",
    },
    restrictions: [
      "Avoid foods that require complex eating skills (bone-in meat, fish with bones)",
      "No very hot foods or beverages (patient may not judge temperature)",
      "Avoid hard candies or nuts (choking hazard)",
      "Remove seeds, pits, and bones from all foods",
    ],
    tips: [
      "Serve one food item at a time to reduce confusion",
      "Use brightly coloured plates for contrast with food",
      "Offer finger foods when utensil use becomes difficult",
      "Maintain a consistent meal schedule and environment",
      "Supervise all meals to prevent choking",
      "Ensure high calorie intake — patients often lose weight due to forgetting to eat",
      "Play soft, familiar music during meals to create a calm atmosphere",
    ],
    warnings: [
      "Watch for pocketing food in cheeks (choking risk)",
      "Report significant weight loss (>2 kg in a month)",
      "Monitor hydration — patients often forget to drink water",
    ],
  },

  copd: {
    dietType: "COPD Supportive (High Calorie, High Protein, Small Frequent Meals)",
    calories: "2000-2400 kcal/day",
    meals: {
      breakfast: "Paneer paratha with butter, glass of full-fat milk, 1 boiled egg",
      midMorning: "Banana shake or dry fruit laddoo, handful of almonds",
      lunch: "2 roti with ghee, chicken/paneer curry, dal, rice (small portion), salad",
      evening: "Cheese sandwich or stuffed bread roll, warm soup, fruit",
      dinner: "2 roti, egg curry or fish, mixed vegetable sabzi with extra oil/ghee, curd",
      bedtime: "Warm milk with turmeric and honey, 2-3 dates",
    },
    restrictions: [
      "Avoid gas-producing foods: cabbage, cauliflower, rajma, chhole, carbonated drinks",
      "No heavy meals — eat smaller portions more often",
      "Avoid excess salt (can cause fluid retention and breathing difficulty)",
      "Limit dairy if it thickens mucus (varies by individual)",
    ],
    tips: [
      "Eat high-calorie foods first when energy is highest (usually morning)",
      "Rest before meals if feeling breathless",
      "Use pursed-lip breathing between bites if short of breath",
      "Drink fluids between meals, not during, to avoid feeling full",
      "Aim for high protein to maintain muscle mass and breathing strength",
      "Keep meals calorie-dense but small in volume",
    ],
    warnings: [
      "Report increased breathlessness during or after meals",
      "Watch for bluish lips or fingertips (low oxygen)",
      "Seek help if unable to eat due to breathlessness",
    ],
  },

  osteoporosis: {
    dietType: "Bone-Strengthening (Calcium & Vitamin D Rich)",
    calories: "1600-2000 kcal/day",
    meals: {
      breakfast: "Ragi (nachni) dosa or ragi porridge with milk, 1 boiled egg, orange juice (with calcium)",
      midMorning: "1 glass milk or curd lassi, til (sesame) chikki or ladoo",
      lunch: "2 roti, palak paneer or saag, dal, rice, curd, salad with lemon",
      evening: "Cheese toast, handful of almonds and figs (anjeer), green tea",
      dinner: "1 roti, fish curry (sardines/salmon if available) or dal, green leafy sabzi, milk-based dessert",
      bedtime: "Warm milk with haldi, or ragi malt",
    },
    restrictions: [
      "Limit caffeine to 1-2 cups/day (excess leaches calcium)",
      "Avoid excess salt (increases calcium loss in urine)",
      "Limit alcohol completely",
      "Avoid soft drinks and colas (phosphoric acid weakens bones)",
      "Don't take calcium supplements with iron-rich meals (reduces absorption)",
    ],
    tips: [
      "Include calcium-rich foods: milk, curd, paneer, ragi, til, green leafy vegetables",
      "Get 15-20 minutes of morning sunlight daily for vitamin D",
      "Include vitamin D foods: egg yolks, fatty fish, fortified milk",
      "Weight-bearing exercises (walking, light resistance) strengthen bones",
      "Take calcium and vitamin D supplements as prescribed",
      "Space calcium intake throughout the day for better absorption",
    ],
    warnings: [
      "Report any fall immediately — even minor falls can cause fractures",
      "Watch for sudden back pain (could indicate compression fracture)",
      "Ensure home environment is fall-proof (remove rugs, install grab bars)",
    ],
  },

  arthritis: {
    dietType: "Anti-Inflammatory Diet (Omega-3 Rich, Low Processed)",
    calories: "1600-2000 kcal/day",
    meals: {
      breakfast: "Methi paratha with curd, turmeric milk (haldi doodh), 4-5 soaked almonds",
      midMorning: "Papaya or pineapple, flaxseed water, green tea with ginger",
      lunch: "2 roti, fish curry or dal with turmeric, mixed vegetable sabzi (carrots, beans), brown rice, salad",
      evening: "Walnuts and dried apricots, warm ginger-turmeric tea, sprout chaat",
      dinner: "1 roti, grilled fish or tofu, broccoli/spinach sabzi, light soup",
      bedtime: "Warm turmeric-ginger milk, or cherry juice (if available)",
    },
    restrictions: [
      "Avoid processed and packaged foods",
      "Limit red meat and organ meats (high in purines for gout-type arthritis)",
      "Avoid refined sugar and maida",
      "Limit fried foods and trans fats",
      "Reduce nightshade vegetables if they trigger symptoms (tomato, eggplant, capsicum)",
    ],
    tips: [
      "Include anti-inflammatory spices daily: turmeric (with black pepper for absorption), ginger, garlic",
      "Eat omega-3 rich foods: flaxseeds, walnuts, fatty fish (salmon, sardines)",
      "Stay hydrated — water helps lubricate joints",
      "Maintain healthy weight to reduce joint stress",
      "Gentle exercises: swimming, yoga, walking improve joint mobility",
      "Apply warm compresses to stiff joints before meals to ease eating",
    ],
    warnings: [
      "Report sudden joint swelling, redness, or warmth (possible flare)",
      "Watch for medication side effects: stomach pain, bruising",
      "Seek help if joint pain prevents daily activities",
    ],
  },

  anxiety_depression: {
    dietType: "Mood-Supportive Diet (Omega-3, Magnesium, B-Vitamins)",
    calories: "1600-2000 kcal/day",
    meals: {
      breakfast: "Whole wheat toast with peanut butter, banana, warm milk with almonds, 1 boiled egg",
      midMorning: "Mixed nuts (walnuts, almonds, cashews), dark chocolate (1 small piece), herbal tea",
      lunch: "2 roti, palak dal or fish curry, brown rice, curd, salad with seeds (pumpkin, sunflower)",
      evening: "Fruit chaat with pomegranate and orange, roasted makhana, chamomile tea",
      dinner: "1 roti, grilled chicken or paneer, mixed vegetable sabzi, warm soup",
      bedtime: "Warm milk with nutmeg (jaiphal) and honey, or chamomile tea",
    },
    restrictions: [
      "Limit caffeine to 1 cup/day (excess increases anxiety)",
      "Avoid alcohol completely",
      "Reduce refined sugar and processed foods",
      "Avoid skipping meals (blood sugar dips worsen mood)",
      "Limit highly processed or junk food",
    ],
    tips: [
      "Include tryptophan-rich foods: milk, banana, nuts, seeds, eggs (precursor to serotonin)",
      "Eat magnesium-rich foods: spinach, pumpkin seeds, dark chocolate, almonds",
      "Omega-3 fatty acids support brain health: walnuts, flaxseeds, fish",
      "Maintain regular meal times for stable blood sugar and mood",
      "Morning sunlight exposure (15-20 min) boosts serotonin naturally",
      "Light exercise (walking, yoga) is as effective as some medications for mild depression",
      "Stay socially engaged during meals — eat in common areas when possible",
    ],
    warnings: [
      "Report any thoughts of self-harm immediately to staff",
      "Watch for sudden appetite changes (eating too much or too little)",
      "Monitor sleep patterns — insomnia or excessive sleep needs attention",
    ],
  },

  fracture_recovery: {
    dietType: "Fracture Healing Diet (High Protein, Calcium, Vitamin C)",
    calories: "2000-2400 kcal/day",
    meals: {
      breakfast: "Paneer paratha or egg omelette with cheese, glass of milk, orange or amla juice",
      midMorning: "Banana with curd, handful of almonds and walnuts, ragi malt",
      lunch: "2 roti, rajma or chicken curry, palak sabzi, rice, curd, guava or orange",
      evening: "Cheese sandwich, bone broth soup (if non-veg), fruit with cream",
      dinner: "2 roti, fish/egg curry or paneer, green vegetable sabzi, dal, milk-based dessert",
      bedtime: "Warm milk with turmeric and honey, 2-3 soaked almonds",
    },
    restrictions: [
      "Avoid excess caffeine (>2 cups/day) — interferes with calcium absorption",
      "No alcohol — impairs bone healing",
      "Avoid excess salt — increases calcium loss",
      "No smoking — drastically slows bone healing",
      "Limit carbonated beverages",
    ],
    tips: [
      "Increase protein intake — bones need protein as much as calcium to heal",
      "Include vitamin C foods daily: amla, guava, orange, lemon (aids collagen formation)",
      "Calcium sources: milk, curd, paneer, ragi, sesame seeds, green leafy vegetables",
      "Vitamin D: morning sunlight (15-20 min), egg yolks, fortified foods",
      "Zinc-rich foods support healing: pumpkin seeds, chickpeas, meat",
      "Stay as mobile as possible (within medical advice) to promote healing",
    ],
    warnings: [
      "Report increased pain, swelling, or deformity at fracture site",
      "Watch for numbness or tingling below the fracture",
      "Report any signs of infection: redness, warmth, pus, fever",
    ],
  },

  gout: {
    dietType: "Low-Purine Anti-Gout Diet",
    calories: "1600-2000 kcal/day",
    meals: {
      breakfast: "Low-fat milk with cornflakes or dalia, 1 boiled egg (whites preferred), cherry juice or fresh cherries",
      midMorning: "Skim milk lassi (no sugar), 1 apple or pear, handful of almonds",
      lunch: "2 roti (whole wheat), lauki/tinda/parwal sabzi, moong dal (low purine), cucumber raita (low fat)",
      evening: "Cherries (10-12), green tea, roasted makhana",
      dinner: "1 roti, bottle gourd soup, grilled chicken breast (small portion, 60g max) or tofu, sauteed capsicum",
      bedtime: "1 glass skim milk or warm water with lemon",
    },
    restrictions: [
      "Strictly avoid: organ meats (liver, kidney, brain), red meat, shellfish",
      "Avoid high-purine legumes: rajma, chole, chana, urad dal in excess",
      "No alcohol — especially beer (highest purine content)",
      "Limit mushrooms, cauliflower, spinach (moderate purines)",
      "No sugary drinks, fruit juices, or foods with high fructose",
      "Avoid yeast extracts, gravies, meat broths",
    ],
    tips: [
      "Drink 2.5-3 liters of water daily to flush uric acid",
      "Cherries (10-12 daily) are proven to reduce gout flares by 35%",
      "Low-fat dairy (skim milk, curd) lowers uric acid — include daily",
      "Vitamin C (500mg) may help lower uric acid levels",
      "During acute flare: liquid/semi-solid diet, avoid all protein except dairy",
      "Coffee (2-3 cups) may reduce uric acid — consult doctor first",
    ],
    warnings: [
      "During acute gout flare: rest the affected joint, apply ice, avoid all high-purine foods",
      "Rapid weight loss can trigger gout attacks — lose weight gradually",
    ],
  },

  liver_cirrhosis: {
    dietType: "Hepatic Diet (Cirrhosis — Low Sodium, Moderate Protein, BCAA Priority)",
    calories: "1800-2200 kcal/day",
    meals: {
      breakfast: "Soft dalia with milk (small portion), 1 boiled egg white, toast with light butter, tea (no sugar)",
      midMorning: "BCAA supplement (if prescribed) or small portion of paneer (30g only), 1 peeled apple",
      lunch: "Well-cooked rice (1 cup), lauki/tinda sabzi, thin moong dal (1/2 katori — vegetable protein preferred), curd (2 tbsp)",
      evening: "Roasted makhana, glucose biscuits (2), lemon water (limited)",
      dinner: "1 soft roti, bottle gourd or parwal sabzi, small chicken/fish (60g) or tofu, warm soup",
      bedtime: "Late-evening carb snack (2 biscuits or small cornflakes portion) — prevents overnight muscle breakdown",
    },
    restrictions: [
      "STRICT sodium limit: under 2000 mg/day (under 1500 if ascites present)",
      "FLUID RESTRICTION: 1-1.5L/day if ascites or edema present — includes soups, dal, tea",
      "NO alcohol in any form — even small amounts cause further liver damage",
      "Limit protein to 1.0-1.2g/kg/day — prefer vegetable/dairy protein over red meat",
      "Avoid raw/undercooked foods — infection risk is high with cirrhosis",
      "No over-the-counter medications (paracetamol/NSAIDs) without doctor approval — liver cannot metabolize",
    ],
    tips: [
      "Eat 6 small meals/day — large meals stress the liver",
      "Late-evening carb snack prevents overnight gluconeogenesis and muscle wasting",
      "Branched-Chain Amino Acids (BCAA) supplements may be recommended by doctor for hepatic encephalopathy prevention",
      "Vegetable proteins (dal, tofu) are preferred over animal proteins — produce less ammonia",
      "Monitor weight daily — sudden increase suggests fluid retention",
      "Avoid constipation — increases ammonia absorption. Use lactulose if prescribed",
    ],
    warnings: [
      "If patient becomes confused/drowsy, suspect Hepatic Encephalopathy — restrict protein temporarily and contact physician IMMEDIATELY",
      "Watch for signs of GI bleeding: black stools, vomiting blood — this is a MEDICAL EMERGENCY",
      "Report any new jaundice (yellowing of eyes/skin) or increasing abdominal distension",
    ],
  },

  general: {
    dietType: "Balanced Elderly Diet (Easy to Digest, Nutritious)",
    calories: "1600-2000 kcal/day",
    meals: {
      breakfast: "Moong dal chilla or poha with peanuts, 1 glass milk or tea, 1 fruit",
      midMorning: "Buttermilk or coconut water, seasonal fruit, 4-5 almonds",
      lunch: "2 roti, seasonal sabzi, dal, rice, curd, salad",
      evening: "Light sandwich or upma, chai, biscuits or murmura chivda",
      dinner: "1 roti, light sabzi (lauki, tori), khichdi or dal-rice, warm soup",
      bedtime: "Warm milk with haldi or elaichi",
    },
    restrictions: [
      "Avoid very spicy or oily food",
      "Limit fried and processed foods",
      "Reduce excess sugar and salt",
      "Avoid foods that cause gas or bloating if sensitive",
    ],
    tips: [
      "Eat at regular times every day",
      "Include protein in every meal (dal, eggs, paneer, curd)",
      "Stay hydrated — aim for 6-8 glasses of water daily",
      "Include fibre to prevent constipation (fruits, vegetables, whole grains)",
      "Chew food thoroughly and eat slowly",
      "Take a short walk after meals for better digestion",
    ],
    warnings: [
      "Report any sudden change in appetite or weight",
      "Watch for signs of dehydration: dry mouth, dark urine, dizziness",
      "Inform staff of any new food intolerances or allergies",
    ],
  },
};

// ─────────────────────────────────────────────────────
//  HEALTH ADVICE DATABASE (by condition)
// ─────────────────────────────────────────────────────

const HEALTH_ADVICE_DB = {
  diabetes: {
    summary:
      "Diabetes requires careful management of blood sugar levels through diet, medication, and lifestyle. Consistent meal timing and monitoring are essential to prevent complications.",
    recommendations: [
      "Monitor blood glucose levels at least twice daily (fasting and post-meal)",
      "Take medications exactly as prescribed — never skip insulin or oral hypoglycemics",
      "Exercise regularly: 30 minutes of walking or light activity daily",
      "Inspect feet daily for cuts, sores, or infections — diabetic foot care is critical",
      "Keep a sugar source (glucose tablets, candy) available for hypoglycemia episodes",
      "Get regular eye check-ups (every 6-12 months) to screen for retinopathy",
      "Maintain a food diary to identify blood sugar triggers",
      "Stay hydrated — dehydration can spike blood sugar levels",
    ],
    warningsSigns: [
      "Excessive thirst or frequent urination",
      "Blurred vision or sudden vision changes",
      "Numbness or tingling in hands/feet",
      "Wounds or sores that heal very slowly",
      "Confusion, dizziness, or fainting (possible hypo/hyperglycemia)",
    ],
    followUp: "Monthly blood sugar review. HbA1c test every 3 months. Annual kidney function, eye, and foot examination.",
    lifestyle: [
      "Maintain consistent sleep schedule (7-8 hours)",
      "Practice stress management — stress hormones raise blood sugar",
      "Wear comfortable, well-fitting shoes to protect feet",
      "Carry a medical ID card or bracelet",
      "Avoid prolonged sitting — move every 30-60 minutes",
    ],
    medicationsNote:
      "Take diabetes medication at the same time daily. Report any episodes of low blood sugar (shaking, sweating, confusion) to staff immediately. Never adjust doses without medical consultation.",
  },

  hypertension: {
    summary:
      "High blood pressure increases the risk of heart attack, stroke, and kidney disease. Consistent BP monitoring, medication adherence, and a low-sodium lifestyle are the pillars of management.",
    recommendations: [
      "Monitor blood pressure twice daily — morning and evening at consistent times",
      "Take BP medications as prescribed, even when feeling well",
      "Reduce salt intake to less than 1 teaspoon (5g) per day",
      "Engage in light exercise: 30 minutes of walking or gentle yoga daily",
      "Maintain a healthy weight — even small weight loss helps",
      "Limit alcohol and avoid smoking completely",
      "Practice relaxation techniques: deep breathing, meditation",
    ],
    warningsSigns: [
      "Severe headache, especially at the back of the head",
      "Blurred vision or seeing spots",
      "Chest pain or tightness",
      "Difficulty breathing",
      "Nosebleeds that are unusual or prolonged",
      "Nausea or vomiting with high BP reading",
    ],
    followUp: "Weekly BP log review. Monthly physician consultation. Kidney function and cholesterol tests every 6 months.",
    lifestyle: [
      "Reduce stress through hobbies, socializing, or relaxation",
      "Limit screen time before bed for better sleep",
      "Avoid heavy lifting or straining activities",
      "Stay cool — extreme heat can drop BP dangerously",
      "Keep a BP diary to share with the doctor",
    ],
    medicationsNote:
      "BP medications must be taken daily without skipping. Do not stop medication even if BP readings are normal — they are normal BECAUSE of the medication. Report dizziness or fainting, which may indicate the dose needs adjustment.",
  },

  kidney_disease: {
    summary:
      "Chronic kidney disease (CKD) requires careful management of fluid, electrolytes, and protein intake. The kidneys' reduced ability to filter waste means dietary restrictions are essential to prevent complications.",
    recommendations: [
      "Monitor fluid intake strictly — track all beverages, soups, and water-rich foods",
      "Weigh daily at the same time to detect fluid retention early",
      "Follow prescribed dietary restrictions for potassium, phosphorus, and protein",
      "Take medications exactly as prescribed, especially phosphate binders with meals",
      "Monitor urine output and colour — report changes to medical staff",
      "Keep blood pressure under control — hypertension accelerates kidney damage",
      "Attend all scheduled dialysis sessions if applicable",
    ],
    warningsSigns: [
      "Sudden decrease in urine output",
      "Swelling in legs, ankles, feet, or face",
      "Rapid weight gain (>1 kg/day)",
      "Persistent nausea, vomiting, or loss of appetite",
      "Confusion or difficulty concentrating",
      "Muscle cramps or twitching",
      "Shortness of breath (fluid in lungs)",
    ],
    followUp: "Monthly kidney function tests (creatinine, BUN, GFR). Electrolyte panel every 2-4 weeks. Nephrologist review every 1-3 months.",
    lifestyle: [
      "Avoid over-the-counter painkillers (NSAIDs) — they damage kidneys further",
      "Keep skin moisturized — dry, itchy skin is common with CKD",
      "Light exercise as tolerated to maintain strength",
      "Avoid herbal supplements unless approved by doctor",
    ],
    medicationsNote:
      "Take phosphate binders with meals, not on an empty stomach. Erythropoietin injections (if prescribed) help manage anaemia. Never take NSAIDs (ibuprofen, aspirin in high doses) without medical approval.",
  },

  heart_failure: {
    summary:
      "Heart failure means the heart cannot pump blood efficiently. Managing fluid, sodium, and medications is critical. Daily weight monitoring and activity pacing help prevent flare-ups.",
    recommendations: [
      "Weigh daily at the same time (before breakfast, after using the bathroom)",
      "Restrict fluid intake as prescribed (typically 1.5-2 litres/day)",
      "Limit sodium to under 1500 mg/day",
      "Take all heart medications as prescribed — do not skip doses",
      "Elevate legs when sitting or resting to reduce swelling",
      "Pace activities — rest between tasks to avoid overexertion",
      "Sleep with head elevated (2-3 pillows) if breathless when lying flat",
    ],
    warningsSigns: [
      "Sudden weight gain (>1 kg/day or >2 kg/week)",
      "Increased shortness of breath, especially when lying down",
      "Waking up at night gasping for air",
      "Persistent cough, especially with pink or frothy sputum",
      "Increased swelling in legs, ankles, or abdomen",
      "Dizziness, confusion, or fainting",
    ],
    followUp: "Weekly weight and symptom review. Monthly cardiac assessment. Echocardiogram every 6-12 months. Blood tests for kidney function and electrolytes monthly.",
    lifestyle: [
      "Avoid extreme temperatures (very hot or cold environments)",
      "Get flu and pneumonia vaccinations as recommended",
      "Gentle, regular exercise (short walks) as tolerated",
      "Avoid alcohol and smoking completely",
    ],
    medicationsNote:
      "Heart failure medications (ACE inhibitors, beta-blockers, diuretics) are life-sustaining — never skip them. If taking diuretics, monitor potassium levels. Report any persistent dry cough (may be ACE inhibitor side effect).",
  },

  // Simplified entries for remaining conditions (same structure)
  parkinsons: {
    summary:
      "Parkinson's disease affects movement, swallowing, and digestion. Medication timing is critical — especially the relationship between protein intake and levodopa absorption.",
    recommendations: [
      "Time meals around medication — take levodopa 30-60 minutes before meals",
      "Distribute protein intake primarily in the evening to maximize daytime medication effect",
      "Maintain a regular bowel routine — constipation is very common",
      "Use adaptive utensils if tremor makes eating difficult",
      "Stay physically active with guided exercises or physiotherapy",
      "Maintain oral hygiene — difficulty swallowing can lead to dental issues",
    ],
    warningsSigns: [
      "Choking or coughing while eating or drinking",
      "Significant weight loss over weeks",
      "Freezing episodes that lead to falls",
      "Sudden worsening of tremor or stiffness",
      "Hallucinations or confusion (medication side effect)",
    ],
    followUp: "Monthly neurologist review. Swallowing assessment every 3-6 months. Physiotherapy and speech therapy sessions as scheduled.",
    lifestyle: [
      "Regular stretching and balance exercises",
      "Use walking aids if prescribed to prevent falls",
      "Keep the living environment well-lit and clutter-free",
      "Engage in cognitive activities: puzzles, reading, conversations",
    ],
    medicationsNote:
      "Levodopa must be taken on time — even small delays can cause symptom breakthrough. Protein competes with levodopa for absorption, so coordinate meal timing carefully.",
  },

  stroke_recovery: {
    summary:
      "Stroke recovery focuses on regaining function, preventing recurrence, and managing risk factors. Nutrition, physiotherapy, and emotional support are all critical components.",
    recommendations: [
      "Follow speech therapist guidance on food textures and swallowing safety",
      "Engage in prescribed physiotherapy exercises daily",
      "Control blood pressure — single most important factor to prevent recurrent stroke",
      "Take blood thinners or antiplatelet medications exactly as prescribed",
      "Maintain high protein intake for tissue repair and recovery",
      "Monitor for signs of depression — very common after stroke",
    ],
    warningsSigns: [
      "Sudden weakness or numbness on one side",
      "Sudden difficulty speaking or understanding speech",
      "Sudden severe headache with no known cause",
      "Sudden vision changes",
      "New difficulty swallowing or choking",
    ],
    followUp: "Weekly physiotherapy progress review. Monthly physician assessment. Brain imaging as advised. Speech therapy assessment every 2-4 weeks.",
    lifestyle: [
      "Practise affected limb exercises even outside therapy sessions",
      "Stay socially engaged to combat isolation and depression",
      "Use assistive devices as recommended",
      "Maintain a structured daily routine for stability",
    ],
    medicationsNote:
      "Blood thinners require strict adherence — missing doses increases stroke recurrence risk. Report any unusual bleeding (gums, urine, stool). Avoid NSAIDs without medical approval.",
  },

  dementia: {
    summary:
      "Dementia progressively affects memory, reasoning, and daily functioning. A structured, supportive environment with consistent routines helps maintain quality of life and nutritional status.",
    recommendations: [
      "Maintain a consistent daily routine — same meal times, same seating",
      "Supervise all meals to ensure adequate intake and prevent choking",
      "Offer simple, one-step instructions during meals",
      "Ensure adequate hydration — offer fluids frequently throughout the day",
      "Monitor weight weekly — unintentional weight loss is common",
      "Engage in familiar, enjoyable activities to maintain cognitive stimulation",
    ],
    warningsSigns: [
      "Sudden change in behaviour or increased confusion (rule out UTI, pain, medication issues)",
      "Refusal to eat or drink for more than a day",
      "Signs of aspiration: coughing during meals, recurrent chest infections",
      "Wandering or agitation, especially at sundown (sundowning)",
      "Falls or unsteadiness",
    ],
    followUp: "Monthly weight and nutritional status review. Quarterly cognitive assessment. Annual comprehensive geriatric assessment. Caregiver support review monthly.",
    lifestyle: [
      "Maintain familiar surroundings — avoid unnecessary changes",
      "Gentle music, art, or reminiscence therapy",
      "Regular, supervised outdoor time for sunlight and fresh air",
      "Simple, repetitive exercises (seated stretches, walking with support)",
    ],
    medicationsNote:
      "Administer medications at consistent times. Use pill organizers. Crush tablets if swallowing is difficult (confirm with pharmacist first). Watch for medication side effects — patients may not report symptoms.",
  },

  copd: {
    summary:
      "COPD makes breathing difficult and increases energy expenditure. High-calorie, nutrient-dense meals in small portions help maintain weight and energy. Breathing techniques during meals are important.",
    recommendations: [
      "Use pursed-lip breathing between bites if breathless during meals",
      "Eat high-calorie foods first when energy levels are highest",
      "Use bronchodilators 30 minutes before meals if breathlessness affects eating",
      "Avoid lying down immediately after meals",
      "Keep oxygen therapy on during meals if prescribed",
      "Stay up to date with flu and pneumonia vaccinations",
    ],
    warningsSigns: [
      "Increased breathlessness beyond usual baseline",
      "Change in sputum colour (yellow, green, or bloody)",
      "Fever or chills",
      "Bluish lips or fingernails (cyanosis)",
      "Confusion or excessive drowsiness",
      "Inability to speak in full sentences due to breathlessness",
    ],
    followUp: "Monthly respiratory assessment. Pulmonary function tests every 6 months. SpO2 monitoring daily. Pulmonologist review every 3 months.",
    lifestyle: [
      "Avoid air pollution, dust, and strong odours",
      "Never smoke and avoid secondhand smoke",
      "Practice breathing exercises daily (pursed-lip, diaphragmatic)",
      "Stay active within limits — gentle walking helps lung function",
    ],
    medicationsNote:
      "Use inhalers with correct technique — ask staff for demonstration if unsure. Take oral medications with food to reduce nausea. Report any oral thrush (white patches in mouth) from inhaled steroids.",
  },

  osteoporosis: {
    summary:
      "Osteoporosis causes bones to become weak and brittle. Fall prevention is the top priority. Adequate calcium, vitamin D, and weight-bearing exercise help maintain bone density.",
    recommendations: [
      "Ensure 1200 mg calcium daily through diet and supplements",
      "Get vitamin D through sunlight (15-20 min morning) and supplements",
      "Engage in weight-bearing exercises: walking, standing exercises",
      "Fall-proof the living environment: remove loose rugs, install grab bars, ensure good lighting",
      "Wear supportive, non-slip footwear at all times",
      "Avoid bending or twisting movements that stress the spine",
    ],
    warningsSigns: [
      "Any fall, even without obvious injury (fractures may not cause immediate pain)",
      "Sudden back pain (possible compression fracture)",
      "Loss of height or increased stooping",
      "Pain that worsens with standing or walking",
    ],
    followUp: "DEXA scan every 1-2 years. Monthly fall risk assessment. Vitamin D levels every 6 months. Calcium and bone marker blood tests annually.",
    lifestyle: [
      "Stand and walk as much as possible — sedentary lifestyle weakens bones faster",
      "Avoid heavy lifting",
      "Use walking aids (cane, walker) if balance is unsteady",
      "Get up slowly from sitting or lying to avoid dizziness and falls",
    ],
    medicationsNote:
      "Take bisphosphonates (if prescribed) on an empty stomach with a full glass of water, and remain upright for 30 minutes. Calcium and vitamin D supplements should be taken with meals for better absorption.",
  },

  arthritis: {
    summary:
      "Arthritis causes joint pain and stiffness that can significantly impact daily life. An anti-inflammatory diet, gentle exercise, and proper joint protection techniques help manage symptoms.",
    recommendations: [
      "Apply warm compresses to stiff joints in the morning for 15-20 minutes",
      "Engage in gentle range-of-motion exercises daily",
      "Use adaptive aids (jar openers, thick-grip utensils) to protect joints",
      "Maintain a healthy weight to reduce joint stress",
      "Alternate activity with rest — avoid overexerting joints",
      "Include anti-inflammatory foods daily: turmeric, ginger, omega-3 fatty acids",
    ],
    warningsSigns: [
      "Sudden increase in joint swelling, redness, or warmth",
      "New joint involvement or spreading pain",
      "Fever with joint symptoms (possible infection)",
      "Loss of joint function or inability to perform daily tasks",
    ],
    followUp: "Monthly pain and mobility assessment. Blood tests (inflammatory markers) every 3 months. Rheumatologist review every 3-6 months. Physiotherapy assessment as needed.",
    lifestyle: [
      "Swimming or water exercises are excellent for arthritic joints",
      "Avoid prolonged sitting in one position",
      "Use ergonomic supports: cushions, raised toilet seats, grab bars",
      "Keep joints warm in cold weather",
    ],
    medicationsNote:
      "Take anti-inflammatory medications with food to protect the stomach. Report any stomach pain, black stools, or unusual bruising. If on biologics or DMARDs, report any signs of infection immediately.",
  },

  anxiety_depression: {
    summary:
      "Mental health conditions in elderly care home residents are common and treatable. A combination of proper nutrition, social engagement, routine, and appropriate medication management supports recovery.",
    recommendations: [
      "Maintain a consistent daily routine — structure reduces anxiety",
      "Encourage social interaction during meals and activities",
      "Ensure 7-8 hours of quality sleep — establish a calming bedtime routine",
      "Encourage light exercise: walking, gentle yoga, stretching",
      "Provide access to sunlight — at least 20 minutes of morning sun",
      "Encourage expression of feelings through conversation, art, or music",
      "Monitor appetite and eating patterns — both overeating and undereating are concerns",
    ],
    warningsSigns: [
      "Expressions of hopelessness, worthlessness, or being a burden",
      "Social withdrawal or refusal to participate in activities",
      "Significant changes in sleep (insomnia or excessive sleeping)",
      "Refusal to eat or sudden overeating",
      "Any mention of self-harm or suicidal thoughts — escalate immediately",
      "Increased confusion or agitation",
    ],
    followUp: "Weekly mood assessment by staff. Monthly psychiatric/psychological review. Medication effectiveness review every 2-4 weeks initially. Regular family check-ins.",
    lifestyle: [
      "Engage in purposeful activities: gardening, craft work, helping with simple tasks",
      "Maintain social connections with family, friends, and other residents",
      "Listen to favourite music — music therapy is highly effective",
      "Practise relaxation: deep breathing, progressive muscle relaxation",
    ],
    medicationsNote:
      "Antidepressants take 2-4 weeks to show full effect — do not stop early. Anti-anxiety medications should be taken as prescribed — some can be habit-forming. Report any new side effects: dizziness, nausea, increased confusion.",
  },

  fracture_recovery: {
    summary:
      "Fracture recovery requires adequate nutrition (especially protein, calcium, and vitamin C), proper immobilization, and gradual rehabilitation. Healing time varies but adequate nutrition can significantly speed recovery.",
    recommendations: [
      "Increase protein intake to 1.2-1.5g per kg body weight to support bone and tissue healing",
      "Ensure 1200-1500 mg calcium daily through diet and supplements",
      "Include vitamin C-rich foods daily for collagen formation",
      "Follow physiotherapy exercises as prescribed — even gentle movements help",
      "Keep the fractured area elevated when resting to reduce swelling",
      "Ensure adequate pain management to enable mobility and eating",
    ],
    warningsSigns: [
      "Increasing pain despite medication",
      "Numbness, tingling, or coldness below the fracture site",
      "Swelling that worsens instead of improving",
      "Signs of infection: fever, redness, warmth, pus at surgical site",
      "Inability to move fingers/toes below the fracture",
    ],
    followUp: "X-ray follow-up as advised (typically at 2, 6, and 12 weeks). Weekly physiotherapy. Pain assessment daily. Nutritional status review weekly during healing.",
    lifestyle: [
      "Move as much as safely possible — immobility causes muscle wasting and other complications",
      "Use prescribed mobility aids correctly",
      "Prevent future falls: ensure safe environment, good lighting, non-slip surfaces",
      "Engage in upper body exercises if lower limb is fractured (and vice versa)",
    ],
    medicationsNote:
      "Take pain medications before physiotherapy sessions for best participation. Calcium and vitamin D supplements as prescribed. If on blood thinners, monitor for excessive bruising. Report constipation from pain medications.",
  },
};

// ─────────────────────────────────────────────────────
//  UTILITY: Parse conditions from a string
// ─────────────────────────────────────────────────────

/**
 * Parses a condition string into an array of recognized condition keys.
 * Handles comma-separated, slash-separated, and common variations.
 * @param {string} conditionStr - e.g. "Diabetes, Hypertension" or "CKD/Heart Failure"
 * @returns {string[]} - array of keys matching DIET_PROFILES
 */
// ── Fuzzy string similarity (Levenshtein distance) ──
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const d = Array.from({ length: m + 1 }, (_, i) => [i]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i-1][j] + 1, d[i][j-1] + 1, d[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1));
  return d[m][n];
}

function similarity(a, b) {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

// ── Comprehensive condition keyword map ──
const CONDITION_MAP = {
  // Diabetes — common misspellings & synonyms
  diabetes: "diabetes", diabetic: "diabetes", "type 2 diabetes": "diabetes", "type 1 diabetes": "diabetes",
  dm: "diabetes", "dm2": "diabetes", "dm1": "diabetes", sugar: "diabetes", suger: "diabetes", shugar: "diabetes",
  sugr: "diabetes", "blood sugar": "diabetes", "high sugar": "diabetes", "sugar patient": "diabetes",
  diabeties: "diabetes", diabtes: "diabetes", dibeties: "diabetes", madhumeh: "diabetes",

  // Hypertension
  hypertension: "hypertension", "high blood pressure": "hypertension", "high bp": "hypertension", htn: "hypertension",
  "bp high": "hypertension", "bp problem": "hypertension", hipertension: "hypertension", hypertnsion: "hypertension",
  "blood pressure": "hypertension", "bp": "hypertension", "raised bp": "hypertension",

  // Kidney Disease
  kidney: "kidney_disease", renal: "kidney_disease", ckd: "kidney_disease", "chronic kidney": "kidney_disease",
  "kidney disease": "kidney_disease", "kidney failure": "kidney_disease", "renal failure": "kidney_disease",
  dialysis: "kidney_disease", "kidney problem": "kidney_disease", kidny: "kidney_disease",

  // Heart
  "heart failure": "heart_failure", "congestive heart": "heart_failure", chf: "heart_failure",
  cardiac: "heart_failure", "heart disease": "heart_failure", "heart problem": "heart_failure",
  "weak heart": "heart_failure", "heart attack": "heart_failure", "coronary": "heart_failure",

  // Parkinson's
  parkinsons: "parkinsons", "parkinson's": "parkinsons", parkinson: "parkinsons",
  "parkinson disease": "parkinsons", parkinsns: "parkinsons", parkinsan: "parkinsons",

  // Stroke
  stroke: "stroke_recovery", cerebrovascular: "stroke_recovery", cva: "stroke_recovery",
  paralysis: "stroke_recovery", "brain stroke": "stroke_recovery", "brain attack": "stroke_recovery",
  hemiplegia: "stroke_recovery", hemiparesis: "stroke_recovery",

  // Dementia
  dementia: "dementia", alzheimer: "dementia", "alzheimer's": "dementia", alzheimers: "dementia",
  "cognitive decline": "dementia", "memory loss": "dementia", "forgetfulness": "dementia",

  // COPD
  copd: "copd", "chronic obstructive": "copd", "lung disease": "copd", emphysema: "copd",
  "chronic bronchitis": "copd", asthma: "copd", "breathing problem": "copd", "respiratory": "copd",
  "saans ki bimari": "copd",

  // Osteoporosis
  osteoporosis: "osteoporosis", "bone loss": "osteoporosis", "brittle bones": "osteoporosis",
  "weak bones": "osteoporosis", osteoporsis: "osteoporosis", ostroporosis: "osteoporosis",

  // Gout
  gout: "gout", "gout attack": "gout", "uric acid": "gout", "high uric acid": "gout",
  gouty: "gout", hyperuricemia: "gout",

  // Arthritis
  arthritis: "arthritis", rheumatoid: "arthritis", osteoarthritis: "arthritis",
  "joint pain": "arthritis", "knee pain": "arthritis",
  arthrits: "arthritis", arthrtis: "arthritis", gathiya: "arthritis",

  // Joint swelling — gout is more specific than arthritis
  "joint swelling": "gout",

  // Anxiety/Depression
  anxiety: "anxiety_depression", depression: "anxiety_depression", "mental health": "anxiety_depression",
  "mood disorder": "anxiety_depression", stress: "anxiety_depression", insomnia: "anxiety_depression",
  "sleep problem": "anxiety_depression", "tension": "anxiety_depression",

  // Fracture
  fracture: "fracture_recovery", "broken bone": "fracture_recovery", "hip fracture": "fracture_recovery",
  "bone fracture": "fracture_recovery", "femur fracture": "fracture_recovery", "fall injury": "fracture_recovery",

  // Thyroid
  thyroid: "general", hypothyroid: "general", hyperthyroid: "general",

  // Cancer (map to general with high-cal needs)
  cancer: "general", tumor: "general",

  // Liver
  liver: "liver_cirrhosis", cirrhosis: "liver_cirrhosis", "liver disease": "liver_cirrhosis",
  "liver failure": "liver_cirrhosis", hepatic: "liver_cirrhosis", ascites: "liver_cirrhosis",
  "fatty liver": "liver_cirrhosis", hepatitis: "liver_cirrhosis",
};

// ── Human-friendly condition labels for UI ──
const CONDITION_LABELS = {
  diabetes: "Diabetes (Type 1/2, Blood Sugar)",
  hypertension: "Hypertension (High Blood Pressure)",
  kidney_disease: "Kidney Disease (CKD, Renal Failure)",
  heart_failure: "Heart Disease (Heart Failure, Cardiac)",
  parkinsons: "Parkinson's Disease",
  stroke_recovery: "Stroke Recovery (Paralysis, CVA)",
  dementia: "Dementia / Alzheimer's",
  copd: "COPD / Asthma (Respiratory)",
  osteoporosis: "Osteoporosis (Bone Loss)",
  gout: "Gout (High Uric Acid)",
  arthritis: "Arthritis (Joint Pain, Rheumatoid)",
  anxiety_depression: "Anxiety / Depression / Sleep Issues",
  fracture_recovery: "Fracture Recovery",
  liver_cirrhosis: "Liver Cirrhosis / Hepatic Disease",
  general: "General Elderly Diet",
};

/**
 * Get all available conditions the engine supports (for UI dropdowns/suggestions)
 */
function getAvailableConditions() {
  return Object.entries(CONDITION_LABELS).map(([key, label]) => ({ key, label }));
}

/**
 * Suggest matching conditions for a user query (fuzzy)
 */
function suggestConditions(query) {
  if (!query || query.length < 2) return getAvailableConditions();
  const q = query.toLowerCase().trim();

  // Score each condition
  const scored = getAvailableConditions().map(c => {
    const labelLower = c.label.toLowerCase();
    const keyLower = c.key.toLowerCase();

    // Exact substring match = highest score
    if (labelLower.includes(q) || keyLower.includes(q)) return { ...c, score: 1 };

    // Check if any keyword maps to this condition and matches
    for (const [keyword, condKey] of Object.entries(CONDITION_MAP)) {
      if (condKey === c.key && (keyword.includes(q) || similarity(q, keyword) > 0.6)) {
        return { ...c, score: 0.8 };
      }
    }

    // Fuzzy match on label
    const words = labelLower.split(/[\s\/(),]+/).filter(Boolean);
    for (const word of words) {
      if (similarity(q, word) > 0.65) return { ...c, score: 0.6 };
    }

    return { ...c, score: 0 };
  });

  return scored.filter(c => c.score > 0).sort((a, b) => b.score - a.score);
}

function parseConditions(conditionStr) {
  if (!conditionStr || typeof conditionStr !== "string") return ["general"];

  const input = conditionStr.toLowerCase().trim();
  const matched = [];

  // Split on commas, slashes, "and", semicolons, plus
  const parts = input.split(/[,\/;+]|\band\b/).map(s => s.trim()).filter(Boolean);

  for (const part of parts) {
    let bestMatch = null;
    let bestScore = 0;

    // 1. Try exact/partial keyword match first (min 3 chars for substring match)
    for (const [keyword, key] of Object.entries(CONDITION_MAP)) {
      if (part === keyword) {
        if (!matched.includes(key)) matched.push(key);
        bestMatch = key;
        break;
      }
      if (part.length >= 3 && (part.includes(keyword) || keyword.includes(part))) {
        if (!matched.includes(key)) matched.push(key);
        bestMatch = key;
        break;
      }
    }

    // 2. If no exact match, try fuzzy matching
    if (!bestMatch) {
      for (const [keyword, key] of Object.entries(CONDITION_MAP)) {
        const score = similarity(part, keyword);
        if (score > bestScore && score > 0.55) {
          bestScore = score;
          bestMatch = key;
        }
      }
      if (bestMatch && !matched.includes(bestMatch)) {
        matched.push(bestMatch);
      }
    }
  }

  return matched.length > 0 ? matched : ["general"];
}

// ─────────────────────────────────────────────────────
//  FUNCTION 1: generateDietPlan
// ─────────────────────────────────────────────────────

/**
 * Generates a comprehensive diet plan based on patient conditions.
 * For multiple conditions, merges plans using the most restrictive rules.
 *
 * @param {Object} patient - Patient data
 * @param {string} patient.name - Patient name
 * @param {number} patient.age - Patient age
 * @param {string} patient.gender - Patient gender
 * @param {string} patient.condition - Condition(s), e.g. "Diabetes, Hypertension"
 * @param {string} [patient.diagnosis] - Additional diagnosis info
 * @param {Object} [patient.vitals] - Current vitals
 * @param {string[]} [patient.allergies] - Known allergies
 * @returns {Object} Diet plan object
 */
function generateDietPlan(patient) {
  if (!patient) {
    return { error: "Patient data is required" };
  }

  const conditionStr = patient.condition || patient.diagnosis || "";
  const conditions = parseConditions(conditionStr);
  const allergies = patient.allergies || [];
  const age = patient.age || 70;

  // If user provided input but we couldn't match any condition → return caution, not a plan
  if (conditionStr.trim().length > 0 && conditions.length === 1 && conditions[0] === "general") {
    return {
      error: null,
      unrecognized: true,
      dietType: "Condition Not Recognized",
      calories: "—",
      meals: { breakfast: "—", midMorning: "—", lunch: "—", evening: "—", dinner: "—", bedtime: "—" },
      restrictions: [],
      tips: [],
      warnings: [`"${conditionStr}" was not found in our database of ${Object.keys(CONDITION_LABELS).length} conditions. We cannot generate a safe diet plan without recognizing the condition. Please try: ${Object.values(CONDITION_LABELS).slice(0, 5).join(", ")}.`],
      patientName: patient.name,
    };
  }

  // If single condition, use its plan directly
  if (conditions.length === 1) {
    const profile = DIET_PROFILES[conditions[0]] || DIET_PROFILES.general;
    return formatDietPlan(patient, profile, conditions, allergies, age);
  }

  // Multiple conditions: merge plans
  const mergedPlan = mergeDietPlans(conditions, allergies, age);
  return formatDietPlan(patient, mergedPlan, conditions, allergies, age);
}

/**
 * Merges multiple diet profiles, using the most restrictive rules.
 */
function mergeDietPlans(conditions, allergies, age) {
  const profiles = conditions.map((c) => DIET_PROFILES[c] || DIET_PROFILES.general);

  // Combine diet type names
  const dietType = profiles.map((p) => p.dietType.split("(")[0].trim()).join(" + ") + " (Combined)";

  // Use the lowest calorie range
  const calorieRanges = profiles.map((p) => {
    const match = p.calories.match(/(\d+)-(\d+)/);
    return match ? { min: parseInt(match[1]), max: parseInt(match[2]) } : { min: 1600, max: 2000 };
  });
  const minCal = Math.min(...calorieRanges.map((r) => r.min));
  const maxCal = Math.min(...calorieRanges.map((r) => r.max));
  const calories = `${minCal}-${maxCal} kcal/day (adjusted for multiple conditions)`;

  // ── PRIORITY HIERARCHY for meal construction ──
  // Level 1 (Life Threat): CKD (hyperkalemia), Heart Failure (fluid)
  // Level 2 (Acute): Gout flare
  // Level 3 (Chronic): Diabetes, Hypertension
  const hasCKD = conditions.includes("kidney_disease");
  const hasDiabetes = conditions.includes("diabetes");
  const hasGout = conditions.includes("gout");
  const hasParkinsons = conditions.includes("parkinsons");
  const hasHeart = conditions.includes("heart_failure");
  const hasHypertension = conditions.includes("hypertension");
  const needsSoftFood = conditions.some((c) => ["parkinsons", "stroke_recovery", "dementia"].includes(c));
  const needsFluidRestriction = conditions.some((c) => ["kidney_disease", "heart_failure", "liver_cirrhosis"].includes(c));
  const needsLowSodium = conditions.some((c) => ["hypertension", "heart_failure", "kidney_disease", "stroke_recovery", "liver_cirrhosis"].includes(c));

  // ── SAFE MEAL CONSTRUCTION (not just copying first profile) ──
  // Priority: CKD-safe > Gout-safe > Diabetic-safe > General
  let meals;

  if (hasCKD) {
    // CKD is the most dangerous — use CKD meals as base, then modify
    const ckdMeals = { ...DIET_PROFILES.kidney_disease.meals };

    if (hasDiabetes) {
      // CKD + Diabetes: Replace white rice with leached parboiled rice or barley
      ckdMeals.breakfast = "Barley (jau) porridge or besan chilla (2 pcs), 1 boiled egg white, tea (no sugar, limited milk)";
      ckdMeals.lunch = "Leached parboiled rice (1 cup — soak 2hrs, boil, drain), lauki/tinda sabzi (boiled, leached), thin moong dal (1/2 katori), cucumber salad";
      ckdMeals.dinner = "1 roti (wheat flour, not multigrain/brown), parwal/tinda sabzi, egg white omelette or small chicken (50g max)";
      ckdMeals.evening = "Arrowroot biscuits (2-3, sugar-free), lemon water (counted in fluid limit)";
      ckdMeals.bedtime = "Small plain biscuit (sugar-free) — NO kheer, NO milk";
    }

    if (hasGout) {
      // Remove any dal/legume from acute phase, replace with egg whites
      ckdMeals.lunch = ckdMeals.lunch.replace(/dal.*?,/i, "egg white (1-2),");
      ckdMeals.dinner = ckdMeals.dinner.replace(/dal/i, "low-fat curd (2 tbsp)");
      if (!ckdMeals.midMorning.includes("cherry")) {
        ckdMeals.midMorning = "Peeled apple or cherries (5-6), plain crackers";
      }
    }

    meals = ckdMeals;
  } else if (hasGout && hasDiabetes) {
    // Gout + Diabetes: Low purine + low GI
    meals = {
      breakfast: "Barley porridge or oat dalia (no sugar), 1 boiled egg white, green tea",
      midMorning: "Cherries (10-12), skim milk lassi (no sugar), 4-5 almonds",
      lunch: "2 multigrain roti, lauki/parwal sabzi (low oil), very small moong dal (1/4 katori only), cucumber raita (low fat)",
      evening: "Roasted makhana, green tea, 1 small pear",
      dinner: "1 roti, bottle gourd soup, grilled chicken breast (60g) or tofu, sauteed capsicum",
      bedtime: "Warm skim milk (small cup) or chamomile tea",
    };
  } else if (hasParkinsons) {
    // Parkinson's: Use parkinsons profile with strict protein redistribution
    meals = { ...DIET_PROFILES.parkinsons.meals };
  } else {
    // Default: use first condition's meals
    meals = { ...profiles[0].meals };
  }

  // ── POST-PROCESSING: Remove dangerous foods that slipped through ──
  const DANGEROUS_FOR_CKD = ["palak", "spinach", "methi", "brown rice", "whole grain", "multigrain", "coconut water", "banana", "orange", "tomato", "potato", "mushroom", "rajma", "chole"];
  const DANGEROUS_FOR_GOUT = ["organ meat", "liver", "kidney", "brain", "shellfish", "beer", "wine"];
  const DANGEROUS_FOR_DIABETES = ["sugar", "jaggery", "honey", "gulab jamun", "jalebi", "halwa", "fruit juice"];

  if (hasCKD || hasGout || hasDiabetes) {
    for (const [slot, meal] of Object.entries(meals)) {
      let safe = meal;
      if (hasCKD) {
        DANGEROUS_FOR_CKD.forEach(food => {
          const regex = new RegExp(food, "gi");
          if (regex.test(safe)) {
            safe = safe.replace(regex, "lauki/tinda (CKD-safe)");
          }
        });
      }
      meals[slot] = safe;
    }
  }

  // Add texture note
  if (needsSoftFood) {
    for (const [slot, meal] of Object.entries(meals)) {
      meals[slot] = meal + " (ensure soft/pureed texture)";
    }
  }

  // Merge all restrictions (deduplicated)
  const allRestrictions = [];
  const seenRestrictions = new Set();
  for (const profile of profiles) {
    for (const r of profile.restrictions) {
      const key = r.toLowerCase().slice(0, 30);
      if (!seenRestrictions.has(key)) {
        seenRestrictions.add(key);
        allRestrictions.push(r);
      }
    }
  }
  if (needsFluidRestriction && !allRestrictions.some((r) => r.toLowerCase().includes("fluid"))) {
    allRestrictions.unshift("Restrict fluid intake as advised by doctor");
  }
  if (needsLowSodium && !allRestrictions.some((r) => r.toLowerCase().includes("sodium"))) {
    allRestrictions.unshift("Strict low-sodium diet — under 1500 mg/day");
  }

  // Merge all tips
  const allTips = [];
  const seenTips = new Set();
  for (const profile of profiles) {
    for (const t of profile.tips) {
      const key = t.toLowerCase().slice(0, 30);
      if (!seenTips.has(key)) {
        seenTips.add(key);
        allTips.push(t);
      }
    }
  }

  // Merge all warnings
  const allWarnings = [];
  const seenWarnings = new Set();
  for (const profile of profiles) {
    for (const w of profile.warnings) {
      const key = w.toLowerCase().slice(0, 30);
      if (!seenWarnings.has(key)) {
        seenWarnings.add(key);
        allWarnings.push(w);
      }
    }
  }

  // When BOTH liver cirrhosis AND CKD are present — the protein paradox
  const hasLiver = conditions.includes("liver_cirrhosis");
  if (hasLiver && hasCKD) {
    // Use CKD base meals but adjust protein to liver-safe levels
    meals.breakfast = "Barley porridge, 1 egg white, toast (no butter), tea (no sugar, limited milk)";
    meals.lunch = "Leached parboiled rice (1 cup), lauki sabzi (boiled), thin moong dal (1/4 katori only — vegetable protein), cucumber";
    meals.dinner = "1 soft roti, parwal/tinda sabzi, small tofu portion (50g) or BCAA supplement — NO paneer/soya (high potassium+phosphorus)";
    meals.midMorning = "Peeled apple, 2 plain crackers";
    meals.evening = "Glucose biscuits (2), lemon water (counted in fluid limit)";
    meals.bedtime = "Late-evening carb snack (2 crackers) — prevents overnight muscle catabolism";

    // Add protein paradox warning
    allWarnings.unshift("PROTEIN PARADOX: Liver needs protein (1.0-1.2g/kg) to prevent muscle wasting, BUT CKD Stage 4 needs protein restriction (0.6-0.8g/kg). COMPROMISE: Target 0.8-1.0g/kg using VEGETABLE PROTEIN ONLY (dal, tofu). Avoid paneer/soya (high K+/PO4). BCAA supplements preferred if available.");
  }

  // ── Gout + Hypertension conflict resolution ──
  if (hasGout && hasHypertension) {
    allWarnings.unshift(
      "DIET CONFLICT: DASH diet for hypertension encourages legumes, but gout requires low-purine foods. Prioritize low-purine with low-sodium modifications. Use skim dairy for both BP and uric acid benefits."
    );
    // Remove any DASH-style tip encouraging legumes, replace with gout-safe guidance
    const legumeTipIdx = allTips.findIndex((t) => t.toLowerCase().includes("potassium-rich") && t.toLowerCase().includes("spinach"));
    if (legumeTipIdx !== -1) {
      allTips[legumeTipIdx] += " (NOTE: limit spinach due to gout — prefer banana, coconut water for potassium)";
    }
  }

  // Drug-diet conflict detection
  const drugDietConflicts = [];
  const medications = (patient.medications || []).map(m => (m.name || m).toLowerCase());

  if (medications.some(m => m.includes("warfarin") || m.includes("coumadin") || m.includes("acitrom"))) {
    drugDietConflicts.push({
      drug: "Warfarin",
      conflict: "Avoid large amounts of Vitamin K-rich foods (spinach, kale, broccoli, green leafy vegetables). Maintain CONSISTENT Vitamin K intake — don't suddenly increase or decrease.",
      severity: "high",
      source: "AHA Warfarin-Diet Guidelines",
    });
  }

  if (medications.some(m => m.includes("metformin"))) {
    drugDietConflicts.push({
      drug: "Metformin",
      conflict: "Avoid excessive alcohol — increases risk of lactic acidosis. Take with meals to reduce GI side effects.",
      severity: "moderate",
      source: "ADA 2024",
    });
  }

  if (medications.some(m => m.includes("levodopa") || m.includes("syndopa") || m.includes("sinemet"))) {
    drugDietConflicts.push({
      drug: "Levodopa",
      conflict: "Redistribute protein intake: LOW protein during daytime (when medication is active), HIGH protein at dinner. Protein competes with levodopa absorption.",
      severity: "high",
      source: "Movement Disorders Society",
    });
  }

  if (medications.some(m => m.includes("lithium"))) {
    drugDietConflicts.push({
      drug: "Lithium",
      conflict: "Maintain consistent sodium and fluid intake. Dehydration or sudden sodium changes affect lithium levels dangerously.",
      severity: "high",
      source: "APA Guidelines",
    });
  }

  if (medications.some(m => m.includes("digoxin") || m.includes("lanoxin"))) {
    drugDietConflicts.push({
      drug: "Digoxin",
      conflict: "Avoid high-fiber meals within 2 hours of dose (reduces absorption). Monitor potassium — hypokalemia increases digoxin toxicity.",
      severity: "high",
      source: "AHA Heart Failure Guidelines",
    });
  }

  if (medications.some(m => m.includes("maoi") || m.includes("tranylcypromine") || m.includes("phenelzine"))) {
    drugDietConflicts.push({
      drug: "MAO Inhibitor",
      conflict: "AVOID tyramine-rich foods: aged cheese, fermented foods, soy sauce, red wine, cured meats. Can cause hypertensive crisis.",
      severity: "critical",
      source: "FDA Drug Safety Communication",
    });
  }

  if (medications.some(m => m.includes("statin") || m.includes("atorvastatin") || m.includes("rosuvastatin"))) {
    drugDietConflicts.push({
      drug: "Statin",
      conflict: "Avoid grapefruit and grapefruit juice (CYP3A4 inhibitor — increases statin blood levels and side effect risk).",
      severity: "moderate",
      source: "FDA Drug Label",
    });
  }

  // Personalization context
  const personalization = {
    adjustedCalories: patient.weight ? Math.round(patient.weight * (patient.age >= 65 ? 25 : 30)) : null,
    renalAdjustment: patient.labs?.creatinine > 1.5 ? "Protein restricted to 0.6-0.8g/kg/day due to impaired renal function" : null,
    hba1cNote: patient.labs?.hba1c > 7 ? `HbA1c ${patient.labs.hba1c}% — stricter carb control recommended (ADA target <7%)` : null,
    bmiNote: patient.weight && patient.height ? (() => {
      const bmi = patient.weight / ((patient.height / 100) ** 2);
      if (bmi > 30) return `BMI ${bmi.toFixed(1)} — obesity. Calorie reduction advised.`;
      if (bmi < 18.5) return `BMI ${bmi.toFixed(1)} — underweight. Calorie increase advised.`;
      return null;
    })() : null,
  };

  return { dietType, calories, meals, restrictions: allRestrictions, tips: allTips, warnings: allWarnings, drugDietConflicts, personalization };
}

/**
 * Formats the final diet plan output object.
 */
function formatDietPlan(patient, profile, conditions, allergies, age) {
  const plan = {
    patientName: patient.name || "Unknown",
    age: age,
    gender: patient.gender || "Not specified",
    conditions: conditions.join(", "),
    dietType: profile.dietType,
    calories: profile.calories,
    meals: { ...profile.meals },
    restrictions: [...profile.restrictions],
    tips: [...profile.tips],
    warnings: [...profile.warnings],
    generatedAt: new Date().toISOString(),
    note: "This diet plan is auto-generated for guidance. Always consult with a dietitian or physician before making significant dietary changes.",
  };

  // Add age-specific adjustments
  if (age >= 85) {
    plan.tips.push("Extra attention to hydration — elderly patients often feel less thirsty");
    plan.tips.push("Consider calorie-dense foods in smaller portions if appetite is poor");
    plan.calories += " (may need adjustment for very elderly — consult dietitian)";
  } else if (age >= 75) {
    plan.tips.push("Ensure adequate protein to prevent muscle wasting (sarcopenia)");
  }

  // Add allergy warnings
  if (allergies && allergies.length > 0) {
    plan.allergyWarning = `ALLERGIES: Patient is allergic to ${allergies.join(", ")}. Avoid these ingredients in all meals.`;
    plan.restrictions.push(`ALLERGY ALERT: Strictly avoid ${allergies.join(", ")}`);
  }

  return plan;
}

// ─────────────────────────────────────────────────────
//  FUNCTION 2: generateHealthAdvice
// ─────────────────────────────────────────────────────

/**
 * Generates comprehensive health advice based on patient data, vitals, and diagnosis.
 *
 * @param {Object} patient - Patient info { name, age, gender, condition }
 * @param {Object} [vitals] - Current vitals { temp, bp, pulse, spo2, glucose, weight }
 * @param {string} [diagnosis] - Diagnosis or condition string
 * @returns {Object} Health advice object
 */
function generateHealthAdvice(patient, vitals, diagnosis) {
  if (!patient) {
    return { error: "Patient data is required" };
  }

  const conditionStr = diagnosis || patient.condition || patient.diagnosis || "";
  const conditions = parseConditions(conditionStr);

  // Analyze vitals if provided
  const vitalsAnalysis = vitals ? analyzeVitals(vitals, { age: patient.age, conditions }) : null;

  // Gather advice from all conditions
  const allRecommendations = [];
  const allWarnings = [];
  const allLifestyle = [];
  const summaryParts = [];
  const followUpParts = [];
  const medicationNotes = [];

  const seenRec = new Set();
  const seenWarn = new Set();
  const seenLife = new Set();

  for (const condition of conditions) {
    const advice = HEALTH_ADVICE_DB[condition] || HEALTH_ADVICE_DB.general || null;
    if (!advice) continue;

    summaryParts.push(advice.summary);

    for (const rec of advice.recommendations) {
      const key = rec.slice(0, 30).toLowerCase();
      if (!seenRec.has(key)) {
        seenRec.add(key);
        allRecommendations.push(rec);
      }
    }

    for (const warn of advice.warningsSigns) {
      const key = warn.slice(0, 30).toLowerCase();
      if (!seenWarn.has(key)) {
        seenWarn.add(key);
        allWarnings.push(warn);
      }
    }

    for (const tip of advice.lifestyle) {
      const key = tip.slice(0, 30).toLowerCase();
      if (!seenLife.has(key)) {
        seenLife.add(key);
        allLifestyle.push(tip);
      }
    }

    followUpParts.push(advice.followUp);
    medicationNotes.push(advice.medicationsNote);
  }

  // Build the final advice object
  const result = {
    patientName: patient.name || "Unknown",
    age: patient.age || "Unknown",
    gender: patient.gender || "Not specified",
    conditions: conditions.join(", "),
    summary: summaryParts.join(" "),
    recommendations: allRecommendations.slice(0, 10), // Cap at 10 for readability
    warnings: allWarnings.slice(0, 8),
    followUp: followUpParts.join(" | "),
    lifestyle: allLifestyle.slice(0, 8),
    medications_note: medicationNotes.join(" | "),
    generatedAt: new Date().toISOString(),
  };

  // Add vitals-based recommendations if available
  if (vitalsAnalysis) {
    result.vitalsStatus = vitalsAnalysis.status;
    result.vitalsFindings = vitalsAnalysis.findings;
    result.vitalsAlerts = vitalsAnalysis.alerts;

    // Add urgent recommendations based on vitals
    if (vitalsAnalysis.status === "Alert") {
      result.urgentNote = "ATTENTION: Vitals indicate an alert condition. Immediate medical review recommended.";
    } else if (vitalsAnalysis.status === "Caution") {
      result.urgentNote = "NOTE: Some vitals are outside normal range. Monitor closely and inform physician.";
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────
//  FUNCTION 3: analyzeVitals
// ─────────────────────────────────────────────────────

/**
 * Analyzes patient vitals and returns status, findings, and alerts.
 *
 * @param {Object} vitals - Patient vitals
 * @param {number|string} [vitals.temp] - Temperature in Fahrenheit (e.g. 98.6 or "98.6")
 * @param {string} [vitals.bp] - Blood pressure in "systolic/diastolic" format (e.g. "120/80")
 * @param {number|string} [vitals.pulse] - Pulse/heart rate in bpm
 * @param {number|string} [vitals.spo2] - Oxygen saturation percentage
 * @param {number|string} [vitals.glucose] - Blood glucose in mg/dL
 * @param {number|string} [vitals.weight] - Weight in kg (for tracking, not analysis)
 * @param {Object} [patientContext] - Optional patient context for age-adjusted analysis
 * @param {number} [patientContext.age] - Patient age in years
 * @param {string[]} [patientContext.conditions] - Known conditions
 * @returns {Object} - { status, findings[], alerts[] }
 */
function analyzeVitals(vitals, patientContext) {
  if (!vitals || typeof vitals !== "object") {
    return {
      status: "Unknown",
      findings: ["No vitals data provided"],
      alerts: [],
    };
  }

  const findings = [];
  const alerts = [];
  let overallStatus = "Normal"; // Normal, Caution, Alert

  // Helper to escalate overall status
  function escalate(level) {
    const levels = { Normal: 0, Caution: 1, Alert: 2 };
    if (levels[level] > levels[overallStatus]) {
      overallStatus = level;
    }
  }

  // ── Temperature Analysis ──
  if (vitals.temp !== undefined && vitals.temp !== null && vitals.temp !== "") {
    const temp = parseFloat(vitals.temp);
    if (!isNaN(temp)) {
      if (temp < 95) {
        findings.push(`Temperature: ${temp}°F — Severe hypothermia`);
        alerts.push("CRITICAL: Severe hypothermia detected. Immediate medical attention required.");
        escalate("Alert");
      } else if (temp < 97) {
        findings.push(`Temperature: ${temp}°F — Below normal (mild hypothermia)`);
        alerts.push("Low body temperature. Ensure patient is warm. Monitor closely.");
        escalate("Caution");
      } else if (temp <= 99) {
        findings.push(`Temperature: ${temp}°F — Normal`);
      } else if (temp <= 99.5) {
        findings.push(`Temperature: ${temp}°F — Slightly elevated (low-grade)`);
        escalate("Caution");
      } else if (temp <= 101) {
        findings.push(`Temperature: ${temp}°F — Fever`);
        alerts.push("Fever detected. Monitor for infection. Ensure hydration and consider antipyretics.");
        escalate("Caution");
      } else if (temp <= 103) {
        findings.push(`Temperature: ${temp}°F — High fever`);
        alerts.push("High fever. Medical evaluation needed. Check for infection source.");
        escalate("Alert");
      } else {
        findings.push(`Temperature: ${temp}°F — Dangerously high fever`);
        alerts.push("CRITICAL: Very high fever. Immediate medical intervention required.");
        escalate("Alert");
      }
    }
  }

  // ── Blood Pressure Analysis (age-adjusted per JNC-8) ──
  const patientAge = patientContext && patientContext.age ? parseInt(patientContext.age) : null;
  const isElderly = patientAge !== null && patientAge >= 60;

  if (vitals.bp && typeof vitals.bp === "string" && vitals.bp.includes("/")) {
    const bpParts = vitals.bp.split("/");
    const systolic = parseInt(bpParts[0]);
    const diastolic = parseInt(bpParts[1]);

    if (!isNaN(systolic) && !isNaN(diastolic)) {
      if (systolic > 180 || diastolic > 120) {
        findings.push(`BP: ${vitals.bp} mmHg — Hypertensive Crisis`);
        alerts.push("CRITICAL: Hypertensive crisis. Immediate medical attention required. Do not wait.");
        escalate("Alert");
      } else if (isElderly) {
        // JNC-8 relaxed targets for age >= 60: target < 150/90
        if (systolic >= 150 || diastolic >= 90) {
          if (systolic >= 160 || diastolic >= 100) {
            findings.push(`BP: ${vitals.bp} mmHg — Mildly elevated for age (age ${patientAge}, JNC-8: target <150/90 for age ≥60)`);
            alerts.push("Blood pressure above relaxed elderly target (JNC-8: <150/90 for age ≥60). Inform physician. Review medications.");
            escalate("Alert");
          } else {
            findings.push(`BP: ${vitals.bp} mmHg — Mildly elevated for age (age ${patientAge}, JNC-8: target <150/90 for age ≥60)`);
            alerts.push("Blood pressure slightly above elderly target. Monitor closely and review with physician.");
            escalate("Caution");
          }
        } else if (systolic >= 140 || diastolic >= 85) {
          findings.push(`BP: ${vitals.bp} mmHg — Acceptable for age (JNC-8: target <150/90 for age ≥60)`);
          escalate("Caution");
        } else if (systolic >= 90 && diastolic >= 60) {
          findings.push(`BP: ${vitals.bp} mmHg — Normal`);
        } else {
          findings.push(`BP: ${vitals.bp} mmHg — Low (Hypotension)`);
          const bpConditions = (patientContext?.conditions || []).map(c => c.toLowerCase());
          const hasFluidRisk = bpConditions.some(c => c.includes("ckd") || c.includes("kidney") || c.includes("renal") || c.includes("heart") || c.includes("cardiac") || c.includes("chf") || c.includes("liver") || c.includes("cirrhosis") || c.includes("hepatic"));
          if (hasFluidRisk) {
            alerts.push("Low blood pressure. Monitor closely. CAUTION: Do NOT give aggressive IV fluids — patient has CKD/Heart Failure/Liver disease. Fluid overload risk. Contact physician for vasopressor assessment.");
          } else {
            alerts.push("Low blood pressure. Monitor for dizziness, fainting. Ensure adequate hydration.");
          }
          escalate("Caution");
        }
      } else {
        // Standard adult thresholds
        if (systolic >= 140 || diastolic >= 90) {
          findings.push(`BP: ${vitals.bp} mmHg — High (Stage 2 Hypertension)`);
          alerts.push("High blood pressure (Stage 2). Inform physician. Review medications and sodium intake.");
          escalate("Alert");
        } else if (systolic >= 130 || diastolic > 80) {
          findings.push(`BP: ${vitals.bp} mmHg — Elevated (Stage 1 Hypertension)`);
          alerts.push("Elevated blood pressure (Stage 1). Monitor closely. Review diet and stress levels.");
          escalate("Caution");
        } else if (systolic > 120 && diastolic <= 80) {
          findings.push(`BP: ${vitals.bp} mmHg — Elevated`);
          escalate("Caution");
        } else if (systolic >= 90 && diastolic >= 60) {
          findings.push(`BP: ${vitals.bp} mmHg — Normal`);
        } else {
          findings.push(`BP: ${vitals.bp} mmHg — Low (Hypotension)`);
          const bpConditions2 = (patientContext?.conditions || []).map(c => c.toLowerCase());
          const hasFluidRisk2 = bpConditions2.some(c => c.includes("ckd") || c.includes("kidney") || c.includes("renal") || c.includes("heart") || c.includes("cardiac") || c.includes("chf") || c.includes("liver") || c.includes("cirrhosis") || c.includes("hepatic"));
          if (hasFluidRisk2) {
            alerts.push("Low blood pressure. Monitor closely. CAUTION: Do NOT give aggressive IV fluids — patient has CKD/Heart Failure/Liver disease. Fluid overload risk. Contact physician for vasopressor assessment.");
          } else {
            alerts.push("Low blood pressure. Monitor for dizziness, fainting. Ensure adequate hydration.");
          }
          escalate("Caution");
        }
      }
    }
  }

  // ── Pulse/Heart Rate Analysis ──
  if (vitals.pulse !== undefined && vitals.pulse !== null && vitals.pulse !== "") {
    const pulse = parseInt(vitals.pulse);
    if (!isNaN(pulse)) {
      if (pulse < 40) {
        findings.push(`Pulse: ${pulse} bpm — Severe bradycardia`);
        alerts.push("CRITICAL: Very low heart rate. Immediate medical evaluation needed.");
        escalate("Alert");
      } else if (pulse < 60) {
        findings.push(`Pulse: ${pulse} bpm — Low (Bradycardia)`);
        alerts.push("Low heart rate (bradycardia). Monitor for dizziness, fatigue. Inform physician.");
        escalate("Caution");
      } else if (pulse <= 100) {
        findings.push(`Pulse: ${pulse} bpm — Normal`);
      } else if (pulse <= 120) {
        findings.push(`Pulse: ${pulse} bpm — Elevated (Tachycardia)`);
        alerts.push("Elevated heart rate (tachycardia). Check for pain, anxiety, fever, or dehydration.");
        escalate("Caution");
      } else {
        findings.push(`Pulse: ${pulse} bpm — High (Significant Tachycardia)`);
        alerts.push("Significantly elevated heart rate. Medical evaluation recommended. Check for underlying cause.");
        escalate("Alert");
      }
    }
  }

  // ── SpO2 (Oxygen Saturation) Analysis ──
  if (vitals.spo2 !== undefined && vitals.spo2 !== null && vitals.spo2 !== "") {
    const spo2 = parseInt(vitals.spo2);
    if (!isNaN(spo2)) {
      if (spo2 >= 95) {
        findings.push(`SpO2: ${spo2}% — Normal`);
      } else if (spo2 >= 90) {
        findings.push(`SpO2: ${spo2}% — Low (Mild Hypoxemia)`);
        alerts.push("Low oxygen saturation. Administer supplemental oxygen if available. Position upright. Inform physician.");
        escalate("Caution");
      } else if (spo2 >= 85) {
        findings.push(`SpO2: ${spo2}% — Critical (Moderate Hypoxemia)`);
        alerts.push("CRITICAL: Oxygen saturation dangerously low. Immediate oxygen therapy and medical attention required.");
        escalate("Alert");
      } else {
        findings.push(`SpO2: ${spo2}% — Severe Hypoxemia`);
        alerts.push("EMERGENCY: Severe hypoxemia. Immediate emergency intervention required.");
        escalate("Alert");
      }
    }
  }

  // ── Blood Glucose Analysis ──
  if (vitals.glucose !== undefined && vitals.glucose !== null && vitals.glucose !== "") {
    const glucose = parseFloat(vitals.glucose);
    if (!isNaN(glucose)) {
      if (glucose < 54) {
        findings.push(`Glucose: ${glucose} mg/dL — Severe Hypoglycemia`);
        alerts.push("CRITICAL: Severe low blood sugar. Give fast-acting glucose immediately. Seek emergency help if unconscious.");
        escalate("Alert");
      } else if (glucose < 70) {
        findings.push(`Glucose: ${glucose} mg/dL — Low (Hypoglycemia)`);
        alerts.push("Low blood sugar. Give 15g of fast-acting carbs (glucose tablet, juice, sugar). Recheck in 15 minutes.");
        escalate("Caution");
      } else if (glucose <= 140) {
        findings.push(`Glucose: ${glucose} mg/dL — Normal`);
      } else if (glucose <= 200) {
        findings.push(`Glucose: ${glucose} mg/dL — Elevated`);
        alerts.push("Elevated blood sugar. Review recent diet, medication timing, and activity. Monitor and recheck.");
        escalate("Caution");
      } else if (glucose <= 300) {
        findings.push(`Glucose: ${glucose} mg/dL — High (Hyperglycemia)`);
        alerts.push("High blood sugar. Inform physician. Ensure medication compliance. Increase hydration.");
        escalate("Alert");
      } else {
        findings.push(`Glucose: ${glucose} mg/dL — Dangerously High`);
        alerts.push("CRITICAL: Dangerously high blood sugar. Immediate medical intervention required. Check for ketones if diabetic.");
        escalate("Alert");
      }
    }
  }

  // ── Weight (informational only) ──
  if (vitals.weight !== undefined && vitals.weight !== null && vitals.weight !== "") {
    const weight = parseFloat(vitals.weight);
    if (!isNaN(weight)) {
      findings.push(`Weight: ${weight} kg — Recorded for tracking`);
    }
  }

  // ── Cross-Vital Correlation Checks ──
  const glucoseVal = vitals.glucose !== undefined && vitals.glucose !== null && vitals.glucose !== "" ? parseFloat(vitals.glucose) : NaN;
  const pulseVal = vitals.pulse !== undefined && vitals.pulse !== null && vitals.pulse !== "" ? parseInt(vitals.pulse) : NaN;
  const tempVal = vitals.temp !== undefined && vitals.temp !== null && vitals.temp !== "" ? parseFloat(vitals.temp) : NaN;
  const spo2Val = vitals.spo2 !== undefined && vitals.spo2 !== null && vitals.spo2 !== "" ? parseInt(vitals.spo2) : NaN;

  // Critical hypoglycemia — regardless of other vitals
  if (!isNaN(glucoseVal) && glucoseVal <= 54) {
    alerts.push("CRITICAL HYPOGLYCEMIA: Glucose ≤54 mg/dL. Administer fast-acting glucose immediately. If patient is unconscious or unable to swallow, call emergency services. Do NOT give insulin.");
    escalate("Alert");
  }

  // Hypoglycemic tachycardia correlation
  if (!isNaN(glucoseVal) && !isNaN(pulseVal) && glucoseVal <= 70 && glucoseVal > 54 && pulseVal >= 100) {
    findings.push(`Cross-vital: Glucose ${glucoseVal} mg/dL + Pulse ${pulseVal} bpm — Suspected Hypoglycemic Tachycardia`);
    alerts.push("EMERGENCY: Suspected Hypoglycemic Tachycardia. Administer 15g fast-acting carbs immediately (3-4 glucose tablets, 1/2 glass juice, or 1 tablespoon honey). Recheck glucose in 15 minutes. Do NOT give insulin.");
    escalate("Alert");
  }

  // Possible Diabetic Ketoacidosis
  if (!isNaN(glucoseVal) && !isNaN(tempVal) && glucoseVal >= 250 && tempVal >= 100) {
    findings.push(`Cross-vital: Glucose ${glucoseVal} mg/dL + Temp ${tempVal}°F — Possible Diabetic Ketoacidosis`);
    alerts.push("Possible Diabetic Ketoacidosis — check ketones, contact physician immediately");
    escalate("Alert");
  }

  // Respiratory distress with compensatory tachycardia
  if (!isNaN(spo2Val) && !isNaN(pulseVal) && spo2Val <= 92 && pulseVal >= 100) {
    findings.push(`Cross-vital: SpO2 ${spo2Val}% + Pulse ${pulseVal} bpm — Respiratory distress with compensatory tachycardia`);
    alerts.push("Respiratory distress with compensatory tachycardia — administer oxygen, elevate head of bed, call physician immediately.");
    escalate("Alert");
  }

  // CKD/Heart Failure + SpO2 drop + Tachycardia → Fluid Overload / Pulmonary Edema
  const patConditions = (patientContext?.conditions || []).map(c => c.toLowerCase());
  const hasCKDContext = patConditions.some(c => c.includes("ckd") || c.includes("kidney") || c.includes("renal"));
  const hasHeartContext = patConditions.some(c => c.includes("heart") || c.includes("cardiac") || c.includes("chf"));
  if ((hasCKDContext || hasHeartContext) && !isNaN(spo2Val) && !isNaN(pulseVal) && spo2Val <= 94 && pulseVal >= 100) {
    findings.push(`Cross-vital: SpO2 ${spo2Val}% + HR ${pulseVal} in CKD/Heart patient — POSSIBLE FLUID OVERLOAD / PULMONARY EDEMA`);
    alerts.push("WARNING: In a CKD/Heart Failure patient, low SpO2 + tachycardia suggests FLUID OVERLOAD, NOT dehydration. DO NOT give IV fluids. Sit patient upright, administer oxygen, consider diuretic. Urgent physician review needed.");
    escalate("Alert");
  }

  // Low BP + Low HR in elderly → Possible over-medication / Beta-blocker excess
  if (vitals.bp && !isNaN(pulseVal) && patientAge >= 65) {
    const bpCheck = String(vitals.bp).match(/(\d+)\s*[\/\-]\s*(\d+)/);
    const sysBP = bpCheck ? parseInt(bpCheck[1]) : NaN;
    if (!isNaN(sysBP) && sysBP <= 110 && pulseVal <= 60) {
      findings.push(`Cross-vital: BP ${vitals.bp} + HR ${pulseVal} in elderly (${patientAge}yo) — Possible over-medication or bradycardia`);
      alerts.push("LOW BP + LOW HR in elderly patient: Assess for over-medication (beta-blockers, calcium channel blockers). HIGH FALL RISK. Hold antihypertensives and contact physician. Do NOT give more BP medication.");
      escalate("Alert");
    }
  }

  // Sepsis screening: Low BP + High HR + Fever + Low SpO2
  if (!isNaN(tempVal) && !isNaN(pulseVal) && vitals.bp) {
    const bpSepsis = String(vitals.bp).match(/(\d+)/);
    const sysSepsis = bpSepsis ? parseInt(bpSepsis[1]) : NaN;
    if (sysSepsis <= 100 && pulseVal >= 100 && tempVal >= 100.0) {
      findings.push("Cross-vital: BP ≤100 + HR ≥100 + Fever — SEPSIS SCREENING POSITIVE (qSOFA ≥2)");
      alerts.push("CRITICAL: Suspected SEPSIS. qSOFA score ≥2. Initiate Sepsis Bundle: blood cultures, broad-spectrum antibiotics within 1 hour, lactate level. If CKD/Heart present: suspect CARDIORENAL SYNDROME TYPE 5 (sepsis-induced multi-organ failure). ICU consultation recommended.");
      escalate("Alert");
    }
  }

  // If no vitals were analyzed
  if (findings.length === 0) {
    findings.push("No valid vitals data provided for analysis");
  }

  return {
    status: overallStatus,
    findings,
    alerts,
    analyzedAt: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────
//  EXPORTS
// ─────────────────────────────────────────────────────

export { generateDietPlan, generateHealthAdvice, analyzeVitals, getAvailableConditions, suggestConditions };
