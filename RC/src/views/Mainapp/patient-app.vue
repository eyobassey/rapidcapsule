<template>
	<div class="main-wrapper">
		<SideNav :class="{ open: navOpen }" @closeSideNav="navOpen = false" />
		<div class="content-wrapper">
			<div class="content">
				<router-view @open-side-nav="navOpen = true"> </router-view>
			</div>
		</div>
		<RightPane />
	</div>
</template>

<script>
import SideNav from "@/components/Navigation/side-nav.vue";
import RightPane from "@/components/Navigation/Right-pane/pane-dock.vue";

export default {
	name: "Main App",

	components: {
		SideNav,
		RightPane,
	},

	data() {
		return {
			navOpen: false,
			paneOpen: false,
		};
	},

	mounted() {
		// Lock ancestors to viewport so only .content scrolls (keeps sidebar fixed)
		document.documentElement.style.height = '100%';
		document.documentElement.style.overflow = 'hidden';
		document.body.style.height = '100%';
		document.body.style.overflow = 'hidden';
		const app = document.getElementById('app');
		if (app) app.style.height = '100%';
	},

	beforeUnmount() {
		// Restore defaults for non-patient pages
		document.documentElement.style.height = '';
		document.documentElement.style.overflow = '';
		document.body.style.height = '';
		document.body.style.overflow = '';
		const app = document.getElementById('app');
		if (app) app.style.height = '';
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
		height: 100vh;
		overflow: hidden;
		width: 100%;
	}
}

.content-wrapper {
	display: flex;
	flex-direction: column;
	flex-grow: 1;
	height: 100%;
	min-width: 10%;
	overflow: hidden;
}

.content {
	@include flexItem(horizontal) {
		justify-content: center;
		flex-grow: 1;
		background-color: $color-g-97;
		border-right: $size-1 solid $color-g-85;
		height: 100%;
		overflow-x: hidden;
		overflow-y: auto;

		@include responsive(phone) {
			border-right: none;
			justify-content: flex-start;
		}
	}
}
</style>
