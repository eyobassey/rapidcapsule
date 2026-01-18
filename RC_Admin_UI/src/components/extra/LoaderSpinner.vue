<script setup>
const props = defineProps({
  size: {
    type: Number,
    required: false,
    default: 60,
  },
  primaryColor: {
    type: String,
    required: false,
    default: '#F16439',
  },
  secondaryColor: {
    type: String,
    required: false,
    default: '#F16439 ',
  },
})
</script>

<template>
  <div
    class="spring-spinner"
    :style="`width: ${props.size}px; height: ${props.size}px;`"
  >
    <div
      class="spring-spinner-part top"
      :style="`width: ${props.size}px; height: calc(${props.size}px / 2);`"
    >
      <div
        class="spring-spinner-rotator"
        :style="`width: ${props.size}px; height: ${props.size}px; border: calc(${props.size}px / 7) solid transparent; border-right-color: ${props.secondaryColor}; border-top-color: ${props.primaryColor}  `"
      />
    </div>
    <div
      class="spring-spinner-part bottom"
      :style="`width: ${props.size}px; height: calc(${props.size}px / 2);`"
    >
      <div
        class="spring-spinner-rotator"
        :style="`width: ${props.size}px; height: ${props.size}px; border: calc(${props.size}px / 7) solid transparent; border-right-color: ${props.secondaryColor}; border-top-color: ${props.primaryColor}`"
      />
    </div>
  </div>
</template>

<style lang="scss">
.spring-spinner, .spring-spinner * {
  box-sizing: border-box;
}

.spring-spinner .spring-spinner-part {
  overflow: hidden;
//  height: calc(30px / 2); 
//   width: 30px; 
}

.spring-spinner  .spring-spinner-part.bottom {
   transform: rotate(180deg) scale(-1, 1);
 }

.spring-spinner .spring-spinner-rotator {
  // width: 30px;
  // height: 30px;
  // border: calc(30px / 7) solid transparent;
  // border-right-color: #008C99 !important;
  // border-top-color: #F16439 !important;
  border-radius: 50%;
  box-sizing: border-box;
  animation: spring-spinner-animation 3s ease-in-out infinite;
  transform: rotate(-200deg);
}

@keyframes spring-spinner-animation {
  0% {
    border-width: calc(60px / 7);
  }
  25% {
    border-width: calc(60px / 23.33);
  }
  50% {
    transform: rotate(115deg);
    border-width: calc(60px / 7);
  }
  75% {
    border-width: calc(60px / 23.33);
  }
  100% {
    border-width: calc(60px / 7);
  }
}
</style>
