/* ============================================================
   Gate PREMIUM do Mockup Studio — acesso por código
   Exclusivo para assinantes da Biblioteca de Artes.
   ============================================================ */

'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Crown, KeyRound, Loader2, LockKeyhole, MessageCircle, ShieldCheck, TriangleAlert, ArrowLeft,
} from 'lucide-react';
import { useToolsStore } from '@/lib/tools-store';
import { cn } from '@/lib/utils';

const LS_ACCESS = 'cg_mockup_access';
const LS_DEVICE = 'cg_device_id';

function getDeviceId(): string {
  try {
    let id = localStorage.getItem(LS_DEVICE);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(LS_DEVICE, id);
    }
    return id;
  } catch {
    return 'anon';
  }
}

type FailReason = 'invalid' | 'expired' | 'limit' | 'rate' | 'network';

const ERRORS: Record<FailReason, { title: string; msg: string }> = {
  invalid: {
    title: 'Código inválido',
    msg: 'Esse código não existe ou foi revogado. Confira com quem te enviou — letras e números são sem espaços ou traços extras.',
  },
  expired: {
    title: 'Código expirado',
    msg: 'Esse código venceu. Fale com o suporte no WhatsApp para renovar seu acesso.',
  },
  limit: {
    title: 'Limite atingido',
    msg: 'Esse código já foi ativado no limite de dispositivos permitidos. Fale com o suporte para liberar outro.',
  },
  rate: {
    title: 'Aguarde um instante',
    msg: 'Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.',
  },
  network: {
    title: 'Sem conexão',
    msg: 'Não conseguimos validar agora. Verifique sua internet e tente novamente.',
  },
};

