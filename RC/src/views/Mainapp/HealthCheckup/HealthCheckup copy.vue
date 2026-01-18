<template>
	<div class="page-content">
		<TopBar type="title-only" title="Health Checkup" @open-side-nav="$emit('openSideNav')" />
		<div class="page-content__body">
			<template v-if="currentScreen === 0">
				<div class="user-container">
					<h1 class="user-container__heading">Who is the diagnosis for?</h1>
					<div class="user-container__avatars">
						<div @click="onSelectedPatient(profile)">
							<div class="user-container__avatars--avatar">
								<avatar-fixed
									class="user-container__avatars--image"
									size="small"
									:firstname="profile.first_name"
									:lastname="profile.last_name"
								/>
								<p class="user-container__avatars--name">Me</p>
							</div>
						</div>
						<template v-for="dependant in dependants" :key="dependant">
							<div @click="onSelectedPatient(dependant)">
								<div class="user-container__avatars--avatar">
									<avatar-fixed
										size="small"
										:firstname="dependant.first_name"
										:lastname="dependant.last_name"
										class="user-container__avatars--image"
									/>
									<p class="user-container__avatars--name">
										{{ dependant.first_name }}
									</p>
								</div>
							</div>
						</template>
						<div @click="onSelectedPatient('someone_else')">
							<div class="user-container__avatars--avatar">
								<v-icon name="bi-question-lg" class="user-container__avatars--icon" />
								<p class="user-container__avatars--name">Someone else</p>
							</div>
						</div>
					</div>
				</div>
			</template>
			<template v-if="currentScreen === 1">
				<div class="gender-container">
					<h1 class="gender-header">Select gender</h1>
					<div class="gender-content">
						<div @click="onSelectedGender('male')">
							<div class="gender-content__gender">
								<v-icon name="io-male-sharp" class="gender-content__gender--icon" />
								<p class="gender-content__gender--text">Male</p>
							</div>
						</div>
						<div @click="onSelectedGender('female')">
							<div class="gender-content__gender">
								<v-icon name="io-female-sharp" class="gender-content__gender--icon" />
								<p class="gender-content__gender--text">Female</p>
							</div>
						</div>
					</div>
				</div>
			</template>
			<template v-if="currentScreen === 2">
				<div class="age-container">
					<h1 class="age-header">How old is she?</h1>
					<div class="age-content">
						<slider v-model="selectedAge" />
						<p class="age-content__input">{{ selectedAge }}</p>
					</div>
				</div>
				<div class="age-footer">
					<rc-button
						label="Prev"
						type="tertiary"
						size="small"
						iconLeft
						iconName="arrow-left"
						@click="currentScreen = 1"
					/>
					<rc-button
						label="Next"
						type="primary"
						size="small"
						iconRight
						iconName="arrow-right"
						@click="currentScreen = 3"
					/>
				</div>
			</template>
			<template v-if="currentScreen === 3">
				<div class="questionaire-container">
					<div class="questionaire-header">
						<h1 class="questionaire-header__title">Questionaire (Risk Factors)</h1>
						<p class="questionaire-header__description">
							Please answer the following question regarding her personal health that might be a deciding factor.
						</p>
					</div>
					<div class="questionaire-content">
						<div class="questionaire-content__header">
							<h3 class="questionaire-content__header--title">
								Please select a statement below that applies to her.
							</h3>
							<p class="questionaire-content__header--desc">
								Select one answer for each sub-question
							</p>
						</div>
						<div class="questionaire-content__body">
							<div class="questionaire-content__item">
								<p class="questionaire-content__item--title">
									She is overweight or obese
								</p>
								<rc-radio
									radio-name="Overweight"
									class="questionaire-content__item--options"
									:options="riskFactorsOptions"
									v-model="selectedRiskFactors.overweight"
								/>
							</div>
							<div class="questionaire-content__item">
								<p class="questionaire-content__item--title">
									She smokes cigarettes
								</p>
								<rc-radio
									radio-name="Smoker"
									class="questionaire-content__item--options"
									:options="riskFactorsOptions"
									v-model="selectedRiskFactors.smoker"
								/>
							</div>
							<div class="questionaire-content__item">
								<p class="questionaire-content__item--title">
									She has recently suffered an injury
								</p>
								<rc-radio
									radio-name="Injury"
									class="questionaire-content__item--options"
									:options="riskFactorsOptions"
									v-model="selectedRiskFactors.injury"
								/>
							</div>
							<div class="questionaire-content__item">
								<p class="questionaire-content__item--title">
									She has high cholesterol
								</p>
								<rc-radio
									radio-name="Cholesterol"
									class="questionaire-content__item--options"
									:options="riskFactorsOptions"
									v-model="selectedRiskFactors.cholesterol"
								/>
							</div>
							<div class="questionaire-content__item">
								<p class="questionaire-content__item--title">
									She is hypertensive
								</p>
								<rc-radio
									radio-name="Hypertensive"
									class="questionaire-content__item--options"
									:options="riskFactorsOptions"
									v-model="selectedRiskFactors.hypertensive"
								/>
							</div>
							<div class="questionaire-content__item">
								<p class="questionaire-content__item--title">
									She is diabetic
								</p>
								<rc-radio
									radio-name="Diabetic"
									class="questionaire-content__item--options"
									:options="riskFactorsOptions"
									v-model="selectedRiskFactors.diabetic"
								/>
							</div>
						</div>
					</div>
					<div class="questionaire-footer">
						<rc-button
							label="Prev"
							type="tertiary"
							size="small"
							iconLeft
							iconName="arrow-left"
							@click="currentScreen = 2"
						/>
						<rc-button
							label="Next"
							type="primary"
							size="small"
							iconRight
							iconName="arrow-right"
							@click="currentScreen = 3"
						/>
					</div>
				</div>
			</template>
			<template v-if="currentScreen === 4">
				<div class="questionaire-container">
					<div class="questionaire-header">
						<h1 class="questionaire-header__title">Questionaire (Risk Factors)</h1>
						<p class="questionaire-header__description">
							Please answer the following question regarding her personal health that might be a deciding factor.
						</p>
					</div>
					<div class="questionaire-content">
						<div class="questionaire-content__header">
							<h3 class="questionaire-content__header--title">
								Please select a statement below that applies to her.
							</h3>
							<p class="questionaire-content__header--desc">
								Select one answer for each sub-question
							</p>
						</div>
						<div class="questionaire-content__body">
							<div class="questionaire-content__item">
								<p class="questionaire-content__item--title">
									She is overweight or obese
								</p>
								<rc-radio
									radio-name="Overweight"
									class="questionaire-content__item--options"
									:options="riskFactorsOptions"
									v-model="selectedRiskFactors.overweight"
								/>
							</div>
							<div class="questionaire-content__item">
								<p class="questionaire-content__item--title">
									She smokes cigarettes
								</p>
								<rc-radio
									radio-name="Smoker"
									class="questionaire-content__item--options"
									:options="riskFactorsOptions"
									v-model="selectedRiskFactors.smoker"
								/>
							</div>
							<div class="questionaire-content__item">
								<p class="questionaire-content__item--title">
									She has recently suffered an injury
								</p>
								<rc-radio
									radio-name="Injury"
									class="questionaire-content__item--options"
									:options="riskFactorsOptions"
									v-model="selectedRiskFactors.injury"
								/>
							</div>
							<div class="questionaire-content__item">
								<p class="questionaire-content__item--title">
									She has high cholesterol
								</p>
								<rc-radio
									radio-name="Cholesterol"
									class="questionaire-content__item--options"
									:options="riskFactorsOptions"
									v-model="selectedRiskFactors.cholesterol"
								/>
							</div>
							<div class="questionaire-content__item">
								<p class="questionaire-content__item--title">
									She is hypertensive
								</p>
								<rc-radio
									radio-name="Hypertensive"
									class="questionaire-content__item--options"
									:options="riskFactorsOptions"
									v-model="selectedRiskFactors.hypertensive"
								/>
							</div>
							<div class="questionaire-content__item">
								<p class="questionaire-content__item--title">
									She is diabetic
								</p>
								<rc-radio
									radio-name="Diabetic"
									class="questionaire-content__item--options"
									:options="riskFactorsOptions"
									v-model="selectedRiskFactors.diabetic"
								/>
							</div>
						</div>
					</div>
					<div class="questionaire-footer">
						<rc-button
							label="Prev"
							type="tertiary"
							size="small"
							iconLeft
							iconName="arrow-left"
							@click="currentScreen = 2"
						/>
						<rc-button
							label="Next"
							type="primary"
							size="small"
							iconRight
							iconName="arrow-right"
							@click="currentScreen = 3"
						/>
					</div>
				</div>
			</template>
		</div>
	</div>
