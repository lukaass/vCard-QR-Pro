import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Download,
  Copy,
  Check,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  Sliders,
  Printer,
  ShieldCheck,
  FileCheck2,
  Zap,
  Globe,
  RefreshCw,
  ExternalLink,
  Edit3,
  BarChart2,
  Share2,
} from 'lucide-react';
import { ParsedContact } from '../types/contact';
import { generateVCardString, downloadVCF } from '../utils/vcardParser';
import {
  getOrCreateDynamicRecord,
  getDynamicUrl,
  DynamicContactRecord,
} from '../utils/dynamicQrService';

interface QrCodeModalProps {
  contact: ParsedContact | null;
  onClose: () => void;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
  onEditContact?: (contact: ParsedContact) => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  contact,
  onClose,
  onNavigatePrev,
  onNavigateNext,
  onEditContact,
  hasPrev,
  hasNext,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedVCard, setCopiedVCard] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // QR Mode: 'dynamic' (Ultra clean, editable URL with tracking) vs 'static' (Offline raw vCard)
  const [qrType, setQrType] = useState<'dynamic' | 'static'>('dynamic');

  // Customization controls
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('L');
  const [margin, setMargin] = useState<number>(3);
  const [themeColor, setThemeColor] = useState<string>('#000000');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [showDataIntegrity, setShowDataIntegrity] = useState<boolean>(false);

  const [dynamicRecord, setDynamicRecord] = useState<DynamicContactRecord | null>(null);
  const [matrixStats, setMatrixStats] = useState<{ charCount: number; modulesEstimate: string }>({
    charCount: 0,
    modulesEstimate: '',
  });

  // Load/Generate dynamic record whenever contact changes
  useEffect(() => {
    if (!contact) return;
    const record = getOrCreateDynamicRecord(contact);
    setDynamicRecord(record);
  }, [contact]);

  // Render QR Code based on chosen mode (Dynamic vs Static)
  useEffect(() => {
    if (!contact || !canvasRef.current) return;

    setError(null);
    let payload = '';

    if (qrType === 'dynamic') {
      const record = getOrCreateDynamicRecord(contact);
      payload = getDynamicUrl(record.shortId);
      setMatrixStats({
        charCount: payload.length,
        modulesEstimate: 'Matriz ultra-limpa (~21x21 blocos gigantes)',
      });
    } else {
      // 100% complete offline static vCard
      payload = generateVCardString(contact, true);
      setMatrixStats({
        charCount: payload.length,
        modulesEstimate: 'Matriz vCard completa (~41x41 blocos densos)',
      });
    }

    // Render directly to canvas using qrcode library
    QRCode.toCanvas(
      canvasRef.current,
      payload,
      {
        width: 250,
        margin: margin,
        errorCorrectionLevel: errorLevel,
        color: {
          dark: themeColor,
          light: '#ffffff',
        },
      },
      (err) => {
        if (err) {
          console.error('Erro ao renderizar QR code:', err);
          setError('Não foi possível renderizar o QR code.');
        }
      }
    );
  }, [contact, qrType, errorLevel, margin, themeColor]);

  // Handle ESC and arrows
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev && onNavigatePrev) onNavigatePrev();
      if (e.key === 'ArrowRight' && hasNext && onNavigateNext) onNavigateNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, hasPrev, hasNext, onNavigatePrev, onNavigateNext]);

  if (!contact) return null;

  const primaryPhone = contact.phones[0]?.number;
  const primaryEmail = contact.emails[0]?.address;
  const dynamicUrl = dynamicRecord ? getDynamicUrl(dynamicRecord.shortId) : '';

  // Download high-resolution PNG for printing
  const handleDownloadHiResPNG = async () => {
    if (!contact) return;
    try {
      const payload =
        qrType === 'dynamic' && dynamicRecord
          ? getDynamicUrl(dynamicRecord.shortId)
          : generateVCardString(contact, true);

      const dataUrl = await QRCode.toDataURL(payload, {
        width: 1500,
        margin: margin,
        errorCorrectionLevel: errorLevel,
        color: {
          dark: themeColor,
          light: '#ffffff',
        },
      });

      const a = document.createElement('a');
      a.href = dataUrl;
      const safeName = contact.fullName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const modeStr = qrType === 'dynamic' ? 'dinamico' : 'estatico';
      a.download = `qrcode_${safeName}_${modeStr}_hd.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadStandardPNG = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    const safeName = contact.fullName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    a.download = `qrcode_${safeName}_${qrType}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyLink = async () => {
    if (!dynamicUrl) return;
    try {
      await navigator.clipboard.writeText(dynamicUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyVCardText = async () => {
    try {
      await navigator.clipboard.writeText(generateVCardString(contact, true));
      setCopiedVCard(true);
      setTimeout(() => setCopiedVCard(false), 2000);
    } catch (e) {
      console.error(e);
    }
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/70">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-neutral-700" />
            <span className="text-sm font-bold text-neutral-900">
              Exportação & QR Code
            </span>
            {qrType === 'dynamic' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                <Zap className="w-3 h-3 text-emerald-600 fill-emerald-500" />
                Modo Dinâmico Ativo
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-full border border-neutral-200">
                Modo Estático (Offline)
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {onNavigatePrev && (
              <button
                onClick={onNavigatePrev}
                disabled={!hasPrev}
                title="Contato anterior (Seta esquerda)"
                className="p-1 rounded text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/60 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            {onNavigateNext && (
              <button
                onClick={onNavigateNext}
                disabled={!hasNext}
                title="Próximo contato (Seta direita)"
                className="p-1 rounded text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/60 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal 2-column layout */}
        <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Visual QR Preview & Live Stats */}
          <div className="md:col-span-6 flex flex-col items-center justify-between">
            <div className="w-full flex flex-col items-center">
              {/* Contact summary */}
              <div className="text-center mb-3 w-full">
                <h3 className="text-base font-bold text-neutral-900 tracking-tight truncate">
                  {contact.fullName}
                </h3>
                {(contact.title || contact.organization) && (
                  <p className="text-xs text-neutral-500 truncate mt-0.5">
                    {[contact.title, contact.organization].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>

              {/* QR Canvas Box */}
              <div className="flex flex-col items-center justify-center p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 w-full max-w-[270px] shadow-inner relative group">
                <div className="bg-white p-2 rounded-xl border border-neutral-200 shadow-xs">
                  <canvas ref={canvasRef} className="block w-[210px] h-[210px]" />
                </div>

                {error && (
                  <p className="text-xs text-rose-600 mt-2 text-center font-medium">
                    {error}
                  </p>
                )}

                {/* Status tag */}
                <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] text-neutral-700 font-medium">
                  {qrType === 'dynamic' ? (
                    <>
                      <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                      <span>Riscos grossos & Atualização em tempo real</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-neutral-600" />
                      <span>Gravado 100% no código (Sem internet)</span>
                    </>
                  )}
                </div>
              </div>

              {/* Dynamic QR Analytics & Live Link badge */}
              {qrType === 'dynamic' && dynamicRecord && (
                <div className="mt-3 w-full max-w-[270px] bg-neutral-50 p-2.5 rounded-xl border border-neutral-200/80 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500 flex items-center gap-1 text-[11px]">
                      <BarChart2 className="w-3 h-3 text-neutral-700" />
                      Leituras registradas:
                    </span>
                    <span className="font-mono font-bold text-neutral-900 bg-white px-1.5 py-0.5 rounded border border-neutral-200">
                      {dynamicRecord.scanCount || 0} escaneamentos
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-neutral-200/60">
                    <span className="text-neutral-500 truncate mr-1 font-mono">{dynamicUrl}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="text-neutral-600 hover:text-neutral-900 p-1 hover:bg-neutral-200/60 rounded"
                        title="Copiar Link Dinâmico"
                      >
                        {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                      <a
                        href={dynamicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-neutral-600 hover:text-neutral-900 p-1 hover:bg-neutral-200/60 rounded"
                        title="Testar página do QR Code no navegador"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Static vCard fields breakdown */}
              {qrType === 'static' && (
                <div className="mt-2 w-full max-w-[270px]">
                  <button
                    type="button"
                    onClick={() => setShowDataIntegrity(!showDataIntegrity)}
                    className="w-full text-center text-[11px] text-neutral-500 hover:text-neutral-900 underline flex items-center justify-center gap-1 py-1"
                  >
                    <FileCheck2 className="w-3 h-3 text-neutral-600" />
                    <span>{showDataIntegrity ? 'Ocultar campos' : 'Ver campos gravados'}</span>
                  </button>

                  {showDataIntegrity && (
                    <div className="mt-1 p-2 bg-neutral-100 rounded-lg text-[10px] space-y-1 text-neutral-700 border border-neutral-200 max-h-32 overflow-y-auto">
                      <div className="font-semibold text-neutral-900">Nome: {contact.fullName}</div>
                      {contact.phones.map((p, i) => (
                        <div key={i}>Tel: {p.number} ({p.type || 'Geral'})</div>
                      ))}
                      {contact.emails.map((e, i) => (
                        <div key={i} className="truncate">Email: {e.address}</div>
                      ))}
                      {contact.organization && <div className="truncate">Empresa: {contact.organization}</div>}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-3 text-[11px] text-neutral-400 text-center font-mono">
              {matrixStats.charCount} caracteres · {matrixStats.modulesEstimate}
            </div>
          </div>

          {/* Right Column: Customization & Dynamic Features */}
          <div className="md:col-span-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-neutral-200 pt-4 md:pt-0 md:pl-6">
            <div className="space-y-4">
              {/* Type Switcher: DYNAMIC vs STATIC */}
              <div>
                <label className="block text-xs font-bold text-neutral-900 mb-1.5">
                  Tipo de QR Code:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setQrType('dynamic')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      qrType === 'dynamic'
                        ? 'border-neutral-950 bg-neutral-950 text-white shadow-md'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>QR Dinâmico</span>
                      <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    </div>
                    <p className={`text-[10px] mt-1 leading-snug ${qrType === 'dynamic' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                      <strong>Permite alterar dados</strong> sem trocar a impressão. Riscos mais grossos, leitura ultra-rápida e métricas de escaneamento.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQrType('static')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      qrType === 'static'
                        ? 'border-neutral-950 bg-neutral-950 text-white shadow-md'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                    }`}
                  >
                    <div className="font-bold text-xs">QR Estático</div>
                    <p className={`text-[10px] mt-1 leading-snug ${qrType === 'static' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                      Grava o vCard completo diretamente no código. Funciona 100% offline sem depender de servidor web.
                    </p>
                  </button>
                </div>
              </div>

              {/* Dynamic Live Update Callout */}
              {qrType === 'dynamic' && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-950 space-y-2">
                  <div className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-amber-600 fill-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <strong>Vantagem do QR Dinâmico:</strong> Mudou de telefone ou de cargo? Você edita os dados no sistema e qualquer pessoa que escanear seu cartão impresso receberá os novos dados instantaneamente!
                    </div>
                  </div>
                  {onEditContact && (
                    <button
                      type="button"
                      onClick={() => onEditContact(contact)}
                      className="w-full py-1.5 px-2 bg-amber-200/70 hover:bg-amber-200 text-amber-900 font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 text-xs"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Editar Dados Deste Contato Agora</span>
                    </button>
                  )}
                </div>
              )}

              {/* Color Theme Selector */}
              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                  Cor do QR Code:
                </label>
                <div className="flex items-center gap-2">
                  {[
                    { color: '#000000', label: 'Preto Puro (Máximo Contraste Óptico)' },
                    { color: '#0f172a', label: 'Azul Grafite' },
                    { color: '#1e3a8a', label: 'Azul Marinho' },
                    { color: '#064e3b', label: 'Verde Floresta' },
                    { color: '#701a75', label: 'Bordô / Vinho' },
                  ].map((preset) => (
                    <button
                      key={preset.color}
                      type="button"
                      onClick={() => setThemeColor(preset.color)}
                      style={{ backgroundColor: preset.color }}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        themeColor === preset.color ? 'border-neutral-900 scale-110 shadow-xs' : 'border-white'
                      }`}
                      title={preset.label}
                    />
                  ))}
                  <input
                    type="color"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    className="w-7 h-7 rounded-full border border-neutral-300 cursor-pointer p-0.5 bg-white"
                    title="Escolher cor personalizada"
                  />
                </div>
              </div>

              {/* Margin & Quiet Zone */}
              <div>
                <div className="flex items-center justify-between mb-1 text-xs">
                  <span className="font-semibold text-neutral-800">
                    Borda Branca de Segurança (Quiet Zone):
                  </span>
                  <span className="font-mono text-neutral-600 text-[11px]">{margin} blocos</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={6}
                  value={margin}
                  onChange={(e) => setMargin(Number(e.target.value))}
                  className="w-full accent-neutral-900"
                />
              </div>

              {/* Advanced options */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-[11px] text-neutral-500 hover:text-neutral-900 underline flex items-center gap-1"
                >
                  <Sliders className="w-3 h-3" />
                  <span>{showAdvanced ? 'Menos opções de correção de erro' : 'Ajustes finos de redundância'}</span>
                </button>

                {showAdvanced && (
                  <div className="mt-2 p-2.5 bg-neutral-50 rounded-lg border border-neutral-200 text-xs space-y-1.5 animate-in fade-in duration-100">
                    <span className="text-[11px] font-medium text-neutral-700 block">Nível de Correção:</span>
                    <div className="grid grid-cols-4 gap-1">
                      {(['L', 'M', 'Q', 'H'] as const).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setErrorLevel(lvl)}
                          className={`py-1 rounded text-center font-mono font-medium text-xs ${
                            errorLevel === lvl ? 'bg-neutral-900 text-white font-bold' : 'bg-white border text-neutral-700'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-5 pt-4 border-t border-neutral-200 space-y-2">
              <button
                onClick={handleDownloadHiResPNG}
                type="button"
                className="w-full py-2.5 px-3 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>
                  Baixar {qrType === 'dynamic' ? 'QR Dinâmico' : 'QR Estático'} em Alta Resolução (1500px HD)
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleDownloadStandardPNG}
                  type="button"
                  className="py-1.5 px-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200/80 border border-neutral-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PNG Padrão</span>
                </button>

                <button
                  onClick={qrType === 'dynamic' ? handleCopyLink : handleCopyVCardText}
                  type="button"
                  className="py-1.5 px-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200/80 border border-neutral-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  {copiedLink || copiedVCard ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{qrType === 'dynamic' ? 'Copiar Link' : 'Copiar vCard'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
