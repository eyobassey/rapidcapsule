<template>
	<div class="page-content">
		<top-bar showButtons type="title-only" title="Patients" @open-side-nav="$emit('openSideNav')" />

		<div class="page-content__body">
			<!-- Hero Banner -->
			<div class="hero-banner">
				<div class="hero-content">
					<div class="hero-text">
						<h1 class="hero-title">Your Patients</h1>
						<p class="hero-subtitle">Manage and review patient records in one place</p>
					</div>
				</div>

				<div class="hero-stats" v-if="stats">
					<div class="stat-item">
						<span class="stat-value">{{ stats.totalPatients || 0 }}</span>
						<span class="stat-label">Total Patients</span>
					</div>
					<div class="stat-divider"></div>
					<div class="stat-item">
						<span class="stat-value">{{ stats.thisMonthPatients || 0 }}</span>
						<span class="stat-label">This Month</span>
					</div>
					<div class="stat-divider"></div>
					<div class="stat-item">
						<span class="stat-value">{{ stats.thisWeekPatients || 0 }}</span>
						<span class="stat-label">This Week</span>
					</div>
					<div class="stat-divider"></div>
					<div class="stat-item starred">
						<span class="stat-value">
							<v-icon name="hi-solid-star" scale="0.7" class="star-icon" />
							{{ stats.starredPatients || 0 }}
						</span>
						<span class="stat-label">Starred</span>
					</div>
				</div>
			</div>

			<!-- Search Bar -->
			<div class="search-container">
				<div class="search-bar">
					<v-icon name="hi-search" scale="1" class="search-icon" />
					<input
						v-model="searchQuery"
						type="text"
						placeholder="Search patients by name, email, or phone..."
						@input="debouncedSearch"
					/>
					<button v-if="searchQuery" class="clear-btn" @click="clearSearch">
						<v-icon name="hi-x" scale="0.8" />
					</button>
				</div>
			</div>

			<!-- Filter Tabs -->
			<div class="tabs-navigation">
				<button
					v-for="tab in filterTabs"
					:key="tab.value"
					class="tab-btn"
					:class="{ active: activeFilter === tab.value }"
					@click="setFilter(tab.value)"
				>
					<v-icon :name="tab.icon" scale="0.9" />
					<span>{{ tab.label }}</span>
				</button>

				<div class="sort-dropdown">
					<select v-model="sortBy" @change="fetchPatients">
						<option value="last_visit">Last Visit</option>
						<option value="name">Name</option>
						<option value="appointments">Most Appointments</option>
					</select>
				</div>
			</div>

			<!-- Access Notice for All Patients -->
			<div v-if="activeFilter === 'all' && !accessAcknowledged" class="access-notice">
				<div class="notice-icon">
					<v-icon name="hi-information-circle" scale="1.2" />
				</div>
				<div class="notice-content">
					<h4>System-Wide Patient Search</h4>
					<p>You are viewing patients outside your appointment history. Access is logged for compliance purposes.</p>
				</div>
				<button class="acknowledge-btn" @click="acknowledgeAccess">
					I Understand
				</button>
			</div>

			<!-- Content Area -->
			<div class="content-area">
				<loader v-if="isLoading" :useOverlay="false" :style="{ backgroundColor: 'transparent' }" />

				<div v-else class="patients-list">
					<!-- Results Count -->
					<div v-if="patients.length" class="results-header">
						<span class="results-count">Showing {{ patients.length }} of {{ pagination.total }} patients</span>
					</div>

					<!-- Patient Cards -->
					<template v-if="patients.length">
						<div
							v-for="patient in patients"
							:key="patient._id"
							class="patient-card"
							@click="viewPatient(patient._id)"
						>
							<div class="card-main">
								<div class="patient-section">
									<div class="patient-avatar">
										<rc-avatar
											size="md"
											:firstName="patient.profile?.first_name || ''"
											:lastName="patient.profile?.last_name || ''"
											:modelValue="getProfileImage(patient)"
										/>
									</div>
									<div class="patient-info">
										<div class="name-row">
											<h3 class="patient-name">{{ getFullName(patient) }}</h3>
											<button
												class="star-btn"
												:class="{ starred: patient.isStarred }"
												@click.stop="toggleStar(patient)"
											>
												<v-icon :name="patient.isStarred ? 'hi-solid-star' : 'hi-star'" scale="0.9" />
											</button>
										</div>
										<p class="patient-contact">{{ getEmail(patient) }}</p>
										<div class="patient-meta">
											<span class="meta-badge gender" v-if="patient.profile?.gender">
												<v-icon name="hi-user" scale="0.7" />
												{{ patient.profile.gender }}
											</span>
											<span class="meta-badge age" v-if="patient.profile?.date_of_birth">
												<v-icon name="hi-calendar" scale="0.7" />
												{{ calculateAge(patient.profile.date_of_birth) }} yrs
											</span>
											<span
												v-if="patient.riskLevel"
												class="meta-badge risk"
												:class="getRiskClass(patient.riskLevel)"
											>
												{{ patient.riskLevel }}
											</span>
										</div>
									</div>
								</div>

								<div class="stats-section">
									<div class="stat-block">
										<span class="stat-number">{{ patient.stats?.totalAppointments || 0 }}</span>
										<span class="stat-text">Appointments</span>
									</div>
									<div class="stat-block">
										<span class="stat-number">{{ patient.stats?.prescriptionCount || 0 }}</span>
										<span class="stat-text">Prescriptions</span>
									</div>
									<div class="stat-block last-visit" v-if="patient.stats?.lastVisit">
										<span class="stat-number small">{{ formatLastVisit(patient.stats.lastVisit) }}</span>
										<span class="stat-text">Last Visit</span>
									</div>
								</div>
							</div>

							<div class="card-footer">
								<div class="footer-left">
									<span v-if="getPhone(patient)" class="phone-badge">
										<v-icon name="hi-phone" scale="0.7" />
										{{ getPhone(patient) }}
									</span>
								</div>
								<div class="footer-right">
									<button class="view-btn">
										<span>View Profile</span>
										<v-icon name="hi-chevron-right" scale="0.85" />
									</button>
								</div>
							</div>
						</div>
					</template>

					<!-- Empty State -->
					<template v-else>
						<div class="empty-state">
							<div class="empty-illustration">
								<v-icon name="hi-user-group" scale="4" class="empty-icon" />
							</div>
							<h2 class="empty-title">
								{{ getEmptyTitle }}
							</h2>
							<p class="empty-description">
								{{ getEmptyDescription }}
							</p>
						</div>
					</template>

					<!-- Pagination -->
					<div v-if="pagination.totalPages > 1" class="pagination">
						<button
							class="pagination-btn"
							:disabled="pagination.page === 1"
							@click="goToPage(pagination.page - 1)"
						>
							<v-icon name="hi-chevron-left" scale="0.9" />
							Previous
						</button>
						<span class="pagination-info">
							Page {{ pagination.page }} of {{ pagination.totalPages }}
						</span>
						<button
							class="pagination-btn"
							:disabled="pagination.page === pagination.totalPages"
							@click="goToPage(pagination.page + 1)"
						>
							Next
							<v-icon name="hi-chevron-right" scale="0.9" />
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, computed, onMounted, inject, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { debounce } from 'lodash';
import moment from 'moment';
import TopBar from "@/components/Navigation/top-bar";
import Loader from "@/components/Loader/main-loader";
import RcAvatar from "@/components/RCAvatar";

