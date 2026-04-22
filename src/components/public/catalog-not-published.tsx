export type PublicCatalogKind = "catalogo" | "menu";

export function CatalogNotPublished({ kind }: { kind: PublicCatalogKind }) {
  const isMenu = kind === "menu";
  const noun = isMenu ? "menú" : "catálogo";
  const nounCap = isMenu ? "Menú" : "Catálogo";

  return (
    <div className="min-h-screen bg-[#1A3E35] flex flex-col items-center justify-center px-4 py-16">
      {/* Card central */}
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center gap-2 mb-10">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#74E79C] flex items-center justify-center shadow-lg shadow-[#74E79C]/20">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5 text-[#1A3E35]"
                aria-hidden
              >
                <path
                  d="M3 9h18M3 15h18M12 3v18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="text-xl font-bold text-[#EEFAEE] tracking-tight">
              MercaConnect
            </span>
          </div>
          <p className="text-xs text-[#EEFAEE]/50">
            Catálogos y menús digitales para tu negocio
          </p>
        </div>

        {/* Main card */}
        <div className="rounded-2xl border border-[#74E79C]/20 bg-[#234A40] shadow-2xl shadow-black/30 overflow-hidden">
          {/* Decorative top strip */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#74E79C]/0 via-[#74E79C] to-[#74E79C]/0" />

          <div className="px-8 py-10 flex flex-col items-center text-center gap-5">
            {/* Icon */}
            <div className="h-16 w-16 rounded-2xl bg-[#1A3E35] border border-[#74E79C]/25 flex items-center justify-center shadow-inner">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-8 w-8 text-[#74E79C]/60"
                aria-hidden
              >
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
                  fill="currentColor"
                />
              </svg>
            </div>

            {/* Heading */}
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-[#EEFAEE] leading-tight">
                {nounCap} no publicado
              </h1>
              <p className="text-sm text-[#EEFAEE]/65 leading-relaxed max-w-xs">
                El {noun} digital de este negocio aún no está activo o se
                encuentra temporalmente desactivado.
              </p>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-[#74E79C]/15" />

            {/* Info box */}
            <div className="w-full rounded-xl bg-[#1A3E35]/60 border border-[#74E79C]/15 px-4 py-3.5 text-left space-y-1.5">
              <p className="text-xs font-semibold text-[#74E79C]/80 uppercase tracking-wider">
                ¿Eres el dueño del negocio?
              </p>
              <p className="text-xs text-[#EEFAEE]/55 leading-relaxed">
                Activa tu {noun} desde el panel en{" "}
                <span className="text-[#EEFAEE]/80 font-medium">
                  Configuración → Negocio
                </span>{" "}
                habilitando la opción{" "}
                <span className="text-[#74E79C] font-medium">
                  &ldquo;{nounCap} publicado&rdquo;
                </span>
                .
              </p>
            </div>

            {/* CTA */}
            <a
              href="/dashboard/settings?tab=negocio"
              className="inline-flex items-center gap-2 rounded-xl bg-[#74E79C] px-6 py-2.5 text-sm font-semibold text-[#1A3E35] shadow-lg shadow-[#74E79C]/20 transition-all hover:opacity-90 active:scale-95"
            >
              Ir al panel
            </a>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-[#EEFAEE]/30 mt-8">
          Powered by MercaConnect · Catálogos digitales para negocios
        </p>
      </div>
    </div>
  );
}
