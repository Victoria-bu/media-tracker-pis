export type ClockFn = () => Date;

/**
 * Replaceable clock — module-level singleton used by statsRepo date filters.
 * Default: `() => new Date()` (wall-clock time).
 * Replaced by tests via setClock() to freeze time for deterministic queries.
 */
let clockFn: ClockFn = () => new Date();

/** Returns the currently active clock function. */
export function getClock(): ClockFn {
  return clockFn;
}

/** Overrides the clock with a custom function (for testing). */
export function setClock(fn: ClockFn): void {
  clockFn = fn;
}

/** Restores the clock to wall-clock time after a test override. */
export function resetClock(): void {
  clockFn = () => new Date();
}
