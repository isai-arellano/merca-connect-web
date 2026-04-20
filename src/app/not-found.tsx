import { FriendlyNotFound } from "@/components/public/friendly-not-found";

export default function NotFound() {
    return (
        <FriendlyNotFound
            title="Página no encontrada"
            description="El enlace no existe o ya no está disponible."
        />
    );
}
