import type { Condition } from '@/types';

export const conditions: Condition[] = [
  {
    id: 'cardiac',
    name: 'Cardiac Emergency',
    urgency: 'critical',
    confidence: 92,
    description: 'Symptoms suggest a possible heart attack or cardiac event requiring immediate medical attention.',
    recommendedActions: [
      'Call 112 or emergency services immediately',
      'Keep the person calm and seated',
      'If prescribed, help them take nitroglycerin',
      'Prepare aspirin (325mg) if not allergic',
      'Unlock the door for emergency responders',
    ],
    firstAid: [
      'Have the person sit down, rest, and try to keep calm',
      'Loosen any tight clothing',
      'Ask if they take heart medication and help them take it',
      'If the person is unconscious, begin CPR (100-120 compressions/min)',
      'Use an AED if available and trained',
    ],
    warnings: [
      'Do NOT let the person drive themselves to the hospital',
      'Do NOT give food or water',
      'Do NOT leave the person alone',
    ],
    relatedConditions: ['Angina', 'Arrhythmia'],
  },
  {
    id: 'stroke',
    name: 'Stroke',
    urgency: 'critical',
    confidence: 89,
    description: 'Signs indicate a possible stroke. Time is critical — every minute matters.',
    recommendedActions: [
      'Call 112 immediately — note the time symptoms started',
      'Do NOT give food, drink, or medication',
      'Keep the person lying down with head slightly elevated',
      'Note symptom onset time for emergency staff',
    ],
    firstAid: [
      'Help the person lie down with head and shoulders slightly elevated',
      'Turn their head to the side if vomiting',
      'Loosen restrictive clothing',
      'Do not move the person if they have fallen',
      'Reassure them while waiting for help',
    ],
    warnings: [
      'Do NOT give aspirin — may worsen hemorrhagic stroke',
      'Do NOT give food or water',
      'Do NOT drive them yourself — call an ambulance',
    ],
    relatedConditions: ['TIA', 'Brain Hemorrhage'],
  },
  {
    id: 'anaphylaxis',
    name: 'Anaphylaxis',
    urgency: 'critical',
    confidence: 95,
    description: 'Severe allergic reaction. Epinephrine must be administered immediately.',
    recommendedActions: [
      'Administer EpiPen if available (outer thigh)',
      'Call 112 immediately',
      'Lay the person flat, elevate legs',
      'Be ready to perform CPR if needed',
      'A second dose may be needed if no improvement in 5-15 min',
    ],
    firstAid: [
      'Remove the trigger if visible (e.g., bee stinger)',
      'Administer epinephrine auto-injector into outer thigh',
      'Lay the person flat; if breathing is difficult, sit them up',
      'Monitor breathing and pulse',
      'Give a second EpiPen dose after 5-15 min if symptoms persist',
    ],
    warnings: [
      'Do NOT assume symptoms will resolve on their own',
      'Do NOT give oral medication if breathing is impaired',
      'Even if improved, go to ER — symptoms can return',
    ],
    relatedConditions: ['Allergic Reaction', 'Asthma'],
  },
  {
    id: 'severe-bleeding',
    name: 'Severe Bleeding',
    urgency: 'critical',
    confidence: 91,
    description: 'Significant blood loss detected. Apply immediate pressure and seek emergency care.',
    recommendedActions: [
      'Call 112 for heavy or uncontrolled bleeding',
      'Apply firm direct pressure with a clean cloth',
      'Elevate the wound above heart level if possible',
      'Do not remove embedded objects',
    ],
    firstAid: [
      'Apply firm, direct pressure with a clean dressing or cloth',
      'Keep pressing — do not lift to check; add layers if soaked',
      'Elevate the injured area above the heart if possible',
      'If bleeding soaks through, add more cloth on top — do not remove',
      'Apply a tourniquet only as a last resort (life-threatening limb bleed)',
    ],
    warnings: [
      'Do NOT remove an object embedded in the wound',
      'Do NOT use a tourniquet unless trained and bleeding is life-threatening',
      'Do NOT wash a large or deep wound',
    ],
  },
  {
    id: 'choking',
    name: 'Choking',
    urgency: 'critical',
    confidence: 88,
    description: 'Airway obstruction detected. Act fast — the person cannot breathe.',
    recommendedActions: [
      'Ask "Are you choking?" — if yes, act immediately',
      'Perform 5 back blows between shoulder blades',
      'Perform 5 abdominal thrusts (Heimlich)',
      'Call 112 if the object is not dislodged',
      'Begin CPR if the person becomes unconscious',
    ],
    firstAid: [
      'Stand behind the person and wrap arms around their waist',
      'Make a fist, place thumb-side above the navel',
      'Give 5 quick, upward abdominal thrusts',
      'Alternate 5 back blows and 5 abdominal thrusts',
      'If they become unconscious, start CPR and call 112',
    ],
    warnings: [
      'Do NOT perform abdominal thrusts on infants under 1 year',
      'Do NOT give water or food if still choking',
      'Seek medical check even after the object is expelled',
    ],
  },
  {
    id: 'burns',
    name: 'Severe Burn',
    urgency: 'urgent',
    confidence: 84,
    description: 'Significant burn injury. Cool the burn and assess severity.',
    recommendedActions: [
      'Call 112 for large, deep, or facial burns',
      'Cool the burn with cool running water for 20 minutes',
      'Remove jewelry/tight clothing near the burn before swelling',
      'Cover loosely with clean, non-fluffy cloth',
    ],
    firstAid: [
      'Cool the burn under cool running water for at least 20 minutes',
      'Remove jewelry and tight clothing near the area before swelling starts',
      'Cover the burn with cling film or a clean, non-fluffy cloth',
      'Keep the person warm and calm',
      'Give paracetamol for pain if available',
    ],
    warnings: [
      'Do NOT apply ice, butter, or ointments',
      'Do NOT break blisters',
      'Do NOT remove clothing stuck to the burn',
    ],
  },
  {
    id: 'fracture',
    name: 'Possible Fracture',
    urgency: 'urgent',
    confidence: 80,
    description: 'Symptoms suggest a bone fracture. Immobilize and seek medical care.',
    recommendedActions: [
      'Call 112 if the bone is visible or the limb is deformed',
      'Do not move the injured area',
      'Immobilize with a splint if trained',
      'Apply ice wrapped in cloth to reduce swelling',
    ],
    firstAid: [
      'Keep the injured area still — do not try to straighten it',
      'Support the injury with padding and a sling or splint',
      'Apply a cold pack wrapped in cloth for 15-20 minutes',
      'Elevate the limb above heart level if possible',
      'Treat for shock: lay the person flat, keep them warm',
    ],
    warnings: [
      'Do NOT move the person if a neck/spine injury is suspected',
      'Do NOT give food or drink (surgery may be needed)',
      'Do NOT push a bone back in place',
    ],
  },
  {
    id: 'seizure',
    name: 'Seizure',
    urgency: 'urgent',
    confidence: 78,
    description: 'Active or recent seizure. Protect the person and time the episode.',
    recommendedActions: [
      'Call 112 if the seizure lasts over 5 minutes',
      'Clear the area of hard or sharp objects',
      'Do not restrain the person',
      'Time the seizure duration',
    ],
    firstAid: [
      'Ease the person to the floor and clear surrounding objects',
      'Put something soft under their head',
      'Turn them onto their side once jerking stops (recovery position)',
      'Stay with them until fully alert',
      'Loosen tight clothing around the neck',
    ],
    warnings: [
      'Do NOT put anything in their mouth',
      'Do NOT restrain or hold them down',
      'Do NOT give food or water until fully alert',
    ],
  },
  {
    id: 'asthma',
    name: 'Asthma Attack',
    urgency: 'urgent',
    confidence: 82,
    description: 'Breathing difficulty consistent with an asthma attack.',
    recommendedActions: [
      'Help the person sit upright and stay calm',
      'Help them use their reliever inhaler (blue)',
      'Call 112 if no improvement after repeated doses',
      'Monitor breathing continuously',
    ],
    firstAid: [
      'Sit the person upright — do not let them lie down',
      'Help them take their reliever inhaler (1 puff every 30-60 sec, up to 10)',
      'Stay calm and reassure them',
      'If no improvement or worsening, call 112',
      'Keep them upright until breathing normalizes',
    ],
    warnings: [
      'Do NOT let the person lie flat',
      'Do NOT give them anything to eat or drink',
      'Do NOT assume it will pass if breathing worsens',
    ],
  },
  {
    id: 'fever',
    name: 'High Fever',
    urgency: 'moderate',
    confidence: 75,
    description: 'Elevated body temperature. Monitor and manage with fluids and rest.',
    recommendedActions: [
      'Encourage fluid intake',
      'Use over-the-counter fever reducer as directed',
      'Monitor temperature every 4 hours',
      'Seek care if fever exceeds 103°F (39.4°C)',
    ],
    firstAid: [
      'Keep the person hydrated with water or electrolyte drinks',
      'Dress lightly — avoid heavy blankets',
      'Use a lukewarm sponge bath to help lower temperature',
      'Give paracetamol or ibuprofen as directed',
      'Rest in a cool, comfortable room',
    ],
    warnings: [
      'Do NOT use cold baths or ice packs',
      'Do NOT give aspirin to children under 16',
      'Seek urgent care if stiff neck, rash, or confusion appears',
    ],
  },
  {
    id: 'allergic-mild',
    name: 'Mild Allergic Reaction',
    urgency: 'moderate',
    confidence: 70,
    description: 'Mild allergic symptoms. Monitor for escalation to severe reaction.',
    recommendedActions: [
      'Take an antihistamine if available',
      'Wash the affected area if contact-triggered',
      'Monitor for worsening symptoms',
      'Seek care if breathing becomes difficult',
    ],
    firstAid: [
      'Take an over-the-counter antihistamine',
      'Apply a cool compress to rash or hives',
      'Wash the area with soap and water if contact-triggered',
      'Avoid the known trigger',
      'Watch for signs of anaphylaxis',
    ],
    warnings: [
      'Do NOT ignore spreading or swelling symptoms',
      'Do NOT scratch the rash',
      'Seek urgent care if face/throat swells',
    ],
  },
  {
    id: 'minor-cut',
    name: 'Minor Cut or Wound',
    urgency: 'lower',
    confidence: 68,
    description: 'Minor wound. Clean and protect the area to prevent infection.',
    recommendedActions: [
      'Wash hands before treating the wound',
      'Clean the wound with cool water',
      'Apply antibiotic ointment and a bandage',
      'Get a tetanus shot if overdue',
    ],
    firstAid: [
      'Wash your hands before touching the wound',
      'Stop bleeding with gentle pressure using a clean cloth',
      'Rinse the wound with cool water; remove visible debris',
      'Apply antibiotic ointment and cover with a sterile bandage',
      'Change the dressing daily and keep it dry',
    ],
    warnings: [
      'Seek care if the wound is deep or won’t stop bleeding',
      'Watch for infection signs: redness, swelling, pus',
      'Get a tetanus booster if it has been over 5 years',
    ],
  },
  {
    id: 'sprain',
    name: 'Sprain or Strain',
    urgency: 'lower',
    confidence: 65,
    description: 'Soft tissue injury. Use the RICE method for recovery.',
    recommendedActions: [
      'Rest the injured area for 24-48 hours',
      'Apply ice for 15-20 minutes every few hours',
      'Compress with an elastic bandage',
      'Elevate above heart level',
    ],
    firstAid: [
      'Rest: avoid using the injured area',
      'Ice: apply a cold pack wrapped in cloth for 15-20 min',
      'Compress: wrap with an elastic bandage — not too tight',
      'Elevate: raise the limb above heart level',
      'Take over-the-counter pain relief if needed',
    ],
    warnings: [
      'Seek care if you cannot bear weight or the limb looks deformed',
      'Do NOT apply heat in the first 48 hours',
      'Do NOT wrap the bandage too tightly',
    ],
  },
  {
    id: 'nausea',
    name: 'Nausea and Vomiting',
    urgency: 'lower',
    confidence: 62,
    description: 'Digestive upset. Stay hydrated and rest.',
    recommendedActions: [
      'Sip clear fluids in small amounts',
      'Avoid solid food until vomiting stops',
      'Rest in a comfortable position',
      'Seek care if vomiting lasts over 24 hours',
    ],
    firstAid: [
      'Sip clear fluids (water, oral rehydration solution) in small amounts',
      'Avoid eating solid food until vomiting stops',
      'Rest in a propped-up position',
      'Introduce bland foods (crackers, toast) gradually',
      'Avoid dairy, caffeine, and fatty foods',
    ],
    warnings: [
      'Seek care if blood appears in vomit',
      'Seek care if signs of dehydration appear',
      'Do NOT take anti-nausea medication without advice',
    ],
  },
];

