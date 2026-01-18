<template>
	<div class="page-content">
		<TopBar type="title-only" title="Health Checkup" @open-side-nav="$emit('openSideNav')" />
		<div class="page-content__body">
			<AvatarMale age="25" @selected-symptom="addSymptom" />
		</div>
	</div>
</template>

<script>
import TopBar from "@/components/Navigation/top-bar.vue";
import AvatarMale from "@/components/Health-checkup/full-body-avatar-male.vue";

export default {
	name: "Health Checkup",

	emits: ["openSideNav"],

	components: {
		TopBar,
		AvatarMale,
	},

	methods: {
		addSymptom(symptom) {
			console.log(symptom);
		},
	},
};
</script>

<style scoped lang="scss">
.page-content {
	@include flexItem(vertical) {
		gap: $size-12;
		width: 100%;
		height: 100vh;
	}

	&__body {
		@include flexItem(vertical) {
			width: 100%;
			height: 100%;
			overflow-y: scroll;
			padding: $size-0 $size-48;
		}

		&::-webkit-scrollbar {
			display: none;
			width: $size-12;
			background-color: $color-g-92;
		}
	}
}
</style>
