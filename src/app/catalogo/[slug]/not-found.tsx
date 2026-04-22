import { FriendlyNotFound } from "@/components/public/friendly-not-found";

export default function CatalogNotFound() {
    return (
        <FriendlyNotFound
            title="Catálogo no encontrado"
            description="El enlace no existe o ya no está disponible. Si eres el dueño, verifica el slug en el panel."
        />
    );
}
