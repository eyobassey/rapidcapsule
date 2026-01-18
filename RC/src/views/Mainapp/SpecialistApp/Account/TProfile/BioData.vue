<template>
    <div class="profile-section">
        <div class="container__profile">
            <div class="container__profile--info">
                <div>
                    <rc-avatar
                        size="large"
                        :firstname="profileInfo?.first_name"
                        :lastname="profileInfo?.last_name"
                        :image="profileInfo?.profile_photo"
                    />
                </div>
                <div class="profile-info">
                    <div class="profile-info__profile">
                        <h1 class="profile-info__profile--name">
                            {{ profileInfo.first_name }} {{ profileInfo.last_name }}
                        </h1>
                        <p class="profile-info__specialty">{{ practice.area_of_specialty }}</p>
                    </div>
                    <p 
                        class="profile-ingo__profile--badge"
                        :class="{
                            'verified': accountInfo.verification_status === 'Vverified',
                            'unverified': accountInfo.verification_status === 'Unverified',
                        }"
                    >{{ accountInfo.verification_status }}</p>
                    
                </div>
            </div>
            <div class="container__profile--action" @click="onOpenEdit">
                <rc-button-icon iconName="edit" />
            </div>
        </div>
        <div class="container__biography">
            <div class="container__biography--items">
                <p class="biography__items--key">Gender:</p>
                <p class="biography__items--value">
                    {{ profileInfo.gender }}
                </p>
            </div>
            <div class="container__biography--items">
                <p class="biography__items--key">Date of Birth:</p>
                <p class="biography__items--value">
                    {{ profileInfo?.date_of_birth }}
                </p>
            </div>
            <div class="container__biography--items">
                <p class="biography__items--key">Marital Status:</p>
                <p class="biography__items--value">
                    {{ profileInfo.marital_status }}</p>
            </div>
            <div class="container__biography--items">
                <p class="biography__items--key">Email:</p>
                <p class="biography__items--value">
                    {{ profileInfo.contact.email }}
                </p>
            </div>
            <div class="container__biography--items">
                <p class="biography__items--key">Phone:</p>
                <p class="biography__items--value">
                    {{ profileInfo.contact.phone.country_code }} 
                    {{ profileInfo.contact.phone.number }}</p>
            </div>
            <div class="container__biography--items">
                <p class="biography__items--key">Address:</p>
                <p class="biography__items--value">
                    {{ profileInfo.contact.address1 }}
                </p>
            </div>
            <div class="container__biography--items">
                <p class="biography__items--key">License No:</p>
                <p class="biography__items--value">
                    {{ practice.license_number }}
                </p>
            </div>
            <div class="container__biography--items">
                <p class="biography__items--key">Bio:</p>
                <p class="biography__items--value">
                    {{ profileInfo.bio }}
                </p>
            </div>
        </div>
    </div>
    <rc-modal 
        v-if="isOpenProfileEdit"
        title="Update Profile"
        @closeModal="onClose"
        :has-footer="true"
    >
		<template v-slot:body>
            <div class="profile-modal">
                <div class="profile-modal__avatar">
                    <div>
                        <rc-avatar
                            size="large"
                            :firstname="profile.first_name"
                            :lastname="profile.last_name"
                            :image="profile.profile_photo"
                        />
                        <input
                            type="file"
                            class="hidden"
                            ref="upload"
                            accept=".png, .jpeg, .jpg"
                            @change="onFileChange($event, profilePhoto)"
                        />
                    </div>
                    <rc-button
                        type="secondary"
                        label="Change Image"
                        size="small"
                        class="profile-modal__avatar-btn"
                        @click="$refs.upload.click()"
                    />
                </div>
                <div class="profile-modal__biodata">
                    <div class="profile-modal__biodata--items">
                        <rc-text
                            v-model="profile.first_name"
                            label="First Name"
                            class="profile-modal__biodata--item"
                        />
                        <rc-text
                            v-model="profile.last_name"
                            label="Last Name"
                            class="profile-modal__biodata--item"
                        />
                    </div>
                     <div class="profile-modal__biodata--items">
                        <rc-select
                            v-model="profile.gender"
                            label="Gender"
                            :options="['Male', 'Female']"
                            class="profile-modal__biodata--item"
                        />
                        <rc-datepicker
                            v-model="profile.date_of_birth"
                            label="DOB"
                            class="profile-modal__biodata--item"
                        />
                        <rc-select
                            v-model="profile.marital_status"
                            label="Marital Status"
                            :options="['Single', 'Married', 'Divorced']"
                            class="profile-modal__biodata--item"
                        />
                    </div>
                    <div class="profile-modal__biodata--items">
                        <rc-textarea
                            v-model="profile.bio"
                            placeholder="Type Bio here"
                            class="profile-modal__biodata--item"
                        />
                    </div>
                    <div class="profile-modal__biodata--items">
                        <rc-text
                            v-model="profile.contact.email"
                            type="email" label="Email"
                            class="profile-modal__biodata--item"
                        />
                        <rc-phone-number
                            v-model="profile.contact.phone.country_code"
                            v-model:phone-number="profile.contact.phone.number"
                            class="profile-modal__biodata--item phone-input"
                        />
                    </div>
                    <div class="profile-modal__biodata--items">
                        <rc-text
                            label="Address Line 1"
                            class="profile-modal__biodata--item"
                            v-model="profile.contact.address1"
                        />
                    </div>
                    <div class="profile-modal__biodata--items">
                        <rc-text
                            label="Address Line 2"
                            class="profile-modal__biodata--item"
                            v-model="profile.contact.address2"
                        />
                    </div>
                    <div class="profile-modal__biodata--items">
                        <rc-text
                            label="State"
                            class="profile-modal__biodata--item"
                            v-model="profile.contact.state"
                        />
                        <rc-text
                            label="Country"
                            class="profile-modal__biodata--item"
                            v-model="profile.contact.country"
                        />
                        <rc-text
                            label="Zip Code"
                            class="profile-modal__biodata--item"
                            v-model="profile.contact.zip_code"
                        />
                    </div>
                </div>
            </div>
        </template>
        <template v-slot:foot>
            <rc-button
                type="primary"
                label="Save"
                size="large"
                class="profile-action-btn"
                :disabled="isFetching || isDisabled"
                :loading="isFetching"
                @click="onSubmit"
            />
        </template>
	</rc-modal>
