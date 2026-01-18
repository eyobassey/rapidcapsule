<template>
	<div class="wrapper">
		<div class="container">
			<p class="fs-20 fw-semi-bold lh-125 align-center">Welcome</p>
			<form @submit.prevent="submit" class="main-content">
				<Avatar
					v-model="profileImage"
					:firstname="userProfile.profile.first_name"
					:lastname="userProfile.profile.last_name"
				/>
				<div class="text-content">
					<h1 class="fs-48 lh-150 fw-bold align-center">
						{{ userProfile.profile.first_name }} {{ userProfile.profile.last_name }}
					</h1>
					<p class="fs-16 fw-regular lh-150 ls-20 align-center">
						Let us guide you through setting up your account. Hit the “Get Started”
						button and follow the prompts to set up your profile.
					</p>
				</div>
			</form>
			<Button label="Get Started" type="primary" size="large" @click="handleClick" />
		</div>
	</div>
</template>

<script>
import { mapActions, mapGetters } from "vuex";
import Avatar from "@/components/Avatars/avatar.vue";
import Button from "@/components/buttons/button-primary.vue";

export default {
	name: "Welcome",

	components: {
		Avatar,
		Button,
	},

	data() {
		return {
			profileImage: null,
		};
	},

	computed: {
		...mapGetters({
			userProfile: "userprofile",
			updatedInfo: "profileSetup/addedInfo",
		}),
	},

	emits: ["saved"],

	methods: {
		...mapActions({
			updateProfileImage: "profileSetup/updateprofileimage",
		}),

		handleClick() {
			this.submit();
		},

		submit() {
			if (this.profileImage) {
				this.updateProfileImage(this.profileImage).then(() => {
					this.$emit("saved");
				});
			} else {
				this.$emit("saved");
			}
		},
	},

	watch: {
		updatedInfo: {
			handler(value) {
				if (value.profile) {
					this.profileImage = value.profile.profile_photo;
				}
			},
		},
	},
};
</script>

<style scoped lang="scss">
.wrapper {
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
