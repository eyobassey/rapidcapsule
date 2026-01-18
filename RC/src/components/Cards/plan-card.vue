<template>
	<div class="plan__container" :class="{ featured: featured }">
		<div class="plan__head">
			<div class="title__container">
				<h3 class="title" :class="{ active: active }">Rapid Capsule Premium</h3>
			</div>
			<div class="price__container">
				<h3 class="price">5,200</h3>
				<p class="freq">per Month</p>
			</div>
		</div>
		<div class="plan__body">
			<ul class="features">
				<li class="feature">Unlimited Consultations</li>
				<li class="feature">25 GB of Storage space</li>
				<li class="feature">Video Calls</li>
				<li class="feature">+ All features in Free Plan</li>
				<li class="feature">
					<a href="*" class="text-link">See all features</a>
				</li>
			</ul>
		</div>
		<div class="plan__foot">
			<Button type="primary" size="medium" label="Upgrade to Premium" />
		</div>
	</div>
</template>

<script>
import Button from "@/components/buttons/button-primary.vue";

export default {
	name: "Plan Card",

	components: {
		Button,
	},

	props: {
		active: {
			type: Boolean,
			default: false,
		},
		featured: {
			type: Boolean,
			default: false,
		},
	},
};
</script>

<style lang="scss" scoped>
.plan {
	&__container {
		@include flexItem(vertical) {
			position: relative;
			align-items: center;
			gap: $size-32;
			padding: $size-48 $size-32 $size-24 $size-32;
			border-radius: $size-10;
			border: $size-1 solid $color-g-67;
			width: 29rem;
			overflow: hidden;
			flex-shrink: 0;
		}

		&.featured::after {
			content: "Most Popular";
			position: absolute;
			@include flexItem(horizontal) {
				justify-content: center;
				top: 5%;
				right: -18%;
				transform: rotateZ(40deg);
				transform-origin: 50% 50%;
				padding: $size-8 $size-16;
				width: 50%;
				font-size: $size-14;
				color: $color-sec-s3;
				font-weight: $fw-medium;
				line-height: 1.5;
				letter-spacing: 0.05em;
				background-color: $color-sec-t3;
			}
		}
	}

	&__head {
		@include flexItem(horizontal) {
			align-items: center;
			gap: $size-44;
			width: 100%;
			padding: $size-36 $size-16;
			border-bottom: $size-1 solid $color-g-90;
		}
		.title__container {
			width: 50%;
			.title {
				font-size: $size-20;
				font-weight: $fw-semi-bold;
				line-height: 1.5;
				color: $color-g-21;

				&.active::after {
					content: "Active";
					@include flexItem(horizontal) {
						display: inline-block;
						flex-shrink: 1;
						justify-content: center;
						align-items: center;

						width: max-content;
						padding: $size-2 $size-8;
						margin-left: $size-8;
						background-color: $color-sec-s2;
						border-radius: 100vw;

						font-size: $size-12;
						font-weight: $fw-medium;
						color: $color-white;
						line-height: 1.5;
						letter-spacing: 0.05em;
						vertical-align: middle;
					}
				}
			}
		}

		.price__container {
			@include flexItem(vertical) {
				align-items: flex-end;
				flex-grow: 1;
			}

			.price {
				font-size: $size-32;

				&::before {
					content: "₦";
					font-size: $size-16;
					font-weight: $fw-regular;
					vertical-align: super;
					margin-right: $size-4;
					color: $color-g-21;
				}
			}

			.freq {
				font-size: $size-14;
				color: $color-g-44;
				font-weight: $fw-regular;
			}
		}
	}

	&__body {
		width: 100%;

		.features {
			list-style: none;
			padding: $size-0 $size-8;

			.feature {
				padding: $size-8;
				font-size: $size-16;
				font-weight: $fw-regular;
				color: $color-g-44;
				line-height: 1.5;
				letter-spacing: 0.02em;
				text-align: center;

				.text-link {
					color: $color-sec-s2;
				}
			}
		}
	}

	&__foot {
		width: 100%;
		padding-top: $size-24;
		border-top: $size-1 solid $color-g-90;

		& > * {
			width: 100%;
		}
	}
}
</style>
