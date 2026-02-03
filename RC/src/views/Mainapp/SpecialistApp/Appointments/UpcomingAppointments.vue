<template>
	<div class="page-content">
		<top-bar type="title-only" title="Appointments / Details" @open-side-nav="$emit('openSideNav')" />

		<loader v-if="isLoading" :useOverlay="false" />
		<div v-else class="page-content__body">
			<div class="appointment-details-container">
				<!-- Patient Info Card -->
				<div class="patient-card">
					<div class="patient-card__header">
						<div class="patient-avatar-wrapper">
							<rc-avatar
								:first-name="patientInfo.firstName || patientInfo.fullName?.split(' ')[0] || 'P'"
								:last-name="patientInfo.lastName || patientInfo.fullName?.split(' ')[1] || 'A'"
								:modelValue="patientInfo.profileImage"
								size="lg"
							/>
							<span v-if="hasHealthData" class="health-indicator health-indicator--available">
								<v-icon name="hi-check-circle" scale="0.6" />
							</span>
						</div>
						<div class="patient-info">
							<h2 class="patient-name">{{ patientInfo.fullName }}</h2>
							<div class="patient-meta">
								<span class="meta-item">
									<v-icon name="hi-user" scale="0.7" />
									{{ patientInfo.gender }}
								</span>
								<span class="meta-item">
									<v-icon name="hi-calendar" scale="0.7" />
									{{ patientInfo.age }} years
								</span>
							</div>
						</div>
					</div>
					<div class="patient-card__stats">
						<div class="stat-item">
							<span class="stat-label">Height</span>
							<span class="stat-value">{{ patientInfo.height?.value || '-' }} {{ patientInfo.height?.unit || '' }}</span>
						</div>
						<div class="stat-item">
							<span class="stat-label">Weight</span>
							<span class="stat-value">{{ patientInfo.weight?.value || '-' }} {{ patientInfo.weight?.unit || '' }}</span>
						</div>
						<div class="stat-item">
							<span class="stat-label">BMI Status</span>
							<span class="stat-value">{{ patientInfo.weightStatus || '-' }}</span>
						</div>
					</div>
				</div>

				<!-- Appointment Details Card -->
				<div class="appointment-card">
					<h3 class="section-title">
						<v-icon name="hi-calendar" scale="0.9" />
						Appointment Details
					</h3>
					<div class="appointment-info-grid">
						<div class="info-item">
							<span class="info-icon">
								<v-icon name="hi-clock" scale="0.8" />
							</span>
							<div class="info-content">
								<span class="info-label">Time</span>
								<span class="info-value">
									{{ format(new Date(appointmentInfo.start_time), 'hh:mm a') }}
									<small>({{ preferences.timezone }})</small>
								</span>
							</div>
						</div>
						<div class="info-item">
							<span class="info-icon">
								<v-icon name="hi-calendar" scale="0.8" />
							</span>
							<div class="info-content">
								<span class="info-label">Date</span>
								<span class="info-value">{{ format(new Date(appointmentInfo.start_time), 'EEEE, MMMM dd, yyyy') }}</span>
							</div>
						</div>
						<div class="info-item">
							<span class="info-icon">
								<v-icon name="hi-globe-alt" scale="0.8" />
							</span>
							<div class="info-content">
								<span class="info-label">Language</span>
								<span class="info-value">{{ preferences.language || 'English' }}</span>
							</div>
						</div>
						<div class="info-item">
							<span class="info-icon">
								<v-icon name="hi-video-camera" scale="0.8" />
							</span>
							<div class="info-content">
								<span class="info-label">Meeting Type</span>
								<span class="info-value">{{ appointmentInfo.meeting_type || 'Video Call' }}</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Meeting Summary Card (for completed/past appointments) -->
				<div v-if="showMeetingSummary" class="meeting-summary-card">
					<h3 class="section-title">
						<v-icon name="hi-video-camera" scale="0.9" />
						Meeting Summary
						<span class="status-badge" :class="getStatusClass(appointmentInfo.status)">
							{{ appointmentInfo.status }}
						</span>
					</h3>

					<!-- Attendance Status -->
					<div class="attendance-section">
						<h4 class="subsection-title-sm">Attendance</h4>
						<div class="attendance-indicators">
							<div class="attendance-item" :class="{ 'attended': appointmentInfo.attendance?.patient_joined }">
								<v-icon :name="appointmentInfo.attendance?.patient_joined ? 'hi-check-circle' : 'hi-x-circle'" scale="0.9" />
								<span>Patient</span>
								<small v-if="appointmentInfo.attendance?.patient_joined_at">
									Joined {{ formatTime(appointmentInfo.attendance.patient_joined_at) }}
								</small>
							</div>
							<div class="attendance-item" :class="{ 'attended': appointmentInfo.attendance?.specialist_joined }">
								<v-icon :name="appointmentInfo.attendance?.specialist_joined ? 'hi-check-circle' : 'hi-x-circle'" scale="0.9" />
								<span>Specialist</span>
								<small v-if="appointmentInfo.attendance?.specialist_joined_at">
									Joined {{ formatTime(appointmentInfo.attendance.specialist_joined_at) }}
								</small>
							</div>
						</div>
					</div>

					<!-- Call Duration -->
					<div v-if="appointmentInfo.call_duration?.time_taken" class="duration-section">
						<h4 class="subsection-title-sm">Call Duration</h4>
						<div class="duration-display">
							<v-icon name="hi-clock" scale="1.2" />
							<span class="duration-value">{{ formatDuration(appointmentInfo.call_duration.time_taken) }}</span>
						</div>
						<div v-if="appointmentInfo.meeting_platform_data?.actual_start_time" class="duration-times">
							<span>Started: {{ formatDateTime(appointmentInfo.meeting_platform_data.actual_start_time) }}</span>
							<span v-if="appointmentInfo.meeting_platform_data?.actual_end_time">
								Ended: {{ formatDateTime(appointmentInfo.meeting_platform_data.actual_end_time) }}
							</span>
						</div>
					</div>

					<!-- Participants -->
					<div v-if="appointmentInfo.participants?.length > 0" class="participants-section">
						<h4 class="subsection-title-sm">Participants ({{ appointmentInfo.participants.length }})</h4>
						<div class="participants-list">
							<div v-for="(participant, index) in appointmentInfo.participants" :key="index" class="participant-item">
								<div class="participant-avatar">
									<v-icon name="hi-user" scale="0.8" />
								</div>
								<div class="participant-info">
									<span class="participant-name">{{ participant.name }}</span>
									<span v-if="participant.email" class="participant-email">{{ participant.email }}</span>
								</div>
								<div class="participant-time">
									<span v-if="participant.duration_minutes" class="participant-duration">
										{{ participant.duration_minutes }} min
									</span>
									<small v-if="participant.join_time">
										{{ formatTime(participant.join_time) }} - {{ formatTime(participant.leave_time) }}
									</small>
								</div>
							</div>
						</div>
					</div>

					<!-- Recording -->
					<div v-if="appointmentInfo.recording?.recording_url" class="recording-section">
						<h4 class="subsection-title-sm">Recording</h4>
						<div class="recording-card">
							<div class="recording-info">
								<v-icon name="hi-film" scale="1" />
								<div class="recording-details">
									<span class="recording-status" :class="appointmentInfo.recording.recording_status">
										{{ appointmentInfo.recording.recording_status || 'Available' }}
									</span>
									<span v-if="appointmentInfo.recording.recording_duration_minutes" class="recording-duration">
										{{ appointmentInfo.recording.recording_duration_minutes }} min
									</span>
								</div>
							</div>
							<a :href="appointmentInfo.recording.recording_url" target="_blank" class="recording-link">
								<v-icon name="hi-play" scale="0.8" />
								View Recording
							</a>
						</div>
						<p v-if="appointmentInfo.recording.recording_expires_at" class="recording-expiry">
							Expires: {{ formatDate(appointmentInfo.recording.recording_expires_at) }}
						</p>
					</div>
				</div>

				<!-- Patient Health Dashboard -->
				<div class="health-dashboard">
					<div class="health-dashboard__header">
						<h3 class="section-title">
							<v-icon name="hi-heart" scale="0.9" />
							Patient Health Profile
						</h3>
						<button @click="openFullHealthRecords" class="view-all-btn">
							<v-icon name="hi-external-link" scale="0.7" />
							View Full Records
						</button>
					</div>

					<!-- Health Scores -->
					<div class="health-scores">
						<div
							class="score-card"
							:class="[getScoreClass(healthScores.basic), { 'clickable': healthScores.basic !== null }]"
							@click="healthScores.basic !== null && openScoreDetails('basic')"
						>
							<div class="score-circle">
								<span v-if="healthScores.basic !== null" class="score-value">{{ healthScores.basic }}</span>
								<v-icon v-else name="hi-minus" scale="1" />
							</div>
							<div class="score-info">
								<span class="score-label">Basic Health Score</span>
								<span v-if="healthScores.basic !== null" class="score-status">{{ getScoreLabel(healthScores.basic) }}</span>
								<span v-else class="score-status not-taken">Not taken</span>
							</div>
						</div>
						<div
							class="score-card advanced"
							:class="[getScoreClass(healthScores.advanced), { 'clickable': healthScores.advanced !== null }]"
							@click="healthScores.advanced !== null && openScoreDetails('advanced')"
						>
							<div class="score-circle">
								<span v-if="healthScores.advanced !== null" class="score-value">{{ healthScores.advanced }}</span>
								<v-icon v-else name="hi-minus" scale="1" />
							</div>
							<div class="score-info">
								<span class="score-label">Advanced Health Score</span>
								<span v-if="healthScores.advanced !== null" class="score-status">{{ getScoreLabel(healthScores.advanced) }}</span>
								<span v-else class="score-status not-taken">Not taken</span>
							</div>
						</div>
					</div>

					<!-- Recent Health Checkups -->
					<div class="health-checkups">
						<h4 class="subsection-title">
							<v-icon name="hi-clipboard-check" scale="0.8" />
							Recent Health Checkups
							<span v-if="checkupCount > 0" class="checkup-count">({{ checkupCount }})</span>
						</h4>
						<div v-if="healthCheckups.length > 0" class="checkups-list">
							<div
								v-for="checkup in healthCheckups.slice(0, 3)"
								:key="checkup._id"
								class="checkup-item"
								@click="viewCheckupDetails(checkup)"
							>
								<div class="checkup-icon">
									<v-icon name="hi-document-text" scale="0.9" />
								</div>
								<div class="checkup-content">
									<span class="checkup-date">{{ format(new Date(checkup.created_at), 'MMM dd, yyyy') }}</span>
									<span class="checkup-symptoms">
										{{ getCheckupSymptoms(checkup) }}
									</span>
									<span v-if="checkup.response?.data?.conditions?.length" class="checkup-result">
										<v-icon name="hi-arrow-right" scale="0.6" />
										{{ checkup.response.data.conditions[0]?.common_name || 'Analysis completed' }}
									</span>
								</div>
								<div class="checkup-triage" :class="getTriageClass(checkup.response?.data?.triage_level)">
									{{ formatTriage(checkup.response?.data?.triage_level) }}
								</div>
							</div>
						</div>
						<div v-else class="no-checkups">
							<v-icon name="hi-clipboard" scale="1.5" />
							<p>No health checkups recorded</p>
						</div>
					</div>

					<!-- Recent Vitals Summary -->
					<div class="vitals-summary">
						<h4 class="subsection-title">
							<v-icon name="hi-chart-bar" scale="0.8" />
							Recent Vitals
						</h4>
						<div class="vitals-grid">
							<div class="vital-item">
								<v-icon name="hi-heart" scale="0.8" />
								<span class="vital-label">Blood Pressure</span>
								<span class="vital-value">
									{{ getLatestVital(patientVitals.blood_pressure)?.value || '-' }}
									<small>{{ getLatestVital(patientVitals.blood_pressure)?.unit || '' }}</small>
								</span>
								<span class="vital-date" v-if="getLatestVital(patientVitals.blood_pressure)?.updatedAt">
									{{ formatRelativeTime(getLatestVital(patientVitals.blood_pressure)?.updatedAt) }}
								</span>
							</div>
							<div class="vital-item">
								<v-icon name="fa-heartbeat" scale="0.8" />
								<span class="vital-label">Pulse Rate</span>
								<span class="vital-value">
									{{ getLatestVital(patientVitals.pulse_rate)?.value || '-' }}
									<small>{{ getLatestVital(patientVitals.pulse_rate)?.unit || '' }}</small>
								</span>
								<span class="vital-date" v-if="getLatestVital(patientVitals.pulse_rate)?.updatedAt">
									{{ formatRelativeTime(getLatestVital(patientVitals.pulse_rate)?.updatedAt) }}
								</span>
							</div>
							<div class="vital-item">
								<v-icon name="bi-droplet-fill" scale="0.8" />
								<span class="vital-label">Blood Sugar</span>
								<span class="vital-value">
									{{ getLatestVital(patientVitals.blood_sugar_level)?.value || '-' }}
									<small>{{ getLatestVital(patientVitals.blood_sugar_level)?.unit || '' }}</small>
								</span>
								<span class="vital-date" v-if="getLatestVital(patientVitals.blood_sugar_level)?.updatedAt">
									{{ formatRelativeTime(getLatestVital(patientVitals.blood_sugar_level)?.updatedAt) }}
								</span>
							</div>
							<div class="vital-item">
								<v-icon name="fa-thermometer-half" scale="0.8" />
								<span class="vital-label">Temperature</span>
								<span class="vital-value">
									{{ getLatestVital(patientVitals.body_temp)?.value || '-' }}
									<small>{{ getLatestVital(patientVitals.body_temp)?.unit || '' }}</small>
								</span>
								<span class="vital-date" v-if="getLatestVital(patientVitals.body_temp)?.updatedAt">
									{{ formatRelativeTime(getLatestVital(patientVitals.body_temp)?.updatedAt) }}
								</span>
							</div>
						</div>
					</div>

					<!-- Previous Appointments with this Patient -->
					<div v-if="previousAppointments.length > 0" class="previous-appointments">
						<h4 class="subsection-title">
							<v-icon name="hi-clock" scale="0.8" />
							Previous Appointments
						</h4>
						<div class="prev-appointments-list">
							<div v-for="apt in previousAppointments" :key="apt._id" class="prev-appointment-item">
								<div class="prev-apt-date">
									<v-icon name="hi-calendar" scale="0.7" />
									{{ format(new Date(apt.start_time), 'MMM dd, yyyy') }}
								</div>
								<div v-if="apt.notes && apt.notes.length" class="prev-apt-notes">
									<span class="notes-label">Notes:</span>
									<span v-if="typeof apt.notes === 'string'">{{ apt.notes }}</span>
									<span v-else>{{ apt.notes.map(n => n.content).join('; ') }}</span>
								</div>
								<div v-else class="prev-apt-notes no-notes">No notes recorded</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Action Buttons -->
				<div class="appointment-actions">
					<rc-button
						type="secondary"
						label="Reschedule"
						class="reschedule_action"
						@click="rescheduleAppointmentRef.onOpen(appointmentInfo);"
					/>
					<rc-button
						type="primary"
						label="Start Meeting"
						class="start_meeting_action"
					/>
				</div>
			</div>

			<div v-if="isOpenMedicalRecords" class="medical-records-modal large-screens-only">
				<div class="medical-records-header">
					<p class="medical-records-header__heading">Medical Records</p>
					<icon-button @click="isOpenMedicalRecords = false" icon="icon-close" size="md" :sx="{ stroke: '#DB1818' }" />
				</div>
				<div class="medical-records-body">
					<rc-tab
						wrapper-class="medical-records-tabs-wrapper"
						tab-class="medical-records-tab"
						:currentTab="currentTab"
						@onClick="currentTab = $event"
						:tabs="[
							{ title: 'General', value: 'general' },
							{ title: 'Self Diagnosis Report', value: 'diagnosis' },
							{ title: 'Medical History', value: 'history' },
						]"
					/>

					<template v-if="currentTab === 'general'">
						<div class="medical-records-general">
							<div class="medical-records-general__health-info">
								<div class="medical-records-general__cards">
									<p class="medical-records-general__cards--title">Pulse Rate</p>
									<p v-if="patientVitals.pulse_rate" class="medical-records-general__cards--content">
										{{ patientVitals.pulse_rate[0].value }} {{ patientVitals.pulse_rate[0].unit }}
									</p>
									<p v-else class="medical-records-general__cards--content">-</p>
								</div>
								<div class="medical-records-general__cards">
									<p class="medical-records-general__cards--title">Blood Pressure</p>
									<p v-if="patientVitals.blood_pressure" class="medical-records-general__cards--content">
										{{ patientVitals.blood_pressure[0].value }} {{ patientVitals.blood_pressure[0].unit }}
									</p>
									<p v-else class="medical-records-general__cards--content">-</p>
								</div>
								<div class="medical-records-general__cards">
									<p class="medical-records-general__cards--title">Blood Sugar Level</p>
									<p v-if="patientVitals.blood_sugar_level" class="medical-records-general__cards--content">
										{{ patientVitals.blood_sugar_level[0].value }} {{ patientVitals.blood_sugar_level[0].unit }}
									</p>
									<p v-else class="medical-records-general__cards--content">-</p>
								</div>
								<div class="medical-records-general__cards">
									<p class="medical-records-general__cards--title">Temperature</p>
									<p v-if="patientVitals.body_temp" class="medical-records-general__cards--content">
										{{ patientVitals.body_temp[0].value }} {{ patientVitals.body_temp[0].unit }}
									</p>
									<p v-else class="medical-records-general__cards--content">-</p>
								</div>
							</div>
							<div class="medical-records-general__risk-factors">
								<p class="medical-records-risk-factors__header">Risk Factors</p>
								<div class="medical-records-risk-factors__content">
									<div class="medical-records-general__cards">
										<p class="medical-records-general__cards--title">BMI</p>
										<p class="medical-records-general__cards--content">
											- <small>({{ patientInfo.weightStatus }})</small>
										</p>
									</div>
									<div class="medical-records-general__cards">
										<p class="medical-records-general__cards--title">High Cholesterol</p>
										<p class="medical-records-general__cards--content">-</p>
									</div>
									<div class="medical-records-general__cards">
										<p class="medical-records-general__cards--title">Smokes?</p>
										<p class="medical-records-general__cards--content">{{ patientInfo.isSmoker }}</p>
									</div>
									<div class="medical-records-general__cards">
										<p class="medical-records-general__cards--title">Diabetic?</p>
										<p class="medical-records-general__cards--content">-</p>
									</div>
								</div>
							</div>
						</div>
					</template>
					<template v-if="currentTab === 'diagnosis'">
						<div v-if="hasDiagnosis" class="medical-records-diagnosis">
							<rc-tab
								:is-underlined="false"
								wrapper-class="diagnosis-tabs-wrapper"
								tab-class="diagnosis-tab"
								line-class="diagnosis-line-class"
								tab-active-class="diagnosis-tab-active"
								:currentTab="diagnosisTab"
								@onClick="diagnosisTab = $event"
								:tabs="[
									{ title: 'Result', value: 'result' },
									{ title: 'Summary', value: 'summary' },
								]"
							/>
							<template v-if="diagnosisTab === 'result'">
								<div class="diagnosis-result">
									<div class="diagnosis-result__header">
										<h3 class="diagnosis-result__header--heading">Possible Conditions</h3>
										<p class="diagnosis-result__header--description">
											Please not that the list below is a collection of possible 
											conditions arranged according to level of severity based on 
											the answers the patient provided. This list is provided solely 
											for informational purposes and is not a qualified medical opinion.
										</p>
									</div>
									<div class="diagnosis-result__conditions">
										<div class="diagnosis-result__conditions--major">
											<template v-for="condition in moreLikelyConditions" :key="JSON.stringify(condition)">
												<div class="diagnosis-conditions-card">
													<div class="diagnosis-conditions-card__content">
														<p class="diagnosis-conditions-card__title">{{ condition.common_name }}</p>
														<p  v-if="condition.category === 0" class="diagnosis-conditions-card__desc">Strong evidence</p>
														<p  v-if="condition.category === 1" class="diagnosis-conditions-card__desc">Strong evidence</p>
														<p  v-if="condition.category === 2" class="diagnosis-conditions-card__desc">Strong evidence</p>
													</div>
													<div>
														<div  v-if="condition.category === 0" class="dignosis-conditions-card__evidence-strong"></div>
														<div  v-if="condition.category === 1" class="dignosis-conditions-card__evidence-moderate"></div>
														<div  v-if="condition.category === 2" class="dignosis-conditions-card__evidence-weak"></div>
													</div>
												</div>
											</template>
										</div>
										<template v-if="lessLikelyConditions.length">
											<rc-accordion :items="lessLikelyConditions" class="diagnosis-conditions-accordion">
												<template v-slot:header>Show less likely conditions</template>
												<template v-slot:content="{ item }">
													<div class="diagnosis-conditions-card">
														<div class="diagnosis-conditions-card__content">
															<p class="diagnosis-conditions-card__title">{{ item.name }}</p>
															<p v-if="item.category === 0" class="diagnosis-conditions-card__desc">Strong evidence</p>
															<p v-if="item.category === 1" class="diagnosis-conditions-card__desc">Strong evidence</p>
															<p v-if="item.category === 2" class="diagnosis-conditions-card__desc">Strong evidence</p>
														</div>
														<div>
															<div  v-if="item.category === 0" class="dignosis-conditions-card__evidence-strong"></div>
															<div  v-if="item.category === 1" class="dignosis-conditions-card__evidence-moderate"></div>
															<div  v-if="item.category === 2" class="dignosis-conditions-card__evidence-weak"></div>
														</div>
													</div>
												</template>
											</rc-accordion>
										</template>
									</div>
								</div>
							</template>
							<template v-if="diagnosisTab === 'summary'">
								<div class="diagnosis-summary">
									<div class="diagnosis-summary__item">
										<p class="diagnosis-summary__item--key">Considered diagnoses</p>
										<p class="diagnosis-summary__item--value">{{ consideredDiagnosis.length }}+</p>
									</div>
									<div class="diagnosis-summary__item">
										<p class="diagnosis-summary__item--key">Interview duration</p>
										<p class="diagnosis-summary__item--value">0</p>
									</div>
								</div>
							</template>
						</div>
						<div v-else class="medical-records-diagnosis__empty">
							<h3 class="medical-records-diagnosis__empty--title">No report found</h3>
							<p class="medical-records-diagnosis__empty--desc">
								A self diagnosis test wasn’t taken before this appointment was booked.
							</p>
						</div>
					</template>
					<template v-if="currentTab === 'history'">
						<div class="medical-records-history">
							<template v-for="history in patientInfo.medicalHistory" :key="history._id">
								<div class="medical-records-history__item">
									<p class="medical-records-history__item--title">{{ history.name }}</p>
									<p class="medical-records-history__item--content">
										Diagnosed: {{ format(new Date(history.start_date), 'dd/MM/yyyy')  }}
									</p>
									<p class="medical-records-history__item--content">
										Treatment Status: {{ history.is_condition_exists ? 'Active': 'Inactive' }}
									</p>
								</div>
							</template>
						</div>
					</template>
				</div>
			</div>

			<rc-modal
				v-if="isOpenMedicalRecords"
				title="Medical Records"
				@closeModal="isOpenMedicalRecords = false"
				:has-footer="false"
				class="regular-screens-only"
			>
				<template v-slot:body>
					<div class="medical-records-body modal-container">
						<rc-tab
							wrapper-class="medical-records-tabs-wrapper"
							tab-class="medical-records-tab"
							:currentTab="currentTab"
							@onClick="currentTab = $event"
							:tabs="[
								{ title: 'General', value: 'general' },
								{ title: 'Self Diagnosis Report', value: 'diagnosis' },
								{ title: 'Medical History', value: 'history' },
							]"
						/>

						<template v-if="currentTab === 'general'">
							<div class="medical-records-general">
								<div class="medical-records-general__health-info">
									<div class="medical-records-general__cards">
										<p class="medical-records-general__cards--title">Pulse Rate</p>
										<p v-if="patientVitals.pulse_rate" class="medical-records-general__cards--content">
											{{ patientVitals.pulse_rate[0].value }} {{  patientVitals.pulse_rate[0].unit }}
										</p>
										<p v-else class="medical-records-general__cards--content">-</p>
									</div>
									<div class="medical-records-general__cards">
										<p class="medical-records-general__cards--title">Blood Pressure</p>
										<p v-if="patientVitals.blood_pressure" class="medical-records-general__cards--content">
											{{ patientVitals.blood_pressure[0].value }} {{  patientVitals.blood_pressure[0].unit }}
										</p>
										<p v-else class="medical-records-general__cards--content">-</p>
									</div>
									<div class="medical-records-general__cards">
										<p class="medical-records-general__cards--title">Blood Sugar Level</p>
										<p v-if="patientVitals.blood_sugar_level" class="medical-records-general__cards--content">
											{{ patientVitals.blood_sugar_level[0].value }} {{  patientVitals.blood_sugar_level[0].unit }}
										</p>
										<p v-else class="medical-records-general__cards--content">-</p>
									</div>
									<div class="medical-records-general__cards">
										<p class="medical-records-general__cards--title">Temperature</p>
										<p v-if="patientVitals.body_temp" class="medical-records-general__cards--content">
											{{ patientVitals.body_temp[0].value }} {{  patientVitals.body_temp[0].unit }}
										</p>
										<p v-else class="medical-records-general__cards--content">-</p>
									</div>
								</div>
								<div class="medical-records-general__risk-factors">
									<p class="medical-records-risk-factors__header">Risk Factors</p>
									<div class="medical-records-risk-factors__content">
										<div class="medical-records-general__cards">
											<p class="medical-records-general__cards--title">BMI</p>
											<p class="medical-records-general__cards--content">
												- <small>({{ patientInfo.weightStatus }})</small>
											</p>
										</div>
										<div class="medical-records-general__cards">
											<p class="medical-records-general__cards--title">High Cholesterol</p>
											<p class="medical-records-general__cards--content">-</p>
										</div>
										<div class="medical-records-general__cards">
											<p class="medical-records-general__cards--title">Smokes?</p>
											<p class="medical-records-general__cards--content">{{ patientInfo.isSmoker }}</p>
										</div>
										<div class="medical-records-general__cards">
											<p class="medical-records-general__cards--title">Diabetic?</p>
											<p class="medical-records-general__cards--content">-</p>
										</div>
									</div>
								</div>
							</div>
						</template>
						<template v-if="currentTab === 'diagnosis'">
							<div v-if="hasDiagnosis" class="medical-records-diagnosis">
								<rc-tab
									:is-underlined="false"
									wrapper-class="diagnosis-tabs-wrapper"
									tab-class="diagnosis-tab"
									line-class="diagnosis-line-class"
									tab-active-class="diagnosis-tab-active"
									:currentTab="diagnosisTab"
									@onClick="diagnosisTab = $event"
									:tabs="[
										{ title: 'Result', value: 'result' },
										{ title: 'Summary', value: 'summary' },
									]"
								/>
								<template v-if="diagnosisTab === 'result'">
									<div class="diagnosis-result">
										<div class="diagnosis-result__header">
											<h3 class="diagnosis-result__header--heading">Possible Conditions</h3>
											<p class="diagnosis-result__header--description">
												Please not that the list below is a collection of possible 
												conditions arranged according to level of severity based on 
												the answers the patient provided. This list is provided solely 
												for informational purposes and is not a qualified medical opinion.
											</p>
										</div>
										<div class="diagnosis-result__conditions">
											<div class="diagnosis-result__conditions--major">
												<template v-for="condition in moreLikelyConditions" :key="JSON.stringify(condition)">
													<div class="diagnosis-conditions-card">
														<div class="diagnosis-conditions-card__content">
															<p class="diagnosis-conditions-card__title">{{ condition.common_name }}</p>
															<p  v-if="condition.category === 0" class="diagnosis-conditions-card__desc">Strong evidence</p>
															<p  v-if="condition.category === 1" class="diagnosis-conditions-card__desc">Strong evidence</p>
															<p  v-if="condition.category === 2" class="diagnosis-conditions-card__desc">Strong evidence</p>
														</div>
														<div>
															<div  v-if="condition.category === 0" class="dignosis-conditions-card__evidence-strong"></div>
															<div  v-if="condition.category === 1" class="dignosis-conditions-card__evidence-moderate"></div>
															<div  v-if="condition.category === 2" class="dignosis-conditions-card__evidence-weak"></div>
														</div>
													</div>
												</template>
											</div>
											<template v-if="lessLikelyConditions.length">
												<rc-accordion :items="lessLikelyConditions" class="diagnosis-conditions-accordion">
													<template v-slot:header>Show less likely conditions</template>
													<template v-slot:content="{ item }">
														<div class="diagnosis-conditions-card">
															<div class="diagnosis-conditions-card__content">
																<p class="diagnosis-conditions-card__title">{{ item.name }}</p>
																<p v-if="item.category === 0" class="diagnosis-conditions-card__desc">Strong evidence</p>
																<p v-if="item.category === 1" class="diagnosis-conditions-card__desc">Strong evidence</p>
																<p v-if="item.category === 2" class="diagnosis-conditions-card__desc">Strong evidence</p>
															</div>
															<div>
																<div  v-if="item.category === 0" class="dignosis-conditions-card__evidence-strong"></div>
																<div  v-if="item.category === 1" class="dignosis-conditions-card__evidence-moderate"></div>
																<div  v-if="item.category === 2" class="dignosis-conditions-card__evidence-weak"></div>
															</div>
														</div>
													</template>
												</rc-accordion>
											</template>
										</div>
									</div>
								</template>
								<template v-if="diagnosisTab === 'summary'">
									<div class="diagnosis-summary">
										<div class="diagnosis-summary__item">
											<p class="diagnosis-summary__item--key">Considered diagnoses</p>
											<p class="diagnosis-summary__item--value">{{ consideredDiagnosis.length }}+</p>
										</div>
										<div class="diagnosis-summary__item">
											<p class="diagnosis-summary__item--key">Interview duration</p>
											<p class="diagnosis-summary__item--value">0</p>
										</div>
									</div>
								</template>
							</div>
							<div v-else class="medical-records-diagnosis__empty">
								<h3 class="medical-records-diagnosis__empty--title">No report found</h3>
								<p class="medical-records-diagnosis__empty--desc">A self diagnosis test wasn’t taken before this appointment was booked.</p>
							</div>
						</template>
						<template v-if="currentTab === 'history'">
							<div v-if="patientInfo.medicalHistory?.length" class="medical-records-history">
								<template v-for="history in patientInfo.medicalHistory" :key="history._id">
									<div class="medical-records-history__item">
										<p class="medical-records-history__item--title">{{ history.name }}</p>
										<p class="medical-records-history__item--content">Diagnosed: {{ format(new Date(history.start_date), 'dd/MM/yyyy')  }}</p>
										<p class="medical-records-history__item--content">Treatment Status: {{ history.is_condition_exists ? 'Active': 'Inactive' }}</p>
									</div>
								</template>
							</div>
							<div v-else class="medical-records-diagnosis__empty">
								<h3 class="medical-records-diagnosis__empty--title">No record found</h3>
								<p class="medical-records-diagnosis__empty--desc">A medical record wasn’t taken before this appointment was booked.</p>
							</div>
						</template>
					</div>
				</template>
			</rc-modal>

			<reschedule-appointment ref="rescheduleAppointmentRef" />

			<!-- Health Score Modal -->
			<rc-modal v-if="showScoreModal" @close="showScoreModal = false">
				<template #default>
					<div class="score-modal">
						<div class="score-modal__header">
							<h3>{{ selectedScoreType === 'basic' ? 'Basic' : 'Advanced' }} Health Score</h3>
							<icon-button @click="showScoreModal = false" icon="icon-close" size="md" :sx="{ stroke: '#DB1818' }" />
						</div>
						<div class="score-modal__body">
							<div class="score-modal__circle" :class="getScoreClass(selectedScore)">
								<span class="score-value">{{ selectedScore }}</span>
								<span class="score-max">/100</span>
							</div>
							<div class="score-modal__status" :class="getScoreClass(selectedScore)">
								{{ getScoreLabel(selectedScore) }}
							</div>
							<div class="score-modal__description">
								<p v-if="selectedScoreType === 'basic'">
									This score is calculated based on the patient's recent vital readings including blood pressure, pulse rate, blood sugar level, body temperature, and BMI.
								</p>
								<p v-else>
									This comprehensive score is calculated using AI-powered assessment of the patient's health data, lifestyle factors, and risk indicators.
								</p>
							</div>
							<div v-if="selectedScoreType === 'advanced' && healthScores.advancedDetails" class="score-modal__details">
								<h4>Score Breakdown</h4>
								<div class="detail-item" v-if="healthScores.advancedDetails.physical_health">
									<span class="detail-label">Physical Health</span>
									<span class="detail-value">{{ healthScores.advancedDetails.physical_health.score }}/100</span>
								</div>
								<div class="detail-item" v-if="healthScores.advancedDetails.mental_health">
									<span class="detail-label">Mental Health</span>
									<span class="detail-value">{{ healthScores.advancedDetails.mental_health.score }}/100</span>
								</div>
								<div class="detail-item" v-if="healthScores.advancedDetails.lifestyle">
									<span class="detail-label">Lifestyle</span>
									<span class="detail-value">{{ healthScores.advancedDetails.lifestyle.score }}/100</span>
								</div>
							</div>
						</div>
					</div>
				</template>
			</rc-modal>
		</div>
	</div>
