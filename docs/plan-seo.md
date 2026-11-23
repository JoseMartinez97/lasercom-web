# Plan de SEO y visitas · Lasercom

23-11-2026. Datos de Search Console (propiedad de dominio `lasercom.es`, del 22-11-2025 al 21-11-2026) sobre la web vieja. Completa la [auditoría del 15-11](auditoria.md), que se hizo sin estos datos.

## 1. Dónde estamos

| Métrica (12 meses) | Valor |
| --- | --- |
| Clics | 1.550 (197 son la búsqueda «lasercom») |
| Impresiones | 187.000 |
| CTR medio | 0,8 % |
| Posición media | 32,2 |
| Páginas indexadas | 11 (la web nueva tiene unas 45) |

Lectura: Google ya enseña mucho la web (187.000 veces), pero casi siempre en la segunda o tercera página. **El problema no es que no se vea; es que sale demasiado abajo.** Subir posiciones en búsquedas que ya tienen impresiones es lo más rápido.

### Páginas

| Página | Clics | Impresiones | Posición |
| --- | --- | --- | --- |
| Portada | 1.091 | 86.700 | 25,4 |
| `http://www.lasercom.es/` (duplicado de la portada) | 174 | 14.400 | 12,6 |
| Metal y acero | 43 | **66.000** | **44,3** |
| Madera | 50 | 11.600 | 53,9 |
| Cristal y metacrilato | 31 | 7.200 | 40,9 |
| Personalizado | 49 | 6.900 | 31,6 |
| Piel y cuero | 62 | 6.700 | 16,3 |
| Decoración | 18 | 3.400 | 12,3 |
| Contacto | 23 | 1.400 | 5,1 |

## 2. Las cuatro oportunidades, por tamaño

### 2.1 Metal: un tercio de todas las impresiones, en la página 5 de Google

La página de metal suma 66.000 impresiones en posición 44. Es además lo que tu tío quiere vender. Búsquedas (nacionales, sin «Valencia»):

| Búsqueda | Impresiones | Posición |
| --- | --- | --- |
| grabado laser en metal | 2.876 | 32,5 |
| grabado en acero | 2.002 | 40,1 |
| grabados laser en metal | 1.559 | 36,8 |
| corte laser metal | 1.526 | 63,1 |
| grabado en metal | 1.372 | 47,7 |
| grabado laser metal | 1.238 | 30,5 |
| grabados con laser en metal | 1.124 | 40,5 |
| grabado láser en acero inoxidable | 1.097 | 34,9 |
| marcado laser metal | 964 | 28,4 |
| grabado láser en acero | 944 | 39,8 |

Qué hacer:
- Reforzar la página de metal: secciones por metal (acero inoxidable, aluminio anodizado, latón, oro y plata), «grabado o marcado: qué diferencia hay», «corte de chapa hasta 4 mm» y preguntas reales. Fotos de piezas de metal del taller y vídeo de la máquina de fibra.
- Una guía de apoyo: «Grabado láser en acero inoxidable: qué acabados hay (negro, color, profundo)» enlazando a la página.
- Enlaces internos desde portada, marcado industrial, joyería y trabajos con el texto «grabado láser en metal».
- Objetivo realista: de la posición 44 a la primera página en 3–6 meses en 3–4 de estas búsquedas. Con un 3–5 % de CTR serían 30–60 clics más al mes.

### 2.2 Búsquedas locales de Valencia: ya en posiciones 4–20, sin clics

| Búsqueda | Impresiones | Posición |
| --- | --- | --- |
| corte laser valencia | 1.934 | 19,5 |
| corte por laser valencia | 1.018 | 17,8 |
| laser corte valencia | 823 | 13,3 |
| corte láser valencia | 551 | 11,0 |
| grabado y corte laser valencia | 642 | 4,4 |
| corte y grabado láser valencia | 574 | 4,6 |
| presupuesto grabado láser valencia | 458 | 5,3 |
| corte láser a medida valencia | 443 | 5,5 |

