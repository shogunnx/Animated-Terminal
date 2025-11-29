# TSV Terminal - Quick Reference Card

## 🎯 Character IDs & Colors

| Character | ID | Accent Color | Glow Color |
|-----------|----|--------------|-----------| 
| Victoria Black | `victoria_black` | #76FFE1 (Teal) | #8C50FF (Purple) |
| Wargirl | `wargirl` | #FF66C4 (Pink) | #FFD64D (Gold) |
| Binary | `binary` | #C7A4FF (Purple) | #7B2DFF (Deep Purple) |
| Vanessa | `vanessa` | #FF3D5A (Red) | #FFCC4D (Gold) |
| Harmony | `harmony` | #63B3FF (Blue) | #A7F0FF (Cyan) |
| Evil Victoria | `evil_victoria` | #FF4B4B (Red) | #B000FF (Purple) |
| Veronica | `veronica` | #FFB84D (Orange) | #63B3FF (Blue) |

## 🔗 Key URLs

| Page | URL | Purpose |
|------|-----|---------|
| Home | `/` | Terminal welcome |
| Characters | `/characters` | Character archive |
| Profile | `/characters/:id` | Chat interface |
| Room | `/rooms/:id` | Interactive bedroom |
| DeviantArt | `/deviantart` | Gallery feed |

## 📡 Backend API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Health check |
| `/api/status` | GET | Service status |
| `/api/nexus/{path}` | ALL | Nexus proxy |
| `/api/girlsmind/{path}` | ALL | GirlsMind proxy |
| `/api/deviantart/latest` | GET | RSS feed |

## 📁 Important Files

| File | What It Does |
|------|--------------|
| `/app/backend/server.py` | Backend API & proxies |
| `/app/frontend/src/content/tsvContent.js` | Character & room data |
| `/app/frontend/src/lib/api.js` | API calls & nexusChat() |
| `/app/frontend/src/styles/tsv-ui.css` | Terminal styling |
| `/app/frontend/public/assets/portraits/` | Portrait images |

## ⚡ Quick Commands

```bash
# Restart services
sudo supervisorctl restart all
sudo supervisorctl restart backend
sudo supervisorctl restart frontend

# Check logs
tail -f /var/log/supervisor/backend.err.log
tail -f /var/log/supervisor/frontend.err.log

# Test API
curl http://localhost:8001/api/status
curl http://localhost:8001/api/health

# Test Nexus
curl -X POST http://localhost:8001/api/nexus/api/chat/victoria_black \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
```

## 🎨 Room Hotspot Actions

| Action | Purpose |
|--------|---------|
| `memories` | Memory traces |
| `personality` | Personality files |
| `status` | System status |
| `raid_logs` | Raid/combat logs |
| `evolution` | Evolution data |
| `relationship` | Relationship info |

## 🔧 Common Fixes

**Chat not working?**
→ Edit `/app/frontend/src/lib/api.js` - adjust `nexusChat()` function

**Portraits not showing?**
→ Add images to `/app/frontend/public/assets/portraits/[character_id].png`

**Service offline?**
→ Check `/api/status` endpoint for service health

**DeviantArt blocked?**
→ Expected behavior (403), gracefully handled

## 🌐 Service Status

- ✅ Nexus: https://nexus-multiverse.emergent.host
- ✅ GirlsMind: https://girlsmind-1.emergent.host  
- ⚠️ DeviantArt: RSS blocked (handled)

## 📊 Current State

✅ **Working**: All UI pages, navigation, status monitoring, proxies
⚠️ **Needs Config**: Portraits (placeholder SVGs), Nexus chat endpoint
❌ **Blocked**: DeviantArt RSS (external issue)

---

**Full Documentation**: `/app/TSV_TERMINAL_GUIDE.md`
