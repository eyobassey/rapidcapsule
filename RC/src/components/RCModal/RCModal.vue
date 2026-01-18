<template>
  <transition name="fade" appear>
    <div class="modal__overlay fixed" v-if="showModal">
      <transition name="slide" appear>
        <div class="modal__box" v-show="showModal">
          <slot />
        </div>
      </transition>
    </div>
  </transition>
</template>

<script>
export default {
  name: "cloudenly-modal",
  props: {
    modal: {
      required: true,
      type: Boolean,
      default: true,
    },
  },
  computed: {
    showModal: {
      get() {
        return this.modal;
      },
      set(val) {
        this.$emit("modal", val);
      },
    },
  },
};
</script>

<style scoped lang="scss">
.modal__overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99999;
  background-color: rgba(0, 0, 0, 0.3);
  height: 100vh;
  width: 100vw;
}
.modal__box {
  position: absolute;
  background-color: white;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000000;
  /* width: 100%;
  max-width: 400px; */
  padding: 25px;
  border-radius: 3px;
}
.fade-enter-active,
.fade-leave-active {
  transition: 0.5s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.5s;
}
.slide-enter,
.slide-leave-to {
  transform: translate(100%, -50%);
}
</style>
