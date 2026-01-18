<template>
    <div class="root">
        <top-bar type="title-only" title="Active Appointment" @open-side-nav="$emit('openSideNav')" />
		<loader v-if="isLoading" :useOverlay="false" style="position: relative" />
        <div v-else class="container">
			<div class="meetings-root">
				<div class="meeting-container">
					<div class="meeting-view">
						<loader v-if="true" :useOverlay="false" style="z-index:1000" />
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

				<div v-if="isOpenNotes" class="notes-container">
					<div class="notes-content">
						<div class="notes-content__header">
							<h2 class="notes-content__header--heading">Notes</h2>
						</div>
						<div class="notes-content__body">
							<template v-for="item in meetingNotes" :key="item">
								<div class="notes-content__body--note">
									<p class="notes-content__body--message">{{ item.note }}</p>
									<p class="notes-content__body--timestamp">{{ item.timestamp }}</p>
								</div>
							</template>
						</div>
					</div>
					<div class="notes-footer">
						<rc-textarea
							placeholder="Type note here"
							v-model="newNote"
						/>
						<rc-button
							size="small"
							type="primary"
							label="Save"
							@click="onSaveNotes"
						/>
					</div>
				</div>

				<div v-if="isOpenChat" class="chat-container">
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
</template>

<script setup>
import { format } from "date-fns";
import { useRoute } from 'vue-router';
import { defineComponent, ref, inject, onMounted, watch } from 'vue';
import TopBar from "@/components/Navigation/top-bar";
import Loader from "@/components/Loader/main-loader";
import RcIcon from "@/components/RCIcon";
import RcButton from "@/components/buttons/button-primary";
import Avatar from "@/components/Avatars/avatar-fixed";
import RcTextarea from "@/components/inputs/textarea";
import RcText from "@/components/inputs/text";
import { mapGetters } from "@/utilities/utilityStore";

const $http = inject('$http');
const { userprofile } = mapGetters();
const route = useRoute();

const isMicMute = ref(false);
const isCameraOn = ref(false);
const isOpen = ref(false);
const isOpenNotes = ref(false);
const isOpenChat = ref(false);
const isFetching = ref(false);
const isLoading = ref(true);
const profile = ref({});
const meetingNotes = ref([]);
const chatMessages = ref([]);
const newNote = ref();
const message = ref();

onMounted(() => {
	(async (patientId) => {
		await $http.$_getOneUser(patientId).then(({ data }) => {
			profile.value = data.data.profile;
			isLoading.value = false;
		});
	})(route.params.specialistId);
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

const onSaveNotes = () => {
	meetingNotes.value.push({
		note: newNote.value,
		timestamp: format(new Date(), 'h:mm a')
	});
	newNote.value = null;
}

const onOpenNotes = () => {
	isOpenNotes.value = !isOpenNotes.value;
	isOpenChat.value = false;
}

const onOpenChat = () => {
	isOpenChat.value = !isOpenChat.value;
	isOpenNotes.value = false;
}

</script>
<style scoped lang="scss">
.root {
    width: 100%;
	height: 100%;
}
.container {
	width: 100%;
	height: 100%;
	display: flex;
	justify-content: flex-start;
	gap: $size-32;
	padding: $size-32 $size-56;
}
.meetings-root {
	width: 100%;
	height: 100%;
	display: flex;
	justify-content: flex-start;
	gap: $size-32;
}
.notes-container {
	width: 50%;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	border-left: 1px solid $color-g-90;
	padding-left: $size-44;
	padding-bottom: 100px;

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
			justify-content: flex-start;
			border-bottom: 1px solid $color-g-90;
			padding-bottom: $size-8;

			& .notes-content__header--heading {
				font-weight: $fw-semi-bold;
				font-size: $size-36;
				line-height: 54px;
				color: $color-black;
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
				}
				& .notes-content__body--timestamp {
					color: $color-g-44;
					font-size: $size-14;
					line-height: 18px;
					text-align: right;
				}
			}
		}
	
	}
	& .notes-footer {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		justify-content: flex-start;
		gap: $size-16;
		border-top: 1px solid $color-g-90;
		padding-top: $size-16;

		& :deep(textarea) {
			height: 88px;
		}
	}
}
.chat-container {
	width: 50%;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	border-left: 1px solid $color-g-90;
	padding-left: $size-44;
	padding-bottom: 100px;

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
	& .chat-footer {
		width: 100%;
		display: flex;
		justify-content: flex-start;
		align-items: center;
		gap: $size-16;
		border-top: 1px solid $color-g-90;
		padding-top: $size-16;

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
