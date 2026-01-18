<template>
  <div class="wrapper bgd-image">
    <div class="container">
      <div class="header">
        <div class="header__left-col">
          <h1 class="fs-28 lh-125 fw-semi-bold">
            Let’s guide you through setting up your account
          </h1>
          <p class="fs-16 lh-150 fw-regular">
            Please go through the steps and provide all required information.
          </p>
        </div>
        <div class="header__right-col">
          <AvatarFixed
            size="medium"
            :firstname="profile.first_name"
            :lastname="profile.last_name"
            :image="profile.profile_photo"
          />
        </div>
      </div>
      <div class="multi-step-form card-shadow card-outline">
        <div class="multi-step-form__progress">
          <div
            v-for="(title, index) in stepperOptions"
            :key="'title' + index"
            class="progress-list__item"
            :class="{
              active: index === activeStepper,
              completed: index < activeStepper && isVisited === true,
            }"
          >
            <div class="indicator">
              <div class="indicator__dot"></div>
            </div>
            <p :class="{ inactive: index !== activeStepper }">
              {{ title }}
            </p>
          </div>
        </div>
        <div class="multi-step-form__form-container">
          <div v-if="activeStepper == 0" class="multi-step-form__step">
            <form @submit.prevent="onNextStepper" class="form">
              <div class="form__header">
                <h1 class="fs-20 fw-semi-bold lh-125">
                  {{ stepperOptions[0] }}
                </h1>
                <p class="fs-16 lh-150 fw-regular">
                  Please fill out all required fields to proceed. Required
                  fields are marked with *.
                </p>
              </div>
              <div class="form__body">
                <div class="form__body--inputs">
                  <div class="input__group">
                    <Text
                      type="text"
                      label="Firstname"
                      name="fname"
                      v-model="profile.first_name"
                      :disabled="true"
                    ></Text>

                    <Text
                      type="text"
                      label="Lastname"
                      name="lname"
                      v-model="profile.last_name"
                      :disabled="true"
                    ></Text>
                  </div>
                  <div class="input__group">
                    <Dropdown
                      :options="genderOptions"
                      label="Gender"
                      :required="true"
                      v-model="profile.gender"
                    ></Dropdown>

                    <DatePicker
                      Label="Date of Birth"
                      v-model="profile.date_of_birth"
                      :disabled="false"
                    />
                    <Dropdown
                      :options="maritalStatusOptions"
                      label="Marital Status"
                      :required="true"
                      v-model="profile.marital_status"
                    ></Dropdown>
                  </div>
                </div>
                <div class="form__body--inputs">
                  <div class="input__group">
                    <Text
                      class="col-2"
                      type="email"
                      label="Email"
                      name="email"
                      v-model="profile.contact.email"
                      :disabled="true"
                    >
                    </Text>
                    <PhoneInput
                      :countryCodes="countryCodesOptions"
                      v-model:phone-number="number"
                      v-model="country_code"
                      :disabled="profile.contact.hasOwnProperty('phone')"
                    />
                  </div>
                </div>
                <div class="form__body--inputs">
                  <div class="input__group--row">
                    <Text
                      type="text"
                      label="Address Line 1"
                      name="address1"
                      max-chars="50"
                      :required="true"
                      v-model="profile.contact.address1"
                    ></Text>
                    <Text
                      type="text"
                      label="Address Line 2"
                      max-chars="50"
                      name="address1"
                      v-model="profile.contact.address2"
                    />
                  </div>
                  <div class="input__group">
                    <SelectFilterInput
                      name="specialist-country"
                      label="Country"
                      position="top"
                      mode="country"
                      :required="true"
                      v-model:country-value="profile.contact.country"
                    />
                    <SelectFilterInput
                      name="specialist-state"
                      label="State"
                      position="top"
                      mode="state"
                      :required="true"
                      :based-on="null"
                      v-model:state-value="profile.contact.state"
                    />
                    <Text
                      type="text"
                      label="ZIP Code"
                      name="zip"
                      :required="true"
                      v-model="profile.contact.zip_code"
                    ></Text>
                  </div>
                </div>
              </div>
              <div class="form__footer">
                <Button
                  type="primary"
                  label="Next"
                  size="small"
                  :iconRight="true"
                  iconName="arrow-right"
                  :disabled="isDisabled"
                />
              </div>
            </form>
          </div>
          <div v-if="activeStepper == 1" class="multi-step-form__step">
            <div class="form">
              <form @submit.prevent="onNextStepper" class="form">
                <div class="form__header">
                  <h1 class="fs-20 fw-semi-bold lh-125">
                    {{ stepperOptions[1] }}
                  </h1>
                  <p class="fs-16 lh-150 fw-regular">
                    All fields are required. Please ensure you provide accurate
                    data.
                  </p>
                </div>
                <div class="form__body">
                  <div class="form__body--inputs">
                    <div class="input__group">
                      <SelectInput
                        :options="categoryOptions"
                        label="Category"
                        :required="true"
                        v-model="practice.category"
                      />
                      <SelectInput
                        :options="specialtyOptions"
                        label="Area of Specialty"
                        :required="true"
                        v-model="practice.area_of_specialty"
                      />
                    </div>
                  </div>
                  <div class="form__body--inputs">
                    <div class="input__group">
                      <Text
                        class="col-2"
                        label="University Attended"
                        name="universityAttended"
                        :required="true"
                        v-model="practice.university.name"
                      />
                    </div>
                    <div class="input__group--start">
                      <DatePicker
                        Label="Start year"
                        :required="true"
                        v-model="practice.university.start_year"
                      />
                      <DatePicker
                        Label="Year of Graduation"
                        :required="true"
                        v-model="practice.university.end_year"
                      />
                    </div>
                  </div>
                  <div class="form__body--inputs">
                    <div class="input__group">
                      <Text
                        class="col-2"
                        label="Place of housemanship"
                        name="placeOfHousemanship"
                        :required="true"
                        v-model="practice.place_of_housemanship.name"
                      />
                    </div>
                    <div class="input__group--start">
                      <DatePicker
                        Label="Start year"
                        :required="true"
                        v-model="practice.place_of_housemanship.start_year"
                      />
                      <DatePicker
                        Label="Year of Graduation"
                        :required="true"
                        v-model="practice.place_of_housemanship.end_year"
                      />
                    </div>
                  </div>
                  <div class="form__body--inputs">
                    <div class="input__group">
                      <Text
                        class="col-1"
                        label="License Number"
                        name="licenseNumber"
                        :required="true"
                        v-model="practice.license_number"
                      />
                      <Text
                        class="col-1"
                        label="Years of Practice"
                        name="yearsOfPractice"
                        :required="true"
                        v-model="practice.years_of_practice"
                      />
                    </div>
                  </div>
                </div>
                <div class="form__footer">
                  <div class="btn_group">
                    <Button
                      type="tertiary"
                      label="Back"
                      size="small"
                      :iconLeft="true"
                      iconName="arrow-left"
                      @click="onPrevStepper"
                    />
                    <Button
                      type="primary"
                      label="Next"
                      size="small"
                      :iconRight="true"
                      iconName="arrow-right"
                      @click="onNextStepper"
                      :disabled="isDisabled"
                    />
                  </div>
                </div>
              </form>
            </div>
          </div>
          <div v-if="activeStepper == 2" class="multi-step-form__step">
            <div class="form">
              <div class="form__header">
                <h1 class="fs-20 fw-semi-bold lh-125">
                  {{ stepperOptions[2] }}
                </h1>
                <p class="fs-16 lh-150 fw-regular">
                  Please upload documents that prove your training
                </p>
              </div>

              <div class="form__body">
                <div class="form__body--initial">
                  <div
                    v-if="certificationDocs.length"
                    class="certification-section__body"
                  >
                    <Button
                      type="text-secondary"
                      label="Add Documents"
                      size="small"
                      :iconLeft="true"
                      iconName="plus"
                      @click="isOpenDocuments = true"
                    />
                    <template
                      v-for="(item, i) in certificationDocs"
                      :key="item"
                    >
                      <div class="certificate-container">
                        <div class="certificate-content">
                          <p class="certificate-content__doctype">
                            {{ item.type_of_document }}
                          </p>
                          <p class="certificate-content__filename">
                            {{ item?.original_name }}
                          </p>
                          <div class="certificate-content__meta">
                            <p class="certificate-content__meta--text">
                              File type:
                              {{
                                item?.file_type?.split("/")[1]?.toUpperCase()
                              }}
                            </p>
                          </div>
                        </div>
                        <ButtonIcon
                          type="secondary"
                          iconName="times"
                          color="#C11818"
                          @click="onDeleteCertification(i)"
                        />
                      </div>
                    </template>
                  </div>
                  <Button
                    v-else
                    type="text-secondary"
                    label="Add Documents"
                    size="large"
                    :iconLeft="true"
                    iconName="plus"
                    @click="isOpenDocuments = true"
                  />
                </div>
              </div>
              <div class="form__footer">
                <div class="btn_group">
                  <Button
                    type="tertiary"
                    label="Back"
                    size="small"
                    :iconLeft="true"
                    iconName="arrow-left"
                    @click="onPrevStepper"
                  />
                  <Button
                    type="primary"
                    label="Next"
                    size="small"
                    :iconRight="true"
                    iconName="arrow-right"
                    @click="onNextStepper"
                    :disabled="isDisabled"
                  />
                </div>
              </div>
            </div>
          </div>
          <div v-if="activeStepper == 3" class="multi-step-form__step">
            <div class="form">
              <div class="form__header">
                <h1 class="fs-20 fw-semi-bold lh-125">
                  {{ stepperOptions[3] }}
                </h1>
                <p class="fs-16 lh-150 fw-regular">
                  Choose how you want to be payed for your services.
                </p>
              </div>

              <div class="form__body">
                <div class="payment-structure">
                  <p class="payment-structure-heading">
                    Lorem ipsum dolor sit amet consectetur. Venenatis eget neque
                    in sit auctor. Massa consequat purus blandit sed nibh enim
                    velit iaculis. You can change this in the future from your
                    account settings.
                  </p>
                  <rc-radio
                    radio-name="payment-structure-radio"
                    class="payment-structure__radio"
                    :options="paymentStructureOptions"
                    v-model="paymentStructure"
                  />
                </div>
              </div>
              <div class="form__footer">
                <div class="btn_group">
                  <Button
                    type="tertiary"
                    label="Back"
                    size="small"
                    :iconLeft="true"
                    iconName="arrow-left"
                    @click="onPrevStepper"
                  />
                  <Button
                    type="primary"
                    label="Next"
                    size="small"
                    :iconRight="false"
                    iconName="arrow-right"
                    @click="onNextStepper"
                    :disabled="isDisabled"
                  />
                </div>
              </div>
            </div>
          </div>
          <div v-if="activeStepper == 4" class="multi-step-form__step">
            <div class="form">
              <div class="form__header">
                <h1 class="fs-20 fw-semi-bold lh-125">
                  {{ stepperOptions[4] }}
                </h1>
                <p class="fs-16 lh-150 fw-regular">
                  Setup a security question that you can use to retrieve or
                  reset your account.
                </p>
              </div>

              <div class="form__body">
                <div class="form__body--inputs">
                  <Dropdown
                    :options="securityQuestions"
                    label="Select Question"
                    :required="true"
                    v-model="security.question"
                  ></Dropdown>
                  <Text
                    type="text"
                    label="Your Answer"
                    name="secrete-answer"
                    v-model="security.answer"
                    :required="true"
                  ></Text>
                </div>
              </div>

              <div class="form__footer">
                <div class="btn_group">
                  <Button
                    type="tertiary"
                    label="Back"
                    size="small"
                    :iconLeft="true"
                    iconName="arrow-left"
                    @click="onPrevStepper"
                  />
                  <Button
                    type="primary"
                    label="Finish"
                    size="small"
                    @click="onSubmit"
                    :disabled="disableBtn"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <Loader v-if="isLoading" :useOverlay="true" />
      </div>
    </div>
  </div>

  <dialog-modal
    v-if="isOpenDocuments"
    title="Add Documents"
    @closeModal="onClose"
    :has-footer="true"
  >
    <template v-slot:body>
      <div class="degree-training-container">
        <Text
          type="text"
          label="Document Type"
          name="DocumentType"
          v-model="documentType"
        ></Text>
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
                  <p class="certificate-content__filename">
                    {{ item.original_name }}
                  </p>
                  <p class="certificate-content__filesize">
                    {{ fileSize(item.file_size) }}
                  </p>
                </div>
                <ButtonIcon
                  type="secondary"
                  iconName="times"
                  color="#C11818"
                  @click="degreeDocs.splice(i, 1)"
                />
              </div>
            </template>
          </template>
          <Button
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
        <Button
          type="tertiary"
          label="Save & Add New"
          size="medium"
          class="certification-training-action--btn1"
          @click="onSaveCertification(1)"
          :loading="isFetching"
          :disabled="!degreeDocs.length || !documentType || isFetching"
        />
        <Button
          type="primary"
          label="Save"
          size="medium"
          @click="onSaveCertification(2)"
          :loading="isFetching"
          :disabled="!degreeDocs.length || !documentType || isFetching"
        />
      </div>
    </template>
  </dialog-modal>

  <modal-caution
    v-show="isOpenDelete"
    title="Delete Certification?"
    @closeModal="onClose"
    :has-footer="true"
  >
    <template v-slot:body>
      <div class="delete-container">
        <p class="delete-information">
          This action is irreversible. Are you sure you want to remove this
          Account?
        </p>
      </div>
    </template>
    <template v-slot:foot>
      <Button
        label="Delete"
        type="primary"
        size="small"
        @click="onDeleteCertification"
        :loading="isFetching"
        :disabled="isFetching"
      />
      <Button
        label="Cancel"
        type="secondary"
        size="small"
        :disabled="isFetching"
        @click="isOpenDelete = false"
      />
    </template>
  </modal-caution>
