<template>
	<div class="page-content">
		<TopBar type="title-only" title="Appointments" @open-side-nav="$emit('openSideNav')" />
		<div class="page-content__body"></div>
	</div>
</template>

<script>
import TopBar from "@/components/Navigation/top-bar.vue";

export default {
	name: "Appointments",

	emits: ["openSideNav"],

	components: {
		TopBar,
	},
};
</script>

<style scoped lang="scss">
.page-content {
	@include flexItem(vertical) {
		gap: $size-12;
		width: 100%;
		height: 100vh;
	}

	&__body {
		@include flexItem(vertical) {
			width: 100%;
			height: 100%;
			overflow-y: scroll;
			padding: $size-0 $size-48;
		}

		&::-webkit-scrollbar {
			display: none;
			width: $size-12;
			background-color: $color-g-92;
		}
	}
}
</style>
