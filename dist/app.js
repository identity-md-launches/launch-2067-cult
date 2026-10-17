// @ts-check
import {
  DEFAULT_LOGO,
  council,
  credential,
  ritual,
  pyramid,
  tome,
  jar,
  envelope,
  meme,
  memeTitles,
} from "./art.js";

/** @param {string} selector */
function $(selector) {
  const el = document.querySelector(selector);
  if (!(el instanceof HTMLElement))
    throw new Error(`Missing element: ${selector}`);
  return el;
}
/** @param {string} selector */
function field(selector) {
  const el = document.querySelector(selector);
  if (!(el instanceof HTMLInputElement || el instanceof HTMLSelectElement))
    throw new Error(`Missing field: ${selector}`);
  return el;
}
/** @param {string} text */
function toast(text) {
  $("#toast-message").textContent = text;
  $("#toast").hidden = false;
}
$("#dismiss-toast").addEventListener("click", () => {
  $("#toast").hidden = true;
});

const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
let paused = motionQuery.matches;
function motionAllowed() {
  return !paused && !motionQuery.matches;
}
function applyMotion() {
  document.documentElement.classList.toggle("motion-paused", paused);
  $("#motion-toggle").setAttribute("aria-pressed", String(paused));
  $("#motion-toggle").setAttribute(
    "aria-label",
    paused ? "Resume motion" : "Pause motion",
  );
  $("#motion-toggle").innerHTML = paused
    ? '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="m5 2 9 6-9 6Z" fill="currentColor"/></svg>'
    : '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3v10M11 3v10" stroke="currentColor" stroke-width="3"/></svg>';
  if (paused)
    document
      .getAnimations()
      .filter(
        (a) =>
          a.effect instanceof KeyframeEffect &&
          a.effect.target instanceof HTMLElement &&
          a.effect.target.classList.contains("confetti"),
      )
      .forEach((a) => a.cancel());
}
applyMotion();
$("#motion-toggle").addEventListener("click", () => {
  paused = !paused;
  applyMotion();
});
motionQuery.addEventListener("change", () => {
  paused = motionQuery.matches;
  applyMotion();
});

const scenes = {
  "#council-art": council,
  "#credential-art": credential,
  "#ritual-art": ritual,
  "#pyramid-art": pyramid,
  "#tome-art": tome,
  "#jar-art": jar,
  "#envelope-art": envelope,
};
Object.entries(scenes).forEach(([selector, render]) => {
  $(selector).innerHTML = render();
});

const navigation = $("#navigation"),
  menu = $("#menu-toggle");
/** @param {boolean} open */
function setMenu(open) {
  navigation.classList.toggle("open", open);
  menu.setAttribute("aria-expanded", String(open));
}
menu.addEventListener("click", () =>
  setMenu(menu.getAttribute("aria-expanded") !== "true"),
);
navigation
  .querySelectorAll("a")
  .forEach((a) => a.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && navigation.classList.contains("open")) {
    setMenu(false);
    menu.focus();
  }
});
document.addEventListener("click", (e) => {
  if (e.target instanceof Node && !$(".site-header").contains(e.target))
    setMenu(false);
});
matchMedia("(min-width: 761px)").addEventListener("change", () =>
  setMenu(false),
);

let knocks = 0,
  admissionTimeout = 0;
function denyAdmission() {
  $("#council-stage").classList.add("denied");
  $("#admission-note").textContent =
    "You were not in round 49783. Try again in another 49,783 rounds.";
  clearTimeout(admissionTimeout);
}
$("#admission").addEventListener("pointerenter", denyAdmission);
$("#admission").addEventListener("focus", denyAdmission);
$("#council-art").addEventListener("pointerenter", denyAdmission);
$("#council-stage").addEventListener("pointerleave", () => {
  admissionTimeout = window.setTimeout(
    () => $("#council-stage").classList.remove("denied"),
    1800,
  );
});
$("#admission").addEventListener("click", () => {
  knocks++;
  $("#knocks").textContent = String(knocks);
  denyAdmission();
  $("#whisper").textContent =
    knocks > 2
      ? "A third knock does not create a third seat."
      : "Your request has been filed under “third”.";
});
const whisperTexts = [
  "One of us forgot the agenda.",
  "The chair remembers. The council does not.",
  "Two is a quorum. Three is a queue.",
];
// Rare, silent ambient flicker. This is decorative fiction, never a live membership count.
window.setInterval(() => {
  if (!motionAllowed() || document.hidden || Math.random() > 0.24) return;
  const candle = document.querySelector(".council-candle");
  candle?.classList.add("is-out");
  $("#whisper").textContent =
    whisperTexts[Math.floor(Math.random() * whisperTexts.length)];
  window.setTimeout(() => candle?.classList.remove("is-out"), 1800);
}, 13000);

