<template>
    <div class="page-content">
        <TopBar type="title-only" title="Health Checkup" @open-side-nav="$emit('openSideNav')" />
        <Loader v-if="isLoading" :useOverlay="false" style="z-index:1" />
        <div v-else class="page-content__body">
            <div class="diagnosis-container">
                <div class="action-buttons">
                    <ButtonIcon type="primary" iconName="download" />
                    <ButtonIcon type="primary" iconName="icon-takeout" />
                </div>
                <div class="content-section">
                    <div class="content-left-section summary-section-desktop">
                        <h2 class="content-left-section__heading">Results</h2>
                        <div class="content-left-section__body">
                            <div v-if="conditions.length" class="left-section__body--top-section">
                                <h3 class="left-section__body--title">Possible Conditions</h3>
                                <p class="left-section__body--description">
                                    Please note that the list below is a collection of possible 
                                    conditions arranged according to level of severity based on 
                                    the answers to your questions. This list is provided solely 
                                    for informational purposes and is not a qualified medical opinion.
                                </p>
                            </div>
                            <div v-else class="left-section__body--top-section">
                                <h3 class="left-section__body--title">No Conditions Found</h3>
                                <p class="left-section__body--description">
                                    Since you don't have any symptoms at the moment, there is no immediate 
                                    need to see a doctor. However, it's always a good idea to schedule regular 
                                    check-ups to ensure your overall health and well-being. If you have any 
                                    concerns in the future or experience any symptoms, don't hesitate to reach 
                                    out to a healthcare professional. 
                                </p>
                            </div>
                            <div v-if="conditions.length" class="left-section-content__results--bottom-section">
                                <div class="left-section-content__results--most-likely">
                                    <template v-for="condition in moreLikelyConditions" :key="JSON.stringify(condition)">
                                        <div class="left-section-content__most-likely">
                                            <div class="left-section-content__most-likely--item">
                                                <h4 class="left-section-content__most-likely--title">{{ condition.common_name }}</h4>
                                                <p v-if="condition.category === 0" class="left-section-content__most-likely-desc">Strong evidence</p>
                                                <p v-if="condition.category === 1" class="left-section-content__most-likely-desc">Moderate evidence</p>
                                                <p v-if="condition.category === 2" class="left-section-content__most-likely-desc-2">Weak evidence</p>
                                            </div>
                                            <span v-if="condition.category === 0" class="left-section-content__most-likely--status-1"></span>
                                            <span v-if="condition.category === 1" class="left-section-content__most-likely--status-2"></span>
                                            <span v-if="condition.category === 2" class="left-section-content__most-likely--status-3"></span>
                                        </div>
                                    </template>
                                </div>
                                <div v-if="lessLikelyConditions.length" class="left-section-content__results--less-likely">
                                    <accordian class="left-section-body__accordian">
                                        <template v-slot:head-content>
                                            <span>Show less likely conditions</span>
                                        </template>
                                        <template v-slot:body-content>
                                            <div class="left-section-content__results--most-likely">
                                                <template v-for="condition in lessLikelyConditions" :key="JSON.stringify(condition)">
                                                    <div class="left-section-content__most-likely">
                                                        <div class="left-section-content__most-likely--item">
                                                            <h4 class="left-section-content__most-likely--title">{{ condition.common_name }}</h4>
                                                            <p v-if="condition.category === 0" class="left-section-content__most-likely-desc">Strong evidence</p>
                                                            <p v-if="condition.category === 1" class="left-section-content__most-likely-desc">Moderate evidence</p>
                                                            <p v-if="condition.category === 2" class="left-section-content__most-likely-desc-2">Weak evidence</p>
                                                        </div>
                                                        <span v-if="condition.category === 0" class="left-section-content__most-likely--status-1"></span>
                                                        <span v-if="condition.category === 1" class="left-section-content__most-likely--status-2"></span>
                                                        <span v-if="condition.category === 2" class="left-section-content__most-likely--status-3"></span>
                                                    </div>
                                                </template>
                                            </div>
                                        </template>
                                    </accordian>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="content-right-section">
                        <div class="right-section-recommendation">
                            <h2 class="section-recommendation__heading">Recommendation</h2>
                            <div class="section-recommendation__body">
                                <div class="recommendation-body-content">
                                    <div class="recommendation-localhospital-icon">
                                        <v-icon
                                            name="md-localhospital-round"
                                            width="156"
                                            height="156"
                                            :fill="conditions.length ? '#D12A05' : '#4FC3F7'"
                                        />
                                    </div>
                                    <div class="recommendation-body-content__info">
                                        <template v-if="conditions.length">
                                            <h1 class="recommendation-info__header">You need to see a Doctor</h1>
                                            <p class="recommendation-info__description">
                                                Your symptoms appear serious and you may require urgent care. You need to see a doctor as soon as possible.
                                            </p>
                                        </template>
                                        <template v-else>
                                            <h1 class="recommendation-info__header">You seem to be doing Ok!</h1>
                                            <p class="recommendation-info__description">
                                                No symptoms, no need for a doctor now. Keep up with regular check-ups for your well-being.
                                                If you have any concerns in the future or experience any symptoms, you can still book a consultation.
                                            </p>
                                        </template>
                                    </div>
                                </div>
                                <rc-button
                                    class="recommendation-body-action"
                                    label="Book a consultation now"
                                    type="tertiary"
                                    size="medium"
                                    iconRight
                                    iconName="chevron-right"
                                    @click="goToBookAppointment"
                                />
                            </div>
                        </div>
                        <div class="right-section-summary summary-section-desktop">
                            <h2 class="section-summary__heading">Summary</h2>
                            <div class="section-summary__body">
                                <h3 class="section-summary-body__heading">Diagnosis Summary</h3>
                                <div class="section-summary-diagnosis">
                                    <div class="section-summary-diagnosis__item">
                                        <span class="section-summary-diagnosis__key">Considered diagnoses</span>
                                        <button 
                                            class="section-summary-diagnosis__value clickable-diagnosis diagnosis-button" 
                                            @click="handleDiagnosisClick"
                                            onclick="console.log('DESKTOP BUTTON CLICKED!', 'consideredDiagnosis:', document.querySelector('.diagnosis-button').textContent); alert('Desktop Click detected!');"
                                            type="button"
                                            style="background: red !important; color: white !important; padding: 10px !important; border: 2px solid blue !important;"
                                        >
                                            DESKTOP: {{ consideredDiagnosis?.length || 0 }}+ ({{ conditions?.length || 0 }} conditions)
                                        </button>
                                    </div>
                                    <div class="section-summary-diagnosis__item">
                                        <span class="section-summary-diagnosis__key">Interview duration</span>
                                        <span class="section-summary-diagnosis__value">{{ duration }}</span>
                                    </div>
                                </div>
                                <div v-if="showDiagnosesList && consideredDiagnosis.length" class="considered-diagnoses-list">
                                    <h4 class="diagnoses-list-title">All Considered Diagnoses:</h4>
                                    <div class="diagnoses-list-content">
                                        <template v-for="(evidence, index) in consideredDiagnosis" :key="index">
                                            <div class="diagnosis-evidence-item">
                                                <span class="evidence-id">{{ evidence.id }}</span>
                                                <span class="evidence-choice">{{ evidence.choice_id }}</span>
                                            </div>
                                        </template>
                                    </div>
                                </div>
                            </div>
                            <rc-button
                                class="right-section-summary__action"
                                label="Take Diagnosis Again"
                                type="primary"
                                size="medium"
                                @click="$router.push({ name: 'HealthCheckup' })"
                            />
                        </div>
                        <div class="tab-summary-recommendation">
                            <rc-tab
                                :currentTab="currentTab"
                                :wrapper-class="'default-tabs'"
                                :tab-class="'default-tabs__item'"
                                :tab-active-class="'default-tabs__item_active'"
                                :line-class="'default-tabs__active-line'"
                                @onClick="currentTab = $event"
                                :tabs="[
                                    { title: 'Results', value: 'results' },
                                    { title: 'Summary', value: 'summary' },
                                ]"
                            />
                            <div class="tabs-summary-recommendation__content">
                                <template v-if="currentTab === 'results'">
                                    <div class="content-left-section">
                                        <div class="content-left-section__body">
                                            <div v-if="conditions.length" class="left-section__body--top-section">
                                                <h3 class="left-section__body--title">Possible Conditions</h3>
                                                <p class="left-section__body--description">
                                                    Please note that the list below is a collection of possible 
                                                    conditions arranged according to level of severity based on 
                                                    the answers to your questions. This list is provided solely 
                                                    for informational purposes and is not a qualified medical opinion.
                                                </p>
                                            </div>
                                            <div v-else class="left-section__body--top-section">
                                                <h3 class="left-section__body--title">No Conditions Found</h3>
                                                <p class="left-section__body--description">
                                                    Since you don't have any symptoms at the moment, there is no immediate 
                                                    need to see a doctor. However, it's always a good idea to schedule regular 
                                                    check-ups to ensure your overall health and well-being. If you have any 
                                                    concerns in the future or experience any symptoms, don't hesitate to reach 
                                                    out to a healthcare professional. 
                                                </p>
                                            </div>
                                            <div v-if="conditions.length" class="left-section-content__results--bottom-section">
                                                <div class="left-section-content__results--most-likely">
                                                    <template v-for="condition in moreLikelyConditions" :key="JSON.stringify(condition)">
                                                        <div class="left-section-content__most-likely">
                                                            <div class="left-section-content__most-likely--item">
                                                                <h4 class="left-section-content__most-likely--title">{{ condition.common_name }}</h4>
                                                                <p v-if="condition.category === 0" class="left-section-content__most-likely-desc">Strong evidence</p>
                                                                <p v-if="condition.category === 1" class="left-section-content__most-likely-desc">Moderate evidence</p>
                                                                <p v-if="condition.category === 2" class="left-section-content__most-likely-desc-2">Weak evidence</p>
                                                            </div>
                                                            <span v-if="condition.category === 0" class="left-section-content__most-likely--status-1"></span>
                                                            <span v-if="condition.category === 1" class="left-section-content__most-likely--status-2"></span>
                                                            <span v-if="condition.category === 2" class="left-section-content__most-likely--status-3"></span>
                                                        </div>
                                                    </template>
                                                </div>
                                                <div v-if="lessLikelyConditions.length" class="left-section-content__results--less-likely">
                                                    <accordian class="left-section-body__accordian">
                                                        <template v-slot:head-content>
                                                            <span>Show less likely conditions</span>
                                                        </template>
                                                        <template v-slot:body-content>
                                                            <div class="left-section-content__results--most-likely">
                                                                <template v-for="condition in lessLikelyConditions" :key="JSON.stringify(condition)">
                                                                    <div class="left-section-content__most-likely">
                                                                        <div class="left-section-content__most-likely--item">
                                                                            <h4 class="left-section-content__most-likely--title">{{ condition.common_name }}</h4>
                                                                            <p v-if="condition.category === 0" class="left-section-content__most-likely-desc">Strong evidence</p>
                                                                            <p v-if="condition.category === 1" class="left-section-content__most-likely-desc">Moderate evidence</p>
                                                                            <p v-if="condition.category === 2" class="left-section-content__most-likely-desc-2">Weak evidence</p>
                                                                        </div>
                                                                        <span v-if="condition.category === 0" class="left-section-content__most-likely--status-1"></span>
                                                                        <span v-if="condition.category === 1" class="left-section-content__most-likely--status-2"></span>
                                                                        <span v-if="condition.category === 2" class="left-section-content__most-likely--status-3"></span>
                                                                    </div>
                                                                </template>
                                                            </div>
                                                        </template>
                                                    </accordian>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </template>
                                <template v-if="currentTab === 'summary'">
                                    <div class="right-section-summary">
                                        <div class="section-summary__body">
                                            <h3 class="section-summary-body__heading">Diagnosis Summary</h3>
                                            <div class="section-summary-diagnosis">
                                                <div class="section-summary-diagnosis__item">
                                                    <span class="section-summary-diagnosis__key">Considered diagnoses</span>
                                                    <button 
                                                        class="section-summary-diagnosis__value clickable-diagnosis diagnosis-button" 
                                                        @click="handleDiagnosisClick"
                                                        onclick="console.log('MOBILE BUTTON CLICKED!'); alert('Mobile Click detected!');"
                                                        type="button"
                                                        style="background: green !important; color: white !important; padding: 10px !important; border: 2px solid orange !important;"
                                                    >
                                                        MOBILE: {{ consideredDiagnosis?.length || 0 }}+ ({{ conditions?.length || 0 }} conditions)
                                                    </button>
                                                </div>
                                                <div class="section-summary-diagnosis__item">
                                                    <span class="section-summary-diagnosis__key">Interview duration</span>
                                                    <span class="section-summary-diagnosis__value">{{ duration }}</span>
                                                </div>
                                            </div>
                                            <div v-if="showDiagnosesList && consideredDiagnosis.length" class="considered-diagnoses-list">
                                                <h4 class="diagnoses-list-title">All Considered Diagnoses:</h4>
                                                <div class="diagnoses-list-content">
                                                    <template v-for="(evidence, index) in consideredDiagnosis" :key="index">
                                                        <div class="diagnosis-evidence-item">
                                                            <span class="evidence-id">{{ evidence.id }}</span>
                                                            <span class="evidence-choice">{{ evidence.choice_id }}</span>
                                                        </div>
                                                    </template>
                                                </div>
                                            </div>
                                        </div>
                                        <rc-button
                                            class="right-section-summary__action"
                                            label="Take Diagnosis Again"
                                            type="primary"
                                            size="medium"
                                            @click="$router.push({ name: 'HealthCheckup' })"
                                        />
                                    </div>
                                </template>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { formatDuration } from "date-fns";
