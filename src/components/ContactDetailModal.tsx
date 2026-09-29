import React, { useState } from 'react';
import {
  X,
  Phone,
  Mail,
  Building2,
  Briefcase,
  MapPin,
  Globe,
  FileText,
  QrCode,
  Calendar,
  Copy,
  Check,
  Download,
  Edit3,
} from 'lucide-react';
import { ParsedContact } from '../types/contact';
import { downloadVCF, generateVCardString } from '../utils/vcardParser';

interface ContactDetailModalProps {
  contact: ParsedContact | null;
  onClose: () => void;
  onOpenQrCode: (contact: ParsedContact) => void;
  onEditContact?: (contact: ParsedContact) => void;
}

export const ContactDetailModal: React.FC<ContactDetailModalProps> = ({
  contact,
  onClose,
  onOpenQrCode,
  onEditContact,
}) => {
  const [showRaw, setShowRaw] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);

  if (!contact) return null;

  const handleCopyRaw = async () => {
    try {
      await navigator.clipboard.writeText(contact.rawVcard || generateVCardString(contact));
      setCopiedRaw(true);
      setTimeout(() => setCopiedRaw(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownload = () => {
    const safeName = contact.fullName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    downloadVCF([contact], `${safeName}.vcf`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="relative bg-white rounded-xl shadow-2xl border border-neutral-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-neutral-200 text-neutral-800 font-bold flex items-center justify-center text-sm">
              {contact.fullName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 leading-tight">
                {contact.fullName}
              </h3>
              {(contact.title || contact.organization) && (
                <p className="text-xs text-neutral-500">
                  {[contact.title, contact.organization].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Action Highlights */}
          <div className="flex items-center gap-2.5 pb-2 border-b border-neutral-100">
            <button
              onClick={() => onOpenQrCode(contact)}
              type="button"
              className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              <span>Gerar QR Code</span>
            </button>
            {onEditContact && (
              <button
                onClick={() => {
                  onClose();
                  onEditContact(contact);
                }}
                type="button"
                className="py-2 px-3 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200/80 border border-neutral-200 rounded-lg transition-colors flex items-center gap-1.5"
                title="Editar dados cadastrais deste contato"
              >
                <Edit3 className="w-4 h-4 text-neutral-600" />
                <span>Editar</span>
              </button>
            )}
            <button
              onClick={handleDownload}
              type="button"
              className="py-2 px-3 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200/80 border border-neutral-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Exportar .vcf</span>
            </button>
          </div>

          {/* Phones */}
          {contact.phones.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
                Telefones ({contact.phones.length})
              </span>
              <div className="space-y-1.5">
                {contact.phones.map((phone, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-50 border border-neutral-200/60"
                  >
                    <div className="flex items-center gap-2.5">
                      <Phone className="w-4 h-4 text-neutral-500" />
                      <div>
                        <a
                          href={`tel:${phone.number.replace(/\s+/g, '')}`}
                          className="text-xs font-mono font-medium text-neutral-900 hover:underline"
                        >
                          {phone.number}
                        </a>
                        <span className="ml-2 text-[10px] text-neutral-500 uppercase">
                          {phone.type || 'Geral'}
                        </span>
                      </div>
                    </div>
                    {/* WhatsApp direct link */}
                    <a
                      href={`https://wa.me/${phone.number.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-emerald-700 hover:text-emerald-800 hover:underline px-2 py-1 bg-emerald-50 rounded border border-emerald-200/60"
                    >
                      WhatsApp
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Emails */}
          {contact.emails.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
                E-mails ({contact.emails.length})
              </span>
              <div className="space-y-1.5">
                {contact.emails.map((email, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-50 border border-neutral-200/60"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Mail className="w-4 h-4 text-neutral-500 shrink-0" />
                      <a
                        href={`mailto:${email.address}`}
                        className="text-xs font-medium text-neutral-900 hover:underline truncate"
                      >
                        {email.address}
                      </a>
                    </div>
                    <span className="text-[10px] text-neutral-500 uppercase shrink-0 ml-2">
                      {email.type || 'Internet'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Organization & Role */}
          {(contact.organization || contact.title) && (
            <div>
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
                Empresa & Função
              </span>
              <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200/60 space-y-2 text-xs">
                {contact.organization && (
                  <div className="flex items-center gap-2 text-neutral-800">
                    <Building2 className="w-4 h-4 text-neutral-500 shrink-0" />
                    <span className="font-medium">{contact.organization}</span>
                  </div>
                )}
                {contact.title && (
                  <div className="flex items-center gap-2 text-neutral-700">
                    <Briefcase className="w-4 h-4 text-neutral-500 shrink-0" />
                    <span>{contact.title}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Addresses */}
          {contact.addresses.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
                Endereço
              </span>
              <div className="space-y-1.5">
                {contact.addresses.map((addr, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-neutral-50 border border-neutral-200/60 text-xs flex items-start gap-2.5"
                  >
                    <MapPin className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                    <div>
                      {addr.street && <div className="text-neutral-800">{addr.street}</div>}
                      <div className="text-neutral-600">
                        {[addr.city, addr.state, addr.postalCode].filter(Boolean).join(' - ')}
                      </div>
                      {addr.country && <div className="text-neutral-500">{addr.country}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* URLs */}
          {contact.urls.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
                Websites
              </span>
              <div className="space-y-1.5">
                {contact.urls.map((url, idx) => (
                  <a
                    key={idx}
                    href={url.startsWith('http') ? url : `https://${url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-neutral-50 border border-neutral-200/60 text-xs text-neutral-800 hover:text-neutral-950 hover:bg-neutral-100 transition-colors"
                  >
                    <Globe className="w-4 h-4 text-neutral-500" />
                    <span className="truncate">{url}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {contact.notes && (
            <div>
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
                Observações
              </span>
              <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200/60 text-xs text-neutral-700 whitespace-pre-wrap flex items-start gap-2">
                <FileText className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                <span>{contact.notes}</span>
              </div>
            </div>
          )}

          {/* Birthday */}
          {contact.birthday && (
            <div>
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
                Data de Aniversário
              </span>
              <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200/60 text-xs text-neutral-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-neutral-500" />
                <span>{contact.birthday}</span>
              </div>
            </div>
          )}

          {/* Toggle raw vCard */}
          <div className="pt-2 border-t border-neutral-100">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowRaw(!showRaw)}
                className="text-xs font-medium text-neutral-500 hover:text-neutral-800 transition-colors"
              >
                {showRaw ? 'Ocultar código vCard puro' : 'Ver código vCard puro (RFC)'}
              </button>
              {showRaw && (
                <button
                  type="button"
                  onClick={handleCopyRaw}
                  className="text-xs font-medium text-neutral-600 hover:text-neutral-900 flex items-center gap-1"
                >
                  {copiedRaw ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {showRaw && (
              <pre className="mt-2 p-3 bg-neutral-900 text-neutral-200 font-mono text-[11px] rounded-lg overflow-x-auto max-h-48 leading-relaxed">
                {contact.rawVcard || generateVCardString(contact)}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