/** @param {MouseEvent} event */
function confetti(event) {
  if (!motionAllowed()) return;
  const target = event.currentTarget;
  if (!(target instanceof Element)) return;
  const rect = target.getBoundingClientRect();
  for (let i = 0; i < 24; i++) {
    const piece = document.createElement("i");
    piece.className = "confetti";
    piece.setAttribute("aria-hidden", "true");
    piece.style.background = ["#fde047", "#9400d3", "#e2d6ff"][i % 3];
    piece.style.left = `${rect.left + rect.width / 2}px`;
    piece.style.top = `${rect.top + rect.height / 2}px`;
    document.body.append(piece);
    const angle = Math.random() * Math.PI * 2,
      distance = 80 + Math.random() * 130;
    const anim = piece.animate(
      [
        { transform: "translate(0,0) rotate(0)", opacity: 1 },
        {
          transform: `translate(${Math.cos(angle) * distance}px,${Math.sin(angle) * distance + 80}px) rotate(${Math.random() * 600}deg)`,
          opacity: 0,
        },
      ],
      { duration: 650 + Math.random() * 400, easing: "cubic-bezier(.2,0,0,1)" },
    );
    anim.finished.catch(() => {}).finally(() => piece.remove());
  }
}
document.querySelectorAll("[data-buy]").forEach((el) =>
  el.addEventListener("click", (event) => {
    if (event instanceof MouseEvent) confetti(event);
    if (!buyReady)
      toast(
        "CULT is launching. The live coin link appears here when it is available.",
      );
  }),
);
document.querySelectorAll("[data-chart]").forEach((el) =>
  el.addEventListener("click", () => {
    if (!chartReady)
      toast(
        "The chart has not been published yet. Check the public record below.",
      );
  }),
);
if (matchMedia("(pointer:fine)").matches) {
  document.querySelectorAll(".magnetic").forEach((el) => {
    if (!(el instanceof HTMLElement)) return;
    el.addEventListener("pointermove", (e) => {
      if (!motionAllowed()) return;
      const r = el.getBoundingClientRect();
      el.style.translate = `${(e.clientX - r.left - r.width / 2) * 0.08}px ${(e.clientY - r.top - r.height / 2) * 0.12}px`;
    });
    el.addEventListener("pointerleave", () => {
      el.style.translate = "0 0";
    });
  });
}

const steps = [
  [
    "Get an Ethereum wallet",
    "Use a wallet you trust that supports Ethereum mainnet. Keep your recovery phrase private. This site never asks you to connect.",
  ],
  [
    "Get ETH for the journey",
    "Add ETH on Ethereum mainnet for network fees. The pool pairs CULT with IMD; check the live coin page for the route and quoted costs before swapping.",
  ],
  [
    "Swap on the live coin page",
    "When launch details arrive, use Buy $CULT to open the coin page. Verify the contract below, review the quote and slippage, and confirm only inside your wallet.",
  ],
];
document.querySelectorAll("[data-step]").forEach((el) =>
  el.addEventListener("click", () => {
    const index = Number(el.getAttribute("data-step"));
    document.querySelectorAll("[data-step]").forEach((button) => {
      const selected = button === el;
      button.setAttribute("aria-pressed", String(selected));
      button.classList.toggle("active", selected);
    });
    $("#step-detail").replaceChildren();
    const title = document.createElement("h3"),
      description = document.createElement("p");
    title.textContent = steps[index][0];
    description.textContent = steps[index][1];
    $("#step-detail").append(title, description);
    document
      .querySelectorAll("[data-candle]")
      .forEach((c) =>
        c.classList.toggle(
          "lit",
          Number(c.getAttribute("data-candle")) <= index,
        ),
      );
  }),
);

