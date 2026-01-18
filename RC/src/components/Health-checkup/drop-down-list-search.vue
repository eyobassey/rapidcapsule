<template>
	<div
		:class="[
			'drop-down__container',
			{
				open: isDropOpen,
			},
		]"
		:style="addStyleAttribute ? absPos : undefined"
	>
		<InputSearch
			placeholder="Enter keyword"
			v-model="searchValue"
			@click="$emit('focused', true)"
		/>
		<div class="drop-down__list">
			<div v-if="partName" class="section">
				<h2 class="section__heading">{{ partName }}</h2>
			</div>
			<div class="drop-down__list-item" v-for="(item, index) of symptoms" :key="JSON.stringify(item)">
				<p class="item" @click="handleAction(index)">
					{{ item }}
				</p>
			</div>
			<Loader v-if="isLoading" :useOverlay="true" :rounded="true" />
		</div>
	</div>
</template>

<script>
import Loader from "@/components/Loader/main-loader.vue";
import InputSearch from "@/components/inputs/search.vue";

export default {
	name: "Drop-down List Searchable",

	emits: ["selected-value", "focused"],

	components: {
		Loader,
		InputSearch,
	},

	props: {
		list: {
			type: Array,
			required: true,
		},
		isDropOpen: {
			type: Boolean,
			default: false,
		},
		isLoading: {
			type: Boolean,
			default: false,
		},
		absPos: Object,
		partName: String,
	},

	data() {
		return {
			searchValue: "",
			addStyleAttribute: false,
		};
	},

	computed: {
		// Filtered list of symptoms passed to list component
		symptoms() {
			const query = this.searchValue.trim(); // equate variable to search input value

			if (query.length != 0) {
				// Filter symptom list based on search input value
				const filteredSymptoms = this.list.filter((item) => item.includes(query));

				// Return filtered list sorted by order of inputed values
				return filteredSymptoms.sort((a, b) => a.indexOf(query[0]) - b.indexOf(query[0]));
			} else {
				// Return base symptom list if there's no search input value
				return this.list;
			}
		},

		deviceWidth() {
			// Get device width
			return window.innerWidth > 0 ? window.innerWidth : screen.width;
		},
	},

	methods: {
		handleAction(selectionIndex) {
			this.$emit("selected-value", selectionIndex);
		},

		checkDeviceSize() {
			console.log(this.deviceWidth);
			if (this.deviceWidth > 600) {
				this.addStyleAttribute = true;
			} else {
				this.addStyleAttribute = false;
			}
		},
	},

	mounted() {
		this.checkDeviceSize();
		window.addEventListener("resize", this.checkDeviceSize);
	},

	beforeUnmount() {
		window.removeEventListener("resize", this.checkDeviceSize);
	},
};
</script>

<style lang="scss" scoped>
.drop-down {
	&__container {
		display: none;
		position: absolute;
		min-height: 12rem;
		max-height: 23.33rem;
		width: 20rem;
		padding: $size-8 $size-8 $size-20 $size-8;
		margin-top: $size-4;
		border-radius: $size-12;
		background-color: $color-white;
		box-shadow: $size-0 $size-8 $size-24 rgba($color-black, 0.25);

		@include responsive(phone) {
			display: flex;
			left: 0;
			bottom: -100%;
			width: 100%;
			border-radius: $size-12 $size-12 $size-0 $size-0;
			box-shadow: $size-0 $size-8 $size-24 rgba($color-black, 0.65);
			max-height: 32rem;
			min-height: 32rem;
			padding: $size-16 $size-16 $size-56 $size-16;

			transition: all 350ms ease-out;
		}
	}

	&__list {
		max-height: 23rem;
		overflow-y: auto;

		@include scrollBar(normal);

		.section {
			padding: $size-8 $size-12 $size-8 $size-12;
			border-bottom: $size-1 solid $color-g-90;
			width: 98%;
			margin-bottom: $size-4;

			&__heading {
				font-size: $size-20;
				font-weight: $fw-medium;
				text-transform: capitalize;
			}
		}
	}

	&__list-item {
		width: 98%;
		padding: $size-8 $size-12;
		cursor: pointer;
		user-select: none;
		border-radius: $size-4;

		@include responsive(small-laptop) {
			padding: $size-4 $size-8;
		}

		.item {
			font-size: $size-16;
			font-weight: $fw-regular;
			line-height: 1.5;
			letter-spacing: 0.02em;
			color: $color-g-21;

			@include responsive(small-laptop) {
				font-size: $size-14;
			}
		}

		&:hover {
			background-color: $color-g-90;
		}
	}
}
.open {
	@include flexItem(vertical) {
		gap: $size-12;
		z-index: 10;
	}

	@include responsive(phone) {
		bottom: 0;
	}
}
</style>
