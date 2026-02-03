<template>
	<div class="page-content">
		<top-bar showButtons type="title-only" title="Patient Profile" @open-side-nav="$emit('openSideNav')" />

		<div class="page-content__body">
			<!-- Hero Banner -->
			<div class="hero-banner" v-if="patient">
				<div class="hero-top">
					<button @click="goBack" class="back-link">
						<v-icon name="hi-arrow-left" scale="0.9" />
						<span>Back to Patients</span>
					</button>
					<button
						class="star-btn"
						:class="{ starred: isStarred }"
						@click="toggleStar"
					>
						<v-icon :name="isStarred ? 'hi-solid-star' : 'hi-star'" scale="0.9" />
						<span>{{ isStarred ? 'Starred' : 'Star Patient' }}</span>
					</button>
				</div>

				<div class="hero-main">
					<div class="patient-header">
						<div class="patient-avatar">
							<rc-avatar
								size="lg"
								borderless
								:firstName="patient.profile?.first_name || ''"
								:lastName="patient.profile?.last_name || ''"
								:modelValue="getProfileImage(patient)"
							/>
						</div>
						<div class="patient-info">
							<span class="patient-badge">Patient Dashboard</span>
							<h1 class="patient-name">{{ getFullName(patient) }}</h1>
							<div class="patient-meta">
								<span v-if="patient.profile?.gender" class="meta-item">
									<v-icon name="hi-user" scale="0.7" />
									{{ patient.profile.gender }}
								</span>
								<span v-if="patient.profile?.date_of_birth" class="meta-item">
									<v-icon name="hi-calendar" scale="0.7" />
									{{ calculateAge(patient.profile.date_of_birth) }} years old
								</span>
								<span v-if="getEmail(patient)" class="meta-item">
									<v-icon name="hi-mail" scale="0.7" />
									{{ getEmail(patient) }}
								</span>
								<span v-if="getPhone(patient)" class="meta-item">
									<v-icon name="hi-phone" scale="0.7" />
									{{ getPhone(patient) }}
								</span>
							</div>
							<div v-if="patient.profile?.address" class="patient-address">
								<v-icon name="hi-location-marker" scale="0.7" />
								{{ formatAddress(patient.profile.address) }}
							</div>
						</div>
					</div>

					<div class="hero-scores" v-if="hasHealthScores">
						<div class="score-card" :class="getScoreClass(basicHealthScore)">
							<span class="score-label">Basic Score</span>
							<span class="score-value">{{ basicHealthScore ?? '-' }}</span>
						</div>
						<div class="score-card advanced" :class="getScoreClass(advancedHealthScore)">
							<span class="score-label">Advanced Score</span>
							<span class="score-value">{{ advancedHealthScore ?? '-' }}</span>
						</div>
						<div v-if="riskLevel" class="score-card risk" :class="getRiskClass(riskLevel)">
							<span class="score-label">Risk Level</span>
							<span class="score-value">{{ formatRiskLevel(riskLevel) }}</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Quick Actions -->
			<div class="quick-actions" v-if="patient">
				<div class="actions-group primary-actions">
					<button class="action-btn primary" @click="bookAppointment">
						<v-icon name="hi-calendar" scale="1" />
						<span>Book Appointment</span>
					</button>
					<button class="action-btn" @click="writePrescription">
						<v-icon name="ri-capsule-fill" scale="1" />
						<span>Write Prescription</span>
					</button>
					<button class="action-btn" @click="addClinicalNote">
						<v-icon name="hi-document-text" scale="1" />
						<span>Add Clinical Note</span>
					</button>
				</div>
				<div class="actions-group contact-actions">
					<button v-if="getPhone(patient)" class="contact-btn call" @click="callPatient" title="Call Patient">
						<v-icon name="hi-phone" scale="1" />
					</button>
					<button v-if="getEmail(patient)" class="contact-btn email" @click="emailPatient" title="Send Email">
						<v-icon name="hi-mail" scale="1" />
					</button>
					<button class="contact-btn message" @click="sendMessage" title="Send Message">
						<v-icon name="hi-chat-alt-2" scale="1" />
					</button>
				</div>
			</div>

			<!-- Patient Stats Summary -->
			<div class="stats-summary" v-if="patient">
				<div class="stat-card-mini">
					<div class="stat-icon blue">
						<v-icon name="hi-calendar" scale="0.9" />
					</div>
					<div class="stat-info">
						<span class="stat-value">{{ patientStats?.totalAppointments || patient.stats?.totalAppointments || 0 }}</span>
						<span class="stat-label">Total Visits</span>
					</div>
				</div>
				<div class="stat-card-mini">
					<div class="stat-icon green">
						<v-icon name="hi-check-circle" scale="0.9" />
					</div>
					<div class="stat-info">
						<span class="stat-value">{{ patientStats?.completedAppointments || patient.stats?.completedAppointments || 0 }}</span>
						<span class="stat-label">Completed</span>
					</div>
				</div>
				<div class="stat-card-mini">
					<div class="stat-icon purple">
						<v-icon name="ri-capsule-line" scale="0.9" />
					</div>
					<div class="stat-info">
						<span class="stat-value">{{ patientStats?.prescriptionCount || patient.stats?.prescriptionCount || 0 }}</span>
						<span class="stat-label">Prescriptions</span>
					</div>
				</div>
				<div class="stat-card-mini">
					<div class="stat-icon orange">
						<v-icon name="hi-clock" scale="0.9" />
					</div>
					<div class="stat-info">
						<span class="stat-value">{{ formatLastVisitShort(patientStats?.lastVisit || patient.stats?.lastVisit) }}</span>
						<span class="stat-label">Last Visit</span>
					</div>
				</div>
			</div>

			<!-- Skeleton Loading State -->
			<div v-if="loading && !patient" class="skeleton-loading">
				<!-- Hero Skeleton -->
				<div class="hero-banner skeleton">
					<div class="hero-top">
						<div class="skeleton-line back-btn"></div>
						<div class="skeleton-line star-btn"></div>
					</div>
					<div class="hero-main">
						<div class="patient-header">
							<div class="skeleton-avatar"></div>
							<div class="patient-info">
								<div class="skeleton-line badge"></div>
								<div class="skeleton-line name"></div>
								<div class="skeleton-line meta"></div>
								<div class="skeleton-line address"></div>
							</div>
						</div>
						<div class="hero-scores">
							<div class="skeleton-score"></div>
							<div class="skeleton-score"></div>
							<div class="skeleton-score"></div>
						</div>
					</div>
				</div>
				<!-- Quick Actions Skeleton -->
				<div class="quick-actions skeleton">
					<div class="skeleton-action"></div>
					<div class="skeleton-action"></div>
					<div class="skeleton-action"></div>
				</div>
				<!-- Tabs Skeleton -->
				<div class="tabs-navigation skeleton">
					<div class="skeleton-tab" v-for="n in 6" :key="n"></div>
				</div>
				<!-- Content Skeleton -->
				<div class="tab-content skeleton">
					<div class="skeleton-card"></div>
					<div class="skeleton-card"></div>
				</div>
			</div>

			<!-- Error State -->
			<div v-else-if="error" class="error-state">
				<div class="error-illustration">
					<v-icon name="hi-exclamation-circle" scale="3" class="error-icon" />
				</div>
				<h2>Unable to Load Patient</h2>
				<p>{{ error }}</p>
				<button @click="fetchPatientData" class="retry-btn">
					<v-icon name="hi-refresh" scale="0.9" />
					Try Again
				</button>
			</div>

			<!-- Main Content -->
			<div v-else class="dashboard-content">
				<!-- Tab Navigation -->
				<div class="tabs-navigation">
					<button
						v-for="tab in tabs"
						:key="tab.value"
						class="tab-btn"
						:class="{ active: activeTab === tab.value }"
						@click="switchTab(tab.value)"
					>
						<v-icon :name="tab.icon" scale="0.9" />
						<span>{{ tab.label }}</span>
						<span v-if="getTabCount(tab.value)" class="tab-count">{{ getTabCount(tab.value) }}</span>
					</button>
				</div>

				<!-- Tab Content -->
				<div class="tab-content">
					<!-- Overview Tab -->
					<div v-if="activeTab === 'overview'" class="overview-tab">
						<div class="overview-grid">
							<!-- Vitals Card -->
							<div class="info-card">
								<div class="card-header">
									<h3><v-icon name="hi-heart" scale="0.9" /> Recent Vitals</h3>
									<button class="view-all-btn" @click="switchTab('health')">View All</button>
								</div>
								<div class="card-body" v-if="hasVitals">
									<div class="vitals-grid">
										<div class="vital-item" v-if="overview?.recentVitals?.blood_pressure?.length">
											<span class="vital-type">Blood Pressure</span>
											<span class="vital-value">{{ getLatestVital(overview.recentVitals.blood_pressure)?.value || '-' }} <small>{{ getLatestVital(overview.recentVitals.blood_pressure)?.unit || '' }}</small></span>
											<span class="vital-date">{{ formatRelativeTime(getLatestVital(overview.recentVitals.blood_pressure)?.updatedAt) }}</span>
										</div>
										<div class="vital-item" v-if="overview?.recentVitals?.pulse_rate?.length">
											<span class="vital-type">Pulse Rate</span>
											<span class="vital-value">{{ getLatestVital(overview.recentVitals.pulse_rate)?.value || '-' }} <small>{{ getLatestVital(overview.recentVitals.pulse_rate)?.unit || '' }}</small></span>
											<span class="vital-date">{{ formatRelativeTime(getLatestVital(overview.recentVitals.pulse_rate)?.updatedAt) }}</span>
										</div>
										<div class="vital-item" v-if="overview?.recentVitals?.body_temp?.length">
											<span class="vital-type">Temperature</span>
											<span class="vital-value">{{ getLatestVital(overview.recentVitals.body_temp)?.value || '-' }} <small>{{ getLatestVital(overview.recentVitals.body_temp)?.unit || '' }}</small></span>
											<span class="vital-date">{{ formatRelativeTime(getLatestVital(overview.recentVitals.body_temp)?.updatedAt) }}</span>
										</div>
										<div class="vital-item" v-if="overview?.recentVitals?.blood_sugar_level?.length">
											<span class="vital-type">Blood Sugar</span>
											<span class="vital-value">{{ getLatestVital(overview.recentVitals.blood_sugar_level)?.value || '-' }} <small>{{ getLatestVital(overview.recentVitals.blood_sugar_level)?.unit || '' }}</small></span>
											<span class="vital-date">{{ formatRelativeTime(getLatestVital(overview.recentVitals.blood_sugar_level)?.updatedAt) }}</span>
										</div>
									</div>
								</div>
								<div v-else class="card-empty">
									<p>No vitals recorded</p>
								</div>
							</div>

							<!-- Medical History Card -->
							<div class="info-card">
								<div class="card-header">
									<h3><v-icon name="hi-clipboard-list" scale="0.9" /> Medical History</h3>
								</div>
								<div class="card-body" v-if="hasMedicalHistory || hasPreExistingConditions">
									<div class="history-section" v-if="patient?.pre_existing_conditions?.length">
										<h4>Pre-existing Conditions</h4>
										<div class="tag-list">
											<span class="tag" v-for="cond in patient.pre_existing_conditions" :key="cond.name || cond">{{ cond.name || cond }}</span>
										</div>
									</div>
									<div class="history-section" v-if="patient.profile?.medical_history?.conditions?.length">
										<h4>Conditions</h4>
										<div class="tag-list">
											<span class="tag" v-for="cond in patient.profile.medical_history.conditions" :key="cond">{{ cond }}</span>
										</div>
									</div>
									<div class="history-section" v-if="patient.profile?.medical_history?.allergies?.length">
										<h4>Allergies</h4>
										<div class="tag-list warning">
											<span class="tag" v-for="allergy in patient.profile.medical_history.allergies" :key="allergy">{{ allergy }}</span>
										</div>
									</div>
									<div class="history-section" v-if="patient.profile?.medical_history?.medications?.length">
										<h4>Current Medications</h4>
										<div class="tag-list">
											<span class="tag" v-for="med in patient.profile.medical_history.medications" :key="med">{{ med }}</span>
										</div>
									</div>
								</div>
								<div v-else class="card-empty">
									<p>No medical history recorded</p>
								</div>
							</div>

							<!-- Recent Checkups Card -->
							<div class="info-card">
								<div class="card-header">
									<h3><v-icon name="hi-clipboard-check" scale="0.9" /> Recent Health Checkups</h3>
									<button class="view-all-btn" @click="switchTab('health')">View All</button>
								</div>
								<div class="card-body" v-if="healthRecords?.checkups?.length">
									<div class="checkups-list">
										<div class="checkup-item" v-for="checkup in healthRecords.checkups.slice(0, 3)" :key="checkup._id || checkup.id">
											<div class="checkup-icon">
												<v-icon name="hi-document-text" scale="0.9" />
											</div>
											<div class="checkup-content">
												<span class="checkup-date">{{ formatDate(checkup.date || checkup.created_at) }}</span>
												<span class="checkup-symptoms">{{ getCheckupSymptoms(checkup) }}</span>
												<span v-if="checkup.conditions?.length" class="checkup-result">
													<v-icon name="hi-arrow-right" scale="0.6" />
													{{ checkup.conditions[0]?.name || checkup.conditions[0]?.common_name || 'Analysis completed' }}
												</span>
											</div>
											<div class="checkup-triage" :class="getTriageClass(checkup.triage_level)">
												{{ formatTriageLabel(checkup.triage_level) }}
											</div>
										</div>
									</div>
								</div>
								<div v-else class="card-empty">
									<p>No health checkups recorded</p>
								</div>
							</div>

							<!-- Statistics Card -->
							<div class="info-card">
								<div class="card-header">
									<h3><v-icon name="hi-chart-bar" scale="0.9" /> Statistics</h3>
								</div>
								<div class="card-body" v-if="patientStats || overview?.stats">
									<div class="stats-grid">
										<div class="stat-item">
											<span class="stat-number">{{ patientStats?.totalAppointments || 0 }}</span>
											<span class="stat-label">Appointments</span>
										</div>
										<div class="stat-item">
											<span class="stat-number">{{ patientStats?.prescriptionCount || 0 }}</span>
											<span class="stat-label">Prescriptions</span>
										</div>
										<div class="stat-item">
											<span class="stat-number">{{ patientStats?.healthCheckupCount || overview?.stats?.totalCheckups || 0 }}</span>
											<span class="stat-label">Health Checkups</span>
										</div>
										<div class="stat-item">
											<span class="stat-number small">{{ formatDate(patientStats?.lastVisit || overview?.stats?.last_visit) || 'N/A' }}</span>
											<span class="stat-label">Last Visit</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Health Scores Tab -->
					<div v-if="activeTab === 'scores'" class="scores-tab">
						<div class="scores-grid">
							<!-- Basic Health Score Card -->
							<div class="score-card-large">
								<div class="card-accent basic"></div>
								<div class="card-header">
									<div class="header-left">
										<div class="header-icon basic">
											<v-icon name="hi-heart" scale="1.2" />
										</div>
										<div>
											<h3>Basic Health Score</h3>
											<span v-if="healthScoresData.basic?.updated_at" class="card-date">
												Updated {{ formatDate(healthScoresData.basic.updated_at) }}
											</span>
										</div>
									</div>
								</div>
								<div class="card-body" v-if="healthScoresData.basic?.score !== null && healthScoresData.basic?.score !== undefined">
									<div class="score-visual">
										<svg class="score-ring-svg" viewBox="0 0 120 120">
											<circle class="ring-bg" cx="60" cy="60" r="52" />
											<circle
												class="ring-progress"
												:class="getScoreClassForRing(healthScoresData.basic.score)"
												cx="60" cy="60" r="52"
												:style="{ strokeDashoffset: getStrokeDashoffset(healthScoresData.basic.score) }"
											/>
										</svg>
										<div class="score-center">
											<span class="big-score">{{ healthScoresData.basic.score }}</span>
											<span class="score-max">of 100</span>
										</div>
									</div>
									<div class="score-status" :class="getScoreClassForRing(healthScoresData.basic.score)">
										{{ healthScoresData.basic.status || getScoreLabelText(healthScoresData.basic.score) }}
									</div>

									<!-- Breakdown -->
									<div class="breakdown" v-if="healthScoresData.basic?.breakdown">
										<h4>Score Breakdown</h4>
										<div class="breakdown-items">
											<div class="breakdown-item" v-if="healthScoresData.basic.breakdown.bmi">
												<div class="item-left">
													<span class="item-dot" :class="healthScoresData.basic.breakdown.bmi.status"></span>
													<span class="item-label">BMI</span>
												</div>
												<span class="item-value" :class="healthScoresData.basic.breakdown.bmi.status">
													{{ healthScoresData.basic.breakdown.bmi.message }}
												</span>
											</div>
											<div class="breakdown-item" v-if="healthScoresData.basic.breakdown.bloodPressure">
												<div class="item-left">
													<span class="item-dot" :class="healthScoresData.basic.breakdown.bloodPressure.status"></span>
													<span class="item-label">Blood Pressure</span>
												</div>
												<span class="item-value" :class="healthScoresData.basic.breakdown.bloodPressure.status">
													{{ healthScoresData.basic.breakdown.bloodPressure.message }}
												</span>
											</div>
											<div class="breakdown-item" v-if="healthScoresData.basic.breakdown.pulseRate">
												<div class="item-left">
													<span class="item-dot" :class="healthScoresData.basic.breakdown.pulseRate.status"></span>
													<span class="item-label">Pulse Rate</span>
												</div>
												<span class="item-value" :class="healthScoresData.basic.breakdown.pulseRate.status">
													{{ healthScoresData.basic.breakdown.pulseRate.message }}
												</span>
											</div>
											<div class="breakdown-item" v-if="healthScoresData.basic.breakdown.temperature">
												<div class="item-left">
													<span class="item-dot" :class="healthScoresData.basic.breakdown.temperature.status"></span>
													<span class="item-label">Temperature</span>
												</div>
												<span class="item-value" :class="healthScoresData.basic.breakdown.temperature.status">
													{{ healthScoresData.basic.breakdown.temperature.message }}
												</span>
											</div>
											<div class="breakdown-item" v-if="healthScoresData.basic.breakdown.bloodSugar">
												<div class="item-left">
													<span class="item-dot" :class="healthScoresData.basic.breakdown.bloodSugar.status"></span>
													<span class="item-label">Blood Sugar</span>
												</div>
												<span class="item-value" :class="healthScoresData.basic.breakdown.bloodSugar.status">
													{{ healthScoresData.basic.breakdown.bloodSugar.message }}
												</span>
											</div>
											<div class="breakdown-item" v-if="healthScoresData.basic.breakdown.triage">
												<div class="item-left">
													<span class="item-dot" :class="healthScoresData.basic.breakdown.triage.status"></span>
													<span class="item-label">Recent Checkup</span>
												</div>
												<span class="item-value" :class="healthScoresData.basic.breakdown.triage.status">
													{{ healthScoresData.basic.breakdown.triage.message }}
												</span>
											</div>
										</div>
									</div>
								</div>
								<div class="card-body empty-state-card" v-else>
									<div class="empty-icon">
										<v-icon name="hi-minus-circle" scale="2.5" />
									</div>
									<p>Basic health score not calculated yet</p>
								</div>
							</div>

							<!-- Advanced Health Score Card -->
							<div class="score-card-large advanced">
								<div class="card-accent advanced"></div>
								<div class="card-header">
									<div class="header-left">
										<div class="header-icon advanced">
											<v-icon name="hi-sparkles" scale="1.2" />
										</div>
										<div>
											<h3>Advanced Health Score</h3>
											<span class="card-date">{{ healthScoresData.advanced?.total_assessments || 0 }} assessment(s)</span>
										</div>
									</div>
								</div>
								<div class="card-body" v-if="healthScoresData.advanced?.latest_score !== null && healthScoresData.advanced?.latest_score !== undefined">
									<div class="score-visual">
										<svg class="score-ring-svg" viewBox="0 0 120 120">
											<circle class="ring-bg" cx="60" cy="60" r="52" />
											<circle
												class="ring-progress"
												:class="getScoreClassForRing(healthScoresData.advanced.latest_score)"
												cx="60" cy="60" r="52"
												:style="{ strokeDashoffset: getStrokeDashoffset(healthScoresData.advanced.latest_score) }"
											/>
										</svg>
										<div class="score-center">
											<span class="big-score">{{ healthScoresData.advanced.latest_score }}</span>
											<span class="score-max">of 100</span>
										</div>
									</div>
									<div class="score-status" :class="getScoreClassForRing(healthScoresData.advanced.latest_score)">
										{{ healthScoresData.advanced.latest_status || getScoreLabelText(healthScoresData.advanced.latest_score) }}
									</div>
									<button @click="showAdvancedAssessments = true" class="view-all-btn" v-if="healthScoresData.advanced?.total_assessments > 0">
										<span>View All Assessments</span>
										<v-icon name="hi-arrow-right" scale="0.8" />
									</button>
								</div>
								<div class="card-body empty-state-card" v-else>
									<div class="empty-icon">
										<v-icon name="hi-sparkles" scale="2.5" />
									</div>
									<p>No advanced health assessments</p>
								</div>
							</div>
						</div>

						<!-- Advanced Assessments List (shown when View All is clicked) -->
						<div v-if="showAdvancedAssessments" class="assessments-section">
							<div class="section-header-bar">
								<div class="header-title">
									<button @click="showAdvancedAssessments = false" class="back-btn">
										<v-icon name="hi-arrow-left" scale="0.9" />
									</button>
									<v-icon name="hi-sparkles" scale="1.1" />
									<h3>Advanced Health Assessments</h3>
								</div>
								<span class="total-badge">{{ advancedScores.pagination?.total || advancedScores.items?.length || 0 }} total</span>
							</div>

							<div v-if="advancedScores.items?.length" class="scores-list">
								<div
									v-for="score in advancedScores.items"
									:key="score.id || score._id"
									class="assessment-card clickable"
									@click.stop="viewScoreDetails(score)"
								>
									<div class="assessment-header">
										<div class="assessment-date">
											<v-icon name="hi-calendar" scale="0.9" />
											<span>{{ formatDate(score.date) }}</span>
										</div>
										<div class="score-badge-large" :class="getScoreClassForRing(score.overall_score)">
											{{ score.overall_score }}
										</div>
									</div>
									<div class="assessment-body">
										<div class="status-row">
											<span class="status-tag" :class="getScoreClassForRing(score.overall_score)">
												{{ score.overall_status }}
											</span>
										</div>
										<p class="summary" v-if="score.overall_summary">{{ score.overall_summary }}</p>

										<!-- Domain Scores -->
										<div class="domain-scores" v-if="score.domain_scores?.length">
											<div v-for="domain in score.domain_scores.slice(0, 4)" :key="domain.domain" class="domain-row">
												<span class="domain-name">{{ domain.domain }}</span>
												<div class="domain-bar-wrapper">
													<div class="domain-bar">
														<div class="domain-fill" :style="{ width: domain.score + '%' }" :class="getScoreClassForRing(domain.score)"></div>
													</div>
												</div>
												<span class="domain-score" :class="getScoreClassForRing(domain.score)">{{ domain.score }}</span>
											</div>
										</div>
									</div>
								</div>
							</div>
							<div v-else class="tab-empty">
								<div class="empty-illustration">
									<v-icon name="hi-sparkles" scale="3" class="empty-icon" />
								</div>
								<h3>No Advanced Assessments</h3>
								<p>Patient hasn't completed any advanced health assessments</p>
							</div>

							<!-- Pagination -->
							<div v-if="advancedScores.pagination?.total_pages > 1" class="pagination">
								<button :disabled="advancedScores.pagination.page <= 1" @click="fetchAdvancedScores(advancedScores.pagination.page - 1)" class="page-btn">
									<v-icon name="hi-chevron-left" scale="0.9" />
									<span>Previous</span>
								</button>
								<div class="page-indicator">
									<span class="current">{{ advancedScores.pagination.page }}</span>
									<span class="separator">/</span>
									<span class="total">{{ advancedScores.pagination.total_pages }}</span>
								</div>
								<button :disabled="advancedScores.pagination.page >= advancedScores.pagination.total_pages" @click="fetchAdvancedScores(advancedScores.pagination.page + 1)" class="page-btn">
									<span>Next</span>
									<v-icon name="hi-chevron-right" scale="0.9" />
								</button>
							</div>
						</div>
					</div>

					<!-- Health Records Tab -->
					<div v-if="activeTab === 'health'" class="health-tab">
						<div class="section-header-bar">
							<div class="header-title">
								<v-icon name="hi-clipboard-check" scale="1.1" />
								<h3>Health Checkups</h3>
							</div>
							<span class="total-badge">{{ healthRecords?.pagination?.total || healthRecords?.checkups?.length || 0 }} total</span>
						</div>

						<div v-if="healthRecords?.checkups?.length" class="checkups-list">
							<div
								v-for="checkup in healthRecords.checkups"
								:key="checkup.id || checkup._id"
								class="checkup-card-enhanced"
							>
								<!-- Card Header with Triage -->
								<div class="checkup-card-header" :class="getTriageClass(checkup.triage_level)">
									<div class="header-left">
										<div class="triage-indicator" :class="getTriageClass(checkup.triage_level)">
											<v-icon :name="getTriageIcon(checkup.triage_level)" scale="1.2" />
										</div>
										<div class="header-info">
											<span class="triage-label">{{ formatTriageLabel(checkup.triage_level) }}</span>
											<span class="checkup-date-text">{{ formatDate(checkup.date || checkup.created_at) }}</span>
										</div>
									</div>
									<div class="header-right">
										<span v-if="checkup.health_check_for && checkup.health_check_for !== 'Self'" class="for-badge">
											<v-icon name="hi-user" scale="0.7" />
											{{ checkup.health_check_for }}
										</span>
										<span v-if="checkup.ai_summary" class="ai-badge">
											<v-icon name="fa-robot" scale="0.7" />
											AI Summary
										</span>
									</div>
								</div>

								<!-- Emergency Alert -->
								<div v-if="checkup.has_emergency_evidence" class="emergency-banner">
									<v-icon name="hi-exclamation-triangle" scale="1" />
									<span>Emergency evidence detected - Immediate attention may be required</span>
								</div>

								<!-- Card Body -->
								<div class="checkup-card-body">
									<!-- AI Summary Section -->
									<div v-if="checkup.ai_summary" class="ai-summary-section">
										<div class="summary-header">
											<v-icon name="fa-stethoscope" scale="0.9" />
											<span>AI Health Summary</span>
										</div>
										<p class="summary-overview">{{ checkup.ai_summary.overview }}</p>
										<div v-if="checkup.ai_summary.key_findings?.length" class="key-findings">
											<span class="findings-label">Key Findings:</span>
											<ul>
												<li v-for="(finding, idx) in checkup.ai_summary.key_findings.slice(0, 3)" :key="idx">
													{{ finding }}
												</li>
											</ul>
										</div>
									</div>

									<!-- Conditions Section -->
									<div v-if="checkup.conditions?.length" class="conditions-section">
										<div class="section-label">
											<v-icon name="hi-beaker" scale="0.8" />
											<span>Possible Conditions</span>
										</div>
										<div class="conditions-grid">
											<div
												v-for="(condition, idx) in checkup.conditions.slice(0, 4)"
												:key="idx"
												class="condition-item"
												:class="getConditionUrgency(condition.probability)"
											>
												<div class="condition-info">
													<span class="condition-name">{{ condition.name }}</span>
													<span v-if="condition.category" class="condition-category">{{ condition.category }}</span>
												</div>
												<div class="condition-probability">
													<div class="prob-bar">
														<div class="prob-fill" :style="{ width: (condition.probability * 100) + '%' }"></div>
													</div>
													<span class="prob-value">{{ Math.round(condition.probability * 100) }}%</span>
												</div>
											</div>
										</div>
									</div>

									<!-- Symptoms Section -->
									<div v-if="checkup.symptoms?.length" class="symptoms-section">
										<div class="section-label">
											<v-icon name="hi-annotation" scale="0.8" />
											<span>Reported Symptoms</span>
										</div>
										<div class="symptoms-tags">
											<span
												v-for="(symptom, idx) in checkup.symptoms.slice(0, 8)"
												:key="idx"
												class="symptom-tag"
											>
												<span class="symptom-name">{{ symptom.name || symptom.common_name || symptom }}</span>
											</span>
										</div>
									</div>

									<!-- Specialist Recommendations -->
									<div v-if="checkup.specialist_recommendations?.length" class="recommendations-section">
										<div class="section-label">
											<v-icon name="hi-light-bulb" scale="0.8" />
											<span>Recommended Specialists</span>
										</div>
										<div class="specialist-tags">
											<span v-for="(spec, idx) in checkup.specialist_recommendations.slice(0, 4)" :key="idx" class="specialist-tag">
												{{ spec.name || spec }}
											</span>
										</div>
									</div>
								</div>

								<!-- Card Footer -->
								<div class="checkup-card-footer" @click="viewCheckupDetail(checkup)">
									<span class="view-report-link">
										<v-icon name="hi-document-text" scale="0.9" />
										View Full Medical Report
									</span>
									<v-icon name="hi-arrow-right" scale="0.9" class="arrow-icon" />
								</div>
							</div>
						</div>
						<div v-else class="tab-empty">
							<div class="empty-illustration">
								<v-icon name="hi-document-search" scale="3" class="empty-icon" />
							</div>
							<h3>No Health Records</h3>
							<p>This patient has no health checkup records</p>
						</div>

						<!-- Pagination -->
						<div v-if="healthRecords?.pagination?.total_pages > 1" class="pagination">
							<button
								:disabled="healthRecords.pagination.page <= 1"
								@click="fetchHealthCheckups(healthRecords.pagination.page - 1)"
								class="page-btn"
							>
								<v-icon name="hi-chevron-left" scale="0.9" />
								<span>Previous</span>
							</button>
							<div class="page-indicator">
								<span class="current">{{ healthRecords.pagination.page }}</span>
								<span class="separator">/</span>
								<span class="total">{{ healthRecords.pagination.total_pages }}</span>
							</div>
							<button
								:disabled="healthRecords.pagination.page >= healthRecords.pagination.total_pages"
								@click="fetchHealthCheckups(healthRecords.pagination.page + 1)"
								class="page-btn"
							>
								<span>Next</span>
								<v-icon name="hi-chevron-right" scale="0.9" />
							</button>
						</div>
					</div>

					<!-- Medications Tab -->
					<div v-if="activeTab === 'prescriptions'" class="medications-tab">
						<div class="section-header-bar">
							<div class="header-title">
								<v-icon name="ri-capsule-line" scale="1.1" />
								<h3>Prescriptions & Medications</h3>
							</div>
							<span class="total-badge">{{ (prescriptions.stats?.total || 0) + (uploadedPrescriptions.stats?.total || 0) + (pharmacyOrders.stats?.total || 0) }} total</span>
						</div>

						<!-- Combined Stats -->
						<div class="prescription-stats">
							<div class="stat-card-mini clickable" @click="scrollToSection('specialist')">
								<div class="stat-icon specialist">
									<v-icon name="fa-stethoscope" scale="0.9" />
								</div>
								<div class="stat-info">
									<span class="stat-value">{{ prescriptions.stats?.total || 0 }}</span>
									<span class="stat-label">Specialist Rx</span>
								</div>
								<v-icon name="hi-arrow-down" scale="0.7" class="scroll-hint" />
							</div>
							<div class="stat-card-mini clickable" @click="scrollToSection('uploaded')">
								<div class="stat-icon uploaded">
									<v-icon name="hi-upload" scale="1" />
								</div>
								<div class="stat-info">
									<span class="stat-value">{{ uploadedPrescriptions.stats?.total || 0 }}</span>
									<span class="stat-label">Uploaded Rx</span>
								</div>
								<v-icon name="hi-arrow-down" scale="0.7" class="scroll-hint" />
							</div>
							<div class="stat-card-mini clickable" @click="scrollToSection('orders')">
								<div class="stat-icon orders">
									<v-icon name="hi-shopping-cart" scale="1" />
								</div>
								<div class="stat-info">
									<span class="stat-value">{{ pharmacyOrders.stats?.total || 0 }}</span>
									<span class="stat-label">Orders</span>
								</div>
								<v-icon name="hi-arrow-down" scale="0.7" class="scroll-hint" />
							</div>
							<div class="stat-card-mini">
								<div class="stat-icon total">
									<v-icon name="ri-capsule-line" scale="1" />
								</div>
								<div class="stat-info">
									<span class="stat-value">{{ (prescriptions.stats?.total || 0) + (uploadedPrescriptions.stats?.total || 0) + (pharmacyOrders.stats?.total || 0) }}</span>
									<span class="stat-label">Total</span>
								</div>
							</div>
						</div>

						<!-- ===== SECTION 1: Specialist Prescriptions ===== -->
						<div class="collapsible-section" ref="specialistSection">
							<div class="section-header" @click="toggleSection('specialist')">
								<div class="section-title">
									<v-icon name="fa-stethoscope" scale="0.9" />
									<span>Specialist Prescriptions</span>
									<span class="section-count">{{ prescriptions.stats?.total || 0 }}</span>
								</div>
								<v-icon :name="expandedSections.specialist ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.9" />
							</div>
							<div v-show="expandedSections.specialist" class="section-content">
								<div v-if="prescriptions.prescriptions?.length" class="prescriptions-list">
									<div v-for="rx in prescriptions.prescriptions" :key="rx.id || rx._id" class="prescription-card glass-card">
										<div class="prescription-header" :class="getPrescriptionStatusClass(rx.status)">
											<div class="header-left">
												<div class="rx-icon" :class="getPrescriptionStatusClass(rx.status)">
													<v-icon name="ri-capsule-line" scale="1.1" />
												</div>
												<div class="header-info">
													<span class="rx-number">{{ rx.prescription_number }}</span>
													<span class="rx-date">{{ formatDate(rx.date || rx.created_at) }}</span>
												</div>
											</div>
											<div class="header-right">
												<span class="status-badge" :class="getPrescriptionStatusClass(rx.status)">
													{{ formatPrescriptionStatus(rx.status) }}
												</span>
												<span v-if="rx.payment_status === 'paid'" class="payment-badge paid">
													<v-icon name="hi-check" scale="0.6" /> Paid
												</span>
											</div>
										</div>
										<div class="prescriber-row">
											<v-icon name="hi-user" scale="0.8" />
											<span>Prescribed by: <strong>{{ rx.specialist?.name }}</strong></span>
											<span class="specialty-badge">{{ rx.specialist?.specialty }}</span>
										</div>
										<div class="medications-section">
											<div class="section-label">
												<v-icon name="ri-medicine-bottle-line" scale="0.8" />
												<span>Medications ({{ rx.item_count || rx.items?.length || 0 }})</span>
											</div>
											<div class="medications-grid">
												<div v-for="(item, idx) in (rx.items || []).slice(0, 4)" :key="idx" class="medication-item">
													<div class="med-main">
														<span class="med-name">{{ item.drug_name }}</span>
														<span class="med-strength">{{ item.drug_strength }}</span>
													</div>
													<div class="med-details">
														<span class="med-dosage">{{ item.dosage }} · {{ item.frequency }}</span>
														<span class="med-duration">{{ item.duration }}</span>
													</div>
													<div class="med-qty"><span>Qty: {{ item.quantity }}</span></div>
												</div>
												<div v-if="rx.items?.length > 4" class="more-items">+{{ rx.items.length - 4 }} more</div>
											</div>
										</div>
										<div class="pricing-row">
											<div class="price-item"><span class="price-label">Subtotal</span><span class="price-value">{{ rx.currency }} {{ formatCurrency(rx.subtotal) }}</span></div>
											<div v-if="rx.delivery_fee" class="price-item"><span class="price-label">Delivery</span><span class="price-value">{{ rx.currency }} {{ formatCurrency(rx.delivery_fee) }}</span></div>
											<div class="price-item total"><span class="price-label">Total</span><span class="price-value">{{ rx.currency }} {{ formatCurrency(rx.total_amount) }}</span></div>
										</div>
										<div v-if="rx.is_refillable" class="refill-info">
											<v-icon name="hi-refresh" scale="0.8" />
											<span>Refillable: {{ rx.refills_used || 0 }}/{{ rx.refill_count }} refills used</span>
										</div>
										<div v-if="rx.clinical_notes" class="clinical-notes">
											<div class="notes-label"><v-icon name="hi-annotation" scale="0.8" /><span>Clinical Notes</span></div>
											<p>{{ rx.clinical_notes }}</p>
										</div>
									</div>
								</div>
								<div v-else class="empty-section">
									<v-icon name="fa-stethoscope" scale="1.5" />
									<span>No specialist prescriptions</span>
								</div>
								<div v-if="prescriptions.pagination?.total_pages > 1" class="pagination-mini">
									<button :disabled="prescriptions.pagination.page <= 1" @click="fetchMedicationPrescriptions(prescriptions.pagination.page - 1)">
										<v-icon name="hi-chevron-left" scale="0.8" />
									</button>
									<span>{{ prescriptions.pagination.page }} / {{ prescriptions.pagination.total_pages }}</span>
									<button :disabled="prescriptions.pagination.page >= prescriptions.pagination.total_pages" @click="fetchMedicationPrescriptions(prescriptions.pagination.page + 1)">
										<v-icon name="hi-chevron-right" scale="0.8" />
									</button>
								</div>
							</div>
						</div>

						<!-- ===== SECTION 2: Uploaded Prescriptions ===== -->
						<div class="collapsible-section" ref="uploadedSection">
							<div class="section-header" @click="toggleSection('uploaded')">
								<div class="section-title">
									<v-icon name="hi-upload" scale="0.9" />
									<span>Uploaded Prescriptions</span>
									<span class="section-count">{{ uploadedPrescriptions.stats?.total || 0 }}</span>
								</div>
								<v-icon :name="expandedSections.uploaded ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.9" />
							</div>
							<div v-show="expandedSections.uploaded" class="section-content">
								<div v-if="uploadedPrescriptions.uploads?.length" class="prescriptions-list">
									<div v-for="upload in uploadedPrescriptions.uploads" :key="upload.id || upload._id" class="prescription-card glass-card uploaded-rx">
										<div class="prescription-header" :class="getUploadStatusClass(upload.verification_status)">
											<div class="header-left">
												<div class="rx-icon" :class="getUploadStatusClass(upload.verification_status)">
													<v-icon name="hi-document-text" scale="1.1" />
												</div>
												<div class="header-info">
													<span class="rx-number">{{ upload.prescription_number || 'Pending' }}</span>
													<span class="rx-date">{{ formatDate(upload.date || upload.created_at) }}</span>
												</div>
											</div>
											<div class="header-right">
												<span class="status-badge" :class="getUploadStatusClass(upload.verification_status)">
													{{ formatUploadStatus(upload.verification_status) }}
												</span>
												<span v-if="upload.is_expired" class="expired-badge">Expired</span>
											</div>
										</div>
										<div v-if="upload.doctor_name || upload.clinic_name" class="prescriber-row">
											<v-icon name="hi-user" scale="0.8" />
											<span v-if="upload.doctor_name">Dr. {{ upload.doctor_name }}</span>
											<span v-if="upload.clinic_name" class="clinic-name">{{ upload.clinic_name }}</span>
										</div>
										<div v-if="upload.medications?.length" class="medications-section">
											<div class="section-label">
												<v-icon name="ri-medicine-bottle-line" scale="0.8" />
												<span>Medications ({{ upload.medications.length }})</span>
											</div>
											<div class="medications-grid">
												<div v-for="(med, idx) in upload.medications.slice(0, 4)" :key="idx" class="medication-item">
													<div class="med-main">
														<span class="med-name">{{ med.name }}</span>
														<span v-if="med.dosage" class="med-strength">{{ med.dosage }}</span>
													</div>
													<div v-if="med.instructions" class="med-details">
														<span class="med-dosage">{{ med.instructions }}</span>
													</div>
												</div>
											</div>
										</div>
										<div v-if="upload.valid_until" class="validity-row">
											<v-icon name="hi-calendar" scale="0.7" />
											<span>Valid until: {{ formatDate(upload.valid_until) }}</span>
											<span class="usage-info">Used {{ upload.usage_count || 0 }}{{ upload.max_usage ? `/${upload.max_usage}` : '' }} times</span>
										</div>
										<div v-if="upload.has_fraud_flags" class="fraud-warning">
											<v-icon name="hi-exclamation-triangle" scale="0.8" />
											<span>Flagged for review</span>
										</div>
									</div>
								</div>
								<div v-else class="empty-section">
									<v-icon name="hi-upload" scale="1.5" />
									<span>No uploaded prescriptions</span>
								</div>
								<div v-if="uploadedPrescriptions.pagination?.total_pages > 1" class="pagination-mini">
									<button :disabled="uploadedPrescriptions.pagination.page <= 1" @click="fetchUploadedPrescriptions(uploadedPrescriptions.pagination.page - 1)">
										<v-icon name="hi-chevron-left" scale="0.8" />
									</button>
									<span>{{ uploadedPrescriptions.pagination.page }} / {{ uploadedPrescriptions.pagination.total_pages }}</span>
									<button :disabled="uploadedPrescriptions.pagination.page >= uploadedPrescriptions.pagination.total_pages" @click="fetchUploadedPrescriptions(uploadedPrescriptions.pagination.page + 1)">
										<v-icon name="hi-chevron-right" scale="0.8" />
									</button>
								</div>
							</div>
						</div>

						<!-- ===== SECTION 3: Medication Purchases ===== -->
						<div class="collapsible-section" ref="ordersSection">
							<div class="section-header" @click="toggleSection('orders')">
								<div class="section-title">
									<v-icon name="hi-shopping-cart" scale="0.9" />
									<span>Medication Purchases</span>
									<span class="section-count">{{ pharmacyOrders.stats?.total || 0 }}</span>
								</div>
								<v-icon :name="expandedSections.orders ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.9" />
							</div>
							<div v-show="expandedSections.orders" class="section-content">
								<div v-if="pharmacyOrders.orders?.length" class="prescriptions-list">
									<div v-for="order in pharmacyOrders.orders" :key="order.id || order._id" class="prescription-card glass-card order-card">
										<div class="prescription-header" :class="getOrderStatusClass(order.status)">
											<div class="header-left">
												<div class="rx-icon" :class="getOrderStatusClass(order.status)">
													<v-icon name="hi-shopping-cart" scale="1.1" />
												</div>
												<div class="header-info">
													<span class="rx-number">{{ order.order_number }}</span>
													<span class="rx-date">{{ formatDate(order.date || order.created_at) }}</span>
												</div>
											</div>
											<div class="header-right">
												<span class="order-type-badge" :class="order.order_type?.toLowerCase()">
													{{ order.order_type === 'OTC' ? 'OTC' : order.order_type === 'PRESCRIPTION' ? 'Rx' : 'Mixed' }}
												</span>
												<span class="status-badge" :class="getOrderStatusClass(order.status)">
													{{ formatOrderStatus(order.status) }}
												</span>
											</div>
										</div>
										<div v-if="order.pharmacy" class="prescriber-row">
											<v-icon name="gi-medicines" scale="0.8" />
											<span>From: <strong>{{ order.pharmacy.name }}</strong></span>
										</div>
										<div class="medications-section">
											<div class="section-label">
												<v-icon name="ri-medicine-bottle-line" scale="0.8" />
												<span>Items ({{ order.item_count || order.items?.length || 0 }})</span>
											</div>
											<div class="medications-grid">
												<div v-for="(item, idx) in (order.items || []).slice(0, 4)" :key="idx" class="medication-item">
													<div class="med-main">
														<span class="med-name">{{ item.drug_name }}</span>
														<span v-if="item.strength" class="med-strength">{{ item.strength }}</span>
													</div>
													<div class="med-details">
														<span class="med-dosage">{{ item.dosage_form }}</span>
														<span v-if="item.requires_prescription" class="rx-required">Rx</span>
													</div>
													<div class="med-qty"><span>Qty: {{ item.quantity }}</span></div>
												</div>
												<div v-if="order.items?.length > 4" class="more-items">+{{ order.items.length - 4 }} more</div>
											</div>
										</div>
										<div class="pricing-row">
											<div class="price-item"><span class="price-label">Subtotal</span><span class="price-value">{{ order.currency }} {{ formatCurrency(order.subtotal) }}</span></div>
											<div v-if="order.delivery_fee" class="price-item"><span class="price-label">Delivery</span><span class="price-value">{{ order.currency }} {{ formatCurrency(order.delivery_fee) }}</span></div>
											<div class="price-item total"><span class="price-label">Total</span><span class="price-value">{{ order.currency }} {{ formatCurrency(order.total_amount) }}</span></div>
										</div>
										<div v-if="order.delivery_method" class="delivery-info">
											<v-icon :name="order.is_pickup ? 'hi-location-marker' : 'hi-truck'" scale="0.8" />
											<span>{{ order.is_pickup ? 'Pickup' : 'Delivery' }}</span>
											<span v-if="order.tracking_number" class="tracking">Tracking: {{ order.tracking_number }}</span>
											<span v-if="order.delivered_at" class="delivered-date">Delivered: {{ formatDate(order.delivered_at) }}</span>
										</div>
									</div>
								</div>
								<div v-else class="empty-section">
									<v-icon name="hi-shopping-cart" scale="1.5" />
									<span>No medication purchases</span>
								</div>
								<div v-if="pharmacyOrders.pagination?.total_pages > 1" class="pagination-mini">
									<button :disabled="pharmacyOrders.pagination.page <= 1" @click="fetchPharmacyOrders(pharmacyOrders.pagination.page - 1)">
										<v-icon name="hi-chevron-left" scale="0.8" />
									</button>
									<span>{{ pharmacyOrders.pagination.page }} / {{ pharmacyOrders.pagination.total_pages }}</span>
									<button :disabled="pharmacyOrders.pagination.page >= pharmacyOrders.pagination.total_pages" @click="fetchPharmacyOrders(pharmacyOrders.pagination.page + 1)">
										<v-icon name="hi-chevron-right" scale="0.8" />
									</button>
								</div>
							</div>
						</div>
					</div>

					<!-- Appointments Tab -->
					<div v-if="activeTab === 'appointments'" class="tab-content appointments-tab-v2">
						<!-- Stats Overview -->
						<div class="apt-stats-row">
							<div class="apt-stat-card stat-total">
								<div class="stat-icon-wrap">
									<v-icon name="hi-calendar" scale="1" />
								</div>
								<div class="stat-content">
									<span class="stat-number">{{ appointmentStatusCounts.total }}</span>
									<span class="stat-label">Total</span>
								</div>
							</div>
							<div class="apt-stat-card stat-confirmed">
								<div class="stat-icon-wrap">
									<v-icon name="hi-check-circle" scale="1" />
								</div>
								<div class="stat-content">
									<span class="stat-number">{{ appointmentStatusCounts.confirmed }}</span>
									<span class="stat-label">Confirmed</span>
								</div>
							</div>
							<div class="apt-stat-card stat-completed">
								<div class="stat-icon-wrap">
									<v-icon name="hi-badge-check" scale="1" />
								</div>
								<div class="stat-content">
									<span class="stat-number">{{ appointmentStatusCounts.completed }}</span>
									<span class="stat-label">Completed</span>
								</div>
							</div>
							<div class="apt-stat-card stat-cancelled">
								<div class="stat-icon-wrap">
									<v-icon name="hi-x-circle" scale="1" />
								</div>
								<div class="stat-content">
									<span class="stat-number">{{ appointmentStatusCounts.cancelled }}</span>
									<span class="stat-label">Cancelled</span>
								</div>
							</div>
							<div class="apt-stat-card stat-noshow">
								<div class="stat-icon-wrap">
									<v-icon name="hi-user-remove" scale="1" />
								</div>
								<div class="stat-content">
									<span class="stat-number">{{ appointmentStatusCounts.noShow }}</span>
									<span class="stat-label">No Show</span>
								</div>
							</div>
						</div>

						<!-- Filter Tabs -->
						<div class="apt-filter-section">
							<div class="apt-filter-tabs">
								<button
									class="filter-tab"
									:class="{ active: !appointmentStatusFilter }"
									@click="setAppointmentStatusFilter('')"
								>
									All ({{ appointmentStatusCounts.total }})
								</button>
								<button
									class="filter-tab"
									:class="{ active: appointmentStatusFilter === 'OPEN' }"
									@click="setAppointmentStatusFilter('OPEN')"
								>
									Confirmed ({{ appointmentStatusCounts.confirmed }})
								</button>
								<button
									class="filter-tab"
									:class="{ active: appointmentStatusFilter === 'COMPLETED' }"
									@click="setAppointmentStatusFilter('COMPLETED')"
								>
									Completed ({{ appointmentStatusCounts.completed }})
								</button>
								<button
									class="filter-tab"
									:class="{ active: appointmentStatusFilter === 'CANCELLED' }"
									@click="setAppointmentStatusFilter('CANCELLED')"
								>
									Cancelled ({{ appointmentStatusCounts.cancelled }})
								</button>
								<button
									class="filter-tab"
									:class="{ active: appointmentStatusFilter === 'MISSED' }"
									@click="setAppointmentStatusFilter('MISSED')"
								>
									No Show ({{ appointmentStatusCounts.noShow }})
								</button>
							</div>
							<button class="btn-book-apt" @click="bookAppointment">
								<v-icon name="hi-plus" scale="0.9" />
								<span>Book New</span>
							</button>
						</div>

						<!-- Appointments Table -->
						<div v-if="filteredAppointments.length" class="apt-table-card">
							<table class="apt-table">
								<thead>
									<tr>
										<th>Date & Time</th>
										<th>Specialist</th>
										<th>Type</th>
										<th>Channel</th>
										<th>Duration</th>
										<th>Fee</th>
										<th>Status</th>
										<th class="th-actions">Actions</th>
									</tr>
								</thead>
								<tbody>
									<tr
										v-for="(apt, aptIndex) in filteredAppointments"
										:key="apt.id || apt._id"
										:class="['apt-row', `row-${getAppointmentStatusClass(apt)}`]"
									>
										<td>
											<div class="datetime-cell">
												<span class="date-text">{{ formatAppointmentDate(apt.date || apt.start_time) }}</span>
												<span class="time-text">{{ formatAppointmentTime(apt.date || apt.start_time) }}</span>
											</div>
										</td>
										<td>
											<div class="specialist-cell">
												<div class="specialist-avatar-sm">
													<img v-if="apt.specialist?.profile_image" :src="apt.specialist.profile_image" :alt="apt.specialist?.name" referrerpolicy="no-referrer" @error="handleSpecialistImgError($event)" />
													<v-icon v-if="!apt.specialist?.profile_image" name="hi-user-circle" scale="1.2" />
												</div>
												<div class="specialist-info-sm">
													<span class="specialist-name-sm">{{ apt.specialist?.name || apt.specialist?.profile?.first_name || 'Specialist' }}</span>
													<span class="specialist-specialty-sm">{{ apt.specialist?.specialty || apt.specialist?.specialization || 'General' }}</span>
												</div>
											</div>
										</td>
										<td>
											<span class="type-badge">{{ apt.appointment_type || 'Consultation' }}</span>
										</td>
										<td>
											<div class="channel-cell">
												<v-icon :name="getChannelIcon(apt.meeting_channel)" scale="0.85" class="channel-icon" />
												<span>{{ getChannelLabel(apt.meeting_channel) }}</span>
											</div>
										</td>
										<td>
											<span class="duration-text">{{ formatDuration(apt.duration_minutes, apt.call_duration, apt.status) }}</span>
										</td>
										<td>
											<span class="fee-text">{{ formatAppointmentFee(apt) }}</span>
										</td>
										<td>
											<span class="apt-status-badge" :class="getAppointmentStatusClass(apt)">
												{{ getAppointmentDisplayStatus(apt) }}
											</span>
										</td>
										<td>
											<div class="actions-cell">
												<button class="apt-action-btn view" title="View Details" @click="viewAppointmentDetails(apt)">
													<v-icon name="hi-eye" scale="0.9" />
												</button>
												<template v-if="normalizeAppointmentStatus(apt) === 'confirmed'">
													<a v-if="apt.join_url" :href="apt.join_url" target="_blank" class="apt-action-btn meeting" title="Join Meeting">
														<v-icon name="hi-video-camera" scale="0.9" />
													</a>
												</template>
												<template v-if="normalizeAppointmentStatus(apt) === 'completed'">
													<button class="apt-action-btn notes" title="Clinical Notes" @click="addClinicalNote(apt)">
														<v-icon name="hi-document-text" scale="0.9" />
													</button>
												</template>
												<div class="apt-more-dropdown">
													<button class="apt-action-btn more" title="More options" @click.stop="toggleAptMenu(apt._id || apt.id)">
														<v-icon name="hi-dots-vertical" scale="0.9" />
													</button>
													<div v-if="activeAptMenu === (apt._id || apt.id)" class="apt-dropdown-menu" :class="{ upward: aptIndex >= filteredAppointments.length - 2 }">
														<button @click="viewAppointmentDetails(apt)">
															<v-icon name="hi-eye" scale="0.8" />
															<span>View Details</span>
														</button>
														<button v-if="normalizeAppointmentStatus(apt) === 'confirmed'" @click="rescheduleAppointment(apt)">
															<v-icon name="hi-calendar" scale="0.8" />
															<span>Reschedule</span>
														</button>
														<button v-if="normalizeAppointmentStatus(apt) === 'confirmed'" @click="cancelAppointment(apt)" class="danger">
															<v-icon name="hi-x-circle" scale="0.8" />
															<span>Cancel</span>
														</button>
														<button @click="addClinicalNote(apt)">
															<v-icon name="hi-document-text" scale="0.8" />
															<span>Clinical Notes</span>
														</button>
													</div>
												</div>
											</div>
										</td>
									</tr>
								</tbody>
							</table>
						</div>

						<!-- Empty State -->
						<div v-else class="apt-empty-state">
							<div class="empty-illustration">
								<v-icon name="hi-calendar" scale="2.5" />
							</div>
							<h4>No Appointments Found</h4>
							<p v-if="appointmentStatusFilter">No {{ getAppointmentDisplayStatus({ status: appointmentStatusFilter }) }} appointments with this patient</p>
							<p v-else>No appointment history with this patient</p>
							<button class="btn-book-empty" @click="bookAppointment">
								<v-icon name="hi-plus-circle" scale="1" />
								<span>Book First Appointment</span>
							</button>
						</div>

						<!-- Pagination -->
						<div v-if="appointmentsData.pagination?.total_pages > 1" class="apt-pagination">
							<div class="pagination-info">
								Showing <strong>{{ filteredAppointments.length }}</strong> of <strong>{{ appointmentsData.pagination?.total || appointmentsData.items?.length || 0 }}</strong> appointments
							</div>
							<div class="pagination-controls">
								<button
									class="page-btn"
									:disabled="appointmentsData.pagination.page <= 1"
									@click="fetchAppointmentsData(appointmentsData.pagination.page - 1)"
								>
									<v-icon name="hi-chevron-left" scale="0.9" />
								</button>
								<div class="page-numbers">
									<span class="current-page">{{ appointmentsData.pagination.page }}</span>
									<span class="page-sep">/</span>
									<span class="total-pages">{{ appointmentsData.pagination.total_pages }}</span>
								</div>
								<button
									class="page-btn"
									:disabled="appointmentsData.pagination.page >= appointmentsData.pagination.total_pages"
									@click="fetchAppointmentsData(appointmentsData.pagination.page + 1)"
								>
									<v-icon name="hi-chevron-right" scale="0.9" />
								</button>
							</div>
						</div>
					</div>

					<!-- Purchases Tab -->
					<div v-if="activeTab === 'purchases'" class="purchases-tab">
						<div v-if="purchases?.length" class="records-list">
							<div class="purchase-card" v-for="order in purchases" :key="order._id">
								<div class="purchase-header">
									<span class="order-id">Order #{{ order.order_number || order._id.slice(-8) }}</span>
									<span class="purchase-status" :class="order.status?.toLowerCase()">{{ order.status }}</span>
								</div>
								<div class="purchase-body">
									<div class="purchase-items" v-if="order.items?.length">
										<div class="purchase-item" v-for="item in order.items.slice(0, 3)" :key="item._id">
											<span class="item-name">{{ item.drug?.name || item.name }}</span>
											<span class="item-qty">x{{ item.quantity }}</span>
											<span class="item-price">{{ formatCurrency(item.price) }}</span>
										</div>
									</div>
									<div class="purchase-total">
										<span>Total:</span>
										<span class="total-amount">{{ formatCurrency(order.total_amount) }}</span>
									</div>
									<div class="purchase-date">
										<v-icon name="hi-calendar" scale="0.7" />
										{{ formatDate(order.created_at) }}
									</div>
								</div>
							</div>
						</div>
						<div v-else class="tab-empty">
							<div class="empty-illustration">
								<v-icon name="hi-shopping-bag" scale="3" class="empty-icon" />
							</div>
							<h3>No Purchases</h3>
							<p>No pharmacy purchase history</p>
						</div>
					</div>

					<!-- Timeline Tab -->
					<div v-if="activeTab === 'timeline'" class="tab-content timeline-tab">
						<div class="content-wrapper">
							<div class="section-header-bar">
								<div class="header-title">
									<v-icon name="hi-clock" scale="1.1" />
									<h3>Activity Timeline</h3>
								</div>
								<span class="total-badge">{{ timelineData.pagination?.total || timelineData.items?.length || 0 }} events</span>
							</div>

							<div v-if="timelineData.items?.length" class="timeline">
								<div
									class="timeline-item"
									v-for="(event, index) in timelineData.items"
									:key="index"
								>
									<div class="timeline-marker" :class="event.type">
										<v-icon :name="getTimelineIcon(event.type)" scale="0.7" />
									</div>
									<div class="timeline-card glass-card">
										<div class="timeline-header">
											<span class="timeline-type" :class="event.type">{{ formatEventType(event.type) }}</span>
											<span class="timeline-date">{{ formatDate(event.date) }}</span>
										</div>
										<p class="timeline-desc">{{ getTimelineDescription(event) }}</p>
										<div class="timeline-meta" v-if="event.data">
											<span v-if="event.data.status" class="meta-tag status" :class="event.data.status?.toLowerCase()">
												{{ event.data.status }}
											</span>
											<span v-if="event.data.appointmentType" class="meta-tag type">
												{{ event.data.appointmentType }}
											</span>
											<span v-if="event.data.medicationCount" class="meta-tag">
												{{ event.data.medicationCount }} medication(s)
											</span>
											<span v-if="event.data.triageLevel" class="meta-tag triage" :class="event.data.triageLevel">
												{{ event.data.triageLevel }}
											</span>
											<span v-if="event.data.totalAmount" class="meta-tag amount">
												₦{{ formatCurrency(event.data.totalAmount) }}
											</span>
										</div>
									</div>
								</div>
							</div>
							<div v-else class="empty-state glass-card">
								<div class="empty-icon-wrapper">
									<v-icon name="hi-clock" scale="2.5" />
								</div>
								<h4>No Activity</h4>
								<p>No timeline events recorded for this patient</p>
							</div>

							<!-- Pagination -->
							<div v-if="timelineData.pagination?.totalPages > 1" class="pagination">
								<button :disabled="timelineData.pagination.page <= 1" @click="fetchTimelineData(timelineData.pagination.page - 1)" class="page-btn">
									<v-icon name="hi-chevron-left" scale="0.9" />
									<span>Previous</span>
								</button>
								<div class="page-indicator">
									<span class="current">{{ timelineData.pagination.page }}</span>
									<span class="separator">/</span>
									<span class="total">{{ timelineData.pagination.totalPages }}</span>
								</div>
								<button :disabled="timelineData.pagination.page >= timelineData.pagination.totalPages" @click="fetchTimelineData(timelineData.pagination.page + 1)" class="page-btn">
									<span>Next</span>
									<v-icon name="hi-chevron-right" scale="0.9" />
								</button>
							</div>
						</div>
					</div>

					<!-- Dependents Tab -->
					<div v-if="activeTab === 'dependents'" class="dependents-tab">
						<div v-if="dependents?.length" class="dependents-grid">
							<div class="dependent-card" v-for="dep in dependents" :key="dep._id">
								<div class="dep-avatar">
									<span>{{ getInitials(dep.name || `${dep.first_name} ${dep.last_name}`) }}</span>
								</div>
								<div class="dep-info">
									<h4>{{ dep.name || `${dep.first_name} ${dep.last_name}` }}</h4>
									<p>{{ dep.relationship }} - {{ calculateAge(dep.date_of_birth) }} years old</p>
								</div>
							</div>
						</div>
						<div v-else class="tab-empty">
							<div class="empty-illustration">
								<v-icon name="hi-user-group" scale="3" class="empty-icon" />
							</div>
							<h3>No Dependents</h3>
							<p>No dependents registered for this patient</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Clinical Note Modal -->
	<ClinicalNoteModal
		:is-open="showClinicalNoteModal"
		:appointment="selectedAppointmentForNote"
		:existing-note="editingClinicalNote"
		@close="closeClinicalNoteModal"
		@saved="handleClinicalNoteSaved"
	/>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, inject } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import moment from 'moment';
