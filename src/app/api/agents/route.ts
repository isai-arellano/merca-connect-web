import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

const AGENTS_URL = process.env.AGENTS_URL ?? process.env.NEXT_PUBLIC_AGENTS_URL ?? "http://localhost:8002";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.businessId) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const businessId = request.nextUrl.searchParams.get("business_id")?.trim();

  if (!businessId) {
    return NextResponse.json(
      { detail: "business_id is required" },
      { status: 400 }
    );
  }

  if (businessId !== session.businessId) {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
  }

  const internalApiKey = process.env.INTERNAL_API_KEY?.trim();

  if (!internalApiKey) {
    return NextResponse.json(
      { detail: "Missing INTERNAL_API_KEY for agent proxy" },
      { status: 500 }
    );
  }

  const upstreamUrl = new URL("/api/v1/agents", AGENTS_URL);
  upstreamUrl.searchParams.set("business_id", businessId);

  try {
    const response = await fetch(upstreamUrl.toString(), {
      headers: {
        "X-Gateway-Key": internalApiKey,
      },
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") || "application/json";
    const body = await response.text();

    return new NextResponse(body, {
      status: response.status,
      headers: {
        "content-type": contentType,
      },
    });
  } catch {
    return NextResponse.json(
      { detail: "No se pudo consultar la configuracion del agente." },
      { status: 502 }
    );
  }
}
