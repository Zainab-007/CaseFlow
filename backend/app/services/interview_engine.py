"""
CaseFlow Adaptive Interview Engine
SIH26047 — AI-Powered Patient Case-Taking Software

Implements a clinical symptom ontology and SOCRATES decision tree.
Demonstrates visible branching based on patient answers, real-time clinical entity
extraction, and conservative red-flag safety checks without autonomous diagnosis.
"""

from typing import Dict, Any, List, Optional
import uuid


# Question Tree Definitions
# Primary scenario: ABDOMINAL PAIN with SOCRATES branching
QUESTION_TREE: Dict[str, Dict[str, Any]] = {
    # ROOT: Initial Chief Complaint Capture
    "root_complaint": {
        "id": "root_complaint",
        "question": "What brings you to the doctor today?",
        "hindi_question": "आज अस्पताल आने का आपका मुख्य कारण या तकलीफ़ क्या है?",
        "audio_hint": "Please speak clearly or tap your primary symptom below.",
        "input_type": "speech_or_choice",
        "quick_options": [
            {"label": "Stomach Pain / Abdominal Pain", "hindi": "पेट में दर्द", "value": "abdominal_pain", "complaint": "Abdominal pain"},
            {"label": "Fever & Chills", "hindi": "बुखार और ठंड लगना", "value": "fever", "complaint": "Fever"},
            {"label": "Chest Pain / Discomfort", "hindi": "सीने में दर्द या भारीपन", "value": "chest_pain", "complaint": "Chest pain"},
            {"label": "Persistent Cough", "hindi": "लगातार खांसी", "value": "cough", "complaint": "Cough"},
            {"label": "Severe Headache", "hindi": "तेज़ सिरदर्द", "value": "headache", "complaint": "Headache"},
        ],
        "default_next": "abdo_site"
    },

    # ==========================================
    # ABDOMINAL PAIN BRANCH (SOCRATES Framework)
    # ==========================================

    # 1. SITE / LOCATION
    "abdo_site": {
        "id": "abdo_site",
        "question": "Where exactly does it hurt in your abdomen?",
        "hindi_question": "पेट में ठीक किस जगह पर दर्द हो रहा है?",
        "audio_hint": "Select the area of pain or describe where it is located.",
        "input_type": "choice",
        "field_key": "site",
        "quick_options": [
            {"label": "Upper Abdomen (Below Ribs)", "hindi": "पेट के ऊपरी हिस्से में (पसलियों के नीचे)", "value": "Upper abdomen"},
            {"label": "Lower Abdomen", "hindi": "पेट के निचले हिस्से में", "value": "Lower abdomen"},
            {"label": "Right Upper Side", "hindi": "दाहिनी तरफ ऊपर", "value": "Right upper quadrant"},
            {"label": "Around Belly Button", "hindi": "नाभि के आसपास", "value": "Periumbilical"},
            {"label": "All Over / Diffuse Pain", "hindi": "पूरे पेट में दर्द", "value": "Generalized / Diffuse"}
        ],
        "next_question": "abdo_duration"
    },

    # 2. TIMING / DURATION & ONSET
    "abdo_duration": {
        "id": "abdo_duration",
        "question": "When did this pain start?",
        "hindi_question": "यह दर्द कब शुरू हुआ था?",
        "audio_hint": "Tell us how many days or hours you have experienced this.",
        "input_type": "choice",
        "field_key": "onset",
        "quick_options": [
            {"label": "Suddenly today (Under 24 hours)", "hindi": "आज अचानक शुरू हुआ", "value": "Acute (<24 hours)"},
            {"label": "3 to 4 days ago", "hindi": "3 से 4 दिन पहले", "value": "3-4 days ago"},
            {"label": "About 1 to 2 weeks ago", "hindi": "लगभग 1-2 हफ्ते पहले", "value": "1-2 weeks ago"},
            {"label": "Ongoing for months / Comes and goes", "hindi": "महीनों से बार-बार होता है", "value": "Chronic (>1 month)"}
        ],
        "next_question": "abdo_character"
    },

    # 3. CHARACTER (KEY BRANCHING NODE)
    "abdo_character": {
        "id": "abdo_character",
        "question": "How would you describe the pain?",
        "hindi_question": "यह दर्द किस तरह का महसूस होता है?",
        "audio_hint": "Choose the description that best matches your feeling.",
        "input_type": "choice",
        "field_key": "character",
        "quick_options": [
            {"label": "Burning sensation (जलन)", "hindi": "सीने या पेट में जलन", "value": "Burning"},
            {"label": "Cramping / Spasms (मरोड़)", "hindi": "पेट में मरोड़ या ऐंठन", "value": "Cramping"},
            {"label": "Sharp / Stabbing (तेज़ चुभन)", "hindi": "तीखा, चुभने वाला दर्द", "value": "Sharp"},
            {"label": "Dull ache / Heaviness (भारीपन)", "hindi": "हल्का लेकिन लगातार दर्द", "value": "Dull ache"},
            {"label": "Not sure / Hard to describe", "hindi": "निश्चित नहीं", "value": "Indeterminate"}
        ],
        # Branching logic: maps chosen value to different follow-up questions
        "branch_map": {
            "Burning": "abdo_burning_meals",
            "Cramping": "abdo_cramping_waves",
            "Sharp": "abdo_sharp_radiation",
            "Dull ache": "abdo_radiation",
            "Indeterminate": "abdo_radiation"
        }
    },

    # 3A. BRANCH: BURNING -> Meal timing
    "abdo_burning_meals": {
        "id": "abdo_burning_meals",
        "question": "Does the burning get worse after eating or on an empty stomach?",
        "hindi_question": "क्या यह जलन खाना खाने के बाद बढ़ती है या खाली पेट रहने पर?",
        "audio_hint": "Select how meals affect your burning sensation.",
        "input_type": "choice",
        "field_key": "aggravatingFactors",
        "quick_options": [
            {"label": "Worse after eating spicy/oily food", "hindi": "खाना खाने के बाद बढ़ती है", "value": "Worse after meals"},
            {"label": "Worse on empty stomach / Relieved by food", "hindi": "खाली पेट ज्यादा, खाना खाने पर राहत", "value": "Worse when fasting / Relieved by milk or food"},
            {"label": "Constant burning, no relation to food", "hindi": "लगातार रहती है, खाने से कोई फर्क नहीं", "value": "Continuous burning"}
        ],
        "next_question": "abdo_radiation"
    },

    # 3B. BRANCH: CRAMPING -> Colic wave pattern
    "abdo_cramping_waves": {
        "id": "abdo_cramping_waves",
        "question": "Does the cramping pain come and go in waves?",
        "hindi_question": "क्या मरोड़ का दर्द बार-बार लहर की तरह आकर चला जाता है?",
        "audio_hint": "Select whether the cramping is periodic or continuous.",
        "input_type": "choice",
        "field_key": "timing",
        "quick_options": [
            {"label": "Yes, comes in severe waves/spasms", "hindi": "हाँ, रुक-रुक कर तेज़ लहर आती है", "value": "Episodic colicky spasms"},
            {"label": "No, persistent cramp without relief", "hindi": "नहीं, लगातार मरोड़ बनी रहती है", "value": "Constant cramping"},
            {"label": "Relieved after passing stool or gas", "hindi": "शौच या गैस पास होने पर आराम मिलता है", "value": "Relieved by defecation"}
        ],
        "next_question": "abdo_radiation"
    },

    # 3C. BRANCH: SHARP -> Radiation
    "abdo_sharp_radiation": {
        "id": "abdo_sharp_radiation",
        "question": "Does the sharp pain shoot or radiate anywhere else?",
        "hindi_question": "क्या यह तीखा दर्द कहीं और भी फैलता है (जैसे पीठ या कंधे में)?",
        "audio_hint": "Select if the pain spreads to another part of your body.",
        "input_type": "choice",
        "field_key": "radiation",
        "quick_options": [
            {"label": "Radiates straight through to the back", "hindi": "सीधे पीठ की ओर जाता है", "value": "Radiates to back"},
            {"label": "Radiates to right shoulder or shoulder blade", "hindi": "दाहिने कंधे की तरफ फैलता है", "value": "Radiates to right shoulder"},
            {"label": "Radiates down towards the groin", "hindi": "नीचे कमर या जांघ की ओर जाता है", "value": "Radiates to groin"},
            {"label": "Stays strictly in one spot", "hindi": "एक ही जगह रहता है, कहीं नहीं फैलता", "value": "No radiation (localized)"}
        ],
        "next_question": "abdo_severity"
    },

    # 4. GENERAL RADIATION (For non-sharp branches)
    "abdo_radiation": {
        "id": "abdo_radiation",
        "question": "Does the pain travel or radiate anywhere else?",
        "hindi_question": "क्या दर्द किसी और अंग की तरफ फैलता है?",
        "audio_hint": "Select if pain spreads to back, shoulder, or stays localized.",
        "input_type": "choice",
        "field_key": "radiation",
        "quick_options": [
            {"label": "Radiates towards the back", "hindi": "पीठ की ओर फैलता है", "value": "Radiates to back"},
            {"label": "Stays localized in the stomach", "hindi": "केवल पेट में ही रहता है", "value": "No radiation"},
            {"label": "Radiates to lower back / flanks", "hindi": "कमर की ओर फैलता है", "value": "Radiates to flanks"}
        ],
        "next_question": "abdo_severity"
    },

    # 5. SEVERITY SCALE (1 to 10)
    "abdo_severity": {
        "id": "abdo_severity",
        "question": "On a scale of 1 to 10, how severe is your pain right now?",
        "hindi_question": "1 से 10 के पैमाने पर, इस समय दर्द कितना गंभीर है?",
        "audio_hint": "Select your pain level from mild to extreme.",
        "input_type": "scale",
        "field_key": "severity",
        "quick_options": [
            {"label": "Mild (1 - 3)", "hindi": "हल्का (1-3)", "value": "Mild (3/10)"},
            {"label": "Moderate (4 - 6) — Affects daily tasks", "hindi": "मध्यम (4-6) — काम में रुकावट", "value": "Moderate (6/10)"},
            {"label": "Severe (7 - 8) — Difficult to tolerate", "hindi": "गंभीर (7-8) — असहनीय", "value": "Severe (8/10)"},
            {"label": "Extreme (9 - 10) — Worst possible pain", "hindi": "अति गंभीर (9-10)", "value": "Extreme (10/10)"}
        ],
        "next_question": "abdo_associated"
    },

    # 6. ASSOCIATED SYMPTOMS & RED-FLAG CHECKS
    "abdo_associated": {
        "id": "abdo_associated",
        "question": "Do you have any of these accompanying symptoms?",
        "hindi_question": "क्या आपको इनमें से कोई अन्य लक्षण भी हैं?",
        "audio_hint": "Select any other symptoms you are experiencing.",
        "input_type": "choice",
        "field_key": "associatedSymptoms",
        "quick_options": [
            {"label": "Nausea / Mild vomiting", "hindi": "उल्टी जैसा लगना या उल्टी", "value": "Nausea with vomiting"},
            {"label": "Fever & Chills", "hindi": "बुखार और ठंड लगना", "value": "Fever and chills"},
            {"label": "Loose motions / Diarrhea", "hindi": "दस्त या लूज़ मोशन", "value": "Diarrhea"},
            {"label": "⚠️ Vomiting blood or black stools", "hindi": "उल्टी में खून या काला मल", "value": "Hematemesis / Melena (Red Flag)"},
            {"label": "None of the above", "hindi": "इनमें से कोई नहीं", "value": "No associated symptoms"}
        ],
        "next_question": "abdo_medications"
    },

    # 7. MEDICATIONS & ALLERGIES
    "abdo_medications": {
        "id": "abdo_medications",
        "question": "Have you taken any medicines for this pain or do you have any allergies?",
        "hindi_question": "क्या आपने इस दर्द के लिए कोई दवा ली है या किसी दवा से एलर्जी है?",
        "audio_hint": "Mention any antacids, painkillers, or known drug allergies.",
        "input_type": "choice",
        "field_key": "medications",
        "quick_options": [
            {"label": "Took Antacid / Gas Tablet (e.g. Pantocid)", "hindi": "एंटासिड / गैस की गोली ली थी", "value": "Took Antacid (Pantoprazole)"},
            {"label": "Took Painkiller (e.g. Paracetamol / Ibuprofen)", "hindi": "दर्द निवारक गोली ली", "value": "Took OTC Painkiller"},
            {"label": "No medicines taken yet", "hindi": "अभी तक कोई दवा नहीं ली", "value": "No medications taken"},
            {"label": "Allergic to Penicillin / Sulfa drugs", "hindi": "दवा से एलर्जी है", "value": "Sulfa / Penicillin allergy"}
        ],
        "is_terminal": True
    },

    # ==========================================
    # FEVER BRANCH
    # ==========================================
    "fever_pattern": {
        "id": "fever_pattern",
        "question": "How long has the fever lasted and does it come with chills?",
        "hindi_question": "बुखार कितने दिनों से है और क्या यह ठंड लगकर आता है?",
        "input_type": "choice",
        "field_key": "timing",
        "quick_options": [
            {"label": "2-3 days with chills / shivering", "hindi": "2-3 दिन से ठंड लगकर", "value": "2-3 days with chills"},
            {"label": "High continuous fever for 1 week", "hindi": "1 हफ्ते से लगातार तेज़ बुखार", "value": "Continuous fever (1 week)"},
            {"label": "Low fever mainly in evenings", "hindi": "हल्का बुखार, शाम को ज़्यादा", "value": "Evening low-grade fever"}
        ],
        "next_question": "abdo_severity"
    },

    # ==========================================
    # CHEST PAIN BRANCH
    # ==========================================
    "chest_character": {
        "id": "chest_character",
        "question": "How does the chest discomfort feel?",
        "hindi_question": "सीने में दर्द किस तरह का महसूस हो रहा है?",
        "input_type": "choice",
        "field_key": "character",
        "quick_options": [
            {"label": "⚠️ Heavy pressure / Squeezing", "hindi": "भारी दबाव या जकड़न", "value": "Retrosternal pressure"},
            {"label": "Sharp on deep breath / coughing", "hindi": "गहरी सांस लेने पर चुभन", "value": "Pleuritic sharp"},
            {"label": "Burning in center of chest", "hindi": "सीने के बीच में जलन", "value": "Retrosternal burning"}
        ],
        "next_question": "abdo_severity"
    },

    # ==========================================
    # COUGH BRANCH
    # ==========================================
    "cough_type": {
        "id": "cough_type",
        "question": "Is the cough dry or producing sputum/phlegm?",
        "hindi_question": "क्या खांसी सूखी है या बलगम आ रहा है?",
        "input_type": "choice",
        "field_key": "character",
        "quick_options": [
            {"label": "Dry cough (सूखी खांसी)", "hindi": "सूखी खांसी", "value": "Dry cough"},
            {"label": "Productive with white/yellow sputum", "hindi": "बलगम वाली खांसी", "value": "Productive cough"},
            {"label": "⚠️ Sputum with blood streaks", "hindi": "बलगम में खून के अंश", "value": "Hemoptysis (Red Flag)"}
        ],
        "next_question": "abdo_severity"
    },

    # ==========================================
    # HEADACHE BRANCH
    # ==========================================
    "headache_type": {
        "id": "headache_type",
        "question": "Where is the headache located and what does it feel like?",
        "hindi_question": "सिरदर्द कहाँ है और कैसा महसूस होता है?",
        "input_type": "choice",
        "field_key": "site",
        "quick_options": [
            {"label": "One side of head, throbbing", "hindi": "एक तरफ धड़कता हुआ", "value": "Unilateral throbbing"},
            {"label": "Forehead and temples, pressing band", "hindi": "माथे और कनपटी पर भारीपन", "value": "Frontal tension"},
            {"label": "⚠️ Sudden severe 'worst headache of life'", "hindi": "अचानक बहुत तेज़ भयानक सिरदर्द", "value": "Thunderclap headache (Red Flag)"}
        ],
        "next_question": "abdo_severity"
    }
}


