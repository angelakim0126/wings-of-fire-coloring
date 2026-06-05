const TRIBES = [
  "MudWing", "SandWing", "SkyWing", "SeaWing", "IceWing",
  "RainWing", "NightWing", "SilkWing", "HiveWing", "LeafWing",
  "Hybrid", "WildWing", "Scavenger"
];

// Swatch labels per tribe. Scavengers are humans, so their labels match
// a person's body parts rather than a dragon's scales.
const SWATCH_LABELS = {
  default: { card: ["body", "tummy", "markings", "eyes"],
             modal: ["body", "tummy", "markings", "eyes"] },
  Scavenger: { card: ["skin", "clothes", "hair", "eyes"],
               modal: ["skin", "clothes", "hair", "eyes"] }
};

function swatchLabels(tribe, where) {
  const key = SWATCH_LABELS[tribe] ? tribe : "default";
  return SWATCH_LABELS[key][where];
}

const DRAGON_GLYPH = "🐉";
const FANDOM_BASE = "https://wingsoffire.fandom.com/wiki/Special:FilePath/";

// Dragons hidden from the default grid because their color data is least
// reliable (color-shifters, side characters, Pantala-arc dragons, or already
// flagged as wrong). They appear only when typed into the name search.
// Previously hid dragons whose colors were unverified. Most have since been
// verified via ChatGPT batches or explicit user confirmation, so this set is
// now empty. Add a name here if a dragon's data is genuinely unreliable and
// should be hidden from the default grid (still findable via name search).
const LOW_CONFIDENCE = new Set([]);

let characters = [];
let activeTribes = new Set();
let searchTerm = "";

async function loadCharacters() {
  const res = await fetch("characters.json");
  characters = await res.json();
  characters.sort((a, b) => a.name.localeCompare(b.name));
  render();
}

function imageCandidates(character) {
  // Explicit opt-out: force the colored placeholder (used when the wiki's
  // canonical filename resolves to fan-edits / memes / inappropriate art).
  if (character.skip_image === true) {
    return [];
  }
  if (character.image && character.image.trim() !== "") {
    return [character.image];
  }
  const overrides = character.image_filename ? [character.image_filename] : [];
  const base = character.name.replace(/ /g, "_");
  const guesses = [
    `${base}TemplateBas.png`,    // Wiki "Reference" template image (newer pattern)
    `${base}_canon_2.png`,
    `${base}_canon.png`,
    `${base}_canon_3.png`,
    `${base}_canon_4.png`,
    `${base}_canon_5.png`,
    `${base}.png`,
  ];
  return [...overrides, ...guesses].map(f =>
    f.startsWith("http") ? f : `${FANDOM_BASE}${f}`
  );
}

function setTribeVars(el, character) {
  el.style.setProperty("--main-color", character.main_color);
  el.style.setProperty("--secondary-color", character.secondary_color);
  el.style.setProperty("--accent-color", character.accent_color);
  el.style.setProperty("--eye-color", character.eye_color);
  el.style.setProperty("--tribe-color", `var(--${character.tribe})`);
}