Muchas en posición 4–6 tienen 0 clics. En estas búsquedas Google enseña arriba el mapa con tres negocios y, a veces, una respuesta de IA: quien no sale en el mapa casi no recibe clics aunque esté 5.º. **Aquí manda el Perfil de Empresa de Google y las reseñas**, no la web:
- Pedir reseñas: poner el enlace en `REVIEW_URL` (`automation/seguimiento/Code.gs`) y un cartel con QR en el mostrador. Objetivo: de 6 a 25 en tres meses.
- Perfil al día: categoría principal «Servicio de grabado» (o «Servicio de corte por láser»), servicios con los mismos nombres que la web, fotos del taller, una publicación por trabajo nuevo.
- La portada debe decir «corte láser en Valencia» en el `h1` o en un `h2` visible (ver 3).

### 2.3 Metacrilato: falta una página propia

| Búsqueda | Impresiones | Posición |
| --- | --- | --- |
| corte laser metacrilato | 1.067 | 40,7 |
| corte láser metacrilato valencia | 843 | 9,8 |
| empresas de corte láser de metacrilato en valencia | 491 | 8,4 |
| grabado láser en metacrilato valencia | 468 | 8,7 |
| grabado láser metacrilato valencia | 440 | 5,4 |
| láser metacrilato valencia | 389 | 16,5 |

Hoy cristal y metacrilato comparten página. Separarlas (la URL actual se queda con metacrilato, que es lo que más se busca; cristal y copas va a una nueva) da a cada una un tema claro. Ya estaba en la auditoría; los datos lo confirman.

### 2.4 Piel y cuero: cerca de la primera página

| Búsqueda | Impresiones | Posición |
| --- | --- | --- |
| grabado en piel | 713 | 15,3 |
| corte laser piel | 473 | 13,4 |
| grabado laser cuero | 473 | 19,3 |
| grabado laser piel | 448 | 9,8 |

Ya es la página con más clics después de la portada. Más fotos reales y dos o tres preguntas frecuentes la pueden meter en el top 10.

## 3. La migración ya mejora cosas

- **Duplicado de la portada**: Google cuenta `http://www.lasercom.es/` y `https://lasercom.es/` como páginas distintas (14.400 impresiones repartidas). GitHub Pages redirige `www` a `lasercom.es` y fuerza HTTPS: se juntan en una.
- **De 11 a ~45 páginas indexables**: guías, trabajos y servicios que hoy no existen (plástico, industrial, joyería, empresas, bodas, letras).
- **Rendimiento**: la web vieja no tiene datos de Core Web Vitals; la nueva pasa Lighthouse en el CI.
- Imágenes antiguas `wp-content/uploads/...`: dan impresiones sueltas en Google Imágenes (casi cero). Se pierden con la migración; no merece la pena redirigirlas.

## 4. Orden de trabajo

| # | Tarea | Quién | Cuándo |
| --- | --- | --- | --- |
| 1 | Migración a `lasercom.es` (ver [migracion.md](migracion.md)) y envío del sitemap | Claude + José María | Antes del 15-12 |
| 2 | Reseñas: `REVIEW_URL`, cartel QR y pedirlas en cada entrega | José María + Vicente | Ya |
| 3 | Perfil de Empresa de Google al día | José María con lasercom@lasercom.es | Ya |
| 4 | Página de metal reforzada + guía de acero inoxidable | Claude, con datos de Vicente | Semana 1–2 |
| 5 | Separar metacrilato y cristal | Claude | Semana 2–3 |
| 6 | Piel: fotos y preguntas | Claude, con fotos de Vicente | Semana 3 |
| 7 | Calendario de guías (auditoría, 5.2), una cada 2–3 semanas | Claude, con notas de Vicente | Continuo |
| 8 | Citas: Bing Places, Apple Business Connect, Páginas Amarillas, QDQ | José María | Mes 1 |
| 9 | Revisión mensual en Search Console: búsquedas en posición 5–20 | Claude | Mensual |

## 5. Cómo medirlo

- **Referencia**: unos 110 clics al mes no de marca en Search Console; 115 sesiones en GA4 en septiembre de 2026.
- **A los 3 meses** (finales de febrero de 2027): página de metal por debajo de la posición 20 en «grabado laser en metal»; 20 reseñas; clics no de marca +50 %.
- **A los 6 meses**: metal en primera página en 3 búsquedas; metacrilato en el top 5 local; clics no de marca ×2.
- En GA4, mirar `generate_lead` y `contact` por página de entrada: no vale de nada subir visitas que no piden presupuesto.

Para la página de metal hacen falta datos de Vicente: qué metales trabaja de verdad, si hace grabado en color o negro sobre inoxidable, grosores de corte por metal y 5–10 fotos de piezas de metal.