// No global activity is fabricated: the vigil is explicitly local to this browser.
try {
  const key = "cult-first-visit";
  const now = Date.now();
  const saved = Number(localStorage.getItem(key));
  const first =
    Number.isFinite(saved) && saved > 0 && saved <= now ? saved : now;
  localStorage.setItem(key, String(first));
  $("#vigil-days").textContent = String(Math.floor((now - first) / 86400000));
} catch {
  $("#vigil-days").textContent = "0";
}

let tokenAddress = "",
  buyReady = false,
  chartReady = false,
  activeLogo = DEFAULT_LOGO,
  logoDataURL = "";
/** @param {unknown} value @param {boolean} [localAllowed] */
function safeURL(value, localAllowed = false) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value, location.origin);
    if (url.username || url.password) return null;
    if (
      url.protocol === "https:" ||
      (localAllowed &&
        url.origin === location.origin &&
        url.protocol === "http:")
    )
      return url.href;
  } catch {}
  return null;
}
/** @param {unknown} value */
function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
/** @param {string} url */
async function asDataURL(url) {
  const response = await fetch(url, {
    credentials: "omit",
    referrerPolicy: "no-referrer",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("Image unavailable");
  const blob = await response.blob();
  if (!blob.type.startsWith("image/") || blob.size > 2_000_000)
    throw new Error("Unsupported logo");
  return await new Promise(
    (/** @type {(value:string)=>void} */ resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    },
  );
}
/** @param {ParentNode} [root] */
function setLogos(root = document) {
  root.querySelectorAll("[data-logo]").forEach((el) => {
    if (el instanceof HTMLImageElement) el.src = activeLogo;
    else el.setAttribute("href", activeLogo);
  });
}
/** @param {unknown} value */
async function updateLogo(value) {
  const url = safeURL(value, true);
  if (!url || url === activeLogo) return;
  try {
    const data = await asDataURL(url);
    const image = new Image();
    image.src = data;
    await image.decode();
    activeLogo = url;
    logoDataURL = data;
    setLogos();
    document.querySelector('link[rel="icon"]')?.setAttribute("href", url);
    document
      .querySelector('link[rel="apple-touch-icon"]')
      ?.setAttribute("href", url);
  } catch {
    /* A failed creator logo keeps the complete local artwork usable. */
  }
}
asDataURL(DEFAULT_LOGO)
  .then((data) => {
    if (activeLogo === DEFAULT_LOGO) logoDataURL = data;
  })
  .catch(() => {});

const formatMoney = (
  /** @type {number} */ value,
  /** @type {boolean} */ price = false,
) => {
  if (price && value > 0 && value < 0.0000000001)
    return "$" + value.toExponential(4);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: price ? "standard" : "compact",
    maximumFractionDigits: price
      ? value === 0
        ? 2
        : value < 0.01
          ? 10
          : 4
      : 2,
    minimumFractionDigits: price ? 2 : 0,
  }).format(value);
};
/** @type {Map<HTMLElement,number>} */ const numberAnimations = new Map();
/** @param {HTMLElement} node @param {number} value @param {boolean} price */
function animateNumber(node, value, price) {
  const previous = Number(node.dataset.value);
  const previousAnimation = numberAnimations.get(node);
  if (previousAnimation) cancelAnimationFrame(previousAnimation);
  node.dataset.value = String(value);
  node.setAttribute(
    "title",
    new Intl.NumberFormat("en-US", { maximumFractionDigits: 18 }).format(
      value,
    ) + " USD",
  );
  if (!motionAllowed() || !Number.isFinite(previous) || !node.textContent) {
    node.textContent = formatMoney(value, price);
    return;
  }
  const start = performance.now();
  const tick = (/** @type {number} */ time) => {
    const t = Math.min((time - start) / 600, 1);
    node.textContent = formatMoney(
      previous + (value - previous) * (1 - Math.pow(1 - t, 3)),
      price,
    );
    if (t < 1) numberAnimations.set(node, requestAnimationFrame(tick));
  };
  numberAnimations.set(node, requestAnimationFrame(tick));
}
/** @param {unknown} value */
function marketNumber(value) {
  if (
    typeof value === "string" &&
    /^\d+(\.\d+)?(e[+-]?\d+)?$/i.test(value.trim())
  )
    value = Number(value);
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0)
    return null;
  return value;
}
let fetching = false,
  lastGoodTime = 0;
