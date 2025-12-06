# Live Radio Backend - Frontend API Guide

**Base URL:** `http://localhost:{PORT}`

---

## General Routes

### `GET /`
Returns API info.

**Success (200):**
```json
{
  "name": "Live Radio Backend",
  "version": "1.0.0",
  "description": "Live radio application with YouTube Music streaming",
  "endpoints": { "api": "/api", "health": "/health" }
}
```

### `GET /health`
Health check endpoint.

**Success (200):**
```json
{
  "status": "ok",
  "timestamp": "2025-12-06T10:00:00.000Z",
  "uptime": 3600
}
```

---

## User Routes (`/api/user`)

### `POST /api/user/register`
Register a new user.

**Request Body:**
```json
{ "name": "string", "avatarId": number }
```

**Success (201):**
```json
{
  "success": true,
  "user": { "id": "user_123_abc", "name": "John", "avatarId": 5, "isOnline": false }
}
```

**Failure (400):**
```json
{ "success": false, "error": "Name is required" }
{ "success": false, "error": "Avatar ID must be a number" }
{ "success": false, "error": "Name is already taken" }
```

### `GET /api/user/online`
Get all online users.

**Success (200):**
```json
{
  "count": 5,
  "users": [{ "id": "user_123", "name": "John", "avatarId": 5, "isOnline": true }]
}
```

### `GET /api/user/:userId`
Get a specific user by ID.

**Success (200):**
```json
{ "id": "user_123", "name": "John", "avatarId": 5, "isOnline": true }
```

**Failure (404):**
```json
{ "success": false, "error": "User not found" }
```

### `GET /api/user/chat/history?count=50`
Get chat message history.

**Success (200):**
```json
{
  "messages": [
    {
      "id": "uuid",
      "userId": "user_123",
      "username": "John",
      "avatarId": 5,
      "message": "Hello!",
      "timestamp": "2025-12-06T10:00:00.000Z"
    }
  ]
}
```

---

## Radio Routes (`/api/radio`)

### `GET /api/radio/status`
Get current radio state.

**Success (200):**
```json
{
  "currentSong": {
    "id": "dQw4w9WgXcQ",
    "title": "Song Title",
    "artist": "Artist Name",
    "album": "Album Name",
    "duration": 240,
    "thumbnail": "https://...",
    "url": "https://..."
  },
  "isPlaying": true,
  "startTime": 1701860000000,
  "position": 45,
  "listenerCount": 10
}
```
*Note: `currentSong` is `null` when nothing is playing.*

### `GET /api/radio/stream`
Audio stream endpoint (returns audio/mpeg data).

**Success:** Streams audio data with headers:
- `Content-Type: audio/mpeg`
- `Transfer-Encoding: chunked`

**Failure (404):**
```json
{ "success": false, "error": "No song is currently playing" }
```

**Failure (503):**
```json
{ "success": false, "error": "Stream not available" }
```

### `POST /api/radio/stop`
Stop the current playback.

**Success (200):**
```json
{ "success": true, "message": "Playback stopped" }
```

---

## Queue Routes (`/api/queue`)

### `POST /api/queue`
Add a song to the queue.

**Request Body:**
```json
{ "id": "dQw4w9WgXcQ" }
```
*Note: `id` is a YouTube video ID.*

**Success (201):**
```json
{
  "success": true,
  "song": { "id": "...", "title": "...", "artist": "...", "album": "...", "duration": 240, "thumbnail": "...", "url": "..." },
  "playlist": [/* array of song objects */]
}
```

**Failure (400):**
```json
{ "success": false, "error": "YouTube video ID is required" }
```

**Failure (404):**
```json
{ "success": false, "error": "Could not find song information" }
```

### `GET /api/queue`
Get current playlist and playing song.

**Success (200):**
```json
{
  "currentSong": { /* song object or null */ },
  "playlist": [/* array of song objects */]
}
```

### `DELETE /api/queue/:index`
Remove a song from the queue by index.

