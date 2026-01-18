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
            :firstname="userProfile.profile.first_name"
            :lastname="userProfile.profile.last_name"
            :image="profileImage"
          />
        </div>
      </div>
      <div class="multi-step-form card-shadow card-outline">
        <div class="multi-step-form__progress">
          <div
            v-for="(title, index) in stepTitles"
            :key="'title' + index"
            class="progress-list__item"
            :class="{
              active: index === activeStep,
              completed: index < activeStep && visited === true,
            }"
          >
            <div class="indicator">
              <div class="indicator__dot"></div>
            </div>
            <p :class="{ inactive: index !== activeStep }">
              {{ title }}
            </p>
          </div>
        </div>
        <div class="multi-step-form__form-container">
          <div v-if="activeStep == 0" class="multi-step-form__step">
            <form @submit.prevent="nextStep" class="form">
              <div class="form__header">
                <h1 class="fs-20 fw-semi-bold lh-125">{{ stepTitles[0] }}</h1>
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
                      v-model="userProfile.profile.first_name"
                      :disabled="true"
                    ></Text>

                    <Text
                      type="text"
                      label="Lastname"
                      name="lname"
                      v-model="userProfile.profile.last_name"
                      :disabled="true"
                    ></Text>
                  </div>
                  <div class="input__group">
                    <Dropdown
                      :options="genderArray"
                      label="Gender"
                      :required="true"
                      v-model="basicInfo.gender"
                    ></Dropdown>

                    <DatePicker
                      Label="Date of Birth"
                      v-model="userProfile.profile.date_of_birth"
                      :disabled="true"
                    />
                    <Dropdown
                      :options="maritalStatusArray"
                      label="Marital Status"
                      :required="true"
                      v-model="basicInfo.maritalStatus"
                    ></Dropdown>
                  </div>
                  <div class="input__group">
                    <NumberInputSuffix
                      label="Height"
                      name="height"
                      max-digits="3"
                      :options="heightArray"
                      v-model="basicInfo.height.unit"
                      v-model:number-input="basicInfo.height.value"
                    ></NumberInputSuffix>
                    <NumberInputSuffix
                      label="Weight"
                      name="weight"
                      max-digits="3"
                      :options="weightArray"
                      v-model="basicInfo.weight.unit"
                      v-model:number-input="basicInfo.weight.value"
                    ></NumberInputSuffix>
                    <Dropdown
                      :options="smokerArray"
                      :required="true"
                      label="Smoker?"
                      v-model="basicInfo.smoker"
                    />
                  </div>
                </div>
                <div class="form__body--inputs">
                  <div class="input__group">
                    <Text
                      class="col-2"
                      type="email"
                      label="Email"
                      name="email"
                      v-model="userProfile.profile.contact.email"
                      :disabled="true"
                    >
                    </Text>
                    <PhoneInput
                      v-model:phone-number="number"
                      v-model="country_code"
                      :disabled="
                        this.userProfile.profile.contact.hasOwnProperty('phone')
                      "
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
                      v-model="basicInfo.contact.address.line1"
                    ></Text>
                    <Text
                      type="text"
                      label="Address Line 2"
                      max-chars="50"
                      name="address1"
                      v-model="basicInfo.contact.address.line2"
                    />
                  </div>
                  <div class="input__group">
                    <SelectFilterInput
                      name="patient-country"
                      label="Country"
                      position="top"
                      mode="country"
                      :required="true"
                      v-model:country-value="basicInfo.contact.address.country"
                      @selected-item="selectedItem"
                    />
                    <SelectFilterInput
                      name="patient-state"
                      label="State"
                      position="top"
                      mode="state"
                      :required="true"
                      :based-on="patientCountry"
                      v-model:state-value="basicInfo.contact.address.state"
                    />
                    <Text
                      type="text"
                      label="ZIP Code"
                      name="zip"
                      :required="true"
                      v-model="basicInfo.contact.address.zip"
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
                  :disabled="disableBtn"
                />
                <!-- :disabled="disableBtn" -->
              </div>
            </form>
          </div>
          <div v-if="activeStep == 1" class="multi-step-form__step">
            <div class="form">
              <div class="form__header">
                <h1 class="fs-20 fw-semi-bold lh-125">{{ stepTitles[1] }}</h1>
                <p class="fs-16 lh-150 fw-regular">
                  Please ensure you provide accurate data.
                </p>
              </div>

              <div class="form__body">
                <div v-if="!hasCondition" class="form__body--initial">
                  <Button
                    type="text-secondary"
                    label="Add Condition"
                    size="large"
                    :iconLeft="true"
                    iconName="plus-colored"
                    @click="openModal"
                  />
                </div>
                <div v-if="hasCondition" class="form__body--populated">
                  <div class="body__head">
                    <Button
                      type="text-secondary"
                      label="Add Condition"
                      size="medium"
                      :iconLeft="true"
                      iconName="plus-colored"
                      @click="openModal"
                    />
                  </div>
                  <div class="body__list">
                    <OneColListItem
                      v-for="(item, index) in conditionList"
                      :key="index"
                      :line-count="3"
                      :line-one-content="item.name"
                      :line-two-content="item.description"
                      :line-three-content="
                        extractDate(item.start_date) + ' - ' + endDate
                      "
                    >
                      <div class="btn-group">
                        <ButtonIcon
                          type="secondary"
                          iconName="edit"
                          color="#008C99"
                          @click="editItem(index)"
                        />
                        <ButtonIcon
                          type="secondary"
                          iconName="times"
                          color="#C11818"
                          @click="removeItem(index)"
                        />
                      </div>
                    </OneColListItem>
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
                    @click="prevStep"
                  />
                  <Button
                    type="primary"
                    label="Next"
                    size="small"
                    :iconRight="true"
                    iconName="arrow-right"
                    @click="nextStep"
                  />
                </div>
              </div>
            </div>
          </div>
          <div v-if="activeStep == 2" class="multi-step-form__step">
            <div class="form">
              <div class="form__header">
                <h1 class="fs-20 fw-semi-bold lh-125">{{ stepTitles[2] }}</h1>
                <p class="fs-16 lh-150 fw-regular">
                  Please ensure you provide accurate data.
                </p>
              </div>

              <div class="form__body">
                <div v-if="!hasContact" class="form__body--initial">
                  <Button
                    type="text-secondary"
                    label="Add Contact"
                    size="large"
                    :iconLeft="true"
                    iconName="plus"
                    @click="openModal"
                  />
                </div>
                <div v-if="hasContact" class="form__body--populated">
                  <div class="body__head">
                    <Button
                      type="text-secondary"
                      label="Add Contact"
                      size="medium"
                      :iconLeft="true"
                      iconName="plus"
                      @click="openModal"
                    />
                  </div>
                  <div class="body__list">
                    <OneColListItem
                      v-for="(item, index) in contactList"
                      :key="index"
                      :line-count="2"
                      :line-one-content="item.first_name + ' ' + item.last_name"
                      :line-two-content="
                        item.phone.country_code + ' (0) ' + item.phone.number
                      "
                    >
                      <div class="btn-group">
                        <ButtonIcon
                          type="secondary"
                          iconName="edit"
                          color="#008C99"
                          @click="editItem(index)"
                        />
                        <ButtonIcon
                          type="secondary"
                          iconName="times"
                          color="#C11818"
                          @click="removeItem(index)"
                        />
                      </div>
                    </OneColListItem>
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
                    @click="prevStep"
                  />
                  <Button
                    type="primary"
                    label="Next"
                    size="small"
                    :iconRight="true"
                    iconName="arrow-right"
                    @click="nextStep"
                    :disabled="!hasContact"
                  />
                </div>
              </div>
            </div>
          </div>
          <div v-if="activeStep == 3" class="multi-step-form__step">
            <div class="form">
              <div class="form__header">
                <h1 class="fs-20 fw-semi-bold lh-125">{{ stepTitles[3] }}</h1>
                <p class="fs-16 lh-150 fw-regular">
                  You are allowed a maximum of 6 dependants. Please ensure you
                  provide accurate data.
                </p>
              </div>

              <div class="form__body">
                <div v-if="!hasDependants" class="form__body--initial">
                  <Button
                    type="text-secondary"
                    label="Add Dependant"
                    size="large"
                    :iconLeft="true"
                    iconName="plus"
                    @click="openModal"
                  />
                </div>
                <div v-if="hasDependants" class="form__body--populated">
                  <div class="body__head">
                    <Button
                      type="text-secondary"
                      label="Add Dependant"
                      size="medium"
                      :iconLeft="true"
                      iconName="plus"
                      @click="openModal"
                      :disabled="dependantList.length == 6"
                    />
                  </div>
                  <div class="body__list">
                    <OneColListItem
                      v-for="(item, index) in dependantList"
                      :key="index"
                      :line-count="2"
                      :line-one-content="item.first_name + ' ' + item.last_name"
                      :line-two-content="item.relationship"
                    >
                      <div class="btn-group">
                        <ButtonIcon
                          type="secondary"
                          iconName="edit"
                          color="#008C99"
                          @click="editItem(index)"
                        />
                        <ButtonIcon
                          type="secondary"
                          iconName="times"
                          color="#C11818"
                          @click="removeItem(index)"
                        />
                      </div>
                    </OneColListItem>
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
                    @click="prevStep"
                  />
                  <Button
                    type="primary"
                    label="Next"
                    size="small"
                    :iconRight="true"
                    iconName="arrow-right"
                    @click="nextStep"
                  />
                </div>
              </div>
            </div>
          </div>
          <div v-if="activeStep == 4" class="multi-step-form__step">
            <div class="form">
              <div class="form__header">
                <h1 class="fs-20 fw-semi-bold lh-125">{{ stepTitles[4] }}</h1>
                <p class="fs-16 lh-150 fw-regular">
                  Setup a security question that you can use to retrieve or
                  reset your account.
                </p>
              </div>

              <div class="form__body">
                <div class="form__body--inputs">
                  <Dropdown
                    :options="questions"
                    label="Select Question"
                    :required="true"
                    v-model="security.question"
                  ></Dropdown>
                  <Text
                    type="text"
                    label="Your Answer"
                    name="secrete-answer"
                    v-model="security.answer"
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
                    @click="prevStep"
                  />
                  <Button
                    type="primary"
                    label="Finish"
                    size="small"
                    @click="postData"
                    :disabled="disableBtn"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <Loader v-if="loadingStatus" :useOverlay="true" />
      </div>
    </div>
  </div>

  <DialogModal
    v-show="isModalOpen"
    :title="stepTitles[activeStep]"
    :has-footer="true"
    @closeModal="closeModal"
  >
    <template v-slot:body>
      <div v-if="activeStep == 1" class="modal__content">
        <div class="input__group--row">
          <Text
            type="text"
            label="Condition Name"
            name="condition"
            :required="true"
            v-model="preExistingCondition.temp_name"
          />
          <AreaText
            name="description"
            label="description"
            placeholder="Describe the condition"
            rows="5"
            v-model="preExistingCondition.temp_description"
          />
        </div>
        <DateRangePicker
          v-model:startDate="preExistingCondition.temp_start_date"
          v-model:endDate="preExistingCondition.temp_end_date"
          v-model:status="preExistingCondition.temp_is_condition_exists"
        />
        <FileUploadForm
          v-model="preExistingCondition.temp_file"
          @error="setMessage"
        />
      </div>
      <div v-if="activeStep == 2" class="modal__content">
        <div class="input__group">
          <Text
            type="text"
            label="Firstname"
            name="Emergency-contact-firstname"
            :required="true"
            v-model="emergencyContact.temp_first_name"
          />
          <Text
            type="text"
            label="Lastname"
            name="Emergency-contact-lastname"
            :required="true"
            v-model="emergencyContact.temp_last_name"
          />
        </div>
        <div class="input__group">
          <Dropdown
            :options="relationshipArray"
            label="Relationship"
            :required="true"
            v-model="emergencyContact.temp_relationship"
          />
          <PhoneInput
            v-model:phone-number="emergencyContact.temp_number"
            v-model="emergencyContact.temp_country_code"
          />
        </div>
        <div class="input__group--row">
          <Text
            type="text"
            label="Address Line 1"
            max-chars="50"
            name="emergency-contact-address1"
            :required="true"
            v-model="emergencyContact.temp_address1"
          ></Text>
          <Text
            type="text"
            label="Address Line 2"
            max-chars="50"
            name="emergency-contact-address2"
            v-model="emergencyContact.temp_address2"
          />
        </div>
        <div class="input__group">
          <SelectFilterInput
            name="emergency-contact-country"
            label="Country"
            position="top"
            mode="country"
            :required="true"
            v-model:country-value="emergencyContact.temp_country"
            @selected-item="selectedItem"
          />
          <SelectFilterInput
            name="emergency-contact-state"
            label="State"
            position="top"
            mode="state"
            :required="true"
            :based-on="contactCountry"
            v-model:state-value="emergencyContact.temp_state"
          />
          <Text
            type="text"
            label="ZIP Code"
            name="emergency-contact-zip"
            :required="true"
            v-model="emergencyContact.temp_zip"
          ></Text>
        </div>
      </div>
      <div v-if="activeStep == 3" class="modal__content">
        <div class="body__inputs">
          <div class="input__group">
            <Text
              type="text"
              label="Firstname"
              name="dependatn-fname"
              :required="true"
              v-model="dependant.temp_first_name"
            />

            <Text
              type="text"
              label="Lastname"
              name="dependant-lname"
              :required="true"
              v-model="dependant.temp_last_name"
            />
          </div>
          <div class="input__group">
            <Dropdown
              :options="genderArray"
              label="Gender"
              :required="true"
              v-model="dependant.temp_gender"
            />

            <DatePicker
              Label="Date of Birth"
              v-model="dependant.temp_date_of_birth"
            />
            <Dropdown
              :options="relationshipArray"
              label="Relationship"
              :required="true"
              v-model="dependant.temp_relationship"
            />
          </div>
          <div class="input__group">
            <NumberInputSuffix
              label="Height"
              name="dependant-height"
              max-digits="3"
              :options="heightArray"
              v-model="dependant.temp_height_unit"
              v-model:number-input="dependant.temp_height_value"
            />
            <NumberInputSuffix
              label="Weight"
              name="dependant-weight"
              max-digits="3"
              :options="weightArray"
              v-model="dependant.temp_weight_unit"
              v-model:number-input="dependant.temp_weight_value"
            />
          </div>
        </div>

        <div class="body__inputs">
          <div class="input__group">
            <Text
              class="col-2"
              type="email"
              label="Email"
              name="dependant-email"
              :required="true"
              v-model="dependant.temp_email"
            />
            <PhoneInput
              v-model:phone-number="dependant.temp_number"
              v-model="dependant.temp_country_code"
            />
          </div>
        </div>
        <div class="body__inputs">
          <div class="input__group--row">
            <Text
              type="text"
              label="Address Line 1"
              name="dependant-address1"
              max-chars="50"
              :required="true"
              v-model="dependant.temp_address1"
            />
            <Text
              type="text"
              label="Address Line 2"
              name="dependant-address1"
              max-chars="50"
              v-model="dependant.temp_address2"
            />
          </div>
          <div class="input__group">
            <SelectFilterInput
              name="dependant-country"
              label="Country"
              position="top"
              mode="country"
              :required="true"
              v-model:country-value="dependant.temp_country"
              @selected-item="selectedItem"
            />
            <SelectFilterInput
              name="dependant-state"
              label="State"
              position="top"
              mode="state"
              :required="true"
              :based-on="dependantCountry"
              v-model:state-value="dependant.temp_state"
            />
            <Text
              type="text"
              label="ZIP Code"
              name="dependant-zip"
              :required="true"
              v-model="dependant.temp_zip"
            />
          </div>
        </div>
      </div>
    </template>
    <template v-slot:foot class="modal__foot">
      <Button
        type="tertiary"
        label="Save & Add New"
        size="medium"
        :disabled="disableBtn"
        class="button"
        @click="saveReset"
      />
      <Button
        type="primary"
        label="Save"
        size="medium"
        :disabled="disableBtn"
        class="button"
        @click="saveClose"
      />
    </template>
  </DialogModal>

  <Toast v-if="toastMessage" :message="toastMessage" />
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import { useVuelidate } from "@vuelidate/core";
import { required, minLength } from "@vuelidate/validators";
import AvatarFixed from "@/components/Avatars/avatar-fixed.vue";
import Text from "@/components/inputs/text.vue";
import NumberInputSuffix from "@/components/inputs/digits-suffix.vue";
import PhoneInput from "@/components/inputs/phone-number.vue";
import DatePicker from "@/components/inputs/date-picker.vue";
import CheckBox from "@/components/inputs/check-box.vue";
import Dropdown from "@/components/inputs/select-dropdown.vue";
import Button from "@/components/buttons/button-primary.vue";
import ButtonIcon from "@/components/buttons/button-icon.vue";
import DialogModal from "@/components/modals/dialog-modal.vue";
import Icons from "@/components/icons.vue";
import AreaText from "@/components/inputs/area-text.vue";
import DateRangePicker from "@/components/inputs/date-pickers/date-range.vue";
import FileUploadForm from "@/components/forms/File-upload-form.vue";
import OneColListItem from "@/components/Lists/single-col-list.vue";
import Loader from "../../Loader/main-loader.vue";
import SelectFilterInput from "@/components/inputs/select-filter-input.vue";
import Toast from "@/components/alerts/toasts.vue";
import { SECURITY_QUESTIONS } from "@/utilities/constants";