</template>

<script>
import { ref, inject, watchEffect } from "vue";
import { useToast } from "vue-toast-notification";
import { useVuelidate } from "@vuelidate/core";
import { required, minLength } from "@vuelidate/validators";
import AvatarFixed from "@/components/Avatars/avatar-fixed.vue";
import Text from "@/components/inputs/text.vue";
import NumberInputSuffix from "@/components/inputs/digits-suffix.vue";
import PhoneInput from "@/components/inputs/phone-number.vue";
import DatePicker from "@/components/inputs/date-picker.vue";
import RcDatepicker from "@/components/RCDatepicker";
import CheckBox from "@/components/inputs/check-box.vue";
import Dropdown from "@/components/inputs/select-dropdown.vue";
import SelectInput from "@/components/inputs/select-dropdown.vue";
import Button from "@/components/buttons/button-primary.vue";
import ButtonIcon from "@/components/buttons/button-icon.vue";
import DialogModal from "@/components/modals/dialog-modal.vue";
import Icons from "@/components/icons.vue";
import AreaText from "@/components/inputs/area-text.vue";
import DateRangePicker from "@/components/inputs/date-pickers/date-range.vue";
import FileUploadForm from "@/components/forms/File-upload-form.vue";
import OneColListItem from "@/components/Lists/single-col-list.vue";
import Loader from "@/components/Loader/main-loader.vue";
import SelectFilterInput from "@/components/inputs/select-filter-input.vue";
import ModalCaution from "@/components/modals/modal-caution";
import RcRadio from "@/components/RCRadio";
import { SECURITY_QUESTIONS } from "@/utilities/constants";
import {
  STEPPER_OPTIONS,
  GENDER_OPTIONS,
  SPECIALTY_OPTIONS,
  CATEGORY_OPTIONS,
  MATERITAL_STATUS_OPTIONS,
  COUNTRY_CODES,
  PAYMENT_STRUCTURE_OPTIONS,
} from "./constants";
import { STATUS_CODES } from "@/utilities/constants";
import { onFileChange, fileSize } from "@/utilities/utilityUpload";
import { mapGetters as useMapGetters } from "@/utilities/utilityStore";

