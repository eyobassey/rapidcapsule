<template>
	<div class="page-content">
		<top-bar type="title-only" title="Appointments / Summary" @open-side-nav="$emit('openSideNav')" />

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
							<span class="status-badge status-badge--completed">
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
					<div class="patient-card__actions">
						<button @click="isOpenMedicalRecords = true" class="view-records-btn">
							<v-icon name="hi-document-text" scale="0.7" />
							View Medical Records
						</button>
					</div>
				</div>

				<!-- Meeting Summary Card -->
				<div class="meeting-summary-card">
					<div class="meeting-summary-card__header">
						<h3 class="section-title">
							<v-icon name="hi-video-camera" scale="0.9" />
							Meeting Summary
						</h3>
						<span class="status-pill status-pill--completed">
							<v-icon name="hi-check" scale="0.6" />
							Completed
						</span>
					</div>
					<div class="meeting-summary-grid">
						<div class="summary-item">
							<span class="summary-icon">
								<v-icon name="hi-calendar" scale="0.8" />
							</span>
							<div class="summary-content">
								<span class="summary-label">Date</span>
								<span class="summary-value">{{ format(new Date(appointmentInfo.start_time), 'EEEE, MMMM dd, yyyy') }}</span>
							</div>
						</div>
						<div class="summary-item">
							<span class="summary-icon">
								<v-icon name="hi-clock" scale="0.8" />
							</span>
							<div class="summary-content">
								<span class="summary-label">Time</span>
								<span class="summary-value">
									{{ format(new Date(appointmentInfo.start_time), 'hh:mm a') }}
									<small>({{ preferences.timezone || 'Local' }})</small>
								</span>
							</div>
						</div>
						<div class="summary-item highlight">
							<span class="summary-icon">
								<v-icon name="fa-stopwatch" scale="0.8" />
							</span>
							<div class="summary-content">
								<span class="summary-label">Duration</span>
								<span class="summary-value">{{ meetingDuration }}</span>
							</div>
						</div>
						<div class="summary-item">
							<span class="summary-icon">
								<v-icon name="hi-video-camera" scale="0.8" />
							</span>
							<div class="summary-content">
								<span class="summary-label">Meeting Type</span>
								<span class="summary-value">{{ appointmentInfo.meeting_type || 'Video Call' }}</span>
							</div>
						</div>
						<div class="summary-item">
							<span class="summary-icon">
								<v-icon name="hi-tag" scale="0.8" />
							</span>
							<div class="summary-content">
								<span class="summary-label">Category</span>
								<span class="summary-value">{{ appointmentInfo.category || '-' }}</span>
							</div>
						</div>
						<div class="summary-item">
							<span class="summary-icon">
								<v-icon name="hi-clipboard-list" scale="0.8" />
							</span>
							<div class="summary-content">
								<span class="summary-label">Appointment Type</span>
								<span class="summary-value">{{ appointmentInfo.appointment_type || '-' }}</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Patient Rating Section -->
				<div v-if="appointmentInfo.rating?.score" class="patient-rating-card">
					<div class="patient-rating-card__header">
						<h3 class="section-title">
							<v-icon name="bi-star-fill" scale="0.9" />
							Patient Rating
						</h3>
					</div>
					<div class="patient-rating-content">
						<div class="patient-rating-stars">
							<v-icon
								v-for="star in 5"
								:key="star"
								:name="star <= appointmentInfo.rating.score ? 'bi-star-fill' : 'hi-star'"
								scale="1.2"
								:class="star <= appointmentInfo.rating.score ? 'star-filled' : 'star-empty'"
							/>
							<span class="rating-score-text">{{ appointmentInfo.rating.score }}/5</span>
						</div>
						<p v-if="appointmentInfo.rating.review" class="patient-rating-review">
							"{{ appointmentInfo.rating.review }}"
						</p>
						<span v-if="appointmentInfo.rating.rated_at" class="patient-rating-date">
							Rated on {{ format(new Date(appointmentInfo.rating.rated_at), 'MMM dd, yyyy') }}
						</span>
					</div>
				</div>

				<!-- Clinical Notes Section -->
				<div class="clinical-notes-card">
					<div class="clinical-notes-card__header">
						<h3 class="section-title">
							<v-icon name="hi-pencil-alt" scale="0.9" />
							Clinical Notes
						</h3>
						<button v-if="clinicalNotes.length > 0" @click="showAddNoteModal = true" class="add-note-btn">
							<v-icon name="hi-plus" scale="0.7" />
							Add Note
						</button>
					</div>

					<div v-if="clinicalNotes.length > 0" class="clinical-notes-list">
						<div v-for="(note, index) in clinicalNotes" :key="note.note_id || index" class="clinical-note-item">
							<div class="note-header">
								<span class="note-time">
									<v-icon name="hi-clock" scale="0.6" />
									{{ formatNoteTime(note.created_at) }}
								</span>
								<span v-if="note.completed" class="note-status note-status--completed">
									<v-icon name="hi-check" scale="0.5" />
									Completed
								</span>
								<span v-else class="note-status note-status--pending">
									Pending
								</span>
							</div>
							<p class="note-content">{{ note.content }}</p>
						</div>
					</div>
					<div v-else class="empty-section">
						<v-icon name="hi-pencil" scale="1.5" />
						<p>No clinical notes recorded for this appointment</p>
						<button @click="showAddNoteModal = true" class="empty-action-btn">
							<v-icon name="hi-plus" scale="0.7" />
							Add Clinical Note
						</button>
					</div>
				</div>

				<!-- Patient Notes Section -->
				<div v-if="appointmentInfo.patient_notes" class="patient-notes-card">
					<h3 class="section-title">
						<v-icon name="hi-chat-alt-2" scale="0.9" />
						Patient's Notes
					</h3>
					<div class="patient-notes-content">
						<p>{{ appointmentInfo.patient_notes }}</p>
					</div>
				</div>

				<!-- Private Notes Section (Specialist Only) -->
				<div class="private-notes-card">
					<div class="private-notes-card__header">
						<h3 class="section-title">
							<v-icon name="hi-lock-closed" scale="0.9" />
							Private Notes
							<span class="private-badge">Only visible to you</span>
						</h3>
						<button @click="toggleEditPrivateNotes" class="edit-notes-btn">
							<v-icon :name="isEditingPrivateNotes ? 'hi-x' : 'hi-pencil'" scale="0.7" />
							{{ isEditingPrivateNotes ? 'Cancel' : 'Edit' }}
						</button>
					</div>

					<div v-if="!isEditingPrivateNotes" class="private-notes-content">
						<p v-if="privateNotes">{{ privateNotes }}</p>
						<p v-else class="no-notes">No private notes added. Click Edit to add notes.</p>
					</div>
					<div v-else class="private-notes-edit">
						<rc-textarea
							v-model="privateNotesEdit"
							placeholder="Add private notes about this consultation..."
							class="private-notes-textarea"
						/>
						<div class="private-notes-actions">
							<rc-button
								type="primary"
								size="small"
								label="Save Notes"
								:loading="isSavingPrivateNotes"
								@click="savePrivateNotes"
							/>
						</div>
					</div>
				</div>

				<!-- Transcripts & Recordings Section -->
				<div class="media-section-card">
					<h3 class="section-title">
						<v-icon name="hi-film" scale="0.9" />
						Transcripts & Recordings
					</h3>

					<div class="media-grid">
						<!-- Recording -->
						<div class="media-item" :class="{ 'media-item--available': hasRecording }">
							<div class="media-icon">
								<v-icon name="hi-video-camera" scale="1" />
							</div>
							<div class="media-info">
								<span class="media-title">Meeting Recording</span>
								<span v-if="hasRecording" class="media-status media-status--available">
									Available
								</span>
								<span v-else class="media-status media-status--unavailable">
									Not available
								</span>
							</div>
							<button v-if="hasRecording" class="media-action-btn" @click="viewRecording">
								<v-icon name="hi-play" scale="0.7" />
								Play
							</button>
						</div>

						<!-- Transcript -->
						<div class="media-item" :class="{ 'media-item--available': hasTranscript }">
							<div class="media-icon">
								<v-icon name="hi-document-text" scale="1" />
							</div>
							<div class="media-info">
								<span class="media-title">Meeting Transcript</span>
								<span v-if="hasTranscript" class="media-status media-status--available">
									Available
								</span>
								<span v-else class="media-status media-status--unavailable">
									Not available
								</span>
							</div>
							<button v-if="hasTranscript" class="media-action-btn" @click="viewTranscript">
								<v-icon name="hi-eye" scale="0.7" />
								View
							</button>
						</div>
					</div>
				</div>

				<!-- Documents Section -->
				<div class="documents-section-card">
					<div class="documents-section-card__header">
						<h3 class="section-title">
							<v-icon name="hi-paper-clip" scale="0.9" />
							Shared Documents
						</h3>
						<button class="upload-btn" @click="showUploadModal = true">
							<v-icon name="hi-upload" scale="0.7" />
							Upload
						</button>
					</div>

					<div v-if="documents.length > 0" class="documents-list">
						<div v-for="(doc, idx) in documents" :key="idx" class="document-item">
							<div class="document-icon">
								<v-icon :name="getDocumentIcon(doc.type)" scale="0.9" />
							</div>
							<div class="document-info">
								<span class="document-name">{{ doc.name }}</span>
								<span class="document-meta">
									{{ doc.size }} • Shared by {{ doc.shared_by }}
								</span>
							</div>
							<button class="document-action-btn" @click="downloadDocument(doc)">
								<v-icon name="hi-download" scale="0.7" />
							</button>
						</div>
					</div>
					<div v-else class="empty-section empty-section--compact">
						<v-icon name="hi-folder-open" scale="1.2" />
						<p>No documents shared</p>
					</div>
				</div>

				<!-- Linked Prescriptions -->
				<div v-if="linkedPrescriptions.length" class="linked-prescriptions-card">
					<h3 class="section-title">
						<v-icon name="ri-capsule-line" scale="0.9" />
						Linked Prescriptions
					</h3>
					<div class="linked-prescriptions-list">
						<div
							v-for="rx in linkedPrescriptions"
							:key="rx._id"
							class="linked-rx-item"
							@click="router.push(`/app/specialist/pharmacy/prescriptions/${rx._id}`)"
						>
							<div class="linked-rx-item__info">
								<span class="linked-rx-item__number">{{ rx.prescription_number }}</span>
								<span class="linked-rx-item__status" :class="`rx-status--${rx.status?.toLowerCase()}`">
									{{ rx.status?.replace(/_/g, ' ') }}
								</span>
							</div>
							<v-icon name="hi-chevron-right" scale="0.7" class="linked-rx-item__arrow" />
						</div>
					</div>
				</div>

				<!-- Action Buttons -->
				<div class="appointment-actions">
					<rc-button
						type="primary"
						label="Schedule Follow-up"
						class="action-btn action-btn--primary"
						@click="scheduleFollowUp"
					/>
					<rc-button
						type="tertiary"
						label="Create Prescription"
						class="action-btn"
						@click="createLinkedPrescription"
					/>
					<rc-button
						type="tertiary"
						label="Refer Patient"
						class="action-btn"
						@click="isOpenRecommendation = true"
					/>
				</div>
			</div>

			<!-- Medical Records Modal (Large Screens) -->
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
											Please note that the list below is a collection of possible
											conditions arranged according to level of severity based on
											the answers the patient provided.
										</p>
									</div>
									<div class="diagnosis-result__conditions">
										<div class="diagnosis-result__conditions--major">
											<template v-for="condition in moreLikelyConditions" :key="JSON.stringify(condition)">
												<div class="diagnosis-conditions-card">
													<div class="diagnosis-conditions-card__content">
														<p class="diagnosis-conditions-card__title">{{ condition.common_name }}</p>
														<p class="diagnosis-conditions-card__desc">{{ getEvidenceLabel(condition.category) }}</p>
													</div>
													<div :class="getEvidenceClass(condition.category)"></div>
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
															<p class="diagnosis-conditions-card__desc">{{ getEvidenceLabel(item.category) }}</p>
														</div>
														<div :class="getEvidenceClass(item.category)"></div>
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
										<p class="diagnosis-summary__item--value">-</p>
									</div>
								</div>
							</template>
						</div>
						<div v-else class="medical-records-diagnosis__empty">
							<h3 class="medical-records-diagnosis__empty--title">No report found</h3>
							<p class="medical-records-diagnosis__empty--desc">
								A self diagnosis test wasn't taken before this appointment was booked.
							</p>
						</div>
					</template>
					<template v-if="currentTab === 'history'">
						<div v-if="patientInfo.medicalHistory?.length" class="medical-records-history">
							<template v-for="history in patientInfo.medicalHistory" :key="history._id">
								<div class="medical-records-history__item">
									<p class="medical-records-history__item--title">{{ history.name }}</p>
									<p class="medical-records-history__item--content">
										Diagnosed: {{ format(new Date(history.start_date), 'dd/MM/yyyy') }}
									</p>
									<p class="medical-records-history__item--content">
										Treatment Status: {{ history.is_condition_exists ? 'Active': 'Inactive' }}
									</p>
								</div>
							</template>
						</div>
						<div v-else class="medical-records-diagnosis__empty">
							<h3 class="medical-records-diagnosis__empty--title">No record found</h3>
							<p class="medical-records-diagnosis__empty--desc">No medical history recorded.</p>
						</div>
					</template>
				</div>
			</div>

			<!-- Referral Modal -->
			<rc-modal
				v-if="isOpenRecommendation"
				:title="recommendDialog === 1 ? 'Select Specialist' : 'Referral Note'"
				:has-footer="true"
				@closeModal="onCloseRecommendation"
			>
				<template v-slot:body>
					<div v-if="recommendDialog === 1" class="select-specialist">
						<div class="select-specialist__header">
							<rc-text
								label="Search by name or specialty"
								class="select-specialist__search"
								v-model="searchQuery"
							>
								<rc-icon
									icon-name="icon-search"
									size="s"
									class="select-specialist__search--icon"
								/>
							</rc-text>
							<p class="select-specialist__description">
								Please select at least one specialist and choose one out
								of your selection that you highly recommend to the patient
							</p>
						</div>
						<div v-if="isFetchingRecommendations" class="loader-recommended">
							<loader :useOverlay="false" style="position:relative" />
						</div>
						<div v-else class="select-specialist__body">
							<template v-for="(item, index) in recommendationOptions" :key="item">
								<div class="select-specialist__body--items">
									<div class="select-specialist__body--container">
										<rc-checkbox v-model="item.selected" />
										<div class="select-specialist__body--details">
											<div class="select-specialist__body--avatar">
												<rc-avatar :first-name="item.profile.first_name" :last-name="item.profile.last_name" size="sm" />
											</div>
											<div class="select-specialist__body--info">
												<div class="select-specialist__info--details">
													<h2 class="select-specialist__details--name">{{ item.full_name }}</h2>
													<div class="select-specialist__details--ratings" v-if="item.average_rating > -1">
														<span class="select-specialist__info--texts">{{ item.average_rating?.toFixed(1) }}</span>
														<rc-icon icon-name="icon-star-rating" size="xms" />
													</div>
												</div>
												<p class="select-specialist__info--texts">
													{{ item.professional_practice?.area_of_specialty }}
												</p>
												<div v-if="item.professional_practice?.years_of_practice">
													<p class="select-specialist__info--texts">
														{{ item.professional_practice?.years_of_practice }} Years Experience
													</p>
												</div>
											</div>
										</div>
									</div>
									<rc-button
										type="secondary"
										size="small"
										label="Recommend"
										:disabled="!item.selected"
										:class="{'select-specialist__body--actions': !item.most_recommended}"
										@click="onSelectRecommendation(index)"
									/>
								</div>
							</template>
						</div>
					</div>
					<div class="referer-specialist" v-if="recommendDialog === 2">
						<rc-textarea
							placeholder="Referer Note"
							class="referer-specialist__note"
							v-model="recommendationNote"
						/>
					</div>
				</template>
				<template v-slot:foot>
					<rc-button
						class="submit-recommendation-btn"
						type="primary"
						:label="recommendDialog === 1 ? 'Next' : 'Send'"
						:disabled="isDisabledRecommended || isLoadingRecommended"
						:loading="isLoadingRecommended"
						@click="onSubmitRecommendation(appointmentInfo)"
					/>
				</template>
			</rc-modal>

			<!-- Prescription Modal -->
			<rc-modal
				:has-footer="true"
				v-if="isOpenPrescription"
				:title="prescriptionDialog === 1 ? 'Send Prescription' : 'Add Prescription'"
				@closeModal="() => {prescriptionDialog = 1, isOpenPrescription = false}"
				class="prescription-modal"
			>
				<template v-slot:body>
					<loader
						v-if="isLoadingPrescription"
						:useOverlay="false"
						style="position:relative;margin-top:30%;"
					/>
					<template v-else>
						<div v-if="prescriptionDialog === 1" class="prescription-container">
							<rc-button
								v-if="!prescriptionOptions.length"
								@click="prescription = { ...initialState }, prescriptionDialog = 2"
								label="Add Prescription"
								iconName="plus"
								type="text-secondary"
								size="medium"
								:iconLeft="true"
							/>
							<div v-else class="prescription-content">
								<rc-button
									v-if="prescriptionOptions.length"
									@click="prescription = { ...initialState }, prescriptionDialog = 2"
									label="Add Prescription"
									iconName="plus"
									type="text-secondary"
									size="medium"
									:iconLeft="true"
								/>
								<div class="prescription-content-items">
									<template v-for="(item, i) in prescriptionOptions" :key="prescription.id">
										<div class="prescription-content-items__item">
											<div class="prescription-content__content">
												<p class="prescription-content__content--title">{{ item.drug }}</p>
												<p class="prescription-content__content--dose">
													Dose: {{ item.dose.quantity }} {{ item.dose.dosage_form }}
												</p>
												<p class="prescription-content__content--interval">
													Interval: {{ item.interval.time }} {{ item.interval.unit }}
												</p>
												<p v-if="item.refill_info?.dose?.quantity" class="prescription-content__content--interval">
													Refill: {{ item.refill_info.dose.quantity }} {{ item.refill_info.dose.dosage_form }}
													{{ item.refill_info.interval.time }} {{ item.refill_info.interval.unit }}
												</p>
											</div>
											<div class="prescription-content__actions">
												<icon-button
													icon="icon-edit"
													size="md"
													:sx="{ background: '#FFF' }"
													@click="(prescription = item, prescriptionDialog = 2)"
												/>
												<icon-button
													icon="icon-delete"
													size="md"
													:sx="{ background: '#FFF' }"
													@click="prescriptionOptions.splice(i, 1)"
												/>
											</div>
										</div>
									</template>
								</div>
							</div>
						</div>
					</template>
					<div v-if="prescriptionDialog === 2" class="new-prescription-container">
						<rc-text
							required
							label="Drug name"
							class="new-prescription-title"
							v-model="prescription.drug"
						/>
						<div class="new-prescription-dosage">
							<p class="new-prescription-dosage__title">Dosage</p>
							<div class="new-prescription-dosage__content">
								<div class="new-prescription-dosage__comboboxes">
									<rc-combobox
										required
										name="Dose"
										:options="['Tablets', 'Caplets']"
										placeholder="Dose"
										v-model:input="prescription.dose.quantity"
										v-model:select="prescription.dose.dosage_form"
									/>
									<rc-combobox
										required
										name="Intervals"
										:options="['Hours', 'Days']"
										placeholder="Intervals"
										v-model:input="prescription.interval.time"
										v-model:select="prescription.interval.unit"
									/>
									<rc-combobox
										required
										name="Periods"
										:options="['Days', 'Weeks', 'Months']"
										placeholder="Periods"
										v-model:input="prescription.period.number"
										v-model:select="prescription.period.unit"
									/>
								</div>
								<rc-textarea
									required
									placeholder="Other instructions or directions"
									v-model="prescription.notes"
								/>
							</div>
						</div>
						<div class="new-prescription-dosage__checkbox">
							<rc-checkbox v-model="prescription.require_refill" class="new-prescription-dosage__checkbox--checkbox" />
							<p class="new-prescription-dosage__label">Requires refill</p>
						</div>
						<div v-if="prescription.require_refill" class="new-prescription-dosage__refill">
							<p class="new-prescription-dosage__refill--title">Refill Instructions</p>
							<div class="new-prescription-dosage__refill--comboboxes">
								<rc-combobox
									name="Quantity"
									:options="['Tablets', 'Caplets']"
									placeholder="Quantity"
									v-model:input="prescription.refill_info.dose.quantity"
									v-model:select="prescription.refill_info.dose.dosage_form"
								/>
								<rc-combobox
									:options="['Days', 'Weeks', 'Months']"
									placeholder="Interval"
									name="QuantityInterval"
									v-model:input="prescription.refill_info.interval.time"
									v-model:select="prescription.refill_info.interval.unit"
								/>
							</div>
						</div>
					</div>
				</template>
				<template v-slot:foot>
					<rc-button
						type="primary"
						:label="prescriptionDialog === 1 ? 'Send' : 'Save'"
						@click="onSubmitPrescription(prescription)"
						:disabled="!isDisabledPrescription || isLoadingPrescription"
						:loading="isLoadingPrescription"
						class="prescription-action-button"
					/>
				</template>
			</rc-modal>

			<!-- Medical Records Modal (Regular Screens) -->
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
								<!-- Same content as large screen version -->
							</div>
							<div v-else class="medical-records-diagnosis__empty">
								<h3 class="medical-records-diagnosis__empty--title">No report found</h3>
								<p class="medical-records-diagnosis__empty--desc">A self diagnosis test wasn't taken before this appointment.</p>
							</div>
						</template>
						<template v-if="currentTab === 'history'">
							<div v-if="patientInfo.medicalHistory?.length" class="medical-records-history">
								<template v-for="history in patientInfo.medicalHistory" :key="history._id">
									<div class="medical-records-history__item">
										<p class="medical-records-history__item--title">{{ history.name }}</p>
										<p class="medical-records-history__item--content">Diagnosed: {{ format(new Date(history.start_date), 'dd/MM/yyyy') }}</p>
										<p class="medical-records-history__item--content">Treatment Status: {{ history.is_condition_exists ? 'Active': 'Inactive' }}</p>
									</div>
								</template>
							</div>
							<div v-else class="medical-records-diagnosis__empty">
								<h3 class="medical-records-diagnosis__empty--title">No record found</h3>
								<p class="medical-records-diagnosis__empty--desc">No medical history recorded.</p>
							</div>
						</template>
					</div>
				</template>
			</rc-modal>

			<reschedule-appointment ref="rescheduleAppointmentRef" />

			<!-- Add Clinical Note Modal -->
			<rc-modal
				v-if="showAddNoteModal"
				title="Add Clinical Note"
				:has-footer="true"
				@closeModal="showAddNoteModal = false"
			>
				<template v-slot:body>
					<div class="add-note-form">
						<rc-textarea
							v-model="newNoteContent"
							placeholder="Enter your clinical note..."
							class="add-note-textarea"
						/>
						<div class="add-note-options">
							<label class="note-checkbox-label">
								<rc-checkbox v-model="newNoteCompleted" />
								<span>Mark as completed</span>
							</label>
						</div>
					</div>
				</template>
				<template v-slot:foot>
					<rc-button
						type="primary"
						label="Save Note"
						:loading="isSavingNote"
						:disabled="!newNoteContent.trim()"
						@click="saveNewNote"
					/>
				</template>
			</rc-modal>

			<!-- Upload Document Modal -->
			<rc-modal
				v-if="showUploadModal"
				title="Upload Document"
				:has-footer="true"
				@closeModal="closeUploadModal"
			>
				<template v-slot:body>
					<div class="upload-form">
						<div
							class="upload-dropzone"
							@click="triggerFileInput"
							@dragover.prevent="isDragging = true"
							@dragleave.prevent="isDragging = false"
							@drop.prevent="handleFileDrop"
							:class="{ 'upload-dropzone--active': isDragging }"
						>
							<input
								ref="fileInputRef"
								type="file"
								accept="image/*,.pdf,.doc,.docx"
								style="display: none"
								@change="handleFileSelect"
							/>
							<v-icon name="hi-upload" scale="1.5" />
							<p class="upload-dropzone__text">
								Click or drag file to upload
							</p>
							<p class="upload-dropzone__hint">
								Images, PDF, or documents (max 10MB)
							</p>
						</div>
						<div v-if="selectedFile" class="selected-file">
							<div class="selected-file__info">
								<v-icon :name="getDocumentIcon(selectedFile.type)" scale="0.9" />
								<div class="selected-file__details">
									<span class="selected-file__name">{{ selectedFile.name }}</span>
									<span class="selected-file__size">{{ formatFileSize(selectedFile.size) }}</span>
								</div>
							</div>
							<button class="selected-file__remove" @click="selectedFile = null">
								<v-icon name="hi-x" scale="0.7" />
							</button>
						</div>
						<div v-if="filePreviewUrl" class="file-preview">
							<img v-if="selectedFile?.type?.startsWith('image/')" :src="filePreviewUrl" alt="Preview" class="file-preview__image" />
							<div v-else class="file-preview__doc">
								<v-icon name="hi-document-text" scale="2" />
								<span>{{ selectedFile?.name }}</span>
							</div>
						</div>
					</div>
				</template>
				<template v-slot:foot>
					<rc-button
						type="primary"
						label="Upload"
						:loading="isUploading"
						:disabled="!selectedFile"
						@click="uploadDocument"
					/>
				</template>
			</rc-modal>
		</div>
	</div>
