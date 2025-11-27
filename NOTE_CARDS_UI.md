# Note Card Components - UI Documentation

## Overview
Komponen kartu note yang membedakan tampilan antara **Private Notes** (gaya diary) dan **Public Notes** (gaya social media).

---

## Components

### 1. PrivateNoteCard
**Purpose:** Menampilkan note pribadi dengan tampilan diary/journal yang personal dan intimate.

**Visual Style:**
- 🎨 Background: Gradien pastel (amber/orange/yellow tones)
- 📝 Typography: Serif font untuk journal feel
- 🔒 Lock icon di header
- 🌤️ Small emotion tag dengan "Mood:" prefix
- 📅 Prominent timestamp dengan format natural ("Today at 9:03 PM")
- ✨ Soft shadows dan border

**Usage:**
```tsx
import PrivateNoteCard from "@/components/PrivateNoteCard";

<PrivateNoteCard
  note={noteData}
  showMenu={true}
  onEdit={() => handleEdit()}
  onDelete={() => handleDelete()}
/>
```

**Props:**
- `note: NoteType` - Data note (required)
- `showMenu?: boolean` - Tampilkan tombol edit/delete
- `onEdit?: () => void` - Handler untuk edit
- `onDelete?: () => void` - Handler untuk delete

---

### 2. PublicNoteCard
**Purpose:** Menampilkan note publik dengan tampilan social media feed yang engaging.

**Visual Style:**
- 🎨 Background: Pure white dengan border dan shadow
- 👤 Avatar & username penulis
- 🌍 Globe icon untuk menandakan public
- 🎭 Large emotion badge di bawah konten
- ❤️ Social action buttons (like, comment, share)
- 📖 "Read more" button untuk content yang panjang
- ✨ Hover effects dan transitions

**Usage:**
```tsx
import PublicNoteCard from "@/components/PublicNoteCard";

<PublicNoteCard
  note={noteData}
  showMenu={true}
  isOwner={true}
  onEdit={() => handleEdit()}
  onDelete={() => handleDelete()}
/>
```

**Props:**
- `note: NoteType` - Data note (required)
- `showMenu?: boolean` - Tampilkan menu action
- `isOwner?: boolean` - Apakah user adalah pemilik note
- `onEdit?: () => void` - Handler untuk edit
- `onDelete?: () => void` - Handler untuk delete

---

### 3. EmotionTag (Helper)
**Purpose:** Reusable emotion badge dengan 3 varian style.

**Variants:**
- `small` - Kecil untuk inline display (default)
- `large` - Besar untuk emphasis, dengan score percentage
- `diary` - Special style untuk private notes dengan "Mood:" prefix

**Usage:**
```tsx
import EmotionTag from "@/components/EmotionTag";

// Small variant
<EmotionTag label="happy" />

// Large variant dengan score
<EmotionTag label="sad" score={0.87} variant="large" />

// Diary variant
<EmotionTag label="calm" variant="diary" />
```

**Props:**
- `label: string` - Emotion label (e.g., "happy", "sad")
- `score?: number` - Score 0-1 (optional)
- `variant?: "small" | "large" | "diary"` - Style variant
- `className?: string` - Additional Tailwind classes

---

### 4. ListNotes (Updated)
**Purpose:** Smart list yang otomatis memilih komponen yang tepat berdasarkan `note.isPublic`.

**Auto-Detection:**
- Jika `note.isPublic === false` → render `PrivateNoteCard`
- Jika `note.isPublic === true` → render `PublicNoteCard`

**Usage:**
```tsx
import ListNotes from "@/components/ListNotes";

<ListNotes notes={notesArray} />
```

---

## Visual Differences Summary

| Feature | Private Note | Public Note |
|---------|--------------|-------------|
| Background | Amber/beige gradient | Pure white |
| Avatar | ❌ None | ✅ Shows author |
| Font | Serif (journal) | Sans-serif |
| Emotion Display | Small "Mood:" tag | Large badge |
| Social Actions | ❌ None | ✅ Like, comment, share |
| Timestamp | Prominent, natural | Standard format |
| Icon | 🔒 Lock | 🌍 Globe |
| Border | Soft amber | Gray |
| Feel | Personal, intimate | Social, engaging |

---

## Tailwind Classes Used

### Private Note
```css
bg-gradient-to-br from-amber-50/80 via-orange-50/60 to-yellow-50/70
rounded-2xl
border-amber-200/40
font-serif (untuk title dan content)
text-amber-900/60 (untuk secondary text)
```

### Public Note
```css
bg-white
rounded-xl
border-gray-200
shadow-sm hover:shadow-md
ring-2 ring-gray-100 (avatar)
font-bold (title)
hover:text-indigo-600 (interactive elements)
```

---

## Integration Example

```tsx
// Di halaman /note/yours/private
import ListNotes from "@/components/ListNotes";

function PrivateNotesPage() {
  const [notes, setNotes] = useState<NoteType[]>([]);
  
  useEffect(() => {
    // Fetch private notes
    fetch('/api/notes?scope=private')
      .then(res => res.json())
      .then(data => setNotes(data.notes));
  }, []);

  return (
    <div className="space-y-6">
      <ListNotes notes={notes} />
    </div>
  );
}
```

---

## Accessibility

- ✅ Semantic HTML (`<article>`, `<time>`)
- ✅ ARIA labels pada icon buttons
- ✅ Keyboard navigation support
- ✅ Focus states pada interactive elements
- ✅ Color contrast ratio meets WCAG standards

---

## Performance Notes

- Components menggunakan `"use client"` untuk interactivity
- Avatar images menggunakan Next.js Image optimization
- Emotion colors di-cache dari utility function
- Conditional rendering untuk optimal bundle size

---

## Future Enhancements

Possible improvements:
- [ ] Add animation transitions saat switch antara private/public
- [ ] Implement drag-to-reorder untuk private notes
- [ ] Add custom themes untuk private notes (light/dark/sepia)
- [ ] Implement comment system untuk public notes
- [ ] Add share modal untuk public notes
- [ ] Export private notes ke PDF/markdown
