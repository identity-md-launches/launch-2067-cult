// Original SVG scenes. The same source powers the page and its downloadable relics.
export const DEFAULT_LOGO = "./assets/logos/logo-1.png";
const gold = "#fde047",
  ink = "#e2d6ff",
  violet = "#9400d3",
  dark = "#16141f";
/** @param {string} value */
export function escapeXML(value) {
  return value.replace(
    /[<>&"']/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[c] || c,
  );
}
/** @param {number} x @param {number} y @param {number} size @param {string} [extra] */
function coin(x, y, size, extra = "") {
  return `<image data-logo="" href="${DEFAULT_LOGO}" x="${x}" y="${y}" width="${size}" height="${size}" ${extra}/>`;
}
/** @param {number} x @param {number} y @param {number} [scale] @param {string} [extra] */
function robed(x, y, scale = 1, extra = "") {
  return `<g transform="translate(${x} ${y}) scale(${scale})"><g ${extra}><path d="M0 190Q8 80 38 25Q70-25 102 25Q132 80 140 190Q70 215 0 190Z" fill="#24182f" stroke="#a45ce0" stroke-width="3"/><path d="M40 26Q70 0 100 26L118 110Q70 82 22 110Z" fill="#100e17" stroke="#5c367a" stroke-width="3"/>${coin(33, 36, 74, 'class="floating-logo"')}<path d="M28 112 15 181M112 112l13 69M69 127v68" stroke="#4e2e66" stroke-width="4"/><path d="M23 151q19-14 32 4m30 0q14-18 32-4" stroke="#a45ce0" stroke-width="4" fill="none"/></g></g>`;
}
/** @param {number} x @param {number} y @param {number} [scale] @param {string} [extra] */
function candle(x, y, scale = 1, extra = "") {
  return `<g transform="translate(${x} ${y}) scale(${scale})" ${extra}><ellipse cx="0" cy="-43" rx="32" ry="47" fill="${gold}" opacity=".06"/><path d="M-13 20h26l-3-61h-20Z" fill="#cabb8a" stroke="#100e17" stroke-width="3"/><path d="M-7-39v18q5 9 8 0v-14" stroke="${gold}" stroke-width="4" fill="none"/><path d="M0-43v-9" stroke="#100e17" stroke-width="3"/><path class="flame" d="M0-79q-25 29 0 29 21-3 0-29" fill="${gold}"/><path d="M-23 22h46m-23 0v14m-16 0h32" stroke="#b98e41" stroke-width="5"/></g>`;
}
/** @param {string} content @param {string} [viewBox] */
function svg(content, viewBox = "0 0 600 600") {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="${viewBox.endsWith("450") ? "450" : "600"}" viewBox="${viewBox}" fill="none">${content}</svg>`;
}
/** @param {number} x @param {number} y @param {number} [size] */
function star(x, y, size = 12) {
  return `<path d="m${x} ${y - size} 3 ${size - 3} ${size - 3} 3-${size - 3} 3-3 ${size - 3}-3-${size - 3}-${size - 3}-3 ${size - 3}-3Z" fill="${gold}"/>`;
}

export function council() {
  return svg(
    `<defs><radialGradient id="council-glow"><stop stop-color="#9400d3" stop-opacity=".35"/><stop offset="1" stop-color="#9400d3" stop-opacity="0"/></radialGradient><filter id="candle-glow"><feGaussianBlur stdDeviation="10"/></filter><pattern id="dots" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#a569c4" opacity=".25"/></pattern></defs><ellipse cx="300" cy="247" rx="290" ry="200" fill="url(#council-glow)"/><path d="M155 260V164a145 145 0 0 1 290 0v96" stroke="#4a2a60" stroke-width="2"/><path d="M175 250v-87a125 125 0 0 1 250 0v87" stroke="#3a234b" stroke-width="1"/><path d="M300 22v15m-80 9 8 14m145-14-8 14M170 107l15 9m245-9-15 9" stroke="#9e79b6" stroke-width="2"/>${star(300, 32, 17)}${star(78, 161, 10)}${star(499, 93, 12)}<circle cx="468" cy="186" r="4" fill="${gold}"/><ellipse cx="300" cy="390" rx="255" ry="35" fill="#0c0a11"/><g class="member-left">${robed(96, 115, 1.22)}</g><g class="member-right">${robed(335, 115, 1.22)}</g><path d="M105 315h390l-36 105H143Z" fill="#170f23" stroke="#4a2a60" stroke-width="2"/><path d="M145 337v68m310-68v68" stroke="#533263" stroke-width="12"/><ellipse cx="300" cy="307" rx="245" ry="72" fill="#100e17" stroke="#9b60bc" stroke-width="3"/><ellipse cx="300" cy="300" rx="227" ry="58" fill="#251731" stroke="#503163" stroke-width="2"/><ellipse cx="300" cy="300" rx="217" ry="49" fill="url(#dots)"/><g opacity=".2">${coin(225, 265, 150, 'height="62" transform="translate(0 165) scale(1 .45)"')}</g><path d="M249 294q51-45 102 0-51 45-102 0" stroke="#8d5d9c" stroke-width="2"/><path d="M291 276v36m18-36v36" stroke="#8d5d9c" stroke-width="3"/><ellipse cx="187" cy="285" rx="36" ry="14" fill="${gold}" opacity=".13" filter="url(#candle-glow)"/><ellipse cx="416" cy="283" rx="36" ry="14" fill="${gold}" opacity=".13" filter="url(#candle-glow)"/>${candle(188, 254, 0.85, 'class="council-candle"')}${candle(416, 254, 0.85, 'class="council-candle"')}<path d="m277 326 24-8 31 10-23 8Z" fill="#c3b094" opacity=".6"/><g class="velvet-rope"><path d="M137 338v79m326-79v79" stroke="#b98e41" stroke-width="8"/><circle cx="137" cy="335" r="10" fill="${gold}"/><circle cx="463" cy="335" r="10" fill="${gold}"/><path d="M137 342q163 81 326 0" stroke="#060509" stroke-width="17"/><path d="M137 338q163 81 326 0" stroke="#5a2757" stroke-width="4"/></g>`,
    "0 0 600 450",
  );
}

