<template>
	<router-view />
</template>

<style lang="scss">
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");

html {
	font-family: "Inter", sans-serif;
	font-size: 100%; // 1rem = 16px = 62.5% of root font-size

	@include responsive(phone) {
		font-size: 75%; // 1rem = 12px = 68.75% of root font-size
	}
	@include responsive(small-laptop) {
		font-size: 87.5%; // 1rem = 14px = 87.5% of root font-size
	}
	@include responsive(large-screen) {
		font-size: 125%; // 1rem = 20px = 125% of root font-size
	}
}

* {
	box-sizing: border-box;
	margin: 0;
	padding: 0;
	color: $color-black;
}

body {
	width: 100vw;
	height: 100vh;


	& > #app {
		width: 100%;
		height: 100%;


		@include responsive(tab-landscape) {
			height: auto;
		}

		@include responsive(tab-portrait) {
			height: auto;
		}

		@include responsive(phone) {
			height: auto;
		}
	}
}

.wrapper {
	width: 100%;
	height: 100%;
	padding: $size-44 $size-0;

	@include responsive(tab-landscape) {
		height: auto;
		min-height: 100vh;
	}
}

.container {
	display: flex;
	width: min(101.733rem, 80%);
	height: 100%;
	margin: $size-0 auto;

	@include responsive(large-screen) {
		width: min(101.733rem, 80%);
	}

	@include responsive(tab-landscape) {
		width: min(1000px, 75%);
	}

	@include responsive(tab-protrait) {
		width: min(800px, 90%);
	}

	@include responsive(phone) {
		width: max(327px, 90%);
	}
}

.bgd-image {
	background: url(assets/images/background-doodle.png) no-repeat right top;
	background-size: auto 100%;

	@include responsive(phone) {
		background-image: url(assets/images/background-doodle-50.png);
	}
}
</style>