// Cute front-facing baby dragon, Toothless-inspired (per reference image).
// Big rounded ears/horns angled outward, large sparkly eyes, signature
// vertical dot-row on the forehead, bat-wings peeking out behind, sitting
// pose with two front feet visible.
const DRAGON_SVG = `
<svg class="dragon-svg" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <!-- Wings (left + right, behind body) -->
  <path d="M 60 130 Q 28 122 22 150 Q 22 178 56 178 Q 75 170 78 145 Z" fill="var(--secondary-color)"/>
  <path d="M 180 130 Q 212 122 218 150 Q 218 178 184 178 Q 165 170 162 145 Z" fill="var(--secondary-color)"/>
  <!-- Wing fold lines -->
  <path d="M 50 134 Q 42 158 52 175" stroke="var(--main-color)" stroke-width="1.2" fill="none" opacity="0.3"/>
  <path d="M 190 134 Q 198 158 188 175" stroke="var(--main-color)" stroke-width="1.2" fill="none" opacity="0.3"/>

  <!-- Body (chubby sitting) -->
  <ellipse cx="120" cy="168" rx="55" ry="46" fill="var(--main-color)"/>
  <!-- Belly highlight -->
  <ellipse cx="120" cy="180" rx="36" ry="28" fill="var(--secondary-color)" opacity="0.55"/>

  <!-- Tail peeking around right side -->
  <path d="M 172 200 Q 202 212 208 188 L 202 182"
        stroke="var(--main-color)" stroke-width="11" stroke-linecap="round" fill="none"/>
  <path d="M 199 178 L 213 174 L 207 192 Z" fill="var(--accent-color)" opacity="0.85"/>

  <!-- Ears/horns (rounded, angled outward) -->
  <ellipse cx="72" cy="58" rx="17" ry="32" fill="var(--main-color)" transform="rotate(-22 72 58)"/>
  <ellipse cx="168" cy="58" rx="17" ry="32" fill="var(--main-color)" transform="rotate(22 168 58)"/>
  <!-- Inner ear (lighter) -->
  <ellipse cx="72" cy="62" rx="8" ry="20" fill="var(--secondary-color)" opacity="0.7" transform="rotate(-22 72 62)"/>
  <ellipse cx="168" cy="62" rx="8" ry="20" fill="var(--secondary-color)" opacity="0.7" transform="rotate(22 168 62)"/>

  <!-- Head (large round, front-facing) -->
  <ellipse cx="120" cy="108" rx="56" ry="53" fill="var(--main-color)"/>

  <!-- Forehead dot-row (Toothless signature) -->
  <circle cx="120" cy="62" r="3.5" fill="var(--accent-color)" opacity="0.78"/>
  <circle cx="120" cy="73" r="3" fill="var(--accent-color)" opacity="0.66"/>
  <circle cx="120" cy="83" r="2.5" fill="var(--accent-color)" opacity="0.55"/>
  <circle cx="120" cy="91" r="2" fill="var(--accent-color)" opacity="0.45"/>

  <!-- Eye whites (huge) -->
  <ellipse cx="96" cy="112" rx="17" ry="22" fill="#ffffff"/>
  <ellipse cx="144" cy="112" rx="17" ry="22" fill="#ffffff"/>

  <!-- Pupils (large) -->
  <ellipse cx="96" cy="117" rx="11" ry="16" fill="#1c1c1c"/>
  <ellipse cx="144" cy="117" rx="11" ry="16" fill="#1c1c1c"/>

  <!-- Eye sparkles (big top) -->
  <ellipse cx="91" cy="108" rx="4.5" ry="6" fill="white"/>
  <ellipse cx="139" cy="108" rx="4.5" ry="6" fill="white"/>
  <!-- Eye sparkles (small bottom) -->
  <circle cx="101" cy="125" r="2.2" fill="white" opacity="0.85"/>
  <circle cx="149" cy="125" r="2.2" fill="white" opacity="0.85"/>

  <!-- Subtle nose hint -->
  <ellipse cx="120" cy="142" rx="7" ry="3.5" fill="var(--secondary-color)" opacity="0.4"/>

  <!-- Closed smile -->
  <path d="M 110 148 Q 120 154 130 148" stroke="#1c1c1c" stroke-width="2"
        stroke-linecap="round" fill="none"/>

  <!-- Front feet (paws peeking from under body) -->
  <ellipse cx="95" cy="215" rx="15" ry="11" fill="var(--main-color)"/>
  <ellipse cx="145" cy="215" rx="15" ry="11" fill="var(--main-color)"/>

  <!-- Toe claws -->
  <ellipse cx="87" cy="221" rx="2.4" ry="3" fill="var(--accent-color)" opacity="0.55"/>
  <ellipse cx="95" cy="224" rx="2.4" ry="3" fill="var(--accent-color)" opacity="0.55"/>
  <ellipse cx="103" cy="221" rx="2.4" ry="3" fill="var(--accent-color)" opacity="0.55"/>
  <ellipse cx="137" cy="221" rx="2.4" ry="3" fill="var(--accent-color)" opacity="0.55"/>
  <ellipse cx="145" cy="224" rx="2.4" ry="3" fill="var(--accent-color)" opacity="0.55"/>
  <ellipse cx="153" cy="221" rx="2.4" ry="3" fill="var(--accent-color)" opacity="0.55"/>
</svg>`;

