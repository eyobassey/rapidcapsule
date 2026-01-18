<template>
	<div class="dashboard">
		<TopBar type="avatar" @open-side-nav="$emit('openSideNav')" />

		<div class="dashboard__content">
			<!-- Hero Banner (kept as requested) -->
			<div class="hero-banner">
				<div class="hero-banner__content">
					<div class="hero-banner__text">
						<h1 class="hero-banner__title">Help Save Lives</h1>
						<p class="hero-banner__subtitle">Support the treatment of people that cannot afford it.</p>
					</div>
					<div class="hero-banner__actions">
						<button class="hero-btn hero-btn--primary">
							<v-icon name="hi-heart" />
							Become a LifeGuard
						</button>
						<button class="hero-btn hero-btn--secondary">
							Learn more
						</button>
					</div>
				</div>
				<div class="hero-banner__image"></div>
				<div class="hero-banner__decoration">
					<div class="decoration-blob decoration-blob--1"></div>
					<div class="decoration-blob decoration-blob--2"></div>
				</div>
			</div>

			<!-- Quick Actions -->
			<section class="quick-actions">
				<div class="section-header">
					<h2 class="section-title">Quick Actions</h2>
					<p class="section-subtitle">Get started with common tasks</p>
				</div>
				<div class="quick-actions__grid">
					<router-link to="/app/patient/health-checkup" class="action-card action-card--checkup">
						<div class="action-card__icon">
							<v-icon name="hi-clipboard-check" />
						</div>
						<div class="action-card__content">
							<h3 class="action-card__title">Health Checkup</h3>
							<p class="action-card__desc">AI-powered symptom analysis</p>
						</div>
						<div class="action-card__arrow">
							<v-icon name="hi-arrow-right" />
						</div>
					</router-link>

					<router-link to="/app/patient/appointments" class="action-card action-card--appointments">
						<div class="action-card__icon">
							<v-icon name="hi-calendar" />
						</div>
						<div class="action-card__content">
							<h3 class="action-card__title">Appointments</h3>
							<p class="action-card__desc">Book or manage appointments</p>
						</div>
						<div class="action-card__arrow">
							<v-icon name="hi-arrow-right" />
						</div>
					</router-link>

					<router-link to="/app/patient/prescriptions" class="action-card action-card--prescriptions">
						<div class="action-card__icon">
							<v-icon name="hi-document-text" />
						</div>
						<div class="action-card__content">
							<h3 class="action-card__title">Prescriptions</h3>
							<p class="action-card__desc">View your medications</p>
						</div>
						<div class="action-card__arrow">
							<v-icon name="hi-arrow-right" />
						</div>
					</router-link>

					<router-link to="/app/patient/health-monitor/vitals" class="action-card action-card--vitals">
						<div class="action-card__icon">
							<v-icon name="hi-chart-bar" />
						</div>
						<div class="action-card__content">
							<h3 class="action-card__title">Health Monitor</h3>
							<p class="action-card__desc">Track your vitals</p>
						</div>
						<div class="action-card__arrow">
							<v-icon name="hi-arrow-right" />
						</div>
					</router-link>
				</div>
			</section>

			<!-- Health Score Section -->
			<section class="health-score-section">
				<div class="section-header">
					<div class="section-header__left">
						<h2 class="section-title">Your Health Score</h2>
						<p class="section-subtitle">{{ showPremiumScore ? 'AI-powered comprehensive health analysis' : 'Overall health assessment based on your data' }}</p>
					</div>
					<router-link v-if="showPremiumScore" :to="`/app/patient/advanced-health-score/report/${latestPremiumScore._id}`" class="view-details-link">
						View Full Report
						<v-icon name="hi-arrow-right" />
					</router-link>
					<router-link v-else-if="showBasicScore" to="/app/patient/advanced-health-score" class="view-details-link">
						Get Premium Score
						<v-icon name="hi-arrow-right" />
					</router-link>
				</div>

				<!-- Score Type Toggle (when both scores available) -->
				<div v-if="hasBothScores" class="score-type-toggle">
					<button
						class="toggle-btn"
						:class="{ active: selectedScoreView === 'basic' }"
						@click="selectedScoreView = 'basic'"
					>
						<v-icon name="hi-chart-bar" scale="0.9" />
						Basic
					</button>
					<button
						class="toggle-btn"
						:class="{ active: selectedScoreView === 'premium' }"
						@click="selectedScoreView = 'premium'"
					>
						<v-icon name="hi-sparkles" scale="0.9" />
						Premium
					</button>
				</div>

				<!-- Premium Score Display -->
				<div v-if="showPremiumScore" class="health-score-premium">
					<div class="premium-badge-header">
						<span class="premium-badge">
							<v-icon name="hi-star" />
							Premium Analysis
						</span>
						<span class="premium-date">{{ formatPremiumDate(latestPremiumScore.created_at) }}</span>
					</div>

					<div class="premium-score-card">
						<div class="premium-score-main">
							<div class="score-circle premium" :class="getPremiumScoreClass(latestPremiumScore.report?.overall_score)">
								<div class="score-circle__inner">
									<span class="score-value">{{ latestPremiumScore.report?.overall_score || '--' }}</span>
									<span class="score-label">Score</span>
								</div>
								<svg class="score-ring" viewBox="0 0 120 120">
									<circle class="score-ring__bg" cx="60" cy="60" r="54" />
									<circle
										class="score-ring__progress"
										cx="60" cy="60" r="54"
										:style="{ strokeDashoffset: getPremiumRingOffset(latestPremiumScore.report?.overall_score) }"
									/>
								</svg>
							</div>
							<div class="premium-score-info">
								<div class="premium-status-badge" :class="getPremiumStatusClass(latestPremiumScore.report?.overall_status)">
									{{ latestPremiumScore.report?.overall_status || 'Processing' }}
								</div>
								<p class="premium-summary">{{ latestPremiumScore.report?.overall_summary || 'Your comprehensive health analysis is ready.' }}</p>
							</div>
						</div>

						<div class="premium-domains" v-if="latestPremiumScore.report?.domain_scores">
							<div class="domains-title">Health Domains</div>
							<div class="domains-grid">
								<div
									v-for="domain in latestPremiumScore.report.domain_scores.slice(0, 6)"
									:key="domain.domain"
									class="domain-mini"
									:class="getPremiumStatusClass(domain.status)"
								>
									<div class="domain-mini-header">
										<v-icon :name="getDomainIconName(domain.domain)" class="domain-mini-icon" />
										<span class="domain-mini-score">{{ domain.score }}</span>
									</div>
									<span class="domain-mini-name">{{ getDomainLabel(domain.domain) }}</span>
								</div>
							</div>
						</div>
					</div>

					<div class="premium-actions">
						<router-link :to="`/app/patient/advanced-health-score/report/${latestPremiumScore._id}`" class="view-report-btn">
							<v-icon name="hi-document-text" />
							View Full Report
						</router-link>
						<router-link to="/app/patient/advanced-health-score/history" class="view-history-btn">
							<v-icon name="hi-collection" />
							View History
						</router-link>
					</div>
				</div>

				<!-- Basic Score with Upgrade CTA -->
				<div v-else-if="showBasicScore" class="health-score-basic">
					<div class="basic-badge-header">
						<span class="basic-badge">
							<v-icon name="hi-chart-bar" />
							Basic Score
						</span>
						<span class="basic-label">FREE</span>
					</div>

					<div class="health-score-card">
						<div class="health-score-card__main">
							<div class="score-circle" :class="healthScoreClass">
								<div class="score-circle__inner">
									<span class="score-value">{{ healthScoreData.score }}</span>
									<span class="score-label">Score</span>
								</div>
								<svg class="score-ring" viewBox="0 0 120 120">
									<circle class="score-ring__bg" cx="60" cy="60" r="54" />
									<circle
										class="score-ring__progress"
										cx="60" cy="60" r="54"
										:style="{ strokeDashoffset: scoreRingOffset }"
									/>
								</svg>
							</div>
							<div class="score-info">
								<h3 class="score-status">{{ healthScoreData.statusMessage }}</h3>
								<p class="score-description">{{ healthScoreDescription }}</p>
								<div class="score-updated">
									<v-icon name="hi-clock" />
									<span>Updated just now</span>
								</div>
							</div>
						</div>

						<div class="health-score-card__breakdown">
							<div class="breakdown-title">Score Breakdown</div>
							<div class="breakdown-items">
								<div class="breakdown-item" v-if="healthScoreData.breakdown?.bmi">
									<div class="breakdown-item__label">
										<v-icon name="fa-weight" />
										<span>BMI</span>
									</div>
									<div class="breakdown-item__status" :class="getBreakdownStatusClass(healthScoreData.breakdown.bmi.status)">
										{{ healthScoreData.breakdown.bmi.status === 'unknown' ? 'No data' : healthScoreData.breakdown.bmi.message }}
									</div>
								</div>
								<div class="breakdown-item" v-if="healthScoreData.breakdown?.bloodPressure">
									<div class="breakdown-item__label">
										<v-icon name="fa-heartbeat" />
										<span>Blood Pressure</span>
									</div>
									<div class="breakdown-item__status" :class="getBreakdownStatusClass(healthScoreData.breakdown.bloodPressure.status)">
										{{ healthScoreData.breakdown.bloodPressure.status === 'unknown' ? 'No data' : healthScoreData.breakdown.bloodPressure.message }}
									</div>
								</div>
								<div class="breakdown-item" v-if="healthScoreData.breakdown?.pulseRate">
									<div class="breakdown-item__label">
										<v-icon name="hi-heart" />
										<span>Heart Rate</span>
									</div>
									<div class="breakdown-item__status" :class="getBreakdownStatusClass(healthScoreData.breakdown.pulseRate.status)">
										{{ healthScoreData.breakdown.pulseRate.status === 'unknown' ? 'No data' : healthScoreData.breakdown.pulseRate.message }}
									</div>
								</div>
								<div class="breakdown-item" v-if="healthScoreData.breakdown?.triage">
									<div class="breakdown-item__label">
										<v-icon name="hi-clipboard-check" />
										<span>Last Checkup</span>
									</div>
									<div class="breakdown-item__status" :class="getBreakdownStatusClass(healthScoreData.breakdown.triage.status)">
										{{ healthScoreData.breakdown.triage.status === 'unknown' ? 'No checkup' : healthScoreData.breakdown.triage.message }}
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Upgrade to Premium CTA (only show if user doesn't have premium score) -->
					<div v-if="!hasPremiumScore" class="upgrade-cta">
						<div class="upgrade-cta__content">
							<div class="upgrade-cta__icon">
								<v-icon name="hi-sparkles" />
							</div>
							<div class="upgrade-cta__text">
								<h4>Get a deeper health analysis</h4>
								<p>Our AI-powered Premium Health Score analyzes 6 health domains with personalized recommendations.</p>
							</div>
						</div>
						<div class="upgrade-cta__features">
							<span><v-icon name="hi-check" /> 25 health questions</span>
							<span><v-icon name="hi-check" /> 6 domain analysis</span>
							<span><v-icon name="hi-check" /> AI recommendations</span>
						</div>
						<router-link to="/app/patient/advanced-health-score" class="upgrade-btn">
							<v-icon name="hi-star" />
							Try Premium Analysis
						</router-link>
					</div>
				</div>

				<!-- Incomplete State - Unlock Your Health Score -->
				<div v-else class="health-score-locked">
					<div class="locked-card">
						<div class="locked-card__icon">
							<v-icon name="hi-lock-closed" />
						</div>
						<div class="locked-card__content">
							<div class="locked-score">
								<span class="locked-score__value">??</span>
								<span class="locked-score__label">Health Score</span>
							</div>
							<h3 class="locked-card__title">Unlock Your Health Score</h3>
							<p class="locked-card__desc">Complete the steps below to reveal your personalized health score</p>
						</div>
					</div>

					<div class="unlock-checklist">
						<div class="checklist-progress">
							<div class="checklist-progress__bar">
								<div class="checklist-progress__fill" :style="{ width: healthScoreData.dataStatus?.progress + '%' }"></div>
							</div>
							<span class="checklist-progress__text">{{ healthScoreData.dataStatus?.completedItems?.length || 0 }} of {{ healthScoreData.dataStatus?.totalItems || 3 }} completed</span>
						</div>

						<div class="checklist-items">
							<!-- Profile Info -->
							<div class="checklist-item" :class="{ completed: isProfileComplete }">
								<div class="checklist-item__check">
									<v-icon :name="isProfileComplete ? 'hi-check' : 'hi-user'" />
								</div>
								<div class="checklist-item__content">
									<span class="checklist-item__label">Add your basic info</span>
									<span class="checklist-item__desc">Height, weight, and date of birth</span>
								</div>
								<router-link v-if="!isProfileComplete" to="/app/patient/account" class="checklist-item__action">
									Complete
									<v-icon name="hi-arrow-right" />
								</router-link>
								<span v-else class="checklist-item__done">
									<v-icon name="hi-check-circle" />
								</span>
							</div>

							<!-- Vitals -->
							<div class="checklist-item" :class="{ completed: hasVitals }">
								<div class="checklist-item__check">
									<v-icon :name="hasVitals ? 'hi-check' : 'hi-heart'" />
								</div>
								<div class="checklist-item__content">
									<span class="checklist-item__label">Record your vitals</span>
									<span class="checklist-item__desc">Blood pressure, temperature, or pulse</span>
								</div>
								<button v-if="!hasVitals" class="checklist-item__action" @click="open('add')">
									Add Vital
									<v-icon name="hi-arrow-right" />
								</button>
								<span v-else class="checklist-item__done">
									<v-icon name="hi-check-circle" />
								</span>
							</div>

							<!-- Health Checkup -->
							<div class="checklist-item" :class="{ completed: hasHealthCheckup }">
								<div class="checklist-item__check">
									<v-icon :name="hasHealthCheckup ? 'hi-check' : 'hi-clipboard-check'" />
								</div>
								<div class="checklist-item__content">
									<span class="checklist-item__label">Complete a health checkup</span>
									<span class="checklist-item__desc">AI-powered symptom analysis</span>
								</div>
								<router-link v-if="!hasHealthCheckup" to="/app/patient/health-checkup" class="checklist-item__action">
									Start Checkup
									<v-icon name="hi-arrow-right" />
								</router-link>
								<span v-else class="checklist-item__done">
									<v-icon name="hi-check-circle" />
								</span>
							</div>
						</div>
					</div>
				</div>

			</section>

			<!-- Vitals Section -->
			<section class="vitals-section">
				<div class="section-header">
					<div class="section-header__left">
						<h2 class="section-title">Your Vitals</h2>
						<p class="section-subtitle">Monitor your health metrics</p>
					</div>
					<div class="section-header__right">
						<button
							v-if="vitalarray.length < 5"
							class="add-vital-btn"
							@click="open('add')"
						>
							<v-icon name="hi-plus" />
							<span>Add Vital</span>
						</button>
					</div>
				</div>

				<!-- Empty State -->
				<div v-if="!vitalarray.length" class="vitals-empty">
					<div class="vitals-empty__icon">
						<v-icon name="hi-heart" />
					</div>
					<h3 class="vitals-empty__title">No vitals recorded</h3>
					<p class="vitals-empty__desc">Start tracking your health by adding your first vital</p>
					<button class="vitals-empty__btn" @click="open('add')">
						<v-icon name="hi-plus" />
						Add Your First Vital
					</button>
				</div>

				<!-- Vitals Grid -->
				<div v-else class="vitals-grid">
					<div
						v-for="(vital, index) in vitalarray"
						:key="index"
						class="vital-card"
						:class="getVitalClass(vital.name)"
					>
						<div class="vital-card__header">
							<div class="vital-card__icon">
								<v-icon :name="getVitalIcon(vital.name)" />
							</div>
							<button class="vital-card__menu" @click="updateVital(vital)">
								<v-icon name="hi-pencil" />
							</button>
						</div>
						<div class="vital-card__body">
							<span class="vital-card__label">{{ vital.name }}</span>
							<div class="vital-card__value">
								<span class="value">{{ vital.value }}</span>
								<span class="unit">{{ vital.unit }}</span>
							</div>
						</div>
						<div class="vital-card__footer">
							<v-icon name="hi-clock" />
							<span>{{ vital.time }}</span>
						</div>
					</div>
				</div>
			</section>

			<!-- Health Tips Section -->
			<section class="health-tips">
				<div class="section-header">
					<h2 class="section-title">Health Tips</h2>
					<p class="section-subtitle">Daily wellness recommendations</p>
				</div>
				<div class="tips-grid">
					<div class="tip-card">
						<div class="tip-card__icon tip-card__icon--water">
							<v-icon name="bi-droplet-fill" />
						</div>
						<div class="tip-card__content">
							<h4>Stay Hydrated</h4>
							<p>Drink at least 8 glasses of water daily</p>
						</div>
					</div>
					<div class="tip-card">
						<div class="tip-card__icon tip-card__icon--sleep">
							<v-icon name="hi-moon" />
						</div>
						<div class="tip-card__content">
							<h4>Quality Sleep</h4>
							<p>Aim for 7-9 hours of sleep each night</p>
						</div>
					</div>
					<div class="tip-card">
						<div class="tip-card__icon tip-card__icon--exercise">
							<v-icon name="fa-running" />
						</div>
						<div class="tip-card__content">
							<h4>Stay Active</h4>
							<p>30 minutes of exercise daily</p>
						</div>
					</div>
				</div>
			</section>
		</div>
	</div>

	<!-- Elegant Add/Update Vital Modal -->
	<div v-if="openModal" class="vital-modal-overlay" @click.self="close">
		<div class="vital-modal">
			<!-- Header -->
			<div class="vital-modal__header">
				<div class="header-content">
					<div class="header-icon">
						<v-icon name="hi-heart" />
					</div>
					<div class="header-text">
						<h3>{{ modalType === 'add' ? 'Log New Vital' : 'Update Vital' }}</h3>
						<p>{{ modalType === 'add' ? 'Select a vital type and enter your reading' : 'Update your measurement' }}</p>
					</div>
				</div>
				<button @click="close" class="close-btn">
					<v-icon name="hi-x" />
				</button>
			</div>

			<div class="vital-modal__body">
				<!-- Vital Type Selection (only for add mode) -->
				<div v-if="modalType === 'add'" class="vital-selection">
					<label class="selection-label">Select Vital Type</label>
					<div class="vital-types">
						<button
							v-for="vitalType in vitalDropList"
							:key="vitalType"
							class="vital-type-card"
							:class="[
								getVitalTypeClass(vitalType),
								{ selected: selectedVital === vitalType }
							]"
							@click="selectVitalType(vitalType)"
						>
							<div class="vital-type-card__icon">
								<v-icon :name="getVitalIcon(vitalType)" />
							</div>
							<span class="vital-type-card__name">{{ vitalType }}</span>
							<span class="vital-type-card__range">{{ getNormalRange(vitalType) }}</span>
							<div v-if="selectedVital === vitalType" class="vital-type-card__check">
								<v-icon name="hi-check" />
							</div>
						</button>
					</div>
				</div>

				<!-- Selected Vital Display (for update mode) -->
				<div v-else class="selected-vital-display">
					<div class="selected-vital-card" :class="getVitalTypeClass(selectedVital)">
						<div class="selected-vital-card__icon">
							<v-icon :name="getVitalIcon(selectedVital)" />
						</div>
						<div class="selected-vital-card__info">
							<span class="name">{{ selectedVital }}</span>
							<span class="range">Normal: {{ getNormalRange(selectedVital) }}</span>
						</div>
					</div>
				</div>

				<!-- Input Section -->
				<div class="input-section" v-if="selectedVital">
					<label class="input-label">Enter Your Reading</label>

					<!-- Single Value Input -->
					<div v-if="selectedVital !== 'Blood Pressure'" class="single-input">
						<div class="input-group">
							<input
								type="number"
								v-model="vital.input1.value"
								:placeholder="getPlaceholder(selectedVital)"
								class="vital-input"
								step="0.1"
							/>
							<select v-model="vital.input1.unit" class="unit-select">
								<option v-for="unit in getUnitOptions(selectedVital)" :key="unit" :value="unit">
									{{ unit }}
								</option>
							</select>
						</div>
						<div class="input-hint">
							<v-icon name="hi-information-circle" />
							<span>{{ getInputHint(selectedVital) }}</span>
						</div>
					</div>

					<!-- Blood Pressure Input (Two Values) -->
					<div v-else class="bp-input">
						<div class="bp-input__group">
							<label>Systolic (Top Number)</label>
							<div class="input-group">
								<input
									type="number"
									v-model="vital.input1.value"
									placeholder="120"
									class="vital-input"
								/>
								<span class="unit-display">mmHg</span>
							</div>
						</div>
						<div class="bp-divider">
							<span>/</span>
						</div>
						<div class="bp-input__group">
							<label>Diastolic (Bottom Number)</label>
							<div class="input-group">
								<input
									type="number"
									v-model="vital.input2.value"
									placeholder="80"
									class="vital-input"
								/>
								<span class="unit-display">mmHg</span>
							</div>
						</div>
					</div>

					<!-- Visual Indicator -->
					<div v-if="vital.input1.value && selectedVital !== 'Blood Pressure'" class="reading-indicator" :class="getReadingStatus()">
						<div class="indicator-bar">
							<div class="indicator-marker" :style="{ left: getIndicatorPosition() }"></div>
						</div>
						<div class="indicator-labels">
							<span>Low</span>
							<span>Normal</span>
							<span>High</span>
						</div>
						<div class="indicator-status">
							<v-icon :name="getReadingStatusIcon()" />
							<span>{{ getReadingStatusText() }}</span>
						</div>
					</div>

					<!-- Date & Time Section -->
					<div class="datetime-section">
						<label class="input-label">When was this reading taken?</label>
						<div class="datetime-inputs">
							<div class="datetime-group">
								<label>Date <span class="required">*</span></label>
								<div class="input-wrapper">
									<v-icon name="hi-calendar" />
									<input
										type="date"
										v-model="vital.date"
										class="datetime-input"
										:max="todayDate"
										required
									/>
								</div>
							</div>
							<div class="datetime-group">
								<label>Time <span class="optional">(Optional)</span></label>
								<div class="input-wrapper">
									<v-icon name="hi-clock" />
									<input
										type="time"
										v-model="vital.time"
										class="datetime-input"
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Footer -->
			<div class="vital-modal__footer">
				<button class="cancel-btn" @click="close">Cancel</button>
				<button
					class="save-btn"
					:class="{ loading: loading }"
					:disabled="!canSave || loading"
					@click="addVitals(selectedVital, true)"
				>
					<span v-if="!loading">
						<v-icon name="hi-check" />
						{{ modalType === 'add' ? 'Save Vital' : 'Update Vital' }}
					</span>
					<span v-else class="loading-state">
						<span class="spinner"></span>
						Saving...
					</span>
				</button>
			</div>
		</div>
	</div>
