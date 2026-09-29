export interface ContactPhone {
  number: string;
  type?: string;
  isPreferred?: boolean;
}

export interface ContactEmail {
  address: string;
  type?: string;
  isPreferred?: boolean;
}

export interface ContactAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  type?: string;
}

export interface ParsedContact {
  id: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  organization?: string;
  title?: string;
  role?: string;
  phones: ContactPhone[];
  emails: ContactEmail[];
  addresses: ContactAddress[];
  urls: string[];
  notes?: string;
  birthday?: string;
  rawVcard: string;
}

export type SortField = 'fullName' | 'organization' | 'title' | 'primaryPhone' | 'primaryEmail';
export type SortDirection = 'asc' | 'desc';