const props = defineProps({
	defaultFilter: {
		type: String,
		default: null,
	},
});

defineEmits(["openSideNav"]);

const $http = inject('$_HTTP');
const $toast = inject('$_TOAST');
const router = useRouter();
const route = useRoute();

// State
const isLoading = ref(false);
const searchQuery = ref('');
const activeFilter = ref('my_patients');
const sortBy = ref('last_visit');
const patients = ref([]);
const stats = ref(null);
const accessAcknowledged = ref(false);
const pagination = ref({
	page: 1,
	limit: 20,
	total: 0,
	totalPages: 0,
});

// Filter tabs configuration
const filterTabs = [
	{ value: 'my_patients', label: 'My Patients', icon: 'hi-user-group' },
	{ value: 'recent', label: 'Recent', icon: 'hi-clock' },
	{ value: 'starred', label: 'Starred', icon: 'hi-solid-star' },
	{ value: 'all', label: 'All Patients', icon: 'hi-globe-alt' },
];

// Computed
const getEmptyTitle = computed(() => {
	if (searchQuery.value) return 'No patients found';
	switch (activeFilter.value) {
		case 'starred': return 'No Starred Patients';
		case 'recent': return 'No Recent Patients';
		case 'all': return 'No Patients Found';
		default: return 'No Patients Yet';
	}
});

