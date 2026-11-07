export type ClockFn = () => Date;

let clockFn: ClockFn = () => new Date();

export function getClock(): ClockFn {
  return clockFn;
}

export function setClock(fn: ClockFn): void {
  clockFn = fn;
}

export function resetClock(): void {
  clockFn = () => new Date();
}
