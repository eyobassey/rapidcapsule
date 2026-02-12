<template>
  <div class="analysis-form">
    <!-- Patient / Subject Name -->
    <div class="form-group">
      <label class="form-label">Patient / Subject Name <span class="optional-tag">Optional</span></label>
      <input
        v-model="form.subject_name"
        type="text"
        class="form-input"
        placeholder="e.g. Mrs. Johnson, John D."
      />
    </div>

    <!-- Diagnosis (Required) -->
    <div class="form-group autocomplete-wrapper" ref="diagnosisWrapperRef">
      <label class="form-label">
        <v-icon name="hi-clipboard-list" scale="0.8" />
        Primary Diagnosis <span class="required">*</span>
      </label>
      <input
        v-model="form.diagnosis"
        type="text"
        class="form-input"
        placeholder="e.g., Hypertension, Type 2 Diabetes, Atrial Fibrillation"
        autocomplete="off"
        @input="onDiagnosisInput"
        @keydown.down.prevent="navigateSuggestions('diagnosis', 1)"
        @keydown.up.prevent="navigateSuggestions('diagnosis', -1)"
        @keydown.enter.prevent="selectHighlighted('diagnosis')"
        @keydown.escape="closeSuggestions('diagnosis')"
        @focus="onDiagnosisInput"
        @blur="delayClose('diagnosis')"
      />
      <ul v-if="showDiagnosisSuggestions && filteredDiagnoses.length" class="suggestions-dropdown">
        <li
          v-for="(item, i) in filteredDiagnoses"
          :key="item"
          :class="['suggestion-item', { 'suggestion-item--active': diagnosisHighlightIndex === i }]"
          @mousedown.prevent="selectDiagnosis(item)"
          @mouseenter="diagnosisHighlightIndex = i"
        >
          <span v-html="highlightMatch(item, currentDiagnosisQuery)"></span>
        </li>
      </ul>
    </div>

    <!-- Treatment Goal -->
    <div class="form-group">
      <label class="form-label">
        <v-icon name="hi-light-bulb" scale="0.8" />
        Treatment Goal
      </label>
      <input
        v-model="form.treatment_goal"
        type="text"
        class="form-input"
        placeholder="e.g., Blood pressure control below 140/90"
      />
    </div>

    <!-- Patient Context (Collapsible) -->
    <div class="collapsible-section">
      <button class="collapsible-header" @click="showPatientContext = !showPatientContext">
        <div class="collapsible-title">
          <v-icon name="hi-user" scale="0.85" />
          <span>Patient Context</span>
          <span class="optional-badge">Optional</span>
        </div>
        <v-icon :name="showPatientContext ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.8" />
      </button>
      <div v-if="showPatientContext" class="collapsible-body">
        <div class="form-row">
          <div class="form-group form-group--half">
            <label class="form-label-sm">Age</label>
            <input v-model.number="form.patient_context.age" type="number" class="form-input form-input--sm" placeholder="e.g., 55" min="1" max="120" />
          </div>
          <div class="form-group form-group--half">
            <label class="form-label-sm">Gender</label>
            <select v-model="form.patient_context.gender" class="form-input form-input--sm">
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group form-group--half">
            <label class="form-label-sm">Weight (kg)</label>
            <input v-model.number="form.patient_context.weight" type="number" class="form-input form-input--sm" placeholder="e.g., 75" min="1" />
          </div>
          <div class="form-group form-group--half">
            <div class="checkbox-row">
              <label class="checkbox-label">
                <input type="checkbox" v-model="form.patient_context.renal_impairment" />
                <span>Renal Impairment</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="form.patient_context.hepatic_impairment" />
                <span>Hepatic Impairment</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="form.patient_context.pregnant" />
                <span>Pregnant</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Allergies -->
        <div class="form-group">
          <label class="form-label-sm">Known Allergies</label>
          <div class="tag-input-wrapper">
            <div class="tags-list" v-if="form.patient_context.allergies.length">
              <span class="tag tag--danger" v-for="(allergy, i) in form.patient_context.allergies" :key="i">
                {{ allergy }}
                <button class="tag-remove" @click="form.patient_context.allergies.splice(i, 1)">&times;</button>
              </span>
            </div>
            <input
              v-model="allergyInput"
              type="text"
              class="form-input form-input--sm"
              placeholder="Type allergy and press Enter"
              @keydown.enter.prevent="addAllergy"
            />
          </div>
        </div>

        <!-- Chronic Conditions -->
        <div class="form-group">
          <label class="form-label-sm">Chronic Conditions</label>
          <div class="tag-input-wrapper">
            <div class="tags-list" v-if="form.patient_context.chronic_conditions.length">
              <span class="tag tag--info" v-for="(cond, i) in form.patient_context.chronic_conditions" :key="i">
                {{ cond }}
                <button class="tag-remove" @click="form.patient_context.chronic_conditions.splice(i, 1)">&times;</button>
              </span>
            </div>
            <input
              v-model="conditionInput"
              type="text"
              class="form-input form-input--sm"
              placeholder="Type condition and press Enter"
              @keydown.enter.prevent="addCondition"
            />
          </div>
        </div>

        <!-- Current Medications -->
        <div class="form-group">
          <label class="form-label-sm">Current Medications</label>
          <div v-for="(med, i) in form.patient_context.current_medications" :key="i" class="med-row">
            <input v-model="med.name" class="form-input form-input--sm" placeholder="Drug name" />
            <input v-model="med.dosage" class="form-input form-input--xs" placeholder="Dosage" />
            <input v-model="med.frequency" class="form-input form-input--xs" placeholder="Frequency" />
            <button class="btn-icon btn-icon--danger" @click="form.patient_context.current_medications.splice(i, 1)">
              <v-icon name="hi-trash" scale="0.7" />
            </button>
          </div>
          <button class="btn-add" @click="addCurrentMedication">
            <v-icon name="hi-plus" scale="0.7" /> Add Medication
          </button>
        </div>
      </div>
    </div>

    <!-- Symptoms -->
    <div class="collapsible-section">
      <button class="collapsible-header" @click="showSymptoms = !showSymptoms">
        <div class="collapsible-title">
          <v-icon name="hi-clipboard-list" scale="0.85" />
          <span>Symptoms</span>
          <span class="optional-badge">Optional</span>
        </div>
        <v-icon :name="showSymptoms ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.8" />
      </button>
      <div v-if="showSymptoms" class="collapsible-body">
        <div class="tag-input-wrapper">
          <div class="tags-list" v-if="form.symptoms.length">
            <span class="tag" v-for="(sym, i) in form.symptoms" :key="i">
              {{ sym }}
              <button class="tag-remove" @click="form.symptoms.splice(i, 1)">&times;</button>
            </span>
          </div>
          <div class="autocomplete-wrapper" ref="symptomWrapperRef">
            <input
              v-model="symptomInput"
              type="text"
              class="form-input form-input--sm"
              placeholder="Type symptom and press Enter"
              autocomplete="off"
              @input="onSymptomInput"
              @keydown.down.prevent="navigateSuggestions('symptom', 1)"
              @keydown.up.prevent="navigateSuggestions('symptom', -1)"
              @keydown.enter.prevent="selectHighlighted('symptom')"
              @keydown.escape="closeSuggestions('symptom')"
              @focus="onSymptomInput"
              @blur="delayClose('symptom')"
            />
            <ul v-if="showSymptomSuggestions && filteredSymptoms.length" class="suggestions-dropdown">
              <li
                v-for="(item, i) in filteredSymptoms"
                :key="item"
                :class="['suggestion-item', { 'suggestion-item--active': symptomHighlightIndex === i }]"
                @mousedown.prevent="selectSymptom(item)"
                @mouseenter="symptomHighlightIndex = i"
              >
                <span v-html="highlightMatch(item, symptomInput)"></span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Options Row -->
    <div class="form-row options-row">
      <div class="form-group form-group--half">
        <label class="form-label-sm">Max Suggestions</label>
        <select v-model.number="form.max_suggestions" class="form-input form-input--sm">
          <option :value="3">3 suggestions</option>
          <option :value="5">5 suggestions</option>
          <option :value="7">7 suggestions</option>
        </select>
      </div>
      <div class="form-group form-group--half">
        <label class="checkbox-label checkbox-label--standalone">
          <input type="checkbox" v-model="form.prefer_inventory" />
          <span>Prefer inventory medications</span>
        </label>
      </div>
    </div>

    <!-- Submit -->
    <button
      class="btn-analyze"
      :class="{ 'btn-analyze--disabled': !canSubmit || isSubmitting }"
      :disabled="!canSubmit || isSubmitting"
      @click="handleSubmit"
    >
      <template v-if="isSubmitting">
        <div class="btn-spinner"></div>
        Analyzing...
      </template>
      <template v-else>
        <v-icon name="bi-robot" scale="1" />
        Analyze Safety & Generate Recommendations
      </template>
    </button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const emit = defineEmits(['submit']);

