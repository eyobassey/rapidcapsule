<template>
	<div>
		<div class="select-container" :class="{ containerActive: isFocused }">
			<span v-if="placeholder && hasPlaceholder" class="select-label" :class="{ labelActive: isFocused }">
				{{ placeholder }}
			</span>
			<v-select
				ref="vSelectRef"
				class="select-component"
				v-model="modelValue"
				:multiple="multiple"
				:options="options"
				:label="label"
				:reduce="reduce"
				:placeholder="placeholder"
				:clearable="clearable"
				:filterable="filterable"
				@focus="isFocused = true"
				@blur="isFocused = false"
				@option:selected="$emit('selected', $event)"
				@search="$emit('search', $event)"
			>
				<template v-slot:option="option">
					<div style="width:100%" v-if="slotted"><slot name="options" :option="option" /></div>
					<span v-else class="select_component-item">{{ option[label] }}</span>
				</template>
				<template v-slot:no-options="{ search, searching }">
					<template v-if="searching">
						No results found for <em>{{ search }}</em>.
					</template>
					<em v-else style="opacity: 0.5">Start typing to search.</em>
				</template>
			</v-select>
		</div>
		<span class="error" v-if="errorMessage">{{ errorMessage }}</span>
	</div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import VSelect from 'vue-select';
import OpenIndicator from './OpenIndicator.vue';
VSelect.props.components.default = () => ({ OpenIndicator });

const emit = defineEmits([
	'update:modelValue',
	'reduce',
	'selected'
]);

const props = defineProps({
	modelValue: { required: true, default: () => {} },
	label: { type: String, required: true, default: '' },
	reduce: { type: Function, required: false },
	errorMessage: { type: String, default: '' },
	multiple: { type: Boolean, default: false },
	clearable: { type: Boolean, default: false },
	slotted: { type: Boolean, default: false },
	isOpen: { type: Boolean, default: false },
	hasPlaceholder: { type: Boolean, default: true },
	placeholder: { type: String, default: 'Search' },
	options: { type: Array, required: true, default: () => ['Option 1', 'Option 2'] },
});

const vSelectRef = ref();
const modelValue = ref();
const isFocused = ref(false);

onMounted(() => {
	modelValue.value = props.modelValue;
	if (props.isOpen) vSelectRef.value.searchEl.focus();
})
watch(modelValue, modelValue => {
	emit('update:modelValue', modelValue);
});
</script>

<style scoped lang="scss">
.select-container {
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	align-items: flex-start;
	width: 100%;
	height: 3.5rem;
	border-radius: $size-8;
	border: 1px solid $color-g-67;
	padding: $size-8 $size-0;

	&:hover, &:focus, &:active {
		border: 1px solid $color-pri-t2;
		color: $color-pri-t2;
	}
}
.select-label {
	font-weight: $fw-regular;
	font-size: $size-11;
	line-height: 11px;
	color: $color-g-67;
	padding: $size-0 $size-16;
}
:deep(.v-select) {
	display: flex;
	align-items: center;
	width: 100%;
	height: 100%;

	.vs__search::placeholder {
		color: $color-g-54;
	}
	.vs__dropdown-toggle {
		width: 100%;
		height: 100%;
		border: 0;
		font-family: inherit;
		font-size: $size-16;
		font-weight: $fw-regular;
		color: $color-black;
		line-height: 1.5;
		letter-spacing: 0.02em;
		padding: $size-0 $size-12;
	}
	.vs__dropdown-option {
		padding: $size-8 $size-12;
		margin: $size-0 $size-3;
		cursor: pointer;
		user-select: none;
		border-radius: $size-4;
		color: $color-black;
		font-family: inherit;
		font-size: $size-16;
	}
	.vs__selected-options {
		overflow: hidden;
		// padding: $size-0 $size-8;

		.vs__selected {
			white-space: nowrap;
			margin: 0;
			padding: 0;
		}
	}
	.vs__dropdown-menu .vs__dropdown-option--highlight,
	.vs__dropdown-option .vs__dropdown-option--selected {
		background-color: $color-g-90;
	}	
}
.containerActive {
	border: 1px solid $color-pri-t2;
}
.labelActive {
	color: $color-pri-t2 !important;
}
</style>
