<template>
	<div>
		<WebsiteNavigation />
		<ProfileSetupSuccess v-if="isSetupSuccess" />
		<div v-else>
			<UpdateImageForm v-if="!isMoveTo" @saved="isMoveTo = true" />
			<UpdateInfoForm v-else @success="isSetupSuccess = true" />
		</div>
	</div>
</template>

<script setup>
import { ref } from "vue";
import WebsiteNavigation from "@/components/Navigation/website-nav";
import UpdateImageForm from "@/components/forms/Profile-setup/Specialist/Update-image";
import UpdateInfoForm from "@/components/forms/Profile-setup/Specialist/Update-user-info";
import ProfileSetupSuccess from "@/components/forms/Profile-setup/Specialist/ProfileSetupSuccess";

const isMoveTo = ref(false);
const isSetupSuccess = ref(false);

</script>