export default {
  name: "User-profile-setup",

  setup: () => ({ v$: useVuelidate() }),

  components: {
    AvatarFixed,
    Button,
    ButtonIcon,
    Text,
    PhoneInput,
    DatePicker,
    CheckBox,
    Dropdown,
    DialogModal,
    Icons,
    NumberInputSuffix,
    AreaText,
    DateRangePicker,
    FileUploadForm,
    OneColListItem,
    Loader,
    SelectFilterInput,
    Toast,
  },

  data() {
    return {
      loadingStatus: false,
      activeStep: 0,
      visited: false,
      stepTitles: [
        "Personal information",
        "Pre-existing Condition",
        "Emergency Contact",
        "Dependants",
        "Security",
      ],
      genderArray: ["Male", "Female"],
      maritalStatusArray: ["Single", "Married", "Divorced", "Widowed"],
      heightArray: ["cm", "m"],
      weightArray: ["kg", "lb"],
      smokerArray: ["Yes", "No"],
      relationshipArray: [
        "Brother",
        "Sister",
        "Wife",
        "Husband",
        "Father",
        "Mother",
        "Uncle",
        "Aunty",
        "Son",
        "Daughter",
        "Friend",
      ],
      questions: SECURITY_QUESTIONS,

      isModalOpen: false,
      reset: false,
      contactCountry: null,
      dependantCountry: null,
      patientCountry: null,
      toastMessage: "",

      basicInfo: {
        gender: "",
        maritalStatus: null,
        height: {
          value: null,
          unit: "cm",
        },
        weight: {
          value: null,
          unit: "kg",
        },
        smoker: null,
        contact: {
          phone: {
            country_code: null,
            number: null,
          },
          address: {
            line1: null,
            line2: null,
            state: null,
            country: null,
            zip: null,
          },
        },
      },
      preExistingCondition: {
        temp_name: null,
        temp_description: null,
        temp_start_date: null,
        temp_end_date: null,
        temp_is_condition_exists: false,
        temp_file: null,
        index: null,
      },

      emergencyContact: {
        temp_first_name: null,
        temp_last_name: null,
        temp_relationship: null,
        temp_number: null,
        temp_country_code: null,
        temp_address1: null,
        temp_address2: null,
        temp_state: null,
        temp_country: null,
        temp_zip: null,
        index: null,
      },

      dependant: {
        temp_first_name: null,
        temp_last_name: null,
        temp_gender: null,
        temp_date_of_birth: null,
        temp_relationship: null,
        temp_height_unit: null,
        temp_height_value: null,
        temp_weight_unit: null,
        temp_weight_value: null,
        temp_email: null,
        temp_number: null,
        temp_country_code: null,
        temp_address1: null,
        temp_address2: null,
        temp_state: null,
        temp_country: null,
        temp_zip: null,
        index: null,
      },

      security: {
        question: null,
        answer: null,
      },
      phone: "",
      cCode: "",
    };
  },

  computed: {
    ...mapGetters({
      userProfile: "userprofile",
      updatedInfo: "profileSetup/addedInfo",
      isAuthenticated: "authenticated",
    }),

    number: {
      get() {
        return this.userProfile.profile.contact.hasOwnProperty("phone")
          ? this.userProfile.profile.contact.phone.number
          : this.phone;
      },

      set(val) {
        this.phone = val;
      },
    },

    phoneComputed() {
      this.basicInfo.contact.phone.number = this.number.replace(/[-]/g, "");
    },

    country_code: {
      get() {
        return this.userProfile.profile.contact.hasOwnProperty("phone")
          ? this.userProfile.profile.contact.phone.country_code
          : this.cCode;
      },
      set(val) {
        this.cCode = val;
      },
    },

    countryCodeComputed() {
      this.basicInfo.contact.phone.country_code = this.country_code;
    },

    profileImage() {
      return this.updatedInfo.profile.profile_photo;
    },

    // PRE-EXISTING CONDITIONS
    conditionList() {
      return this.updatedInfo.pre_existing_conditions;
    },

    hasCondition() {
      return this.conditionList.length > 0 ? true : false;
    },

    endDate() {
      let end_date = this.conditionList.end_date;

      if (!end_date) {
        return "Present";
      } else {
        return end_date;
      }
    },

    // EMERGENCY CONTACTS
    contactList() {
      return this.updatedInfo.emergency_contacts;
    },

    hasContact() {
      return this.contactList.length > 0 ? true : false;
    },

    // DEPENDANTS
    dependantList() {
      return this.updatedInfo.dependants;
    },

    hasDependants() {
      return this.dependantList.length > 0 ? true : false;
    },

    // ENABLE AND DISABLE FORM BUTTONS BASED ON VALIDATION STATUS
    disableBtn() {
      let step = this.activeStep;
      if (step == 0) {
        return this.v$.basicInfo.$invalid;
      }
      if (step == 1) {
        return this.v$.preExistingCondition.$invalid;
      }
      if (step == 2) {
        return this.v$.emergencyContact.$invalid;
      }
      if (step == 3) {
        return this.v$.dependant.$invalid;
      }
      if (step == 4) {
        return this.v$.security.$invalid;
      }
    },
  },

  validations() {
    return {
      // VALIDATION TESTS FOR STEP 1 FORM
      basicInfo: {
        gender: { required: required, $autoDirty: true },
        maritalStatus: { required: required, $autoDirty: true },
        smoker: { required: required, $autoDirty: true },
        contact: {
          address: {
            line1: { required: required, $autoDirty: true },
            state: { required: required, $autoDirty: true },
            country: { required: required, $autoDirty: true },
            zip: {
              required: required,
              minLength: minLength(5),
              $autoDirty: true,
            },
          },
        },
      },

      // VALIDATION TESTS FOR STEP 2 FORM
      preExistingCondition: {
        temp_name: { required: required, $autoDirty: true },
        temp_start_date: { required: required, $autoDirty: true },
      },

      // VALIDATION TESTS FOR STEP 3 FORM
      emergencyContact: {
        temp_first_name: { required: required, $autoDirty: true },
        temp_last_name: { required: required, $autoDirty: true },
        temp_relationship: { required: required, $autoDirty: true },
        temp_number: { required: required, $autoDirty: true },
        temp_address1: { required: required, $autoDirty: true },
        temp_state: { required: required, $autoDirty: true },
        temp_country: { required: required, $autoDirty: true },
        temp_zip: {
          required: required,
          minLength: minLength(5),
          $autoDirty: true,
        },
      },

      // VALIDATION TESTS FOR STEP 3 FORM
      dependant: {
        temp_first_name: { required: required, $autoDirty: true },
        temp_last_name: { required: required, $autoDirty: true },
        temp_gender: { required: required, $autoDirty: true },
        temp_relationship: { required: required, $autoDirty: true },
        temp_email: { required: required, $autoDirty: true },
        temp_number: { required: required, $autoDirty: true },
        temp_address1: { required: required, $autoDirty: true },
        temp_state: { required: required, $autoDirty: true },
        temp_country: { required: required, $autoDirty: true },
        temp_zip: {
          required: required,
          minLength: minLength(5),
          $autoDirty: true,
        },
      },

      // VALIDATION TESTS FOR STEP 4 FORM
      security: {
        answer: { required: required, $autoDirty: true },
      },
    };
  },

  methods: {
    ...mapActions({
      updateBasicInfo: "profileSetup/updatebasicinfo",
      updatePreExCondition: "profileSetup/updatepreexcondition",
      removePreExCondition: "profileSetup/removepreexcon",
      updateEmergencyContact: "profileSetup/updateemergencycontact",
      removeEmergencyContact: "profileSetup/removeemergencycontact",
      updateDependant: "profileSetup/updatedependant",
      removeDependant: "profileSetup/removedependant",
      updateDataBase: "profileSetup/updatedatabase",
    }),

    setMessage(message) {
      this.toastMessage = message;
    },

    selectedItem(evtObj) {
      let id = evtObj.target;
      let selected = evtObj.selectedItem;

      if (id === "dependant-country") {
        this.dependantCountry = selected;
      }
      if (id === "emergency-contact-country") {
        this.contactCountry = selected;
      }
      if (id === "patient-country") {
        this.patientCountry = selected;
      }
    },

    nextStep() {
      switch (this.activeStep) {
        case 0:
          this.updateBasicInfo(this.basicInfo);
          this.activeStep++;
          this.visited = true;
          window.scrollTo(0, 0);
          break;

        case 1:
          this.activeStep++;
          this.visited = true;
          window.scrollTo(0, 0);
          break;

        case 2:
          this.activeStep++;
          this.visited = true;
          window.scrollTo(0, 0);
          break;

        case 3:
          this.activeStep++;
          this.visited = true;
          window.scrollTo(0, 0);
          break;
      }
    },
    prevStep() {
      switch (this.activeStep) {
        case 1:
          this.activeStep--;
          this.visited = true;
          window.scrollTo(0, 0);
          break;

        case 2:
          this.activeStep--;
          this.visited = true;
          window.scrollTo(0, 0);
          break;

        case 3:
          this.activeStep--;
          this.visited = true;
          window.scrollTo(0, 0);
          break;

        case 4:
          this.activeStep--;
          this.visited = true;
          window.scrollTo(0, 0);
          break;
      }
    },

    saveClose() {
      this.persistData();
      this.closeModal();
    },

    saveReset() {
      this.persistData();
    },

    persistData() {
      let step = this.activeStep;
      if (step == 1) {
        this.updatePreExCondition(this.preExistingCondition).then((result) => {
          if (result == true) {
            setTimeout(() => {
              this.resetData(this.preExistingCondition);
            }, 500);
          }
        });
      }
      if (step == 2) {
        this.updateEmergencyContact(this.emergencyContact).then((result) => {
          if (result == true) {
            setTimeout(() => {
              this.resetData(this.emergencyContact);
            }, 500);
          }
        });
      }
      if (step == 3) {
        this.updateDependant(this.dependant).then((result) => {
          if (result == true) {
            setTimeout(() => {
              this.resetData(this.dependant);
            }, 500);
          }
        });
      }
    },

    resetData(dataSet) {
      for (var key in dataSet) {
        dataSet[key] = null;
      }
    },

    openModal() {
      this.isModalOpen = true;
    },

    closeModal() {
      let step = this.activeStep;
      this.isModalOpen = false;
      if (step == 1) {
        setTimeout(() => {
          this.resetData(this.preExistingCondition);
        }, 500);
      }
      if (step == 2) {
        setTimeout(() => {
          this.resetData(this.emergencyContact);
        }, 500);
      }
      if (step == 3) {
        setTimeout(() => {
          this.resetData(this.dependant);
        }, 500);
      }
    },

    removeItem(index) {
      let step = this.activeStep;
      if (step == 1) {
        this.removePreExCondition(index);
      }
      if (step == 2) {
        this.removeEmergencyContact(index);
      }
      if (step == 3) {
        this.removeDependant(index);
      }
    },

    editItem(index) {
      let step = this.activeStep;
      if (step == 1) {
        this.preExistingCondition.temp_name = this.conditionList[index].name;
        this.preExistingCondition.temp_description =
          this.conditionList[index].description;
        this.preExistingCondition.temp_start_date =
          this.conditionList[index].start_date;
        this.preExistingCondition.temp_end_date =
          this.conditionList[index].end_date;
        this.preExistingCondition.temp_is_condition_exists =
          this.conditionList[index].is_condition_exists;
        this.preExistingCondition.temp_file = this.convertToFile(
          this.conditionList[index].file
        );
        this.preExistingCondition.index = index;
      }

      if (step == 2) {
        this.emergencyContact.temp_first_name =
          this.contactList[index].first_name;
        this.emergencyContact.temp_last_name =
          this.contactList[index].last_name;
        this.emergencyContact.temp_relationship =
          this.contactList[index].relationship;
        this.emergencyContact.temp_number =
          this.contactList[index].phone.number;
        this.emergencyContact.temp_country_code =
          this.contactList[index].phone.country_code;
        this.emergencyContact.temp_address1 = this.contactList[index].address1;
        this.emergencyContact.temp_address2 = this.contactList[index].address2;
        this.emergencyContact.temp_state = this.contactList[index].state;
        this.emergencyContact.temp_country = this.contactList[index].country;
        this.emergencyContact.temp_zip = this.contactList[index].zip_code;
        this.emergencyContact.index = index;
      }

      if (step == 3) {
        this.dependant.temp_first_name = this.dependantList[index].first_name;
        this.dependant.temp_last_name = this.dependantList[index].last_name;
        this.dependant.temp_gender = this.dependantList[index].gender;
        this.dependant.temp_date_of_birth =
          this.dependantList[index].date_of_birth;
        this.dependant.temp_relationship =
          this.dependantList[index].relationship;
        this.dependant.temp_height_value =
          this.dependantList[index].basic_health_info.height.value;
        this.dependant.temp_height_unit =
          this.dependantList[index].basic_health_info.height.unit;
        this.dependant.temp_weight_value =
          this.dependantList[index].basic_health_info.weight.value;
        this.dependant.temp_weight_unit =
          this.dependantList[index].basic_health_info.weight.unit;
        this.dependant.temp_email = this.dependantList[index].contact.email;
        this.dependant.temp_number =
          this.dependantList[index].contact.phone.number;
        this.dependant.temp_country_code =
          this.dependantList[index].contact.phone.country_code;
        this.dependant.temp_address1 =
          this.dependantList[index].contact.address1;
        this.dependant.temp_address2 =
          this.dependantList[index].contact.address2;
        this.dependant.temp_state = this.dependantList[index].contact.state;
        this.dependant.temp_country = this.dependantList[index].contact.country;
        this.dependant.temp_zip = this.dependantList[index].contact.zip_code;
        this.dependant.index = index;
      }

      this.openModal();
    },

    /* UTILITY FUNCTIONS */

    extractDate(date, lang) {
      let dateVal = new Date(date);
      let year = dateVal.getFullYear();
      let month = dateVal.toLocaleString(lang, { month: "short" });
      let day = dateVal.getDate().toString().padStart(2, "0");

      return `${day} ${month}, ${year}`;
    },

    convertToFile(array) {
      const newFileList = new DataTransfer();
      for (const item of array) {
        let b64Str = item.url.split(",")[1];
        let blob = window.atob(b64Str);
        const file = new File([blob], item.original_name, {
          type: item.file_type,
        });
        newFileList.items.add(file);
      }

      return newFileList.files;
    },

    /* SEND DATA TO SERVER */

    postData() {
      this.loadingStatus = true;
      this.updateDataBase(this.security).then((result) => {
        if (result == true) {
          this.$router.push({ name: "Patient Dashboard" });
          setTimeout(() => {
            this.$store.state.profileSetup.addedInfo.profile = {};
            this.$store.state.profileSetup.addedInfo.pre_existing_conditions =
              [];
            this.$store.state.profileSetup.addedInfo.emergency_contacts = [];
            this.$store.state.profileSetup.addedInfo.dependants = [];
            this.loadingStatus = false;
          }, 1000);
        }
      });
    },
  },

  watch: {
    updatedInfo: {
      handler(value) {
        if (this.activeStep > 0 || value.profile.gender) {
          this.basicInfo.gender = value.profile.gender;
          this.basicInfo.maritalStatus = value.profile.marital_status;
          this.basicInfo.height.value =
            value.profile.basic_health_info.height.value;
          this.basicInfo.height.unit =
            value.profile.basic_health_info.height.unit;
          this.basicInfo.weight.value =
            value.profile.basic_health_info.weight.value;
          this.basicInfo.weight.unit =
            value.profile.basic_health_info.weight.unit;
          this.basicInfo.smoker = value.profile.health_risk_factors.is_smoker;
          this.basicInfo.contact.address.line1 = value.profile.contact.address1;
          this.basicInfo.contact.address.line2 = value.profile.contact.address2;
          this.basicInfo.contact.address.state = value.profile.contact.state;
          this.basicInfo.contact.address.country =
            value.profile.contact.country;
          this.basicInfo.contact.address.zip = value.profile.contact.zip_code;
        }
      },
      immediate: true,
    },

    "basicInfo.contact.address.country": {
      handler(value) {
        this.patientCountry = value;
      },
      immediate: true,
    },

    "emergencyContact.temp_country": {
      handler(value) {
        this.contactCountry = value;
      },
      immediate: true,
    },

    "dependant.temp_country": {
      handler(value) {
        this.dependantCountry = value;
      },
      immediate: true,
    },
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
    padding: $size-0;
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
      padding: $size-32;
      margin-inline: auto;
      flex-grow: 1;

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
