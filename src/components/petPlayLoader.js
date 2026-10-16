/**
 * <pet-play-loader>: a Samoyed chases a bouncing ball, or a cat plays with a
 * ball of yarn. Plain SVG + CSS animation, no dependencies.
 * Vanilla web component (custom element + Shadow DOM).
 *
 * Usage:
 *   <script type="module" src="./pet-play-loader.js"></script>
 *
 *   <pet-play-loader></pet-play-loader>                      <!-- dog (default) -->
 *   <pet-play-loader pet="cat"></pet-play-loader>
 *   <pet-play-loader pet="cat" label="Fetching your stash…" size="260"></pet-play-loader>
 *   <pet-play-loader hide-label></pet-play-loader>           <!-- label stays for screen readers -->
 *
 * Attributes: pet (dog | cat), label, size (width in px, default 240), hide-label
 *
 * Theme with CSS variables:
 *   --pet-dog, --pet-dog-shade, --pet-muzzle, --pet-cat, --pet-cat-stripe,
 *   --pet-pink, --pet-ink, --pet-ball, --pet-yarn, --pet-ground, --pet-label
 */

const DOG = `
  <svg viewBox="0 0 240 120" aria-hidden="true" focusable="false">
    <!-- ground, dashes slide past to show the run -->
    <line x1="8" y1="109" x2="232" y2="109" stroke="var(--pet-ground, #b7c4bd)" stroke-width="2" stroke-linecap="round" />
    <line class="ground-dash" x1="8" y1="116" x2="232" y2="116" stroke="var(--pet-ground, #b7c4bd)" stroke-width="2" stroke-linecap="round" stroke-dasharray="10 14" opacity=".6" />

    <!-- ball bouncing ahead of the dog -->
    <g class="drift">
      <ellipse class="ball-shadow" cx="205" cy="110" rx="8" ry="2" fill="var(--pet-ink, #3a2c28)" opacity=".18" />
      <g class="bounce">
        <g class="spin">
          <circle cx="205" cy="98" r="8" fill="var(--pet-ball, #c9e04a)" />
          <path d="M198 94 q7 6 14 0 M198 102 q7 -6 14 0" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity=".85" />
        </g>
      </g>
    </g>

    <!-- samoyed -->
    <g class="dog-bob">
      <g class="dog-fur">
        <!-- far legs -->
        <g class="thigh leg-a" style="color:var(--pet-dog-far, #e4dccb);--ox:86px;--oy:82px">
          <line x1="86" y1="82" x2="86" y2="94" stroke="currentColor" stroke-width="9" stroke-linecap="round" />
          <g class="shin" style="--ox:86px;--oy:94px">
            <line x1="86" y1="94" x2="86" y2="105" stroke="currentColor" stroke-width="7" stroke-linecap="round" />
            <ellipse cx="88" cy="106" rx="5.5" ry="3.4" fill="currentColor" />
          </g>
        </g>
        <g class="thigh leg-b" style="color:var(--pet-dog-far, #e4dccb);--ox:120px;--oy:82px">
          <line x1="120" y1="82" x2="120" y2="94" stroke="currentColor" stroke-width="9" stroke-linecap="round" />
          <g class="shin" style="--ox:120px;--oy:94px">
            <line x1="120" y1="94" x2="120" y2="105" stroke="currentColor" stroke-width="7" stroke-linecap="round" />
            <ellipse cx="122" cy="106" rx="5.5" ry="3.4" fill="currentColor" />
          </g>
        </g>

        <!-- tail curled over the back -->
        <path class="tail" d="M72 56 C60 30 92 24 100 44" fill="none" stroke="var(--pet-dog, #fdfaf3)" stroke-width="14" stroke-linecap="round" />

        <!-- body -->
        <ellipse cx="98" cy="66" rx="34" ry="20" fill="var(--pet-dog, #fdfaf3)" />
        <circle cx="72" cy="63" r="16" fill="var(--pet-dog, #fdfaf3)" />
        <circle cx="124" cy="68" r="16" fill="var(--pet-dog, #fdfaf3)" />

        <!-- near legs -->
        <g class="thigh leg-b" style="color:var(--pet-dog, #fdfaf3);--ox:76px;--oy:82px">
          <line x1="76" y1="82" x2="76" y2="94" stroke="currentColor" stroke-width="9" stroke-linecap="round" />
          <g class="shin" style="--ox:76px;--oy:94px">
            <line x1="76" y1="94" x2="76" y2="105" stroke="currentColor" stroke-width="7" stroke-linecap="round" />
            <ellipse cx="78" cy="106" rx="5.5" ry="3.4" fill="currentColor" />
          </g>
        </g>
        <g class="thigh leg-a" style="color:var(--pet-dog, #fdfaf3);--ox:130px;--oy:82px">
          <line x1="130" y1="82" x2="130" y2="94" stroke="currentColor" stroke-width="9" stroke-linecap="round" />
          <g class="shin" style="--ox:130px;--oy:94px">
            <line x1="130" y1="94" x2="130" y2="105" stroke="currentColor" stroke-width="7" stroke-linecap="round" />
            <ellipse cx="132" cy="106" rx="5.5" ry="3.4" fill="currentColor" />
          </g>
        </g>

        <!-- head -->
        <g class="dog-head">
          <polygon points="133,38 134,18 147,33" fill="var(--pet-dog, #fdfaf3)" stroke="var(--pet-dog, #fdfaf3)" stroke-width="4" stroke-linejoin="round" />
          <polygon points="145,32 155,18 157,38" fill="var(--pet-dog, #fdfaf3)" stroke="var(--pet-dog, #fdfaf3)" stroke-width="4" stroke-linejoin="round" />
          <polygon points="137,34 138,25 144,32" fill="var(--pet-pink, #f4a3b4)" opacity=".7" />
          <polygon points="149,32 154,25 154,34" fill="var(--pet-pink, #f4a3b4)" opacity=".7" />
          <circle cx="142" cy="48" r="16" fill="var(--pet-dog, #fdfaf3)" />
          <circle cx="133" cy="58" r="10" fill="var(--pet-dog, #fdfaf3)" />
          <ellipse cx="156" cy="55" rx="11" ry="7.5" fill="var(--pet-muzzle, #f3ebdd)" />
          <ellipse class="tongue" cx="157" cy="63" rx="3.5" ry="5" fill="var(--pet-pink, #f4a3b4)" />
          <path d="M165 55 q-6 8 -16 3" fill="none" stroke="var(--pet-ink, #3a2c28)" stroke-width="1.6" stroke-linecap="round" />
          <circle cx="166" cy="51" r="3.3" fill="var(--pet-ink, #3a2c28)" />
          <g class="blink">
            <circle cx="148" cy="44" r="2.6" fill="var(--pet-ink, #3a2c28)" />
            <circle cx="148.8" cy="43.2" r=".8" fill="#fff" />
          </g>
        </g>
      </g>
    </g>
  </svg>
`;

