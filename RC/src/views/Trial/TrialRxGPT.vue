<template>
	<div class="trial-rx">
		<div class="trial-rx__nav">
			<router-link to="/" class="trial-rx__logo">
				<img src="/RapidCapsule_Logo.png" alt="Rapid Capsule" />
			</router-link>
			<span class="trial-rx__badge">Free Trial</span>
		</div>

		<div class="trial-rx__container">
			<!-- ============ FORM VIEW ============ -->
			<div v-if="!showResults" class="trial-rx__form-panel">
				<h2>
					<v-icon name="bi-robot" scale="1.1" />
					RxGPT AI Prescription Assistant
				</h2>
				<p class="trial-rx__desc">Get AI-powered medication recommendations verified against 6 clinical databases — PubMed, WHO EML, OpenFDA, NICE, BNF, and RxNav.</p>

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
						:disabled="analyzing"
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
						<span class="optional-tag">Optional</span>
					</label>
					<input
						v-model="form.treatment_goal"
						type="text"
						class="form-input"
						placeholder="e.g., Blood pressure control below 140/90"
						:disabled="analyzing"
					/>
				</div>

				<!-- Patient Context (Collapsible) -->
				<div class="collapsible-section">
					<button class="collapsible-header" @click="showPatientContext = !showPatientContext" type="button">
						<div class="collapsible-title">
							<v-icon name="hi-user" scale="0.85" />
							<span>Patient Context</span>
							<span class="optional-badge-pill">Optional</span>
						</div>
						<v-icon :name="showPatientContext ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.8" />
					</button>
					<div v-if="showPatientContext" class="collapsible-body">
						<div class="form-row">
							<div class="form-group form-group--half">
								<label class="form-label-sm">Age</label>
								<input v-model.number="form.patient_context.age" type="number" class="form-input form-input--sm" placeholder="e.g., 55" min="1" max="120" :disabled="analyzing" />
							</div>
							<div class="form-group form-group--half">
								<label class="form-label-sm">Gender</label>
								<select v-model="form.patient_context.gender" class="form-input form-input--sm" :disabled="analyzing">
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
								<input v-model.number="form.patient_context.weight" type="number" class="form-input form-input--sm" placeholder="e.g., 75" min="1" :disabled="analyzing" />
							</div>
							<div class="form-group form-group--half">
								<div class="checkbox-row">
									<label class="checkbox-label">
										<input type="checkbox" v-model="form.patient_context.renal_impairment" :disabled="analyzing" />
										<span>Renal Impairment</span>
									</label>
									<label class="checkbox-label">
										<input type="checkbox" v-model="form.patient_context.hepatic_impairment" :disabled="analyzing" />
										<span>Hepatic Impairment</span>
									</label>
									<label class="checkbox-label">
										<input type="checkbox" v-model="form.patient_context.pregnant" :disabled="analyzing" />
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
										<button class="tag-remove" @click="form.patient_context.allergies.splice(i, 1)" type="button">&times;</button>
									</span>
								</div>
								<input
									v-model="allergyInput"
									type="text"
									class="form-input form-input--sm"
									placeholder="Type allergy and press Enter"
									:disabled="analyzing"
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
										<button class="tag-remove" @click="form.patient_context.chronic_conditions.splice(i, 1)" type="button">&times;</button>
									</span>
								</div>
								<input
									v-model="conditionInput"
									type="text"
									class="form-input form-input--sm"
									placeholder="Type condition and press Enter"
									:disabled="analyzing"
									@keydown.enter.prevent="addCondition"
								/>
							</div>
						</div>

						<!-- Current Medications -->
						<div class="form-group">
							<label class="form-label-sm">Current Medications</label>
							<div v-for="(med, i) in form.patient_context.current_medications" :key="i" class="med-row">
								<input v-model="med.name" class="form-input form-input--sm" placeholder="Drug name" :disabled="analyzing" />
								<input v-model="med.dosage" class="form-input form-input--xs" placeholder="Dosage" :disabled="analyzing" />
								<input v-model="med.frequency" class="form-input form-input--xs" placeholder="Frequency" :disabled="analyzing" />
								<button class="btn-icon btn-icon--danger" @click="form.patient_context.current_medications.splice(i, 1)" type="button">
									<v-icon name="hi-trash" scale="0.7" />
								</button>
							</div>
							<button class="btn-add" @click="addCurrentMedication" type="button" :disabled="analyzing">
								<v-icon name="hi-plus" scale="0.7" /> Add Medication
							</button>
						</div>
					</div>
				</div>

				<!-- Symptoms (Collapsible) -->
				<div class="collapsible-section">
					<button class="collapsible-header" @click="showSymptomsSection = !showSymptomsSection" type="button">
						<div class="collapsible-title">
							<v-icon name="hi-clipboard-list" scale="0.85" />
							<span>Symptoms</span>
							<span class="optional-badge-pill">Optional</span>
						</div>
						<v-icon :name="showSymptomsSection ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.8" />
					</button>
					<div v-if="showSymptomsSection" class="collapsible-body">
						<div class="tag-input-wrapper">
							<div class="tags-list" v-if="form.symptoms.length">
								<span class="tag" v-for="(sym, i) in form.symptoms" :key="i">
									{{ sym }}
									<button class="tag-remove" @click="form.symptoms.splice(i, 1)" type="button">&times;</button>
								</span>
							</div>
							<div class="autocomplete-wrapper" ref="symptomWrapperRef">
								<input
									v-model="symptomInput"
									type="text"
									class="form-input form-input--sm"
									placeholder="Type symptom and press Enter"
									autocomplete="off"
									:disabled="analyzing"
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
						<select v-model.number="form.max_suggestions" class="form-input form-input--sm" :disabled="analyzing">
							<option :value="3">3 suggestions</option>
							<option :value="5">5 suggestions</option>
							<option :value="7">7 suggestions</option>
						</select>
					</div>
				</div>

				<!-- Error -->
				<div v-if="errorMessage" class="trial-rx__error">
					<v-icon name="hi-exclamation-circle" scale="0.85" />
					{{ errorMessage }}
				</div>

				<!-- Submit -->
				<button
					class="btn-analyze"
					:class="{ 'btn-analyze--disabled': !canSubmit || analyzing }"
					:disabled="!canSubmit || analyzing"
					@click="analyzeRx"
				>
					<template v-if="analyzing">
						<div class="btn-spinner"></div>
						Analyzing...
					</template>
					<template v-else>
						<v-icon name="bi-robot" scale="1" />
						Analyze Safety & Generate Recommendations
					</template>
				</button>
			</div>

			<!-- ============ RESULTS VIEW ============ -->
			<div v-else class="trial-rx__results-panel">
				<!-- Results Header -->
				<div class="results-header">
					<h2 class="results-header__title">Analysis Complete</h2>
					<p class="results-header__meta">
						<span v-if="analysisResults.clinical_context?.diagnosis" class="meta-diagnosis">
							{{ analysisResults.clinical_context.diagnosis }}
						</span>
						<span class="meta-date">{{ formatResultDate(analysisResults.generated_at) }}</span>
					</p>
				</div>

				<!-- Overall Confidence Card -->
				<div class="confidence-card" v-if="analysisResults.confidence_score">
					<div class="confidence-score">
						<span class="confidence-number">{{ Math.round(analysisResults.confidence_score) }}</span>
						<span class="confidence-percent">%</span>
					</div>
					<div class="confidence-info">
						<div class="confidence-label">Overall Confidence Score</div>
						<div class="confidence-bar">
							<div class="confidence-bar__fill" :style="{ width: analysisResults.confidence_score + '%' }" :class="confidenceClass"></div>
						</div>
						<div class="confidence-meta">
							Based on {{ analysisResults.evidence_summary?.evidence_sources_used?.join(', ') || 'AI analysis' }}
						</div>
					</div>
				</div>

				<!-- Evidence Summary Cards -->
				<ResultsEvidence :result="analysisResults" />

				<!-- Medication Suggestions -->
				<div class="section" v-if="analysisResults.suggestions?.length">
					<h3 class="section-title">
						<v-icon name="ri-capsule-line" scale="0.9" />
						Recommended Medications
						<span class="count-badge">{{ analysisResults.suggestions.length }}</span>
					</h3>
					<ResultsMedications :suggestions="analysisResults.suggestions" />
				</div>

				<!-- Safety & Clinical Info -->
				<div class="section">
					<h3 class="section-title">
						<v-icon name="hi-shield-check" scale="0.9" />
						Clinical Summary & Safety
					</h3>
					<ResultsSafety :result="analysisResults" />
				</div>

				<!-- CTA -->
				<div class="trial-rx__signup-cta">
					<h3>Unlock Unlimited RxGPT Access</h3>
					<p>Join as a specialist to verify unlimited prescriptions, get AI medication suggestions, and access full clinical tools.</p>
					<div class="trial-rx__signup-btns">
						<router-link to="/signup/specialist" class="trial-rx__btn">
							Join as Specialist
							<v-icon name="hi-arrow-right" scale="0.85" />
						</router-link>
						<button class="trial-rx__btn trial-rx__btn--ghost" @click="goBack">
							Back to Trial
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import apiFactory from '@/services/apiFactory';
import ResultsEvidence from '@/views/Mainapp/SpecialistApp/RxGPT/components/ResultsEvidence.vue';
import ResultsMedications from '@/views/Mainapp/SpecialistApp/RxGPT/components/ResultsMedications.vue';
import ResultsSafety from '@/views/Mainapp/SpecialistApp/RxGPT/components/ResultsSafety.vue';