// Chibi scavenger (human child) SVG, colored from the character's palette:
//   main = skin tone, secondary = clothing, accent = hair, eye = iris color.
// Used as the placeholder for Scavenger-tribe characters who have no image.
const SCAVENGER_SVG = `
<svg class="dragon-svg" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <!-- Hair back (frames head) -->
  <ellipse cx="120" cy="95" rx="50" ry="52" fill="var(--accent-color)"/>

  <!-- Head -->
  <ellipse cx="120" cy="100" rx="42" ry="46" fill="var(--main-color)"/>

  <!-- Hair bangs (front) -->
  <path d="M 80 76 Q 100 60 120 65 Q 140 60 160 76 Q 160 90 148 88 Q 130 80 110 88 Q 92 90 80 88 Z"
        fill="var(--accent-color)"/>

  <!-- Ears -->
  <ellipse cx="80" cy="108" rx="5" ry="9" fill="var(--main-color)"/>
  <ellipse cx="160" cy="108" rx="5" ry="9" fill="var(--main-color)"/>

  <!-- Eye whites -->
  <ellipse cx="103" cy="106" rx="8" ry="10" fill="#ffffff"/>
  <ellipse cx="137" cy="106" rx="8" ry="10" fill="#ffffff"/>

  <!-- Iris (eye color) -->
  <ellipse cx="103" cy="108" rx="5.5" ry="7.5" fill="var(--eye-color)"/>
  <ellipse cx="137" cy="108" rx="5.5" ry="7.5" fill="var(--eye-color)"/>

  <!-- Pupils -->
  <ellipse cx="103" cy="109" rx="2.4" ry="4" fill="#1c1c1c"/>
  <ellipse cx="137" cy="109" rx="2.4" ry="4" fill="#1c1c1c"/>

  <!-- Eye sparkles -->
  <circle cx="101" cy="104" r="1.6" fill="white"/>
  <circle cx="135" cy="104" r="1.6" fill="white"/>

  <!-- Cheek blush -->
  <ellipse cx="90" cy="120" rx="6.5" ry="3.5" fill="#ff9090" opacity="0.5"/>
  <ellipse cx="150" cy="120" rx="6.5" ry="3.5" fill="#ff9090" opacity="0.5"/>

  <!-- Nose hint -->
  <ellipse cx="120" cy="120" rx="2.5" ry="1.6" fill="var(--accent-color)" opacity="0.35"/>

  <!-- Smile -->
  <path d="M 110 132 Q 120 138 130 132" stroke="#1c1c1c" stroke-width="2"
        stroke-linecap="round" fill="none"/>

  <!-- Neck -->
  <rect x="108" y="142" width="24" height="14" fill="var(--main-color)"/>

  <!-- Shirt/body -->
  <path d="M 70 168 Q 70 158 100 156 L 140 156 Q 170 158 170 168 L 170 215 Q 120 220 70 215 Z"
        fill="var(--secondary-color)"/>

  <!-- Arms (skin) -->
  <ellipse cx="78" cy="180" rx="10" ry="22" fill="var(--main-color)" transform="rotate(12 78 180)"/>
  <ellipse cx="162" cy="180" rx="10" ry="22" fill="var(--main-color)" transform="rotate(-12 162 180)"/>

  <!-- Hands -->
  <circle cx="72" cy="205" r="8.5" fill="var(--main-color)"/>
  <circle cx="168" cy="205" r="8.5" fill="var(--main-color)"/>

  <!-- Pants/legs -->
  <ellipse cx="105" cy="226" rx="13" ry="12" fill="var(--accent-color)"/>
  <ellipse cx="135" cy="226" rx="13" ry="12" fill="var(--accent-color)"/>
</svg>`;