export default {
  name: "SpecialistProfileSetup",

  setup: (props, { emit }) => {
    const $http = inject("$http");
    const v$ = useVuelidate();
    const $toast = useToast();
    const {
      "userModule/basicInfo": basicInfo,
      "userModule/practice": practiceInfo,
      "userModule/certificates": certificates,
    } = useMapGetters();

    const isLoading = ref(false);
    const isFetching = ref(false);
    const isOpenDocuments = ref(false);
    const isOpenDelete = ref(false);
    const isDisabled = ref(false);
    const degreeDocs = ref([]);
    const documentType = ref();
    const certificationDocs = ref([]);
    const activeDocIndex = ref();
    const activeStepper = ref(0);
    const isVisited = ref(false);
    const stepperOptions = ref(STEPPER_OPTIONS);
    const genderOptions = ref(GENDER_OPTIONS);
    const specialtyOptions = ref(SPECIALTY_OPTIONS);
    const categoryOptions = ref(CATEGORY_OPTIONS);
    const maritalStatusOptions = ref(MATERITAL_STATUS_OPTIONS);
    const securityQuestions = ref(SECURITY_QUESTIONS);
    const countryCodesOptions = ref(COUNTRY_CODES);
    const paymentStructureOptions = ref(PAYMENT_STRUCTURE_OPTIONS);
    const profile = ref({
      gender: null,
      smoker: null,
      marital_status: null,
      profile_image: "",
      height: {
        value: null,
        unit: "cm",
      },
      weight: {
        value: null,
        unit: "kg",
      },
      contact: {
        address1: null,
        address2: null,
        state: null,
        country: null,
        zip_code: null,
        phone: {
          country_code: null,
          number: null,
        },
      },
    });
    const security = ref({
      question: null,
      answer: null,
    });
    const practice = ref({
      category: null,
      area_of_specialty: null,
      license_number: null,
      years_of_practice: null,
      university: {
        name: null,
        start_year: null,
        end_year: null,
      },
      place_of_housemanship: {
        name: null,
        start_year: null,
        end_year: null,
      },
    });
    const paymentStructure = ref("");

    watchEffect(() => {
      if (
        basicInfo.value ||
        practiceInfo.value ||
        certificates.value ||
        security.value
      ) {
        profile.value = { ...profile.value, ...basicInfo.value };
        practice.value = { ...practice.value, ...practiceInfo.value };
        certificationDocs.value = [
          ...certificationDocs.value,
          ...certificates.value,
        ];
        security.value = { ...security.value };
      }
    });

    watchEffect(() => {
      if (activeStepper.value == 0)
        isDisabled.value = v$.value.profile?.$invalid;
      else if (activeStepper.value === 1)
        isDisabled.value = v$.value.practice?.$invalid;
      else if (activeStepper.value === 2)
        isDisabled.value = !certificationDocs.value.length;
      else if (activeStepper.value === 4)
        isDisabled.value = v$.value.security?.$invalid;
    });

    const onClose = () => {
      isOpenDocuments.value = false;
      isOpenDelete.value = false;
      isFetching.value = false;
      degreeDocs.value = [];
      documentType.value = null;
    };

    const onSaveCertification = (actionType) => {
      isFetching.value = true;

      const uploadedFile = degreeDocs.value[0];
      certificationDocs.value.push({
        type_of_document: documentType.value,
        original_name: uploadedFile.original_name,
        file_type: uploadedFile.type_of_document,
      });
      onClose();
      if (actionType === 1) isOpenDocuments.value = true;
    };

    const onDeleteCertification = (selectedIndex) => {
      if (!isOpenDelete.value) {
        activeDocIndex.value = selectedIndex;
        isOpenDelete.value = true;
        return;
      }
      isFetching.value = true;
      certificationDocs.value.splice(activeDocIndex.value, 1);
      onClose();
    };

    const onNextStepper = () => {
      activeStepper.value += 1;
      isVisited.value = true;
      window.scrollTo(0, 0);
    };
    const onPrevStepper = () => {
      activeStepper.value -= 1;
      isVisited.value = true;
      window.scrollTo(0, 0);
    };

    const onSubmit = async () => {
      isLoading.value = true;

      const payload = {
        profile: profile.value,
        professional_practice: practice.value,
        documents: certificationDocs.value,
        payment_structure: paymentStructure.value,
        security: security.value,
      };

      try {
        const response = await $http.$_specialistProfileSetup(payload);
        if (response.status === STATUS_CODES.SUCCESS) {
          $toast.success("Details sent successfully!");
          emit("success");
        }
      } catch (error) {
        const {
          response: {
            data: { errorMessage },
          },
        } = error;

        $toast.error(errorMessage || "An error has occured, please try again");
      }

      isLoading.value = false;
    };

    return {
      v$,

      onFileChange,
      fileSize,
      onSaveCertification,
      onDeleteCertification,
      onClose,
      onNextStepper,
      onPrevStepper,
      onSubmit,

      isFetching,
      isLoading,
      isOpenDocuments,
      isOpenDelete,
      isVisited,
      isDisabled,
      degreeDocs,
      documentType,
      certificationDocs,
      profile,
      practice,
      activeStepper,
      stepperOptions,
      genderOptions,
      specialtyOptions,
      categoryOptions,
      maritalStatusOptions,
      countryCodesOptions,
      paymentStructureOptions,
      paymentStructure,
      securityQuestions,
      security,
    };
  },

  emits: ["success"],

  components: {
    AvatarFixed,
    Button,
    ButtonIcon,
    Text,
    PhoneInput,
    DatePicker,
    CheckBox,
    Dropdown,
    SelectInput,
    DialogModal,
    Icons,
    NumberInputSuffix,
    AreaText,
    DateRangePicker,
    FileUploadForm,
    OneColListItem,
    Loader,
    SelectFilterInput,
    RcDatepicker,
    ModalCaution,
    RcRadio,
  },

  validations() {
    return {
      // VALIDATION TESTS FOR STEP 1 FORM
      profile: {
        gender: { required: required, $autoDirty: true },
        marital_status: { required: required, $autoDirty: true },
        contact: {
          address1: { required: required, $autoDirty: true },
          state: { required: required, $autoDirty: true },
          country: { required: required, $autoDirty: true },
          zip_code: {
            required: required,
            minLength: minLength(5),
            $autoDirty: true,
          },
        },
      },
      // VALIDATION TESTS FOR STEP 2 FORM
      practice: {
        category: { required: required, $autoDirty: true },
        area_of_specialty: { required: required, $autoDirty: true },
        license_number: { required: required, $autoDirty: true },
        years_of_practice: { required: required, $autoDirty: true },
        university: {
          name: { required: required, $autoDirty: true },
          start_year: { required: required, $autoDirty: true },
          end_year: { required: required, $autoDirty: true },
        },
        place_of_housemanship: {
          name: { required: required, $autoDirty: true },
          start_year: { required: required, $autoDirty: true },
          end_year: { required: required, $autoDirty: true },
        },
      },

      // STEP 4 VALIDATION
      security: {
        answer: { required: required, $autoDirty: true },
      },
    };
  },
};
</script>

