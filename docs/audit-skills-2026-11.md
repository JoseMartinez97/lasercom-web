# Auditoría con las skills de diseño y motion · Lasercom

21 de noviembre de 2026. Estado auditado: el árbol de trabajo local **con los cambios sin commitear** que había al empezar (12 archivos modificados: `home-content.astro`, `header.astro`, `site-footer.astro`, `global.css`, `main.astro`…). Build de `pnpm test` servida con `astro preview` en `127.0.0.1:4321`. No se ha tocado código; lo único nuevo es este archivo.

**Aplicado después (mismo día):** B1–B8, A1, A2, A3 (sombra de texto en el párrafo del hero, sin mover la cámara), A7 y C14. La causa real de A1 era que la variante `outline` de `ui/button.tsx` pone `dark:bg-transparent`, que anulaba el fondo del botón cuando el sistema está en modo oscuro; se arregló con `dark:bg-…` en el propio botón. Las líneas citadas abajo son las de antes de aplicar los arreglos.

**Cómo leer este informe.** Cada punto lleva `archivo:línea`, la skill que lo marca y el arreglo concreto. «Comprobado» = visto en el navegador o medido; «De código» = leído en el código, no reproducido en un dispositivo real (las skills `mobile-native` y `animation-performance` piden confirmarlo en un móvil de gama media).

---

## 0. Resumen

| Comprobación | Resultado |
|---|---|
| `pnpm lint` | ✅ sin errores |
| `pnpm typecheck` (`astro check`, 71 archivos) | ✅ 0 errores, 0 avisos |
| `pnpm test` (build + `check-dist`, `check-seo`, `check-links`) | ✅ 51 páginas, SEO correcto, enlaces sin rotos |
| `pnpm format:check` | ❌ 6 archivos sin formatear (ver B6) |
| Build | ⚠️ aviso de chunk >500 kB (`three.module` 607 kB) |
| Consola del navegador | ⚠️ 24 avisos de GSAP «target not found» en la home y otros tantos en `/prueba-tu-grabado/` (ver B1). Ningún error |
| Accesibilidad automática (h1 único, saltos de encabezado, `alt`, nombres accesibles, ids duplicados, `target=_blank` sin `noopener`, scroll horizontal a 320/375 px) | ✅ limpio en home, servicio, contacto, trabajos, mesa 3D y `/en/` |

**Lo más importante, en cinco líneas:**

1. **Texto ilegible sobre el 3D de la portada** (A1, A2): el segundo botón del hero y el bloque «Una pieza, un haz» en escritorio quedan sobre la placa de acero clara. Es lo primero que ve un cliente.
2. **Demasiadas capas de motion a la vez** (C1): grano animado, foco que sigue al ratón, cursor láser con regla, Lenis, SplitText, «scramble» en cada `.readout`, filas, haces, cortes, parallax, botones magnéticos… `DESIGN.md` pide un taller «serio y tranquilo» y el código hace lo contrario. `remove-animations` y `review-animations` coinciden.
3. **El «scramble» destroza texto en castellano** (A4): «PIEZAS REALES, FOTOS PRO+4/2», «SERVICE+», «LASERCO4» se ven a medio decodificar al hacer scroll.
4. **Coste en móvil** (C3–C6): Three.js (607 kB) arranca en la portada del móvil a los 300 ms, el bucle de render nunca se para, y el constructor de presupuestos descarga todos los textos de la web en ambos idiomas (174 kB).
5. **Código muerto** (B5): ~1.600 líneas sin usar (`bench-teaser`, `work-curtains`, `monolith-3d`, `page-curtain`, observador `.stone`).

---

## 1. Bugs

### B1. 24 avisos de GSAP en cada carga de la portada (y de la mesa 3D) — Comprobado
- **Dónde:** `src/components/custom/work-showcase.astro:121-124` pone `data-rows` / `data-row` en el índice de escritorio, pero esas filas no tienen `[data-row-line]` ni `[data-row-cell]`. `animateRows()` en `src/lib/animations.ts:160-195` crea para cada una un timeline con objetivos vacíos → `GSAP target null/[object NodeList] not found` ×4 por fila.
- **Skill:** `gsap-scrolltrigger`, `improve-animations`.
- **Arreglo:** quitar `data-rows`/`data-row` del índice (ya tiene su propio hover con `:has()`), o en `animateRows` saltar las filas sin línea: `const line = row.querySelector("[data-row-line]"); if (!line) return`.

