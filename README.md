# Aurelix Architecture

[System overview — homepage](https://danielsss.github.io/aurelix-architecture/)

The homepage remains the overall architecture. Its **Control** node opens the operation guide; its **Node Agent** node opens the Agent architecture. Both provide navigation back to the overview.

## Pages

- [System overview](https://danielsss.github.io/aurelix-architecture/): retained November 23 system snapshot, including Control and Agent navigation.
- [Control operations and mechanisms](https://danielsss.github.io/aurelix-architecture/control-functions.html?from=index.html): November 25 guide with 26 operations and 82 steps. Search or select one operation, then inspect its execution, state boundary, Xray impact, completion evidence, failure diagnosis and pinned source references. The default operation explains adding a server.
- [Configuration application sequence](https://danielsss.github.io/aurelix-architecture/control-config-sequence.html): Dashboard, Control, MongoDB, Agent and Xray interactions. Save / acceptance, final ACK, independent status reporting and page polling are distinguished.
- [Node Agent architecture](https://danielsss.github.io/aurelix-architecture/agent-architecture.html): retained November 24 responsibilities, five events, execution, retries, recovery, runtime adapters, local state and SQLite usage outbox.
- [Historical overview — November 19](https://danielsss.github.io/aurelix-architecture/architecture-2026-11-19.html): retained history; its HTTP status-reporting path is obsolete.

## Evidence and limits

The Control guide and configuration sequence are pinned to application commit `0b6cd0d4e5ddf15b03351a020c969bb11776c863`. They document node registration and verification, manual deployment and Agent upgrade, SSH, protocol / JSON / user configuration, domains and certificates, pools, plans, memberships, campaigns, read-only account state and conditional suspension handling, metering, billing rules, quota soft pause, uploader takeover, subscriptions, credential rotation, status, optimization and deletion.

Adding a node does not install or update Xray. Configuration application and membership delivery are asynchronous. An online Agent, healthy Xray, accepted request and applied revision are different signals. Quota enforcement is an asynchronous soft pause; it is not a real-time byte-exact cutoff. Deleting a node record does not uninstall remote services. These pages are static code explanations, not live node state or production/client acceptance. Guide controls only navigate local content; they do not call management APIs.

The Agent detail uses the same application commit. The overall diagram retains its November 23 working-tree snapshot based on application commit `3593b21f66886d7576ecb101a9e8eca000f65e50`, including uncommitted changes present at that time. Older missing-metering statements describe that historical snapshot. The current Control guide and Agent detail supersede the corresponding historical capability statements; the overall diagram was not regenerated in this update.

The configuration sequence passed Archify 3.3.0 source, structure, provenance and automated browser checks. The custom guide passed JavaScript syntax, local-link and source-reference checks; all 26 operation selections and their last steps were exercised in a browser. Desktop and mobile reading layouts were inspected. Application source, credentials, source snapshots and diagnostic receipts are not published.

## Publishing

GitHub Pages serves `/` from `main`. Keep `index.html` as the overall architecture and preserve the existing Control and Agent destinations. The guide uses `control-guide.css`, `control-guide.js` and `control-data.js`; deploy them together with `control-functions.html`. The supplementary diagram is `control-config-sequence.html`. `.nojekyll` disables Jekyll.

The custom guide's reading layout was adapted using [unslop by Damir Sokolovsky](https://heydamir.design/unslop), licensed under CC BY 4.0. Native diagrams are generated with [Archify](https://github.com/tt-a1i/archify).
