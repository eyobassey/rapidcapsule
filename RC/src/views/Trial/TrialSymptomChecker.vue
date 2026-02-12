<template>
	<div class="trial-checkup">
		<!-- Nav Bar -->
		<header class="trial-nav">
			<router-link to="/" class="trial-nav__logo">
				<img src="/RapidCapsule_Logo.png" alt="Rapid Capsule" />
			</router-link>
			<span class="trial-nav__badge">Free Trial</span>
			<div class="trial-nav__spacer"></div>
			<button class="trial-nav__back" @click="goToLanding">
				<v-icon name="hi-arrow-left" scale="0.85" />
				<span>Back</span>
			</button>
		</header>

		<!-- Loading State -->
		<div v-if="initializing" class="trial-loading">
			<div class="trial-loading__spinner"></div>
			<p>Setting up your health assessment...</p>
		</div>

		<!-- Page Content -->
		<div v-else class="page-content">

			<!-- ============ STEP 1: GENDER ============ -->
			<template v-if="step === 'gender'">
				<section class="hero">
					<div class="hero__content">
						<div class="hero__badge"><span class="badge-step">Step 1 of 6</span></div>
						<h1 class="hero__title">Select<br/><span class="hero__title-accent">Gender</span></h1>
						<p class="hero__subtitle">Choose the biological sex for this health assessment to ensure accurate results.</p>
					</div>
					<div class="hero__visual">
						<div class="orb"><div class="orb__inner"><v-icon name="hi-users" scale="3" /></div><div class="orb__ring"></div></div>
					</div>
				</section>

				<section class="bento-grid bento-grid--2col">
					<div class="bento-card bento-card--main">
						<div class="card-hdr"><v-icon name="hi-user-circle" scale="1.1" /><span>Choose Gender</span></div>
						<div class="gender-options">
							<button class="gender-btn gender-btn--male" @click="selectGender('male')">
								<div class="gender-btn__icon"><v-icon name="io-male-sharp" scale="1.5" /></div>
								<div class="gender-btn__txt"><span class="gender-btn__title">Male</span><span class="gender-btn__desc">Biological male</span></div>
								<v-icon name="hi-arrow-right" class="gender-btn__arrow" />
							</button>
							<button class="gender-btn gender-btn--female" @click="selectGender('female')">
								<div class="gender-btn__icon"><v-icon name="io-female-sharp" scale="1.5" /></div>
								<div class="gender-btn__txt"><span class="gender-btn__title">Female</span><span class="gender-btn__desc">Biological female</span></div>
								<v-icon name="hi-arrow-right" class="gender-btn__arrow" />
							</button>
						</div>
					</div>
					<div class="bento-card bento-card--info-yellow">
						<div class="info-icon"><v-icon name="hi-light-bulb" scale="1.2" /></div>
						<h4>Why does this matter?</h4>
						<p>Biological sex affects disease risk, symptom presentation, and medication responses. This helps our AI provide more accurate health insights.</p>
					</div>
				</section>
			</template>

			<!-- ============ STEP 2: AGE ============ -->
			<template v-if="step === 'age'">
				<section class="hero">
					<div class="hero__content">
						<button class="hero__back" @click="step = 'gender'"><v-icon name="hi-arrow-left" /><span>Back</span></button>
						<div class="hero__badge"><span class="badge-step">Step 2 of 6</span></div>
						<h1 class="hero__title">How old<br/><span class="hero__title-accent">are you?</span></h1>
						<p class="hero__subtitle">Move the slider or use the buttons to select age between 12-100 years</p>
					</div>
					<div class="hero__visual">
						<div class="orb"><div class="orb__inner"><v-icon name="hi-calendar" scale="3" /></div><div class="orb__ring"></div></div>
					</div>
				</section>

				<section class="bento-grid bento-grid--2col">
					<div class="bento-card bento-card--main">
						<div class="card-hdr"><v-icon name="hi-adjustments" scale="1.1" /><span>Age Selection</span></div>
						<div class="age-display">
							<button class="age-btn" @click="patientAge > 12 && patientAge--" :disabled="patientAge <= 12"><v-icon name="hi-minus" scale="1.1" /></button>
							<div class="age-display__value"><span class="age-number">{{ patientAge }}</span><span class="age-label">years old</span></div>
							<button class="age-btn" @click="patientAge < 100 && patientAge++" :disabled="patientAge >= 100"><v-icon name="hi-plus" scale="1.1" /></button>
						</div>
						<div class="age-slider">
							<div class="age-slider__labels"><span>12</span><span>100</span></div>
							<input type="range" v-model.number="patientAge" :min="12" :max="100" class="slider-input" />
						</div>
						<div class="quick-select">
							<span class="quick-select__label">Quick select:</span>
							<div class="quick-select__buttons">
								<button v-for="a in [18,25,35,45,55,65]" :key="a" class="quick-btn" :class="{ 'quick-btn--active': patientAge === a }" @click="patientAge = a">{{ a }}</button>
							</div>
						</div>
						<button class="continue-btn" @click="step = 'risk-factors'; loadRiskFactors()">
							<span>Continue</span><v-icon name="hi-arrow-right" scale="1" />
						</button>
					</div>
					<div class="bento-card">
						<div class="card-hdr"><v-icon name="hi-information-circle" scale="1.1" /><span>Why Age Matters</span></div>
						<p class="info-text">Age is crucial for accurate health assessments as many conditions have age-specific prevalence rates. Our AI adjusts its analysis based on your age.</p>
						<div class="info-highlight"><v-icon name="hi-shield-check" scale="1" /><span>Assessments available for ages 12+</span></div>
					</div>
				</section>
			</template>

			<!-- ============ STEP 3: RISK FACTORS ============ -->
			<template v-if="step === 'risk-factors'">
				<section class="hero">
					<div class="hero__content">
						<button class="hero__back" @click="step = 'age'"><v-icon name="hi-arrow-left" /><span>Back</span></button>
						<div class="hero__badge"><span class="badge-step">Step 3 of 6</span></div>
						<h1 class="hero__title">Health Risk<br/><span class="hero__title-accent">Factors</span></h1>
						<p class="hero__subtitle">Select any statements that apply to you</p>
					</div>
					<div class="hero__visual">
						<div class="orb"><div class="orb__inner"><v-icon name="hi-shield-check" scale="3" /></div><div class="orb__ring"></div></div>
					</div>
				</section>

				<section class="bento-grid bento-grid--2col">
					<div class="bento-card bento-card--main">
						<div class="card-hdr">
							<v-icon name="hi-clipboard-list" scale="1.1" /><span>Risk Assessment</span>
							<span class="factor-count">{{ riskAnswers.filter(r => r.choice_id).length }}/{{ riskFactorList.length }}</span>
						</div>
						<div v-if="riskLoading" class="step-loading"><div class="trial-loading__spinner"></div></div>
						<div v-else class="risk-list">
							<div v-for="(factor, i) in riskFactorList" :key="factor.id" class="risk-item">
								<div class="risk-item__question">
									<div class="risk-item__icon"><v-icon name="hi-exclamation-circle" scale="0.9" /></div>
									<span class="risk-item__text">{{ factor.common_name }}</span>
								</div>
								<div class="risk-item__options">
									<button class="risk-btn" :class="{ 'risk-btn--yes-active': riskAnswers[i]?.choice_id === 'present' }" @click="setRiskAnswer(i, factor, 'present')">
										<v-icon name="hi-check" scale="0.8" /><span>Yes</span>
									</button>
									<button class="risk-btn" :class="{ 'risk-btn--no-active': riskAnswers[i]?.choice_id === 'absent' }" @click="setRiskAnswer(i, factor, 'absent')">
										<v-icon name="hi-x" scale="0.8" /><span>No</span>
									</button>
									<button class="risk-btn" :class="{ 'risk-btn--unsure-active': riskAnswers[i]?.choice_id === 'unknown' }" @click="setRiskAnswer(i, factor, 'unknown')">
										<v-icon name="hi-question-mark-circle" scale="0.8" /><span>Not sure</span>
									</button>
								</div>
							</div>
						</div>
						<div class="action-bar">
							<span>{{ allRiskAnswered ? 'All factors answered' : 'Answer all factors to continue' }}</span>
							<button class="continue-btn" :disabled="!allRiskAnswered" @click="step = 'observations'">
								<span>Continue</span><v-icon name="hi-arrow-right" scale="1" />
							</button>
						</div>
					</div>
					<div class="bento-card">
						<div class="card-hdr"><v-icon name="hi-information-circle" scale="1.1" /><span>Why This Matters</span></div>
						<p class="info-text">Risk factors help our AI provide more accurate health assessments by understanding your medical background and lifestyle.</p>
						<div class="info-highlight"><v-icon name="hi-lock-closed" scale="1" /><span>Your data is encrypted and secure</span></div>
					</div>
				</section>
			</template>

			<!-- ============ STEP 4: OBSERVATIONS (SYMPTOMS) ============ -->
			<template v-if="step === 'observations'">
				<section class="hero">
					<div class="hero__content">
						<button class="hero__back" @click="step = 'risk-factors'"><v-icon name="hi-arrow-left" /><span>Back</span></button>
						<div class="hero__badge">
							<span class="badge-step">Step 4 of 6</span>
							<span v-if="selectedSymptoms.length >= 2" class="badge-success"><v-icon name="hi-check-circle" scale="0.8" />{{ selectedSymptoms.length }} symptoms</span>
						</div>
						<h1 class="hero__title">What are your<br/><span class="hero__title-accent">Symptoms?</span></h1>
						<p class="hero__subtitle">Search for symptoms or tap body parts to add them</p>
					</div>
					<div class="hero__visual">
						<div class="orb"><div class="orb__inner"><v-icon name="hi-search" scale="3" /></div><div class="orb__ring"></div></div>
					</div>
				</section>

				<div v-if="selectedSymptoms.length < 2" class="notice-banner" :class="{ 'notice-banner--warning': selectedSymptoms.length === 1 }">
					<v-icon :name="selectedSymptoms.length === 1 ? 'hi-exclamation-circle' : 'hi-information-circle'" scale="1.1" />
					<span>Please add a minimum of <strong>2 symptoms</strong> for a more accurate diagnosis.<span v-if="selectedSymptoms.length === 1"> (1 more needed)</span></span>
				</div>

				<section class="bento-grid bento-grid--2col">
					<!-- Search Card -->
					<div class="bento-card bento-card--search">
						<div class="card-hdr"><v-icon name="hi-search" scale="1.1" /><span>Search Symptoms</span></div>
						<div class="search-box">
							<v-icon name="hi-search" class="search-box__icon" />
							<input type="text" class="search-box__input" placeholder="Type to search symptoms..." @input="onSymptomSearch($event.target.value)" />
						</div>
						<div v-if="showSearchResults" class="search-results" ref="searchResultsRef">
							<div v-for="item in searchResults" :key="item.id" class="search-results__item" @click="addSymptom(item)">
								<v-icon name="hi-plus-circle" scale="0.9" /><span>{{ item.label }}</span>
							</div>
							<div v-if="searchResults.length === 0 && !searchLoading" class="search-results__empty">
								<v-icon name="hi-emoji-sad" scale="1.5" /><span>No symptoms found</span>
							</div>
						</div>
						<div v-if="selectedSymptoms.length" class="selected-symptoms">
							<h4 class="selected-symptoms__title"><v-icon name="hi-clipboard-list" scale="0.9" /><span>Selected ({{ selectedSymptoms.length }})</span></h4>
							<div class="selected-symptoms__list">
								<div v-for="(item, index) in selectedSymptoms" :key="item.id" class="symptom-chip">
									<span>{{ item.label }}</span>
									<button class="symptom-chip__remove" @click="selectedSymptoms.splice(index, 1)"><v-icon name="hi-x" scale="0.7" /></button>
								</div>
							</div>
						</div>
					</div>

					<!-- Body Avatar Card -->
					<div class="bento-card bento-card--body">
						<div class="card-hdr"><v-icon name="hi-user" scale="1.1" /><span>Select Body Part</span></div>
						<div class="body-container">
							<div class="body-scale-wrapper">
								<full-body-avatar-male v-if="patientGender === 'male'" :age="String(patientAge)" @selected-symptom="addSymptom($event)" />
								<full-body-avatar-female v-if="patientGender === 'female'" :age="String(patientAge)" @selected-symptom="addSymptom($event)" />
							</div>
						</div>
					</div>

					<!-- Continue Card -->
					<div class="bento-card bento-card--action-full">
						<div class="action-bar">
							<span>{{ selectedSymptoms.length >= 2 ? `${selectedSymptoms.length} symptoms selected` : 'Add at least 2 symptoms' }}</span>
							<button class="continue-btn" :disabled="selectedSymptoms.length < 1" @click="startInterview">
								<span>Continue</span><v-icon name="hi-arrow-right" scale="1" />
							</button>
						</div>
					</div>
				</section>
			</template>

			<!-- ============ STEP 5: AI INTERVIEW ============ -->
			<template v-if="step === 'interview'">
				<section class="hero">
					<div class="hero__content">
						<button class="hero__back" @click="step = 'observations'"><v-icon name="hi-arrow-left" /><span>Back</span></button>
						<div class="hero__badge">
							<span class="badge-step">Step 5 of 6</span>
							<span class="badge-ai"><v-icon name="hi-sparkles" scale="0.8" />AI Interview</span>
						</div>
						<h1 class="hero__title">Health<br/><span class="hero__title-accent">Interview</span></h1>
						<p class="hero__subtitle">Answer the following questions to help us understand your symptoms better</p>
					</div>
					<div class="hero__visual">
						<div class="orb"><div class="orb__inner"><v-icon name="hi-chat-alt-2" scale="3" /></div><div class="orb__ring"></div></div>
					</div>
				</section>

				<section class="bento-grid bento-grid--1col">
					<!-- Progress Card -->
					<div class="bento-card bento-card--progress">
						<div class="progress-indicator">
							<div class="progress-indicator__spinner"></div>
							<div><p class="progress-indicator__title">Health Interview in Progress</p><p class="progress-indicator__text">Question {{ questionCount }} &mdash; Our AI is analyzing your responses</p></div>
						</div>
					</div>

					<!-- Loading -->
					<div v-if="interviewLoading" class="bento-card" style="text-align:center;padding:48px">
						<div class="trial-loading__spinner" style="margin:0 auto"></div>
						<p style="margin-top:16px;color:#64748B">Analyzing your responses...</p>
					</div>

					<!-- Question Card -->
					<div v-else-if="currentQuestion" class="bento-card">
						<div class="card-hdr"><v-icon name="hi-chat" scale="1.1" /><span>Question</span></div>
						<h3 class="question-text">{{ currentQuestion.text }}</h3>

						<!-- Single type -->
						<div v-if="currentQuestion.type === 'single'" class="answer-buttons">
							<button class="answer-btn" :class="{ 'answer-btn--yes-active': singleChoice === 'present' }" @click="singleChoice = 'present'">
								<v-icon name="hi-check" scale="1" /><span>Yes</span>
							</button>
							<button class="answer-btn" :class="{ 'answer-btn--no-active': singleChoice === 'absent' }" @click="singleChoice = 'absent'">
								<v-icon name="hi-x" scale="1" /><span>No</span>
							</button>
							<button class="answer-btn" :class="{ 'answer-btn--unknown-active': singleChoice === 'unknown' }" @click="singleChoice = 'unknown'">
								<v-icon name="hi-question-mark-circle" scale="1" /><span>Not sure</span>
							</button>
						</div>

						<!-- Group single -->
						<div v-else-if="currentQuestion.type === 'group_single'" class="answer-options">
							<div v-for="option in currentQuestion.items" :key="option.id"
								class="answer-option" :class="{ 'answer-option--selected': groupSingleChoice?.id === option.id }"
								@click="groupSingleChoice = option">
								<div class="answer-option__radio"><div class="answer-option__dot" v-if="groupSingleChoice?.id === option.id"></div></div>
								<span class="answer-option__text">{{ option.name }}</span>
							</div>
						</div>

						<!-- Group multiple -->
						<div v-if="currentQuestion.type === 'group_multiple'" class="answer-multiple">
							<div v-for="(item, i) in multipleChoices" :key="item.id" class="answer-multiple__item">
								<p class="answer-multiple__question">{{ item.name }}</p>
								<div class="answer-multiple__options">
									<button class="answer-btn answer-btn--small" :class="{ 'answer-btn--yes-active': item.choice_id === 'present' }" @click="setMultipleChoice(i, 'present')">
										<v-icon name="hi-check" scale="0.9" /><span>Yes</span>
									</button>
									<button class="answer-btn answer-btn--small" :class="{ 'answer-btn--no-active': item.choice_id === 'absent' }" @click="setMultipleChoice(i, 'absent')">
										<v-icon name="hi-x" scale="0.9" /><span>No</span>
									</button>
									<button class="answer-btn answer-btn--small" :class="{ 'answer-btn--unknown-active': item.choice_id === 'unknown' }" @click="setMultipleChoice(i, 'unknown')">
										<v-icon name="hi-question-mark-circle" scale="0.9" /><span>Not sure</span>
									</button>
								</div>
							</div>
						</div>

						<!-- Duration type -->
						<div v-else-if="currentQuestion.type === 'duration'" class="answer-options">
							<div v-for="opt in durationOptions" :key="opt.key"
								class="answer-option" :class="{ 'answer-option--selected': selectedDuration === opt.key }"
								@click="selectedDuration = opt.key">
								<div class="answer-option__radio"><div class="answer-option__dot" v-if="selectedDuration === opt.key"></div></div>
								<span class="answer-option__text">{{ opt.label }}</span>
							</div>
						</div>

						<!-- Next button -->
						<div class="action-bar" style="margin-top:24px">
							<span>{{ canSubmitAnswer ? 'Ready to continue' : 'Please answer the question' }}</span>
							<button class="continue-btn" :disabled="!canSubmitAnswer" @click="submitInterviewAnswer">
								<span>Next</span><v-icon name="hi-arrow-right" scale="1" />
							</button>
						</div>
					</div>
				</section>
			</template>

			<!-- ============ STEP 6: RESULTS ============ -->
			<template v-if="step === 'results'">
				<section class="hero hero--success">
					<div class="hero__content">
						<div class="hero__badge">
							<span class="badge-ai"><v-icon name="hi-sparkles" scale="0.9" />AI Assessment Complete</span>
						</div>
						<h1 class="hero__title">Your Health<br/><span class="hero__title-accent">Report</span></h1>
						<p class="hero__subtitle">Based on your symptoms and responses, here are the AI-powered insights and recommendations</p>
					</div>
					<div class="hero__visual">
						<div class="orb"><div class="orb__inner"><v-icon name="hi-document-report" scale="3" /></div><div class="orb__ring"></div></div>
					</div>
				</section>

				<section class="bento-grid bento-grid--1col">
					<!-- Triage Card -->
					<div v-if="diagnosisResults.triage_level" class="bento-card bento-card--triage" :class="'triage--' + diagnosisResults.triage_level">
						<div class="triage-content">
							<div class="triage-icon"><v-icon :name="triageIcon" scale="1.5" /></div>
							<div class="triage-info">
								<h3 class="triage-title">{{ triageTitle }}</h3>
								<p class="triage-desc">{{ triageDescription }}</p>
							</div>
						</div>
					</div>

					<!-- Conditions Card -->
					<div v-if="diagnosisResults.conditions?.length" class="bento-card">
						<div class="card-hdr"><v-icon name="hi-clipboard-list" scale="1.1" /><span>Possible Conditions</span></div>
						<div class="conditions-list">
							<div v-for="condition in diagnosisResults.conditions.slice(0, 8)" :key="condition.id" class="condition-item">
								<div class="condition-item__header">
									<span class="condition-item__name">{{ condition.common_name || condition.name }}</span>
									<span class="condition-item__prob">{{ Math.round(condition.probability * 100) }}%</span>
								</div>
								<div class="condition-item__bar">
									<div class="condition-item__fill" :style="{ width: (condition.probability * 100) + '%' }"></div>
								</div>
							</div>
						</div>
					</div>

					<!-- AI Summary -->
					<div v-if="aiSummaryLoading" class="bento-card bento-card--ai-loading">
						<div class="ai-loading-content">
							<div class="ai-loading-spinner"></div>
							<div>
								<h4>Generating AI Health Insights</h4>
								<p>Our AI is analyzing your results to provide personalized health insights...</p>
							</div>
						</div>
					</div>

					<template v-if="aiSummary">
						<!-- Overview -->
						<div class="bento-card bento-card--ai-overview">
							<div class="card-hdr"><v-icon name="hi-sparkles" scale="1.1" /><span>AI Health Summary</span><span class="ai-badge">Powered by Claude AI</span></div>
							<p class="ai-overview-text">{{ aiSummary.overview }}</p>
						</div>

						<!-- Key Findings -->
						<div v-if="aiSummary.key_findings?.length" class="bento-card">
							<div class="card-hdr"><v-icon name="hi-light-bulb" scale="1.1" /><span>Key Findings</span></div>
							<ul class="ai-list">
								<li v-for="(finding, i) in aiSummary.key_findings" :key="i">
									<v-icon name="hi-check-circle" scale="0.85" class="ai-list__icon ai-list__icon--sky" />
									<span>{{ finding }}</span>
								</li>
							</ul>
						</div>

						<!-- Conditions Explained -->
						<div v-if="aiSummary.possible_conditions_explained?.length" class="bento-card">
							<div class="card-hdr"><v-icon name="hi-clipboard-list" scale="1.1" /><span>Conditions Explained</span></div>
							<div class="ai-conditions">
								<div v-for="(cond, i) in aiSummary.possible_conditions_explained" :key="i" class="ai-condition-item">
									<div class="ai-condition-item__header">
										<span class="ai-condition-item__name">{{ cond.condition }}</span>
										<span class="ai-condition-item__urgency" :class="'urgency--' + cond.urgency">{{ cond.urgency }}</span>
									</div>
									<p class="ai-condition-item__desc">{{ cond.explanation }}</p>
								</div>
							</div>
						</div>

						<!-- Recommendations -->
						<div v-if="aiSummary.recommendations?.length" class="bento-card">
							<div class="card-hdr"><v-icon name="hi-clipboard-check" scale="1.1" /><span>Recommendations</span></div>
							<ul class="ai-list">
								<li v-for="(rec, i) in aiSummary.recommendations" :key="i">
									<v-icon name="hi-arrow-circle-right" scale="0.85" class="ai-list__icon ai-list__icon--emerald" />
									<span>{{ rec }}</span>
								</li>
							</ul>
						</div>

						<!-- When to Seek Care -->
						<div v-if="aiSummary.when_to_seek_care" class="bento-card bento-card--seek-care">
							<div class="card-hdr"><v-icon name="hi-exclamation-circle" scale="1.1" /><span>When to Seek Care</span></div>
							<p class="ai-seek-care-text">{{ aiSummary.when_to_seek_care }}</p>
						</div>

						<!-- Lifestyle Tips -->
						<div v-if="aiSummary.lifestyle_tips?.length" class="bento-card">
							<div class="card-hdr"><v-icon name="hi-heart" scale="1.1" /><span>Lifestyle Tips</span></div>
							<ul class="ai-list">
								<li v-for="(tip, i) in aiSummary.lifestyle_tips" :key="i">
									<v-icon name="hi-star" scale="0.85" class="ai-list__icon ai-list__icon--amber" />
									<span>{{ tip }}</span>
								</li>
							</ul>
						</div>
					</template>

					<div v-if="aiSummaryError" class="bento-card bento-card--ai-error">
						<v-icon name="hi-exclamation-circle" scale="1.1" />
						<p>{{ aiSummaryError }}</p>
						<button class="ghost-btn" @click="fetchAISummary">Retry</button>
					</div>

					<!-- Disclaimer -->
					<div class="bento-card bento-card--disclaimer">
						<v-icon name="hi-information-circle" scale="1.1" />
						<p>This is an AI-powered assessment for informational purposes only. It does not replace professional medical advice. Please consult a healthcare provider for proper diagnosis and treatment.</p>
					</div>

					<!-- Sign Up CTA -->
					<div class="bento-card bento-card--cta">
						<h3>Want to save your results?</h3>
						<p>Sign up to save your health history, book consultations with specialists, and access unlimited assessments.</p>
						<div class="cta-buttons">
							<router-link to="/signup/patient" class="continue-btn">
								Sign Up Free<v-icon name="hi-arrow-right" scale="0.85" />
							</router-link>
							<button class="ghost-btn" @click="goToLanding">Try RxGPT Instead</button>
						</div>
					</div>
				</section>
			</template>

			<!-- Global Error -->
			<div v-if="globalError" class="global-error">
				<v-icon name="hi-exclamation-circle" scale="0.85" />
				{{ globalError }}
				<button @click="globalError = ''" class="global-error__close"><v-icon name="hi-x" scale="0.7" /></button>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import apiFactory from '@/services/apiFactory';
