<template>
    <div class="root">
        <top-bar type="title-only" title="Active Appointment" @open-side-nav="$emit('openSideNav')" />
		<loader v-if="isLoading" :useOverlay="false" style="position: relative" />
        <div v-else class="container">
			<rc-accordian class="mobile-tab-accordian">
                <template v-slot:head-content>
                    <div class="header">
                        <h1 class="heading">Patient Details</h1>
                    </div>
                </template>
                <template v-slot:body-content>
                    <div class="details-container accordian-details-container">
						<div class="top_container">
							<div class="spacialist-details__container">
								<div class="spacialist_details">
									<div class="specialist_details-container">
										<div class="specialist_details-avatar">
											<avatar
												size="small"
												:firstname="profile.first_name"
												:lastname="profile.last_name"
											/>
										</div>
										<div class="specialist_details-info-container">
											<h2 class="specialist_details-name">
												{{ profile.first_name }} {{ profile.last_name }}
											</h2>
											<div class="specialist-details__patient">
												<p class="specialist_details-spacialty">
													{{ profile.gender }}
												</p>
												<p class="specialist_details-spacialty">
													{{ calculateAge(profile.date_of_birth) }} Yrs
												</p>
											</div>
										</div>
									</div>
								</div>
								<div class="specialist-details__health_info">
									<div class="specialist-details__health_info--items">
										<div class="specialist-details__health_info--item">
											<p class="specialist-details__health_info--item-key">Weight:</p>
											<p class="specialist-details__health_info--item-value">
												{{ profile.basic_health_info?.weight.value }} 
												{{ profile.basic_health_info?.weight.unit }}
											</p>
										</div>
										<div class="specialist-details__health_info--item">
											<p class="specialist-details__health_info--item-key">Height:</p>
											<p class="specialist-details__health_info--item-value">
												{{ profile.basic_health_info?.height.value }} 
												{{ profile.basic_health_info?.height.unit }}
											</p>
										</div>
										<div class="specialist-details__health_info--item">
											<p class="specialist-details__health_info--item-key">BMI:</p>
											<p class="specialist-details__health_info--item-value">
												- <span class="specialist-details__health_info--item-key">
													({{ profile.health_risk_factors?.weight_status }})
												</span>
											</p>
										</div>
										<div class="specialist-details__health_info--item">
											<p class="specialist-details__health_info--item-key">Smoker:</p>
											<p class="specialist-details__health_info--item-value">
												{{ profile.health_risk_factors?.is_smoker }}
											</p>
										</div>
									</div>
									<div class="specialist-details__health_info--items">
										<div class="specialist-details__health_info--item">
											<p class="specialist-details__health_info--item-key">High Cholesterol:</p>
											<p class="specialist-details__health_info--item-value">-</p>
										</div>
										<div class="specialist-details__health_info--item">
											<p class="specialist-details__health_info--item-key">Diabetic:</p>
											<p class="specialist-details__health_info--item-value">-</p>
										</div>
										<div class="specialist-details__health_info--item">
											<p class="specialist-details__health_info--item-key">Hypertensive:</p>
											<p class="specialist-details__health_info--item-value">-</p>
										</div>
										<div class="specialist-details__health_info--item">
											<p class="specialist-details__health_info--item-key">Recent Injury:</p>
											<p class="specialist-details__health_info--item-value">-</p>
										</div>
									</div>
								</div>
								<div class="specialist-details__actions">
									<rc-button
										type="secondary"
										label="View Self Diagnosis Report"
										class="specialist-details__actions--diagnosis"
									/>
									<rc-button
										type="secondary"
										label="View Medical History"
										class="specialist-details__actions--history"
									/>
								</div>
							</div>
						</div>
					</div>
                </template>
            </rc-accordian>
            <div class="details-container desktop-details-container">
                <div class="top_container">
                    <div class="header">
                        <h1 class="heading">Patient Details</h1>
                    </div>
                    <div class="spacialist-details__container">
                        <div class="spacialist_details">
                            <div class="specialist_details-container">
                                <div class="specialist_details-avatar">
                                    <avatar
										size="small"
										:firstname="profile.first_name"
										:lastname="profile.last_name"
									/>
                                </div>
                                <div class="specialist_details-info-container">
                                    <h2 class="specialist_details-name">
										{{ profile.first_name }} {{ profile.last_name }}
									</h2>
                                    <div class="specialist-details__patient">
                                        <p class="specialist_details-spacialty">
											{{ profile.gender }}
										</p>
                                        <p class="specialist_details-spacialty">
											{{ calculateAge(profile.date_of_birth) }} Yrs
										</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="specialist-details__health_info">
                            <div class="specialist-details__health_info--items">
                                <div class="specialist-details__health_info--item">
                                    <p class="specialist-details__health_info--item-key">Weight:</p>
                                    <p class="specialist-details__health_info--item-value">
                                        {{ profile.basic_health_info?.weight.value }} 
										{{ profile.basic_health_info?.weight.unit }}
                                    </p>
                                </div>
                                <div class="specialist-details__health_info--item">
                                    <p class="specialist-details__health_info--item-key">Height:</p>
                                    <p class="specialist-details__health_info--item-value">
										{{ profile.basic_health_info?.height.value }} 
										{{ profile.basic_health_info?.height.unit }}
                                    </p>
                                </div>
                                <div class="specialist-details__health_info--item">
                                    <p class="specialist-details__health_info--item-key">BMI:</p>
                                    <p class="specialist-details__health_info--item-value">
                                        - <span class="specialist-details__health_info--item-key">
											({{ profile.health_risk_factors?.weight_status }})
										</span>
                                    </p>
                                </div>
                                <div class="specialist-details__health_info--item">
                                    <p class="specialist-details__health_info--item-key">Smoker:</p>
                                    <p class="specialist-details__health_info--item-value">
										{{ profile.health_risk_factors?.is_smoker }}
									</p>
                                </div>
                            </div>
                            <div class="specialist-details__health_info--items">
                                <div class="specialist-details__health_info--item">
                                    <p class="specialist-details__health_info--item-key">High Cholesterol:</p>
                                    <p class="specialist-details__health_info--item-value">-</p>
                                </div>
                                <div class="specialist-details__health_info--item">
                                    <p class="specialist-details__health_info--item-key">Diabetic:</p>
                                    <p class="specialist-details__health_info--item-value">-</p>
                                </div>
                                <div class="specialist-details__health_info--item">
                                    <p class="specialist-details__health_info--item-key">Hypertensive:</p>
                                    <p class="specialist-details__health_info--item-value">-</p>
                                </div>
                                <div class="specialist-details__health_info--item">
                                    <p class="specialist-details__health_info--item-key">Recent Injury:</p>
                                    <p class="specialist-details__health_info--item-value">-</p>
                                </div>
                            </div>
                        </div>
                        <div class="specialist-details__actions">
                            <rc-button
                                type="secondary"
                                label="View Self Diagnosis Report"
                                class="specialist-details__actions--diagnosis"
                            />
                            <rc-button
                                type="secondary"
                                label="View Medical History"
                                class="specialist-details__actions--history"
                            />
                        </div>
                    </div>
                </div>
            </div>


			<div class="meetings-root">
				<div class="meeting-container">
					<div class="meeting-view">
						<loader v-if="true" :useOverlay="false" style="z-index:1" />
						<p class="meeting-view__patient-name">Agness Usiayo</p>
						<p class="meeting-view__patient-avatar">
							{{ Array.from(profile.first_name)[0] }}{{ Array.from(profile.last_name)[0] }}
						</p>
					</div>
					<div class="meeting-actions">
						<v-icon
							:name="isMicMute ? 'bi-mic-mute' : 'bi-mic'"
							class="meeting-actions__action"
							:class="{ 'is-mic-muted': isMicMute }"
							@click="isMicMute = !isMicMute"
						/>
						<v-icon 
							:name="isCameraOn ? 'io-videocam-outline' : 'io-videocam-off-outline'"
							class="meeting-actions__action"
							:class="{ 'video-btn': true }"
							@click="isCameraOn = !isCameraOn"
						/>
						<v-icon
							name="hi-phone"
							class="meeting-actions__action"
							:class="{ 'close-meeting-btn': true }"
						/>
						<v-icon
							name="bi-chat-square"
							class="meeting-actions__action"
							:class="{ 'chat-is-open': isOpenChat }"
							@click="onOpenChat"
						/>
						<v-icon
							name="fa-regular-file-alt"
							class="meeting-actions__action"
							:class="{ 'notes-is-open': isOpenNotes }"
							@click="onOpenNotes"
						/>
					</div>
				</div>

				<div v-if="isOpenNotes" class="notes-container notes-desktop">
					<div class="notes-content">
						<div class="notes-content__header">
							<h2 class="notes-content__header--heading">Clinical Notes</h2>
							<p class="notes-content__header--subtitle">Auto-saves every 30 seconds</p>
						</div>
						<div class="notes-content__body">
							<template v-for="item in meetingNotes" :key="item.note_id">
								<div class="notes-content__body--note">
									<p class="notes-content__body--message">{{ item.note }}</p>
									<div class="notes-content__body--meta">
										<p class="notes-content__body--timestamp">{{ item.timestamp }}</p>
										<span v-if="item.completed" class="notes-content__body--completed">✓ Completed</span>
									</div>
								</div>
							</template>
						</div>
					</div>
					<div class="notes-footer">
						<div v-if="templates.length > 0" class="notes-footer__templates">
							<label>Quick Insert Template:</label>
							<rc-select
								label="name"
								placeholder="Select a template..."
								:options="templates"
								v-model="selectedTemplate"
								:reduce="item => item._id"
								@update:modelValue="insertTemplate"
							/>
						</div>
						<rc-textarea
							placeholder="Type clinical note here..."
							v-model="newNote"
							:rows="8"
						/>
						<div class="notes-footer__controls">
							<label class="notes-footer__checkbox">
								<input type="checkbox" v-model="noteCompleted" />
								<span>Mark as completed</span>
							</label>
							<rc-button
								size="small"
								type="primary"
								:label="isSavingNote ? 'Saving...' : 'Save Note'"
								:disabled="isSavingNote"
								@click="onSaveNotes"
							/>
						</div>
					</div>
				</div>

				<div v-if="isOpenChat" class="chat-container chat-desktop">
					<div class="chat-content">
						<div class="chat-content__header">
							<h2 class="chat-content__header--heading">Chat</h2>
						</div>
						<div class="chat-content__body">
							<template v-for="item in chatMessages" :key="item">
								<div class="chat-content__body--chat" :class="{ 'chat-mine': userprofile.id === item.id }">
									<p class="chat-content__body--message" :class="{ 'chat-mine': userprofile.id === item.id }">
										{{ item.message }}
									</p>
								</div>
							</template>
						</div>
					</div>
					<div class="chat-footer">
						<rc-text
							label="Type message"
							class="chat-footer__message-box"
							v-model="message"
							@keyup.enter="onSendMessage"
						/>
						<v-icon
							name="co-send"
							class="chat-footer__send-button"
							@click="onSendMessage"
						/>
					</div>
				</div>
			</div>
        </div>
    </div>
	<DialogModal
		v-if="isOpenChat"
		title="Chat"
		@closeModal="isOpenChat = false"
		:has-footer="true"
		class="chat-container-modal"
	>
		<template v-slot:body>
			<div class="chat-container">
				<div class="chat-content">
					<div class="chat-content__body">
						<template v-for="item in chatMessages" :key="item">
							<div class="chat-content__body--chat" :class="{ 'chat-mine': userprofile.id === item.id }">
								<p class="chat-content__body--message" :class="{ 'chat-mine': userprofile.id === item.id }">
									{{ item.message }}
								</p>
							</div>
						</template>
					</div>
				</div>
			</div>
		</template>
		<template v-slot:foot>
			<div class="chat-footer">
				<rc-text
					label="Type message"
					class="chat-footer__message-box"
					v-model="message"
					@keyup.enter="onSendMessage"
				/>
				<v-icon
					name="co-send"
					class="chat-footer__send-button"
					@click="onSendMessage"
				/>
			</div>
		</template>
	</DialogModal>
	<DialogModal
		v-if="isOpenNotes"
		title="Clinical Notes"
		@closeModal="isOpenNotes = false"
		:has-footer="true"
		class="notes-container-modal"
	>
		<template v-slot:body>
			<div class="notes-container">
				<div class="notes-content">
					<p class="notes-auto-save-info">Auto-saves every 30 seconds</p>
					<div class="notes-content__body">
						<template v-for="item in meetingNotes" :key="item.note_id">
							<div class="notes-content__body--note">
								<p class="notes-content__body--message">{{ item.note }}</p>
								<div class="notes-content__body--meta">
									<p class="notes-content__body--timestamp">{{ item.timestamp }}</p>
									<span v-if="item.completed" class="notes-content__body--completed">✓ Completed</span>
								</div>
							</div>
						</template>
					</div>
				</div>
			</div>
		</template>
		<template v-slot:foot>
			<div class="notes-footer">
				<div v-if="templates.length > 0" class="notes-footer__templates">
					<label>Quick Insert Template:</label>
					<rc-select
						label="name"
						placeholder="Select a template..."
						:options="templates"
						v-model="selectedTemplate"
						:reduce="item => item._id"
						@update:modelValue="insertTemplate"
					/>
				</div>
				<rc-textarea
					placeholder="Type clinical note here..."
					v-model="newNote"
					:rows="6"
				/>
				<div class="notes-footer__controls">
					<label class="notes-footer__checkbox">
						<input type="checkbox" v-model="noteCompleted" />
						<span>Mark as completed</span>
					</label>
					<rc-button
						size="small"
						type="primary"
						:label="isSavingNote ? 'Saving...' : 'Save Note'"
						:disabled="isSavingNote"
						@click="onSaveNotes"
					/>
				</div>
			</div>
		</template>
	</DialogModal>