</template>

<script setup>
import { format, formatDistanceToNow } from "date-fns";
import { useRoute, useRouter } from 'vue-router';
import { ref, inject, onMounted, computed } from 'vue';
import TopBar from "@/components/Navigation/top-bar";
import RcAvatar from "@/components/RCAvatar";
import IconButton from "@/components/RCIconButton";
import RcTab from "@/components/RCTab";
import RcAccordion from "@/components/RCAccordion";
import RcButton from "@/components/buttons/button-primary";
import RcModal from "@/components/modals/dialog-modal";
import Loader from "@/components/Loader/main-loader";
import RescheduleAppointment from "./RescheduleAppointment";
import { calculateAge } from "@/utilities/utilityFunctions";

const route = useRoute();
const router = useRouter();
const $http = inject('$_HTTP');
defineEmits(["openSideNav"]);

const currentTab = ref("general");
const diagnosisTab = ref("result");
const appointmentInfo = ref({});
const patientInfo = ref({});
const patientVitals = ref({});
const preferences = ref({});
const isLoading = ref(true);
const isOpenMedicalRecords = ref(false);
const rescheduleAppointmentRef = ref();

const sortedConditions = ref([]);
const moreLikelyConditions = ref([]);
const lessLikelyConditions = ref([]);
const conditions = ref([]);
const consideredDiagnosis = ref([]);
const hasDiagnosis = ref(false);

