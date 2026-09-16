/**
 * CaseFlow Adaptive Question Ontology (SOCRATES Framework)
 * SIH26047 — AI-Powered Patient Case-Taking Software
 *
 * Provides a structured clinical decision tree with adaptive branching,
 * bilingual Hindi/English content, audio prompts, and red-flag screening tags.
 */

export const QUESTION_ONTOLOGY = {
  // ROOT: Chief Complaint Identification
  root_complaint: {
    id: 'root_complaint',
    question: 'What brings you to the doctor today?',
    hindi_question: 'आज अस्पताल आने का आपका मुख्य कारण या तकलीफ़ क्या है?',
    audio_hint: 'Please speak clearly or tap your primary symptom below.',
    audio_hint_hi: 'कृपया साफ आवाज़ में बोलें या नीचे दिए गए मुख्य लक्षण को चुनें।',
    input_type: 'speech_or_choice',
    quick_options: [
      {
        label: 'Stomach Pain / Abdominal Pain',
        hindi: 'पेट में दर्द / मरोड़',
        value: 'abdominal_pain',
        complaint: 'Abdominal pain',
        icon: 'Activity'
      },
      {
        label: 'Fever & Chills',
        hindi: 'बुखार और ठंड लगना',
        value: 'fever',
        complaint: 'Fever',
        icon: 'Thermometer'
      },
      {
        label: 'Chest Pain / Discomfort',
        hindi: 'सीने में दर्द या भारीपन',
        value: 'chest_pain',
        complaint: 'Chest pain',
        icon: 'Heart'
      },
      {
        label: 'Persistent Cough',
        hindi: 'लगातार खांसी',
        value: 'cough',
        complaint: 'Cough',
        icon: 'Wind'
      },
      {
        label: 'Severe Headache',
        hindi: 'तेज़ सिरदर्द',
        value: 'headache',
        complaint: 'Headache',
        icon: 'Brain'
      }
    ],
    default_next: 'abdo_site'
  },

  // ==========================================
  // ABDOMINAL PAIN BRANCH (SOCRATES)
  // ==========================================

  // 1. SITE / LOCATION
  abdo_site: {
    id: 'abdo_site',
    question: 'Where exactly does it hurt in your abdomen?',
    hindi_question: 'पेट में ठीक किस जगह पर दर्द हो रहा है?',
    audio_hint: 'Select the exact area or describe where the pain is situated.',
    audio_hint_hi: 'दर्द की जगह को चुनें या बोलकर बताएं।',
    input_type: 'choice',
    field_key: 'site',
    quick_options: [
      {
        label: 'Upper Abdomen (Below Ribs)',
        hindi: 'पेट के ऊपरी हिस्से में (पसलियों के नीचे)',
        value: 'Upper abdomen',
        tag: 'Epigastric'
      },
      {
        label: 'Lower Abdomen',
        hindi: 'पेट के निचले हिस्से में',
        value: 'Lower abdomen',
        tag: 'Hypogastric / Pelvic'
      },
      {
        label: 'Right Upper Side',
        hindi: 'दाहिनी तरफ ऊपर',
        value: 'Right upper quadrant',
        tag: 'RUQ (Biliary/Hepatic)'
      },
      {
        label: 'Around Belly Button',
        hindi: 'नाभि के आसपास',
        value: 'Periumbilical',
        tag: 'Periumbilical'
      },
      {
        label: 'All Over / Diffuse Pain',
        hindi: 'पूरे पेट में फैला हुआ',
        value: 'Generalized / Diffuse',
        tag: 'Diffuse'
      }
    ],
    next_question: 'abdo_duration'
  },

  // 2. ONSET & DURATION
  abdo_duration: {
    id: 'abdo_duration',
    question: 'When did this pain start?',
    hindi_question: 'यह दर्द कब शुरू हुआ था?',
    audio_hint: 'Choose how long you have been experiencing this discomfort.',
    audio_hint_hi: 'बताएं कि यह परेशानी कितने समय से है।',
    input_type: 'choice',
    field_key: 'onset',
    quick_options: [
      {
        label: 'Suddenly today (Under 24 hours)',
        hindi: 'आज अचानक शुरू हुआ (24 घंटे से कम)',
        value: 'Acute (<24 hours)'
      },
      {
        label: '3 to 4 days ago',
        hindi: '3 से 4 दिन पहले',
        value: '3-4 days ago'
      },
      {
        label: 'About 1 to 2 weeks ago',
        hindi: 'लगभग 1-2 हफ्ते पहले',
        value: '1-2 weeks ago'
      },
      {
        label: 'Ongoing for months / Comes and goes',
        hindi: 'महीनों से बार-बार होता है',
        value: 'Chronic (>1 month)'
      }
    ],
    next_question: 'abdo_character'
  },

  // 3. CHARACTER (CORE BRANCHING NODE)
  abdo_character: {
    id: 'abdo_character',
    question: 'How would you describe the feeling of the pain?',
    hindi_question: 'यह दर्द किस तरह का महसूस होता है?',
    audio_hint: 'Select the description that closest matches your feeling.',
    audio_hint_hi: 'जो वर्णन सबसे सही लगे उसे चुनें।',
    input_type: 'choice',
    field_key: 'character',
    quick_options: [
      {
        label: 'Burning sensation (जलन)',
        hindi: 'सीने या पेट में खट्टी डकार व जलन',
        value: 'Burning',
        branch_desc: 'Will ask regarding food & meals'
      },
      {
        label: 'Cramping / Spasms (मरोड़)',
        hindi: 'पेट में ऐंठन या मरोड़ जैसा दर्द',
        value: 'Cramping',
        branch_desc: 'Will ask regarding colic wave patterns'
      },
      {
        label: 'Sharp / Stabbing (तेज़ चुभन)',
        hindi: 'तीखा, सुई जैसा चुभने वाला दर्द',
        value: 'Sharp',
        branch_desc: 'Will ask regarding pain radiation'
      },
      {
        label: 'Dull ache / Heaviness (भारीपन)',
        hindi: 'हल्का लेकिन लगातार बना हुआ दर्द',
        value: 'Dull ache',
        branch_desc: 'Standard radiation check'
      }
    ],
    branch_map: {
      Burning: 'abdo_burning_meals',
      Cramping: 'abdo_cramping_waves',
      Sharp: 'abdo_sharp_radiation',
      'Dull ache': 'abdo_radiation'
    }
  },

  // 3A. BURNING BRANCH -> Meals relationship
  abdo_burning_meals: {
    id: 'abdo_burning_meals',
    branch_badge: 'Adaptive Branch: Acid-Peptic Pattern',
    question: 'Does the burning get worse after eating or on an empty stomach?',
    hindi_question: 'क्या यह जलन खाना खाने के बाद बढ़ती है या खाली पेट रहने पर?',
    audio_hint: 'Select how meals and food affect your burning sensation.',
    audio_hint_hi: 'बताएं खाने से जलन पर क्या असर पड़ता है।',
    input_type: 'choice',
    field_key: 'aggravatingFactors',
    quick_options: [
      {
        label: 'Worse after eating spicy/oily food',
        hindi: 'मसालेदार या तला खाना खाने के बाद बढ़ती है',
        value: 'Worse after meals'
      },
      {
        label: 'Worse on empty stomach / Relieved by milk or food',
        hindi: 'खाली पेट ज्यादा, कुछ खाने या दूध पीने पर राहत',
        value: 'Worse when fasting / Relieved by food'
      },
      {
        label: 'Constant burning, no direct relation to food',
        hindi: 'लगातार बनी रहती है, खाने से खास फर्क नहीं',
        value: 'Continuous burning'
      }
    ],
    next_question: 'abdo_radiation'
  },

  // 3B. CRAMPING BRANCH -> Waves pattern
  abdo_cramping_waves: {
    id: 'abdo_cramping_waves',
    branch_badge: 'Adaptive Branch: Colic Spasm Pattern',
    question: 'Does the cramping pain come and go in waves?',
    hindi_question: 'क्या मरोड़ का दर्द बार-बार लहर की तरह आकर चला जाता है?',
    audio_hint: 'Select whether the pain is spasmodic or constant.',
    audio_hint_hi: 'बताएं क्या दर्द रुक-रुक कर आता है।',
    input_type: 'choice',
    field_key: 'timing',
    quick_options: [
      {
        label: 'Yes, comes in severe waves / spasms',
        hindi: 'हाँ, रुक-रुक कर तेज़ लहर आती है',
        value: 'Episodic colicky spasms'
      },
      {
        label: 'No, persistent cramp without relief',
        hindi: 'नहीं, लगातार मरोड़ बनी रहती है',
        value: 'Constant cramping'
      },
      {
        label: 'Relieved after passing gas or bowel movement',
        hindi: 'शौच या गैस पास होने पर आराम मिलता है',
        value: 'Relieved by defecation'
      }
    ],
    next_question: 'abdo_radiation'
  },

  // 3C. SHARP BRANCH -> Radiation
  abdo_sharp_radiation: {
    id: 'abdo_sharp_radiation',
    branch_badge: 'Adaptive Branch: Radiation Pathway',
    question: 'Does this sharp pain shoot or radiate anywhere else?',
    hindi_question: 'क्या यह तीखा दर्द शरीर में कहीं और भी फैलता है (जैसे पीठ या कंधे में)?',
    audio_hint: 'Select if the pain spreads to your back, shoulder, or stays localized.',
    audio_hint_hi: 'बताएं क्या दर्द पीठ या कंधे की तरफ जाता है।',
    input_type: 'choice',
    field_key: 'radiation',
    quick_options: [
      {
        label: 'Radiates straight through to the back',
        hindi: 'सीधे पीठ की ओर जाता है',
        value: 'Radiates to back'
      },
      {
        label: 'Radiates to right shoulder or shoulder blade',
        hindi: 'दाहिने कंधे की तरफ फैलता है',
        value: 'Radiates to right shoulder'
      },
      {
        label: 'Radiates down towards the groin',
        hindi: 'नीचे कमर या जांघ की ओर जाता है',
        value: 'Radiates to groin'
      },
      {
        label: 'Stays strictly in one spot (Localized)',
        hindi: 'एक ही जगह रहता है, कहीं नहीं फैलता',
        value: 'No radiation (localized)'
      }
    ],
    next_question: 'abdo_severity'
  },

  // 4. GENERAL RADIATION
  abdo_radiation: {
    id: 'abdo_radiation',
    question: 'Does the pain travel or radiate anywhere else?',
    hindi_question: 'क्या दर्द किसी और अंग की तरफ फैलता है?',
    audio_hint: 'Select if the pain travels to your back or stays in the stomach.',
    audio_hint_hi: 'बताएं क्या दर्द पीठ की तरफ फैलता है या पेट में ही है।',
    input_type: 'choice',
    field_key: 'radiation',
    quick_options: [
      {
        label: 'Radiates towards the back',
        hindi: 'पीठ की ओर फैलता है',
        value: 'Radiates to back'
      },
      {
        label: 'Stays localized in the stomach',
        hindi: 'केवल पेट में ही रहता है',
        value: 'No radiation'
      },
      {
        label: 'Radiates to flanks / lower back',
        hindi: 'कमर के दोनों तरफ फैलता है',
        value: 'Radiates to flanks'
      }
    ],
    next_question: 'abdo_severity'
  },

  // 5. SEVERITY (1 to 10 Scale)
  abdo_severity: {
    id: 'abdo_severity',
    question: 'On a scale of 1 to 10, how severe is your pain right now?',
    hindi_question: '1 से 10 के पैमाने पर, इस समय दर्द कितना तीव्र या गंभीर है?',
    audio_hint: 'Tap the severity level that represents what you feel right now.',
    audio_hint_hi: 'अपने दर्द के स्तर का चुनाव करें।',
    input_type: 'scale',
    field_key: 'severity',
    quick_options: [
      {
        label: 'Mild (1 - 3)',
        hindi: 'हल्का (1-3) — सामान्य दिनचर्या संभव',
        value: 'Mild (3/10)',
        color: 'emerald'
      },
      {
        label: 'Moderate (4 - 6) — Affects daily tasks',
        hindi: 'मध्यम (4-6) — रोज़मर्रा के काम में रुकावट',
        value: 'Moderate (6/10)',
        color: 'amber'
      },
      {
        label: 'Severe (7 - 8) — Difficult to manage',
        hindi: 'गंभीर (7-8) — बहुत तकलीफ़देह व असहनीय',
        value: 'Severe (8/10)',
        color: 'rose'
      },
      {
        label: 'Extreme (9 - 10) — Worst possible pain',
        hindi: 'अति गंभीर (9-10) — आपातकालीन स्तर',
        value: 'Extreme (10/10)',
        color: 'red'
      }
    ],
    next_question: 'abdo_associated'
  },

  // 6. ASSOCIATED SYMPTOMS & RED-FLAG SCREENING
  abdo_associated: {
    id: 'abdo_associated',
    question: 'Do you have any of these accompanying symptoms?',
    hindi_question: 'क्या आपको इनमें से कोई अन्य लक्षण भी महसूस हो रहे हैं?',
    audio_hint: 'Select any accompanying symptoms or tap None.',
    audio_hint_hi: 'अन्य लक्षण चुनें या "इनमें से कोई नहीं" पर टैप करें।',
    input_type: 'choice',
    field_key: 'associatedSymptoms',
    quick_options: [
      {
        label: 'Nausea / Vomiting',
        hindi: 'जी मिचलाना या उल्टी होना',
        value: 'Nausea with vomiting'
      },
      {
        label: 'Fever & Chills',
        hindi: 'बुखार और कंपकंपी',
        value: 'Fever and chills'
      },
      {
        label: 'Loose stools / Diarrhea',
        hindi: 'दस्त या लूज़ मोशन',
        value: 'Diarrhea'
      },
      {
        label: '⚠️ Vomiting blood or dark black stools',
        hindi: 'उल्टी में खून या काला मल (अलर्ट)',
        value: 'Hematemesis / Melena (Red Flag)',
        is_red_flag: true
      },
      {
        label: 'None of the above',
        hindi: 'इनमें से कोई अन्य लक्षण नहीं',
        value: 'No associated symptoms'
      }
    ],
    next_question: 'abdo_medications'
  },

  // 7. MEDICATIONS & KNOWN ALLERGIES
  abdo_medications: {
    id: 'abdo_medications',
    question: 'Have you taken any medicines for this, or do you have allergies?',
    hindi_question: 'क्या आपने इस दर्द के लिए कोई दवा ली है, या किसी दवा से एलर्जी है?',
    audio_hint: 'Mention any antacids, painkillers, or known drug allergies.',
    audio_hint_hi: 'गैस की गोली, दर्द की दवा या एलर्जी के बारे में बताएं।',
    input_type: 'choice',
    field_key: 'medications',
    quick_options: [
      {
        label: 'Took Antacid / Gas Tablet (e.g. Pantoprazole)',
        hindi: 'एंटासिड / गैस की गोली ली थी',
        value: 'Took Antacid (Pantoprazole)'
      },
      {
        label: 'Took Painkiller (e.g. Paracetamol / Ibuprofen)',
        hindi: 'दर्द निवारक गोली ली',
        value: 'Took OTC Painkiller'
      },
      {
        label: 'No medicines taken yet',
        hindi: 'अभी तक कोई दवा नहीं ली',
        value: 'No medications taken'
      },
      {
        label: 'Known Sulfa / Penicillin Allergy',
        hindi: 'सल्फा / पेनिसिलिन से एलर्जी है',
        value: 'Sulfa / Penicillin allergy'
      }
    ],
    is_terminal: true
  },

  // ==========================================
  // BLEEDING SYMPTOM BRANCH
  // ==========================================
  bleeding_onset: {
    id: 'bleeding_onset',
    branch_badge: 'Adaptive Branch: Bleeding Assessment',
    question: 'When did you first notice the bleeding, and is it continuous or intermittent?',
    hindi_question: 'रक्तस्राव (खून आना) कब शुरू हुआ, और क्या यह लगातार हो रहा है?',
    audio_hint: 'Tell us how long you have observed this bleeding.',
    audio_hint_hi: 'बताएं कि रक्तस्राव कब शुरू हुआ था।',
    input_type: 'choice',
    field_key: 'onset',
    quick_options: [
      { label: 'Started suddenly today (< 24 hours)', hindi: 'आज अचानक शुरू हुआ (24 घंटे के अंदर)', value: 'Acute onset today (<24h)' },
      { label: 'Ongoing for 2 to 3 days', hindi: '2-3 दिन से हो रहा है', value: '2-3 days' },
      { label: 'Comes and goes intermittently', hindi: 'रुक-रुक कर कभी-कभी होता है', value: 'Intermittent episodes' },
      { label: 'Chronic / Happening for weeks', hindi: 'हफ्तों से बार-बार हो रहा है', value: 'Chronic (>2 weeks)' }
    ],
    next_question: 'bleeding_severity'
  },
  bleeding_severity: {
    id: 'bleeding_severity',
    branch_badge: 'Adaptive Branch: Bleeding Assessment',
    question: 'How would you describe the amount or intensity of bleeding?',
    hindi_question: 'रक्तस्राव की मात्रा या स्थिति कैसी है?',
    audio_hint: 'Select whether it is spotting, moderate, or heavy bleeding.',
    audio_hint_hi: 'बताएं कि रक्तस्राव हल्का है या भारी।',
    input_type: 'choice',
    field_key: 'severity',
    quick_options: [
      { label: 'Mild spotting or light staining', hindi: 'हल्के धब्बे या बहुत कम मात्रा', value: 'Mild spotting' },
      { label: 'Moderate steady bleeding', hindi: 'मध्यम प्रवाह', value: 'Moderate bleeding' },
      { label: '⚠️ Heavy / Continuous bleeding or passing clots', hindi: 'भारी या लगातार रक्तस्राव / थक्के आना', value: 'Heavy active bleeding (Red Flag)', is_red_flag: true }
    ],
    next_question: 'bleeding_associated'
  },
  bleeding_associated: {
    id: 'bleeding_associated',
    branch_badge: 'Adaptive Branch: Bleeding Assessment',
    question: 'Are you experiencing any of these accompanying symptoms?',
    hindi_question: 'क्या आपको साथ में इनमें से कोई अन्य लक्षण भी हैं?',
    audio_hint: 'Select any other symptoms such as severe pain, dizziness, or fever.',
    audio_hint_hi: 'अन्य लक्षण चुनें जैसे चक्कर, तेज़ दर्द या बुखार।',
    input_type: 'choice',
    field_key: 'associatedSymptoms',
    quick_options: [
      { label: 'Severe pain or abdominal/pelvic cramping', hindi: 'तेज़ दर्द या मरोड़', value: 'Severe pain / cramping' },
      { label: '⚠️ Dizziness, lightheadedness, or feeling faint', hindi: 'चक्कर आना या बेहोशी जैसा लगना', value: 'Dizziness / Presyncope (Red Flag)', is_red_flag: true },
      { label: 'Fever, chills, or foul odor', hindi: 'बुखार, कंपकंपी या दुर्गंध', value: 'Fever or chills' },
      { label: 'None of the above', hindi: 'इनमें से कोई नहीं', value: 'No associated symptoms' }
    ],
    next_question: 'abdo_medications'
  },

  // ==========================================
  // FEVER BRANCH
  // ==========================================
  fever_pattern: {
    id: 'fever_pattern',
    branch_badge: 'Adaptive Branch: Febrile Pattern',
    question: 'How long has the fever lasted and does it come with chills?',
    hindi_question: 'बुखार कितने दिनों से है और क्या यह ठंड लगकर आता है?',
    input_type: 'choice',
    field_key: 'timing',
    quick_options: [
      { label: '2-3 days with chills / shivering', hindi: '2-3 दिन से ठंड लगकर', value: '2-3 days with chills' },
      { label: 'High continuous fever for 1 week', hindi: '1 हफ्ते से लगातार तेज़ बुखार', value: 'Continuous fever (1 week)' },
      { label: 'Low fever mainly in evenings', hindi: 'हल्का बुखार, शाम को ज़्यादा', value: 'Evening low-grade fever' }
    ],
    next_question: 'abdo_severity'
  },

  // ==========================================
  // CHEST PAIN BRANCH
  // ==========================================
  chest_character: {
    id: 'chest_character',
    branch_badge: 'Adaptive Branch: Chest Discomfort',
    question: 'How does the chest discomfort feel?',
    hindi_question: 'सीने में दर्द किस तरह का महसूस हो रहा है?',
    input_type: 'choice',
    field_key: 'character',
    quick_options: [
      { label: '⚠️ Heavy pressure / Squeezing', hindi: 'भारी दबाव या जकड़न', value: 'Retrosternal pressure', is_red_flag: true },
      { label: 'Sharp on deep breath / coughing', hindi: 'गहरी सांस लेने पर चुभन', value: 'Pleuritic sharp' },
      { label: 'Burning in center of chest', hindi: 'सीने के बीच में जलन', value: 'Retrosternal burning' }
    ],
    next_question: 'abdo_severity'
  },

  // ==========================================
  // COUGH BRANCH
  // ==========================================
  cough_type: {
    id: 'cough_type',
    branch_badge: 'Adaptive Branch: Respiratory Pattern',
    question: 'Is the cough dry or producing sputum/phlegm?',
    hindi_question: 'क्या खांसी सूखी है या बलगम आ रहा है?',
    input_type: 'choice',
    field_key: 'character',
    quick_options: [
      { label: 'Dry cough (सूखी खांसी)', hindi: 'सूखी खांसी', value: 'Dry cough' },
      { label: 'Productive with white/yellow sputum', hindi: 'बलगम वाली खांसी', value: 'Productive cough' },
      { label: '⚠️ Sputum with blood streaks', hindi: 'बलगम में खून के अंश', value: 'Hemoptysis (Red Flag)', is_red_flag: true }
    ],
    next_question: 'abdo_severity'
  },

  // ==========================================
  // HEADACHE BRANCH
  // ==========================================
  headache_type: {
    id: 'headache_type',
    branch_badge: 'Adaptive Branch: Cephalea Pattern',
    question: 'Where is the headache located and what does it feel like?',
    hindi_question: 'सिरदर्द कहाँ है और कैसा महसूस होता है?',
    input_type: 'choice',
    field_key: 'site',
    quick_options: [
      { label: 'One side of head, throbbing', hindi: 'एक तरफ धड़कता हुआ', value: 'Unilateral throbbing' },
      { label: 'Forehead and temples, pressing band', hindi: 'माथे और कनपटी पर भारीपन', value: 'Frontal tension' },
      { label: "⚠️ Sudden severe 'worst headache of life'", hindi: 'अचानक बहुत तेज़ भयानक सिरदर्द', value: 'Thunderclap headache (Red Flag)', is_red_flag: true }
    ],
    next_question: 'abdo_severity'
  },

  // ==========================================
  // GENERIC CLARIFICATION BRANCH (Safe Fallback)
  // ==========================================
  generic_onset: {
    id: 'generic_onset',
    branch_badge: 'Adaptive Branch: Symptom Assessment',
    question: 'When did your symptoms first begin?',
    hindi_question: 'आपकी यह परेशानी सबसे पहले कब शुरू हुई थी?',
    audio_hint: 'Select how long you have experienced this issue.',
    audio_hint_hi: 'बताएं कि यह परेशानी कब से है।',
    input_type: 'choice',
    field_key: 'onset',
    quick_options: [
      { label: 'Today / Suddenly in the last 24 hours', hindi: 'आज अचानक (24 घंटे के अंदर)', value: 'Acute (<24 hours)' },
      { label: 'A few days ago (2 - 5 days)', hindi: 'कुछ दिन पहले (2-5 दिन)', value: '2-5 days ago' },
      { label: 'About 1 to 2 weeks ago', hindi: 'लगभग 1-2 हफ्ते पहले', value: '1-2 weeks ago' },
      { label: 'Ongoing for more than a month', hindi: 'एक महीने से अधिक समय से', value: 'Chronic (>1 month)' }
    ],
    next_question: 'generic_character'
  },
  generic_character: {
    id: 'generic_character',
    branch_badge: 'Adaptive Branch: Symptom Assessment',
    question: 'How would you describe the nature of this discomfort?',
    hindi_question: 'इस परेशानी का स्वरूप कैसा है?',
    audio_hint: 'Choose the description that closest matches your feeling.',
    audio_hint_hi: 'जो वर्णन सबसे सही लगे उसे चुनें।',
    input_type: 'choice',
    field_key: 'character',
    quick_options: [
      { label: 'Continuous and persistent', hindi: 'लगातार बना रहता है', value: 'Continuous persistent' },
      { label: 'Comes and goes intermittently', hindi: 'रुक-रुक कर कभी-कभी होता है', value: 'Intermittent / episodic' },
      { label: 'Progressively worsening over time', hindi: 'समय के साथ लगातार बढ़ रहा है', value: 'Progressively worsening' },
      { label: 'Mild discomfort without sharp pain', hindi: 'हल्की बेचैनी', value: 'Mild discomfort' }
    ],
    next_question: 'generic_severity'
  },
  generic_severity: {
    id: 'generic_severity',
    branch_badge: 'Adaptive Branch: Symptom Assessment',
    question: 'How significantly is this affecting your daily routine?',
    hindi_question: 'इस तकलीफ़ का आपकी दिनचर्या पर कितना असर पड़ रहा है?',
    audio_hint: 'Select the severity impact on your routine.',
    audio_hint_hi: 'अपने तकलीफ़ के स्तर का चुनाव करें।',
    input_type: 'choice',
    field_key: 'severity',
    quick_options: [
      { label: 'Mild — Can carry out all daily activities', hindi: 'हल्का (दैनिक कार्य सामान्य रूप से संभव)', value: 'Mild (3/10)' },
      { label: 'Moderate — Interferes with work or sleep', hindi: 'मध्यम (काम या नींद में रुकावट)', value: 'Moderate (6/10)' },
      { label: 'Severe — Unable to perform normal tasks', hindi: 'गंभीर (सामान्य कामकाज में असमर्थ)', value: 'Severe (8/10)' },
      { label: '⚠️ Extreme / Acute emergency', hindi: 'अति गंभीर / आपातकालीन स्तर', value: 'Extreme (10/10)', is_red_flag: true }
    ],
    next_question: 'generic_associated'
  },
  generic_associated: {
    id: 'generic_associated',
    branch_badge: 'Adaptive Branch: Symptom Assessment',
    question: 'Do you have any accompanying high-priority symptoms?',
    hindi_question: 'क्या आपको साथ में इनमें से कोई अन्य आपात लक्षण हैं?',
    audio_hint: 'Select any accompanying red-flag symptoms.',
    audio_hint_hi: 'अन्य आपात लक्षण चुनें।',
    input_type: 'choice',
    field_key: 'associatedSymptoms',
    quick_options: [
      { label: '⚠️ Difficulty breathing or chest heaviness', hindi: 'सांस लेने में तकलीफ़ या सीने में भारीपन', value: 'Dyspnea / Chest heaviness (Red Flag)', is_red_flag: true },
      { label: '⚠️ Altered sensorium, severe weakness, or fainting', hindi: 'अत्यधिक कमजोरी, चक्कर या बेहोशी', value: 'Altered sensorium / Presyncope (Red Flag)', is_red_flag: true },
      { label: 'Fever, vomiting, or diarrhea', hindi: 'बुखार, उल्टी या दस्त', value: 'Fever / Vomiting' },
      { label: 'None of the above', hindi: 'इनमें से कोई नहीं', value: 'No associated symptoms' }
    ],
    next_question: 'abdo_medications'
  }
};