### B2. El botón flotante de WhatsApp tapa la dirección del pie en escritorio — Comprobado
- **Dónde:** `src/components/custom/whatsapp-button.astro:20` (`fixed right-6 bottom-6 size-14`) sobre la columna `address` de `src/components/custom/site-footer.astro:86-112`. Solo la franja inferior del pie reserva hueco (`lg:pr-24`, línea 120).
- **Skill:** `impeccable` (audit), `break-ui`.
- **Arreglo:** aplicar el mismo `lg:pr-24` al contenedor de la rejilla superior del pie (`site-footer.astro:18`), u ocultar el botón cuando el pie entra en pantalla (IntersectionObserver que ponga `data-hidden` y `opacity-0 pointer-events-none`).

### B3. La pista de coordenadas del hero queda bajo la barra de acciones en móvil — Comprobado
- **Dónde:** `src/components/custom/home-content.astro:174-188`. El hero usa `pb-24` pero la línea «Fibra · CO2 · Corte de metal 4 mm … X 091.7 · Y …» se parte en dos y queda tapada por `action-bar.astro`.
- **Skill:** `mobile-native`, `break-ui`.
- **Arreglo:** en móvil, ocultar las coordenadas (`hidden sm:inline`) y dejar una sola línea, o subir el `pb` a `pb-[calc(6rem+env(safe-area-inset-bottom))]`.

### B4. Observador `.stone` en la cabecera que no hace nada — De código
- **Dónde:** `src/components/custom/header.astro:300-330`. Busca `main .stone`, pero ya no existe ninguna sección ni regla CSS `.stone` (el comentario de `home-content.astro:352` también está desfasado). Crea un IntersectionObserver y un listener de `resize` en cada página para nada.
- **Skill:** `remove-animations` (limpieza de restos).
- **Arreglo:** borrar el bloque y el comentario.

### B5. Código muerto: ~1.600 líneas que nadie importa — De código
- `src/components/custom/bench-teaser.astro` (391), `src/components/custom/work-curtains.astro` (240), `src/lib/monolith-3d.ts` (844), `src/lib/page-curtain.ts` (70), `src/lib/showcase.ts` (solo lo usan los dos primeros), CSS `.page-curtain` en `src/styles/global.css:374-395`.
- **Skill:** `remove-animations`, `improve-animations`.
- **Arreglo:** borrarlos (y la clave `work-curtains` de `src/i18n/messages/home.ts` si ya no se usa). Reduce superficie y evita que otra sesión los reactive por error.

### B6. Formato sin aplicar en 6 archivos — Comprobado
- `faq-section.astro`, `header.astro`, `home-content.astro`, `work-showcase.astro`, `layouts/main.astro`, `lib/hero-laser-3d.ts`.
- **Arreglo:** `pnpm format`.

### B7. Etiquetas accesibles equivocadas en la navegación — De código / Comprobado con `find`
- `src/components/custom/header.astro:60` y `:235`: la navegación principal se anuncia como «Servicios» (`nav.services`) aunque contiene Trabajos, Prueba tu grabado y Contacto.
- `header.astro:219`: el `<dialog>` del menú se llama «Abrir menú» (`nav.menu`), así que el lector de pantalla dice «Abrir menú, diálogo» cuando ya está abierto.
- **Skill:** `web-design-guidelines`, `impeccable` (audit).
- **Arreglo:** nueva clave `nav.main` («Navegación principal» / «Main navigation») para ambos `<nav>`, y `aria-label={t("nav.menu.title")}` («Menú» / «Menu») para el diálogo.