**Success (200):**
```json
{
  "success": true,
  "removed": { /* song object */ },
  "playlist": [/* updated playlist */]
}
```

**Failure (400):**
```json
{ "success": false, "error": "Invalid index" }
```

**Failure (404):**
```json
{ "success": false, "error": "Song not found at index" }
```

### `DELETE /api/queue`
Clear the entire playlist.

**Success (200):**
```json
{ "success": true, "message": "Playlist cleared" }
```

---

## Search Routes (`/api/search`)

### `GET /api/search?query=song+name`
Search for a song on YouTube.

**Success (200):**
```json
{
  "success": true,
  "song": { "id": "...", "title": "...", "artist": "...", "album": "...", "duration": 240, "thumbnail": "...", "url": "..." }
}
```

**Failure (400):**
```json
{ "success": false, "error": "Query must be at least 2 characters" }
```

**Failure (404):**
```json
{ "success": false, "error": "No results found" }
```

### `GET /api/search/song/:id`
Get song info by YouTube video ID.

**Success (200):**
```json
{
  "success": true,
  "song": { "id": "...", "title": "...", "artist": "...", "album": "...", "duration": 240, "thumbnail": "...", "url": "..." }
}
```

**Failure (400):**
```json
{ "success": false, "error": "Video ID is required" }
```

**Failure (404):**
```json
{ "success": false, "error": "Song not found" }
```

### `POST /api/search/validate`
Validate a YouTube URL.

**Request Body:**
```json
{ "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
```

**Success (200):**
```json
{ "isValid": true, "videoId": "dQw4w9WgXcQ", "url": "https://..." }
```

**Failure (400):**
```json
{ "success": false, "error": "URL is required" }
```

---

## Socket.IO Events

**Connect to:** `ws://localhost:{PORT}`

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `authenticateUser` | `{ userId: string }` | Authenticate with a registered user ID |
| `sendMessage` | `{ message: string }` | Send a chat message |
| `requestRadioState` | - | Request current radio state |
| `requestPlaylist` | - | Request current playlist |
| `requestListenerCount` | - | Request listener count |
| `requestOnlineUsers` | - | Request online users list |

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `radioUpdate` | `{ currentSong, isPlaying, startTime, position, listenerCount }` | Radio state changed |
| `playlistUpdate` | `{ playlist: Song[] }` | Playlist updated |
| `usersUpdate` | `{ users: User[] }` | Online users list updated |
| `chatHistory` | `{ messages: Message[] }` | Chat history (on connect) |
| `newMessage` | `{ id, userId, username, avatarId, message, timestamp }` | New chat message |
| `authSuccess` | `{ user, message }` | Authentication successful |
| `authError` | `{ message }` | Authentication failed |
| `messageError` | `{ message }` | Message send failed |
| `userJoined` | `{ id, name, avatarId, isOnline }` | User registered |
| `userOnline` | `{ id, name, avatarId, isOnline }` | User came online |
| `userOffline` | `{ id, name, avatarId, isOnline }` | User went offline |
| `listenerUpdate` | `{ count: number }` | Listener count changed |

---

## Data Types

### Song Object
```json
{
  "id": "dQw4w9WgXcQ",
  "title": "Song Title",
  "artist": "Artist Name",
  "album": "Album Name",
  "duration": 240,
  "thumbnail": "https://i.ytimg.com/...",
  "url": "https://www.youtube.com/watch?v=..."
}
```

### User Object
```json
{
  "id": "user_1701860000000_abc123",
  "name": "Username",
  "avatarId": 5,
  "isOnline": true
}
```

### Message Object
```json
{
  "id": "uuid-v4",
  "userId": "user_123",
  "username": "Username",
  "avatarId": 5,
  "message": "Hello!",
  "timestamp": "2025-12-06T10:00:00.000Z"
}
```

---

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "error": "Error message",
  "stack": "..." // Only in development mode
}
```

**404 Not Found (invalid route):**
```json
{ "success": false, "error": "Route not found" }
```