import { ref, inject, provide, computed, onMounted } from "vue";
import { useToast } from 'vue-toast-notification';
import TopBar from "@/components/Navigation/top-bar";
import RcTab from "@/components/RCTab";
import Accordian from "@/components/Lists/accordian";
import ButtonIcon from "@/components/buttons/button-icon";
import RcButton from "@/components/buttons/button-primary";
import DialogModal from "@/components/modals/dialog-modal";
import Loader from "@/components/Loader/main-loader.vue";
import { mapGetters } from "@/utilities/utilityStore";


console.log('DiagnosisReport component SCRIPT LOADED');

const $toast = useToast();
const $route = useRoute();
const $router = useRouter();
const $http = inject('$_HTTP');
const { userprofile } = mapGetters();

console.log('DiagnosisReport component VARIABLES INITIALIZED');

// Inject parent diagnosis and recommendation data (used when coming from history)
const parentDiagnosisInject = inject('$_DIAGNOSIS', null);
const parentRecommendationInject = inject('$_RECOMMENDATION', null);

const isLoading = ref(true);
const sortedConditions = ref([]);
const moreLikelyConditions = ref([]);
const lessLikelyConditions = ref([]);
const conditions = ref([]);
const consideredDiagnosis = ref([]);
const currentTab = ref("results");
const showDiagnosesList = ref(false);

