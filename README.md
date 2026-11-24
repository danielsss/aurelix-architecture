# Aurelix Architecture

[System overview — homepage](https://danielsss.github.io/aurelix-architecture/)

The homepage remains the system overview. Click **Control** or **Node Agent** to open the corresponding detail page. Both child pages provide a return path to the overview.

## Diagrams

- [System overview](https://danielsss.github.io/aurelix-architecture/): November 23 system snapshot, with Control and Agent navigation.
- [Node Agent architecture](https://danielsss.github.io/aurelix-architecture/agent-architecture.html): November 24 responsibilities, five business events, payloads and ACKs, configuration execution, retries, recovery, runtime adapters, local state and SQLite usage outbox.
- [Control capabilities](https://danielsss.github.io/aurelix-architecture/control-functions.html?from=index.html): the detailed feature snapshot from source commit `8cd7effb45d21e58dae78894695bcbc47b3b7b15`.
- [Historical system overview — November 19](https://danielsss.github.io/aurelix-architecture/architecture-2026-11-19.html): retained for history; its HTTP status-reporting path is obsolete.

## Evidence and limits

The Agent detail is pinned to application commit `0b6cd0d4e5ddf15b03351a020c969bb11776c863`. It distinguishes the status-report retry record in `state.json` from the independent usage collection worker and `usage.sqlite` durable outbox. The five events are connection confirmation, configuration application, runtime-user query, status report and usage report. Raw usage collection belongs to Agent; business pricing and entitlement decisions remain in Control.

The overview otherwise retains the November 23 working-tree snapshot based on application commit `3593b21f66886d7576ecb101a9e8eca000f65e50`, including uncommitted changes present at that time. Its older statements about missing metering describe that snapshot, not the current November 24 implementation. The new Agent detail supersedes those Agent-specific observation and metering statements. The Control feature map also retains its original source pin.

Pages were generated with Archify 3.3.0 and passed source, structure and automated browser checks; the Agent detail was additionally inspected in a desktop capture. They are static code snapshots, not live application state or production acceptance. Application source code, credentials, local source snapshots and diagnostic reports are not published here.

## Publishing

GitHub Pages serves the root of `main`. Keep the overall architecture at `index.html`, the Control child at `control-functions.html`, and the Agent child at `agent-architecture.html`. Preserve both node links and return navigation. Historical pages use dated filenames. `.nojekyll` disables Jekyll processing.
