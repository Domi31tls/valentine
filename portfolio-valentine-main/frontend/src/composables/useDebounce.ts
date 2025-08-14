import { ref } from 'vue';

/**
 * Composable pour débouncer les appels de fonction
 * @param fn - Fonction à débouncer
 * @param delay - Délai en millisecondes
 * @returns Fonction débouncée
 */
export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const timeoutId = ref<NodeJS.Timeout | null>(null);

  return (...args: Parameters<T>) => {
    if (timeoutId.value) {
      clearTimeout(timeoutId.value);
    }
    
    timeoutId.value = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}