const router = useRouter();

// ============ Form State ============

const form = ref({
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
});

const showPatientContext = ref(false);
const showSymptomsSection = ref(false);

const allergyInput = ref('');
const conditionInput = ref('');
const symptomInput = ref('');

const analyzing = ref(false);
const showResults = ref(false);
const analysisResults = ref({});
const errorMessage = ref('');

// ============ Autocomplete State ============

const showDiagnosisSuggestions = ref(false);
const showSymptomSuggestions = ref(false);
const diagnosisHighlightIndex = ref(-1);
const symptomHighlightIndex = ref(-1);
const diagnosisWrapperRef = ref(null);
const symptomWrapperRef = ref(null);

// ============ Diagnoses & Symptoms Lists ============

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
	'Indigestion',
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
	'Agitation', 'Hallucinations', 'Delusions',
	'Mood Swings', 'Restlessness', 'Poor Concentration',
	// Urogenital
	'Blood in Urine', 'Haematuria', 'Painful Urination', 'Dysuria',
	'Urinary Frequency', 'Urinary Urgency', 'Urinary Incontinence',
	'Urinary Retention', 'Vaginal Bleeding', 'Vaginal Discharge',
	// Ophthalmological
	'Red Eye', 'Eye Discharge', 'Watery Eyes', 'Photophobia',
	'Floaters', 'Reduced Visual Acuity',
	// Constitutional
	'Swollen Lymph Nodes', 'Lymphadenopathy', 'Pallor',
	'Easy Bruising', 'Bleeding Gums', 'Nosebleed', 'Epistaxis',
	'Excessive Sweating', 'Cold Extremities', 'Oedema',
];