// Health Dashboard data
const healthScores = ref({
	basic: null,
	advanced: null,
	advancedDetails: null
});
const healthCheckups = ref([]);
const checkupCount = ref(0);
const previousAppointments = ref([]);

// Computed property to check if patient has any health data
const hasHealthData = computed(() => {
	return healthCheckups.value.length > 0 ||
		healthScores.value.basic !== null ||
		healthScores.value.advanced !== null;
});

// Show meeting summary for completed/missed appointments
const showMeetingSummary = computed(() => {
	const status = appointmentInfo.value?.status?.toUpperCase();
	return ['COMPLETED', 'MISSED', 'CLOSED'].includes(status) ||
		appointmentInfo.value?.attendance?.attendance_status ||
		appointmentInfo.value?.participants?.length > 0 ||
		appointmentInfo.value?.call_duration?.time_taken > 0;
});

// Format duration in minutes to human-readable
function formatDuration(minutes) {
	if (!minutes) return '-';
	if (minutes < 60) return `${Math.round(minutes)} minutes`;
	const hours = Math.floor(minutes / 60);
	const mins = Math.round(minutes % 60);
	return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
}

// Format time from date
function formatTime(dateStr) {
	if (!dateStr) return '-';
	try {
		return format(new Date(dateStr), 'hh:mm a');
	} catch {
		return '-';
	}
}

