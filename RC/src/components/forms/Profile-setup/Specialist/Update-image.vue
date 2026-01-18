<template>
	<div class="wrapper">
		<div class="container">
			<p class="fs-20 fw-semi-bold lh-125 align-center">Welcome</p>
			<form @submit.prevent="submit" class="main-content">
				<Avatar
					v-model="uploadedFile"
					:firstname="profile.first_name"
					:lastname="profile.last_name"
					:image="profile.profile_image"
				/>
				<div class="text-content">
					<h1 class="fs-48 lh-150 fw-bold align-center">
						{{ profile.first_name }} {{ profile.last_name }}
					</h1>
					<p class="fs-16 fw-regular lh-150 ls-20 align-center">
						Let us help you set up your account and get verified. 
						Hit the “Get Started” button and fill the form.
					</p>
				</div>
			</form>
			<Button
				label="Get Started"
				type="primary"
				size="large"
				:disabled="!uploadedFile"
				@click="$emit('saved')"
			/>
		</div>
	</div>
</template>

<script setup>
import { ref, watchEffect } from "vue";
import Avatar from "@/components/Avatars/avatar.vue";
import Button from "@/components/buttons/button-primary.vue";
import { mapGetters, mapActions, mapState } from "@/utilities/utilityStore";
import { onFileChange, fileToBase64 } from "@/utilities/utilityUpload";

const { userprofile } = mapGetters();
const { 'userModule/setCurrentUser': setCurrentUser } = mapActions();

const profile = { ...userprofile.value.profile };
const uploadedFile = ref();

watchEffect(async () => {
	if(uploadedFile.value) {
		const profile_photo = await fileToBase64(uploadedFile.value);
		setCurrentUser({ ...userprofile.value, profile: { ...profile, profile_photo } });
	}
});

defineEmits(['saved']);
</script>

<style scoped lang="scss">
.wrapper {
	width: 100%;
	height: 100vh;

	@include flexItem(horizontal) {
		align-items: center;
	}
}
.container {
	@include flexItem(vertical) {
		align-items: center;
		justify-content: center;
		gap: $size-48;
	}
	max-width: 85%;
}

.main-content {
	@include flexItem(vertical) {
		align-items: center;
		gap: $size-32;
	}
}

.text-content {
	@include flexItem(vertical) {
		align-items: center;
		gap: $size-24;
	}

	& > h1 {
		@include responsive(phone) {
			font-size: $size-36;
			line-height: 1;
		}
	}

	p {
		color: $color-g-44;
		width: min(458px, 100%);
	}
}
</style>