</template>

<script setup>
import { format, formatDistanceToNow } from "date-fns";
import { useRoute, useRouter } from 'vue-router';
import { ref, inject, onMounted, watchEffect, computed } from 'vue';
import { useToast } from 'vue-toast-notification';
import RcIcon from "@/components/RCIcon";
import RcCheckbox from "@/components/inputs/check-box";
import RcTextarea from "@/components/inputs/textarea";
import TopBar from "@/components/Navigation/top-bar";
import RcAvatar from "@/components/RCAvatar";
import IconButton from "@/components/RCIconButton";
import RcTab from "@/components/RCTab";
import RcCombobox from "@/components/RCComboBox";
import RcText from "@/components/inputs/text";
import RcAccordion from "@/components/RCAccordion";
import RcButton from "@/components/buttons/button-primary";
import RcModal from "@/components/modals/dialog-modal";
import Loader from "@/components/Loader/main-loader";
import RescheduleAppointment from "./RescheduleAppointment";
import { calculateAge } from "@/utilities/utilityFunctions";

const $toast = useToast();
const route = useRoute();
const router = useRouter();
const $http = inject('$_HTTP');
defineEmits(["openSideNav"]);

const initialState = {
	drug: '',
	notes: '',
	require_refill: false,
	dose: { quantity: '' , dosage_form: 'Tablets' },
	interval: { time: '', unit: 'Hours' },
	period: { number: '', unit: 'Days' },
	refill_info: {
		dose: { quantity: '', dosage_form: 'Tablets' },
		interval: { time: '', unit: 'Days' }
	}
};