export const symptomKeywords: Record<string, string[]> = {
  cardiac: ['chest pain', 'chest pressure', 'heart', 'cardiac', 'left arm pain', 'shortness of breath chest', 'crushing chest', 'tight chest', 'chest tightness', 'radiating pain arm', 'palpitations chest pain'],
  stroke: ['stroke', 'face drooping', 'slurred speech', 'weakness one side', 'numbness face', 'can’t speak', 'sudden confusion', 'vision loss sudden', 'face numb'],
  anaphylaxis: ['anaphylaxis', 'severe allergic', 'throat closing', 'swelling throat', 'epipen', 'bee sting swelling', 'swollen throat', 'can’t breathe allergic', 'hives swelling'],
  'severe-bleeding': ['severe bleeding', 'heavy bleeding', 'blood loss', 'deep cut bleeding', 'won’t stop bleeding', 'arterial bleeding', 'profuse bleeding', 'laceration bleeding'],
  choking: ['choking', 'can’t breathe', 'object stuck throat', 'airway blocked', ' Heimlich', 'coughing can’t breathe', 'gagging can’t breathe'],
  burns: ['burn', 'scald', 'fire injury', 'hot water burn', 'severe burn', 'blistering burn', 'chemical burn', 'skin burn'],
  fracture: ['fracture', 'broken bone', 'bone sticking out', 'deformed limb', 'can’t move arm', 'can’t move leg', 'snapped bone', 'fall bone pain'],
  seizure: ['seizure', 'convulsion', 'shaking uncontrollably', 'fit', 'loss of consciousness shaking', 'eyes rolled back', 'jerking'],
  asthma: ['asthma', 'wheezing', 'inhaler', 'can’t breathe asthma', 'breathing difficulty', 'tight chest wheeze', 'shortness of breath wheeze'],
  fever: ['fever', 'high temperature', 'hot forehead', 'chills', 'sweating temperature', 'feverish', 'burning up'],
  'allergic-mild': ['rash', 'hives', 'itching', 'mild allergic', 'skin reaction', 'red bumps', 'sneezing itchy eyes'],
  'minor-cut': ['cut', 'scrape', 'minor wound', 'small cut', 'scratch', 'abrasion', 'minor bleed'],
  sprain: ['sprain', 'twisted ankle', 'twisted wrist', 'pulled muscle', 'strain', 'rolled ankle', 'twisted knee'],
  nausea: ['nausea', 'vomiting', 'throwing up', 'sick stomach', 'puke', 'feel sick', 'upset stomach', 'diarrhea'],
};

export function analyzeSymptoms(text: string): Condition {
  const lower = text.toLowerCase();
  const scores: Record<string, number> = {};

  for (const [id, keywords] of Object.entries(symptomKeywords)) {
    scores[id] = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        scores[id] += kw.length > 8 ? 3 : 2;
      }
    }
  }

  let bestId = 'fever';
  let bestScore = 0;
  for (const [id, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestId = id;
    }
  }

  if (bestScore === 0) {
    const fallback = conditions.find((c) => c.id === 'fever')!;
    return { ...fallback, confidence: 55 };
  }

  const matched = conditions.find((c) => c.id === bestId)!;
  const confidence = Math.min(95, 60 + bestScore * 6);
  return { ...matched, confidence };
}
