<template>
	<div class="main-wrapper">
		<SideNav :class="{ open: navOpen }" @closeSideNav="navOpen = false" />
		<div class="content-wrapper">
			<div class="top-bar">
				<div class="top-bar__spacer"></div>
				<div class="top-bar__actions">
					<NotificationBell />
				</div>
			</div>
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
import NotificationBell from "@/components/Notifications/NotificationBell.vue";

export default {
	name: "Main App",

	components: {
		SideNav,
		RightPane,
		NotificationBell,
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

.content-wrapper {
	display: flex;
	flex-direction: column;
	flex-grow: 1;
	height: 100%;
	min-width: 10%;
	overflow: hidden;
}

.top-bar {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 8px 24px;
	background-color: #fff;
	border-bottom: 1px solid #e5e7eb;
	min-height: 56px;
	flex-shrink: 0;
	z-index: 10;

	@include responsive(phone) {
		padding: 8px 16px;
	}

	&__spacer {
		flex: 1;
	}

	&__actions {
		display: flex;
		align-items: center;
		gap: 12px;
	}
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