// Format date and time
function formatDateTime(dateStr) {
	if (!dateStr) return '-';
	try {
		return format(new Date(dateStr), 'MMM dd, hh:mm a');
	} catch {
		return '-';
	}
}

// Format date only
function formatDate(dateStr) {
	if (!dateStr) return '-';
	try {
		return format(new Date(dateStr), 'MMM dd, yyyy');
	} catch {
		return '-';
	}
}

// Get status badge class
function getStatusClass(status) {
	if (!status) return '';
	const s = status.toUpperCase();
	return {
		'COMPLETED': 'status-completed',
		'MISSED': 'status-missed',
		'OPEN': 'status-open',
		'ONGOING': 'status-ongoing',
		'CANCELLED': 'status-cancelled',
		'CLOSED': 'status-closed',
	}[s] || '';
}

// Health score modal
const showScoreModal = ref(false);
const selectedScore = ref(null);
const selectedScoreType = ref('');

onMounted(async () => {
	isLoading.value = true;
	await getAppointmentDetails(route.params.id);
	await getTimeAvailability();
	isLoading.value = false;
});

async function getAppointmentDetails(appointmentId) {
	try {
		const { data } = await $http.$_getAppointmentDetailsForSpecialist(appointmentId);
		const details = data.data;

		// Set appointment info
		appointmentInfo.value = details.appointment;

		// Set patient info with presigned profile photo
		patientInfo.value = {
			_id: details.patient._id,
			fullName: details.patient.full_name,
			firstName: details.patient.first_name || '',
			lastName: details.patient.last_name || '',
			profileImage: details.patient.profile_image,
			gender: details.patient.gender,
			weight: details.patient.weight || { value: '-', unit: '' },
			height: details.patient.height || { value: '-', unit: '' },
			age: details.patient.age,
			isSmoker: details.patient.is_smoker || 'Unknown',
			weightStatus: details.patient.weight_status || '-',
			medicalHistory: details.patient.medical_history || []
		};

		// Set vitals (already in correct format)
		patientVitals.value = details.vitals || {};

		// Set health scores
		healthScores.value = {
			basic: details.health_scores?.basic || null,
			advanced: details.health_scores?.advanced || null,
			advancedDetails: details.health_scores?.advanced_details || null
		};

		// Set health checkups
		healthCheckups.value = details.health_checkups || [];
		checkupCount.value = details.checkup_count || 0;

		// Set previous appointments
		previousAppointments.value = details.previous_appointments || [];

		// Process diagnosis data for the modal
		if (healthCheckups.value.length > 0) {
			hasDiagnosis.value = true;
			const latestCheckup = healthCheckups.value[0];
			consideredDiagnosis.value = latestCheckup.request?.evidence || [];
			conditions.value = latestCheckup.response?.data?.conditions || [];

			if (conditions.value.length > 0) {
				const sorted = [...conditions.value].sort((a, b) => b.probability - a.probability);
				moreLikelyConditions.value = [];
				lessLikelyConditions.value = [];

				sorted.map((condition, i) => ({
					...condition,
					category: Math.floor(i / (sorted.length / 3))
				})).forEach((condition) => {
					if (condition.category <= 1) moreLikelyConditions.value.push(condition);
					else lessLikelyConditions.value.push(condition);
				});
			}
		}
	} catch (error) {
		console.error('Error fetching appointment details:', error);
		// Fallback to old method if new endpoint fails
		await fallbackGetAppointmentDetails(appointmentId);
	}
}