const currentTab = ref("general");
const diagnosisTab = ref("result");
const appointmentInfo = ref({});
const patientInfo = ref({});
const patientVitals = ref({});
const preferences = ref({});
const isLoading = ref(true);
const isOpenMedicalRecords = ref(false);
const rescheduleAppointmentRef = ref();

// Clinical Notes
const clinicalNotes = ref([]);
const showAddNoteModal = ref(false);
const newNoteContent = ref('');
const newNoteCompleted = ref(false);
const isSavingNote = ref(false);

// Private Notes
const privateNotes = ref('');
const privateNotesEdit = ref('');
const isEditingPrivateNotes = ref(false);
const isSavingPrivateNotes = ref(false);

// Media
const hasRecording = ref(false);
const hasTranscript = ref(false);
const documents = ref([]);
const showUploadModal = ref(false);
const selectedFile = ref(null);
const filePreviewUrl = ref(null);
const isUploading = ref(false);
const isDragging = ref(false);
const fileInputRef = ref(null);

// Linked Prescriptions
const linkedPrescriptions = ref([]);

// Prescription
const isOpenPrescription = ref(false);
const isLoadingPrescription = ref(true);
const isDisabledPrescription = ref(true);
const prescriptionDialog = ref(1);
const prescriptionOptions = ref([]);
const prescription = ref({ ...initialState });

