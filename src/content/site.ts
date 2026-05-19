import githubIcon from "./icons/github.svg?raw";

const WICG = "https://github.com/WICG/html-in-canvas";
const PIXIJS_REPO = "https://github.com/pixijs/pixijs";

export const siteHtml = `
  <a class="github-btn" href="${PIXIJS_REPO}" target="_blank" rel="noopener"><span class="gh-mark">${githubIcon}</span>PIXIJS</a>
  <div class="site-scroll">
    <section class="hero" id="top">
      <div class="section-inner hero-inner">
        <div class="hero-text">
          <p class="hero-eyebrow"><span class="live-dot"></span>WICG SPEC &middot; LIVE IN PIXIJS</p>
          <h1 class="hero-title">PixiJS</h1>
          <h2 class="hero-subtitle">HTML, painted into WebGL/WebGPU</h2>
          <p class="hero-desc">The WICG HTML-in-Canvas spec lets the browser rasterize real, styled, accessible DOM into a canvas; no html2canvas, no screenshots. PixiJS exposes it as HTMLSource, so a live element is just another Texture.</p>
          <div class="hero-actions">
            <a class="pixel-btn" href="#pixijs">SEE THE API</a>
            <a class="pixel-btn outline" href="${WICG}" target="_blank" rel="noopener"><span class="btn-icon">${githubIcon}</span>READ THE SPEC</a>
          </div>
          <ul class="hero-chips">
            <li>chrome://flags/#canvas-draw-element</li>
          </ul>
        </div>
      </div>
    </section>

    <section class="band showcase" id="pixijs">
      <div class="section-inner">
        <h2 class="band-title">PixiJS API</h2>
        <p class="band-sub"><code>HTMLSource</code> is just another <code>Texture</code> source.</p>
        <div class="pixi-split">
          <pre class="code"><span class="t-k">import</span> { HTMLSource, Texture, Sprite } <span class="t-k">from</span> <span class="t-s">'pixi.js'</span>;

<span class="t-k">const</span> page = document.<span class="t-f">createElement</span>(<span class="t-s">'div'</span>);
canvas.<span class="t-f">appendChild</span>(page); <span class="t-c">// direct canvas child</span>

<span class="t-k">const</span> source = <span class="t-k">new</span> <span class="t-f">HTMLSource</span>({ resource: page });
<span class="t-k">const</span> sprite = <span class="t-k">new</span> <span class="t-f">Sprite</span>(<span class="t-k">new</span> <span class="t-f">Texture</span>({ source }));

app.stage.<span class="t-f">addChild</span>(sprite);
source.<span class="t-f">requestPaint</span>(); <span class="t-c">// keep it live</span></pre>
          <ul class="pixi-points">
            <li><code>autoLayout</code> sets <code>layoutsubtree</code> on the owning canvas for you.</li>
            <li><code>autoUpdate</code> listens to <code>paint</code> and re-uploads only when your element changed.</li>
            <li><code>captureElementImage()</code> freezes a snapshot into an immutable <code>ElementImage</code> you can slice.</li>
            <li>One source feeds both the WebGL and WebGPU renderers; same <code>Texture</code>, same <code>Sprite</code>.</li>
          </ul>
        </div>
        <p class="spec-note"><span class="tag">LIVE</span>You're reading an HTMLSource. PixiJS paints this DOM into a WebGL texture every frame; the laser slices a frozen snapshot into chunks while the page underneath stays interactive. Select this sentence; it still works.</p>
      </div>
    </section>

    <footer class="site-footer">
      <div class="section-inner footer-inner">
        <div class="footer-divider"></div>
        <p>WICG HTML-IN-CANVAS &middot; PAINTED WITH PIXIJS HTMLSOURCE</p>
        <p class="footer-flag">chrome://flags/#canvas-draw-element</p>
      </div>
    </footer>
  </div>
`;
