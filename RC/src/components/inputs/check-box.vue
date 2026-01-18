<template>
	<label :for="identity" class="input fs-14 fw-regular lh-125 ls-2" :class="className">
		<input
			type="checkbox"
			:id="identity"
			:name="Name"
			:checked="modelValue"
			@change="$emit('update:modelValue', $event.target.checked)"
		/>
		<div class="input__check-box"></div>
		<slot />
	</label>
</template>

<script>
export default {
	name: "CheckBox",

	data() {
		return {
			identity: this.id ? this.Id : this.Name,
		};
	},

	props: {
		Name: {
			type: String,
			required: true,
		},
		Id: {
			type: String,
			required: false,
		},
		label: {
			type: String,
			required: true,
		},
		className: {
			type: String,
			default: '',
		},
		modelValue: Boolean,
	},
};
</script>

<style scoped lang="scss">
input {
	display: none;

	&:checked + .input__check-box::after {
		content: "";

		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);

		width: 65%;
		height: 65%;
		background-color: $color-pri;
	}
}
.input {
	display: flex;
	align-items: flex-start;
	gap: $size-8;
	cursor: pointer;

	&__check-box {
		flex-shrink: 0;
		display: block;
		position: relative;
		// margin-top: $size-2;

		width: 16px;
		height: 16px;

		border-radius: $size-4;
		border: 1px solid $color-pri;
	}
}
</style>
