import React from 'react';
import { Plus, RefreshCw } from 'lucide-react';

interface NavbarProps {
  onNewContactClick: () => void;
  onResetToSample: () => void;
  hasContacts: boolean;
  contactsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNewContactClick,
  onResetToSample,
  hasContacts,
  contactsCount,
}) => {
  return (
    <header className="border-b border-neutral-200 bg-white sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-base tracking-tight shadow-xs">
            vC
          </div>
          <span className="text-lg font-bold tracking-tight text-neutral-900">
            vCard QR Pro
          </span>
          {hasContacts && (
            <span className="hidden sm:inline-flex items-center gap-1.5 ml-2 text-xs font-medium text-neutral-500 font-mono tabular-nums">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {contactsCount} {contactsCount === 1 ? 'contato ativo' : 'contatos ativos'}
            </span>
          )}
        </div>

        {/* Zone 2: Navigation / Info */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-600">
          <a href="#tabela" className="hover:text-neutral-900 transition-colors">
            Tabela de Contatos
          </a>
          <a href="#como-funciona" className="hover:text-neutral-900 transition-colors">
            Como Funciona
          </a>
          <a href="#exportacao" className="hover:text-neutral-900 transition-colors">
            QR Code no Celular
          </a>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onResetToSample}
            type="button"
            className="px-3 py-1.5 text-xs font-medium text-neutral-700 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200/80 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap"
            title="Recarregar dados de exemplo demonstrativo"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Carregar</span> Exemplo
          </button>
          <button
            onClick={onNewContactClick}
            type="button"
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-md transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Contato</span>
          </button>
        </div>
      </div>
    </header>
  );
};