import TopBar from "@/components/Navigation/top-bar";
import Loader from "@/components/Loader/main-loader";
import RcAvatar from "@/components/RCAvatar";
import ClinicalNoteModal from "@/views/Mainapp/SpecialistApp/SpecialistAppointments/modals/ClinicalNoteModal.vue";

defineEmits(["openSideNav"]);

const $http = inject('$_HTTP');
const $toast = inject('$_TOAST');
const router = useRouter();
const route = useRoute();

// State
const loading = ref(true);
const error = ref(null);
const patientData = ref(null);  // Full response from getPatientDetails
const patient = ref(null);       // Patient profile info
const isStarred = ref(false);    // Star status
const patientStats = ref(null);  // Patient stats
const riskLevel = ref('low');    // Risk level
const overview = ref(null);
const healthRecords = ref(null);
const prescriptions = ref({ prescriptions: [], stats: null, pagination: null });
const uploadedPrescriptions = ref({ uploads: [], stats: null, pagination: null });
const pharmacyOrders = ref({ orders: [], stats: null, pagination: null });
const appointments = ref(null);
const appointmentsData = ref({ items: [], pagination: null });
const appointmentStatusFilter = ref('');  // '', 'OPEN', 'COMPLETED', 'CANCELLED', 'MISSED'
const activeAptMenu = ref(null);  // Track which appointment's dropdown menu is open
const showClinicalNoteModal = ref(false);  // Clinical note modal visibility
const selectedAppointmentForNote = ref(null);  // Appointment selected for clinical note
const editingClinicalNote = ref(null);  // Existing note being edited
const purchases = ref(null);
const timeline = ref(null);
const timelineData = ref({ items: [], pagination: null });
const dependents = ref(null);
const advancedScores = ref({ items: [], pagination: null });
const showAdvancedAssessments = ref(false);
const activeTab = ref('overview');