function makePlaceholder(character) {
  const wrap = document.createElement("div");
  wrap.className = "placeholder-content";
  const svgWrap = document.createElement("div");
  svgWrap.className = "dragon-svg-wrap";
  svgWrap.innerHTML = (character.tribe === "Scavenger") ? SCAVENGER_SVG : DRAGON_SVG;
  const label = document.createElement("span");
  label.className = "placeholder-label";
  label.textContent = character.name;
  wrap.appendChild(svgWrap);
  wrap.appendChild(label);
  return wrap;
}

// Quality filters for fetched images. Wings of Fire wiki contains both canon
// dragon art and decorative banners/logos under similar filenames; these checks
// reject the latter so we don't display "AUKLET"-style text images.
const MIN_DIMENSION = 250;       // anything smaller is a thumbnail
const MAX_ASPECT_RATIO = 2.2;    // wider than this is likely a banner/logo
const MIN_ASPECT_RATIO = 0.4;    // taller than this is likely a column-strip

function passesQualityCheck(img) {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  if (!w || !h) return false;
  if (w < MIN_DIMENSION || h < MIN_DIMENSION) return false;
  const ratio = w / h;
  if (ratio > MAX_ASPECT_RATIO) return false;
  if (ratio < MIN_ASPECT_RATIO) return false;
  return true;
}

function makeImageWithFallback(character, wrapClass) {
  const wrap = document.createElement("div");
  wrap.className = wrapClass;
  setTribeVars(wrap, character);

  // Click-to-enlarge: clicking the image opens a full-screen lightbox.
  // Clicking the placeholder (no real image) does nothing — the card's
  // own click handler will open the details modal.
  wrap.addEventListener("click", (e) => {
    const img = wrap.querySelector("img");
    if (img && img.src) {
      e.stopPropagation();
      openImageLightbox(character, img.src);
    }
  });

  const candidates = imageCandidates(character);
  let attempt = 0;

  const tryNext = () => {
    if (attempt >= candidates.length) {
      wrap.replaceChildren(makePlaceholder(character));
      return;
    }
    // Preload off-DOM, validate dimensions/aspect, only then mount.
    const probe = new Image();
    probe.referrerPolicy = "no-referrer";
    probe.onerror = () => {
      attempt++;
      tryNext();
    };
    probe.onload = () => {
      if (!passesQualityCheck(probe)) {
        attempt++;
        tryNext();
        return;
      }
      const img = document.createElement("img");
      img.alt = `${character.name} the ${character.tribe}`;
      img.src = probe.src;
      img.referrerPolicy = "no-referrer";
      wrap.replaceChildren(img);
    };
    probe.src = candidates[attempt];
  };
  tryNext();

  return wrap;
}

function openImageLightbox(character, imageSrc) {
  closeImageLightbox();

  const backdrop = document.createElement("div");
  backdrop.className = "lightbox-backdrop";
  backdrop.id = "lightbox-backdrop";
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeImageLightbox();
  });

  const container = document.createElement("div");
  container.className = "lightbox-container";

  const closeBtn = document.createElement("button");
  closeBtn.className = "lightbox-close";
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.textContent = "×";
  closeBtn.addEventListener("click", closeImageLightbox);

  const img = document.createElement("img");
  img.className = "lightbox-image";
  img.src = imageSrc;
  img.alt = `${character.name} the ${character.tribe}`;
  img.referrerPolicy = "no-referrer";

  const caption = document.createElement("div");
  caption.className = "lightbox-caption";
  caption.textContent = character.name;

  container.appendChild(closeBtn);
  container.appendChild(img);
  container.appendChild(caption);
  backdrop.appendChild(container);
  document.body.appendChild(backdrop);
  document.body.style.overflow = "hidden";

  document.addEventListener("keydown", lightboxEscClose);
}

function closeImageLightbox() {
  const existing = document.getElementById("lightbox-backdrop");
  if (existing) existing.remove();
  document.removeEventListener("keydown", lightboxEscClose);
  // Only restore body scroll if no other modal is also open
  if (!document.getElementById("modal-backdrop")) {
    document.body.style.overflow = "";
  }
}

function lightboxEscClose(e) {
  if (e.key === "Escape") closeImageLightbox();
}

