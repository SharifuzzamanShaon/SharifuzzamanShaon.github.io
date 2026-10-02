# sharifuzzamanshaon.github.io

Personal portfolio of **Sharifuzzaman Hasan**, a backend-focused software engineer based in Dhaka.

Live at **https://sharifuzzamanshaon.github.io/**

## Stack

A static site with no build step:

- Plain HTML, CSS and JavaScript
- [GSAP](https://gsap.com/) 3.15 (ScrollTrigger and SplitText) and [Lenis](https://lenis.darkroom.engineering/) smooth scroll, both loaded from jsDelivr
- Fonts from Google Fonts: Mona Sans, Instrument Serif and Fragment Mono

The animations switch off for visitors who prefer reduced motion. The page still works, with full content, if JavaScript or the CDN fails to load.

## Structure

```
index.html                     the page (content lives here)
404.html                       custom not-found page
assets/css/style.css           design tokens (dark + light), layout, components
assets/js/main.js              theme, smooth scroll, reveals, live system diagrams
assets/img/                    portrait, social preview image, favicons
assets/Sharifuzzaman-Hasan-CV.pdf
.nojekyll                      serve files as-is (skip Jekyll)
```

## Editing content

All text lives in `index.html`.

- **Projects:** each `<article class="project">` has a diagram and a highlights list.
  - The diagram's nodes are the `.node` elements. Each node is placed with `grid-area: row / column` on a 3-column grid.
  - The wires come from the figure's `data-edges` attribute. Each entry has the form `[from, to, "req" | "evt", "one" | "both", "hv" | "vh"]`:
    - `req` draws a solid request wire and `evt` a dashed event wire.
    - `both` sends a pulse there and back (request then response).
    - `hv` / `vh` only matters for elbow routes: it chooses whether the wire leaves horizontally or vertically.
  - A highlight with `data-nodes="a b"` lights up those nodes (and the wire between them) when hovered.
- **Résumé:** replace `assets/Sharifuzzaman-Hasan-CV.pdf`, keeping the same file name.
- **Portrait:** replace `assets/img/portrait.jpg`. It's shown in grayscale at a 4:5 crop.

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy

Push to `main`. Then, under the repository's **Settings → Pages**, set the source to **Deploy from a branch → `main` / root**.
