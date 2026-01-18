<template>
    <Loader v-if="isFetching || isLoading" :useOverlay="true" style="z-index:1" />
    <div class="free-text-container">
        <div class="free-text-header">
            <h1 class="free-text-header__title">Questionaire (Risk Factors)</h1>
            <p class="free-text-header__description">
                Please answer the following question regarding her personal health that might be a deciding factor.
            </p>
        </div>
        <div class="free-text-content">
            <div class="free-text-content__header">
                <h3 class="free-text-content__header--title">
                    Please select a statement below that applies to her.
                </h3>
                <p class="free-text-content__header--desc">
                    Select one answer for each sub-question
                </p>
            </div>
            <div class="free-text-content__body">
                <template v-for="factor in riskFactorOptions" :key="JSON.stringify(factor)">
                    <div class="free-text-content__item">
                        <p class="free-text-content__item--title">
                            {{ factor.common_name }}
                        </p>
                        <rc-radio
                            :radio-name="factor.name"
                            class="free-text-content__item--options"
                            v-model="selectedRiskFactors[factor.name]"
                            :options="[
                                { name: 'Yes', value: 'yes' },
                                { name: 'No', value: 'no' },
                                { name: 'Not sure', value: 'not_sure' },
                            ]"
                        />
                    </div>
                </template>
            </div>
        </div>
        <div class="free-text-footer">
            <rc-button
                label="Prev"
                type="tertiary"
                size="small"
                iconLeft
                iconName="arrow-left"
                @click="onSelectFactors(2)"
            />
            <rc-button
                label="Next"
                type="primary"
                size="small"
                iconRight
                iconName="arrow-right"
                @click="onSelectFactors(4)"
            />
        </div>
    </div>
</template>

<script setup>
import {ref, inject, watchEffect } from "vue";
import RcRadio from "@/components/RCRadio";
import RcButton from "@/components/buttons/button-primary";
import Loader from "@/components/Loader/main-loader.vue";

const emit = defineEmits(['next', 'selected']);
const props = defineProps(['age']);
const $http = inject('$http');

console.log('PROPS_AGE', props.age)

const isLoading = ref(true);
const riskFactorOptions = ref([]);
const selectedRiskFactors = ref({});
const commonRiskFactors = ref(['p_7', 'p_28', 'p_10', 'p_9', 'p_264']);

watchEffect(async () => {
    isLoading.value = true;
    if (props.age) {
        await $http.$_riskFactors({ age: props.age }).then(({ data }) => {
            console.log('RISK_FACTORS', data)
            riskFactorOptions.value = data.data?.filter((risk) => (
                commonRiskFactors.value.includes(risk.id)
            ));

            console.log('riskFactorOptions', riskFactorOptions.value)
            isLoading.value = false;
        });
    }
});

const onSelectFactors = (activeScreen) => {
    emit('selected', selectedRiskFactors.value);
    emit('next', activeScreen);
}
</script>

<style scoped lang="scss">
.free-text-container {
	width: 100%;
    height: 100%;
	// margin-top: $size-32;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	gap: $size-0;
	background: $color-g-97;
	overflow: hidden;

	&::-webkit-scrollbar {
		display: none;
		width: $size-12;
		background-color: $color-g-92;
	}

	& .free-text-header {
		position: fixed;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		gap: $size-4;
		border-bottom: $size-1 solid $color-g-67;
		padding-bottom: $size-16;
		background: $color-g-97;
		padding-top: $size-32;

		& .free-text-header__title {
			font-weight: $fw-semi-bold;
			font-size: $size-20;
			line-height: 22px;
			color: $color-black;
		}
		& .free-text-header__description {
			font-size: $size-16;
			line-height: 24px;
			text-align: left;
			color: $color-g-44;
		}
	}
	& .free-text-content {
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		gap: $size-32;
		margin-top: $size-120;
		position: relative;
		overflow: scroll;

		&::-webkit-scrollbar {
			display: none;
			width: $size-12;
			background-color: $color-g-92;
		}

		& .free-text-content__header {
			display: flex;
			flex-direction: column;
			justify-content: flex-start;
			gap: $size-4;

			& .free-text-content__header--title {
				font-weight: $fw-regular;
				font-size: $size-24;
				line-height: 36px;
				color: $color-black;
			}
			& .free-text-content__header--desc {
				font-size: $size-16;
				line-height: 24px;
				text-align: left;
				color: $color-g-44;
			}
		}
		& .free-text-content__body {
			display: flex;
			flex-direction: column;
			justify-content: flex-start;
			gap: $size-32;

			& .free-text-content__item {
				display: flex;
				flex-direction: column;
				justify-content: flex-start;
				gap: $size-24;

				& .free-text-content__item--title {
					font-size: $size-20;
					font-weight: $fw-regular;
					line-height: 32px;
					color: $color-black;
				}
				& :deep(.free-text-content__item--options) {
					display: flex;
					flex-direction: column;
				}
			}
		}
	}
	& .free-text-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: $color-g-97;
		padding: $size-20 $size-0;
	}
}
</style>