const patientInfo = ref({});
const diagnosis = ref({});
const recommendation = ref({});
const navigator = ref({ from: null, to: null, current: 0 });

const usePatientInfo = (payload) => (patientInfo.value = {...patientInfo.value, ...payload});
const useDiagnosis = (payload) => (diagnosis.value = {...diagnosis.value, ...payload});
const useRecommendation = (payload) => (recommendation.value = {...recommendation.value, ...payload});
const useNavigator = ({ current, from, to }) => (navigator.value = {current: to, from, to: null});

const handleDiagnosisClick = (event) => {
    console.log('=== DIAGNOSIS CLICK EVENT ===');
    console.log('Event:', event);
    console.log('Current showDiagnosesList:', showDiagnosesList.value);
    console.log('consideredDiagnosis length:', consideredDiagnosis.value?.length);
    console.log('consideredDiagnosis data:', consideredDiagnosis.value);
    
    showDiagnosesList.value = !showDiagnosesList.value;
    console.log('New showDiagnosesList:', showDiagnosesList.value);
    console.log('=== END DIAGNOSIS CLICK ===');
};

provide('$_PATIENT_INFO', { patientInfo, usePatientInfo });
provide('$_NAVIGATOR', { navigator, useNavigator });
provide('$_DIAGNOSIS', { diagnosis, useDiagnosis });
provide('$_RECOMMENDATION', { recommendation, useRecommendation });

