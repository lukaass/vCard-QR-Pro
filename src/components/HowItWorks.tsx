import React from 'react';
import { Upload, Table, QrCode, Smartphone, ShieldCheck, Zap } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  return (
    <section id="como-funciona" className="my-12 pt-8 border-t border-neutral-200">
      <div className="max-w-3xl mb-8">
        <h2 className="text-xl font-bold tracking-tight text-neutral-900">
          Como funciona a exportação via QR Code direto no navegador
        </h2>
        <p className="text-sm text-neutral-600 mt-1">
          Sem necessidade de instalar aplicativos externos. Compatível com todas as versões do padrão vCard.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-xl bg-white border border-neutral-200">
          <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-900 mb-3 font-semibold text-sm">
            01
          </div>
          <h3 className="text-sm font-semibold text-neutral-900 mb-1">
            Upload e Leitura Local (.vcf)
          </h3>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Seu arquivo vCard é processado inteiramente dentro do seu navegador. Nenhum dado de contato é transmitido ou salvo em servidores externos.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-neutral-200">
          <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-900 mb-3 font-semibold text-sm">
            02
          </div>
          <h3 className="text-sm font-semibold text-neutral-900 mb-1">
            Tabela Dinâmica com Busca
          </h3>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Ordene por nome, empresa ou cargo, filtre por contatos com celular ou e-mail, e exporte seleções personalizadas em lote para .vcf ou CSV.
          </p>
        </div>

        <div id="exportacao" className="p-5 rounded-xl bg-white border border-neutral-200">
          <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-900 mb-3 font-semibold text-sm">
            03
          </div>
          <h3 className="text-sm font-semibold text-neutral-900 mb-1">
            QR Code Dinâmico & Atualizável
          </h3>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Gera links curtos inteligentes com blocos grossos e nítidos. Permite atualizar telefones e cargos em tempo real sem precisar reimprimir cartões, além de contabilizar leituras!
          </p>
        </div>
      </div>
    </section>
  );
};
