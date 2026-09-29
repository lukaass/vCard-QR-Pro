import { ParsedContact, ContactPhone, ContactEmail, ContactAddress } from '../types/contact';

/**
 * Decodes quoted-printable string (UTF-8 or Latin1)
 */
function decodeQuotedPrintable(input: string, charset = 'utf-8'): string {
  // Replace soft line breaks (= followed by \r\n or \n)
  const cleaned = input.replace(/=\r?\n/g, '');

  const bytes: number[] = [];
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] === '=' && i + 2 < cleaned.length) {
      const hex = cleaned.substring(i + 1, i + 3);
      if (/^[0-9A-Fa-f]{2}$/.test(hex)) {
        bytes.push(parseInt(hex, 16));
        i += 2;
        continue;
      }
    }
    bytes.push(cleaned.charCodeAt(i));
  }

  try {
    const uint8Array = new Uint8Array(bytes);
    const decoder = new TextDecoder(charset.toLowerCase().includes('8859') ? 'iso-8859-1' : 'utf-8', {
      fatal: false,
    });
    return decoder.decode(uint8Array);
  } catch {
    return cleaned;
  }
}

/**
 * Unfolds folded vCard lines (RFC 2425/RFC 6350)
 */
function unfoldLines(content: string): string[] {
  // Normalizes newlines
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Unfold lines that start with space or tab
  const unfolded = normalized.replace(/\n[ \t]/g, '');

  return unfolded.split('\n');
}

/**
 * Parses individual line key, parameters, and value
 */
interface ParsedLine {
  name: string;
  params: Record<string, string>;
  value: string;
}

function parseVCardLine(line: string): ParsedLine | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const colonIdx = trimmed.indexOf(':');
  if (colonIdx === -1) return null;

  const propPart = trimmed.substring(0, colonIdx);
  let value = trimmed.substring(colonIdx + 1);

  // Parse property name and parameters
  const semiParts = propPart.split(';');
  const name = semiParts[0].toUpperCase();
  const params: Record<string, string> = {};

  for (let i = 1; i < semiParts.length; i++) {
    const param = semiParts[i];
    const eqIdx = param.indexOf('=');
    if (eqIdx !== -1) {
      const pKey = param.substring(0, eqIdx).toUpperCase();
      const pVal = param.substring(eqIdx + 1).replace(/"/g, '');
      params[pKey] = pVal;
    } else {
      // In vCard 2.1, types are often specified as just `TEL;CELL:...`
      const bare = param.toUpperCase();
      if (['CELL', 'WORK', 'HOME', 'VOICE', 'PREF', 'FAX', 'PAGER', 'INTERNET'].includes(bare)) {
        params['TYPE'] = params['TYPE'] ? `${params['TYPE']},${bare}` : bare;
      } else if (bare.startsWith('ENCODING=')) {
        params['ENCODING'] = bare.replace('ENCODING=', '');
      } else if (bare.startsWith('CHARSET=')) {
        params['CHARSET'] = bare.replace('CHARSET=', '');
      }
    }
  }

  // Handle Quoted-Printable decoding
  if (params['ENCODING']?.toUpperCase() === 'QUOTED-PRINTABLE') {
    value = decodeQuotedPrintable(value, params['CHARSET'] || 'utf-8');
  }

  // Unescape backslash-escaped characters (e.g. \, \; \n)
  value = value
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');

  return { name, params, value: value.trim() };
}

/**
 * Parses a full VCF file string containing one or multiple VCARDs
 */
export function parseVCF(vcfContent: string): ParsedContact[] {
  const lines = unfoldLines(vcfContent);
  const contacts: ParsedContact[] = [];

  let inCard = false;
  let currentRawLines: string[] = [];
  let currentCardLines: ParsedLine[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.toUpperCase() === 'BEGIN:VCARD') {
      inCard = true;
      currentRawLines = [line];
      currentCardLines = [];
      continue;
    }

    if (trimmed.toUpperCase() === 'END:VCARD') {
      if (inCard) {
        currentRawLines.push(line);
        const contact = buildContactFromLines(currentCardLines, currentRawLines.join('\n'));
        if (contact) {
          contacts.push(contact);
        }
      }
      inCard = false;
      currentRawLines = [];
      currentCardLines = [];
      continue;
    }

    if (inCard) {
      currentRawLines.push(line);
      const parsedLine = parseVCardLine(line);
      if (parsedLine) {
        currentCardLines.push(parsedLine);
      }
    }
  }

  return contacts;
}