// Fallback method if new endpoint is not available
async function fallbackGetAppointmentDetails(appointmentId) {
	await $http.$_getOnetAppointments(appointmentId).then(async ({ data }) => {
		appointmentInfo.value = data.data;
		await getOneUserInfo(data.data.patient);
		getUserVitals(data.data.patient);
		getHealthCheckupResult(data.data.patient);
	});
}

async function getOneUserInfo(userId) {
	await $http.$_getOneUser(userId).then(({ data }) => {
		patientInfo.value = {
			...data.data,
			fullName: data.data.full_name,
			firstName: data.data.profile?.first_name || '',
			lastName: data.data.profile?.last_name || '',
			profileImage: data.data.profile?.profile_image || data.data.profile?.profile_photo || null,
			gender: data.data.profile.gender,
			weight: data.data.profile.basic_health_info?.weight || { value: '-', unit: '' },
			height: data.data.profile.basic_health_info?.height || { value: '-', unit: '' },
			age: calculateAge(data.data.profile.date_of_birth),
			isSmoker: data.data.profile.health_risk_factors?.is_smoker || 'Unknown',
			weightStatus: data.data.profile.health_risk_factors?.weight_status || '-',
			medicalHistory: data.data.pre_existing_conditions
		};
	});
}

async function getTimeAvailability() {
	await $http.$_getSpecialistAvailability().then(({ data }) => {
		preferences.value = data.data.preferences;
	}).catch(() => {
		preferences.value = {};
	});
}

const getUserVitals = async (patientId) => {
	await $http.$_getOneUserVitals(patientId).then(({ data }) => {
		patientVitals.value = data.data;
	}).catch(() => {
		patientVitals.value = {};
	});
}

const getHealthCheckupResult = async (patientId) => {
	await $http.$_getHealthCheckupResult(patientId).then(({ data }) => {
		if (Array.isArray(data.data) && data.data.length) {
			hasDiagnosis.value = true;
			healthCheckups.value = data.data.sort((a, b) =>
				new Date(b.created_at) - new Date(a.created_at)
			);
			checkupCount.value = data.data.length;

			consideredDiagnosis.value = data.data[0]['request']['evidence'];
			conditions.value = data.data[0]['response']['data']['conditions'];
			const sorted = conditions.value?.sort((a, b) => b.probability - a.probability);
			moreLikelyConditions.value = [];
			lessLikelyConditions.value = [];
			sorted?.map((condition, i) => ({
				...condition, category: Math.floor(i / (sorted.length / 3))
			})).forEach((condition) => {
				if (condition.category <= 1) moreLikelyConditions.value.push(condition);
				else lessLikelyConditions.value.push(condition);
			});
		}
	}).catch(() => {
		healthCheckups.value = [];
	});
}

// Open health score details - navigate to full page view
const openScoreDetails = (scoreType) => {
	const appointmentId = route.params.id;

	if (scoreType === 'basic' && healthScores.value.basic !== null) {
		// Navigate to basic health score report
		router.push({
			name: 'SpecialistPatientHealthScoreReport',
			params: {
				appointmentId: appointmentId,
				type: 'basic'
			},
			query: {
				patientName: patientInfo.value.fullName,
				patientGender: patientInfo.value.gender,
				patientAge: patientInfo.value.age
			}
		});
	} else if (scoreType === 'advanced' && healthScores.value.advanced !== null) {
		// Navigate to advanced health score report
		const scoreId = healthScores.value.advancedDetails?._id || '';

		router.push({
			name: 'SpecialistPatientHealthScoreReport',
			params: {
				appointmentId: appointmentId,
				type: 'advanced',
				scoreId: scoreId
			},
			query: {
				patientName: patientInfo.value.fullName,
				patientGender: patientInfo.value.gender,
				patientAge: patientInfo.value.age
			}
		});
	}
}

// Open full health records page
const openFullHealthRecords = () => {
	const appointmentId = route.params.id;
	const patientId = patientInfo.value._id;

	if (!patientId) {
		console.error('Patient ID not available');
		return;
	}

	router.push({
		name: 'SpecialistPatientHealthRecords',
		params: {
			patientId: patientId
		},
		query: {
			appointmentId: appointmentId
		}
	});
}

// Helper to get the latest vital value
const getLatestVital = (vitalArray) => {
	if (!vitalArray || !Array.isArray(vitalArray) || vitalArray.length === 0) {
		return null;
	}
	// Return the first item (backend returns sorted by most recent)
	return vitalArray[0];
}

// Format relative time (e.g., "3 days ago")
const formatRelativeTime = (dateString) => {
	if (!dateString) return '';
	try {
		return formatDistanceToNow(new Date(dateString), { addSuffix: true });
	} catch {
		return '';
	}
}

// Helper functions for health score display
const getScoreClass = (score) => {
	if (score === null) return 'score-none';
	if (score >= 80) return 'score-excellent';
	if (score >= 60) return 'score-good';
	if (score >= 40) return 'score-fair';
	return 'score-poor';
}

const getScoreLabel = (score) => {
	if (score >= 80) return 'Excellent';
	if (score >= 60) return 'Good';
	if (score >= 40) return 'Fair';
	return 'Needs Attention';
}

// Helper functions for health checkups display
// Symptoms are stored in request.evidence with 'label' as the name field
// Symptom IDs start with 's_' (vs risk factors which start with 'p_')
const getCheckupSymptoms = (checkup) => {
	const evidence = checkup.request?.evidence || [];
	if (evidence.length === 0) return 'General checkup';

	const symptomNames = evidence
		.filter(s => s.choice_id === 'present' && s.id?.startsWith('s_'))
		.slice(0, 2)
		.map(s => s.label || s.common_name || s.name)
		.join(', ');

	return symptomNames || 'Health assessment';
}