const props = defineProps({
  isSubmitting: { type: Boolean, default: false },
});

const showPatientContext = ref(false);
const showSymptoms = ref(false);

const allergyInput = ref('');
const conditionInput = ref('');
const symptomInput = ref('');

// Autocomplete state
const showDiagnosisSuggestions = ref(false);
const showSymptomSuggestions = ref(false);
const diagnosisHighlightIndex = ref(-1);
const symptomHighlightIndex = ref(-1);
const diagnosisWrapperRef = ref(null);
const symptomWrapperRef = ref(null);

// Common diagnoses list
const DIAGNOSES = [
  // Cardiovascular
  'Hypertension', 'Essential Hypertension', 'Hypertensive Crisis',
  'Heart Failure', 'Congestive Heart Failure', 'Acute Heart Failure',
  'Atrial Fibrillation', 'Atrial Flutter', 'Supraventricular Tachycardia',
  'Ventricular Tachycardia', 'Coronary Artery Disease', 'Angina Pectoris',
  'Acute Myocardial Infarction', 'Unstable Angina', 'Acute Coronary Syndrome',
  'Deep Vein Thrombosis', 'Pulmonary Embolism', 'Peripheral Arterial Disease',
  'Aortic Aneurysm', 'Cardiomyopathy', 'Myocarditis', 'Pericarditis',
  'Mitral Valve Prolapse', 'Aortic Stenosis', 'Hyperlipidaemia',
  'Hypercholesterolaemia', 'Dyslipidaemia',
  // Endocrine / Metabolic
  'Type 2 Diabetes Mellitus', 'Type 1 Diabetes Mellitus', 'Diabetic Ketoacidosis',
  'Gestational Diabetes', 'Hypoglycaemia', 'Hypothyroidism', 'Hyperthyroidism',
  'Thyroid Storm', 'Graves Disease', 'Hashimoto Thyroiditis', 'Goitre',
  'Cushing Syndrome', 'Addison Disease', 'Adrenal Insufficiency',
  'Metabolic Syndrome', 'Obesity', 'Hyperuricaemia', 'Gout',
  'Hypocalcaemia', 'Hyperkalaemia', 'Hyponatraemia',
  // Respiratory
  'Asthma', 'Acute Asthma Exacerbation', 'Bronchial Asthma',
  'COPD', 'Chronic Obstructive Pulmonary Disease', 'Acute COPD Exacerbation',
  'Pneumonia', 'Community-Acquired Pneumonia', 'Hospital-Acquired Pneumonia',
  'Aspiration Pneumonia', 'Bronchitis', 'Acute Bronchitis', 'Chronic Bronchitis',
  'Bronchiectasis', 'Pulmonary Tuberculosis', 'Pleural Effusion',
  'Pneumothorax', 'Pulmonary Fibrosis', 'Acute Respiratory Distress Syndrome',
  'Upper Respiratory Tract Infection', 'Sinusitis', 'Pharyngitis',
  'Tonsillitis', 'Laryngitis', 'Croup',
  // Infectious Disease
  'Malaria', 'Uncomplicated Malaria', 'Severe Malaria',
  'Typhoid Fever', 'Cholera', 'Dysentery', 'Gastroenteritis',
  'HIV/AIDS', 'Tuberculosis', 'Multidrug-Resistant Tuberculosis',
  'Hepatitis A', 'Hepatitis B', 'Hepatitis C',
  'Urinary Tract Infection', 'Pyelonephritis', 'Cystitis',
  'Sepsis', 'Septic Shock', 'Meningitis', 'Bacterial Meningitis',
  'Cellulitis', 'Abscess', 'Wound Infection', 'Surgical Site Infection',
  'Pneumocystis Pneumonia', 'Candidiasis', 'Oral Thrush',
  'Sexually Transmitted Infection', 'Gonorrhoea', 'Chlamydia', 'Syphilis',
  'Herpes Simplex', 'Herpes Zoster', 'COVID-19',
  'Dengue Fever', 'Yellow Fever', 'Lassa Fever',
  'Schistosomiasis', 'Filariasis', 'Onchocerciasis',
  'Leishmaniasis', 'Trypanosomiasis',
  // Gastrointestinal
  'Peptic Ulcer Disease', 'Gastric Ulcer', 'Duodenal Ulcer',
  'Gastroesophageal Reflux Disease', 'GERD', 'Dyspepsia',
  'Irritable Bowel Syndrome', 'Inflammatory Bowel Disease',
  'Ulcerative Colitis', 'Crohn Disease', 'Appendicitis',
  'Acute Diarrhoea', 'Chronic Diarrhoea', 'Constipation',
  'Intestinal Obstruction', 'Pancreatitis', 'Acute Pancreatitis',
  'Cholecystitis', 'Cholelithiasis', 'Hepatic Cirrhosis',
  'Liver Failure', 'Hepatic Encephalopathy', 'Ascites',
  'GI Bleeding', 'Upper GI Bleeding', 'Lower GI Bleeding',
  // Neurological
  'Epilepsy', 'Status Epilepticus', 'Seizure Disorder',
  'Migraine', 'Tension Headache', 'Cluster Headache',
  'Stroke', 'Ischaemic Stroke', 'Haemorrhagic Stroke',
  'Transient Ischaemic Attack', 'Parkinson Disease',
  'Alzheimer Disease', 'Dementia', 'Multiple Sclerosis',
  'Meningitis', 'Encephalitis', 'Peripheral Neuropathy',
  'Diabetic Neuropathy', 'Bell Palsy', 'Trigeminal Neuralgia',
  'Myasthenia Gravis', 'Guillain-Barre Syndrome',
  // Psychiatric
  'Major Depressive Disorder', 'Depression', 'Anxiety Disorder',
  'Generalised Anxiety Disorder', 'Panic Disorder',
  'Bipolar Disorder', 'Schizophrenia', 'Psychosis',
  'Obsessive-Compulsive Disorder', 'Post-Traumatic Stress Disorder',
  'Insomnia', 'Substance Use Disorder', 'Alcohol Dependence',
  'Opioid Dependence', 'ADHD',
  // Musculoskeletal
  'Rheumatoid Arthritis', 'Osteoarthritis', 'Gout',
  'Systemic Lupus Erythematosus', 'Osteoporosis',
  'Low Back Pain', 'Sciatica', 'Fibromyalgia',
  'Ankylosing Spondylitis', 'Tendinitis',
  // Renal
  'Acute Kidney Injury', 'Chronic Kidney Disease',
  'Nephrotic Syndrome', 'Nephritic Syndrome',
  'End-Stage Renal Disease', 'Renal Calculi',
  'Diabetic Nephropathy', 'Glomerulonephritis',
  // Haematological
  'Iron Deficiency Anaemia', 'Sickle Cell Disease', 'Sickle Cell Crisis',
  'Anaemia of Chronic Disease', 'Megaloblastic Anaemia',
  'Thalassaemia', 'Haemophilia', 'Thrombocytopenia',
  'Disseminated Intravascular Coagulation', 'Leukaemia',
  'Lymphoma', 'Multiple Myeloma',
  // Dermatological
  'Eczema', 'Atopic Dermatitis', 'Contact Dermatitis',
  'Psoriasis', 'Urticaria', 'Acne Vulgaris',
  'Fungal Skin Infection', 'Tinea Corporis', 'Tinea Pedis',
  'Scabies', 'Impetigo', 'Cellulitis',
  // Obstetric / Gynaecological
  'Pre-eclampsia', 'Eclampsia', 'Gestational Hypertension',
  'Postpartum Haemorrhage', 'Ectopic Pregnancy',
  'Pelvic Inflammatory Disease', 'Endometriosis',
  'Polycystic Ovary Syndrome', 'Menorrhagia', 'Amenorrhoea',
  'Threatened Miscarriage', 'Preterm Labour',
  // Oncological
  'Breast Cancer', 'Lung Cancer', 'Prostate Cancer',
  'Colorectal Cancer', 'Cervical Cancer', 'Ovarian Cancer',
  'Hepatocellular Carcinoma', 'Pancreatic Cancer',
  'Gastric Cancer', 'Bladder Cancer', 'Renal Cell Carcinoma',
  // Ophthalmological
  'Glaucoma', 'Conjunctivitis', 'Allergic Conjunctivitis',
  'Bacterial Conjunctivitis', 'Cataract', 'Macular Degeneration',
  'Diabetic Retinopathy', 'Uveitis',
  // Paediatric
  'Neonatal Sepsis', 'Neonatal Jaundice', 'Febrile Seizures',
  'Acute Otitis Media', 'Rickets', 'Kwashiorkor', 'Marasmus',
  'Severe Acute Malnutrition',
  // ENT
  'Otitis Media', 'Otitis Externa', 'Allergic Rhinitis',
  'Nasal Polyps', 'Sinusitis',
  // Emergency
  'Anaphylaxis', 'Cardiac Arrest', 'Shock',
  'Hypovolaemic Shock', 'Septic Shock', 'Poisoning',
  'Organophosphate Poisoning', 'Snake Bite Envenomation',
];