const getEmptyDescription = computed(() => {
	if (searchQuery.value) return 'Try adjusting your search criteria';
	switch (activeFilter.value) {
		case 'starred': return "You haven't starred any patients yet. Star patients for quick access.";
		case 'recent': return 'Your recent patient visits will appear here.';
		case 'all': return 'Search for any patient in the system.';
		default: return 'Patients you see in appointments will appear here.';
	}
});

// Methods
async function fetchPatients() {
	try {
		isLoading.value = true;
		const params = {
			filter: activeFilter.value,
			search: searchQuery.value || undefined,
			sort: sortBy.value,
			page: pagination.value.page,
			limit: pagination.value.limit,
		};
		const response = await $http.$_getSpecialistPatients(params);
		const result = response.data?.data || response.data;
		if (result) {
			patients.value = result.patients || [];
			pagination.value = {
				...pagination.value,
				total: result.total || 0,
				totalPages: result.totalPages || 0,
				page: result.page || 1,
			};
		}
	} catch (error) {
		console.error('Error fetching patients:', error);
		$toast?.error('Failed to load patients');
	} finally {
		isLoading.value = false;
	}
}

async function fetchStats() {
	try {
		const response = await $http.$_getSpecialistPatientStats();
		stats.value = response.data?.data || response.data;
	} catch (error) {
		console.error('Error fetching stats:', error);
	}
}

async function toggleStar(patient) {
	try {
		const newStarred = !patient.isStarred;
		await $http.$_togglePatientStar(patient._id, { starred: newStarred });
		patient.isStarred = newStarred;
		if (stats.value) {
			stats.value.starredPatients = newStarred
				? (stats.value.starredPatients || 0) + 1
				: Math.max(0, (stats.value.starredPatients || 0) - 1);
		}
		$toast.success(newStarred ? 'Patient starred' : 'Patient unstarred');
	} catch (error) {
		console.error('Error toggling star:', error);
		$toast.error('Failed to update star status');
	}
}

function setFilter(filter) {
	activeFilter.value = filter;
	pagination.value.page = 1;
	fetchPatients();
}

function clearSearch() {
	searchQuery.value = '';
	pagination.value.page = 1;
	fetchPatients();
}

function goToPage(page) {
	pagination.value.page = page;
	fetchPatients();
}

function acknowledgeAccess() {
	accessAcknowledged.value = true;
}

function viewPatient(patientId) {
	router.push(`/app/specialist/patients/${patientId}`);
}

function getFullName(patient) {
	if (patient.profile?.first_name && patient.profile?.last_name) {
		return `${patient.profile.first_name} ${patient.profile.last_name}`;
	}
	return getEmail(patient) || 'Unknown Patient';
}

function getEmail(patient) {
	return patient.profile?.contact?.email || patient.email || '';
}

function getPhone(patient) {
	const phone = patient.profile?.contact?.phone;
	if (phone?.number) {
		let countryCode = phone.country_code || '';
		// Ensure country code has + prefix but not double ++
		if (countryCode && !countryCode.startsWith('+')) {
			countryCode = '+' + countryCode;
		}
		return countryCode ? `${countryCode} ${phone.number}` : phone.number;
	}
	return patient.profile?.phone_number || '';
}

function getProfileImage(patient) {
	return patient.profile?.profile_image || patient.profile?.profile_photo || null;
}

function calculateAge(dateOfBirth) {
	if (!dateOfBirth) return 'N/A';
	return moment().diff(moment(dateOfBirth), 'years');
}

function formatLastVisit(date) {
	if (!date) return 'N/A';
	return moment(date).fromNow();
}

function getRiskClass(level) {
	if (!level) return '';
	const lower = level.toLowerCase();
	if (lower === 'high' || lower === 'emergency') return 'high';
	if (lower === 'medium') return 'medium';
	return 'low';
}

// Debounced search
const debouncedSearch = debounce(() => {
	pagination.value.page = 1;
	fetchPatients();
}, 300);