export function credential() {
  return svg(
    `<path d="M45 75Q300 60 555 75M65 485q225 25 470-1" stroke="#baabcf" stroke-width="2" opacity=".4" class="chalk-line"/><text x="300" y="140" text-anchor="middle" fill="${ink}" font-size="52" font-family="Georgia,serif" font-style="italic">The quorum is two</text><g opacity=".85">${robed(100, 188, 1)}${robed(360, 188, 1)}</g><path d="m140 407 18 22 35-44m214 24 18 22 35-44" stroke="${gold}" stroke-width="8" stroke-linecap="round" class="chalk-line"/><text x="300" y="506" text-anchor="middle" fill="${gold}" font-size="42" font-family="monospace">Votes: 2</text><path d="m116 164 40 6m290-7 35-8M284 257l14 10 17-15" stroke="#baabcf" stroke-width="3" class="chalk-line"/>`,
    "0 0 600 600",
  );
}

export function ritual() {
  return svg(
    `<circle cx="300" cy="300" r="215" stroke="#5b3670" stroke-width="2"/><circle cx="300" cy="300" r="196" stroke="#3e2c4d" stroke-width="1" stroke-dasharray="4 8"/><g class="faint-orbit"><polygon points="300,93 422,466 101,234 499,234 178,466" stroke="${violet}" stroke-width="3" fill="#9400d308"/></g>${coin(234, 230, 132)}${coin(65, 212, 58, 'transform="rotate(-20 94 240)"')}${coin(470, 210, 58, 'transform="rotate(20 499 239)"')}${candle(300, 108, 0.8, 'class="ritual-candle" data-candle="0"')}${candle(158, 449, 0.8, 'class="ritual-candle" data-candle="1"')}${candle(442, 449, 0.8, 'class="ritual-candle" data-candle="2"')}${star(79, 414, 12)}${star(506, 125, 18)}<text x="300" y="560" text-anchor="middle" fill="#baabcf" font-family="monospace" font-size="20">No recovery phrases at the altar.</text>`,
  );
}

