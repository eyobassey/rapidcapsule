<template>
	<div class="overlay">
		<div class="modal card-shadow">
			<div class="btn__close" @click="$emit('closeModal')">
				<Icons class="btn__close--icon" name="times" />
			</div>
			<div class="modal__body">
				<slot name="body"></slot>
			</div>
			<slot name="loader" />
		</div>
	</div>
</template>

<script>
import Icons from "../icons.vue";

export default {
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
		padding: $size-48 $size-8 $size-8 $size-8;

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

	.btn__close {
		@include flexItem(horizontal) {
			position: absolute;
			top: 0;
			right: 0;
			align-items: center;
			justify-content: center;
			border-top-right-radius: $size-24;
			padding: $size-16;
			cursor: pointer;

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
				width: $size-24;
				height: $size-24;
			}
		}
	}

	&__body {
		flex-grow: 1;
		padding: $size-20 $size-16;
		overflow-y: auto;
		margin: $size-0 $size-4;

		&::-webkit-scrollbar {
			width: $size-8;
		}

		&::-webkit-scrollbar-track {
			border-radius: 100vw;
			background-color: $color-g-97;
			margin-block: $size-8;
		}
		&::-webkit-scrollbar-thumb {
			background-color: $color-g-90;
			border-radius: 100vw;
		}

		@include responsive(phone) {
			padding: $size-8;
			margin: $size-0;
			min-width: 100%;

			&::-webkit-scrollbar {
				display: block;
				width: $size-6;
				border-radius: 100vw;
				background-color: $color-g-90;
			}

			&::-webkit-scrollbar-thumb {
				background-color: $color-g-97;
				border-radius: 100vw;
			}
		}

		& > *:nth-child(2) {
			width: 100%;
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
