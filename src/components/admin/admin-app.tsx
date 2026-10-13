/* ============================================================
   Painel Admin — login + Códigos de acesso + Visitas + SEO
   ============================================================ */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3, Check, Copy, Crown, Eye, EyeOff, ExternalLink, KeyRound, Loader2,
  LockKeyhole, LogOut, Plus, RefreshCw, Search, Settings, ShieldCheck, Trash2, Users, X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/* ---------------- tipos ---------------- */

interface CodeRow {
  code: string;
  note: string;
  maxUses: number;
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
  uses: number;
  lastUsedAt: string | null;
}

interface VisitStats {
  total: number;
  hoje: number;
  ultimos7: number;
  ultimos30: number;
  sessoes7: number;
  topPaginas: { path: string; visitas: number }[];
  serie: { day: string; count: number }[];
}

interface SeoForm {
  siteName: string;
  defaultTitle: string;
  titleTemplate: string;
  description: string;
  keywords: string; // vírgulas
  siteUrl: string;
  ogImage: string;
  twitterCreator: string;
  gaId: string;
}

type Tab = 'codigos' | 'visitas' | 'config';

/* ---------------- helpers ---------------- */

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' });
}

function codeStatus(c: CodeRow): { label: string; cls: string } {
  if (!c.active) return { label: 'revogado', cls: 'bg-red-500/15 text-red-400' };
  if (c.expiresAt && new Date(c.expiresAt).getTime() < Date.now())
    return { label: 'expirado', cls: 'bg-zinc-500/20 text-zinc-400' };
  if (c.uses >= c.maxUses) return { label: 'esgotado', cls: 'bg-amber-500/15 text-amber-400' };
  return { label: 'ativo', cls: 'bg-emerald-500/15 text-emerald-400' };
}

const inputCls =
  'w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-neutral-100 outline-none transition-colors placeholder:text-neutral-600 focus:border-primary/60';

/* ============================================================ */

export function AdminApp() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('codigos');

  /* sessão atual */
  useEffect(() => {
    fetch('/api/admin/login')
      .then((r) => r.json())
      .then((d: { authed: boolean }) => setAuthed(d.authed))
      .catch(() => setAuthed(false));
  }, []);

  const login = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!password || loginBusy) return;
    setLoginBusy(true);
    setLoginError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) setAuthed(true);
      else setLoginError(data.error ?? 'Senha incorreta.');
    } catch {
      setLoginError('Falha de conexão. Tente novamente.');
    } finally {
      setLoginBusy(false);
      setPassword('');
    }
  };

  if (authed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0908]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0908] px-4">
        <div className="pointer-events-none absolute -left-20 top-1/3 h-72 w-72 rounded-full bg-primary/10 blur-[100px]" />
        <div className="dot-grid-dark pointer-events-none absolute inset-0 opacity-30" />
        <form
          onSubmit={login}
          className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-[#141110] p-7 shadow-2xl"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-display text-lg font-bold text-white">Painel Admin</h1>
              <p className="text-[11px] text-neutral-500">Click &amp; Gruda Tools</p>
            </div>
          </div>

          <label htmlFor="admin-pw" className="mt-6 mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            Senha do painel
          </label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <input
              id="admin-pw"
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(inputCls, 'py-2.5 pl-10 pr-10')}
              placeholder="••••••••"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 transition-colors hover:text-neutral-300"
              aria-label={showPw ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {loginError && (
            <p role="alert" className="mt-3 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {loginError}
            </p>
          )}

          <button
            type="submit"
            disabled={loginBusy || !password}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-display text-sm font-bold text-[#1d130d] transition-all hover:brightness-110 active:scale-95 disabled:opacity-40"
          >
            {loginBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            Entrar no painel
          </button>

          <a href="/" className="mt-4 block text-center text-[11px] text-neutral-600 transition-colors hover:text-neutral-400">
            ← voltar para o site
          </a>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0908] text-neutral-100">
      {/* topbar */}
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#0d0b0a]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <span className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <span className="font-display text-sm font-bold">
              Painel <span className="text-primary">Admin</span>
            </span>
          </span>

          <nav className="ml-auto flex items-center gap-1 rounded-full border border-white/10 bg-black/30 p-1" aria-label="Seções">
            {(
              [
                ['codigos', 'Códigos', KeyRound],
                ['visitas', 'Visitas', BarChart3],
                ['config', 'SEO & Config', Settings],
              ] as [Tab, string, React.ComponentType<{ className?: string }>][]
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all sm:px-4',
                  tab === id ? 'bg-primary text-[#1d130d]' : 'text-neutral-400 hover:text-white',
                )}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <a
              href="/"
              className="hidden items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[11px] font-bold text-neutral-400 transition-colors hover:text-white sm:flex"
            >
              <ExternalLink className="h-3 w-3" /> Ver site
            </a>
            <button
              onClick={async () => {
                await fetch('/api/admin/login', { method: 'DELETE' });
                setAuthed(false);
              }}
              className="flex items-center gap-1.5 rounded-full border border-red-500/25 px-3 py-1.5 text-[11px] font-bold text-red-400 transition-colors hover:bg-red-500/10"
            >
              <LogOut className="h-3 w-3" /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {tab === 'codigos' && <CodesTab />}
        {tab === 'visitas' && <VisitsTab />}
        {tab === 'config' && <ConfigTab onLogout={() => setAuthed(false)} />}
      </main>
    </div>
  );
}