import FullBodyAvatarMale from "@/components/Health-checkup/full-body-avatar-male";
import FullBodyAvatarFemale from "@/components/Health-checkup/full-body-avatar-female";

const router = useRouter();

// ============ STATE ============
const step = ref('gender'); // gender | age | risk-factors | observations | interview | results
const initializing = ref(true);
const globalError = ref('');
const interviewToken = ref('');

// Patient Info
const patientGender = ref('');
const patientAge = ref(25);

// Risk Factors
const riskLoading = ref(false);
const riskFactorList = ref([]);
const riskAnswers = ref([]);
const allRiskAnswered = computed(() => riskAnswers.value.length >= riskFactorList.value.length && riskAnswers.value.every(r => r.choice_id));

// Observations
const selectedSymptoms = ref([]);
const searchResults = ref([]);
const showSearchResults = ref(false);
const searchLoading = ref(false);
const searchResultsRef = ref(null);

// Interview
const evidence = ref([]);
const currentQuestion = ref(null);
const singleChoice = ref('');
const groupSingleChoice = ref(null);
const multipleChoices = ref([]);
const questionCount = ref(0);
const interviewLoading = ref(false);

// Results
const diagnosisResults = ref({});
const aiSummary = ref(null);
const aiSummaryLoading = ref(false);
const aiSummaryError = ref('');

