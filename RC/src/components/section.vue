<template>
	<div class="section">
		<div class="section__head">
			<p class="section__head--title">{{ title }}</p>
			<Button
				v-if="hasButton"
				type="text-secondary"
				:label="label"
				size="medium"
				:iconLeft="iconLeft"
				:iconName="icon"
				@click="$emit('handleAction')"
			/>
		</div>
		<slot />
	</div>
</template>

<script>
import Button from "../components/buttons/button-primary.vue";

export default {
	name: "Content Section",

	emits: ["handleAction"],

	components: {
		Button,
	},

	props: {
		title: {
			type: String,
			required: true,
		},
		hasButton: {
			type: Boolean,
			default: false,
		},
		icon: String,
		iconLeft: Boolean,
		label: String,
	},
};
</script>

<style lang="scss" scoped>
.section {
	@include flexItem(vertical) {
		gap: $size-24;
		width: 100%;
	}

	&__head {
		@include flexItem(horizontal) {
			justify-content: space-between;
			align-items: center;
			width: 100%;
			padding: $size-10 $size-0;

			&--title {
				font-size: $size-16;
				font-weight: $fw-regular;
				line-height: 1.5;
				letter-spacing: 0.02em;
				color: $color-g-67;
			}
		}
	}
}
</style>