class AdaptiveInterviewEngine:
    """
    Stateful adaptive interview session manager.
    Conducts branching questioning, updates clinical entities, and monitors safety flags.
    """

    def __init__(self):
        self._sessions: Dict[str, Dict[str, Any]] = {}

    def start_session(self, patient_id: str, language: str = "hi") -> Dict[str, Any]:
        session_id = str(uuid.uuid4())[:8]
        session = {
            "session_id": session_id,
            "patient_id": patient_id,
            "language": language,
            "current_question_id": "root_complaint",
            "history": [],  # list of {question, answer, question_id, extracted}
            "question_stack": ["root_complaint"],
            "chief_complaint": None,
            "extracted_history": {
                "site": "Not yet provided",
                "onset": "Not yet provided",
                "character": "Not yet provided",
                "radiation": "Not yet provided",
                "associatedSymptoms": "Not yet provided",
                "timing": "Not yet provided",
                "aggravatingFactors": "Not yet provided",
                "relievingFactors": "Not yet provided",
                "severity": "Not yet provided",
                "medications": "Not yet provided",
                "allergies": "Not yet provided"
            },
            "red_flags": [],
            "completed": False
        }
        self._sessions[session_id] = session
        return self._format_session_state(session)

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        session = self._sessions.get(session_id)
        if not session:
            return None
        return self._format_session_state(session)

    def submit_answer(self, session_id: str, answer_text: str, input_mode: str = "touch") -> Dict[str, Any]:
        session = self._sessions.get(session_id)
        if not session:
            raise KeyError("Interview session not found")

        current_q_id = session["current_question_id"]
        q_node = QUESTION_TREE.get(current_q_id, QUESTION_TREE["root_complaint"])

        # 1. Extract Clinical Entity
        self._extract_entity_from_answer(session, q_node, answer_text)

        # 2. Record Turn in History
        session["history"].append({
            "question_id": current_q_id,
            "question_text": q_node["question"],
            "hindi_question": q_node.get("hindi_question"),
            "answer_text": answer_text,
            "input_mode": input_mode
        })

        # 3. Determine Next Question via Adaptive Branching
        next_q_id = self._determine_next_question(q_node, answer_text)

        if not next_q_id or q_node.get("is_terminal"):
            session["completed"] = True
            session["current_question_id"] = None
        else:
            session["current_question_id"] = next_q_id
            session["question_stack"].append(next_q_id)

        return self._format_session_state(session)

    def step_back(self, session_id: str) -> Dict[str, Any]:
        """Undo last answer and step back in the interview."""
        session = self._sessions.get(session_id)
        if not session or len(session["question_stack"]) <= 1:
            return self._format_session_state(session)

        # Pop last question and history turn
        session["question_stack"].pop()
        prev_q_id = session["question_stack"][-1]
        session["current_question_id"] = prev_q_id
        session["completed"] = False

        if session["history"]:
            removed_turn = session["history"].pop()
            # If chief complaint was set by this question, clear it
            if removed_turn["question_id"] == "root_complaint":
                session["chief_complaint"] = None

        return self._format_session_state(session)

    def complete_session(self, session_id: str) -> Dict[str, Any]:
        session = self._sessions.get(session_id)
        if not session:
            raise KeyError("Interview session not found")
        session["completed"] = True
        return self._format_session_state(session)

    def _determine_next_question(self, q_node: Dict[str, Any], answer_text: str) -> Optional[str]:
        # Branch mapping check (e.g. Burning -> abdo_burning_meals)
        branch_map = q_node.get("branch_map")
        if branch_map:
            for keyword, target_id in branch_map.items():
                if keyword.lower() in answer_text.lower():
                    return target_id

        # Root question mapping
        if q_node["id"] == "root_complaint":
            text_lower = answer_text.lower()
            if any(k in text_lower for k in ["stomach", "abdominal", "pet", "dard", "belly", "pain"]):
                return "abdo_site"
            elif "fever" in text_lower or "bukhar" in text_lower:
                return "fever_pattern"
            elif "chest" in text_lower or "seena" in text_lower:
                return "chest_character"
            elif "cough" in text_lower or "khansi" in text_lower:
                return "cough_type"
            elif "headache" in text_lower or "sir" in text_lower:
                return "headache_type"
            return "abdo_site"

        # Standard next question
        return q_node.get("next_question")

    def _extract_entity_from_answer(self, session: Dict[str, Any], q_node: Dict[str, Any], answer: str):
        extracted = session["extracted_history"]

        # If answering root question -> set Chief Complaint
        if q_node["id"] == "root_complaint":
            # Match quick options or free text
            for opt in q_node.get("quick_options", []):
                if opt["value"].lower() in answer.lower() or opt["label"].lower() in answer.lower():
                    session["chief_complaint"] = opt["complaint"]
                    break
            if not session["chief_complaint"]:
                session["chief_complaint"] = answer

        # Map field key if defined on question node
        field_key = q_node.get("field_key")
        if field_key and field_key in extracted:
            extracted[field_key] = answer

        # Safety / Red-Flag Checks (OR Logic)
        answer_lower = answer.lower()
        if any(flag in answer_lower for flag in ["blood", "black stool", "melena", "hematemesis", "खून"]):
            flag_note = "Potential gastrointestinal bleeding symptom reported"
            if flag_note not in session["red_flags"]:
                session["red_flags"].append(flag_note)

        if "extreme (10/10)" in answer_lower or "thunderclap" in answer_lower:
            flag_note = "Acute high-severity onset reported (10/10)"
            if flag_note not in session["red_flags"]:
                session["red_flags"].append(flag_note)

    def _format_session_state(self, session: Dict[str, Any]) -> Dict[str, Any]:
        current_q_id = session["current_question_id"]
        current_q = QUESTION_TREE.get(current_q_id) if current_q_id else None

        return {
            "session_id": session["session_id"],
            "patient_id": session["patient_id"],
            "language": session["language"],
            "chief_complaint": session["chief_complaint"],
            "current_step": len(session["history"]) + 1,
            "total_estimated_steps": 7,
            "completed": session["completed"],
            "current_question": current_q,
            "history": session["history"],
            "extracted_history": session["extracted_history"],
            "red_flags": session["red_flags"]
        }


# Global singleton engine instance
interview_engine = AdaptiveInterviewEngine()