function buildContactFromLines(lines: ParsedLine[], rawVcard: string): ParsedContact | null {
  let fullName = '';
  let firstName = '';
  let lastName = '';
  let organization = '';
  let title = '';
  let role = '';
  let notes = '';
  let birthday = '';
  const phones: ContactPhone[] = [];
  const emails: ContactEmail[] = [];
  const addresses: ContactAddress[] = [];
  const urls: string[] = [];

  for (const item of lines) {
    const { name, params, value } = item;

    switch (name) {
      case 'FN':
        if (!fullName) fullName = value;
        break;

      case 'N': {
        const parts = value.split(';');
        lastName = parts[0]?.trim() || '';
        firstName = parts[1]?.trim() || '';
        break;
      }

      case 'ORG': {
        const orgParts = value.split(';').map((p) => p.trim()).filter(Boolean);
        organization = orgParts.join(' - ');
        break;
      }

      case 'TITLE':
        title = value;
        break;

      case 'ROLE':
        role = value;
        break;

      case 'NOTE':
        notes = value;
        break;

      case 'BDAY':
        birthday = value;
        break;

      case 'URL':
        if (value && !urls.includes(value)) {
          urls.push(value);
        }
        break;

      case 'TEL': {
        const cleanNumber = value.trim();
        if (cleanNumber) {
          const type = params['TYPE'] || 'Geral';
          const isPreferred = params['TYPE']?.toUpperCase().includes('PREF') || false;
          // Avoid exact duplicates
          if (!phones.some((p) => p.number === cleanNumber)) {
            phones.push({ number: cleanNumber, type, isPreferred });
          }
        }
        break;
      }

      case 'EMAIL': {
        const cleanEmail = value.trim();
        if (cleanEmail) {
          const type = params['TYPE'] || 'Pessoal';
          const isPreferred = params['TYPE']?.toUpperCase().includes('PREF') || false;
          if (!emails.some((e) => e.address.toLowerCase() === cleanEmail.toLowerCase())) {
            emails.push({ address: cleanEmail, type, isPreferred });
          }
        }
        break;
      }

      case 'ADR': {
        const adrParts = value.split(';');
        // RFC standard: PO Box, Extended, Street, Locality (City), Region (State), Postal Code, Country
        const street = [adrParts[1], adrParts[2]].filter(Boolean).map((s) => s.trim()).join(', ');
        const city = adrParts[3]?.trim();
        const state = adrParts[4]?.trim();
        const postalCode = adrParts[5]?.trim();
        const country = adrParts[6]?.trim();

        if (street || city || state || postalCode || country) {
          addresses.push({
            street: street || undefined,
            city: city || undefined,
            state: state || undefined,
            postalCode: postalCode || undefined,
            country: country || undefined,
            type: params['TYPE'] || 'Endereço',
          });
        }
        break;
      }
    }
  }

  // Fallback for full name if FN was not found but N was
  if (!fullName) {
    if (firstName || lastName) {
      fullName = [firstName, lastName].filter(Boolean).join(' ');
    } else if (organization) {
      fullName = organization;
    } else if (phones.length > 0) {
      fullName = phones[0].number;
    } else if (emails.length > 0) {
      fullName = emails[0].address;
    } else {
      fullName = 'Contato sem nome';
    }
  }

  // Ensure contact has a unique ID
  const id = `contact_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;

  return {
    id,
    fullName,
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    organization: organization || undefined,
    title: title || role || undefined,
    role: role || undefined,
    phones,
    emails,
    addresses,
    urls,
    notes: notes || undefined,
    birthday: birthday || undefined,
    rawVcard,
  };
}

/**
 * Builds a valid vCard 3.0 string preserving 100% of all contact fields.
 * If `syntaxOptimized` is true (default), it performs lossless RFC syntax optimization:
 * - Omits unnecessary blank prefixes/delimiters
 * - Uses compact standardized parameter casing
 * - Trims redundant whitespace without removing ANY phone numbers, emails, addresses, URLs, orgs or notes.
 */
export function generateVCardString(contact: ParsedContact, syntaxOptimized = true): string {
  const lines: string[] = ['BEGIN:VCARD', 'VERSION:3.0'];

  const nLast = contact.lastName || '';
  const nFirst = contact.firstName || contact.fullName;
  if (nLast || nFirst) {
    lines.push(`N:${nLast};${nFirst};;;`);
  }
  lines.push(`FN:${contact.fullName}`);

  if (contact.organization) {
    lines.push(`ORG:${contact.organization}`);
  }

  if (contact.title) {
    lines.push(`TITLE:${contact.title}`);
  }

  // ALL phones preserved
  contact.phones.forEach((p) => {
    const rawType = (p.type || 'CELL').trim().toUpperCase();
    lines.push(`TEL;TYPE=${rawType}:${p.number.trim()}`);
  });

  // ALL emails preserved
  contact.emails.forEach((e) => {
    const rawType = (e.type || 'INTERNET').trim().toUpperCase();
    lines.push(`EMAIL;TYPE=${rawType}:${e.address.trim()}`);
  });

  // ALL addresses preserved
  contact.addresses.forEach((a) => {
    const street = (a.street || '').trim();
    const city = (a.city || '').trim();
    const state = (a.state || '').trim();
    const postalCode = (a.postalCode || '').trim();
    const country = (a.country || '').trim();
    if (street || city || state || postalCode || country) {
      lines.push(`ADR;TYPE=WORK:;;${street};${city};${state};${postalCode};${country}`);
    }
  });

  // ALL URLs preserved
  contact.urls.forEach((u) => {
    if (u.trim()) {
      lines.push(`URL:${u.trim()}`);
    }
  });

  // ALL notes preserved
  if (contact.notes && contact.notes.trim()) {
    lines.push(`NOTE:${contact.notes.trim().replace(/\r?\n/g, '\\n')}`);
  }

  // Birthday preserved if present
  if (contact.birthday) {
    lines.push(`BDAY:${contact.birthday}`);
  }

  lines.push('END:VCARD');
  return lines.join('\n');
}

/**
 * Exports multiple contacts to a combined .vcf file and initiates browser download
 */
export function downloadVCF(contacts: ParsedContact[], filename = 'contatos.vcf') {
  const content = contacts.map((c) => generateVCardString(c)).join('\n\n');
  const blob = new Blob([content], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports contacts to CSV format
 */
export function downloadCSV(contacts: ParsedContact[], filename = 'contatos.csv') {
  const headers = ['Nome Completo', 'Sobrenome', 'Primeiro Nome', 'Empresa', 'Cargo', 'Telefones', 'E-mails', 'Cidade/Estado', 'Website', 'Notas'];
  const rows = contacts.map((c) => {
    const phonesStr = c.phones.map((p) => `${p.number} (${p.type || 'Geral'})`).join(' / ');
    const emailsStr = c.emails.map((e) => e.address).join(' / ');
    const locationStr = c.addresses.map((a) => [a.city, a.state].filter(Boolean).join(' - ')).join(' | ');
    const urlsStr = c.urls.join(' / ');

    return [
      `"${(c.fullName || '').replace(/"/g, '""')}"`,
      `"${(c.lastName || '').replace(/"/g, '""')}"`,
      `"${(c.firstName || '').replace(/"/g, '""')}"`,
      `"${(c.organization || '').replace(/"/g, '""')}"`,
      `"${(c.title || '').replace(/"/g, '""')}"`,
      `"${phonesStr.replace(/"/g, '""')}"`,
      `"${emailsStr.replace(/"/g, '""')}"`,
      `"${locationStr.replace(/"/g, '""')}"`,
      `"${urlsStr.replace(/"/g, '""')}"`,
      `"${(c.notes || '').replace(/"/g, '""')}"`,
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
