<template>
  <div class="page-content">
    <TopBar showButtons type="avatar" @open-side-nav="$emit('openSideNav')" />
    <div class="page-content__body">
      <div class="container-root">
        <div class="clinical-notes-container">
          <!-- Header -->
          <div class="clinical-notes-header">
            <div class="clinical-notes-header__title">
              <h1 class="heading-h1">Clinical Notes</h1>
              <p class="text-body">View and manage your clinical notes from appointments</p>
            </div>
          </div>

          <!-- Search and Filter -->
          <div class="clinical-notes-filters">
            <div class="search-box">
              <rc-icon icon-name="search" size="sm" />
              <input-box
                v-model="searchQuery"
                placeholder="Search notes by content or patient name..."
                class="search-input"
              />
            </div>
            <rc-select
              label="label"
              placeholder="Filter by platform"
              :options="platformFilterOptions"
              v-model="platformFilter"
              :reduce="item => item.value"
              class="platform-filter"
            >
              <template v-slot:selected-option="{ option }">
                <div class="filter-selected">
                  {{ option.label }}
                </div>
              </template>
            </rc-select>
          </div>

          <!-- Loading State -->
          <loader v-if="isLoading" :useOverlay="false" />

          <!-- Notes List -->
          <div v-else-if="filteredNotes.length > 0" class="notes-list">
            <div
              v-for="note in filteredNotes"
              :key="note.note_id"
              class="note-card"
              @click="openNoteDetails(note)"
            >
              <div class="note-card__header">
                <div class="note-card__info">
                  <h3 class="note-card__patient">
                    {{ note.patient_name }}
                  </h3>
                  <p class="note-card__date">
                    {{ formatDate(note.created_at) }}
                  </p>
                </div>
                <div class="note-card__badges">
                  <span
                    class="badge"
                    :class="note.platform === 'zoom' ? 'badge--primary' : 'badge--success'"
                  >
                    {{ note.platform === 'zoom' ? 'Zoom' : 'Custom' }}
                  </span>
                  <span
                    v-if="note.completed"
                    class="badge badge--completed"
                  >
                    Completed
                  </span>
                </div>
              </div>

              <div class="note-card__content">
                <p class="note-card__text">
                  {{ truncateText(note.content, 150) }}
                </p>
              </div>

              <div class="note-card__footer">
                <div class="note-card__meta">
                  <rc-icon icon-name="calendar" size="xs" />
                  <span>{{ note.meeting_channel }}</span>
                </div>
                <div class="note-card__meta">
                  <rc-icon icon-name="clock" size="xs" />
                  <span>{{ note.time_ago }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="empty-state">
            <rc-icon icon-name="document" size="xl" />
            <h3 class="empty-state__title">No clinical notes found</h3>
            <p class="empty-state__description">
              Clinical notes from your appointments will appear here
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Note Details Modal -->
    <NoteDetailsModal
      v-if="selectedNote"
      v-model="isModalOpen"
      :note="selectedNote"
      @updated="fetchClinicalNotes"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, inject } from 'vue';
import { useRouter } from 'vue-router';
import moment from 'moment';
import TopBar from '@/components/Navigation/top-bar';
import Loader from '@/components/Loader/main-loader';
import NoteDetailsModal from './note-details-modal.vue';

export default {
  name: 'ClinicalNotesDashboard',
  components: {
    TopBar,
    Loader,
    NoteDetailsModal
  },
  emits: ['openSideNav'],
  setup() {
    const router = useRouter();
    const $http = inject('$_HTTP');
    const isLoading = ref(false);
    const notes = ref([]);
    const searchQuery = ref('');
    const platformFilter = ref('all');
    const selectedNote = ref(null);
    const isModalOpen = ref(false);

    const platformFilterOptions = [
      { label: 'All Platforms', value: 'all' },
      { label: 'Zoom Notes', value: 'zoom' },
      { label: 'Custom Notes', value: 'custom' }
    ];

    // Fetch clinical notes
    const fetchClinicalNotes = async () => {
      isLoading.value = true;
      try {
        const response = await $http.$_getSpecialistClinicalNotes();
        if (response.data && response.data.data) {
          notes.value = response.data.data.map(note => ({
            ...note,
            time_ago: moment(note.created_at).fromNow()
          }));
        }
      } catch (error) {
        console.error('Error fetching clinical notes:', error);
      } finally {
        isLoading.value = false;
      }
    };

    // Filter notes based on search and platform filter
    const filteredNotes = computed(() => {
      let filtered = notes.value;

      // Platform filter
      if (platformFilter.value !== 'all') {
        filtered = filtered.filter(note => note.platform === platformFilter.value);
      }

      // Search filter
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        filtered = filtered.filter(note =>
          note.content.toLowerCase().includes(query) ||
          note.patient_name.toLowerCase().includes(query)
        );
      }

      return filtered;
    });

    // Format date
    const formatDate = (date) => {
      return moment(date).format('MMM DD, YYYY [at] h:mm A');
    };

    // Truncate text
    const truncateText = (text, maxLength) => {
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    };

    // Open note details modal
    const openNoteDetails = (note) => {
      selectedNote.value = note;
      isModalOpen.value = true;
    };

    onMounted(() => {
      fetchClinicalNotes();
    });

    return {
      isLoading,
      notes,
      searchQuery,
      platformFilter,
      platformFilterOptions,
      filteredNotes,
      selectedNote,
      isModalOpen,
      formatDate,
      truncateText,
      openNoteDetails,
      fetchClinicalNotes
    };
  }
};
</script>

