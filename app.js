const TRIBES = [
  "MudWing", "SandWing", "SkyWing", "SeaWing", "IceWing",
  "RainWing", "NightWing", "SilkWing", "HiveWing", "LeafWing",
  "Hybrid"
];

// Swatch labels per tribe — dragons use scale-based labels; if a future
// non-dragon character is added (scavenger, etc.) the label set can be
// extended here.
const SWATCH_LABELS = {
  default: { card: ["body", "tummy", "markings", "eyes"],
             modal: ["body", "tummy", "markings", "eyes"] }
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
const LOW_CONFIDENCE = new Set([
  "Auklet", "Mangrove", "Jambu", "Tamarin",
  "Pike", "Cliff", "Bumblebee", "Swordtail", "Willow"
]);

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
  el.style.setProperty("--tribe-color", `var(--${character.tribe})`);
}

// Cute baby-dragon silhouette SVG, colored from the character's palette.
// Used as the placeholder when no canon image is available (or skipped).
const DRAGON_SVG = `
<svg class="dragon-svg" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <!-- Tail wrapping behind/around -->
  <path d="M 178 178 Q 218 178 218 140 Q 218 108 188 108 L 175 108"
        stroke="var(--main-color)" stroke-width="18" stroke-linecap="round" fill="none"/>
  <path d="M 222 122 L 238 110 L 232 138 Z" fill="var(--accent-color)"/>
  <!-- Wings folded behind body -->
  <path d="M 70 112 Q 42 88 56 56 Q 80 74 90 108 Z" fill="var(--secondary-color)"/>
  <path d="M 170 112 Q 198 88 184 56 Q 160 74 150 108 Z" fill="var(--secondary-color)"/>
  <!-- Body -->
  <ellipse cx="120" cy="162" rx="62" ry="46" fill="var(--main-color)"/>
  <!-- Belly highlight -->
  <ellipse cx="120" cy="172" rx="40" ry="26" fill="var(--secondary-color)" opacity="0.7"/>
  <!-- Belly accent dots -->
  <circle cx="104" cy="172" r="3" fill="var(--accent-color)" opacity="0.55"/>
  <circle cx="136" cy="172" r="3" fill="var(--accent-color)" opacity="0.55"/>
  <!-- Head -->
  <ellipse cx="120" cy="94" rx="54" ry="50" fill="var(--main-color)"/>
  <!-- Horns -->
  <path d="M 86 60 Q 76 30 92 26 Q 102 38 104 56 Z" fill="var(--main-color)"/>
  <path d="M 154 60 Q 164 30 148 26 Q 138 38 136 56 Z" fill="var(--main-color)"/>
  <!-- Horn highlights -->
  <path d="M 92 38 L 96 50 L 92 56 Z" fill="white" opacity="0.25"/>
  <path d="M 148 38 L 144 50 L 148 56 Z" fill="white" opacity="0.25"/>
  <!-- Snout/muzzle area -->
  <ellipse cx="120" cy="118" rx="26" ry="14" fill="var(--secondary-color)" opacity="0.55"/>
  <!-- Eye whites -->
  <ellipse cx="100" cy="92" rx="13" ry="15" fill="#ffffff"/>
  <ellipse cx="140" cy="92" rx="13" ry="15" fill="#ffffff"/>
  <!-- Pupils -->
  <ellipse cx="100" cy="95" rx="7" ry="9.5" fill="#1c1c1c"/>
  <ellipse cx="140" cy="95" rx="7" ry="9.5" fill="#1c1c1c"/>
  <!-- Eye sparkles (big top) -->
  <ellipse cx="97" cy="88" rx="3" ry="4" fill="white"/>
  <ellipse cx="137" cy="88" rx="3" ry="4" fill="white"/>
  <!-- Eye sparkles (small bottom) -->
  <circle cx="103" cy="100" r="1.6" fill="white" opacity="0.85"/>
  <circle cx="143" cy="100" r="1.6" fill="white" opacity="0.85"/>
  <!-- Cheek blush -->
  <ellipse cx="84" cy="112" rx="7.5" ry="4" fill="#ff8c8c" opacity="0.6"/>
  <ellipse cx="156" cy="112" rx="7.5" ry="4" fill="#ff8c8c" opacity="0.6"/>
  <!-- Smile -->
  <path d="M 108 122 Q 120 132 132 122" stroke="#1c1c1c" stroke-width="2.5" stroke-linecap="round" fill="none"/>
</svg>`;

function makePlaceholder(character) {
  const wrap = document.createElement("div");
  wrap.className = "placeholder-content";
  const svgWrap = document.createElement("div");
  svgWrap.className = "dragon-svg-wrap";
  svgWrap.innerHTML = DRAGON_SVG;
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