### B8. El fallo de seguridad de 4 s puede hacer saltar los bloques — De código
- `src/layouts/main.astro:229-231` quita `.js` a los 4 s si las animaciones no arrancaron, pero `initAnimations` espera a `load` + 800 ms (`main.astro:295-313`). En 3G, si `load` tarda más de 3,2 s, los bloques se muestran, y al llegar GSAP `gsap.set(blocks, { y: 40 })` (`animations.ts:490`) los baja 40 px y los vuelve a subir: un salto visible.
- **Skill:** `review-animations`, `choreograph` (regla «sobrevivir a la interrupción»).
- **Arreglo:** en `initAnimations`, si `!document.documentElement.classList.contains("js")`, no aplicar el `set` inicial a bloques ya visibles (marcar `data-shown` en todos los que estén por encima del pliegue).

---

## 2. Accesibilidad y UX

### A1. Botón secundario del hero casi invisible — Comprobado (escritorio y móvil, ES y EN)
- **Dónde:** `src/components/custom/home-content.astro:161-170`. «Probar la mesa del láser» / «Try the laser bed» es `bg-[#0b0c0e]/55` con `backdrop-blur` sobre la placa de acero iluminada: el texto blanco queda sobre gris claro, por debajo de 3:1.
- **Skill:** `impeccable` (critique), `web-design-guidelines` (contraste), `design-taste-frontend`.
- **Arreglo:** fondo opaco (`bg-[#0b0c0e]/90`, sin blur) o pasarlo a enlace de texto bajo el CTA principal. Comprobar con el póster y con el canvas.

### A2. «Una pieza, un haz» ilegible en escritorio — Comprobado
- **Dónde:** `home-content.astro:199`. En `lg` la tarjeta pierde fondo y blur (`lg:bg-transparent lg:backdrop-blur-none`), y el párrafo y la tabla `Láser / Corte de metal / Desde` quedan sobre la placa metálica clara.
- **Skill:** `impeccable`, `web-design-guidelines`.
- **Arreglo:** mantener el fondo de la tarjeta en `lg` (quitar esos tres `lg:`), o reforzar el degradado izquierdo del escenario para esa sección.

### A3. El párrafo del hero va encima del cabezal 3D — Comprobado
- **Dónde:** `home-content.astro:140-144` (`.hero-lead`). En 1024 px y en 375 px el texto cruza la boquilla de cobre y el haz.
- **Skill:** `impeccable`, `design-taste-frontend` («el objeto del hero entero, sin texto encima»).
- **Arreglo:** mover el encuadre de cámara (`DESKTOP_KEYS`/`MOBILE_KEYS` en `src/lib/hero-laser-3d.ts`) para que el cabezal quede por debajo del bloque de texto en el progreso 0, o añadir un velo radial detrás del párrafo.

### A4. El «scramble» rompe palabras en castellano y en inglés — Comprobado
- **Dónde:** `src/lib/animations.ts:107-126` aplica `scrambleDecode` a **todos** los `.readout` (y `animateRows`, 188-193). Se vieron a medio decodificar: «PIEZAS REALES, FOTOS PRO+4/2», «MADERA · CORTE Y GRABA6:6», «LA MESA 18: +4/29», «SERVICE+», «LASERCO4».
- Además, durante el efecto `textContent` es basura para un lector de pantalla.
- **Skill:** `remove-animations` (decoración sin propósito sobre texto que se lee), `review-animations` (estándar 1), `web-design-guidelines`.
- **Arreglo:** limitar el efecto a lecturas numéricas reales (`[data-scramble]` explícito sobre «01 — 04», coordenadas), nunca a etiquetas con palabras; poner el texto final en `aria-label` del elemento mientras dura.

### A5. El fondo se desplaza con el menú móvil abierto — Comprobado
- **Dónde:** `header.astro:216-221`; `html` sigue con `overflow: visible` con el `<dialog>` abierto. En iOS el scroll del menú encadena con la página.
- **Skill:** `mobile-native` (scroll chaining), `emil-design-eng`.
- **Arreglo:** en `global.css`: `html:has(dialog[open]) { overflow: hidden; }` y `dialog.laser-dialog { overscroll-behavior: contain; }`.