// Referral
const isFetchingRecommendations = ref(false);
const isOpenRecommendation = ref(false);
const isDisabledRecommended = ref(true);
const isLoadingRecommended = ref(false);
const recommendationOptions = ref([]);
const queryTimeout = ref('');
const recommendDialog = ref(1);
const recommendationNote = ref('');
const recommendations = ref([]);
const searchQuery = ref('');

// Diagnosis
const sortedConditions = ref([]);
const moreLikelyConditions = ref([]);
const lessLikelyConditions = ref([]);
const conditions = ref([]);
const consideredDiagnosis = ref([]);
const hasDiagnosis = ref(false);

// Computed: Meeting Duration
const meetingDuration = computed(() => {
	const duration = appointmentInfo.value.call_duration;
	if (duration?.formatted_string) {
		return duration.formatted_string;
	}
	if (duration?.time_taken) {
		return `${duration.time_taken} ${duration.unit || 'Minutes'}`;
	}
	if (appointmentInfo.value.duration_minutes) {
		return `${appointmentInfo.value.duration_minutes} Minutes`;
	}
	return '-';
});

onMounted(async () => {
	isLoading.value = true;
	await getOneAppointment(route.params.id);
	isLoading.value = false;
});

watchEffect(() => {
	if (prescriptionDialog.value === 2) {
		if (prescription.value.require_refill) {
			isDisabledPrescription.value = (
				!!prescription.value.drug &&
				Object.values(prescription.value.dose)?.every(i => i) &&
				Object.values(prescription.value.interval)?.every(i => i) &&
				Object.values(prescription.value.period)?.every(i => i) &&
				Object.values(prescription.value.refill_info.dose)?.every(i => i) &&
				Object.values(prescription.value.refill_info.interval)?.every(i => i)
			);
		} else {
			isDisabledPrescription.value = (
				!!prescription.value.drug &&
				Object.values(prescription.value.dose)?.every(i => i) &&
				Object.values(prescription.value.interval)?.every(i => i) &&
				Object.values(prescription.value.period)?.every(i => i)
			);
		}
	} else if (prescriptionDialog.value === 1) {
		isDisabledPrescription.value = !!prescriptionOptions.value.length;
	}
});

