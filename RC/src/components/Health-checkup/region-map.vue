<template>
	<div class="region-map">
		<div class="region" id="north-america" @click="selectRegion($event)"></div>
		<div class="region" id="south-america" @click="selectRegion($event)"></div>
		<div class="region" id="europe" @click="selectRegion($event)"></div>
		<div class="region" id="north-africa" @click="selectRegion($event)"></div>
		<div class="region" id="west-central-east-africa" @click="selectRegion($event)"></div>
		<div class="region" id="south-africa" @click="selectRegion($event)"></div>
		<div class="region" id="middle-east" @click="selectRegion($event)"></div>
		<div class="region" id="north-asia" @click="selectRegion($event)"></div>
		<div class="region" id="south-asia" @click="selectRegion($event)"></div>
		<div class="region" id="australia" @click="selectRegion($event)"></div>
	</div>
</template>

<script>
export default {
	name: "Region Map Component",

	emits: ["selection"],

	methods: {
		selectRegion(evt) {
			const regions = document.querySelectorAll(".region");

			regions.forEach((region) => {
				region.classList.remove("active");

				if (region.id === evt.target.id) {
					evt.target.classList.add("active");
				}
			});

			this.$emit("selection", evt.target.id);
		},
	},
};
</script>

<style lang="scss" scoped>
.region-map {
	position: relative;
	width: 727px;
	height: 480px;

	@include responsive(phone) {
		transform: scale(0.45);
		margin-left: -200px;
	}

	#north-america {
		position: absolute;
		top: 0;
		left: 0;
		width: 319px;
		height: 295px;
		background: url("@/assets/images/map-regions/north-america-default.png") no-repeat;
		background-size: contain;

		&:hover {
			background-image: url("@/assets/images/map-regions/north-america-hover.png");
		}

		&.active {
			background-image: url("@/assets/images/map-regions/north-america-active.png");
		}
	}

	#south-america {
		position: absolute;
		top: 55%;
		left: 14.1678%;
		width: 186px;
		height: 216px;
		background: url("@/assets/images/map-regions/south-america-default.png") no-repeat;
		background-size: contain;

		&:hover {
			background-image: url("@/assets/images/map-regions/south-america-hover.png");
		}

		&.active {
			background-image: url("@/assets/images/map-regions/south-america-active.png");
		}
	}

	#europe {
		position: absolute;
		top: 9.58333%;
		left: 38.37689%;
		width: 144px;
		height: 229px;
		background: url("@/assets/images/map-regions/europe-default.png") no-repeat;
		background-size: contain;

		&:hover {
			background-image: url("@/assets/images/map-regions/europe-hover.png");
		}

		&.active {
			background-image: url("@/assets/images/map-regions/europe-active.png");
		}
	}

	#north-africa {
		position: absolute;
		top: 52.70833%;
		left: 42.36588%;
		width: 109px;
		height: 42px;
		background: url("@/assets/images/map-regions/north-africa-default.png") no-repeat;
		background-size: contain;

		&:hover {
			background-image: url("@/assets/images/map-regions/north-africa-hover.png");
		}

		&.active {
			background-image: url("@/assets/images/map-regions/north-africa-active.png");
		}
	}

	#west-central-east-africa {
		position: absolute;
		top: 57.70833%;
		left: 42.22833%;
		width: 139px;
		height: 84px;
		background: url("@/assets/images/map-regions/west-central-east-africa-default.png") no-repeat;
		background-size: contain;

		&:hover {
			background-image: url("@/assets/images/map-regions/west-central-east-africa-hover.png");
		}

		&.active {
			background-image: url("@/assets/images/map-regions/west-central-east-africa-active.png");
		}
	}

	#south-africa {
		position: absolute;
		top: 71.45833%;
		left: 50.34387%;
		width: 78px;
		height: 98px;
		background: url("@/assets/images/map-regions/south-africa-default.png") no-repeat;
		background-size: contain;

		&:hover {
			background-image: url("@/assets/images/map-regions/south-africa-hover.png");
		}

		&.active {
			background-image: url("@/assets/images/map-regions/south-africa-active.png");
		}
	}

	#middle-east {
		position: absolute;
		top: 50%;
		left: 54.33287%;
		width: 76px;
		height: 68px;
		background: url("@/assets/images/map-regions/middle-east-default.png") no-repeat;
		background-size: contain;

		&:hover {
			background-image: url("@/assets/images/map-regions/middle-east-hover.png");
		}

		&.active {
			background-image: url("@/assets/images/map-regions/middle-east-active.png");
		}
	}

	#north-asia {
		position: absolute;
		top: 5.83333%;
		left: 52.5447%;
		width: 345px;
		height: 222px;
		background: url("@/assets/images/map-regions/north-asia-default.png") no-repeat;
		background-size: contain;

		&:hover {
			background-image: url("@/assets/images/map-regions/north-asia-hover.png");
		}

		&.active {
			background-image: url("@/assets/images/map-regions/north-asia-active.png");
		}
	}

	#south-asia {
		position: absolute;
		top: 42.91666%;
		left: 61.76066%;
		width: 189px;
		height: 150px;
		background: url("@/assets/images/map-regions/south-asia-default.png") no-repeat;
		background-size: contain;

		&:hover {
			background-image: url("@/assets/images/map-regions/south-asia-hover.png");
		}

		&.active {
			background-image: url("@/assets/images/map-regions/south-asia-active.png");
		}
	}

	#australia {
		position: absolute;
		top: 70.20833%;
		left: 78.54195%;
		width: 143px;
		height: 129px;
		background: url("@/assets/images/map-regions/australia-default.png") no-repeat;
		background-size: contain;

		&:hover {
			background-image: url("@/assets/images/map-regions/australia-hover.png");
		}

		&.active {
			background-image: url("@/assets/images/map-regions/australia-active.png");
		}
	}
}
</style>
