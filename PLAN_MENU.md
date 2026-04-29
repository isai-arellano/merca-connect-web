# Plan de Rediseño Premium: Menú Merca-Connect-Web 🚀

Este documento establece la estrategia y arquitectura visual para transformar el menú actual en una experiencia **Premium, personalizable y de alta conversión**, inspirada en los estándares de UX de plataformas como Rappi, pero manteniendo un diseño limpio y no saturado.

---

## 1. Visión General y Objetivos
*   **Aesthetics Premium:** Diseño minimalista, uso estratégico del espacio en blanco (whitespace), bordes sutilmente redondeados, sombras suaves y tipografía moderna. Evitar la sobrecarga visual.
*   **"Rappi-Style":** Navegación fluida e intuitiva donde el cliente tiene visibilidad total e inmediata del catálogo.
*   **Personalización (White-label):** Capacidad de inyectar colores de marca, logo y banner, calculando dinámicamente el contraste para mantener la accesibilidad.
*   **Omnicanalidad Visual:** 100% Responsive. Debe sentirse como una App nativa en móvil y como un Dashboard e-commerce amplio en pantallas grandes.

---

## 2. Arquitectura Visual (UX/UI)

### A. Layout Responsivo
*   **📱 Móvil (App-like):**
    *   **Header:** Banner del negocio con superposición de Logo.
    *   **Sticky Category Bar:** Navegación horizontal de categorías (scrollable) que se ancla (sticky) al hacer scroll hacia abajo.
    *   **Grid de Productos:** 1 o 2 columnas dependiendo del tamaño de la pantalla, destacando la foto del producto.
    *   **Floating Cart:** Un botón fijo en la parte inferior o un "Bottom Sheet" que muestra el total y permite acceder rápido al carrito.
*   **💻 Pantallas Grandes (Desktop):**
    *   **Layout a 3 Columnas:**
        *   *Izquierda (20%):* Menú lateral estático de Categorías.
        *   *Centro (55%):* Grid de productos amplio (3-4 columnas de tarjetas).
        *   *Derecha (25%):* Carrito de compras siempre visible (Sticky Sidebar) para incentivar el checkout rápido.

### B. Sistema de Personalización Dinámica
Se implementará un `ThemeProvider` basado en CSS variables (`--color-primary`, `--color-secondary`) que se inyectan a nivel raíz según el negocio:
*   **Banner y Logo:** Uso de imágenes proporcionadas con un degradado inferior (overlay) sutil para asegurar que el texto del nombre del negocio siempre sea legible, sin importar la foto.
*   **Acentos:** Los botones principales (Agregar, Checkout) y el estado activo de las categorías usarán el color primario de la marca.

---

## 3. Adaptabilidad por Tipo de Negocio (Dinámico)

Basado en el onboarding, el menú se adaptará inteligentemente a los 5 tipos de negocios de comida principales:

1.  **🍽️ Restaurante:**
    *   Enfoque en categorización clásica (Entradas, Platos Fuertes, Bebidas, Postres).
    *   Tarjetas de producto con imágenes grandes y descripciones detalladas.
2.  **🌮 Taquería / Antojitos:**
    *   Enfoque en volumen y velocidad.
    *   Interfaz optimizada para seleccionar modificadores rápidos (ej. "Con copia", "Sin cebolla", "Salsas").
    *   Opciones de "Arma tu paquete/combo".
3.  **☕ Cafetería:**
    *   Énfasis extremo en la personalización del producto.
    *   Modales de producto detallados para elegir: Tipo de leche, tamaño (Chico/Mediano/Grande), extras (shots de espresso), frío/caliente.
4.  **🎂 Pastelería:**
    *   Visualmente dominante (imágenes de alta resolución).
    *   Flujo especial de "Pre-orden" o selección de fecha/hora de entrega (ya que no siempre es consumo inmediato).
    *   Variantes: Pastel entero vs. Rebanada.
5.  **👨‍🍳 Dark Kitchen:**
    *   Optimizado 100% para delivery.
    *   Tiempos estimados de entrega muy visibles.
    *   Posibilidad de tener múltiples sub-marcas operando bajo un mismo menú.

---

## 4. Estructura de Componentes Clave a Desarrollar

1.  `StoreHeader`: Componente superior que integra el banner, el logo, y aplica los colores dinámicos del negocio.
2.  `CategoryNav`: Barra de navegación anclable. Debe hacer "scroll spy" (iluminar la categoría actual mientras el usuario hace scroll por los productos).
3.  `ProductCard`: Tarjeta limpia, sin bordes duros, sombra ligera en hover. Mostrará imagen, título, descripción truncada a 2 líneas y precio + botón de "Agregar".
4.  `ProductModal` (Drawer en móvil, Modal en Desktop): Vista detallada para elegir modificadores (Radio buttons para selección única, Checkboxes para múltiples extras).
5.  `StickyCart`: Resumen flotante de la orden que lleva al Checkout final.

---

## 5. Fases de Implementación

*   **Fase 1: Motor de Temas y Estructura Base**
    *   Configurar CSS variables para aceptar colores dinámicos desde la BD.
    *   Construir el Layout Base diferenciando la vista Desktop (3 columnas) de la vista Móvil.
*   **Fase 2: UI Components Core**
    *   Desarrollar el `StoreHeader`, `CategoryNav` y `ProductCard` usando un diseño muy limpio (mucho whitespace).
*   **Fase 3: Lógica de Carrito y Modificadores**
    *   Desarrollar el `ProductModal` para manejar las variaciones de los distintos tipos de negocios.
    *   Implementar el Carrito (flotante en móvil, lateral en desktop).
*   **Fase 4: Pulido y Micro-interacciones**
    *   Añadir animaciones fluidas: al agregar al carrito, al abrir el modal, scroll suave entre categorías.
    *   Optimización de carga de imágenes del menú.
