<template>
  <div class="container">
    <rc-select
        class="category-selector"
        label="Select Category"
        placeholder="Professional Category"
        :options="categoryOptions"
        v-model="payload.category"
    />
    <div class="available-specialists">
        <p class="available-specialists__heading">
            Available Specialist Categories
        </p>
        <div class="available-specialist__options">
            <div :class="{'active': payload.specialist === specialist}"
                v-for="specialist in specialistOptions"
                :key="specialist"
                @click="payload.specialist = specialist">
                <p class="available-specialist__option">{{ specialist }}</p>
            </div>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, watchEffect } from "vue";
import RcSelect from "@/components/RCSelect";

const emit = defineEmits(['next']);
const { bookingInfo, useBookingInfo } = inject('$_BOOKING_INFO');
useBookingInfo({ heading: 'Select Specialist Category', hasFooter: false, proceed: false });

const payload = ref({
    category: '',
    specialist: ''
});

const categoryOptions = ref([
    'Medical Doctor (M.D.)',
    'Clinical P & Therapist',
    'Dietitian/Nutritionist',
    'Care Giver',
    'Lab Technician',
    'Pharmacist'
]);

const specialistOptions = ref([
    'Medical Doctor (General Practitioner)',
    'Cardiologist',
    'Pediatrician',
    'Neurologist',
    'Dermatologist',
    'Oncologist'
]);

watchEffect(() => {
    if (Object.values(payload.value).every(i => i)) {
        useBookingInfo({ payload: {
            ...bookingInfo.value.payload,
            professional_category: payload.value.category,
            specialist_category: payload.value.specialist
        }});

        useBookingInfo({ proceed: !!payload.value, current: 3 });
    }
});

</script>

<style scoped lang="scss">
.container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    gap: $size-44;
    padding: $size-32;

    @include responsive(phone) {
        width: 100%;
        height: 100%;
    }
}
.category-selector {
    width: 100%;
}
.available-specialists {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    gap: $size-24;
    width: 100%;

    .available-specialists__heading {
        font-size: $size-14;
        font-weight: $fw-regular;
        line-height: 21px;
        color: $color-g-44;
    }
    .available-specialist__options {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: flex-start;
        padding: $size-0 $size-8;
        width: 100%;

        & div {
            width: 100%;
            cursor: pointer;
            padding: $size-12;
            border-radius: $size-8;

            &:hover {
                background: $color-g-97;
            }
        }
        .active {
            background: $color-g-97;
        }
        .available-specialist__option {
            font-weight: $fw-regular;
            font-size: $size-16;
            line-height: 24px;
            color: $color-g-21;
        }
    }
}
</style>