### A6. Texto demasiado pequeño en etiquetas — Comprobado
- `home-content.astro:292` (`text-[0.62rem] opacity-70` = 9,9 px al 70 %), `work-showcase.astro:219` y `:224` (`text-[0.65rem]` = 10,4 px), y `.readout` en general a 0,7 rem (11,2 px) en mayúsculas con tracking ancho.
- **Skill:** `web-design-guidelines`, `impeccable` (typography).
- **Arreglo:** suelo de 0,75 rem para `.readout` y quitar los `text-[0.62rem]`/`text-[0.65rem]`; sin `opacity-70` sobre texto de 10 px.

### A7. Coordenadas vivas sin `aria-hidden` — De código
- `home-content.astro:181-187`: `data-hero-coords` se reescribe cada 85 ms (`hero-laser-3d.ts`, bloque `coordsEl`). Es decoración; un lector de pantalla puede leer valores cambiantes.
- **Skill:** `web-design-guidelines`.
- **Arreglo:** `aria-hidden="true"` en ese `span`.

### A8. Elegir material con solo pasar el ratón — De código
- `home-content.astro:624-629`: `mouseenter` cambia el material seleccionado, el panel y `aria-pressed`. Al cruzar la rejilla en diagonal se cambia el estado sin querer.
- **Skill:** `emil-design-eng`, `apple-design` (respuesta a intención).
- **Arreglo:** que el hover solo previsualice el 3D (sin tocar `aria-pressed` ni el panel) y que el clic confirme; o un retardo de ~120 ms antes de aplicar.

### A9. Enlace de crédito con objetivo táctil de 13 px — Comprobado
- `site-footer.astro:182-185` («Kaizencode»).
- **Skill:** `mobile-native`, `web-design-guidelines`.
- **Arreglo:** `inline-flex min-h-11 items-center` (o `py-3`) en ese enlace.

### A10. Barra de acciones: el `active:scale-95` salta sin transición — De código
- `src/components/custom/action-bar.astro:24` y `:33` usan `transition-colors` con `active:scale-95`, así que la escala es instantánea (el tercero sí usa `transition-transform`).
- **Skill:** `emil-design-eng` (feedback al pulsar), `apple-design`.
- **Arreglo:** `transition-[transform,background-color,border-color] duration-150 ease-out` en los tres.

### A11. El texto bajo «Así trabajamos» habla de pueblos, no del proceso — Comprobado
- `home-content.astro:462` reutiliza `home.reviews.workshop.text` («Atendemos a empresas y particulares de Valencia, Paterna…»).
- **Skill:** `impeccable` (UX copy).
- **Arreglo:** clave propia `home.process.lead` en `es` y `en` (p. ej. «De la foto que nos mandas a la pieza terminada, en cuatro pasos.» / «From the photo you send to the finished piece, in four steps.»).

### A12. «3D · PBR» es jerga — Comprobado
- `home-content.astro:260`. A un cliente de bodas o de marcado industrial no le dice nada.
- **Skill:** `impeccable` (copy), `design-taste-frontend` («plain copy»).
- **Arreglo:** quitarlo o cambiarlo por algo útil («Toca un material» / «Tap a material»).

---

## 3. Pulido de diseño y motion

### C1. Demasiado motion para un taller «serio y tranquilo»
- Hoy conviven en cada página: grano animado a pantalla completa (`global.css:96-109`), foco que sigue al puntero con `mix-blend-mode: screen` (`global.css:143-179` + `main.astro:361-378`), cursor láser con regla de 16 marcas (`main.astro:270-277`, `animations.ts:339-406`), Lenis, SplitText en títulos y párrafos, scramble, filas, haz del proceso, cortes SVG, wipes, parallax, palabras que «se queman», panel que escala, botones magnéticos, brillo direccional en tarjetas, beam-dot pulsante, engrave del h1 y entrada del header.
- **Skill:** `remove-animations`, `review-animations` (estándares 1 y 10), `find-animation-opportunities` (la puerta de frecuencia), `design-taste-frontend` («quiet micro-interactions», «one or two dealt moments per page»).
- **Propuesta (por orden):**
  1. Quitar el grano animado (dejarlo estático) — corre siempre, a pantalla completa, por encima de todo (`z-index: 60`).
  2. Quitar el foco del puntero y la regla «vernier» del cursor; si se queda el cursor, solo el punto con etiqueta.
  3. Quitar el scramble salvo en cifras (ver A4).
  4. Quedarse con **dos momentos firmados**: el 3D del hero y el haz del proceso. Los títulos con SplitText pueden pasar a la entrada simple `.reveal`.
  5. Quitar Lenis (ver C2).

