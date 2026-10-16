/**
 * <stitch-loader>: a Samoyed (or a cat) is cross-stitched onto fabric while something loads.
 * Vanilla web component (custom element + Shadow DOM). No dependencies.
 *
 * Usage:
 *   <script type="module" src="./stitch-loader.js"></script>
 *
 *   <!-- Indeterminate: stitches itself, holds, unpicks and starts over -->
 *   <stitch-loader></stitch-loader>
 *
 *   <!-- Determinate: the picture fills in with the progress (0 to 100) -->
 *   <stitch-loader progress="42" label="Syncing your stash"></stitch-loader>
 *
 *   const loader = document.querySelector('stitch-loader');
 *   loader.progress = 75;     // update as work completes
 *   loader.progress = null;   // back to indeterminate
 *
 * Attributes: pet (samoyed or cat, default samoyed), progress, label,
 *             size (width in px, default 220), hide-label
 *
 *   <stitch-loader pet="cat"></stitch-loader>
 *
 * Theme with CSS variables:
 *   --stitch-fabric, --stitch-white, --stitch-cream, --stitch-dark,
 *   --stitch-pink, --stitch-orange, --stitch-stripe, --stitch-green,
 *   --stitch-needle, --stitch-label
 */

/* Patterns. Left half only, each is mirrored below. All share the same size.
   samoyed: W white, C cream, K dark, P pink
   cat:     O orange, S stripe, W white, G green, K dark, P pink
   .  = bare fabric */
const PATTERNS = {
  samoyed: [
    '......W.....',
    '.....WW.....',
    '.....WPW....',
    '....WWPWW...',
    '....WWPWWW..',
    '...WWWWWWWWW',
    '..WWWWWWWWWW',
    '.WWWWWWWWWWW',
    '.WWWWWWWWWWW',
    'WWWWWWKWWWWW',
    'WWWWWWKWWWWW',
    'WWWWWWWWWWWW',
    'WWWWWWWWWWKK',
    'WWWWWWWWWCCK',
    'WWWWWWWWCKCK',
    'WWWWWWWWCCKP',
    'WWWWWWWWCCCP',
    'WWWWWWWWWWWW',
    '.WWWWWWWWWWW',
    '..WWWWWWWWWW',
    '...WWWWWWWWW',
  ],
  cat: [
    '..O.........',
    '..OO........',
    '..OPO.......',
    '..OPPO......',
    '..OPPPO.....',
    '..OOOOOOOOOS',
    '.OOOOOOOSOOS',
    '.OOOOOOOSOOS',
    'OOOOOOOOOOOO',
    'OOOOGKGOOOOO',
    'OOOOGKGOOOOO',
    'OOOOOOOOWWWP',
    'OOWWWWWOWWWK',
    'OOOOOOOOWWKW',
    'OOWWWWWOWKWW',
    'OOOOOOOOWWWW',
    '.OOOOOOOOWWW',
    '..OOOOOOOOWW',
    '...OOOOOOOOO',
    '....OOOOOOOO',
    '.....OOOOOOO',
  ],
};
const DEFAULT_PET = 'samoyed';

const SHAPES = {};
for (const [name, half] of Object.entries(PATTERNS)) {
  const stitches = [];
  half
    .map((h) => h + [...h].reverse().join(''))
    .forEach((row, r) => {
      [...row].forEach((ch, c) => {
        if (ch !== '.') stitches.push({ r, c, ch });
      });
    });
  SHAPES[name] = stitches;
}

const COLS = PATTERNS[DEFAULT_PET][0].length * 2;
const ROWS = PATTERNS[DEFAULT_PET].length;
const CELL = 10;
const MARGIN = 14;
const VIEW_W = COLS * CELL + MARGIN * 2;
const VIEW_H = ROWS * CELL + MARGIN * 2;

/* Indeterminate timing, in 22ms ticks */
const STEP_MS = 22;
const HOLD_TICKS = 45;
const FADE_TICKS = 20;

