# Migración de lasercom.es a la web nueva

Guía para cambiar el dominio de la web vieja (WordPress de SEO Solutions) a esta web. Escrita el 20-11-2026.

## Plazo

SEO Solutions cobró el 20-11-2026 el último recibo, que cubre el alojamiento hasta el **20-12-2026**. Hay que hacer el cambio de DNS **antes del 15-12-2026** para tener margen: las DNS pueden tardar hasta 24 horas en propagarse y la web vieja tiene que seguir funcionando mientras tanto.

## Cómo está ahora (consultado el 20-11-2026)

| Registro | Valor | Qué es |
| --- | --- | --- |
| NS | `dns1.nominalia.com`, `dns2.nominalia.com` | Las DNS se gestionan en Nominalia |
| A `lasercom.es` | `185.129.250.253` | Servidor de SEO Solutions (la web vieja) |
| CNAME `www` | `lasercom.es` | |
| CNAME `ftp` | `lasercom.es` | FTP de la web vieja, sobra después |
| MX | `10 mail.nominalia.com` | **Correo de @lasercom.es, en Nominalia. No tocar** |
| TXT | `v=spf1 include:spf.webapps.net ~all` | SPF del correo. **No tocar** |
| TXT | dos `google-site-verification=…` | Search Console. **No tocar** |

El dominio y el correo son de Vicente, en su cuenta de Nominalia (el usuario y la contraseña de siempre, según SEO Solutions). SEO Solutions solo controla el servidor de la IP `185.129.250.253`. Cambiar el registro A y el `www` no afecta al correo.

## Dónde se aloja la web nueva

En **GitHub Pages**, gratis, desde el repositorio `JoseMartinez97/lasercom-web`. Cada `push` a `main` pasa las comprobaciones (lint, tipos, `pnpm test`, Lighthouse) y publica. Hoy se publica como vista previa en `https://josemartinez97.github.io/lasercom-web/`, con todas las páginas en `noindex`.

GitHub Pages no lee el archivo `_redirects`: las direcciones antiguas sin página propia redirigen con una página de redirección (meta refresh con canonical), que Google trata como una redirección permanente. Las 11 páginas de servicio conservan la misma dirección que en WordPress, así que no necesitan redirección.

## Pasos

### 1. Antes del cambio (cualquier día)

- [ ] **Verificar el dominio en GitHub** (evita que otra cuenta pueda usarlo): GitHub → Settings (de la cuenta) → Pages → Add a domain → `lasercom.es`. GitHub da un registro TXT `_github-pages-challenge-JoseMartinez97` que hay que añadir en Nominalia. Se puede hacer ya, no afecta a la web vieja.
- [ ] **Acceso a GA4**: pedir a SEO Solutions que den a Vicente acceso de **administrador** a la propiedad de Google Analytics `G-2ZTCCNRYYP` (o que confirmen que ya es suyo), y lo mismo con **Search Console** y el **contenedor de Google Tag Manager** `GTM-T8HDHCP`. La web nueva usa la misma propiedad para no perder el histórico, pero sin GTM.
- [ ] **Google Business Profile**: confirmar quién lo gestiona. Si lo lleva SEO Solutions, que añadan a Vicente como propietario.
- [ ] **Copia de seguridad del WordPress**: pedir a SEO Solutions una exportación (o guardarla con el acceso de administrador) por si hiciera falta algún texto o foto.
- [ ] Revisar con Vicente los textos y las fotos de la web nueva.

### 2. Ajustes de GA4 (con el acceso de administrador)

- [ ] Administrar → Flujos de datos → el flujo web → Medición mejorada → engranaje → **desactivar "Cambios de página basados en eventos del historial del navegador"**. La web nueva cambia de página sin recargar y manda ella misma cada `page_view`; si se deja activado, cada página cuenta doble.
- [ ] Administrar → Eventos clave → **marcar como evento clave** `generate_lead` (envío del formulario de presupuesto, por WhatsApp o correo) y `contact` (toque en cualquier teléfono, WhatsApp o correo de la web). Aparecen en la lista cuando han llegado una vez; si no, crearlos como evento clave con ese nombre exacto.
- [ ] Opcional: Administrar → Definiciones personalizadas → crear las dimensiones de evento `method`, `service` y `link_location` para poder ver por qué canal llegan los contactos.

### 3. Publicar en el dominio (el día del cambio)

1. [ ] En GitHub, repositorio → Settings → Secrets and variables → Actions → Variables: **borrar `SITE_PREVIEW`, `SITE_URL` y `BASE_PATH`**. A partir de aquí la web se construye para `https://lasercom.es`, indexable y con Analytics.
2. [ ] Repositorio → Settings → Pages → Custom domain: escribir `lasercom.es` y guardar.
3. [ ] Repositorio → Actions → "Deploy to GitHub Pages" → **Run workflow** sobre `main`.
4. [ ] En **Nominalia** → zona DNS de `lasercom.es`:
   - Borrar el registro **A** `185.129.250.253` y crear cuatro registros **A** para `lasercom.es` (o `@`):
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - Opcional (IPv6), cuatro registros **AAAA**:
     `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
   - Cambiar el **CNAME `www`** para que apunte a `josemartinez97.github.io.` (GitHub redirige `www` a `lasercom.es` solo)
   - Borrar el CNAME `ftp`
   - **No tocar** MX, SPF ni los TXT de Google
5. [ ] Esperar a que GitHub marque el dominio como comprobado (Settings → Pages) y activar **Enforce HTTPS**. El certificado puede tardar hasta una hora.

### 4. Comprobar (el mismo día y al día siguiente)

- [ ] `https://lasercom.es/`, `https://www.lasercom.es/` y `http://lasercom.es/` abren la web nueva con candado.
- [ ] Las páginas que posicionan abren sin error: `/corte-grabado-laser-metal-acero/`, `/impresion-corte-grabado-laser-madera/`, `/corte-grabado-laser-piel-cuero/`, `/corte-laser-decoracion/`, `/corte-grabado-laser-cristal-metacrilato/`, `/corte-grabado-laser-personalizado/`.
- [ ] Mandar un correo a `lasercom@lasercom.es` desde fuera y comprobar que llega.
- [ ] Aceptar cookies en la web y ver la visita en GA4 → Informes → Tiempo real.
- [ ] **Search Console**: enviar `https://lasercom.es/sitemap-index.xml` y pedir la indexación de la portada y de las páginas de servicio.
- [ ] El primer `push` con el dominio real ya avisa a Bing por IndexNow (lo hace el workflow).

### 5. Después

- [ ] Avisar a SEO Solutions de que la web ya no está en su servidor y de la **baja del servicio**, para que no haya más recibos tras el 20-12-2026. Pedir que **desactiven el doble factor** ligado a su correo o que borren el usuario `laseruser`.
- [ ] Vigilar en Search Console durante 4-6 semanas: páginas indexadas, errores 404 y posiciones de "grabados laser", "grabado laser en metal" y "corte laser madera".
- [ ] Comparar las visitas con el mes de septiembre de 2026 (115 sesiones, 70 % de búsqueda orgánica). Con el aviso de cookies, las visitas de quien rechaza solo aparecen como estimación de Google, así que la cifra puede bajar un poco sin que haya bajado el tráfico real.

## Si algo sale mal

Volver a poner el registro **A** `185.129.250.253` y el CNAME `www` → `lasercom.es` en Nominalia devuelve la web vieja, mientras SEO Solutions la mantenga (hasta el 20-12-2026).