</template>

<script>
import { useCalcTimeEllapsed } from "@/Utility-functions";
import { mapGetters, mapActions } from "vuex";
import TopBar from "@/components/Navigation/top-bar.vue";
import apiFactory from "@/services/apiFactory";
import {
	calculateHealthScore,
	getHealthScoreClass,
	getHealthScoreDescription
} from "@/utils/health-score-calculator";

export default {
	name: "Dashboard",

	emits: ["openSideNav"],

	components: {
		TopBar,
	},

	inject: ['$_HTTP'],

	data() {
		return {
			openModal: false,
			loading: false,
			healthCheckups: [],
			latestPremiumScore: null,
			selectedScoreView: 'premium', // 'basic' or 'premium'
			loadingPremiumScore: false,
			dropList: [
				"Body Temperature",
				"Body Weight",
				"Pulse Rate",
				"Blood Sugar Level",
				"Blood Pressure",
			],

			modalType: "add",
			selectedVital: null,

			vital: {
				input1: { value: "", unit: "" },
				input2: { value: "", unit: "" },
				date: "",
				time: "",
			},

			// Normal ranges for vitals
			normalRanges: {
				"Body Temperature": { min: 36.1, max: 37.2, unit: "°C" },
				"Body Weight": { min: 18.5, max: 24.9, unit: "BMI" },
				"Pulse Rate": { min: 60, max: 100, unit: "bpm" },
				"Blood Sugar Level": { min: 70, max: 100, unit: "mg/dL" },
				"Blood Pressure": { systolic: { min: 90, max: 120 }, diastolic: { min: 60, max: 80 } },
			},
		};
	},

	computed: {
		...mapGetters({
			userProfile: "userprofile",
			vitals: "recentVitals",
		}),

		userBasicInfo() {
			return this.userProfile.profile;
		},

		vitalarray() {
			return this.getVitalArray(this.vitals);
		},

		vitalList() {
			const vitalArray = [];
			Object.keys(this.vitals).forEach((key) => {
				switch (key) {
					case "body_temp":
						vitalArray.push("Body Temperature");
						break;
					case "blood_pressure":
						vitalArray.push("Blood Pressure");
						break;
					case "blood_sugar_level":
						vitalArray.push("Blood Sugar Level");
						break;
					case "body_weight":
						vitalArray.push("Body Weight");
						break;
					case "pulse_rate":
						vitalArray.push("Pulse Rate");
						break;
				}
			});
			return vitalArray;
		},

		vitalDropList() {
			if (this.modalType === "add") {
				const list = [];
				for (let i = 0; i < this.dropList.length; i++) {
					if (!this.vitalList.includes(this.dropList[i])) {
						list.push(this.dropList[i]);
					}
				}
				return list;
			} else {
				return this.vitalList;
			}
		},

		canSave() {
			if (!this.selectedVital || !this.vital.date) return false;
			if (this.selectedVital === "Blood Pressure") {
				return this.vital.input1.value && this.vital.input2.value;
			}
			return this.vital.input1.value && this.vital.input1.unit;
		},

		todayDate() {
			return new Date().toISOString().split('T')[0];
		},

		// Health Score computed properties
		userBmi() {
			const profile = this.userProfile?.profile;
			if (!profile?.basic_health_info?.height?.value || !profile?.basic_health_info?.weight?.value) {
				return null;
			}
			let heightM = parseFloat(profile.basic_health_info.height.value);
			let weightKg = parseFloat(profile.basic_health_info.weight.value);

			// Convert height to meters if in cm
			if (profile.basic_health_info.height.unit === 'cm') {
				heightM = heightM / 100;
			}
			// Convert weight to kg if in lb
			if (profile.basic_health_info.weight.unit === 'lb') {
				weightKg = weightKg * 0.453592;
			}

			return weightKg / (heightM * heightM);
		},

		healthScoreData() {
			return calculateHealthScore({
				bmi: this.userBmi,
				vitals: this.vitals,
				healthCheckups: this.healthCheckups,
				profile: this.userProfile?.profile
			});
		},

		healthScoreClass() {
			return getHealthScoreClass(this.healthScoreData.score);
		},

		scoreRingOffset() {
			// SVG circle circumference = 2 * PI * r = 2 * 3.14159 * 54 ≈ 339.29
			const circumference = 339.29;
			const score = this.healthScoreData.score || 0;
			const progress = score / 100;
			return circumference * (1 - progress);
		},

		healthScoreDescription() {
			return getHealthScoreDescription(this.healthScoreData.score);
		},

		// Checklist computed properties for incomplete state
		isProfileComplete() {
			const profile = this.userProfile?.profile;
			const height = profile?.basic_health_info?.height?.value;
			const weight = profile?.basic_health_info?.weight?.value;
			// Must have both height and weight with actual numeric values
			const hasHeight = height && !isNaN(parseFloat(height)) && parseFloat(height) > 0;
			const hasWeight = weight && !isNaN(parseFloat(weight)) && parseFloat(weight) > 0;
			return hasHeight && hasWeight;
		},

		hasVitals() {
			return !!(
				this.vitals?.blood_pressure ||
				this.vitals?.body_temp ||
				this.vitals?.pulse_rate ||
				this.vitals?.blood_sugar_level
			);
		},

		hasHealthCheckup() {
			return this.healthCheckups && this.healthCheckups.length > 0;
		},

		hasPremiumScore() {
			return this.latestPremiumScore && this.latestPremiumScore.report?.overall_score;
		},

		hasBothScores() {
			return this.hasPremiumScore && this.healthScoreData.isComplete;
		},

		showPremiumScore() {
			if (this.hasBothScores) {
				return this.selectedScoreView === 'premium';
			}
			return this.hasPremiumScore;
		},

		showBasicScore() {
			if (this.hasBothScores) {
				return this.selectedScoreView === 'basic';
			}
			return !this.hasPremiumScore && this.healthScoreData.isComplete;
		},
	},

	created() {
		// Fetch health checkups and premium score when component loads
		if (this.userProfile?._id) {
			this.fetchHealthCheckups();
			this.fetchLatestPremiumScore();
		}
	},

	watch: {
		'userProfile._id': {
			handler(newId) {
				if (newId) {
					this.fetchHealthCheckups();
					this.fetchLatestPremiumScore();
				}
			},
			immediate: false
		}
	},

	methods: {
		...mapActions({
			addVital: "vitalsManagement/addVitals",
			updateVitals: "vitalsManagement/updateVitals",
		}),

		getBreakdownStatusClass(status) {
			const statusClasses = {
				'normal': 'breakdown-status--normal',
				'mild': 'breakdown-status--warning',
				'moderate': 'breakdown-status--warning',
				'elevated': 'breakdown-status--warning',
				'high': 'breakdown-status--danger',
				'severe': 'breakdown-status--danger',
				'critical': 'breakdown-status--danger',
				'low': 'breakdown-status--warning',
				'unknown': 'breakdown-status--unknown',
			};
			return statusClasses[status] || 'breakdown-status--unknown';
		},

		async fetchHealthCheckups() {
			try {
				const response = await this.$_HTTP.$_getHealthCheckupHistory({ limit: 10 });
				if (response?.data?.data?.checkups) {
					this.healthCheckups = response.data.data.checkups;
				}
			} catch (error) {
				console.error('Error fetching health checkups:', error);
			}
		},

		async fetchLatestPremiumScore() {
			this.loadingPremiumScore = true;
			try {
				const response = await apiFactory.$_getAdvancedHealthScoreHistory({ limit: 1 });
				const data = response.data?.data || response.data;
				const assessments = data.assessments || data.items || data || [];
				if (assessments.length > 0 && assessments[0].status === 'completed') {
					this.latestPremiumScore = assessments[0];
				}
			} catch (error) {
				console.error('Error fetching premium score:', error);
			} finally {
				this.loadingPremiumScore = false;
			}
		},

		getPremiumScoreClass(score) {
			if (!score) return 'health-fair';
			if (score >= 85) return 'health-excellent';
			if (score >= 70) return 'health-good';
			if (score >= 50) return 'health-fair';
			return 'health-poor';
		},

		getPremiumStatusClass(status) {
			const statusMap = {
				'Excellent': 'status-excellent',
				'Good': 'status-good',
				'Fair': 'status-fair',
				'Needs Attention': 'status-needs-attention',
				'Poor': 'status-poor',
			};
			return statusMap[status] || 'status-fair';
		},

		getPremiumRingOffset(score) {
			const circumference = 339.29;
			const progress = (score || 0) / 100;
			return circumference * (1 - progress);
		},

		getDomainIconName(domain) {
			const icons = {
				cardiovascular: 'hi-heart',
				metabolic: 'hi-lightning-bolt',
				mental_wellbeing: 'hi-light-bulb',
				lifestyle: 'hi-trending-up',
				physical_symptoms: 'hi-clipboard-list',
				preventive_care: 'hi-shield-check',
			};
			return icons[domain] || 'hi-chart-bar';
		},

		getDomainLabel(domain) {
			const labels = {
				cardiovascular: 'Cardiovascular',
				metabolic: 'Metabolic',
				mental_wellbeing: 'Mental',
				lifestyle: 'Lifestyle',
				physical_symptoms: 'Physical',
				preventive_care: 'Preventive',
			};
			return labels[domain] || domain;
		},

		formatPremiumDate(dateStr) {
			if (!dateStr) return '';
			const date = new Date(dateStr);
			const now = new Date();
			const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

			if (diffDays === 0) return 'Today';
			if (diffDays === 1) return 'Yesterday';
			if (diffDays < 7) return `${diffDays} days ago`;

			return date.toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
				year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
			});
		},

		getVitalIcon(name) {
			const icons = {
				"Body Temperature": "fa-thermometer-half",
				"Body Weight": "fa-weight",
				"Pulse Rate": "hi-heart",
				"Blood Sugar Level": "bi-droplet-fill",
				"Blood Pressure": "fa-heartbeat",
			};
			return icons[name] || "hi-heart";
		},

		getVitalClass(name) {
			const classes = {
				"Body Temperature": "vital-card--temp",
				"Body Weight": "vital-card--weight",
				"Pulse Rate": "vital-card--pulse",
				"Blood Sugar Level": "vital-card--sugar",
				"Blood Pressure": "vital-card--pressure",
			};
			return classes[name] || "";
		},

		getVitalTypeClass(name) {
			const classes = {
				"Body Temperature": "vital--temp",
				"Body Weight": "vital--weight",
				"Pulse Rate": "vital--pulse",
				"Blood Sugar Level": "vital--sugar",
				"Blood Pressure": "vital--pressure",
			};
			return classes[name] || "";
		},

		getNormalRange(name) {
			const ranges = {
				"Body Temperature": "36.1-37.2°C",
				"Body Weight": "Varies by height",
				"Pulse Rate": "60-100 bpm",
				"Blood Sugar Level": "70-100 mg/dL",
				"Blood Pressure": "90-120/60-80 mmHg",
			};
			return ranges[name] || "";
		},

		getPlaceholder(name) {
			const placeholders = {
				"Body Temperature": "36.5",
				"Body Weight": "70",
				"Pulse Rate": "72",
				"Blood Sugar Level": "90",
			};
			return placeholders[name] || "";
		},

		getUnitOptions(name) {
			const units = {
				"Body Temperature": ["°C", "°F"],
				"Body Weight": ["kg", "lb"],
				"Pulse Rate": ["bpm"],
				"Blood Sugar Level": ["mg/dL", "mmol/L"],
			};
			return units[name] || [];
		},

		getInputHint(name) {
			const hints = {
				"Body Temperature": "Normal body temperature is 36.1-37.2°C (97-99°F)",
				"Body Weight": "Track your weight to monitor health trends",
				"Pulse Rate": "Resting heart rate for adults is 60-100 bpm",
				"Blood Sugar Level": "Fasting blood sugar should be 70-100 mg/dL",
			};
			return hints[name] || "";
		},

		getReadingStatus() {
			if (!this.vital.input1.value || !this.selectedVital) return "";
			const value = parseFloat(this.vital.input1.value);
			const range = this.normalRanges[this.selectedVital];

			if (!range || !range.min) return "";

			if (value < range.min) return "status--low";
			if (value > range.max) return "status--high";
			return "status--normal";
		},

		getReadingStatusIcon() {
			const status = this.getReadingStatus();
			if (status === "status--normal") return "hi-check-circle";
			if (status === "status--low") return "hi-arrow-down";
			return "hi-arrow-up";
		},

		getReadingStatusText() {
			const status = this.getReadingStatus();
			if (status === "status--normal") return "Within normal range";
			if (status === "status--low") return "Below normal range";
			return "Above normal range";
		},

		getIndicatorPosition() {
			if (!this.vital.input1.value || !this.selectedVital) return "50%";
			const value = parseFloat(this.vital.input1.value);
			const range = this.normalRanges[this.selectedVital];

			if (!range || !range.min) return "50%";

			const totalRange = (range.max - range.min) * 2;
			const midPoint = (range.min + range.max) / 2;
			const offset = ((value - midPoint) / totalRange) * 100 + 50;

			return Math.max(5, Math.min(95, offset)) + "%";
		},

		selectVitalType(vitalType) {
			this.selectedVital = vitalType;
			const units = this.getUnitOptions(vitalType);
			if (units.length) {
				this.vital.input1.unit = units[0];
			}
		},

		open(type) {
			const now = new Date();
			const today = now.toISOString().split('T')[0];
			const currentTime = now.toTimeString().slice(0, 5);

			if (type === "add") {
				this.modalType = "add";
				this.selectedVital = this.vitalDropList[0] || null;
				this.vital = {
					input1: { value: "", unit: "" },
					input2: { value: "", unit: "" },
					date: today,
					time: currentTime,
				};
				// Set default unit
				if (this.selectedVital) {
					const units = this.getUnitOptions(this.selectedVital);
					if (units.length) this.vital.input1.unit = units[0];
				}
				this.openModal = true;
			} else if (type === "update") {
				this.modalType = "update";
				this.openModal = true;
			}
		},

		async addVitals(name, close) {
			const val = this.vital.input2.value
				? `${this.vital.input1.value}/${this.vital.input2.value}`
				: this.vital.input1.value;

			this.loading = true;

			// Combine date and time into a timestamp
			let recordedAt = this.vital.date;
			if (this.vital.time) {
				recordedAt = `${this.vital.date}T${this.vital.time}:00`;
			}

			let res;
			if (this.modalType === "add") {
				res = await this.addVital({
					name: name,
					value: val,
					unit: this.vital.input1.unit || "mmHg",
					recorded_at: recordedAt,
				});
			} else {
				res = await this.updateVitals({
					name: name,
					value: val,
					unit: this.vital.input1.unit || "mmHg",
					recorded_at: recordedAt,
				});
			}

			if (res) {
				this.loading = false;
				this.vital = {
					input1: { value: "", unit: "" },
					input2: { value: "", unit: "" },
					date: "",
					time: "",
				};
				if (close) this.openModal = false;
			} else {
				this.loading = false;
			}
		},

		close() {
			this.openModal = false;
			this.vital = {
				input1: { value: "", unit: "" },
				input2: { value: "", unit: "" },
				date: "",
				time: "",
			};
		},

		updateVital(val) {
			this.modalType = "update";
			this.selectedVital = val.name;

			// Set default date to today and current time for update
			const now = new Date();
			const today = now.toISOString().split('T')[0];
			const currentTime = now.toTimeString().slice(0, 5);

			if (val.value.includes("/")) {
				const [sys, dia] = val.value.split("/");
				this.vital.input1.value = sys;
				this.vital.input2.value = dia;
			} else {
				this.vital.input1.value = val.value;
			}
			this.vital.input1.unit = val.unit;
			this.vital.input2.unit = val.unit;
			this.vital.date = today;
			this.vital.time = currentTime;

			this.openModal = true;
		},

		getVitalArray(val) {
			let vitalArray = [];
			Object.keys(val).forEach((key) => {
				let vitalName = null;
				if (key === "body_temp") vitalName = "Body Temperature";
				if (key === "body_weight") vitalName = "Body Weight";
				if (key === "blood_pressure") vitalName = "Blood Pressure";
				if (key === "pulse_rate") vitalName = "Pulse Rate";
				if (key === "blood_sugar_level") vitalName = "Blood Sugar Level";

				let vital = {
					name: vitalName,
					value: val[key].value,
					unit: val[key].unit,
					time: useCalcTimeEllapsed(val[key].updatedAt),
				};
				vitalArray.push(vital);
			});
			return vitalArray;
		},
	},
};
</script>