watchEffect(() => {
	const isSelected = recommendationOptions.value?.some(i => i.selected);
	const hasNotes = recommendationNote.value.length;
	if (isSelected && recommendDialog.value === 1) {
		isDisabledRecommended.value = false;
	} else if (hasNotes && recommendDialog.value === 2) {
		isDisabledRecommended.value = false;
	} else isDisabledRecommended.value = true;
});

watchEffect(() => {
	const queryParams = { filterBy: 'Specialist', search: searchQuery.value };
	clearTimeout(queryTimeout.value);
	queryTimeout.value = setTimeout(async () => {
		isFetchingRecommendations.value = true;
		await $http.$_getUsers(queryParams).then(({ data }) => {
			recommendationOptions.value = data.data.docs;
			isFetchingRecommendations.value = false;
		});
	}, 1000);
});

async function getOneAppointment(appointmentId) {
	await $http.$_getOnetAppointments(appointmentId).then(async ({ data }) => {
		appointmentInfo.value = data.data;

		// Extract clinical notes
		clinicalNotes.value = data.data.clinical_notes || [];

		// Extract private notes
		privateNotes.value = data.data.private_notes || '';
		privateNotesEdit.value = privateNotes.value;

		// Check for recordings and transcripts (placeholder - implement when available)
		hasRecording.value = !!data.data.recording_url;
		hasTranscript.value = !!data.data.transcript_url;

		await getOneUserInfo(data.data.patient);
		await getTimeAvailability(data.data.patient);
		getUserVitals(data.data.patient);
		getHealthCheckupResult(data.data.patient);
		fetchLinkedPrescriptions(appointmentId);
		fetchDocuments(appointmentId);
	});
}

async function fetchLinkedPrescriptions(appointmentId) {
	try {
		const response = await $http.$_getPrescriptionsForAppointment(appointmentId);
		const result = response.data?.data || response.data?.result;
		if (result) {
			linkedPrescriptions.value = result;
		}
	} catch (error) {
		console.error('Error fetching linked prescriptions:', error);
	}
}

async function fetchDocuments(appointmentId) {
	try {
		const response = await $http.$_getAppointmentDocuments(appointmentId);
		const result = response.data?.data || response.data?.result;
		if (Array.isArray(result)) {
			documents.value = result;
		}
	} catch (error) {
		console.error('Error fetching documents:', error);
	}
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
};

const getHealthCheckupResult = async (patientId) => {
	await $http.$_getHealthCheckupResult(patientId).then(({ data }) => {
		if (Array.isArray(data.data) && data.data.length) {
			hasDiagnosis.value = true;
			consideredDiagnosis.value = data.data[data.data.length - 1]['request']['evidence'];
			conditions.value = data.data[data.data.length - 1]['response']['data']['conditions'];
			const sorted = conditions.value?.sort((a, b) => b.probability - a.probability);
			moreLikelyConditions.value = [];
			lessLikelyConditions.value = [];
			sorted?.map((condition, i) => ({
				...condition, category: Math.floor(i / (sorted.length / 3))
			})).forEach((condition) => {
				if (condition.category <= 1) moreLikelyConditions.value.push(condition);
				else if (condition.category > 1) lessLikelyConditions.value.push(condition);
			});
		}
	}).catch(() => {});
};

// Format note time
const formatNoteTime = (dateString) => {
	if (!dateString) return '';
	try {
		const date = new Date(dateString);
		return `${format(date, 'MMM dd, yyyy')} at ${format(date, 'hh:mm a')}`;
	} catch {
		return '';
	}
};

// Evidence helpers
const getEvidenceLabel = (category) => {
	if (category === 0) return 'Strong evidence';
	if (category === 1) return 'Moderate evidence';
	return 'Weak evidence';
};

const getEvidenceClass = (category) => {
	if (category === 0) return 'dignosis-conditions-card__evidence-strong';
	if (category === 1) return 'dignosis-conditions-card__evidence-moderate';
	return 'dignosis-conditions-card__evidence-weak';
};

// Private notes actions
const toggleEditPrivateNotes = () => {
	if (isEditingPrivateNotes.value) {
		privateNotesEdit.value = privateNotes.value;
	}
	isEditingPrivateNotes.value = !isEditingPrivateNotes.value;
};

const savePrivateNotes = async () => {
	isSavingPrivateNotes.value = true;
	try {
		await $http.$_updateAppointmentPrivateNotes(route.params.id, {
			private_notes: privateNotesEdit.value
		});
		privateNotes.value = privateNotesEdit.value;
		isEditingPrivateNotes.value = false;
		$toast.success('Private notes saved successfully');
	} catch (error) {
		$toast.error('Failed to save notes. Please try again.');
	} finally {
		isSavingPrivateNotes.value = false;
	}
};

// Media actions
const viewRecording = () => {
	// TODO: Implement when recording feature is available
	$toast.info('Recording playback coming soon');
};

const viewTranscript = () => {
	// TODO: Implement when transcript feature is available
	$toast.info('Transcript viewer coming soon');
};

// Document helpers
const getDocumentIcon = (type) => {
	if (!type) return 'hi-paper-clip';
	if (type.startsWith('image/') || type === 'image') return 'hi-photograph';
	if (type.includes('pdf') || type === 'pdf') return 'hi-document';
	if (type.includes('doc') || type === 'doc') return 'hi-document-text';
	return 'hi-paper-clip';
};

const downloadDocument = (doc) => {
	if (doc.url) {
		window.open(doc.url, '_blank');
	}
};

// Clinical note creation
const saveNewNote = async () => {
	if (!newNoteContent.value.trim()) return;
	isSavingNote.value = true;
	try {
		const response = await $http.$_createClinicalNote({
			appointmentId: route.params.id,
			content: newNoteContent.value,
			completed: newNoteCompleted.value,
		});
		const noteResult = response.data?.data || response.data?.result;
		if (noteResult) {
			clinicalNotes.value.push(noteResult);
		}
		newNoteContent.value = '';
		newNoteCompleted.value = false;
		showAddNoteModal.value = false;
		$toast.success('Clinical note added successfully');
	} catch (error) {
		$toast.error('Failed to add clinical note. Please try again.');
	} finally {
		isSavingNote.value = false;
	}
};

// Document upload functions
const triggerFileInput = () => {
	fileInputRef.value?.click();
};

const handleFileSelect = (event) => {
	const file = event.target.files[0];
	if (file) processFile(file);
};

const handleFileDrop = (event) => {
	isDragging.value = false;
	const file = event.dataTransfer.files[0];
	if (file) processFile(file);
};

const processFile = (file) => {
	if (file.size > 10 * 1024 * 1024) {
		$toast.error('File size must be less than 10MB');
		return;
	}
	selectedFile.value = file;
	if (file.type.startsWith('image/')) {
		const reader = new FileReader();
		reader.onload = (e) => { filePreviewUrl.value = e.target.result; };
		reader.readAsDataURL(file);
	} else {
		filePreviewUrl.value = null;
	}
};

const formatFileSize = (bytes) => {
	if (bytes < 1024) return bytes + ' B';
	if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
	return (bytes / 1048576).toFixed(1) + ' MB';
};

const uploadDocument = async () => {
	if (!selectedFile.value) return;
	isUploading.value = true;
	try {
		const formData = new FormData();
		formData.append('file', selectedFile.value);
		const response = await $http.$_uploadAppointmentDocument(route.params.id, formData);
		const doc = response.data?.data || response.data?.result;
		if (doc) {
			documents.value.push(doc);
		}
		closeUploadModal();
		$toast.success('Document uploaded successfully');
	} catch (error) {
		$toast.error('Failed to upload document. Please try again.');
	} finally {
		isUploading.value = false;
	}
};