// Duration
const selectedDuration = ref('');
const durationOptions = [
	{ key: 'hours', label: 'Less than a day', value: 1, unit: 'hour' },
	{ key: 'days_1_3', label: '1–3 days', value: 2, unit: 'day' },
	{ key: 'days_4_7', label: '4–7 days', value: 5, unit: 'day' },
	{ key: 'weeks_1_2', label: '1–2 weeks', value: 10, unit: 'day' },
	{ key: 'weeks_2_4', label: '2–4 weeks', value: 21, unit: 'day' },
	{ key: 'months', label: 'Over a month', value: 60, unit: 'day' },
];

// ============ COMPUTED ============
const canSubmitAnswer = computed(() => {
	if (!currentQuestion.value) return false;
	if (currentQuestion.value.type === 'single') return !!singleChoice.value;
	if (currentQuestion.value.type === 'group_single') return !!groupSingleChoice.value;
	if (currentQuestion.value.type === 'group_multiple') return multipleChoices.value.some(c => c.choice_id);
	if (currentQuestion.value.type === 'duration') return !!selectedDuration.value;
	return false;
});

const triageIcon = computed(() => {
	const map = { emergency: 'hi-exclamation', emergency_ambulance: 'hi-exclamation', consultation_24: 'hi-clock', consultation: 'hi-calendar', self_care: 'hi-heart' };
	return map[diagnosisResults.value.triage_level] || 'hi-clipboard-check';
});

