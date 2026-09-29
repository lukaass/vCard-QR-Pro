import React, { useState } from 'react';
import { X, Save, ShieldCheck, Check, AlertCircle } from 'lucide-react';
import { ParsedContact } from '../types/contact';

interface EditContactModalProps {
  contact: ParsedContact | null;
  onClose: () => void;
  onSave: (updatedContact: ParsedContact) => void;
}

export const EditContactModal: React.FC<EditContactModalProps> = ({
  contact,
  onClose,
  onSave,
}) => {
  if (!contact) return null;

  const [fullName, setFullName] = useState(contact.fullName || '');
  const [organization, setOrganization] = useState(contact.organization || '');
  const [title, setTitle] = useState(contact.title || '');
  const [phone, setPhone] = useState(contact.phones[0]?.number || '');
  const [email, setEmail] = useState(contact.emails[0]?.address || '');
  const [notes, setNotes] = useState(contact.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedPhones = [...contact.phones];
    if (updatedPhones.length > 0) {
      updatedPhones[0] = { ...updatedPhones[0], number: phone };
    } else if (phone.trim()) {
      updatedPhones.push({ number: phone.trim(), type: 'CELL' });
    }

    const updatedEmails = [...contact.emails];
    if (updatedEmails.length > 0) {
      updatedEmails[0] = { ...updatedEmails[0], address: email };
    } else if (email.trim()) {
      updatedEmails.push({ address: email.trim(), type: 'INTERNET' });
    }

    const updatedContact: ParsedContact = {
      ...contact,
      fullName: fullName.trim() || contact.fullName,
      organization: organization.trim() || undefined,
      title: title.trim() || undefined,
      phones: updatedPhones,
      emails: updatedEmails,
      notes: notes.trim() || undefined,
    };

    onSave(updatedContact);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/70">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">
              Editar Dados do Contato
            </h3>
            <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              QR Codes Dinâmicos atualizarão automaticamente sem necessidade de reimpressão!
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-neutral-800 mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-hidden focus:border-neutral-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-neutral-800 mb-1">
                Empresa
              </label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-hidden focus:border-neutral-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-neutral-800 mb-1">
                Cargo
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-hidden focus:border-neutral-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-neutral-800 mb-1">
                Telefone Principal
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-hidden focus:border-neutral-900 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-neutral-800 mb-1">
                E-mail Principal
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-hidden focus:border-neutral-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-neutral-800 mb-1">
              Observações / Notas
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-hidden focus:border-neutral-900 resize-none"
            />
          </div>

          <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
