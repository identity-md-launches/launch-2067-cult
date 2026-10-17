# Cult ($CULT)

A complete static Council of Two website and a self-contained Foundry project for the Cult launch. The website is ready in `dist/`; the same plain HTML, CSS, JavaScript and assets live in `site/`. It requires no bundler or compilation to run.

## Preview and export

Node.js 22+ is sufficient for the export and preview scripts. No packages are needed to serve the website:

```sh
npm run build
npm run preview
```

Open `http://127.0.0.1:4173/preview/`. Stop with Ctrl+C. `npm run build` copies `site/` to `dist/` and checks the HTML's local asset references. It is a packaging step, not a website build dependency. To preview the source directly instead:

```sh
python3 -m http.server 4173 --directory site
```

All page scripts, styles, fonts, logo files and licenses are local. Asset URLs are relative, including on `404.html`. The one deliberate root-relative request is `/simd-coin.json`, as required by the launch service. The canonical website is `https://cult.si-md.xyz/`. Hosting and deployment are handled by the launch network after submission.

## Install verification tools

Keep dependencies outside this repository. The committed lockfile pins TypeScript 5.9.3, Playwright 1.56.1 and axe-core's Playwright adapter 4.11.0.

```sh
mkdir -p /tmp/cult-toolchain
cp package.json package-lock.json /tmp/cult-toolchain/
npm ci --prefix /tmp/cult-toolchain --cache /tmp/cult-npm-cache --no-audit --no-fund
PLAYWRIGHT_BROWSERS_PATH=/tmp/cult-browsers node /tmp/cult-toolchain/node_modules/playwright/cli.js install chromium webkit
npm run typecheck
PLAYWRIGHT_BROWSERS_PATH=/tmp/cult-browsers npm run test:site
npm run check:bundle
```

`CULT_TOOLS` can point to another external tool directory. The site test starts and closes its own HTTP server, serves the export under `/preview/`, and leaves disposable evidence in `test/scratch/site-checks/`. Browser libraries required by WebKit must be installed on the host to run that engine. No `node_modules`, package caches, dependency archives, submodules or compiler binaries belong in the submission. An explicit **256-byte path budget for `.gitignore`** covers recursive exclusions for generated dependency/cache/output directories and disposable scratch tests. The tool-created repository dependency cache is left untouched and excluded; `dist/`, source and required assets are included.

## Launch feed and interactions

The site fetches `/simd-coin.json` immediately, every 30 seconds while visible, when the tab becomes visible, and on Refresh. The bundled file is a factual prelaunch fallback containing only the name, symbol, chain and launching status. The host's actual feed replaces it with the token, `coinUrl`, `chartUrl`, optional `logo`, and market values when available. Never insert a test address or invented price into that file.

- Until an address arrives, the site says `launching…` and disables address copying. Buy opens the buying guide and Chart opens the market section until their supplied URLs are available.
- Valid supplied URLs drive the live Buy and Chart links. Address and market values are validated. Missing metrics are hidden; zero volume remains a valid value. Failed refreshes retain the last received data with a visible stale-data notice and retry control.
- A valid, fetchable `logo` overrides the default throughout the illustrations, navigation, sticker, meme generator and favicon. Custom images must permit same-origin/CORS reads for PNG export and be at most 2 MB. Failed or unsupported images retain the local logo.
- The council rejects admission with the exact requested message. Mouse, touch and keyboard can trigger it; the knock count belongs only to the current visit. Rare candle whispers are silent fictional decoration.
- The outsider membership count remains “Secret”: the feed provides no membership history. The adjacent JavaScript vigil counts days since this browser's first visit, saved locally under `cult-first-visit`. It never represents global activity or actual membership.
- The guide's three controls explain wallet setup, ETH for network fees, and swapping on the live coin page. The original creative copy is preserved, with an explicit note that the pool pairs CULT with IMD.
- Eight original SVG relics download as 1200×1200 PNGs. The generator accepts a template and two local text captions. Page rendering uses CSS and SVG only; a temporary, detached canvas encodes PNG downloads. No canvas is used to render the website.
- Three X intent texts and a copy-link action are available. The envelope opens a clearly fictional invitation. No membership, account, wallet, staking or transaction functionality is implied by these toys.

There are no trackers, data-collecting forms, wallet connections, remote font requests, or secret credentials. Meme text is never sent anywhere. Clipboard operations need a supported secure browser context; failure leaves the full address selectable and explains manual copying. Downloads require SVG and canvas-to-blob support.

## Token and launch configuration

`src/CULTToken.sol` contains the only deployed contract. It has no constructor arguments or imports. Its constructor mints **1,000,000,000 CULT with 18 decimals (1e27 minor units)** entirely to `msg.sender`. There is no further mint, burn, owner, admin, pause, blacklist, upgrade, fee or transfer limit. ERC-20 allowance spending, maximum allowance, self-transfer and zero transfers follow standard behavior; zero-address recipients and insufficient balances/allowances revert.

