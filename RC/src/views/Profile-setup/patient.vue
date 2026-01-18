<template>
	<UpdateImageForm v-if="!moveto" @saved="isSaved" />
	<UpdateInfoForm v-if="moveto" />
</template>

<script>
import UpdateImageForm from "@/components/forms/Profile-setup/Update-image.vue";
import UpdateInfoForm from "@/components/forms/Profile-setup/Update-user-info.vue";

export default {
	name: "Patient Profile Setup",

	components: {
		UpdateImageForm,
		UpdateInfoForm,
	},

	data() {
		return {
			moveto: false,
		};
	},

	methods: {
		isSaved() {
			this.moveto = true;
		},
	},
};
</script>

<style scoped lang="scss"></style>
