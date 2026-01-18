<template>
	<div class="page-content">
		<top-bar type="title-only" title="Appointments / Summary" @open-side-nav="$emit('openSideNav')" />

		<loader v-if="isLoading" :useOverlay="false" />
		<div v-else class="page-content__body">
			<div class="appointment-details-container">
				<div class="appointment-details-sectionTop">
					<div class="appointment-details-info">
						<div class="appointment-patient-details">
							<p class="appointment-patient-details__heading">Patient Details</p>
							<div class="appointment-patient-details__body">
								<span><rc-avatar first-name="First" last-name="Last" size="md" /></span>
								<div class="appointment-patient-info">
									<p class="appointment-patient-info__name">{{ patientInfo.fullName }}</p>
									<div class="appointment-patient-info__healthinfo">
										<div class="appointment-patient__healthinfo">
											<p class="appointment-patient__healthinfo--key">Gender:</p>
											<p class="appointment-patient__healthinfo--value">{{ patientInfo.gender }}</p>
										</div>
										<div class="appointment-patient__healthinfo">
											<p class="appointment-patient__healthinfo--key">Age:</p>
											<p class="appointment-patient__healthinfo--value">{{ patientInfo.age }} Yrs</p>
										</div>
										<div class="appointment-patient__healthinfo">
											<p class="appointment-patient__healthinfo--key">Weight:</p>
											<p class="appointment-patient__healthinfo--value">
												{{ patientInfo.weight.value }} {{ patientInfo.weight.unit }}
											</p>
										</div>
										<div class="appointment-patient__healthinfo">
											<p class="appointment-patient__healthinfo--key">Height:</p>
											<p class="appointment-patient__healthinfo--value">
												{{ patientInfo.height.value }} {{ patientInfo.height.unit }}
											</p>
										</div>
									</div>
									<p @click="isOpenMedicalRecords = true" class="appointment-patient__healthinfo--actions">
										See medical record
									</p>
								</div>
							</div>
						</div>
					</div>
					<div class="appointment-details">
						<p class="appointment-details__heading">Appointment Details</p>
						<div class="appointment-details-body">
							<div class="appointment-details__item">
								<p class="appointment-details__item--key">Preferred Language:</p>
								<p class="appointment-details__item--item">{{ preferences.language }}</p>
							</div>
							<div class="appointment-details__item">
								<p class="appointment-details__item--key">Time:</p>
								<p class="appointment-details__item--value">
									{{ format(new Date(appointmentInfo.start_time), 'HH:mm') }}
									({{ format(new Date(appointmentInfo.start_time), 'hh:mm a') }})
									{{ preferences.timezone }}
								</p>
							</div>
							<div class="appointment-details__item">
								<p class="appointment-details__item--key">Date:</p>
								<p class="appointment-details__item--value">
									{{ format(new Date(appointmentInfo.start_time), 'MMMM dd, yyyy') }}
								</p>
							</div>
						</div>
					</div>
				</div>

				<div class="appointment-actions">
					<rc-button
						type="primary"
						label="Schedule Follow-up"
					/>
					<rc-button
						type="tertiary"
						label="Send Prescription"
						@click="isOpenPrescription = true"
					/>
					<rc-button
						type="tertiary"
						label="Refer Patient"
						@click="isOpenRecommendation = true"
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
												<!-- <div class="select-specialist__info--billing">
													<p class="select-specialist__info--texts"></p>
													<p class="select-specialist__bills--availability">View availability</p>
												</div> -->
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
													Interval: {{  item.interval.time }} {{ item.interval.unit }}
												</p>
												<p v-if="item.refill_info?.dose?.quantity" class="prescription-content__content--interval">
													Refill: {{ item.refill_info.dose.quantity }} {{ item.refill_info.dose.dosage_form }}
													{{ item.refill_info.interval.time }} {{  item.refill_info.interval.unit }}
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
		</div>
	</div>
</template>

<script setup>
import { format } from "date-fns";
import { useRoute } from 'vue-router';
import { ref, inject, onMounted, watchEffect } from 'vue';
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

const isOpenPrescription = ref(false);
const isLoadingPrescription = ref(true);
const isDisabledPrescription = ref(true);
const prescriptionDialog = ref(1);
const prescriptionOptions = ref([]);
const prescription = ref({ ...initialState });

const isFetchingRecommendations = ref(false);
const isOpenRecommendation = ref(false);
const isDisabledRecommended = ref(true);
const isLoadingRecommended = ref(false);
const recommendationOptions = ref([]);
const queryTimeout = ref ('');
const recommendDialog = ref(1);
const recommendationNote = ref('');
const recommendations = ref([]);
const searchQuery = ref('');

