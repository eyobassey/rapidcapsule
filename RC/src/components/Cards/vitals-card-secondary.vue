<template>
	<div class="card-vital">
		<div class="icon-container">
			<Icons :name="vital.icon" fill="#F16439" id="vital-icon" />
		</div>
		<div class="card-vital__content">
			<h3 class="card-vital__content--title">{{ vital.name }}</h3>
			<div class="card-vital__content--body">
				<div class="value-group">
					<h1 class="value">
						{{ vital.value }}
					</h1>
					<p class="unit">{{ vital.unit }}</p>
				</div>
			</div>
		</div>
		<ContextMenuKebab
			iconColor="#6F6F6F"
			button-type="tertiary"
			button-size="small"
			size="450%"
			:dropList="contextMenuVital"
			dropAlign="right"
			@selection="catchAction"
		/>
	</div>
</template>

<script>
import Icons from "@/components/icons.vue";
import ContextMenuKebab from "@/components/utitlity/context-menu-kebab.vue";

export default {
	name: "Item Card: Vitals Secondary",

	emits: ["updateVital"],

	components: {
		Icons,
		ContextMenuKebab,
	},

	props: {
		vital: {
			type: Object,
			Required: true,
		},
	},

	data() {
		return {
			contextMenuVital: ["update"],
		};
	},

	methods: {
		catchAction(selectionIndex) {
			if (selectionIndex == 0) {
				this.$emit("updateVital");
			}
		},
	},
};
</script>

<style scoped lang="scss">
.card-vital {
	@include flexItem(horizontal) {
		gap: $size-16;
		flex-grow: 1;
		min-width: 19.2rem;
		max-width: 50%;
		padding: $size-16 $size-8 $size-16 $size-16;
		background-color: $color-white;
		border-radius: $size-16;
		border: $size-1 solid $color-pri-t3;
		box-shadow: $size-12 $size-16 $size-48 rgba($color-black, 0.15),
			$size-8 $size-12 $size-24 rgba($color-black, 0.18);

		@include responsive(phone) {
			max-width: 100%;
		}
	}

	.icon-container {
		@include flexItem(horizontal) {
			align-items: center;
			justify-content: center;
			padding: $size-16;
			background-color: $color-pri-t5;
			border-radius: $size-8;

			#vital-icon {
				width: $size-32;
				height: $size-32;
			}
		}
	}

	&__content {
		@include flexItem(vertical) {
			flex-grow: 1;
			gap: $size-16;
		}

		&--title {
			font-size: $size-14;
			font-weight: $fw-regular;
		}

		&--body {
			@include flexItem(vertical) {
				flex-grow: 1;
				justify-content: flex-end;
			}

			.value-group {
				@include flexItem(horizontal) {
					gap: $size-4;
				}

				.value {
					font-size: $size-24;
					font-weight: $fw-bold;
				}

				.unit {
					font-size: $size-16;
					font-weight: $fw-regular;
				}
			}
		}
	}
}
</style>
