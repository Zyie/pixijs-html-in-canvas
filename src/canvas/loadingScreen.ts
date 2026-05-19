// The loading overlay is authored in static index.html so it paints on the
// first HTML paint, before the JS bundle is fetched. This just adopts that
// element and returns a dismiss() that fades and removes it. FADE_MS must
// match the `transition: opacity` duration on .hic-loader in index.html.
const FADE_MS = 220;

export interface LoadingScreen {
  dismiss: () => void;
}

export function mountLoadingScreen(container: HTMLElement): LoadingScreen {
  const overlay = container.querySelector<HTMLElement>(".hic-loader");

  return {
    dismiss() {
      if (!overlay) {
        return;
      }

      overlay.style.opacity = "0";
      window.setTimeout(() => overlay.remove(), FADE_MS + 40);
    },
  };
}
