<template>
  <div class="entry-container">
    <div class="illustration-container">
        <img :src="require('@/assets/illustrations/diagnose-heart.svg')" />
    </div>
    <div class="content-container">
        <h1 class="content-header">Take Symptom Diagnosis</h1>
        <div class="content-body">
            <p class="content-body__text">We recommend that you go through a diagnosis session before booking an appointment with a medical professional.</p>
            <p class="content-body__text">Doing this will give the medical professional background knowledge about your condition and save you time in consultation meetings.</p>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject } from "vue";
import RcIcon from "@/components/RCIcon";
import RcButton from "@/components/buttons/button-primary";

const { navigator, useNavigator } = inject('$_NAVIGATOR');
const { bookingInfo, useBookingInfo } = inject('$_BOOKING_INFO');
useBookingInfo({ heading: null, hasFooter: true });


const submit = (next) => {
    const { current, from, to } = navigator.value;
    useNavigator({ current, from, to: next });
}

</script>

<style scoped lang="scss">
.entry-container {
    width: 510px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    gap: $size-44;
    padding: $size-24 $size-32;

    @include responsive(tab-landscape) {
        flex-direction: row;
        justify-content: flex-start;
        align-items: flex-start;
        height: 300px;
        width: 100%;
        padding: $size-16 $size-32;
    }
    @include responsive(phone) {
        width: 100%;
        height: 100%;
        flex-direction: column;
        align-items: center;
        padding: $size-24;
    }
}
.illustration-container {
    display: flex;
    justify-content: center;
    align-items: flex-start;

    @include responsive(tab-landscape) {
        align-items: center;
        height: 100%;
    }

    .illustration {
        width: 172px;
        height: 118px;
    }
}
.content-container {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    gap: $size-24;

    @include responsive(tab-landscape) {
        align-items: flex-start;
        height: 100%;
    }
    @include responsive(phone) {
        align-items: center;
        height: 100%;
    }

    .content-header {
        font-weight: $fw-semi-bold;
        font-size: $size-24;
        color: $color-black;
        line-height: 36px;
    }
    .content-body {
        display: flex;
        flex-direction: column;
        gap: $size-24;

        .content-body__text {
            font-size: $size-16;
            font-weight: $fw-regular;
            color: $color-black;
            line-height: 24px;
        }
    }
}
</style>