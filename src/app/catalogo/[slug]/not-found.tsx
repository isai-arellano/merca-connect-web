import { FriendlyNotFound } from "@/components/public/friendly-not-found";

export default function CatalogNotFound() {
    return (
        <FriendlyNotFound
            title="Catálogo no disponible"
            description="Este catálogo no está publicado, el enlace cambió o no existe. Si eres el dueño del negocio, revisa «Visible públicamente» en el panel."
        />
    );
}