</template>

<script setup>
import { ref, watch } from "vue";
import TopBar from "@/components/Navigation/top-bar";
import AvatarFixed from "@/components/Avatars/avatar-fixed";
import Slider from "@/components/inputs/slider";
import RcRadio from "@/components/RCRadio";
import RcButton from "@/components/buttons/button-primary";
import { mapGetters } from "@/utilities/utilityStore";
import { calculateAge } from "@/utilities/utilityFunctions";

const { userprofile } = mapGetters();
const profile = {...userprofile.value.profile};
const dependants = {...userprofile.value.dependants};
const profileAge = calculateAge(profile.date_of_birth); 

const currentScreen = ref(0);
const riskFactorsOptions = [
	{ name: 'Yes', value: 'yes' },
	{ name: 'No', value: 'no' },
	{ name: 'Not sure', value: 'not_sure' },
]

const selectedPatient = ref('');
const selectedGender = ref('');
const selectedAge = ref(profileAge);
const selectedRiskFactors = {
	overweight: null,
	smoker: null,
	injury: null,
	cholesterol: null,
	hypertensive: null,
	diabetic: null,
}

// watch(sliderInput, (value) => {
// 	console.log('SLIDER', value)
// })


console.log('USER_PROFILE', userprofile.value)

const onSelectedPatient = (patient) => {
	console.log('onSelectedPatient', patient)
	selectedPatient.value = patient;
	if (patient === 'someone_else') currentScreen.value = 1;
	else currentScreen.value = 3;
}