const getTriageClass = (level) => {
	if (!level) return 'triage-unknown';
	const levelLower = level.toLowerCase();
	if (levelLower.includes('emergency')) return 'triage-emergency';
	if (levelLower.includes('consultation_24')) return 'triage-urgent';
	if (levelLower.includes('consultation')) return 'triage-moderate';
	if (levelLower.includes('self_care')) return 'triage-low';
	return 'triage-unknown';
}

const formatTriage = (level) => {
	if (!level) return 'N/A';
	const levelLower = level.toLowerCase();
	if (levelLower.includes('emergency')) return 'Emergency';
	if (levelLower.includes('consultation_24')) return 'Urgent';
	if (levelLower.includes('consultation')) return 'Moderate';
	if (levelLower.includes('self_care')) return 'Low';
	return 'N/A';
}

const viewCheckupDetails = (checkup) => {
	// Navigate to the checkup detail page
	const appointmentId = route.params.id;
	const checkupId = checkup._id;

	router.push({
		name: 'SpecialistPatientCheckupDetail',
		params: {
			appointmentId: appointmentId,
			checkupId: checkupId
		},
		query: {
			patientName: patientInfo.value.fullName,
			patientGender: patientInfo.value.gender,
			patientAge: patientInfo.value.age
		}
	});
}

</script>

<style scoped lang="scss">
.page-content {
	display: flex;
	flex-direction: column;
	gap: $size-12;
	width: 100%;
	height: 100vh;
	padding: 0 128px;

	@include responsive(tab-portrait) {
		padding: $size-0;
	}

	@include responsive(phone) {
		padding: $size-0;
	}

	&__body {
		display: flex;
		justify-content: space-between;
		gap: $size-32;
		width: 100%;
		padding: $size-24 $size-32;
		overflow-y: auto;

		@include responsive(phone) {
			flex-direction: column;
			padding: $size-16;
			height: auto;
		}

		&::-webkit-scrollbar {
			display: none;
			width: 12px;
			background-color: $color-g-97;
		}
	}
}

@include responsive(large-screen) {
	.large-screens-only {
		display: flex !important;
	}
	.regular-screens-only {
		display: none !important;
	}
}
@include responsive(small-laptop) {
	.large-screens-only {
		display: none !important;
	}
	.regular-screens-only {
		display: flex !important;
	}
}

.appointment-details-container {
	width: 100%;
	max-width: 700px;
	display: flex;
	flex-direction: column;
	gap: $size-24;
	padding-bottom: $size-32;

	@include responsive(phone) {
		max-width: 100%;
		margin-bottom: $size-24;
	}
}

// Patient Card
.patient-card {
	background: white;
	border-radius: $size-16;
	padding: $size-24;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
	border-left: 4px solid #0EAEC4;

	&__header {
		display: flex;
		align-items: center;
		gap: $size-16;
		margin-bottom: $size-20;
	}

	&__stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: $size-16;
		padding-top: $size-16;
		border-top: 1px solid $color-g-92;

		@include responsive(phone) {
			grid-template-columns: repeat(2, 1fr);
		}
	}
}

.patient-avatar-wrapper {
	position: relative;

	.health-indicator {
		position: absolute;
		bottom: 0;
		right: 0;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 2px solid white;

		&--available {
			background: #10b981;
			color: white;
		}
	}
}

.patient-info {
	flex: 1;
}

.patient-name {
	font-size: $size-20;
	font-weight: $fw-semi-bold;
	color: $color-g-21;
	margin: 0 0 $size-6 0;
	text-transform: capitalize;
}

.patient-meta {
	display: flex;
	align-items: center;
	gap: $size-16;
}

.meta-item {
	display: flex;
	align-items: center;
	gap: $size-4;
	font-size: $size-13;
	color: $color-g-44;

	svg {
		color: #0EAEC4;
	}
}

.stat-item {
	display: flex;
	flex-direction: column;
	gap: $size-4;

	.stat-label {
		font-size: $size-12;
		color: $color-g-44;
	}

	.stat-value {
		font-size: $size-15;
		font-weight: $fw-medium;
		color: $color-g-21;
	}
}

// Appointment Card
.appointment-card {
	background: white;
	border-radius: $size-16;
	padding: $size-24;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

// Meeting Summary Card
.meeting-summary-card {
	background: white;
	border-radius: $size-16;
	padding: $size-24;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

	.section-title {
		.status-badge {
			margin-left: auto;
			padding: 4px 12px;
			border-radius: 20px;
			font-size: 11px;
			font-weight: 600;
			text-transform: uppercase;

			&.status-completed {
				background: #E8F5E9;
				color: #2E7D32;
			}
			&.status-missed {
				background: #FFEBEE;
				color: #C62828;
			}
			&.status-open {
				background: #E3F2FD;
				color: #1565C0;
			}
			&.status-ongoing {
				background: #FFF3E0;
				color: #EF6C00;
			}
			&.status-cancelled {
				background: #FAFAFA;
				color: #757575;
			}
			&.status-closed {
				background: #F3E5F5;
				color: #7B1FA2;
			}
		}
	}

	.subsection-title-sm {
		font-size: 13px;
		font-weight: 600;
		color: #666;
		margin: 0 0 12px 0;
	}

	.attendance-section {
		margin-bottom: 20px;
		padding-bottom: 20px;
		border-bottom: 1px solid #f0f0f0;

		.attendance-indicators {
			display: flex;
			gap: 24px;

			@include responsive(phone) {
				flex-direction: column;
				gap: 12px;
			}
		}

		.attendance-item {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 12px 16px;
			background: #FFEBEE;
			border-radius: 8px;
			flex: 1;

			svg {
				color: #C62828;
			}

			span {
				font-weight: 500;
				color: #C62828;
			}

			small {
				margin-left: auto;
				font-size: 11px;
				color: #666;
			}

			&.attended {
				background: #E8F5E9;

				svg, span {
					color: #2E7D32;
				}
			}
		}
	}

	.duration-section {
		margin-bottom: 20px;
		padding-bottom: 20px;
		border-bottom: 1px solid #f0f0f0;

		.duration-display {
			display: flex;
			align-items: center;
			gap: 12px;
			padding: 16px;
			background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
			border-radius: 12px;
			margin-bottom: 8px;

			svg {
				color: #1565C0;
			}

			.duration-value {
				font-size: 24px;
				font-weight: 700;
				color: #1565C0;
			}
		}

		.duration-times {
			display: flex;
			gap: 16px;
			font-size: 12px;
			color: #666;
			padding: 0 4px;

			@include responsive(phone) {
				flex-direction: column;
				gap: 4px;
			}
		}
	}

	.participants-section {
		margin-bottom: 20px;
		padding-bottom: 20px;
		border-bottom: 1px solid #f0f0f0;

		.participants-list {
			display: flex;
			flex-direction: column;
			gap: 8px;
		}

		.participant-item {
			display: flex;
			align-items: center;
			gap: 12px;
			padding: 12px;
			background: #f8f9fa;
			border-radius: 8px;

			.participant-avatar {
				width: 36px;
				height: 36px;
				border-radius: 50%;
				background: #e0e0e0;
				display: flex;
				align-items: center;
				justify-content: center;

				svg {
					color: #666;
				}
			}

			.participant-info {
				flex: 1;
				display: flex;
				flex-direction: column;

				.participant-name {
					font-weight: 500;
					color: #333;
				}

				.participant-email {
					font-size: 12px;
					color: #666;
				}
			}

			.participant-time {
				text-align: right;
				display: flex;
				flex-direction: column;

				.participant-duration {
					font-weight: 600;
					color: #0EAEC4;
				}

				small {
					font-size: 11px;
					color: #999;
				}
			}
		}
	}

	.recording-section {
		.recording-card {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 16px;
			background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%);
			border-radius: 12px;

			.recording-info {
				display: flex;
				align-items: center;
				gap: 12px;

				svg {
					color: #EF6C00;
				}

				.recording-details {
					display: flex;
					flex-direction: column;

					.recording-status {
						font-weight: 600;
						color: #EF6C00;
						text-transform: capitalize;

						&.available {
							color: #2E7D32;
						}
						&.expired {
							color: #C62828;
						}
					}

					.recording-duration {
						font-size: 12px;
						color: #666;
					}
				}
			}

			.recording-link {
				display: flex;
				align-items: center;
				gap: 6px;
				padding: 8px 16px;
				background: #EF6C00;
				color: white;
				border-radius: 6px;
				text-decoration: none;
				font-weight: 500;
				font-size: 13px;
				transition: background 0.2s;

				&:hover {
					background: #E65100;
				}
			}
		}

		.recording-expiry {
			margin-top: 8px;
			font-size: 11px;
			color: #999;
			padding: 0 4px;
		}
	}
}

.section-title {
	display: flex;
	align-items: center;
	gap: $size-8;
	font-size: $size-16;
	font-weight: $fw-semi-bold;
	color: $color-g-21;
	margin: 0 0 $size-20 0;

	svg {
		color: #0EAEC4;
	}
}

.appointment-info-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: $size-16;

	@include responsive(phone) {
		grid-template-columns: 1fr;
	}
}

