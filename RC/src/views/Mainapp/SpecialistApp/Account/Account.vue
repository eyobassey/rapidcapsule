<template>
	<div class="page-content">
		<top-bar
			showButtons
			type="title-only"
			title="Account"
			@open-side-nav="$emit('openSideNav')"
		>
			<template v-slot:btns>
				<div class="btn-group">
					<button-icon
						type="primary"
						iconName="log-out"
						color="#D81818"
						@click="onLoggedOut"
					/>
				</div>
			</template>
		</top-bar>
		<div class="page-content__body">
			<div class="tabs-container">
				<rc-tab
					:tabs="tabs"
					:currentTab="currentTab"
					@onClick="$tab => currentTab = $tab"
				/>
				<div class="tabs-container__content">
					<t-profile  v-if="currentTab === 'profile'" />
					<t-preference v-if="currentTab === 'preference'" />
					<t-wallet v-if="currentTab === 'wallet'" />
					<t-earnings  v-if="currentTab === 'earnings'" />
					<t-security  v-if="currentTab === 'security'" />
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import TopBar from "@/components/Navigation/top-bar";
import ButtonIcon from "@/components/buttons/button-icon";
import RcTab from "@/components/RCTab";

import TProfile from "./TProfile";
import TSecurity from "./TSecurity";
import TEarnings from "./TEarnings";
import TPreference from "./TPreference";
import TWallet from "./TWallet";

const currentTab = ref('profile');
const tabs = ref([
	{ title: 'Profile', value: 'profile' },
	{ title: 'Availability & Appointment  Preferences', value: 'preference' },
	{ title: 'Wallet', value: 'wallet' },
	{ title: 'Earnings & Payouts', value: 'earnings' },
	{ title: 'Security', value: 'security' },
]);

const onLoggedOut = () => {
	localStorage.clear();
	sessionStorage.clear();
	window.location = "/logged-out";
}

</script>

<style scoped lang="scss">
.page-content {
	display: flex;
	flex-direction: column;
	gap: $size-32;
	max-width: 82.67rem;
	flex-grow: 1;
	height: 100vh;

	@include responsive(tab-landscape) {
			min-height: 100vh;
	}
	@include responsive(tab-portrait) {
		width: 100%;
		gap: $size-4;
	}

	&__body {
		display: flex;
		flex-direction: column;
		gap: $size-26;
		width: 100%;
		height: 100%;
		overflow-y: scroll;
		padding: $size-0 $size-48;

		@include responsive(phone) {
			padding: $size-12 $size-28;
		}

		&::-webkit-scrollbar {
			display: none;
			width: 12px;
			background-color: $color-g-97;
		}
	}
}
.tabs-container {
	width: 100%;
	height: 100%;

	@include responsive(phone) {
		width: 100%;
	}
	& .default-tabs {
		display: flex;
		overflow-x: scroll;
		white-space: nowrap;
		
		&::-webkit-scrollbar {
			display: none;
			width: 12px;
		}

	}

	& .tabs-container__content {
		height: 100%;
		width: 100%;
		padding: $size-32 $size-0;
	}
}
</style>