### C2. Lenis contradice `DESIGN.md` y choca con `scroll-smooth`
- `animations.ts:461-477` activa Lenis en todo puntero fino; `DESIGN.md` dice «Zero scroll-hijacking on desktop or mobile». Además `main.astro:157` pone `motion-safe:scroll-smooth` en `<html>`, que Lenis pide desactivar (no se importa `lenis/dist/lenis.css`), y `gsap.ticker.lagSmoothing(0)` es global.
- **Skill:** `review-animations`, `apple-design` (respuesta inmediata), `gsap-scrolltrigger`.
- **Arreglo:** quitar Lenis y dejar scroll nativo (con eso desaparece también la ruta Lenis de la regla del cursor). Si se mantiene, importar `lenis/dist/lenis.css` y quitar `scroll-smooth`.

### C3. El cursor láser anima `width`/`height`/`margin` — De código
- `global.css:400-428`: al crecer a 96 px sobre `[data-cursor]` se recalcula layout en cada frame de la transición.
- **Skill:** `animation-performance` (regla 1), `gsap-performance`.
- **Arreglo:** tamaño fijo de 96 px con `transform: scale(0.104)` en reposo y `scale(1)` en `[data-big]`; posicionar con `translate3d` (ya se hace).

### C4. El foco del puntero recalcula estilos de toda la página — De código
- `main.astro:364-374` escribe `--mx`/`--my` en `<html>` en cada `pointermove`: las custom properties heredan, así que el navegador invalida estilos de todo el documento, y la capa usa `mix-blend-mode: screen` sobre toda la pantalla.
- **Skill:** `animation-performance`, `gsap-performance` («mouse followers»).
- **Arreglo:** si se queda (ver C1), escribir las variables en `.obsidian-spotlight` y no en `<html>`, y quitar el `mix-blend-mode`.

### C5. Three.js en la portada del móvil a los 300 ms, y un bucle que nunca para
- `home-content.astro:681` (`requestIdleCallback(load, { timeout: 300 })`) descarga Three.js (607 kB sin comprimir) + GLB + texturas en cualquier dispositivo. En `/prueba-tu-grabado/` los títulos con SplitText seguían a medio animar 5 s después de cargar mientras arrancaba el 3D (comprobado en el navegador del panel; confirmar en un móvil real).
- `src/lib/hero-laser-3d.ts:783-791`: el `requestAnimationFrame` sigue vivo aunque el escenario esté fuera de pantalla, y cada frame llama a `getBoundingClientRect()` y escribe `style.visibility`. `antialias: true` + `shadowMap` PCF también en móvil (`:373-382`).
- **Skill:** `animation-performance`, `gsap-performance` («reduce simultaneous work»), `mobile-native`.
- **Arreglo:** cargar el 3D con `IntersectionObserver` + primera interacción en móvil (el póster ya cubre el LCP); parar el rAF cuando `stageVisible` es falso y reanudarlo desde el listener de scroll; escribir `visibility` solo cuando cambia; sin sombras ni antialias con `mobile`.

### C6. El constructor de presupuestos envía todos los textos de la web — Comprobado en el bundle
- `src/components/custom/quote-builder.tsx:4` importa `ui` completo; `dist/_astro/quote-builder.*.js` pesa 174 kB e incluye textos de otras páginas («Celosías, mandalas…»).
- **Skill:** `animation-performance` (hilo principal ocupado), `impeccable` (optimize).
- **Arreglo:** pasar desde `contact-content.astro` un objeto con solo las claves `quote.*` del idioma actual como prop (como ya se hace con `serviceNames`).

