<template>
	<WebNav />
	<div class="wrapper">
		<div v-if="verified == 'verified'" class="container">
			<Illustrations name="check-solid-circle" class="illustration" />
			<div class="text-content">
				<h1 class="heading">Email verified</h1>
				<p class="copy">Click the button below to go to log in.</p>
			</div>
			<Button
				label="Log in to app"
				type="text"
				size="large"
				iconName="arrow-right"
				:iconRight="true"
				@click="handleClick"
			/>
		</div>
		<div v-if="verified == 'already verified'" class="container">
			<Illustrations name="check-solid-circle" class="illustration" />
			<div class="text-content">
				<h1 class="heading">{{ message }}</h1>
				<p class="copy">Click the button below to go to log in.</p>
			</div>
			<Button
				label="Log in to app"
				type="text"
				size="large"
				iconName="arrow-right"
				:iconRight="true"
				@click="handleClick"
			/>
		</div>
		<div v-else-if="verified == 'unverified'" class="container">
			<Illustrations name="x-solid-circle" class="illustration" />
			<div class="text-content">
				<h1 class="heading">{{ message }}</h1>
				<p class="copy">Click the button below to get a new verification link.</p>
			</div>
			<Button label="Resend Link" type="tertiary" size="large" @click="getNewLink" />
		</div>
	</div>
</template>

<script>
import { mapActions, mapGetters } from "vuex";
import Button from "../../components/buttons/button-primary.vue";
import WebNav from "@/components/Navigation/website-nav.vue";
import Illustrations from "@/components/illustrations.vue";

export default {
	components: {
		Button,
		WebNav,
		Illustrations,
	},

	computed: {
		...mapGetters({
			verified: "userRegAuth/verified",
			errorMessages: "userRegAuth/errorMessage",
			userEmail: "userRegAuth/email",
		}),

		message() {
			return this.errorMessages["email_ver_status"];
		},
	},

	methods: {
		...mapActions({
			verifyemail: "userRegAuth/verifyemail",
			resendVerLink: "userRegAuth/resendverlink",
		}),

		handleClick() {
			this.$router.push({ name: "Login" });
		},

		getNewLink() {
			this.resendVerLink({ userId: this.$route.query.userId })
				.then(() => {
					this.$router.push({ name: "Verify-email" });
				})
				.catch((error) => {
					console.log(error);
				});
		},
	},

	created() {
		this.verifyemail(this.$route.query);
	},
};
</script>

<style scoped lang="scss">
.wrapper {
	padding-top: 6.571rem;
}
.container {
	@include flexItem(vertical) {
		justify-content: flex-start;
		align-items: center;
		gap: $size-56;
	}
	padding-top: $size-86;

	@include responsive(phone) {
		padding-top: $size-48;
	}
}

.text-content {
	@include flexItem(vertical) {
		gap: $size-16;
		align-items: center;
	}

	.heading {
		font-size: $size-36;
		font-weight: $fw-bold;
		line-height: 1.25;
		text-align: center;
		color: $color-g-21;
	}

	.copy {
		font-size: $size-22;
		font-weight: $fw-regular;
		letter-spacing: 0.02;
		text-align: center;
		color: $color-g-44;
		max-width: 586px;
	}

	@include responsive(tab-portrait) {
		width: min(582px, 80%);
	}

	@include responsive(phone) {
		width: min(312px, 95%);

		.heading {
			font-size: $size-24;
		}

		.copy {
			font-size: $size-16;
		}
	}
}

.illustration {
	width: max(6.428rem, 6vw);
	height: auto;
}
</style>