<style scoped lang="scss">
.dashboard {
	display: flex;
	flex-direction: column;
	flex-grow: 1;
	max-width: 82.67rem;
	height: 100vh;

	@include responsive(tab-landscape) {
		min-height: 100vh;
	}

	&__content {
		display: flex;
		flex-direction: column;
		gap: $size-32;
		overflow-y: auto;
		overscroll-behavior-block: contain;
		padding: $size-24 $size-48 $size-48;

		@include scrollBar(normal);

		@include responsive(tab-landscape) {
			padding: $size-20 $size-32 $size-32;
			@include scrollBar(reset);
		}

		@include responsive(phone) {
			padding: $size-16 $size-16 $size-32;
			gap: $size-24;
			@include scrollBar(none);
		}
	}
}

// Hero Banner
.hero-banner {
	position: relative;
	display: flex;
	align-items: center;
	gap: $size-32;
	padding: $size-32 $size-40;
	background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 50%, #0e7490 100%);
	border-radius: $size-24;
	overflow: hidden;
	min-height: 200px;
	box-shadow: 0 10px 40px rgba(14, 174, 196, 0.3);

	@include responsive(phone) {
		padding: $size-24;
		flex-direction: column;
		text-align: center;
	}

	&__content {
		position: relative;
		z-index: 2;
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: $size-20;
	}

	&__text {
		display: flex;
		flex-direction: column;
		gap: $size-8;
	}

	&__title {
		font-size: $size-28;
		font-weight: $fw-bold;
		color: white;
		letter-spacing: -0.5px;
		margin: 0;

		@include responsive(phone) {
			font-size: $size-24;
		}
	}

	&__subtitle {
		font-size: $size-16;
		color: rgba(255, 255, 255, 0.9);
		margin: 0;
		line-height: 1.5;

		@include responsive(phone) {
			font-size: $size-14;
		}
	}

	&__actions {
		display: flex;
		gap: $size-12;

		@include responsive(phone) {
			flex-direction: column;
		}
	}

	&__image {
		position: relative;
		z-index: 1;
		width: 280px;
		height: 180px;
		background: url(@/assets/images/aditya-romansa-5zp0jym2w9M-unsplash.jpg) no-repeat center;
		background-size: cover;
		border-radius: $size-16;
		flex-shrink: 0;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);

		@include responsive(tab-portrait) {
			display: none;
		}
	}

	&__decoration {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		pointer-events: none;
		overflow: hidden;
	}
}

