import siteBackdrop from "./site-backdrop.webp?inline";
import engineBackdrop from "./engine-backdrop.avif?inline";

export const styles = `
    .html-canvas-page {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      overflow: hidden;
      image-rendering: auto;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      font-family: "VT323", ui-monospace, monospace;
    }

    .html-canvas-page.engine {
      pointer-events: none;
      user-select: none;
    }

    .html-canvas-page.site {
      pointer-events: auto;
      user-select: text;
    }

    .html-canvas-page *,
    .html-canvas-page *::before,
    .html-canvas-page *::after {
      box-sizing: border-box;
    }

    /* ----------------------------- front site page ----------------------------- */

    .site {
      position: relative;
      color: #ffffff;
      background-color: #0a0612;
      background-image: url("${siteBackdrop}");
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }

    .site::before {
      content: "";
      position: absolute;
      inset: 0;
      background:
        linear-gradient(100deg,
          rgba(10, 6, 18, 0.88) 0%,
          rgba(10, 6, 18, 0.66) 30%,
          rgba(10, 6, 18, 0.28) 58%,
          rgba(10, 6, 18, 0.05) 82%);
      pointer-events: none;
    }

    .site::after {
      content: "";
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(
        0deg,
        rgba(0, 0, 0, 0.0) 0 2px,
        rgba(0, 0, 0, 0.22) 2px 3px
      );
      mix-blend-mode: multiply;
      opacity: 0.6;
      pointer-events: none;
    }

    .site > * {
      position: relative;
      z-index: 1;
    }

    .site code {
      font-family: ui-monospace, "SFMono-Regular", Menlo, monospace;
      font-size: 0.66em;
      padding: 1px 5px;
      color: #ffd6e3;
      background: rgba(231, 34, 100, 0.16);
      box-shadow: inset 0 0 0 1px rgba(231, 34, 100, 0.45);
    }

    .github-btn {
      position: absolute;
      top: 16px;
      right: clamp(20px, 5vw, 48px);
      z-index: 2;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 12px 18px;
      background: rgba(8, 4, 16, 0.94);
      border: none;
      font-family: "Press Start 2P", monospace;
      font-size: 12px;
      line-height: 1;
      letter-spacing: 2.5px;
      color: #E72264;
      box-shadow:
        inset 0 0 0 3px #E72264,
        4px 4px 0 rgba(0, 0, 0, 0.55);
    }

    .github-btn .gh-mark {
      display: inline-flex;
      color: #E72264;
    }

    .github-btn .gh-mark svg {
      width: 20px;
      height: 20px;
      display: block;
    }

    /* Scroll container */
    .site-scroll {
      position: absolute;
      inset: 0;
      z-index: 1;
      overflow-y: auto;
      overflow-x: hidden;
      scroll-behavior: smooth;
      scrollbar-width: thin;
      scrollbar-color: #E72264 #0a0612;
    }

    .site-scroll::-webkit-scrollbar {
      width: 14px;
    }

    .site-scroll::-webkit-scrollbar-track {
      background: #0a0612;
      box-shadow: inset 0 0 0 2px rgba(231, 34, 100, 0.25);
    }

    .site-scroll::-webkit-scrollbar-thumb {
      background: #E72264;
      border: 3px solid #0a0612;
      box-shadow:
        inset -3px -3px 0 rgba(0, 0, 0, 0.35),
        inset 3px 3px 0 rgba(255, 255, 255, 0.25);
    }

    .site-scroll::-webkit-scrollbar-thumb:hover {
      background: #ff3d7c;
    }

    section[id] {
      scroll-margin-top: 24px;
    }

    .section-inner {
      width: 100%;
      max-width: 1180px;
      margin: 0 auto;
    }

    /* Hero */
    .hero {
      min-height: 100%;
      box-sizing: border-box;
      display: grid;
      align-items: center;
      padding: clamp(104px, 15vh, 132px) clamp(24px, 6vw, 64px) clamp(56px, 9vh, 84px);
    }

    .hero-inner {
      display: grid;
      grid-template-columns: minmax(0, 760px);
      align-items: center;
    }

    .hero-text {
      display: grid;
      gap: clamp(14px, 2vh, 20px);
      max-width: 720px;
    }

    .hero-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 14px;
      margin: 0 0 clamp(10px, 2vh, 18px);
      font-family: "Press Start 2P", monospace;
      font-size: 12px;
      letter-spacing: 2.5px;
      color: #E72264;
      text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.6);
    }

    .live-dot {
      flex-shrink: 0;
      width: 10px;
      height: 10px;
      background: #E72264;
      box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.5);
      animation: livePulse 1s steps(2, end) infinite;
    }

    @keyframes livePulse {
      from { opacity: 1; }
      to { opacity: 0.35; }
    }

    .hero-title {
      margin: 0;
      font-family: "Press Start 2P", monospace;
      font-size: clamp(54px, 12vw, 108px);
      line-height: 1;
      letter-spacing: 6px;
      color: #E72264;
      text-shadow:
        -5px 0 0 #ffffff, 5px 0 0 #ffffff,
        0 -5px 0 #ffffff, 0 5px 0 #ffffff,
        -5px -5px 0 #ffffff, 5px 5px 0 #ffffff,
        5px -5px 0 #ffffff, -5px 5px 0 #ffffff,
        -5px 10px 0 #ffffff, 5px 10px 0 #ffffff,
        0 10px 0 #ffffff,
        0 18px 0 rgba(0, 0, 0, 0.55);
    }

    .hero-subtitle {
      margin: 0;
      font-family: "VT323", monospace;
      font-weight: 400;
      font-size: clamp(30px, 5.4vw, 46px);
      line-height: 1.05;
      color: #ffffff;
      letter-spacing: 0.5px;
      text-shadow: 3px 3px 0 rgba(0, 0, 0, 0.6);
      white-space: nowrap;
    }

    .hero-desc {
      margin: 0;
      font-family: "VT323", monospace;
      font-size: clamp(19px, 2.5vw, 25px);
      line-height: 1.25;
      color: rgba(255, 255, 255, 0.82);
      max-width: 560px;
      text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.55);
    }

    .hero-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 18px;
      margin-top: 8px;
    }

    .hero-chips {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
      margin: 10px 0 0;
      padding: 0;
      list-style: none;
    }

    .hero-chips li {
      display: inline-flex;
      align-items: center;
      min-height: 34px;
      padding: 0 14px;
      font-family: ui-monospace, "SFMono-Regular", Menlo, monospace;
      font-size: 13px;
      line-height: 1;
      letter-spacing: 0.5px;
      color: #ffd6e3;
      background: rgba(10, 6, 18, 0.72);
      box-shadow: inset 0 0 0 2px rgba(231, 34, 100, 0.45);
    }

    .pixel-btn {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 16px 22px;
      font-family: "Press Start 2P", monospace;
      font-size: 13px;
      letter-spacing: 2.5px;
      color: #ffffff;
      border: none;
      background: #E72264;
      box-shadow:
        inset -4px -4px 0 rgba(0, 0, 0, 0.28),
        inset 4px 4px 0 rgba(255, 255, 255, 0.22),
        6px 6px 0 rgba(0, 0, 0, 0.55);
    }

    .pixel-btn.outline {
      background: rgba(10, 6, 18, 0.55);
      color: #E72264;
      box-shadow:
        inset 0 0 0 3px #E72264,
        6px 6px 0 rgba(0, 0, 0, 0.55);
    }

    .pixel-btn .btn-icon {
      display: inline-flex;
    }

    .pixel-btn .btn-icon svg {
      width: 22px;
      height: 22px;
    }

    /* ---------------------- interactive button states ---------------------- */

    a.pixel-btn,
    a.github-btn {
      color: inherit;
      text-decoration: none;
      display: inline-flex;
    }

    .github-btn,
    .pixel-btn {
      cursor: pointer;
      transform: translate3d(0, 0, 0);
      transition:
        transform 90ms steps(2, end),
        box-shadow 90ms steps(2, end),
        background-color 120ms ease,
        color 120ms ease,
        filter 140ms ease;
    }

    .pixel-btn:focus-visible,
    .github-btn:focus-visible {
      outline: 3px solid #ffd6e3;
      outline-offset: 2px;
    }

    .pixel-btn:hover {
      background: #ff3d7c;
      transform: translate(-2px, -2px);
      box-shadow:
        inset -4px -4px 0 rgba(0, 0, 0, 0.28),
        inset 4px 4px 0 rgba(255, 255, 255, 0.34),
        9px 9px 0 rgba(0, 0, 0, 0.55);
      animation: fxPulse 0.7s ease-in-out infinite alternate;
    }

    .pixel-btn.outline:hover {
      background: rgba(231, 34, 100, 0.2);
      color: #ffd6e3;
      box-shadow:
        inset 0 0 0 3px #ff5a93,
        9px 9px 0 rgba(0, 0, 0, 0.55);
    }

    .github-btn:hover {
      color: #ffd6e3;
      transform: translate(-2px, -2px);
      box-shadow:
        inset 0 0 0 3px #ff5a93,
        7px 7px 0 rgba(0, 0, 0, 0.55);
      animation: fxPulse 0.7s ease-in-out infinite alternate;
    }

    .github-btn:hover .gh-mark {
      color: #ffd6e3;
    }

    a.pixel-btn:active,
    a.github-btn:active {
      transform: translate(4px, 4px);
      box-shadow:
        inset -3px -3px 0 rgba(0, 0, 0, 0.34),
        inset 3px 3px 0 rgba(255, 255, 255, 0.18),
        1px 1px 0 rgba(0, 0, 0, 0.55);
      filter: drop-shadow(0 0 3px rgba(231, 34, 100, 0.6));
      animation: none;
    }

    a.pixel-btn.outline:active {
      box-shadow:
        inset 0 0 0 3px #E72264,
        1px 1px 0 rgba(0, 0, 0, 0.55);
    }

    @keyframes fxPulse {
      from {
        filter: drop-shadow(0 0 3px rgba(231, 34, 100, 0.5));
      }
      to {
        filter: drop-shadow(0 0 13px rgba(231, 34, 100, 0.95));
      }
    }

    /* ----------------------------- content bands ----------------------------- */

    .band {
      position: relative;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      padding: clamp(60px, 9vw, 110px) clamp(24px, 6vw, 64px);
      background: rgba(8, 4, 16, 0.66);
      box-shadow: inset 0 0 0 3px rgba(231, 34, 100, 0.22);
    }

    .band::after {
      content: "";
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(
        0deg,
        rgba(0, 0, 0, 0.0) 0 2px,
        rgba(0, 0, 0, 0.22) 2px 3px
      );
      mix-blend-mode: multiply;
      opacity: 0.5;
      pointer-events: none;
    }

    .band > * {
      position: relative;
      z-index: 1;
    }

    .band.showcase {
      background: rgba(6, 4, 18, 0.68);
    }

    .band-title {
      margin: 0 0 14px;
      font-family: "Press Start 2P", monospace;
      font-size: clamp(20px, 3.4vw, 26px);
      line-height: 1;
      letter-spacing: 3px;
      color: #E72264;
      text-shadow:
        -3px 0 0 #ffffff, 3px 0 0 #ffffff,
        0 -3px 0 #ffffff, 0 3px 0 #ffffff,
        3px 3px 0 #ffffff, -3px 3px 0 #ffffff,
        0 9px 0 rgba(0, 0, 0, 0.55);
    }

    .band-sub {
      margin: 0 0 34px;
      max-width: 620px;
      font-family: "VT323", monospace;
      font-size: clamp(18px, 2.2vw, 23px);
      line-height: 1.25;
      color: rgba(255, 255, 255, 0.66);
      text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.5);
    }

    pre.code {
      margin: 0;
      padding: 16px 16px 16px 20px;
      overflow-x: auto;
      font-family: ui-monospace, "SFMono-Regular", Menlo, monospace;
      font-size: 12.5px;
      line-height: 1.6;
      tab-size: 2;
      color: rgba(255, 255, 255, 0.86);
      background: rgba(4, 2, 10, 0.92);
      box-shadow:
        inset 4px 0 0 #E72264,
        inset 0 0 0 2px rgba(231, 34, 100, 0.35),
        5px 5px 0 rgba(0, 0, 0, 0.55);
      white-space: pre;
    }

    pre.code .t-k { color: #ff6fa3; }
    pre.code .t-s { color: #ffd6e3; }
    pre.code .t-c { color: rgba(255, 255, 255, 0.38); }
    pre.code .t-f { color: #c9a3ff; }

    /* PixiJS API */
    .pixi-split {
      display: grid;
      grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
      gap: 28px;
      align-items: start;
    }

    .pixi-points {
      display: grid;
      gap: 16px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .pixi-points li {
      position: relative;
      padding-left: 26px;
      font-family: "VT323", monospace;
      font-size: 21px;
      line-height: 1.25;
      color: rgba(255, 255, 255, 0.78);
      text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.5);
    }

    .pixi-points li::before {
      content: "";
      position: absolute;
      left: 0;
      top: 7px;
      width: 12px;
      height: 12px;
      background: #E72264;
      box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.5);
    }

    .spec-note {
      display: block;
      margin: 30px 0 0;
      padding: 22px 24px;
      font-family: "VT323", monospace;
      font-size: clamp(19px, 2.3vw, 23px);
      line-height: 1.3;
      color: rgba(255, 255, 255, 0.88);
      background: rgba(231, 34, 100, 0.12);
      box-shadow:
        inset 0 0 0 3px rgba(231, 34, 100, 0.55),
        6px 6px 0 rgba(0, 0, 0, 0.55);
    }

    .spec-note .tag {
      display: inline-block;
      margin-right: 14px;
      padding: 6px 10px;
      font-family: "Press Start 2P", monospace;
      font-size: 10px;
      letter-spacing: 1.5px;
      color: #ffffff;
      background: #E72264;
      box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.55);
      animation: fxPulse 0.9s ease-in-out infinite alternate;
    }

    /* Footer */
    .site-footer {
      display: grid;
      justify-items: center;
      padding: 40px clamp(24px, 6vw, 64px) 56px;
      background: rgba(8, 4, 16, 0.66);
    }

    .footer-inner {
      display: grid;
      gap: 16px;
      justify-items: center;
      text-align: center;
    }

    .footer-divider {
      width: 100%;
      height: 4px;
      background: repeating-linear-gradient(
        90deg,
        #E72264 0 10px,
        transparent 10px 18px
      );
    }

    .site-footer p {
      margin: 0;
      font-family: "VT323", monospace;
      font-size: 18px;
      letter-spacing: 1.5px;
      color: rgba(255, 255, 255, 0.6);
      text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.55);
    }

    .site-footer .footer-flag {
      font-family: ui-monospace, "SFMono-Regular", Menlo, monospace;
      font-size: 14px;
      letter-spacing: 0.5px;
      color: #E72264;
    }

    /* ----------------------------- responsive ----------------------------- */

    @media (max-width: 1024px) {
      .pixi-split {
        grid-template-columns: minmax(0, 1fr);
      }
    }

    @media (max-width: 720px) {
      .hero-title {
        letter-spacing: 3px;
      }
    }

    /* ----------------------------- back engine page ----------------------------- */

    .engine {
      position: relative;
      display: grid;
      grid-template-rows: auto auto 1fr auto;
      gap: 22px;
      padding: 0;
      color: #1c0a14;
      background:
        url("${engineBackdrop}") center/cover no-repeat,
        linear-gradient(168deg, #d9c8ff 0%, #f3c9e0 100%);
    }
  `;
