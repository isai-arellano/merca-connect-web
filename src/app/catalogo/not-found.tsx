import Link from "next/link";

export default function CatalogoNotFound() {
  return (
    <div className="min-h-screen bg-[#1A3E35] flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex flex-col items-center gap-2 mb-10">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#74E79C] flex items-center justify-center shadow-lg shadow-[#74E79C]/20">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-[#1A3E35]" aria-hidden>
                <path d="M3 9h18M3 15h18M12 3v18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-xl font-bold text-[#EEFAEE] tracking-tight">MercaConnect</span>
          </div>
          <p className="text-xs text-[#EEFAEE]/50">Catálogos y menús digitales</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[#74E79C]/20 bg-[#234A40] shadow-2xl shadow-black/30 overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-[#74E79C]/0 via-[#74E79C] to-[#74E79C]/0" />
          <div className="px-8 py-10 flex flex-col items-center text-center gap-5">
            {/* Large number */}
            <p className="text-7xl font-black text-[#74E79C]/20 leading-none select-none">404</p>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-[#EEFAEE]">Catálogo no encontrado</h1>
              <p className="text-sm text-[#EEFAEE]/60 leading-relaxed max-w-xs">
                El catálogo que buscas no existe o el enlace podría estar desactualizado.
              </p>
            </div>

            <div className="w-full h-px bg-[#74E79C]/15" />

            <p className="text-xs text-[#EEFAEE]/45 leading-relaxed">
              Verifica que el enlace sea correcto o contacta al negocio para obtener la URL actualizada de su catálogo.
            </p>

            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-[#74E79C] px-6 py-2.5 text-sm font-semibold text-[#1A3E35] shadow-lg shadow-[#74E79C]/20 transition-all hover:opacity-90 active:scale-95"
            >
              Volver al inicio
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-[#EEFAEE]/30 mt-8">
          Powered by MercaConnect · Catálogos digitales para negocios
        </p>
      </div>
    </div>
  );
}
