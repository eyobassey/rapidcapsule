<template>
  <div class="eka-avatar-panel">
    <div class="eka-avatar-panel__header">
      <h3>Select Symptoms</h3>
      <p>Tap body parts to add symptoms, then continue below</p>
    </div>

    <div class="eka-avatar-panel__body" @click="onBodyPartClick">
      <component
        :is="avatarComponent"
        :age="String(session.patient_age || 25)"
        @selected-symptom="onSymptomSelected"
      />
    </div>

    <!-- Custom symptom picker (replaces the avatar's broken SearchDropDown) -->
    <div v-if="pickerOpen" class="eka-avatar-panel__picker">
      <div class="eka-avatar-panel__picker-header">
        <span>{{ pickerPart }}</span>
        <button @click="closePicker">
          <v-icon name="hi-x" scale="0.7" />
        </button>
      </div>
      <input
        v-model="pickerSearch"
        class="eka-avatar-panel__picker-search"
        placeholder="Filter symptoms..."
      />
      <div v-if="pickerLoading" class="eka-avatar-panel__picker-loading">
        Loading symptoms...
      </div>
      <div v-else class="eka-avatar-panel__picker-list">
        <div
          v-for="sym in filteredPickerSymptoms"
          :key="sym.id"
          class="eka-avatar-panel__picker-item"
          :class="{ selected: isSymptomSelected(sym.id) }"
          @click="selectFromPicker(sym)"
        >
          <span>{{ sym.label }}</span>
          <v-icon
            :name="isSymptomSelected(sym.id) ? 'hi-check' : 'hi-plus'"
            scale="0.7"
          />
        </div>
        <div v-if="!filteredPickerSymptoms.length && !pickerLoading" class="eka-avatar-panel__picker-empty">
          No symptoms found
        </div>
      </div>
    </div>

    <div class="eka-avatar-panel__footer">
      <div v-if="selectedSymptoms.length" class="eka-avatar-panel__selected">
        <h4>Selected ({{ selectedSymptoms.length }})</h4>
        <div
          v-for="(sym, idx) in selectedSymptoms"
          :key="idx"
          class="eka-avatar-panel__symptom"
        >
          <span>{{ sym.label || sym.common_name || sym.name }}</span>
          <button @click="removeSymptom(sym, idx)" title="Remove">
            <v-icon name="hi-x" scale="0.7" />
          </button>
        </div>
      </div>

      <button
        class="eka-avatar-panel__continue"
        :disabled="selectedSymptoms.length === 0"
        @click="onContinue"
      >
        <v-icon name="hi-arrow-right" scale="0.85" />
        Continue with checkup
      </button>
      <p class="eka-avatar-panel__hint">
        You can also describe symptoms in the chat
      </p>
    </div>
  </div>
</template>

<script>
import http from '@/services/http'
import FullBodyAvatarMale from '@/components/Health-checkup/full-body-avatar-male.vue'
import FullBodyAvatarFemale from '@/components/Health-checkup/full-body-avatar-female.vue'

export default {
  name: 'EkaBodyAvatar',
  components: { FullBodyAvatarMale, FullBodyAvatarFemale },
  emits: ['continue'],
  props: {
    session: { type: Object, required: true },
  },
  data() {
    return {
      selectedSymptoms: [],
      pickerOpen: false,
      pickerPart: '',
      pickerSymptoms: [],
      pickerLoading: false,
      pickerSearch: '',
    }
  },
  computed: {
    avatarComponent() {
      return this.session.patient_gender === 'female' ? 'FullBodyAvatarFemale' : 'FullBodyAvatarMale'
    },
    filteredPickerSymptoms() {
      const q = this.pickerSearch.trim().toLowerCase()
      if (!q) return this.pickerSymptoms
      return this.pickerSymptoms.filter((s) => s.label.toLowerCase().includes(q))
    },
  },
  methods: {
    isSymptomSelected(id) {
      return !!this.selectedSymptoms.find((s) => s.id === id)
    },

    onBodyPartClick(evt) {
      const partGroup = evt.target.closest('.part')
      if (!partGroup || !partGroup.id) return

      this.fetchSymptoms(partGroup.id)
    },

    async fetchSymptoms(partId) {
      this.pickerPart = partId
      this.pickerOpen = true
      this.pickerLoading = true
      this.pickerSearch = ''
      this.pickerSymptoms = []

      try {
        const sex = this.session.patient_gender === 'female' ? 'female' : 'male'
        const res = await http.get('/health-checkup/search', {
          params: {
            phrase: partId,
            age: this.session.patient_age || 25,
            sex,
          },
        })
        this.pickerSymptoms = res.data?.data || res.data?.result || []
      } catch (e) {
        console.error('Failed to search symptoms:', e)
        this.pickerSymptoms = []
      } finally {
        this.pickerLoading = false
      }
    },

    async selectFromPicker(symptom) {
      if (this.isSymptomSelected(symptom.id)) return
      await this.onSymptomSelected(symptom)
    },

    closePicker() {
      this.pickerOpen = false
      this.pickerSymptoms = []
      this.pickerSearch = ''
    },

    async onSymptomSelected(symptom) {
      if (!symptom || !symptom.id) return
      if (this.selectedSymptoms.find((s) => s.id === symptom.id)) return

      this.selectedSymptoms.push(symptom)

      try {
        await http.post(`/eka/checkup/${this.session.session_id}/symptoms`, {
          id: symptom.id,
          name: symptom.name || symptom.label,
          common_name: symptom.common_name || symptom.label,
        })
      } catch (e) {
        console.error('Failed to save avatar symptom:', e)
      }
    },

    async removeSymptom(symptom, idx) {
      this.selectedSymptoms.splice(idx, 1)

      try {
        await http.delete(`/eka/checkup/${this.session.session_id}/symptoms/${symptom.id}`)
      } catch (e) {
        console.error('Failed to remove avatar symptom:', e)
      }
    },

    onContinue() {
      const names = this.selectedSymptoms.map((s) => s.label || s.common_name || s.name)
      this.$emit('continue', names)
    },
  },
}
</script>

<style scoped lang="scss">
.eka-avatar-panel {
  display: flex;
  flex-direction: column;
  height: 100%;

  &__header {
    padding: 16px;
    border-bottom: 1px solid #e5e7eb;
    text-align: center;
    flex-shrink: 0;

    h3 {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
      color: #1f2937;
    }
    p {
      margin: 4px 0 0;
      font-size: 12px;
      color: #9ca3af;
    }
  }

  &__body {
    flex: 1;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 8px;
    overflow-y: auto;
    min-height: 0;

    :deep(.body-avatar) {
      max-width: 100%;
      padding: 8px;
    }

    // Hide the avatar's built-in SearchDropDown (broken in narrow panel)
    :deep(.drop-down__container) {
      display: none !important;
    }
  }

  // Custom symptom picker
  &__picker {
    border-top: 1px solid #e5e7eb;
    flex-shrink: 0;
    max-height: 220px;
    display: flex;
    flex-direction: column;
  }

  &__picker-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: #f0f9ff;
    border-bottom: 1px solid #e5e7eb;
    text-transform: capitalize;
    font-size: 13px;
    font-weight: 600;
    color: #01579B;

    button {
      background: none;
      border: none;
      color: #6b7280;
      cursor: pointer;
      padding: 2px;
      border-radius: 4px;

      &:hover {
        color: #374151;
        background: #e5e7eb;
      }
    }
  }

  &__picker-search {
    border: none;
    border-bottom: 1px solid #e5e7eb;
    padding: 8px 12px;
    font-size: 13px;
    outline: none;
    background: #fafafa;

    &::placeholder {
      color: #9ca3af;
    }
  }

  &__picker-loading {
    padding: 16px;
    text-align: center;
    font-size: 13px;
    color: #9ca3af;
  }

  &__picker-list {
    overflow-y: auto;
    flex: 1;
  }

  &__picker-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    font-size: 13px;
    color: #374151;
    cursor: pointer;
    border-bottom: 1px solid #f3f4f6;
    transition: background 0.1s;

    .ov-icon {
      color: #9ca3af;
      fill: #9ca3af;
      flex-shrink: 0;
    }

    &:hover {
      background: #f0f9ff;
    }

    &.selected {
      background: #ecfdf5;
      color: #065f46;

      .ov-icon {
        color: #10b981;
        fill: #10b981;
      }
    }
  }

  &__picker-empty {
    padding: 16px;
    text-align: center;
    font-size: 13px;
    color: #9ca3af;
  }

  &__footer {
    border-top: 1px solid #e5e7eb;
    padding: 12px 16px;
    flex-shrink: 0;
  }

  &__selected {
    max-height: 140px;
    overflow-y: auto;
    margin-bottom: 12px;

    h4 {
      margin: 0 0 8px;
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
  }

  &__symptom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 10px;
    margin-bottom: 4px;
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 8px;
    font-size: 13px;
    color: #0c4a6e;

    button {
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 2px;
      border-radius: 4px;

      &:hover {
        color: #ef4444;
        background: #fef2f2;
      }
    }
  }

  &__continue {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 12px;
    border: none;
    border-radius: 10px;
    background: #01579B;
    color: white;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    .ov-icon {
      color: white;
      fill: white;
    }

    &:hover:not(:disabled) {
      background: #014377;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(1, 87, 155, 0.3);
    }

    &:disabled {
      background: #d1d5db;
      color: #9ca3af;
      cursor: not-allowed;

      .ov-icon {
        color: #9ca3af;
        fill: #9ca3af;
      }
    }
  }

  &__hint {
    text-align: center;
    font-size: 11px;
    color: #9ca3af;
    margin: 8px 0 0;
  }
}
</style>