</template>

<script setup>
import { format } from "date-fns";
import { useRoute } from 'vue-router';
import { defineComponent, ref, inject, onMounted, watch, onUnmounted } from 'vue';
import TopBar from "@/components/Navigation/top-bar";
import Loader from "@/components/Loader/main-loader";
import RcIcon from "@/components/RCIcon";
import RcButton from "@/components/buttons/button-primary";
import Avatar from "@/components/Avatars/avatar-fixed";
import RcTextarea from "@/components/inputs/textarea";
import RcText from "@/components/inputs/text";
import RcAccordian from "@/components/Lists/accordian";
import DialogModal from "@/components/modals/dialog-modal";
import { useToast } from 'vue-toast-notification';

import { mapGetters } from "@/utilities/utilityStore";

const $http = inject('$_HTTP');
const { userprofile } = mapGetters();
const route = useRoute();
const toast = useToast();

const isMicMute = ref(false);
const isCameraOn = ref(false);
const isOpen = ref(false);
const isOpenNotes = ref(false);
const isOpenChat = ref(false);
const isFetching = ref(false);
const isLoading = ref(true);
const isSavingNote = ref(false);
const profile = ref({});
const meetingNotes = ref([]);
const chatMessages = ref([]);
const newNote = ref('');
const message = ref();
const noteCompleted = ref(false);
const currentNoteId = ref(null);
const autoSaveTimer = ref(null);
const lastSavedContent = ref('');
const templates = ref([]);
const selectedTemplate = ref(null);

