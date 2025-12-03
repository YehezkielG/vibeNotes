# 📝 vibeNotes

**Signal in the noise — an AI-powered sanctuary for self-reflection.**

vibeNotes is an AI-assisted note-taking application focused on personal reflection and mental well-being. Write, share, and analyze your daily thoughts with AI-powered emotion analysis, keep your private moments private, and connect safely with a community.

## ✨ Key Features

- **Emotion Analysis**: Each note is analyzed by AI to surface dominant emotions (happy, sad, angry, fearful, neutral).
- **Weekly Insights**: Receive weekly summaries and AI-generated reflections on your emotional patterns.
- **Privacy Controls**: Mark notes as public, private, or followers-only.
- **Responses & Interaction**: Comment on public notes and engage with other users.
- **Like & Follow**: Like notes and follow users to curate your feed.
- **Notifications**: Get notified about interactions on your notes.
- **Dark Mode**: Comfortable dark theme for low-light usage.
- **User Profiles**: Manage avatar, bio, and personal information.
- **Search**: Find notes and users quickly.
- **Admin Dashboard**: Moderation tools for admins (content/user management).

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router) with Turbopack
- **UI**: React 19, TypeScript, Tailwind CSS 4, Lucide Icons
- **Auth**: NextAuth v5
- **Database**: MongoDB + Mongoose
- **AI**: Google Gemini & Hugging Face Inference
- **Media**: Cloudinary for image uploads
- **Animations**: Framer Motion

## 📋 Prerequisites

- Node.js 18+ (or Bun)
- A MongoDB instance (local or Atlas)
- Cloudinary account (for image uploads)
- Google Gemini API key
- Hugging Face API token

## ⚙️ Installation

1. Clone the repository and navigate to the `web-app` folder:

```bash
git clone https://github.com/YehezkielG/vibeNotes.git
cd vibeNotes/web-app
```

2. Install dependencies:

```bash
npm install
# or
pnpm install
```

3. Create a `.env.local` file in `web-app` and add environment variables:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# NextAuth
AUTH_SECRET=your_secret_key_here
NEXTAUTH_URL=http://localhost:3000

# auth 
RESEND_API_KEY=
EMAIL_FROM="VibeNotes <onboarding@resend.dev>"

# oAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AI Services
GEMINI_API_KEY=your_gemini_api_key
HF_TOKEN=your_huggingface_token
```

4. Start the development server:

```bash
npm run dev
# or
pnpm dev
```

5. Open the app at [http://localhost:3000](http://localhost:3000).

## 📁 Project Structure

```
web-app/
├── src/
│   ├── app/              # App router pages & API routes
│   │   ├── (main)/       # Main layout pages
│   │   ├── (sign in)/    # Auth pages
│   │   └── api/          # API endpoints
│   ├── components/       # UI components
│   ├── lib/              # Utilities & services (AI, db, helpers)
│   ├── models/           # Mongoose models
│   └── types/            # TypeScript types
├── public/               # Static assets
└── ...config files
```

## 👥 Roles & Permissions

- **User**: Create, edit, delete their own notes; like, follow, and comment.
- **Admin**: Moderation capabilities (delete notes/users, ban/unban users).

## 🔐 Security Measures

- Authentication via NextAuth sessions
- Input validation on both client and server
- HTML sanitization to prevent XSS
- Role-based access control for protected APIs
- Banned users are blocked from accessing the app

## 🎯 How to Use

1. Sign up / Sign in
2. Complete onboarding (profile and preferences)
3. Create a note on the "New Note" page and choose visibility
4. Visit the "Insight" page for emotion analysis and weekly summaries
5. Explore public notes, like, comment, and follow other users

## 🛠️ NPM Scripts

```bash
npm run dev      # Development server
npm run build    # Build for production
npm run start    # Start production build
npm run lint     # Run ESLint
```

## 📝 Developer Notes

- The app uses React Server Components in the Next.js App Router
- AI analysis is performed asynchronously for performance
- Mongoose connection pooling is used for DB efficiency
- Responsive layout for mobile and desktop

## 👨‍💻 Author

**Yehezkiel Haganta** — GitHub: [@YehezkielG](https://github.com/YehezkielG)

---

**vibeNotes** — Find yourself in every line. 🌟
