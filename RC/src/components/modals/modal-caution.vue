<template>
	<div class="overlay">
		<div class="modal card-shadow">
			<div class="modal__header">
				<h2 class="modal__header--title">{{ title }}</h2>
				<div class="btn__close" @click="$emit('closeModal')">
					<Icons class="btn__close--icon" name="times" />
				</div>
			</div>
			<div class="modal__body">
				<slot name="body"></slot>
			</div>
			<div v-show="hasFooter" class="modal__footer">
				<slot name="foot"></slot>
			</div>
			<slot name="loader" />
		</div>
	</div>
</template>

<script>
import Icons from "../icons.vue";

export default {
	props: {
		title: {
			type: String,
			required: true,
		},
		hasFooter: {
			type: Boolean,
			default: false,
		},
	},

	emits: ["closeModal"],

	components: {
		Icons,
	},
};
</script>

<style scoped lang="scss">
.overlay {
	@include flexItem(horizontal) {
		justify-content: center;
		align-items: center;

		position: fixed;
		top: 0;
		left: 0;

		width: 100vw;
		height: 100vh;
		background-color: rgba($color-black, 0.5);
		z-index: 100;

		animation: fade 300ms ease-out;
	}

	@include responsive(phone) {
		align-items: flex-end;
	}
}

.modal {
	@include flexItem(vertical) {
		position: relative;
		background-color: $color-white;
		border-radius: $size-24;
		max-width: 25%;
		overflow: hidden;

		animation: modal 0.4s cubic-bezier(0.03, 0.89, 0.58, 0.99) 150ms;
		animation-fill-mode: backwards;

		@include responsive(tab-landscape) {
			max-width: 65%;
			border-radius: $size-15;
		}

		@include responsive(tab-portrait) {
			max-width: 85%;
			border-radius: $size-15;
		}

		@include responsive(phone) {
			max-width: 100%;
			max-height: 95%;
			width: 100vw;
			box-shadow: none;
			border-radius: $size-16 $size-16 $size-0 $size-0;

			animation: modal_phone 0.4s cubic-bezier(0.03, 0.89, 0.58, 0.99) 150ms;
			animation-fill-mode: backwards;
		}
	}

	&__header {
		@include flexItem(horizontal) {
			align-items: center;
			gap: $size-32;
		}
		width: 100%;
		padding: $size-0 $size-0 $size-0 $size-32;

		@include responsive(phone) {
			padding-left: $size-24;
		}

		&--title {
			width: 100%;
			font-size: $size-16;
			font-weight: $fw-medium;
		}

		.btn__close {
			@include flexItem(horizontal) {
				align-items: center;
				justify-content: center;
				border-top-right-radius: $size-24;
				padding: $size-16;

				@include responsive(tab-landscape) {
					border-top-right-radius: $size-15;
				}

				@include responsive(tab-portrait) {
					border-top-right-radius: $size-15;
				}

				@include responsive(phone) {
					border-top-right-radius: $size-16;
				}

				&:hover {
					background-color: $color-pri-t4;
				}

				&--icon {
					fill: $color-denote-red;
					width: $size-20;
					height: $size-20;
					cursor: pointer;
				}
			}
		}
	}

	&__body {
		flex-grow: 1;
		padding: $size-16 $size-24 $size-24 $size-24;
		margin: $size-0 $size-4;

		@include responsive(phone) {
			padding: $size-8;
			margin: $size-0;
			min-width: 100%;
		}

		& > *:nth-child(2) {
			width: 100%;
		}
	}

	&__footer {
		@include flexItem(horizontal) {
			gap: $size-16;
			justify-content: space-between;
			align-items: center;

			padding: $size-18 $size-24 $size-18 $size-24;

			@include responsive(phone) {
				@include flexItem(vertical);
				padding: $size-32 $size-24 $size-48 $size-24;
			}
		}
	}
}

@keyframes modal_phone {
	0% {
		transform: translateY(100%);
		opacity: 0;
	}
	20% {
		opacity: 1;
	}
	100% {
		transform: translateY(0);
	}
}

@keyframes modal {
	0% {
		transform: translateY(35%);
		opacity: 0;
	}
	25% {
		opacity: 0;
	}
	85% {
		opacity: 1;
	}
	100% {
		transform: translateY(0);
	}
}

@keyframes fade {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}
</style>
