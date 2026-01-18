<template>
    <div class="award-section">
        <div class="award-section__header">
            <p class="award__header--title">Awards</p>
            <rc-button
                type="text-secondary"
                label="Add award"
                size="medium"
                :iconLeft="true"
                iconName="plus"
                class="award__action-desktop"
                @click="isOpen = true"
            />
            <rc-button-icon
                type="text-secondary"
                size="medium"
                :iconLeft="true"
                iconName="plus"
                class="award__action-mobile"
                @click="isOpen = true"
            />
        </div>
        <div v-if="awardDocs.length" class="award-section__body">
            <template v-for="item in awardDocs" :key="item">
                <div class="award-container">
                    <div class="award-content">
                        <p class="award-content__doctype">{{ item.title }}</p>
                        <p class="award-content__filename">{{ item.description }}</p>
                        <div class="award-content__meta">
                            <template v-for="awardFile in item.file" :key="awardFile">
                                <p class="award-content__meta--text">
                                    File type: {{ awardFile.file_type?.split('/')[1]?.toUpperCase() }}
                                </p>
                                <p class="award-content__meta--text">File name: {{ awardFile.original_name }}</p>
                            </template>
                        </div>
                    </div>
                    <rc-button-icon
                        type="secondary"
                        iconName="times"
                        color="#C11818"
                        @click="onDeleteAward(item)"
                    />
                </div>
            </template>
        </div>
        <div v-else class="award__empty">
            <p class="award__empty--text">
                You have not added any awards. You can start adding  awards.
            </p>
        </div>
    </div>
    <rc-modal
        v-if="isOpen"
        title="Add Award"
        @closeModal="onClose"
        :has-footer="true"
    >
        <template v-slot:body>
            <div class="degree-training-container">
                <rc-text label="Title" v-model="awardTitle" />
                <rc-textarea placeholder="Description" v-model="awardDescription" />
                <rc-datepicker label="Date" v-model="awardDate" />
                <div class="degree-training__upload">
                    <input
                        type="file"
                        class="hidden"
                        ref="upload"
                        accept=".png, .jpeg, .jpg, .pdf, .doc, .dox"
                        @change="($event) => onFileChange($event, newDocsItems)"
                    />
                    <template v-if="newDocsItems.length">
                        <template v-for="(item, i) in newDocsItems" :key="item">
                            <div class="award-container">
                                <div class="award-content">
                                    <p class="award-content__filename">{{ item.original_name }}</p>
                                    <p class="award-content__filesize">{{ fileSize(item.file_size) }}</p>
                                </div>
                                <rc-button-icon
                                    type="secondary"
                                    iconName="times"
                                    color="#C11818"
                                    @click="newDocsItems.splice(i, 1)"
                                />
                            </div>
                        </template>
                    </template>
                    <rc-button
                        v-else
                        type="text-secondary"
                        label="Add file"
                        size="large"
                        :iconLeft="true"
                        iconName="plus"
                        @click="$refs.upload.click()"
                    />
                </div>
            </div>
        </template>
        <template v-slot:foot>
            <div class="award-training-action">
                <rc-button
                    type="secondary"
                    label="Save & Add New"
                    size="medium"
                    class="award-training-action--btn1"
                    @click="onSaveAward(1)"
                    :loading="isFetching"
                    :disabled="!newDocsItems.length || isFetching"
                />
                <rc-button
                    type="primary"
                    label="Save"
                    size="medium"
                    class="certification-training-action--btn2"
                    @click="onSaveAward(2)"
                    :loading="isFetching"
                    :disabled="!newDocsItems.length || isFetching"
                />
            </div>
        </template>
    </rc-modal>
    <modal-caution
		v-show="isOpenDelete"
		title="Delete Certification?"
		@closeModal="onClose"
		:has-footer="true"
	>
		<template v-slot:body>
			<div class="modal__content">
				<div class="caution">
					<p class="text">
						This action is irreversible. Are you sure you want to remove this award?
					</p>
				</div>
			</div>
		</template>
		<template v-slot:foot>
			<rc-button
				type="tertiary"
				label="Cancel"
				size="small"
				class="delete-button"
                :disabled="isFetching"
				@click="onClose"
			/>
			<rc-button
				type="primary"
				label="Delete"
				size="small"
				class="delete-button"
                :loading="isFetching"
                :disabled="isFetching"
				@click="onDeleteAward"
			/>
		</template>
	</modal-caution>
</template>

<script>
import { defineComponent, ref, inject } from "vue";
import { useToast } from 'vue-toast-notification';
import RcAvatar from "@/components/Avatars/avatar-fixed";
import RcButtonIcon from "@/components/buttons/button-icon";
import RcButton from "@/components/buttons/button-primary";
import RcModal from "@/components/modals/dialog-modal";
import RcText from "@/components/inputs/text";
import RcDatepicker from "@/components/RCDatepicker";
import RcTextarea from "@/components/inputs/textarea";
import ModalCaution from "@/components/modals/modal-caution";

import { fileSize, onFileChange } from "../helper";

