import { notFound } from 'next/navigation';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User'; // Your User schema
import Note from '@/models/Note'; // Your Note schema
import Image from 'next/image';
import { auth } from '@/auth'; // To check the session

export const revalidate = 60; // (Optional) Refresh this profile data every 60 seconds

/**
 * This function fetches data from the database on the server side.
 */
async function getProfileData(username: string) {
  await dbConnect();

  // 1. Find the user by their unique username
  // .lean() makes it faster because it's read-only
  const user = await User.findOne({ username: username }).lean();
  console.log("Fetched user:", user);
  if (!user) {
    return null; // User not found
  }

  // 2. If the user is found, find all their 'Public Notes'
  const publicNotes = await Note.find({
    author: user._id,
    isPublic: true,
  })
  .sort({ createdAt: -1 }) // Sort from newest
  .limit(20) // Limit to 20 notes
  .lean();

  return { user, publicNotes };
}

// 'params' will be automatically filled by Next.js from the URL
export default async function PublicProfilePage({ params }: { params: { username: string } }) {
  
  // Fetch profile data AND the current login session at the same time
  const [data, session] = await Promise.all([
    getProfileData(params.username),
    auth() // Get server session
  ]);

  // If getProfileData returns null, show a 404 page
  if (!data) {
    notFound(); // This will show the standard Next.js 404 page
  }

  const { user, publicNotes } = data;

  // Check if the logged-in user = the user whose profile is being viewed
  const isOwner = session?.user?.id === user._id.toString();

  return (
    // This page will be rendered INSIDE app/(main)/layout.tsx (with Sidebar)
    // 'p-8' (padding) might already be in your main layout
    <div className="max-w-4xl mx-auto">
      
      {/* --- Profile Header Section (Inspired by Twitter) --- */}
      <div className="flex flex-col md:flex-row items-start space-x-0 md:space-x-6">
        {user.image && (
          <Image
            src={user.image}
            alt={`${user.displayName}'s profile picture`}
            width={128}
            height={128}
            className="rounded-full bg-gray-700 shrink-0"
          />
        )}
        <div className="w-full mt-4 md:mt-0">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold">{user.displayName}</h1>
              <p className="text-xl text-gray-400">@{user.username}</p>
            </div>
            {/* Show "Edit Profile" button ONLY if this is your profile */}
            {isOwner && (
              <a 
                href="/profile/me"
                className="py-2 px-4 border border-gray-600 rounded-full text-sm font-semibold hover:bg-gray-800"
              >
                Edit Profile
              </a>
            )}
          </div>
          
          {/* Show Bio */}
          {user.bio && (
            <p className="text-md text-gray-300 mt-4">
              {user.bio}
            </p>
          )}
          {/* Here you can add info like 'Joined Since', 'Following', etc. */}
        </div>
      </div>
      
      <hr className="border-gray-700 my-8" />

      {/* --- Public Notes Section --- */}
      <h2 className="text-2xl font-semibold mb-6">Public Notes</h2>
      
      <div className="space-y-6">
        {publicNotes.length > 0 ? (
          publicNotes.map((note) => (
            <article key={note._id.toString()} className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold mb-2">{note.title}</h3>
              <p className="text-gray-300 mb-4 whitespace-pre-wrap">{note.content}</p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Emotion: {note.emotion || 'Neutral'}</span>
                <span>{new Date(note.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </article>
          ))
        ) : (
          <div className="bg-gray-800 p-6 rounded-lg text-center text-gray-400">
            <p>@{user.username} doesn't have any public notes yet.</p>
          </div>
        )}
      </div>

    </div>
  );
}