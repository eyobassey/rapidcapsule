import { onMounted, onUnmounted } from 'vue';

export function useScrollReveal(options = {}) {
  const { threshold = 0.15, rootMargin = '0px 0px -50px 0px' } = options;
  const observers = [];

  function reveal(el) {
    if (!el) return;
    // Handle component instances (el.$el) vs raw DOM elements
    if (el.$el) el = el.$el;
    if (!(el instanceof Element)) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('revealed');
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin }
    );
    observer.observe(el);
    observers.push(observer);
  }

  onUnmounted(() => {
    observers.forEach((o) => o.disconnect());
  });

  return { reveal };
}