// Common symptoms list
const SYMPTOMS = [
  // General
  'Fever', 'Chills', 'Fatigue', 'Malaise', 'Weakness', 'Night Sweats',
  'Weight Loss', 'Weight Gain', 'Loss of Appetite', 'Excessive Thirst',
  'Frequent Urination', 'Dehydration', 'Dizziness', 'Lightheadedness',
  'Fainting', 'Syncope',
  // Pain
  'Headache', 'Chest Pain', 'Abdominal Pain', 'Back Pain', 'Joint Pain',
  'Muscle Pain', 'Neck Pain', 'Pelvic Pain', 'Flank Pain',
  'Bone Pain', 'Eye Pain', 'Ear Pain', 'Throat Pain', 'Toothache',
  'Pain on Urination', 'Painful Swallowing',
  // Cardiovascular
  'Palpitations', 'Tachycardia', 'Bradycardia', 'Irregular Heartbeat',
  'Chest Tightness', 'Leg Swelling', 'Ankle Oedema', 'Cyanosis',
  'Claudication',
  // Respiratory
  'Cough', 'Dry Cough', 'Productive Cough', 'Coughing Blood', 'Haemoptysis',
  'Shortness of Breath', 'Dyspnoea', 'Wheezing', 'Stridor',
  'Nasal Congestion', 'Runny Nose', 'Sneezing', 'Sore Throat',
  'Hoarseness', 'Rapid Breathing',
  // Gastrointestinal
  'Nausea', 'Vomiting', 'Diarrhoea', 'Constipation', 'Bloating',
  'Abdominal Cramps', 'Heartburn', 'Acid Reflux', 'Difficulty Swallowing',
  'Blood in Stool', 'Black Tarry Stool', 'Vomiting Blood',
  'Jaundice', 'Abdominal Distension', 'Flatulence',
  'Loss of Appetite', 'Indigestion',
  // Neurological
  'Seizures', 'Convulsions', 'Tremor', 'Numbness', 'Tingling',
  'Pins and Needles', 'Weakness in Limbs', 'Paralysis',
  'Loss of Consciousness', 'Confusion', 'Altered Mental Status',
  'Memory Loss', 'Difficulty Speaking', 'Slurred Speech',
  'Visual Disturbances', 'Blurred Vision', 'Double Vision',
  'Loss of Balance', 'Vertigo', 'Tinnitus', 'Hearing Loss',
  // Dermatological
  'Rash', 'Itching', 'Pruritus', 'Skin Redness', 'Swelling',
  'Hives', 'Blistering', 'Bruising', 'Skin Ulcer',
  'Dry Skin', 'Skin Discolouration', 'Hair Loss',
  // Musculoskeletal
  'Joint Stiffness', 'Joint Swelling', 'Limited Range of Motion',
  'Muscle Cramps', 'Muscle Weakness', 'Back Stiffness',
  // Psychiatric
  'Anxiety', 'Depression', 'Insomnia', 'Irritability',
  'Agitation', 'Hallucinations', 'Delusions', 'Suicidal Thoughts',
  'Mood Swings', 'Restlessness', 'Poor Concentration',
  // Urogenital
  'Blood in Urine', 'Haematuria', 'Painful Urination', 'Dysuria',
  'Urinary Frequency', 'Urinary Urgency', 'Urinary Incontinence',
  'Urinary Retention', 'Vaginal Bleeding', 'Vaginal Discharge',
  'Penile Discharge', 'Erectile Dysfunction',
  // Ophthalmological
  'Red Eye', 'Eye Discharge', 'Watery Eyes', 'Photophobia',
  'Floaters', 'Reduced Visual Acuity',
  // Constitutional
  'Swollen Lymph Nodes', 'Lymphadenopathy', 'Pallor',
  'Easy Bruising', 'Bleeding Gums', 'Nosebleed', 'Epistaxis',
  'Excessive Sweating', 'Cold Extremities', 'Oedema',
];

