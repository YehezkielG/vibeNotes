import mongoose, { Schema, model, models, Document } from 'mongoose';

export interface INoteResponseReply {
  text: string;
  author: Schema.Types.ObjectId;
  likes: number;
  likedBy: Schema.Types.ObjectId[];
  createdAt: Date;
}

export interface INoteResponse {
  text: string;
  author: Schema.Types.ObjectId;
  likes: number;
  likedBy: Schema.Types.ObjectId[];
  createdAt: Date;
  replies: INoteResponseReply[];
}

export interface INote extends Document {
  title?: string;
  content: string;
  author: Schema.Types.ObjectId;
  isPublic: boolean;
  emotion: unknown;
  tags: string[];
  likes: number;
  likedBy: Schema.Types.ObjectId[];
  responses: INoteResponse[];
  createdAt: Date;
  updatedAt: Date;
}

const NoteResponseReplySchema = new Schema<INoteResponseReply>(
  {
    text: { type: String, trim: true, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    likes: { type: Number, default: 0, min: 0 },
    likedBy: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const NoteResponseSchema = new Schema<INoteResponse>(
  {
    text: { type: String, trim: true, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    likes: { type: Number, default: 0, min: 0 },
    likedBy: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
    createdAt: { type: Date, default: Date.now },
    replies: { type: [NoteResponseReplySchema], default: [] },
  },
  { _id: false },
);

const NoteSchema = new Schema<INote>(
  {
    title: { type: String },
    content: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isPublic: { type: Boolean, default: false },
    emotion: { type: Schema.Types.Mixed, default: null },
    tags: [String],
    likedBy: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: []
  }
],
likes: {
  type: Number,
  default: 0
}
,
    responses: { type: [NoteResponseSchema], default: [] },
  },
  { timestamps: true },
);

const Note = models.Note || model<INote>('Note', NoteSchema);

export default Note;