<style scoped lang="scss">
.clinical-notes-container {
  padding: $size-24;
}

.clinical-notes-header {
  margin-bottom: $size-32;

  &__title {
    h1 {
      font-size: $size-32;
      font-weight: $fw-bold;
      color: $color-g-21;
      margin-bottom: $size-8;
    }

    p {
      font-size: $size-16;
      color: $color-g-44;
    }
  }
}

.clinical-notes-filters {
  display: flex;
  gap: $size-16;
  margin-bottom: $size-24;

  @media (max-width: 768px) {
    flex-direction: column;
  }

  .search-box {
    flex: 1;
    display: flex;
    align-items: center;
    gap: $size-12;
    padding: $size-12 $size-16;
    border: 1px solid $color-g-85;
    border-radius: $size-8;
    background: $color-white;

    .search-input {
      flex: 1;
      border: none;
    }
  }

  .platform-filter {
    min-width: 200px;

    @media (max-width: 768px) {
      width: 100%;
    }
  }
}

.notes-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: $size-20;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.note-card {
  background: $color-white;
  border: 1px solid $color-g-90;
  border-radius: $size-12;
  padding: $size-20;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: $color-pri-main;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: $size-12;
  }

  &__info {
    flex: 1;
  }

  &__patient {
    font-size: $size-18;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
    margin-bottom: $size-4;
  }

  &__date {
    font-size: $size-14;
    color: $color-g-54;
  }

  &__badges {
    display: flex;
    gap: $size-8;
  }

  &__content {
    margin-bottom: $size-16;
  }

  &__text {
    font-size: $size-14;
    line-height: 1.6;
    color: $color-g-36;
  }

  &__footer {
    display: flex;
    gap: $size-16;
    padding-top: $size-12;
    border-top: 1px solid $color-g-92;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: $size-6;
    font-size: $size-12;
    color: $color-g-54;
  }
}

.badge {
  display: inline-block;
  padding: $size-4 $size-12;
  border-radius: $size-16;
  font-size: $size-12;
  font-weight: $fw-medium;

  &--primary {
    background-color: rgba($color-pri-main, 0.1);
    color: $color-pri-main;
  }

  &--success {
    background-color: rgba(#10B981, 0.1);
    color: #10B981;
  }

  &--completed {
    background-color: rgba(#10B981, 0.1);
    color: #10B981;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $size-64 $size-24;
  text-align: center;

  .icons {
    margin-bottom: $size-24;
    opacity: 0.3;
  }

  &__title {
    font-size: $size-20;
    font-weight: $fw-semi-bold;
    color: $color-g-36;
    margin-bottom: $size-8;
  }

  &__description {
    font-size: $size-16;
    color: $color-g-54;
  }
}

// Additional mobile responsiveness
@media (max-width: 768px) {
  .clinical-notes-container {
    padding: $size-16;
  }

  .clinical-notes-header {
    margin-bottom: $size-24;

    &__title {
      h1 {
        font-size: $size-24;
      }

      p {
        font-size: $size-14;
      }
    }
  }

  .note-card {
    padding: $size-16;

    &__header {
      flex-direction: column;
      align-items: flex-start;
      gap: $size-12;
    }

    &__patient {
      font-size: $size-16;
    }

    &__badges {
      flex-wrap: wrap;
    }

    &__footer {
      flex-direction: column;
      gap: $size-8;
      align-items: flex-start;
    }
  }

  .empty-state {
    padding: $size-48 $size-16;

    &__title {
      font-size: $size-18;
    }

    &__description {
      font-size: $size-14;
    }
  }
}

@media (max-width: 480px) {
  .clinical-notes-container {
    padding: $size-12;
  }

  .clinical-notes-header {
    &__title {
      h1 {
        font-size: $size-20;
      }

      p {
        font-size: $size-12;
      }
    }
  }

  .note-card {
    padding: $size-12;

    &__patient {
      font-size: $size-15;
    }

    &__date {
      font-size: $size-12;
    }

    &__text {
      font-size: $size-12;
    }
  }

  .empty-state {
    padding: $size-32 $size-12;
  }
}
</style>