### C7. Parallax de la foto de servicio peleado con una transición CSS — De código
- `src/components/custom/service-content.astro:124-125`: la imagen tiene `data-parallax` (GSAP escribe `transform` en cada frame con `scrub`) y a la vez `transition-transform duration-700`, así que cada escritura de GSAP arranca una transición de 700 ms: el parallax se arrastra.
- **Skill:** `gsap-performance`, `animation-performance`.
- **Arreglo:** mover el `group-hover:scale-[1.03]` a un envoltorio y dejar la imagen sin `transition-transform`.

### C8. Lecturas de layout dentro del scrub del haz — De código
- `animations.ts:141-153` lee `track.clientHeight`, `step.offsetTop` y `offsetHeight` en cada `onUpdate`, después de escribir `transform` y `data-lit`.
- **Skill:** `gsap-performance` («batch reads and writes»).
- **Arreglo:** medir en `onRefresh` y guardar los umbrales; en `onUpdate` solo comparar `progress`.

### C9. Botones magnéticos que se miden a sí mismos ya desplazados — De código
- `animations.ts:418-422`: `getBoundingClientRect()` del botón incluye su propio `x/y`, así que el centro se mueve con él (bucle de realimentación suave, se nota como «flotar»).
- **Skill:** `emil-design-eng`, `gsap-performance`.
- **Arreglo:** medir el `parentElement` (que no se mueve) o cachear el rect al `pointerenter`. Valorar quitarlo (C1).

### C10. El menú móvil entra desde abajo pero vive a la derecha, y se cierra de golpe — De código
- `global.css:787-796`: `dialog-in` hace `translateY(8px)` para un panel anclado a la derecha (`header.astro:220`), y `drawer.close()` no tiene salida.
- **Skill:** `emil-design-eng` (consistencia espacial), `apple-design`, `review-animations` (estándar 5).
- **Arreglo:** para `#mobile-nav-drawer`, `translateX(100%) → 0` en 300 ms con `cubic-bezier(0.32, 0.72, 0, 1)`, y salida con `@starting-style` + `transition-behavior: allow-discrete` (o clase `closing` + `animationend` antes de `close()`).

### C11. Mega-menú sin transición de entrada — De código
- `header.astro:89-93` alterna `hidden`. Con hover a 160 ms de cierre funciona, pero aparece de golpe.
- **Skill:** `emil-design-eng` (origen del popover), `review-animations`.
- **Arreglo:** opacidad + `scale(0.98)` desde `transform-origin: top center`, 150 ms `ease-out`, solo con `prefers-reduced-motion: no-preference`.

### C12. El h1 de las páginas interiores empieza recortado
- `global.css:294-323`: `.engrave-text` empieza con `clip-path: inset(... 100% ...)` y 0,3 s de retraso; el título no se ve hasta ~0,9 s. Si el h1 es el elemento LCP de una página (servicios sin foto grande en móvil), retrasa el LCP.
- **Skill:** `review-animations` (estándar 4), `animation-performance`.
- **Arreglo:** quitar el retraso inicial (`--start: calc(var(--i, 0) * 0.62s)`) o empezar con el texto visible y solo pasar el haz por encima.

### C13. `will-change` permanente y `transition-all`
- `global.css:319` (`.engrave::after`), `:459` (16 marcas del cursor); `transition-all` en `home-content.astro:278`, `header.astro:110`, `work-showcase.astro`, `ui/button.tsx`, `ui/accordion.tsx`.
- **Skill:** `animation-performance` (regla 4: nunca `transition: all`).
- **Arreglo:** listar propiedades (`transition-[border-color,background-color,color,box-shadow]`) y quitar `will-change` fuera de la animación.

### C14. Selección de texto con poco contraste
- `global.css:226-229`: blanco sobre `--laser` (`oklch(0.68 0.2 38)`) queda cerca de 3:1.
- **Skill:** `web-design-guidelines`.
- **Arreglo:** `color: var(--primary-foreground)` (obsidiana) sobre el láser.

### C15. Huecos grandes entre secciones
- Tras «Cada material pide su potencia…» (`work-showcase.astro:241-247`) y antes de «Servicios» hay más de media pantalla vacía en 1024 px.
- **Skill:** `design-taste-frontend` («one section per screen»), `impeccable` (layout).
- **Arreglo:** reducir `mt-16 pt-14` del statement y `py-24 lg:py-32` de `#servicios`, o integrar el statement como cabecera de servicios.