onMounted(async () => {
	// Fetch patient profile
	try {
		const { data } = await $http.$_getOneUser(route.params.patientId);
		profile.value = data.data.profile;
	} catch (error) {
		console.error('Error fetching patient profile:', error);
		toast.error('Failed to load patient information');
	}

	// Fetch existing clinical notes for this appointment
	try {
		const appointmentId = route.params.meetingId;
		const response = await $http.$_getClinicalNotes(appointmentId);
		if (response.data && response.data.data) {
			meetingNotes.value = response.data.data.map(note => ({
				note_id: note.note_id,
				note: note.content,
				timestamp: format(new Date(note.created_at), 'h:mm a'),
				completed: note.completed || false
			}));

			// If there's an existing custom note, load it into the editor
			const customNote = response.data.data.find(n => n.platform === 'custom');
			if (customNote) {
				newNote.value = customNote.content;
				currentNoteId.value = customNote.note_id;
				noteCompleted.value = customNote.completed || false;
				lastSavedContent.value = customNote.content;
			}
		}
	} catch (error) {
		console.error('Error fetching clinical notes:', error);
		// Don't show error toast for notes - not critical
	}

	// Fetch templates
	try {
		const response = await $http.$_getTemplates();
		if (response.data) {
			templates.value = response.data;

			// Auto-load default template if no existing notes and newNote is empty
			if (!newNote.value || newNote.value.trim() === '') {
				const defaultTemplate = templates.value.find(t => t.is_default);
				if (defaultTemplate) {
					newNote.value = defaultTemplate.content;
					lastSavedContent.value = defaultTemplate.content;
				}
			}
		}
	} catch (error) {
		console.error('Error fetching templates:', error);
	}

	isLoading.value = false;
});