export function pyramid() {
  let content = `<ellipse cx="300" cy="510" rx="260" ry="35" fill="#100e17"/>`;
  for (let row = 0; row < 4; row++) {
    const count = row + 2,
      size = 95;
    for (let j = 0; j < count; j++) {
      const x = 300 - (count * size) / 2 + j * size,
        y = 110 + row * 92;
      content += coin(
        x,
        y,
        size,
        `opacity="${row === 0 ? 1 : 0.42}" transform="rotate(${(j % 2 ? 1 : -1) * 9} ${x + 48} ${y + 48})"`,
      );
    }
  }
  content += `${star(194, 95, 18)}${star(405, 93, 14)}<path d="m250 74 8 18m87-19-8 18" stroke="${gold}" stroke-width="4"/>`;
  return svg(content);
}

export function tome() {
  return svg(
    `<path d="M48 171q135-45 252 2 113-47 252-2v292q-135-40-252-2-122-38-252 2Z" fill="#100e17" stroke="#714d82" stroke-width="5"/><path d="M59 152q135-45 241 5 120-50 241-5v290q-123-43-241 0-116-43-241 0Z" fill="#d0bf9f" stroke="#3d2947" stroke-width="5"/><path d="M300 158v284" stroke="#856d5a" stroke-width="3"/><path d="M76 182q112-30 204 0m-204 18q112-30 204 0m42-17q100-31 199 0" stroke="#8b745f" opacity=".45" stroke-width="2"/><text x="184" y="236" text-anchor="middle" fill="#342744" font-family="Georgia,serif" font-size="25">Round 49783</text>${coin(98, 264, 67)}${coin(192, 264, 67)}<path d="M132 332v39m-20-18h40m-20 18-15 23m15-23 15 23M225 332v39m-20-18h40m-20 18-15 23m15-23 15 23" stroke="#342744" stroke-width="4"/><text x="419" y="280" text-anchor="middle" fill="#342744" font-family="Georgia,serif" font-size="60">??</text><path d="M382 353v-50h70v50m-82 0h94m-83 0v46m71-46v46" stroke="#342744" stroke-width="5"/><text x="420" y="421" text-anchor="middle" fill="#342744" font-family="monospace" font-size="18">Reserved. For whom?</text>${star(85, 100, 12)}${star(500, 109, 9)}<path d="m320 442 4 65 20-20 17 16-10-62" fill="${violet}"/>`,
  );
}

export function jar() {
  return svg(
    `<ellipse cx="300" cy="514" rx="172" ry="28" fill="#08070c"/><path d="M211 136v46q-64 24-68 92v174q0 52 157 52t157-52V274q-4-68-68-92v-46" fill="#9400d30e" stroke="#826b96" stroke-width="4"/><ellipse cx="300" cy="145" rx="96" ry="23" fill="#392b40" stroke="#a18caa" stroke-width="4"/><path d="M213 128q88-16 174 0v27q-90 16-174 0Z" fill="#79644f" stroke="#af9671" stroke-width="3"/><path d="M168 280v140m15-151v33" stroke="#e2d6ff" stroke-width="6" opacity=".3" stroke-linecap="round"/>${coin(216, 332, 168, 'opacity=".13"')}<g class="jar-two"><circle cx="300" cy="300" r="83" fill="#9400d3" opacity=".13"/><text x="300" y="363" text-anchor="middle" fill="${gold}" font-family="Georgia,serif" font-size="170">2</text></g>${star(355, 240, 12)}${star(241, 273, 7)}${star(368, 394, 9)}<path d="M213 111q-32-28-6-57m182 57q35-25 11-51" stroke="#684b7d" stroke-width="2" stroke-dasharray="4 8"/>`,
  );
}

export function envelope() {
  return svg(
    `<g transform="rotate(-8 300 300)"><path d="M66 190h468v290H66Z" fill="#31223d" stroke="#a77bbc" stroke-width="3"/><path d="M66 190 300 379 534 190" fill="#45234f" stroke="#a77bbc" stroke-width="3"/><path d="M66 480 240 333m294 147L360 333" stroke="#a77bbc" stroke-width="3"/><g class="seal-stamp">${coin(238, 282, 124)}</g><path d="M105 437h70m-70-14h43" stroke="#a77bbc" stroke-width="2"/><text x="300" y="150" text-anchor="middle" fill="#baabcf" font-size="22" font-family="monospace">For the eyes of two.</text></g>${star(534, 141, 14)}${star(75, 133, 9)}`,
  );
}

