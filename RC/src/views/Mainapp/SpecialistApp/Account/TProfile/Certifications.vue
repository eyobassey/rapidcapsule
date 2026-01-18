<template>
    <div class="certification-section">
        <div class="certification-section__header">
            <p class="certification__header--title">Professional Practice & Certification</p>
            <rc-button
                type="text-secondary"
                label="Add Certification"
                size="medium"
                :iconLeft="true"
                iconName="plus"
                class="certification__action-desktop"
                @click="isOpen = true"
            />
            <rc-button-icon
                 type="text-secondary"
                label="Add Certification"
                size="medium"
                :iconLeft="true"
                iconName="plus"
                class="certification__action-mobile"
                @click="isOpen = true"
            />
        </div>
        <div v-if="certificationDocs.length" class="certification-section__body">
            <template v-for="item in certificationDocs" :key="item">
                <div class="certificate-container">
                    <div class="certificate-content">
                        <p class="certificate-content__doctype">{{ item.type_of_document }}</p>
                        <p class="certificate-content__filename">{{ item?.original_name }}</p>
                        <div class="certificate-content__meta">
                            <p class="certificate-content__meta--text">
                                File type: {{item?.file_type?.split('/')[1]?.toUpperCase() }}
                            </p>
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <rc-button-icon
                            v-if="item.url"
                            type="secondary"
                            iconName="download"
                            color="#0066CC"
                            @click="downloadFile(item.url)"
                        />
                        <rc-button-icon
                            type="secondary"
                            iconName="times"
                            color="#C11818"
                            @click="onDelete(item)"
                        />
                    </div>
                </div>
            </template>
        </div>
        <div v-else class="certification__empty">
            <p class="certification__empty--text">
                You have not added any certifications. You can start adding  certifications.
            </p>
        </div>
    </div>
    <rc-modal
        v-if="isOpen"
        title="Add Degree/Training"
        @closeModal="onClose"
        :has-footer="true"
    >
        <template v-slot:body>
            <div class="degree-training-container">
                <rc-text
                    label="Document Type"
                    v-model="documentType"
                    placeholder="M.B.B.S Degree"
                />
                <div class="degree-training__upload">
                    <input
                        type="file"
                        class="hidden"
                        ref="upload"
                        accept=".png, .jpeg, .jpg, .pdf, .doc, .dox"
                        @change="($event) => onFileChange($event, degreeDocs)"
                    />
                    <template v-if="degreeDocs.length">
                        <template v-for="(item, i) in degreeDocs" :key="item">
                            <div class="certificate-container">
                                <div class="certificate-content">
                                    <p class="certificate-content__filename">{{ item.original_name }}</p>
                                    <p class="certificate-content__filesize">{{ fileSize(item.file_size) }}</p>
                                </div>
                                <rc-button-icon
                                    type="secondary"
                                    iconName="times"
                                    color="#C11818"
                                    @click="degreeDocs.splice(i, 1)"
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
            <div class="certification-training-action">
                <rc-button
                    type="secondary"
                    label="Save & Add New"
                    size="medium"
                    class="certification-training-action--btn1"
                    @click="onSubmit(1)"
                    :loading="isFetching"
                    :disabled="!degreeDocs.length || !documentType || isFetching"
                />
                <rc-button
                    type="primary"
                    label="Save"
                    size="medium"
                    class="certification-training-action--btn2"
                    @click="onSubmit(2)"
                    :loading="isFetching"
                    :disabled="!degreeDocs.length || !documentType || isFetching"
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
						This action is irreversible. Are you sure you want to remove this Item?
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
				@click="onDelete"
			/>
		</template>
	</modal-caution>
</template>