onMounted(async () => {
    console.log('=== DIAGNOSIS REPORT MOUNTED ===');
    console.log('parentDiagnosisInject:', parentDiagnosisInject);
    console.log('parentRecommendationInject:', parentRecommendationInject);
    console.log('Route query:', $route.query);
    console.log('userprofile:', userprofile.value);

    // Check if we have a direct checkup_id from query (e.g., from appointment detail page)
    if ($route.query.checkup_id) {
        console.log('Found checkup_id in query, fetching directly:', $route.query.checkup_id);
        await getHealthCheckupById($route.query.checkup_id);
        console.log('=== END DIAGNOSIS REPORT MOUNTED ===');
        return;
    }

    // Check if we have parent diagnosis data (coming from history)
    if (parentDiagnosisInject && parentDiagnosisInject.diagnosis?.value) {
        console.log('Found parent diagnosis injection');
        console.log('Parent diagnosis data:', parentDiagnosisInject.diagnosis.value);
        console.log('Evidence length:', parentDiagnosisInject.diagnosis.value.evidence?.length);
        console.log('Conditions length:', parentDiagnosisInject.diagnosis.value.conditions?.length);

        if (parentDiagnosisInject.diagnosis.value.evidence &&
            parentDiagnosisInject.diagnosis.value.evidence.length > 0) {

            console.log('Using parent diagnosis data from history');
            // Use the data provided by parent (from history)
            consideredDiagnosis.value = parentDiagnosisInject.diagnosis.value.evidence || [];
            conditions.value = parentDiagnosisInject.diagnosis.value.conditions || [];
            diagnosis.value = parentDiagnosisInject.diagnosis.value;

            console.log('Set consideredDiagnosis:', consideredDiagnosis.value);
            console.log('Set conditions:', conditions.value);

            // Process conditions for display
            if (conditions.value.length > 0) {
                const sorted = conditions.value?.sort((a, b) => b.probability - a.probability);
                sortedConditions.value = sorted.map((condition, i) => ({
                    ...condition,
                    category: Math.floor(i / (sorted.length / 3))
                }));

                // Reset the arrays before populating
                moreLikelyConditions.value = [];
                lessLikelyConditions.value = [];

                sortedConditions.value.forEach((condition) => {
                    if (condition.category <= 1) {
                        moreLikelyConditions.value.push(condition);
                    } else if (condition.category > 1) {
                        lessLikelyConditions.value.push(condition);
                    }
                });

                console.log('Processed conditions - more likely:', moreLikelyConditions.value.length);
                console.log('Processed conditions - less likely:', lessLikelyConditions.value.length);
            }

            isLoading.value = false;
            console.log('History data loading complete');
        } else {
            console.log('No evidence in parent diagnosis, falling back to API');
            getUserHealthCheck(userprofile.value.id);
        }
    } else {
        console.log('No parent diagnosis injection found, using API fetch');
        // Fallback to API fetch (original flow)
        getUserHealthCheck(userprofile.value.id);
    }

    console.log('=== END DIAGNOSIS REPORT MOUNTED ===');
});

