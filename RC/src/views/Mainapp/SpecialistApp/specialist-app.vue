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

	mounted() {
		// Remove height/overflow locks from ancestors so pages use native browser scroll
		document.documentElement.style.height = 'auto';
		document.documentElement.style.overflow = 'visible';
		document.body.style.height = 'auto';
		document.body.style.overflow = 'visible';
		const app = document.getElementById('app');
		if (app) app.style.height = 'auto';
	},

	beforeUnmount() {
		// Restore defaults for non-specialist pages
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
	display: flex;
	flex-direction: row;
	width: 100%;
	min-height: 100vh;
	background-color: #F8FAFC;
}

.content {
	flex: 1;
	min-width: 0;
	background-color: #F8FAFC;
	border-right: $size-1 solid $color-g-85;

	@include responsive(phone) {
		border-right: none;
	}

	@media (max-width: 767px) {
		background-color: white;
		border-right: none;
		padding: 0 !important;
		margin: 0 !important;
	}
}
</style>
