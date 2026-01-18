<template>
  <DialogModal :title="title" @closeModal="handleClose" :hasFooter="true">
    <template v-slot:body>
      <div class="input__group">
        <PhoneInput
          v-model:phone-number="changePhoneNumberPayload.phone"
          v-model="changePhoneNumberPayload.country_code"
          top-label="New Phone Number"
        />
      </div>
      <div class="input__group top-space">
        <Text
          class="col-2"
          type="text"
          label="Your answer"
          name="email"
          :required="true"
          v-model="changePhoneNumberPayload.answer"
          :topLabel="securityQuestionLabel"
          :extraText="changePhoneNumberPayload.question"
        />
      </div>

      <div v-if="hasError" class="errorWrapper">
        <p class="errorText">{{ errorMessage }}</p>
      </div>
    </template>
    <template v-slot:foot>
      <Button
        type="primary"
        label="Next"
        size="medium"
        class="button"
        @click="updatePhoneHandler"
        :disabled="v$.$invalid"
      />
    </template>
    <template v-slot:loader>
      <Loader v-if="isLoading" :useOverlay="true" :rounded="true" />
    </template>
  </DialogModal>
</template>

<script>
import { ref, reactive, computed, watchEffect, inject } from "vue";
import { mapGetters as useMapGetters } from "@/utilities/utilityStore";
import useVuelidate from "@vuelidate/core";
import { required } from "@vuelidate/validators";
import { useToast } from "vue-toast-notification";
import DialogModal from "@/components/modals/dialog-modal.vue";
import Text from "@/components/inputs/text.vue";
import Button from "@/components/buttons/button-primary.vue";
import PhoneInput from "@/components/inputs/phone-number.vue";
import Loader from "@/components/Loader/main-loader.vue";
import { STATUS_CODES, SECURITY_UPDATE_OPTIONS } from "@/utilities/constants";
import { formatNumber } from "@/Utility-functions";

export default {
  name: "UpdatePhoneDialog",
  components: { DialogModal, Text, Button, PhoneInput, Loader },

  setup: (_, { emit }) => {
    const $http = inject("$http");
    const $toast = useToast();
    const { userSecurityQuestion: securityQuestion, userprofile: userProfile } =
      useMapGetters();

    const step = ref(1);
    const changePhoneNumberPayload = reactive({
      phone: "",
      country_code: "",
      answer: "",
      question: "",
    });
    const title = ref("Change Phone Number");
    const securityQuestionLabel = ref("Security Question");
    const isLoading = ref(false);
    const errorMessage = ref("");
    const hasError = ref(false);

    const validations = computed(() => ({
      answer: { requred: required, $autoDirty: true },
      phone: { requited: required, $autoDirty: true },
    }));

    const v$ = useVuelidate(validations, changePhoneNumberPayload);

    watchEffect(() => {
      if (userProfile.value || securityQuestion.value) {
        const {
          profile: {
            contact: {
              phone: { country_code, number },
            },
          },
        } = userProfile.value;

        changePhoneNumberPayload.phone = number;
        changePhoneNumberPayload.country_code = country_code;
        changePhoneNumberPayload.question = securityQuestion.value;
      }
    });

    const handleClose = () => emit("closeChangePhoneDialog");

    const updatePhoneHandler = async () => {
      const isInValid = v$.value.$invalid;

      if (!isInValid) {
        isLoading.value = true;
        const payload = {
          phone: formatNumber(changePhoneNumberPayload.phone),
          country_code: changePhoneNumberPayload.country_code,
          answer: changePhoneNumberPayload.answer,
        };

        try {
          const response = await $http.$_changePhoneNumber(payload);
          if (response) {
            const { statusCode: status, message } = response.data;
            if (status === STATUS_CODES.SUCCESS) {
              $toast.success(message);
              emit("hasSentOtp", {
                type: SECURITY_UPDATE_OPTIONS.SMS,
                payload: {
                  phone: formatNumber(changePhoneNumberPayload.phone),
                  country_code: changePhoneNumberPayload.country_code,
                },
              });
            }
          }
        } catch (e) {
          const {
            response: {
              data: { errorMessage: serverError, statusCode },
            },
          } = e;
          if (statusCode === STATUS_CODES.BAD_REQUEST) {
            hasError.value = true;
            errorMessage.value = serverError;

            setTimeout(() => {
              hasError.value = false;
              errorMessage.value = "";
            }, [5000]);
          } else {
            $toast.error(
              serverError || "An error has occured, please try again"
            );
          }
        }
      }
      isLoading.value = false;
    };

    return {
      v$,
      handleClose,
      step,
      title,
      changePhoneNumberPayload,
      securityQuestionLabel,
      validations,
      updatePhoneHandler,
      isLoading,
      errorMessage,
      hasError,
    };
  },
};
</script>

<style scoped lang="scss">
.top-space {
  margin-top: 25px;
}

.errorWrapper {
  margin-top: $size-26;
  .errorText {
    color: $color-ter-error;
    font-size: $size-14;
  }
}
</style>