.info-item {
	display: flex;
	align-items: flex-start;
	gap: $size-12;

	.info-icon {
		width: 36px;
		height: 36px;
		border-radius: $size-8;
		background: rgba(14, 174, 196, 0.1);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;

		svg {
			color: #0EAEC4;
		}
	}

	.info-content {
		display: flex;
		flex-direction: column;
		gap: $size-2;
	}

	.info-label {
		font-size: $size-12;
		color: $color-g-44;
	}

	.info-value {
		font-size: $size-14;
		font-weight: $fw-medium;
		color: $color-g-21;

		small {
			font-weight: $fw-regular;
			color: $color-g-54;
		}
	}
}

// Health Dashboard
.health-dashboard {
	background: white;
	border-radius: $size-16;
	padding: $size-24;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

	@include responsive(phone) {
		padding: $size-16;
		border-radius: $size-12;
	}

	&__header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: $size-20;

		@include responsive(phone) {
			flex-direction: column;
			align-items: flex-start;
			gap: $size-12;
			margin-bottom: $size-16;
		}
	}
}

.view-all-btn {
	display: flex;
	align-items: center;
	gap: $size-6;
	padding: $size-8 $size-16;
	background: rgba(14, 174, 196, 0.1);
	border: none;
	border-radius: $size-8;
	color: #0EAEC4;
	font-size: $size-13;
	font-weight: $fw-medium;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: rgba(14, 174, 196, 0.2);
	}
}

// Health Scores
.health-scores {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: $size-16;
	margin-bottom: $size-24;

	@include responsive(phone) {
		grid-template-columns: 1fr;
	}
}

.score-card {
	display: flex;
	align-items: center;
	gap: $size-16;
	padding: $size-16;
	background: $color-g-97;
	border-radius: $size-12;
	border: 1px solid $color-g-92;
	transition: all 0.2s ease;

	&.clickable {
		cursor: pointer;

		&:hover {
			transform: translateY(-2px);
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		}
	}

	&.score-excellent {
		background: rgba(16, 185, 129, 0.1);
		border-color: rgba(16, 185, 129, 0.3);

		.score-circle {
			background: linear-gradient(135deg, #10b981 0%, #059669 100%);
		}
	}

	&.score-good {
		background: rgba(14, 174, 196, 0.1);
		border-color: rgba(14, 174, 196, 0.3);

		.score-circle {
			background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%);
		}
	}

	&.score-fair {
		background: rgba(245, 158, 11, 0.1);
		border-color: rgba(245, 158, 11, 0.3);

		.score-circle {
			background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
		}
	}

	&.score-poor {
		background: rgba(239, 68, 68, 0.1);
		border-color: rgba(239, 68, 68, 0.3);

		.score-circle {
			background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
		}
	}

	&.score-none {
		.score-circle {
			background: #a1a1aa;
		}
	}

	&.advanced .score-circle {
		background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
	}

	&.advanced.score-none .score-circle {
		background: #a1a1aa;
	}
}

.score-circle {
	width: 48px;
	height: 48px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	flex-shrink: 0;

	.score-value {
		font-size: $size-16;
		font-weight: $fw-bold;
	}
}

.score-info {
	display: flex;
	flex-direction: column;
	gap: $size-4;

	.score-label {
		font-size: $size-13;
		color: $color-g-44;
	}

	.score-status {
		font-size: $size-14;
		font-weight: $fw-medium;
		color: $color-g-21;

		&.not-taken {
			color: $color-g-54;
			font-style: italic;
		}
	}
}

// Health Checkups
.health-checkups {
	margin-bottom: $size-24;
}

.subsection-title {
	display: flex;
	align-items: center;
	gap: $size-8;
	font-size: $size-14;
	font-weight: $fw-semi-bold;
	color: $color-g-21;
	margin: 0 0 $size-16 0;

	svg {
		color: #0EAEC4;
	}

	.checkup-count {
		font-weight: $fw-regular;
		color: $color-g-54;
		font-size: $size-13;
	}
}

.checkups-list {
	display: flex;
	flex-direction: column;
	gap: $size-12;
}

.checkup-item {
	display: flex;
	align-items: center;
	gap: $size-12;
	padding: $size-12 $size-16;
	background: $color-g-97;
	border-radius: $size-10;
	cursor: pointer;
	transition: all 0.2s ease;
	border: 1px solid transparent;

	&:hover {
		background: rgba(14, 174, 196, 0.05);
		border-color: rgba(14, 174, 196, 0.2);
	}

	@include responsive(phone) {
		padding: $size-10 $size-12;
		gap: $size-10;
		flex-wrap: wrap;
	}
}

.checkup-icon {
	width: 36px;
	height: 36px;
	border-radius: $size-8;
	background: rgba(14, 174, 196, 0.1);
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;

	svg {
		color: #0EAEC4;
	}
}

.checkup-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: $size-2;
	min-width: 0;
}

.checkup-date {
	font-size: $size-12;
	color: $color-g-44;
}

.checkup-symptoms {
	font-size: $size-14;
	font-weight: $fw-medium;
	color: $color-g-21;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.checkup-result {
	display: flex;
	align-items: center;
	gap: $size-4;
	font-size: $size-12;
	color: #0EAEC4;

	svg {
		color: #0EAEC4;
	}
}

.checkup-triage {
	padding: $size-4 $size-10;
	border-radius: $size-6;
	font-size: $size-11;
	font-weight: $fw-medium;
	text-transform: uppercase;
	flex-shrink: 0;

	&.triage-emergency {
		background: rgba(239, 68, 68, 0.1);
		color: #dc2626;
	}

	&.triage-urgent {
		background: rgba(249, 115, 22, 0.1);
		color: #ea580c;
	}

	&.triage-moderate {
		background: rgba(245, 158, 11, 0.1);
		color: #d97706;
	}

	&.triage-low {
		background: rgba(16, 185, 129, 0.1);
		color: #059669;
	}

	&.triage-unknown {
		background: $color-g-92;
		color: $color-g-54;
	}
}

.no-checkups {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: $size-32;
	background: $color-g-97;
	border-radius: $size-10;
	color: $color-g-54;

	svg {
		margin-bottom: $size-12;
		opacity: 0.5;
	}

	p {
		margin: 0;
		font-size: $size-14;
	}
}

// Vitals Summary
.vitals-summary {
	padding-top: $size-16;
	border-top: 1px solid $color-g-92;
}

.vitals-grid {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: $size-12;

	@include responsive(phone) {
		grid-template-columns: repeat(2, 1fr);
	}
}

.vital-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: $size-6;
	padding: $size-12;
	background: $color-g-97;
	border-radius: $size-10;
	text-align: center;

	svg {
		color: #0EAEC4;
	}

	.vital-label {
		font-size: $size-11;
		color: $color-g-44;
	}

	.vital-value {
		font-size: $size-14;
		font-weight: $fw-semi-bold;
		color: $color-g-21;

		small {
			font-size: $size-10;
			font-weight: $fw-regular;
			color: $color-g-54;
		}
	}

	.vital-date {
		font-size: $size-10;
		color: $color-g-54;
		margin-top: $size-2;
	}
}

// Previous Appointments
.previous-appointments {
	padding-top: $size-16;
	border-top: 1px solid $color-g-92;
	margin-top: $size-16;
}

.prev-appointments-list {
	display: flex;
	flex-direction: column;
	gap: $size-10;
}

.prev-appointment-item {
	display: flex;
	flex-direction: column;
	gap: $size-6;
	padding: $size-12 $size-16;
	background: $color-g-97;
	border-radius: $size-10;
	border-left: 3px solid #0EAEC4;
}

.prev-apt-date {
	display: flex;
	align-items: center;
	gap: $size-6;
	font-size: $size-13;
	font-weight: $fw-medium;
	color: $color-g-21;

	svg {
		color: #0EAEC4;
	}
}

.prev-apt-notes {
	font-size: $size-13;
	color: $color-g-44;
	padding-left: $size-20;

	.notes-label {
		font-weight: $fw-medium;
		color: $color-g-21;
		margin-right: $size-4;
	}

	&.no-notes {
		font-style: italic;
		color: $color-g-54;
	}
}

// Action Buttons
.appointment-actions {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: $size-16;
	padding-top: $size-8;

	@include responsive(phone) {
		flex-direction: column-reverse;

		& button {
			width: 100%;
		}
	}
}

