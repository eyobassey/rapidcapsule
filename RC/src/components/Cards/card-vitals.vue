<template>
	<div class="card" :class="{ firstChild: firstChild }">
		<div class="card__content">
			<h3 class="card__content--title">{{ vital.name }}</h3>
			<div class="card__content--body">
				<div class="value-group">
					<h1 class="value">
						{{ vital.value }}
					</h1>
					<p class="unit">{{ vital.unit }}</p>
				</div>
				<p class="time">Updated: {{ vital.time }}</p>
			</div>
		</div>
		<ContextMenuKebab
			:iconColor="firstChild ? '#fff' : '#6F6F6F'"
			button-type="tertiary"
			button-size="small"
			size="400%"
			:dropList="contextMenuVital"
			dropAlign="right"
			@selection="catchAction"
		/>
	</div>
</template>

<script>
import ContextMenuKebab from "@/components/utitlity/context-menu-kebab.vue";

export default {
	name: "Item Card: Vitals",

	emits: ["updateVital"],

	components: {
		ContextMenuKebab,
	},

	props: {
		vital: {
			type: Object,
			Required: true,
		},
		firstChild: {
			type: Boolean,
			default: false,
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
.card {
	@include flexItem(horizontal) {
		align-items: flex-start;
		gap: $size-4;
		flex-grow: 1;
	}
	min-width: 20rem;
	max-width: 50%;
	height: 13.33rem;
	padding: $size-24 $size-16 $size-24 $size-24;
	background-color: $color-white;
	border-radius: $size-24;
	border: $size-1 solid $color-pri-t3;
	box-shadow: $size-12 $size-16 $size-48 rgba($color-black, 0.15),
		$size-8 $size-12 $size-24 rgba($color-black, 0.18);

	&:hover {
		background-color: $color-pri-t5;
	}

	@include responsive(phone) {
		max-width: 100%;
	}

	&__content {
		@include flexItem(vertical) {
			flex-grow: 1;
			height: 100%;
			gap: $size-24;
		}

		&--title {
			font-size: $size-20;
			font-weight: $fw-semi-bold;
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
					font-size: $size-48;
					font-weight: $fw-bold;
				}

				.unit {
					font-size: $size-16;
					font-weight: $fw-regular;
				}
			}

			.time {
				font-size: $size-12;
			}
		}
	}
}

.firstChild {
	background-color: $color-pri;

	&:hover {
		background-color: $color-pri-s1;
	}

	& .card__content--title,
	.value,
	.unit,
	.time {
		color: $color-white;
	}
}
</style>
