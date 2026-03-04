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
        :external-search="true"
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
    trialToken: { type: String, default: '' },
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
        const age = this.session.patient_age || 25

        if (this.trialToken) {
          const params = new URLSearchParams({ phrase: partId, age: String(age), sex })
          const resp = await fetch(`/api/trial/symptom-checker/search?${params}`, {
            headers: { 'x-trial-token': this.trialToken },
          })
          const json = await resp.json()
          this.pickerSymptoms = json?.data || json?.result || []
        } else {
          const res = await http.get('/health-checkup/search', {
            params: { phrase: partId, age, sex },
          })
          this.pickerSymptoms = res.data?.data || res.data?.result || []
        }
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

      if (!this.trialToken) {
        try {
          await http.post(`/eka/checkup/${this.session.session_id}/symptoms`, {
            id: symptom.id,
            name: symptom.name || symptom.label,
            common_name: symptom.common_name || symptom.label,
          })
        } catch (e) {
          console.error('Failed to save avatar symptom:', e)
        }
      }
    },

    async removeSymptom(symptom, idx) {
      this.selectedSymptoms.splice(idx, 1)

      if (!this.trialToken) {
        try {
          await http.delete(`/eka/checkup/${this.session.session_id}/symptoms/${symptom.id}`)
        } catch (e) {
          console.error('Failed to remove avatar symptom:', e)
        }
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
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    text-align: center;
    flex-shrink: 0;

    h3 {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
      color: #f8fafc;
    }
    p {
      margin: 4px 0 0;
      font-size: 12px;
      color: #64748b;
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

      // Rotate button — make visible on dark background
      .rotate-btn {
        color: #f8fafc !important;
        background: rgba(15, 23, 42, 0.6) !important;
        border: 1px solid rgba(255, 255, 255, 0.15) !important;
        backdrop-filter: blur(8px);

        &:hover {
          background: rgba(14, 165, 233, 0.2) !important;
          border-color: rgba(14, 165, 233, 0.4) !important;
        }

        * { color: #f8fafc !important; }
        // Custom Icons component uses <svg class="icons"> with #icon-left ID
        #icon-left, #icon-right, .icons {
          fill: #f8fafc !important;
        }
        svg path { fill: #f8fafc !important; }
      }
    }

    // Override SVG body part styles for dark theme
    :deep(.body-avatar__front),
    :deep(.body-avatar__back) {
      .body__parts {
        // Remove hard-light blend which makes teal invisible on dark bg
        mix-blend-mode: screen !important;

        .part {
          // Make body parts visible by default as subtle outlines
          opacity: 0.35 !important;

          & > * {
            fill: rgba(14, 165, 233, 0.15) !important;
            stroke: rgba(14, 165, 233, 0.5) !important;
            stroke-width: 1px !important;
            transition: all 0.2s ease;
          }

          &:hover {
            opacity: 1 !important;
            & > * {
              fill: rgba(14, 165, 233, 0.3) !important;
              stroke: #0ea5e9 !important;
              stroke-width: 1.5px !important;
            }
          }

          &.active {
            opacity: 1 !important;
            & > * {
              fill: rgba(14, 165, 233, 0.35) !important;
              stroke: #38bdf8 !important;
              stroke-width: 2px !important;
            }
          }
        }
      }
    }

    // Hide the avatar's built-in SearchDropDown (broken in narrow panel)
    :deep(.drop-down__container) {
      display: none !important;
    }
  }

  // Custom symptom picker
  &__picker {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
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
    background: rgba(14, 165, 233, 0.1);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    text-transform: capitalize;
    font-size: 13px;
    font-weight: 600;
    color: #0ea5e9;

    span { color: #0ea5e9; }

    button {
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      padding: 2px;
      border-radius: 4px;

      .ov-icon { color: #64748b; fill: #64748b; stroke: #64748b; }

      &:hover {
        color: #f8fafc;
        background: rgba(255, 255, 255, 0.1);

        .ov-icon { color: #f8fafc; fill: #f8fafc; stroke: #f8fafc; }
      }
    }
  }

  &__picker-search {
    border: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding: 8px 12px;
    font-size: 13px;
    outline: none;
    background: rgba(15, 23, 42, 0.6);
    color: #f8fafc;

    &::placeholder {
      color: #64748b;
    }
  }

  &__picker-loading {
    padding: 16px;
    text-align: center;
    font-size: 13px;
    color: #64748b;
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
    color: #f8fafc;
    cursor: pointer;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    transition: background 0.1s;

    span { color: #f8fafc; }

    .ov-icon {
      color: #64748b;
      fill: #64748b;
      stroke: #64748b;
      flex-shrink: 0;
    }

    &:hover {
      background: rgba(14, 165, 233, 0.1);
    }

    &.selected {
      background: rgba(16, 185, 129, 0.1);
      color: #6ee7b7;

      span { color: #6ee7b7; }

      .ov-icon {
        color: #10b981;
        fill: #10b981;
        stroke: #10b981;
      }
    }
  }

  &__picker-empty {
    padding: 16px;
    text-align: center;
    font-size: 13px;
    color: #64748b;
  }

  &__footer {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
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
      color: #64748b;
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
    background: rgba(14, 165, 233, 0.1);
    border: 1px solid rgba(14, 165, 233, 0.3);
    border-radius: 8px;
    font-size: 13px;
    color: #7dd3fc;

    span { color: #7dd3fc; }

    button {
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      padding: 2px;
      border-radius: 4px;

      &:hover {
        color: #ef4444;
        background: rgba(239, 68, 68, 0.1);
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
    background: #FF5C00;
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
      background: #E04F00;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(255, 92, 0, 0.3);
    }

    &:disabled {
      background: rgba(255, 255, 255, 0.1);
      color: #64748b;
      cursor: not-allowed;

      .ov-icon {
        color: #64748b;
        fill: #64748b;
      }
    }
  }

  &__hint {
    text-align: center;
    font-size: 11px;
    color: #64748b;
    margin: 8px 0 0;
  }
}
</style>
