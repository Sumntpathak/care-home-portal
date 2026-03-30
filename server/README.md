# Shanti Care LAN Server

Local hospital network server for offline-first sync.

## Quick Start

```bash
cd server
npm install
npm start
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 8787 | Server port |
| CLOUD_API_URL | (none) | Cloud API for replication |

## Connecting Devices

Set in your `.env`:
```
VITE_LAN_URL=http://192.168.1.100:8787
```

Devices auto-discover: LAN → Cloud → Offline
