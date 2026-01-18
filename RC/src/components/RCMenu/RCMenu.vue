<!-- TODO: Refactor menu code and optimize -->
<template>
  <div class="menu-container">
    <button ref="menu" @click="openClose" :aria-label="label" class="menu-button" />
    <slot name="button" />
    <!-- title can either be an icon or a text -->
    <div v-if="isOpen" class="dropdownMenu" :style="containerStyle">
      <p v-if="hasTitleSlot" class="menu-title">
        <slot name="title" />
      </p>
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  props: {
    right: {
      type: Boolean,
      default: false,
    },
    moveTop: {
      type: Boolean,
      default: false,
    },
    left: {
      type: Boolean,
      default: false,
    },
    bottomLeft: {
      type: Boolean,
      default: false,
    },
    top: {
      type: String,
      default: "-60",
    },
    margin: {
      type: String,
      default: "20",
    },
    hasBorder: {
      type: Boolean,
      default: false,
    },
    label: {
      type: String,
      default: "button",
    },
  },
  data() {
    return {
      isOpen: false,
    };
  },
  methods: {
    openClose() {
      const closeListerner = (e) => {
        if (this.catchOutsideClick(e, this.$refs.menu)) {
          // eslint-disable-next-line no-unused-expressions
          window.removeEventListener("click", closeListerner);
          this.isOpen = false;
        }
      };

      window.addEventListener("click", closeListerner);
      this.isOpen = !this.isOpen;
    },
    catchOutsideClick(event, dropdown) {
      // When user clicks menu — do nothing
      if (dropdown === event.target) return false;

      // When user clicks outside of the menu — close the menu
      if (this.isOpen && dropdown !== event.target) return true;
      return false;
    },
  },
  computed: {
    hasTitleSlot() {
      return !!this.$slots.title;
    },

    containerStyle() {
      if (this.bottomLeft) {
        return "right: 0; top:60%;";
      }
      if (this.left) {
        return `right: 0; top:${this.top}%; margin-right:${this.margin}px`;
      }
      if (this.right) {
        return `left: 0; top:${this.top}%; margin-left: ${this.margin}px`;
      }
      if (this.moveTop) {
        return `right: 0; bottom:187%;`;
      }
      return "left: 0; top:60%;";
    },
  },
};
</script>

<style lang="scss" scoped>
.menu-container {
  position: relative;
  border-radius: 5px;
  background: inherit;
}
* {
  box-sizing: border-box;
}

.menu-button {
  border: none;
  font-size: inherit;
  background: none;
  outline: none;
  border-radius: 4px;
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  margin: 0;
  line-height: 1;
  width: 100%;
  height: 100%;
  cursor: pointer;
}
.dropDownMenuButton:focus {
  outline: none;
}

.dropdownMenu {
  position: absolute;
  border-radius: 5px;
  z-index: 0;
  background: #ffffff;
  box-shadow: 0px 1px 2px rgba(45, 49, 66, 0.06), 0px 1px 3px rgba(8, 7, 8, 0.1);
  animation: menu 0.3s ease forwards;
}

.menu-title {
  font-size: 0.75rem /* 12px */;
  line-height: 1rem /* 16px */;
  font-weight: 600;
  padding-top: 0.75rem /* 12px */;
  margin-left: 0.5rem /* 8px */;
  margin-right: 0.5rem /* 8px */;
  border-bottom: 0.5px solid rgb(135, 142, 153, 0.5);
}

@keyframes menu {
  from {
    transform: translate3d(0, 30px, 0);
  }
  to {
    transform: translate3d(0, 20px, 0);
  }
}
</style>