function buildTribeFilters() {
  const container = document.getElementById("tribe-filters");
  TRIBES.forEach(tribe => {
    const chip = document.createElement("button");
    chip.className = "tribe-chip";
    chip.textContent = tribe;
    chip.style.setProperty("--chip-color", `var(--${tribe})`);
    chip.setAttribute("aria-pressed", "false");
    chip.addEventListener("click", () => {
      if (activeTribes.has(tribe)) {
        activeTribes.delete(tribe);
        chip.classList.remove("active");
        chip.setAttribute("aria-pressed", "false");
      } else {
        activeTribes.add(tribe);
        chip.classList.add("active");
        chip.setAttribute("aria-pressed", "true");
      }
      render();
    });
    container.appendChild(chip);
  });
}

function filtered() {
  const term = searchTerm.trim().toLowerCase();
  const isSearching = term.length > 0;
  return characters.filter(c => {
    if (!isSearching && LOW_CONFIDENCE.has(c.name)) return false;
    if (activeTribes.size > 0 && !activeTribes.has(c.tribe)) return false;
    if (term && !c.name.toLowerCase().includes(term)) return false;
    return true;
  });
}

function makeSwatch(color, label) {
  const s = document.createElement("div");
  s.className = "color-swatch";
  s.style.background = color;
  s.setAttribute("data-label", label);
  s.setAttribute("title", `${label}: ${color}`);
  return s;
}

function makeCard(character) {
  const card = document.createElement("article");
  card.className = "card";
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");
  card.setAttribute("aria-label", `${character.name}, ${character.tribe}`);
  setTribeVars(card, character);

  const banner = document.createElement("div");
  banner.className = "card-banner";

  const imageWrap = makeImageWithFallback(character, "card-image-wrap");

  const body = document.createElement("div");
  body.className = "card-body";

  const name = document.createElement("h2");
  name.className = "card-name";
  name.textContent = character.name;

  const badge = document.createElement("span");
  badge.className = "card-tribe-badge";
  badge.textContent = character.tribe;

  const colorRow = document.createElement("div");
  colorRow.className = "color-row";
  const cardLbl = swatchLabels(character.tribe, "card");
  colorRow.appendChild(makeSwatch(character.main_color, cardLbl[0]));
  colorRow.appendChild(makeSwatch(character.secondary_color, cardLbl[1]));
  colorRow.appendChild(makeSwatch(character.accent_color, cardLbl[2]));
  colorRow.appendChild(makeSwatch(character.eye_color, cardLbl[3]));

  body.appendChild(name);
  body.appendChild(badge);
  body.appendChild(colorRow);

  card.appendChild(banner);
  card.appendChild(imageWrap);
  card.appendChild(body);

  card.addEventListener("click", () => openModal(character));
  card.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openModal(character);
    }
  });

  return card;
}

function render() {
  const container = document.getElementById("cards");
  container.innerHTML = "";
  const list = filtered();

  updateResultCount(list.length);

  if (list.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    const g = document.createElement("span");
    g.className = "empty-glyph";
    g.textContent = "🪺";
    const msg = document.createElement("div");
    msg.textContent = "No dragons match. Try a different name or tribe.";
    empty.appendChild(g);
    empty.appendChild(msg);
    container.appendChild(empty);
    return;
  }
  const frag = document.createDocumentFragment();
  list.forEach(c => frag.appendChild(makeCard(c)));
  container.appendChild(frag);
}

function updateResultCount(n) {
  let el = document.getElementById("result-count");
  if (!el) {
    el = document.createElement("p");
    el.id = "result-count";
    el.className = "result-count";
    document.querySelector(".controls").appendChild(el);
  }
  const total = characters.length;
  const defaultTotal = total - LOW_CONFIDENCE.size;
  const isSearching = searchTerm.trim().length > 0;

  if (!isSearching && activeTribes.size === 0) {
    el.textContent = `${n} dragons — type a name to find more`;
  } else if (isSearching) {
    el.textContent = `Showing ${n} of ${total} dragons`;
  } else {
    el.textContent = `Showing ${n} of ${defaultTotal} dragons`;
  }
}