// Helper: get the current term being typed (after last comma)
function getCurrentDiagnosisTerm() {
  const parts = form.value.diagnosis.split(',');
  return parts[parts.length - 1].trim();
}

// Helper: get already-entered diagnoses (before last comma)
function getPreviousDiagnoses() {
  const parts = form.value.diagnosis.split(',');
  if (parts.length <= 1) return [];
  return parts.slice(0, -1).map(p => p.trim().toLowerCase()).filter(Boolean);
}

// Filter logic
const filteredDiagnoses = computed(() => {
  const currentTerm = getCurrentDiagnosisTerm().toLowerCase();
  if (!currentTerm || currentTerm.length < 2) return [];
  const alreadyEntered = getPreviousDiagnoses();
  return DIAGNOSES.filter(d => {
    const dl = d.toLowerCase();
    return dl.includes(currentTerm) && dl !== currentTerm && !alreadyEntered.includes(dl);
  }).slice(0, 8);
});

const filteredSymptoms = computed(() => {
  const q = symptomInput.value.trim().toLowerCase();
  if (!q || q.length < 2) return [];
  const existing = form.value.symptoms.map(s => s.toLowerCase());
  return SYMPTOMS.filter(s =>
    s.toLowerCase().includes(q) && !existing.includes(s.toLowerCase())
  ).slice(0, 8);
});

