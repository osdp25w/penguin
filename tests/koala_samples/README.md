# Koala API Samples

This folder contains JSON snapshots and Markdown summaries captured from live calls to the Koala backend (https://koala.osdp25w.xyz).

How to run
- Provide credentials via env vars, then run the script:

```
KOALA_EMAIL="<your email>" \
KOALA_PASSWORD="<your password>" \
KOALA_BASE_URL="https://koala.osdp25w.xyz" \
node ../../scripts/koala_test.mjs
```

- Or from the penguin dir using npm:

```
cd penguin
KOALA_EMAIL="<your email>" KOALA_PASSWORD="<your password>" npm run test:koala
```

What it saves
- One JSON per endpoint call: `<name>__<timestamp>.json`
- One `summary__<timestamp>.json` with a list of all calls
- One `SUMMARY_<timestamp>.md` human‑readable report (selected samples, counts)

Notes
- The script attempts plaintext login first; if it fails, it encrypts the password via `https://penguin.osdp25w.xyz/api/fernet/encrypt` and retries.
- The script only performs safe, read‑only requests.
- For error‑log single item, it tries common variants and also picks a real id from the list to validate the detail endpoint.
