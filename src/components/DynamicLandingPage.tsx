import React, { useEffect, useState } from 'react';
import {
  Phone,
  Mail,
  Building2,
  MapPin,
  Globe,
  Share2,
  Check,
  Smartphone,
  ExternalLink,
  MessageCircle,
  Loader2,
} from 'lucide-react';
import { ParsedContact } from '../types/contact';
import { downloadVCF } from '../utils/vcardParser';
import { fetchContactByShortId } from '../utils/dynamicQrService';

interface DynamicLandingPageProps {
  shortId: string;
  onGoHome: () => void;
}

export const DynamicLandingPage: React.FC<DynamicLandingPageProps> = ({ shortId, onGoHome }) => {
  const [contact, setContact] = useState<ParsedContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchContactByShortId(shortId)
      .then((resolved) => {
        if (isMounted) {
          setContact(resolved);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [shortId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center">
          <Loader2 className="w-8 h-8 text-neutral-800 animate-spin mb-3" />
          <p className="text-xs font-medium text-neutral-600">Carregando cartão digital...</p>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="min-h-screen bg-neutral-100 flex flex-col items-center justify-center p-4 text-center font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full border border-neutral-200">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 font-bold text-xl">
            !
          </div>
          <h1 className="text-lg font-bold text-neutral-900 mb-2">Contato não encontrado</h1>
          <p className="text-xs text-neutral-500 mb-6">
            O código deste QR Code dinâmico pode ter expirado ou não foi sincronizado com o servidor.
          </p>
          <button
            onClick={onGoHome}
            className="w-full py-2.5 px-4 bg-neutral-900 text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 transition-colors shadow-xs"
          >
            Abrir Plataforma vCard QR Pro
          </button>
        </div>
      </div>
    );
  }

  const primaryPhone = contact.phones[0]?.number;
  const primaryEmail = contact.emails[0]?.address;

  const handleDownloadVcard = () => {
    const safeName = contact.fullName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    downloadVCF([contact], `${safeName}.vcf`);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  const handleCopyPhone = async (num: string) => {
    try {
      await navigator.clipboard.writeText(num);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-100 to-neutral-200/60 flex flex-col items-center justify-center p-3 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Banner */}
        <div className="bg-neutral-950 text-white p-6 pb-12 relative text-center">
          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center gap-1 text-[10px] font-mono tracking-wider uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              QR Dinâmico
            </span>
          </div>
          <div className="inline-block text-[11px] font-medium text-neutral-400 tracking-wider uppercase mb-1">
            Cartão de Visitas Digital
          </div>
          <p className="text-xs text-neutral-400">vCard QR Pro Live</p>
        </div>

        {/* Profile Card Body */}
        <div className="px-6 pt-0 pb-6 -mt-10">
          <div className="flex justify-center mb-3">
            <div className="w-20 h-20 rounded-2xl bg-white p-1 shadow-lg border border-neutral-100 flex items-center justify-center">
              <div className="w-full h-full rounded-xl bg-neutral-900 text-white font-bold text-2xl flex items-center justify-center shadow-inner">
                {contact.fullName.substring(0, 2).toUpperCase()}
              </div>
            </div>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-neutral-950 tracking-tight">
              {contact.fullName}
            </h1>
            {contact.title && (
              <p className="text-xs font-semibold text-neutral-700 mt-0.5">
                {contact.title}
              </p>
            )}
            {contact.organization && (
              <p className="text-xs text-neutral-500 flex items-center justify-center gap-1 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-neutral-400" />
                <span>{contact.organization}</span>
              </p>
            )}
          </div>

          <div className="mb-6 space-y-2">
            <button
              onClick={handleDownloadVcard}
              type="button"
              className="w-full py-3.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-neutral-900/10 transition-transform active:scale-[0.98]"
            >
              {downloaded ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Contato Salvo!</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-4 h-4 text-white" />
                  <span>Salvar Contato na Agenda</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-neutral-500">
              Gera o arquivo vCard compatível com Android e iPhone
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 mb-6">
            {primaryPhone && (
              <>
                <a
                  href={`tel:${primaryPhone.replace(/\s+/g, '')}`}
                  className="p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 flex flex-col items-center justify-center text-center transition-colors group"
                >
                  <Phone className="w-4 h-4 text-neutral-700 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-semibold text-neutral-900">Ligar</span>
                  <span className="text-[10px] text-neutral-500 font-mono truncate w-full px-1">{primaryPhone}</span>
                </a>

                <a
                  href={`https://wa.me/${primaryPhone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 flex flex-col items-center justify-center text-center transition-colors group"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-700 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-semibold text-emerald-950">WhatsApp</span>
                  <span className="text-[10px] text-emerald-700">Conversar</span>
                </a>
              </>
            )}

            {primaryEmail && !primaryPhone && (
              <a
                href={`mailto:${primaryEmail}`}
                className="col-span-2 p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 flex items-center justify-center gap-2 text-center transition-colors"
              >
                <Mail className="w-4 h-4 text-neutral-700" />
                <span className="text-xs font-semibold text-neutral-900">Enviar E-mail ({primaryEmail})</span>
              </a>
            )}
          </div>

          <div className="space-y-3 pt-4 border-t border-neutral-100 text-xs">
            {contact.phones.length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">
                  Telefones
                </span>
                <div className="space-y-1">
                  {contact.phones.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/70 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-neutral-500" />
                        <span className="font-mono text-neutral-900 font-medium">{p.number}</span>
                        <span className="text-[10px] text-neutral-400 uppercase">({p.type || 'Geral'})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyPhone(p.number)}
                        className="text-neutral-400 hover:text-neutral-900 p-1"
                        title="Copiar número"
                      >
                        {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {contact.emails.length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">
                  E-mails
                </span>
                <div className="space-y-1">
                  {contact.emails.map((e, idx) => (
                    <a
                      key={idx}
                      href={`mailto:${e.address}`}
                      className="p-2.5 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/70 flex items-center justify-between text-neutral-900 transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                        <span className="truncate">{e.address}</span>
                      </div>
                      <ExternalLink className="w-3 h-3 text-neutral-400 shrink-0 ml-2" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {contact.addresses.length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">
                  Localização
                </span>
                <div className="space-y-1">
                  {contact.addresses.map((a, idx) => {
                    const fullAddr = [a.street, a.city, a.state, a.postalCode, a.country].filter(Boolean).join(', ');
                    return (
                      <div key={idx} className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/70 flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" />
                        <span className="text-neutral-800 leading-snug">{fullAddr}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {contact.urls.length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">
                  Sites & Links
                </span>
                <div className="space-y-1">
                  {contact.urls.map((u, idx) => (
                    <a
                      key={idx}
                      href={u.startsWith('http') ? u : `https://${u}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/70 flex items-center justify-between text-neutral-900 transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Globe className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                        <span className="truncate">{u}</span>
                      </div>
                      <ExternalLink className="w-3 h-3 text-neutral-400 shrink-0 ml-2" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {contact.notes && (
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">
                  Observações
                </span>
                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/70 text-neutral-700 leading-relaxed whitespace-pre-wrap">
                  {contact.notes}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-neutral-50 p-4 border-t border-neutral-200 text-center">
          <button
            onClick={onGoHome}
            type="button"
            className="text-xs font-semibold text-neutral-700 hover:text-neutral-950 transition-colors"
          >
            ← Voltar para a Plataforma vCard QR Pro
          </button>
        </div>
      </div>
    </div>
  );
};
