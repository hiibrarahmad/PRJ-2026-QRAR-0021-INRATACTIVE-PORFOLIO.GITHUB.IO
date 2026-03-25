<div align="center">

# PRJ-2026-QRAR-0021-INRATACTIVE-PORFOLIO

### Hybrid AR Portfolio ? QR Generator ? Live GitHub Cards

[![Platform](https://img.shields.io/badge/Platform-WebXR%20%2B%20AR.js-0ea5e9?style=for-the-badge)](#)
[![Mode](https://img.shields.io/badge/Mode-Hybrid%20AR-22c55e?style=for-the-badge)](#)
[![Portfolio](https://img.shields.io/badge/GitHub-Live%20Cards-f59e0b?style=for-the-badge)](#)

[Live Demo](https://hiibrarahmad.github.io/PRJ-2026-QRAR-0021-INRATACTIVE-PORFOLIO.GITHUB.IO/) ?
[Launch AR](https://hiibrarahmad.github.io/PRJ-2026-QRAR-0021-INRATACTIVE-PORFOLIO.GITHUB.IO/ar.html) ?
[Marker Mode](https://hiibrarahmad.github.io/PRJ-2026-QRAR-0021-INRATACTIVE-PORFOLIO.GITHUB.IO/marker.html)

</div>

---

## Overview

This repository creates a shareable QR code that launches an **interactive AR portfolio**. The AR panel floats in the air and shows live GitHub repositories. Users can adjust transparency, scale, and rotate the panel while navigating projects.

---

## Features

- Hybrid AR: WebXR (markerless) + AR.js marker fallback
- Live GitHub cards (auto-updates)
- QR generator with download + copy link
- Transparency slider and scale controls
- Repo navigation + open-in-GitHub
- Mobile-first UI with clean, professional styling

---

## How To Use

1. Open the landing page and generate a QR code.
2. Scan on mobile to launch AR.
3. Adjust transparency/scale and browse projects.
4. If WebXR is not supported, use Marker Mode.

---

## AR Modes

| Mode | Best For | Notes |
|------|----------|------|
| WebXR | Android Chrome | Markerless, best in-air effect |
| Marker Mode | Wider support | Uses Hiro marker, works on more devices |

Marker image is included: `assets/hiro-marker.png`

---

## Controls

- Transparency slider
- Scale slider
- Rotate left/right
- Prev/Next repository
- Open repository in GitHub

---

## Repository Structure

```
PRJ-2026-QRAR-0021-INRATACTIVE-PORFOLIO.GITHUB.IO/
|
|-- assets/
|   |-- app.js
|   |-- ar.js
|   |-- ar.css
|   |-- styles.css
|   |-- qrcode.min.js
|   |-- hiro-marker.png
|-- index.html
|-- ar.html
|-- marker.html
|-- .gitattributes
|-- README.md
```

---

## Notes

This is a web-based AR experience and is subject to device/browser support. For best results, use Android Chrome with WebXR enabled.

---

<div align="center">

Copyright 2026 Hibrar Ahmad (hiibrarahmad). All Rights Reserved.

</div>
