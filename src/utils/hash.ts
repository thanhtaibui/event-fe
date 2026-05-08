import Hashids from 'hashids';

const hashids = new Hashids('your-secret', 6);

export function encodeId(uuid: string): string {
  return hashids.encodeHex(uuid.replace(/-/g, ''));
}

export function decodeId(hash: string): string {
  const hex = hashids.decodeHex(hash);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}