const closeUploadModal = () => {
	showUploadModal.value = false;
	selectedFile.value = null;
	filePreviewUrl.value = null;
};

// Schedule follow-up
const scheduleFollowUp = () => {
	router.push({
		name: 'SpecialistBookAppointment',
		query: {
			patient_id: patientInfo.value._id || appointmentInfo.value.patient,
			follow_up: true,
			previous_appointment: route.params.id
		}
	});
};

const createLinkedPrescription = () => {
	const patientId = patientInfo.value._id || appointmentInfo.value.patient;
	router.push({
		path: '/app/specialist/pharmacy/prescriptions/create',
		query: {
			patient: patientId,
			linkAppointment: route.params.id,
		}
	});
};

// Referral actions
const onSelectRecommendation = (i) => {
	recommendationOptions.value = recommendationOptions.value?.map(
		item => ({ ...item, most_recommended: false })
	);
	recommendationOptions.value[i]['most_recommended'] = true;
};

const onCloseRecommendation = () => {
	recommendDialog.value = 1;
	recommendationNote.value = '';
	recommendationOptions.value = [];
	isOpenRecommendation.value = false;
	isLoadingRecommended.value = false;
	isFetchingRecommendations.value = false;
	isDisabledRecommended.value = true;
};

const onSubmitRecommendation = async (appointmentInfo) => {
	if (recommendDialog.value === 1) {
		return recommendDialog.value = 2;
	}

	const payload = {
		patient: appointmentInfo?.patient?.id || appointmentInfo?.patient,
		appointment: appointmentInfo?._id,
		referral_note: recommendationNote.value,
		specialists: recommendations.value,
	};

	isLoadingRecommended.value = true;
	await $http.$_specialistRecommendation(payload).then(() => {
		$toast.success('Referral Posted Successfully!');
		onCloseRecommendation();
	}).catch((error) => {
		isLoadingRecommended.value = false;
		$toast.error(error || 'Something went wrong, Please try again');
	});
};

// Prescription actions
const onSubmitPrescription = async (item) => {
	if (prescriptionDialog.value === 2) {
		if (item.id) {
			const foundIndex = prescriptionOptions.value.findIndex(i => i.id === item.id);
			if (foundIndex !== -1) prescriptionOptions.value[foundIndex] = item;
		} else prescriptionOptions.value.push({ ...item, id: new Date().getTime() });

		prescription.value = { ...initialState };
		prescriptionDialog.value = 1;
	} else if (prescriptionDialog.value === 1) {
		isLoadingPrescription.value = true;

		const payload = {
			patient: patientInfo.value._id || patientInfo.value.id,
			items: prescriptionOptions.value
		};
		await $http.$_submitPrescription(payload).then(() => {
			$toast.success('Prescription sent Successfully!');
			prescription.value = { ...initialState };
			isLoadingPrescription.value = false;
			isOpenPrescription.value = false;
		}).catch((error) => {
			$toast.error(error || 'Something went wrong, Please try again');
			isLoadingPrescription.value = false;
		});
	}
};

const getUserPrescriptions = async () => {
	await $http.$_getUserPrescriptions().then(() => {
		isLoadingPrescription.value = false;
	}).catch(() => {
		isLoadingPrescription.value = false;
	});
};
getUserPrescriptions();
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

// Section Title
.section-title {
	display: flex;
	align-items: center;
	gap: $size-8;
	font-size: $size-16;
	font-weight: $fw-semi-bold;
	color: $color-g-21;
	margin: 0;

	svg {
		color: #0EAEC4;
	}
}

// Patient Card
.patient-card {
	background: white;
	border-radius: $size-16;
	padding: $size-24;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
	border-left: 4px solid #10b981;

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
		padding: $size-16 0;
		border-top: 1px solid $color-g-92;
		border-bottom: 1px solid $color-g-92;

		@include responsive(phone) {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	&__actions {
		padding-top: $size-16;
	}
}

.patient-avatar-wrapper {
	position: relative;

	.status-badge {
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

		&--completed {
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

.view-records-btn {
	display: flex;
	align-items: center;
	gap: $size-6;
	padding: $size-10 $size-16;
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

// Meeting Summary Card
.meeting-summary-card {
	background: white;
	border-radius: $size-16;
	padding: $size-24;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

	&__header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: $size-20;
	}
}

.status-pill {
	display: flex;
	align-items: center;
	gap: $size-4;
	padding: $size-6 $size-12;
	border-radius: $size-20;
	font-size: $size-12;
	font-weight: $fw-medium;

	&--completed {
		background: rgba(16, 185, 129, 0.1);
		color: #059669;
	}
}

.meeting-summary-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: $size-16;

	@include responsive(phone) {
		grid-template-columns: 1fr;
	}
}

.summary-item {
	display: flex;
	align-items: flex-start;
	gap: $size-12;

	&.highlight {
		background: rgba(14, 174, 196, 0.05);
		padding: $size-12;
		border-radius: $size-10;
		border: 1px solid rgba(14, 174, 196, 0.2);
	}

	.summary-icon {
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

	.summary-content {
		display: flex;
		flex-direction: column;
		gap: $size-2;
	}

	.summary-label {
		font-size: $size-12;
		color: $color-g-44;
	}

	.summary-value {
		font-size: $size-14;
		font-weight: $fw-medium;
		color: $color-g-21;

		small {
			font-weight: $fw-regular;
			color: $color-g-54;
		}
	}
}

// Clinical Notes Card
.clinical-notes-card {
	background: white;
	border-radius: $size-16;
	padding: $size-24;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

	&__header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: $size-20;
	}
}

.add-note-btn, .edit-notes-btn, .upload-btn {
	display: flex;
	align-items: center;
	gap: $size-4;
	padding: $size-8 $size-12;
	background: rgba(14, 174, 196, 0.1);
	border: none;
	border-radius: $size-6;
	color: #0EAEC4;
	font-size: $size-13;
	font-weight: $fw-medium;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: rgba(14, 174, 196, 0.2);
	}
}

.clinical-notes-list {
	display: flex;
	flex-direction: column;
	gap: $size-12;
}

.clinical-note-item {
	padding: $size-16;
	background: $color-g-97;
	border-radius: $size-12;
	border-left: 3px solid #0EAEC4;

	.note-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: $size-10;
	}

	.note-time {
		display: flex;
		align-items: center;
		gap: $size-4;
		font-size: $size-12;
		color: $color-g-44;

		svg {
			color: #0EAEC4;
		}
	}

	.note-status {
		display: flex;
		align-items: center;
		gap: $size-4;
		padding: $size-2 $size-8;
		border-radius: $size-4;
		font-size: $size-11;
		font-weight: $fw-medium;

		&--completed {
			background: rgba(16, 185, 129, 0.1);
			color: #059669;
		}

		&--pending {
			background: rgba(245, 158, 11, 0.1);
			color: #d97706;
		}
	}

	.note-content {
		font-size: $size-14;
		color: $color-g-21;
		line-height: 1.6;
		margin: 0;
	}
}

// Empty Section
.empty-section {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: $size-32;
	background: $color-g-97;
	border-radius: $size-12;
	color: $color-g-54;

	svg {
		margin-bottom: $size-12;
		opacity: 0.5;
	}

	p {
		margin: 0 0 $size-16 0;
		font-size: $size-14;
		text-align: center;
	}

	&--compact {
		padding: $size-24;

		p {
			margin-bottom: 0;
		}
	}
}

.empty-action-btn {
	display: flex;
	align-items: center;
	gap: $size-6;
	padding: $size-10 $size-16;
	background: #0EAEC4;
	border: none;
	border-radius: $size-8;
	color: white;
	font-size: $size-13;
	font-weight: $fw-medium;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: darken(#0EAEC4, 10%);
	}
}

// Patient Notes Card
.patient-notes-card {
	background: white;
	border-radius: $size-16;
	padding: $size-24;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

	.patient-notes-content {
		margin-top: $size-16;
		padding: $size-16;
		background: #FFF9E6;
		border-radius: $size-10;
		border-left: 3px solid #F59E0B;

		p {
			margin: 0;
			font-size: $size-14;
			color: $color-g-21;
			line-height: 1.6;
		}
	}
}

// Private Notes Card
.private-notes-card {
	background: white;
	border-radius: $size-16;
	padding: $size-24;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
	border: 1px dashed rgba(139, 92, 246, 0.3);

	&__header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: $size-16;

		.private-badge {
			font-size: $size-11;
			font-weight: $fw-regular;
			color: #8B5CF6;
			background: rgba(139, 92, 246, 0.1);
			padding: $size-2 $size-8;
			border-radius: $size-4;
			margin-left: $size-8;
		}
	}

	.private-notes-content {
		padding: $size-16;
		background: rgba(139, 92, 246, 0.05);
		border-radius: $size-10;

		p {
			margin: 0;
			font-size: $size-14;
			color: $color-g-21;
			line-height: 1.6;
		}

		.no-notes {
			color: $color-g-54;
			font-style: italic;
		}
	}

	.private-notes-edit {
		display: flex;
		flex-direction: column;
		gap: $size-12;
	}

	.private-notes-textarea {
		min-height: 120px;
	}

	.private-notes-actions {
		display: flex;
		justify-content: flex-end;
	}
}

