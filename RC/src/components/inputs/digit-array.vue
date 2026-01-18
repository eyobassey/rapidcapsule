<template>
  <div class="input-container">
    <input
      ref="input1"
      type="text"
      class="input"
      maxlength="1"
      :placeholder="placeholder[0]"
      :value="input1"
      @keyup="handleKeyup($event, 1)"
      @keyup.backspace="handleBackspace($event, 1)"
      @input="handleInput($event, 1)"
      @paste="handlePaste($event)"
      :disabled="isdisabled"
    />
    <input
      ref="input2"
      type="text"
      class="input"
      maxlength="1"
      :placeholder="placeholder[1]"
      :value="input2"
      @keyup="handleKeyup($event, 2)"
      @keyup.backspace="handleBackspace($event, 2)"
      @input="handleInput($event, 2)"
      @paste="handlePaste($event)"
      :disabled="isdisabled"
    />
    <input
      ref="input3"
      type="text"
      class="input"
      maxlength="1"
      :placeholder="placeholder[2]"
      :value="input3"
      @keyup="handleKeyup($event, 3)"
      @keyup.backspace="handleBackspace($event, 3)"
      @input="handleInput($event, 3)"
      @paste="handlePaste($event)"
      :disabled="isdisabled"
    />
    <input
      ref="input4"
      type="text"
      class="input"
      maxlength="1"
      :placeholder="placeholder[3]"
      :value="input4"
      @keyup="handleKeyup($event, 4)"
      @keyup.backspace="handleBackspace($event, 4)"
      @input="handleInput($event, 4)"
      @paste="handlePaste($event)"
      :disabled="isdisabled"
    />
    <input
      ref="input5"
      type="text"
      class="input"
      maxlength="1"
      :placeholder="placeholder[4]"
      :value="input5"
      @keyup="handleKeyup($event, 5)"
      @keyup.backspace="handleBackspace($event, 5)"
      @input="handleInput($event, 5)"
      @paste="handlePaste($event)"
      :disabled="isdisabled"
    />
    <input
      ref="input6"
      type="text"
      class="input"
      maxlength="1"
      :placeholder="placeholder[5]"
      :value="input6"
      @keyup="handleKeyup($event, 6)"
      @keyup.backspace="handleBackspace($event, 6)"
      @input="handleInput($event, 6)"
      @paste="handlePaste($event)"
      :disabled="isdisabled"
    />
  </div>
</template>

<script>
export default {
  name: "Digi Array Input",

  props: {
    input1: String,
    input2: String,
    input3: String,
    input4: String,
    input5: String,
    input6: String,
    placeholder: {
      type: Array,
      required: true,
    },
    isdisabled: {
      type: Boolean,
      default: false,
    },
  },

  emits: [
    "update:input1",
    "update:input2",
    "update:input3",
    "update:input4",
    "update:input5",
    "update:input6",
    "input",
  ],

  methods: {
    handleInput(event, position) {
      this.$emit(`update:input${position}`, event.target.value);
      this.$emit('input');
    },

    handleKeyup(event, position) {
      if (event.key !== 'Backspace' && event.target.value && position < 6) {
        this.$refs[`input${position + 1}`].focus();
      } else if (position === 6) {
        event.target.blur();
      }
    },

    handleBackspace(event, position) {
      if (position > 1) {
        this.$refs[`input${position - 1}`].focus();
      } else {
        event.target.focus();
      }
    },

    handlePaste(event) {
      event.preventDefault();
      const pasteData = event.clipboardData.getData('text');
      
      // Clean the pasted data - remove spaces, dashes, and keep only digits
      const cleanData = pasteData.replace(/\D/g, '');
      
      // Check if it's a valid 6-digit OTP
      if (cleanData.length === 6) {
        // Split the OTP into individual digits and emit updates
        for (let i = 0; i < 6; i++) {
          this.$emit(`update:input${i + 1}`, cleanData[i]);
        }
        
        // Focus the last input and trigger input event for auto-submit
        setTimeout(() => {
          this.$refs.input6.focus();
          this.$emit('input');
        }, 0);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.input-container {
  @include flexItem(horizontal) {
    align-items: center;
    justify-content: center;
    gap: $size-16;
  }

  width: 90%;
  padding: $size-10;

  @include responsive(phone) {
    width: 100%;
    gap: $size-8;
    padding: $size-2;
  }
}

.input {
  padding: $size-12 $size-8;
  border-radius: $size-8;
  border: $size-1 solid $color-g-67;
  font-family: inherit;
  font-size: $size-48;
  font-weight: $fw-regular;
  text-align: center;
  width: 100%;

  &:disabled {
    background-color: $color-g-90;
    color: $color-g-67;
  }

  &::placeholder {
    color: $color-g-67;
    font-weight: $fw-thin;
  }

  &:focus {
    outline: none;
    border-color: $color-pri-t2;

    &::placeholder {
      opacity: 0;
    }
  }

  @include responsive(phone) {
    padding: $size-10 $size-6;
    font-size: $size-40;
  }
}
</style>
