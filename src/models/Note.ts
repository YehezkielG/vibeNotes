import { Schema, model, models } from 'mongoose';

// Schema for user notes (private or public)
const NoteSchema = new Schema(
  {
    // Note title
    title: {
      type: String,
    },
    // Note body
    content: {
      type: String,
      required: true,
    },
    // Author reference (User model)
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Flag for public visibility
    isPublic: {
      type: Boolean,
      default: false,
    },
    // AI emotion tag
    emotion: {
      type: Object,
      default: 'neutral',
    },
    // Future tags feature
    tags: [String],
    // Like count
    likes: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

const Note = models.Note || model('Note', NoteSchema);

export default Note;