// Initialize
onMounted(() => {
	if (props.defaultFilter) {
		activeFilter.value = props.defaultFilter;
	}
	fetchPatients();
	fetchStats();
});

// Watch for prop changes
watch(() => props.defaultFilter, (newVal) => {
	if (newVal && newVal !== activeFilter.value) {
		activeFilter.value = newVal;
		pagination.value.page = 1;
		fetchPatients();
	}
});
</script>

<style scoped lang="scss">
.page-content {
	display: flex;
	flex-direction: column;
	width: 100%;
	height: 100%;
	padding: 0 256px;

	@include responsive(tab-portrait) {
		padding: 0;
	}

	&__body {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		overflow-y: auto;
		padding-bottom: 100px;

		&::-webkit-scrollbar {
			display: none;
		}
	}
}

// Hero Banner
.hero-banner {
	background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 50%, #0e7490 100%);
	border-radius: $size-24;
	padding: $size-32 $size-48;
	margin: $size-24 $size-48 $size-24;
	color: white;
	box-shadow: 0 10px 40px rgba(14, 174, 196, 0.3);

	@media (max-width: 768px) {
		margin: $size-16;
		padding: $size-24;
		border-radius: $size-16;
	}
}

.hero-content {
	margin-bottom: $size-24;
}

.hero-text {
	display: flex;
	flex-direction: column;
	gap: $size-8;
}

.hero-title {
	font-size: $size-28;
	font-weight: $fw-bold;
	margin: 0;

	@media (max-width: 768px) {
		font-size: $size-22;
	}
}

.hero-subtitle {
	font-size: $size-16;
	opacity: 0.9;
	margin: 0;

	@media (max-width: 768px) {
		font-size: $size-14;
	}
}

.hero-stats {
	display: flex;
	align-items: center;
	gap: $size-24;
	padding-top: $size-20;
	border-top: 1px solid rgba(255, 255, 255, 0.2);

	@media (max-width: 768px) {
		gap: $size-12;
		flex-wrap: wrap;
		justify-content: center;
	}
}

.stat-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: $size-4;

	&.starred .stat-value {
		display: flex;
		align-items: center;
		gap: $size-4;

		.star-icon {
			color: #fbbf24;
		}
	}
}

.stat-value {
	font-size: $size-24;
	font-weight: $fw-bold;

	@media (max-width: 768px) {
		font-size: $size-20;
	}
}

.stat-label {
	font-size: $size-12;
	opacity: 0.8;
	text-transform: uppercase;
	letter-spacing: 0.5px;
}

.stat-divider {
	width: 1px;
	height: $size-32;
	background: rgba(255, 255, 255, 0.2);

	@media (max-width: 768px) {
		display: none;
	}
}

// Search Container
.search-container {
	padding: 0 $size-48;
	margin-bottom: $size-20;

	@media (max-width: 768px) {
		padding: 0 $size-16;
	}
}

.search-bar {
	display: flex;
	align-items: center;
	gap: $size-12;
	background: white;
	padding: $size-14 $size-20;
	border-radius: $size-16;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
	border: 2px solid transparent;
	transition: all 0.2s ease;

	&:focus-within {
		border-color: #0EAEC4;
		box-shadow: 0 4px 20px rgba(14, 174, 196, 0.15);
	}

	.search-icon {
		color: $color-g-54;
	}

	input {
		flex: 1;
		border: none;
		outline: none;
		font-size: $size-15;
		color: $color-g-21;

		&::placeholder {
			color: $color-g-67;
		}
	}

	.clear-btn {
		background: $color-g-92;
		border: none;
		border-radius: 50%;
		width: $size-28;
		height: $size-28;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		color: $color-g-54;
		transition: all 0.2s ease;

		&:hover {
			background: $color-g-85;
			color: $color-g-36;
		}
	}
}

// Tabs Navigation
.tabs-navigation {
	display: flex;
	align-items: center;
	gap: $size-12;
	padding: 0 $size-48;
	margin-bottom: $size-24;

	@media (max-width: 768px) {
		padding: 0 $size-16;
		gap: $size-8;
		flex-wrap: wrap;
	}
}

