<template>
  <div :class="['avatar', `avatar-${size}`, { 'avatar-borderless': borderless }]">
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      style="display: none"
      @change="handleFileUpload"
    />
    <img v-if="photoSrc" :src="photoSrc" :alt="altText" @click="openFileInput" />
    <div v-else-if="hasInitials" :class="['initials', `initials-${size}`]">
      {{ generateInitials() }}
    </div>
    <div v-else class="initials">N/A</div>
    <button v-if="uploadEnabled" class="upload-button" @click="openFileInput">
      <v-icon name="md-addcircle-round" class="upload-icon" />
    </button>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue';

const fileInputRef = ref(null);
const uploadedPhoto = ref(null);

const props = defineProps({
  modelValue: {
    type: String,
    default: null
  },
  altText: {
    type: String,
    default: 'Avatar'
  },
  firstName: {
    type: String,
    default: null
  },
  lastName: {
    type: String,
    default: null
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value)
  },
  uploadEnabled: {
    type: Boolean,
    default: false
  },
  borderless: {
    type: Boolean,
    default: false
  }
});

const emits = defineEmits(['update:modelValue', 'image-uploaded']);

const hasInitials = computed(() => {
  return (
    props.firstName !== null &&
    props.firstName.trim().length > 0 &&
    props.lastName !== null &&
    props.lastName.trim().length > 0
  );
});

const photoSrc = computed(() => {
  const src = uploadedPhoto.value || props.modelValue;
  if (!src) return null;
  // Only use as img src if it's a valid URL or data URI
  if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }
  return null;
});

function generateInitials() {
  const firstInitial = props.firstName.charAt(0).toUpperCase();
  const lastInitial = props.lastName.charAt(0).toUpperCase();
  return `${firstInitial}${lastInitial}`;
}

function openFileInput() {
  if (!props.uploadEnabled) return;
  fileInputRef.value.click();
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const base64Image = reader.result;
    uploadedPhoto.value = base64Image;
    emits('update:modelValue', base64Image);
    emits('image-uploaded', base64Image);
  };
  reader.readAsDataURL(file);
}
</script>

<style lang="scss" scoped>
.avatar {
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  padding: 4px;
  border: 1px solid $color-pri-t1;

  &-borderless {
    border: none;
    padding: 0;
  }

  &-xs {
    width: 2rem;
    height: 2rem;
    padding: 0;
  }

  &-sm {
    width: 2.5rem;
    height: 2.5rem;
  }

  &-md {
    width: 5rem;
    height: 5rem;
  }

  &-lg {
    width: 6rem;
    height: 6rem;
  }

  &-xl {
    width: 8rem;
    height: 8rem;
  }



  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }

  .initials {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background-color: $color-pri-t1;
    color: $color-white;
    text-transform: uppercase;
    border-radius: 50%;
    font-weight: semibold;

    &.initials-xs {
      background-color: $color-pri-t1;
      font-size: 10px;
    }

    &.initials-sm {
      background-color: $color-pri-t1;
      font-size: 12px;
    }

    &.initials-md {
      background-color: $color-pri-t1;
      font-size: 16px;
    }

    &.initials-lg {
      background-color: $color-pri-t1;
      font-size: 18px;
    }

    &.initials-xl {
      background-color: $color-pri-t1;
      font-size: 24px;
    }
  }

  .upload-button {
    position: absolute;
    bottom: 0;
    right: 0;
    background-color: transparent;
    border: none;
    color: #999;
    font-size: 18px;
    cursor: pointer;
    padding: 4px;
    transition: color 0.2s;

    &:hover {
      color: #333;
    }
  }

  @media (max-width: 768px) {
    &-xs {
      width: 1.75rem;
      height: 1.75rem;
    }

    &-sm {
      width: 2.25rem;
      height: 2.25rem;
    }

    &-md {
      width: 4rem;
      height: 4rem;
    }

    &-lg {
      width: 5rem;
      height: 5rem;
    }

    &-xl {
      width: 6rem;
      height: 6rem;
    }
  }
}
</style>
a