The launch factory performs all distribution. The token does not send any allocation itself. The order allocates 90% to liquidity and 10% to the swarm's Merkle distributor; application contracts are empty. `launch.json` contains the exact mandatory keys and supplied pool/economics values:

| Parameter | Value |
| --- | --- |
| Contract | `CULTToken` |
| Pair | IMD, `0xd34a99bc0f67ae1bbd63c660e6d0b0dd03e263b7` |
| PoolManager | `0x000000000004444c5dc75cB358380D2e3dE08A90` |
| Pool fee / tick spacing | `12500` (1.25%) / `60` |
| Provenance initial price | `125270724187523965593206900` |
| Pool allocation | `9000` basis points |
| Opening market cap | `2500000000000000000000` paired-currency minor units (2,500 IMD) |
| Remainder recipient | `0x000000000000000000000000000000000000dead`, explicitly supplied in the assignment |

The deployer derives the opening price from the economics and deployed currency ordering. Ethereum mainnet is the order's chain; it is intentionally not a manifest field. The 1.25% pool fee is separate from CULT's 0% transfer tax. No addresses or launch settings were guessed.

The launch operator deploys `CULTToken` through the launch factory with an empty constructor argument list. The factory initially holds all 1e27 units, then sends 100,000,000 CULT to its Merkle distributor, allocates 900,000,000 CULT to pool seeding, and forwards any unspent remainder to the supplied remainder recipient. The token itself never calls the factory, distributor, paired token or PoolManager. Launch distribution and swaps move CULT through ordinary ERC-20 transfers. The operator is responsible for deriving the opening price, pool initialization, liquidity seeding, distribution and source verification. There are no token initialization calls, owner keys, post-launch settings or maintenance transactions.

Foundry uses Solidity 0.8.26, Cancun, optimizer enabled with 200 runs, and `bytecode_hash = "none"`. The existing configuration is preserved. It needs no vendored Solidity dependencies, RPC, credentials or environment reads in tests. Run from the repository root:

```sh
forge build
FOUNDRY_FUZZ_SEED=0x7d2b41d06c4024c360f343ff5f860a843d9d67bd263b2ae2585892a0557b1377 forge test
forge fmt --check
```

The original ten tests cover deployment supply, launch-distribution/PoolManager transfer flows, allowance revocation and atomic failure, events, self/zero transfers, forbidden runtime opcodes, inaccessible privileged selectors, fuzzed round trips and 40-transfer conservation sequences. Each of the three existing fuzz tests runs 1,000 cases with the assignment's seed. Three additional deterministic smoke tests in `test/CULTLaunchSmoke.t.sol` check CREATE2 factory deployment and the mint event, a full-supply transfer followed by a rejected overspend, and allowance rollback on a zero-recipient failure followed by a successful spend. No new fuzz or invariant suite was added.

The local flow test checks exact token movement; it does not execute Uniswap's swap algorithm. The pinned protected harness was read, but its factory/Uniswap dependencies and attestation inputs are provided by the verifier, not this repository. The launch network's independent checks remain responsible for the actual factory, Merkle distributor and v4 pool integration. No mainnet fork, transaction, deployment or signing was performed.

## Validation and design

Actual validation results, repaired findings, brief coverage, and explicit limits are in [artifacts/validation.md](artifacts/validation.md). [DESIGN.md](DESIGN.md) describes the final implemented design system. [artifacts/creative-brief.txt](artifacts/creative-brief.txt) preserves the full brief fetched for this assignment.

The Foundry build, all 13 tests (including the existing 3,000 fuzz cases with the required seed), and formatting check passed for the token assignment. The following website results are retained from the earlier accepted contribution; the site was not changed or revalidated in the token assignment. The production export and strict JavaScript typecheck passed. Chromium exercised the primary interactions, all eight PNG downloads, malformed/failed/live feed states, reduced motion, 320–1920px reflow, 200% text enlargement and both pages. The axe WCAG AA scan found no violations. The design probe passed 14/16 checks; its two exceptions preserve the explicitly required scrolling marquee and exact authored em-dash copy. WebKit could not start because system libraries are absent; native Safari, physical devices, screen readers and real clipboard permission prompts remain unverified. The browser suite tests clipboard success with a stub; manual fallback remains available.

## Attribution

The original Cult logo and all eight SVG scenes were created for this assignment because no prior `logos/` assets were present. Default vector and 512px PNG files are in `logos/` and the website assets.

The token assignment preserves the accepted logo: a bold violet-and-gold eye with two pupils, designed to remain recognizable at 64 px. Cult's supplied story is "The first token to proof cult," chosen by the SIMD Swarm Council in round 49783 with 2 votes and proposed by @0xMslm. The artwork is fictional branding with no real brands, people or copyrighted characters.

UnifrakturCook, Inter and Space Mono are bundled from Fontsource 5.3.0, with their OFL licenses beside the fonts. Better Interface design guidance by Jakub Krehel (MIT), the Impeccable documentation method by Paul Bakaus (Apache-2.0), and the Foundry testing guide by Austin Griffith (MIT) informed the work. Their supplied license records are retained in `artifacts/licenses/`. These references grant no wallet or deployment authority.
