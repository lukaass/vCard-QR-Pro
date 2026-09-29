import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { UploadZone } from './components/UploadZone';
import { StatsBar } from './components/StatsBar';
import { ContactsTable } from './components/ContactsTable';
import { QrCodeModal } from './components/QrCodeModal';
import { ContactDetailModal } from './components/ContactDetailModal';
import { EditContactModal } from './components/EditContactModal';
import { NewContactModal } from './components/NewContactModal';
import { DynamicLandingPage } from './components/DynamicLandingPage';
import { HowItWorks } from './components/HowItWorks';
import { ParsedContact } from './types/contact';
import { parseVCF } from './utils/vcardParser';
import { SAMPLE_VCF } from './utils/sampleData';
import { updateDynamicContact, getOrCreateDynamicRecord } from './utils/dynamicQrService';

export default function App() {
  const [contacts, setContacts] = useState<ParsedContact[]>([]);
  const [currentFilename, setCurrentFilename] = useState<string>('');
  const [qrContactId, setQrContactId] = useState<string | null>(null);
  const [detailContactId, setDetailContactId] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState<ParsedContact | null>(null);
  const [isNewContactOpen, setIsNewContactOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Check if current URL is resolving a Dynamic QR Scan (?c=shortId)
  const [dynamicShortId, setDynamicShortId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('c');
  });

  // Initialize with sample contacts so the user sees immediate value on page load
  useEffect(() => {
    const initialContacts = parseVCF(SAMPLE_VCF);
    setContacts(initialContacts);
    setCurrentFilename('agenda_demonstracao.vcf');
    // Pre-register dynamic records for all sample contacts
    initialContacts.forEach((c) => getOrCreateDynamicRecord(c));
  }, []);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  };

  const handleFileLoaded = (content: string, filename: string) => {
    const parsed = parseVCF(content);
    if (parsed.length === 0) {
      alert('Nenhum contato válido encontrado no arquivo selecionado.');
      return;
    }
    // Pre-register dynamic records
    parsed.forEach((c) => getOrCreateDynamicRecord(c));
    setContacts(parsed);
    setCurrentFilename(filename);
    showToast(`${parsed.length} ${parsed.length === 1 ? 'contato importado' : 'contatos importados'} com sucesso!`);
  };

  const handleLoadSample = () => {
    const sample = parseVCF(SAMPLE_VCF);
    sample.forEach((c) => getOrCreateDynamicRecord(c));
    setContacts(sample);
    setCurrentFilename('agenda_demonstracao.vcf');
    showToast('Arquivo demonstrativo com 7 contatos carregado com sucesso!');
  };

  const handleDeleteContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    showToast('Contato removido.', 'info');
  };

  const handleBulkDelete = (ids: string[]) => {
    const idSet = new Set(ids);
    setContacts((prev) => prev.filter((c) => !idSet.has(c.id)));
    showToast(`${ids.length} contatos removidos.`, 'info');
  };

  const handleAddContact = (newContact: ParsedContact) => {
    getOrCreateDynamicRecord(newContact);
    setContacts((prev) => [newContact, ...prev]);
    showToast(`Contato "${newContact.fullName}" adicionado com sucesso!`);
  };

  const handleSaveEditedContact = (updatedContact: ParsedContact) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === updatedContact.id ? updatedContact : c))
    );

    // Sync to dynamic link storage so existing printed QR codes update in real-time!
    const dynamicRecord = getOrCreateDynamicRecord(updatedContact);
    updateDynamicContact(dynamicRecord.shortId, updatedContact);

    showToast(`Contato "${updatedContact.fullName}" atualizado! O QR Code dinâmico já reflete as novas informações.`);
  };

  // QR Modal navigation helper
  const qrContactIndex = contacts.findIndex((c) => c.id === qrContactId);
  const currentQrContact = qrContactIndex !== -1 ? contacts[qrContactIndex] : null;

  const handleNavigateQr = (direction: 'prev' | 'next') => {
    if (qrContactIndex === -1) return;
    const nextIdx = direction === 'prev' ? qrContactIndex - 1 : qrContactIndex + 1;
    if (nextIdx >= 0 && nextIdx < contacts.length) {
      setQrContactId(contacts[nextIdx].id);
    }
  };

  // Detail Modal contact
  const currentDetailContact = contacts.find((c) => c.id === detailContactId) || null;

  // IF USER SCANNED A DYNAMIC QR CODE LINK (?c=xxxx):
  // Render the responsive digital business card landing page
  if (dynamicShortId) {
    return (
      <DynamicLandingPage
        shortId={dynamicShortId}
        onGoHome={() => {
          // Remove query parameter cleanly
          window.history.pushState({}, '', window.location.pathname);
          setDynamicShortId(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900 font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-neutral-900 text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-medium flex items-center gap-2 border border-neutral-800 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Navigation */}
      <Navbar
        onNewContactClick={() => setIsNewContactOpen(true)}
        onResetToSample={handleLoadSample}
        hasContacts={contacts.length > 0}
        contactsCount={contacts.length}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Title Section */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
            <span>Utilitário vCard RFC 2425/6350</span>
            <span aria-hidden="true">·</span>
            <span>QR Codes Dinâmicos & Estáticos</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 text-balance">
            Leitor de Arquivos vCard (.vcf) & Exportador QR Code Dinâmico
          </h1>
          <p className="text-sm text-neutral-600 max-w-3xl leading-relaxed">
            Faça upload do seu arquivo de contatos, navegue na tabela interativa e gere QR Codes para cada contato individualmente. Escolha entre <strong>QR Code Dinâmico</strong> (permite atualizar dados sem trocar o cartão impresso) ou <strong>QR Code Estático</strong> (offline direto no vCard).
          </p>
        </div>

        {/* Upload Zone */}
        <UploadZone
          onFileLoaded={handleFileLoaded}
          onLoadSample={handleLoadSample}
          hasContacts={contacts.length > 0}
          currentFilename={currentFilename}
        />

        {/* Stats & Table Section */}
        {contacts.length > 0 ? (
          <div className="space-y-5">
            <StatsBar contacts={contacts} />

            <ContactsTable
              contacts={contacts}
              onOpenQrCode={(c) => setQrContactId(c.id)}
              onOpenDetails={(c) => setDetailContactId(c.id)}
              onEditContact={(c) => setEditingContact(c)}
              onDeleteContact={handleDeleteContact}
              onBulkDelete={handleBulkDelete}
            />
          </div>
        ) : (
          <div className="text-center py-16 bg-white border border-neutral-200 rounded-xl p-8">
            <p className="text-neutral-500 text-sm mb-4">
              Nenhum contato carregado no momento.
            </p>
            <button
              onClick={handleLoadSample}
              className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors"
            >
              Carregar Dados de Exemplo
            </button>
          </div>
        )}

        {/* Informative / How it works */}
        <HowItWorks />
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white py-6 text-center text-xs text-neutral-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-800">vCard QR Pro</span>
            <span aria-hidden="true">·</span>
            <span>QR Codes Dinâmicos & Estáticos</span>
          </div>
          <div className="flex items-center gap-4 text-neutral-500">
            <span>Privacidade total</span>
            <span aria-hidden="true">·</span>
            <span>Links Dinâmicos com rastreio de leituras</span>
            <span aria-hidden="true">·</span>
            <span>Padrão vCard 3.0</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <QrCodeModal
        contact={currentQrContact}
        onClose={() => setQrContactId(null)}
        onNavigatePrev={() => handleNavigateQr('prev')}
        onNavigateNext={() => handleNavigateQr('next')}
        onEditContact={(c) => {
          setQrContactId(null);
          setEditingContact(c);
        }}
        hasPrev={qrContactIndex > 0}
        hasNext={qrContactIndex !== -1 && qrContactIndex < contacts.length - 1}
      />

      <ContactDetailModal
        contact={currentDetailContact}
        onClose={() => setDetailContactId(null)}
        onOpenQrCode={(c) => {
          setDetailContactId(null);
          setQrContactId(c.id);
        }}
        onEditContact={(c) => {
          setDetailContactId(null);
          setEditingContact(c);
        }}
      />

      <EditContactModal
        contact={editingContact}
        onClose={() => setEditingContact(null)}
        onSave={handleSaveEditedContact}
      />

      <NewContactModal
        isOpen={isNewContactOpen}
        onClose={() => setIsNewContactOpen(false)}
        onAddContact={handleAddContact}
      />
    </div>
  );
}
