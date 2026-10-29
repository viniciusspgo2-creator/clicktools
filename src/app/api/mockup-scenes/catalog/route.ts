import { NextResponse } from "next/server";
import { listCatalog } from "@/lib/mockup-scenes/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    return NextResponse.json(
      { ok: true, ...(await listCatalog(new URL(req.url).searchParams)) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error:
          "O catálogo está indisponível. Os modelos e cenários incluídos continuam disponíveis.",
      },
      { status: 503 },
    );
  }
}
