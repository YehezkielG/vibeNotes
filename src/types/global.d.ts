type UserProfileType = {
  _id: string;
  username: string;
  displayName: string;
  bio?: string;
  image?: string;
};

type NoteResponseReply = {
  text: string;
  author: string | UserProfileType;
  likes: number;
  likedBy: string[];
  createdAt: string;
  serverResponseIndex?: number;
  serverReplyIndex?: number;
};

type NoteResponse = {
  text: string;
  author: string | UserProfileType;
  likes: number;
  likedBy: string[];
  createdAt: string;
  serverIndex?: number;
  replies: NoteResponseReply[];
};

type NoteType = {
  _id: string;
  title?: string;
  content: string;
  isPublic: boolean;
  createdAt: string;
  author: string | (UserProfileType & { _id?: string });
  emotion: { label: string; score: number }[] | null;
  likes: number;
  likedBy?: (string | { toString(): string })[];
  tags?: string[];
  responses: NoteResponse[];
};

type NotificationItem = {
  id: string;
  type: 'like' | 'response' | 'reply' | 'follow';
  message: string;
  targetUrl: string;
  isRead: boolean;
  createdAt: string;
  actor?: {
    username?: string | null;
    displayName?: string | null;
    image?: string | null;
  } | null;
};