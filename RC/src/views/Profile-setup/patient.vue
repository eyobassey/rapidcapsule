<template>
	<UpdateImageForm @saved="goToOnboarding" />
</template>

<script>
import UpdateImageForm from "@/components/forms/Profile-setup/Update-image.vue";

export default {
	name: "Patient Profile Setup",

	components: {
		UpdateImageForm,
	},

	methods: {
		goToOnboarding() {
			// Redirect to new patient onboarding flow
			this.$router.push('/app/patient/onboarding');
		},
	},
};
</script>

<style scoped lang="scss"></style>