const onSelectedGender = (gender) => {
	selectedGender.value = gender;
	currentScreen.value = 2;
	console.log('onSelectedGender', gender)
}



</script>

<style scoped lang="scss">
.page-content {
	@include flexItem(vertical) {
		gap: $size-12;
		width: 100%;
		height: 100vh;
		position: relative;
	}

	&__body {
		@include flexItem(vertical) {
			width: 100%;
			height: 100%;
			overflow-y: scroll;
			padding: $size-0 $size-48;
			background: $color-g-97;
			position: relative;
		}

		&::-webkit-scrollbar {
			display: none;
			width: $size-12;
			background-color: $color-g-92;
		}
	}
}
.user-container {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	gap: $size-64;

	& .user-container__heading {
		font-weight: $fw-semi-bold;
		font-size: $size-26;
		line-height: 30px;
		color: $color-black;
	}
	& .user-container__avatars {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: $size-88;

		& .user-container__avatars--avatar {
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			gap: $size-28;
			cursor: pointer;

			&:hover {
				& .user-container__avatars--image {
					border-radius: 100%;
					box-shadow: 2px 2px 2px 1px rgba(0, 0, 0, 0.2);
				}
				& .user-container__avatars--name {
					text-shadow: 2px 2px rgba(0, 0, 0, 0.2);
				}
			}

			& .user-container__avatars--name {
				font-weight: $fw-semi-bold;
				font-size: $size-20;
				line-height: 22px;
				color: $color-black;
			}
			& .user-container__avatars--icon {
				width: 60px;
				height: 60px;
				border: 1px solid $color-g-36;
				border-radius: 100%;
				color: $color-g-36;

				&:hover {
					box-shadow: 2px 2px 2px 1px rgba(0, 0, 0, 0.2);
				}
			}
		}
	}
}

