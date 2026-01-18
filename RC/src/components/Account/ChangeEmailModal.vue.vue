<template>
  <DialogModal :title="title" @closeModal="handleClose" :hasFooter="true">
    <template v-slot:body>
      <div class="input__group">
        <Text
          class="col-2"
          type="email"
          label="Email"
          name="email"
          :required="true"
          v-model="changeEmailPayload.email"
          topLabel="New Email Address"
        />
      </div>
      <div class="input__group top-space">
        <Text
          class="col-2"
          type="text"
          label="Your answer"
          name="email"
          :required="true"
          v-model="changeEmailPayload.answer"
          :topLabel="securityQuestionLabel"
          :extraText="changeEmailPayload.question"
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
        @click="updateEmailHandler"
        :disabled="v$.$invalid"
      />
    </template>
    <template v-slot:loader>
      <Loader v-if="isLoading" :useOverlay="true" :rounded="true" />
    </template>
  </DialogModal>
</template>

<script>
import {
  ref,
  reactive,
  computed,
  watchEffect,
  inject,
  defineComponent,
} from "vue";
import { mapGetters as useMapGetters } from "@/utilities/utilityStore";
import useVuelidate from "@vuelidate/core";
import { required, email } from "@vuelidate/validators";
import { useToast } from "vue-toast-notification";
import DialogModal from "@/components/modals/dialog-modal.vue";
import Text from "@/components/inputs/text.vue";
import Button from "@/components/buttons/button-primary.vue";
import Loader from "@/components/Loader/main-loader.vue";
import { STATUS_CODES, SECURITY_UPDATE_OPTIONS } from "@/utilities/constants";

export default defineComponent({
  name: "Update Email Dialog",
  components: { DialogModal, Text, Button, Loader },

  setup: (_, { emit }) => {
    const $http = inject("$http");
    const $toast = useToast();
    const { userSecurityQuestion: securityQuestion, userprofile: userProfile } =
      useMapGetters();

    const title = ref("Change Email Address");
    const securityQuestionLabel = ref("Security Question");
    const isLoading = ref(false);
    const errorMessage = ref("");
    const hasError = ref(false);
    const step = ref(1);
    const changeEmailPayload = reactive({
      email: "",
      answer: "",
      question: "",
    });

    const handleClose = () => emit("closeChangeEmailDialog");

    const validations = computed(() => ({
      answer: { requred: required, $autoDirty: true },
      email: { requited: required, $autoDirty: true, type: email },
    }));

    watchEffect(() => {
      if (userProfile.value || securityQuestion.value) {
        const {
          profile: {
            contact: { email },
          },
        } = userProfile.value;

        changeEmailPayload.email = email;
        changeEmailPayload.question = securityQuestion.value;
      }
    });

    const v$ = useVuelidate(validations, changeEmailPayload);

    const updateEmailHandler = async () => {
      const isInValid = v$.value.$invalid;

      if (!isInValid) {
        isLoading.value = true;
        const payload = {
          email: changeEmailPayload.email,
          answer: changeEmailPayload.answer,
        };

        try {
          const response = await $http.$_changeEmail(payload);
          if (response) {
            const { statusCode: status, message } = response.data;
            if (status === STATUS_CODES.SUCCESS) {
              $toast.success(message);
              emit("hasSentOtp", {
                type: SECURITY_UPDATE_OPTIONS.EMAIL,
                payload: changeEmailPayload.email,
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
      changeEmailPayload,
      securityQuestionLabel,
      validations,
      updateEmailHandler,
      isLoading,
      errorMessage,
      hasError,
    };
  },
});
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