</template>

<script>
import { cloneDeep } from "lodash";
import { useToast } from 'vue-toast-notification';
import { defineComponent, ref, watch, inject } from "vue";
import RcAvatar from "@/components/Avatars/avatar-fixed";
import RcButtonIcon from "@/components/buttons/button-icon";
import RcModal from "@/components/modals/dialog-modal";
import RcButton from "@/components/buttons/button-primary";
import RcText from "@/components/inputs/text";
import RcSelect from "@/components/inputs/select-dropdown";
import RcDatepicker from "@/components/RCDatepicker";
import RcTextarea from "@/components/inputs/textarea";
import RcPhoneNumber from "@/components/inputs/phone-number";

import { onFileChange } from "@/utilities/utilityUpload";

export default defineComponent({
    setup(props, ctx){

        const $http = inject('$http');
        const $toast = useToast();

        const accountInfo = {...props.accountInfo};
        const profileInfo = {...accountInfo.profile};
        const practice = {...accountInfo.professional_practice};

        const isLoading = ref(false);
        const isFetching = ref(false);
        const isDisabled = ref(false);
        const isOpenProfileEdit = ref(false);
        const profilePhoto = ref([]);
        
        const profile = ref({
            full_name: null,
            profile_photo: null,
            first_name: null,
            last_name: null,
            gender: null,
            date_of_birth: null,
            marital_status: null,
            bio: null,
            contact: {
                email: null,
                address1: null,
                address2: null,
                state: null,
                country: null,
                zip_code: null,
                phone: { country_code: null, number: null, },
            }
        });

        watch(profilePhoto.value, (value) => {
            profile.value.profile_photo = cloneDeep(value[0]['url']);
        });

        const onClose = () => {
            isLoading.value = false;
            isFetching.value = false;
            isDisabled.value = false;
            isOpenProfileEdit.value = false;
            ctx.emit('close');
        }

        const onOpenEdit = () => {
            profile.value = cloneDeep({...profile.value, ...profileInfo})
            isOpenProfileEdit.value = true;
        }

        const onSubmit = async () => {
            isFetching.value = true;
            const payload = {
                userId: accountInfo.id,
                payload: { profile: profile.value }
            };

            await $http.$_updateCurrentUser(payload).then(({ data }) => {
                $toast.success('Profile information updated successfully!');
                ctx.emit('success', data);
				onClose();
			});
        }

        return {
            accountInfo,
            profileInfo,
            practice,
            profile,
            profilePhoto,

            onSubmit,
            onClose,
            onFileChange,
            onOpenEdit,

            isFetching,
            isLoading,
            isDisabled,
            isOpenProfileEdit,
        }
    },
    props: {
        accountInfo: { type: String, required: true, default: () => {} }
    },
    components: {
		RcAvatar,
        RcModal,
        RcButtonIcon,
        RcButton,
        RcText,
        RcSelect,
        RcDatepicker,
        RcTextarea,
        RcPhoneNumber,
        RcDatepicker,
	},
});

    

