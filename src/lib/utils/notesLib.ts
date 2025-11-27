export const formatCreatedAt = (createdAt: string) => {
  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  const minutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'}`;

  const hours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'}`;

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days < 7) return `${days} day${days === 1 ? '' : 's'}`;

  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleString("en-US", { month: "short", day: "numeric" });
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Check if note was created within last 10 minutes (edit window)
export const canEditNote = (createdAt: string | Date): boolean => {
  const date = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const tenMinutesMs = 10 * 60 * 1000;
  return diffMs <= tenMinutesMs;
};

// Get remaining edit time in format "5m 30s"
export const getRemainingEditTime = (createdAt: string | Date): string => {
  const date = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const tenMinutesMs = 10 * 60 * 1000;
  const remainingMs = Math.max(0, tenMinutesMs - diffMs);
  
  const minutes = Math.floor(remainingMs / (1000 * 60));
  const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
  
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};