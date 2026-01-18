<template>
  <div class="bar-container">
    <div class="menu" @click="$emit('openSideNav')">
      <Icons name="burger-menu" id="menu" />
    </div>
    <div class="left-col" v-if="type === 'avatar'">
      <div class="left-col__content">
        <avaterFixed
          size="small"
          class="clickable"
          @click="openAccount"
          :firstname="userBasicInfo.first_name"
          :lastname="userBasicInfo.last_name"
          :image="userBasicInfo.profile_photo"
        />
        <div class="text-content">
          <p class="welcome">Hello</p>
          <h2 class="user">
            {{ userBasicInfo.first_name }} {{ userBasicInfo.last_name }}
          </h2>
        </div>
      </div>
    </div>
    <div class="left-col" v-if="type === 'title-only'">
      <div class="text-content">
        <h2 class="page-title">{{ title }}</h2>
      </div>
    </div>
    <div class="left-col" v-if="type === 'breadCrumb' && crumbConfig.length">
      <BreadCrumb :crumbConfig="crumbConfig" />
    </div>
    <ContextMenuKebab
      class="contxt-menu"
      :dropList="menuItems"
      button-type="secondary"
      size="400%"
      @selection="handleAction"
    />
    <div v-if="showButtons" class="btn-group">
      <slot name="btns" />
      <RightPane class="right-pane" />
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import avaterFixed from "../Avatars/avatar-fixed.vue";
import SearchInput from "../inputs/search.vue";
import Icons from "../icons.vue";
import RightPane from "./Right-pane/pane-dock.vue";
import IconButton from "../buttons/button-icon.vue";
import ContextMenuKebab from "../utitlity/context-menu-kebab.vue";
import BreadCrumb from "./breadCrumb.vue";

export default {
  name: "Top Bar",

  emits: ["openSideNav"],

  components: {
    avaterFixed,
    SearchInput,
    Icons,
    RightPane,
    IconButton,
    ContextMenuKebab,
    BreadCrumb,
  },

  props: {
    type: {
      type: String,
      required: true,
    },

    title: {
      type: String,
      default: "Add Title",
    },
    showSearchBar: {
      type: Boolean,
      default: true,
    },
    showButtons: {
      type: Boolean,
      default: false,
    },
    crumbConfig: {
      type: Array,
    },
  },

  data() {
    return {
      searchString: "",
      menuItems: ["Reminder", "Notifications", "Search"],
    };
  },

  computed: {
    ...mapGetters({
      userProfile: "userprofile",
    }),

    userBasicInfo() {
      return this.userProfile.profile;
    },
  },

  methods: {
    openAccount() {
      this.$router.push({ name: "Account" });
    },

    handleAction(i) {
      if (i == 3) {
        localStorage.clear();
        sessionStorage.clear();
        window.location = "/logged-out";
      }
    },
  },

  watch: {
    title: {
      handler(value) {
        if (value === "Account") {
          this.menuItems.push("Logout");
        }
      },
      immediate: true,
    },
  },
};
</script>

<style scoped lang="scss">
.bar-container {
  @include flexItem(horizontal) {
    align-items: center;
    gap: $size-24;
    padding: $size-32 $size-48;
    width: 100%;

    @include responsive(small-laptop) {
      padding: $size-24 $size-48;
    }

    .menu,
    .right-pane {
      display: none;
    }
  }

  @include responsive(tab-landscape) {
    .menu {
      @include flexItem(horizontal) {
        justify-content: center;
        align-items: center;
        padding: $size-8;
        border-radius: $size-8;
        cursor: pointer;

        #menu {
          width: $size-32;
          height: $size-32;
        }
      }

      &:hover {
        background-color: $color-g-92;
      }
    }
  }

  @include responsive(phone) {
    padding: $size-16 $size-16;
    gap: $size-16;
  }
}

.btn-group {
  @include flexItem(horizontal) {
    gap: $size-16;
    justify-content: flex-end;
    align-items: center;
    padding-right: $size-12;

    @include responsive(phone) {
      display: none;
    }
  }
}

.contxt-menu {
  display: none;

  @include responsive(phone) {
    display: block;
  }
}

#search {
  display: none;

  @include responsive(tab-portrait) {
    display: block;
  }
}

#search-bar {
  @include responsive(tab-portrait) {
    display: none;
  }
}
.left-col {
  flex-grow: 1;

  &__content {
    @include flexItem(horizontal) {
      flex-grow: 0;
      flex-basis: 0;
      align-items: center;
      gap: $size-16;
    }

    .text-content {
      .welcome {
        font-size: $size-16;
        font-weight: $fw-regular;
        color: $color-g-44;

        @include responsive(phone) {
          font-size: $size-12;
        }
      }

      .user {
        font-size: $size-24;
        font-weight: $fw-semi-bold;

        @include responsive(phone) {
          font-size: $size-16;
        }
      }
    }
  }

  .page-title {
    font-size: $size-26;
    font-weight: $fw-bold;

    @include responsive(phone) {
      font-size: $size-18;
    }
  }
}
</style>