export function PremiumGate({ children }: { children: React.ReactNode }) {
  const setActiveTool = useToolsStore((s) => s.setActiveTool);
  const [status, setStatus] = useState<'checking' | 'locked' | 'open'>('checking');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState<FailReason | null>(null);
  const [savedCode, setSavedCode] = useState<string | null>(null);

  const validate = useCallback(async (raw: string): Promise<boolean> => {
    const res = await fetch('/api/access/validate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: raw, deviceId: getDeviceId() }),
    });
    if (!res.ok) throw new Error('network');
    const data = (await res.json()) as { ok: boolean; reason?: FailReason };
    if (data.ok) {
      try {
        localStorage.setItem(LS_ACCESS, JSON.stringify({ code: raw }));
      } catch { /* privado */ }
      return true;
    }
    throw Object.assign(new Error(data.reason ?? 'invalid'), { reason: data.reason ?? 'invalid' });
  }, []);

  /* valida acesso salvo ao abrir */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const saved = JSON.parse(localStorage.getItem(LS_ACCESS) ?? 'null') as { code?: string } | null;
        if (!saved?.code) {
          if (alive) setStatus('locked');
          return;
        }
        await validate(saved.code);
        if (alive) {
          setSavedCode(saved.code);
          setStatus('open');
        }
      } catch (e) {
        if (!alive) return;
        try {
          localStorage.removeItem(LS_ACCESS);
        } catch { /* privado */ }
        if (e && typeof e === 'object' && 'reason' in e) setFail(e.reason as FailReason);
        setStatus('locked');
      }
    })();
    return () => {
      alive = false;
    };
  }, [validate]);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const raw = code.trim().toUpperCase();
    if (!raw || busy) return;
    setBusy(true);
    setFail(null);
    try {
      await validate(raw);
      setSavedCode(raw);
      setStatus('open');
    } catch (err) {
      const reason =
        err && typeof err === 'object' && 'reason' in err ? (err.reason as FailReason) : 'network';
      setFail(reason);
      if (reason === 'invalid' || reason === 'expired') {
        try {
          localStorage.removeItem(LS_ACCESS);
        } catch { /* privado */ }
      }
    } finally {
      setBusy(false);
    }
  };

  const disconnect = () => {
    try {
      localStorage.removeItem(LS_ACCESS);
    } catch { /* privado */ }
    setSavedCode(null);
    setStatus('locked');
  };

  if (status === 'open') {
    return (
      <div className="relative">
        {children}
        {savedCode && (
          <div className="pointer-events-none fixed bottom-3 left-3 z-40 hidden items-center gap-2 rounded-full border border-amber-400/25 bg-black/70 px-3 py-1.5 text-[10px] font-semibold text-amber-300/90 backdrop-blur lg:flex">
            <Crown className="h-3 w-3" /> PREMIUM · {savedCode}
            <button
              onClick={disconnect}
              className="pointer-events-auto ml-1 text-neutral-400 underline-offset-2 transition-colors hover:text-red-400 hover:underline"
            >
              sair
            </button>
          </div>
        )}
      </div>
    );
  }

  if (status === 'checking') {
    return (
      <div className="flex h-[calc(100dvh-61px)] flex-col items-center justify-center gap-3 bg-[#0a0908]">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
          Verificando acesso…
        </p>
      </div>
    );
  }

  const err = fail ? ERRORS[fail] : null;

  return (
    <div className="relative flex min-h-[calc(100dvh-61px)] items-center justify-center overflow-hidden bg-[#0a0908] px-4 py-10">
      {/* brilhos de fundo */}
      <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-amber-500/10 blur-[100px]" />
      <div className="pointer-events-none absolute -right-24 bottom-1/4 h-72 w-72 rounded-full bg-primary/15 blur-[100px]" />
      <div className="dot-grid-dark pointer-events-none absolute inset-0 opacity-40" />

      <div className="relative w-full max-w-md">
        <button
          onClick={() => setActiveTool('inicio')}
          className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar às ferramentas
        </button>

        <div className="rounded-3xl border border-amber-400/20 bg-[#141110] p-6 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)] sm:p-8">
          {/* cabeçalho */}
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-600 text-[#1d130d] shadow-lg shadow-amber-500/20">
              <Crown className="h-6 w-6" />
            </span>
            <div>
              <p className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">
                <LockKeyhole className="h-3 w-3" /> Ferramenta premium
              </p>
              <h1 className="font-display mt-1 text-xl font-bold text-white">
                Mockup <span className="text-amber-400">Studio 3D</span>
              </h1>
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-neutral-300">
            O estúdio de mockups fotorrealistas é <strong className="text-white">exclusivo para
            assinantes da Biblioteca de Artes</strong>. Digite o código de acesso que você recebeu
            ao assinar para liberar o estúdio neste dispositivo.
          </p>

          {/* formulário */}
          <form onSubmit={submit} className="mt-5">
            <label htmlFor="premium-code" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Código de acesso
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                <input
                  id="premium-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="CG-XXXX-XXXX"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  maxLength={24}
                  className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-10 pr-3 font-mono text-sm tracking-[0.14em] text-white placeholder:text-neutral-600 outline-none transition-colors focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/20"
                />
              </div>
              <button
                type="submit"
                disabled={busy || !code.trim()}
                className="flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-b from-amber-300 to-amber-500 px-5 font-display text-sm font-bold text-[#1d130d] transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                <span className="hidden sm:inline">Liberar</span>
              </button>
            </div>
          </form>

          {/* erro */}
          {err && (
            <div role="alert" className="mt-4 flex gap-2.5 rounded-xl border border-red-500/25 bg-red-500/10 p-3">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <div>
                <p className="text-xs font-bold text-red-300">{err.title}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-red-200/80">{err.msg}</p>
              </div>
            </div>
          )}

          {/* ações alternativas */}
          <div className="mt-5 space-y-2.5 border-t border-white/10 pt-5">
            <p className="text-xs leading-relaxed text-neutral-400">
              Ainda não é assinante? A <strong className="text-neutral-200">Biblioteca de Artes</strong> libera
              seu acesso vitalício ao estúdio + centenas de artes prontas para canecas.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <a
                href="https://clickgruda.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-[#1d130d] transition-transform hover:scale-[1.02] active:scale-95"
              >
                <Crown className="h-3.5 w-3.5" /> Quero assinar a Biblioteca
              </a>
              <a
                href="https://wa.me/62998387816?text=Ol%C3%A1!%20Preciso%20de%20ajuda%20com%20meu%20c%C3%B3digo%20de%20acesso%20ao%20Mockup%20Studio"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2.5',
                  'font-display text-xs font-bold uppercase tracking-wide text-neutral-200 transition-colors hover:border-primary/50 hover:text-primary',
                )}
              >
                <MessageCircle className="h-3.5 w-3.5" /> Falar com o suporte
              </a>
            </div>
            <p className="pt-1 text-center text-[10px] leading-relaxed text-neutral-600">
              Um código libera o estúdio no seu dispositivo. Sua arte nunca sai do seu navegador.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
