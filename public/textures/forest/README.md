# Forest textures

Photographed leaf and bark surfaces derived from **Tree Small 02**, by **Rico Cilliers**, Poly Haven.

- Source: https://polyhaven.com/a/tree_small_02
- Asset license: **CC0-1.0**, https://polyhaven.com/license
- Original download URLs and SHA-256 hashes: `sources.json`
- Output sizes, dimensions and hashes: `manifest.json`

The multi-million-triangle source tree is not included. Two leaf surfaces were isolated from its UV atlas, cleaned of padding and assembled into transparent twig cards. Bark color/normal were cropped from bark UV islands. The four distant-tree views are offline orthographic projections of our deterministic tree geometry with these twig cards.

Runtime uses only these four local WebP files, with mipmaps. No external requests, services, paid assets or WASM texture decoder are required. WebP reduces download size; its decoded GPU memory is still budgeted as uncompressed RGBA (about 12.3 MiB with mipmaps).

Rebuild from project root with Node 22, the existing Vite dependency and an optional local `sharp` installation:

```sh
node scripts/build-forest-assets.mjs
```

Alternatively pass `--sharp /absolute/path/to/sharp-entry.cjs`. Original working PNGs are cached in ignored `.asset-work/`; only optimized outputs belong in public/Git. CI checks the committed assets without downloading the originals or running the asset preparation script.
