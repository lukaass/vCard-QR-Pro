import React, { useState, useMemo } from 'react';
import {
  Search,
  QrCode,
  Eye,
  FileDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Phone,
  Mail,
  Building2,
  Trash2,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MessageCircle,
  Edit3,
} from 'lucide-react';
import { ParsedContact, SortField, SortDirection } from '../types/contact';
import { downloadVCF, downloadCSV } from '../utils/vcardParser';

interface ContactsTableProps {
  contacts: ParsedContact[];
  onOpenQrCode: (contact: ParsedContact) => void;
  onOpenDetails: (contact: ParsedContact) => void;
  onEditContact?: (contact: ParsedContact) => void;
  onDeleteContact: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
}

export const ContactsTable: React.FC<ContactsTableProps> = ({
  contacts,
  onOpenQrCode,
  onOpenDetails,
  onEditContact,
  onDeleteContact,
  onBulkDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'phone' | 'email' | 'company'>('all');
  const [sortField, setSortField] = useState<SortField>('fullName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filtered & Sorted contacts
  const filteredContacts = useMemo(() => {
    let result = [...contacts];

    // Filter by type
    if (activeFilter === 'phone') {
      result = result.filter((c) => c.phones.length > 0);
    } else if (activeFilter === 'email') {
      result = result.filter((c) => c.emails.length > 0);
    } else if (activeFilter === 'company') {
      result = result.filter((c) => Boolean(c.organization));
    }

    // Search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((c) => {
        const nameMatch = c.fullName?.toLowerCase().includes(term);
        const orgMatch = c.organization?.toLowerCase().includes(term);
        const titleMatch = c.title?.toLowerCase().includes(term);
        const phoneMatch = c.phones.some((p) => p.number.toLowerCase().includes(term));
        const emailMatch = c.emails.some((e) => e.address.toLowerCase().includes(term));
        const cityMatch = c.addresses.some((a) => a.city?.toLowerCase().includes(term));
        const notesMatch = c.notes?.toLowerCase().includes(term);
        return nameMatch || orgMatch || titleMatch || phoneMatch || emailMatch || cityMatch || notesMatch;
      });
    }

    // Sort
    result.sort((a, b) => {
      let valA = '';
      let valB = '';

      if (sortField === 'fullName') {
        valA = a.fullName || '';
        valB = b.fullName || '';
      } else if (sortField === 'organization') {
        valA = a.organization || '';
        valB = b.organization || '';
      } else if (sortField === 'title') {
        valA = a.title || '';
        valB = b.title || '';
      } else if (sortField === 'primaryPhone') {
        valA = a.phones[0]?.number || '';
        valB = b.phones[0]?.number || '';
      } else if (sortField === 'primaryEmail') {
        valA = a.emails[0]?.address || '';
        valB = b.emails[0]?.address || '';
      }

      const comparison = valA.localeCompare(valB, 'pt-BR', { sensitivity: 'base' });
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [contacts, activeFilter, searchTerm, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const paginatedContacts = useMemo(() => {
    const start = (validPage - 1) * pageSize;
    return filteredContacts.slice(start, start + pageSize);
  }, [filteredContacts, validPage, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === paginatedContacts.length && paginatedContacts.length > 0) {
      setSelectedIds(new Set());
    } else {
      const newSelected = new Set(selectedIds);
      paginatedContacts.forEach((c) => newSelected.add(c.id));
      setSelectedIds(newSelected);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const selectedList = useMemo(() => {
    return contacts.filter((c) => selectedIds.has(c.id));
  }, [contacts, selectedIds]);

  const handleExportSelectedVCF = () => {
    if (selectedList.length === 0) return;
    downloadVCF(selectedList, `contatos_selecionados_${selectedList.length}.vcf`);
  };

  const handleExportSelectedCSV = () => {
    if (selectedList.length === 0) return;
    downloadCSV(selectedList, `contatos_selecionados_${selectedList.length}.csv`);
  };

  const handleExportAllVCF = () => {
    if (filteredContacts.length === 0) return;
    downloadVCF(filteredContacts, `todos_contatos_${filteredContacts.length}.vcf`);
  };

  const handleExportAllCSV = () => {
    if (filteredContacts.length === 0) return;
    downloadCSV(filteredContacts, `todos_contatos_${filteredContacts.length}.csv`);
  };

  const handleBulkDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Tem certeza que deseja remover os ${selectedIds.size} contatos selecionados?`)) {
      onBulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const isAllPageSelected =
    paginatedContacts.length > 0 && paginatedContacts.every((c) => selectedIds.has(c.id));

  return (
    <div id="tabela" className="w-full space-y-4">
      {/* Control Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone, email, empresa ou cidade..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-hidden focus:border-neutral-900 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-700"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Center: Segmented filter buttons */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg border border-neutral-200/80 self-start lg:self-auto">
          <button
            onClick={() => {
              setActiveFilter('all');
              setCurrentPage(1);
            }}
            type="button"
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeFilter === 'all'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Todos ({contacts.length})
          </button>
          <button
            onClick={() => {
              setActiveFilter('phone');
              setCurrentPage(1);
            }}
            type="button"
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeFilter === 'phone'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Com Telefone
          </button>
          <button
            onClick={() => {
              setActiveFilter('email');
              setCurrentPage(1);
            }}
            type="button"
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeFilter === 'email'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Com E-mail
          </button>
          <button
            onClick={() => {
              setActiveFilter('company');
              setCurrentPage(1);
            }}
            type="button"
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeFilter === 'company'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Com Empresa
          </button>
        </div>

        {/* Right: Export actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportAllVCF}
            disabled={filteredContacts.length === 0}
            type="button"
            className="px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-40"
            title="Exportar todos os contatos filtrados em um arquivo .vcf"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Exportar .vcf</span>
          </button>
          <button
            onClick={handleExportAllCSV}
            disabled={filteredContacts.length === 0}
            type="button"
            className="px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-40"
            title="Exportar planilha CSV"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Selected Action Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-neutral-900 text-white rounded-lg px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-150 shadow-md">
          <div className="flex items-center gap-2">
            <span className="font-semibold font-mono tabular-nums">
              {selectedIds.size}
            </span>
            <span>{selectedIds.size === 1 ? 'contato selecionado' : 'contatos selecionados'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportSelectedVCF}
              type="button"
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded font-medium transition-colors flex items-center gap-1"
            >
              <FileDown className="w-3.5 h-3.5" />
              Baixar .vcf selecionados
            </button>
            <button
              onClick={handleExportSelectedCSV}
              type="button"
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded font-medium transition-colors flex items-center gap-1"
            >
              <FileDown className="w-3.5 h-3.5" />
              Baixar CSV
            </button>
            <button
              onClick={handleBulkDeleteSelected}
              type="button"
              className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 rounded font-medium transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Excluir selecionados
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              type="button"
              className="px-2 py-1 text-neutral-400 hover:text-white transition-colors"
            >
              Desmarcar
            </button>
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/80 text-neutral-700 font-semibold select-none">
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllPageSelected}
                    onChange={handleSelectAll}
                    className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 cursor-pointer"
                    aria-label="Selecionar todos da página"
                  />
                </th>

                <th className="py-3 px-4">
                  <button
                    onClick={() => handleSort('fullName')}
                    className="flex items-center gap-1 hover:text-neutral-950 transition-colors font-semibold"
                  >
                    <span>Nome do Contato</span>
                    {sortField === 'fullName' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                    )}
                  </button>
                </th>

                <th className="py-3 px-4">
                  <button
                    onClick={() => handleSort('organization')}
                    className="flex items-center gap-1 hover:text-neutral-950 transition-colors font-semibold"
                  >
                    <span>Empresa & Cargo</span>
                    {sortField === 'organization' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                    )}
                  </button>
                </th>

                <th className="py-3 px-4">
                  <button
                    onClick={() => handleSort('primaryPhone')}
                    className="flex items-center gap-1 hover:text-neutral-950 transition-colors font-semibold"
                  >
                    <span>Telefone</span>
                    {sortField === 'primaryPhone' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                    )}
                  </button>
                </th>

                <th className="py-3 px-4">
                  <button
                    onClick={() => handleSort('primaryEmail')}
                    className="flex items-center gap-1 hover:text-neutral-950 transition-colors font-semibold"
                  >
                    <span>E-mail</span>
                    {sortField === 'primaryEmail' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                    )}
                  </button>
                </th>

                <th className="py-3 px-4 hidden md:table-cell">
                  <span>Localização</span>
                </th>

                <th className="py-3 px-4 text-right pr-6 min-w-[200px]">
                  <span>Exportar & Ações</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-100">
              {paginatedContacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500">
                    <p className="text-sm font-medium">Nenhum contato encontrado.</p>
                    <p className="text-xs text-neutral-400 mt-1">
                      Tente alterar os termos de busca ou selecionar o filtro "Todos".
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedContacts.map((contact) => {
                  const isSelected = selectedIds.has(contact.id);
                  const primaryPhone = contact.phones[0];
                  const primaryEmail = contact.emails[0];
                  const primaryAddress = contact.addresses[0];
                  const locationText = primaryAddress
                    ? [primaryAddress.city, primaryAddress.state].filter(Boolean).join(' - ')
                    : null;

                  return (
                    <tr
                      key={contact.id}
                      className={`hover:bg-neutral-50/80 transition-colors ${
                        isSelected ? 'bg-neutral-50' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(contact.id)}
                          className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 cursor-pointer"
                        />
                      </td>

                      {/* Contact Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 font-semibold flex items-center justify-center text-xs shrink-0">
                            {contact.fullName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => onOpenDetails(contact)}
                              className="font-semibold text-neutral-900 hover:text-neutral-700 hover:underline text-left block"
                            >
                              {contact.fullName}
                            </button>
                            {contact.notes && (
                              <span className="text-[11px] text-neutral-400 block truncate max-w-xs" title={contact.notes}>
                                {contact.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Organization & Title */}
                      <td className="py-3 px-4">
                        {contact.organization ? (
                          <div className="font-medium text-neutral-800 flex items-center gap-1.5 truncate max-w-xs">
                            <Building2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <span className="truncate">{contact.organization}</span>
                          </div>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                        {contact.title && (
                          <div className="text-[11px] text-neutral-500 truncate max-w-xs">
                            {contact.title}
                          </div>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-4">
                        {primaryPhone ? (
                          <div className="flex items-center gap-2">
                            <a
                              href={`tel:${primaryPhone.number.replace(/\s+/g, '')}`}
                              className="font-mono text-neutral-800 hover:text-neutral-950 hover:underline"
                            >
                              {primaryPhone.number}
                            </a>
                            {/* Quick WhatsApp link */}
                            <a
                              href={`https://wa.me/${primaryPhone.number.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Conversar no WhatsApp"
                              className="text-emerald-600 hover:text-emerald-700 p-0.5 rounded transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                            {contact.phones.length > 1 && (
                              <span className="text-[10px] text-neutral-400 font-mono" title={`+${contact.phones.length - 1} outros números`}>
                                (+{contact.phones.length - 1})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4">
                        {primaryEmail ? (
                          <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                            <Mail className="w-3 h-3 text-neutral-400 shrink-0" />
                            <a
                              href={`mailto:${primaryEmail.address}`}
                              className="text-neutral-800 hover:text-neutral-950 truncate hover:underline"
                              title={primaryEmail.address}
                            >
                              {primaryEmail.address}
                            </a>
                            {contact.emails.length > 1 && (
                              <span className="text-[10px] text-neutral-400 font-mono" title={`+${contact.emails.length - 1} outros e-mails`}>
                                (+{contact.emails.length - 1})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4 hidden md:table-cell text-neutral-600">
                        {locationText || <span className="text-neutral-400">—</span>}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* HIGHLIGHTED QR CODE ACTION BUTTON */}
                          <button
                            type="button"
                            onClick={() => onOpenQrCode(contact)}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-md transition-colors flex items-center gap-1 shadow-xs whitespace-nowrap"
                            title="Gerar QR Code para escanear com smartphone"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>QR Code</span>
                          </button>

                          {/* View details */}
                          <button
                            type="button"
                            onClick={() => onOpenDetails(contact)}
                            className="p-1 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
                            title="Ver detalhes completos"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Edit */}
                          {onEditContact && (
                            <button
                              type="button"
                              onClick={() => onEditContact(contact)}
                              className="p-1 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
                              title="Editar contato (atualiza o QR Code dinâmico instantaneamente)"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-neutral-600" />
                            </button>
                          )}

                          {/* Download individual VCF */}
                          <button
                            type="button"
                            onClick={() => downloadVCF([contact], `${contact.fullName.replace(/[^a-zA-Z0-9]/g, '_')}.vcf`)}
                            className="p-1 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
                            title="Baixar arquivo .vcf individual"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete row */}
                          <button
                            type="button"
                            onClick={() => onDeleteContact(contact.id)}
                            className="p-1 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Remover contato"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer: Pagination & Counts */}
        <div className="border-t border-neutral-200 px-4 py-3 bg-neutral-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-600">
          <div className="flex items-center gap-2 font-mono tabular-nums">
            <span>
              Exibindo{' '}
              <strong className="text-neutral-900">
                {filteredContacts.length === 0 ? 0 : (validPage - 1) * pageSize + 1}
              </strong>{' '}
              a{' '}
              <strong className="text-neutral-900">
                {Math.min(validPage * pageSize, filteredContacts.length)}
              </strong>{' '}
              de <strong className="text-neutral-900">{filteredContacts.length}</strong> contatos
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span>Linhas por página:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-neutral-300 rounded px-2 py-1 text-xs text-neutral-800 focus:outline-hidden"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validPage <= 1}
                className="p-1 rounded border border-neutral-200 bg-white hover:bg-neutral-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono tabular-nums px-2">
                {validPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={validPage >= totalPages}
                className="p-1 rounded border border-neutral-200 bg-white hover:bg-neutral-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Próxima página"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
