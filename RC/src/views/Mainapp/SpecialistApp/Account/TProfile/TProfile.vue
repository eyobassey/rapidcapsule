<template>
    <loader v-if="isLoading" :useOverlay="false" style="position: absolute" />
    <div v-else class="container">
        <bio-data-section
            :key="JSON.stringify(accountInfo)"
            :accountInfo="accountInfo"
            @success="getCurrentUser()"
            @close="getCurrentUser()"
        />
        <certification-section
            :key="JSON.stringify(accountInfo)"
            :accountInfo="accountInfo"
            @success="getCurrentUser()"
            @close="getCurrentUser()"
        />
        <award-section
            :key="JSON.stringify(accountInfo)"
            :accountInfo="accountInfo"
            @success="getCurrentUser()"
            @close="getCurrentUser()"
        />
    </div>
</template>

<script setup>
import { defineComponent, ref, inject } from "vue";
import Loader from "@/components/Loader/main-loader";

import BioDataSection from "./BioData";
import CertificationSection from "./Certifications";
import AwardSection from "./Awards";

const $http = inject('$http');

const isLoading = ref(true);
const accountInfo = ref({});

getCurrentUser()
async function getCurrentUser(){
    await $http.$_getCurrentUser().then(({ data }) => {
        accountInfo.value = data.data;
        isLoading.value = false;
    });
}

</script>

<style scoped lang="scss">
.container {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: $size-32;
}
</style>