// Expose current term for template highlight
const currentDiagnosisQuery = computed(() => getCurrentDiagnosisTerm());

// Autocomplete handlers
function onDiagnosisInput() {
  showDiagnosisSuggestions.value = true;
  diagnosisHighlightIndex.value = -1;
}

function onSymptomInput() {
  showSymptomSuggestions.value = true;
  symptomHighlightIndex.value = -1;
}

function navigateSuggestions(field, direction) {
  if (field === 'diagnosis') {
    if (!showDiagnosisSuggestions.value || !filteredDiagnoses.value.length) return;
    const max = filteredDiagnoses.value.length - 1;
    let idx = diagnosisHighlightIndex.value + direction;
    if (idx < 0) idx = max;
    if (idx > max) idx = 0;
    diagnosisHighlightIndex.value = idx;
  } else {
    if (!showSymptomSuggestions.value || !filteredSymptoms.value.length) return;
    const max = filteredSymptoms.value.length - 1;
    let idx = symptomHighlightIndex.value + direction;
    if (idx < 0) idx = max;
    if (idx > max) idx = 0;
    symptomHighlightIndex.value = idx;
  }
}

function selectHighlighted(field) {
  if (field === 'diagnosis') {
    if (diagnosisHighlightIndex.value >= 0 && filteredDiagnoses.value[diagnosisHighlightIndex.value]) {
      selectDiagnosis(filteredDiagnoses.value[diagnosisHighlightIndex.value]);
    }
  } else {
    if (symptomHighlightIndex.value >= 0 && filteredSymptoms.value[symptomHighlightIndex.value]) {
      selectSymptom(filteredSymptoms.value[symptomHighlightIndex.value]);
    } else {
      addSymptom();
    }
  }
}

