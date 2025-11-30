import { Schema, model, models, Document, Types } from 'mongoose';

export type NotificationType = 'like' | 'response' | 'reply' | 'follow';

export interface INotification extends Document {
  recipient: Types.ObjectId;
  actor: Types.ObjectId;
  type: NotificationType;
  note?: Types.ObjectId;
  responseIndex?: number;
  replyIndex?: number;
  targetUrl: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['like', 'response', 'reply', 'follow'], required: true },
    note: { type: Schema.Types.ObjectId, ref: 'Note' },
    responseIndex: { type: Number },
    replyIndex: { type: Number },
    targetUrl: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

NotificationSchema.index({ recipient: 1, createdAt: -1 });

const Notification = models.Notification || model<INotification>('Notification', NotificationSchema);

export default Notification;
