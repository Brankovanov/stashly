/**
 * <pet-loader>: a cat and a dog bat a little ball of thread back and forth.
 * Vanilla web component (Shadow DOM), no dependencies. Two dog variants:
 * dog="samoyed" (default) or dog="brown".
 *
 *   <pet-loader label="Fetching your stash…" size="200"></pet-loader>
 *   <pet-loader hide-label dog="brown"></pet-loader>
 *
 * Theme with CSS variables: --pet-cat, --pet-cat-stripe, --pet-dog, --pet-dog-ear,
 * --pet-dog-shade, --pet-muzzle, --pet-ball, --pet-pink, --pet-ink, --pet-label
 */

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
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
    }

    /* Ball: one pass left to right takes 1.2s, bounces twice per pass */
    .travel {
      animation: travel 1.2s linear infinite alternate;
    }
    .bounce {
      animation: bounce 0.6s infinite;
    }
    .spin {
      transform-box: fill-box;
      transform-origin: center;
      animation: spin 1.2s linear infinite;
    }
    .shadow {
      transform-box: fill-box;
      transform-origin: center;
      animation: shadow 0.6s infinite;
    }

    /* Pets lean towards the ball and follow it with their eyes */
    .cat,
    .dog {
      transform-box: fill-box;
      transform-origin: 50% 100%;
      animation-duration: 1.2s;
      animation-timing-function: ease-in-out;
      animation-iteration-count: infinite;
      animation-direction: alternate;
    }
    .cat { animation-name: lean-cat; }
    .dog {
      animation-name: lean-dog;
      filter: drop-shadow(0 0 1.2px var(--pet-dog-shade, #b9a98f));
    }
    .dog-brown { filter: none; }
    .dog-brown,
    :host([dog="brown"]) .dog-samoyed { display: none; }
    :host([dog="brown"]) .dog-brown { display: inline; }
    .pupil {
      animation-duration: 1.2s;
      animation-timing-function: ease-in-out;
      animation-iteration-count: infinite;
      animation-direction: alternate;
    }
    .pupil-cat { animation-name: look-cat; }
    .pupil-dog { animation-name: look-dog; }
    .blink {
      transform-box: fill-box;
      transform-origin: center;
      animation: blink 3.6s infinite;
    }
    .tongue {
      transform-box: fill-box;
      transform-origin: 50% 0;
      animation: pant 0.6s ease-in-out infinite alternate;
    }

    @keyframes travel {
      from { transform: translateX(-26px); }
      to   { transform: translateX(26px); }
    }
    @keyframes bounce {
      0%   { transform: translateY(0);     animation-timing-function: cubic-bezier(0.2, 0.6, 0.4, 1); }
      50%  { transform: translateY(-40px); animation-timing-function: cubic-bezier(0.6, 0, 0.8, 0.4); }
      100% { transform: translateY(0); }
    }
    @keyframes shadow {
      0%, 100% { transform: scaleX(1);   opacity: 1; }
      50%      { transform: scaleX(0.5); opacity: 0.5; }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes lean-cat {
      from { transform: rotate(8deg); }
      to   { transform: rotate(-3deg); }
    }
    @keyframes lean-dog {
      from { transform: rotate(3deg); }
      to   { transform: rotate(-8deg); }
    }
    @keyframes look-cat {
      from { transform: translateX(1px); }
      to   { transform: translateX(2.5px); }
    }
    @keyframes look-dog {
      from { transform: translateX(-2.5px); }
      to   { transform: translateX(-1px); }
    }
    @keyframes blink {
      0%, 94%, 100% { transform: scaleY(1); }
      97%           { transform: scaleY(0.1); }
    }
    @keyframes pant {
      from { transform: scaleY(0.85); }
      to   { transform: scaleY(1.15); }
    }
    @keyframes fade {
      0%, 100% { opacity: 1; }
      50%      { opacity: 0.5; }
    }

    @media (prefers-reduced-motion: reduce) {
      svg * { animation: none !important; }
      svg   { animation: fade 1.6s ease-in-out infinite !important; }
    }
  </style>

  <svg viewBox="0 0 240 110" aria-hidden="true" focusable="false">
    <!-- Cat -->
    <g class="cat">
      <polygon points="33,66 37,38 56,56" fill="var(--pet-cat, #f2b46d)" />
      <polygon points="83,66 79,38 60,56" fill="var(--pet-cat, #f2b46d)" />
      <polygon points="39,60 40,46 51,56" fill="var(--pet-pink, #f4a3b4)" />
      <polygon points="77,60 76,46 65,56" fill="var(--pet-pink, #f4a3b4)" />
      <circle cx="58" cy="84" r="30" fill="var(--pet-cat, #f2b46d)" />
      <g stroke="var(--pet-cat-stripe, #d98f3f)" stroke-width="3" stroke-linecap="round">
        <line x1="58" y1="55" x2="58" y2="62" />
        <line x1="49" y1="57" x2="51" y2="63" />
        <line x1="67" y1="57" x2="65" y2="63" />
      </g>
      <g class="blink">
        <circle cx="47" cy="82" r="5.5" fill="#fff" />
        <circle class="pupil pupil-cat" cx="47" cy="82" r="3" fill="var(--pet-ink, #3a2c28)" />
      </g>
      <g class="blink">
        <circle cx="69" cy="82" r="5.5" fill="#fff" />
        <circle class="pupil pupil-cat" cx="69" cy="82" r="3" fill="var(--pet-ink, #3a2c28)" />
      </g>
      <polygon points="55,89 61,89 58,93" fill="var(--pet-pink, #f4a3b4)" />
      <path d="M58 93 q-3 4 -6 2 M58 93 q3 4 6 2" fill="none" stroke="var(--pet-ink, #3a2c28)" stroke-width="1.6" stroke-linecap="round" />
      <g stroke="var(--pet-ink, #3a2c28)" stroke-width="1.2" stroke-linecap="round" opacity=".55">
        <line x1="28" y1="88" x2="42" y2="90" />
        <line x1="28" y1="95" x2="42" y2="94" />
        <line x1="74" y1="90" x2="88" y2="88" />
        <line x1="74" y1="94" x2="88" y2="95" />
      </g>
    </g>

    <!-- Dog (brown) -->
    <g class="dog dog-brown">
      <ellipse cx="150" cy="80" rx="11" ry="22" transform="rotate(15 150 80)" fill="var(--pet-dog-ear, #a9703a)" />
      <ellipse cx="214" cy="80" rx="11" ry="22" transform="rotate(-15 214 80)" fill="var(--pet-dog-ear, #a9703a)" />
      <ellipse cx="182" cy="84" rx="30" ry="29" fill="var(--pet-dog-brown, #dba868)" />
      <ellipse cx="182" cy="94" rx="15" ry="11" fill="var(--pet-muzzle-brown, #fbefd9)" />
      <g class="blink">
        <circle cx="170" cy="78" r="5.5" fill="#fff" />
        <circle class="pupil pupil-dog" cx="170" cy="78" r="3" fill="var(--pet-ink, #3a2c28)" />
      </g>
      <g class="blink">
        <circle cx="194" cy="78" r="5.5" fill="#fff" />
        <circle class="pupil pupil-dog" cx="194" cy="78" r="3" fill="var(--pet-ink, #3a2c28)" />
      </g>
      <ellipse cx="182" cy="89" rx="6" ry="4.5" fill="var(--pet-ink, #3a2c28)" />
      <ellipse class="tongue" cx="182" cy="102" rx="4" ry="5" fill="var(--pet-pink, #f4a3b4)" />
      <path d="M182 93 v4 M182 97 q-5 4 -9 0 M182 97 q5 4 9 0" fill="none" stroke="var(--pet-ink, #3a2c28)" stroke-width="1.6" stroke-linecap="round" />
    </g>
    <!-- Dog (Samoyed) -->
    <g class="dog dog-samoyed">
      <polygon points="160,62 163,34 180,54" fill="var(--pet-dog, #fdfaf3)" stroke="var(--pet-dog, #fdfaf3)" stroke-width="4" stroke-linejoin="round" />
      <polygon points="204,62 201,34 184,54" fill="var(--pet-dog, #fdfaf3)" stroke="var(--pet-dog, #fdfaf3)" stroke-width="4" stroke-linejoin="round" />
      <polygon points="166,58 167,44 175,53" fill="var(--pet-pink, #f4a3b4)" opacity=".7" />
      <polygon points="198,58 197,44 189,53" fill="var(--pet-pink, #f4a3b4)" opacity=".7" />
      <g fill="var(--pet-dog, #fdfaf3)">
        <ellipse cx="182" cy="84" rx="30" ry="29" />
        <circle cx="172" cy="56" r="8" />
        <circle cx="192" cy="56" r="8" />
        <circle cx="153" cy="86" r="9" />
        <circle cx="150" cy="97" r="9" />
        <circle cx="158" cy="105" r="9" />
        <circle cx="211" cy="86" r="9" />
        <circle cx="214" cy="97" r="9" />
        <circle cx="206" cy="105" r="9" />
      </g>
      <ellipse cx="182" cy="95" rx="14" ry="10" fill="var(--pet-muzzle, #f3ebdd)" />
      <g class="blink">
        <circle cx="170" cy="78" r="4.8" fill="#fff" />
        <circle class="pupil pupil-dog" cx="170" cy="78" r="3" fill="var(--pet-ink, #3a2c28)" />
      </g>
      <g class="blink">
        <circle cx="194" cy="78" r="4.8" fill="#fff" />
        <circle class="pupil pupil-dog" cx="194" cy="78" r="3" fill="var(--pet-ink, #3a2c28)" />
      </g>
      <ellipse cx="182" cy="88" rx="5.5" ry="4" fill="var(--pet-ink, #3a2c28)" />
      <ellipse class="tongue" cx="182" cy="101" rx="4" ry="5" fill="var(--pet-pink, #f4a3b4)" />
      <path d="M182 92 v3 M182 95 q-6 6 -13 -3 M182 95 q6 6 13 -3" fill="none" stroke="var(--pet-ink, #3a2c28)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
    </g>

    <!-- Ball of thread: horizontal travel > bounce > spin -->
    <g class="travel">
      <ellipse class="shadow" cx="120" cy="106" rx="8" ry="2" fill="var(--pet-ink, #3a2c28)" opacity=".18" />
      <g class="bounce">
        <g class="spin">
          <circle cx="120" cy="88" r="9" fill="var(--pet-ball, #ff7a90)" />
          <path d="M112.5 85 q7.5 5 15 -1 M112 91 q8 -4 16 1 M118 79.5 q6 5 2 17" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".7" />
        </g>
      </g>
    </g>
  </svg>
  <span class="label" part="label"></span>
`;

const DEFAULT_LABEL = 'Loading…';
const DEFAULT_SIZE = 180;

class PetLoader extends HTMLElement {
  static get observedAttributes() {
    return ['label', 'size', 'hide-label'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).appendChild(template.content.cloneNode(true));
    this._svg = this.shadowRoot.querySelector('svg');
    this._label = this.shadowRoot.querySelector('.label');
  }

  connectedCallback() {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'status');
    if (!this.hasAttribute('aria-live')) this.setAttribute('aria-live', 'polite');
    this._render();
  }

  attributeChangedCallback() {
    this._render();
  }

  _render() {
    const size = Number(this.getAttribute('size')) || DEFAULT_SIZE;
    this._svg.style.width = size + 'px';
    this._label.textContent = this.getAttribute('label') ?? DEFAULT_LABEL;
    this._label.classList.toggle('sr-only', this.hasAttribute('hide-label'));
  }
}

if (!customElements.get('pet-loader')) {
  customElements.define('pet-loader', PetLoader);
}

export { PetLoader };