// Cleanup auto-save timer on component unmount
onUnmounted(() => {
	if (autoSaveTimer.value) {
		clearTimeout(autoSaveTimer.value);
	}
});



const calculateAge = (birthday) => {
	var ageDifMs = Date.now() - new Date(birthday).getTime();
	var ageDate = new Date(ageDifMs);
	return Math.abs(ageDate.getUTCFullYear() - 1970);
}

const onSendMessage = () => {
	chatMessages.value.push({
		message: message.value,
		id: userprofile.value.id
	});
	setTimeout(() => {
		chatMessages.value.push({ message: 'How are you today?'})
	}, 2000);

	message.value = null;
}

// Auto-save function with debouncing
const triggerAutoSave = () => {
	if (autoSaveTimer.value) {
		clearTimeout(autoSaveTimer.value);
	}

	autoSaveTimer.value = setTimeout(async () => {
		// Only auto-save if content has changed and is not empty
		if (newNote.value && newNote.value.trim() !== lastSavedContent.value.trim()) {
			await saveClinicalNote(true);
		}
	}, 30000); // 30 seconds
};

// Watch for changes to newNote to trigger auto-save
watch(newNote, () => {
	if (newNote.value && newNote.value.trim()) {
		triggerAutoSave();
	}
});

// Save clinical note to API
const saveClinicalNote = async (isAutoSave = false) => {
	if (!newNote.value || !newNote.value.trim()) {
		if (!isAutoSave) {
			toast.error('Note content cannot be empty');
		}
		return;
	}

	isSavingNote.value = true;

	try {
		const appointmentId = route.params.meetingId;

		if (currentNoteId.value) {
			// Update existing note
			await $http.$_updateClinicalNote(
				appointmentId,
				currentNoteId.value,
				{
					content: newNote.value,
					completed: noteCompleted.value
				}
			);

			// Update the note in the local list
			const noteIndex = meetingNotes.value.findIndex(n => n.note_id === currentNoteId.value);
			if (noteIndex !== -1) {
				meetingNotes.value[noteIndex].note = newNote.value;
				meetingNotes.value[noteIndex].completed = noteCompleted.value;
				meetingNotes.value[noteIndex].timestamp = format(new Date(), 'h:mm a');
			}
		} else {
			// Create new note
			const response = await $http.$_createClinicalNote({
				appointmentId,
				content: newNote.value,
				completed: noteCompleted.value
			});

			if (response.data && response.data.data) {
				const savedNote = response.data.data;
				currentNoteId.value = savedNote.note_id;

				// Add to local list
				meetingNotes.value.push({
					note_id: savedNote.note_id,
					note: savedNote.content,
					timestamp: format(new Date(savedNote.created_at), 'h:mm a'),
					completed: savedNote.completed || false
				});
			}
		}

		lastSavedContent.value = newNote.value;

		if (!isAutoSave) {
			toast.success('Clinical note saved successfully');
		}
	} catch (error) {
		console.error('Error saving clinical note:', error);
		if (!isAutoSave) {
			toast.error('Failed to save clinical note');
		}
	} finally {
		isSavingNote.value = false;
	}
};

