<template>
	<div class="segment__content" v-show="isSelected">
		<slot />
	</div>
</template>

<script>
export default {
	name: "Segment Content",

	props: {
		isSelected: Boolean,
	},
};
</script>

<style scoped lang="scss">
.segment__content {
	padding: $size-0 $size-8;
	overflow: auto;
	height: 100%;
}
</style>
