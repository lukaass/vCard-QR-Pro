import { ParsedContact } from '../types/contact';

const DYNAMIC_STORAGE_KEY = 'vcard_dynamic_contacts_store_v1';
const DYNAMIC_ANALYTICS_KEY = 'vcard_dynamic_analytics_store_v1';

export interface DynamicContactRecord {
  shortId: string;
  contact: ParsedContact;
  createdAt: number;
  updatedAt: number;
  scanCount: number;
  lastScannedAt?: number;
}

/**
 * Generates an ultra-short alphanumeric slug (4-5 chars) for minimal QR code density.
 * A short URL produces a 21x21 QR Code matrix with maximum thickness and minimal lines!
 */
export function generateShortId(): string {
  const chars = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function getDynamicRecords(): Record<string, DynamicContactRecord> {
  try {
    const raw = localStorage.getItem(DYNAMIC_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading dynamic records:', e);
    return {};
  }
}

function saveDynamicRecords(records: Record<string, DynamicContactRecord>) {
  try {
    localStorage.setItem(DYNAMIC_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving dynamic records:', e);
  }
}

/**
 * Synchronizes contact to server API so any smartphone can fetch it via the shortId
 */
export async function syncContactToServer(shortId: string, contact: ParsedContact) {
  try {
    await fetch(`/api/dynamic/${shortId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact }),
    });
  } catch (e) {
    // Non-blocking in case of offline testing
    console.warn('Backend sync attempted:', e);
  }
}

/**
 * Fetches contact by shortId from server API or falls back to localStorage
 */
export async function fetchContactByShortId(shortId: string): Promise<ParsedContact | null> {
  // 1. Try server API first
  try {
    const res = await fetch(`/api/dynamic/${shortId}`);
    if (res.ok) {
      const data = await res.json();
      if (data.contact) {
        return data.contact;
      }
    }
  } catch (e) {
    console.warn('Server fetch error:', e);
  }

  // 2. Fallback to localStorage
  const localRecord = getDynamicRecords()[shortId];
  return localRecord?.contact || null;
}

/**
 * Retrieves or registers a dynamic QR code for a given contact
 */
export function getOrCreateDynamicRecord(contact: ParsedContact): DynamicContactRecord {
  const records = getDynamicRecords();

  for (const key of Object.keys(records)) {
    if (records[key].contact.id === contact.id) {
      records[key].contact = contact;
      records[key].updatedAt = Date.now();
      saveDynamicRecords(records);
      syncContactToServer(key, contact);
      return records[key];
    }
  }

  let shortId = generateShortId();
  while (records[shortId]) {
    shortId = generateShortId();
  }

  const record: DynamicContactRecord = {
    shortId,
    contact,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    scanCount: 0,
  };

  records[shortId] = record;
  saveDynamicRecords(records);
  syncContactToServer(shortId, contact);
  return record;
}

/**
 * Updates the contact linked to an existing shortId
 */
export function updateDynamicContact(shortId: string, updatedContact: ParsedContact): boolean {
  const records = getDynamicRecords();
  if (!records[shortId]) return false;

  records[shortId].contact = { ...updatedContact, id: records[shortId].contact.id };
  records[shortId].updatedAt = Date.now();
  saveDynamicRecords(records);
  syncContactToServer(shortId, updatedContact);
  return true;
}

/**
 * Computes full ultra-short dynamic URL for QR code encoding.
 * Example: https://meudominio.com/?c=x8K2p
 * Total length ~50 chars -> 21x21 QR Code matrix (ultra-thick blocks, few lines, instant scan)
 */
export function getDynamicUrl(shortId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  return `${origin}${pathname}?c=${shortId}`;
}
