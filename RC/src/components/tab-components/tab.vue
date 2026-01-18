<template>
	<div v-show="isSelected" class="tab__content">
		<slot />
	</div>
</template>

<script>
export default {
	name: "Tab Content",

	props: {
		isSelected: Boolean,
	},
};
</script>

<style scoped lang="scss">
.tab__content {
	@include flexItem(vertical) {
		gap: $size-48;
		padding: $size-32 $size-24 $size-32 $size-24;
		flex-grow: 1;
		overflow-x: hidden;
		overflow-y: auto;
		height: 100%;

		@include scrollBar(normal);

		@include responsive(tab-portrait) {
			padding-right: $size-4;
			padding-left: $size-4;

			@include scrollBar(reset);
		}
	}
}
</style>