<style scoped lang="scss">
.wrapper {
  @include flexItem(horizontal) {
    align-items: center;
  }

  @include responsive(small-laptop) {
    height: auto;
    padding-top: 6.143rem;
    padding-bottom: 6.143rem;
  }

  @include responsive(tab-landscape) {
    padding-top: $size-64;
    padding-bottom: $size-64;
  }

  @include responsive(phone) {
    background-image: none;
  }
}
.container {
  @include flexItem(vertical) {
    justify-content: center;
    align-items: center;
    gap: $size-32;
    margin-top: 50px;
  }

  width: min(1170px, 80%);

  @include responsive(tab-portrait) {
    width: min(700px, 85%);
    justify-content: flex-start;
  }

  @include responsive(tab-landscape) {
    width: min(950px, 85%);
    justify-content: flex-start;
  }

  @include responsive(large-screen) {
    width: max(950px, 50%);
    height: min(1200px, 75%);
  }
}

.header {
  @include flexItem(horizontal) {
    justify-content: center;
    gap: $size-32;
  }
  width: 100%;
  padding: $size-0 $size-24;

  &__left-col {
    @include flexItem(horizontal) {
      flex-direction: column;
      justify-content: center;
      gap: $size-8;
    }
    width: 100%;
    p {
      color: $color-g-44;
    }
  }

  @include responsive(tab-portrait) {
    @include flexItem(vertical) {
      align-items: center;
    }

    &__left-col {
      order: 2;
      text-align: center;
    }
  }

  @include responsive(phone) {
    padding: $size-0;

    &__left-col {
      h1 {
        font-size: $size-18;
        text-align: center;
      }
      p {
        font-size: $size-14;
        text-align: center;
      }
    }
  }
}
.multi-step-form {
  position: relative;
  @include flexItem(horizontal);
  padding: $size-0 $size-32;
  min-height: 735px;
  width: 100%;
  background-color: $color-white;
  border-radius: $size-24;
  overflow: hidden;

  @include responsive(phone) {
    @include flexItem(vertical);
    box-shadow: none;
    border: none;
    padding: $size-16;
    background-color: transparent;
    min-height: 500px;
  }

  &__progress {
    @include flexItem(vertical) {
      align-items: flex-start;
      gap: $size-2;
      flex: 0 0 25%;
      padding: $size-48 $size-48 $size-48 $size-0;
      border-right: 1px solid $color-pri-t4;

      @include responsive(tab-landscape) {
        padding-right: $size-32;
        flex: 0 1 auto;
      }

      @include responsive(phone) {
        @include flexItem(horizontal) {
          align-items: center;
          justify-content: center;
          width: 100%;
          border-right: none;
          padding: $size-24 $size-0;
        }
      }
    }
  }

  &__form-container {
    @include flexItem(vertical) {
      flex: 1 1 75%;
      padding: $size-32 $size-0 $size-24 $size-56;

      @include responsive(tab-portrait) {
        padding-left: $size-24;
      }

      @include responsive(tab-landscape) {
        padding-left: $size-32;
      }

      @include responsive(phone) {
        padding-left: $size-0;
      }
    }
  }

  &__step {
    @include flexItem(vertical) {
      flex-grow: 1;
      height: 100%;
    }
  }
}