const sortedConditions = ref([]);
const moreLikelyConditions = ref([]);
const lessLikelyConditions = ref([]);
const conditions = ref([]);
const consideredDiagnosis = ref([]);
const hasDiagnosis = ref(false);

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
	const hasNotes = recommendationNote.value.length
	if (isSelected && recommendDialog.value === 1) {
		isDisabledRecommended.value = false;
	} else if (hasNotes && recommendDialog.value === 2) {
		isDisabledRecommended.value = false;
	} else isDisabledRecommended.value = true;
});

watchEffect(() => {
	const queryParams = { filterBy: 'Specialist', search: searchQuery.value }
	clearTimeout(queryTimeout.value);
	queryTimeout.value = setTimeout(async () => {
		isFetchingRecommendations.value = true;
		await $http.$_getUsers(queryParams).then(({ data }) => {
			recommendationOptions.value = data.data.docs;
			isFetchingRecommendations.value = false;
		});
	}, 1000);
});

async function getOneAppointment (appointmentId) {
	await $http.$_getOnetAppointments(appointmentId).then(async ({ data }) => {
		appointmentInfo.value = data.data;
		await getOneUserInfo(data.data.patient);
		await getTimeAvailability(data.data.patient);
		getUserVitals(data.data.patient);
		getHealthCheckupResult(data.data.patient);
	})
}

async function getOneUserInfo (userId) {
	await $http.$_getOneUser(userId).then(({ data }) => {
		patientInfo.value = {
			...data.data,
			fullName: data.data.full_name,
			gender: data.data.profile.gender,
			weight: data.data.profile.basic_health_info.weight,
			height: data.data.profile.basic_health_info.height,
			age: calculateAge(data.data.profile.date_of_birth),
			isSmoker: data.data.profile.health_risk_factors.is_smoker,
			weightStatus: data.data.profile.health_risk_factors.weight_status,
			medicalHistory: data.data.pre_existing_conditions
		};
	})
}

async function getTimeAvailability() {
	await $http.$_getSpecialistAvailability().then(({ data }) => {
		preferences.value = data.data.preferences;
	});
}

const getUserVitals = async (patientId) => {
	await $http.$_getOneUserVitals(patientId).then(({ data }) => {
		patientVitals.value = data.data;
	});
}

const getHealthCheckupResult = async (patientId) => {
	await $http.$_getHealthCheckupResult(patientId).then(({ data }) => {
        if (Array.isArray(data.data) && data.data.length) {
			hasDiagnosis.value = !!(data.data.length);
            consideredDiagnosis.value = data.data[data.data.length - 1]['request']['evidence'];
            conditions.value  = data.data[data.data.length - 1]['response']['data']['conditions'];
            const sorted = conditions.value?.sort((a, b) => b.probability - a.probability);
            sortedConditions.value = sorted.map((condition, i) => ({
            ...condition, category: Math.floor(i / (sorted.length / 3))
            })).forEach((condition) => {
                if (condition.category <= 1) moreLikelyConditions.value.push(condition)
                else if (condition.category > 1) lessLikelyConditions.value.push(condition)
            });
        }
    });
}

const onSelectRecommendation = (i) => {
	recommendationOptions.value = recommendationOptions.value?.map(
		item => ({ ...item, most_recommended: false })
	);
	recommendationOptions.value[i]['most_recommended'] = true;
}

const onCloseRecommendation = () => {
	recommendDialog.value = 1;
	recommendationNote.value = '';
	recommendationOptions.value = [];
	isOpenRecommendation.value = false;
	isLoadingRecommended.value = false;
	isFetchingRecommendations.value = false;
	isDisabledRecommended.value = true;
}

const onSubmitRecommendation = async (appointmentInfo) => {
	if (recommendDialog.value === 1) {
		return recommendDialog.value = 2;
	}

	const payload = {
		patient: appointmentInfo?.patient?.id,
		appointment: appointmentInfo?._id,
		referral_note: recommendationNote.value,
		specialists: recommendations.value,
	}
	
	isLoadingRecommended.value = true;
	await $http.$_specialistRecommendation(payload).then(({ data }) => {
		$toast.success('Referral Posted Successfully!');
		onCloseRecommendation();
	}).catch((error) => {
		isLoadingRecommended.value = true;
		$toast.error(error || 'Something went wrong, Please try again');
	});
}