const triageTitle = computed(() => {
	const map = { emergency: 'Emergency Care Needed', emergency_ambulance: 'Call an Ambulance', consultation_24: 'See a Doctor Within 24 Hours', consultation: 'Schedule a Consultation', self_care: 'Self-Care Recommended' };
	return map[diagnosisResults.value.triage_level] || 'Assessment Complete';
});

const triageDescription = computed(() => {
	const map = {
		emergency: 'Based on your symptoms, you should seek immediate medical attention.',
		emergency_ambulance: 'Your symptoms indicate a potentially life-threatening condition. Call emergency services.',
		consultation_24: 'Your symptoms suggest you should see a healthcare provider within 24 hours.',
		consultation: 'We recommend scheduling a consultation with a healthcare provider at your earliest convenience.',
		self_care: 'Your symptoms suggest a condition that can likely be managed with self-care. Monitor your symptoms.',
	};
	return map[diagnosisResults.value.triage_level] || '';
});

// ============ AXIOS INTERCEPTOR FOR BODY AVATAR ============
// The body avatar component calls /api/health-checkup/search directly (JWT-protected).
// In trial context there's no JWT, so we intercept and redirect to the trial endpoint.
let axiosInterceptorId = null;

onMounted(async () => {
	axiosInterceptorId = axios.interceptors.request.use((config) => {
		if (config.url && config.url.includes('health-checkup/search')) {
			config.url = config.url.replace('health-checkup/search', 'trial/symptom-checker/search');
			const trialToken = sessionStorage.getItem('trial_token');
			if (trialToken) {
				config.headers['x-trial-token'] = trialToken;
			}
		}
		return config;
	});

	// ============ INIT ============
	try {
		const response = await apiFactory.$_trialBeginCheckup({});
		const data = response.data?.data || response.data;
		if (data?.interview_token) {
			interviewToken.value = data.interview_token;
		}
	} catch (error) {
		globalError.value = error?.response?.data?.message || 'Failed to initialize health assessment.';
	}
	initializing.value = false;
});

onUnmounted(() => {
	if (axiosInterceptorId !== null) {
		axios.interceptors.request.eject(axiosInterceptorId);
	}
});

// ============ NAVIGATION ============
function goToLanding() {
	const token = sessionStorage.getItem('trial_token');
	if (token) router.push(`/trial/verify/${token}`);
	else router.push('/');
}

// ============ GENDER ============
function selectGender(gender) {
	patientGender.value = gender;
	step.value = 'age';
}

// ============ RISK FACTORS ============
// Priority risk factors that should always be shown first (same as patient portal)
const priorityRiskFactors = [
	'p_7',   // Diagnosed hypertension
	'p_28',  // Smoking cigarettes
	'p_10',  // Recent physical injury
	'p_9',   // Obesity/BMI
	'p_8',   // Diabetes
	'p_147', // Pregnancy (filtered by gender/age by API)
	'p_21',  // High cholesterol
	'p_80',  // Immunodeficiency
];

async function loadRiskFactors() {
	riskLoading.value = true;
	try {
		const response = await apiFactory.$_trialGetRiskFactors({
			age: patientAge.value,
			interview_token: interviewToken.value,
		});
		const data = response.data?.data || response.data;
		if (Array.isArray(data)) {
			// Separate priority and additional risk factors (same logic as patient portal)
			const priority = [];
			const additional = [];

			data.forEach(risk => {
				if (priorityRiskFactors.includes(risk.id)) {
					priority.push(risk);
				} else {
					additional.push(risk);
				}
			});

			// Show priority factors first, then fill up to 8 with additional ones
			riskFactorList.value = [
				...priority,
				...additional.slice(0, Math.max(0, 8 - priority.length)),
			];
			riskAnswers.value = new Array(riskFactorList.value.length).fill(null).map(() => ({}));
		}
	} catch (error) {
		globalError.value = error?.response?.data?.message || 'Failed to load risk factors.';
	}
	riskLoading.value = false;
}

