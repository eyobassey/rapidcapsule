<template>
	<div class="right__pane">
		<div class="pane__dock">
			<!-- Cart Button with Badge -->
			<div class="cart-button-wrapper" v-if="cartItemCount > 0" @click="goToCart">
				<buttonIcon
					type="primary"
					iconName="cart-icon"
					:state="false"
				/>
				<span class="cart-badge">{{ cartItemCount > 99 ? '99+' : cartItemCount }}</span>
			</div>
			<buttonIcon
				type="primary"
				iconName="alarm-clock"
				:state="buttons[0].isActive"
				@click="openFlyout(0)"
			/>
			<div class="notification-btn-wrapper" @click="goToNotifications">
				<buttonIcon
					type="primary"
					iconName="bell"
					:state="false"
				/>
				<span v-if="unreadCount > 0" class="notification-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
			</div>
		</div>
		<div v-if="toggleState" class="flyout__container" :class="{ open: toggleState }">
			<Reminders @collapse="closeFlyout" class="flyout" />
		</div>
	</div>
</template>

<script>
import { mapGetters } from "vuex";
import buttonIcon from "../../buttons/button-icon.vue";
import Reminders from "./Reminders";

export default {
	data() {
		return {
			buttons: [
				{
					name: "reminders",
					icon: "alarm-clock",
					isActive: false,
				},
			],
		};
	},

	computed: {
		...mapGetters({
			cartItemCount: "pharmacy/getCartItemCount",
			unreadCount: "notifications/getUnreadCount",
		}),

		toggleState() {
			return this.buttons.some((i) => i.isActive);
		},
	},

	mounted() {
		this.$store.dispatch("notifications/fetchUnreadCount");
	},

	methods: {
		openFlyout(index) {
			this.buttons[index].isActive = !this.buttons[index].isActive;
		},

		closeFlyout() {
			this.buttons.forEach((i) => {
				i.isActive = false;
			});
		},

		goToCart() {
			this.$router.push("/app/patient/pharmacy/cart");
		},

		goToNotifications() {
			this.$router.push("/app/patient/notifications");
		},
	},

	components: {
		buttonIcon,
		Reminders,
	},
};
</script>

<style scoped lang="scss">
.right__pane {
	@include flexItem(horizontal) {
		position: relative;
		background-color: $color-g-95;

		@include responsive(phone) {
			background-color: transparent;
			display: none;
		}
	}

	.pane__dock {
		@include flexItem(vertical) {
			order: 2;
			gap: $size-16;
			padding: $size-32 $size-16;
			border-left: 1px solid $color-g-85;
		}

		.cart-button-wrapper,
		.notification-btn-wrapper {
			position: relative;
			cursor: pointer;

			.cart-badge,
			.notification-badge {
				position: absolute;
				top: -$size-4;
				right: -$size-4;
				min-width: $size-18;
				height: $size-18;
				background: $color-denote-red;
				color: white;
				border-radius: $size-10;
				font-size: $size-10;
				font-weight: 600;
				display: flex;
				align-items: center;
				justify-content: center;
				padding: 0 $size-4;
				z-index: 1;
			}
		}
	}

	.flyout__container {
		width: 0;
		opacity: 0;
		z-index: -10;

		transition: all 0.4s cubic-bezier(0.19, 0.68, 0.52, 0.96);

		@include responsive(small-laptop) {
			position: absolute;
			right: 0;
			width: 32rem;
			height: 100%;
		}

		&.open {
			opacity: 1;
			width: 32rem;
			z-index: 0;

			@include responsive(small-laptop) {
				right: 100%;
				background-color: $color-g-95;
				box-shadow: -$size-8 $size-0 $size-16 rgba($color-black, 0.15);
			}
		}
	}

	.flyout {
		height: 100%;
	}
}
</style>