function selectDiagnosis(item) {
  const parts = form.value.diagnosis.split(',');
  parts[parts.length - 1] = (parts.length > 1 ? ' ' : '') + item;
  form.value.diagnosis = parts.join(',');
  showDiagnosisSuggestions.value = false;
  diagnosisHighlightIndex.value = -1;
}

function selectSymptom(item) {
  if (!form.value.symptoms.includes(item)) {
    form.value.symptoms.push(item);
  }
  symptomInput.value = '';
  showSymptomSuggestions.value = false;
  symptomHighlightIndex.value = -1;
}

function closeSuggestions(field) {
  if (field === 'diagnosis') {
    showDiagnosisSuggestions.value = false;
    diagnosisHighlightIndex.value = -1;
  } else {
    showSymptomSuggestions.value = false;
    symptomHighlightIndex.value = -1;
  }
}

function delayClose(field) {
  setTimeout(() => closeSuggestions(field), 150);
}

function highlightMatch(text, query) {
  const q = (query || '').trim();
  if (!q) return text;
  const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<strong>$1</strong>');
}

const form = ref({
  subject_name: '',
  diagnosis: '',
  treatment_goal: '',
  patient_context: {
    age: null,
    gender: '',
    weight: null,
    allergies: [],
    chronic_conditions: [],
    current_medications: [],
    renal_impairment: false,
    hepatic_impairment: false,
    pregnant: false,
  },
  symptoms: [],
  max_suggestions: 5,
  prefer_inventory: true,
});