// Media Section Card
.media-section-card {
	background: white;
	border-radius: $size-16;
	padding: $size-24;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.media-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: $size-16;
	margin-top: $size-16;

	@include responsive(phone) {
		grid-template-columns: 1fr;
	}
}

.media-item {
	display: flex;
	align-items: center;
	gap: $size-12;
	padding: $size-16;
	background: $color-g-97;
	border-radius: $size-12;
	border: 1px solid $color-g-92;

	&--available {
		background: rgba(14, 174, 196, 0.05);
		border-color: rgba(14, 174, 196, 0.2);
	}

	.media-icon {
		width: 44px;
		height: 44px;
		border-radius: $size-10;
		background: $color-g-92;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;

		svg {
			color: $color-g-54;
		}
	}

	&--available .media-icon {
		background: rgba(14, 174, 196, 0.1);

		svg {
			color: #0EAEC4;
		}
	}

	.media-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: $size-4;
	}

	.media-title {
		font-size: $size-14;
		font-weight: $fw-medium;
		color: $color-g-21;
	}

	.media-status {
		font-size: $size-12;

		&--available {
			color: #059669;
		}

		&--unavailable {
			color: $color-g-54;
		}
	}
}

.media-action-btn {
	display: flex;
	align-items: center;
	gap: $size-4;
	padding: $size-8 $size-12;
	background: #0EAEC4;
	border: none;
	border-radius: $size-6;
	color: white;
	font-size: $size-12;
	font-weight: $fw-medium;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: darken(#0EAEC4, 10%);
	}
}

// Documents Section Card
.documents-section-card {
	background: white;
	border-radius: $size-16;
	padding: $size-24;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

	&__header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: $size-16;
	}
}

.documents-list {
	display: flex;
	flex-direction: column;
	gap: $size-10;
}

.document-item {
	display: flex;
	align-items: center;
	gap: $size-12;
	padding: $size-12 $size-16;
	background: $color-g-97;
	border-radius: $size-10;

	.document-icon {
		width: 40px;
		height: 40px;
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

	.document-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: $size-2;
	}

	.document-name {
		font-size: $size-14;
		font-weight: $fw-medium;
		color: $color-g-21;
	}

	.document-meta {
		font-size: $size-12;
		color: $color-g-54;
	}
}

.document-action-btn {
	width: 32px;
	height: 32px;
	border-radius: $size-6;
	background: rgba(14, 174, 196, 0.1);
	border: none;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: all 0.2s ease;

	svg {
		color: #0EAEC4;
	}

	&:hover {
		background: rgba(14, 174, 196, 0.2);
	}
}

// Linked Prescriptions
.linked-prescriptions-card {
	background: white;
	border-radius: $size-12;
	padding: $size-16;
	border: 1px solid $color-g-90;

	.section-title {
		display: flex;
		align-items: center;
		gap: $size-6;
		font-size: $size-14;
		font-weight: $fw-semi-bold;
		color: $color-g-21;
		margin-bottom: $size-12;
	}
}

.linked-prescriptions-list {
	display: flex;
	flex-direction: column;
	gap: $size-8;
}

.linked-rx-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: $size-10 $size-12;
	border-radius: $size-8;
	background: $color-g-97;
	cursor: pointer;
	transition: background 0.2s;

	&:hover {
		background: rgba(14, 174, 196, 0.06);
	}

	&__info {
		display: flex;
		align-items: center;
		gap: $size-10;
	}

	&__number {
		font-size: $size-13;
		font-weight: $fw-semi-bold;
		color: $color-g-21;
	}

	&__status {
		font-size: $size-11;
		padding: 2px $size-8;
		border-radius: $size-4;
		font-weight: $fw-medium;
		text-transform: capitalize;
	}

	&__arrow {
		color: $color-g-67;
	}
}

.rx-status--draft {
	background: $color-g-92;
	color: $color-g-54;
}

