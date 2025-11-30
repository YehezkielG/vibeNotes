import { Types } from 'mongoose';
import Notification, { NotificationType } from '@/models/Notification';
import User from '@/models/User';

interface NotificationPayload {
  actorId: string;
  recipientId: string;
  type: NotificationType;
  noteId?: string;
  responseIndex?: number;
  replyIndex?: number;
  targetUrl: string;
  message: string;
  dedupe?: boolean;
}

function normalizeObjectId(id?: string | null) {
  if (!id) return undefined;
  if (Types.ObjectId.isValid(id)) {
    return new Types.ObjectId(id);
  }
  return undefined;
}

function normalizeTargetUrl(targetUrl: string) {
  if (!targetUrl) return '/';
  return targetUrl.startsWith('/') ? targetUrl : `/${targetUrl.replace(/^\/+/, '')}`;
}

export function buildNoteAnchorTarget(noteId: string, responseIndex?: number, replyIndex?: number) {
  if (!noteId) return '/note';
  if (typeof responseIndex === 'number') {
    const replySuffix = typeof replyIndex === 'number' ? `-reply-${replyIndex}` : '';
    return `/note/${noteId}#response-${responseIndex}${replySuffix}`;
  }
  return `/note/${noteId}`;
}

export function formatNoteTitleSnippet(title?: string | null, maxLength = 60) {
  if (!title) return '';
  const trimmed = title.trim();
  if (!trimmed) return '';
  const finalTitle = trimmed.length > maxLength ? `${trimmed.slice(0, maxLength)}…` : trimmed;
  return ` "${finalTitle}"`;
}

export async function createNotification(payload: NotificationPayload) {
  const {
    actorId,
    recipientId,
    type,
    noteId,
    responseIndex,
    replyIndex,
    targetUrl,
    message,
    dedupe = false,
  } = payload;

  if (!actorId || !recipientId) return;
  if (actorId === recipientId) return;

  const recipient = await User.findById(recipientId).select('_id notificationsEnabled').lean();
  if (!recipient || recipient.notificationsEnabled === false) return;

  const normalizedNoteId = normalizeObjectId(noteId);
  const normalizedActor = normalizeObjectId(actorId);
  const normalizedRecipient = normalizeObjectId(recipientId);

  if (!normalizedActor || !normalizedRecipient) return;

  const notificationDoc = {
    actor: normalizedActor,
    recipient: normalizedRecipient,
    type,
    note: normalizedNoteId,
    responseIndex,
    replyIndex,
    targetUrl: normalizeTargetUrl(targetUrl),
    message,
  };

  if (dedupe) {
    const dedupeQuery: Record<string, unknown> = {
      type,
      actor: normalizedActor,
      recipient: normalizedRecipient,
    };
    if (normalizedNoteId) dedupeQuery.note = normalizedNoteId;
    if (typeof responseIndex === 'number') dedupeQuery.responseIndex = responseIndex;
    if (typeof replyIndex === 'number') dedupeQuery.replyIndex = replyIndex;

    const alreadyExists = await Notification.exists(dedupeQuery);
    if (alreadyExists) return;
  }

  await Notification.create(notificationDoc);
}

export async function markNotificationsRead(recipientId: string, ids?: string[]) {
  if (!recipientId) return;
  const recipientObjectId = normalizeObjectId(recipientId);
  if (!recipientObjectId) return;

  const filter: Record<string, unknown> = { recipient: recipientObjectId, isRead: false };
  if (ids?.length) {
    const normalizedIds = ids
      .map((id) => normalizeObjectId(id))
      .filter((maybeId): maybeId is Types.ObjectId => Boolean(maybeId));
    if (!normalizedIds.length) return;
    filter._id = { $in: normalizedIds };
  }

  await Notification.updateMany(filter, { $set: { isRead: true } });
}