.medical-records-modal {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: $size-32;
	background: $color-white;
	padding: $size-24;
	border-radius: $size-16;
	border: 1px solid #FEF0EC;
	box-shadow: 4px 4px 24px 0px rgba(0, 0, 0, 0.15), 8px 16px 16px 0px rgba(0, 0, 0, 0.10);
	width: 100%;
}
.medical-records-header {
	width: 100%;
	display: flex;
	justify-content: space-between;
	align-items: center;

	.medical-records-header__heading {
		color: $color-black;
		font-size: $size-18;
		font-weight: $fw-medium;
	}
}
.modal-container {
	max-width: 500px !important;
	min-height: 430px !important;
	max-height: 430px !important;

	@include responsive(phone) {
		width: 100% !important;
		// min-height: 410px !important;
	}
}
.medical-records-body {

	.medical-records-tabs-wrapper {
		white-space: nowrap !important;

		@include responsive(phone) {
			overflow-x: scroll;
			@include scrollBar(normal);
		}
	}
	.medical-records-tab {
		font-size: $size-14;
		color: $color-black;
	}
	.medical-records-general {
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: flex-start;
		padding: $size-32 $size-0;
		gap: $size-16;

		.medical-records-general__cards {
			display: flex;
			flex-direction: column;
			justify-content: space-between;
			align-items: flex-start;
			gap: $size-16;
			background: $color-g-97;
			padding: $size-16;
			border-radius: $size-8;

			.medical-records-general__cards--title {
				font-size: $size-12;
				color: $color-g-44;
				font-weight: $fw-regular;
			}
			.medical-records-general__cards--content {
				font-size: $size-18;
				color: $color-g-21;
				font-weight: $fw-medium;
			}
		}
		.medical-records-general__health-info {
			width: 100%;
			display: grid;
			grid-template-columns: repeat(2, 1fr);
			gap: $size-12;
		}
		.medical-records-general__risk-factors {
			width: 100%;
			display: flex;
			flex-direction: column;
			justify-content: flex-start;
			align-items: flex-start;
			gap: $size-16;

			.medical-records-risk-factors__header {
				width: 100%;
				font-size: $size-12;
				font-weight: $fw-regular;
				color: $color-g-21;
				border-bottom: 1px solid $color-g-90;
				padding-bottom: $size-8;
			}
			.medical-records-risk-factors__content {
				width: 100%;
				display: grid;
				grid-template-columns: repeat(2, 1fr);
				gap: $size-12;
			}
		}
	}
	.medical-records-diagnosis {
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: flex-start;
		padding: $size-32 $size-0;
		gap: $size-32;

		.diagnosis-tabs-wrapper {
			border-bottom: 0;
			width: 100%;

			&:hover, &:active, &:focus {
				border-bottom: 0 !important;
			}
		}
		:deep(.diagnosis-line-class) {
			display: none !important;

			&:hover, &:active, &:focus {
				display: none !important;
			}
		}
		:deep(.diagnosis-tab) {
			padding: $size-8 $size-20;
			border-radius: $size-10;
			color: $color-g-44;
			font-size: $size-16;
			font-weight: $fw-semi-bold;
			background: $color-g-92;
		}
		:deep(.diagnosis-tab-active) {
			border-bottom: 0 !important;
			&:hover { border-bottom: 0 !important; }
			&:focus { border-bottom: 0 !important; }
			&:active { border-bottom: 0 !important; }

			background: $color-sec-s2;
			padding: $size-8 $size-20;
			border-radius: $size-10;
			color: $color-white;
			font-size: $size-16;
			font-weight: $fw-semi-bold;
		}
		:deep(.default-tabs__item) {
			border-bottom: 0 !important;
			&:hover { border-bottom: 0 !important; }
			&:focus { border-bottom: 0 !important; }
			&:active { border-bottom: 0 !important; }
		}
		.diagnosis-result {
			display: flex;
			flex-direction: column;
			justify-content: flex-start;
			align-items: flex-start;
			gap: $size-32;

			.diagnosis-result__header {
				display: flex;
				flex-direction: column;
				justify-content: flex-start;
				align-items: flex-start;
				gap: $size-8;

				.diagnosis-result__header--heading {
					font-size: $size-16;
					color: $color-g-21;
					font-weight: $fw-semi-bold;
				}
				.diagnosis-result__header--description {
					font-size: $size-14;
					color: $color-g-54;
					font-weight: $fw-regular;
				}
			}
			.diagnosis-result__conditions {
				width: 100%;
				display: flex;
				flex-direction: column;
				justify-content: flex-start;
				align-items: flex-start;
				gap: $size-32;

				.diagnosis-result__conditions--major {
					width: 100%;
					display: flex;
					flex-direction: column;
					justify-content: flex-start;
					align-items: flex-start;
					gap: $size-16;
				}
				.diagnosis-conditions-card {
					width: 100%;
					display: flex;
					justify-content: space-between;
					align-items: center;
					padding: $size-16;
					border: 1px solid $color-pri-t5;
					border-radius: $size-12;

					.diagnosis-conditions-card__content {
						display: flex;
						flex-direction: column;
						justify-content: space-between;
						align-items: flex-start;
						gap: $size-4;

						.diagnosis-conditions-card__title {
							font-size: $size-14;
							font-weight: $fw-semi-bold;
							color: $color-black;
						}
						.diagnosis-conditions-card__desc {
							font-size: $size-12;
							font-weight: $fw-regular;
							color: $color-g-44;
						}
					}
					.dignosis-conditions-card__evidence-strong {
						width: 12px;
						height: 12px;
						border-radius: $size-12;
						background: #FB5A00;
					}
					.dignosis-conditions-card__evidence-moderate {
						width: 12px;
						height: 12px;
						border-radius: $size-12;
						background: #FBB500;
					}
					.dignosis-conditions-card__evidence-weak {
						width: 12px;
						height: 12px;
						border-radius: $size-12;
						background: #8A8A8A;
					}
				}
				.diagnosis-conditions-accordion {
					:deep(.accordion-item) {
						border: 0;
						.accordion-header {
							color: $color-sec-s2;
							fill: $color-sec-s2;
							stroke: $color-sec-s2;
						}
					}
					
				}
			}
		}
		.diagnosis-summary {
			width: 100%;
			display: flex;
			flex-direction: column;
			justify-content: flex-start;
			align-items: flex-start;
			gap: $size-16;

			.diagnosis-summary__item {
				width: 100%;
				display: flex;
				justify-content: space-between;
				align-items: center;

				.diagnosis-summary__item--key {
					color: $color-g-21;
					font-size: $size-14;
					font-weight: $fw-regular;
				}
				.diagnosis-summary__item--value {
					color: $color-g-21;
					font-size: $size-14;
					font-weight: $fw-medium;
				}
			}
		}
	}
	.medical-records-diagnosis__empty {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: $size-16;
		padding: $size-60;

		.medical-records-diagnosis__empty--title {
			font-size: $size-16;
			font-weight: $fw-medium;
			color: $color-black;
			text-align: center;
		}
		.medical-records-diagnosis__empty--desc {
			font-size: $size-14;
			font-weight: $fw-regular;
			color: $color-g-44;
			text-align: center;
		}

	}
	.medical-records-history {
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: flex-start;
		padding: $size-32 $size-0;
		gap: $size-16;

		.medical-records-history__item {
			width: 100%;
			display: flex;
			flex-direction: column;
			justify-content: flex-start;
			align-items: flex-start;
			gap: $size-8;
			border: 1px solid $color-pri-t5;
			border-radius: $size-8;
			padding: $size-10 $size-16;

			.medical-records-history__item--title {
				font-size: $size-14;
				color: $color-black;
				font-weight: $fw-semi-bold;
			}
			.medical-records-history__item--content {
				font-size: $size-12;
				font-weight: $fw-regular;
				color: $color-g-44;
			}
		}
	}
}

// Health Score Modal
.score-modal {
	min-width: 400px;
	max-width: 500px;

	@include responsive(phone) {
		min-width: auto;
		max-width: 100%;
	}

	&__header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: $size-24;

		h3 {
			font-size: $size-18;
			font-weight: $fw-semi-bold;
			color: $color-g-21;
			margin: 0;
		}
	}

	&__body {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $size-16;
	}

	&__circle {
		width: 120px;
		height: 120px;
		border-radius: 50%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%);
		color: white;

		.score-value {
			font-size: $size-36;
			font-weight: $fw-bold;
		}

		.score-max {
			font-size: $size-14;
			opacity: 0.8;
		}

		&.score-excellent {
			background: linear-gradient(135deg, #10b981 0%, #059669 100%);
		}

		&.score-good {
			background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%);
		}

		&.score-fair {
			background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
		}

		&.score-poor {
			background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
		}
	}

	&__status {
		font-size: $size-18;
		font-weight: $fw-semi-bold;
		padding: $size-6 $size-16;
		border-radius: $size-20;

		&.score-excellent {
			background: rgba(16, 185, 129, 0.1);
			color: #059669;
		}

		&.score-good {
			background: rgba(14, 174, 196, 0.1);
			color: #0891b2;
		}

		&.score-fair {
			background: rgba(245, 158, 11, 0.1);
			color: #d97706;
		}

		&.score-poor {
			background: rgba(239, 68, 68, 0.1);
			color: #dc2626;
		}
	}

	&__description {
		text-align: center;
		padding: $size-16;
		background: $color-g-97;
		border-radius: $size-12;

		p {
			font-size: $size-14;
			color: $color-g-44;
			line-height: 1.5;
			margin: 0;
		}
	}

	&__details {
		width: 100%;
		padding-top: $size-16;
		border-top: 1px solid $color-g-92;

		h4 {
			font-size: $size-14;
			font-weight: $fw-semi-bold;
			color: $color-g-21;
			margin: 0 0 $size-12 0;
		}

		.detail-item {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: $size-10 0;
			border-bottom: 1px solid $color-g-95;

			&:last-child {
				border-bottom: none;
			}

			.detail-label {
				font-size: $size-14;
				color: $color-g-44;
			}

			.detail-value {
				font-size: $size-14;
				font-weight: $fw-semi-bold;
				color: $color-g-21;
			}
		}
	}
}
</style>
