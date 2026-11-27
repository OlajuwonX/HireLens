export function nearestIndex(progress: number, stops: number[]) {
  if (stops.length === 0) {
    return 0;
  }

  return stops.reduce(
    (best, stop, index) => (Math.abs(stop - progress) < Math.abs(stops[best] - progress) ? index : best),
    0,
  );
}

export function stepLabel(index: number, count: number) {
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${pad(Math.min(index + 1, count))} / ${pad(count)}`;
}