const CAT = `
  <svg viewBox="0 0 240 120" aria-hidden="true" focusable="false">
    <line x1="8" y1="109" x2="232" y2="109" stroke="var(--pet-ground, #b7c4bd)" stroke-width="2" stroke-linecap="round" />

    <!-- ball of yarn: rolls out and back, the cat bats it each time it returns -->
    <g class="travel">
      <ellipse cx="127" cy="110" rx="10" ry="2.2" fill="var(--pet-ink, #3a2c28)" opacity=".18" />
      <path d="M118 104 q-6 5 -13 1 t -10 -2" fill="none" stroke="var(--pet-yarn, #e2557b)" stroke-width="2" stroke-linecap="round" />
      <g class="roll">
        <circle cx="127" cy="98" r="10" fill="var(--pet-yarn, #e2557b)" />
        <path d="M119 91 q9 7 17 -2 M117 99 q11 6 20 -3 M122 106 q9 -3 14 -11 M127 88 q4 9 -1 20" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".6" />
      </g>
    </g>

    <!-- tabby cat, sitting -->
    <g class="cat-body">
      <path class="cat-tail" d="M38 98 C8 102 6 64 28 58" fill="none" stroke="var(--pet-cat, #f2b46d)" stroke-width="9" stroke-linecap="round" />

      <ellipse cx="66" cy="84" rx="29" ry="25" fill="var(--pet-cat, #f2b46d)" />
      <ellipse cx="88" cy="80" rx="14" ry="22" fill="var(--pet-cat, #f2b46d)" />
      <g stroke="var(--pet-cat-stripe, #d98f3f)" stroke-width="3" stroke-linecap="round">
        <line x1="46" y1="70" x2="54" y2="74" />
        <line x1="43" y1="80" x2="52" y2="82" />
        <line x1="44" y1="90" x2="52" y2="90" />
      </g>
      <ellipse cx="66" cy="105" rx="15" ry="5" fill="var(--pet-cat, #f2b46d)" />

      <!-- planted front leg -->
      <line x1="90" y1="84" x2="90" y2="104" stroke="var(--pet-cat, #f2b46d)" stroke-width="9" stroke-linecap="round" />

      <!-- swatting leg -->
      <line class="swat" x1="98" y1="76" x2="98" y2="98" stroke="var(--pet-cat, #f2b46d)" stroke-width="9" stroke-linecap="round" />

      <!-- head -->
      <g class="cat-head">
        <polygon points="84,44 86,22 100,35" fill="var(--pet-cat, #f2b46d)" stroke="var(--pet-cat, #f2b46d)" stroke-width="3" stroke-linejoin="round" />
        <polygon points="102,35 115,22 118,44" fill="var(--pet-cat, #f2b46d)" stroke="var(--pet-cat, #f2b46d)" stroke-width="3" stroke-linejoin="round" />
        <polygon points="88,40 89,29 97,36" fill="var(--pet-pink, #f4a3b4)" />
        <polygon points="105,36 113,29 114,40" fill="var(--pet-pink, #f4a3b4)" />
        <circle cx="101" cy="53" r="19" fill="var(--pet-cat, #f2b46d)" />
        <g stroke="var(--pet-cat-stripe, #d98f3f)" stroke-width="2.4" stroke-linecap="round">
          <line x1="101" y1="35" x2="101" y2="41" />
          <line x1="94" y1="37" x2="95" y2="42" />
          <line x1="108" y1="37" x2="107" y2="42" />
        </g>
        <g class="blink">
          <circle cx="93" cy="52" r="4.6" fill="#fff" />
          <circle class="pupil" cx="93" cy="52" r="2.6" fill="var(--pet-ink, #3a2c28)" />
        </g>
        <g class="blink">
          <circle cx="109" cy="52" r="4.6" fill="#fff" />
          <circle class="pupil" cx="109" cy="52" r="2.6" fill="var(--pet-ink, #3a2c28)" />
        </g>
        <polygon points="98,58 104,58 101,62" fill="var(--pet-pink, #f4a3b4)" />
        <path d="M101 62 q-3 4 -6 2 M101 62 q3 4 6 2" fill="none" stroke="var(--pet-ink, #3a2c28)" stroke-width="1.5" stroke-linecap="round" />
        <g stroke="var(--pet-ink, #3a2c28)" stroke-width="1.1" stroke-linecap="round" opacity=".5">
          <line x1="72" y1="58" x2="86" y2="60" />
          <line x1="72" y1="64" x2="86" y2="63" />
          <line x1="116" y1="60" x2="130" y2="58" />
          <line x1="116" y1="63" x2="130" y2="64" />
        </g>
      </g>
    </g>
  </svg>
`;