const NS = 'http://www.w3.org/2000/svg';
const svgEl = (name, attrs = {}) => {
  const node = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
};

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      color: var(--stitch-label, #4a4350);
      font: 500 0.95rem/1.2 system-ui, sans-serif;
    }

    svg {
      display: block;
      max-width: 100%;
      height: auto;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
    }

    /* A stitch is hidden until it is "on", then each leg of the X is drawn in */
    .s { opacity: 0; }
    .s.on { opacity: 1; }
    .s line {
      fill: none;
      stroke-width: 2.8;
      stroke-linecap: round;
      stroke-dasharray: 1 1;
      stroke-dashoffset: 1;
    }
    .s.on line {
      animation: draw 0.22s ease-out both;
    }
    .s.on line + line {
      animation-delay: 0.1s;
    }

    .s-W line { stroke: var(--stitch-white, #fbf8f1); }
    .s-C line { stroke: var(--stitch-cream, #e6d8bb); }
    .s-K line { stroke: var(--stitch-dark, #2f2a33); }
    .s-P line { stroke: var(--stitch-pink, #f2a0b3); }
    .s-O line { stroke: var(--stitch-orange, #f0a34e); }
    .s-S line { stroke: var(--stitch-stripe, #b8651f); }
    .s-G line { stroke: var(--stitch-green, #8fd16a); }

    .stitches { opacity: 1; }
    svg.fade .stitches {
      opacity: 0;
      transition: opacity 0.4s ease;
    }

    @keyframes draw {
      from { stroke-dashoffset: 1; }
      to   { stroke-dashoffset: 0; }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50%      { opacity: 0.55; }
    }

    @media (prefers-reduced-motion: reduce) {
      .s line { stroke-dashoffset: 0; }
      .s.on line { animation: none; }
      svg.static { animation: pulse 1.8s ease-in-out infinite; }
    }
  </style>

  <svg viewBox="0 0 ${VIEW_W} ${VIEW_H}" aria-hidden="true" focusable="false">
    <defs>
      <pattern id="holes" patternUnits="userSpaceOnUse" x="${MARGIN}" y="${MARGIN}" width="${CELL}" height="${CELL}">
        <g fill="rgba(0,0,0,.2)">
          <circle cx="0" cy="0" r=".8" />
          <circle cx="${CELL}" cy="0" r=".8" />
          <circle cx="0" cy="${CELL}" r=".8" />
          <circle cx="${CELL}" cy="${CELL}" r=".8" />
        </g>
      </pattern>
    </defs>
    <rect x="2" y="2" width="${VIEW_W - 4}" height="${VIEW_H - 4}" rx="6" fill="var(--stitch-fabric, #6d8aa3)" />
    <rect x="2" y="2" width="${VIEW_W - 4}" height="${VIEW_H - 4}" rx="6" fill="url(#holes)" />
    <rect x="8" y="8" width="${VIEW_W - 16}" height="${VIEW_H - 16}" rx="3" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="1" stroke-dasharray="3 3" />
    <g class="stitches" transform="translate(${MARGIN} ${MARGIN})"></g>
    <g class="needle" visibility="hidden">
      <line x1="0" y1="0" x2="17" y2="-17" stroke="var(--stitch-needle, #d9dde2)" stroke-width="2" stroke-linecap="round" />
      <ellipse cx="14.5" cy="-14.5" rx="2.4" ry=".9" transform="rotate(-45 14.5 -14.5)" fill="var(--stitch-fabric, #6d8aa3)" />
    </g>
  </svg>
  <span class="label" part="label"></span>
`;

class StitchLoader extends HTMLElement {
  static get observedAttributes() {
    return ['pet', 'progress', 'label', 'size', 'hide-label'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).appendChild(template.content.cloneNode(true));
    this._svg = this.shadowRoot.querySelector('svg');
    this._label = this.shadowRoot.querySelector('.label');
    this._needle = this.shadowRoot.querySelector('.needle');
    this._count = 0;
    this._t = 0;
    this._timer = null;
    this._group = this.shadowRoot.querySelector('.stitches');
    this._pet = DEFAULT_PET;
    this._stitches = SHAPES[DEFAULT_PET];
    this._nodes = this._buildStitches();
  }

  get progress() {
    return this.hasAttribute('progress') ? Number(this.getAttribute('progress')) : null;
  }
  set progress(value) {
    if (value === null || value === undefined) this.removeAttribute('progress');
    else this.setAttribute('progress', String(value));
  }

  connectedCallback() {
    this._render();
  }

  disconnectedCallback() {
    this._stopTimer();
  }

  attributeChangedCallback() {
    if (this.isConnected) this._render();
  }

  _buildStitches() {
    const lo = 1.2;
    const hi = CELL - 1.2;
    this._group.replaceChildren();
    return this._stitches.map(({ r, c, ch }) => {
      const x = c * CELL;
      const y = r * CELL;
      const g = svgEl('g', { class: `s s-${ch}` });
      // "/" leg first, "\" leg on top, like a real cross-stitch
      g.append(
        svgEl('line', { x1: x + lo, y1: y + hi, x2: x + hi, y2: y + lo, pathLength: 1 }),
        svgEl('line', { x1: x + lo, y1: y + lo, x2: x + hi, y2: y + hi, pathLength: 1 })
      );
      this._group.append(g);
      return g;
    });
  }

  _setPet(name) {
    this._pet = name;
    this._stitches = SHAPES[name];
    this._count = 0;
    this._t = 0;
    this._nodes = this._buildStitches();
    this._svg.classList.remove('fade');
  }

  _render() {
    const wanted = this.getAttribute('pet');
    const pet = SHAPES[wanted] ? wanted : DEFAULT_PET;
    if (pet !== this._pet) this._setPet(pet);

    const size = Number(this.getAttribute('size')) || 220;
    this._svg.style.width = size + 'px';

    const baseLabel = this.getAttribute('label') ?? 'Loading…';
    this._label.classList.toggle('sr-only', this.hasAttribute('hide-label'));

    if (this.hasAttribute('progress')) {
      const pct = Math.max(0, Math.min(100, Number(this.getAttribute('progress')) || 0));
      this._stopTimer();
      this._svg.classList.remove('fade', 'static');
      this._setCount(Math.round((pct / 100) * this._stitches.length));
      this._label.textContent = `${baseLabel} ${Math.round(pct)}%`;
      this.setAttribute('role', 'progressbar');
      this.setAttribute('aria-valuemin', '0');
      this.setAttribute('aria-valuemax', '100');
      this.setAttribute('aria-valuenow', String(Math.round(pct)));
      this.setAttribute('aria-label', baseLabel);
      this.removeAttribute('aria-live');
    } else {
      this._label.textContent = baseLabel;
      this.setAttribute('role', 'status');
      this.setAttribute('aria-live', 'polite');
      this.removeAttribute('aria-valuemin');
      this.removeAttribute('aria-valuemax');
      this.removeAttribute('aria-valuenow');
      this.removeAttribute('aria-label');
      this._startTimer();
    }
  }

  _startTimer() {
    if (this._timer) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // No stitching motion: show the finished picture with a gentle pulse
      this._setCount(this._stitches.length);
      this._svg.classList.add('static');
      return;
    }
    this._t = 0;
    this._timer = setInterval(() => this._tick(), STEP_MS);
  }

  _stopTimer() {
    clearInterval(this._timer);
    this._timer = null;
  }

  _tick() {
    const total = this._stitches.length;
    const t = this._t++;
    if (t <= total) {
      this._setCount(t);
    } else if (t === total + HOLD_TICKS) {
      this._svg.classList.add('fade');
    } else if (t >= total + HOLD_TICKS + FADE_TICKS) {
      this._setCount(0);
      this._svg.classList.remove('fade');
      this._t = 0;
    }
  }

  _setCount(n) {
    n = Math.max(0, Math.min(this._stitches.length, n));
    for (let i = this._count; i < n; i++) this._nodes[i].classList.add('on');
    for (let i = n; i < this._count; i++) this._nodes[i].classList.remove('on');
    this._count = n;

    // Needle sits at the next stitch to be sewn
    const next = this._stitches[n];
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (next && !reduce) {
      const x = MARGIN + next.c * CELL + CELL / 2;
      const y = MARGIN + next.r * CELL + CELL / 2;
      this._needle.setAttribute('transform', `translate(${x} ${y})`);
      this._needle.setAttribute('visibility', 'visible');
    } else {
      this._needle.setAttribute('visibility', 'hidden');
    }
  }
}

if (!customElements.get('stitch-loader')) {
  customElements.define('stitch-loader', StitchLoader);
}
