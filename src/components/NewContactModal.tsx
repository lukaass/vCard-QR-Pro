import React, { useState } from 'react';
import { X, Plus, User, Phone, Mail, Building2, Briefcase, MapPin } from 'lucide-react';
import { ParsedContact } from '../types/contact';

interface NewContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddContact: (contact: ParsedContact) => void;
}

export const NewContactModal: React.FC<NewContactModalProps> = ({
  isOpen,
  onClose,
  onAddContact,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneType, setPhoneType] = useState('CELL');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!fullName && !phone && !email && !organization) {
      setError('Por favor, informe ao menos o nome, telefone ou empresa.');
      return;
    }

    const contact: ParsedContact = {
      id: `manual_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      fullName: fullName || organization || phone || 'Contato',
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      organization: organization.trim() || undefined,
      title: title.trim() || undefined,
      phones: phone.trim() ? [{ number: phone.trim(), type: phoneType }] : [],
      emails: email.trim() ? [{ address: email.trim(), type: 'INTERNET' }] : [],
      addresses: city.trim() ? [{ city: city.trim() }] : [],
      urls: [],
      notes: notes.trim() || undefined,
      rawVcard: '',
    };

    onAddContact(contact);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="relative bg-white rounded-xl shadow-2xl border border-neutral-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/50">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-neutral-600" />
            <span className="text-sm font-semibold text-neutral-900">
              Adicionar Novo Contato
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-2.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Nome *
              </label>
              <input
                type="text"
                placeholder="Ex: Carlos"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-hidden focus:border-neutral-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Sobrenome
              </label>
              <input
                type="text"
                placeholder="Ex: Silva"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-hidden focus:border-neutral-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Telefone / Celular
              </label>
              <input
                type="text"
                placeholder="+55 11 99999-8888"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-hidden focus:border-neutral-900 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Tipo
              </label>
              <select
                value={phoneType}
                onChange={(e) => setPhoneType(e.target.value)}
                className="w-full px-2.5 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-hidden focus:border-neutral-900 bg-white"
              >
                <option value="CELL">Celular</option>
                <option value="WORK">Trabalho</option>
                <option value="HOME">Casa</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              E-mail
            </label>
            <input
              type="email"
              placeholder="exemplo@empresa.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-hidden focus:border-neutral-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Empresa / Organização
              </label>
              <input
                type="text"
                placeholder="Ex: Acme Corp"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-hidden focus:border-neutral-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Cargo / Título
              </label>
              <input
                type="text"
                placeholder="Ex: Diretor Comercial"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-hidden focus:border-neutral-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Cidade / Estado
            </label>
            <input
              type="text"
              placeholder="São Paulo, SP"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-hidden focus:border-neutral-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Observações / Notas
            </label>
            <textarea
              rows={2}
              placeholder="Notas adicionais sobre o contato..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-hidden focus:border-neutral-900 resize-none"
            />
          </div>

          <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Salvar Contato
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
