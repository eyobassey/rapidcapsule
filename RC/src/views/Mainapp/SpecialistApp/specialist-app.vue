<template>
	<div class="main-wrapper">
		<SideNav :class="{ open: navOpen }" @closeSideNav="navOpen = false" />
		<div class="content">
			<router-view @open-side-nav="navOpen = true"> </router-view>
		</div>
	</div>
</template>

<script>
import SideNav from "./Navigation/side-nav.vue";
export default {
	name: "Main App",

	components: {
		SideNav,
	},

	data() {
		return {
			navOpen: false,
			paneOpen: false,
		};
	},

	methods: {
		setState(state) {
			this.paneOpen = true;
		},
	},
};
</script>

<style scoped lang="scss">
.main-wrapper {
	display: flex;
	flex-direction: row;
	height: 100vh;
	width: 100%;
	overflow: hidden;
}

.content {
	flex: 1;
	display: flex;
	flex-direction: column;
	background-color: $color-g-97;
	border-right: $size-1 solid $color-g-85;
	height: 100vh;
	width: 100%;
	overflow-y: auto;
	overflow-x: hidden;

	@include responsive(phone) {
		border-right: none;
	}

	// Mobile: white background, no padding
	@media (max-width: 767px) {
		background-color: white;
		border-right: none;
		padding: 0 !important;
		margin: 0 !important;
	}
}

// Mobile overrides
@media (max-width: 767px) {
	.main-wrapper {
		overflow: visible;
	}

	.content {
		padding: 0 !important;
		margin: 0 !important;
		background: white !important;
		overflow-y: auto;
	}
}
</style>
