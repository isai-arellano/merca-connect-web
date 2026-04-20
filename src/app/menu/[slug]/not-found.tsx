import { FriendlyNotFound } from "@/components/public/friendly-not-found";

export default function MenuNotFound() {
    return (
        <FriendlyNotFound
            title="Menú no disponible"
            description="Este menú no está publicado, el enlace cambió o no existe. Si eres el dueño del negocio, revisa «Visible públicamente» en el panel."
        />
    );
}