</script>

<style scoped lang="scss">
.profile-section {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: $size-32;

    & .container__profile {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        position: relative;

        & .container__profile--info {
            width: 100%;
            display: flex;
            justify-content: flex-start;
            align-items: center;
            gap: $size-16;

            @include responsive(phone) {
                flex-direction: column;
                justify-content: center;
                align-items: center;
            }

            & .profile-info {
                display: flex;
                justify-content: flex-start;
                align-items: flex-start;
                gap: $size-8;

                @include responsive(phone) {
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                }


                & .profile-info__profile {
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    align-items: flex-start;

                    @include responsive(phone) {
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                    }

                    & .profile-info__profile--name {
                        font-size: $size-26;
                        font-weight: $fw-semi-bold;
                        color: $color-black;
                    }
                    & .profile-info__specialty {
                        font-size: $size-16;
                        line-height: $size-24;
                        color: $color-black;
                    }
                }
                & .profile-ingo__profile--badge {
                    font-size: $size-16;
                    line-height: $size-16;
                    color: $color-white;
                    border-radius: $size-16;
                    padding: $size-8 $size-16;
                }
                & .unverified {
                    background: $color-ter-error;
                }
                & .verified {
                    background: $color-sec-s1;
                }
            }
        }
        & .container__profile--action {
            border-radius: $size-8;
            background: $color-g-92;

            @include responsive(phone) {
                position: absolute;
                right: $size-0;
            }

            &:hover {
                background: $color-g-90;
            }
        }
    }
    & .container__biography {
        display: flex;
        flex-direction: column;
        gap: $size-8;

        & .container__biography--items {
            display: flex;
            justify-content: flex-start;
            align-items: center;
            gap: $size-8;

            & .biography__items--key {
                font-size: $size-16;
                line-height: $size-24;
                color: $color-g-44;
            }
            & .biography__items--value {
                    font-size: $size-16;
                line-height: $size-24;
                color: $color-black;
            }
            &:last-child {
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: flex-start;
                gap: $size-8;
            }
        }
    }
}

.profile-modal {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: $size-32;

    & .profile-modal__avatar {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        gap: $size-16;

        @include responsive(phone) {
            @include flexItem(vertical) {}
        }

        & .profile-modal__avatar-btn {
            background: $color-white;
		    border: $size-1 solid $color-pri;
        }
    }
    & .profile-modal__biodata {
        display: flex;
        flex-direction: column;
        gap: $size-16;

        & .profile-modal__biodata--items {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: $size-16;

            & .phone-input {
                width: 70% !important;
            }

            @include responsive(phone) {
                & .phone-input {
                    width: 100% !important;
                }
                @include flexItem(vertical) {}
            }

            & .profile-modal__biodata--item {
                width: 100%;
            }
        }
    }
}
.profile-action-btn {
    @include responsive(phone) {
        width: 100%;
    }
}
</style>