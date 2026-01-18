<template>
  <div class="container__wrapper">
    <header class="container__header">
      <h5>Doctor’s Information</h5>
    </header>
    <section
      class="container__content"
      v-if="detail.data && detail.data.type === sources.INTERNAL && detail.data.prescribed_by"
    >
      <div class="container__content__image" v-if="detail.data.prescribed_by?.profile?.profile_photo">
        <img
          lazy
          :src="detail.data.prescribed_by.profile.profile_photo"
          alt="img-placeholder"
        />
      </div>
      <div>
        <div>
          <div class="container__content__hero">
            <h4>
              {{ detail.data.prescribed_by?.profile?.first_name || '' }}
              {{ detail.data.prescribed_by?.profile?.last_name || '' }}
            </h4>
            <p v-if="detail.data.prescribed_by?.average_rating">
              {{ detail.data.prescribed_by.average_rating }}
              <span><Icons name="star" /></span>
            </p>
          </div>
          <p class="container__content__grey-text" v-if="detail.data.prescribed_by?.profile?.professional_practice?.area_of_specialty">
            {{
              detail.data.prescribed_by.profile.professional_practice
                .area_of_specialty
            }}
          </p>
          <p class="container__content__grey-text" v-if="detail.data.prescribed_by?.profile?.professional_practice?.years_of_practice">
            {{
              detail.data.prescribed_by.profile.professional_practice
                .years_of_practice
            }}
            experience
          </p>

          <section class="container__content__moreInfo" v-if="doctorsMoreInformation">
            <div
              class="container__content__moreInfo__flexWrapper"
              v-for="({ text, value }, index) in doctorsMoreInformation"
              :key="index"
            >
              <p class="container__content__grey-text">{{ text }}</p>
              <p class="container__content__dark-text">{{ value }}</p>
            </div>
          </section>
        </div>
      </div>
    </section>
    <section
      v-else-if="detail.data && detail.data.type === sources.EXTERNAL"
      class="container__content"
    >
      <div class="container__content__hero">
        <h4>{{ detail.data.specialist || 'Unknown Specialist' }}</h4>
      </div>
    </section>
  </div>
</template>

<script>
import { defineComponent, watch, ref } from "vue";
import Icons from "@/components/icons.vue";
import { SOURCES } from "../../constants";

export default defineComponent({
  name: "DoctorsInformation",
  components: { Icons },
  props: {
    detail: {
      type: Object,
      required: true,
    },
  },
  setup: (props) => {
    const doctorsMoreInformation = ref();
    const sources = ref(SOURCES);

    const updateDoctorInfo = (detailData) => {
      if (detailData && detailData.data && detailData.data.type === sources.value.INTERNAL) {
        try {
          const prescribedBy = detailData.data.prescribed_by;
          if (prescribedBy && prescribedBy.profile) {
            const contact = prescribedBy.profile.contact || {};
            const phone = contact.phone || {};
            const professionalPractice = prescribedBy.profile.professional_practice || {};

            doctorsMoreInformation.value = [
              { text: "License No.", value: professionalPractice.license_number || 'N/A' },
              { text: "Email:", value: contact.email || 'N/A' },
              { text: "Phone:", value: `${phone.country_code || ''}${phone.number || ''}` || 'N/A' },
              { text: "Address:", value: contact.address1 || 'N/A' },
            ];
          }
        } catch (error) {
          console.error('Error parsing doctor info:', error);
        }
      }
    };

    // Watch for changes with deep and immediate options
    watch(
      () => props.detail,
      (value) => {
        updateDoctorInfo(value);
      },
      { deep: true, immediate: true }
    );

    return { doctorsMoreInformation, sources };
  },
});
</script>

<style scoped lang="scss">
.container {
  &__wrapper {
    margin-top: $size-12;
  }

  &__header {
    border-bottom: 1px solid #d9d9d9;

    h5 {
      color: $color-g-44;
      font-weight: $fw-regular;
      font-size: $size-16;
    }
  }

  &__content {
    margin-top: $size-40;

    @include flexItem(horizontal) {
      gap: $size-28;
    }

    &__image {
      img {
        height: 60px;
        width: 60px;
        border-radius: 50%;
      }
      @include responsive(phone) {
        display: none;
      }
    }

    &__hero {
      margin-bottom: $size-4;

      @include flexItem(horizontal) {
        gap: $size-24;
      }

      h4 {
        font-size: $size-18;
        font-weight: $fw-semi-bold;
      }

      p {
        color: $color-g-44;
        size: $size-18;
        @include flexItem(horizontal) {
          align-items: center;
          gap: $size-5;
        }
      }
    }

    &__grey-text {
      color: $color-g-44;
      font-size: $size-16;
      letter-spacing: 0.02em;
      margin-bottom: $size-4;

      @include responsive(phone) {
        font-size: $size-14;
      }
    }

    &__dark-text {
      color: $color-black;
      font-size: $size-16;
      letter-spacing: 0.02em;
      margin-bottom: $size-4;

      @include responsive(phone) {
        font-size: $size-14;
      }
    }

    &__moreInfo {
      margin-top: $size-28;

      &__flexWrapper {
        @include flexItem(horizontal) {
          gap: $size-12;
        }
      }
    }
  }
}
</style>
