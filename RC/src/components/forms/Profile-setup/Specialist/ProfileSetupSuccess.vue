<template>
    <div class="success-container">
        <rc-icon icon-name="check-circle-solid" size="auto" class="success-icon" />
        <h1 class="success-heading">Successful</h1>
        <p class="success-description">
            Your details have been sent successfully. We will send you notifications 
            with updates on your verification status.
        </p>
        <rc-button
            :label="redirect ? 'Redirecting...' : 'Go to Profile'"
            type="tertiary"
            size="large"
            :loading="redirect"
            :disabled="redirect"
            @click="onRedirect()"
        />
    </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from 'vue-router';
import RcIcon from "@/components/RCIcon";
import RcButton from "@/components/buttons/button-primary";

const router = useRouter();
const redirect = ref(false);

const onRedirect = () => {
    redirect.value = true;
    router.push({ name: 'SpecialistAccount' });
}
</script>


<style scoped lang="scss">
.success-container {
    width: 100%;
    height: 100vh;

    @include flexItem(vertical) {
        justify-content: center;
        align-items: center;
		gap: $size-32;
	}
    

    & .success-icon {
        width: 138px;
        height: 138px;
    }
    & .success-heading {
        font-weight: $fw-bold;
        font-size: $size-40;
        line-height: $size-48;
        color: $color-black;
    }
    & .success-description {
        font-size: $size-20;
        color: $color-g-44;
        width: 50vw;
        text-align: center;
        line-height: 30px;

        @include responsive(phone) {
            width: 100%;
        }
    }
}
</style>