.progress-list__item {
  @include flexItem(horizontal) {
    gap: $size-8;
    font-size: $size-16;
    font-weight: $fw-regular;
    letter-spacing: 0.02em;
    position: relative;
    height: 73px;
    pointer-events: none;

    @include responsive(tab-landscape) {
      & p {
        display: none;
      }
    }

    @include responsive(phone) {
      width: 73px;
      height: auto;

      &:last-child {
        width: auto;
      }
    }
  }

  &.active {
    font-weight: $fw-semi-bold;

    & .indicator__dot {
      background-color: $color-pri;
    }

    & .indicator__dot::after {
      content: "";
      width: 58%;
      height: 58%;
      @include absolutePosition(abs-center);
      background-color: $color-pri-t4;
      border-radius: 50%;
    }
  }

  &.inactive {
    color: $color-g-54;
  }

  &.completed {
    font-weight: $fw-regular;
    & .indicator__dot {
      background-color: $color-pri;
    }

    &::after {
      background-color: $color-pri;
    }
  }

  &::after {
    content: "";
    position: absolute;
    top: $size-19;
    left: $size-7;

    width: $size-2;
    height: $size-56;
    background-color: $color-g-77;

    @include responsive(phone) {
      top: $size-10;
      left: $size-18;

      width: $size-60;
      height: $size-2;
    }
  }

  &:last-child::after {
    display: none;
    height: auto;
  }
}