// Collapsible section states for Medications tab
const expandedSections = ref({
	specialist: true,
	uploaded: true,
	orders: true,
});

// Section refs for scrolling
const specialistSection = ref(null);
const uploadedSection = ref(null);
const ordersSection = ref(null);

// Tab configuration
const tabs = [
	{ value: 'overview', label: 'Overview', icon: 'hi-view-grid' },
	{ value: 'scores', label: 'Health Scores', icon: 'hi-chart-pie' },
	{ value: 'health', label: 'Health Records', icon: 'hi-heart' },
	{ value: 'prescriptions', label: 'Medications', icon: 'ri-capsule-line' },
	{ value: 'appointments', label: 'Appointments', icon: 'hi-calendar' },
	{ value: 'purchases', label: 'Purchases', icon: 'hi-shopping-bag' },
	{ value: 'timeline', label: 'Timeline', icon: 'hi-clock' },
	{ value: 'dependents', label: 'Dependents', icon: 'hi-user-group' },
];

// Computed
const patientId = computed(() => route.params.patientId);

const hasMedicalHistory = computed(() => {
	const history = patient.value?.profile?.medical_history;
	return history?.conditions?.length || history?.allergies?.length || history?.medications?.length;
});

const hasPreExistingConditions = computed(() => {
	return patient.value?.pre_existing_conditions?.length > 0;
});

const hasVitals = computed(() => {
	const vitals = overview.value?.recentVitals;
	if (!vitals) return false;
	// formatVitalsForFrontend() returns array format: blood_pressure[], pulse_rate[], blood_sugar_level[], body_temp[]
	return vitals.blood_pressure?.length || vitals.pulse_rate?.length || vitals.blood_sugar_level?.length || vitals.body_temp?.length;
});

// Helper to get the latest vital value (same as UpcomingAppointments.vue)
function getLatestVital(vitalArray) {
	if (!vitalArray || !Array.isArray(vitalArray) || vitalArray.length === 0) {
		return null;
	}
	return vitalArray[0];
}

// Health scores computed properties
const basicHealthScore = computed(() => {
	// Backend now returns just the score value directly
	const score = patient.value?.basic_health_score ?? patientData.value?.patient?.basic_health_score;
	// Handle case where it might still be an object (backwards compatibility)
	if (typeof score === 'object' && score !== null) {
		return score.score ?? null;
	}
	return score ?? null;
});

const advancedHealthScore = computed(() => {
	// Get from health_scores.advanced.latest_score (same as PatientHealthRecords.vue)
	return overview.value?.healthScores?.advanced?.latest_score
		?? healthRecords.value?.healthScores?.advanced?.latest_score
		?? null;
});

const hasHealthScores = computed(() => {
	return basicHealthScore.value !== null || advancedHealthScore.value !== null || riskLevel.value;
});

