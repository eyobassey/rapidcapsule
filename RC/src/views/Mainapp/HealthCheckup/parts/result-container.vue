<template>
	<div class="container">
        <div class="action-buttons">
            <ButtonIcon
                type="primary"
                iconName="download"
            />
            <ButtonIcon
                type="primary"
                iconName="icon-takeout"
            />
        </div>
        <div class="content-section">
            <div class="content-left-section summary-section-desktop">
                <h2 class="content-left-section__heading">Results</h2>
                <div class="content-left-section__body">
                    <div class="left-section__body--top-section">
                        <h3 class="left-section__body--title">Possible Conditions</h3>
                        <p class="left-section__body--description">
                            Please not that the list below is a collection of possible 
                            conditions arranged according to level of severity based on 
                            the answers to your questions. This list is provided solely 
                            for informational purposes and is not a qualified medical opinion.
                        </p>
                    </div>
                    <div class="left-section-content__results--bottom-section">
                        <div class="left-section-content__results--most-likely">
                            <div class="left-section-content__most-likely">
                                <div class="left-section-content__most-likely--item">
                                    <h4 class="left-section-content__most-likely--title">Malaria Fever</h4>
                                    <p class="left-section-content__most-likely-desc">Strong evidence</p>
                                </div>
                                <span class="left-section-content__most-likely--status-1"></span>
                            </div>
                            <div class="left-section-content__most-likely">
                                <div class="left-section-content__most-likely--item">
                                    <h4 class="left-section-content__most-likely--title">Typhoid Fever</h4>
                                    <p class="left-section-content__most-likely-desc">Moderate evidence</p>
                                </div>
                                <span class="left-section-content__most-likely--status-2"></span>
                            </div>
                            <div class="left-section-content__most-likely">
                                <div class="left-section-content__most-likely--item">
                                    <h4 class="left-section-content__most-likely--title">Covid-19</h4>
                                    <p class="left-section-content__most-likely-desc">Moderate evidence</p>
                                </div>
                                <span class="left-section-content__most-likely--status-2"></span>
                            </div>
                        </div>
                        <div class="left-section-content__results--less-likely">
                            <accordian class="left-section-body__accordian">
                                <template v-slot:head-content>
                                    <span>Show less likely conditions</span>
                                </template>
                                <template v-slot:body-content>
                                    <div class="left-section-content__results--most-likely">
                                        <div class="left-section-content__most-likely">
                                            <div class="left-section-content__most-likely--item">
                                                <h4 class="left-section-content__most-likely--title-2">Malaria Fever</h4>
                                                <p class="left-section-content__most-likely-desc-2">Strong evidence</p>
                                            </div>
                                            <span class="left-section-content__most-likely--status-3"></span>
                                        </div>
                                        <div class="left-section-content__most-likely">
                                            <div class="left-section-content__most-likely--item">
                                                <h4 class="left-section-content__most-likely--title-2">Typhoid Fever</h4>
                                                <p class="left-section-content__most-likely-desc-2">Moderate evidence</p>
                                            </div>
                                            <span class="left-section-content__most-likely--status-3"></span>
                                        </div>
                                        <div class="left-section-content__most-likely">
                                            <div class="left-section-content__most-likely--item">
                                                <h4 class="left-section-content__most-likely--title-2">Covid-19</h4>
                                                <p class="left-section-content__most-likely-desc-2">Moderate evidence</p>
                                            </div>
                                            <span class="left-section-content__most-likely--status-3"></span>
                                        </div>
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
                                <v-icon name="md-localhospital-round" width="156" height="156" fill="#D12A05"/>
                            </div>
                            <div class="recommendation-body-content__info">
                                <h1 class="recommendation-info__header">You need to see a Doctor</h1>
                                <p class="recommendation-info__description">
                                    Your symptoms appear serious and you may require urgent care. You need to see a doctor as soon as possible.
                                </p>
                            </div>
                        </div>
                        <rc-button
                            class="recommendation-body-action"
                            label="Book a consultation now"
                            type="tertiary"
                            size="medium"
                            iconRight
                            iconName="chevron-right"
                        />
                    </div>
                </div>
                <div class="right-section-summary summary-section-desktop">
                    <h2 class="section-summary__heading">Summary</h2>
                    <div class="section-summary__body">
                        <h3 class="section-summary-body__heading">Diagnosis Summary</h3>
                        <accordian class="right-section-body__accordian">
                            <template v-slot:head-content>
                                <span>Your answers</span>
                            </template>
                            <template v-slot:body-content>
                            </template>
                        </accordian>
                        <div class="section-summary-diagnosis">
                            <div class="section-summary-diagnosis__item">
                                <span class="section-summary-diagnosis__key">Considered diagnoses</span>
                                <span class="section-summary-diagnosis__value">740+</span>
                            </div>
                            <div class="section-summary-diagnosis__item">
                                <span class="section-summary-diagnosis__key">Interview duration</span>
                                <span class="section-summary-diagnosis__value">2 min 25 sec</span>
                            </div>
                        </div>
                    </div>
                    <rc-button
                        class="right-section-summary__action"
                        label="Take Diagnosis Again"
                        type="primary"
                        size="medium"
                    />
                </div>
                <div class="tab-summary-recommendation">
                    <rc-tab
                        :tabs="tabs"
                        :currentTab="currentTab"
                        :wrapper-class="'default-tabs'"
                        :tab-class="'default-tabs__item'"
                        :tab-active-class="'default-tabs__item_active'"
                        :line-class="'default-tabs__active-line'"
                        @onClick="currentTab = $event"
                    />
                    <div class="tabs-summary-recommendation__content">
                        <template v-if="currentTab === 'results'">
                            <div class="content-left-section">
                                <div class="content-left-section__body">
                                    <div class="left-section__body--top-section">
                                        <h3 class="left-section__body--title">Possible Conditions</h3>
                                        <p class="left-section__body--description">
                                            Please not that the list below is a collection of possible 
                                            conditions arranged according to level of severity based on 
                                            the answers to your questions. This list is provided solely 
                                            for informational purposes and is not a qualified medical opinion.
                                        </p>
                                    </div>
                                    <div class="left-section-content__results--bottom-section">
                                        <div class="left-section-content__results--most-likely">
                                            <div class="left-section-content__most-likely">
                                                <div class="left-section-content__most-likely--item">
                                                    <h4 class="left-section-content__most-likely--title">Malaria Fever</h4>
                                                    <p class="left-section-content__most-likely-desc">Strong evidence</p>
                                                </div>
                                                <span class="left-section-content__most-likely--status-1"></span>
                                            </div>
                                            <div class="left-section-content__most-likely">
                                                <div class="left-section-content__most-likely--item">
                                                    <h4 class="left-section-content__most-likely--title">Typhoid Fever</h4>
                                                    <p class="left-section-content__most-likely-desc">Moderate evidence</p>
                                                </div>
                                                <span class="left-section-content__most-likely--status-2"></span>
                                            </div>
                                            <div class="left-section-content__most-likely">
                                                <div class="left-section-content__most-likely--item">
                                                    <h4 class="left-section-content__most-likely--title">Covid-19</h4>
                                                    <p class="left-section-content__most-likely-desc">Moderate evidence</p>
                                                </div>
                                                <span class="left-section-content__most-likely--status-2"></span>
                                            </div>
                                        </div>
                                        <div class="left-section-content__results--less-likely">
                                            <accordian class="left-section-body__accordian">
                                                <template v-slot:head-content>
                                                    <span>Show less likely conditions</span>
                                                </template>
                                                <template v-slot:body-content>
                                                    <div class="left-section-content__results--most-likely">
                                                        <div class="left-section-content__most-likely">
                                                            <div class="left-section-content__most-likely--item">
                                                                <h4 class="left-section-content__most-likely--title-2">Malaria Fever</h4>
                                                                <p class="left-section-content__most-likely-desc-2">Strong evidence</p>
                                                            </div>
                                                            <span class="left-section-content__most-likely--status-3"></span>
                                                        </div>
                                                        <div class="left-section-content__most-likely">
                                                            <div class="left-section-content__most-likely--item">
                                                                <h4 class="left-section-content__most-likely--title-2">Typhoid Fever</h4>
                                                                <p class="left-section-content__most-likely-desc-2">Moderate evidence</p>
                                                            </div>
                                                            <span class="left-section-content__most-likely--status-3"></span>
                                                        </div>
                                                        <div class="left-section-content__most-likely">
                                                            <div class="left-section-content__most-likely--item">
                                                                <h4 class="left-section-content__most-likely--title-2">Covid-19</h4>
                                                                <p class="left-section-content__most-likely-desc-2">Moderate evidence</p>
                                                            </div>
                                                            <span class="left-section-content__most-likely--status-3"></span>
                                                        </div>
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
                                    <accordian class="right-section-body__accordian">
                                        <template v-slot:head-content>
                                            <span>Your answers</span>
                                        </template>
                                        <template v-slot:body-content>
                                        </template>
                                    </accordian>
                                    <div class="section-summary-diagnosis">
                                        <div class="section-summary-diagnosis__item">
                                            <span class="section-summary-diagnosis__key">Considered diagnoses</span>
                                            <span class="section-summary-diagnosis__value">740+</span>
                                        </div>
                                        <div class="section-summary-diagnosis__item">
                                            <span class="section-summary-diagnosis__key">Interview duration</span>
                                            <span class="section-summary-diagnosis__value">2 min 25 sec</span>
                                        </div>
                                    </div>
                                </div>
                                <rc-button
                                    class="right-section-summary__action"
                                    label="Take Diagnosis Again"
                                    type="primary"
                                    size="medium"
                                />
                            </div>
                        </template>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from "vue";
import RcTab from "@/components/RCTab";
import Accordian from "@/components/Lists/accordian";
import ButtonIcon from "@/components/buttons/button-icon";
import RcButton from "@/components/buttons/button-primary";

const currentTab = ref("results");
const tabs = [
    { title: 'Results', value: 'results' },
    { title: 'Summary', value: 'summary' },
]

</script>

<style lang="scss" scoped>
.container {
    width: 100%;
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	align-items: flex-end;
    flex: 1;
    gap: 36px;
    margin-bottom: 100px;
    margin-top: 50px;

    @include responsive(tab-portrait) {
        margin-bottom: 0;
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
                            & .accordian__head {
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
                            & .accordian__body {
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
                            }
                            .recommendation-info__description {
                                font-weight: $fw-regular;
                                font-size: $size-16;
                                line-height: 24px;
                                color: $color-g-21;
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
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                gap: $size-32;
                background: $color-white;
                padding: $size-32;
                border-radius: $size-24;

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
    @include responsive(tab-portrait) {
        display: none !important;
    }
}
:deep(.recommendation-localhospital-icon) {
    // background: #D12A05;
    @include responsive(phone) {
        // width: 100% !important;
    }
}

</style>