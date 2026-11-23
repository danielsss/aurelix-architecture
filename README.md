# Aurelix Architecture

[System overview — homepage](https://danielsss.github.io/aurelix-architecture/)

The homepage is the system architecture, updated on November 23, 2026. Click **Control** in the diagram to open its detailed capabilities map; the child page provides a Back control when opened from the overview.

## Diagrams

- [Current system overview](https://danielsss.github.io/aurelix-architecture/): Web, Control, MongoDB, Redis, Node Agent, local state, Xray, subscriptions, SSH/Docker maintenance, and optional DNS/ACME integration.
- [Control capabilities](https://danielsss.github.io/aurelix-architecture/control-functions.html?from=index.html): the detailed feature snapshot from source commit `8cd7effb45d21e58dae78894695bcbc47b3b7b15`.
- [Historical system overview — November 19](https://danielsss.github.io/aurelix-architecture/architecture-2026-11-19.html): retained for history; its HTTP status-reporting path is obsolete.

## Evidence and limits

The current overview describes the November 23 working tree based on application commit `3593b21f66886d7576ecb101a9e8eca000f65e50`, including uncommitted certificate/environment configuration and node SSH selection changes at capture time. Evidence was checked against a separate local snapshot; its revision is not an application release commit. The older Control detail retains its original source pin; later SSH key-library and certificate-environment changes are described in the current overview.

Both current pages were generated with Archify 3.3.0 and passed source, structure and automated browser checks. They describe static code snapshots, not live application state or production acceptance. Application source code, credentials, local source snapshots and diagnostic reports are not published here. Source paths are references; access to the private application repository remains separate.

## Publishing

GitHub Pages serves the root of `main`. Publish the system overview as `index.html`, its Control child as `control-functions.html`, and retain historical snapshots under dated filenames. Keep the Control node link and the child return path working. `.nojekyll` disables Jekyll processing.
