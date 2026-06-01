export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const parseEmailsFromText = (text: string): string[] => {
  if (!text) return [];
  // Split by commas/newlines/semicolons/spaces (spaces are only used as fallback)
  const parts = text
    .split(/[\n,;]+/g)
    .map((p) => p.trim())
    .filter(Boolean);

  // Additional split in case user pasted "a b" without delimiters
  const flattened: string[] = [];
  for (const part of parts) {
    const subParts = part.split(/\s+/g).filter(Boolean);
    flattened.push(...subParts);
  }

  return flattened;
};
const blockedDomains = [
  "gmail.cm",
  "gmail.con",
  "gmail.co",
  "gmail.om",
  "gmailcom",
  "gmai.com",
  "gmial.com",
  "gmal.com",
  "gemail.com",
];
// RFC-ish simple validation
export const isValidEmail = (email: string) => {
  const v = normalizeEmail(email);

  if (!v) return false;

  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!regex.test(v)) return false;

  const domain = v.split("@")[1];

  if (blockedDomains.includes(domain)) {
    return false;
  }

  return true;
};