// ============ Autocomplete Logic ============

function getCurrentDiagnosisTerm() {
	const parts = form.value.diagnosis.split(',');
	return parts[parts.length - 1].trim();
}

function getPreviousDiagnoses() {
	const parts = form.value.diagnosis.split(',');
	if (parts.length <= 1) return [];
	return parts.slice(0, -1).map(p => p.trim().toLowerCase()).filter(Boolean);
}

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

const currentDiagnosisQuery = computed(() => getCurrentDiagnosisTerm());

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
			addSymptomFromInput();
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

// ============ Tag Inputs ============

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

function addSymptomFromInput() {
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

// ============ Form Validation ============

const canSubmit = computed(() => {
	return form.value.diagnosis.trim().length >= 3;
});

// ============ Results Helpers ============

const confidenceClass = computed(() => {
	const score = analysisResults.value?.confidence_score || 0;
	if (score >= 80) return 'confidence--high';
	if (score >= 50) return 'confidence--medium';
	return 'confidence--low';
});

function formatResultDate(dateStr) {
	if (!dateStr) return '';
	const d = new Date(dateStr);
	return d.toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

// ============ Navigation ============

function goBack() {
	const token = sessionStorage.getItem('trial_token');
	if (token) {
		router.push(`/trial/verify/${token}`);
	} else {
		router.push('/');
	}
}

// ============ Submit ============

async function analyzeRx() {
	analyzing.value = true;
	errorMessage.value = '';

	try {
		// Build clean payload
		const payload = {
			diagnosis: form.value.diagnosis.trim(),
			max_suggestions: form.value.max_suggestions,
		};

		if (form.value.treatment_goal.trim()) {
			payload.treatment_goal = form.value.treatment_goal.trim();
		}

		// Only include patient_context if any field is filled
		const ctx = form.value.patient_context;
		const hasContext = ctx.age || ctx.gender || ctx.weight || ctx.allergies.length ||
			ctx.chronic_conditions.length || ctx.current_medications.length ||
			ctx.renal_impairment || ctx.hepatic_impairment || ctx.pregnant;

		if (hasContext) {
			payload.patient_context = {};
			if (ctx.age) payload.patient_context.age = ctx.age;
			if (ctx.gender) payload.patient_context.gender = ctx.gender;
			if (ctx.weight) payload.patient_context.weight = ctx.weight;
			if (ctx.allergies.length) payload.patient_context.allergies = ctx.allergies;
			if (ctx.chronic_conditions.length) payload.patient_context.chronic_conditions = ctx.chronic_conditions;
			const filledMeds = ctx.current_medications.filter(m => m.name);
			if (filledMeds.length) payload.patient_context.current_medications = filledMeds;
			if (ctx.renal_impairment) payload.patient_context.renal_impairment = true;
			if (ctx.hepatic_impairment) payload.patient_context.hepatic_impairment = true;
			if (ctx.pregnant) payload.patient_context.pregnant = true;
		}

		if (form.value.symptoms.length) {
			payload.symptoms = form.value.symptoms;
		}

		const response = await apiFactory.$_trialRxGPTAnalyze(payload);
		analysisResults.value = response.data?.data || {};
		showResults.value = true;
	} catch (error) {
		const msg = error?.response?.data?.message;
		errorMessage.value = msg || 'Analysis failed. Please try again.';
	}

	analyzing.value = false;
}
</script>

<style scoped lang="scss">
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$sky-darker: #01579B;
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$bg: #F8FAFC;
$emerald: #10b981;
$amber: #f59e0b;
$red: #ef4444;
$secondary: #FF5C00;
$secondary-dark: #E05000;

.trial-rx {
	min-height: 100vh;
	background: $bg;
	font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

// ============ Nav ============
.trial-rx__nav {
	background: #fff;
	padding: 16px 32px;
	box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
	display: flex;
	align-items: center;
	gap: 12px;
}

.trial-rx__logo img { height: 32px; width: auto; }

.trial-rx__badge {
	padding: 4px 12px;
	background: #fff3e0;
	color: $secondary-dark;
	font-size: 12px;
	font-weight: 700;
	border-radius: 50px;
	text-transform: uppercase;
	letter-spacing: 0.3px;
}

// ============ Container ============
.trial-rx__container {
	max-width: 860px;
	margin: 0 auto;
	padding: 40px 24px 80px;
}

// ============ Form Panel ============
.trial-rx__form-panel {
	background: #fff;
	border-radius: 20px;
	padding: 40px 36px;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);

	h2 {
		font-size: 26px;
		font-weight: 800;
		color: $navy;
		margin: 0 0 8px;
		display: flex;
		align-items: center;
		gap: 10px;
	}

	@media (max-width: 540px) {
		padding: 28px 20px;
		h2 { font-size: 22px; }
	}
}

.trial-rx__desc {
	font-size: 15px;
	color: $gray;
	line-height: 1.6;
	margin: 0 0 32px;
}

// ============ Form Groups ============
.form-group {
	display: flex;
	flex-direction: column;
	gap: 6px;
	margin-bottom: 16px;
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
	width: 100%;
	box-sizing: border-box;
	font-family: inherit;

	&:focus {
		border-color: $sky-dark;
		box-shadow: 0 0 0 3px rgba(2, 136, 209, 0.1);
	}

	&::placeholder { color: #9ca3af; }
	&:disabled { opacity: 0.6; cursor: not-allowed; }
}

.form-input--sm { padding: 8px 12px; font-size: 13px; border-radius: 8px; }
.form-input--xs { padding: 8px 10px; font-size: 12px; border-radius: 8px; max-width: 120px; }

select.form-input {
	cursor: pointer;
	appearance: auto;
}

// ============ Collapsible Sections ============
.collapsible-section {
	border: 1.5px solid #e5e7eb;
	border-radius: 12px;
	overflow: visible;
	background: rgba(255,255,255,0.5);
	margin-bottom: 16px;
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
	font-family: inherit;

	&:hover { background: rgba(2, 136, 209, 0.04); }
}

.collapsible-title {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 13px;
	font-weight: 600;
}

.optional-badge-pill {
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

// ============ Tags ============
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
	padding: 0;
	&:hover { opacity: 1; }
}

// ============ Medication Rows ============
.med-row {
	display: flex;
	gap: 8px;
	align-items: center;
	margin-bottom: 6px;
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
	font-family: inherit;

	&:hover:not(:disabled) { border-color: $sky-dark; background: rgba(2, 136, 209, 0.04); }
	&:disabled { opacity: 0.5; cursor: not-allowed; }
}

// ============ Checkboxes ============
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

// ============ Options Row ============
.options-row {
	padding-top: 4px;
	border-top: 1px solid #f3f4f6;
	margin-bottom: 16px;
}

// ============ Error ============
.trial-rx__error {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px 16px;
	background: #fef2f2;
	border-radius: 10px;
	color: #dc2626;
	font-size: 14px;
	margin-bottom: 16px;
}

// ============ Submit Button ============
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
	width: 100%;
	font-family: inherit;
	min-height: 50px;

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

// ============ Autocomplete ============
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

	:deep(strong) {
		color: $sky-dark;
		font-weight: 700;
	}
}

// ============ RESULTS PANEL ============
.trial-rx__results-panel {
	max-width: 1100px;
	margin: 0 auto;

	@media (max-width: 540px) {
		padding: 0;
	}
}

.results-header {
	margin-bottom: 24px;
}

.results-header__title {
	font-size: 28px;
	font-weight: 800;
	color: $navy;
	margin: 0 0 4px;

	@media (max-width: 768px) { font-size: 22px; }
}

.results-header__meta {
	display: flex;
	align-items: center;
	gap: 12px;
	margin-top: 4px;
	font-size: 13px;
	color: $gray;
}

.meta-diagnosis {
	background: rgba($sky-dark, 0.08);
	color: $sky-dark;
	padding: 3px 12px;
	border-radius: 20px;
	font-weight: 600;
	font-size: 12px;
}

.meta-date {
	color: $gray;
}

// Confidence Card
.confidence-card {
	display: flex;
	align-items: center;
	gap: 24px;
	background: rgba(255,255,255,0.75);
	backdrop-filter: blur(20px);
	border: 1px solid rgba(255,255,255,0.6);
	border-radius: 20px;
	padding: 24px 32px;
	margin-bottom: 24px;
	box-shadow: 0 4px 24px rgba(0,0,0,0.04);

	@media (max-width: 768px) { padding: 20px; gap: 16px; }
}

.confidence-score {
	display: flex;
	align-items: baseline;
	flex-shrink: 0;
}

.confidence-number {
	font-size: 56px;
	font-weight: 800;
	background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;

	@media (max-width: 768px) { font-size: 42px; }
}

.confidence-percent {
	font-size: 24px;
	font-weight: 700;
	color: $gray;
}

.confidence-info {
	flex: 1;
}

.confidence-label {
	font-size: 14px;
	font-weight: 700;
	color: $slate;
	margin-bottom: 8px;
}

.confidence-bar {
	height: 8px;
	background: #e5e7eb;
	border-radius: 10px;
	overflow: hidden;
	margin-bottom: 8px;
}

.confidence-bar__fill {
	height: 100%;
	border-radius: 10px;
	transition: width 0.8s ease;
}

.confidence--high { background: linear-gradient(90deg, $emerald, #059669); }
.confidence--medium { background: linear-gradient(90deg, $amber, #d97706); }
.confidence--low { background: linear-gradient(90deg, $red, #dc2626); }

.confidence-meta {
	font-size: 12px;
	color: $gray;
}

// Section titles
.section {
	margin-top: 32px;
}

.section-title {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 18px;
	font-weight: 700;
	color: $navy;
	margin-bottom: 16px;
}

.count-badge {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 24px;
	height: 24px;
	padding: 0 8px;
	background: rgba($sky, 0.1);
	color: $sky-dark;
	border-radius: 20px;
	font-size: 12px;
	font-weight: 700;
}

// ============ CTA ============
.trial-rx__signup-cta {
	text-align: center;
	padding: 32px 0 0;
	margin-top: 40px;
	border-top: 1px solid #f1f5f9;

	h3 {
		font-size: 22px;
		font-weight: 800;
		color: $navy;
		margin: 0 0 8px;
	}

	p {
		font-size: 15px;
		color: $gray;
		margin: 0 0 20px;
		line-height: 1.6;
	}
}

.trial-rx__signup-btns {
	display: flex;
	gap: 12px;
	justify-content: center;
	flex-wrap: wrap;
}

.trial-rx__btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	padding: 14px 32px;
	background: $secondary;
	color: #fff;
	border: none;
	border-radius: 12px;
	font-size: 16px;
	font-weight: 700;
	cursor: pointer;
	transition: all 0.25s ease;
	text-decoration: none;
	min-height: 50px;
	box-shadow: 0 4px 16px rgba($secondary, 0.3);
	font-family: inherit;

	&:hover:not(:disabled) {
		background: $secondary-dark;
		transform: translateY(-1px);
	}

	&--ghost {
		background: transparent;
		color: $gray;
		border: 2px solid #e2e8f0;
		box-shadow: none;

		&:hover:not(:disabled) {
			background: $bg;
			border-color: $secondary;
			color: $secondary;
			transform: none;
		}
	}
}

@keyframes spin {
	to { transform: rotate(360deg); }
}
</style>
