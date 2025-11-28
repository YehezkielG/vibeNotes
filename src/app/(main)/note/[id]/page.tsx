import { notFound } from "next/navigation";
// relaxed id handling: avoid strict mongoose ObjectId check
import {  Lock } from "lucide-react";
import dbConnect from "@/lib/mongoose";
import Note from "@/models/Note";
import { auth } from "@/auth";
import User from "@/models/User";
import ResponseClient from "./Response";
import { getEmojiForLabel, getLabelColor } from "@/lib/utils/emotionMapping";
import { formatCreatedAt } from "@/lib/utils/notesLib";
import PublicNoteCard from "@/components/PublicNoteCard";

export default async function NoteDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params;

  await dbConnect();

  // Try to find the note. Do not short-circuit on strict ObjectId check because
  // some IDs might be stored as strings or come in unexpected formats.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let noteRaw: any | null = null;
  try {
    // attempt normal findById first
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    noteRaw = (await Note.findById(id).populate("author", "username displayName image").lean()) as any | null;
    // If not found and id looks like a string id, try a fallback find
    if (!noteRaw) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      noteRaw = (await Note.findOne({ _id: id }).populate("author", "username displayName image").lean()) as any | null;
    }
  } catch (err) {
    // In case the id format throws (very rare), attempt a safe findOne and continue.
    console.warn("Note lookup fallback due to id parse error:", err);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    noteRaw = (await Note.findOne({ _id: id }).populate("author", "username displayName image").lean()) as any | null;
  }
  // Diagnostic logging to help identify why note lookup returns null in dev
  console.log(`[note page] lookup id=${id} found=${!!noteRaw} noteId=${noteRaw?._id ? String(noteRaw._id) : 'null'}`);
  
  if (!noteRaw) return notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const note: any = noteRaw;

  // Manually populate response/reply authors (avoid nested populate issues)
  if (Array.isArray(note.responses) && note.responses.length > 0) {
    const userIds = new Set<string>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    note.responses.forEach((r: any) => {
      if (r?.author) userIds.add(String(r.author));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (Array.isArray(r.replies)) r.replies.forEach((rep: any) => rep?.author && userIds.add(String(rep.author)));
    });

    if (userIds.size > 0) {
      const users = await User.find({ _id: { $in: Array.from(userIds) } }).select("username displayName image").lean();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const map = new Map(users.map((u: any) => [String(u._id), u]));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      note.responses = note.responses.map((r: any) => ({
        ...r,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        likedBy: Array.isArray(r.likedBy) ? r.likedBy.map((id: any) => String(id)) : [],
        author: map.get(String(r.author)) || r.author,
        replies: Array.isArray(r.replies)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ? r.replies.map((rep: any) => ({
              ...rep,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              likedBy: Array.isArray(rep.likedBy) ? rep.likedBy.map((id: any) => String(id)) : [],
              author: map.get(String(rep.author)) || rep.author,
            }))
          : [],
      }));
    }
  }

  // Serialize responses for client component (no Mongoose objects)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serialResponses = (note.responses || []).map((r: any) => ({
    text: r.text,
    likes: r.likes ?? 0,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    likedBy: Array.isArray(r.likedBy) ? r.likedBy.map((id: any) => String(id)) : [],
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
    author:
      r.author && typeof r.author === "object"
        ? {
            id: String(r.author._id ?? ""),
            username: r.author.username ?? "",
            displayName: r.author.displayName ?? r.author.username ?? "",
            image: r.author.image ?? "/default-profile.png",
          }
        : String(r.author ?? ""),
    replies: Array.isArray(r.replies)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? r.replies.map((rep: any) => ({
          text: rep.text,
          likes: rep.likes ?? 0,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          likedBy: Array.isArray(rep.likedBy) ? rep.likedBy.map((id: any) => String(id)) : [],
          createdAt: rep.createdAt ? new Date(rep.createdAt).toISOString() : null,
          author:
            rep.author && typeof rep.author === "object"
              ? {
                  id: String(rep.author._id ?? ""),
                  username: rep.author.username ?? "",
                  displayName: rep.author.displayName ?? rep.author.username ?? "",
                  image: rep.author.image ?? "/default-profile.png",
                }
              : String(rep.author ?? ""),
        }))
      : [],
  }));

  // Author info
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const authorObj = note.author as any | undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const likedBy = Array.isArray(note.likedBy) ? note.likedBy.map((v: any) => String(v)) : [];
  const likes = note.likes ?? 0;
  
  // Get session once and determine ownership for both public and private flows
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const requesterId = session?.user?.id ?? (session?.user as Record<string, any> | undefined)?._id?.toString?.() ?? null;
  const noteAuthorId = authorObj ? String(authorObj._id ?? "") : String(note.author ?? "");
  const isOwner = requesterId && requesterId === noteAuthorId;
  
  // Build a client-safe note object to pass into client components
  const clientNote = {
    _id: String(note._id ?? ""),
    title: note.title ?? "",
    content: note.content ?? "",
    createdAt: note.createdAt ? new Date(note.createdAt).toISOString() : "",
    author: authorObj
      ? {
          _id: String(authorObj._id ?? ""),
          username: authorObj.username ?? "",
          displayName: authorObj.displayName ?? authorObj.username ?? "",
          image: authorObj.image ?? "/default-profile.png",
        }
      : "",
    likes,
    likedBy,
    isPublic: Boolean(note.isPublic),
    emotion: Array.isArray(note.emotion)
      ? note.emotion.map((it: { label: string; score: number }) => ({ label: it.label, score: Number(it.score) }))
      : [],
    responses: serialResponses,
  };

  // Private access check (owner only)
  if (!note.isPublic) {
    if (!requesterId || requesterId !== noteAuthorId) {
      return (
        <div className="flex h-[300px] items-center justify-center gap-2 text-sm text-gray-600">
          <Lock size={18} />
          <span>This note is private.</span>
        </div>
      );
    }
  }

  return (
    <>
      {note.isPublic ? (
        <>
            <PublicNoteCard note={clientNote} showMenu={true} hideDominant={true} isOwner={isOwner} />

          <div className="mt-5 flex flex-wrap gap-3">
              {Array.isArray(note.emotion) && note.emotion.length > 0 ? (
                note.emotion.map((item: { label: string; score: number }) => {
                  const bgColor = getLabelColor(item.label) ?? "#f3f4f6";
                  return (
                    <div key={item.label} className="group py-1 px-2 rounded-2xl" style={{ backgroundColor: bgColor + "20", border: `1px solid ${bgColor}33` }}>
                      <div className="flex justify-between items-center text-sm mb-1 text-gray-700">
                        <span className="flex items-center mr-2 gap-2 font-medium capitalize">
                          <span>{getEmojiForLabel(item.label)}</span> {item.label}
                        </span>
                        <span className="font-mono text-xs flex items-center text-gray-500">{(item.score * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="space-y-3 mt-4 w-full">No emotions detected.</div>
              )}
            </div>
          {/* AI Counselor Advice Card - shown below emotion distribution */}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(note as any).counselorAdvice && (
            <div className="mt-6 bg-linear-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-xl">🌿</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-indigo-900 mb-2">AI Counselor Reflection</h4>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <p className="text-sm text-gray-700 leading-relaxed italic">{(note as any).counselorAdvice}</p>
                </div>
              </div>
            </div>
          )}

          <ResponseClient noteId={String(note._id ?? "")} initialResponses={serialResponses} isPublic={note.isPublic} />
        </>
      ) : (
        <>
          <article className="rounded-xl border border-transparent bg-gray-50 p-6 shadow-md">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div>{formatCreatedAt(note.createdAt)}</div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Lock size={14} className="text-gray-500" />
                    <span>Private Note</span>
                  </div>
                </div>
                <h2 className="mt-2 text-2xl font-serif text-gray-900">{note.title?.trim() || "Untitled"}</h2>
                <div className="mt-3 prose max-w-none text-gray-800 leading-7 font-serif">
                  <p className="whitespace-pre-wrap">{note.content}</p>
                </div>

                {/* Emotion distribution for private note */}
                <div className="mt-5 flex flex-wrap gap-3">
                  {Array.isArray(note.emotion) && note.emotion.length > 0 ? (
                    note.emotion.map((item: { label: string; score: number }) => {
                      const bgColor = getLabelColor(item.label) ?? "#f3f4f6";
                      return (
                        <div key={item.label} className="group py-1 px-2 rounded-2xl" style={{ backgroundColor: bgColor + "20", border: `1px solid ${bgColor}33` }}>
                          <div className="flex justify-between items-center text-sm mb-1 text-gray-700">
                            <span className="flex items-center mr-2 gap-2 font-medium capitalize">
                              <span>{getEmojiForLabel(item.label)}</span> {item.label}
                            </span>
                            <span className="font-mono text-xs flex items-center text-gray-500">{(item.score * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="space-y-3 mt-4 w-full">No emotions detected.</div>
                  )}
                </div>
              </div>
            </div>

            {/* AI Counselor Advice Card - Right after content */}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(note as any).counselorAdvice && (
              <div className="mt-6 bg-linear-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-xl">🌿</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-indigo-900 mb-2">AI Counselor Reflection</h4>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <p className="text-sm text-gray-700 leading-relaxed italic">{(note as any).counselorAdvice}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm text-gray-600">                
                <span className="text-xs text-gray-400">Personal entry</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Private — only you can see this entry</span>
              </div>
            </div>
          </article>

          <div className="mt-6">
            <ResponseClient noteId={String(note._id ?? "")} initialResponses={serialResponses} isPublic={note.isPublic} />
          </div>
        </>
      )}
    </>
  );
}
