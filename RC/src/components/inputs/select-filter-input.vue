<template>
	<div class="input__container">
		<div class="input" :class="{ disabled: disabled }">
			<input
				type="text"
				v-show="mode.toLowerCase() === 'country'"
				autocomplete="off"
				:id="identity"
				:name="name"
				:readonly="disabled"
				class="input__field"
				:class="{ populated: countryValue }"
				:value="countryValue"
				@input="whileTyping($event)"
				@blur="handleBlur"
			/>
			<input
				type="text"
				v-show="mode.toLowerCase() === 'state'"
				autocomplete="off"
				:id="identity"
				:name="name"
				:readonly="disabled"
				class="input__field"
				:class="{ populated: stateValue }"
				:value="stateValue"
				@input="whileTyping($event)"
				@blur="handleBlur"
			/>
			<label :for="name" class="input__label">
				{{ label }}
				<span v-show="required">*</span>
			</label>
		</div>
		<div class="input__drop-down drop-shadow" :class="{ open: isOpen, [position]: isOpen }">
			<div class="input__drop-down--container">
				<div
					class="input__drop-down--item fs-16 lh-150 fw-regular"
					v-for="(item, index) in filteredList"
					:key="index"
					:id="identity"
					tabindex="-1"
					@click="selectedOption(item, $event.target.id)"
				>
					{{ item }}
				</div>
			</div>
		</div>

		<slot />
	</div>
</template>

<script>
import CountryData from "country-all-data";

export default {
	emits: ["update:country-value", "update:state-value", "selected-item"],

	props: {
		label: {
			type: String,
			required: true,
		},
		name: {
			type: String,
			required: true,
		},
		id: String,
		disabled: {
			type: Boolean,
			default: false,
		},
		required: {
			type: Boolean,
			default: false,
		},
		position: {
			type: String,
			default: "bottom",
		},
		basedOn: {
			type: String,
			defaulty: null,
		},
		mode: {
			type: String,
			required: true,
		},
		countryValue: String,
		stateValue: String,
	},

	data() {
		return {
			identity: this.id ? this.id : this.name,
			openState: false,
			countryList: [],
			stateList: [],
		};
	},

	computed: {
		filteredList() {
			let mode = this.mode.toLowerCase();

			if (mode === "state") {
				let inputState = this.stateValue ? this.stateValue : "";
				let value = this.basedOn;
				let countryIndex = this.countryList.indexOf(value);
				let index = value ? (countryIndex !== -1 ? countryIndex : null) : null;

				if (index) {
					let states = this.stateList[index];

					if (inputState) {
						return states.filter((state) => {
							return state.toLowerCase().includes(inputState.toLowerCase());
						});
					}
				}
			}
			if (mode === "country") {
				let inputCountry = this.countryValue ? this.countryValue : "";

				if (inputCountry) {
					return this.countryList.filter((country) => {
						return country.toLowerCase().includes(inputCountry.toLowerCase());
					});
				}
			}
		},

		isOpen() {
			if (this.filteredList) {
				return this.filteredList.length > 0 && this.openState ? true : false;
			}
		},
	},

	methods: {
		async getCountryData() {
			let responsedata = await CountryData.getAllCountries();
			let countryData = responsedata.countries;

			countryData.forEach((item) => {
				this.countryList.push(item.country);
				this.stateList.push(item.states);
			});
		},

		whileTyping(evt) {
			this.openState = true;
			let mode = this.mode.toLowerCase();

			if (mode === "country") {
				this.$emit("update:country-value", evt.target.value);
			}
			if (mode === "state") {
				this.$emit("update:state-value", evt.target.value);
			}
		},

		selectedOption(selected, evt) {
			let mode = this.mode.toLowerCase();
			this.openState = false;

			if (mode === "country") {
				this.$emit("update:country-value", selected);
				this.$emit("selected-item", { selectedItem: selected, target: evt });
				return true;
			}
			if (mode === "state") {
				this.$emit("update:state-value", selected);
				return true;
			}
		},

		handleBlur() {
			setTimeout(() => {
				this.openState = false;
			}, 150);
		},
	},

	mounted() {
		this.getCountryData();
	},
};
</script>

<style scoped lang="scss">
.input__container {
	@include flexItem(vertical) {
		gap: $size-4;
		min-width: 200px;
		position: relative;
	}

	& > p {
		color: $color-denote-red;
	}
}
.input {
	position: relative;
	&.disabled {
		& > .input__field {
			pointer-events: none;
			background-color: $color-g-90;
			color: $color-g-67;
		}

		& > .input__label {
			color: $color-g-67;
		}
	}

	&__field {
		width: 100%;
		height: 3.6rem;
		padding: $size-20 $size-16 $size-8 $size-16;

		border-radius: $size-8;
		border: 1px solid $color-g-67;

		font-family: inherit;
		font-size: $size-16;
		font-weight: $fw-regular;
		color: $color-black;
		line-height: 1.5;
		letter-spacing: 0.02em;

		// border: none;
		outline: none;
		box-shadow: none;

		&:focus {
			border-color: $color-pri-t2;
			border-width: 1px;

			& ~ .input__label {
				top: $size-14;

				font-family: inherit;
				color: $color-pri;
				font-size: $size-11;
				font-weight: $fw-regular;
				line-height: 1.5;
				letter-spacing: 0.04em;

				span {
					display: none;
				}
			}

			& .populated ~ .input__label {
				color: $color-pri;
				font-weight: $fw-semi-bold;
			}
		}
	}

	&__label {
		position: absolute;
		top: 50%;
		left: $size-16;
		transform: translateY(-50%);

		font-family: inherit;
		color: $color-g-54;
		font-size: $size-16;
		font-weight: $fw-regular;
		line-height: 1.5;
		letter-spacing: 0.04em;

		pointer-events: none;

		transition: all 150ms ease-out;

		span {
			color: $color-denote-red;
			font-family: inherit;
			vertical-align: top;
			font-size: $size-14;
		}
	}
}

.input__drop-down {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	z-index: -5;

	padding: $size-8 $size-6;
	margin-top: $size-4;
	border-radius: $size-8;
	background-color: $color-white;
	opacity: 0;
	max-height: $size-0;
	width: 16.667rem;

	transition: opacity 150ms ease-out;

	&--container {
		max-height: 15.67rem;
		overflow-y: scroll;

		&::-webkit-scrollbar {
			width: $size-4;
		}

		&::-webkit-scrollbar-thumb {
			background-color: $color-g-95;
		}
	}

	&--item {
		display: none;
		width: 98%;
		padding: $size-8 $size-12;
		cursor: pointer;
		user-select: none;
		border-radius: $size-4;

		&:hover {
			background-color: $color-g-90;
		}
	}

	&.open {
		opacity: 1;
		max-height: 16.667rem;
		z-index: 100;

		& > .input__drop-down--container * {
			display: block;
		}
	}
	&.bottom {
		transform-origin: top;
		transform: translateY(105%);
	}
	&.top {
		transform-origin: bottom;
		transform: translateY(-105%);
	}
}

.populated {
	& ~ .input__label {
		top: $size-14;

		font-family: inherit;
		color: $color-g-54;
		font-size: $size-11;
		font-weight: $fw-regular;
		line-height: 1.5;
		letter-spacing: 0.04em;

		span {
			display: none;
		}
	}
}
</style>