const canSubmit = computed(() => {
  return form.value.diagnosis.trim().length >= 3;
});

function addAllergy() {
  const val = allergyInput.value.trim();
  if (val && !form.value.patient_context.allergies.includes(val)) {
    form.value.patient_context.allergies.push(val);
  }
  allergyInput.value = '';
}

function addCondition() {
  const val = conditionInput.value.trim();
  if (val && !form.value.patient_context.chronic_conditions.includes(val)) {
    form.value.patient_context.chronic_conditions.push(val);
  }
  conditionInput.value = '';
}

function addSymptom() {
  const val = symptomInput.value.trim();
  if (val && !form.value.symptoms.includes(val)) {
    form.value.symptoms.push(val);
  }
  symptomInput.value = '';
}

function addCurrentMedication() {
  form.value.patient_context.current_medications.push({
    name: '',
    dosage: '',
    frequency: '',
  });
}

function handleSubmit() {
  if (!canSubmit.value || props.isSubmitting) return;

  // Build clean payload
  const payload = {
    diagnosis: form.value.diagnosis.trim(),
    treatment_goal: form.value.treatment_goal.trim() || undefined,
    max_suggestions: form.value.max_suggestions,
    prefer_inventory: form.value.prefer_inventory,
    ...(form.value.subject_name.trim() && { subject_name: form.value.subject_name.trim() }),
  };

  // Only include patient_context if any field is filled
  const ctx = form.value.patient_context;
  const hasContext = ctx.age || ctx.gender || ctx.weight || ctx.allergies.length ||
    ctx.chronic_conditions.length || ctx.current_medications.length ||
    ctx.renal_impairment || ctx.hepatic_impairment || ctx.pregnant;

  if (hasContext) {
    payload.patient_context = {
      ...(ctx.age && { age: ctx.age }),
      ...(ctx.gender && { gender: ctx.gender }),
      ...(ctx.weight && { weight: ctx.weight }),
      ...(ctx.allergies.length && { allergies: ctx.allergies }),
      ...(ctx.chronic_conditions.length && { chronic_conditions: ctx.chronic_conditions }),
      ...(ctx.current_medications.filter(m => m.name).length && {
        current_medications: ctx.current_medications.filter(m => m.name),
      }),
      ...(ctx.renal_impairment && { renal_impairment: true }),
      ...(ctx.hepatic_impairment && { hepatic_impairment: true }),
      ...(ctx.pregnant && { pregnant: true }),
    };
  }

  if (form.value.symptoms.length) {
    payload.symptoms = form.value.symptoms;
  }

  emit('submit', payload);
}
</script>

