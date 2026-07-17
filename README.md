# Token Pulse Mobile

Private, installable mobile companion for Token Pulse. The desktop application sends a summarized snapshot to an authenticated Vercel endpoint. The dashboard requires a separate read token and polls for updates every 30 seconds.

Raw prompts, credentials, message bodies, and source session files are never transmitted. The relay stores only the latest snapshot in a private Vercel Blob.

## Required environment variables

- `BLOB_READ_WRITE_TOKEN`
- `SYNC_TOKEN`
- `DASHBOARD_TOKEN`

## Local verification

```powershell
npm install
npm run build
```
