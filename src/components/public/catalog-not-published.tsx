import Link from "next/link";
import { Button } from "@/components/ui/button";

export type PublicCatalogKind = "catalogo" | "menu";

export function CatalogNotPublished({ kind }: { kind: PublicCatalogKind }) {
    const noun = kind === "menu" ? "menú" : "catálogo";
    return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 px-4 py-16">
            <h1 className="text-xl font-semibold text-foreground text-center">
                Este {noun} no está publicado
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-md">
                La vista pública está desactivada. Actívala en el panel en la sección de catálogo o menú (Productos).
            </p>
            <Button asChild>
                <Link href="/dashboard/products">Ir a Productos</Link>
            </Button>
        </div>
    );
}
