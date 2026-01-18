<template>
	<div class="segment__container">
		<ul class="segment__nav-group">
			<li
				v-for="tab in tabItems"
				:key="tab"
				class="segment__item"
				:class="{ active: tab == selected }"
				@click="setTab(tab)"
			>
				{{ tab }}
			</li>
		</ul>
		<slot />
	</div>
</template>

<script>
export default {
	name: "Segment Navigation",

	props: {
		tabItems: {
			type: Array,
			required: true,
		},
		selected: {
			type: String,
			required: true,
		},
	},

	methods: {
		setTab(tab) {
			this.$emit("selected", tab);
		},
	},
};
</script>

<style scoped lang="scss">
.segment {
	&__container {
		@include flexItem(vertical) {
			justify-content: center;
			align-items: center;
			gap: $size-20;
			width: 100%;
			overflow: hidden;
		}
	}

	&__nav-group {
		@include flexItem(horizontal) {
			align-items: center;
			justify-content: center;
		}
		height: $size-54;
		width: 100%;
		padding: $size-4;
		background-color: $color-g-90;
		border: $size-1 solid $color-g-77;
		border-radius: $size-16;
		list-style: none;
	}

	&__item {
		flex-basis: auto;
		flex-shrink: 0;
		width: 50%;
		text-align: center;
		padding: $size-12;
		border-radius: $size-12;
		cursor: pointer;

		&.active {
			color: $color-pri;
			font-weight: $fw-semi-bold;
			background-color: $color-white;
		}
	}
}
</style>