.tab-btn {
	display: inline-flex;
	align-items: center;
	gap: $size-8;
	padding: $size-12 $size-20;
	border: none;
	border-radius: $size-24;
	background: white;
	color: $color-g-44;
	font-size: $size-14;
	font-weight: $fw-medium;
	cursor: pointer;
	transition: all 0.2s ease;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

	&:hover {
		color: #0EAEC4;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	&.active {
		background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%);
		color: white;
		box-shadow: 0 4px 16px rgba(14, 174, 196, 0.3);
	}

	@media (max-width: 480px) {
		padding: $size-10 $size-14;
		font-size: $size-13;
		gap: $size-6;
	}
}

.sort-dropdown {
	margin-left: auto;

	select {
		padding: $size-10 $size-16;
		border-radius: $size-12;
		border: 1px solid $color-g-85;
		background: white;
		font-size: $size-14;
		color: $color-g-36;
		cursor: pointer;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

		&:focus {
			outline: none;
			border-color: #0EAEC4;
		}
	}

	@media (max-width: 768px) {
		margin-left: 0;
		width: 100%;

		select {
			width: 100%;
		}
	}
}

// Access Notice
.access-notice {
	display: flex;
	align-items: center;
	gap: $size-16;
	background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
	border: 1px solid #f59e0b;
	border-radius: $size-16;
	padding: $size-20 $size-24;
	margin: 0 $size-48 $size-24;
	box-shadow: 0 4px 20px rgba(245, 158, 11, 0.15);

	@media (max-width: 768px) {
		margin: 0 $size-16 $size-16;
		flex-direction: column;
		text-align: center;
	}

	.notice-icon {
		color: #f59e0b;
		flex-shrink: 0;
	}

	.notice-content {
		flex: 1;

		h4 {
			font-size: $size-15;
			font-weight: $fw-semi-bold;
			color: #92400e;
			margin: 0 0 $size-4;
		}

		p {
			font-size: $size-14;
			color: #a16207;
			margin: 0;
		}
	}

	.acknowledge-btn {
		padding: $size-10 $size-20;
		background: #f59e0b;
		color: white;
		border: none;
		border-radius: $size-8;
		font-size: $size-14;
		font-weight: $fw-medium;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;

		&:hover {
			background: #d97706;
		}
	}
}

// Content Area
.content-area {
	padding: 0 $size-48;

	@media (max-width: 768px) {
		padding: 0 $size-16;
	}
}

.patients-list {
	display: flex;
	flex-direction: column;
	gap: $size-20;
}

.results-header {
	margin-bottom: $size-8;
}

.results-count {
	font-size: $size-14;
	color: $color-g-54;
}

// Patient Card
.patient-card {
	background: white;
	border-radius: $size-16;
	padding: $size-24;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
	transition: all 0.3s ease;
	border-left: 4px solid #0EAEC4;
	cursor: pointer;

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
	}

	@media (max-width: 768px) {
		padding: $size-16;
		border-radius: $size-12;
	}
}

.card-main {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: $size-24;
	margin-bottom: $size-16;

	@media (max-width: 768px) {
		flex-direction: column;
		gap: $size-16;
	}
}

.patient-section {
	display: flex;
	align-items: flex-start;
	gap: $size-16;
	flex: 1;
}

.patient-avatar {
	flex-shrink: 0;
}

.patient-info {
	display: flex;
	flex-direction: column;
	gap: $size-6;
	min-width: 0;
}

.name-row {
	display: flex;
	align-items: center;
	gap: $size-10;
}

.patient-name {
	font-size: $size-18;
	font-weight: $fw-semi-bold;
	color: $color-g-21;
	margin: 0;

	@media (max-width: 768px) {
		font-size: $size-16;
	}
}

.star-btn {
	background: none;
	border: none;
	cursor: pointer;
	padding: $size-4;
	color: $color-g-67;
	transition: all 0.2s ease;
	border-radius: 50%;

	&:hover {
		color: #f59e0b;
		background: rgba(245, 158, 11, 0.1);
	}

	&.starred {
		color: #f59e0b;
	}
}