async function getUserHealthCheck(patientId) {
    isLoading.value = true;
    await $http.$_getHealthCheckupResult(patientId).then(({ data }) => {
        if (Array.isArray(data.data) && data.data.length) {
            const foundInterviewToken = data.data.find((item) => (
                item?.request?.interview_token === $route.query.interview_token ||
                item?.response?.data?.interview_token === $route.query.interview_token
            ))

            if (!foundInterviewToken) {
                console.error('Interview token not found:', $route.query.interview_token);
                console.log('Available tokens:', data.data.map(item => ({
                    request: item?.request?.interview_token,
                    response: item?.response?.data?.interview_token
                })));
                return $router.back();
            }

            consideredDiagnosis.value = foundInterviewToken.request.evidence;
            conditions.value = foundInterviewToken.response.data.conditions;
            const sorted = conditions.value?.sort((a, b) => b.probability - a.probability);
            sortedConditions.value = sorted.map((condition, i) => ({
            ...condition, category: Math.floor(i / (sorted.length / 3))
            })).forEach((condition) => {
                if (condition.category <= 1) moreLikelyConditions.value.push(condition)
                else if (condition.category > 1) lessLikelyConditions.value.push(condition)
            });
            isLoading.value = false;

        } else $router.back();
    });
}

async function getHealthCheckupById(checkupId) {
    isLoading.value = true;
    try {
        const { data } = await $http.$_getHealthCheckupById(checkupId);
        const checkup = data.data;

        if (!checkup || !checkup.response?.data) {
            console.error('Health checkup not found or has no data');
            $router.back();
            return;
        }

        console.log('Loaded health checkup by ID:', checkup);

        consideredDiagnosis.value = checkup.request?.evidence || [];
        conditions.value = checkup.response.data.conditions || [];
        diagnosis.value = {
            conditions: conditions.value,
            interview_token: checkup.response.data.interview_token || checkup.request?.interview_token,
            evidence: consideredDiagnosis.value,
            triage_level: checkup.response.data.triage_level,
            triage: checkup.response.data.triage,
            has_emergency_evidence: checkup.response.data.has_emergency_evidence
        };

        // Process conditions for display
        if (conditions.value.length > 0) {
            const sorted = conditions.value.sort((a, b) => b.probability - a.probability);
            sortedConditions.value = sorted.map((condition, i) => ({
                ...condition,
                category: Math.floor(i / (sorted.length / 3))
            }));

            moreLikelyConditions.value = [];
            lessLikelyConditions.value = [];

            sortedConditions.value.forEach((condition) => {
                if (condition.category <= 1) {
                    moreLikelyConditions.value.push(condition);
                } else if (condition.category > 1) {
                    lessLikelyConditions.value.push(condition);
                }
            });
        }

        isLoading.value = false;
    } catch (error) {
        console.error('Error fetching health checkup:', error);
        isLoading.value = false;
        $router.back();
    }
}

const duration = computed(() => {
    // Try to get duration from parent recommendation (history) first
    if (parentRecommendationInject && parentRecommendationInject.recommendation?.value?.duration) {
        const durationMs = parentRecommendationInject.recommendation.value.duration;
        return formatDuration({
            minutes: Math.floor(durationMs / (1000 * 60)),
            seconds: Math.floor((durationMs % (1000 * 60)) / 1000),
        }, { format: ['minutes', 'seconds'] });
    }
    
    // Fallback to URL query parameter (original flow)
    if ($route.query.duration) {
        return formatDuration({
            minutes: Math.floor($route.query.duration / (1000 * 60)),
            seconds: $route.query.duration % 60,
        }, { format: ['minutes', 'seconds'] });
    }
    
    return 'Unknown';
});

const goToBookAppointment = () => {
	$router.push({ name: 'BookAppointment' });
};

</script>

<style lang="scss" scoped>
.page-content {
	display: flex;
	flex-direction: column;
	gap: $size-12;
	width: 100%;
	height: 100vh;

	&__body {
		display: flex;
		flex-direction: column;
		gap: $size-26;
		width: 100%;
		height: 100%;
		overflow-y: scroll;
		padding: $size-0 $size-48;

		&::-webkit-scrollbar {
			display: none;
			width: 12px;
			background-color: $color-g-97;
		}
	}
}