const SCENES = { dog: DOG, cat: CAT };

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      color: var(--pet-label, #5b4a42);
      font: 500 0.95rem/1.2 system-ui, sans-serif;
    }

    svg {
      display: block;
      max-width: 100%;
      height: auto;
      overflow: visible;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
    }

    /* ---------- dog ---------- */
    .dog-fur {
      filter: drop-shadow(0 0 1.2px var(--pet-dog-shade, #b9a98f));
    }
    .dog-bob   { animation: bob 0.3s ease-in-out infinite alternate; }
    /* Legs bend: the thigh swings from the hip, the shin folds at the knee.
       Origins are set per leg with --ox / --oy (user-space coordinates). */
    .thigh, .shin { transform-origin: var(--ox) var(--oy); }
    .thigh { animation: thigh 0.6s ease-in-out infinite; }
    .shin  { animation: shin 0.6s ease-in-out infinite; }
    .leg-b, .leg-b .shin { animation-delay: -0.3s; }
    .tail {
      transform-box: fill-box;
      transform-origin: 0% 100%;
      animation: wag 0.3s ease-in-out infinite alternate;
    }
    .dog-head {
      transform-box: fill-box;
      transform-origin: 20% 100%;
      animation: nod 0.3s ease-in-out infinite alternate;
    }
    .tongue {
      transform-box: fill-box;
      transform-origin: 50% 0;
      animation: pant 0.15s ease-in-out infinite alternate;
    }
    .ground-dash { animation: ground 0.6s linear infinite; }
    .drift  { animation: drift 1.8s ease-in-out infinite alternate; }
    .bounce { animation: bounce 0.6s infinite; }
    .spin {
      transform-box: fill-box;
      transform-origin: center;
      animation: spin 0.6s linear infinite;
    }
    .ball-shadow {
      transform-box: fill-box;
      transform-origin: center;
      animation: ball-shadow 0.6s infinite;
    }

    /* ---------- cat ---------- */
    .travel { animation: travel 1.4s infinite; }
    .roll {
      transform-box: fill-box;
      transform-origin: center;
      animation: roll 1.4s infinite;
    }
    .swat {
      transform-box: fill-box;
      transform-origin: 50% 0;
      animation: swat 1.4s ease-in-out infinite;
    }
    .cat-head {
      transform-box: fill-box;
      transform-origin: 50% 100%;
      animation: lean 1.4s infinite;
    }
    .pupil { animation: look 1.4s infinite; }
    .cat-tail {
      transform-box: fill-box;
      transform-origin: 100% 100%;
      animation: sway 2.2s ease-in-out infinite alternate;
    }
    .cat-body {
      transform-box: fill-box;
      transform-origin: 50% 100%;
      animation: breathe 2.8s ease-in-out infinite alternate;
    }

    .blink {
      transform-box: fill-box;
      transform-origin: center;
      animation: blink 3.6s infinite;
    }

    /* ---------- keyframes: dog ---------- */
    @keyframes bob    { from { transform: translateY(0); } to { transform: translateY(-3px); } }
    @keyframes thigh {
      0%   { transform: rotate(-34deg); }
      50%  { transform: rotate(34deg); }
      100% { transform: rotate(-34deg); }
    }
    @keyframes shin {
      0%   { transform: rotate(4deg); }
      50%  { transform: rotate(8deg); }
      72%  { transform: rotate(62deg); }
      100% { transform: rotate(4deg); }
    }
    @keyframes wag    { from { transform: rotate(-5deg); }  to { transform: rotate(6deg); } }
    @keyframes nod    { from { transform: rotate(-3deg); }  to { transform: rotate(3deg); } }
    @keyframes pant   { from { transform: scaleY(0.8); }    to { transform: scaleY(1.2); } }
    @keyframes ground { to { stroke-dashoffset: 24; } }
    @keyframes drift  { from { transform: translateX(-8px); } to { transform: translateX(6px); } }
    @keyframes bounce {
      0%   { transform: translateY(0);     animation-timing-function: cubic-bezier(0.2, 0.6, 0.4, 1); }
      50%  { transform: translateY(-34px); animation-timing-function: cubic-bezier(0.6, 0, 0.8, 0.4); }
      100% { transform: translateY(0); }
    }
    @keyframes ball-shadow {
      0%, 100% { transform: scaleX(1);   opacity: 0.18; }
      50%      { transform: scaleX(0.5); opacity: 0.09; }
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ---------- keyframes: cat ---------- */
    @keyframes travel {
      0%   { transform: translateX(0);    animation-timing-function: ease-in-out; }
      50%  { transform: translateX(62px); animation-timing-function: ease-in-out; }
      100% { transform: translateX(0); }
    }
    @keyframes roll {
      0%   { transform: rotate(0);      animation-timing-function: ease-in-out; }
      50%  { transform: rotate(400deg); animation-timing-function: ease-in-out; }
      100% { transform: rotate(0); }
    }
    @keyframes swat {
      0%   { transform: rotate(-55deg); }
      14%  { transform: rotate(10deg); }
      88%  { transform: rotate(10deg); }
      100% { transform: rotate(-55deg); }
    }
    @keyframes lean {
      0%   { transform: rotate(3deg);  animation-timing-function: ease-in-out; }
      50%  { transform: rotate(-4deg); animation-timing-function: ease-in-out; }
      100% { transform: rotate(3deg); }
    }
    @keyframes look {
      0%   { transform: translate(1px, 1.5px);   animation-timing-function: ease-in-out; }
      50%  { transform: translate(2.4px, 1.2px); animation-timing-function: ease-in-out; }
      100% { transform: translate(1px, 1.5px); }
    }
    @keyframes sway    { from { transform: rotate(-7deg); } to { transform: rotate(9deg); } }
    @keyframes breathe { from { transform: scaleY(1); }     to { transform: scaleY(1.015); } }
    @keyframes blink {
      0%, 94%, 100% { transform: scaleY(1); }
      97%           { transform: scaleY(0.1); }
    }
    @keyframes fade {
      0%, 100% { opacity: 1; }
      50%      { opacity: 0.55; }
    }

    @media (prefers-reduced-motion: reduce) {
      svg * { animation: none !important; }
      svg   { animation: fade 1.6s ease-in-out infinite !important; }
    }
  </style>

  <div class="stage"></div>
  <span class="label" part="label"></span>
`;

const DEFAULT_PET = 'dog';

class PetPlayLoader extends HTMLElement {
  static get observedAttributes() {
    return ['pet', 'label', 'size', 'hide-label'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).appendChild(template.content.cloneNode(true));
    this._stage = this.shadowRoot.querySelector('.stage');
    this._label = this.shadowRoot.querySelector('.label');
    this._pet = null;
  }

  connectedCallback() {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'status');
    if (!this.hasAttribute('aria-live')) this.setAttribute('aria-live', 'polite');
    this._render();
  }

  attributeChangedCallback() {
    if (this.isConnected) this._render();
  }

  _render() {
    const wanted = this.getAttribute('pet');
    const pet = SCENES[wanted] ? wanted : DEFAULT_PET;
    if (pet !== this._pet) {
      this._pet = pet;
      this._stage.innerHTML = SCENES[pet];
    }
    const size = Number(this.getAttribute('size')) || 240;
    this._stage.firstElementChild.style.width = size + 'px';

    this._label.textContent = this.getAttribute('label') ?? 'Loading…';
    this._label.classList.toggle('sr-only', this.hasAttribute('hide-label'));
  }
}

if (!customElements.get('pet-play-loader')) {
  customElements.define('pet-play-loader', PetPlayLoader);
}
