<template>
  <div>
    <PrescriptionHeader
      :activeTab="activeTab"
      @onClickTab="(tab) => (activeTab = tab)"
      @uploadPrescription="$emit('uploadPrescription')"
    />

    <PrescriptionList
      :data="list"
      v-for="(list, index) in filteredList"
      :key="index"
    />
  </div>
</template>

<script>
import { defineComponent, ref, computed } from "vue";
import { useRoute } from "vue-router";
import PrescriptionHeader from "./Header.vue";
import PrescriptionList from "./PrescriptionList.vue";
import { mapGetters as useMapGetters } from "@/utilities/utilityStore";
import { LOCATION_QUERY_KEY } from "@/utilities/constants";
import { PRESCRIPTION_TABS, SOURCES } from "../../constants";

export default defineComponent({
  name: "PrescriptionLayout",
  emits: ["uploadPrescription"],
  components: { PrescriptionHeader, PrescriptionList },
  setup: () => {
    const route = useRoute();
    const { "prescriptions/getPrescriptions": prescriptions } = useMapGetters();

    const currentTab = ref(route.query[LOCATION_QUERY_KEY]);
    const activeTab = ref(currentTab.value || PRESCRIPTION_TABS.ALL);

    const filteredList = computed(() => {
      let returnedFilter = [];

      if (activeTab.value === PRESCRIPTION_TABS.ALL) {
        returnedFilter = prescriptions.value;
      }

      if (activeTab.value === PRESCRIPTION_TABS.INTERNAL) {
        returnedFilter = prescriptions.value.filter(
          ({ type }) => type === SOURCES.INTERNAL
        );
      }

      if (activeTab.value === PRESCRIPTION_TABS.EXTERNAL) {
        returnedFilter = prescriptions.value.filter(
          ({ type }) => type === SOURCES.EXTERNAL
        );
      }

      return returnedFilter;
    });

    return {
      activeTab,
      currentTab,
      filteredList,
    };
  },
});
</script>