.diagnosis-container {
    width: 100%;
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	align-items: flex-end;
    flex: 1;
    gap: 36px;
    margin-bottom: 50px;
    margin-top: 20px;

    @include responsive(tab-portrait) {
        margin-bottom: 0;
        margin-top: 0;
    }
    @include responsive(phone) {
        margin-bottom: 100px;
        margin-top: 0;
    }

	.action-buttons {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		gap: $size-16;
	}

	.content-section {
        width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
        flex: 1;
		gap: $size-24;

        @include responsive(tab-portrait) {
            flex-direction: column;
        }
        @include responsive(phone) {
            padding-bottom: 50px;
        }

		.content-left-section {
			display: flex;
			flex-direction: column;
			align-items: flex-start;
            flex: 0.4;
			gap: $size-32;
			background: $color-white;
			padding: $size-32 $size-40;
			border-radius: $size-24;

            @include responsive(tab-portrait) {
                padding: 0;
            }
            @include responsive(phone) {
                display: flex !important;
                padding: $size-32 $size-32;
                flex: 1;
                order: 2;
            }

			.content-left-section__heading {
				font-weight: $fw-semi-bold;
				font-size: $size-20;
				line-height: 22px;
				color: $color-g-54;
				border-bottom: 1px solid $color-g-85;
				padding-bottom: $size-8;
				width: 100%;
			}
			.content-left-section__body {
				display: flex;
				flex-direction: column;
				align-items: flex-start;
				gap: $size-32;

				.left-section__body--top-section {
					display: flex;
					flex-direction: column;
					align-items: flex-start;
					gap: $size-16;

					.left-section__body--title {
						font-weight: $fw-semi-bold;
						font-size: $size-20;
						line-height: 22px;
						color: $color-g-21;
					}
					.left-section__body--description {
						font-weight: $fw-regular;
						font-size: $size-16;
						color: $color-g-54;
						line-height: 24px;
						text-align: left;
					}
				}
				.left-section-content__results--bottom-section {
					width: 100%;
					display: flex;
					flex-direction: column;
					gap: $size-16;

					.left-section-content__results--most-likely {
						width: 100%;
						display: flex;
						flex-direction: column;
						justify-content: space-between;
						align-items: center;
						gap: $size-8;
						background: $color-white;

						.left-section-content__most-likely {
							width: 100%;
							display: flex;
							justify-content: space-between;
							align-items: center;
							border: 1px solid $color-pri-t4;
							border-radius: $size-12;
							padding: $size-8 $size-16;

							.left-section-content__most-likely--item {
								display: flex;
								flex-direction: column;
								justify-content: flex-start;
								align-items: flex-start;
								gap: $size-2;
								
								.left-section-content__most-likely--title {
									font-weight: $fw-semi-bold;
									font-size: $size-16;
									line-height: 22px;
									color: $color-black;
								}
								.left-section-content__most-likely--title-2 {
									font-weight: $fw-semi-bold;
									font-size: $size-16;
									line-height: 22px;
									color: $color-g-44;
								}
								.left-section-content__most-likely-desc {
									font-weight: $fw-regular;
									font-size: $size-16;
									line-height: 22px;
									color: $color-g-44;
								}
								.left-section-content__most-likely-desc-2 {
									font-weight: $fw-regular;
									font-size: $size-16;
									line-height: 22px;
									color: $color-g-54;
								}
							}
							.left-section-content__most-likely--status-1 {
								width: 12px;
								height: 12px;
								border-radius: 100%;
								background: $color-denote-red;
							}
							.left-section-content__most-likely--status-2 {
								width: 12px;
								height: 12px;
								border-radius: 100%;
								background: #FBB500;
							}
							.left-section-content__most-likely--status-3 {
								width: 12px;
								height: 12px;
								border-radius: 100%;
								background: $color-g-77;
							}
						}
					}
                    .left-section-content__results--less-likely {
                        .left-section-body__accordian {
                            & :deep(.accordian__head) {
                                padding: $size-16 $size-0 !important;
                
                                span, svg {
                                    color: $color-sec-s1 !important;
                                    fill: $color-sec-s1 !important;
                                    font-weight: $fw-regular;
                                    font-size: $size-16;
                                    line-height: 24px;
                                }
                            }
                        }
                        .left-section-body__accordian {
                            & :deep(.accordian__body) {
                                margin: 0 !important;
                                margin-top: 24px !important;
                            }
                        }
                    }
				}
			}
		}
        .content-right-section {
            display: flex;
            flex-direction: column;
            flex: 0.6;
            gap: $size-24;

            @include responsive(tab-portrait) {
                width: 100% !important;
                flex: 1;
                order: 1;
            }
            @include responsive(phone) {
                display: flex !important;
                flex: 1;
                order: 1;
            }
        
            .right-section-recommendation {
                width: 100%;
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                // gap: $size-32;
                background: $color-white;
                padding: $size-32;
                border-radius: $size-24;

                .section-recommendation__heading {
                    font-weight: $fw-semi-bold;
                    font-size: $size-20;
                    line-height: 22px;
                    color: $color-g-54;
                    border-bottom: 1px solid $color-g-85;
                    padding-bottom: $size-8;
                    width: 100%;
                }
                .section-recommendation__body {
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    align-items: flex-end;

                    @include responsive(phone) {
                        gap: $size-32;
                        align-items: center;
                    }

                    .recommendation-body-content {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        gap: $size-16;

                        @include responsive(phone) {
                            flex-direction: column;
                        }

                        .recommendation-body-content__info {
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                            align-items: flex-start;
                            gap: $size-16;

                            .recommendation-info__header {
                                font-weight: $fw-semi-bold;
                                font-size: $size-28;
                                line-height: 32px;
                                color: $color-g-21;

                                @include responsive(phone) {
                                    text-align: center;
                                }
                            }
                            .recommendation-info__description {
                                font-weight: $fw-regular;
                                font-size: $size-16;
                                line-height: 24px;
                                color: $color-g-21;

                                @include responsive(phone) {
                                    text-align: center;
                                }
                            }
                        }
                    }
                    .recommendation-body-action {
                        border: 1px solid $color-black;
                        :deep(p) {
                            color: $color-black !important;
                            font-size: $size-16;
                            font-weight: $fw-regular;
                            line-height: 24px;
                        }
                        @include responsive(phone) {
                            width: 100%;
                        }
                    }
                }
            }
            .right-section-summary {
                width: 100%;
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                gap: $size-32;
                background: $color-white;
                padding: $size-32;
                border-radius: $size-24;

                @include responsive(tab-portrait) {
                    padding: 0;
                }
                 @include responsive(phone) {
                   padding: $size-32;
                }

                .section-summary__heading {
                    font-weight: $fw-semi-bold;
                    font-size: $size-20;
                    line-height: 22px;
                    color: $color-g-54;
                    border-bottom: 1px solid $color-g-85;
                    padding-bottom: $size-8;
                    width: 100%;
                }
                .section-summary__body {
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: $size-32;

                    .section-summary-body__heading {
                        font-weight: $fw-semi-bold;
                        font-size: $size-20;
                        line-height: 22px;
                        color: $color-g-21;
                    }
                    .right-section-body__accordian {
                        width: 100%;

                        & :deep(.accordian__head) {
                            padding: $size-16 $size-0 !important;

                            span, svg {
                                color: $color-black !important;
                                fill: $color-black !important;
                                font-weight: $fw-semi-bold !important;
                                font-size: $size-16;
                                line-height: 24px;

                            }
                        }
                        & .accordian__body {
                            margin-top: 24px !important;
                        }
                    }
                    .section-summary-diagnosis {
                        width: 100%;
                        display: flex;
                        flex-direction: column;
                        gap: $size-32;

                        .section-summary-diagnosis__item {
                            width: 100%;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;

                            .section-summary-diagnosis__key {
                                font-weight: $fw-regular;
                                font-size: $size-16;
                                line-height: 24px;
                                color: $color-black;
                            }
                            .section-summary-diagnosis__value {
                                font-weight: $fw-semi-bold;
                                font-size: $size-18;
                                line-height: 22px;
                                color: $color-black;
                            }
                            
                            .clickable-diagnosis {
                                cursor: pointer !important;
                                color: #4FC3F7 !important;
                                text-decoration: underline !important;
                                pointer-events: auto !important;
                                user-select: none !important;

                                &:hover {
                                    opacity: 0.8;
                                    transform: scale(1.05);
                                }
                            }

                            .diagnosis-button {
                                background: none !important;
                                border: none !important;
                                padding: 0 !important;
                                margin: 0 !important;
                                font-family: inherit !important;
                                font-size: $size-18 !important;
                                font-weight: $fw-semi-bold !important;
                                line-height: 22px !important;
                                color: #4FC3F7 !important;
                                text-decoration: underline !important;
                                cursor: pointer !important;
                                outline: none !important;

                                &:hover {
                                    opacity: 0.8;
                                    transform: scale(1.05);
                                }

                                &:focus {
                                    outline: 2px solid #4FC3F7;
                                    outline-offset: 2px;
                                }
                            }
                        }
                        
                        .considered-diagnoses-list {
                            margin-top: $size-16;
                            padding: $size-16;
                            background-color: #f8f9fa;
                            border-radius: $size-8;
                            border: 1px solid #e9ecef;
                            
                            .diagnoses-list-title {
                                font-size: $size-14;
                                font-weight: $fw-semi-bold;
                                color: $color-black;
                                margin-bottom: $size-12;
                            }
                            
                            .diagnoses-list-content {
                                display: flex;
                                flex-direction: column;
                                gap: $size-8;
                                
                                .diagnosis-evidence-item {
                                    display: flex;
                                    justify-content: space-between;
                                    padding: $size-8 $size-12;
                                    background-color: white;
                                    border-radius: $size-4;
                                    font-size: $size-12;
                                    
                                    .evidence-id {
                                        font-weight: $fw-medium;
                                        color: $color-black;
                                    }
                                    
                                    .evidence-choice {
                                        font-weight: $fw-regular;
                                        color: $color-g-54;
                                    }
                                }
                            }
                        }
                    }
                }
                
                .tab-summary-recommendation {
                    .diagnosis-button {
                        background: none !important;
                        border: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        font-family: inherit !important;
                        font-size: $size-18 !important;
                        font-weight: $fw-semi-bold !important;
                        line-height: 22px !important;
                        color: #4FC3F7 !important;
                        text-decoration: underline !important;
                        cursor: pointer !important;
                        outline: none !important;

                        &:hover {
                            opacity: 0.8;
                            transform: scale(1.05);
                        }

                        &:focus {
                            outline: 2px solid #4FC3F7;
                            outline-offset: 2px;
                        }
                    }
                    
                    .considered-diagnoses-list {
                        margin-top: $size-16;
                        padding: $size-16;
                        background-color: #f8f9fa;
                        border-radius: $size-8;
                        border: 1px solid #e9ecef;
                        
                        .diagnoses-list-title {
                            font-size: $size-14;
                            font-weight: $fw-semi-bold;
                            color: $color-black;
                            margin-bottom: $size-12;
                        }
                        
                        .diagnoses-list-content {
                            display: flex;
                            flex-direction: column;
                            gap: $size-8;
                            
                            .diagnosis-evidence-item {
                                display: flex;
                                justify-content: space-between;
                                padding: $size-8 $size-12;
                                background-color: white;
                                border-radius: $size-4;
                                font-size: $size-12;
                                
                                .evidence-id {
                                    font-weight: $fw-medium;
                                    color: $color-black;
                                }
                                
                                .evidence-choice {
                                    font-weight: $fw-regular;
                                    color: $color-g-54;
                                }
                            }
                        }
                    }
                }
                .right-section-summary__action {
                    width: 100%;
                    margin-top: 16px;
                }
            }
            .tab-summary-recommendation {
                width: 100%;
                display: none;
                flex-direction: column;
                align-items: flex-start;
                gap: $size-32;
                background: $color-white;
                padding: $size-32;
                border-radius: $size-24;

                @include responsive(tab-portrait) {
                    display: flex !important;
                }
                @include responsive(phone) {
                    display: none !important;
                }

                .default-tabs {
                    width: 100%;
                }
                .tabs-summary-recommendation__content {
                    width: 100%;
                }
            }
        }
	}
}
:deep(.summary-section-desktop) {
    margin-bottom: 50px;

    @include responsive(tab-portrait) {
        display: none !important;
    }
    @include responsive(phone) {
        display: flex !important;
        margin-bottom: 0;
    }
}
:deep(.recommendation-localhospital-icon) {
    // background: #D12A05;
    @include responsive(phone) {
        // width: 100% !important;
    }
}
</style>

