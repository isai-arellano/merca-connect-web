import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos de Servicio — Merca-Connect",
  description: "Términos y condiciones de uso de la plataforma Merca-Connect.",
};

const LAST_UPDATED = "2 de mayo de 2026";
const COMPANY_NAME = "Kolyn";
const PRODUCT_NAME = "Merca-Connect";
const PRODUCT_WEBSITE = "merca-connect.com";
const BRAND_WEBSITE = "kolyn.io";
const CONTACT_EMAIL = "info@kolyn.io";

export default function TerminosPage() {
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
            Términos de Servicio
          </h1>
          <p className="text-muted-foreground text-sm mb-8">
            Última actualización: {LAST_UPDATED}
          </p>

          <p>
            Bienvenido a <strong>{PRODUCT_NAME}</strong> ({PRODUCT_WEBSITE}), un
            producto operado por <strong>{COMPANY_NAME}</strong> (
            {BRAND_WEBSITE}) ("nosotros", "la empresa"). Al crear una cuenta o
            usar los servicios de {PRODUCT_NAME}, aceptas estar sujeto a estos
            Términos de Servicio ("Términos"). Léelos con atención antes de
            continuar.
          </p>

          {/* 1 */}
          <h2 className="text-lg font-semibold text-[#1A3E35] mt-8 mb-3">
            1. Descripción del Servicio
          </h2>
          <p>
            {PRODUCT_NAME} es una plataforma de comercio conversacional que
            permite a negocios:
          </p>
          <ul>
            <li>
              Automatizar la atención a clientes mediante agentes de
              inteligencia artificial en WhatsApp.
            </li>
            <li>
              Gestionar catálogos de productos y pedidos desde un panel en
              línea.
            </li>
            <li>
              Integrar un número de WhatsApp Business con el sistema de agentes.
            </li>
            <li>
              Acceder a análisis de conversaciones y rendimiento del negocio.
            </li>
          </ul>
          <p>
            El Servicio se proporciona bajo un modelo de suscripción mensual con
            diferentes planes que determinan los límites de conversaciones,
            asientos y funcionalidades.
          </p>

          {/* 2 */}
          <h2 className="text-lg font-semibold text-[#1A3E35] mt-8 mb-3">
            2. Elegibilidad
          </h2>
          <p>Para usar {PRODUCT_NAME} debes:</p>
          <ul>
            <li>
              Ser mayor de 18 años o tener la edad legal para celebrar contratos
              en tu jurisdicción.
            </li>
            <li>
              Ser representante autorizado de un negocio con actividad legal.
            </li>
            <li>
              Proporcionar información veraz y actualizada durante el registro.
            </li>
            <li>Contar con un número de WhatsApp Business válido y activo.</li>
          </ul>

          {/* 3 */}
          <h2 className="text-lg font-semibold text-[#1A3E35] mt-8 mb-3">
            3. Cuenta y Seguridad
          </h2>
          <p>Al registrarte en {PRODUCT_NAME} eres responsable de:</p>
          <ul>
            <li>Mantener la confidencialidad de tus credenciales de acceso.</li>
            <li>Toda actividad que ocurra bajo tu cuenta.</li>
            <li>
              Notificarnos de inmediato si detectas acceso no autorizado a tu
              cuenta.
            </li>
          </ul>
          <p>
            No compartir tu contraseña con terceros. No permitir que personas no
            autorizadas accedan al panel de administración de tu negocio.
          </p>

          {/* 4 */}
          <h2 className="text-lg font-semibold text-[#1A3E35] mt-8 mb-3">
            4. Uso Aceptable
          </h2>
          <p>Al usar el Servicio te comprometes a no:</p>
          <ul>
            <li>
              Usar el servicio para actividades ilegales, fraudulentas o que
              violen derechos de terceros.
            </li>
            <li>
              Enviar mensajes no solicitados (spam), contenido ofensivo,
              engañoso o que infrinja la normativa de Meta (WhatsApp).
            </li>
            <li>
              Intentar acceder a datos de otros negocios o clientes ajenos al
              tuyo.
            </li>
            <li>
              Realizar ingeniería inversa, descompilar o intentar obtener el
              código fuente de la plataforma.
            </li>
            <li>
              Usar el servicio para procesar datos personales de menores sin
              consentimiento parental.
            </li>
            <li>
              Revender o sublicenciar el acceso al servicio sin autorización
              escrita.
            </li>
            <li>
              Sobrecargar o interferir con la infraestructura del servicio.
            </li>
          </ul>
          <p>
            El incumplimiento de estas restricciones puede resultar en la
            suspensión inmediata de la cuenta sin derecho a reembolso.
          </p>

          {/* 5 */}
          <h2 className="text-lg font-semibold text-[#1A3E35] mt-8 mb-3">
            5. Planes, Pagos y Facturación
          </h2>
          <h3 className="font-medium mt-4 mb-2">5.1 Suscripción</h3>
          <p>
            El Servicio se factura mensualmente a partir de la fecha de
            activación de tu plan. Los precios son en pesos mexicanos (MXN) más
            IVA cuando aplique, salvo que se indique lo contrario.
          </p>
          <h3 className="font-medium mt-4 mb-2">5.2 Renovación automática</h3>
          <p>
            Los planes se renuevan automáticamente al término de cada ciclo.
            Puedes cancelar antes de la fecha de renovación para evitar el cargo
            del siguiente periodo.
          </p>
          <h3 className="font-medium mt-4 mb-2">
            5.3 Conversaciones excedentes
          </h3>
          <p>
            Si tu plan tiene habilitadas las conversaciones extra y superas el
            límite incluido, las conversaciones adicionales se cobrarán al
            precio indicado en tu plan.
          </p>
          <h3 className="font-medium mt-4 mb-2">5.4 Cambios de precio</h3>
          <p>
            Notificaremos cualquier cambio en los precios con al menos 30 días
            de anticipación al correo registrado en tu cuenta.
          </p>
          <h3 className="font-medium mt-4 mb-2">5.5 Reembolsos</h3>
          <p>
            Los pagos de suscripción no son reembolsables salvo en los casos
            exigidos por la ley aplicable o cuando el servicio haya
            experimentado interrupciones graves atribuibles exclusivamente a{" "}
            {COMPANY_NAME}.
          </p>

          {/* 6 */}
          <h2 className="text-lg font-semibold text-[#1A3E35] mt-8 mb-3">
            6. Integración con WhatsApp (Meta)
          </h2>
          <p>
            El Servicio se integra con la API de WhatsApp Business de Meta. Al
            conectar tu número de WhatsApp aceptas además los Términos de
            Servicio de Meta para WhatsApp Business.
            {PRODUCT_NAME} actúa como Proveedor de Soluciones Empresariales
            (BSP) de Meta y no controla las políticas, disponibilidad o cambios
            en la plataforma de Meta.
          </p>
          <p>
            Eres responsable de cumplir con las políticas de uso de WhatsApp
            Business, incluyendo los tipos de mensajes permitidos, la gestión
            del consentimiento de los destinatarios y las restricciones de
            contenido.
          </p>

          {/* 7 */}
          <h2 className="text-lg font-semibold text-[#1A3E35] mt-8 mb-3">
            7. Datos e Inteligencia Artificial
          </h2>
          <p>
            El Servicio utiliza modelos de inteligencia artificial de terceros
            para generar respuestas automáticas en las conversaciones de tu
            negocio. Los mensajes de tus clientes son procesados por estos
            modelos para generar respuestas apropiadas.
          </p>
          <p>
            No usamos tus datos de conversación para entrenar modelos generales
            de IA sin tu consentimiento explícito. Consulta nuestra{" "}
            <Link href="/privacidad" className="text-[#1A3E35] underline">
              Política de Privacidad
            </Link>{" "}
            para más detalles sobre el tratamiento de datos.
          </p>

          {/* 8 */}
          <h2 className="text-lg font-semibold text-[#1A3E35] mt-8 mb-3">
            8. Propiedad Intelectual
          </h2>
          <p>
            Todo el software, diseño, código y contenido de la plataforma{" "}
            {PRODUCT_NAME} es propiedad exclusiva de {COMPANY_NAME} o sus
            licenciantes. No adquieres ningún derecho de propiedad sobre el
            Servicio por el hecho de suscribirte.
          </p>
          <p>
            El contenido que subes a la plataforma (catálogo, fotos de
            productos, descripciones) sigue siendo de tu propiedad. Nos otorgas
            una licencia limitada para mostrarlo dentro del Servicio y enviarlo
            a tus clientes en el contexto de tus conversaciones.
          </p>

          {/* 9 */}
          <h2 className="text-lg font-semibold text-[#1A3E35] mt-8 mb-3">
            9. Suspensión y Terminación
          </h2>
          <p>Podemos suspender o terminar tu acceso al Servicio si:</p>
          <ul>
            <li>Incumples estos Términos o la normativa aplicable.</li>
            <li>
              No realizas el pago de tu suscripción en el plazo establecido.
            </li>
            <li>
              Tu uso del Servicio representa un riesgo para otros usuarios o
              para la infraestructura.
            </li>
            <li>Meta suspende o restringe tu número de WhatsApp Business.</li>
          </ul>
          <p>
            Puedes cancelar tu cuenta en cualquier momento desde el panel de
            configuración o contactándonos a{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-[#1A3E35] underline"
            >
              {CONTACT_EMAIL}
            </a>
            . Al cancelar, tus datos se conservarán por 30 días para una posible
            reactivación y posteriormente serán eliminados, salvo obligación
            legal de retención.
          </p>

          {/* 10 */}
          <h2 className="text-lg font-semibold text-[#1A3E35] mt-8 mb-3">
            10. Limitación de Responsabilidad
          </h2>
          <p>En la medida máxima permitida por la ley aplicable:</p>
          <ul>
            <li>
              El Servicio se proporciona "tal como está" sin garantías expresas
              o implícitas de funcionamiento continuo o libre de errores.
            </li>
            <li>
              No somos responsables de pérdidas indirectas, pérdida de ingresos
              o daños derivados de interrupciones del Servicio, errores del
              agente de IA, o cambios en las políticas de Meta.
            </li>
            <li>
              Nuestra responsabilidad total ante cualquier reclamación no
              excederá el monto pagado por el Servicio en los 3 meses anteriores
              al evento que originó la reclamación.
            </li>
          </ul>

          {/* 11 */}
          <h2 className="text-lg font-semibold text-[#1A3E35] mt-8 mb-3">
            11. Cambios a estos Términos
          </h2>
          <p>
            Podemos modificar estos Términos en cualquier momento. Te
            notificaremos los cambios materiales con al menos 15 días de
            anticipación por correo electrónico. El uso continuado del Servicio
            después de esa fecha constituye tu aceptación de los Términos
            modificados.
          </p>

          {/* 12 */}
          <h2 className="text-lg font-semibold text-[#1A3E35] mt-8 mb-3">
            12. Ley Aplicable y Jurisdicción
          </h2>
          <p>
            Estos Términos se rigen por las leyes de los Estados Unidos
            Mexicanos. Cualquier disputa se someterá a la jurisdicción de los
            tribunales competentes de la Ciudad de México, renunciando a
            cualquier otro fuero que pudiera corresponder por razón de
            domicilio.
          </p>

          {/* 13 */}
          <h2 className="text-lg font-semibold text-[#1A3E35] mt-8 mb-3">
            13. Contacto
          </h2>
          <p>Para dudas sobre estos Términos contáctanos:</p>
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
