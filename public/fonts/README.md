# Self-hosted fonts

DM Sans (variable weights 400–700) and Barlow Condensed (500, 600, 700, 800), Latin WOFF2 subsets. Font files are served by this site and keep `font-display: swap`.

Source: [Google Fonts](https://github.com/google/fonts), retrieved through its CSS API. Each family's SIL Open Font License is included in this directory. These licenses apply to the fonts separately from the repository's MIT license.

Run `node scripts/vendor-fonts.mjs` to refresh files and `src/fonts.css`. This is a manual maintenance task; normal builds do not fetch fonts or contact Google Fonts.
