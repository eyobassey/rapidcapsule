<template>
	<div class="flyout__content">
		<div class="flyout__content--header">
			<div class="title-group">
				<div class="collapse-icon" @click="$emit('collapse')">
					<icons name="chevron-right" id="collapse" />
					<icons name="times" id="close" />
				</div>
				<h3 class="sub-heading">Reminders</h3>
			</div>
			<div v-if="reminders.lenght" class="btn-group">
				<buttonIcon type="primary" iconName="plus" />
				<buttonIcon type="primary" iconName="cog-wheel" />
				<buttonIcon type="primary" iconName="list" />
			</div>
		</div>
		<div class="flyout__content--body">
			<div v-if="!reminders.length" class="empty">
				<buttonIcon type="primary" size="large" iconName="plus" />
				<p class="copy">Click to add a reminder</p>
			</div>
		</div>
	</div>
	<!-- <dialogModal v-show="openModal" title="Add Reminder" @closeModal="openModal = false">
		<template v-slot:body></template>
		<template v-slot:foot></template>
	</dialogModal> -->
</template>

<script>
import buttonIcon from "../../buttons/button-icon.vue";
import icons from "../../icons.vue";
import dialogModal from "../../modals/dialog-modal.vue";

export default {
	data() {
		return {
			openModal: false,
			reminders: [],
		};
	},

	components: {
		buttonIcon,
		icons,
		dialogModal,
	},

	emits: ["collapse"],
};
</script>

<style scoped lang="scss">
.flyout__content {
	display: flex;
	flex-direction: column;
	gap: $size-32;
	padding: $size-32;
	width: 100%;

	&--header {
		display: flex;
		gap: $size-24;

		.title-group {
			display: flex;
			align-items: center;
			gap: $size-4;
			flex-grow: 1;

			.collapse-icon {
				padding: $size-10;
				cursor: pointer;

				#collapse {
					@include responsive(tab-landscape) {
						display: none;
					}
				}

				#close {
					display: none;

					@include responsive(tab-landscape) {
						display: block;
					}
				}
			}

			.sub-heading {
				color: $color-black;
			}
		}

		.btn-group {
			display: flex;
			gap: $size-16;
		}
	}

	&--body {
		@include flexItem(vertical) {
			flex-grow: 1;
		}

		.empty {
			@include flexItem(vertical) {
				flex-grow: 1;
				align-items: center;
				justify-content: center;
				gap: $size-24;
			}
		}
	}
}
</style>