.decoration-blob {
	position: absolute;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.1);

	&--1 {
		width: 300px;
		height: 300px;
		top: -100px;
		right: -50px;
	}

	&--2 {
		width: 200px;
		height: 200px;
		bottom: -80px;
		left: -60px;
	}
}

.hero-btn {
	display: inline-flex;
	align-items: center;
	gap: $size-8;
	padding: $size-12 $size-24;
	border-radius: $size-12;
	font-size: $size-14;
	font-weight: $fw-semi-bold;
	cursor: pointer;
	transition: all 0.3s ease;
	border: none;

	svg {
		width: 18px;
		height: 18px;
	}

	&--primary {
		background: white;
		color: $color-sec;
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);

		&:hover {
			transform: translateY(-2px);
			box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
		}
	}

	&--secondary {
		background: rgba(255, 255, 255, 0.2);
		color: white;
		backdrop-filter: blur(10px);

		&:hover {
			background: rgba(255, 255, 255, 0.3);
		}
	}
}

// Section Headers
.section-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-end;
	margin-bottom: $size-20;

	&__left {
		display: flex;
		flex-direction: column;
		gap: $size-4;
	}

	&__right {
		display: flex;
		align-items: center;
		gap: $size-12;
	}
}

.section-title {
	font-size: $size-22;
	font-weight: $fw-bold;
	color: $color-black;
	margin: 0;

	@include responsive(phone) {
		font-size: $size-20;
	}
}

