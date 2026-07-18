# Token Pulse Mobile

Private, installable mobile companion for Token Pulse. The desktop application sends a summarized snapshot to an authenticated Vercel endpoint. The dashboard exchanges its separate access key for a short-lived encrypted HttpOnly device session and polls for updates every 30 seconds.

Raw prompts, credentials, message bodies, and source session files are never transmitted. The relay stores only the latest snapshot in a private Vercel Blob.

The web dashboard never persists the access key or sends it with snapshot polling. The existing native iOS client temporarily retains its HTTPS bearer compatibility path until it is migrated to device sessions.

## Required environment variables

- `BLOB_READ_WRITE_TOKEN`
- `SYNC_TOKEN`
- `DASHBOARD_TOKEN`
- `SESSION_SECRET` (a dedicated random value of at least 32 characters)

## Local verification

```powershell
npm install
npm run build
```