/** @param {unknown} raw */
function applyCoin(raw) {
  if (!isRecord(raw)) throw new Error("Invalid launch feed");
  const data = /** @type {Record<string,unknown>} */ (raw);
  tokenAddress =
    typeof data.token === "string" &&
    /^0x[0-9a-fA-F]{40}$/.test(data.token) &&
    !/^0x0{40}$/i.test(data.token)
      ? data.token
      : "";
  $("#contract-address").textContent = tokenAddress || "launching…";
  $("#copy-contract").toggleAttribute("disabled", !tokenAddress);
  $("#launch-state").textContent = tokenAddress
    ? "Contract published"
    : "launching…";
  const coinURL = safeURL(data.coinUrl),
    chartURL = safeURL(data.chartUrl);
  buyReady = Boolean(coinURL);
  chartReady = Boolean(chartURL);
  for (const [selector, url, fallback] of [
    ["[data-buy]", coinURL, "#how-to-buy"],
    ["[data-chart]", chartURL, "#cultifacts"],
  ])
    document.querySelectorAll(String(selector)).forEach((el) => {
      el.setAttribute("href", String(url || fallback));
      if (url) {
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener noreferrer");
      } else {
        el.removeAttribute("target");
        el.removeAttribute("rel");
      }
    });
  const market = isRecord(data.market)
    ? /** @type {Record<string,unknown>} */ (data.market)
    : {};
  let visible = 0;
  for (const [key, id] of [
    ["marketCap", "#market-cap"],
    ["priceUsd", "#price"],
    ["volume24h", "#volume"],
  ]) {
    const value = marketNumber(market[key]);
    const holder = $(`[data-stat="${key}"]`);
    holder.hidden = value === null;
    if (value !== null) {
      animateNumber($(id), value, key === "priceUsd");
      visible++;
    }
  }
  $("#stats-grid").hidden = visible === 0;
  $("#market-empty").hidden = visible > 0;
  $("#market-empty").textContent =
    "Market numbers appear here when the launch publishes them.";
  lastGoodTime = Date.now();
  $("#market-status").textContent = visible
    ? `Updated ${new Date(lastGoodTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} · every 30s`
    : tokenAddress
      ? "Waiting for market data"
      : "Awaiting the launch feed";
  if (data.logo) void updateLogo(data.logo);
}
async function refreshCoin() {
  if (fetching) return;
  fetching = true;
  $("#refresh-stats").setAttribute("disabled", "");
  try {
    const response = await fetch("/simd-coin.json", {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error("Feed unavailable");
    applyCoin(await response.json());
  } catch {
    $("#market-status").textContent = lastGoodTime
      ? "Update unavailable · showing last received data"
      : "Launch feed unavailable · retry below";
    if (!lastGoodTime)
      $("#market-empty").textContent =
        "The council is quiet. Refresh to check for launch details.";
  } finally {
    fetching = false;
    $("#refresh-stats").removeAttribute("disabled");
  }
}
$("#refresh-stats").addEventListener("click", () => {
  void refreshCoin();
});
void refreshCoin();
window.setInterval(() => {
  if (!document.hidden) void refreshCoin();
}, 30000);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) void refreshCoin();
});

