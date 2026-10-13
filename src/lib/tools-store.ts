'use client';

import { create } from 'zustand';
import { trackPage } from '@/lib/track';

export type ToolId =
  | 'inicio'
  | 'qr'
  | 'whatsapp'
  | 'orcamento'
  | 'contrato'
  | 'pdf'
  | 'imagens'
  | 'mockup'
  | 'extras';

export type ExtraToolId =
  | 'juros-compostos' | 'desconto' | 'salario-liquido' | 'rescisao'
  | 'maquininha' | 'energia' | 'cotacao' | 'valor-hora'
  | 'sorteador' | 'regra-de-3' | 'imc-tmb' | 'bhaskara' | 'tempo-download' | 'cep' | 'barcode' | 'base64'
  | 'contador' | 'lorem' | 'narrador' | 'remover-duplicadas' | 'slug' | 'utm'
  | 'paleta' | 'mixer-cores' | 'box-shadow' | 'avatar' | 'aspect-ratio'
  | 'senhas' | 'hash' | 'cpf-cnpj' | 'json' | 'dados-falsos' | 'cidr'
  | 'pomodoro' | 'cronometro'
  | 'tempo-render' | 'vram' | 'unidades-3d';

interface ToolsState {
  activeTool: ToolId;
  activeExtra: ExtraToolId | null;
  qrSeed: string; // texto/URL para pré-preencher o gerador de QR
  setActiveTool: (t: ToolId, qrSeed?: string) => void;
  openExtra: (id: ExtraToolId) => void;
}

export const useToolsStore = create<ToolsState>((set) => ({
  activeTool: 'inicio',
  activeExtra: null,
  qrSeed: '',
  setActiveTool: (t, qrSeed) => {
    if (t !== 'inicio') trackPage(`/ferramenta/${t}`);
    set({
      activeTool: t,
      qrSeed: qrSeed ?? '',
      activeExtra: t === 'extras' ? null : null,
    });
  },
  openExtra: (id) => {
    trackPage(`/ferramentas-mais/${id}`);
    set({ activeTool: 'extras', activeExtra: id });
  },
}));