/**
 * Broad intent mapping: classifies free-text chief complaints into clinical question pathways.
 * Does NOT diagnose diseases. Falls back safely to generic clarification.
 */
export function classifySymptomIntent(text) {
  if (!text || !String(text).trim()) return 'root_complaint';
  const t = String(text).toLowerCase();

  // 1. Bleeding / Hemorrhage symptoms
  if (['खून', 'रक्त', 'bleed', 'blood', 'khoon', 'hemorrhage', 'spotting', 'hematuria', 'intimate', 'discharge', 'cut', 'wound'].some((k) => t.includes(k))) {
    return 'bleeding_onset';
  }
  // 2. Chest discomfort / Cardiac
  if (['छाती', 'सीना', 'दिल', 'chest', 'seena', 'heart', 'angina', 'retrosternal', 'palpitation', 'crushing'].some((k) => t.includes(k))) {
    return 'chest_character';
  }
  // 3. Respiratory / Cough
  if (['खांसी', 'खराश', 'बलगम', 'cough', 'khansi', 'sputum', 'balgam', 'phlegm', 'wheez', 'saans', 'breathless'].some((k) => t.includes(k))) {
    return 'cough_type';
  }
  // 4. Fever / Systemic chills
  if (['बुखार', 'ठंड', 'ताप', 'fever', 'bukhar', 'chill', 'shiver', 'thand', 'temperature', 'tap'].some((k) => t.includes(k))) {
    return 'fever_pattern';
  }
  // 5. Headache / Neurological
  if (['सिरदर्द', 'सिर में दर्द', 'सरदर्द', 'सर में दर्द', 'सिर दर्द', 'सर दर्द', 'headache', 'sir dard', 'sar dard', 'migrain', 'head pain', 'sir me dard', 'sar me dard'].some((k) => t.includes(k))) {
    return 'headache_type';
  }
  // 6. Abdominal / GI pain symptoms (SOCRATES)
  if (['पेट में दर्द', 'पेट दर्द', 'पेट', 'stomach', 'abdominal', 'abdomen', 'pet', 'belly', 'cramp', 'gastric', 'acid', 'burning', 'colic', 'pain', 'dard'].some((k) => t.includes(k))) {
    return 'abdo_site';
  }
  // 7. Safe generic clarification pathway for all other unknown complaints
  return 'generic_onset';
}

/**
 * Helper to get default initial state
 */
export const getInitialExtractedHistory = () => ({
  site: 'Not yet specified',
  onset: 'Not yet specified',
  character: 'Not yet specified',
  radiation: 'Not yet specified',
  associatedSymptoms: 'Not yet specified',
  timing: 'Not yet specified',
  aggravatingFactors: 'Not yet specified',
  relievingFactors: 'Not yet specified',
  severity: 'Not yet specified',
  medications: 'Not yet specified',
  allergies: 'Not yet specified'
});
