# Aurelix Architecture

[Control capabilities — current homepage](https://danielsss.github.io/aurelix-architecture/)

The homepage maps Control capabilities from source commit `8cd7effb45d21e58dae78894695bcbc47b3b7b15`, inspected on November 23, 2026. It covers administrator and account access, node lifecycle, protocols and certificates, plans and entitlements, subscriptions, and background coordination. The diagram includes source references, API entry points, execution conditions and known implementation limits.

## Historical overview

[System architecture — November 19, 2026 snapshot](https://danielsss.github.io/aurelix-architecture/architecture-2026-11-19.html)

The historical overview includes working-tree changes present when it was generated. It does not reflect later changes: notably, Control/Agent communication now uses Socket.IO for status reports as well as management commands; HTTP status reporting in that older diagram is obsolete. Subscriptions, campaigns, certificates, Docker installation and Agent updates have also been added since that snapshot.

## Scope and publishing

These standalone HTML pages describe static source-code snapshots, not live application state or proof of production deployment. The current diagram passed source, structure and automated browser checks. Source references point to the private application repository and require appropriate GitHub access; application source code, credentials and local evidence snapshots are not published here.

GitHub Pages serves the root of the `main` branch. Update `index.html` and push to `main` to publish a new homepage. Preserve older diagrams under dated filenames. `.nojekyll` disables Jekyll processing.
