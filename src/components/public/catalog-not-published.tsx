export type PublicCatalogKind = "catalogo" | "menu";

export function CatalogNotPublished({ kind }: { kind: PublicCatalogKind }) {
  const isMenu = kind === "menu";
  const noun = isMenu ? "menú" : "catálogo";
  const nounCap = isMenu ? "Menú" : "Catálogo";

  return (
    <div className="min-h-screen bg-[#FFF8FC] flex flex-col items-center justify-center px-4 py-16">
      {/* Card central */}
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center gap-2 mb-10">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#7A4F8E] flex items-center justify-center shadow-lg shadow-[#DCC7EA]/70">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5 text-white"
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
            <span className="text-xl font-bold text-[#332744] tracking-tight">
              MercaConnect
            </span>
          </div>
          <p className="text-xs text-[#6A5A7A]">
            Catálogos y menús digitales para tu negocio
          </p>
        </div>

        {/* Main card */}
        <div className="rounded-2xl border border-[#E8DAF3] bg-white shadow-xl shadow-[#EBDDF7]/60 overflow-hidden">
          {/* Decorative top strip */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#BFE8D9]/0 via-[#BBA3D5] to-[#F8DFF1]/0" />

          <div className="px-8 py-10 flex flex-col items-center text-center gap-5">
            {/* Icon */}
            <div className="h-16 w-16 rounded-2xl bg-[#F7EEF9] border border-[#E3D1F0] flex items-center justify-center shadow-inner">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-8 w-8 text-[#7A4F8E]/60"
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
              <h1 className="text-xl font-bold text-[#312945] leading-tight">
                {nounCap} no publicado
              </h1>
              <p className="text-sm text-[#665779] leading-relaxed max-w-xs">
                El {noun} digital de este negocio aún no está activo o se
                encuentra temporalmente desactivado.
              </p>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-[#E3D1F0]" />

            {/* Info box */}
            <div className="w-full rounded-xl bg-[#FBF3FF] border border-[#E8DAF3] px-4 py-3.5 text-left space-y-1.5">
              <p className="text-xs font-semibold text-[#7A4F8E] uppercase tracking-wider">
                ¿Eres el dueño del negocio?
              </p>
              <p className="text-xs text-[#625572] leading-relaxed">
                Activa tu {noun} desde el panel en{" "}
                <span className="text-[#3D3454] font-medium">
                  Configuración → Negocio
                </span>{" "}
                habilitando la opción{" "}
                <span className="text-[#7A4F8E] font-medium">
                  &ldquo;{nounCap} publicado&rdquo;
                </span>
                .
              </p>
            </div>

            {/* CTA */}
            <a
              href="/dashboard/settings?tab=negocio"
              className="inline-flex items-center gap-2 rounded-xl bg-[#7A4F8E] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#DCC7EA] transition-all hover:opacity-90 active:scale-95"
            >
              Ir al panel
            </a>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-[#8A7A9A] mt-8">
          Powered by MercaConnect · Catálogos digitales para negocios
        </p>
      </div>
    </div>
  );
}
