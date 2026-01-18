<template>
	<div>
		<input type="file" accept="image/*" class="hidden" ref="file" @change="change" />
		<div v-if="source" class="avatar" :class="size">
			<div class="avatar__image-container">
				<img :src="source" alt="Avatar" class="avatar__user-image" />
			</div>
			<button type="button" class="btn__icon" @click="browse()">
				<Icons name="edit" id="edit" />
			</button>
		</div>
		<div v-if="!source" class="avatar" :class="size">
			<div class="avatar__image-container">
				<div class="avatar__default">
					<p>{{ initials }}</p>
				</div>
			</div>
			<button type="button" class="btn__icon" @click="browse()">
				<Icons name="plus" id="new" />
			</button>
		</div>
	</div>
</template>

<script>
import Icons from "@/components/icons.vue";

export default {
	name: "Avatar",

	components: {
		Icons,
	},

	data() {
		return {
			source: this.image ? this.image : null,
			file: null,
		};
	},

	props: {
		modelValue: File,
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
		extSrc: {
			type: String,
		},
	},

	emits: ["update:modelValue"],

	computed: {
		initials() {
			let fnameInitial = this.firstname.charAt(0);
			let lnameInitial = this.lastname.charAt(0);

			return fnameInitial.toUpperCase() + lnameInitial.toUpperCase();
		},
	},

	methods: {
		browse() {
			this.$refs.file.click();
		},
		change(event) {
			this.file = event.target.files[0];
			this.$emit("update:modelValue", this.file);
			let reader = new FileReader();
			reader.readAsDataURL(this.file);
			reader.onload = (event) => {
				this.source = event.target.result;
			};
		},
	},

	watch: {
		extSrc: {
			handler(val) {
				this.source = val;
			},
			immediate: true,
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

		p {
			color: $color-white;
			font-size: $size-56;
			font-weight: $fw-semi-bold;
			line-height: 1.5;
			text-align: center;
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
		background-color: $color-g-77;
	}
}

.large {
	width: 13.143rem;
	height: 13.143rem;
	border: 0.428rem solid $color-pri;

	@include responsive(phone) {
		width: 10.286rem;
		height: 10.286rem;
	}
	.btn__icon {
		position: absolute;
		bottom: 0;
		right: 0;
		width: 3.428rem;
		height: 3.428rem;
		border-radius: 50%;
		background-color: $color-white;
		display: flex;
		justify-content: center;
		align-items: center;
		border: none;
		box-shadow: 2px 4px 12px rgba($color-g-77, 0.5);
		cursor: pointer;

		#new,
		#edit {
			width: 1.714rem;
			height: 1.714rem;
		}
	}
}
.medium {
	width: 8.133rem;
	height: 8.133rem;
	border: $size-2 solid $color-pri;

	.btn__icon {
		position: absolute;
		bottom: 0;
		right: 0;
		width: $size-40;
		height: $size-40;
		border-radius: 50%;
		background-color: $color-white;
		display: flex;
		justify-content: center;
		align-items: center;
		border: none;
		box-shadow: 2px 4px 12px rgba($color-g-77, 0.5);
		cursor: pointer;

		#new,
		#edit {
			width: 1.714rem;
			height: 1.714rem;
		}
	}
}
</style>
