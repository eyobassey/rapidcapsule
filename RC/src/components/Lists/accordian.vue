<template>
	<div class="accordian">
		<div class="accordian__head" @click="openAccordian">
			<slot name="head-content" />
			<div class="icon-group">
				<Icons v-if="!isOpen" name="arrow-down" color="#6F6F6F" />
				<Icons v-if="isOpen" name="arrow-up" color="#6F6F6F" />
			</div>
		</div>
		<div v-show="isOpen" class="accordian__body">
			<slot name="body-content" />
		</div>
	</div>
</template>

<script>
import Icons from "@/components/icons.vue";
import Loader from "@/components/Loader/loader-standalone.vue";

export default {
	name: "Accordian",

	components: {
		Icons,
		Loader,
	},

	data() {
		return {
			isOpen: false,
		};
	},

	methods: {
		openAccordian() {
			this.isOpen = !this.isOpen;
		},
	},
};
</script>

<style lang="scss" scoped>
.accordian {
	&__head {
		@include flexItem(horizontal) {
			align-items: center;
			justify-content: space-between;
			padding: $size-24;
			cursor: pointer;
			border-bottom: $size-1 solid $color-g-90;
		}

		@include responsive(phone) {
			padding-inline: $size-10;
		}

		.icon-group {
			@include flexItem(horizontal) {
				align-items: center;
				justify-content: center;
			}
		}
	}

	&__body {
		background-color: $color-g-97;
		margin-inline: $size-16;
	}
}
</style>
