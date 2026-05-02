import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidad — Merca-Connect",
  description:
    "Cómo recopilamos, usamos y protegemos tu información en Merca-Connect.",
};

const LAST_UPDATED = "2 de mayo de 2026";
const COMPANY_NAME = "Kolyn";
const PRODUCT_NAME = "Merca-Connect";
const PRODUCT_WEBSITE = "merca-connect.com";
const BRAND_WEBSITE = "kolyn.io";
const CONTACT_EMAIL = "info@kolyn.io";

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Header */}
      <header className="bg-white border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-[#1A3E35] font-medium text-sm">
            ← Regresar
          </Link>
          <span className="text-sm text-muted-foreground">
            Actualizado: {LAST_UPDATED}
          </span>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-border p-8 sm:p-12 prose prose-sm sm:prose-base max-w-none">
          <h1 className="text-2xl font-semibold text-[#1A3E35] mb-2">
            Política de Privacidad
          </h1>
          <p className="text-muted-foreground text-sm mb-8">
            Última actualización: {LAST_UPDATED}
          </p>

          <p>
            En <strong>{COMPANY_NAME}</strong> ({BRAND_WEBSITE}) ("nosotros",
            "la empresa") nos comprometemos a proteger y respetar tu privacidad.
            Esta Política de Privacidad describe cómo recopilamos, usamos,
            almacenamos y protegemos la información personal de quienes usan{" "}
            <strong>{PRODUCT_NAME}</strong> ({PRODUCT_WEBSITE}) ("el Servicio").
          </p>
          <p>
            Al usar el Servicio, aceptas las prácticas descritas en este
            documento. Si no estás de acuerdo, no uses el Servicio.
          </p>

          {/* 1 */}
          <h2 className="text-lg font-semibold text-[#1A3E35] mt-8 mb-3">
            1. Quién es el Responsable
          </h2>
          <p>El responsable del tratamiento de tus datos personales es:</p>
          <ul>
            <li>
              <strong>Empresa:</strong> {COMPANY_NAME} — {BRAND_WEBSITE}
            </li>
            <li>
              <strong>Producto:</strong> {PRODUCT_NAME} — {PRODUCT_WEBSITE}
            </li>
            <li>
              <strong>Correo de privacidad:</strong>{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-[#1A3E35] underline"
              >
                {CONTACT_EMAIL}
              </a>
            </li>
          </ul>

          {/* 2 */}
          <h2 className="text-lg font-semibold text-[#1A3E35] mt-8 mb-3">
            2. Datos que Recopilamos
          </h2>

          <h3 className="font-medium mt-4 mb-2">
            2.1 Datos del operador del negocio (tú)
          </h3>
          <ul>
            <li>
              <strong>Cuenta:</strong> nombre, correo electrónico, contraseña
              (almacenada en hash bcrypt), foto de perfil (si usas Google
              OAuth).
            </li>
            <li>
              <strong>Negocio:</strong> nombre del negocio, industria, slug
              público, número de WhatsApp Business, modos de venta.
            </li>
            <li>
              <strong>Facturación:</strong> historial de plan, conversaciones
              utilizadas por ciclo.
            </li>
            <li>
              <strong>Actividad:</strong> logs de inicio de sesión, cambios en
              configuración del negocio.
            </li>
          </ul>

          <h3 className="font-medium mt-4 mb-2">
            2.2 Datos de los clientes finales de tu negocio
          </h3>
          <p>
            Al usar {PRODUCT_NAME}, tu negocio atiende clientes a través de
            WhatsApp. En ese contexto procesamos:
          </p>
          <ul>
            <li>Número de teléfono del cliente.</li>
            <li>Nombre (si el cliente lo proporciona en la conversación).</li>
            <li>Historial de mensajes de la conversación.</li>
            <li>
              Pedidos realizados: productos, precios, dirección de entrega,
              estado del pedido.
            </li>
            <li>Etiquetas asignadas por el operador (ej: VIP, Frecuente).</li>
          </ul>
          <p>
            <strong>Eres el responsable del tratamiento</strong> de los datos de
            tus clientes finales bajo la normativa aplicable (LFPDPPP en
            México). Nosotros actuamos como encargado del tratamiento en tu
            nombre. Es tu obligación informar a tus clientes sobre el uso de
            esta plataforma y obtener el consentimiento necesario.
          </p>

          <h3 className="font-medium mt-4 mb-2">2.3 Datos técnicos y de uso</h3>
          <ul>
            <li>
              Dirección IP, tipo de navegador, dispositivo y sistema operativo.
            </li>
            <li>Páginas visitadas dentro del panel y tiempo de sesión.</li>
            <li>Logs de errores y eventos del sistema.</li>
            <li>
              Métricas de uso del agente IA: tokens consumidos, latencia,
              modelos utilizados.
            </li>
          </ul>

          {/* 3 */}
          <h2 className="text-lg font-semibold text-[#1A3E35] mt-8 mb-3">
            3. Cómo Usamos tu Información
          </h2>
          <p>Usamos los datos recopilados para:</p>
          <ul>
            <li>
              <strong>Proveer el Servicio:</strong> crear y gestionar tu cuenta,
              procesar conversaciones, gestionar pedidos y mostrar el panel de
              administración.
            </li>
            <li>
              <strong>Mejorar el Servicio:</strong> analizar métricas de uso
              para optimizar el rendimiento del agente y la experiencia del
              panel.
            </li>
            <li>
              <strong>Comunicaciones:</strong> enviarte notificaciones del
              servicio, actualizaciones de política y alertas de seguridad al
              correo registrado.
            </li>
            <li>
              <strong>Seguridad:</strong> detectar accesos no autorizados,
              prevenir fraude y proteger la integridad del sistema.
            </li>
            <li>
              <strong>Cumplimiento legal:</strong> atender requerimientos de
              autoridades competentes cuando la ley lo exija.
            </li>
            <li>
              <strong>Facturación:</strong> gestionar el ciclo de suscripción,
              calcular cargos por conversaciones adicionales y emitir
              comprobantes.
            </li>
          </ul>
          <p>
            <strong>No vendemos</strong> tus datos personales ni los de tus
            clientes a terceros.
          </p>

          {/* 4 */}
          <h2 className="text-lg font-semibold text-[#1A3E35] mt-8 mb-3">
            4. Base Legal del Tratamiento
          </h2>
          <p>Tratamos tus datos con base en:</p>
          <ul>
            <li>
              <strong>Ejecución del contrato:</strong> para proveer el Servicio
              que contrataste.
            </li>
            <li>
              <strong>Interés legítimo:</strong> para mejorar el servicio,
              garantizar la seguridad y prevenir fraude.
            </li>
            <li>
              <strong>Obligación legal:</strong> cuando la ley nos obliga a
              conservar o proporcionar datos.
            </li>
            <li>
              <strong>Consentimiento:</strong> para comunicaciones de marketing
              (puedes retirarlo en cualquier momento).
            </li>
          </ul>

          {/* 5 */}
          <h2 className="text-lg font-semibold text-[#1A3E35] mt-8 mb-3">
            5. Compartición de Datos con Terceros
          </h2>
          <p>Compartimos datos únicamente con:</p>
          <ul>
            <li>
              <strong>Meta (WhatsApp):</strong> los mensajes de tus
              conversaciones pasan por la infraestructura de Meta. Aplican los
              términos de WhatsApp Business API.
            </li>
            <li>
              <strong>Proveedores de IA:</strong> los mensajes de conversación
              se envían a proveedores de modelos de lenguaje (como Anthropic o
              similares) para generar respuestas. Estos proveedores tienen sus
              propias políticas de privacidad y no usan tus datos para entrenar
              sus modelos de manera general.
            </li>
            <li>
              <strong>Infraestructura cloud:</strong> usamos proveedores de nube
              (servidores, base de datos, almacenamiento de archivos) para
              alojar el Servicio. Todos tienen acuerdos de confidencialidad
              vigentes con nosotros.
            </li>
            <li>
              <strong>Procesadores de pago:</strong> para gestionar cobros de
              suscripción. Solo reciben los datos necesarios para completar la
              transacción.
            </li>
            <li>
              <strong>Autoridades:</strong> cuando sea requerido por ley, orden
              judicial o proceso legal válido.
            </li>
          </ul>

          {/* 6 */}
          <h2 className="text-lg font-semibold text-[#1A3E35] mt-8 mb-3">
            6. Retención de Datos
          </h2>
          <p>
            Conservamos tus datos mientras tu cuenta esté activa y durante los
            periodos requeridos por ley. Específicamente:
          </p>
          <ul>
            <li>
              <strong>Datos de cuenta:</strong> mientras la cuenta esté activa +
              30 días tras la cancelación.
            </li>
            <li>
              <strong>Historial de conversaciones:</strong> según el plan
              contratado (entre 30 y 180 días).
            </li>
            <li>
              <strong>Datos de facturación:</strong> 5 años por obligaciones
              fiscales (SAT México).
            </li>
            <li>
              <strong>Logs de seguridad:</strong> 1 año.
            </li>
          </ul>

          {/* 7 */}
          <h2 className="text-lg font-semibold text-[#1A3E35] mt-8 mb-3">
            7. Seguridad
          </h2>
          <p>
            Implementamos medidas técnicas y organizativas para proteger tu
            información:
          </p>
          <ul>
            <li>
              Contraseñas almacenadas con hash bcrypt (nunca en texto plano).
            </li>
            <li>
              Tokens de acceso de WhatsApp Business encriptados en reposo.
            </li>
            <li>
              Comunicaciones cifradas con TLS/HTTPS en todos los endpoints.
            </li>
            <li>Control de acceso por roles para el personal de la empresa.</li>
            <li>Monitoreo continuo de accesos y eventos de seguridad.</li>
          </ul>
          <p>
            Ningún sistema es 100% seguro. En caso de una brecha de seguridad
            que afecte tus datos, te notificaremos en los plazos que exija la
            ley aplicable.
          </p>

          {/* 8 */}
          <h2 className="text-lg font-semibold text-[#1A3E35] mt-8 mb-3">
            8. Tus Derechos (ARCO)
          </h2>
          <p>
            Conforme a la Ley Federal de Protección de Datos Personales en
            Posesión de los Particulares (LFPDPPP) y su Reglamento, tienes
            derecho a:
          </p>
          <ul>
            <li>
              <strong>Acceso:</strong> conocer qué datos tenemos sobre ti.
            </li>
            <li>
              <strong>Rectificación:</strong> corregir datos inexactos o
              incompletos.
            </li>
            <li>
              <strong>Cancelación:</strong> solicitar la eliminación de tus
              datos cuando ya no sean necesarios.
            </li>
            <li>
              <strong>Oposición:</strong> oponerte al tratamiento de tus datos
              para finalidades específicas.
            </li>
          </ul>
          <p>
            Para ejercer tus derechos ARCO envía tu solicitud a{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-[#1A3E35] underline"
            >
              {CONTACT_EMAIL}
            </a>{" "}
            con el asunto "Solicitud ARCO". Responderemos en un plazo máximo de
            20 días hábiles.
          </p>

          {/* 9 */}
          <h2 className="text-lg font-semibold text-[#1A3E35] mt-8 mb-3">
            9. Cookies y Tecnologías Similares
          </h2>
          <p>
            El panel de administración usa cookies de sesión necesarias para
            mantener tu sesión iniciada. No usamos cookies de rastreo
            publicitario ni compartimos datos de navegación con redes
            publicitarias.
          </p>
          <p>
            Puedes configurar tu navegador para rechazar cookies, pero esto
            puede afectar el funcionamiento del panel.
          </p>

          {/* 10 */}
          <h2 className="text-lg font-semibold text-[#1A3E35] mt-8 mb-3">
            10. Transferencias Internacionales
          </h2>
          <p>
            Algunos de nuestros proveedores de infraestructura y modelos de IA
            operan fuera de México. En esos casos aseguramos que existan
            mecanismos contractuales adecuados (como cláusulas contractuales
            estándar) para proteger tus datos conforme a la ley mexicana.
          </p>

          {/* 11 */}
          <h2 className="text-lg font-semibold text-[#1A3E35] mt-8 mb-3">
            11. Menores de Edad
          </h2>
          <p>
            El Servicio no está dirigido a menores de 18 años. No recopilamos
            conscientemente datos personales de menores. Si detectas que un
            menor ha proporcionado datos sin consentimiento parental,
            contáctanos para eliminarlos.
          </p>

          {/* 12 */}
          <h2 className="text-lg font-semibold text-[#1A3E35] mt-8 mb-3">
            12. Cambios a esta Política
          </h2>
          <p>
            Podemos actualizar esta Política en cualquier momento. Notificaremos
            los cambios materiales al correo registrado con al menos 15 días de
            anticipación. La fecha de la última actualización siempre estará
            visible al inicio del documento.
          </p>

          {/* 13 */}
          <h2 className="text-lg font-semibold text-[#1A3E35] mt-8 mb-3">
            13. Contacto y Quejas
          </h2>
          <p>
            Para cualquier consulta sobre esta Política o para ejercer tus
            derechos ARCO:
          </p>
          <ul>
            <li>
              <strong>Correo:</strong>{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-[#1A3E35] underline"
              >
                {CONTACT_EMAIL}
              </a>
            </li>
            <li>
              <strong>Producto:</strong> {PRODUCT_WEBSITE}
            </li>
            <li>
              <strong>Empresa:</strong> {BRAND_WEBSITE}
            </li>
          </ul>
          <p>
            Si consideras que tu solicitud no fue atendida correctamente, puedes
            presentar una queja ante el Instituto Nacional de Transparencia,
            Acceso a la Información y Protección de Datos Personales (INAI) en{" "}
            <strong>inai.org.mx</strong>.
          </p>

          <hr className="my-8 border-border" />
          <p className="text-xs text-muted-foreground text-center">
            {COMPANY_NAME} · {PRODUCT_WEBSITE} · Última actualización:{" "}
            {LAST_UPDATED}
          </p>
        </div>
      </main>
    </div>
  );
}