// Health scores data for the Health Scores tab
const healthScoresData = computed(() => {
	return {
		basic: overview.value?.healthScores?.basic || healthRecords.value?.healthScores?.basic || null,
		advanced: overview.value?.healthScores?.advanced || healthRecords.value?.healthScores?.advanced || null,
	};
});

// Helper function for appointment status (must be defined before computed properties that use it)
const isAppointmentMissed = (apt) => {
	if (!apt.date && !apt.start_time) return false;
	const status = apt.status?.toUpperCase();
	if (status !== 'OPEN') return false;
	const appointmentDate = new Date(apt.date || apt.start_time);
	const now = new Date();
	return appointmentDate < now;
};

// Appointments tab computed properties
const appointmentStatusCounts = computed(() => {
	const items = appointmentsData.value?.items || [];
	const counts = { total: items.length, confirmed: 0, completed: 0, cancelled: 0, noShow: 0 };
	items.forEach(apt => {
		const status = apt.status?.toUpperCase();
		if (status === 'OPEN' || status === 'ONGOING') counts.confirmed++;
		else if (status === 'COMPLETED') counts.completed++;
		else if (status === 'CANCELLED') counts.cancelled++;
		else if (status === 'MISSED' || status === 'NO_SHOW' || isAppointmentMissed(apt)) counts.noShow++;
	});
	return counts;
});

const filteredAppointments = computed(() => {
	const items = appointmentsData.value?.items || [];
	if (!appointmentStatusFilter.value) return items;
	return items.filter(apt => {
		const status = apt.status?.toUpperCase();
		if (appointmentStatusFilter.value === 'OPEN') return status === 'OPEN' || status === 'ONGOING';
		if (appointmentStatusFilter.value === 'MISSED') return status === 'MISSED' || status === 'NO_SHOW' || isAppointmentMissed(apt);
		return status === appointmentStatusFilter.value;
	});
});

// Methods
async function fetchPatientData() {
	try {
		loading.value = true;
		error.value = null;

		// Fetch patient details and full health records using existing working endpoints
		const [detailsRes, healthRes] = await Promise.all([
			$http.$_getSpecialistPatientDetails(patientId.value),
			$http.$_getPatientFullHealthRecords(patientId.value),
		]);

		// Extract patient details response
		const detailsData = detailsRes.data?.data || detailsRes.data;
		patientData.value = detailsData;
		patient.value = detailsData.patient || detailsData;
		isStarred.value = detailsData.isStarred || false;
		patientStats.value = detailsData.stats || null;
		riskLevel.value = detailsData.riskLevel || 'low';

		// Extract comprehensive health data from existing appointments endpoint
		// Structure: { patient, health_scores, health_checkups: { items, pagination }, vitals, medical_profile, etc }
		const healthData = healthRes.data?.data || healthRes.data;
		overview.value = {
			recentVitals: healthData.vitals || {},
			recentActivity: healthData.recent_activity || [],
			medicalHistory: {
				conditions: healthData.medical_history || patient.value?.pre_existing_conditions || [],
			},
			healthScores: {
				basic: healthData.health_scores?.basic || null,
				advanced: healthData.health_scores?.advanced || null,
			},
			stats: {
				totalCheckups: healthData.health_checkups?.pagination?.total || 0,
				totalPrescriptions: healthData.prescriptions?.length || 0,
				last_visit: patientStats.value?.lastAppointmentDate || null,
			},
		};

		// Store health records for the Health Records tab
		// health_checkups has items array and pagination
		healthRecords.value = {
			checkups: healthData.health_checkups?.items || [],
			pagination: healthData.health_checkups?.pagination || null,
			vitals: healthData.vitals || {},
			healthScores: healthData.health_scores || {},
		};

		await loadTabData(activeTab.value);
	} catch (err) {
		console.error('Error fetching patient data:', err);
		error.value = err.response?.data?.message || 'Failed to load patient data';
	} finally {
		loading.value = false;
	}
}

async function loadTabData(tab) {
	try {
		switch (tab) {
			case 'scores':
				// Load advanced scores if not already loaded
				if (!advancedScores.value.items?.length) {
					await fetchAdvancedScores(1);
				}
				break;
			case 'health':
				// Health records loaded in fetchPatientData
				break;
			case 'prescriptions':
				// Load all medication-related data for the medications tab
				await Promise.all([
					prescriptions.value?.items ? Promise.resolve() : fetchMedicationPrescriptions(),
					uploadedPrescriptions.value?.items ? Promise.resolve() : fetchUploadedPrescriptions(),
					pharmacyOrders.value?.items ? Promise.resolve() : fetchPharmacyOrders(),
				]);
				break;
			case 'appointments':
				if (!appointmentsData.value?.items?.length) {
					await fetchAppointmentsData();
				}
				break;
			case 'purchases':
				if (!purchases.value) {
					// Use existing working endpoint from appointments module
					const res = await $http.$_getPatientPharmacyOrders(patientId.value);
					purchases.value = res.data?.data?.orders || res.data?.data || res.data || [];
				}
				break;
			case 'timeline':
				if (!timelineData.value.items?.length) {
					await fetchTimelineData(1);
				}
				break;
			case 'dependents':
				if (!dependents.value) {
					// Get dependents from patient data
					dependents.value = patient.value?.dependants || [];
				}
				break;
		}
	} catch (err) {
		console.error(`Error loading ${tab} data:`, err);
	}
}

async function fetchAdvancedScores(page = 1) {
	try {
		// Use the existing endpoint that returns advanced_scores
		const response = await $http.$_getPatientFullHealthRecords(patientId.value, {
			scoresPage: page,
			scoresLimit: 10,
		});
		const data = response.data?.data || response.data;
		advancedScores.value = {
			items: data.advanced_scores?.items || [],
			pagination: data.advanced_scores?.pagination || null,
		};
	} catch (err) {
		console.error('Error fetching advanced scores:', err);
	}
}

async function fetchHealthCheckups(page = 1) {
	try {
		const response = await $http.$_getPatientFullHealthRecords(patientId.value, {
			checkupsPage: page,
			checkupsLimit: 10,
		});
		const data = response.data?.data || response.data;
		healthRecords.value = {
			...healthRecords.value,
			checkups: data.health_checkups?.items || [],
			pagination: data.health_checkups?.pagination || null,
		};
	} catch (err) {
		console.error('Error fetching health checkups:', err);
	}
}

async function toggleStar() {
	if (!patient.value) return;
	try {
		const newStarred = !isStarred.value;
		await $http.$_togglePatientStar(patientId.value, { starred: newStarred });
		isStarred.value = newStarred;
		$toast.success(newStarred ? 'Patient starred' : 'Patient unstarred');
	} catch (err) {
		console.error('Error toggling star:', err);
		$toast.error('Failed to update star status');
	}
}

function switchTab(tab) {
	activeTab.value = tab;
	loadTabData(tab);
}

function goBack() {
	router.push('/app/specialist/patients');
}

function bookAppointment() {
	router.push({
		path: '/app/specialist/specialist-appointments',
		query: { patientId: patientId.value },
	});
}

function writePrescription() {
	router.push(`/app/specialist/pharmacy/patients/${patientId.value}`);
}

function addClinicalNote(apt = null) {
	activeAptMenu.value = null;  // Close any open dropdown
	selectedAppointmentForNote.value = apt;
	// If appointment has existing clinical notes, load the most recent one for editing
	if (apt?.clinical_notes?.length > 0) {
		editingClinicalNote.value = apt.clinical_notes[0];  // Most recent note
	} else {
		editingClinicalNote.value = null;
	}
	showClinicalNoteModal.value = true;
}

function closeClinicalNoteModal() {
	showClinicalNoteModal.value = false;
	selectedAppointmentForNote.value = null;
	editingClinicalNote.value = null;
}

function handleClinicalNoteSaved(note) {
	showClinicalNoteModal.value = false;
	selectedAppointmentForNote.value = null;
	editingClinicalNote.value = null;
	$toast?.success('Clinical note saved successfully');
	// Refresh appointments data to show the new note
	fetchAppointmentsData();
}

function callPatient() {
	const phone = getPhone(patient.value);
	if (phone) {
		window.open(`tel:${phone.replace(/\s/g, '')}`, '_self');
	}
}

function emailPatient() {
	const email = getEmail(patient.value);
	if (email) {
		window.open(`mailto:${email}?subject=Regarding your healthcare`, '_blank');
	}
}

function sendMessage() {
	// Navigate to messaging or show a message modal
	$toast?.info('Messaging feature coming soon');
}

function formatLastVisitShort(date) {
	if (!date) return 'Never';
	const m = moment(date).startOf('day');
	const now = moment().startOf('day');
	const days = now.diff(m, 'days');
	if (days === 0) return 'Today';
	if (days === 1) return 'Yesterday';
	if (days < 7) return `${days}d ago`;
	if (days < 30) return `${Math.floor(days / 7)}w ago`;
	return moment(date).format('MMM D');
}

function viewScoreDetails(score) {
	// Navigate to the HealthScoreReport page with score details
	// Using "dashboard" as appointmentId since we're coming from patient dashboard
	const scoreId = score.id || score._id;
	if (!scoreId) return;

	const patientName = getFullName(patient.value);
	const patientGender = patient.value?.profile?.gender || '';
	const patientAge = patient.value?.profile?.date_of_birth
		? moment().diff(moment(patient.value.profile.date_of_birth), 'years')
		: '';

	router.push({
		path: `/app/specialist/patient-health/score/dashboard/advanced/${scoreId}`,
		query: {
			patientId: patientId.value,
			patientName,
			patientGender,
			patientAge,
		},
	});
}

function getFullName(patient) {
	if (patient?.profile?.first_name && patient?.profile?.last_name) {
		return `${patient.profile.first_name} ${patient.profile.last_name}`;
	}
	return getEmail(patient) || 'Unknown Patient';
}

function getEmail(patient) {
	return patient?.profile?.contact?.email || patient?.email || '';
}

function getPhone(patient) {
	const phone = patient?.profile?.contact?.phone;
	if (phone?.number) {
		let countryCode = phone.country_code || '';
		// Ensure country code has + prefix but not double ++
		if (countryCode && !countryCode.startsWith('+')) {
			countryCode = '+' + countryCode;
		}
		return countryCode ? `${countryCode} ${phone.number}` : phone.number;
	}
	return patient?.profile?.phone_number || '';
}

function getProfileImage(patient) {
	return patient?.profile?.profile_image || patient?.profile?.profile_photo || null;
}