// Manual save handler
const onSaveNotes = async () => {
	await saveClinicalNote(false);
};

const onOpenNotes = () => {
	isOpenNotes.value = !isOpenNotes.value;
	isOpenChat.value = false;
}

const onOpenChat = () => {
	isOpenChat.value = !isOpenChat.value;
	isOpenNotes.value = false;
}

// Insert template into note editor
const insertTemplate = async () => {
	if (!selectedTemplate.value) return;

	const template = templates.value.find(t => t._id === selectedTemplate.value);
	if (template) {
		newNote.value = template.content;

		// Increment usage count
		try {
			await $http.$_incrementTemplateUsage(template._id);
		} catch (error) {
			console.error('Error incrementing template usage:', error);
		}
	}
};

</script>
<style scoped lang="scss">
.root {
    width: 100%;
	height: 100%;
}
.container {
	width: 100%;
	height: 100vh;
	display: flex;
	justify-content: flex-start;
	gap: $size-32;
	padding: $size-32 $size-56;

	& .accordian-details-container {
		margin-top: $size-16;
	}

	& .mobile-tab-accordian {
		display: none !important;
	}

	@include responsive(tab-portrait) {
		flex-direction: column;

		& .desktop-details-container {
			display: none !important;
		}

		& .mobile-tab-accordian {
			display: block !important;
		}
	}
	@include responsive(phone) {
		padding: $size-16 $size-24;
	}
}
.meetings-root {
	width: 100%;
	height: 100%;
	display: flex;
	justify-content: flex-start;
	gap: $size-32;
}
:deep(.notes-container) {
	width: 100%;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	border-left: 1px solid $color-g-90;
	padding-left: $size-44;
	padding-bottom: 100px;
	
	@include responsive(tab-portrait) {
		border-left: 0;
		padding-left: 0;
		padding-bottom: 0;
		height: 100vh;
	}

	& .notes-content {
		width: 100%;
		height: 76%;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: $size-24;

		& .notes-content__header {
			width: 100%;
			display: flex;
			flex-direction: column;
			justify-content: flex-start;
			border-bottom: 1px solid $color-g-90;
			padding-bottom: $size-8;

			& .notes-content__header--heading {
				font-weight: $fw-semi-bold;
				font-size: $size-36;
				line-height: 54px;
				color: $color-black;
			}

			& .notes-content__header--subtitle {
				font-size: $size-14;
				color: $color-g-44;
				margin-top: $size-4;
			}
		}
		& .notes-content__body {
			width: 100%;
			display: flex;
			flex-direction: column;
			align-items: flex-start;
			gap: $size-24;
			overflow: scroll;
			margin-bottom: $size-16;

			& .notes-content__body--note {
				width: 100%;
				display: flex;
				flex-direction: column;
				align-items: flex-end;
				justify-content: flex-start;
				gap: $size-4;

				& .notes-content__body--message {
					width: 100%;
					background: $color-white;
					padding: $size-16;
					border-radius: $size-8;
					color: $color-black;
					font-size: $size-16;
					line-height: 24px;
					text-align: left;
					word-break: break-all;

					@include responsive(tab-portrait) {
						background: $color-g-97;
					}
				}

				& .notes-content__body--meta {
					width: 100%;
					display: flex;
					justify-content: space-between;
					align-items: center;
					gap: $size-12;
				}

				& .notes-content__body--timestamp {
					color: $color-g-44;
					font-size: $size-14;
					line-height: 18px;
				}

				& .notes-content__body--completed {
					color: #10B981;
					font-size: $size-12;
					font-weight: $fw-medium;
					background: rgba(#10B981, 0.1);
					padding: $size-4 $size-8;
					border-radius: $size-4;
				}
			}
		}
	
	}
}
:deep(.notes-footer) {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	justify-content: flex-start;
	gap: $size-16;
	border-top: 1px solid $color-g-90;
	padding-top: $size-16;

	@include responsive(tab-portrait) {
		width: 100%;
		border-top: 0;
		padding-top: 0;
	}
	@include responsive(phone) {
		button {
			width: 100%;
		}
		textarea {
			height: 100% !important;
		}
	}
	& :deep(textarea) {
		height: 88px;
	}

	& .notes-footer__controls {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: $size-16;

		@include responsive(phone) {
			flex-direction: column;
			align-items: flex-start;
		}
	}

	& .notes-footer__checkbox {
		display: flex;
		align-items: center;
		gap: $size-8;
		cursor: pointer;
		user-select: none;

		& input[type="checkbox"] {
			width: 18px;
			height: 18px;
			cursor: pointer;
			accent-color: $color-pri;
		}

		& span {
			font-size: $size-14;
			color: $color-g-21;
		}
	}

	& .notes-footer__templates {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: $size-8;
		padding-bottom: $size-16;
		margin-bottom: $size-16;
		border-bottom: 1px solid $color-g-90;

		& label {
			font-size: $size-14;
			font-weight: $fw-medium;
			color: $color-g-21;
		}
	}
}

.notes-auto-save-info {
	font-size: $size-14;
	color: $color-g-44;
	margin-bottom: $size-12;
	padding: $size-8 $size-12;
	background: rgba($color-pri, 0.05);
	border-radius: $size-4;
	border-left: 3px solid $color-pri;
}
.notes-desktop {
	@include responsive(tab-portrait) {
		display: none !important;
	}
}
.notes-container-modal {
	display: none !important;

	@include responsive(tab-portrait) {
		display: flex !important;
	}
}

:deep(.chat-container) {
	width: 100%;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	border-left: 1px solid $color-g-90;
	padding-left: $size-44;
	padding-bottom: 100px;

	@include responsive(tab-portrait) {
		border-left: 0;
		padding-left: 0;
		padding-bottom: 0;
		height: 100vh;
	}

	& .chat-content {
		width: 100%;
		height: 90%;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		gap: $size-32;

		& .chat-content__header {
			display: flex;
			justify-content: flex-start;
			border-bottom: 1px solid $color-g-90;
			padding-bottom: $size-8;

			& .chat-content__header--heading {
				font-weight: $fw-semi-bold;
				font-size: $size-36;
				line-height: 54px;
				color: $color-black;
			}
		}
		& .chat-content__body {
			display: flex;
			flex-direction: column;
			align-items: flex-start;
			gap: $size-24;
			overflow: scroll;

			& .chat-mine {
				justify-content: flex-end;
			}

			& .chat-content__body--chat {
				display: flex;
				gap: $size-4;
				width: 100%;

				& .chat-content__body--message {
					padding: $size-16;
					border-radius: $size-8;
					color: $color-black;
					font-size: $size-16;
					line-height: 24px;
					width: 80% !important;
					background: $color-pri-t5;
					word-break: break-all;
				}
				& .chat-mine {
					background: $color-sec-t4;
				}
			}
			
		}
	}
}
:deep(.chat-footer) {
	width: 100%;
	display: flex;
	justify-content: flex-start;
	align-items: center;
	gap: $size-16;
	border-top: 1px solid $color-g-90;
	padding-top: $size-16;

	@include responsive(tab-portrait) {
		border-top: 0;
		padding-top: 0;
	}

	& .chat-footer__message-box {
		width: 100%;
	}
	& .chat-footer__send-button {
		background: $color-sec-s2;
		border-radius: 100%;
		width: 48px;
		height: 48px;
		padding: $size-12;
		cursor: pointer;

		& :deep(path)  {
			color: $color-white;
		}

		&:hover {
			background: $color-sec-s1;
		}
		&:active {
			background: $color-sec-s3;
		}
	}
}
.chat-desktop {
	@include responsive(tab-portrait) {
		display: none !important;
	}
}
.chat-container-modal {
	display: none !important;

	@include responsive(tab-portrait) {
		display: flex !important;
	}
}
.meeting-container {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	align-items: center;
	gap: $size-32;
	padding-bottom: 100px;

	& .meeting-view {
		background: $color-g-21;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		border-radius: $size-24;
		padding: $size-32;
		position: relative;

		& .meeting-view__patient-name {
			color: $color-white;
			font-size: $size-16;
			line-height: $size-24;
			position: absolute;
			top: 32px;
			left: 32px;
		}
		& .meeting-view__patient-avatar {
			position: relative;
			display: flex;
			justify-content: center;
			align-items: center;
	
			color: $color-white;
			font-size: $size-72;
			line-height: $size-72;
			font-weight: $fw-semi-bold;
			background: $color-sec-s1;
			border-radius: 100%;
			width: 10rem;
			height: 10rem;
		}
	}
	& .meeting-actions {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: $size-32;

		@include responsive(phone) {
			gap: $size-16;
			flex-wrap: wrap;
		}

		& .meeting-actions__action {
			background: $color-white;
			border-radius: 100%;
			width: 3.5rem;
			height: 3.5rem;
			padding: $size-16;
			cursor: pointer;
			color: red !important;

			&:hover {
				background: $color-g-90;
			}
		}
		& .notes-is-open {
			border: 1px solid $color-sec-t3;
			fill: $color-sec-t3;

			&:hover {
				background: transparent;
			}
		}
		& .chat-is-open {
			border: 1px solid $color-sec-t3;
			stroke: $color-sec-t3 !important;
			fill: $color-sec-t3 !important;

			&:hover {
				background: transparent;
			}
		}
		& .close-meeting-btn {
			background: $color-ter-error;
			stroke: $color-white;
			rotate: 140deg;

			&:hover {
				stroke: $color-white;
				background: $color-pri-s1;
			}
		}

		& .video-btn {
			background: $color-ter-error;
			stroke: $color-white;
			fill: $color-white;
			color: $color-white;

			&:hover {
				stroke: $color-white;
				background: $color-pri-s1;
			}
		}
		& .is-mic-muted {
			background: $color-ter-error;
			stroke: $color-white;

			&:hover {
				stroke: $color-white;
				background: $color-pri-s1;
			}
		}
	}
}
</style>

<style scoped lang="scss">
.loader-container {
	width: 100%;
	height: 100%;
}
.details-container {
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	height: 100%;
	min-width: 30%;
	max-width: 30%;
	border-right: 1px solid $color-g-90;
	padding-right: $size-44;
	height: 100%;
	overflow-y: scroll;
	padding-bottom: 100px;

	@include responsive(tab-portrait) {
		min-width: 100%;
		max-width: 100%;
		border-right: 0;
		padding-right: 0;
		padding-bottom: 20px;
	}
}
.top_container {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	gap: $size-20;
}
.header {
	display: flex;
	justify-content: space-between;
	align-items: center;

	.heading {
		font-weight: $fw-semi-bold;
		font-size: $size-28;
		color: $color-black;
	}
	.close-container {
		cursor: pointer;
	}
}
.spacialist-details__container {
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	gap: $size-32;

	.spacialist_details {
		display: flex;
		flex-direction: column;
		gap: $size-20;

		.specialist_details-heading {
			font-weight: $fw-regular;
			font-size: $size-14;
			color: $color-g-44;
			border-bottom: $size-1 solid $color-g-90;
			padding-bottom: $size-5;
		}
	}
	.specialist-details__actions {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: $size-8;

		.specialist-details__actions--diagnosis {
			background: $color-white;
			border: $size-1 solid $color-pri;
		}
		.specialist-details__actions--history {}
	}
	.specialist-details__health_info {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;

		.specialist-details__health_info--items {
			display: flex;
			flex-direction: column;
			justify-content: flex-start;
			gap: $size-8;

			.specialist-details__health_info--item {
				display: flex;
				justify-content: flex-start;
				align-items: center;
				gap: $size-8;

				.specialist-details__health_info--item-key {
					font-size: $size-16;
					font-weight: $fw-regular;
					color: $color-g-44;
				}
				.specialist-details__health_info--item-value {
					font-size: $size-16;
					font-weight: $fw-regular;
					color: $color-g-21;
				}
			}

			
		}
	}
	.specialist_details-container {
		display: flex;
		justify-content: start;
		align-items: flex-start;
		gap: $size-20;

		.specialist_details-avatar {
			width: 60px;
			height: 60px;
			border-radius: 50%;

			img {
				width: 60px;
				height: 60px;
				border-radius: 50%;
			}
		}
	}
	.specialist_details-info-container {
		display: flex;
		flex-direction: column;
		justify-content: start;
		align-items: flex-start;
		gap: $size-5;

		.specialist_details-info {
			display: flex;
			justify-content: start;
			align-items: flex-start;
			gap: $size-10;

			.specialist_details-name {
				font-weight: $fw-semi-bold;
				font-size: $size-26;
				color: $color-black;
			}
			.specialist_details-rating-container {
				display: flex;
				justify-content: start;
				align-items: center;
				gap: $size-5;

				.specialist_details-rating {
					font-size: $size-12;
					font-weight: $fw-regular;
					color: $color-g-44;
				}
			}
		}
		.specialist-details__patient {
			display: flex;
			justify-content: flex-start;
			align-items: center;
			gap: $size-32;

			.specialist_details-spacialty {
				font-size: $size-16;
				font-weight: $fw-regular;
				color: $color-g-21;
			}
		}
	}
	.specialist_appointment_details {
		display: flex;
		flex-direction: column;
		gap: $size-10;

		.specialist_appointment_details-body{
			display: flex;
			flex-direction: column;
			justify-content: start;
			align-items: start;
			gap: $size-8;
		}
		.specialist_appointment_details-heading {
			font-weight: $fw-regular;
			font-size: $size-14;
			color: $color-g-44;
			border-bottom: $size-1 solid $color-g-90;
			padding-bottom: $size-5;
		}
		.specialist_appointment_details-container {
			display: flex;
			justify-content: start;
			align-content: center;
			gap: $size-10;

			.specialist_appointment_details-title {
				font-size: $size-16;
				font-weight: $fw-regular;
				color: $color-g-44;
			}
			.specialist_appointment_details-value {
				font-size: $size-16;
				font-weight: $fw-regular;
				color: $color-g-21;
			}
		}
	}
}
.appointment_actions {
	display: flex;
	justify-content: space-between;
	align-items: center;

	.reschedule_action {
		font-weight: $fw-regular;
		font-size: $size-16;
		color: $color-pri-main;
		padding: $size-6 $size-10;
		border-radius: $size-8;
		cursor: pointer;
		&:hover {
			background: $color-pri-t4;
		}
	}
}
</style>