/** @param {string} text @param {string} success @param {HTMLElement} [feedback] */
async function copy(text, success, feedback) {
  try {
    if (!navigator.clipboard) throw new Error("Clipboard unavailable");
    await navigator.clipboard.writeText(text);
    if (feedback) feedback.textContent = success;
    else toast(success);
  } catch {
    const message =
      "Copy unavailable in this browser. Select and copy the text manually.";
    if (feedback) feedback.textContent = message;
    else toast(`${message} https://cult.si-md.xyz/`);
  }
}
$("#copy-contract").addEventListener("click", () => {
  if (tokenAddress)
    void copy(
      tokenAddress,
      "Contract address copied.",
      $("#contract-feedback"),
    );
});
$("#copy-link").addEventListener("click", () => {
  void copy("https://cult.si-md.xyz/", "Cult link copied.");
});
const shareTexts = [
  "Only two must believe. Are you one? $CULT",
  "I found the Council of Two. My admission remains under review. $CULT",
  "SIMD Swarm Council, round 49783. Two votes. Infinite legend. $CULT",
];
document.querySelectorAll("[data-share]").forEach((el) =>
  el.addEventListener("click", () => {
    const index = Number(el.getAttribute("data-share"));
    const text = shareTexts[index];
    $("#share-x").setAttribute(
      "href",
      `https://x.com/intent/tweet?${new URLSearchParams({ text, url: "https://cult.si-md.xyz/" })}`,
    );
    $("#share-preview").textContent = text;
    document.querySelectorAll("[data-share]").forEach((button) => {
      button.classList.toggle("selected", button === el);
      button.setAttribute("aria-pressed", String(button === el));
    });
  }),
);
$("#open-invite").addEventListener("click", () => {
  const card = $("#invite-card");
  card.hidden = !card.hidden;
  $("#open-invite").setAttribute("aria-expanded", String(!card.hidden));
});