.indicator__dot {
  position: relative;
  width: $size-15;
  height: $size-15;
  border-radius: 50%;
  margin-top: $size-1;
  background-color: $color-g-77;

  @include responsive(phone) {
    margin-top: $size-3;
  }
}

.form {
  @include flexItem(vertical) {
    gap: $size-32;
    flex-grow: 1;
  }
  height: 100%;

  &__header {
    @include flexItem(vertical) {
      gap: $size-2;
    }
    padding-right: $size-16;

    p {
      color: $color-g-44;
    }

    @include responsive(phone) {
      text-align: center;
      padding-right: $size-0;

      h1 {
        font-size: $size-18;
        text-align: center;
      }

      p {
        font-size: $size-16;
        text-align: center;
      }
    }
  }

  &__body {
    @include flexItem(vertical) {
      gap: $size-32;
      flex-grow: 1;
    }
    overflow-y: auto;
    padding-right: $size-16;

    &--initial {
      width: 100%;
      padding: $size-32;
      margin-inline: auto;
      flex-grow: 1;
      display: flex;
      justify-content: center;
      align-items: flex-start;

      & .certification-section__body {
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: end;
        gap: $size-16;

        @include responsive(phone) {
          justify-content: center;
          align-items: center;
        }
      }

      @include responsive(phone) {
        min-height: 300px;
      }
    }

    &--populated {
      @include flexItem(vertical) {
        gap: $size-16;
        flex-grow: 1;
      }
      height: 100%;
      .body__head {
        @include flexItem(horizontal) {
          align-items: center;
          justify-content: flex-end;
        }

        padding-bottom: $size-8;
        padding-top: $size-8;
        border-bottom: $size-1 solid $color-g-90;
        width: 100%;
      }

      .body__list {
        @include flexItem(vertical) {
          gap: $size-8;
          flex-grow: 1;
          padding-left: $size-2;
          padding-right: $size-2;
          padding-bottom: $size-8;
          .btn-group {
            @include flexItem(horizontal) {
              gap: $size-8;
              justify-content: flex-end;
            }
          }
        }
      }

      @include responsive(phone) {
        min-height: 300px;
      }
    }

    @include responsive(tab-portrait) {
      .input__group > * {
        width: min(200px, 100%);
      }
    }

    @include responsive(phone) {
      padding-right: 0;
      flex-grow: 1;
    }

    &--inputs {
      @include flexItem(vertical) {
        gap: $size-16;
      }

      .input__group {
        align-items: flex-end;
      }
      .input__group--start {
        display: flex;
        justify-content: start;
        gap: $size-16;

        @include responsive(phone) {
          flex-direction: column;
        }
      }
    }

    @include scrollBar(normal);
  }

  &__footer {
    @include flexItem(horizontal) {
      justify-content: flex-end;
    }
    padding-right: $size-16;

    .btn_group {
      @include flexItem(horizontal) {
        align-items: center;
      }
      flex-grow: 1;

      & > *:nth-child(1) {
        margin-right: auto;
      }

      @include responsive(phone) {
        @include flexItem(vertical) {
          justify-content: center;
          gap: $size-16;

          & > * {
            width: 100%;
          }

          & > *:nth-child(1) {
            margin-right: $size-0;
          }
        }
      }
    }

    @include responsive(phone) {
      justify-content: center;
      padding-right: $size-0;

      & > * {
        width: 100%;
      }
    }
  }
}

.error-input {
  color: $color-denote-red;
  margin-left: 8px;
}

// MODAL CONTENT STYLING
.modal {
  &__content {
    @include flexItem(vertical) {
      gap: $size-32;
      align-items: center;
      width: 100%;
    }
    .body__inputs {
      @include flexItem(vertical) {
        gap: $size-16;
        width: 100%;
      }
    }

    .button {
      @include responsive(phone) {
        width: 100%;
      }
    }
  }
}
</style>
<style scoped lang="scss">
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
  justify-content: center;
  gap: $size-20;

  .delete-information {
    color: $color-black;
    font-weight: $fw-semi-bold;
    text-align: center;
  }
}
.payment-structure {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  gap: $size-26;

  & .payment-structure-heading {
    color: $color-g-44;
    font-weight: $fw-regular;
    font-size: $size-16;

    // @include responsive(phone) {
    // 	text-align: center;
    // }
  }
  & :deep(.payment-structure__radio) {
    display: flex;
    flex-direction: column;

    & label {
      font-size: $size-16;
      color: $color-black;
      font-weight: $fw-regular;
    }
  }
}
</style>
