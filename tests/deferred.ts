/**
 * A promise plus the function that resolves it.
 *
 * Component tests need to hold a request open to observe the in-flight UI
 * (spinner, disabled controls, progress bar) and then let it finish. A bare
 * `let resolve: () => void` inside each test is a narrowing headache - and
 * repeats the same three lines in every suite - so it lives here.
 */
export interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}

export function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
