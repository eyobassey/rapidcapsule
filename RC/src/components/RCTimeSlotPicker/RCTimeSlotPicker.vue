<template>
  <div class="timeslots-timepicker">
    <div class="timeslots-timepicker__slots">
      <span
        v-for="timeslot in timesInBetween"
        :key="timeslot"
        class="timeslots-timepicker__slot"
        :class="{ 'timeslots-timepicker__active': timeSelector === timeslot }"
        @click="timeSelector = timeslot">
        {{ new Date(timeslot).toLocaleString("en-US", {hour: "numeric", minute: "numeric", hour12: false}) }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";

const emit = defineEmits(['update:modelValue', 'selected']);

const props = defineProps({
  modelValue: { type: String, required: true, default: '' },
  startTime: { type: String, required: false, default: '09:00:00' },
  endTime: { type: String, required: false, default: '21:00:00' },
});

const timeSelector = ref('');
const timesInBetween = ref(useTimesInBetween(
  new Date(), props.startTime, props.endTime
));

watch(timeSelector, timeSelector => {
  emit('update:modelValue', timeSelector);
  emit('selected', timeSelector);
});

onMounted(() => timeSelector.value = props.modelValue);


function useTimesInBetween(date = new Date(), startTime, endTime) {
  const timesInBetween = [];

  const newDate = new Date(date);
  const startH = parseInt(startTime.split(":")[0]);
  const startM = parseInt(startTime.split(":")[1]);
  const endH = parseInt(endTime.split(":")[0]);
  const endM = parseInt(endTime.split(":")[1]);

  if (startM == 30) startH++;

  for (let i = startH; i < endH; i++) {
    timesInBetween.push(i < 10 ? "0" + i + ":00" : i + ":00");
    timesInBetween.push(i < 10 ? "0" + i + ":30" : i + ":30");
  }

  timesInBetween.push(endH + ":00");
  if (endM == 30) timesInBetween.push(endH + ":30")

  timesInBetween.map((timeString) => {
    let H = +timeString.substr(0, 2);
    let h = (H % 12) || 12;
    let ampm = H < 12 ? " AM" : " PM";
    return timeString = h + timeString.substr(2, 3) + ampm;
  });

  return timesInBetween.map(time => new Date(Date.UTC(
      newDate.getFullYear(),
      newDate.getMonth(),
      newDate.getDate(),
      parseInt(time.split(":")[0]), parseInt(time.split(":")[1])
  )));
}
</script>

<style scoped lang="scss">
.timeslots-timepicker {
  overflow-x: scroll;
  padding-bottom: $size-16;

  @include scrollBar(normal);

  .timeslots-timepicker__slots {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: $size-10;
    width: 100%;

    @include responsive(tab-portrait) {
      grid-template-columns: repeat(4, 1fr);
    }

    .timeslots-timepicker__slot {
      border: $size-1 solid $color-sec-s2;
      color: $color-sec-s2;
      border-radius: $size-8;
      padding: $size-7 $size-14;
      font-weight: $fw-semi-bold;
      font-size: $size-14;
      cursor: pointer;

      &:hover {
        color: $color-white !important;
        background: $color-sec-s2 !important;
      }
    }
    .timeslots-timepicker__active {
      color: $color-white !important;
      background: $color-sec-s2;
    }
  }
}
</style>