function setRiskAnswer(index, factor, choice_id) {
	riskAnswers.value[index] = { ...factor, choice_id };
	// Force reactivity
	riskAnswers.value = [...riskAnswers.value];
}

// ============ OBSERVATIONS / SYMPTOMS ============
let searchTimeout = null;
async function onSymptomSearch(phrase) {
	clearTimeout(searchTimeout);
	if (!phrase || phrase.length < 2) {
		showSearchResults.value = false;
		return;
	}
	searchTimeout = setTimeout(async () => {
		showSearchResults.value = true;
		searchLoading.value = true;
		try {
			const response = await apiFactory.$_trialSearch({
				phrase,
				sex: patientGender.value,
				age: patientAge.value,
				interview_token: interviewToken.value,
			});
			const data = response.data?.data || response.data;
			searchResults.value = Array.isArray(data) ? data : [];
		} catch (error) {
			searchResults.value = [];
		}
		searchLoading.value = false;
	}, 300);
}

function addSymptom(symptom) {
	const exists = selectedSymptoms.value.find(s => s.id === symptom.id);
	if (!exists) {
		selectedSymptoms.value.push(symptom);
	}
	showSearchResults.value = false;
}

// ============ INTERVIEW ============
async function startInterview() {
	step.value = 'interview';

	// Build initial evidence from selected symptoms + risk factors
	evidence.value = selectedSymptoms.value.map(s => ({
		id: s.id,
		choice_id: s.choice_id || 'present',
		source: 'initial',
	}));

	// Add risk factor evidence
	riskAnswers.value.forEach(r => {
		if (r && r.id && r.choice_id) {
			evidence.value.push({ id: r.id, choice_id: r.choice_id });
		}
	});

	await runDiagnosis();
}

async function runDiagnosis() {
	interviewLoading.value = true;
	currentQuestion.value = null;
	singleChoice.value = '';
	groupSingleChoice.value = null;
	multipleChoices.value = [];
	selectedDuration.value = '';

	try {
		const response = await apiFactory.$_trialDiagnosis({
			evidence: evidence.value,
			age: patientAge.value,
			sex: patientGender.value,
			interview_token: interviewToken.value,
			extras: {},
		});
		const data = response.data?.data || response.data;

		if (data?.should_stop || data?.triage_level) {
			diagnosisResults.value = data;
			step.value = 'results';
			fetchAISummary();
		} else if (data?.question) {
			currentQuestion.value = data.question;
			if (data.question.type === 'group_multiple') {
				multipleChoices.value = data.question.items.map(item => ({ ...item, choice_id: '' }));
			}
			questionCount.value++;
		}
	} catch (error) {
		globalError.value = error?.response?.data?.message || 'Assessment error. Please try again.';
	}
	interviewLoading.value = false;
}

function setMultipleChoice(index, choice_id) {
	multipleChoices.value[index] = { ...multipleChoices.value[index], choice_id };
	multipleChoices.value = [...multipleChoices.value];
}

async function submitInterviewAnswer() {
	// Add answer to evidence
	if (currentQuestion.value.type === 'single') {
		evidence.value.push({
			id: currentQuestion.value.items[0].id,
			choice_id: singleChoice.value,
			source: 'interview',
		});
	} else if (currentQuestion.value.type === 'group_single') {
		currentQuestion.value.items.forEach(item => {
			evidence.value.push({
				id: item.id,
				choice_id: item.id === groupSingleChoice.value?.id ? 'present' : 'absent',
				source: 'interview',
			});
		});
	} else if (currentQuestion.value.type === 'group_multiple') {
		multipleChoices.value.forEach(item => {
			if (item.choice_id) {
				evidence.value.push({
					id: item.id,
					choice_id: item.choice_id,
					source: 'interview',
				});
			}
		});
	} else if (currentQuestion.value.type === 'duration') {
		const dur = durationOptions.find(d => d.key === selectedDuration.value);
		if (dur && currentQuestion.value.items?.[0]) {
			evidence.value.push({
				id: currentQuestion.value.items[0].id,
				choice_id: 'present',
				source: 'interview',
				duration: { value: dur.value, unit: dur.unit },
			});
		}
	}

	// Cap at 15 questions for trial
	if (questionCount.value >= 15) {
		interviewLoading.value = true;
		try {
			const response = await apiFactory.$_trialDiagnosis({
				evidence: evidence.value,
				age: patientAge.value,
				sex: patientGender.value,
				interview_token: interviewToken.value,
			});
			diagnosisResults.value = response.data?.data || response.data || {};
		} catch (error) {
			// Show whatever we have
		}
		step.value = 'results';
		fetchAISummary();
		interviewLoading.value = false;
		return;
	}

	await runDiagnosis();
}

// ============ AI SUMMARY ============
async function fetchAISummary() {
	aiSummaryLoading.value = true;
	aiSummaryError.value = '';
	try {
		const response = await apiFactory.$_trialAISummary({
			conditions: diagnosisResults.value.conditions || [],
			evidence: evidence.value,
			triage_level: diagnosisResults.value.triage_level,
			has_emergency_evidence: diagnosisResults.value.has_emergency_evidence || false,
			age: patientAge.value,
			sex: patientGender.value,
		});
		const data = response.data?.data || response.data;
		if (data?.content) {
			aiSummary.value = data.content;
		} else if (data?.error) {
			aiSummaryError.value = data.error;
		}
	} catch (error) {
		aiSummaryError.value = 'Unable to generate AI summary. Please try again.';
	}
	aiSummaryLoading.value = false;
}
</script>

<style scoped lang="scss">
// Design System
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$sky-darker: #01579B;
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$light-gray: #94A3B8;
$bg: #F8FAFC;
$emerald: #10B981;
$violet: #7C3AED;

.trial-checkup {
	min-height: 100vh;
	background: $bg;
	font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
	color: $navy;
}

// ======================== NAV ========================
.trial-nav {
	background: #fff;
	padding: 14px 32px;
	box-shadow: 0 1px 8px rgba(0,0,0,0.06);
	display: flex;
	align-items: center;
	gap: 12px;
	position: sticky;
	top: 0;
	z-index: 100;

	@media (max-width: 640px) { padding: 12px 16px; }

	&__logo img { height: 32px; width: auto; }
	&__badge {
		padding: 4px 12px;
		background: $sky-light;
		color: $sky-dark;
		font-size: 12px;
		font-weight: 700;
		border-radius: 50px;
		text-transform: uppercase;
		letter-spacing: 0.3px;
	}
	&__spacer { flex: 1; }
	&__back {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 14px;
		border: 1px solid #e2e8f0;
		border-radius: 10px;
		background: #fff;
		color: $slate;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;

		&:hover { background: $bg; border-color: $sky; color: $sky-dark; }
	}
}

// ======================== LOADING ========================
.trial-loading {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 80px 24px;
	gap: 16px;

	&__spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #e2e8f0;
		border-top-color: $sky-dark;
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
	}

	p { color: $gray; font-size: 16px; }
}

.step-loading {
	display: flex;
	justify-content: center;
	padding: 40px 0;
}

// ======================== PAGE CONTENT ========================
.page-content {
	max-width: 1400px;
	margin: 0 auto;
	padding: 32px 48px 100px;

	@media (max-width: 768px) { padding: 24px 24px 100px; }
	@media (max-width: 640px) { padding: 20px 16px 100px; }
}