function openModal(character) {
  closeModal();
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop open";
  backdrop.id = "modal-backdrop";
  backdrop.addEventListener("click", e => {
    if (e.target === backdrop) closeModal();
  });

  const modal = document.createElement("div");
  modal.className = "modal";
  setTribeVars(modal, character);

  const banner = document.createElement("div");
  banner.className = "modal-banner";

  const closeBtn = document.createElement("button");
  closeBtn.className = "modal-close";
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.textContent = "×";
  closeBtn.addEventListener("click", closeModal);

  const imageWrap = makeImageWithFallback(character, "modal-image-wrap");

  const body = document.createElement("div");
  body.className = "modal-body";

  const name = document.createElement("h2");
  name.className = "modal-name";
  name.textContent = character.name;

  const badge = document.createElement("span");
  badge.className = "modal-tribe-badge";
  badge.textContent = character.tribe;

  const colorSection = document.createElement("div");
  colorSection.className = "color-section";
  const colorTitle = document.createElement("h3");
  colorTitle.className = "color-section-title";
  colorTitle.textContent = "Colors to use";
  const colorRow = document.createElement("div");
  colorRow.className = "color-row";
  const modalLbl = swatchLabels(character.tribe, "modal");
  colorRow.appendChild(makeSwatch(character.main_color, modalLbl[0]));
  colorRow.appendChild(makeSwatch(character.secondary_color, modalLbl[1]));
  colorRow.appendChild(makeSwatch(character.accent_color, modalLbl[2]));
  colorRow.appendChild(makeSwatch(character.eye_color, modalLbl[3]));
  colorSection.appendChild(colorTitle);
  colorSection.appendChild(colorRow);

  const detail = document.createElement("p");
  detail.className = "main-detail";
  detail.textContent = character.main_detail || character.description;

  body.appendChild(name);
  body.appendChild(badge);
  body.appendChild(detail);
  body.appendChild(colorSection);

  if (Array.isArray(character.fun_facts) && character.fun_facts.length) {
    const factsSection = document.createElement("section");
    factsSection.className = "info-section";
    const factsTitle = document.createElement("h3");
    factsTitle.className = "info-section-title";
    factsTitle.textContent = "Fun facts";
    const factsList = document.createElement("ul");
    factsList.className = "fun-facts";
    character.fun_facts.forEach(fact => {
      const li = document.createElement("li");
      li.textContent = fact;
      factsList.appendChild(li);
    });
    factsSection.appendChild(factsTitle);
    factsSection.appendChild(factsList);
    body.appendChild(factsSection);
  }

  if (Array.isArray(character.books) && character.books.length) {
    const booksSection = document.createElement("section");
    booksSection.className = "info-section";
    const booksTitle = document.createElement("h3");
    booksTitle.className = "info-section-title";
    booksTitle.textContent = "Appears in";
    const booksList = document.createElement("div");
    booksList.className = "book-tags";
    character.books.forEach(book => {
      const tag = document.createElement("span");
      tag.className = "book-tag";
      tag.textContent = book;
      booksList.appendChild(tag);
    });
    booksSection.appendChild(booksTitle);
    booksSection.appendChild(booksList);
    body.appendChild(booksSection);
  }

  if (character.special_features) {
    const special = document.createElement("p");
    special.className = "special";
    special.textContent = character.special_features;
    body.appendChild(special);
  }

  const wiki = document.createElement("a");
  wiki.className = "wiki-link";
  wiki.href = character.wiki_url;
  wiki.target = "_blank";
  wiki.rel = "noopener noreferrer";
  wiki.textContent = "More on the Wings of Fire Wiki →";
  body.appendChild(wiki);

  modal.appendChild(banner);
  modal.appendChild(closeBtn);
  modal.appendChild(imageWrap);
  modal.appendChild(body);
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
  document.body.style.overflow = "hidden";

  document.addEventListener("keydown", escClose);
}

function closeModal() {
  const existing = document.getElementById("modal-backdrop");
  if (existing) existing.remove();
  document.body.style.overflow = "";
  document.removeEventListener("keydown", escClose);
}

function escClose(e) {
  if (e.key === "Escape") closeModal();
}

document.getElementById("search").addEventListener("input", e => {
  searchTerm = e.target.value;
  render();
});

buildTribeFilters();
loadCharacters();
