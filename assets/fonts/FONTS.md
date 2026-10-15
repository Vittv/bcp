# Bundled fonts

Every font in this directory ships under the SIL Open Font License 1.1. The full
license text for each family is in `LICENSES/`.

| Family | Role | Files | Source | License |
| --- | --- | --- | --- | --- |
| Crimson Pro | Reading, Heading | `crimson-pro-latin-400-normal.woff2`, `crimson-pro-latin-600-normal.woff2`, `crimson-pro-latin-400-italic.woff2` | https://github.com/Fonthausen/CrimsonPro | OFL-1.1, `LICENSES/crimson-pro-OFL.txt` |
| EB Garamond | Reading, Heading | `eb-garamond-latin-400-normal.woff2`, `eb-garamond-latin-600-normal.woff2`, `eb-garamond-latin-400-italic.woff2` | https://github.com/octaviopardo/EBGaramond12 | OFL-1.1, `LICENSES/eb-garamond-OFL.txt` |
| Libron | Reading, Interface | `libron-400-normal.woff2`, `libron-400-italic.woff2`, `libron-700-normal.woff2` | https://github.com/nicoverbruggen/libron | OFL-1.1, `LICENSES/libron-OFL.txt` |
| Playfair Display | Heading | `playfair-display-latin-var.woff2` | https://github.com/clauseggers/Playfair-Display | OFL-1.1, `LICENSES/playfair-display-OFL.txt` |
| JetBrains Mono | Code | `jetbrains-mono-500.woff2` | https://github.com/JetBrains/JetBrainsMono | OFL-1.1, `LICENSES/jetbrains-mono-OFL.txt` |
| Inter Tight | Interface | `inter-tight-latin-var.woff2` | https://github.com/rsms/inter-tight | OFL-1.1, `LICENSES/inter-tight-OFL.txt` |

A user-loaded font file is not covered by this file; it lives on the user's
device and is governed by whatever license came with it.

A reading face also records its x-height (lowercase height over the em) in the
registry. The app injects each reading face under an aliased family with a
`size-adjust` that matches the default face, so swapping the body face does not
change the printed size. A new reading face needs that value or it renders
unscaled.
