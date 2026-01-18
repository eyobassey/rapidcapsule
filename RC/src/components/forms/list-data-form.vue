<template>
  <div class="form__container">
    <div v-if="hasList == false" class="body__initial">
      <Button
        type="text-secondary"
        :label="buttonLabel"
        size="large"
        :iconLeft="true"
        iconName="plus-colored"
        @click="$emit('clickAction')"
      />
    </div>
    <div v-if="hasList == true" class="body__populated">
      <div class="body__populated--head">
        <Button
          type="text-secondary"
          :label="buttonLabel"
          size="medium"
          :iconLeft="true"
          iconName="plus-colored"
          @click="$emit('clickAction')"
        />
      </div>
      <div class="body__populated--list">
        <slot />
      </div>
    </div>
  </div>
</template>

<script>
import Button from "../buttons/button-primary.vue";

export default {
  components: {
    Button,
  },

  props: {
    hasList: {
      type: Boolean,
      required: true,
    },
    buttonLabel: {
      type: String,
      required: true,
    },
  },
};
</script>

<style lang="scss" scoped>
.form__container {
  @include flexItem(vertical) {
    gap: $size-32;
    flex-grow: 1;
  }

  .body__initial {
    padding: $size-32;
    margin-inline: auto;
    flex-grow: 1;
  }

  .body__populated {
    @include flexItem(vertical) {
      gap: $size-16;
      flex-grow: 1;
    }

    &--head {
      @include flexItem(horizontal) {
        align-items: center;
        justify-content: flex-end;
      }

      padding-bottom: $size-8;
      padding-top: $size-8;
      width: 100%;
    }

    &--list {
      @include flexItem(vertical) {
        gap: $size-8;
        flex-grow: 1;
        height: 100%;
        padding-left: $size-8;
        padding-right: $size-8;
        padding-bottom: $size-8;

        @include responsive(phone) {
          padding-bottom: $size-48;
        }
      }
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
}
</style>
