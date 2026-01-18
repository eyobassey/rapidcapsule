<template>
	<div class="input__container">
		<div class="input">
			<input
				type="text"
				id="search-input"
				name="search-input"
				:placeholder="placeholder"
				class="input__field"
				:value="modelValue"
				@input="$emit('update:modelValue', $event.target.value)"
			/>
			<div class="icon" @click="modelValue = ''">
				<Icons v-if="!modelValue" name="search" class="icon" />
				<Icons v-else name="times" class="icon"  />
			</div>
		</div>
	</div>
</template>

<script>
import Icons from "../icons.vue";

export default {
	name: "Search Input",

	data() {
		return {};
	},

	props: {
		modelValue: String,
		placeholder: {
			type: String,
			required: true,
		},
	},

	components: {
		Icons,
	},
};
</script>

<style scoped lang="scss">
.input {
	position: relative;
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: $size-8;
	border-radius: $size-8;
	border: 1px solid $color-g-54;
	padding: $size-10 $size-16;
	width: 100%;
	height: $size-44;

	&:focus {
		border: $size-1 solid $color-pri-t2;
	}

	&__field {
		width: 100%;
		height: 100%;
		// padding: $size-10 $size-16;

		// border-radius: $size-8;
		// border: 1px solid $color-g-54;

		font-family: inherit;
		font-size: $size-16;
		font-weight: $fw-regular;
		color: $color-g-44;
		line-height: 1.5;
		letter-spacing: 0.02em;

		border: none;
		outline: none;
		box-shadow: none;

		// &:focus {
		// 	border: $size-1 solid $color-pri-t2;
		// }
	}

	.icon {
		position: absolute;
		top: 50%;
		right: $size-16;
		transform: translateY(-50%);
		cursor: pointer;
	}
}
</style>
