<template>
	<div class="component-container">
		<input
			type="file"
			accept=".png, .jpeg, .jpg, .pdf, .doc, .dox"
			class="hidden"
			ref="upload"
			@change="change($event)"
			multiple
		/>
		<div v-if="!fileCount" class="body__initial">
			<Button
				type="text-secondary"
				label="Add Document"
				size="large"
				:iconLeft="true"
				iconName="plus"
				@click="browse"
				class="btn__special"
			/>
			<ul class="list-item">
				<li>5mb (maximum size)</li>
				<li>pdf, doc, png, jpeg, jpg (file formats)</li>
			</ul>
		</div>
		<div v-if="fileCount > 0" class="body__populated">
			<div class="body__head">
				<p class="copy">{{ fileCount }} {{ fileCount > 1 ? "files" : "file" }}</p>
				<Button
					type="text-secondary"
					label="Add Document"
					size="small"
					:iconLeft="true"
					iconName="plus"
					@click="browse"
					class="btn__special"
				/>
			</div>
			<div class="body__list">
				<OneColListItem
					v-for="(item, index) in files"
					:key="index"
					:lineCount="2"
					:lineOneContent="item.name"
					:lineTwoContent="convert(item.size)"
				>
					<ButtonIcon
						type="secondary"
						iconName="times"
						color="#C11818"
						@click="removeItem(index)"
					/>
				</OneColListItem>
			</div>
		</div>
	</div>
</template>

<script>
import Button from "@/components/buttons/button-primary.vue";
import ButtonIcon from "../buttons/button-icon.vue";
import OneColListItem from "@/components/Lists/single-col-list.vue";
import { file } from "@babel/types";

export default {
	name: "Upload file form",

	components: {
		Button,
		ButtonIcon,
		OneColListItem,
	},

	emits: ["error", "update:modelValue"],

	data() {
		return {
			fileList: null,
			fileArray: [],
		};
	},

	props: {
		modelValue: FileList,
		reset: {
			type: Boolean,
			default: false,
		},
	},

	computed: {
		fileCount() {
			if (this.fileList) {
				let fileList = [];
				Object.keys(this.fileList).forEach((key) => {
					fileList.push(this.fileList[key]);
				});
				return fileList.length;
			}
		},

		files() {
			if (this.fileList) {
				let fileList = [];
				Object.keys(this.fileList).forEach((key) => {
					fileList.push(this.fileList[key]);
				});
				return fileList;
			}
		},
	},

	methods: {
		browse() {
			this.$refs.upload.click();
		},

		change(e) {
			let existingFilesCount = this.fileArray.length;
			let files = e.target.files;
			var fileCount = 0;

			fileCount = this.convObjToArray(files);

			let newFilesCount = this.fileArray.length - existingFilesCount;

			if (fileCount > newFilesCount) {
				let bigFiles = fileCount - newFilesCount;
				let message = `${bigFiles == fileCount ? "" : bigFiles} ${
					bigFiles > 1 ? "files" : "file"
				} ${bigFiles > 1 ? "are" : "is"} too large`;

				this.$emit("error", message);

				setTimeout(() => {
					this.$emit("error", "");
				}, 5000);
			}
		},

		convObjToArray(obj) {
			let fileCount = 0;

			if (this.fileList) {
				if (this.fileArray.length != 0) {
					Object.keys(this.fileList).forEach((key) => {
						if (!this.fileArray.includes(this.fileList[key])) {
							this.fileArray.push(this.fileList[key]);
						}
					});
				} else {
					Object.keys(this.fileList).forEach((key) => {
						this.fileArray.push(this.fileList[key]);
					});
				}

				Object.keys(obj).forEach((key) => {
					fileCount++;
					if (obj[key].size <= 5000000) {
						this.fileArray.push(obj[key]);
					}
				});
			} else {
				Object.keys(obj).forEach((key) => {
					fileCount++;
					if (obj[key].size <= 5000000) {
						this.fileArray.push(obj[key]);
					}
				});
			}

			this.updateFileList(this.fileArray);

			return fileCount;
		},

		updateFileList(array) {
			let newFileList = new DataTransfer();
			if (array.length > 0) {
				array.forEach((item) => {
					newFileList.items.add(item);
				});

				this.fileList = newFileList.files;
				this.$emit("update:modelValue", this.fileList);
			}
		},

		convert(number) {
			if (number < 999999) {
				return Number.parseFloat(number / 1000).toFixed(2) + "kb";
			} else if (number >= 1000000) {
				return Number.parseFloat(number / 1000000).toFixed(2) + "mb";
			} else {
				return number + "bytes";
			}
		},

		removeItem(item) {
			this.files.splice(item, 1);
			let fileList = new DataTransfer();
			this.files.forEach((item) => {
				let file = new File([item], item.name);
				fileList.items.add(file);
			});

			let newFileList = fileList.files;

			this.fileList = newFileList;
			this.$emit("update:modelValue", this.fileList);
		},
	},

	watch: {
		modelValue: {
			handler(value) {
				if (!value) {
					this.fileList = null;
					this.fileArray = [];
				} else {
					this.fileList = value;
				}
			},
			immediate: true,
		},
	},
};
</script>

<style lang="scss" scoped>
.component-container {
	width: 100%;
}

.body {
	&__initial {
		@include flexItem(vertical) {
			align-items: center;
			gap: $size-12;
			padding-top: $size-24;
			padding-bottom: $size-8;

			.list-item {
				list-style: none;

				li {
					text-align: center;
					font-size: $size-14;
					color: $color-g-44;
					padding-bottom: $size-4;
				}
			}
		}
	}

	&__populated {
		@include flexItem(vertical) {
			gap: $size-8;
		}
		width: 100%;

		.body__head {
			@include flexItem(horizontal) {
				align-items: center;
				justify-content: space-between;

				.copy {
					font-size: $size-14;
					color: $color-g-44;
					font-weight: $fw-regular;
				}
			}
		}

		.body__list {
			@include flexItem(vertical) {
				gap: $size-8;
			}
		}
	}
}
</style>
