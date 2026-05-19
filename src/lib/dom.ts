// Resolves after two animation frames. One rAF schedules past the current
// frame; the second guarantees the browser has finished layout/paint of the
// pending DOM mutation, so the next HTMLSource capture sees the reflowed page.
export function nextDoubleFrame(): Promise<void> {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}
