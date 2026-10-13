/* ============================================================
   POST /api/access/validate
   Valida código de acesso PREMIUM (assinantes da Biblioteca de Artes).
   Lógica:
   - código inexistente/revogado → invalid
   - expirado → expired
   - dispositivo já vinculado → ok (retorno do cliente)
   - sem vagas → limit
   - nova ativação → vincula dispositivo e libera
   ============================================================ */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/admin-auth';

export const runtime = 'nodejs';

function clientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'local'
  );
}

export async function POST(req: Request) {
  let body: { code?: string; deviceId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid' }, { status: 400 });
  }

  const code = String(body.code ?? '').trim().toUpperCase();
  const deviceId = String(body.deviceId ?? '').trim().slice(0, 80);

  if (!code || !deviceId) {
    return NextResponse.json({ ok: false, reason: 'invalid' }, { status: 400 });
  }

  if (!rateLimit(`gate:${deviceId}:${clientIp(req)}`, 30, 10 * 60_000)) {
    return NextResponse.json(
      { ok: false, reason: 'rate' },
      { status: 429 },
    );
  }

  const row = await db.accessCode.findUnique({
    where: { code },
    include: { uses: { where: { deviceId } } },
  });

  if (!row || !row.active) {
    return NextResponse.json({ ok: false, reason: 'invalid' });
  }
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ ok: false, reason: 'expired' });
  }

  // dispositivo já ativou este código → acesso garantido
  if (row.uses.length > 0) {
    return NextResponse.json({ ok: true, plan: 'Biblioteca de Artes' });
  }

  const usesCount = await db.accessCodeUse.count({ where: { codeId: row.id } });
  if (usesCount >= row.maxUses) {
    return NextResponse.json({ ok: false, reason: 'limit' });
  }

  try {
    await db.accessCodeUse.create({ data: { codeId: row.id, deviceId } });
  } catch {
    /* corrida: outro dispositivo ocupou a última vaga */
    return NextResponse.json({ ok: false, reason: 'limit' });
  }

  return NextResponse.json({ ok: true, plan: 'Biblioteca de Artes' });
}
