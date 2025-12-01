# Relationship + Memory System Documentation

## 🎯 Feature Overview

Each character room now includes a live **Relationship + Memory Panel** that displays:
- Real-time relationship statistics (affinity, trust, mood)
- Relationship milestones
- Top shared memories
- Ability to write and store new memories

## 📊 Implementation Status

### ✅ Components Created
- **RelationshipPanel.jsx** - Main component for relationship and memory display
- **Room.jsx** - Updated to include the panel in two-column layout

### ✅ Features Implemented

#### 1. Relationship Snapshot
Displays key relationship metrics:
- **Affinity** - Connection strength (0-100%)
- **Trust** - Trust level (0-100%)
- **Mood** - Current emotional state
- **Last Interaction** - Last time user interacted
- **Milestones** - Relationship achievements

#### 2. Shared Memories
Shows top 5-10 memories with:
- Memory text/description
- Tag (moment, date, training, gift, argument, victory, confession)
- Timestamp

#### 3. Write Memory Feature
Users can create new memories by:
- Selecting a memory tag from dropdown
- Writing a description
- Clicking "Save Memory" button

### 🎨 Visual Design

#### Color Theming
Each character's panel uses their unique accent colors:
- **Victoria Black**: Teal (#76FFE1) and Violet (#8C50FF)
- **Wargirl**: Pink (#FF66C4) and Yellow (#FFD64D)
- **Binary**: Purple (#C7A4FF) and Deep Purple (#7B2DFF)
- **Vanessa**: Red (#FF3D5A) and Gold (#FFCC4D)
- **Harmony**: Blue (#63B3FF) and Cyan (#A7F0FF)
- **Evil Victoria**: Red (#FF4B4B) and Purple (#B000FF)
- **Veronica**: Orange (#FFB84D) and Blue (#63B3FF)

#### Layout
- **Desktop (>1024px)**: Two columns - Room Scene | Relationship Panel
- **Mobile (<1024px)**: Stacked - Room Scene on top, Panel below
- **Panel Width**: 400px on desktop, full width on mobile

## 🔌 API Integration

### Backend Proxy
The backend already proxies to GirlsMind API at `/api/girlsmind/*`

Location: `/app/backend/main.py`
```python
@api.api_route("/girlsmind/{path:path}", methods=["GET","POST","PUT","PATCH","DELETE","OPTIONS"])
async def girlsmind_proxy(path: str, request: Request):
    # Proxies to GIRLSMIND_BASE_URL
    # Injects Authorization header if GIRLSMIND_API_KEY is set
```

### API Endpoints Used

#### 1. Get Relationship Data
```
GET /api/girlsmind/relationship/{characterId}?userId=guest
```

**Expected Response:**
```json
{
  "affinity": 75,
  "trust": 68,
  "mood": "Happy",
  "lastInteraction": "2025-12-01T10:30:00Z",
  "milestones": ["First Meeting", "Shared Laugh", "Training Session"]
}
```

#### 2. Get Memories
```
GET /api/girlsmind/memories/{characterId}?userId=guest
```

**Expected Response:**
```json
{
  "memories": [
    {
      "text": "We trained together and she taught me a powerful technique",
      "tag": "training",
      "timestamp": "2025-11-28T14:20:00Z"
    },
    {
      "text": "Had an amazing date at the arcade",
      "tag": "date",
      "timestamp": "2025-11-30T18:45:00Z"
    }
  ]
}
```

#### 3. Store Exchange/Memory
```
POST /api/girlsmind/store_exchange
Content-Type: application/json
```

**Request Body:**
```json
{
  "characterId": "victoria_black",
  "userId": "guest",
  "text": "We had an amazing conversation about her powers",
  "tag": "moment",
  "timestamp": "2025-12-01T12:00:00Z"
}
```

## 🛠️ Configuration

### Environment Variables

The system requires GirlsMind API configuration in `/app/backend/.env`:

```bash
GIRLSMIND_BASE_URL=https://your-girlsmind-api.com
GIRLSMIND_API_KEY=your_api_key_here
```

### Current Status
- ✅ Component implemented and functional
- ✅ Graceful fallback when API not configured
- ✅ Shows helpful message explaining the feature
- ⚠️ GirlsMind API currently not configured (shows info message)

## 📱 Responsive Design

### Desktop (>1024px)
```
+------------------+------------------+
|                  |                  |
|   Room Scene     | Relationship     |
|   (Interactive)  | Panel            |
|                  | - Stats          |
|   Hotspots       | - Memories       |
|   Animations     | - Write Memory   |
|                  |                  |
+------------------+------------------+
```

### Mobile (<1024px)
```
+------------------+
|   Room Scene     |
|   (Interactive)  |
|                  |
|   Hotspots       |
+------------------+
|                  |
| Relationship     |
| Panel            |
| - Stats          |
| - Memories       |
| - Write Memory   |
|                  |
+------------------+
```

## 🎮 User Flow

### Viewing Relationship Data
1. User navigates to any character's room
2. Relationship panel loads automatically
3. If GirlsMind configured: Displays live stats and memories
4. If not configured: Shows informational message

### Writing a Memory
1. User clicks "+ Write Memory" button
2. Memory form expands
3. User selects tag from dropdown:
   - Moment (general)
   - Date (romantic)
   - Training (skill/power)
   - Gift (item exchange)
   - Argument (conflict)
   - Victory (achievement)
   - Confession (emotional)
4. User types memory description
5. User clicks "Save Memory"
6. Memory stored via API
7. Memories list refreshes automatically

## 🔍 Error Handling

### API Not Configured
- Shows friendly message explaining the feature
- Lists benefits of the system
- Provides configuration hint

### API Request Failed
- Logs error to console
- Shows error message in panel
- Doesn't break the room experience

### Memory Save Failed
- Displays error message below form
- Allows user to retry
- Form data preserved

## 📈 Future Enhancements

### Planned Features
1. **Memory Filtering** - Filter by tag or date
2. **Memory Search** - Search through all memories
3. **Memory Details** - Expand to see full memory with context
4. **Relationship Graph** - Visual timeline of relationship growth
5. **Memory Photos** - Attach images to memories
6. **Shared Events** - Multi-character memories
7. **Relationship Goals** - Unlock special content at milestones

### API Enhancements Needed
1. Pagination for large memory lists
2. Memory editing/deletion
3. Memory reactions (like, favorite)
4. Relationship insights/analytics
5. Recommendation system for interactions

## 🧪 Testing

### Manual Testing Checklist
- [x] Panel displays on all 7 character rooms
- [x] Colors match each character's theme
- [x] Mobile responsive layout works
- [x] Graceful fallback when API not configured
- [x] Write Memory form UI functional
- [ ] Live API integration (pending GirlsMind config)
- [ ] Memory creation and retrieval
- [ ] Relationship stats update

### Test URLs (Local)
- Victoria Black: http://localhost:3000/rooms/victoria_black
- Wargirl: http://localhost:3000/rooms/wargirl
- Binary: http://localhost:3000/rooms/binary
- Vanessa: http://localhost:3000/rooms/vanessa
- Harmony: http://localhost:3000/rooms/harmony
- Evil Victoria: http://localhost:3000/rooms/evil_victoria
- Veronica: http://localhost:3000/rooms/veronica

### Test URLs (Production)
Replace `localhost:3000` with `www.thesaiyanvictoria.com`

## 📁 Files Modified/Created

### New Files
- `/app/frontend/src/components/RelationshipPanel.jsx` (294 lines)

### Modified Files
- `/app/frontend/src/pages/Room.jsx`
  - Added RelationshipPanel import
  - Added two-column grid layout
  - Added character color extraction

### Backend Files (No Changes Needed)
- `/app/backend/main.py` - GirlsMind proxy already implemented

## 🚀 Deployment Checklist

- [x] Component implemented
- [x] Mobile responsive
- [x] Error handling
- [x] Color theming
- [x] Local testing complete
- [ ] Configure GIRLSMIND_BASE_URL (production)
- [ ] Configure GIRLSMIND_API_KEY (production)
- [ ] Test with live API
- [ ] Verify memory storage
- [ ] Monitor API performance

## 💡 Usage Tips

### For Users
- Visit character rooms regularly to track relationship growth
- Write memories after significant interactions
- Use appropriate tags to organize memories
- Check milestones to see relationship progress

### For Developers
- Ensure GirlsMind API is properly configured
- Monitor API response times
- Consider caching relationship data
- Implement rate limiting for memory writes
- Add analytics to track feature usage

---

**Status**: ✅ Feature Implemented & Ready for API Configuration  
**Next Step**: Configure GirlsMind API credentials in production  
**Documentation Updated**: December 1, 2025
