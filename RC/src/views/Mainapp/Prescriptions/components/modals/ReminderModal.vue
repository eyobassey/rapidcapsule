<template>
  <div>
    <DialogModal
      @closeModal="handleClose"
      title="Add Reminder"
      :hasFooter="true"
    >
      <template v-slot:body>
        <div class="reminder__container">
          <text-input
            label="Drug Name"
            class="reminder__container__full-width"
            placeholder="Drug Name"
            v-model="reminderPayload.drugName"
            :disabled="true"
          />

          <div class="reninder__container__wrapper">
            <p class="reminder__container__wrapper__label">Dosage</p>
            <div class="reminder__container__dosage__content">
              <div class="input__group">
                <NumberInputSuffix
                  label="Dose"
                  name="Dosage"
                  max-digits="3"
                  :options="reminderPayload.dosage_form"
                  v-model="reminderPayload.dosage_form"
                  v-model:number-input="reminderPayload.dosage_quantity"
                  :disabled="true"
                />
              </div>
              <div class="input__group">
                <NumberInputSuffix
                  label="Interval"
                  name="interval"
                  max-digits="3"
                  :options="reminderPayload.interval_unit"
                  v-model="reminderPayload.interval_unit"
                  v-model:number-input="reminderPayload.interval_time"
                  :disabled="true"
                  :textType="true"
                />
              </div>
              <div class="input__group">
                <NumberInputSuffix
                  label="Period"
                  name="period"
                  max-digits="3"
                  :options="reminderPayload.period_unit"
                  v-model="reminderPayload.period_unit"
                  v-model:number-input="reminderPayload.period_number"
                  :disabled="true"
                />
              </div>
            </div>
          </div>
          <div class="reninder__container__wrapper">
            <p class="reminder__container__wrapper__label">Date and Time</p>
            <div class="reminder__container__date-time-picker">
              <rc-datepicker
                :min-date="new Date()"
                label="Date"
                v-model="reminderPayload.start_date"
              />
              <rc-timepicker
                label="Time"
                v-model="reminderPayload.start_time"
              />
            </div>
          </div>
          <div class="reninder__container__wrapper">
            <textarea-input
              placeholder="Note"
              v-model="reminderPayload.note"
              :disabled="true"
            />
          </div>
        </div>
      </template>
      <template v-slot:foot>
        <Button
          type="primary"
          label="Save"
          size="medium"
          class="button"
          @click="submit"
          :disabled="v$.$invalid"
        />
      </template>
      <template v-slot:loader>
        <Loader v-if="isLoading" :useOverlay="true" :rounded="true" />
      </template>
    </DialogModal>
  </div>
</template>

<script>
import {
  defineComponent,
  reactive,
  ref,
  computed,
  onBeforeMount,
  inject,
} from "vue";
import { useToast } from "vue-toast-notification";
import useVuelidate from "@vuelidate/core";
import { required } from "@vuelidate/validators";
import DialogModal from "@/components/modals/dialog-modal";
import TextInput from "@/components/inputs/text";
import TextareaInput from "@/components/inputs/textarea";
import RcTimepicker from "@/components/RCTimepicker";
import RcDatepicker from "@/components/RCDatepicker";
import Button from "@/components/buttons/button-primary.vue";
import NumberInputSuffix from "@/components/inputs/digits-suffix.vue";
import Loader from "@/components/Loader/main-loader.vue";
import { capitalizeWord } from "@/utilities/utilityFunctions";
import { STATUS_CODES } from "@/utilities/constants";

export default defineComponent({
  name: "ReminderModal",
  components: {
    DialogModal,
    TextInput,
    TextareaInput,
    RcDatepicker,
    RcTimepicker,
    Loader,
    NumberInputSuffix,
    Button,
  },
  props: {
    selectedPrescription: { type: Object, required: true },
  },
  setup: ({ selectedPrescription }, { emit }) => {
    const $http = inject("$http");
    const $toast = useToast();

    const isLoading = ref(false);
    const reminderPayload = reactive({
      drugName: "",
      dosage_quantity: "",
      dosage_form: "",
      interval_time: "",
      interval_unit: "",
      period_number: "",
      period_unit: "",
      start_date: null,
      start_time: null,
      note: "",
    });

    const handleClose = () => {
      emit("handleCloseModal");
    };

    const submit = async () => {
      const payload = {
        title: reminderPayload.drugName,
        data: [reminderPayload.note],
        start_date: reminderPayload.start_date,
        start_time: reminderPayload.start_time,
        dosage: {
          dose: { ...selectedPrescription.data.dose },
          interval: { ...selectedPrescription.data.interval },
          period: { ...selectedPrescription.data.period },
        },
      };

      try {
        isLoading.value = true;
        const response = await $http.$_createReminder(payload);
        if (response) {
          const { statusCode: status } = response.data;

          if (status === STATUS_CODES.CREATED) {
            $toast.success("Reminder has been created successfully");
            handleClose();
          }
        }
      } catch (error) {
        const {
          response: {
            data: { errorMessage: serverError },
          },
        } = error;

        $toast.error(serverError || "An error has occured, please try again");
      }
      isLoading.value = false;
    };

    const validations = computed(() => ({
      start_date: { requited: required, $autoDirty: true },
      start_time: { requited: required, $autoDirty: true },
    }));

    const v$ = useVuelidate(validations, reminderPayload);

    onBeforeMount(() => {
      const {
        drug,
        notes,
        dose: { quantity, dosage_form },
        interval: { time, unit: intervalUnit },
        period: { number, unit: periodUnit },
      } = selectedPrescription.data;

      reminderPayload.drugName = drug;
      reminderPayload.dosage_quantity = quantity;
      reminderPayload.dosage_form = [capitalizeWord(dosage_form)];
      reminderPayload.interval_time = time;
      reminderPayload.interval_unit = [capitalizeWord(intervalUnit)];
      reminderPayload.period_number = number;
      reminderPayload.period_unit = [capitalizeWord(periodUnit)];
      reminderPayload.note = notes;
    });

    return { v$, validations, handleClose, reminderPayload, submit, isLoading };
  },
});
</script>

<style scoped lang="scss">
.reminder {
  &__container {
    width: 100%;

    @include flexItem(vertical) {
      gap: $size-38;
    }

    &__full-width {
      width: 100%;
    }

    &__wrapper {
      &__label {
        color: $color-g-44;
        font-size: $size-16;
        margin-bottom: $size-10;
      }
    }

    &__dosage {
      &__content {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        grid-gap: $size-16;

        @include responsive(phone) {
          grid-column-gap: $size-5;
        }
      }
    }

    &__date-time-picker {
      @include flexItem(horizontal) {
        align-items: center;
        gap: $size-20;
      }
    }
  }
}
</style>