// Page rendering is CSS + SVG. An offscreen canvas is used only as a PNG encoder.
/** @param {SVGSVGElement} original @param {string} name */
async function downloadSVG(original, name) {
  await document.fonts.ready;
  const clone = /** @type {SVGSVGElement} */ (original.cloneNode(true));
  clone.setAttribute("width", "1200");
  clone.setAttribute("height", "1200");
  let embedded = logoDataURL;
  if (!embedded) embedded = await asDataURL(DEFAULT_LOGO);
  clone
    .querySelectorAll("image")
    .forEach((image) => image.setAttribute("href", embedded));
  const serialized = new XMLSerializer().serializeToString(clone);
  const svgURL = URL.createObjectURL(
    new Blob([serialized], { type: "image/svg+xml;charset=utf-8" }),
  );
  try {
    const image = new Image();
    image.src = svgURL;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 1200;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("PNG export unavailable");
    ctx.drawImage(image, 0, 0, 1200, 1200);
    const blob = await new Promise(
      (/** @type {(value:Blob)=>void} */ resolve, reject) =>
        canvas.toBlob(
          (value) =>
            value ? resolve(value) : reject(new Error("PNG encoding failed")),
          "image/png",
        ),
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  } finally {
    URL.revokeObjectURL(svgURL);
  }
}

const wall = $("#meme-wall");
memeTitles.forEach((title, index) => {
  const card = document.createElement("figure");
  card.className = "meme-card reveal";
  card.style.setProperty("--delay", `${(index % 4) * 80}ms`);
  const art = document.createElement("div");
  art.className = "meme-art";
  art.setAttribute("role", "img");
  art.setAttribute("aria-label", title);
  art.innerHTML = meme(index);
  const caption = document.createElement("figcaption");
  const heading = document.createElement("h4");
  heading.textContent = title;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "meme-download";
  button.setAttribute("aria-label", `Download PNG: ${title}`);
  button.innerHTML = 'Download PNG <span aria-hidden="true">↓</span>';
  button.addEventListener("click", async () => {
    button.disabled = true;
    try {
      const exported = document.createElement("div");
      exported.innerHTML = meme(index, "", title);
      const image = exported.querySelector("svg");
      if (!image) throw new Error("Missing art");
      await downloadSVG(image, `cult-relic-${index + 1}.png`);
      toast("Council relic downloaded. Your clearance remains unchanged.");
    } catch {
      toast(
        "PNG download failed. Try again in a browser that supports SVG images.",
      );
    } finally {
      button.disabled = false;
    }
  });
  caption.append(heading, button);
  card.append(art, caption);
  wall.append(card);
});

function renderMeme() {
  const preview = $("#meme-preview");
  const index = Number(field("#meme-template").value);
  const top = field("#meme-top").value,
    bottom = field("#meme-bottom").value;
  preview.innerHTML = meme(index, top, bottom);
  preview.setAttribute("aria-label", `${memeTitles[index]}. ${top}. ${bottom}`);
  setLogos(preview);
}
["#meme-template", "#meme-top", "#meme-bottom"].forEach((selector) =>
  field(selector).addEventListener("input", renderMeme),
);
renderMeme();
$("#download-meme").addEventListener("click", async () => {
  const button = $("#download-meme");
  button.setAttribute("disabled", "");
  $("#download-feedback").textContent = "Preparing your PNG…";
  try {
    const artwork = $("#meme-preview").querySelector("svg");
    if (!artwork) throw new Error("Missing art");
    await downloadSVG(artwork, "cult-my-evidence.png");
    $("#download-feedback").textContent =
      "PNG downloaded. The minutes are yours.";
  } catch {
    $("#download-feedback").textContent =
      "PNG download failed. Please try again.";
  } finally {
    button.removeAttribute("disabled");
  }
});

// The sticker is draggable and has equivalent arrow-key controls; Home resets it.
const sticker = $("#logo-sticker");
let stickerX = 0,
  stickerY = 0,
  pointerX = 0,
  pointerY = 0,
  dragging = false;
/** @param {number} x @param {number} y */
function moveSticker(x, y) {
  const rect = sticker.getBoundingClientRect();
  const baseX = rect.left - stickerX,
    baseY = rect.top - stickerY;
  stickerX = Math.max(
    8 - baseX,
    Math.min(innerWidth - rect.width - 8 - baseX, x),
  );
  stickerY = Math.max(
    8 - baseY,
    Math.min(innerHeight - rect.height - 8 - baseY, y),
  );
  sticker.style.translate = `${stickerX}px ${stickerY}px`;
}
sticker.addEventListener("pointerdown", (e) => {
  dragging = true;
  pointerX = e.clientX - stickerX;
  pointerY = e.clientY - stickerY;
  sticker.setPointerCapture(e.pointerId);
});
sticker.addEventListener("pointermove", (e) => {
  if (dragging) moveSticker(e.clientX - pointerX, e.clientY - pointerY);
});
sticker.addEventListener("pointerup", () => {
  dragging = false;
});
sticker.addEventListener("pointercancel", () => {
  dragging = false;
});
sticker.addEventListener("keydown", (e) => {
  const movement = /** @type {Record<string,number[]>} */ ({
    ArrowLeft: [-12, 0],
    ArrowRight: [12, 0],
    ArrowUp: [0, -12],
    ArrowDown: [0, 12],
  });
  if (e.key === "Home") {
    e.preventDefault();
    stickerX = 0;
    stickerY = 0;
    sticker.style.translate = "0 0";
  } else if (movement[e.key]) {
    e.preventDefault();
    moveSticker(stickerX + movement[e.key][0], stickerY + movement[e.key][1]);
  }
});
window.addEventListener("resize", () => {
  stickerX = 0;
  stickerY = 0;
  sticker.style.translate = "0 0";
});

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        entry.target
          .querySelectorAll(".donut-pool")
          .forEach((el) => el.classList.add("drawn"));
        const candleIndex = entry.target.getAttribute("data-reveal-candle");
        if (candleIndex !== null)
          document
            .querySelector(`[data-candle="${candleIndex}"]`)
            ?.classList.add("lit");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12 },
  );
  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
  document.querySelectorAll(".ritual-copy li").forEach((el, index) => {
    el.setAttribute("data-reveal-candle", String(index));
    observer.observe(el);
  });
} else {
  document
    .querySelectorAll(".donut-pool")
    .forEach((el) => el.classList.add("drawn"));
}