function getInitials(name) {
	if (!name || name === 'Unknown Patient') return '?';
	return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function calculateAge(dateOfBirth) {
	if (!dateOfBirth) return 'N/A';
	return moment().diff(moment(dateOfBirth), 'years');
}

function formatDate(date) {
	if (!date) return 'N/A';
	return moment(date).format('MMM D, YYYY');
}

function formatRelativeTime(date) {
	if (!date) return '';
	return moment(date).fromNow();
}

function formatTriageLevel(level) {
	if (!level) return '';
	const levels = {
		'emergency': 'Emergency',
		'emergency_ambulance': 'Emergency',
		'consultation_24': 'Urgent - 24h',
		'consultation': 'Consultation',
		'self_care': 'Self Care',
	};
	return levels[level] || level;
}

// Helper functions for health checkups display
// Symptoms are stored in request.evidence with 'label' as the name field
// Symptom IDs start with 's_' (vs risk factors which start with 'p_')
function getCheckupSymptoms(checkup) {
	// Handle both flattened format (from getPatientFullHealthRecords) and raw format
	const symptoms = checkup.symptoms || [];
	const evidence = checkup.request?.evidence || [];

	// Use flattened symptoms if available, otherwise extract from evidence
	if (symptoms.length > 0) {
		const symptomNames = symptoms
			.slice(0, 3)
			.map(s => s.label || s.name || s.common_name)
			.join(', ');
		return symptomNames || 'Health assessment';
	}

	if (evidence.length === 0) return 'General checkup';

	const symptomNames = evidence
		.filter(s => s.choice_id === 'present' && s.id?.startsWith('s_'))
		.slice(0, 3)
		.map(s => s.label || s.common_name || s.name)
		.join(', ');

	return symptomNames || 'Health assessment';
}

function getTriageClass(level) {
	if (!level) return 'triage-unknown';
	const levelLower = level.toLowerCase();
	if (levelLower.includes('emergency')) return 'triage-emergency';
	if (levelLower.includes('consultation_24')) return 'triage-urgent';
	if (levelLower.includes('consultation')) return 'triage-moderate';
	if (levelLower.includes('self_care')) return 'triage-low';
	return 'triage-unknown';
}

function formatTriageLabel(level) {
	if (!level) return 'N/A';
	const levelLower = level.toLowerCase();
	if (levelLower.includes('emergency')) return 'Emergency';
	if (levelLower.includes('consultation_24')) return 'Urgent';
	if (levelLower.includes('consultation')) return 'Moderate';
	if (levelLower.includes('self_care')) return 'Low';
	return level;
}

function getTriageIcon(level) {
	if (!level) return 'hi-question-mark-circle';
	const levelLower = level.toLowerCase();
	if (levelLower.includes('emergency')) return 'hi-exclamation-circle';
	if (levelLower.includes('consultation_24')) return 'hi-exclamation';
	if (levelLower.includes('consultation')) return 'hi-information-circle';
	if (levelLower.includes('self_care')) return 'hi-check-circle';
	return 'hi-question-mark-circle';
}

function getConditionUrgency(probability) {
	if (probability >= 0.7) return 'high';
	if (probability >= 0.4) return 'medium';
	return 'low';
}

function viewCheckupDetail(checkup) {
	const checkupId = checkup.id || checkup._id;
	if (!checkupId) return;

	router.push({
		name: 'SpecialistPatientCheckupDetail',
		params: {
			appointmentId: 'dashboard',
			checkupId: checkupId
		},
		query: {
			patientId: patientId.value,
			patientName: getFullName(patient.value),
			patientGender: patient.value?.profile?.gender,
			patientAge: patient.value?.profile?.date_of_birth
				? moment().diff(moment(patient.value.profile.date_of_birth), 'years')
				: ''
		}
	});
}

function formatAptDay(date) {
	if (!date) return '-';
	return moment(date).format('DD');
}

function formatAptMonth(date) {
	if (!date) return '';
	return moment(date).format('MMM');
}

function formatAptTime(date) {
	if (!date) return '';
	return moment(date).format('h:mm A');
}

function formatCurrency(amount) {
	if (!amount && amount !== 0) return null;
	return new Intl.NumberFormat('en-NG', {
		style: 'currency',
		currency: 'NGN',
		minimumFractionDigits: 0,
	}).format(amount);
}

function formatAddress(address) {
	if (!address) return '';
	if (typeof address === 'string') return address;
	const parts = [address.street, address.city, address.state, address.country].filter(Boolean);
	return parts.join(', ');
}

function formatEventType(type) {
	const types = {
		appointment: 'Appointment',
		prescription: 'Prescription',
		health_checkup: 'Health Checkup',
		pharmacy_order: 'Pharmacy Order',
		purchase: 'Purchase',
		vital: 'Vital Recorded',
	};
	return types[type] || type;
}

function getTimelineIcon(type) {
	const icons = {
		appointment: 'hi-calendar',
		prescription: 'ri-capsule-line',
		health_checkup: 'hi-clipboard-check',
		pharmacy_order: 'hi-shopping-bag',
		purchase: 'hi-shopping-cart',
		vital: 'hi-heart',
	};
	return icons[type] || 'hi-clock';
}

function getTimelineDescription(event) {
	const { type, data } = event;
	switch (type) {
		case 'appointment':
			return `${data.appointmentType || 'Consultation'} appointment - ${data.status}${data.hasNotes ? ' (with clinical notes)' : ''}`;
		case 'prescription':
			return `Prescription with ${data.medicationCount || 0} medication(s) - ${data.status || 'Created'}`;
		case 'health_checkup':
			return `AI Health checkup completed${data.triageLevel ? ` - ${data.triageLevel} triage` : ''}${data.conditionCount ? ` (${data.conditionCount} conditions identified)` : ''}`;
		case 'pharmacy_order':
			return `Pharmacy order placed - ${data.itemCount || 0} item(s)${data.status ? ` - ${data.status}` : ''}`;
		default:
			return 'Activity recorded';
	}
}

const fetchTimelineData = async (page = 1) => {
	if (!patientId.value) return;
	try {
		const response = await $http.$_getSpecialistPatientTimeline(patientId.value, { page, limit: 20 });
		const data = response.data?.data || response.data;
		timelineData.value = {
			items: data.timeline || [],
			pagination: data.pagination || null,
		};
	} catch (err) {
		console.error('Error fetching timeline:', err);
	}
};

function getScoreClass(score) {
	if (score === null || score === undefined) return '';
	if (score >= 80) return 'excellent';
	if (score >= 60) return 'good';
	if (score >= 40) return 'fair';
	return 'poor';
}

// Alias for score ring (same as getScoreClass)
function getScoreClassForRing(score) {
	return getScoreClass(score);
}

function getScoreLabelText(score) {
	if (score === null || score === undefined) return 'Not Available';
	if (score >= 80) return 'Excellent';
	if (score >= 60) return 'Good';
	if (score >= 40) return 'Fair';
	return 'Needs Attention';
}

function getStrokeDashoffset(score) {
	const circumference = 2 * Math.PI * 52; // 326.73
	const progress = (score || 0) / 100;
	return circumference * (1 - progress);
}

function getRiskClass(level) {
	if (!level) return '';
	const lower = level.toLowerCase();
	if (lower === 'emergency' || lower === 'emergency_ambulance' || lower === 'critical') return 'emergency';
	if (lower === 'high' || lower === 'consultation_24') return 'high';
	if (lower === 'medium' || lower === 'consultation') return 'medium';
	return 'low';
}

function formatRiskLevel(level) {
	if (!level) return '-';
	const lower = level.toLowerCase();
	if (lower === 'critical' || lower === 'emergency' || lower === 'emergency_ambulance') return 'Critical';
	if (lower === 'high' || lower === 'consultation_24') return 'High';
	if (lower === 'medium' || lower === 'consultation') return 'Medium';
	return 'Low';
}

function getActivityIcon(type) {
	const icons = {
		appointment: 'hi-calendar',
		prescription: 'ri-capsule-fill',
		health_checkup: 'hi-heart',
		purchase: 'hi-shopping-bag',
		vital: 'hi-chart-bar',
	};
	return icons[type] || 'hi-clock';
}

function getTabCount(tab) {
	switch (tab) {
		case 'health':
			return patientStats.value?.healthCheckupCount || overview.value?.stats?.totalCheckups || healthRecords.value?.checkups?.length || 0;
		case 'prescriptions':
			return (prescriptions.value.stats?.total || 0) + (uploadedPrescriptions.value.stats?.total || 0) + (pharmacyOrders.value.stats?.total || 0);
		case 'appointments':
			return patientStats.value?.totalAppointments || 0;
		case 'purchases':
			return purchases.value?.length || 0;
		default:
			return 0;
	}
}

// Medications tab methods
const toggleSection = (section) => {
	expandedSections.value[section] = !expandedSections.value[section];
};

const scrollToSection = (section) => {
	if (!expandedSections.value[section]) {
		expandedSections.value[section] = true;
	}
	const sectionRefs = {
		specialist: specialistSection,
		uploaded: uploadedSection,
		orders: ordersSection,
	};
	setTimeout(() => {
		sectionRefs[section]?.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}, 100);
};

const fetchMedicationPrescriptions = async (page = 1) => {
	if (!patientId.value) return;
	try {
		const response = await $http.$_getPatientPrescriptionsForSpecialist(patientId.value, { page, limit: 10 });
		const data = response.data?.data || response.data;
		prescriptions.value = data;
	} catch (err) {
		console.error('Error fetching prescriptions:', err);
	}
};

const fetchUploadedPrescriptions = async (page = 1) => {
	if (!patientId.value) return;
	try {
		const response = await $http.$_getPatientUploadedPrescriptions(patientId.value, { page, limit: 10 });
		const data = response.data?.data || response.data;
		uploadedPrescriptions.value = data;
	} catch (err) {
		console.error('Error fetching uploaded prescriptions:', err);
	}
};

const fetchPharmacyOrders = async (page = 1) => {
	if (!patientId.value) return;
	try {
		const response = await $http.$_getPatientPharmacyOrders(patientId.value, { page, limit: 10 });
		const data = response.data?.data || response.data;
		pharmacyOrders.value = data;
	} catch (err) {
		console.error('Error fetching pharmacy orders:', err);
	}
};

const getPrescriptionStatusClass = (status) => {
	const statusMap = {
		'pending': 'pending',
		'paid': 'paid',
		'processing': 'processing',
		'dispensed': 'dispensed',
		'delivered': 'delivered',
		'completed': 'completed',
		'cancelled': 'cancelled',
		'refunded': 'refunded'
	};
	return statusMap[status?.toLowerCase()] || 'pending';
};

const formatPrescriptionStatus = (status) => {
	const statusMap = {
		'pending': 'Pending',
		'paid': 'Paid',
		'processing': 'Processing',
		'dispensed': 'Dispensed',
		'delivered': 'Delivered',
		'completed': 'Completed',
		'cancelled': 'Cancelled',
		'refunded': 'Refunded'
	};
	return statusMap[status?.toLowerCase()] || status || 'Pending';
};

const getUploadStatusClass = (status) => {
	const statusMap = {
		'PENDING': 'pending',
		'TIER1_PROCESSING': 'processing',
		'TIER2_PROCESSING': 'processing',
		'PHARMACIST_REVIEW': 'review',
		'VERIFIED': 'verified',
		'REJECTED': 'rejected',
		'CLARIFICATION_NEEDED': 'clarification',
	};
	return statusMap[status] || 'pending';
};

const formatUploadStatus = (status) => {
	const statusMap = {
		'PENDING': 'Pending',
		'TIER1_PROCESSING': 'Processing',
		'TIER2_PROCESSING': 'Verifying',
		'PHARMACIST_REVIEW': 'Under Review',
		'VERIFIED': 'Verified',
		'REJECTED': 'Rejected',
		'CLARIFICATION_NEEDED': 'Needs Info',
	};
	return statusMap[status] || status || 'Unknown';
};

const getOrderStatusClass = (status) => {
	const statusMap = {
		'PENDING': 'pending',
		'CONFIRMED': 'confirmed',
		'PROCESSING': 'processing',
		'READY_FOR_PICKUP': 'ready',
		'OUT_FOR_DELIVERY': 'transit',
		'DELIVERED': 'delivered',
		'COMPLETED': 'completed',
		'CANCELLED': 'cancelled',
		'REFUNDED': 'refunded',
	};
	return statusMap[status] || 'pending';
};

const formatOrderStatus = (status) => {
	const statusMap = {
		'PENDING': 'Pending',
		'CONFIRMED': 'Confirmed',
		'PROCESSING': 'Processing',
		'READY_FOR_PICKUP': 'Ready',
		'OUT_FOR_DELIVERY': 'In Transit',
		'DELIVERED': 'Delivered',
		'COMPLETED': 'Completed',
		'CANCELLED': 'Cancelled',
		'REFUNDED': 'Refunded',
	};
	return statusMap[status] || status || 'Unknown';
};

// Appointments tab methods
const fetchAppointmentsData = async (page = 1) => {
	if (!patientId.value) return;
	try {
		const response = await $http.$_getPatientFullHealthRecords(patientId.value, {
			appointmentsPage: page,
			appointmentsLimit: 10,
		});
		const data = response.data?.data || response.data;
		appointmentsData.value = {
			items: data.appointments?.items || data.appointments || [],
			pagination: data.appointments?.pagination || null,
		};
	} catch (err) {
		console.error('Error fetching appointments:', err);
	}
};

const getAppointmentDisplayStatus = (apt) => {
	if (isAppointmentMissed(apt)) return 'Missed';
	const status = apt.status?.toUpperCase();
	const labels = {
		'OPEN': 'Scheduled',
		'ONGOING': 'Ongoing',
		'COMPLETED': 'Completed',
		'CANCELLED': 'Cancelled',
		'RESCHEDULED': 'Rescheduled',
		'NO_SHOW': 'No Show',
		'MISSED': 'Missed',
	};
	return labels[status] || apt.status || 'Unknown';
};

const getAppointmentStatusClass = (apt) => {
	if (isAppointmentMissed(apt)) return 'missed';
	const status = apt.status?.toLowerCase();
	const classes = {
		'open': 'scheduled',
		'ongoing': 'ongoing',
		'completed': 'completed',
		'cancelled': 'cancelled',
		'rescheduled': 'rescheduled',
		'no_show': 'missed',
		'missed': 'missed',
	};
	return classes[status] || status || 'unknown';
};

const formatDateTime = (date) => {
	if (!date) return '-';
	return moment(date).format('MMM DD, YYYY h:mm A');
};

const formatAppointmentDay = (date) => {
	if (!date) return '-';
	return moment(date).format('DD');
};

const formatAppointmentMonth = (date) => {
	if (!date) return '';
	return moment(date).format('MMM');
};

const formatAppointmentTime = (date) => {
	if (!date) return '';
	return moment(date).format('h:mm A');
};

const formatCallDuration = (seconds) => {
	if (seconds === null || seconds === undefined || isNaN(seconds)) return null;
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}m ${secs}s`;
};

const setAppointmentStatusFilter = (status) => {
	appointmentStatusFilter.value = status;
};

const normalizeAppointmentStatus = (apt) => {
	if (isAppointmentMissed(apt)) return 'no_show';
	const status = apt.status?.toUpperCase();
	const statusMap = {
		'OPEN': 'confirmed',
		'ONGOING': 'in_progress',
		'COMPLETED': 'completed',
		'CANCELLED': 'cancelled',
		'RESCHEDULED': 'rescheduled',
		'NO_SHOW': 'no_show',
		'MISSED': 'no_show',
	};
	return statusMap[status] || 'pending';
};

const getChannelLabel = (channel) => {
	const channelMap = {
		'zoom': 'Zoom',
		'google_meet': 'Google Meet',
		'whatsapp': 'WhatsApp',
		'phone': 'Phone Call',
		'in_person': 'In Person',
		'video': 'Video Call',
	};
	return channelMap[channel?.toLowerCase()] || channel || 'Video Call';
};

const getChannelIcon = (channel) => {
	const iconMap = {
		'zoom': 'hi-video-camera',
		'google_meet': 'hi-video-camera',
		'whatsapp': 'co-whatsapp',
		'phone': 'hi-phone',
		'in_person': 'hi-office-building',
		'video': 'hi-video-camera',
	};
	return iconMap[channel?.toLowerCase()] || 'hi-video-camera';
};

const formatAppointmentDate = (date) => {
	if (!date) return '-';
	return moment(date).format('ddd, MMM D');
};

const formatAppointmentFee = (apt) => {
	// Try to get fee from various fields
	const fee = apt.appointment_fee || apt.total_amount || apt.fee || apt.amount;

	if (!fee && fee !== 0) return '-';
	if (fee === 0) return 'Free';

	// Format with Nigerian Naira
	return new Intl.NumberFormat('en-NG', {
		style: 'currency',
		currency: 'NGN',
		minimumFractionDigits: 0,
	}).format(fee);
};

const viewAppointmentDetails = (apt) => {
	const appointmentId = apt.id || apt._id;
	if (!appointmentId) return;
	activeAptMenu.value = null;  // Close menu
	router.push({
		path: `/app/specialist/appointments-v2/${appointmentId}`,
	});
};

const formatDuration = (durationMinutes, callDuration, status) => {
	// For completed appointments, show actual call duration if available
	const normalizedStatus = status?.toLowerCase();
	if (normalizedStatus === 'completed' && callDuration) {
		// Handle object format: { time_taken: 30, unit: "Minutes" }
		if (typeof callDuration === 'object') {
			const timeTaken = callDuration.time_taken || callDuration.timeTaken || 0;
			const unit = callDuration.unit?.toLowerCase() || 'minutes';
			if (timeTaken > 0) {
				if (unit === 'hours' || unit === 'hour') {
					return `${timeTaken}h`;
				}
				return `${timeTaken} min`;
			}
		}
		// Handle string format (legacy)
		if (typeof callDuration === 'string') {
			const parsed = parseInt(callDuration);
			if (!isNaN(parsed) && parsed > 0) {
				return `${parsed} min`;
			}
		}
	}

	// For non-completed or if no call duration, show scheduled duration
	if (durationMinutes && typeof durationMinutes === 'number' && durationMinutes > 0) {
		if (durationMinutes >= 60) {
			const hrs = Math.floor(durationMinutes / 60);
			const mins = durationMinutes % 60;
			return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
		}
		return `${durationMinutes} min`;
	}

	return '-';
};

const toggleAptMenu = (aptId) => {
	if (activeAptMenu.value === aptId) {
		activeAptMenu.value = null;
	} else {
		activeAptMenu.value = aptId;
	}
};

const rescheduleAppointment = (apt) => {
	activeAptMenu.value = null;
	// Navigate to reschedule - for now just view details
	viewAppointmentDetails(apt);
};

const cancelAppointment = (apt) => {
	activeAptMenu.value = null;
	// For now just show a toast - would need a modal for proper implementation
	$toast?.warning('Cancel functionality coming soon');
};

// Close dropdown when clicking outside
const closeAptMenu = () => {
	activeAptMenu.value = null;
};

// Handle specialist image load error - show fallback icon
const handleSpecialistImgError = (event) => {
	event.target.style.display = 'none';
	// Show the fallback icon by adding a sibling
	const parent = event.target.parentElement;
	if (parent && !parent.querySelector('.fallback-icon')) {
		const icon = document.createElement('span');
		icon.className = 'fallback-icon';
		icon.innerHTML = '<svg viewBox="0 0 20 20" fill="currentColor" style="width:24px;height:24px;color:#94a3b8"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clip-rule="evenodd"/></svg>';
		parent.appendChild(icon);
	}
};

// Initialize
onMounted(() => {
	// Close dropdown when clicking outside
	document.addEventListener('click', closeAptMenu);
	fetchPatientData();
	// Data for other tabs is lazy-loaded via loadTabData when user switches tabs
});

onUnmounted(() => {
	document.removeEventListener('click', closeAptMenu);
});
</script>

<style scoped lang="scss">
.page-content {
	display: flex;
	flex-direction: column;
	width: 100%;
	height: 100%;
	padding: 0;
	background: #F8FAFC;

	@include responsive(tab-portrait) {
		padding: 0;
	}

	&__body {
		display: flex;
		flex-direction: column;
		width: 100%;
		max-width: 1400px;
		margin: 0 auto;
		height: 100%;
		overflow-y: auto;
		padding-bottom: 100px;

		&::-webkit-scrollbar {
			width: 6px;
		}

		&::-webkit-scrollbar-track {
			background: transparent;
		}

		&::-webkit-scrollbar-thumb {
			background: #CBD5E1;
			border-radius: 3px;
		}
	}
}

// Hero Banner
.hero-banner {
	background: linear-gradient(135deg, #4FC3F7 0%, #29B6F6 50%, #0288D1 100%);
	border-radius: $size-24;
	padding: $size-24 $size-48;
	margin: $size-24 $size-48 0;
	color: white;
	box-shadow: 0 10px 40px rgba(79, 195, 247, 0.3);

	@media (max-width: 768px) {
		margin: $size-16;
		padding: $size-20;
		border-radius: $size-16;
	}
}

.hero-top {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: $size-24;
}

.back-link {
	display: inline-flex;
	align-items: center;
	gap: $size-8;
	background: rgba(255, 255, 255, 0.15);
	border: none;
	padding: $size-10 $size-16;
	border-radius: $size-8;
	color: white;
	font-size: $size-14;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: rgba(255, 255, 255, 0.25);
	}
}

.star-btn {
	display: inline-flex;
	align-items: center;
	gap: $size-8;
	background: rgba(255, 255, 255, 0.15);
	border: 1px solid rgba(255, 255, 255, 0.3);
	padding: $size-10 $size-16;
	border-radius: $size-8;
	color: white;
	font-size: $size-14;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: rgba(255, 255, 255, 0.25);
	}

	&.starred {
		background: #f59e0b;
		border-color: #f59e0b;
	}
}

.hero-main {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: $size-32;

	@media (max-width: 992px) {
		flex-direction: column;
	}
}

.patient-header {
	display: flex;
	gap: $size-20;
	align-items: flex-start;
}

.patient-avatar {
	flex-shrink: 0;
}

.patient-info {
	.patient-badge {
		display: inline-block;
		background: rgba(255, 255, 255, 0.2);
		padding: $size-4 $size-12;
		border-radius: $size-4;
		font-size: $size-11;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: $size-8;
	}

	.patient-name {
		font-size: $size-28;
		font-weight: $fw-bold;
		margin: 0 0 $size-12;

		@media (max-width: 768px) {
			font-size: $size-22;
		}
	}

	.patient-meta {
		display: flex;
		flex-wrap: wrap;
		gap: $size-16;
		margin-bottom: $size-8;

		.meta-item {
			display: flex;
			align-items: center;
			gap: $size-6;
			font-size: $size-14;
			opacity: 0.9;
		}
	}

	.patient-address {
		display: flex;
		align-items: center;
		gap: $size-6;
		font-size: $size-13;
		opacity: 0.8;
	}
}

.hero-scores {
	display: flex;
	gap: $size-12;
	flex-wrap: wrap;

	@media (max-width: 992px) {
		width: 100%;
	}
}

.score-card {
	background: rgba(255, 255, 255, 0.15);
	backdrop-filter: blur(10px);
	border-radius: $size-12;
	padding: $size-16 $size-20;
	text-align: center;
	border: 1px solid rgba(255, 255, 255, 0.2);
	min-width: 100px;
	color: white;

	&.excellent { border-color: #10b981; background: rgba(16, 185, 129, 0.2); }
	&.good { border-color: #3b82f6; background: rgba(59, 130, 246, 0.2); }
	&.fair { border-color: #f59e0b; background: rgba(245, 158, 11, 0.2); }
	&.poor { border-color: #ef4444; background: rgba(239, 68, 68, 0.2); }

	&.advanced {
		border-color: #8b5cf6;
		background: rgba(139, 92, 246, 0.2);
	}

	&.risk {
		&.emergency { border-color: #ef4444; background: rgba(239, 68, 68, 0.3); }
		&.high { border-color: #f97316; background: rgba(249, 115, 22, 0.3); }
		&.medium { border-color: #f59e0b; background: rgba(245, 158, 11, 0.3); }
		&.low { border-color: #10b981; background: rgba(16, 185, 129, 0.3); }
	}

	.score-label {
		display: block;
		font-size: $size-11;
		color: white;
		opacity: 0.8;
		text-transform: uppercase;
		margin-bottom: $size-4;
	}

	.score-value {
		display: block;
		font-size: $size-24;
		color: white;
		font-weight: $fw-bold;
	}
}

// Quick Actions
.quick-actions {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: $size-16;
	padding: $size-20 $size-48;

	@media (max-width: 768px) {
		padding: $size-16;
		flex-direction: column;
		align-items: stretch;
	}
}

.actions-group {
	display: flex;
	gap: $size-12;

	&.primary-actions {
		flex-wrap: wrap;
	}

	&.contact-actions {
		display: flex;
		gap: $size-8;
	}

	@media (max-width: 768px) {
		&.primary-actions {
			width: 100%;
		}

		&.contact-actions {
			justify-content: center;
		}
	}
}

.action-btn {
	display: inline-flex;
	align-items: center;
	gap: $size-8;
	padding: $size-12 $size-20;
	background: white;
	border: 1px solid $color-g-85;
	border-radius: $size-12;
	font-size: $size-14;
	font-weight: $fw-medium;
	color: $color-g-36;
	cursor: pointer;
	transition: all 0.2s ease;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

	&:hover {
		border-color: #4FC3F7;
		color: #4FC3F7;
		box-shadow: 0 4px 12px rgba(79, 195, 247, 0.15);
	}

	&.primary {
		background: linear-gradient(135deg, #4FC3F7 0%, #29B6F6 100%);
		border: none;
		color: white;

		&:hover {
			box-shadow: 0 4px 16px rgba(79, 195, 247, 0.4);
			color: white;
		}
	}

	@media (max-width: 480px) {
		flex: 1;
		justify-content: center;
	}
}

.contact-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 44px;
	height: 44px;
	border-radius: 50%;
	border: none;
	cursor: pointer;
	transition: all 0.2s ease;

	&.call {
		background: #D1FAE5;
		color: #059669;

		&:hover {
			background: #059669;
			color: white;
		}
	}

	&.email {
		background: #DBEAFE;
		color: #2563EB;

		&:hover {
			background: #2563EB;
			color: white;
		}
	}

	&.message {
		background: #F3E8FF;
		color: #7C3AED;

		&:hover {
			background: #7C3AED;
			color: white;
		}
	}
}

// Stats Summary
.stats-summary {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: $size-16;
	padding: 0 $size-48 $size-20;

	@media (max-width: 992px) {
		grid-template-columns: repeat(2, 1fr);
	}

	@media (max-width: 480px) {
		padding: 0 $size-16 $size-16;
		gap: $size-12;
	}
}

.stat-card-mini {
	display: flex;
	align-items: center;
	gap: $size-12;
	background: white;
	padding: $size-16;
	border-radius: $size-12;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

	.stat-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: $size-10;

		&.blue {
			background: #E0F2FE;
			color: #0288D1;
		}

		&.green {
			background: #D1FAE5;
			color: #059669;
		}

		&.purple {
			background: #F3E8FF;
			color: #7C3AED;
		}

		&.orange {
			background: #FFEDD5;
			color: #EA580C;
		}
	}

	.stat-info {
		display: flex;
		flex-direction: column;
	}

	.stat-value {
		font-size: $size-18;
		font-weight: $fw-bold;
		color: $color-g-21;
	}

	.stat-label {
		font-size: $size-12;
		color: $color-g-54;
	}
}

// Loading & Error States
.loading-state, .error-state {
	text-align: center;
	padding: $size-64;
}

.loading-spinner {
	display: inline-block;
	position: relative;
	width: 60px;
	height: 60px;
	margin-bottom: $size-16;

	.spinner-ring {
		position: absolute;
		inset: 0;
		border: 3px solid $color-g-90;
		border-top-color: #4FC3F7;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
}

@keyframes spin {
	to { transform: rotate(360deg); }
}

@keyframes shimmer {
	0% { background-position: 200% 0; }
	100% { background-position: -200% 0; }
}

// Skeleton Loading
.skeleton-loading {
	.hero-banner.skeleton {
		background: linear-gradient(135deg, #f0f9fa 0%, #e8f6f7 100%);
		padding: $size-32 $size-48;
		border-radius: 0 0 $size-32 $size-32;

		.hero-top {
			display: flex;
			justify-content: space-between;
			margin-bottom: $size-24;

			.skeleton-line.back-btn {
				width: 140px;
				height: $size-36;
				border-radius: $size-8;
			}

			.skeleton-line.star-btn {
				width: 120px;
				height: $size-36;
				border-radius: $size-8;
			}
		}

		.hero-main {
			display: flex;
			justify-content: space-between;
			align-items: flex-start;
			gap: $size-32;
		}

		.patient-header {
			display: flex;
			gap: $size-24;
		}
	}

	.skeleton-avatar {
		width: 100px;
		height: 100px;
		border-radius: 50%;
		background: linear-gradient(90deg, rgba(79, 195, 247, 0.1) 25%, rgba(79, 195, 247, 0.2) 50%, rgba(79, 195, 247, 0.1) 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}

	.skeleton-line {
		background: linear-gradient(90deg, rgba(79, 195, 247, 0.1) 25%, rgba(79, 195, 247, 0.2) 50%, rgba(79, 195, 247, 0.1) 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		border-radius: $size-4;

		&.badge {
			width: 120px;
			height: $size-22;
			margin-bottom: $size-8;
		}

		&.name {
			width: 220px;
			height: $size-32;
			margin-bottom: $size-12;
		}

		&.meta {
			width: 350px;
			height: $size-18;
			margin-bottom: $size-8;
		}

		&.address {
			width: 280px;
			height: $size-16;
		}
	}

	.hero-scores {
		display: flex;
		gap: $size-16;
	}

	.skeleton-score {
		width: 100px;
		height: 70px;
		border-radius: $size-12;
		background: linear-gradient(90deg, rgba(79, 195, 247, 0.1) 25%, rgba(79, 195, 247, 0.2) 50%, rgba(79, 195, 247, 0.1) 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}

	.quick-actions.skeleton {
		display: flex;
		gap: $size-16;
		padding: $size-24 $size-48;

		.skeleton-action {
			flex: 1;
			height: 50px;
			border-radius: $size-10;
			background: linear-gradient(90deg, $color-g-95 25%, $color-g-90 50%, $color-g-95 75%);
			background-size: 200% 100%;
			animation: shimmer 1.5s infinite;
		}
	}

	.tabs-navigation.skeleton {
		display: flex;
		gap: $size-12;
		padding: 0 $size-48;
		margin-bottom: $size-24;

		.skeleton-tab {
			width: 100px;
			height: $size-40;
			border-radius: $size-8;
			background: linear-gradient(90deg, $color-g-95 25%, $color-g-90 50%, $color-g-95 75%);
			background-size: 200% 100%;
			animation: shimmer 1.5s infinite;
		}
	}

	.tab-content.skeleton {
		padding: 0 $size-48;
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: $size-24;

		.skeleton-card {
			height: 200px;
			border-radius: $size-16;
			background: linear-gradient(90deg, $color-g-95 25%, $color-g-90 50%, $color-g-95 75%);
			background-size: 200% 100%;
			animation: shimmer 1.5s infinite;
		}
	}

	@media (max-width: 768px) {
		.hero-banner.skeleton {
			padding: $size-16;
			border-radius: 0 0 $size-20 $size-20;

			.hero-main {
				flex-direction: column;
			}

			.patient-header {
				flex-direction: column;
				align-items: center;
				text-align: center;
			}

			.hero-scores {
				width: 100%;
				justify-content: center;
			}
		}

		.quick-actions.skeleton {
			padding: $size-16;
			flex-direction: column;
		}

		.tabs-navigation.skeleton {
			padding: 0 $size-16;
			overflow-x: auto;
		}

		.tab-content.skeleton {
			padding: 0 $size-16;
			grid-template-columns: 1fr;
		}
	}
}

.error-illustration {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 100px;
	height: 100px;
	background: rgba(239, 68, 68, 0.1);
	border-radius: 50%;
	margin-bottom: $size-24;

	.error-icon {
		color: #ef4444;
	}
}

.error-state {
	h2 {
		font-size: $size-22;
		color: $color-g-21;
		margin: 0 0 $size-8;
	}

	p {
		color: $color-g-54;
		margin: 0 0 $size-24;
	}

	.retry-btn {
		display: inline-flex;
		align-items: center;
		gap: $size-8;
		padding: $size-12 $size-24;
		background: linear-gradient(135deg, #4FC3F7 0%, #29B6F6 100%);
		color: white;
		border: none;
		border-radius: $size-8;
		font-size: $size-14;
		font-weight: $fw-medium;
		cursor: pointer;

		&:hover {
			box-shadow: 0 4px 16px rgba(79, 195, 247, 0.3);
		}
	}
}

// Dashboard Content
.dashboard-content {
	padding: 0 $size-48;

	@media (max-width: 768px) {
		padding: 0 $size-16;
	}
}

// Tabs Navigation
.tabs-navigation {
	display: flex;
	gap: $size-12;
	margin-bottom: $size-24;
	overflow-x: auto;
	padding-bottom: $size-8;

	&::-webkit-scrollbar {
		display: none;
	}

	@media (max-width: 768px) {
		gap: $size-8;
	}
}

.tab-btn {
	display: inline-flex;
	align-items: center;
	gap: $size-8;
	padding: $size-12 $size-20;
	border: none;
	border-radius: $size-24;
	background: white;
	color: $color-g-44;
	font-size: $size-14;
	font-weight: $fw-medium;
	cursor: pointer;
	transition: all 0.2s ease;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
	white-space: nowrap;

	&:hover {
		color: #4FC3F7;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	&.active {
		background: linear-gradient(135deg, #4FC3F7 0%, #29B6F6 100%);
		color: white;
		box-shadow: 0 4px 16px rgba(79, 195, 247, 0.3);
	}

	.tab-count {
		background: rgba(0, 0, 0, 0.1);
		padding: 2px 8px;
		border-radius: 12px;
		font-size: $size-12;
	}

	&.active .tab-count {
		background: rgba(255, 255, 255, 0.2);
	}

	@media (max-width: 480px) {
		padding: $size-10 $size-14;
		font-size: $size-13;
		gap: $size-6;
	}
}

// Overview Grid
.overview-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: $size-20;

	@media (max-width: 992px) {
		grid-template-columns: 1fr;
	}
}

.info-card {
	background: white;
	border-radius: $size-16;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
	overflow: hidden;
}

.card-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: $size-20;
	border-bottom: 1px solid $color-g-92;

	h3 {
		display: flex;
		align-items: center;
		gap: $size-8;
		font-size: $size-16;
		font-weight: $fw-semi-bold;
		color: $color-g-21;
		margin: 0;
	}

	.view-all-btn {
		background: none;
		border: none;
		color: #4FC3F7;
		font-size: $size-13;
		font-weight: $fw-medium;
		cursor: pointer;

		&:hover {
			text-decoration: underline;
		}
	}
}

.card-body {
	padding: $size-20;
}

.card-empty, .section-empty {
	text-align: center;
	padding: $size-32;
	color: $color-g-54;
}

// Vitals Grid
.vitals-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: $size-12;
}

.vital-item {
	background: $color-g-97;
	padding: $size-12;
	border-radius: $size-8;

	.vital-type {
		display: block;
		font-size: $size-11;
		color: $color-g-54;
		text-transform: uppercase;
		margin-bottom: $size-4;
	}

	.vital-value {
		display: block;
		font-size: $size-18;
		font-weight: $fw-semi-bold;
		color: $color-g-21;

		small {
			font-size: $size-12;
			color: $color-g-54;
			font-weight: $fw-regular;
		}
	}

	.vital-date {
		display: block;
		font-size: $size-11;
		color: $color-g-67;
		margin-top: $size-4;
	}
}

// Medical History
.history-section {
	margin-bottom: $size-16;

	&:last-child {
		margin-bottom: 0;
	}

	h4 {
		font-size: $size-13;
		color: $color-g-44;
		margin: 0 0 $size-8;
	}
}

.tag-list {
	display: flex;
	flex-wrap: wrap;
	gap: $size-6;

	&.warning .tag {
		background: rgba(239, 68, 68, 0.1);
		color: #dc2626;
	}
}

.tag {
	padding: $size-4 $size-10;
	background: $color-g-92;
	border-radius: $size-4;
	font-size: $size-12;
	color: $color-g-36;
}

// Activity List
.activity-list {
	display: flex;
	flex-direction: column;
	gap: $size-12;
}

.activity-item {
	display: flex;
	gap: $size-12;

	.activity-icon {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: $color-g-92;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;

		&.appointment { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
		&.prescription { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
		&.health_checkup, &.checkup { background: rgba(16, 185, 129, 0.1); color: #10b981; }
		&.purchase { background: rgba(236, 72, 153, 0.1); color: #ec4899; }
	}

	.activity-content {
		flex: 1;

		p {
			font-size: $size-14;
			color: $color-g-21;
			margin: 0 0 $size-4;
		}

		.triage-badge {
			display: inline-block;
			font-size: $size-11;
			padding: $size-2 $size-8;
			border-radius: $size-12;
			margin-right: $size-8;

			&.emergency, &.emergency_ambulance { background: rgba(239, 68, 68, 0.15); color: #dc2626; }
			&.consultation_24 { background: rgba(249, 115, 22, 0.15); color: #ea580c; }
			&.consultation { background: rgba(245, 158, 11, 0.15); color: #d97706; }
			&.self_care { background: rgba(16, 185, 129, 0.15); color: #059669; }
		}

		.activity-date {
			font-size: $size-12;
			color: $color-g-54;
		}
	}
}

// Checkups List (matching UpcomingAppointments.vue style)
.checkups-list {
	display: flex;
	flex-direction: column;
	gap: $size-12;
}

.checkup-item {
	display: flex;
	align-items: flex-start;
	gap: $size-12;
	padding: $size-12;
	background: $color-g-97;
	border-radius: $size-8;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: $color-g-92;
	}
}

.checkup-icon {
	width: 36px;
	height: 36px;
	border-radius: $size-8;
	background: rgba(79, 195, 247, 0.1);
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	color: #4FC3F7;
}

.checkup-content {
	flex: 1;
	min-width: 0;

	.checkup-date {
		display: block;
		font-size: $size-12;
		color: $color-g-54;
		margin-bottom: $size-4;
	}

	.checkup-symptoms {
		display: block;
		font-size: $size-14;
		color: $color-g-21;
		font-weight: $fw-medium;
		margin-bottom: $size-4;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.checkup-result {
		display: flex;
		align-items: center;
		gap: $size-4;
		font-size: $size-13;
		color: #4FC3F7;
		font-weight: $fw-medium;
	}
}

.checkup-triage {
	padding: $size-4 $size-10;
	border-radius: $size-4;
	font-size: $size-11;
	font-weight: $fw-semi-bold;
	text-transform: uppercase;
	white-space: nowrap;

	&.triage-emergency {
		background: rgba(239, 68, 68, 0.15);
		color: #dc2626;
	}

	&.triage-urgent {
		background: rgba(249, 115, 22, 0.15);
		color: #ea580c;
	}

	&.triage-moderate {
		background: rgba(245, 158, 11, 0.15);
		color: #d97706;
	}

	&.triage-low {
		background: rgba(16, 185, 129, 0.15);
		color: #059669;
	}

	&.triage-unknown {
		background: $color-g-92;
		color: $color-g-54;
	}
}

// Stats Grid
.stats-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: $size-16;
}

.stat-item {
	text-align: center;
	padding: $size-16;
	background: $color-g-97;
	border-radius: $size-8;

	.stat-number {
		display: block;
		font-size: $size-28;
		font-weight: $fw-bold;
		color: #4FC3F7;
		margin-bottom: $size-4;

		&.small {
			font-size: $size-14;
			color: $color-g-44;
		}
	}

	.stat-label {
		font-size: $size-12;
		color: $color-g-54;
	}
}

// Records List
.records-list {
	display: flex;
	flex-direction: column;
	gap: $size-16;
}

.record-card, .prescription-card, .purchase-card {
	background: white;
	border-radius: $size-16;
	padding: $size-20;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
	border-left: 4px solid #4FC3F7;
}

.record-header, .rx-header, .purchase-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: $size-16;
}

.record-date {
	display: flex;
	align-items: center;
	gap: $size-6;
	font-size: $size-14;
	color: $color-g-44;
}

.triage-badge, .rx-status, .apt-status, .purchase-status {
	padding: $size-4 $size-12;
	border-radius: $size-4;
	font-size: $size-11;
	font-weight: $fw-semi-bold;
	text-transform: uppercase;

	&.emergency { background: rgba(239, 68, 68, 0.1); color: #dc2626; }
	&.high, &.consultation_24 { background: rgba(249, 115, 22, 0.1); color: #ea580c; }
	&.medium, &.consultation { background: rgba(245, 158, 11, 0.1); color: #d97706; }
	&.low, &.self_care { background: rgba(16, 185, 129, 0.1); color: #059669; }

	&.pending { background: rgba(245, 158, 11, 0.1); color: #d97706; }
	&.completed, &.delivered, &.open { background: rgba(16, 185, 129, 0.1); color: #059669; }
	&.cancelled, &.missed { background: rgba(239, 68, 68, 0.1); color: #dc2626; }
	&.in_progress, &.processing { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
}

.record-body, .rx-body, .purchase-body {
	h4 {
		font-size: $size-13;
		color: $color-g-44;
		margin: 0 0 $size-8;

		&:not(:first-child) {
			margin-top: $size-16;
		}
	}
}

.symptoms-list {
	display: flex;
	flex-wrap: wrap;
	gap: $size-6;
}

.symptom-tag {
	padding: $size-4 $size-10;
	background: $color-g-92;
	border-radius: $size-4;
	font-size: $size-12;
	color: $color-g-36;
}

.more-tag {
	padding: $size-4 $size-10;
	background: #4FC3F7;
	color: white;
	border-radius: $size-4;
	font-size: $size-12;
}

.conditions-list {
	display: flex;
	flex-direction: column;
	gap: $size-8;
}

.condition-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: $size-10 $size-12;
	background: $color-g-97;
	border-radius: $size-6;

	.condition-name {
		font-size: $size-14;
		color: $color-g-21;
	}

	.condition-prob {
		font-size: $size-13;
		font-weight: $fw-semi-bold;
		color: #4FC3F7;
	}
}

// Health Tab Section Header
.health-tab {
	.section-header-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24px;

		.header-title {
			display: flex;
			align-items: center;
			gap: 12px;

			svg {
				color: #4FC3F7;
			}

			h3 {
				font-size: 20px;
				font-weight: 600;
				color: #1e293b;
				margin: 0;
			}
		}

		.total-badge {
			background: linear-gradient(135deg, #f0fdfa, #e0f7fa);
			color: #29B6F6;
			padding: 6px 16px;
			border-radius: 20px;
			font-size: 13px;
			font-weight: 600;
		}
	}
}

// Health Checkup Cards (Matching PatientHealthRecords.vue)
.checkups-list {
	display: flex;
	flex-direction: column;
	gap: $size-20;
}

.checkup-card-enhanced {
	background: white;
	border-radius: 20px;
	overflow: hidden;
	border: 1px solid rgba(0, 0, 0, 0.05);
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

	.checkup-card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 18px 24px;
		background: linear-gradient(135deg, #f8fafc, #f1f5f9);
		border-bottom: 1px solid rgba(0, 0, 0, 0.05);

		&.triage-emergency {
			background: linear-gradient(135deg, rgba(#ef4444, 0.08), rgba(#ef4444, 0.04));
		}
		&.triage-urgent {
			background: linear-gradient(135deg, rgba(#f97316, 0.08), rgba(#f97316, 0.04));
		}
		&.triage-moderate {
			background: linear-gradient(135deg, rgba(#f59e0b, 0.08), rgba(#f59e0b, 0.04));
		}
		&.triage-low {
			background: linear-gradient(135deg, rgba(#10b981, 0.08), rgba(#10b981, 0.04));
		}

		.header-left {
			display: flex;
			align-items: center;
			gap: 14px;
		}

		.triage-indicator {
			width: 48px;
			height: 48px;
			border-radius: 14px;
			display: flex;
			align-items: center;
			justify-content: center;
			color: white;

			&.triage-emergency { background: linear-gradient(135deg, #ef4444, #dc2626); }
			&.triage-urgent { background: linear-gradient(135deg, #f97316, #ea580c); }
			&.triage-moderate { background: linear-gradient(135deg, #f59e0b, #d97706); }
			&.triage-low { background: linear-gradient(135deg, #10b981, #059669); }
			&.triage-unknown { background: linear-gradient(135deg, #6b7280, #4b5563); }
		}

		.header-info {
			.triage-label {
				display: block;
				font-size: 15px;
				font-weight: 600;
				color: #1e293b;
				margin-bottom: 2px;
			}
			.checkup-date-text {
				font-size: 13px;
				color: #64748b;
			}
		}

		.header-right {
			display: flex;
			gap: 10px;
		}

		.for-badge, .ai-badge {
			display: flex;
			align-items: center;
			gap: 6px;
			padding: 6px 12px;
			border-radius: 20px;
			font-size: 12px;
			font-weight: 500;
		}

		.for-badge {
			background: rgba(#4FC3F7, 0.1);
			color: #29B6F6;
		}

		.ai-badge {
			background: linear-gradient(135deg, rgba(#8b5cf6, 0.1), rgba(#6366f1, 0.1));
			color: #6366f1;
		}
	}

	.emergency-banner {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 14px 24px;
		background: linear-gradient(135deg, rgba(#ef4444, 0.1), rgba(#ef4444, 0.05));
		border-bottom: 1px solid rgba(#ef4444, 0.1);
		color: #ef4444;
		font-size: 14px;
		font-weight: 500;

		svg { flex-shrink: 0; }
	}

	.checkup-card-body {
		padding: 24px;
	}

	.ai-summary-section {
		background: linear-gradient(135deg, rgba(#8b5cf6, 0.06), rgba(#6366f1, 0.03));
		border: 1px solid rgba(#6366f1, 0.12);
		border-radius: 16px;
		padding: 20px;
		margin-bottom: 20px;

		.summary-header {
			display: flex;
			align-items: center;
			gap: 10px;
			margin-bottom: 12px;
			color: #6366f1;
			font-size: 13px;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}

		.summary-overview {
			font-size: 14px;
			color: #475569;
			line-height: 1.7;
			margin: 0 0 16px;
		}

		.key-findings {
			.findings-label {
				font-size: 12px;
				font-weight: 600;
				color: #64748b;
				text-transform: uppercase;
				letter-spacing: 0.5px;
			}

			ul {
				margin: 10px 0 0;
				padding-left: 20px;

				li {
					font-size: 13px;
					color: #475569;
					line-height: 1.6;
					margin-bottom: 6px;

					&::marker { color: #6366f1; }
				}
			}
		}
	}

	.section-label {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		font-weight: 600;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 14px;

		svg { color: #4FC3F7; }
	}

	.conditions-section {
		margin-bottom: 20px;
	}

	.conditions-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 12px;
	}

	.condition-item {
		display: block !important;
		background: #f8fafc;
		border: 1px solid #f1f5f9;
		border-radius: 12px;
		padding: 14px 16px;
		transition: all 0.3s ease;

		&:hover {
			transform: translateY(-2px);
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
		}

		&.high .prob-fill { background: linear-gradient(90deg, #f87171, #ef4444); }
		&.medium .prob-fill { background: linear-gradient(90deg, #fbbf24, #f59e0b); }
		&.low .prob-fill { background: linear-gradient(90deg, #34d399, #10b981); }

		.condition-info {
			margin-bottom: 10px;
		}

		.condition-name {
			display: block;
			font-size: 14px;
			font-weight: 600;
			color: #1e293b;
			margin-bottom: 2px;
		}

		.condition-category {
			font-size: 11px;
			color: #94a3b8;
			text-transform: capitalize;
		}

		.condition-probability {
			display: flex;
			align-items: center;
			gap: 10px;
		}

		.prob-bar {
			flex: 1;
			height: 6px;
			background: #e2e8f0;
			border-radius: 3px;
			overflow: hidden;
		}

		.prob-fill {
			height: 100%;
			border-radius: 3px;
			transition: width 0.5s ease;
		}

		.prob-value {
			font-size: 13px;
			font-weight: 700;
			color: #475569;
			min-width: 36px;
			text-align: right;
		}
	}

	.symptoms-section {
		margin-bottom: 20px;
	}

	.symptoms-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}

	.symptom-tag {
		display: flex;
		flex-direction: column;
		background: white;
		border: 1px solid #e2e8f0;
		padding: 10px 16px;
		border-radius: 12px;
		transition: all 0.3s ease;

		&:hover {
			border-color: #4FC3F7;
			box-shadow: 0 2px 8px rgba(#4FC3F7, 0.15);
		}

		.symptom-name {
			font-size: 14px;
			font-weight: 500;
			color: #1e293b;
		}
	}

	.recommendations-section {
		margin-bottom: 10px;
	}

	.specialist-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.specialist-tag {
		background: linear-gradient(135deg, rgba(#4FC3F7, 0.1), rgba(#4FC3F7, 0.05));
		color: #29B6F6;
		padding: 8px 16px;
		border-radius: 20px;
		font-size: 13px;
		font-weight: 500;
		border: 1px solid rgba(#4FC3F7, 0.15);
	}

	.checkup-card-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 24px;
		background: #fafafa;
		border-top: 1px solid #f1f5f9;
		cursor: pointer;
		transition: all 0.3s ease;

		&:hover {
			background: linear-gradient(135deg, rgba(#4FC3F7, 0.05), rgba(#4FC3F7, 0.02));

			.view-report-link { color: #29B6F6; }
			.arrow-icon {
				transform: translateX(4px);
				color: #4FC3F7;
			}
		}

		.view-report-link {
			display: flex;
			align-items: center;
			gap: 10px;
			font-size: 14px;
			font-weight: 500;
			color: #475569;
			transition: color 0.3s ease;
		}

		.arrow-icon {
			color: #94a3b8;
			transition: all 0.3s ease;
		}
	}
}

// Prescriptions
.section-group {
	margin-bottom: $size-32;
}

.section-title {
	font-size: $size-16;
	font-weight: $fw-semi-bold;
	color: $color-g-21;
	margin: 0 0 $size-16;
}

.rx-number {
	font-size: $size-15;
	font-weight: $fw-semi-bold;
	color: $color-g-21;
}

.rx-type {
	display: flex;
	align-items: center;
	gap: $size-6;
	font-size: $size-14;
	color: $color-g-44;
}

.rx-items {
	display: flex;
	flex-direction: column;
	gap: $size-8;
	margin-bottom: $size-12;
}

.rx-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: $size-10 $size-12;
	background: $color-g-97;
	border-radius: $size-6;

	.drug-name {
		font-size: $size-14;
		color: $color-g-21;
	}

	.drug-dosage {
		font-size: $size-12;
		color: $color-g-54;
	}
}

.more-items {
	font-size: $size-12;
	color: $color-g-54;
	text-align: center;
}

.rx-notes {
	font-size: $size-14;
	color: $color-g-44;
	margin: 0 0 $size-12;
}

.rx-date, .purchase-date {
	display: flex;
	align-items: center;
	gap: $size-6;
	font-size: $size-13;
	color: $color-g-54;
}

// Appointments
.appointments-list {
	display: flex;
	flex-direction: column;
	gap: $size-16;
}

.appointment-card {
	display: flex;
	gap: $size-16;
	background: white;
	border-radius: $size-16;
	padding: $size-20;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
	align-items: flex-start;
}

.apt-date-block {
	text-align: center;
	padding: $size-12 $size-16;
	background: linear-gradient(135deg, #4FC3F7 0%, #29B6F6 100%);
	border-radius: $size-8;
	min-width: 60px;

	.apt-day {
		display: block;
		font-size: $size-24;
		font-weight: $fw-bold;
		color: white;
	}

	.apt-month {
		display: block;
		font-size: $size-12;
		color: rgba(255, 255, 255, 0.8);
		text-transform: uppercase;
	}
}

.apt-content {
	flex: 1;

	.apt-time {
		display: flex;
		align-items: center;
		gap: $size-6;
		font-size: $size-14;
		color: $color-g-44;
		margin-bottom: $size-4;
	}

	.apt-type {
		font-size: $size-16;
		font-weight: $fw-semi-bold;
		color: $color-g-21;
		margin-bottom: $size-8;
	}

	.apt-notes {
		font-size: $size-13;
		color: $color-g-54;
		line-height: 1.5;
		margin: 0;
	}
}

// Purchases
.purchase-items {
	display: flex;
	flex-direction: column;
	gap: $size-8;
	margin-bottom: $size-12;
}

.purchase-item {
	display: flex;
	align-items: center;
	gap: $size-12;
	padding: $size-10 $size-12;
	background: $color-g-97;
	border-radius: $size-6;

	.item-name {
		flex: 1;
		font-size: $size-14;
		color: $color-g-21;
	}

	.item-qty {
		font-size: $size-13;
		color: $color-g-54;
	}

	.item-price {
		font-size: $size-14;
		font-weight: $fw-semi-bold;
		color: $color-g-36;
	}
}

.purchase-total {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: $size-12;
	background: $color-g-97;
	border-radius: $size-6;
	margin-bottom: $size-12;

	.total-amount {
		font-size: $size-18;
		font-weight: $fw-bold;
		color: #4FC3F7;
	}
}

// Timeline
.timeline {
	position: relative;
	padding-left: $size-40;

	&::before {
		content: '';
		position: absolute;
		left: 11px;
		top: 0;
		bottom: 0;
		width: 2px;
		background: $color-g-85;
	}
}

.timeline-item {
	position: relative;
	padding-bottom: $size-24;

	&:last-child {
		padding-bottom: 0;
	}
}

.timeline-marker {
	position: absolute;
	left: -$size-40;
	top: 0;
	width: 24px;
	height: 24px;
	border-radius: 50%;
	background: white;
	border: 2px solid $color-g-85;
	z-index: 1;

	&.appointment { border-color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
	&.prescription { border-color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
	&.health_checkup { border-color: #10b981; background: rgba(16, 185, 129, 0.1); }
	&.purchase { border-color: #ec4899; background: rgba(236, 72, 153, 0.1); }
	&.vital { border-color: #8b5cf6; background: rgba(139, 92, 246, 0.1); }
}

.timeline-card {
	background: white;
	padding: $size-16;
	border-radius: $size-12;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
	border: 1px solid $color-g-92;
}

.timeline-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: $size-8;

	.timeline-type {
		font-size: $size-13;
		font-weight: $fw-semi-bold;
		color: $color-g-21;
	}

	.timeline-date {
		font-size: $size-12;
		color: $color-g-54;
	}
}

.timeline-desc {
	font-size: $size-14;
	color: $color-g-44;
	margin: 0;
}

// Dependents
.dependents-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	gap: $size-16;
}

.dependent-card {
	display: flex;
	align-items: center;
	gap: $size-16;
	background: white;
	padding: $size-16;
	border-radius: $size-12;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

	.dep-avatar {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: linear-gradient(135deg, #4FC3F7 0%, #29B6F6 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;

		span {
			font-size: $size-16;
			font-weight: $fw-semi-bold;
			color: white;
		}
	}

	.dep-info {
		h4 {
			font-size: $size-15;
			font-weight: $fw-semi-bold;
			color: $color-g-21;
			margin: 0 0 $size-4;
		}

		p {
			font-size: $size-13;
			color: $color-g-54;
			margin: 0;
		}
	}
}

// Health Scores Tab
.scores-tab {
	.scores-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
		gap: $size-24;
		margin-bottom: $size-32;
	}
}

.score-card-large {
	background: white;
	border-radius: $size-20;
	overflow: hidden;
	position: relative;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

	.card-accent {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;

		&.basic { background: linear-gradient(90deg, #ef4444, #f59e0b, #4FC3F7, #10b981); }
		&.advanced { background: linear-gradient(90deg, #8b5cf6, #6366f1, #4FC3F7); }
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: $size-24 $size-28;
		border-bottom: 1px solid rgba(0, 0, 0, 0.05);

		.header-left {
			display: flex;
			align-items: center;
			gap: $size-16;
		}

		.header-icon {
			width: 48px;
			height: 48px;
			border-radius: 14px;
			display: flex;
			align-items: center;
			justify-content: center;
			color: white;

			&.basic { background: linear-gradient(135deg, #ef4444, #f97316); }
			&.advanced { background: linear-gradient(135deg, #8b5cf6, #6366f1); }
		}

		h3 {
			font-size: $size-18;
			font-weight: $fw-semi-bold;
			color: $color-g-21;
			margin: 0 0 $size-4;
		}

		.card-date {
			font-size: $size-13;
			color: $color-g-54;
		}
	}

	.card-body {
		padding: $size-32 $size-28;

		.score-visual {
			position: relative;
			width: 140px;
			height: 140px;
			margin: 0 auto $size-20;

			.score-ring-svg {
				width: 100%;
				height: 100%;
				transform: rotate(-90deg);

				.ring-bg {
					fill: none;
					stroke: #f1f5f9;
					stroke-width: 10;
				}

				.ring-progress {
					fill: none;
					stroke-width: 10;
					stroke-linecap: round;
					stroke-dasharray: 326.73;
					transition: stroke-dashoffset 0.8s ease;

					&.excellent { stroke: #10b981; }
					&.good { stroke: #3b82f6; }
					&.fair { stroke: #f59e0b; }
					&.poor { stroke: #ef4444; }
				}
			}

			.score-center {
				position: absolute;
				inset: 0;
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;

				.big-score {
					font-size: 42px;
					font-weight: 800;
					color: $color-g-21;
					line-height: 1;
				}

				.score-max {
					font-size: $size-13;
					color: $color-g-54;
					margin-top: $size-4;
				}
			}
		}

		.score-status {
			text-align: center;
			display: inline-block;
			width: 100%;
			padding: $size-8 $size-20;
			border-radius: $size-20;
			font-size: $size-14;
			font-weight: $fw-semi-bold;
			margin-bottom: $size-24;

			&.excellent { background: rgba(16, 185, 129, 0.1); color: #059669; }
			&.good { background: rgba(59, 130, 246, 0.1); color: #2563eb; }
			&.fair { background: rgba(245, 158, 11, 0.1); color: #d97706; }
			&.poor { background: rgba(239, 68, 68, 0.1); color: #dc2626; }
		}

		.view-all-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: $size-8;
			width: 100%;
			padding: $size-14 $size-24;
			background: #f8fafc;
			border: 1px solid #e2e8f0;
			border-radius: $size-12;
			color: #475569;
			cursor: pointer;
			font-size: $size-14;
			font-weight: $fw-medium;
			transition: all 0.2s ease;

			&:hover {
				background: #f1f5f9;
				border-color: #4FC3F7;
				color: #4FC3F7;
			}
		}

		&.empty-state-card {
			text-align: center;
			padding: $size-48;

			.empty-icon {
				color: $color-g-67;
				margin-bottom: $size-16;
			}

			p {
				color: $color-g-54;
				font-size: $size-14;
				margin: 0;
			}
		}
	}
}

// Breakdown section
.breakdown {
	margin-top: $size-24;
	padding-top: $size-24;
	border-top: 1px solid $color-g-92;

	h4 {
		font-size: $size-14;
		font-weight: $fw-semi-bold;
		color: $color-g-36;
		margin: 0 0 $size-16;
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

		.item-left {
			display: flex;
			align-items: center;
			gap: $size-8;
		}

		.item-dot {
			width: 8px;
			height: 8px;
			border-radius: 50%;
			background: $color-g-67;

			&.excellent, &.good { background: #10b981; }
			&.fair, &.warning { background: #f59e0b; }
			&.poor, &.critical { background: #ef4444; }
		}

		.item-label {
			font-size: $size-14;
			color: $color-g-44;
		}

		.item-value {
			font-size: $size-13;
			font-weight: $fw-medium;

			&.excellent, &.good { color: #059669; }
			&.fair, &.warning { color: #d97706; }
			&.poor, &.critical { color: #dc2626; }
		}
	}
}

// Advanced Assessments Section
.assessments-section {
	margin-top: $size-32;
	background: white;
	border-radius: $size-16;
	padding: $size-24;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

	.section-header-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: $size-24;

		.header-title {
			display: flex;
			align-items: center;
			gap: $size-12;

			.back-btn {
				display: flex;
				align-items: center;
				justify-content: center;
				width: 36px;
				height: 36px;
				background: $color-g-97;
				border: none;
				border-radius: $size-8;
				cursor: pointer;
				transition: all 0.2s ease;

				&:hover {
					background: $color-g-92;
				}
			}

			h3 {
				font-size: $size-18;
				font-weight: $fw-semi-bold;
				color: $color-g-21;
				margin: 0;
			}
		}

		.total-badge {
			background: $color-g-97;
			padding: $size-6 $size-12;
			border-radius: $size-6;
			font-size: $size-13;
			color: $color-g-44;
		}
	}

	.scores-list {
		display: flex;
		flex-direction: column;
		gap: $size-16;
	}
}

.assessment-card {
	background: $color-g-97;
	border-radius: $size-12;
	padding: $size-20;
	cursor: pointer;
	transition: all 0.2s ease;
	border: 1px solid transparent;

	&:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		transform: translateY(-2px);
		border-color: rgba(79, 195, 247, 0.3);
		background: #f8fafc;
	}

	&:active {
		transform: translateY(0);
	}

	.assessment-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: $size-16;

		.assessment-date {
			display: flex;
			align-items: center;
			gap: $size-6;
			font-size: $size-14;
			color: $color-g-44;
		}

		.score-badge-large {
			width: 44px;
			height: 44px;
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: $size-16;
			font-weight: $fw-bold;
			color: white;

			&.excellent { background: #10b981; }
			&.good { background: #3b82f6; }
			&.fair { background: #f59e0b; }
			&.poor { background: #ef4444; }
		}
	}

	.assessment-body {
		.status-row {
			margin-bottom: $size-12;
		}

		.status-tag {
			display: inline-block;
			padding: $size-4 $size-12;
			border-radius: $size-4;
			font-size: $size-12;
			font-weight: $fw-semi-bold;

			&.excellent { background: rgba(16, 185, 129, 0.15); color: #059669; }
			&.good { background: rgba(59, 130, 246, 0.15); color: #2563eb; }
			&.fair { background: rgba(245, 158, 11, 0.15); color: #d97706; }
			&.poor { background: rgba(239, 68, 68, 0.15); color: #dc2626; }
		}

		.summary {
			font-size: $size-14;
			color: $color-g-44;
			line-height: 1.5;
			margin: 0 0 $size-16;
		}

		.domain-scores {
			display: flex;
			flex-direction: column;
			gap: $size-8;
		}

		.domain-row {
			display: flex;
			align-items: center;
			gap: $size-12;

			.domain-name {
				width: 120px;
				font-size: $size-13;
				color: $color-g-44;
				flex-shrink: 0;
			}

			.domain-bar-wrapper {
				flex: 1;
			}

			.domain-bar {
				height: 6px;
				background: rgba(0, 0, 0, 0.1);
				border-radius: 3px;
				overflow: hidden;

				.domain-fill {
					height: 100%;
					border-radius: 3px;
					transition: width 0.5s ease;

					&.excellent { background: #10b981; }
					&.good { background: #3b82f6; }
					&.fair { background: #f59e0b; }
					&.poor { background: #ef4444; }
				}
			}

			.domain-score {
				width: 30px;
				font-size: $size-13;
				font-weight: $fw-semi-bold;
				text-align: right;

				&.excellent { color: #059669; }
				&.good { color: #2563eb; }
				&.fair { color: #d97706; }
				&.poor { color: #dc2626; }
			}
		}
	}
}

// Pagination
.pagination {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: $size-16;
	margin-top: $size-24;
	padding-top: $size-24;
	border-top: 1px solid $color-g-92;

	.page-btn {
		display: flex;
		align-items: center;
		gap: $size-6;
		padding: $size-10 $size-16;
		background: white;
		border: 1px solid $color-g-85;
		border-radius: $size-8;
		font-size: $size-13;
		color: $color-g-44;
		cursor: pointer;
		transition: all 0.2s ease;

		&:hover:not(:disabled) {
			border-color: #4FC3F7;
			color: #4FC3F7;
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	.page-indicator {
		display: flex;
		align-items: center;
		gap: $size-4;
		font-size: $size-14;

		.current {
			font-weight: $fw-semi-bold;
			color: #4FC3F7;
		}

		.separator {
			color: $color-g-67;
		}

		.total {
			color: $color-g-44;
		}
	}
}

// Tab Empty State
.tab-empty {
	text-align: center;
	padding: $size-64 $size-24;
}

.empty-illustration {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 100px;
	height: 100px;
	background: linear-gradient(135deg, rgba(79, 195, 247, 0.1) 0%, rgba(79, 195, 247, 0.05) 100%);
	border-radius: 50%;
	margin-bottom: $size-24;

	.empty-icon {
		color: #4FC3F7;
	}
}

.tab-empty {
	h3 {
		font-size: $size-20;
		font-weight: $fw-semi-bold;
		color: $color-g-21;
		margin: 0 0 $size-8;
	}

	p {
		font-size: $size-14;
		color: $color-g-54;
		margin: 0;
	}
}

// Responsive
@media (max-width: 480px) {
	.hero-banner {
		margin: $size-12;
		padding: $size-16;
		border-radius: $size-12;
	}

	.hero-top {
		flex-direction: column;
		gap: $size-12;
		align-items: stretch;
	}

	.back-link, .star-btn {
		justify-content: center;
	}

	.patient-header {
		flex-direction: column;
		align-items: center;
		text-align: center;
	}

	.patient-info .patient-meta {
		justify-content: center;
	}

	.quick-actions {
		padding: $size-12;
	}

	.dashboard-content {
		padding: 0 $size-12;
	}

	.appointment-card {
		flex-direction: column;
	}

	.apt-date-block {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: $size-8;

		.apt-day, .apt-month {
			display: inline;
		}
	}
}

// Medications Tab Styles
.medications-tab {
	.section-header-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24px;

		.header-title {
			display: flex;
			align-items: center;
			gap: 12px;

			svg { color: #4FC3F7; }

			h3 {
				font-size: 20px;
				font-weight: 600;
				color: #1e293b;
				margin: 0;
			}
		}

		.total-badge {
			background: linear-gradient(135deg, #f0fdfa, #e0f7fa);
			color: #29B6F6;
			padding: 6px 16px;
			border-radius: 20px;
			font-size: 13px;
			font-weight: 600;
		}
	}
}

.prescription-stats {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 16px;
	margin-bottom: 24px;
}

.stat-card-mini {
	background: white;
	border-radius: 16px;
	padding: 20px;
	display: flex;
	align-items: center;
	gap: 16px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
	border: 1px solid rgba(0, 0, 0, 0.04);

	.stat-icon {
		width: 48px;
		height: 48px;
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;

		&.specialist { background: linear-gradient(135deg, #6366f1, #4f46e5); }
		&.uploaded { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
		&.orders { background: linear-gradient(135deg, #f59e0b, #d97706); }
		&.total { background: linear-gradient(135deg, #6366f1, #4f46e5); }
	}

	.stat-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
		flex: 1;

		.stat-value {
			font-size: 24px;
			font-weight: 700;
			color: #1e293b;
		}

		.stat-label {
			font-size: 13px;
			color: #64748b;
		}
	}

	.scroll-hint {
		color: #cbd5e1;
		transition: all 0.3s ease;
		opacity: 0;
	}

	&.clickable {
		cursor: pointer;
		transition: all 0.3s ease;

		&:hover {
			transform: translateY(-4px);
			box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
			border-color: rgba(#4FC3F7, 0.2);

			.scroll-hint {
				opacity: 1;
				color: #4FC3F7;
				animation: bounce 1s infinite;
			}
		}
	}
}

@keyframes bounce {
	0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
	40% { transform: translateY(-4px); }
	60% { transform: translateY(-2px); }
}

.collapsible-section {
	background: white;
	border-radius: 16px;
	margin-bottom: 16px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
	border: 1px solid rgba(0, 0, 0, 0.04);
	overflow: hidden;

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 20px;
		cursor: pointer;
		background: linear-gradient(135deg, #f8fafc, #f1f5f9);
		transition: background 0.2s ease;

		&:hover {
			background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
		}

		.section-title {
			display: flex;
			align-items: center;
			gap: 12px;
			font-size: 15px;
			font-weight: 600;
			color: #1e293b;

			svg { color: #4FC3F7; }

			.section-count {
				background: rgba(#4FC3F7, 0.1);
				color: #29B6F6;
				padding: 4px 10px;
				border-radius: 12px;
				font-size: 12px;
				font-weight: 600;
			}
		}

		> svg { color: #64748b; }
	}

	.section-content {
		padding: 16px 20px;
		border-top: 1px solid #f1f5f9;
	}
}

.empty-section {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12px;
	padding: 32px;
	color: #94a3b8;
	font-size: 14px;

	svg { color: #cbd5e1; }
}

.pagination-mini {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12px;
	padding: 12px 0 4px;
	margin-top: 12px;
	border-top: 1px solid #f1f5f9;

	button {
		width: 32px;
		height: 32px;
		border-radius: 8px;
		border: 1px solid #e2e8f0;
		background: white;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;

		&:hover:not(:disabled) {
			background: #4FC3F7;
			border-color: #4FC3F7;
			color: white;
		}

		&:disabled {
			opacity: 0.4;
			cursor: not-allowed;
		}
	}

	span {
		font-size: 13px;
		color: #64748b;
	}
}

.prescriptions-list {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.prescription-card.glass-card {
	border-radius: 20px;
	overflow: hidden;
	border: 1px solid rgba(0, 0, 0, 0.05);
	background: white;

	.prescription-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 18px 24px;
		background: linear-gradient(135deg, #f8fafc, #f1f5f9);
		border-bottom: 1px solid rgba(0, 0, 0, 0.05);

		&.pending { background: linear-gradient(135deg, rgba(#f59e0b, 0.08), rgba(#f59e0b, 0.04)); }
		&.paid, &.processing { background: linear-gradient(135deg, rgba(#4FC3F7, 0.08), rgba(#4FC3F7, 0.04)); }
		&.dispensed, &.shipped { background: linear-gradient(135deg, rgba(#6366f1, 0.08), rgba(#6366f1, 0.04)); }
		&.delivered, &.completed { background: linear-gradient(135deg, rgba(#10b981, 0.08), rgba(#10b981, 0.04)); }
		&.cancelled, &.refunded { background: linear-gradient(135deg, rgba(#ef4444, 0.08), rgba(#ef4444, 0.04)); }

		.header-left {
			display: flex;
			align-items: center;
			gap: 14px;
		}

		.rx-icon {
			width: 48px;
			height: 48px;
			border-radius: 14px;
			display: flex;
			align-items: center;
			justify-content: center;
			color: white;

			&.pending { background: linear-gradient(135deg, #f59e0b, #d97706); }
			&.paid, &.processing { background: linear-gradient(135deg, #4FC3F7, #29B6F6); }
			&.dispensed, &.shipped { background: linear-gradient(135deg, #6366f1, #4f46e5); }
			&.delivered, &.completed { background: linear-gradient(135deg, #10b981, #059669); }
			&.cancelled, &.refunded { background: linear-gradient(135deg, #ef4444, #dc2626); }
			&.verified { background: linear-gradient(135deg, #10b981, #059669); }
			&.review, &.clarification { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }
			&.rejected { background: linear-gradient(135deg, #ef4444, #dc2626); }
			&.confirmed { background: linear-gradient(135deg, #4FC3F7, #29B6F6); }
			&.ready, &.transit { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }
		}

		.header-info {
			.rx-number {
				display: block;
				font-size: 15px;
				font-weight: 600;
				color: #1e293b;
				margin-bottom: 2px;
			}
			.rx-date {
				font-size: 13px;
				color: #64748b;
			}
		}

		.header-right {
			display: flex;
			align-items: center;
			gap: 10px;
		}

		.status-badge {
			padding: 6px 14px;
			border-radius: 20px;
			font-size: 12px;
			font-weight: 600;

			&.pending { background: rgba(#f59e0b, 0.15); color: #b45309; }
			&.paid, &.processing { background: rgba(#4FC3F7, 0.15); color: #29B6F6; }
			&.dispensed, &.shipped { background: rgba(#6366f1, 0.15); color: #4f46e5; }
			&.delivered, &.completed { background: rgba(#10b981, 0.15); color: #059669; }
			&.cancelled, &.refunded { background: rgba(#ef4444, 0.15); color: #ef4444; }
			&.verified { background: rgba(#10b981, 0.15); color: #059669; }
			&.review, &.clarification { background: rgba(#8b5cf6, 0.15); color: #6d28d9; }
			&.rejected { background: rgba(#ef4444, 0.15); color: #ef4444; }
			&.confirmed { background: rgba(#4FC3F7, 0.15); color: #29B6F6; }
			&.ready, &.transit { background: rgba(#8b5cf6, 0.15); color: #6d28d9; }
		}

		.order-type-badge {
			padding: 4px 10px;
			border-radius: 8px;
			font-size: 11px;
			font-weight: 700;
			text-transform: uppercase;

			&.otc { background: rgba(#10b981, 0.15); color: #059669; }
			&.prescription { background: rgba(#6366f1, 0.15); color: #4f46e5; }
			&.mixed { background: rgba(#f59e0b, 0.15); color: #b45309; }
		}

		.expired-badge {
			padding: 4px 10px;
			border-radius: 8px;
			font-size: 11px;
			font-weight: 600;
			background: rgba(#ef4444, 0.15);
			color: #ef4444;
		}

		.payment-badge {
			display: flex;
			align-items: center;
			gap: 4px;
			padding: 6px 12px;
			border-radius: 20px;
			font-size: 12px;
			font-weight: 500;

			&.paid { background: rgba(#10b981, 0.1); color: #059669; }
		}
	}

	.prescriber-row {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 16px 24px;
		border-bottom: 1px solid #f1f5f9;
		font-size: 14px;
		color: #64748b;

		svg { color: #4FC3F7; }
		strong { color: #1e293b; }

		.specialty-badge {
			padding: 4px 10px;
			background: rgba(#6366f1, 0.1);
			color: #4f46e5;
			border-radius: 12px;
			font-size: 12px;
			font-weight: 500;
		}

		.clinic-name {
			padding: 4px 10px;
			background: rgba(#64748b, 0.1);
			border-radius: 8px;
			font-size: 12px;
			color: #64748b;
		}
	}

	.medications-section {
		padding: 20px 24px;

		.section-label {
			display: flex;
			align-items: center;
			gap: 8px;
			font-size: 14px;
			font-weight: 600;
			color: #475569;
			margin-bottom: 16px;

			svg { color: #4FC3F7; }
		}

		.medications-grid {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
			gap: 12px;
		}

		.medication-item {
			background: #f8fafc;
			border: 1px solid #e2e8f0;
			border-radius: 12px;
			padding: 14px 16px;

			.med-main {
				display: flex;
				justify-content: space-between;
				align-items: baseline;
				margin-bottom: 8px;

				.med-name {
					font-size: 14px;
					font-weight: 600;
					color: #1e293b;
				}

				.med-strength {
					font-size: 13px;
					color: #64748b;
					background: white;
					padding: 2px 8px;
					border-radius: 6px;
				}
			}

			.med-details {
				display: flex;
				gap: 12px;
				margin-bottom: 8px;

				.med-dosage, .med-duration {
					font-size: 13px;
					color: #64748b;
				}

				.med-duration {
					color: #4FC3F7;
					font-weight: 500;
				}

				.rx-required {
					display: inline-block;
					padding: 2px 6px;
					background: rgba(#6366f1, 0.1);
					color: #4f46e5;
					border-radius: 4px;
					font-size: 10px;
					font-weight: 700;
				}
			}

			.med-qty {
				font-size: 12px;
				color: #94a3b8;
				font-weight: 500;
			}
		}

		.more-items {
			grid-column: 1 / -1;
			text-align: center;
			padding: 12px;
			color: #4FC3F7;
			font-size: 14px;
			font-weight: 500;
		}
	}

	.pricing-row {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 24px;
		padding: 16px 24px;
		background: #f8fafc;
		border-top: 1px solid #f1f5f9;

		.price-item {
			display: flex;
			align-items: center;
			gap: 8px;

			.price-label {
				font-size: 13px;
				color: #64748b;
			}

			.price-value {
				font-size: 14px;
				font-weight: 600;
				color: #475569;
			}

			&.total {
				.price-label { font-weight: 600; color: #475569; }
				.price-value { font-size: 16px; color: #1e293b; }
			}
		}
	}

	.refill-info {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 14px 24px;
		background: rgba(#4FC3F7, 0.05);
		border-top: 1px solid rgba(#4FC3F7, 0.1);
		font-size: 13px;
		color: #475569;

		svg { color: #4FC3F7; }
	}

	.clinical-notes {
		padding: 16px 24px;
		border-top: 1px solid #f1f5f9;

		.notes-label {
			display: flex;
			align-items: center;
			gap: 8px;
			font-size: 13px;
			font-weight: 600;
			color: #64748b;
			margin-bottom: 8px;

			svg { color: #94a3b8; }
		}

		p {
			font-size: 14px;
			color: #475569;
			line-height: 1.6;
			margin: 0;
		}
	}

	.validity-row {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 24px;
		font-size: 13px;
		color: #64748b;
		border-top: 1px solid #f1f5f9;

		svg { color: #4FC3F7; }

		.usage-info {
			margin-left: auto;
			color: #94a3b8;
			font-size: 12px;
		}
	}

	.fraud-warning {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 24px;
		background: rgba(#ef4444, 0.05);
		border-top: 1px solid rgba(#ef4444, 0.1);
		font-size: 13px;
		color: #ef4444;
		font-weight: 500;
	}

	.delivery-info {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 24px;
		font-size: 13px;
		color: #64748b;
		border-top: 1px solid #f1f5f9;
		background: #fafbfc;

		svg { color: #4FC3F7; }

		.tracking {
			padding: 4px 10px;
			background: rgba(#4FC3F7, 0.1);
			border-radius: 8px;
			font-size: 12px;
			color: #29B6F6;
		}

		.delivered-date {
			margin-left: auto;
			color: #10b981;
			font-weight: 500;
		}
	}
}

@media (max-width: 1024px) {
	.prescription-stats {
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;
	}
}

@media (max-width: 768px) {
	.prescription-stats {
		grid-template-columns: 1fr 1fr;
		gap: 10px;
	}

	.collapsible-section {
		.section-header {
			padding: 14px 16px;
		}

		.section-content {
			padding: 12px 16px;
		}
	}

	.prescription-card.glass-card {
		.prescription-header {
			padding: 14px 16px;
			flex-wrap: wrap;
			gap: 12px;
		}

		.prescriber-row {
			padding: 12px 16px;
			flex-wrap: wrap;
		}

		.medications-section {
			padding: 16px;

			.medications-grid {
				grid-template-columns: 1fr;
			}
		}

		.pricing-row {
			padding: 12px 16px;
			flex-wrap: wrap;
			gap: 12px;
		}
	}
}

// Appointments Tab Styles
.appointments-tab {
	.section-header-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24px;

		.header-title {
			display: flex;
			align-items: center;
			gap: 12px;

			svg { color: #4FC3F7; }

			h3 {
				font-size: 20px;
				font-weight: 600;
				color: #1e293b;
				margin: 0;
			}
		}

		.total-badge {
			background: linear-gradient(135deg, #f0fdfa, #e0f7fa);
			color: #29B6F6;
			padding: 6px 16px;
			border-radius: 20px;
			font-size: 13px;
			font-weight: 600;
		}
	}

	.appointments-list {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.appointment-card-enhanced {
		background: white;
		border-radius: 16px;
		overflow: hidden;
		cursor: pointer;
		position: relative;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
		border: 1px solid rgba(0, 0, 0, 0.04);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

		&:hover {
			transform: translateY(-3px);
			box-shadow: 0 12px 32px rgba(79, 195, 247, 0.15);
			border-color: rgba(79, 195, 247, 0.2);

			.appointment-card-footer {
				background: linear-gradient(135deg, #f0fdfa, #e0f7fa);

				.view-link {
					color: #29B6F6;

					svg {
						transform: translateX(4px);
					}
				}
			}
		}

		.card-left-accent {
			position: absolute;
			left: 0;
			top: 0;
			bottom: 0;
			width: 4px;

			&.scheduled, &.open { background: linear-gradient(180deg, #4FC3F7, #29B6F6); }
			&.ongoing { background: linear-gradient(180deg, #8b5cf6, #6d28d9); }
			&.completed { background: linear-gradient(180deg, #10b981, #059669); }
			&.cancelled { background: linear-gradient(180deg, #ef4444, #dc2626); }
			&.missed { background: linear-gradient(180deg, #f97316, #ea580c); }
			&.rescheduled { background: linear-gradient(180deg, #f59e0b, #d97706); }
		}

		.appointment-card-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 16px 20px 16px 24px;
			background: linear-gradient(135deg, #f8fafc, #f1f5f9);
			border-bottom: 1px solid rgba(0, 0, 0, 0.05);

			.header-left {
				display: flex;
				align-items: center;
				gap: 16px;

				.date-block {
					text-align: center;
					padding: 10px 14px;
					background: linear-gradient(135deg, #4FC3F7 0%, #29B6F6 100%);
					border-radius: 10px;
					min-width: 56px;

					.date-day {
						display: block;
						font-size: 22px;
						font-weight: 700;
						color: white;
						line-height: 1.1;
					}

					.date-month {
						display: block;
						font-size: 11px;
						font-weight: 600;
						color: rgba(255, 255, 255, 0.85);
						text-transform: uppercase;
						letter-spacing: 0.5px;
					}
				}

				.header-info {
					.time-text {
						display: block;
						font-size: 15px;
						font-weight: 600;
						color: #1e293b;
					}

					.type-text {
						display: block;
						font-size: 13px;
						color: #64748b;
						margin-top: 2px;
					}
				}
			}

			.header-right {
				.status-badge {
					padding: 6px 14px;
					border-radius: 20px;
					font-size: 12px;
					font-weight: 600;
					text-transform: capitalize;

					&.scheduled, &.open { background: rgba(79, 195, 247, 0.15); color: #29B6F6; }
					&.ongoing { background: rgba(139, 92, 246, 0.15); color: #6d28d9; }
					&.completed { background: rgba(16, 185, 129, 0.15); color: #059669; }
					&.cancelled { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
					&.missed { background: rgba(249, 115, 22, 0.15); color: #ea580c; }
					&.rescheduled { background: rgba(245, 158, 11, 0.15); color: #b45309; }
				}
			}
		}

		.appointment-card-body {
			padding: 20px 24px;

			.specialist-row {
				display: flex;
				align-items: center;
				gap: 14px;
				margin-bottom: 16px;
				padding-bottom: 16px;
				border-bottom: 1px solid #f1f5f9;

				.specialist-avatar {
					width: 48px;
					height: 48px;
					border-radius: 50%;
					overflow: hidden;
					background: linear-gradient(135deg, #e0f7fa, #b2ebf2);
					display: flex;
					align-items: center;
					justify-content: center;
					flex-shrink: 0;

					img {
						width: 100%;
						height: 100%;
						object-fit: cover;
					}

					svg {
						color: #4FC3F7;
					}
				}

				.specialist-info {
					.specialist-name {
						display: block;
						font-size: 16px;
						font-weight: 600;
						color: #1e293b;
					}

					.specialty {
						display: block;
						font-size: 13px;
						color: #64748b;
						margin-top: 2px;
					}
				}
			}

			.appointment-meta {
				display: flex;
				flex-wrap: wrap;
				gap: 16px;

				.meta-item {
					display: flex;
					align-items: center;
					gap: 8px;
					font-size: 13px;
					color: #64748b;
					background: #f8fafc;
					padding: 8px 12px;
					border-radius: 8px;

					svg { color: #4FC3F7; }
				}
			}

			.notes-section {
				background: #f8fafc;
				padding: 14px 16px;
				border-radius: 12px;
				margin-top: 16px;

				.notes-label {
					display: flex;
					align-items: center;
					gap: 6px;
					font-size: 12px;
					font-weight: 600;
					color: #64748b;
					text-transform: uppercase;
					letter-spacing: 0.5px;
					margin-bottom: 8px;

					svg { color: #94a3b8; }
				}

				.notes-content {
					font-size: 14px;
					color: #475569;
					margin: 0;
					line-height: 1.6;
				}
			}

			.cancellation-banner {
				display: flex;
				align-items: center;
				gap: 10px;
				padding: 12px 16px;
				background: rgba(239, 68, 68, 0.08);
				border-radius: 10px;
				margin-top: 16px;
				font-size: 13px;
				color: #dc2626;
				border: 1px solid rgba(239, 68, 68, 0.15);

				svg { flex-shrink: 0; color: #ef4444; }
			}
		}

		.appointment-card-footer {
			display: flex;
			justify-content: flex-end;
			padding: 14px 24px;
			background: #f8fafc;
			border-top: 1px solid #f1f5f9;
			transition: all 0.3s ease;

			.view-link {
				display: flex;
				align-items: center;
				gap: 8px;
				font-size: 13px;
				font-weight: 600;
				color: #64748b;
				transition: all 0.3s ease;

				svg {
					transition: transform 0.3s ease;
				}
			}
		}
	}
}

// Appointments Tab v2 - Table Layout
.appointments-tab-v2 {
	width: 100%;
}

.apt-stats-row {
	display: grid;
	grid-template-columns: repeat(5, 1fr);
	gap: 12px;
	margin-bottom: 20px;

	@media (max-width: 1024px) {
		grid-template-columns: repeat(3, 1fr);
	}

	@media (max-width: 640px) {
		grid-template-columns: repeat(2, 1fr);
	}
}

.apt-stat-card {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 16px;
	background: white;
	border-radius: 12px;
	border: 1px solid #e2e8f0;
	transition: all 0.2s ease;

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
	}

	.stat-icon-wrap {
		width: 40px;
		height: 40px;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.stat-content {
		display: flex;
		flex-direction: column;

		.stat-number {
			font-size: 20px;
			font-weight: 700;
			line-height: 1.1;
		}

		.stat-label {
			font-size: 12px;
			color: #64748b;
			margin-top: 2px;
		}
	}

	&.stat-total {
		.stat-icon-wrap {
			background: linear-gradient(135deg, #E1F5FE 0%, #B3E5FC 100%);
			color: #0288D1;
		}
		.stat-number { color: #0288D1; }
	}

	&.stat-confirmed {
		.stat-icon-wrap {
			background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);
			color: #388E3C;
		}
		.stat-number { color: #388E3C; }
	}

	&.stat-completed {
		.stat-icon-wrap {
			background: linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%);
			color: #7B1FA2;
		}
		.stat-number { color: #7B1FA2; }
	}

	&.stat-cancelled {
		.stat-icon-wrap {
			background: linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%);
			color: #C62828;
		}
		.stat-number { color: #C62828; }
	}

	&.stat-noshow {
		.stat-icon-wrap {
			background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%);
			color: #E65100;
		}
		.stat-number { color: #E65100; }
	}
}

.apt-filter-section {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	margin-bottom: 20px;
	flex-wrap: wrap;
}

.apt-filter-tabs {
	display: flex;
	gap: 8px;
	flex-wrap: wrap;

	.filter-tab {
		padding: 8px 16px;
		background: #f1f5f9;
		border: 1px solid #e2e8f0;
		border-radius: 20px;
		font-size: 13px;
		font-weight: 500;
		color: #64748b;
		cursor: pointer;
		transition: all 0.2s ease;

		&:hover {
			background: #e2e8f0;
			color: #475569;
		}

		&.active {
			background: linear-gradient(135deg, #4FC3F7 0%, #29B6F6 100%);
			border-color: #29B6F6;
			color: white;
			box-shadow: 0 2px 8px rgba(79, 195, 247, 0.3);
		}
	}
}

.btn-book-apt {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 10px 18px;
	background: linear-gradient(135deg, #4FC3F7 0%, #29B6F6 100%);
	color: white;
	border: none;
	border-radius: 10px;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(79, 195, 247, 0.35);
	}
}

.apt-table-card {
	background: white;
	border-radius: 16px;
	box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
	border: 1px solid #e2e8f0;
	margin-bottom: 20px;
	overflow-x: auto;
	overflow-y: visible;

	&::-webkit-scrollbar {
		height: 6px;
	}

	&::-webkit-scrollbar-track {
		background: #f1f5f9;
	}

	&::-webkit-scrollbar-thumb {
		background: #cbd5e1;
		border-radius: 3px;
	}
}

.apt-table {
	width: 100%;
	border-collapse: collapse;
	min-width: 950px;

	th, td {
		padding: 14px 16px;
		text-align: left;
		vertical-align: middle;
	}

	th {
		background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
		font-size: 11px;
		font-weight: 700;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		border-bottom: 1px solid #e2e8f0;
		white-space: nowrap;
	}

	.th-actions {
		width: 140px;
		text-align: center;
	}

	tbody tr {
		border-bottom: 1px solid #f1f5f9;
		transition: all 0.2s ease;

		&:hover {
			background: rgba(79, 195, 247, 0.04);
		}

		&:last-child {
			border-bottom: none;
		}

		&.row-completed { background: #F3E5F5; &:hover { background: #EDE7F6; } }
		&.row-missed { background: #FFF3E0; &:hover { background: #FFE0B2; } }
		&.row-cancelled { background: #FFEBEE; &:hover { background: #FFCDD2; } }
	}
}

.datetime-cell {
	display: flex;
	flex-direction: column;
	gap: 2px;

	.date-text {
		font-weight: 600;
		color: #1e293b;
		font-size: 14px;
	}

	.time-text {
		font-size: 12px;
		color: #64748b;
	}
}

.specialist-cell {
	display: flex;
	align-items: center;
	gap: 10px;

	.specialist-avatar-sm {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		overflow: hidden;
		background: linear-gradient(135deg, #e0f7fa, #b2ebf2);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;

		img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}

		svg {
			color: #4FC3F7;
		}
	}

	.specialist-info-sm {
		display: flex;
		flex-direction: column;
		min-width: 0;

		.specialist-name-sm {
			font-size: 13px;
			font-weight: 600;
			color: #1e293b;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.specialist-specialty-sm {
			font-size: 11px;
			color: #64748b;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}
}

.type-badge {
	display: inline-block;
	padding: 6px 12px;
	background: linear-gradient(135deg, #E1F5FE 0%, #B3E5FC 100%);
	color: #0277BD;
	border-radius: 8px;
	font-size: 12px;
	font-weight: 500;
}

.channel-cell {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 13px;
	color: #475569;

	.channel-icon {
		color: #4FC3F7;
	}
}

.duration-text, .fee-text {
	font-size: 13px;
	color: #475569;
	font-weight: 500;
}

.apt-status-badge {
	display: inline-flex;
	align-items: center;
	padding: 6px 12px;
	border-radius: 20px;
	font-size: 11px;
	font-weight: 600;
	text-transform: capitalize;

	&.scheduled, &.open {
		background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);
		color: #2E7D32;
	}

	&.ongoing {
		background: linear-gradient(135deg, #E1F5FE 0%, #B3E5FC 100%);
		color: #0277BD;
	}

	&.completed {
		background: linear-gradient(135deg, #E1F5FE 0%, #B3E5FC 100%);
		color: #0277BD;
	}

	&.cancelled {
		background: linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%);
		color: #C62828;
	}

	&.missed {
		background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%);
		color: #E65100;
	}

	&.rescheduled {
		background: linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%);
		color: #F57C00;
	}
}

.actions-cell {
	display: flex;
	gap: 6px;
	justify-content: center;

	.apt-action-btn {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		color: #64748b;
		cursor: pointer;
		transition: all 0.2s ease;
		text-decoration: none;

		&:hover {
			transform: translateY(-2px);
		}

		&.view:hover {
			border-color: #4FC3F7;
			color: #4FC3F7;
			background: #E1F5FE;
		}

		&.meeting:hover {
			border-color: #4CAF50;
			color: #4CAF50;
			background: #E8F5E9;
		}

		&.notes:hover {
			border-color: #9C27B0;
			color: #9C27B0;
			background: #F3E5F5;
		}

		&.more:hover {
			border-color: #94a3b8;
			color: #475569;
			background: #f8fafc;
		}
	}

	.apt-more-dropdown {
		position: relative;

		.apt-dropdown-menu {
			position: absolute;
			top: 100%;
			right: 0;
			margin-top: 4px;
			min-width: 160px;
			background: white;
			border: 1px solid #e2e8f0;
			border-radius: 10px;
			box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
			z-index: 1000;
			overflow: hidden;

			// Upward variant for items near the bottom
			&.upward {
				top: auto;
				bottom: 100%;
				margin-top: 0;
				margin-bottom: 4px;
			}

			button {
				display: flex;
				align-items: center;
				gap: 10px;
				width: 100%;
				padding: 10px 14px;
				background: none;
				border: none;
				font-size: 13px;
				color: #475569;
				cursor: pointer;
				transition: all 0.15s ease;
				text-align: left;

				svg {
					color: #94a3b8;
				}

				&:hover {
					background: #f8fafc;
					color: #1e293b;

					svg {
						color: #4FC3F7;
					}
				}

				&.danger {
					color: #dc2626;

					svg {
						color: #ef4444;
					}

					&:hover {
						background: #fef2f2;
						color: #b91c1c;
					}
				}
			}
		}
	}
}

.apt-empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 60px 20px;
	background: white;
	border-radius: 16px;
	border: 1px solid #e2e8f0;
	text-align: center;

	.empty-illustration {
		width: 80px;
		height: 80px;
		background: linear-gradient(135deg, #E1F5FE 0%, #B3E5FC 100%);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 20px;
		color: #0288D1;
	}

	h4 {
		font-size: 18px;
		font-weight: 600;
		color: #1e293b;
		margin: 0 0 8px;
	}

	p {
		font-size: 14px;
		color: #64748b;
		margin: 0 0 24px;
	}
}

.btn-book-empty {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px 24px;
	background: linear-gradient(135deg, #4FC3F7 0%, #29B6F6 100%);
	color: white;
	border: none;
	border-radius: 12px;
	font-size: 14px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(79, 195, 247, 0.35);
	}
}

.apt-pagination {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 16px 20px;
	background: white;
	border-radius: 12px;
	border: 1px solid #e2e8f0;

	@media (max-width: 640px) {
		flex-direction: column;
		gap: 12px;
	}
}

.pagination-info {
	font-size: 13px;
	color: #64748b;

	strong {
		color: #1e293b;
	}
}

.pagination-controls {
	display: flex;
	align-items: center;
	gap: 8px;

	.page-btn {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		color: #64748b;
		cursor: pointer;
		transition: all 0.2s ease;

		&:hover:not(:disabled) {
			border-color: #4FC3F7;
			color: #4FC3F7;
			background: #E1F5FE;
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	.page-numbers {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 14px;
		font-weight: 500;

		.current-page {
			color: #0288D1;
			font-weight: 600;
		}

		.page-sep {
			color: #94a3b8;
		}

		.total-pages {
			color: #64748b;
		}
	}
}

// Timeline Tab Styles
.timeline-tab {
	.section-header-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24px;

		.header-title {
			display: flex;
			align-items: center;
			gap: 12px;

			svg { color: #4FC3F7; }

			h3 {
				font-size: 20px;
				font-weight: 600;
				color: #1e293b;
				margin: 0;
			}
		}

		.total-badge {
			background: linear-gradient(135deg, #f0fdfa, #e0f7fa);
			color: #29B6F6;
			padding: 6px 16px;
			border-radius: 20px;
			font-size: 13px;
			font-weight: 600;
		}
	}

	.timeline {
		position: relative;
		padding-left: 40px;

		&::before {
			content: '';
			position: absolute;
			left: 15px;
			top: 0;
			bottom: 0;
			width: 2px;
			background: linear-gradient(180deg, #4FC3F7 0%, #e2e8f0 100%);
		}
	}

	.timeline-item {
		position: relative;
		margin-bottom: 20px;

		&:last-child {
			margin-bottom: 0;
		}
	}

	.timeline-marker {
		position: absolute;
		left: -40px;
		top: 20px;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: white;
		border: 2px solid #e2e8f0;
		z-index: 1;

		svg { color: #64748b; }

		&.appointment {
			border-color: #4FC3F7;
			background: linear-gradient(135deg, #e0f7fa, #f0fdfa);
			svg { color: #29B6F6; }
		}

		&.prescription {
			border-color: #8b5cf6;
			background: linear-gradient(135deg, #ede9fe, #f5f3ff);
			svg { color: #7c3aed; }
		}

		&.health_checkup {
			border-color: #10b981;
			background: linear-gradient(135deg, #d1fae5, #ecfdf5);
			svg { color: #059669; }
		}

		&.pharmacy_order {
			border-color: #f59e0b;
			background: linear-gradient(135deg, #fef3c7, #fffbeb);
			svg { color: #d97706; }
		}
	}

	.timeline-card {
		background: white;
		border-radius: 16px;
		padding: 20px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
		border: 1px solid rgba(0, 0, 0, 0.04);
		transition: all 0.3s ease;

		&:hover {
			box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
			transform: translateX(4px);
		}
	}

	.timeline-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}

	.timeline-type {
		font-size: 14px;
		font-weight: 600;
		padding: 4px 12px;
		border-radius: 20px;
		background: #f1f5f9;
		color: #475569;

		&.appointment { background: rgba(79, 195, 247, 0.1); color: #29B6F6; }
		&.prescription { background: rgba(139, 92, 246, 0.1); color: #7c3aed; }
		&.health_checkup { background: rgba(16, 185, 129, 0.1); color: #059669; }
		&.pharmacy_order { background: rgba(245, 158, 11, 0.1); color: #d97706; }
	}

	.timeline-date {
		font-size: 13px;
		color: #64748b;
	}

	.timeline-desc {
		font-size: 14px;
		color: #475569;
		line-height: 1.6;
		margin: 0 0 12px;
	}

	.timeline-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;

		.meta-tag {
			display: inline-flex;
			align-items: center;
			gap: 4px;
			padding: 4px 10px;
			border-radius: 6px;
			font-size: 12px;
			font-weight: 500;
			background: #f8fafc;
			color: #64748b;

			&.status {
				&.completed, &.delivered, &.dispensed { background: rgba(16, 185, 129, 0.1); color: #059669; }
				&.open, &.scheduled, &.pending, &.processing { background: rgba(79, 195, 247, 0.1); color: #29B6F6; }
				&.cancelled { background: rgba(239, 68, 68, 0.1); color: #dc2626; }
			}

			&.triage {
				&.emergency { background: rgba(239, 68, 68, 0.1); color: #dc2626; }
				&.consultation_24 { background: rgba(249, 115, 22, 0.1); color: #ea580c; }
				&.consultation { background: rgba(245, 158, 11, 0.1); color: #d97706; }
				&.self_care { background: rgba(16, 185, 129, 0.1); color: #059669; }
			}

			&.amount {
				background: rgba(16, 185, 129, 0.1);
				color: #059669;
				font-weight: 600;
			}
		}
	}
}
</style>
