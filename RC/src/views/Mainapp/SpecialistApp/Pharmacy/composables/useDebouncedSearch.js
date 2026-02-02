import { ref, watch } from 'vue';

export function useDebouncedSearch(fetchFn, delay = 300) {
  const searchQuery = ref('');
  let debounceTimer = null;

  function debouncedFetch() {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      fetchFn();
    }, delay);
  }

  function clearSearch() {
    searchQuery.value = '';
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    fetchFn();
  }

  watch(searchQuery, () => {
    debouncedFetch();
  });

  return {
    searchQuery,
    debouncedFetch,
    clearSearch,
  };
}
