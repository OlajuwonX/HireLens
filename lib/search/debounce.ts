export function createDebouncer<T>(run: (value: T) => void, delay: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;

  function clear() {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  }

  return {
    schedule(value: T) {
      clear();
      timer = setTimeout(() => {
        timer = undefined;
        run(value);
      }, delay);
    },
    flush(value: T) {
      clear();
      run(value);
    },
    cancel: clear,
    isPending() {
      return timer !== undefined;
    },
  };
}