// ======================== HERO SECTION ========================
.hero {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 32px;
	padding: 40px;
	background: linear-gradient(135deg, $sky 0%, $sky-dark 50%, $sky-darker 100%);
	border-radius: 28px;
	position: relative;
	overflow: hidden;
	margin-bottom: 24px;
	box-shadow: 0 20px 60px rgba(2,136,209,0.3);

	@media (max-width: 768px) { grid-template-columns: 1fr; padding: 32px 24px; text-align: center; }

	&--success {
		background: linear-gradient(135deg, $emerald 0%, darken($emerald, 10%) 50%, darken($emerald, 20%) 100%);
		box-shadow: 0 20px 60px rgba(16,185,129,0.3);
	}

	&__content {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 14px;
		z-index: 2;

		@media (max-width: 768px) { align-items: center; }
	}

	&__back {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 10px 16px;
		background: rgba(255,255,255,0.15);
		backdrop-filter: blur(10px);
		border: none;
		border-radius: 12px;
		color: white;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		width: fit-content;
		transition: all 0.2s;

		&:hover { background: rgba(255,255,255,0.25); transform: translateX(-4px); }
	}

	&__badge {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;

		@media (max-width: 768px) { justify-content: center; }
	}

	&__title {
		font-size: 48px;
		font-weight: 800;
		color: white;
		line-height: 1.1;
		margin: 0;
		letter-spacing: -1px;

		@media (max-width: 768px) { font-size: 36px; }
		@media (max-width: 480px) { font-size: 28px; }
	}

	&__title-accent {
		background: linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.7) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	&__subtitle {
		font-size: 16px;
		color: rgba(255,255,255,0.85);
		line-height: 1.6;
		margin: 0;
		max-width: 380px;

		@media (max-width: 768px) { font-size: 15px; max-width: 100%; }
	}

	&__visual {
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;

		@media (max-width: 768px) { display: none; }
	}
}

.badge-step {
	padding: 6px 14px;
	background: rgba(255,255,255,0.2);
	backdrop-filter: blur(10px);
	border-radius: 20px;
	color: white;
	font-size: 13px;
	font-weight: 600;
}

.badge-success {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 6px 14px;
	background: rgba(16,185,129,0.9);
	border-radius: 20px;
	color: white;
	font-size: 13px;
	font-weight: 600;
}

.badge-ai {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 6px 14px;
	background: linear-gradient(135deg, $violet 0%, darken($violet, 10%) 100%);
	border-radius: 20px;
	color: white;
	font-size: 13px;
	font-weight: 600;
}

// ======================== ORB ========================
.orb {
	position: relative;
	width: 140px;
	height: 140px;

	&__inner {
		position: absolute;
		inset: 0;
		background: rgba(255,255,255,0.2);
		backdrop-filter: blur(20px);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		border: 2px solid rgba(255,255,255,0.3);
		animation: float 3s ease-in-out infinite;
	}

	&__ring {
		position: absolute;
		inset: -15px;
		border: 2px solid rgba(255,255,255,0.2);
		border-radius: 50%;
		animation: pulse-ring 2s ease-out infinite;
	}
}

// ======================== BENTO GRID ========================
.bento-grid {
	display: grid;
	gap: 16px;

	&--2col {
		grid-template-columns: 2fr 1fr;

		@media (max-width: 900px) { grid-template-columns: 1fr; }
	}

	&--1col { grid-template-columns: 1fr; }
}

