# Response/Reflection Feature

Fitur untuk menambahkan respons atau refleksi pada note dengan dukungan penuh untuk nested replies dan likes (khusus public notes).

## Overview

- **Private Notes**: Menggunakan istilah "Reflections" (tanpa fitur like)
- **Public Notes**: Menggunakan istilah "Responses" (dengan like dan nested replies)

## Components

### 1. Card Components

#### PrivateNoteCard
- Menampilkan jumlah reflections di footer card (hanya jika ada)
- Icon: `MessageCircle` dengan counter
- Style: subtle gray dengan minimal design

#### PublicNoteCard
- Menampilkan jumlah responses di action bar
- Icon: `MessageCircle` dengan counter
- Terintegrasi dengan action buttons lain (Like, Share)

### 2. Response Component (`src/app/(main)/note/[id]/Response.tsx`)

Komponen client-side yang menangani display dan interaksi responses/reflections.

#### Props
```typescript
interface ResponseProps {
  noteId: string;
  initialResponses: NoteResponse[];
  isPublic: boolean;
}
```

#### Features

**For All Notes (Public & Private)**:
- Display list of responses/reflections
- Add new response/reflection (authenticated users only)
- Real-time local state updates

**For Public Notes Only**:
- Like responses (Heart icon with counter)
- Add nested replies to responses
- Like nested replies
- Reply button on each response

**For Private Notes**:
- Simple text-only reflections
- No like or reply features
- Personal diary-style UI

#### Sub-components

**ResponseItem**:
- Displays individual response/reflection
- Handles like functionality (public only)
- Manages reply box state (public only)
- Shows nested replies

**ReplyItem**:
- Displays nested reply
- Handles like functionality (public only)
- Compact design with gray background

## API Endpoints

### POST `/api/notes/[id]/response`

Add new response/reflection to a note.

**Request Body**:
```json
{
  "text": "Response text here"
}
```

**Authorization**:
- Requires authentication
- For private notes: only owner can add reflections

**Response**:
```json
{
  "message": "Response added",
  "note": { /* updated note with responses */ }
}
```

### PATCH `/api/notes/[id]/response`

Update response (like or add reply).

**Actions**:

1. **like-response**: Increment likes on a response
```json
{
  "action": "like-response",
  "responseIndex": 0
}
```

2. **like-reply**: Increment likes on a nested reply
```json
{
  "action": "like-reply",
  "responseIndex": 0,
  "replyIndex": 0
}
```

3. **add-reply**: Add nested reply to a response
```json
{
  "action": "add-reply",
  "responseIndex": 0,
  "replyText": "Reply text here"
}
```

**Authorization**:
- Requires authentication
- Like actions: public notes only
- Add reply: public notes only

**Response**:
```json
{
  "message": "Response/Reply updated",
  "response": { /* updated response */ },
  // or
  "reply": { /* updated reply */ }
}
```

## Data Model

### Note Schema Extensions
```typescript
interface NoteResponseReply {
  text: string;
  author: ObjectId; // User who wrote the reply
  likes: number;
  likedBy: ObjectId[]; // Users who liked this reply
  createdAt: Date;
}

interface NoteResponse {
  text: string;
  author: ObjectId; // User who wrote the response
  likes: number;
  likedBy: ObjectId[]; // Users who liked this response
  createdAt: Date;
  replies: NoteResponseReply[];
}

interface INote {
  // ... other fields
  responses: NoteResponse[];
}
```

### User Attribution
- Each response and reply includes `author` field (populated with user data)
- Each includes `createdAt` timestamp for "time ago" display
- Each includes `likedBy` array to prevent duplicate likes

## UI/UX Design

### Private Notes (Reflections)
- **Title**: "Reflections (count)"
- **Placeholder**: "Write a reflection on this entry..."
- **Button**: "Add Reflection"
- **Style**: Minimal, diary-like, no distractions
- **Features**: Text only, no social features

### Public Notes (Responses)
- **Title**: "Responses (count)"
- **Placeholder**: "Share your thoughts..."
- **Button**: "Add Response"
- **Style**: Social media-like with engagement features
- **Features**:
  - Like responses and replies (Heart icon)
  - Nested replies (Reply button)
  - Like counts visible
  - Interactive hover states

## Integration with Note Detail Page

In `src/app/(main)/note/[id]/page.tsx`:

```tsx
<Response 
  noteId={note._id?.toString() ?? ""} 
  initialResponses={note.responses || []} 
  isPublic={note.isPublic}
/>
```

The component automatically adapts its behavior based on `isPublic` prop.

## State Management

- **Local State**: Uses React useState for optimistic UI updates
- **Server Sync**: Fetches from API and updates local state on success
- **Optimistic Updates**: Like actions immediately update UI, rollback on error
- **Refresh**: Manual refresh function for nested reply additions

## Security & Validation

- All endpoints require authentication
- Private note reflections: owner-only access
- Public note responses: any authenticated user
- Public note likes/replies: any authenticated user
- **One like per user**: Each user can only like a response/reply once (tracked via `likedBy` array)
- Input validation: text trimming, non-empty checks
- Index validation: prevents out-of-bounds access
- Author attribution: automatically added on creation

## Future Enhancements

- [ ] User attribution for responses (show who wrote each response)
- [ ] Edit/delete own responses
- [ ] Notification system for new responses
- [ ] Rich text support in responses
- [ ] Pagination for large response lists
- [ ] Sort/filter responses (by date, likes)
- [ ] Anonymous responses toggle