<style scoped lang="scss">
:deep(.modal) {
	max-width: 100% !important;
	max-height: 100% !important;

	@include responsive(tab-portrait) {
		min-width: 90% !important;
		max-width: 90% !important;
	}
	@include responsive(tab-landscape) {
		min-width: 90% !important;
		max-width: 90% !important;
	}
	@include responsive(phone) {
		min-width: 100% !important;
		max-width: 100% !important;
	}
}
:deep(.modal__body) {
	padding: 0 !important;
	// overflow: hidden !important;
}

:deep(.modal__footer) {
	position: relative !important;
	display: flex;
	justify-content: center !important;
	align-items: center;
}

.action-button {
	display: flex;
	justify-content: space-between;
	position: relative;

	@include responsive(phone) {
		flex-direction: column;
		margin: 0;
		gap: $size-16;
		width: 100%;
	}
}
.multiple-btn {
	width: 100%;
}
.btn-float-right {
	justify-content: flex-end;
	width: 100%;
}

.considered-diagnoses-list {
	margin-top: $size-16;
	padding: $size-16;
	background-color: $color-g-97;
	border-radius: $size-8;
	border: 1px solid $color-g-90;

	.diagnoses-list-title {
		font-size: $size-14;
		font-weight: $fw-semi-bold;
		color: $color-g-21;
		margin-bottom: $size-12;
	}

	.diagnoses-list-content {
		display: flex;
		flex-direction: column;
		gap: $size-8;
		max-height: 200px;
		overflow-y: auto;

		&::-webkit-scrollbar {
			width: 4px;
		}

		&::-webkit-scrollbar-thumb {
			background-color: $color-g-77;
			border-radius: 100vw;
		}

		.diagnosis-evidence-item {
			display: flex;
			justify-content: space-between;
			padding: $size-8 $size-12;
			background-color: $color-white;
			border-radius: $size-4;
			border: 1px solid $color-g-90;

			.evidence-id {
				font-size: $size-12;
				color: $color-g-44;
				font-weight: $fw-regular;
			}

			.evidence-choice {
				font-size: $size-12;
				color: $color-pri;
				font-weight: $fw-medium;
			}
		}
	}
}

.clickable {
	&:hover {
		color: $color-pri !important;
		text-decoration: none !important;
	}
}
</style>