---

## 4. Mejoras deseables

- **N1. Confirmar «metal hasta 4 mm»** con el dueño. Aparece en el hero, la ficha de metal y la de industria (`src/i18n/messages/site.ts:35,41,402,408`, `materials.ts:192,199`, `clients.ts:16,29,348,361`, `home.ts:60,145`). `PRODUCT.md` prohíbe inventar especificaciones de máquina; si ya está confirmado, añadirlo a «Evidence on hand». *(impeccable, regla del proyecto)*
- **N2. El cabezal 3D no es la máquina del taller.** `docs/auditoria.md` ya pidió quitar las imágenes que enseñaban máquinas ajenas; el render de Blender es una máquina genérica. Cuando haya fotos o vídeo del taller (punto 3 de esa auditoría), plantear el hero con ellas. *(design-taste-frontend: «real photographs»)*
- **N3. Documentación desfasada:** `AGENTS.md` habla de «11 service pages» y el menú dice «Los 13 servicios del taller»; `DESIGN.md` describe la home «en cinco movimientos» y ahora hay siete actos. *(impeccable: document)*
- **N4. SplitText con `aria: "none"`** (`animations.ts:24,47,248`) deja los títulos troceados en `div`s de línea y palabra. Con `aria: "auto"` GSAP pone el texto entero en `aria-label`. *(web-design-guidelines)*
- **N5. `name={legend}` en los grupos del presupuesto** (`quote-builder.tsx:103`) usa el texto visible con espacios y tildes como `name`. Funciona, pero un id estable (`need`, `material`…) es más robusto. *(break-ui)*
- **N6. Oportunidades de motion que sí pasan la puerta** *(find-animation-opportunities)*: (a) feedback de «Copiado» en el presupuesto con un cruce de iconos de 150 ms; (b) acordeón de FAQ con altura medida (ya es Radix: comprobar que `animate-accordion-down/up` está activo y respeta reduced-motion). Nada más: la web no necesita más motion, necesita menos.
- **N7. Lighthouse:** no se ha corrido `pnpm lighthouse` en esta pasada. `docs/auditoria.md` lo daba en rojo por LCP; conviene repetirlo tras C5/C6.

---

## 5. Skills: cuáles se aplicaron y cuáles no

Se aplicaron como criterios de revisión sobre el código y la web en marcha, en una sola pasada consolidada (cada hallazgo indica qué skill lo marca):

| Skill | Aplicada | Nota |
|---|---|---|
| `impeccable` (critique/audit) | Sí | Jerarquía, contraste, copy, layout |
| `web-design-guidelines` | Sí | Con sus criterios habituales (a11y, foco, formularios, tipografía); no se descargó la última versión de las reglas |
| `design-taste-frontend` | Sí, con cuidado | Su regla 9 (no publicar número ni código postal) **choca con el SEO local** y con `src/lib/business.ts`: no se aplica |
| `emil-design-eng` | Sí | Pulsaciones, origen de menús, cursor |
| `review-animations`, `improve-animations`, `find-animation-opportunities`, `remove-animations`, `animation-performance`, `choreograph` | Sí | `improve-animations` pide planes en `plans/`: este informe hace ese papel |
| `break-ui` | Parcial | Probado a 320 px en inglés (botones de la barra, filtros) y textos largos; no se montó el conmutador «Worst case» porque la tarea es solo auditar |
| `mobile-native` | Sí, en emulación | Pide confirmar en hardware real |
| `apple-design` | Sí | Menú, pulsaciones, respuesta |
| `gsap-performance`, `gsap-scrolltrigger` | Sí | La web usa GSAP + ScrollTrigger + SplitText |
| `animate-expo`, `write-swift` | No | No hay React Native ni Swift |
| `ask-sonner` | No | No se usa Sonner |
| `animation-vocabulary`, `ask-emil`, `learn-taste`, `pick-ui-library`, `prototype` | No | Son de consulta o de creación, no de revisión |
| `gestures` | No | No hay gestos de arrastre en la web |
