/* ============================================================
   GET    /api/admin/codes  → lista códigos de acesso
   POST   /api/admin/codes  → gera códigos em lote
   PATCH  /api/admin/codes  → atualiza (revogar, nota, validade, usos)
   DELETE /api/admin/codes?code=X → exclui
   ============================================================ */

import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem O/0/1/I

function chunk(n = 4): string {
  const bytes = randomBytes(n);
  let out = '';
  for (let i = 0; i < n; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

function normalizePrefix(raw: unknown): string {
  const p = String(raw ?? 'CG')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8);
  return p || 'CG';
}

export async function GET(req: Request) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ ok: false, error: 'Não autorizado.' }, { status: 401 });
  }
  const rows = await db.accessCode.findMany({
    include: { uses: { orderBy: { usedAt: 'desc' } } },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });
  const codes = rows.map((r) => ({
    code: r.code,
    note: r.note,
    maxUses: r.maxUses,
    active: r.active,
    expiresAt: r.expiresAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    uses: r.uses.length,
    lastUsedAt: r.uses[0]?.usedAt.toISOString() ?? null,
  }));
  return NextResponse.json({ ok: true, codes });
}

export async function POST(req: Request) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ ok: false, error: 'Não autorizado.' }, { status: 401 });
  }

  let body: {
    prefix?: string;
    quantity?: number;
    maxUses?: number;
    expiresInDays?: number;
    note?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Requisição inválida.' }, { status: 400 });
  }

  const prefix = normalizePrefix(body.prefix);
  const quantity = Math.min(100, Math.max(1, Math.floor(Number(body.quantity ?? 1)) || 1));
  const maxUses = Math.min(9999, Math.max(1, Math.floor(Number(body.maxUses ?? 1)) || 1));
  const days = Math.min(3650, Math.max(0, Math.floor(Number(body.expiresInDays ?? 30)) || 0));
  const note = String(body.note ?? '').slice(0, 120);
  const expiresAt = days > 0 ? new Date(Date.now() + days * 86_400_000) : null;

  const created: string[] = [];
  let guard = 0;
  while (created.length < quantity && guard < quantity * 8 + 20) {
    guard += 1;
    const code = `${prefix}-${chunk()}-${chunk()}`;
    try {
      await db.accessCode.create({ data: { code, note, maxUses, expiresAt } });
      created.push(code);
    } catch {
      /* código duplicado → tenta outro */
    }
  }

  return NextResponse.json({ ok: true, created });
}

export async function PATCH(req: Request) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ ok: false, error: 'Não autorizado.' }, { status: 401 });
  }
  let body: {
    code?: string;
    active?: boolean;
    note?: string;
    maxUses?: number;
    expiresInDays?: number | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Requisição inválida.' }, { status: 400 });
  }
  const code = String(body.code ?? '').trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ ok: false, error: 'Código ausente.' }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.active === 'boolean') data.active = body.active;
  if (typeof body.note === 'string') data.note = body.note.slice(0, 120);
  if (typeof body.maxUses === 'number') {
    data.maxUses = Math.min(9999, Math.max(1, Math.floor(body.maxUses) || 1));
  }
  if (body.expiresInDays === null) data.expiresAt = null;
  else if (typeof body.expiresInDays === 'number' && body.expiresInDays > 0) {
    data.expiresAt = new Date(Date.now() + body.expiresInDays * 86_400_000);
  }

  try {
    await db.accessCode.update({ where: { code }, data });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'Código não encontrado.' }, { status: 404 });
  }
}

export async function DELETE(req: Request) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ ok: false, error: 'Não autorizado.' }, { status: 401 });
  }
  const code = new URL(req.url).searchParams.get('code')?.trim().toUpperCase() ?? '';
  if (!code) {
    return NextResponse.json({ ok: false, error: 'Código ausente.' }, { status: 400 });
  }
  try {
    await db.accessCode.delete({ where: { code } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'Código não encontrado.' }, { status: 404 });
  }
}
