<template>
	<div class="menu__container">
		<IconButton
			:type="buttonType"
			iconName="kebab-vertical"
			:size="buttonSize"
			:color="iconColor"
			@click="toggleMenu($event)"
		/>
		<DropDownList
			:list="dropList"
			:size="size"
			:isDropOpen="dropState"
			:drop-alignment="dropAlign"
			@selected-value="handleSelection"
		/>
	</div>
</template>

<script>
import IconButton from "@/components/buttons/button-icon.vue";
import DropDownList from "@/components/utitlity/drop-down-list.vue";

export default {
	name: "Context Menu: Kebab",

	emits: ["selection"],

	components: {
		IconButton,
		DropDownList,
	},

	props: {
		dropList: {
			type: Array,
			required: true,
		},
		dropAlign: String,
		size: String,
		iconColor: String,
		buttonSize: String,
		buttonType: {
			type: String,
			required: true,
		},
	},

	data() {
		return {
			dropState: false,
			clickedItem: null,
		};
	},

	methods: {
		toggleMenu(evt) {
			this.clickedItem = evt.target;
			this.dropState = !this.dropState;
		},

		closeMenu(evt) {
			if (evt.target !== this.clickedItem) {
				this.dropState = false;
			}
		},

		handleSelection(selectionIndex) {
			this.dropState = false;
			this.$emit("selection", selectionIndex);
		},
	},

	mounted() {
		document.addEventListener("click", this.closeMenu);
	},

	beforeUnmount() {
		document.removeEventListener("click", this.closeMenu);
	},
};
</script>

<style lang="scss" scoped>
.menu__container {
	position: relative;
	height: max-content;
}
</style>