<script>
import { useToast } from 'vue-toast-notification';
import { defineComponent, ref, inject } from "vue";
import RcAvatar from "@/components/Avatars/avatar-fixed";
import RcButtonIcon from "@/components/buttons/button-icon";
import RcButton from "@/components/buttons/button-primary";
import RcModal from "@/components/modals/dialog-modal";
import RcSelect from "@/components/inputs/select-dropdown";
import RcText from "@/components/inputs/text";
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
        const certificationDocs = ref([]);
        const degreeDocs = ref([]);
        const tempDocsBucket = ref([]);
        const documentType = ref(null);
        const toastMessage = ref(null);
        const activeCertItem = ref(null);

        certificationDocs.value =  [...accountInfo.documents];

        const onClose = () => {
            isOpen.value = false;
            isOpenDelete.value = false;
            isFetching.value = false;
            degreeDocs.value = [];
            documentType.value = null;
            ctx.emit('close');
        }

        const onSubmit = async (actionType) => {
            isFetching.value = true;

            const uploadedFile =  degreeDocs.value[0];
            tempDocsBucket.value.push({
                type_of_document: documentType.value,
                original_name: uploadedFile.original_name,
                file_type: uploadedFile.type_of_document,
                file_size: uploadedFile.file_size,
                url: uploadedFile.url,
            });

            const payload = {
                documents: [
                    ...certificationDocs.value,
                    ...tempDocsBucket.value
                ]
            };

            await $http.$_updateCertifications(payload).then(({ data }) => {
                $toast.success('Certifications added successfully!');
                ctx.emit('success', data);
				onClose();
                if (actionType === 1) isOpen.value = true;
                
			});
        };

        const onDelete = async (selectedItem) => {
            if (!isOpenDelete.value) {
                activeCertItem.value = selectedItem;
                isOpenDelete.value = true;
                return;
            }
            isFetching.value = true;

            const payload = {
                documents: certificationDocs.value.filter(item => (
                    item._id !== activeCertItem.value._id
                ))
            }

            await $http.$_updateCertifications(payload).then(({ data }) => {
                $toast.success('Certifications deleted successfully!');
                ctx.emit('success', data);
				onClose();
			});
        };

        const downloadFile = async (fileUrl) => {
            try {
                if (!fileUrl) return;

                const response = await $http.get('/users/file/presigned-url', {
                    params: { url: fileUrl }
                });

                if (response.data?.data?.url) {
                    window.open(response.data.data.url, '_blank');
                } else {
                    $toast.error('Failed to generate download link');
                }
            } catch (error) {
                console.error('Error downloading file:', error);
                $toast.error('Failed to download file');
            }
        };

        return {
            documentType,
            degreeDocs,
            toastMessage,
            certificationDocs,
            activeCertItem,

            isOpen,
            isOpenDelete,
            isFetching,
            isLoading,

            onSubmit,
            onDelete,
            onClose,
            downloadFile,

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
        RcSelect,
        RcText,
        ModalCaution
	},
});

    

</script>

<style scoped lang="scss">
.certification-section {
    display: flex;
    flex-direction: column;
    gap: $size-32;
    padding-bottom: $size-32;

    & .certification-section__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid $color-g-90;

        & .certification__action-mobile {
            display: none !important;
        }

        @include responsive(phone) {
            & .certification__action-desktop {
                display: none !important;
            }
            & .certification__action-mobile {
                display: block !important;
                
                & :deep(svg) {
					fill: $color-sec-s1 !important;
				}
            }
        }

        & .certification__header--title {
            font-size: $size-18;
            color: $color-black;
        }
        & .certification__action-desktop {
            font-size: $size-16;
        }
    }
    & .certification-section__body {
        display: flex;
        flex-direction: column;
        gap: $size-16;
    }
    & .certification__empty {
        display: flex;
        justify-content: center;
        align-items: center;

        & .certification__empty--text {
            font-size: $size-18;
            color: $color-black;
        }
    }
}
.certificate-container {
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

	.certificate-content {
		@include flexItem(vertical) {
			gap: $size-8;
		}
		flex-grow: 1;

		& .certificate-content__doctype {
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
        & .certificate-content__filename {
            overflow: hidden;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 1;
            color: $color-g-44;
        }
        & .certificate-content__meta {
            display: flex;
            justify-content: flex-start;
            align-items: center;
            gap: $size-32;
            
            & .certificate-content__meta--text {
                overflow: hidden;
                display: -webkit-box;
                -webkit-box-orient: vertical;
                -webkit-line-clamp: 1;
                color: $color-g-44;
            }
        }
	}
}
.certification-training-action {
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

    & .certification-training-action--btn1 {
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