<template>
  <AppleHealth />
  <SamsungHealth />
  <GoogleHealth />
</template>

<script>
import { defineComponent } from "vue";
import AppleHealth from "./AppleHealth.vue";
import SamsungHealth from "./SamsungHealth.vue";
import GoogleHealth from "./GoogleHealth.vue";

export default defineComponent({
  name: "Integrations",
  components: { AppleHealth, SamsungHealth, GoogleHealth },
  setup: () => {
    return {};
  },
});
</script>

<style lang="scss" scoped></style>