<style lang="scss" scoped>
// Pharmacy Design System Tokens
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$sky-darker: #01579B;
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$bg: #F8FAFC;
$emerald: #10B981;
$emerald-light: #D1FAE5;
$amber: #F59E0B;
$amber-light: #FEF3C7;

.analysis-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group--half {
  flex: 1;
  min-width: 0;
}

.form-row {
  display: flex;
  gap: 12px;
  @media (max-width: 480px) { flex-direction: column; }
}

.form-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: $slate;
}

.form-label-sm {
  font-size: 12px;
  font-weight: 600;
  color: $gray;
  margin-bottom: 2px;
}

.required { color: #ef4444; }

.optional-tag {
  font-size: 11px;
  font-weight: 500;
  color: $gray;
  margin-left: 4px;
}

.form-input {
  padding: 10px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  color: $navy;
  background: rgba(255,255,255,0.8);
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;

  &:focus {
    border-color: $sky-dark;
    box-shadow: 0 0 0 3px rgba(2, 136, 209, 0.1);
  }

  &::placeholder { color: #9ca3af; }
}

.form-input--sm { padding: 8px 12px; font-size: 13px; border-radius: 8px; }
.form-input--xs { padding: 8px 10px; font-size: 12px; border-radius: 8px; max-width: 120px; }

select.form-input {
  cursor: pointer;
  appearance: auto;
}

// Collapsible sections
.collapsible-section {
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  overflow: visible;
  background: rgba(255,255,255,0.5);
}

.collapsible-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  cursor: pointer;
  color: $slate;
  transition: background 0.2s;

  &:hover { background: rgba(2, 136, 209, 0.04); }
}

.collapsible-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
}

.optional-badge {
  font-size: 10px;
  font-weight: 500;
  color: #9ca3af;
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 20px;
}

.collapsible-body {
  padding: 0 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

// Tags
.tag-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  background: $sky-light;
  color: $sky-dark;
}

.tag--danger { background: #fee2e2; color: #991b1b; }
.tag--info { background: #dbeafe; color: #1e40af; }

.tag-remove {
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  font-size: 14px;
  line-height: 1;
  opacity: 0.7;
  &:hover { opacity: 1; }
}

// Medication rows
.med-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background: #f3f4f6;
  color: $gray;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-icon--danger:hover { background: #fee2e2; color: #dc2626; }

.btn-add {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: none;
  border: 1.5px dashed #d1d5db;
  border-radius: 8px;
  color: $sky-dark;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  align-self: flex-start;

  &:hover { border-color: $sky-dark; background: rgba(2, 136, 209, 0.04); }
}

// Checkboxes
.checkbox-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 4px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #4b5563;
  cursor: pointer;

  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: $sky-dark;
  }
}

.checkbox-label--standalone {
  font-size: 13px;
  padding-top: 22px;
}

// Options
.options-row {
  padding-top: 4px;
  border-top: 1px solid #f3f4f6;
}

// Submit button
.btn-analyze {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 24px;
  background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 8px;

  &:hover:not(.btn-analyze--disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba($sky, 0.3);
  }
}

.btn-analyze--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// Autocomplete dropdown
.autocomplete-wrapper {
  position: relative;
}

.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 50;
  margin-top: 4px;
  padding: 4px;
  background: white;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05);
  list-style: none;
  max-height: 240px;
  overflow-y: auto;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
}

.suggestion-item {
  padding: 8px 12px;
  font-size: 13px;
  color: $slate;
  border-radius: 7px;
  cursor: pointer;
  transition: background 0.12s;

  &:hover, &--active {
    background: $sky-light;
    color: $sky-darker;
  }

  strong {
    color: $sky-dark;
    font-weight: 700;
  }
}
</style>
