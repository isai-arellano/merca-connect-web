import { redirect } from "next/navigation";

/** Ruta legada: el conocimiento del agente vive en Configuración → Agente. */
export default function KnowledgePage() {
    redirect("/dashboard/settings?tab=agente");
}
