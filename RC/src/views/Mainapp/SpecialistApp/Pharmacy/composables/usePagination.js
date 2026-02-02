import { ref, computed } from 'vue';

export function usePagination(initialLimit = 20) {
  const pagination = ref({
    page: 1,
    limit: initialLimit,
    total: 0,
    totalPages: 0,
  });

  const hasNextPage = computed(() => pagination.value.page < pagination.value.totalPages);
  const hasPrevPage = computed(() => pagination.value.page > 1);

  function goToPage(page) {
    if (page < 1 || page > pagination.value.totalPages) return;
    pagination.value.page = page;
  }

  function nextPage() {
    if (hasNextPage.value) {
      pagination.value.page++;
    }
  }

  function prevPage() {
    if (hasPrevPage.value) {
      pagination.value.page--;
    }
  }

  function resetPagination() {
    pagination.value.page = 1;
    pagination.value.total = 0;
    pagination.value.totalPages = 0;
  }

  function updateFromResponse(response) {
    if (response?.pagination) {
      pagination.value.total = response.pagination.total || 0;
      pagination.value.totalPages = response.pagination.totalPages || response.pagination.total_pages || 0;
      pagination.value.page = response.pagination.page || pagination.value.page;
    } else if (response?.total !== undefined) {
      pagination.value.total = response.total;
      pagination.value.totalPages = Math.ceil(response.total / pagination.value.limit);
    }
  }

  return {
    pagination,
    hasNextPage,
    hasPrevPage,
    goToPage,
    nextPage,
    prevPage,
    resetPagination,
    updateFromResponse,
  };
}