.bento-card {
	background: white;
	border-radius: 20px;
	padding: 24px;
	box-shadow: 0 2px 12px rgba(0,0,0,0.04);
	border: 1px solid #e2e8f0;

	@media (max-width: 640px) { padding: 20px; }

	&--main { grid-row: span 2; @media (max-width: 900px) { grid-row: span 1; } }

	&--info-yellow {
		background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
		border-color: #FCD34D;

		h4 { font-size: 16px; font-weight: 600; color: #92400E; margin: 12px 0 8px; }
		p { font-size: 14px; color: #A16207; line-height: 1.5; margin: 0; }
	}

	&--search { position: relative; }

	&--body {
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	&--action-full {
		grid-column: 1 / -1;
		padding: 20px 24px;
	}

	&--progress {
		background: linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%);
		border-color: #DDD6FE;
	}

	&--triage {
		border-left: 5px solid;

		&.triage--emergency, &.triage--emergency_ambulance {
			background: #FEF2F2;
			border-color: #EF4444;

			.triage-icon { background: #FEE2E2; color: #DC2626; }
			.triage-title { color: #DC2626; }
		}

		&.triage--consultation_24 {
			background: #FFFBEB;
			border-color: #F59E0B;

			.triage-icon { background: #FEF3C7; color: #D97706; }
			.triage-title { color: #D97706; }
		}

		&.triage--consultation {
			background: $sky-light;
			border-color: $sky-dark;

			.triage-icon { background: lighten($sky-light, 3%); color: $sky-dark; }
			.triage-title { color: $sky-dark; }
		}

		&.triage--self_care {
			background: #F0FDF4;
			border-color: $emerald;

			.triage-icon { background: #D1FAE5; color: #059669; }
			.triage-title { color: #059669; }
		}
	}

	&--disclaimer {
		display: flex;
		gap: 12px;
		background: #FFFBEB;
		border-color: #FDE68A;

		.ov-icon { color: #D97706; flex-shrink: 0; margin-top: 2px; }
		p { font-size: 13px; color: $gray; line-height: 1.6; margin: 0; }
	}

	&--cta {
		text-align: center;
		background: linear-gradient(135deg, $sky-light 0%, white 100%);
		border-color: #B3E5FC;

		h3 { font-size: 22px; font-weight: 800; color: $navy; margin: 0 0 8px; }
		p { font-size: 15px; color: $gray; margin: 0 0 20px; }
	}
}

.card-hdr {
	display: flex;
	align-items: center;
	gap: 10px;
	margin-bottom: 20px;
	color: $slate;
	font-weight: 600;
	font-size: 15px;

	.ov-icon { color: $sky; }

	.factor-count {
		margin-left: auto;
		padding: 4px 10px;
		background: $sky-light;
		border-radius: 12px;
		font-size: 13px;
		color: $sky-dark;
	}
}

.info-icon {
	width: 44px;
	height: 44px;
	background: rgba(245,158,11,0.2);
	border-radius: 12px;
	display: flex;
	align-items: center;
	justify-content: center;

	.ov-icon { color: #D97706; }
}

.info-text {
	font-size: 14px;
	color: $gray;
	line-height: 1.6;
	margin-bottom: 16px;
}

.info-highlight {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 12px 16px;
	background: $sky-light;
	border-radius: 12px;
	color: $sky-dark;
	font-size: 13px;
	font-weight: 500;

	.ov-icon { flex-shrink: 0; }
}

// ======================== GENDER ========================
.gender-options {
	display: flex;
	flex-direction: column;
	gap: 14px;
}

.gender-btn {
	display: flex;
	align-items: center;
	gap: 18px;
	padding: 22px 24px;
	background: #fff;
	border: 2px solid rgba(0,0,0,0.08);
	border-radius: 16px;
	cursor: pointer;
	transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
	text-align: left;
	width: 100%;

	@media (max-width: 640px) { padding: 18px 20px; gap: 14px; }

	&:hover { transform: translateY(-3px); .gender-btn__arrow { transform: translateX(4px); } }

	&__icon {
		width: 60px;
		height: 60px;
		border-radius: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: all 0.3s;

		@media (max-width: 640px) { width: 52px; height: 52px; }
	}

	&__txt { flex: 1; }
	&__title { display: block; font-size: 18px; font-weight: 600; color: $navy; margin-bottom: 4px; }
	&__desc { display: block; font-size: 14px; color: $gray; }
	&__arrow { color: $light-gray; flex-shrink: 0; transition: all 0.3s; }

	&--male {
		.gender-btn__icon { background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%); .ov-icon { color: #3B82F6; } }
		&:hover {
			border-color: #3B82F6;
			background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
			box-shadow: 0 12px 32px rgba(59,130,246,0.2);
			.gender-btn__icon { background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); .ov-icon { color: white; } }
		}
	}

	&--female {
		.gender-btn__icon { background: linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%); .ov-icon { color: #EC4899; } }
		&:hover {
			border-color: #EC4899;
			background: linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%);
			box-shadow: 0 12px 32px rgba(236,72,153,0.2);
			.gender-btn__icon { background: linear-gradient(135deg, #EC4899 0%, #DB2777 100%); .ov-icon { color: white; } }
		}
	}
}

// ======================== AGE ========================
.age-display {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 20px;
	padding: 24px;
	background: linear-gradient(135deg, $sky-light 0%, #B3E5FC 100%);
	border-radius: 16px;
	margin-bottom: 24px;

	&__value { display: flex; flex-direction: column; align-items: center; min-width: 120px; }
}

.age-number { font-size: 64px; font-weight: 700; color: $sky-dark; line-height: 1; @media (max-width: 480px) { font-size: 48px; } }
.age-label { font-size: 14px; font-weight: 500; color: $sky; text-transform: uppercase; letter-spacing: 1px; }

.age-btn {
	width: 48px;
	height: 48px;
	border-radius: 12px;
	border: 2px solid $sky;
	background: white;
	color: $sky-dark;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: all 0.2s;

	&:hover:not(:disabled) { background: $sky; color: white; }
	&:disabled { opacity: 0.4; cursor: not-allowed; }
}

.age-slider {
	margin-bottom: 20px;

	&__labels { display: flex; justify-content: space-between; margin-bottom: 8px; span { font-size: 12px; color: $gray; font-weight: 500; } }
}

.slider-input {
	width: 100%;
	height: 8px;
	border-radius: 4px;
	background: #E2E8F0;
	outline: none;
	-webkit-appearance: none;

	&::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
		cursor: pointer;
		border: 3px solid white;
		box-shadow: 0 2px 8px rgba(79,195,247,0.4);
	}

	&::-moz-range-thumb {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
		cursor: pointer;
		border: 3px solid white;
		box-shadow: 0 2px 8px rgba(79,195,247,0.4);
	}
}

.quick-select {
	margin-bottom: 24px;

	&__label { display: block; font-size: 13px; color: $gray; margin-bottom: 10px; }
	&__buttons { display: flex; flex-wrap: wrap; gap: 8px; }
}

.quick-btn {
	padding: 8px 16px;
	border-radius: 10px;
	border: 1px solid #E2E8F0;
	background: white;
	color: $slate;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;

	&:hover { border-color: $sky; color: $sky-dark; }
	&--active { background: $sky-light; border-color: $sky; color: $sky-dark; }
}

// ======================== RISK FACTORS ========================
.risk-list {
	display: flex;
	flex-direction: column;
	gap: 12px;
	max-height: 500px;
	overflow-y: auto;
	padding-right: 8px;
	margin-bottom: 20px;
}

.risk-item {
	padding: 16px;
	background: $bg;
	border-radius: 14px;
	border: 1px solid #E2E8F0;

	&__question { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
	&__icon {
		width: 28px; height: 28px; background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
		border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
		.ov-icon { color: #D97706; }
	}
	&__text { font-size: 14px; font-weight: 500; color: $navy; line-height: 1.4; padding-top: 2px; }
	&__options { display: flex; gap: 8px; }
}

.risk-btn {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 4px;
	padding: 10px 12px;
	background: white;
	border: 1px solid #E2E8F0;
	border-radius: 10px;
	font-size: 13px;
	font-weight: 500;
	color: $gray;
	cursor: pointer;
	transition: all 0.2s;

	@media (max-width: 480px) { padding: 8px 6px; font-size: 12px; }

	&--yes-active { background: linear-gradient(135deg, #DCFCE7, #BBF7D0); border-color: #22C55E; color: #15803D; }
	&--no-active { background: linear-gradient(135deg, #FEE2E2, #FECACA); border-color: #EF4444; color: #B91C1C; }
	&--unsure-active { background: linear-gradient(135deg, $sky-light, #B3E5FC); border-color: $sky; color: $sky-dark; }
}

// ======================== OBSERVATIONS ========================
.notice-banner {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 14px 20px;
	background: $sky-light;
	border: 1px solid #B3E5FC;
	border-radius: 14px;
	color: $sky-dark;
	font-size: 14px;
	margin-bottom: 16px;

	strong { font-weight: 600; }
	&--warning { background: #FEF3C7; border-color: #FDE68A; color: #92400E; }
}

.search-box {
	position: relative;
	display: flex;
	align-items: center;
	margin-bottom: 16px;

	&__icon { position: absolute; left: 16px; color: $gray; }

	&__input {
		width: 100%;
		padding: 14px 16px 14px 48px;
		background: $bg;
		border: 2px solid transparent;
		border-radius: 12px;
		font-size: 15px;
		color: $navy;
		transition: all 0.3s;
		box-sizing: border-box;

		&::placeholder { color: $gray; }
		&:focus { outline: none; border-color: $sky; background: white; box-shadow: 0 0 0 3px rgba(79,195,247,0.1); }
	}
}

.search-results {
	position: absolute;
	top: calc(100% - 20px);
	left: 24px;
	right: 24px;
	background: white;
	border: 1px solid #E2E8F0;
	border-radius: 12px;
	box-shadow: 0 8px 24px rgba(0,0,0,0.12);
	max-height: 280px;
	overflow-y: auto;
	z-index: 50;

	&__item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 16px;
		cursor: pointer;
		transition: all 0.2s;

		.ov-icon { color: $sky; flex-shrink: 0; }
		span { font-size: 14px; color: $navy; }
		&:hover { background: $sky-light; }
	}

	&__empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 32px;
		color: $gray;
	}
}

.selected-symptoms {
	&__title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: $slate; margin: 0 0 12px; .ov-icon { color: $sky; } }
	&__list { display: flex; flex-wrap: wrap; gap: 8px; }
}

.symptom-chip {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 8px 12px;
	background: linear-gradient(135deg, $sky-light, #B3E5FC);
	border: 1px solid #81D4FA;
	border-radius: 20px;

	span { font-size: 13px; color: $sky-dark; font-weight: 500; }

	&__remove {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		background: $sky;
		border: none;
		border-radius: 50%;
		cursor: pointer;
		transition: all 0.2s;

		.ov-icon { color: white; }
		&:hover { background: $sky-dark; }
	}
}

.body-container {
	display: flex;
	justify-content: center;
	align-items: center;
	width: 100%;
	height: 520px;
	padding: 12px;
	background: $bg;
	border-radius: 16px;
	overflow: hidden;
	position: relative;

	@media (max-width: 900px) { height: 480px; }
	@media (max-width: 640px) { height: 420px; }
}

.body-scale-wrapper {
	transform: scale(0.72);
	transform-origin: center center;
	display: flex;
	justify-content: center;

	@media (max-width: 900px) { transform: scale(0.67); }
	@media (max-width: 640px) { transform: scale(0.57); }
}

// ======================== INTERVIEW ========================
.progress-indicator {
	display: flex;
	align-items: center;
	gap: 16px;

	&__spinner {
		width: 40px;
		height: 40px;
		border: 3px solid #E9D5FF;
		border-top-color: #9333EA;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		flex-shrink: 0;
	}

	&__title { font-size: 16px; font-weight: 600; color: $violet; margin: 0 0 4px; }
	&__text { font-size: 14px; color: #6B21A8; margin: 0; }
}

.question-text {
	font-size: 20px;
	font-weight: 600;
	color: $navy;
	margin: 0 0 24px;
	line-height: 1.4;

	@media (max-width: 640px) { font-size: 18px; }
}

.answer-buttons {
	display: flex;
	gap: 12px;

	@media (max-width: 640px) { gap: 8px; }
}

.answer-btn {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	padding: 16px 20px;
	background: $bg;
	border: 2px solid transparent;
	border-radius: 14px;
	font-size: 15px;
	font-weight: 500;
	color: $gray;
	cursor: pointer;
	transition: all 0.3s;

	@media (max-width: 640px) { padding: 14px 12px; font-size: 13px; }

	&--small { padding: 12px 16px; font-size: 14px; @media (max-width: 640px) { padding: 10px 12px; font-size: 12px; } }
	&--yes-active { background: linear-gradient(135deg, #DCFCE7, #BBF7D0); border-color: #22C55E; color: #15803D; }
	&--no-active { background: linear-gradient(135deg, #FEE2E2, #FECACA); border-color: #EF4444; color: #B91C1C; }
	&--unknown-active { background: linear-gradient(135deg, $sky-light, #B3E5FC); border-color: $sky; color: $sky-dark; }
}

.answer-options {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.answer-option {
	display: flex;
	align-items: center;
	gap: 14px;
	padding: 16px 20px;
	background: $bg;
	border: 2px solid transparent;
	border-radius: 14px;
	cursor: pointer;
	transition: all 0.3s;

	&--selected { background: linear-gradient(135deg, $sky-light, #B3E5FC); border-color: $sky; }

	&__radio {
		width: 22px; height: 22px;
		border: 2px solid #CBD5E1;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: all 0.3s;
	}

	&--selected &__radio { border-color: $sky; }

	&__dot { width: 12px; height: 12px; border-radius: 50%; background: $sky; }
	&__text { font-size: 15px; font-weight: 500; color: $navy; }
}

.answer-multiple {
	display: flex;
	flex-direction: column;
	gap: 20px;

	&__item { padding-bottom: 20px; border-bottom: 1px solid #E2E8F0; &:last-child { padding-bottom: 0; border-bottom: none; } }
	&__question { font-size: 16px; font-weight: 500; color: $navy; margin: 0 0 12px; }
	&__options { display: flex; gap: 10px; @media (max-width: 640px) { gap: 8px; } }
}

// ======================== RESULTS ========================
.triage-content {
	display: flex;
	align-items: center;
	gap: 16px;

	@media (max-width: 640px) { flex-direction: column; text-align: center; }
}

.triage-icon {
	width: 56px;
	height: 56px;
	border-radius: 14px;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.triage-info { flex: 1; }
.triage-title { font-size: 18px; font-weight: 700; margin: 0 0 4px; }
.triage-desc { font-size: 14px; color: $gray; margin: 0; line-height: 1.5; }

.conditions-list { display: flex; flex-direction: column; gap: 14px; }

.condition-item {
	&__header { display: flex; justify-content: space-between; margin-bottom: 6px; }
	&__name { font-size: 15px; font-weight: 600; color: $slate; }
	&__prob { font-size: 14px; font-weight: 700; color: $sky-dark; }
	&__bar { height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden; }
	&__fill { height: 100%; background: linear-gradient(90deg, $sky, $sky-dark); border-radius: 3px; transition: width 0.6s ease; }
}

// ======================== AI SUMMARY ========================
.bento-card--ai-loading {
	background: linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%);
	border-color: #DDD6FE;
}

.ai-loading-content {
	display: flex;
	align-items: center;
	gap: 16px;

	h4 { font-size: 16px; font-weight: 600; color: $violet; margin: 0 0 4px; }
	p { font-size: 14px; color: #6B21A8; margin: 0; }
}

.ai-loading-spinner {
	width: 44px;
	height: 44px;
	border: 3px solid #E9D5FF;
	border-top-color: #9333EA;
	border-radius: 50%;
	animation: spin 1s linear infinite;
	flex-shrink: 0;
}

.bento-card--ai-overview {
	background: linear-gradient(135deg, #FAF5FF 0%, #F5F3FF 50%, #EDE9FE 100%);
	border-color: #DDD6FE;
}

.ai-badge {
	margin-left: auto;
	padding: 4px 10px;
	background: linear-gradient(135deg, $violet 0%, darken($violet, 10%) 100%);
	border-radius: 12px;
	font-size: 11px;
	font-weight: 600;
	color: white;
	letter-spacing: 0.3px;
}

.ai-overview-text {
	font-size: 16px;
	color: $slate;
	line-height: 1.7;
	margin: 0;
}

.ai-list {
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 12px;

	li {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		font-size: 14px;
		color: $slate;
		line-height: 1.6;
	}

	&__icon {
		flex-shrink: 0;
		margin-top: 3px;

		&--sky { color: $sky-dark; }
		&--emerald { color: $emerald; }
		&--amber { color: #D97706; }
	}
}

.ai-conditions {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.ai-condition-item {
	padding: 16px;
	background: $bg;
	border-radius: 14px;
	border: 1px solid #E2E8F0;

	&__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 8px;
		gap: 12px;
	}

	&__name {
		font-size: 15px;
		font-weight: 600;
		color: $navy;
	}

	&__urgency {
		padding: 3px 10px;
		border-radius: 8px;
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		flex-shrink: 0;

		&.urgency--routine { background: #D1FAE5; color: #059669; }
		&.urgency--soon { background: $sky-light; color: $sky-dark; }
		&.urgency--urgent { background: #FEF3C7; color: #D97706; }
		&.urgency--emergency { background: #FEE2E2; color: #DC2626; }
	}

	&__desc {
		font-size: 14px;
		color: $gray;
		line-height: 1.6;
		margin: 0;
	}
}

.bento-card--seek-care {
	background: #FFFBEB;
	border-color: #FDE68A;

	.card-hdr .ov-icon { color: #D97706; }
}

.ai-seek-care-text {
	font-size: 14px;
	color: #92400E;
	line-height: 1.7;
	margin: 0;
}

.bento-card--ai-error {
	display: flex;
	align-items: center;
	gap: 12px;
	background: #FEF2F2;
	border-color: #FECACA;

	.ov-icon { color: #DC2626; flex-shrink: 0; }
	p { font-size: 14px; color: #DC2626; margin: 0; flex: 1; }
}

.cta-buttons {
	display: flex;
	gap: 12px;
	justify-content: center;
	flex-wrap: wrap;
}

.ghost-btn {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 14px 28px;
	background: transparent;
	color: $gray;
	border: 2px solid #e2e8f0;
	border-radius: 14px;
	font-size: 15px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s;
	text-decoration: none;

	&:hover { background: $bg; border-color: $sky; color: $sky-dark; }
}

// ======================== SHARED ========================
.action-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	padding-top: 16px;
	border-top: 1px solid #f1f5f9;

	span { font-size: 14px; color: $gray; font-weight: 500; }

	@media (max-width: 640px) { flex-direction: column; }
}

.continue-btn {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 14px 28px;
	background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
	border: none;
	border-radius: 14px;
	color: white;
	font-size: 15px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s;
	box-shadow: 0 4px 16px rgba(79,195,247,0.3);
	text-decoration: none;

	@media (max-width: 640px) { width: 100%; justify-content: center; }

	&:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(79,195,247,0.4); }
	&:disabled { opacity: 0.5; cursor: not-allowed; &:hover { transform: none; } }
}

// ======================== ERROR ========================
.global-error {
	position: fixed;
	bottom: 24px;
	left: 50%;
	transform: translateX(-50%);
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 14px 20px;
	background: #FEF2F2;
	border: 1px solid #FECACA;
	border-radius: 14px;
	color: #DC2626;
	font-size: 14px;
	max-width: 90%;
	z-index: 200;
	box-shadow: 0 8px 24px rgba(0,0,0,0.1);

	.ov-icon { flex-shrink: 0; }

	&__close {
		width: 24px; height: 24px;
		border: none; background: none; cursor: pointer;
		display: flex; align-items: center; justify-content: center;
		color: #DC2626;
		margin-left: 8px;
	}
}

// ======================== ANIMATIONS ========================
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
@keyframes pulse-ring { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.3); opacity: 0; } }
</style>
