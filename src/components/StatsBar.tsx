import React from 'react';
import { ParsedContact } from '../types/contact';

interface StatsBarProps {
  contacts: ParsedContact[];
}

export const StatsBar: React.FC<StatsBarProps> = ({ contacts }) => {
  const total = contacts.length;
  const withPhone = contacts.filter((c) => c.phones.length > 0).length;
  const withEmail = contacts.filter((c) => c.emails.length > 0).length;
  const uniqueOrgs = new Set(
    contacts.map((c) => c.organization?.trim()).filter(Boolean)
  ).size;

  return (
    <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-neutral-600 border-b border-neutral-200 pb-4">
      <div className="flex items-center gap-1.5">
        <span className="text-neutral-500">Total de contatos:</span>
        <span className="font-semibold text-neutral-900 font-mono tabular-nums">
          {total}
        </span>
      </div>

      <span aria-hidden="true" className="text-neutral-300">·</span>

      <div className="flex items-center gap-1.5">
        <span className="text-neutral-500">Com telefone:</span>
        <span className="font-semibold text-neutral-900 font-mono tabular-nums">
          {withPhone}
        </span>
      </div>

      <span aria-hidden="true" className="text-neutral-300">·</span>

      <div className="flex items-center gap-1.5">
        <span className="text-neutral-500">Com e-mail:</span>
        <span className="font-semibold text-neutral-900 font-mono tabular-nums">
          {withEmail}
        </span>
      </div>

      <span aria-hidden="true" className="text-neutral-300">·</span>

      <div className="flex items-center gap-1.5">
        <span className="text-neutral-500">Empresas representadas:</span>
        <span className="font-semibold text-neutral-900 font-mono tabular-nums">
          {uniqueOrgs}
        </span>
      </div>
    </div>
  );
};
