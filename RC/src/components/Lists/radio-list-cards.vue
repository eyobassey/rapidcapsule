<template>
	<div class="list__container">
		<div v-for="(item, index) of list" :key="index" class="list__item">
			<label :for="`card-${index}`" class="radio__container">
				<input
					type="radio"
					:id="`card-${index}`"
					hidden
					:checked="item.default || isDefault[index]"
					@change="updateDefault(index)"
				/>
				<div class="radio__button"></div>
			</label>
			<div class="item__content">
				<Icons :name="item.card_type.trim()" />
				<p class="content content__number">{{ `**** **** **** ${item.last4Digit}` }}</p>
				<p class="content content__exp-date">{{ `Expires on ${expDate(item.expiry)}` }}</p>
			</div>
			<p v-show="item.default || isDefault[index]" class="content content__default">
				Default
			</p>
			<ButtonIcon
				type="secondary"
				iconName="times"
				color="#DB1818"
				@click="removeCard(index)"
			/>
		</div>
	</div>

	<!-- Modal to verify delete action -->
	<ModalCaution
		v-show="openCautionModal"
		title="Remove Item"
		@closeModal="openCautionModal = false"
		:has-footer="true"
	>
		<template v-slot:body>
			<div class="modal__content">
				<div class="caution">
					<p class="text">
						This action is irreversible. Are you sure you want to remove this Item?
					</p>
				</div>
			</div>
		</template>
		<template v-slot:foot>
			<Button
				type="tertiary"
				label="No"
				size="small"
				class="button"
				@click="closeCaution()"
			/>
			<Button
				type="primary"
				label="Yes"
				size="small"
				:loading="loadingCaution"
				class="button"
				@click="accept()"
			/>
		</template>
	</ModalCaution>
</template>

<script>
import axios from "axios";
import ButtonIcon from "../buttons/button-icon.vue";
import Icons from "../icons.vue";
import ModalCaution from "../modals/modal-caution.vue";
import Button from "../buttons/button-primary.vue";

export default {
	name: "Radio List: Cards",

	components: { Icons, ButtonIcon, ModalCaution, Button },

	props: {
		listArray: {
			type: Array,
			required: true,
		},
	},

	data() {
		return {
			isDefault: [],
			openCautionModal: false,
			loadingCaution: false,
			itemIndex: null,
		};
	},

	computed: {
		list() {
			this.listArray.forEach((item) => {
				this.isDefault.push(item.default ? false : false);
			});
			return this.listArray;
		},
	},

	methods: {
		expDate(date) {
			let expDate = new Date(date);
			let mnth = expDate.getMonth() + 1;
			let year = expDate.getFullYear() % 100;

			return `${mnth}/${year}`;
		},

		async updateDefault(i) {
			this.isDefault[i] = !this.isDefault[i];

			await axios.patch("cards", { cardId: this.list[i]._id });

			this.getCards(i);
		},

		removeCard(i) {
			this.itemIndex = i;
			this.openCautionModal = true;
		},

		closeCaution() {
			this.openCautionModal = false;
			this.itemIndex = null;
			this.loadingCaution = false;
		},

		async accept() {
			this.loadingCaution = true;
			let i = this.itemIndex;

			await axios.delete("cards", {
				data: {
					cardId: this.list[i]._id,
				},
			});

			this.getCards();
		},

		async getCards(i) {
			let res = await axios.get("cards");

			this.$store.commit("SET_CARDS", res.data.data);
			this.openCautionModal = false;

			if (i) {
				this.isDefault[i] = false;
			}
		},
	},
};
</script>

<style lang="scss" scoped>
.list__container {
	@include flexItem(vertical) {
		gap: $size-8;
		padding: $size-4 $size-8;
		width: 100%;
	}

	.radio__container {
		input:checked + .radio__button::after {
			content: "";
			display: block;
			width: 70%;
			height: 70%;
			border-radius: 50%;
			background-color: $color-pri;
		}
		.radio__button {
			@include flexItem(horizontal) {
				align-items: center;
				justify-content: center;
				width: $size-24;
				height: $size-24;
				border: $size-2 solid $color-pri;
				border-radius: 50%;
			}
		}
	}

	.list__item {
		@include flexItem(horizontal) {
			align-items: center;
			gap: $size-24;
			padding: $size-16 $size-16 $size-16 $size-24;
			background-color: $color-white;
			border: $size-1 solid $color-pri-t5;
			border-radius: $size-16;
			width: 100%;
		}

		.item__content {
			@include flexItem(horizontal) {
				gap: $size-24;
				align-items: center;
				flex-grow: 1;
			}
		}
		.content {
			font-weight: $fw-regular;
			line-height: 1.5;
			letter-spacing: 0.02em;

			&__number {
				font-size: $size-16;
				color: $color-black;
			}

			&__exp-date {
				font-size: $size-14;
				color: $color-g-44;
			}

			&__default {
				font-size: $size-16;
				color: $color-g-44;
			}
		}
	}
}

.caution {
	@include flexItem(horizontal) {
		gap: $size-32;
		width: 95%;
	}

	.text {
		text-align: left;
		font-size: $size-18;
		font-weight: $fw-regular;
		color: $color-g-21;
		line-height: 1.5;
		letter-spacing: 0.02em;
		padding-top: $size-8;
	}
}
</style>
