export const ADMIN_EMAILS = [
  "yehezkielhaganta@gmail.com", // Replace with your email or add more
];

export const isAdmin = (email?: string | null) => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
};
