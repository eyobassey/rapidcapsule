<template>
  <div class="page-content">
    <TopBar
      type="title-only"
      title="Settings"
      @open-side-nav="$emit('openSideNav')"
    />
    <div class="page-content__body">
      <TabNav
        :tabItems="tabList"
        :selected="selectedTab"
        @selected="setSelectedTab"
      />

      <div v-if="selectedTab === settingsTabs.NOTIFICATIONS">Notifications</div>
      <Integrations v-if="selectedTab === settingsTabs.INTEGRATIONS" />

      <div v-if="selectedTab === settingsTabs.AUDIOANDVIDEO">Audio</div>
    </div>
  </div>
</template>

<script>
import { ref, defineComponent } from "vue";
import TopBar from "@/components/Navigation/top-bar.vue";
import TabNav from "@/components/tab-components/tab-navigation.vue";
import Integrations from "./Integrations";

import { SETTINGS_TABS } from "./constants";

export default defineComponent({
  name: "App Settings",

  emits: ["openSideNav"],

  components: {
    TopBar,
    TabNav,
    Integrations,
  },

  setup: () => {
    const settingsTabs = ref(SETTINGS_TABS);
    const tabList = ref([...Object.values(SETTINGS_TABS)]);
    const selectedTab = ref("Integrations");

    const setSelectedTab = (tabOption) => (selectedTab.value = tabOption);

    return {
      tabList,
      selectedTab,
      setSelectedTab,
      settingsTabs,
    };
  },
});
</script>

<style scoped lang="scss">
.page-content {
  @include flexItem(vertical) {
    gap: $size-12;
    width: 100%;
    height: 100vh;
  }

  &__body {
    @include flexItem(vertical) {
      width: 100%;
      height: 100%;
      overflow-y: scroll;
      padding: $size-0 $size-48;
      margin-top: $size-28;
    }

    &::-webkit-scrollbar {
      display: none;
      width: $size-12;
      background-color: $color-g-92;
    }
  }
}
</style>
