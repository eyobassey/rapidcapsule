<template>
	<div class="input__group">
		<DatePicker
			Label="Start date"
			class="date"
			:modelValue="startDate"
			@update:modelValue="$emit('update:startDate', $event)"
		/>
		<p v-show="!isExisting" class="dash">-</p>
		<DatePicker
			v-show="!isExisting"
			Label="End date"
			class="date"
			:modelValue="endDate"
			@update:modelValue="$emit('update:endDate', $event)"
		/>
		<CheckBox
			Name="present"
			label="condition still exists"
			:modelValue="isExisting"
			class="check-present"
			@update:modelValue="$emit('update:status', $event)"
		>
			<p>This condition still exists</p>
		</CheckBox>
	</div>
</template>

<script>
import DatePicker from "@/components/inputs/date-picker.vue";
import CheckBox from "@/components/inputs/check-box.vue";

export default {
	name: "Date range picker",

	components: {
		DatePicker,
		CheckBox,
	},

	props: {
		startDate: {
			type: String,
			default: "",
		},
		endDate: {
			type: String,
			default: "",
		},
		status: {
			type: Boolean,
			default: false,
		},
	},

	computed: {
		isExisting() {
			return this.status;
		},
	},

	emits: ["update:startDate", "update:endDate", "update:status"],
};
</script>

<style lang="scss" scoped>
.input__group {
	align-items: center;
	width: 100%;

	.date {
		max-width: 200px;

		@include responsive(phone) {
			max-width: 100%;
		}
	}
	.dash {
		flex-grow: 0;
		flex-shrink: 1;
		flex-basis: 0;
	}
	.check-present {
		margin-top: $size-16;
		width: 100%;
	}

	@include responsive(phone) {
		@include flexItem(vertical) {
			justify-content: flex-start;
			.date {
				width: 100%;
			}
			.check-present {
				margin-top: $size-16;
				width: 100%;
			}
			.dash {
				display: none;
			}
		}
	}
}
</style>
