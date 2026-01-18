<template>
	<div>
		<input type="file" accept="image/*" class="hidden" ref="file" @change="change" />
		<div v-if="image" class="avatar" :class="size">
			<div class="avatar__image-container">
				<img :src="image" alt="Avatar" class="avatar__user-image" />
			</div>
		</div>
		<div v-if="!image" class="avatar" :class="size">
			<div class="avatar__image-container">
				<div class="avatar__default">
					<p>{{ initials }}</p>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
export default {
	name: "Avatar Fixed",

	props: {
		size: {
			type: String,
			default: "large",
		},
		firstname: {
			type: String,
			required: true,
		},
		lastname: {
			type: String,
			required: true,
		},
		image: {
			type: String,
			default: null,
		},
	},

	computed: {
		initials() {
			let fnameInitial = this.firstname?.charAt(0) || '';
			let lnameInitial = this.lastname?.charAt(0) || '';

			return fnameInitial + lnameInitial;
		},
	},
};
</script>

<style scoped lang="scss">
.hidden {
	display: none;
}

.avatar {
	@include flexItem(horizontal) {
		align-items: center;
		justify-content: center;
	}
	position: relative;
	border-radius: 50%;

	&__image-container {
		overflow: hidden;
		width: 95%;
		height: 95%;
		border-radius: 50%;
	}

	&__default {
		@include flexItem(horizontal) {
			align-items: center;
			justify-content: center;
		}
		width: 100%;
		height: 100%;
		background-color: $color-pri-t2;
	}

	&__user-image {
		width: 100%;
		height: 100%;
		object-position: center;
		object-fit: cover;
	}
}

.large {
	width: 7.2rem;
	height: 7.2rem;
	border: $size-4 solid $color-pri;

	.avatar__image-container > .avatar__default > p {
		color: $color-white;
		font-size: $size-36;
		font-weight: $fw-medium;
		line-height: 1.5;
		text-align: center;
	}
}

.medium {
	width: $size-86;
	height: $size-86;
	border: $size-3 solid $color-pri;

	@include responsive(tab-portrait) {
		width: $size-120;
		height: $size-120;
	}

	.avatar__image-container {
		width: 90%;
		height: 90%;

		.avatar__default > p {
			color: $color-white;
			font-size: $size-28;
			font-weight: $fw-medium;
			line-height: 1.5;
			text-align: center;
		}
	}
}

.small {
	width: $size-64;
	height: $size-64;
	border: $size-2 solid $color-pri;

	@include responsive(tab-landscape) {
		width: $size-64;
		height: $size-64;
	}

	@include responsive(phone) {
		width: $size-44;
		height: $size-44;
	}

	.avatar__image-container {
		width: 93%;
		height: 93%;

		.avatar__default > p {
			color: $color-white;
			font-size: $size-24;
			font-weight: $fw-medium;
			line-height: 1.5;
			text-align: center;
		}
	}
}
</style>
