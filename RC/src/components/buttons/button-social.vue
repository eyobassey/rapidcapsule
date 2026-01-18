<template>
	<div class="btn">
		<div v-if="provider == 'apple'" class="btn btn__extra btn__extra--apple">
			<Icons name="apple-logo" />
			Continue with Apple
		</div>

		<div v-if="provider == 'google'" class="btn btn__extra btn__extra--google">
			<Icons name="google-logo" />
			Continue with Google
		</div>
	</div>
</template>

<script>
import Icons from "@/components/icons.vue";

export default {
	name: "Social Sign-in/Sign-up Buttons",

	components: {
		Icons,
	},

	props: {
		provider: {
			type: String,
			default: "google",
		},
	},
};
</script>

<style lang="scss" scoped>
.btn {
	@include flexItem(horizontal) {
		align-items: center;
		justify-content: center;
		width: 100%;
		gap: $size-16;
		cursor: pointer;
	}

	&__extra {
		border-radius: 100vw;
		height: 3.571rem;
		font-size: $size-16;

		&--apple {
			background-color: black;
			color: white;
		}

		&--google {
			background-color: $color-white;
			border: 1px solid $color-g-77;
		}
	}
}
</style>
