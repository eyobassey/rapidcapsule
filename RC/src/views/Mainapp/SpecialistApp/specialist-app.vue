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
	@include flexItem(horizontal) {
		height: 100%;
		overflow: hidden;
		width: 100%;
	}
}

.content {
	@include flexItem(horizontal) {
		justify-content: center;
		flex-grow: 1;
		background-color: $color-g-97;
		border-right: $size-1 solid $color-g-85;
		height: 100%;
		min-width: 10%;

		@include responsive(phone) {
			border-right: none;
		}
	}
}
</style>