export const memeTitles = [
  "Being in the cult when only two are allowed",
  "When you realize 'proof cult' has tighter security than proof of work",
  "SIMD Swarm Council round 49783: population, you and your alt",
  "When someone asks to join the cult and you check the rules",
  "Buy the rumor, sell the secret handshake",
  "I survived 49,783 rounds of council voting and all I got was this token",
  "The third chair has been pending since round 49783",
  "Meeting cancelled. Both members are the same person.",
];
/** @param {number} index */
function memeScene(index) {
  const base = `<rect width="600" height="600" fill="${index % 3 === 0 ? "#291337" : index % 3 === 1 ? "#191522" : "#30243a"}"/><path d="M0 520h600M0 540h600M0 560h600" stroke="#775180" opacity=".25"/>`;
  switch (index) {
    case 0:
      return (
        base +
        `<path d="M193 462V236a107 107 0 0 1 214 0v226Z" fill="#9400d3" stroke="#b474d1" stroke-width="9"/><path class="door-swing" d="M204 457V242a96 96 0 0 1 192 0v215Z" fill="#100e17" stroke="#693783" stroke-width="3"/><circle cx="367" cy="313" r="5" fill="${gold}"/>${robed(55, 250, 0.9)}${robed(420, 250, 0.9)}${coin(253, 430, 94, 'class="third-visitor"')}<path d="m245 413-22-19m28 6-8-29m85 37 19-22" stroke="${gold}" stroke-width="4"/>`
      );
    case 1:
      return (
        base +
        `${coin(165, 181, 270)}<path d="M256 306v-26a44 44 0 0 1 88 0v26" stroke="${ink}" stroke-width="15"/><rect x="244" y="306" width="111" height="90" rx="10" fill="${gold}" stroke="#16141f" stroke-width="5"/><circle cx="300" cy="343" r="11" fill="#16141f"/><path d="M300 343v26" stroke="#16141f" stroke-width="9"/><circle cx="360" cy="436" r="16" stroke="#fde047" stroke-width="8"/><path d="m346 447-27 25m5-15 10 11" stroke="#fde047" stroke-width="8"/><g class="bars"><path d="M115 138v346m74-346v346m223-346v346m73-346v346" stroke="#b4a5c1" stroke-width="11"/><path d="M88 161h424m-424 303h424" stroke="#b4a5c1" stroke-width="12"/></g>`
      );
    case 2:
      return (
        base +
        `<path d="M300 124v386" stroke="#fde047" stroke-width="3"/><path d="M24 415V204q112-113 248 0v211" stroke="#6c4184" stroke-width="5"/>${[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => coin(32 + c * 60, 204 + r * 64, 43, `opacity="${r === 2 && c > 0 && c < 3 ? 1 : 0.13}"`)).join("")).join("")}<text x="151" y="458" fill="${ink}" text-anchor="middle" font-family="monospace" font-size="22">The council</text>${coin(322, 235, 112)}${coin(458, 235, 112)}<path d="m418 363 27-38 27 38m-27-38v-30m-15 10-7-14m36 14 7-14" stroke="${gold}" stroke-width="8"/><text x="446" y="458" fill="${ink}" text-anchor="middle" font-family="monospace" font-size="22">The council, also</text>`
      );
    case 3:
      return (
        base +
        `<path d="M50 130v338l85-90 38 86V131m254 0v333l38-86 85 90V130" fill="#4d116b" stroke="#a951c2" stroke-width="3"/>${coin(60, 226, 85, 'opacity=".5"')}${coin(454, 260, 85, 'opacity=".5"')}${robed(190, 200, 1.4)}<path d="M208 353h197l-18 132H187Z" fill="#d4c3a2" stroke="#48374d" stroke-width="5"/><text x="290" y="407" text-anchor="middle" fill="#342744" font-family="Georgia" font-size="32">Rule #1</text><text x="290" y="449" text-anchor="middle" fill="#342744" font-family="Georgia" font-size="30">No #3.</text>`
      );
    case 4:
      return (
        base +
        `${coin(59, 228, 170)}${coin(371, 228, 170)}<path d="M77 298h135m-128 0 12 33h37l8-33 8 33h37l13-33" stroke="#16141f" stroke-width="14"/><rect x="79" y="413" width="125" height="66" rx="7" fill="#654c70" stroke="#c6afd1" stroke-width="4"/><path d="M119 412v-17h40v17" stroke="#c6afd1" stroke-width="5"/><path d="m201 370 83 32 99-33" stroke="#a98abd" stroke-width="10"/><path d="m254 364 67 12-15 50-67-12Z" fill="#d4c3a2" stroke="#342744" stroke-width="4"/>${candle(300, 260, 0.8)}<path d="M445 406v49m-20-18h40" stroke="#a98abd" stroke-width="6"/>`
      );
    case 5:
      return (
        base +
        `${coin(187, 171, 225)}<path d="m220 381-42 20m205-20 39 20" stroke="#a98abd" stroke-width="10"/><path d="m93 396 420-20-12 99-36-4-18 15-47-11-25 16-35-14-57 17-30-17-42 15-62-15-40 15Z" fill="${gold}" stroke="#16141f" stroke-width="5"/><text x="301" y="442" text-anchor="middle" fill="#16141f" font-family="monospace" font-size="29">I VOTED (PROBABLY)</text>${candle(482, 278, 0.55)}<path class="meme-confetti" d="m111 178 18 20m337-50-13 24m-83-18 8-27m-166 10-16 12m-16 177-22 9m338 31 17 11" stroke="#9400d3" stroke-width="9"/>`
      );
    case 6:
      return (
        base +
        `<path d="M210 372V222q90-56 180 0v150m-205 0h230m-204 0v108m178-108v108" stroke="#c7a8d9" stroke-width="10"/><path d="M204 377q96 53 192 0" stroke="#0a080e" stroke-width="23"/>${coin(266, 261, 68, 'opacity=".25"')}<text x="300" y="182" text-anchor="middle" fill="${gold}" font-family="Georgia" font-size="38">Reserved for ???</text><path d="m150 222-40 40m340-40 40 40" stroke="#744287" stroke-width="4"/>`
      );
    default:
      return (
        base +
        `<path d="M90 170h420v320H90Z" fill="#cfbd9c" stroke="#72596b" stroke-width="7"/><path d="M90 233h420" stroke="#72596b" stroke-width="4"/><text x="300" y="216" text-anchor="middle" fill="#342744" font-family="monospace" font-size="28">Round 49783</text>${coin(158, 268, 117)}${coin(325, 268, 117)}<path d="m126 426 350-35" stroke="#9400d3" stroke-width="12"/><text x="300" y="453" text-anchor="middle" fill="#342744" font-family="Georgia" font-size="28">Both unavailable.</text><path d="M160 148v42m280-42v42" stroke="${gold}" stroke-width="10"/>`
      );
  }
}
/** @param {string} text @param {number} maxChars */
function wrapText(text, maxChars) {
  const lines = [];
  let line = "";
  for (const word of text.trim().split(/\s+/)) {
    if ((line + " " + word).trim().length > maxChars && line) {
      lines.push(line);
      line = "";
    }
    if (word.length > maxChars) {
      if (line) {
        lines.push(line);
        line = "";
      }
      for (let i = 0; i < word.length; i += maxChars)
        lines.push(word.slice(i, i + maxChars));
    } else line += (line ? " " : "") + word;
  }
  if (line) lines.push(line);
  return lines;
}
/** @param {number} index @param {string} [top] @param {string} [bottom] */
export function meme(index, top = "", bottom = "") {
  const caption = (
    /** @type {string} */ text,
    /** @type {boolean} */ atTop,
  ) => {
    const lines = wrapText(text, 25);
    const start = atTop ? 40 : 574 - (lines.length - 1) * 28;
    return `<g fill="${ink}" font-family="Arial,sans-serif" font-size="24" font-weight="700" text-anchor="middle" stroke="#100e17" stroke-width="5" paint-order="stroke">${lines.map((line, i) => `<text x="300" y="${start + i * 28}">${escapeXML(line)}</text>`).join("")}</g>`;
  };
  return svg(memeScene(index) + caption(top, true) + caption(bottom, false));
}