.section-subtitle {
	font-size: $size-14;
	color: $color-g-54;
	margin: 0;

	@include responsive(phone) {
		font-size: $size-13;
	}
}

// Quick Actions
.quick-actions {
	&__grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: $size-16;

		@include responsive(tab-portrait) {
			grid-template-columns: repeat(2, 1fr);
		}

		@include responsive(phone) {
			grid-template-columns: 1fr;
			gap: $size-12;
		}
	}
}

.action-card {
	display: flex;
	align-items: center;
	gap: $size-16;
	padding: $size-20;
	background: white;
	border: 1px solid $color-g-90;
	border-radius: $size-16;
	text-decoration: none;
	transition: all 0.2s ease;
	cursor: pointer;

	&:hover {
		border-color: $color-g-77;
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);

		.action-card__arrow {
			transform: translateX(4px);
			opacity: 1;
		}
	}

	&__icon {
		width: 48px;
		height: 48px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;

		svg {
			width: 24px;
			height: 24px;
		}
	}

	&__content {
		flex: 1;
		min-width: 0;
	}

	&__title {
		font-size: $size-15;
		font-weight: $fw-semi-bold;
		color: $color-black;
		margin: 0 0 $size-4 0;
	}

	&__desc {
		font-size: $size-12;
		color: $color-g-54;
		margin: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	&__arrow {
		opacity: 0.4;
		transition: all 0.2s ease;

		svg {
			width: 18px;
			height: 18px;
			color: $color-g-54;
		}
	}

	// Color variants - using subtle backgrounds like wallet page
	&--checkup {
		&:hover { border-color: $color-sec; }
		.action-card__icon {
			background: rgba($color-sec, 0.1);
			svg { color: $color-sec; }
		}
	}

	&--appointments {
		&:hover { border-color: $color-pri; }
		.action-card__icon {
			background: rgba($color-pri, 0.1);
			svg { color: $color-pri; }
		}
	}

	&--prescriptions {
		&:hover { border-color: #8b5cf6; }
		.action-card__icon {
			background: rgba(#8b5cf6, 0.1);
			svg { color: #8b5cf6; }
		}
	}

	&--vitals {
		&:hover { border-color: #10b981; }
		.action-card__icon {
			background: rgba(#10b981, 0.1);
			svg { color: #10b981; }
		}
	}
}

// Vitals Section
.vitals-section {
	background: white;
	border-radius: $size-20;
	padding: $size-24;
	border: 2px solid $color-g-92;

	@include responsive(phone) {
		padding: $size-20;
	}
}

.add-vital-btn {
	display: flex;
	align-items: center;
	gap: $size-8;
	padding: $size-10 $size-20;
	background: linear-gradient(135deg, $color-sec 0%, $color-sec-s1 100%);
	color: white;
	border: none;
	border-radius: $size-10;
	font-size: $size-13;
	font-weight: $fw-semi-bold;
	cursor: pointer;
	transition: all 0.3s ease;

	svg {
		width: 16px;
		height: 16px;
	}

	&:hover {
		box-shadow: 0 4px 14px rgba($color-sec, 0.4);
		transform: translateY(-2px);
	}

	@include responsive(phone) {
		span {
			display: none;
		}
		padding: $size-10;
	}
}

.vitals-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: $size-48 $size-24;
	text-align: center;

	&__icon {
		width: 80px;
		height: 80px;
		background: linear-gradient(135deg, $color-sec-t4 0%, $color-sec-t3 100%);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: $size-20;

		svg {
			width: 36px;
			height: 36px;
			color: $color-sec;
		}
	}

	&__title {
		font-size: $size-18;
		font-weight: $fw-semi-bold;
		color: $color-black;
		margin: 0 0 $size-8 0;
	}

	&__desc {
		font-size: $size-14;
		color: $color-g-54;
		margin: 0 0 $size-24 0;
		max-width: 300px;
	}

	&__btn {
		display: flex;
		align-items: center;
		gap: $size-8;
		padding: $size-14 $size-24;
		background: linear-gradient(135deg, $color-sec 0%, $color-sec-s1 100%);
		color: white;
		border: none;
		border-radius: $size-12;
		font-size: $size-14;
		font-weight: $fw-semi-bold;
		cursor: pointer;
		transition: all 0.3s ease;

		svg {
			width: 18px;
			height: 18px;
		}

		&:hover {
			box-shadow: 0 6px 20px rgba($color-sec, 0.4);
			transform: translateY(-2px);
		}
	}
}

.vitals-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
	gap: $size-16;

	@include responsive(phone) {
		grid-template-columns: 1fr;
	}
}

.vital-card {
	position: relative;
	padding: $size-20;
	border-radius: $size-16;
	background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
	border: 2px solid $color-g-92;
	transition: all 0.3s ease;

	&:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);

		.vital-card__menu {
			opacity: 1;
		}
	}

	&__header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: $size-16;
	}

	&__icon {
		width: 44px;
		height: 44px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;

		svg {
			width: 22px;
			height: 22px;
		}
	}

	&__menu {
		background: white;
		border: none;
		padding: $size-8;
		border-radius: 8px;
		cursor: pointer;
		opacity: 0.6;
		transition: all 0.2s ease;

		svg {
			width: 16px;
			height: 16px;
			color: $color-g-54;
		}

		&:hover {
			background: $color-g-95;
		}
	}

	&__body {
		margin-bottom: $size-12;
	}

	&__label {
		font-size: $size-12;
		font-weight: $fw-medium;
		color: $color-g-54;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		display: block;
		margin-bottom: $size-6;
	}

	&__value {
		display: flex;
		align-items: baseline;
		gap: $size-4;

		.value {
			font-size: $size-32;
			font-weight: $fw-bold;
			color: $color-black;
			line-height: 1;
		}

		.unit {
			font-size: $size-14;
			font-weight: $fw-medium;
			color: $color-g-54;
		}
	}

	&__footer {
		display: flex;
		align-items: center;
		gap: $size-6;
		font-size: $size-11;
		color: $color-g-54;

		svg {
			width: 12px;
			height: 12px;
		}
	}

	// Color variants - using subtle backgrounds like wallet page
	&--temp .vital-card__icon {
		background: rgba($color-pri, 0.1);
		svg { color: $color-pri; }
	}

	&--weight .vital-card__icon {
		background: rgba(#8b5cf6, 0.1);
		svg { color: #8b5cf6; }
	}

	&--pulse .vital-card__icon {
		background: rgba($color-sec, 0.1);
		svg { color: $color-sec; }
	}

	&--sugar .vital-card__icon {
		background: rgba(#3b82f6, 0.1);
		svg { color: #3b82f6; }
	}

	&--pressure .vital-card__icon {
		background: rgba(#ec4899, 0.1);
		svg { color: #ec4899; }
	}
}

// Health Tips
.health-tips {
	background: white;
	border-radius: $size-20;
	padding: $size-24;
	border: 1px solid $color-g-90;

	@include responsive(phone) {
		padding: $size-20;
	}
}

.tips-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: $size-16;

	@include responsive(tab-portrait) {
		grid-template-columns: 1fr;
	}
}

.tip-card {
	display: flex;
	align-items: center;
	gap: $size-16;
	padding: $size-16;
	background: white;
	border-radius: $size-12;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

	&__icon {
		width: 44px;
		height: 44px;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;

		svg {
			width: 22px;
			height: 22px;
		}

		&--water {
			background: rgba($color-sec, 0.1);
			svg { color: $color-sec; }
		}

		&--sleep {
			background: rgba(#8b5cf6, 0.1);
			svg { color: #8b5cf6; }
		}

		&--exercise {
			background: rgba(#10b981, 0.1);
			svg { color: #10b981; }
		}
	}

	&__content {
		h4 {
			font-size: $size-14;
			font-weight: $fw-semi-bold;
			color: $color-black;
			margin: 0 0 $size-4 0;
		}

		p {
			font-size: $size-12;
			color: $color-g-54;
			margin: 0;
			line-height: 1.4;
		}
	}
}

// Modal Styles
.vital-modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.6);
	backdrop-filter: blur(4px);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	padding: $size-16;
}

.vital-modal {
	background: white;
	border-radius: 20px;
	width: 100%;
	max-width: 520px;
	max-height: 90vh;
	overflow-y: auto;
	box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);

	&__header {
		background: linear-gradient(135deg, $color-sec 0%, $color-sec-s1 100%);
		padding: $size-24;
		border-radius: 20px 20px 0 0;
		position: relative;

		.header-content {
			display: flex;
			align-items: center;
			gap: $size-16;
		}

		.header-icon {
			width: 48px;
			height: 48px;
			background: rgba(255, 255, 255, 0.2);
			border-radius: 12px;
			display: flex;
			align-items: center;
			justify-content: center;

			svg {
				width: 24px;
				height: 24px;
				color: white;
			}
		}

		.header-text {
			flex: 1;

			h3 {
				margin: 0;
				font-size: $size-18;
				font-weight: $fw-bold;
				color: white;
			}

			p {
				margin: 4px 0 0;
				font-size: $size-13;
				color: rgba(255, 255, 255, 0.85);
			}
		}

		.close-btn {
			position: absolute;
			top: $size-16;
			right: $size-16;
			background: rgba(255, 255, 255, 0.15);
			border: none;
			padding: $size-8;
			border-radius: 8px;
			cursor: pointer;
			transition: all 0.2s ease;

			&:hover {
				background: rgba(255, 255, 255, 0.25);
			}

			svg {
				width: 20px;
				height: 20px;
				color: white;
			}
		}
	}

	&__body {
		padding: $size-24;
	}

	&__footer {
		display: flex;
		gap: $size-12;
		padding: $size-20 $size-24;
		border-top: 1px solid $color-g-92;

		.cancel-btn {
			flex: 1;
			padding: $size-14;
			background: $color-g-97;
			border: none;
			border-radius: $size-12;
			font-size: $size-14;
			font-weight: $fw-semi-bold;
			color: $color-g-44;
			cursor: pointer;
			transition: all 0.2s ease;

			&:hover {
				background: $color-g-95;
			}
		}

		.save-btn {
			flex: 2;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: $size-8;
			padding: $size-14;
			background: linear-gradient(135deg, $color-sec 0%, $color-sec-s1 100%);
			border: none;
			border-radius: $size-12;
			font-size: $size-14;
			font-weight: $fw-semi-bold;
			color: white;
			cursor: pointer;
			transition: all 0.2s ease;

			svg {
				width: 18px;
				height: 18px;
			}

			&:hover:not(:disabled) {
				transform: translateY(-2px);
				box-shadow: 0 6px 20px rgba($color-sec, 0.4);
			}

			&:disabled {
				opacity: 0.6;
				cursor: not-allowed;
			}

			.loading-state {
				display: flex;
				align-items: center;
				gap: $size-8;

				.spinner {
					width: 18px;
					height: 18px;
					border: 2px solid rgba(255, 255, 255, 0.3);
					border-top-color: white;
					border-radius: 50%;
					animation: spin 0.8s linear infinite;
				}
			}
		}
	}
}

@keyframes spin {
	to { transform: rotate(360deg); }
}

// Vital Selection
.vital-selection {
	margin-bottom: $size-24;

	.selection-label {
		display: block;
		font-size: $size-13;
		font-weight: $fw-semi-bold;
		color: $color-g-44;
		margin-bottom: $size-12;
	}
}

.vital-types {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: $size-12;

	@include responsive(phone) {
		grid-template-columns: 1fr;
	}
}

.vital-type-card {
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: $size-8;
	padding: $size-16;
	background: $color-g-97;
	border: 2px solid transparent;
	border-radius: $size-12;
	cursor: pointer;
	transition: all 0.2s ease;
	text-align: center;

	&:hover {
		background: white;
		border-color: $color-g-90;
	}

	&.selected {
		background: white;
		border-color: $color-sec;
		box-shadow: 0 4px 12px rgba($color-sec, 0.15);
	}

	&__icon {
		width: 40px;
		height: 40px;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;

		svg {
			width: 20px;
			height: 20px;
		}
	}

	&__name {
		font-size: $size-13;
		font-weight: $fw-semi-bold;
		color: $color-black;
	}

	&__range {
		font-size: $size-11;
		color: $color-g-54;
	}

	&__check {
		position: absolute;
		top: $size-8;
		right: $size-8;
		width: 20px;
		height: 20px;
		background: $color-sec;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;

		svg {
			width: 12px;
			height: 12px;
			color: white;
		}
	}

	// Color variants - using subtle backgrounds
	&.vital--temp .vital-type-card__icon { background: rgba($color-pri, 0.1); svg { color: $color-pri; } }
	&.vital--weight .vital-type-card__icon { background: rgba(#8b5cf6, 0.1); svg { color: #8b5cf6; } }
	&.vital--pulse .vital-type-card__icon { background: rgba($color-sec, 0.1); svg { color: $color-sec; } }
	&.vital--sugar .vital-type-card__icon { background: rgba(#3b82f6, 0.1); svg { color: #3b82f6; } }
	&.vital--pressure .vital-type-card__icon { background: rgba(#ec4899, 0.1); svg { color: #ec4899; } }
}

// Selected Vital Display
.selected-vital-display {
	margin-bottom: $size-24;
}

.selected-vital-card {
	display: flex;
	align-items: center;
	gap: $size-16;
	padding: $size-16;
	background: $color-g-97;
	border-radius: $size-12;

	&__icon {
		width: 48px;
		height: 48px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;

		svg {
			width: 24px;
			height: 24px;
		}
	}

	&__info {
		.name {
			display: block;
			font-size: $size-15;
			font-weight: $fw-semi-bold;
			color: $color-black;
		}

		.range {
			font-size: $size-12;
			color: $color-g-54;
		}
	}

	// Color variants - using subtle backgrounds
	&.vital--temp .selected-vital-card__icon { background: rgba($color-pri, 0.1); svg { color: $color-pri; } }
	&.vital--weight .selected-vital-card__icon { background: rgba(#8b5cf6, 0.1); svg { color: #8b5cf6; } }
	&.vital--pulse .selected-vital-card__icon { background: rgba($color-sec, 0.1); svg { color: $color-sec; } }
	&.vital--sugar .selected-vital-card__icon { background: rgba(#3b82f6, 0.1); svg { color: #3b82f6; } }
	&.vital--pressure .selected-vital-card__icon { background: rgba(#ec4899, 0.1); svg { color: #ec4899; } }
}

// Input Section
.input-section {
	.input-label {
		display: block;
		font-size: $size-13;
		font-weight: $fw-semi-bold;
		color: $color-g-44;
		margin-bottom: $size-12;
	}
}

.single-input {
	.input-group {
		display: flex;
		gap: $size-12;
		margin-bottom: $size-12;
	}

	.vital-input {
		flex: 1;
		padding: $size-14 $size-16;
		border: 2px solid $color-g-90;
		border-radius: $size-10;
		font-size: $size-18;
		font-weight: $fw-semi-bold;
		color: $color-black;
		transition: all 0.2s ease;

		&:focus {
			outline: none;
			border-color: $color-sec;
		}

		&::placeholder {
			color: $color-g-77;
			font-weight: $fw-regular;
		}
	}

	.unit-select {
		width: 100px;
		padding: $size-14 $size-12;
		border: 2px solid $color-g-90;
		border-radius: $size-10;
		font-size: $size-14;
		font-weight: $fw-medium;
		color: $color-black;
		background: white;
		cursor: pointer;

		&:focus {
			outline: none;
			border-color: $color-sec;
		}
	}

	.input-hint {
		display: flex;
		align-items: center;
		gap: $size-6;
		font-size: $size-12;
		color: $color-g-54;

		svg {
			width: 14px;
			height: 14px;
			color: #0ea5e9;
		}
	}
}

.bp-input {
	display: flex;
	align-items: flex-end;
	gap: $size-12;

	@include responsive(phone) {
		flex-direction: column;
		align-items: stretch;
	}

	&__group {
		flex: 1;

		label {
			display: block;
			font-size: $size-12;
			color: $color-g-54;
			margin-bottom: $size-8;
		}

		.input-group {
			display: flex;
			gap: $size-8;
		}

		.vital-input {
			flex: 1;
			padding: $size-14 $size-16;
			border: 2px solid $color-g-90;
			border-radius: $size-10;
			font-size: $size-18;
			font-weight: $fw-semi-bold;
			color: $color-black;

			&:focus {
				outline: none;
				border-color: $color-sec;
			}
		}

		.unit-display {
			display: flex;
			align-items: center;
			padding: 0 $size-12;
			background: $color-g-97;
			border-radius: $size-10;
			font-size: $size-13;
			font-weight: $fw-medium;
			color: $color-g-54;
		}
	}

	.bp-divider {
		display: flex;
		align-items: center;
		justify-content: center;
		padding-bottom: $size-12;

		span {
			font-size: $size-24;
			font-weight: $fw-bold;
			color: $color-g-77;
		}

		@include responsive(phone) {
			display: none;
		}
	}
}

// Reading Indicator
.reading-indicator {
	margin-top: $size-20;
	padding: $size-16;
	background: $color-g-97;
	border-radius: $size-12;

	.indicator-bar {
		position: relative;
		height: 8px;
		background: linear-gradient(90deg, #fbbf24, #22c55e, #22c55e, #ef4444);
		border-radius: 4px;
		margin-bottom: $size-8;
	}

	.indicator-marker {
		position: absolute;
		top: -4px;
		width: 16px;
		height: 16px;
		background: white;
		border: 3px solid $color-black;
		border-radius: 50%;
		transform: translateX(-50%);
		transition: left 0.3s ease;
	}

	.indicator-labels {
		display: flex;
		justify-content: space-between;
		font-size: $size-11;
		color: $color-g-54;
		margin-bottom: $size-12;
	}

	.indicator-status {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: $size-6;
		font-size: $size-13;
		font-weight: $fw-semi-bold;

		svg {
			width: 16px;
			height: 16px;
		}
	}

	&.status--normal .indicator-status {
		color: #15803d;
	}

	&.status--high .indicator-status {
		color: #dc2626;
	}

	&.status--low .indicator-status {
		color: #a16207;
	}
}

// Date & Time Section
.datetime-section {
	margin-top: $size-24;
	padding-top: $size-20;
	border-top: 1px solid $color-g-92;

	.input-label {
		display: block;
		font-size: $size-13;
		font-weight: $fw-semi-bold;
		color: $color-g-44;
		margin-bottom: $size-12;
	}
}

.datetime-inputs {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: $size-16;

	@include responsive(phone) {
		grid-template-columns: 1fr;
		gap: $size-12;
	}
}

.datetime-group {
	label {
		display: block;
		font-size: $size-12;
		color: $color-g-54;
		margin-bottom: $size-8;

		.required {
			color: #ef4444;
		}

		.optional {
			color: $color-g-77;
			font-weight: $fw-regular;
		}
	}

	.input-wrapper {
		position: relative;
		display: flex;
		align-items: center;

		svg {
			position: absolute;
			left: $size-12;
			width: 18px;
			height: 18px;
			color: $color-g-54;
			pointer-events: none;
		}

		.datetime-input {
			width: 100%;
			padding: $size-12 $size-12 $size-12 $size-40;
			border: 2px solid $color-g-90;
			border-radius: $size-10;
			font-size: $size-14;
			font-weight: $fw-medium;
			color: $color-black;
			background: white;
			transition: all 0.2s ease;

			&:focus {
				outline: none;
				border-color: $color-sec;
			}

			&::-webkit-calendar-picker-indicator {
				cursor: pointer;
				opacity: 0.6;

				&:hover {
					opacity: 1;
				}
			}
		}
	}
}

// Health Score Section
.health-score-section {
	background: white;
	border-radius: $size-20;
	padding: $size-24;
	border: 2px solid $color-g-92;

	@include responsive(phone) {
		padding: $size-20;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: $size-24;

		@include responsive(phone) {
			flex-direction: column;
			gap: $size-12;
		}
	}

	.score-type-toggle {
		display: flex;
		gap: $size-8;
		margin-bottom: $size-20;
		padding: $size-4;
		background: $color-g-97;
		border-radius: $size-12;
		width: fit-content;

		@include responsive(phone) {
			width: 100%;
		}

		.toggle-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: $size-6;
			padding: $size-10 $size-20;
			border: none;
			border-radius: $size-10;
			font-size: $size-13;
			font-weight: $fw-semi-bold;
			color: $color-g-54;
			background: transparent;
			cursor: pointer;
			transition: all 0.2s ease;

			@include responsive(phone) {
				flex: 1;
				padding: $size-10 $size-16;
			}

			svg {
				width: 16px;
				height: 16px;
			}

			&:hover:not(.active) {
				color: $color-g-44;
				background: rgba(white, 0.5);
			}

			&.active {
				background: white;
				color: $color-sec;
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

				svg {
					color: $color-sec;
				}
			}
		}
	}
}

.view-details-link {
	display: flex;
	align-items: center;
	gap: $size-6;
	font-size: $size-13;
	font-weight: $fw-semi-bold;
	color: $color-sec;
	text-decoration: none;
	transition: all 0.2s ease;

	svg {
		width: 16px;
		height: 16px;
		transition: transform 0.2s ease;
	}

	&:hover {
		color: $color-sec-s1;

		svg {
			transform: translateX(4px);
		}
	}
}

.health-score-card {
	display: flex;
	gap: $size-32;

	@include responsive(tab-portrait) {
		flex-direction: column;
		gap: $size-24;
	}

	&__main {
		display: flex;
		align-items: center;
		gap: $size-28;
		flex: 1;

		@include responsive(phone) {
			flex-direction: column;
			text-align: center;
		}
	}

	&__breakdown {
		flex: 1;
		padding: $size-20;
		background: $color-g-97;
		border-radius: $size-16;
		min-width: 280px;

		@include responsive(tab-portrait) {
			min-width: auto;
		}
	}
}

.score-circle {
	position: relative;
	width: 140px;
	height: 140px;
	flex-shrink: 0;

	&__inner {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		z-index: 1;
	}

	.score-value {
		font-size: $size-40;
		font-weight: $fw-bold;
		line-height: 1;
	}

	.score-label {
		font-size: $size-12;
		font-weight: $fw-medium;
		color: $color-g-54;
		margin-top: $size-4;
	}

	// Color variants based on health score
	&.health-excellent .score-value { color: #10b981; }
	&.health-excellent .score-ring__progress { stroke: #10b981; }

	&.health-good .score-value { color: #3b82f6; }
	&.health-good .score-ring__progress { stroke: #3b82f6; }

	&.health-fair .score-value { color: #f59e0b; }
	&.health-fair .score-ring__progress { stroke: #f59e0b; }

	&.health-poor .score-value { color: #ef4444; }
	&.health-poor .score-ring__progress { stroke: #ef4444; }
}

.score-ring {
	width: 100%;
	height: 100%;
	transform: rotate(-90deg);

	&__bg {
		fill: none;
		stroke: $color-g-90;
		stroke-width: 10;
	}

	&__progress {
		fill: none;
		stroke: #10b981;
		stroke-width: 10;
		stroke-linecap: round;
		stroke-dasharray: 339.29;
		transition: stroke-dashoffset 0.8s ease-out;
	}
}

.score-info {
	display: flex;
	flex-direction: column;
	gap: $size-8;

	.score-status {
		font-size: $size-20;
		font-weight: $fw-bold;
		color: $color-black;
		margin: 0;

		@include responsive(phone) {
			font-size: $size-18;
		}
	}

	.score-description {
		font-size: $size-14;
		color: $color-g-54;
		margin: 0;
		line-height: 1.5;
		max-width: 280px;

		@include responsive(phone) {
			font-size: $size-13;
		}
	}

	.score-updated {
		display: flex;
		align-items: center;
		gap: $size-6;
		font-size: $size-12;
		color: $color-g-77;
		margin-top: $size-4;

		@include responsive(phone) {
			justify-content: center;
		}

		svg {
			width: 14px;
			height: 14px;
		}
	}
}

.breakdown-title {
	font-size: $size-14;
	font-weight: $fw-semi-bold;
	color: $color-black;
	margin-bottom: $size-16;
}

.breakdown-items {
	display: flex;
	flex-direction: column;
	gap: $size-12;
}

.breakdown-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: $size-12;
	background: white;
	border-radius: $size-10;

	&__label {
		display: flex;
		align-items: center;
		gap: $size-8;
		font-size: $size-13;
		font-weight: $fw-medium;
		color: $color-black;

		svg {
			width: 18px;
			height: 18px;
			color: $color-g-54;
		}
	}

	&__status {
		font-size: $size-12;
		font-weight: $fw-semi-bold;
		padding: $size-4 $size-10;
		border-radius: 20px;

		&.breakdown-status--normal {
			background: rgba(16, 185, 129, 0.1);
			color: #059669;
		}

		&.breakdown-status--warning {
			background: rgba(245, 158, 11, 0.1);
			color: #b45309;
		}

		&.breakdown-status--danger {
			background: rgba(239, 68, 68, 0.1);
			color: #dc2626;
		}

		&.breakdown-status--unknown {
			background: $color-g-92;
			color: $color-g-54;
		}
	}
}

// Health Score Locked State
.health-score-locked {
	display: flex;
	gap: $size-24;

	@include responsive(tab-portrait) {
		flex-direction: column;
	}
}

.locked-card {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: $size-32;
	background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
	border: 2px dashed $color-g-77;
	border-radius: $size-20;
	text-align: center;
	min-width: 280px;

	@include responsive(tab-portrait) {
		min-width: auto;
	}

	&__icon {
		width: 64px;
		height: 64px;
		background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: $size-16;

		svg {
			width: 32px;
			height: 32px;
			color: white;
		}
	}

	&__content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $size-8;
	}

	&__title {
		font-size: $size-18;
		font-weight: $fw-bold;
		color: $color-black;
		margin: 0;
	}

	&__desc {
		font-size: $size-13;
		color: $color-g-54;
		margin: 0;
		max-width: 220px;
	}
}

.locked-score {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-bottom: $size-12;

	&__value {
		font-size: $size-48;
		font-weight: $fw-bold;
		color: $color-g-77;
		line-height: 1;
	}

	&__label {
		font-size: $size-12;
		font-weight: $fw-medium;
		color: $color-g-54;
		margin-top: $size-4;
	}
}

.unlock-checklist {
	flex: 1;
	padding: $size-24;
	background: white;
	border: 2px solid $color-g-92;
	border-radius: $size-20;
}

.checklist-progress {
	margin-bottom: $size-20;

	&__bar {
		height: 8px;
		background: $color-g-92;
		border-radius: 4px;
		overflow: hidden;
		margin-bottom: $size-8;
	}

	&__fill {
		height: 100%;
		background: linear-gradient(90deg, $color-sec 0%, $color-sec-s1 100%);
		border-radius: 4px;
		transition: width 0.5s ease;
	}

	&__text {
		font-size: $size-12;
		font-weight: $fw-medium;
		color: $color-g-54;
	}
}

.checklist-items {
	display: flex;
	flex-direction: column;
	gap: $size-12;
}

.checklist-item {
	display: flex;
	align-items: center;
	gap: $size-16;
	padding: $size-16;
	background: $color-g-97;
	border-radius: $size-12;
	transition: all 0.3s ease;

	&.completed {
		background: rgba(16, 185, 129, 0.08);

		.checklist-item__check {
			background: #10b981;
		}

		.checklist-item__label {
			text-decoration: line-through;
			color: $color-g-54;
		}
	}

	&__check {
		width: 40px;
		height: 40px;
		background: $color-g-77;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;

		svg {
			width: 20px;
			height: 20px;
			color: white;
		}
	}

	&__content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: $size-2;
	}

	&__label {
		font-size: $size-14;
		font-weight: $fw-semi-bold;
		color: $color-black;
	}

	&__desc {
		font-size: $size-12;
		color: $color-g-54;
	}

	&__action {
		display: flex;
		align-items: center;
		gap: $size-6;
		padding: $size-8 $size-16;
		background: linear-gradient(135deg, $color-sec 0%, $color-sec-s1 100%);
		color: white;
		border: none;
		border-radius: $size-8;
		font-size: $size-12;
		font-weight: $fw-semi-bold;
		text-decoration: none;
		cursor: pointer;
		transition: all 0.2s ease;

		svg {
			width: 14px;
			height: 14px;
		}

		&:hover {
			transform: translateY(-2px);
			box-shadow: 0 4px 12px rgba($color-sec, 0.3);
		}
	}

	&__done {
		svg {
			width: 24px;
			height: 24px;
			color: #10b981;
		}
	}
}

// Suggestions Section
.suggestions-section {
	margin-top: $size-20;
	padding-top: $size-16;
	border-top: 1px solid $color-g-90;
}

.suggestions-title {
	font-size: $size-13;
	font-weight: $fw-semi-bold;
	color: $color-g-54;
	margin-bottom: $size-12;
}

.suggestions-list {
	display: flex;
	flex-direction: column;
	gap: $size-8;
}

.suggestion-item {
	display: flex;
	align-items: center;
	gap: $size-12;
	padding: $size-12;
	background: white;
	border-radius: $size-10;
	border-left: 3px solid $color-g-77;

	&--warning {
		border-left-color: $color-pri;

		.suggestion-item__icon {
			background: rgba($color-pri, 0.1);
			color: $color-pri;
		}

		.suggestion-item__points {
			color: $color-pri-s1;
		}
	}

	&--error {
		border-left-color: #ef4444;

		.suggestion-item__icon {
			background: rgba(239, 68, 68, 0.1);
			color: #dc2626;
		}

		.suggestion-item__points {
			color: #dc2626;
		}
	}

	&__icon {
		width: 32px;
		height: 32px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;

		svg {
			width: 16px;
			height: 16px;
		}
	}

	&__content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: $size-2;
		min-width: 0;
	}

	&__title {
		font-size: $size-12;
		font-weight: $fw-semi-bold;
		color: $color-black;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	&__action {
		font-size: $size-11;
		color: $color-g-54;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	&__points {
		font-size: $size-12;
		font-weight: $fw-bold;
		flex-shrink: 0;
	}
}

// Premium Health Score Styles
.health-score-premium {
	.premium-badge-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: $size-16;

		@include responsive(phone) {
			flex-direction: column;
			align-items: flex-start;
			gap: $size-8;
		}
	}

	.premium-badge {
		display: inline-flex;
		align-items: center;
		gap: $size-6;
		padding: $size-6 $size-14;
		background: rgba($color-pri, 0.15);
		color: $color-pri;
		font-size: $size-12;
		font-weight: $fw-bold;
		border-radius: 20px;
		text-transform: uppercase;
		letter-spacing: 0.5px;

		svg {
			width: 14px;
			height: 14px;
		}
	}

	.premium-date {
		font-size: $size-12;
		color: $color-g-54;
	}
}

.premium-score-card {
	background: linear-gradient(135deg, $color-pri-t4 0%, $color-pri-t3 100%);
	border: 1px solid $color-pri-t2;
	border-radius: $size-20;
	padding: $size-24;
	margin-bottom: $size-16;

	@include responsive(phone) {
		padding: $size-16;
	}
}

.premium-score-main {
	display: flex;
	align-items: center;
	gap: $size-24;
	margin-bottom: $size-20;

	@include responsive(phone) {
		flex-direction: column;
		text-align: center;
		gap: $size-16;
	}

	.score-circle.premium {
		.score-ring__bg {
			stroke: rgba(251, 191, 36, 0.3);
		}
	}
}

.premium-score-info {
	flex: 1;

	@include responsive(phone) {
		width: 100%;
	}
}

.premium-status-badge {
	display: inline-block;
	padding: $size-6 $size-14;
	border-radius: $size-8;
	font-size: $size-13;
	font-weight: $fw-semi-bold;
	margin-bottom: $size-8;

	&.status-excellent {
		background: rgba(16, 185, 129, 0.15);
		color: #059669;
	}

	&.status-good {
		background: rgba(59, 130, 246, 0.15);
		color: #2563eb;
	}

	&.status-fair {
		background: rgba(245, 158, 11, 0.15);
		color: #d97706;
	}

	&.status-needs-attention {
		background: rgba(249, 115, 22, 0.15);
		color: #ea580c;
	}

	&.status-poor {
		background: rgba(239, 68, 68, 0.15);
		color: #dc2626;
	}
}

.premium-summary {
	font-size: $size-14;
	color: #78350f;
	margin: 0;
	line-height: 1.5;

	@include responsive(phone) {
		font-size: $size-13;
	}
}

.premium-domains {
	border-top: 1px solid rgba(251, 191, 36, 0.4);
	padding-top: $size-16;
}

.domains-title {
	font-size: $size-12;
	font-weight: $fw-semi-bold;
	color: #92400e;
	margin-bottom: $size-12;
	text-transform: uppercase;
	letter-spacing: 0.5px;
}

.domains-grid {
	display: grid;
	grid-template-columns: repeat(6, 1fr);
	gap: $size-8;

	@include responsive(tab-portrait) {
		grid-template-columns: repeat(3, 1fr);
	}

	@include responsive(phone) {
		grid-template-columns: repeat(3, 1fr);
	}
}

.domain-mini {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: $size-6;
	padding: $size-12 $size-8;
	background: white;
	border-radius: $size-10;
	border: 2px solid transparent;
	min-width: 80px;

	&.status-excellent {
		border-color: #10b981;
		.domain-mini-icon { color: #10b981; }
		.domain-mini-score { color: #10b981; }
	}

	&.status-good {
		border-color: #3b82f6;
		.domain-mini-icon { color: #3b82f6; }
		.domain-mini-score { color: #3b82f6; }
	}

	&.status-fair {
		border-color: #f59e0b;
		.domain-mini-icon { color: #f59e0b; }
		.domain-mini-score { color: #f59e0b; }
	}

	&.status-needs-attention {
		border-color: #f97316;
		.domain-mini-icon { color: #f97316; }
		.domain-mini-score { color: #f97316; }
	}

	&.status-poor {
		border-color: #ef4444;
		.domain-mini-icon { color: #ef4444; }
		.domain-mini-score { color: #ef4444; }
	}

	.domain-mini-header {
		display: flex;
		align-items: center;
		gap: $size-6;
	}

	.domain-mini-icon {
		width: 18px;
		height: 18px;
	}

	.domain-mini-score {
		font-size: $size-16;
		font-weight: $fw-bold;
	}

	.domain-mini-name {
		font-size: $size-11;
		color: $color-g-54;
		text-align: center;
		font-weight: $fw-medium;
	}
}

.premium-actions {
	display: flex;
	gap: $size-12;
	width: 100%;

	@media (max-width: 480px) {
		flex-direction: column;
		gap: $size-8;
	}
}

.view-report-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: $size-8;
	flex: 1;
	padding: $size-14;
	background: linear-gradient(135deg, $color-pri 0%, $color-pri-s1 100%);
	color: white;
	border: none;
	border-radius: $size-12;
	font-size: $size-14;
	font-weight: $fw-semi-bold;
	text-decoration: none;
	transition: all 0.3s ease;

	svg {
		width: 18px;
		height: 18px;
	}

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba($color-pri, 0.4);
	}
}

.view-history-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: $size-8;
	flex: 1;
	padding: $size-14;
	background: white;
	color: $color-sec;
	border: 2px solid $color-sec;
	border-radius: $size-12;
	font-size: $size-14;
	font-weight: $fw-semi-bold;
	text-decoration: none;
	transition: all 0.3s ease;

	svg {
		width: 18px;
		height: 18px;
	}

	&:hover {
		background: $color-sec;
		color: white;
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba($color-sec, 0.3);
	}
}

// Basic Health Score Styles
.health-score-basic {
	.basic-badge-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: $size-16;
	}

	.basic-badge {
		display: inline-flex;
		align-items: center;
		gap: $size-6;
		padding: $size-6 $size-14;
		background: $color-g-92;
		color: $color-g-44;
		font-size: $size-12;
		font-weight: $fw-semi-bold;
		border-radius: 20px;

		svg {
			width: 14px;
			height: 14px;
		}
	}

	.basic-label {
		font-size: $size-11;
		font-weight: $fw-bold;
		color: $color-g-54;
		background: $color-g-95;
		padding: $size-4 $size-10;
		border-radius: $size-6;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
}

// Upgrade CTA Styles
.upgrade-cta {
	margin-top: $size-20;
	padding: $size-20;
	background: linear-gradient(135deg, $color-sec-t4 0%, white 100%);
	border: 1px solid $color-sec-t3;
	border-radius: $size-16;

	@include responsive(phone) {
		padding: $size-16;
	}

	&__content {
		display: flex;
		align-items: flex-start;
		gap: $size-16;
		margin-bottom: $size-16;

		@include responsive(phone) {
			flex-direction: column;
			align-items: center;
			text-align: center;
		}
	}

	&__icon {
		width: 48px;
		height: 48px;
		background: rgba($color-sec, 0.1);
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;

		svg {
			width: 24px;
			height: 24px;
			color: $color-sec;
		}
	}

	&__text {
		flex: 1;

		h4 {
			font-size: $size-16;
			font-weight: $fw-bold;
			color: $color-sec-s1;
			margin: 0 0 $size-6;
		}

		p {
			font-size: $size-13;
			color: $color-g-54;
			margin: 0;
			line-height: 1.5;
		}
	}

	&__features {
		display: flex;
		flex-wrap: wrap;
		gap: $size-12;
		margin-bottom: $size-16;

		@include responsive(phone) {
			justify-content: center;
		}

		span {
			display: inline-flex;
			align-items: center;
			gap: $size-4;
			font-size: $size-12;
			color: $color-sec;
			font-weight: $fw-medium;

			svg {
				width: 14px;
				height: 14px;
			}
		}
	}
}

.upgrade-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: $size-8;
	width: 100%;
	padding: $size-14;
	background: linear-gradient(135deg, $color-sec 0%, $color-sec-s1 100%);
	color: white;
	border: none;
	border-radius: $size-12;
	font-size: $size-14;
	font-weight: $fw-semi-bold;
	text-decoration: none;
	transition: all 0.3s ease;

	svg {
		width: 18px;
		height: 18px;
	}

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba($color-sec, 0.4);
	}
}
</style>