export default defineComponent({
    setup(props, ctx){
        const $http = inject('$http');
        const $toast = useToast();
        const accountInfo = {...props.accountInfo};

        const isOpen = ref(false);
        const isOpenDelete = ref(false);
        const isLoading = ref(false);
        const isFetching = ref(false);
        const awardDocs = ref([]);
        const newDocsItems = ref([]);
        const activeAwardItem = ref(null);
        const awardTitle = ref(null);
        const awardDescription = ref(null);
        const awardDate = ref(null);
        const tempAwardsBucket = ref([]);

        awardDocs.value = [...accountInfo.awards];

        const onClose = () => {
            isOpen.value = false;
            isOpenDelete.value = false;
            isFetching.value = false;
            newDocsItems.value = [];
            awardTitle.value = null;
            awardDescription.value = null,
            awardDate.value = null;
        }

        const onSaveAward = async (actionType) => {
            isFetching.value = true;

            tempAwardsBucket.value.push({
                title: awardTitle.value,
                description: awardDescription.value,
                date: awardDate.value,

                file: newDocsItems.value?.map(awardFile => ({
                    original_name: awardFile.original_name,
                    file_type: awardFile.type_of_document,
                    url: awardFile.url,
                }))
            });

            const payload = {
                awards: [...awardDocs.value, ...tempAwardsBucket.value]
            }

            await $http.$_updateAwards(payload).then(({ data }) => {
                $toast.success('Awards added successfully!');
				onClose();
                ctx.emit('success', data);
                if (actionType === 1) isOpen.value = true;
			});
        };

        const onDeleteAward = async (selectedItem) => {
            if (!isOpenDelete.value) {
                activeAwardItem.value = selectedItem;
                isOpenDelete.value = true;
                return;
            }
            isFetching.value = true;

            const payload = {
                awards: awardDocs.value.filter(item => (
                    item._id !== activeAwardItem.value._id
                ))
            }

            await $http.$_updateAwards(payload).then(({ data }) => {
                $toast.success('Awards deleted successfully!');
				onClose();
                ctx.emit('success', data);
			});
        };

        return {
            newDocsItems,
            awardDocs,
            awardTitle,
            awardDescription,
            awardDate,

            isOpen,
            isOpenDelete,
            isFetching,
            isLoading,

            onSaveAward,
            onDeleteAward,
            onClose,

            fileSize,
            onFileChange,
        }
    },
    props: {
        accountInfo: { type: Object, required: true, default: () => {} }
    },
    components: {
		RcAvatar,
        RcButtonIcon,
        RcButton,
        RcModal,
        RcText,
        RcDatepicker,
        RcTextarea,
        ModalCaution
	},
});

    

</script>

<style scoped lang="scss">
.award-section {
    display: flex;
    flex-direction: column;
    gap: $size-32;
    padding-bottom: $size-32;

    & .award-section__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid $color-g-90;

        .award__action-mobile {
            display: none !important;
        }

        @include responsive(phone) {
            & .award__action-desktop {
                display: none !important;
            }
            & .award__action-mobile {
                display: block !important;
                
                & :deep(svg) {
					fill: $color-sec-s1 !important;
				}
            }
        }

        & .award__header--title {
            font-size: $size-18;
            color: $color-black;
        }
        & .award__header--action {
            font-size: $size-16;
        }
    }
    & .award-section__body {
        display: flex;
        flex-direction: column;
        gap: $size-16;
    }
    & .award__empty {
        display: flex;
        justify-content: center;
        align-items: center;

        & .award__empty--text {
            font-size: $size-18;
            color: $color-black;
        }
    }
}
.award-container {
	@include flexItem(horizontal) {
		gap: $size-32;
		align-items: center;

		width: 100%;
		padding: $size-16 $size-24;
		border-radius: $size-10;
		background-color: $color-pri-t6;

		&:hover {
			outline: $size-1 solid $color-pri-t3;
			outline-offset: -$size-1;
		}

		@include responsive(phone) {
			padding: $size-12 $size-8 $size-12 $size-12;
			align-items: flex-start;
		}
	}

	.award-content {
		@include flexItem(vertical) {
			gap: $size-8;
		}
		flex-grow: 1;

		& .award-content__doctype {
			font-family: inherit;
			font-size: $size-18;
			font-weight: $fw-medium;
			letter-spacing: 0.02;
			line-height: 1.25;
			color: $color-black;
			overflow: hidden;
			display: -webkit-box;
			-webkit-box-orient: vertical;
			-webkit-line-clamp: 1;
		}
        & .award-content__filename {
            overflow: hidden;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 1;
            color: $color-g-44;
        }
        & .award-content__meta {
            display: flex;
            justify-content: flex-start;
            align-items: center;
            gap: $size-32;
            
            & .award-content__meta--text {
                overflow: hidden;
                display: -webkit-box;
                -webkit-box-orient: vertical;
                -webkit-line-clamp: 1;
                color: $color-g-44;
            }
        }
	}
}
.award-training-action {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: $size-8;
    

    @include responsive(phone) {
        @include flexItem(vertical) {}
        width: 100% !important;

        & .certification-training-action--btn2 {
            width: 100% !important;
        }
    }

    & .award-training-action--btn1 {
        background: $color-white;
		border: $size-1 solid $color-pri;

        @include responsive(phone) {
           width: 100% !important;
        }
    }
}
.degree-training-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: $size-32;

    & .degree-training__upload {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: $size-32;
    }
}
.delete-container {
	display: flex;
	flex-direction: column;
	justify-content: start;
	gap: $size-20;
}
:deep(.delete-button) {
    width: 100% !important;
}
</style>