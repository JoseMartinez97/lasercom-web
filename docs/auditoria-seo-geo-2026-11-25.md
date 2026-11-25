# Auditoría SEO y GEO · Lasercom

25 de noviembre de 2026. Hecha con la skill *Claude SEO and GEO Site Audit* (claude-site-audit). El plugin instalado no trae sus ficheros de criterios ni el generador de PDF, así que los 17 checks se han aplicado a mano y el informe va en Markdown.

**Qué se ha auditado.** La build de producción local (`dist/`, 51 URL del sitemap, todas leídas en HTML, no en pantalla). Es lo que se publicará en lasercom.es. También se ha revisado la preview de GitHub Pages, que lleva `noindex` a propósito.

**Nota global: A.** No hay nada roto. Lighthouse (último run, 22-11): rendimiento 0,96–0,99, accesibilidad, buenas prácticas y SEO 1,00 en las seis páginas medidas.

---

## Scorecard

| # | Check | Resultado | Notas |
|---|---|---|---|
| 1 | HTTPS | PASS | GitHub Pages con HTTPS; el dominio aún apunta al WordPress |
| 2 | Responsive / viewport | PASS | `width=device-width`, Lighthouse móvil 0,96+ |
| 3 | Idioma del documento | PASS | `lang="es"` / `lang="en"` en cada página |
| 4 | Texto alternativo | PASS | 0 imágenes sin `alt` en todo el sitio |
| 5 | Encabezados | PASS | Un `h1` por página, jerarquía h2→h3 sin saltos |
| 6 | Formularios accesibles | PASS | Etiquetas envolventes, `fieldset` + `legend` en las opciones |
| 7 | Navegación por teclado | PASS | Enlace «Saltar al contenido» a `#main-content` |
| 8 | Contacto visible | PASS | `tel:` móvil y fijo, WhatsApp, `mailto:`, dirección y horario |
| 9 | Title | PASS | Únicos en las 51 páginas; 11 rozan los 60 caracteres (ver abajo) |
| 10 | Meta description | PASS | Únicas, 116–164 caracteres |
| 11 | Canonical | PASS | Absoluto a `https://lasercom.es/…` en todas |
| 12 | robots.txt y sitemap | PARTIAL | Correctos, pero el sitemap no lleva `<lastmod>` |
| 13 | Open Graph | PASS | Imagen propia por servicio y guía |
| 14 | Datos estructurados | PASS | LocalBusiness completo (geo, horario, área, catálogo), WebSite, Service, FAQPage, Article, BreadcrumbList |
| 15 | Multilingüe / hreflang | PASS | es, en y x-default en página y sitemap; slugs traducidos bien emparejados |
| 16 | llms.txt / crawlers de IA | PASS | `llms.txt` con NAP, horario y mapa de páginas; robots no bloquea GPTBot, ClaudeBot ni PerplexityBot |
| 17 | Contenido citable (GEO) | PASS | 1.100–1.800 palabras por servicio, FAQ con respuestas directas, guías con datos concretos |

Accesibilidad 10/10 · Usabilidad 10/10 · SEO 9/10 · GEO 9/10.

---

## Qué mejorar, por prioridad

1. **Publicar antes del 20 de diciembre** (lo más importante, no es código). El WordPress deja de tener hosting entonces. Pasos en `docs/migracion.md`: TXT de verificación en Nominalia, A y www, quitar `SITE_PREVIEW`/`SITE_URL`/`BASE_PATH`, enviar el sitemap en Search Console y Bing y lanzar IndexNow.
2. ~~**Añadir `<lastmod>` al sitemap.**~~ Hecho el 25-11 en `scripts/indexnow.mjs hashes`: cada página conserva la fecha del sitemap publicado mientras su huella de contenido no cambie, y si cambia lleva la fecha de la build. En la migración todas salen con la fecha de ese día, que es lo correcto.
3. **`sameAs` solo enlaza a Google Maps.** Si el taller tiene Instagram, Facebook o una ficha en directorios (Páginas Amarillas, Cylex…), añadirlos refuerza la entidad para Google y para los asistentes de IA. **[dueño]**: no inventar perfiles.
4. **Reseñas de Google.** Sigue siendo la palanca de SEO local con más retorno (ver `docs/auditoria.md`). No añadir `aggregateRating` propio en el schema: Google no muestra estrellas de reseñas autogestionadas de un LocalBusiness.
5. **Titles largos (menor).** 11 títulos miden 61–67 caracteres, sobre todo en inglés y en las guías (p. ej. «Industrial laser marking: serials, QR & traceability | Lasercom»). Google puede cortar el « | Lasercom» final; no afecta al ranking.

## Solo en la preview (no llega a producción)

- `noindex` y canonical a github.io: correcto mientras sea preview.
- La `og:image` de la portada apunta a `josemartinez97.github.io/og/og-image.jpg` (404) porque le falta el `BASE_PATH`. En producción sale bien (`lasercom.es/og/og-image.jpg`); solo afecta a enlaces de la preview compartidos por WhatsApp.
