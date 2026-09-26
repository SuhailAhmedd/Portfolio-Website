# Portfolio-Website

Personal portfolio of Suhail Ahmed, Data Engineer.
Live: https://suhailahmedd.github.io/Portfolio-Website/

Static site with no build step and no dependencies: `index.html`, `styles.css`, `script.js`, plus `suhail.png` and the favicons. GitHub Pages serves it from `main`.

## Run locally

Any static file server works, for example:

```sh
python3 -m http.server 8080
# or
npx http-server -p 8080
```

Then open http://localhost:8080/. Opening `index.html` directly from disk also works.

## Notes

- Bump the `?v=` tag on the `styles.css` and `script.js` links in `index.html` whenever either file changes, so browsers drop cached copies.
- The first-visit boot sequence is remembered in `localStorage` (`sa-boot`). Clear it to see the sequence again.
- The contact form posts to Formspree once `YOUR_FORM_ID` in `index.html` is replaced with a real form ID. Until then it opens the visitor's email app.
