# Security

Do not report vulnerabilities in a public issue. Contact the maintainer privately through the security-reporting channel listed on the GitHub repository.

Deployments require separate `SYNC_TOKEN` and `DASHBOARD_TOKEN` values. Keep them in Vercel environment variables and never commit `.env.local`, `.vercel`, desktop `remote-sync.json`, or `mobile-access.txt`.

The ingest endpoint validates authorization, schema, and payload size. The read endpoint is bearer-protected and disables shared caching. Private Blob storage is required.
