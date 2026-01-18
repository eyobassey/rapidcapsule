<template>
	<div class="combo-container" :class="{ containerActive: isFocused }">
		<div class="text-container">
			<label :for="name" class="input-label" v-if="payload.text" :class="{ 'active-input-label': isFocused }">
				{{ placeholder }} <span :class="{ 'active-input-label': isFocused }" v-show="required">*</span>
			</label>
			<input
				:name="name"
                type="text"
                class="text-input"
                @focus="isFocused = true"
                @blur="isFocused = false"
				@input="$emit('update:input', payload.text)"
                v-model="payload.text"
				:placeholder="placeholder"
				:required="required"
            />
		</div>
        <div class="select_container">
            <v-select :options="options" :clearable="false" v-model="payload.option" @option:selected="$emit('update:select', payload.option)">
                <template v-slot:options="option">
                    <span class="select_component-item">{{ option }}</span>
                </template>
            </v-select>
        </div>
        <template v-if="errorMessage">
            <span class="error"> {{ errorMessage }}</span>
        </template>
	</div>
</template>

<script>
import { ref, defineComponent, onMounted, watch } from 'vue';
import VSelect from 'vue-select';
import OpenIndicator from './OpenIndicator.vue';

VSelect.props.components.default = () => ({ OpenIndicator });

export default defineComponent({
  	setup(props, ctx) {
		const isFocused = ref(false);
        const payload = ref({ text: null, option: null }); 

        watch(payload, (modelValue) => {
			ctx.emit('update:modelValue', modelValue);
		});

        onMounted(() => {
			payload.value = {...payload.value, ...props.modelValue};
			if (props.input) payload.value.text = props.input;
			if (props.select) payload.value.option = props.select;
		});

    	return { isFocused, payload };
  	},
    components: { VSelect },
	emits: ["update:modelValue"],
	props: {
        modelValue: { required: true, default: () => {} },
		errorMessage: { type: String, default: '' },
		name: { type: String, default: 'RC-ComboBox' },
		input: { type: String, default: '' },
		select: { type: String, default: '' },
		placeholder: { type: String, default: '' },
		required: { type: Boolean, default: false },
		options: { type: Array, required: true, default: ['Option 1', 'Option 2'] },
	},
});
</script>

<style scoped lang="scss">
.combo-container {
	width: 100%;
	height: 3.6rem;
	border: 1px solid $color-g-67;
	border-radius: $size-8;
	position: relative;
	padding: $size-3;
	display: flex;
	justify-content: space-between;
	align-items: center;
}
.containerActive {
	border: 1px solid $color-pri-t2;
}
.select_container {
    width: 100%;
    height: 100%;
    background: $color-g-90;
    border-radius: $size-6;
    cursor: pointer;
}
:deep(.vs__search) {
    position: absolute;
}
:deep(.v-select) {
	display: flex;
	align-items: center;
	width: 100%;
	height: 100%;
	border-radius: $size-8;
	border: 0;

    .vs__selected {
        margin: 0;
    }
	.v-select-item {
		background: red;
	}
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
	.vs__dropdown-menu .vs__dropdown-option--highlight,
	.vs__dropdown-option .vs__dropdown-option--selected {
		background-color: $color-g-90;
	}
}
.text-container{
	width: 150%;
	height: 100%;
}
.text-input {
	width: 100%;
	height: 100%;
	border: none;
	outline: 0;
	font-size: $size-16;
	padding: $size-8;
}
.input-label {
	padding: $size-6 $size-8;
	position: absolute;
	top: 0;
	font-size: $size-12;
	color: $color-g-54;
}
.active-input-label {
	color: $color-pri-main;
}
</style>
