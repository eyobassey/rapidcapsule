<template>
	<div class="message" :class="type">
		<p class="fs-12 fw-regular lh-125 align-center">{{ message }}</p>
	</div>
</template>

<script>
export default {
	name: "messageAlert",

	props: {
		message: {
			type: String,
			required: true,
		},
		type: {
			type: String,
			require: true,
			default: "error",
		},
	},
	computed: {
		typeStyle() {
			return this.type;
		},
	},
};
</script>

<style scoped lang="scss">
.message {
	width: 100%;
	padding: 8px 16px;
	border-radius: 8px;
}

.error {
	background-color: $color-denote-red-light;
	margin-left: $size-0;

	& > p {
		color: $color-denote-red;
	}
}
</style>