.gender-container {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	gap: $size-64;

	& .gender-header {
		font-weight: $fw-semi-bold;
		font-size: $size-26;
		line-height: 30px;
		color: $color-black;
	}
	& .gender-content {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: $size-56;

		& .gender-content__gender {
			width: 184px;
			height: 184px;
			border-radius: $size-16;
			background: $color-white;
			filter: drop-shadow(0 25px 25px rgb(0 0 0 / 0.15));
			cursor: pointer;
			
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			gap: $size-12;

			&:hover {
				filter: drop-shadow(0 20px 13px rgb(0 0 0 / 0.03)) drop-shadow(0 8px 5px rgb(0 0 0 / 0.08));
			}

			& .gender-content__gender--text {
				font-weight: $fw-semi-bold;
				font-size: $size-20;
				line-height: 22px;
				color: $color-g-21;
				text-align: center;
			}
			& .gender-content__gender--icon {
				width: 33px;
				height: 33px;
			}

		}
	}
}
.age-container {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	gap: $size-64;

	& .age-header {
		font-weight: $fw-semi-bold;
		font-size: $size-26;
		line-height: 30px;
		color: $color-black;
	}
	& .age-content {
		width: 39rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $size-16;

		& .age-content__input {
			font-weight: $fw-semi-bold;
			font-size: $size-26;
			line-height: 30px;
			color: $color-black;
		}

	}
}
.age-footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
	position: relative;
	bottom: 20px;
}

.questionaire-container {
	width: 100%;
	// margin-top: $size-32;
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	gap: $size-0;
	background: $color-g-97;
	overflow: hidden;

	&::-webkit-scrollbar {
		display: none;
		width: $size-12;
		background-color: $color-g-92;
	}

	& .questionaire-header {
		position: fixed;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		gap: $size-4;
		border-bottom: $size-1 solid $color-g-67;
		padding-bottom: $size-16;
		background: $color-g-97;
		padding-top: $size-32;
		z-index: 1000;

		& .questionaire-header__title {
			font-weight: $fw-semi-bold;
			font-size: $size-20;
			line-height: 22px;
			color: $color-black;
		}
		& .questionaire-header__description {
			font-size: $size-16;
			line-height: 24px;
			text-align: left;
			color: $color-g-44;
		}
	}
	& .questionaire-content {
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

		& .questionaire-content__header {
			display: flex;
			flex-direction: column;
			justify-content: flex-start;
			gap: $size-4;

			& .questionaire-content__header--title {
				font-weight: $fw-regular;
				font-size: $size-24;
				line-height: 36px;
				color: $color-black;
			}
			& .questionaire-content__header--desc {
				font-size: $size-16;
				line-height: 24px;
				text-align: left;
				color: $color-g-44;
			}
		}
		& .questionaire-content__body {
			display: flex;
			flex-direction: column;
			justify-content: flex-start;
			gap: $size-32;

			& .questionaire-content__item {
				display: flex;
				flex-direction: column;
				justify-content: flex-start;
				gap: $size-24;

				& .questionaire-content__item--title {
					font-size: $size-20;
					font-weight: $fw-regular;
					line-height: 32px;
					color: $color-black;
				}
				& :deep(.questionaire-content__item--options) {
					display: flex;
					flex-direction: column;
				}
			}
		}
	}
	& .questionaire-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: $color-g-97;
		padding: $size-20 $size-0;
	}
}
</style>