.patient-contact {
	font-size: $size-14;
	color: $color-g-44;
	margin: 0;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.patient-meta {
	display: flex;
	align-items: center;
	gap: $size-8;
	margin-top: $size-4;
	flex-wrap: wrap;
}

.meta-badge {
	display: inline-flex;
	align-items: center;
	gap: $size-4;
	padding: $size-4 $size-10;
	border-radius: $size-6;
	font-size: $size-12;
	font-weight: $fw-medium;

	&.gender, &.age {
		background: rgba(14, 174, 196, 0.1);
		color: #0EAEC4;
	}

	&.risk {
		text-transform: uppercase;
		font-size: $size-11;

		&.high {
			background: rgba(239, 68, 68, 0.1);
			color: #dc2626;
		}

		&.medium {
			background: rgba(245, 158, 11, 0.1);
			color: #d97706;
		}

		&.low {
			background: rgba(16, 185, 129, 0.1);
			color: #059669;
		}
	}
}

.stats-section {
	display: flex;
	gap: $size-24;

	@media (max-width: 768px) {
		width: 100%;
		justify-content: space-around;
		padding-top: $size-16;
		border-top: 1px solid $color-g-92;
	}
}

.stat-block {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: $size-2;

	.stat-number {
		font-size: $size-24;
		font-weight: $fw-bold;
		color: #0EAEC4;

		&.small {
			font-size: $size-14;
			color: $color-g-44;
		}
	}

	.stat-text {
		font-size: $size-11;
		color: $color-g-54;
		text-transform: uppercase;
	}
}

.card-footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding-top: $size-16;
	border-top: 1px solid $color-g-92;
}

.footer-left {
	display: flex;
	align-items: center;
	gap: $size-12;
}

.phone-badge {
	display: inline-flex;
	align-items: center;
	gap: $size-6;
	font-size: $size-13;
	color: $color-g-44;
}

.footer-right {
	display: flex;
	align-items: center;
}

.view-btn {
	display: inline-flex;
	align-items: center;
	gap: $size-6;
	padding: $size-8 $size-16;
	background: transparent;
	border: 1px solid $color-g-85;
	border-radius: $size-8;
	color: $color-g-44;
	font-size: $size-13;
	font-weight: $fw-medium;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		border-color: #0EAEC4;
		color: #0EAEC4;
		background: rgba(14, 174, 196, 0.05);
	}
}

// Empty State
.empty-state {
	text-align: center;
	padding: $size-64 $size-24;
}

.empty-illustration {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 120px;
	height: 120px;
	background: linear-gradient(135deg, rgba(14, 174, 196, 0.1) 0%, rgba(14, 174, 196, 0.05) 100%);
	border-radius: 50%;
	margin-bottom: $size-24;

	.empty-icon {
		color: #0EAEC4;
	}
}

.empty-title {
	font-size: $size-22;
	font-weight: $fw-semi-bold;
	color: $color-g-21;
	margin: 0 0 $size-12;
}

.empty-description {
	font-size: $size-15;
	color: $color-g-54;
	margin: 0;
	max-width: 400px;
	margin: 0 auto;
}

// Pagination
.pagination {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: $size-16;
	margin-top: $size-32;
	padding-top: $size-24;
	border-top: 1px solid $color-g-92;
}

.pagination-btn {
	display: inline-flex;
	align-items: center;
	gap: $size-6;
	padding: $size-10 $size-20;
	border-radius: $size-12;
	border: 1px solid $color-g-85;
	background: white;
	color: $color-g-44;
	font-size: $size-14;
	font-weight: $fw-medium;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover:not(:disabled) {
		border-color: #0EAEC4;
		color: #0EAEC4;
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
}

.pagination-info {
	font-size: $size-14;
	color: $color-g-54;
}

// Very small screens
@media (max-width: 480px) {
	.hero-banner {
		margin: $size-12;
		padding: $size-20 $size-16;
		border-radius: $size-12;
	}

	.hero-title {
		font-size: $size-18;
	}

	.hero-subtitle {
		font-size: $size-13;
	}

	.hero-stats {
		gap: $size-8;
		padding-top: $size-16;
	}

	.stat-item {
		min-width: calc(50% - $size-8);
		padding: $size-8;
		background: rgba(255, 255, 255, 0.1);
		border-radius: $size-8;
	}

	.stat-value {
		font-size: $size-16;
	}

	.search-container,
	.tabs-navigation,
	.content-area,
	.access-notice {
		padding-left: $size-12;
		padding-right: $size-12;
		margin-left: 0;
		margin-right: 0;
	}

	.access-notice {
		margin: 0 $size-12 $size-12;
	}
}
</style>