.rx-status--pending_payment {
	background: rgba(#f59e0b, 0.1);
	color: #d97706;
}

.rx-status--paid, .rx-status--delivered {
	background: rgba(#10b981, 0.1);
	color: #059669;
}

.rx-status--processing, .rx-status--dispensed, .rx-status--shipped {
	background: rgba(14, 174, 196, 0.1);
	color: #0891b2;
}

.rx-status--cancelled {
	background: rgba(#ef4444, 0.1);
	color: #dc2626;
}

// Action Buttons
.appointment-actions {
	display: flex;
	flex-direction: column;
	gap: $size-12;
	padding-top: $size-8;

	.action-btn {
		width: 100%;

		&--primary {
			background: #0EAEC4 !important;
			border-color: #0EAEC4 !important;

			&:hover {
				background: darken(#0EAEC4, 10%) !important;
			}
		}
	}
}

// Medical Records Modal & other existing styles
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
		}
		:deep(.diagnosis-line-class) {
			display: none !important;
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
			background: $color-sec-s2;
			padding: $size-8 $size-20;
			border-radius: $size-10;
			color: $color-white;
			font-size: $size-16;
			font-weight: $fw-semi-bold;
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
				gap: $size-32;

				.diagnosis-result__conditions--major {
					width: 100%;
					display: flex;
					flex-direction: column;
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
		}
		.diagnosis-summary {
			width: 100%;
			display: flex;
			flex-direction: column;
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
		padding: $size-32 $size-0;
		gap: $size-16;

		.medical-records-history__item {
			width: 100%;
			display: flex;
			flex-direction: column;
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

// Referral Modal Styles
.select-specialist {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: $size-36;
	min-height: 39.2rem;

	& .select-specialist__header {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: $size-8;
		border-bottom: 1px solid $color-g-90;
		padding-bottom: $size-16;

		& .select-specialist__search {
			position: relative;
			min-width: 100% !important;

			& .select-specialist__search--icon {
				position: absolute;
				right: 16px;
				top: 16px;
			}
		}
		& .select-specialist__description {
			font-size: $size-16;
			color: $color-g-44;
			line-height: $size-24;
		}
	}
	& .select-specialist__body {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: $size-24;

		& .select-specialist__body--items {
			display: flex;
			justify-content: space-between;
			align-items: center;
			width: 100%;

			@include responsive(phone) {
				flex-direction: column;
				gap: $size-24;
				border-bottom: $size-1 solid $color-g-90;
				padding-bottom: $size-24;
			}

			& .select-specialist__body--container {
				display: flex;
				align-items: center;
				gap: $size-38;

				@include responsive(phone) {
					gap: $size-16;
					width: 100%;
				}

				& .select-specialist__body--details {
					display: flex;
					justify-content: flex-start;
					align-items: center;
					gap: $size-8;

					& .select-specialist__body--info {
						display: flex;
						flex-direction: column;
						align-items: flex-start;
						gap: $size-1;

						& .select-specialist__info--texts {
							font-size: 16px;
							color: $color-g-44;
							line-height: $size-24;
						}

						& .select-specialist__info--details {
							display: flex;
							align-items: center;
							gap: $size-8;

							& .select-specialist__details--name {
								font-size: $size-20;
								color: $color-black;
								line-height: $size-22;
							}
							& .select-specialist__details--ratings {
								display: flex;
								align-items: center;
								gap: $size-4;
							}
						}
					}
				}
			}
			& .select-specialist__body--actions {
				background: white;
				border: $size-1 solid $color-pri-main;

				&:hover {
					background: $color-pri-t3 !important;
				}
			}
		}
	}
}

.submit-recommendation-btn {
	@include responsive(phone) {
		width: 100% !important;
	}
}

.referer-specialist {
	& .referer-specialist__note {}
}

.loader-recommended {
	width: 100%;
	height: 50vh !important;
}

// Prescription Modal Styles
.prescription-container {
	display: flex;
	justify-content: center;
	align-items: flex-start;
	height: 500px;
	width: 100%;

	.prescription-content {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: $size-16;

		.prescription-content-items {
			width: 100%;
			display: flex;
			flex-direction: column;
			gap: $size-16;

			.prescription-content-items__item {
				width: 100%;
				display: flex;
				justify-content: space-between;
				align-items: flex-start;
				background: #FEFAF9;
				border-radius: $size-16;
				padding: $size-16;

				.prescription-content__content {
					display: flex;
					flex-direction: column;
					gap: $size-8;

					.prescription-content__content--title {
						font-size: $size-20;
						font-weight: $fw-semi-bold;
						color: $color-g-21;
					}
					.prescription-content__content--dose,
					.prescription-content__content--interval {
						font-size: $size-16;
						font-weight: $fw-regular;
						color: $color-g-44;
					}
				}
				.prescription-content__actions {
					display: flex;
					gap: $size-8;
				}
			}
		}
	}
}

.prescription-action-button {
	@include responsive(phone) {
		width: 100% !important;
	}
}

.new-prescription-container {
	display: flex;
	flex-direction: column;
	gap: $size-24;

	.new-prescription-title {
		width: 100%;
	}
	.new-prescription-dosage {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: $size-16;

		.new-prescription-dosage__title {
			font-size: $size-16;
			font-weight: $fw-regular;
			color: $color-g-67;
		}
		.new-prescription-dosage__content {
			width: 100%;
			display: flex;
			flex-direction: column;
			gap: $size-16;

			.new-prescription-dosage__comboboxes {
				width: 100%;
				display: flex;
				justify-content: space-between;
				gap: $size-16;

				@include responsive(phone) {
					flex-direction: column;
				}
			}
		}
	}
	.new-prescription-dosage__checkbox {
		display: flex;
		align-items: center;
		gap: $size-16;

		.new-prescription-dosage__label {
			font-size: $size-16;
			font-weight: $fw-regular;
			color: $color-black;
		}
	}

	.new-prescription-dosage__refill {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: $size-16;

		.new-prescription-dosage__refill--title {
			font-size: $size-16;
			font-weight: $fw-regular;
			color: $color-g-67;
		}
		.new-prescription-dosage__refill--comboboxes {
			width: 100%;
			display: flex;
			justify-content: space-between;
			gap: $size-16;

			@include responsive(phone) {
				flex-direction: column;
			}
		}
	}
}

// Add Clinical Note Modal
.add-note-form {
	display: flex;
	flex-direction: column;
	gap: $size-16;
	min-height: 200px;

	.add-note-textarea {
		min-height: 150px;
	}

	.add-note-options {
		display: flex;
		align-items: center;
	}

	.note-checkbox-label {
		display: flex;
		align-items: center;
		gap: $size-8;
		font-size: $size-14;
		color: $color-g-44;
		cursor: pointer;
	}
}

// Upload Document Modal
.upload-form {
	display: flex;
	flex-direction: column;
	gap: $size-16;
}

.upload-dropzone {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: $size-32;
	border: 2px dashed $color-g-85;
	border-radius: $size-12;
	background: $color-g-97;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover, &--active {
		border-color: #0EAEC4;
		background: rgba(14, 174, 196, 0.05);
	}

	svg {
		color: $color-g-54;
		margin-bottom: $size-12;
	}

	&__text {
		font-size: $size-14;
		font-weight: $fw-medium;
		color: $color-g-44;
		margin: 0 0 $size-4 0;
	}

	&__hint {
		font-size: $size-12;
		color: $color-g-67;
		margin: 0;
	}
}

.selected-file {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: $size-12 $size-16;
	background: $color-g-97;
	border-radius: $size-8;
	border: 1px solid $color-g-90;

	&__info {
		display: flex;
		align-items: center;
		gap: $size-10;

		svg {
			color: #0EAEC4;
		}
	}

	&__details {
		display: flex;
		flex-direction: column;
		gap: $size-2;
	}

	&__name {
		font-size: $size-13;
		font-weight: $fw-medium;
		color: $color-g-21;
	}

	&__size {
		font-size: $size-11;
		color: $color-g-54;
	}

	&__remove {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: rgba(239, 68, 68, 0.1);
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;

		svg {
			color: #ef4444;
		}

		&:hover {
			background: rgba(239, 68, 68, 0.2);
		}
	}
}

.file-preview {
	border-radius: $size-8;
	overflow: hidden;
	border: 1px solid $color-g-90;

	&__image {
		width: 100%;
		max-height: 200px;
		object-fit: contain;
		background: $color-g-97;
	}

	&__doc {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: $size-24;
		background: $color-g-97;

		svg {
			color: $color-g-54;
			margin-bottom: $size-8;
		}

		span {
			font-size: $size-13;
			color: $color-g-44;
		}
	}
}

// Patient Rating Card
.patient-rating-card {
	background: white;
	border-radius: $size-16;
	padding: $size-24;
	box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

	&__header {
		margin-bottom: $size-16;

		.section-title {
			display: flex;
			align-items: center;
			gap: $size-8;
			font-size: $size-16;
			font-weight: $fw-semi-bold;
			color: $color-g-21;

			svg {
				color: #f59e0b;
			}
		}
	}
}

.patient-rating-content {
	display: flex;
	flex-direction: column;
	gap: $size-10;
}

.patient-rating-stars {
	display: flex;
	align-items: center;
	gap: $size-4;

	.star-filled {
		color: #f59e0b;
	}

	.star-empty {
		color: #e2e8f0;
	}

	.rating-score-text {
		margin-left: $size-10;
		font-size: $size-16;
		font-weight: $fw-bold;
		color: $color-g-21;
	}
}

.patient-rating-review {
	font-size: $size-14;
	color: $color-g-44;
	font-style: italic;
	line-height: 1.5;
	margin: $size-4 0 0;
	padding: $size-12 $size-16;
	background: #f8fafc;
	border-radius: $size-8;
	border-left: 3px solid #f59e0b;
}

.patient-rating-date {
	font-size: $size-12;
	color: $color-g-54;
}
</style>
