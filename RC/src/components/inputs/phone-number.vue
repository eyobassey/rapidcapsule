<template>
  <div class="input__container">
    <p class="input__topLabel" v-if="topLabel">
      {{ topLabel }}
    </p>

    <div class="input" :class="{ focused: inputState, disabled: disabled }">
      <label for="phone" class="input__label">Phone number</label>
      <div class="input__select" tabindex="1" @blur="open = false">
        <div
          class="input__select--field"
          @click="
            open = !open;
            inputState = !inputState;
          "
        >
          {{ selected }}
        </div>
        <div class="input__select--icon" @click="open = !open">
          <Icons name="arrow-up" v-if="open" id="icon-up" />
          <Icons name="arrow-down" v-if="!open" id="icon-down" />
        </div>

        <DropDownList
          :list="countryCodes"
          :is-drop-open="open"
          text-align="left"
          dropAlignment="left"
          @selected-value="handleSelection"
          size="300%"
        />
      </div>

      <input
        type="text"
        name="phone"
        :readonly="disabled"
        id="phone"
        placeholder="800-123-4567"
        maxlength="10"
        class="input__field"
        :value="phoneNumber"
        @input="updateInput('phoneNumber', $event)"
        @focus="onfocus"
        @blur="onfocusOut"
      />
    </div>
    <slot />
  </div>
</template>

<script>
import Icons from "../icons.vue";
import CountryData from "country-all-data";
import DropDownList from "../utitlity/drop-down-list.vue";

export default {
  name: "PhoneInput",

  emits: ["update:phoneNumber", "update:model-value"],

  components: {
    Icons,
    DropDownList,
  },

  props: {
    errorMessage: {
      type: String,
      default: "",
    },
    tabindex: {
      type: Number,
      required: false,
      default: 0,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    modelValue: String,
    phoneNumber: String,
    topLabel: String,
  },

  data() {
    return {
      default: "+234",
      inputState: false,
      isSelected: null,
      open: false,
      countryCodes: [],
    };
  },

  computed: {
    selected() {
      return this.modelValue
        ? this.modelValue
        : this.isSelected
        ? this.isSelected
        : this.default
        ? this.default
        : null;
    },
  },

  methods: {
    async getCountryData() {
      let responsedata = await CountryData.getAllCountries();
      let countryData = responsedata.countries;

      countryData.forEach((item) => {
        if (item.phone) {
          if (item.phone.match(/\+/)) {
            if (item.phone.match(/[and]/)) {
              this.countryCodes.push(
                `(${item.phone.split("and")[0]}) ${item.country}`
              );
              this.countryCodes.push(
                `(${item.phone.split("and")[1]}) ${item.country}`
              );
            } else {
              this.countryCodes.push(`(${item.phone}) ${item.country}`);
            }
          } else {
            if (item.phone.match(/[and]/)) {
              this.countryCodes.push(
                `(+${item.phone.split("and")[0]}) ${item.country}`
              );
              this.countryCodes.push(
                `(+${item.phone.split("and")[1]}) ${item.country}`
              );
            }
            this.countryCodes.push(`(+${item.phone}) ${item.country}`);
          }
        }
      });
    },

    handleSelection(index) {
      this.isSelected = this.countryCodes[index]
        .split(" ")[0]
        .split("(")[1]
        .split(")")[0];
      this.open = false;
      this.$emit("update:model-value", this.isSelected);
    },

    updateInput(propName, evt) {
      let val = evt.target.value;
      val = val
        .replace(/[^0-9]/g, "")
        .replace(/^(\d{3})(\d{3})(\d{4})/g, "$1-$2-$3");
      if (val.charAt(0) === "0") {
        val = val.substring(1);
      }

      this.$emit(`update:${propName}`, val);
    },

    formatNumber(val) {
      val = val
        .replace(/[^0-9]/g, "")
        .replace(/^(\d{3})(\d{3})(\d{4})/g, "$1-$2-$3");
      if (val.charAt(0) === "0") {
        val = val.substring(1);
      }

      this.$emit("update:phoneNumber", val);
    },

    onfocus() {
      this.inputState = true;
    },

    onfocusOut() {
      this.inputState = false;
    },
  },

  watch: {
    phoneNumber: {
      handler(val) {
        if (!val) {
          this.$emit("update:model-value", this.default);
        } else {
          this.formatNumber(val);
        }
      },
      immediate: true,
    },
  },

  mounted() {
    this.getCountryData();
  },
};
</script>

<style scoped lang="scss">
.input__container {
  @include flexItem(vertical) {
    gap: $size-4;
    min-width: 200px;
  }
}
.input {
  position: relative;
  display: flex;
  width: 100%;
  height: 3.6rem;
  padding: $size-4;

  background-color: $color-white;
  border-radius: $size-8;
  border: 1px solid $color-g-67;

  &.disabled {
    background-color: $color-g-90;
    & .input__field {
      pointer-events: none;
      color: $color-g-67;
    }

    & .input__select {
      pointer-events: none;
      color: $color-g-67;

      &--icon > #icon-down,
      &--icon > #icon-up {
        fill: $color-g-67;
      }
    }
  }

  &:focus {
    border-color: $color-pri;
  }

  &__topLabel {
    color: $color-g-44 !important;
    margin-bottom: 10px;
    font-size: 12px;
  }

  &__field {
    height: 100%;
    width: 100%;
    padding: $size-8 $size-10;

    font-family: inherit;
    font-size: $size-16;
    font-weight: $fw-regular;
    color: inherit;
    line-height: 1.5;
    letter-spacing: 0.02em;

    outline: none;
    border: none;
    box-shadow: none;
    background-color: transparent;

    &::placeholder {
      color: $color-g-67;
    }
  }

  &__label {
    display: none;
  }

  &__select {
    display: flex;
    align-items: center;
    position: relative;
    flex-shrink: 0;

    min-width: 5.6rem;
    height: 100%;
    padding: $size-8 $size-0 $size-8 $size-8;
    border-radius: $size-4;

    font-family: inherit;
    font-size: $size-16;
    font-weight: $fw-regular;
    line-height: 1.5;
    letter-spacing: 0.02em;
    text-align: right;
    color: inherit;

    cursor: pointer;

    &:focus {
      outline: none;
    }

    &--field {
      width: 100%;
      padding-right: $size-8;
      color: inherit;
    }

    &--icon {
      display: flex;
    }
  }
}

.focused {
  border: 1px solid $color-pri;

  & .input__label {
    color: $color-pri;
    font-weight: $fw-semi-bold;
  }
}
</style>