const onSubmitPrescription = async (item) => {
	if (prescriptionDialog.value === 2) {
		if (item.id) {
			const foundIndex = prescriptionOptions.value.findIndex(i => i.id === item.id);
			if (foundIndex) prescriptionOptions.value[foundIndex] = item;
		} else prescriptionOptions.value.push({ ...item, id: new Date().getTime() });
		
		prescription.value = { ...initialState };
		prescriptionDialog.value = 1;
	} else if (prescriptionDialog.value === 1){
		isLoadingPrescription.value = true;

		const payload = {
			patient: patientInfo.value.id,
			items: prescriptionOptions.value
		};
		await $http.$_submitPrescription(payload).then(({ data }) => {
			$toast.success('Prescription sent Successfully!');
			prescription.value = { ...initialState };
			isLoadingPrescription.value = false;
			isOpenPrescription.value = false;
		}).catch((error) => {
			$toast.error(error || 'Something went wrong, Please try again');
			isLoadingPrescription.value = false;
		});
	}
	
}

const getUserPrescriptions = async () => {
	await $http.$_getUserPrescriptions().then(({ data }) => {
		// console.log('SOME_DATA', data)
		isLoadingPrescription.value = false;
	})
}
getUserPrescriptions()

</script>

<style scoped lang="scss">
.page-content {
	display: flex;
	flex-direction: column;
	gap: $size-12;
	width: 100%;
	height: 100vh;
	padding: 0 256px;

	@include responsive(tab-portrait) {
		padding: $size-0;
	}

	@include responsive(phone) {
		padding: $size-0;
	}

	&__body {
		display: flex;
		justify-content: space-between;
		gap: $size-48;
		width: 100%;
		padding: $size-32 $size-48;

		@include responsive(phone) {
			padding: $size-0 $size-24;
			height: 100%;
		}

		&::-webkit-scrollbar {
			display: none;
			width: 12px;
			background-color: $color-g-97;
		}
	}
}

// :deep(.prescription-modal) .modal__body {
// 	min-width: 710px !important;
// 	max-width: 707px !important;
// 	min-height: 468px !important;
// 	max-height: 468px !important;
	
// 	@include responsive(tab-horizontal) {
// 		min-width: 100% !important;
// 		max-width: 100% !important;
// 		min-height: 100% !important;
// 		max-height: 100% !important;
// 	}
// }

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
	height: 100%;
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	align-items: flex-start;
	gap: $size-40;

	@include responsive(phone) {
		margin-bottom: $size-24;
	}
	
	.appointment-details-sectionTop {
		width: 100%;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: flex-start;
		gap: $size-40;

		@include responsive(phone) {
			height: 100%;
		}
	}
}

.appointment-details-info {
	width: 100%;

	.appointment-patient-details {
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: flex-start;
		gap: $size-32;

		.appointment-patient-details__heading {
			font-size: $size-12;
			color: $color-g-21;
			border-bottom: 1px solid $color-g-90;
			padding-bottom: $size-8;
			width: 100%;
		}
		.appointment-patient-details__body {
			width: 100%;
			display: flex;
			justify-content: flex-start;
			align-items: center;
			gap: $size-24;

			.appointment-patient-info {
				width: 100%;
				display: flex;
				flex-direction: column;
				justify-content: flex-start;
				align-items: flex-start;
				gap: $size-8;
				position: relative;

				.appointment-patient-info__name {
					font-size: $size-20;
					font-weight: $fw-semi-bold;
					color: $color-black;
					text-transform: capitalize;
				}
				.appointment-patient-info__healthinfo {
					width: 100%;
					display: grid;
					grid-template-columns: repeat(2, 1fr);
					gap: $size-4;

					.appointment-patient__healthinfo {
						display: flex;
						justify-content: flex-start;
						align-items: center;
						gap: $size-8;

						.appointment-patient__healthinfo--key {
							font-size: $size-14;
							font-weight: $fw-regular;
							color: $color-g-44;
						}
						.appointment-patient__healthinfo--value {
							font-size: $size-14;
							font-weight: 500;
							color: $color-g-21;
						}
					}
				}
				.appointment-patient__healthinfo--actions {
					font-size: $size-14;
					color: $color-pri-main;
					font-weight: $fw-regular;
					position: absolute;
					top: 80px;

					&:hover {
						text-decoration: underline;
						cursor: pointer;
					}
				}
			}
		}
	}
}