/* ================= ABA CÓDIGOS ================= */

function CodesTab() {
  const { toast } = useToast();
  const [codes, setCodes] = useState<CodeRow[] | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'todos' | 'ativos' | 'esgotados' | 'expirados' | 'revogados'>('todos');

  const [prefix, setPrefix] = useState('CG');
  const [quantity, setQuantity] = useState(5);
  const [maxUses, setMaxUses] = useState(1);
  const [days, setDays] = useState(30);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [justCreated, setJustCreated] = useState<string[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/codes');
      const data = (await res.json()) as { ok: boolean; codes?: CodeRow[] };
      setCodes(data.codes ?? []);
    } catch {
      toast({ title: 'Erro ao carregar códigos', variant: 'destructive' });
      setCodes([]);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const generate = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/codes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prefix, quantity, maxUses, expiresInDays: days, note }),
      });
      const data = (await res.json()) as { ok: boolean; created?: string[]; error?: string };
      if (data.ok && data.created) {
        setJustCreated(data.created);
        setNote('');
        toast({ title: `${data.created.length} código(s) gerado(s)`, description: 'Já podem ser usados no Mockup Studio.' });
        await load();
      } else {
        toast({ title: data.error ?? 'Falha ao gerar', variant: 'destructive' });
      }
    } finally {
      setBusy(false);
    }
  };

  const patch = async (code: string, body: Record<string, unknown>, msg: string) => {
    await fetch('/api/admin/codes', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code, ...body }),
    });
    toast({ title: msg });
    await load();
  };

  const remove = async (code: string) => {
    if (!window.confirm(`Excluir o código ${code}? Os acessos ativados por ele perdem a validação.`)) return;
    await fetch(`/api/admin/codes?code=${encodeURIComponent(code)}`, { method: 'DELETE' });
    toast({ title: 'Código excluído' });
    await load();
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copiado!' });
  };

  const filtered = useMemo(() => {
    if (!codes) return [];
    const q = search.trim().toLowerCase();
    return codes.filter((c) => {
      const st = codeStatus(c).label;
      if (filter !== 'todos' && st !== filter.slice(0, -1)) return false;
      if (q && !c.code.toLowerCase().includes(q) && !c.note.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [codes, search, filter]);

  const stats = useMemo(() => {
    if (!codes) return { total: 0, ativos: 0, ativacoes: 0 };
    return {
      total: codes.length,
      ativos: codes.filter((c) => codeStatus(c).label === 'ativo').length,
      ativacoes: codes.reduce((n, c) => n + c.uses, 0),
    };
  }, [codes]);

  return (
    <div className="space-y-6">
      {/* stats */}
      <div className="grid grid-cols-3 gap-3">
        {(
          [
            ['Códigos totais', stats.total, Crown],
            ['Ativos agora', stats.ativos, ShieldCheck],
            ['Ativações', stats.ativacoes, Users],
          ] as [string, number, React.ComponentType<{ className?: string }>][]
        ).map(([label, value, Icon]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-[#131010] p-4">
            <Icon className="h-4 w-4 text-primary" />
            <p className="font-display mt-2 text-2xl font-bold text-white">{value}</p>
            <p className="text-[11px] text-neutral-500">{label}</p>
          </div>
        ))}
      </div>

      {/* gerador */}
      <section className="rounded-2xl border border-white/10 bg-[#131010] p-5" aria-label="Gerador de códigos">
        <h2 className="font-display flex items-center gap-2 text-sm font-bold text-white">
          <Plus className="h-4 w-4 text-primary" /> Gerar códigos de acesso
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-neutral-500">
          Cada código libera o Mockup Studio 3D (PREMIUM) nos dispositivos dos assinantes da
          Biblioteca de Artes. Envie o código após confirmar a assinatura.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label htmlFor="g-prefix" className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Prefixo</label>
            <input id="g-prefix" value={prefix} onChange={(e) => setPrefix(e.target.value.toUpperCase())} maxLength={8} className={inputCls} />
          </div>
          <div>
            <label htmlFor="g-qty" className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Quantidade</label>
            <input id="g-qty" type="number" min={1} max={100} value={quantity} onChange={(e) => setQuantity(Math.min(100, Math.max(1, +e.target.value || 1)))} className={inputCls} />
          </div>
          <div>
            <label htmlFor="g-uses" className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Ativações por código</label>
            <input id="g-uses" type="number" min={1} max={9999} value={maxUses} onChange={(e) => setMaxUses(Math.min(9999, Math.max(1, +e.target.value || 1)))} className={inputCls} />
          </div>
          <div>
            <label htmlFor="g-days" className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Validade (dias, 0 = sem)</label>
            <input id="g-days" type="number" min={0} max={3650} value={days} onChange={(e) => setDays(Math.min(3650, Math.max(0, +e.target.value || 0)))} className={inputCls} />
          </div>
          <div>
            <label htmlFor="g-note" className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Observação</label>
            <input id="g-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="ex.: cliente Maria" maxLength={120} className={inputCls} />
          </div>
        </div>

        <button
          onClick={generate}
          disabled={busy}
          className="mt-4 flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-[#1d130d] transition-all hover:brightness-110 active:scale-95 disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          Gerar {quantity} código{quantity > 1 ? 's' : ''}
        </button>

        {justCreated.length > 0 && (
          <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold text-emerald-300">Últimos códigos gerados — copie e envie:</p>
              <button
                onClick={() => copy(justCreated.join('\n'))}
                className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1.5 text-[11px] font-bold text-emerald-300 transition-colors hover:bg-emerald-500/25"
              >
                <Copy className="h-3 w-3" /> Copiar todos
              </button>
            </div>
            <div className="mt-2.5 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {justCreated.map((c) => (
                <button
                  key={c}
                  onClick={() => copy(c)}
                  className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs tracking-wider text-neutral-100 transition-colors hover:border-emerald-400/40"
                >
                  {c} <Copy className="h-3 w-3 shrink-0 text-neutral-500" />
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* lista */}
      <section className="rounded-2xl border border-white/10 bg-[#131010] p-5" aria-label="Códigos gerados">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display flex items-center gap-2 text-sm font-bold text-white">
            Códigos {codes ? `(${codes.length})` : ''}
          </h2>
          <div className="relative ml-auto w-full sm:w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-600" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar código ou nota…" className={cn(inputCls, 'py-1.5 pl-9 text-xs')} />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className={cn(inputCls, 'w-auto py-1.5 text-xs')}
            aria-label="Filtrar por status"
          >
            <option value="todos">Todos os status</option>
            <option value="ativos">Ativos</option>
            <option value="esgotados">Esgotados</option>
            <option value="expirados">Expirados</option>
            <option value="revogados">Revogados</option>
          </select>
          <button onClick={load} className="rounded-lg border border-white/10 p-2 text-neutral-400 transition-colors hover:text-white" aria-label="Recarregar">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        {codes === null ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-xs text-neutral-500">
            Nenhum código {filter !== 'todos' ? 'neste filtro' : 'gerado ainda'}.
          </p>
        ) : (
          <div className="thin-scroll mt-4 max-h-[480px] overflow-y-auto rounded-xl border border-white/5">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-[#181413] text-[10px] uppercase tracking-wider text-neutral-500">
                <tr>
                  <th className="px-3 py-2.5">Código</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Uso</th>
                  <th className="hidden px-3 py-2.5 sm:table-cell">Criado</th>
                  <th className="hidden px-3 py-2.5 sm:table-cell">Expira</th>
                  <th className="hidden px-3 py-2.5 lg:table-cell">Nota</th>
                  <th className="px-3 py-2.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((c) => {
                  const st = codeStatus(c);
                  return (
                    <tr key={c.code} className="transition-colors hover:bg-white/[0.02]">
                      <td className="px-3 py-2.5">
                        <button onClick={() => copy(c.code)} className="flex items-center gap-1.5 font-mono tracking-wider text-neutral-100 hover:text-primary" title="Copiar">
                          {c.code} <Copy className="h-3 w-3 text-neutral-600" />
                        </button>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', st.cls)}>{st.label}</span>
                      </td>
                      <td className="px-3 py-2.5 text-neutral-300">
                        {c.uses}/{c.maxUses}
                        {c.lastUsedAt && <span className="block text-[10px] text-neutral-600">últ. {fmtDate(c.lastUsedAt)}</span>}
                      </td>
                      <td className="hidden px-3 py-2.5 text-neutral-500 sm:table-cell">{fmtDate(c.createdAt)}</td>
                      <td className="hidden px-3 py-2.5 text-neutral-500 sm:table-cell">{c.expiresAt ? fmtDate(c.expiresAt) : 'sem prazo'}</td>
                      <td className="hidden max-w-40 truncate px-3 py-2.5 text-neutral-500 lg:table-cell">{c.note || '—'}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => patch(c.code, { active: !c.active }, c.active ? 'Código revogado' : 'Código reativado')}
                            className={cn(
                              'rounded-md border px-2 py-1 text-[10px] font-bold transition-colors',
                              c.active
                                ? 'border-red-500/25 text-red-400 hover:bg-red-500/10'
                                : 'border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/10',
                            )}
                          >
                            {c.active ? 'Revogar' : 'Reativar'}
                          </button>
                          <button
                            onClick={() => remove(c.code)}
                            className="rounded-md border border-white/10 p-1.5 text-neutral-500 transition-colors hover:border-red-500/40 hover:text-red-400"
                            aria-label={`Excluir ${c.code}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/* ================= ABA VISITAS ================= */

function VisitsTab() {
  const [stats, setStats] = useState<VisitStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/admin/visits')
      .then((r) => r.json())
      .then((d: { ok: boolean; stats?: VisitStats }) => (d.ok && d.stats ? setStats(d.stats) : setError(true)))
      .catch(() => setError(true));
  }, []);

  if (error) {
    return <p className="rounded-2xl border border-red-500/25 bg-red-500/10 p-5 text-sm text-red-300">Não foi possível carregar as estatísticas.</p>;
  }
  if (!stats) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const max = Math.max(1, ...stats.serie.map((s) => s.count));

  const cards = [
    ['Hoje', stats.hoje],
    ['Últimos 7 dias', stats.ultimos7],
    ['Últimos 30 dias', stats.ultimos30],
    ['Sessões (7d)', stats.sessoes7],
    ['Total geral', stats.total],
  ] as [string, number][];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-[#131010] p-4">
            <p className="font-display text-2xl font-bold text-white">{value.toLocaleString('pt-BR')}</p>
            <p className="text-[11px] text-neutral-500">{label}</p>
          </div>
        ))}
      </div>

      {/* gráfico 30 dias */}
      <section className="rounded-2xl border border-white/10 bg-[#131010] p-5" aria-label="Visitas por dia">
        <h2 className="font-display flex items-center gap-2 text-sm font-bold text-white">
          <BarChart3 className="h-4 w-4 text-primary" /> Visitas por dia — últimos 30 dias
        </h2>
        <div className="mt-5 flex h-40 items-end gap-[3px]">
          {stats.serie.map((s) => (
            <div key={s.day} className="group relative flex h-full flex-1 items-end">
              <div
                className={cn(
                  'w-full rounded-t-[3px] transition-all',
                  s.count > 0 ? 'bg-primary/70 group-hover:bg-primary' : 'bg-white/5',
                )}
                style={{ height: `${Math.max(s.count > 0 ? 6 : 2, (s.count / max) * 100)}%` }}
              />
              <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-black/90 px-2 py-1 text-[10px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                {s.count} · {s.day.slice(8)}/{s.day.slice(5, 7)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-neutral-600">
          <span>{stats.serie[0]?.day && `${stats.serie[0].day.slice(8)}/${stats.serie[0].day.slice(5, 7)}`}</span>
          <span>hoje</span>
        </div>
      </section>

      {/* top páginas */}
      <section className="rounded-2xl border border-white/10 bg-[#131010] p-5" aria-label="Páginas mais visitadas">
        <h2 className="font-display flex items-center gap-2 text-sm font-bold text-white">
          <Users className="h-4 w-4 text-primary" /> Páginas mais visitadas (30 dias)
        </h2>
        {stats.topPaginas.length === 0 ? (
          <p className="py-6 text-center text-xs text-neutral-500">
            Sem visitas registradas ainda — elas aparecem aqui conforme o site é usado.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {stats.topPaginas.map((p, i) => {
              const maxPath = stats.topPaginas[0].visitas || 1;
              return (
                <div key={p.path} className="flex items-center gap-3">
                  <span className="w-5 text-right text-[10px] font-bold text-neutral-600">{i + 1}</span>
                  <span className="w-40 truncate font-mono text-[11px] text-neutral-300">{p.path}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-[#ffb488]" style={{ width: `${(p.visitas / maxPath) * 100}%` }} />
                  </div>
                  <span className="w-10 text-right text-[11px] font-bold text-neutral-200">{p.visitas}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

/* ================= ABA SEO & CONFIG ================= */

function ConfigTab({ onLogout }: { onLogout: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState<SeoForm | null>(null);
  const [saving, setSaving] = useState(false);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    fetch('/api/admin/seo')
      .then((r) => r.json())
      .then((d: { ok: boolean; seo?: Omit<SeoForm, 'keywords'> & { keywords: string[] } }) => {
        if (d.ok && d.seo) setForm({ ...d.seo, keywords: d.seo.keywords.join(', ') });
      });
  }, []);

  const saveSeo = async () => {
    if (!form || saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/seo', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...form, keywords: form.keywords.split(',').map((k) => k.trim()).filter(Boolean) }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      toast(
        data.ok
          ? { title: 'SEO salvo!', description: 'Título, descrição e sitemap já usam os novos valores.' }
          : { title: data.error ?? 'Falha ao salvar', variant: 'destructive' },
      );
    } finally {
      setSaving(false);
    }
  };

  const changePw = async () => {
    if (pwBusy) return;
    if (next !== confirm) {
      toast({ title: 'As senhas novas não coincidem', variant: 'destructive' });
      return;
    }
    setPwBusy(true);
    try {
      const res = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ current, next }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        toast({ title: 'Senha alterada!', description: 'Use a nova senha no próximo login.' });
        setCurrent('');
        setNext('');
        setConfirm('');
      } else {
        toast({ title: data.error ?? 'Falha ao alterar', variant: 'destructive' });
      }
    } finally {
      setPwBusy(false);
    }
  };

  if (!form) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const set = (k: keyof SeoForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-[#131010] p-5" aria-label="Configuração de SEO">
        <h2 className="font-display flex items-center gap-2 text-sm font-bold text-white">
          <Settings className="h-4 w-4 text-primary" /> Configuração de SEO
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-neutral-500">
          Esses valores alimentam o título, a descrição, as palavras-chave, o Open Graph, o
          sitemap.xml e o robots.txt do site — em tempo real.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="s-name" className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Nome do site</label>
            <input id="s-name" value={form.siteName} onChange={set('siteName')} className={inputCls} />
          </div>
          <div>
            <label htmlFor="s-url" className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">URL do site (canônica)</label>
            <input id="s-url" value={form.siteUrl} onChange={set('siteUrl')} placeholder="https://seusite.com.br" className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="s-title" className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Título padrão (home)</label>
            <input id="s-title" value={form.defaultTitle} onChange={set('defaultTitle')} className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="s-tpl" className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Template de título das páginas (%s = título)</label>
            <input id="s-tpl" value={form.titleTemplate} onChange={set('titleTemplate')} className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="s-desc" className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Descrição do site (aparece no Google)</label>
            <textarea id="s-desc" value={form.description} onChange={set('description')} rows={2} maxLength={300} className={inputCls} />
            <p className="mt-1 text-right text-[10px] text-neutral-600">{form.description.length}/300 — ideal: até 160</p>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="s-kw" className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Palavras-chave (separadas por vírgula)</label>
            <textarea id="s-kw" value={form.keywords} onChange={set('keywords')} rows={2} className={inputCls} />
          </div>
          <div>
            <label htmlFor="s-og" className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Imagem de compartilhamento (OG)</label>
            <input id="s-og" value={form.ogImage} onChange={set('ogImage')} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="s-tw" className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Twitter/X @</label>
              <input id="s-tw" value={form.twitterCreator} onChange={set('twitterCreator')} placeholder="@suaMarca" className={inputCls} />
            </div>
            <div>
              <label htmlFor="s-ga" className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Google Analytics ID</label>
              <input id="s-ga" value={form.gaId} onChange={set('gaId')} placeholder="G-XXXXXXX" className={inputCls} />
            </div>
          </div>
        </div>

        <button
          onClick={saveSeo}
          disabled={saving}
          className="mt-4 flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-[#1d130d] transition-all hover:brightness-110 active:scale-95 disabled:opacity-40"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Salvar SEO
        </button>
      </section>

      {/* senha */}
      <section className="rounded-2xl border border-white/10 bg-[#131010] p-5" aria-label="Alterar senha">
        <h2 className="font-display flex items-center gap-2 text-sm font-bold text-white">
          <KeyRound className="h-4 w-4 text-primary" /> Senha do painel
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-neutral-500">
          Troque a senha periodicamente. A nova senha é validada no próximo login (a sessão atual continua válida).
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Senha atual" className={inputCls} autoComplete="current-password" />
          <input type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="Nova senha (mín. 6)" className={inputCls} autoComplete="new-password" />
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirmar nova senha" className={inputCls} autoComplete="new-password" />
        </div>
        <button
          onClick={changePw}
          disabled={pwBusy || !current || !next}
          className="mt-4 flex items-center gap-2 rounded-xl border border-primary/50 px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-primary transition-all hover:bg-primary/10 active:scale-95 disabled:opacity-40"
        >
          {pwBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          Alterar senha
        </button>
      </section>

      {/* encerrar sessão */}
      <section className="rounded-2xl border border-red-500/15 bg-red-500/[0.04] p-5" aria-label="Encerrar sessão">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-sm font-bold text-white">Encerrar sessão neste navegador</h2>
            <p className="mt-1 text-xs text-neutral-500">A sessão expira sozinha em 12 horas.</p>
          </div>
          <button
            onClick={async () => {
              await fetch('/api/admin/login', { method: 'DELETE' });
              onLogout();
            }}
            className="flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2 text-xs font-bold text-red-400 transition-colors hover:bg-red-500/10"
          >
            <X className="h-3.5 w-3.5" /> Sair agora
          </button>
        </div>
      </section>
    </div>
  );
}
