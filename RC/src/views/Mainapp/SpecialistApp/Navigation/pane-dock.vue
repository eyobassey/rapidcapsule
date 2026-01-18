<template>
  <div class="right__pane">
    <div class="pane__dock">
      <buttonIcon
        v-for="(button, index) of buttons"
        :key="index"
        type="primary"
        :iconName="button.icon"
        :state="button.isActive"
        @click="openFlyout(index)"
      />
    </div>
  </div>
</template>

<script>
import buttonIcon from "@/components/buttons/button-icon.vue";

export default {
  data() {
    return {
      newMessageCount: false,
      newMessages: [],
      state: [false, false],
      buttons: [
        {
          name: "notification",
          icon: "bell",
          isActive: false,
        },
      ],
    };
  },

  computed: {
    toggleState() {
      return this.buttons.some((i) => i.isActive == true) ? true : false;
    },
  },

  methods: {
    openFlyout(index) {
      this.buttons.forEach((i) => {
        if (i.name === this.buttons[index].name) {
          i.isActive = true;
        } else {
          i.isActive = false;
        }
      });
    },

    closeFlyout() {
      this.buttons.forEach((i) => {
        i.isActive = false;
      });
    },
  },

  components: {
    buttonIcon,
  },
};
</script>

<style scoped lang="scss">
.right__pane {
  @include flexItem(horizontal) {
    position: relative;
    background-color: $color-g-95;

    @include responsive(phone) {
      background-color: transparent;
      display: none;
    }
  }

  .pane__dock {
    @include flexItem(vertical) {
      order: 2;
      gap: $size-16;
      padding: $size-32 $size-16;
      border-left: 1px solid $color-g-85;
    }
  }

  .flyout__container {
    width: 0;
    opacity: 0;
    z-index: -10;

    transition: all 0.4s cubic-bezier(0.19, 0.68, 0.52, 0.96);

    @include responsive(small-laptop) {
      position: absolute;
      right: 0;
      width: 32rem;
      height: 100%;
    }

    &.open {
      opacity: 1;
      width: 32rem;
      z-index: 0;

      @include responsive(small-laptop) {
        right: 100%;
        background-color: $color-g-95;
        box-shadow: -$size-8 $size-0 $size-16 rgba($color-black, 0.15);
      }
    }
  }

  .flyout {
    height: 100%;
  }
}
</style>
