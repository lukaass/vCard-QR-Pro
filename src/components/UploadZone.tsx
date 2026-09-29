import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface UploadZoneProps {
  onFileLoaded: (content: string, filename: string) => void;
  onLoadSample: () => void;
  hasContacts: boolean;
  currentFilename?: string;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFileLoaded,
  onLoadSample,
  hasContacts,
  currentFilename,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setErrorMsg(null);
    if (!file.name.toLowerCase().endsWith('.vcf') && !file.name.toLowerCase().endsWith('.vcard') && !file.type.includes('vcard')) {
      // Still attempt if text, but warn
      if (!file.name.toLowerCase().endsWith('.txt')) {
        setErrorMsg('Por favor, selecione um arquivo válido com extensão .vcf ou .vcard.');
        return;
      }
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content || !content.toUpperCase().includes('BEGIN:VCARD')) {
        setErrorMsg('O arquivo enviado não contém cartões de contato vCard válidos (BEGIN:VCARD).');
        return;
      }
      onFileLoaded(content, file.name);
    };
    reader.onerror = () => {
      setErrorMsg('Erro ao ler o arquivo no navegador. Tente novamente.');
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  // If contacts are already loaded, render a sleek compact upload & status bar
  if (hasContacts) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg p-4 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-neutral-900">
                  Arquivo carregado:
                </span>
                <span className="text-xs font-mono bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded border border-neutral-200">
                  {currentFilename || 'contatos.vcf'}
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Contatos organizados na tabela abaixo. Gere o QR Code para exportar para o seu smartphone.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <input
              type="file"
              ref={fileInputRef}
              accept=".vcf,.vcard,text/vcard"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              type="button"
              className="px-3 py-1.5 text-xs font-medium text-neutral-700 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200/70 border border-neutral-200/80 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <Upload className="w-3.5 h-3.5" />
              Carregar Outro Arquivo .vcf
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-3 p-2.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    );
  }

  // Initial Hero / Full Drag & Drop Uploader
  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all bg-white ${
          isDragging
            ? 'border-neutral-900 bg-neutral-50/80 shadow-md scale-[1.002]'
            : 'border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50/40'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept=".vcf,.vcard,text/vcard"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="max-w-xl mx-auto flex flex-col items-center">
          <div className="w-14 h-14 rounded-xl bg-neutral-100 border border-neutral-200/70 flex items-center justify-center text-neutral-800 mb-4">
            <Upload className="w-7 h-7" />
          </div>

          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900">
            Faça upload do seu arquivo vCard (.vcf)
          </h2>

          <p className="text-sm text-neutral-600 mt-2 max-w-md">
            Arraste e solte seu arquivo aqui ou navegue no seu computador. Suporta vCards individuais ou em lote (Google Contatos, iPhone/iCloud, Outlook e Android).
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              type="button"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors shadow-xs flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Selecionar Arquivo .vcf
            </button>

            <button
              onClick={onLoadSample}
              type="button"
              className="px-4 py-2.5 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200/80 border border-neutral-200 rounded-lg transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              Ver Exemplo de Demonstração
            </button>
          </div>

          <div className="mt-6 flex items-center gap-3 text-xs text-neutral-500">
            <span>Processamento 100% no navegador</span>
            <span aria-hidden="true">·</span>
            <span>Privacidade total (nenhum dado é enviado a servidores)</span>
            <span aria-hidden="true">·</span>
            <span>Versões 2.1, 3.0 e 4.0</span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