.appointment-details {
	width: 100%;
	margin-top: 32px;
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	align-items: flex-start;
	gap: $size-16;

	.appointment-details__heading {
		font-size: $size-12;
		color: $color-g-21;
		border-bottom: 1px solid $color-g-90;
		padding-bottom: $size-8;
		width: 100%;
	}
	.appointment-details-body {
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: flex-start;
		gap: $size-8;

		.appointment-details__item {
			display: flex;
			justify-content: flex-start;
			align-items: center;
			gap: $size-8;

			.appointment-details__item--key {
				font-size: $size-14;
				font-weight: $fw-regular;
				color: $color-g-44;
			}
			.appointment-details__item--value {
				font-size: $size-14;
				font-weight: 500;
				color: $color-g-21;
			}
		}
	}
}

.appointment-actions {
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: $size-16;

	& button {
		width: 65%;
		
		@include responsive(phone) {
			width: 100% !important;
		}
	}


	.appointment-actions__prescription {
		background: $color-white;
		border: $size-1 solid $color-pri;
	}
	.appointment-actions__referer {
		background: transparent;
	}
}
// .appointment-actions {
// 	width: 100%;
// 	display: flex;
// 	justify-content: space-between;
// 	align-items: center;

// 	@include responsive(phone) {
// 		flex-direction: column-reverse;
// 		gap: $size-16;
// 		& button { width: 100%; }
// 	}
// }

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

.select-specialist {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: $size-36;
	// width: 45rem;
	min-height: 39.2rem;

	& .select-specialist__header {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: $size-8;
		border-bottom: 1px solid $color-g-90;
		padding-bottom: $size-16;

		@include responsive(phone) {
			@include flexItem(vertical){}
		}

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
			text-align: left;
			vertical-align: center;

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
				align-items: center;

			}

			& .select-specialist__body--container {
				display: flex;
				align-items: center;
				justify-content: flex-start;
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
						justify-content: center;
						gap: $size-1;

						& .select-specialist__info--texts {
							font-size: 16px;
							color: $color-g-44;
							line-height: $size-24;
						}

						& .select-specialist__info--details {
							display: flex;
							justify-content: flex-start;
							align-items: center;
							gap: $size-8;

							& .select-specialist__details--name {
								font-size: $size-20;
								color: $color-black;
								line-height: $size-22;
							}
							& .select-specialist__details--ratings {
								display: flex;
								justify-content: flex-start;
								align-items: center;
								gap: $size-4;
							}
						}
						& .select-specialist__info--billing {
							display: flex;
							justify-content: flex-start;
							align-items: center;
							gap: $size-16;

							& .select-specialist__bills--availability {
								font-size: $size-16;
								line-height: $size-24;
								color: $color-sec-s1;
								cursor: pointer;

								&:hover {
									text-decoration: underline;
								}
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
		justify-content: flex-start;
		align-items: flex-end;
		gap: $size-16;

		.prescription-content-items {
			width: 100%;
			display: flex;
			flex-direction: column;
			justify-content: flex-start;
			align-items: flex-start;
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
					justify-content: space-between;
					align-items: flex-start;
					gap: $size-8;

					.prescription-content__content--title {
						font-size: $size-20;
						font-weight: $fw-semi-bold;
						color: $color-g-21;
					}
					.prescription-content__content--dose {
						font-size: $size-16;
						font-weight: $fw-regular;
						color: $color-g-44;
					}
					.prescription-content__content--interval {
						font-size: $size-16;
						font-weight: $fw-regular;
						color: $color-g-44;
					}
				}
				.prescription-content__actions {
					display: flex;
					justify-content: flex-start;
					align-items: center;
					gap: $size-8;
				}

			}
		}
	}
}
.prescription-action-button {
	@include responsive(phone) {
		width: 100% !important;
		&:button { width: 100% !important; }
	}
}
.new-prescription-container {
	// width: 100%;
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	align-items: flex-start;
	gap: $size-24;

	.new-prescription-title {
		width: 100%;
	}
	.new-prescription-dosage {
		width: 100%;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: flex-start;
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
			justify-content: flex-start;
			gap: $size-16;

			.new-prescription-dosage__comboboxes {
				width: 100%;
				display: flex;
				justify-content: space-between;
				align-items: center;
				gap: $size-16;

				@include responsive(phone) {
					flex-direction: column;
				}
			}
		}
	}
	.new-prescription-dosage__checkbox {
		display: flex;
		justify-content: flex-start;
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
		justify-content: flex-start;
		align-items: flex-start;
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
			align-items: center;
			gap: $size-16;

			@include responsive(phone) {
				flex-direction: column;
			}
		}
	}
}
</style>
