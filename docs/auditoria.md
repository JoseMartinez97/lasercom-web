# Auditoría de diseño, SEO y funcionalidades · Lasercom

15 de noviembre de 2026. Estado auditado: el repositorio local, con todo el trabajo sin commitear (build de `pnpm build`, 45 páginas indexables). No se ha cambiado código de la web. Lo único nuevo es esta carpeta `docs/`.

**Cómo leer este informe.** «Comprobado» significa que lo he medido o visto hoy en la build, en el código o en una búsqueda. «Supuesto» es mi criterio o algo que no he podido medir. Lo que depende de un dato del taller lleva la marca **[dueño]**.

---

## 1. Resumen: las diez acciones con más retorno

| # | Acción | Impacto esperado | Esfuerzo | ¿Necesita a tu tío? |
|---|---|---|---|---|
| 1 | **Quitar las 8 imágenes generadas con IA** de la portada y sustituirlas por piezas reales (prototipo B) | Alto. Hoy la web enseña máquinas y piezas que no son del taller, justo lo que no queremos | M | No para empezar; sí para fotos nuevas |
| 2 | **Conseguir reseñas en Google**: pasar de 6 a 30 o más | Muy alto en SEO local. El competidor que mejor posiciona enseña 4,9 con 62 reseñas | S (web) | Sí: el enlace de reseñas y pedirlas |
| 3 | **Una tarde de fotos y vídeo en el taller** | Muy alto. Es el techo visual de toda la web: las fotos actuales miden 640–1000 px y son de móvil | M | Sí |
| 4 | **Devolver la portada a los umbrales de Lighthouse** (LCP de 3,1 s frente a un máximo de 3,0 s) | Medio, pero bloquea la publicación: `pnpm lighthouse` falla hoy | S | No |
| 5 | **Acortar la portada a la mitad** y subir las pruebas arriba (prototipo A) | Alto en conversión. Hoy son 23 pantallas de móvil y las reseñas están en la 15 | M | No |
| 6 | **Recuperar «marcado láser» en el título de la portada** y no perder lo que ya posiciona | Medio-alto. Bing ya coloca la portada actual 1.ª o 2.ª con ese título | S | No |
| 7 | **Una página por trabajo** (prototipo C): 12 páginas nuevas con prueba real | Alto en SEO de cola larga y en ventas | M | Sí: año, reto y permiso de marcas |
| 8 | **Formulario de presupuesto con subida de archivo** | Alto para empresas. Los competidores lo tienen | M | Sí: la cuenta de Google o correo de destino |
| 9 | **Ampliar las guías con un calendario de 12 piezas**, sin blog aparte | Medio, acumulativo | S por pieza | Poco: validar datos |
| 10 | **Perfil de Empresa de Google al día**: categorías, fotos, servicios y publicaciones | Alto en el mapa de Google | S | Sí: acceso al perfil |

Tres cosas que conviene saber ya:

- **`pnpm lighthouse` falla ahora mismo.** La portada da un LCP de 3,08–3,16 s en las tres pasadas, en español y en inglés, y «Trabajos» roza el límite con 3,00 s. La portada pesa 8,7 MB porque el vídeo de móvil son 8 MB. Lo más probable es que la causa sea la película en 4K que montamos hoy. Detalle en el apartado 3.1.
- **Las imágenes de «Materiales» y «Tres acabados» son de Google Generative AI.** Lo dicen sus propios metadatos. Una de ellas enseña un cabezal industrial con chispas que no es ninguna de las dos máquinas del taller.
- **La base técnica de SEO está bien hecha.** No hay nada roto: títulos, descripciones, un `h1` por página, `hreflang`, datos estructurados, redirecciones y las 11 URL del WordPress actual están cubiertas.

---

## 2. Diseño

Capturas: [portada en escritorio](capturas/portada-escritorio.jpg), [portada en móvil](capturas/portada-movil.jpg), [servicio](capturas/servicio-escritorio.jpg), [trabajos](capturas/trabajos-escritorio.jpg), [guía](capturas/guia-escritorio.jpg).

### 2.1 Veredicto

La web tiene una identidad clara y bien pensada: el tablero claro, las secciones de acero, un solo rojo láser y la Archivo ancha. Es coherente de una página a otra, cosa poco habitual. **Pero no impresiona en proporción al trabajo que lleva, y la razón es la fotografía.** La tipografía y el movimiento están haciendo el trabajo que deberían hacer las piezas.

Lo que funciona:

- **El sistema de color y la tipografía.** Reconocible, sobrio y distinto de la competencia local, que es casi toda plantilla de WordPress.
- **La página de trabajos.** Es la más convincente del sitio porque todo lo que enseña es real.
- **Las páginas de servicio.** Orden claro: qué es, por qué, qué hacemos, trabajos, preguntas y cierre.
- **El cierre común** («¿Tienes una idea? Cuéntanosla.») con dirección, horario y estado de apertura.
- **La película de portada**, ahora con una máquina CO2 real.

### 2.2 Problemas, de más a menos grave

**1. Imágenes generadas con IA presentadas como reales (comprobado).**
Los ocho archivos de `src/assets/editorial/` llevan en sus metadatos «Created by Google Generative AI» y la marca SynthID. Se usan en «Materiales que trabajamos» y «Tres acabados desde el mismo taller» ([home-content.astro](../src/components/custom/home-content.astro), [editorial.ts](../src/lib/editorial.ts)). Ver [la muestra](capturas/imagenes-ia.jpg).

- Rompen la regla de PRODUCT.md «pruebas, no promesas» y la de no enseñar maquinaria ajena.
- `technique-fiber-mark.jpg` muestra un cabezal con chispas sobre un bloque mecanizado. `technique-wood-beam.jpg` muestra una boquilla que no es la del taller.
- Los textos alternativos las describen como si fueran fotos («Detalle macro de tablero de nogal y abedul…»).
- Un cliente que visite el taller verá otra cosa. Y al lado de las fotos reales, que son modestas, delatan el truco: son las únicas imágenes «perfectas» de la web.

**2. La fotografía real es el techo del sitio (comprobado).**
De las 40 fotos de `src/assets/work/`, 13 miden 640 px o menos y solo 3 llegan a 1500 px. Varias tienen dominante amarilla y fondo de mesa. Las dos piezas más valiosas, el abanico de Louis Vuitton y la peana de Ron Barceló, tienen fotos de 640–800 px. Ampliadas se ven borrosas: se aprecia en el prototipo C.

**3. La portada es demasiado larga y se repite (comprobado).**
Mide 14.800 px en escritorio y 19.400 px en móvil: unas 23 pantallas de teléfono. Tiene 12 bloques. Tres de ellos cuentan lo mismo con otra forma: «Materiales que trabajamos», «Tres acabados» y «Para empresas y para particulares» son tres índices de los mismos servicios. Las reseñas aparecen en la pantalla 15 de móvil, en letra de 12–13 px.

**4. Las pruebas más fuertes están escondidas (comprobado).**
Louis Vuitton y Ron Barceló son un argumento que casi ningún taller local tiene. Hoy salen como dos filas de una lista de cinco, con miniatura pequeña, tras tres pantallas de scroll.

**5. Todo grita igual (criterio).**
Cada sección abre con un titular en Archivo ancha de peso 800 y tamaño parecido. Sin un nivel intermedio, la página no tiene ritmo: doce titulares del mismo volumen seguidos. Falta contraste entre secciones «de póster» y secciones «de lectura».

**6. Texto de cuerpo pequeño y mucho aire muerto en escritorio (comprobado).**
En 1440 px, los párrafos de «Materiales», «Para empresas y particulares» y el arranque de las páginas de servicio van a 13–14 px, en columnas estrechas junto a grandes zonas vacías. En la cabecera de servicio, media pantalla está vacía.

**7. Palabras partidas con guion en los titulares de móvil (comprobado).**
A 390 px salen «ti-rada», «logoti-po», «diseña-mos», «empre-sas», «tra-bajamos» y «Riba-roja» cortado. DESIGN.md pide dividir con guion antes que desbordar, pero el resultado se lee como un fallo. Hay que bajar el tamaño de ese titular en móvil o desactivar la división.

**8. Qué parece plantilla o hecho por IA (criterio).**
- Las ocho imágenes del punto 1.
- La lupa circular con retícula de la portada: es vistosa, pero no cuenta nada del taller y es un recurso de «web de agencia».
- Frases de relleno de la última tanda de textos, del tipo «Trabajos que hablan por nosotros» o «Tres acabados desde el mismo taller». Las frases anteriores, más concretas, eran mejores.
- El engranaje dibujado junto al texto de presentación: decorativo y sin relación con un láser.

**9. Marcas de terceros (duda legal, no de diseño).**
Aparecen el nombre y el logotipo de Louis Vuitton, el escudo del Valencia CF, Cinco Jotas, Ron Barceló y Casfid. Como referencia de trabajos hechos es habitual, pero conviene confirmar que hay permiso para enseñarlos. **[dueño]**

### 2.3 Comparación con referencias

Las tres primeras las he revisado hoy. Las dos últimas las cito de memoria, sin revisarlas hoy.

| Referencia | Qué hace mejor |
|---|---|
| [Alarco Laser Studio](https://www.alarcolaserstudio.com) (Valencia, competidor) | Enseña 4,9 con 62 reseñas en la portada, logotipos de clientes como Chanel y las medidas útiles de sus máquinas. Responde en una pantalla a «¿me cabe la pieza?» |
| [Corte CNC y Láser](https://cortecncylaser.com/servicio-corte-laser-a-medida) (Valencia, competidor) | Formulario de presupuesto con subida de hasta 3 archivos, lista de formatos aceptados, proceso en cinco pasos y envíos a toda España. Visualmente es peor que Lasercom |
| [Personal Láser](https://www.personalaser.es) (Massamagrell, competidor) | Una página por tipo de trabajo (copas, placas, letras de madera) y páginas locales. Diseño anticuado, pero posiciona por «grabado láser cristal copas Valencia» |
| SendCutSend (EE. UU., de memoria) | Catálogo de materiales con foto real de cada muestra, grosores y usos. Es el modelo del prototipo B |
| Ponoko (de memoria) | El presupuesto empieza subiendo el archivo. El modelo del apartado 5.2 |

Conclusión: en dirección de arte Lasercom ya está por delante de toda la competencia local. Va por detrás en **pruebas visibles** (reseñas, clientes, medidas) y en **facilidad para mandar un encargo con archivo**.

---

## 3. Propuestas de impacto visual

Prototipos en `docs/prototipos/`. Se abren con doble clic en [index.html](prototipos/index.html) o con:

```bash
open /Users/josemariamartinez/y/kaizencode/lasercom-web/docs/prototipos/index.html
```

Son maquetas estáticas, fuera de `src/`. Usan solo fotos, vídeo y textos que ya están en el repositorio. No he podido servirlas en el panel del navegador de la aplicación (se me denegó arrancar un servidor nuevo), así que las he comprobado con un navegador automático a 1440 px y a 390 px: cargan sin errores y sin desbordes.

### 3.0 Primero, el arreglo de rendimiento (no es una propuesta, es una deuda)

Medido hoy con `pnpm lighthouse`, tres pasadas por página:

| Página | Rendimiento | LCP | Límite | Peso |
|---|---|---|---|---|
| `/` | 0,92–0,93 | 3,08–3,16 s | 3,00 s | 8,7 MB |
| `/en/` | 0,92 | 3,15 s | 3,00 s | 8,7 MB |
| `/trabajos/` | 0,94 | 3,00 s | 3,00 s | 0,4 MB |
| `/contacto/` | 0,94 | 2,86–2,93 s | 3,00 s | 0,4 MB |
| Servicio (madera) | 0,98 | 2,33 s | 3,00 s | 0,4 MB |
| Guía (materiales) | 0,98–0,99 | 2,10–2,26 s | 3,00 s | 0,3 MB |

La portada pasaba con 2,6 s antes de la película nueva. Causas probables (supuesto, sin aislar): la imagen de inicio pasó a ser un fotograma de la película con hasta 1920 px, y el vídeo de móvil pasó de 3 a 8 MB.

Cómo pagarlo, por orden:
1. Imagen de inicio propia para móvil (el fotograma vertical ya existe en `src/assets/film/hero-film-m.jpg` y no se usa).
2. Bajar el vídeo de móvil a 720×1280 (unos 4–5 MB) y dejar 1080 px solo para pantallas grandes.
3. Retrasar la descarga del vídeo hasta el primer gesto, sin temporizador.
4. El CSS va en línea en todas las páginas: 97 KB de estilos dentro de cada HTML (páginas de 141–265 KB). Probar `inlineStylesheets: "auto"` y medir.

### 3.1 Propuesta A · Portada de pruebas

[Prototipo](prototipos/a-portada.html) · [captura](capturas/prototipo-a-portada.jpg)

- **Concepto.** La portada pasa de 12 bloques a 6: vídeo con titular, franja de pruebas (2007, Louis Vuitton, Ron Barceló, nota de Google), los dos trabajos estrella a pantalla completa, dos puertas («Soy particular» y «Soy empresa»), reseñas a tamaño de titular, proceso y cierre.
- **Por qué.** Quien llega desde Google decide en dos pantallas. Hoy en esas dos pantallas ve un vídeo, una lupa y una cinta de palabras. Con esto ve quién ha confiado en el taller y por dónde seguir. Las dos puertas resuelven el principio «dos públicos, un sitio» sin repetir tres índices.
- **Material necesario.** Fotos nuevas del abanico y de la peana, si se conservan. **[dueño]** Sin ellas funciona igual, con las tarjetas más pequeñas.
- **Riesgo.** Se pierde texto de la portada (1.740 palabras hoy). Hay que mantener las preguntas frecuentes y un bloque de materiales con enlaces para no perder relevancia. El vídeo con scroll fijo se puede conservar o cambiar por reproducción automática; lo segundo es más ligero y más simple.
- **Esfuerzo.** M. Reutiliza componentes que ya existen.

### 3.2 Propuesta B · Muestrario real

[Prototipo](prototipos/b-muestrario.html) · [captura](capturas/prototipo-b-muestrario.jpg)

- **Concepto.** «Materiales» deja de ser cuatro paneles con imagen de IA y pasa a ser un muestrario: una rejilla de piezas reales, cada una con su etiqueta de muestra (código, nombre, material y técnica), filtrable por material.
- **Por qué.** Sustituye lo falso por lo verdadero y convierte la debilidad (fotos pequeñas sobre fondo blanco) en un recurso: recortadas sobre el tablero con `mix-blend-mode: multiply`, como ya hace el sitio, parecen muestras clavadas en un panel.
- **Material necesario.** Ninguno para empezar. Mejora mucho con una muestra pequeña de cada material fotografiada con la misma luz. **[dueño]**
- **Riesgo.** Bajo. Las fotos con fondo de mesa (piel, maqueta) desentonan junto a las recortadas; habría que recortarlas o corregir el color.
- **Esfuerzo.** M. Los datos ya están en `src/lib/work.ts` con sus filtros.

### 3.3 Propuesta C · Ficha de caso

[Prototipo](prototipos/c-caso.html) · [captura](capturas/prototipo-c-caso.jpg)

- **Concepto.** Cada trabajo tiene su página: foto grande, ficha (material, técnica, unidades, año), cómo se hizo, galería y «pide algo parecido» con el mensaje de WhatsApp ya escrito con ese trabajo como referencia.
- **Por qué.** Son 12 páginas nuevas con contenido que nadie más puede copiar. Sirven para SEO de cola larga («abanico personalizado corte láser», «placas de inventario grabadas», «escudo de falla madera») y como enlace para enviar a un cliente que pregunta por algo parecido. `pnpm trabajo` ya genera los datos de cada trabajo nuevo.
- **Material necesario.** Dos o tres frases del taller por trabajo: qué se pidió, qué era difícil y qué se aprendió. Año y unidades. **[dueño]**
- **Riesgo.** Si se publican con dos frases, son páginas pobres. Mejor empezar por las seis con más historia.
- **Esfuerzo.** M.

### 3.4 Apuesta grande · Sesión de fotos y vídeo en el taller

No es un prototipo, pero es lo que más cambia el resultado. Una tarde con trípode, un fondo liso y una luz:

- Una muestra de cada material, todas con el mismo encuadre.
- Las piezas estrella que se conserven.
- 10–15 segundos de cada máquina trabajando, incluida la de metal, que hoy no sale en ningún sitio.
- La fachada, el interior y a tu tío trabajando. Hoy no hay ninguna persona en toda la web.

Con ese material se rehace la película de portada con las dos máquinas reales, se retiran las imágenes de IA sin perder nada y las fichas de caso lucen.

### 3.5 Retoques que no necesitan decisión

- Quitar la división con guion de los titulares en móvil o bajar su tamaño.
- Subir el cuerpo de texto a 16–17 px en escritorio.
- Un nivel de titular intermedio (peso 600, ancho normal) para las secciones de lectura.
- Quitar la lupa circular si se adopta la propuesta A.

---

## 4. SEO

### 4.1 Técnica (comprobado sobre `dist/`)

| Aspecto | Estado |
|---|---|
| Títulos | 47–67 caracteres, únicos. Uno pasa de 65: la guía de marcado industrial en inglés (67) |
| Descripciones | 98–160 caracteres, únicas |
| Encabezados | Un `h1` por página. Los `h2` del pie («Servicios», «Lasercom», «Contacto») se repiten en todas: mejor que no sean encabezados |
| `hreflang` | `es`, `en` y `x-default` en todas las páginas bilingües |
| Canónicas | Correctas |
| Sitemap | 45 URL, con alternativas de idioma |
| `robots.txt` | Correcto, con sitemap |
| Datos estructurados | `LocalBusiness` en todas; `Service` y `FAQPage` en servicios; `Article` en guías; `BreadcrumbList`; `WebSite` en portada |
| Imágenes | Todas con texto alternativo |
| Redirecciones | 19 reglas. Las 11 URL del WordPress actual existen con la misma dirección en la web nueva |
| Texto por página | Servicios 675–800 palabras, guías 640–1.100, portada 1.740 |

Mejoras, por orden de valor:

1. **Imagen para compartir única.** Todas las páginas usan la misma `og-image.jpg`. Cada servicio, guía y trabajo debería llevar su foto.
2. **`og:type`** es `website` también en las guías; debería ser `article`.
3. **Datos estructurados que faltan:**
   - `LocalBusiness` no enlaza los servicios. Añadir `hasOfferCatalog` o `makesOffer` apuntando a cada `Service`.
   - Las fichas de caso (propuesta C) pueden llevar `CreativeWork` o `Article` con `image`.
   - No añadir `aggregateRating` propio en `LocalBusiness`: Google no muestra estrellas de reseñas que el negocio publica sobre sí mismo.
   - `sameAs` solo apunta a Google Maps. Añadir redes sociales si existen. **[dueño]**
4. **Peso del HTML.** 97 KB de CSS en línea por página (ver 3.0).
5. **Páginas `prototipo/` y `en/prototype/`** se publican con `noindex`. Si son un experimento, mejor no publicarlas.
6. **`/impresion-corte-grabado-laser-madera/`** arrastra «impresión» del WordPress. Mantener la URL: posiciona y no merece una redirección.
7. **Enlazado interno.** Las guías enlazan a servicios y entre sí. Falta el camino inverso con texto descriptivo dentro del cuerpo de los servicios, y enlaces de «Trabajos» a los servicios por material (ya hay uno por trabajo).

### 4.2 Qué posiciona hoy y no debemos perder

No tengo acceso a Search Console, así que esto son búsquedas hechas hoy en Bing España desde aquí. Google puede diferir. **[dueño: acceso a Search Console]**

| Búsqueda | Posición de lasercom.es en Bing | Quién más sale |
|---|---|---|
| grabado láser Valencia | 2.ª | alarcolaserstudio.com, personalaser.es, cortecncylaser.com |
| corte láser Valencia madera metacrilato | 1.ª | cortecncylaser.com, activeworks.es, imaginrotulacion.es |
| marcado láser Valencia | 1.ª | alarcolaserstudio.com, cutlens.com, bozzetti.es |
| grabado láser cristal copas Valencia | 6.ª | personalaser.es, grabadodecopas.es, cristalgrabado.es |
| corte láser metacrilato Valencia | no sale | metacrilarte.com, cortecncylaser.com |
| grabado láser joyas Valencia | no sale | grabadosroivival.com, thegoldentagve.com |
| regalos personalizados grabado láser Valencia | no sale | regalograbado.com, personalaser.es |
| letras corpóreas Valencia corte láser | no sale | rotulosvalencia.com, deconeon.com |
| detalles de boda personalizados madera Valencia | no sale | mariartnatural.es, menudasletras.es |

Lo que hay que proteger en la migración:

- **El título de la portada.** El actual es «Corte láser Valencia. Grabado láser Valencia. Marcado láser». El nuevo, «Corte y grabado láser en Valencia | Lasercom, desde 2007», pierde «marcado láser», que es justo una búsqueda donde hoy sale primero. Propuesta: «Corte, grabado y marcado láser en Valencia | Lasercom».
- **Las 11 URL**, que ya se conservan.
- **El texto de la portada sobre marcado.** Comprobar que la portada nueva sigue nombrando «marcado láser» en un encabezado.
- Dar de alta la web nueva en Search Console y Bing Webmaster antes del cambio de dominio, y comparar clics las cuatro semanas siguientes.

Nota: existe una web en Wix con el nombre Lasercom que es de otra empresa, de Ecuador. No afecta.

### 4.3 Mapa palabra clave → página

No tengo datos de volumen de búsqueda; el orden es por intención de compra y por lo que he visto en los resultados. **[dueño: Search Console o Google Ads para volúmenes]**

| Búsqueda | Intención | Página | Estado |
|---|---|---|---|
| corte láser Valencia, grabado láser Valencia, marcado láser Valencia | Contratar | `/` | Bien. Recuperar «marcado» en el título |
| corte láser madera Valencia, grabado en madera personalizado | Contratar | `/impresion-corte-grabado-laser-madera/` | Bien |
| corte láser metacrilato Valencia, metacrilato a medida | Contratar | `/corte-grabado-laser-cristal-metacrilato/` | Floja: mezcla cristal y metacrilato. Ver abajo |
| grabado de copas Valencia, copas grabadas boda | Contratar | hoy la misma de metacrilato | **Falta** página propia de cristal |
| grabado láser metal, placas grabadas, tarjetas metálicas | Contratar | `/corte-grabado-laser-metal-acero/` | Bien |
| marcado láser piezas, números de serie, QR en metal, trazabilidad | Contratar (empresa) | `/marcado-laser-industrial/` + guía | Bien |
| grabar pulsera Valencia, grabado joyas, grabar anillo | Contratar, a menudo urgente | `/grabado-laser-joyeria/` | Bien, pero no posiciona: necesita reseñas y la palabra «urgente» si es cierto **[dueño]** |
| chapa perro grabada, placa mascota | Contratar | ninguna | **Falta** (hay foto real) |
| detalles de boda madera, regalos invitados personalizados | Contratar | `/regalos-personalizados-bodas-eventos/` | Competida por tiendas online. Reforzar con casos reales |
| regalos de empresa personalizados, merchandising grabado | Contratar (empresa) | `/merchandising-grabado-laser-empresas/` | Bien |
| letras corpóreas, letras de madera, rótulo metacrilato | Contratar | `/letras-corporativas-corte-laser/` | Dominada por rotulistas. Ángulo propio: letras pequeñas y de interior |
| grabado piel, cartera grabada, cinturón grabado | Contratar | `/corte-grabado-laser-piel-cuero/` | Bien |
| trofeos personalizados Valencia, placas conmemorativas | Contratar | ninguna | **Falta** si el taller los hace **[dueño]** |
| escudo de falla madera, detalles falleros | Contratar, estacional | ninguna (hay un trabajo) | **Falta**: oportunidad local muy clara |
| maquetas corte láser, piezas para arquitectura | Contratar | `/corte-laser-decoracion/` | Floja para maquetas |
| qué materiales se pueden cortar con láser, diferencia corte y grabado, preparar archivo láser | Informarse | guías | Bien |
| precio grabado láser, cuánto cuesta corte láser | Informarse, cerca de comprar | pregunta frecuente | **Falta** una guía de «qué influye en el precio», sin cifras |

Páginas que propongo crear, por orden:

1. **Grabado en cristal y copas**, separada de metacrilato. Hay fotos reales y es una búsqueda con intención clara donde ya se sale 6.º.
2. **Chapas y placas para mascotas.**
3. **Fallas y fiestas**: escudos, detalles falleros, comuniones. Local y estacional. **[dueño: qué hacen cada año]**
4. **Trofeos y placas conmemorativas**, si los hacen. **[dueño]**

### 4.4 SEO local

Por orden de retorno:

1. **Reseñas.** Con 6 reseñas se compite contra perfiles de 60. El sistema de seguimiento de presupuestos ya avisa de pedir la reseña cuando un trabajo pasa a «Entregada»; falta el enlace (`REVIEW_URL` en `automation/seguimiento/Code.gs`). Objetivo razonable: una reseña por cada tres o cuatro entregas. Añadir un cartel con QR en el mostrador. **[dueño]**
2. **Perfil de Empresa de Google** **[dueño: acceso]**
   - Categoría principal y secundarias (servicio de grabado, corte por láser, rotulación si aplica).
   - Lista de servicios con los mismos nombres que la web.
   - Fotos nuevas de la sesión, y una al mes.
   - Publicaciones: cada trabajo nuevo de `pnpm trabajo` puede salir también como publicación.
   - Enlace del perfil a la portada con parámetros de campaña para medirlo.
3. **Citas.** Mismo nombre, dirección y teléfono que `business.ts` en Páginas Amarillas, QDQ, Cylex, Bing Places y Apple Business Connect. Hoy aparece en algún directorio menor.
4. **Páginas por municipio: no.** Diez páginas iguales cambiando «Paterna» por «Manises» son páginas puerta. Alternativa honrada: una sola página «Dónde estamos y a quién atendemos», con cómo llegar desde Valencia y desde el polígono, y los municipios en texto. Si hay trabajos reales para clientes de un municipio, se nombran en su ficha.
5. **Páginas por sector: sí, pocas.** Hostelería (copas, cartas, posavasos), bodas, fallas e industria, cada una con trabajos reales. Solo donde haya al menos tres trabajos que enseñar.

---

## 5. Blog

### 5.1 Decisión: ampliar las guías, sin blog aparte

- Las guías ya son un blog bien resuelto: colección de contenido, `Article`, tiempo de lectura, fecha de actualización y enlaces a servicios.
- `/blog/` y `/blog-2/` ya redirigen a `/guias/`.
- Un blog aparte obligaría a publicar con frecuencia. Un taller no tiene noticias cada semana, y un blog parado desde hace un año resta confianza.
- Dos secciones de contenido competirían entre sí por las mismas búsquedas.

Lo que sí cambiaría:

- **Tres tipos de pieza** dentro de `/guias/`, con filtro: «Guías» (cómo elegir y preparar), «Ideas» (qué se puede hacer para una boda, una empresa, una falla) y «Casos» (enlazan a las fichas de trabajo de la propuesta C).
- **Autor visible.** Una línea «Revisado por Vicente, del taller», con `author` en los datos estructurados. **[dueño: que las revise de verdad]**
- **Fecha de revisión real**, no la del día de la build.

### 5.2 Calendario de las primeras 12 piezas

Las seis guías actuales cubren: corte o grabado, materiales, preparar archivo, marcado industrial, joyas y bodas. Estas son las siguientes, una cada dos o tres semanas.

| # | Pieza | Búsqueda | Intención | Empuja a |
|---|---|---|---|---|
| 1 | Qué influye en el precio de un grabado láser (sin cifras) | precio grabado láser, cuánto cuesta corte láser | Informarse antes de pedir | Presupuesto |
| 2 | Grabar copas y botellas: qué cristal sirve y cómo queda | grabado de copas, botella grabada | Contratar | Cristal |
| 3 | Metacrilato cortado a láser: grosores, colores y cantos | corte metacrilato a medida | Contratar | Metacrilato |
| 4 | Ideas de detalles falleros en madera | escudo falla madera, detalles falleros | Contratar, estacional (publicar en noviembre) | Fallas |
| 5 | Regalos de empresa grabados: qué funciona en tiradas cortas | regalos empresa personalizados Valencia | Contratar (empresa) | Merchandising |
| 6 | Placas de características y de inventario: qué poner y en qué metal | placa características grabada, placas inventario | Contratar (empresa) | Marcado industrial |
| 7 | Grabar un objeto que ya tienes: qué se puede y qué no | grabar reloj, grabar termo, grabar cuchillo | Contratar | Personalizado |
| 8 | Chapas de mascota grabadas: qué datos poner | chapa perro grabada | Contratar | Mascotas |
| 9 | Madera para láser: contrachapado, DM o maciza | madera para corte láser | Informarse | Madera |
| 10 | Letras y logotipos para interior: materiales y fijación | letras de madera pared, logotipo metacrilato | Contratar | Letras |
| 11 | Grabado en piel: qué pieles marcan bien | grabar cartera piel, cuero grabado | Contratar | Piel |
| 12 | Detalles de comunión y bautizo grabados | detalles comunión personalizados | Contratar, estacional (publicar en febrero) | Bodas y eventos |

Cada pieza necesita datos del taller para no ser relleno: qué grosores trabajan, qué materiales rechazan, qué suelen pedir. **[dueño]** En el orden he puesto primero las que se pueden escribir con lo que ya está en el repositorio.

### 5.3 Cómo mantenerlo con poco esfuerzo

- **Mismo método que `pnpm trabajo`.** Tu tío manda tres o cuatro notas de voz o frases por WhatsApp sobre el tema; se redacta el borrador en una sesión, en los dos idiomas; él lo revisa y se publica.
- **Regla de publicación.** No sale ninguna pieza sin al menos una foto real y un dato que solo sabe el taller.
- **Revisión anual.** Una vez al año se repasan las fechas y se retira lo que haya dejado de ser cierto.
- **Medición.** Con el informe de Search Console (5.2) se ve qué guías traen visitas y cuáles acaban en presupuesto.

---

## 6. Funcionalidades nuevas

### 6.1 Las que propongo, por orden

| Funcionalidad | Valor | Esfuerzo | Depende de | Datos del dueño |
|---|---|---|---|---|
| **Subida de archivo en el presupuesto** | Alto. El cliente de empresa quiere mandar su PDF o DXF. Hoy solo puede por WhatsApp o correo | M | Un destino para el archivo: el Apps Script que ya existe puede guardarlo en Drive | Cuenta de Google del taller; tamaño máximo |
| **Comprobación previa del archivo** | Medio-alto. Avisa en el navegador: ¿es vectorial?, ¿tiene textos sin trazar?, ¿qué medidas tiene? Ahorra idas y vueltas | M | La subida de archivo. Se hace en el navegador, sin servidor, para SVG, PDF y DXF | Medidas útiles de las máquinas, para avisar si no cabe |
| **Ficha de caso** (propuesta C) | Alto | M | — | Historia de cada trabajo |
| **Galería filtrable por material y sector** | Medio. La de «Trabajos» ya filtra por material; falta sector | S | — | — |
| **Reseñas de Google al día** | Alto. Hoy son tres citas escritas a mano y un «4,5» fijo en `business.ts` | S–M | Places API en la build, o actualización manual mensual | Acceso al perfil |
| **Analítica de clics sin cookies** | Alto para decidir. Hoy no se sabe qué botón trae presupuestos: WhatsApp, teléfono o formulario | S | Un servicio sin cookies (Plausible, Umami) o eventos propios al Apps Script | Aceptar un coste pequeño mensual, o alojarlo |
| **Informe mensual de Search Console** | Medio. Un correo con las búsquedas que suben y bajan | S | Acceso a Search Console | Acceso |
| **Campañas de temporada** | Medio-alto. Fallas, comuniones, bodas, Navidad de empresa: una franja en la portada y una pieza de guía, programadas por fecha | S | Calendario | Qué temporadas le importan y con cuánta antelación |
| **«Dónde estamos y a quién atendemos»** | Medio en SEO local | S | — | Cómo llegar dentro del recinto |
| **Medidas y materiales que entran** | Alto. Es la primera pregunta de un cliente técnico y la competencia la contesta | S | — | **Medidas útiles y grosores** de cada máquina |
| **Vista previa del grabado** (ya existe en `/prototipo/`) | Medio para particulares: escribir un nombre y verlo sobre madera o metal | M para terminarlo | Decidir si se publica | Tipografías que ofrece |

### 6.2 Las que descarto

- **Calculadora de precio.** PRODUCT.md dice que no se publican precios, y un estimador sin datos reales inventaría cifras.
- **Chat o asistente con IA.** El WhatsApp ya es el chat, lo contesta una persona y es donde se cierra la venta. Un asistente podría prometer plazos o precios que nadie ha dado.
- **Tienda online.** Es otro negocio: catálogo, existencias, envíos y devoluciones.
- **Configurador de piezas en 3D.** Mucho esfuerzo para un taller a medida; la vista previa del grabado cubre la parte útil.
- **Área de cliente con seguimiento del pedido.** El volumen no lo justifica; la hoja de Google ya hace el seguimiento interno.
- **Reserva de cita online.** El taller pide que se llame antes de ir; un calendario añade una herramienta más que mantener.

---

## 7. Hoja de ruta

### Tanda 1 · Arreglos rápidos (días)

1. Rendimiento de la portada: imagen de inicio de móvil y vídeo de móvil más ligero, hasta que `pnpm lighthouse` pase.
2. Título de la portada con «marcado láser».
3. Titulares de móvil sin palabras partidas; cuerpo de texto a 16–17 px en escritorio.
4. `og:type` de las guías e imagen para compartir por página.
5. Pies de página sin `h2`.
6. Decidir qué se hace con `/prototipo/`.
7. Enlace de reseñas en el seguimiento, en cuanto haya acceso al perfil. **[dueño]**
8. Analítica de clics sin cookies.

### Tanda 2 · Mejoras de fondo (dos a cuatro semanas)

1. Muestrario real en lugar de las imágenes de IA (propuesta B).
2. Portada de pruebas (propuesta A).
3. Página de cristal y copas separada de metacrilato; página de mascotas.
4. Subida de archivo en el presupuesto.
5. Guías 1 a 4 del calendario.
6. Perfil de Empresa de Google al día y citas. **[dueño]**
7. Página de medidas y materiales. **[dueño]**

### Tanda 3 · Apuestas grandes (uno a tres meses)

1. Sesión de fotos y vídeo en el taller. **[dueño]**
2. Película de portada nueva con las dos máquinas reales.
3. Fichas de caso (propuesta C), empezando por seis.
4. Comprobación previa del archivo.
5. Páginas por sector y por temporada: fallas, hostelería, industria.
6. Resto del calendario de guías e informe mensual de Search Console.

---

## 8. Preguntas para tu tío

**Máquinas y capacidad**
1. ¿Qué medidas útiles tiene cada máquina (ancho, largo y alto de pieza)?
2. ¿Qué grosores corta en madera y en metacrilato?
3. Con metal: ¿solo marca y graba, o corta chapa fina? La web tiene una pregunta frecuente («¿También cortáis chapas metálicas a medida?») con una respuesta que no dice ni sí ni no.
4. ¿Hay materiales que no acepta?

**Servicio**
5. ¿Hace encargos urgentes? ¿Se puede decir en la web?
6. ¿Envía fuera de Valencia o solo recogida en el taller?
7. ¿Manda siempre una prueba visual antes de grabar? La web lo afirma en la página de bodas y eventos.
8. ¿Hace trofeos, placas conmemorativas, chapas de mascota y detalles falleros de forma habitual?
9. ¿Qué temporadas le traen más trabajo y con cuánta antelación piden?

**Pruebas**
10. ¿Conserva el abanico de Louis Vuitton, la peana de Ron Barceló u otras piezas para fotografiarlas?
11. ¿Tiene permiso para enseñar los nombres y logotipos de Louis Vuitton, Ron Barceló, Valencia CF, Cinco Jotas y Casfid?
12. De cada trabajo de la página: año aproximado, cuántas unidades y qué fue lo difícil.
13. ¿Otros clientes conocidos que se puedan nombrar?

**Accesos**
14. Acceso al Perfil de Empresa de Google (enlace de reseñas, categorías, fotos).
15. Acceso a Search Console del dominio actual, o al WordPress para darlo de alta.
16. ¿Tiene redes sociales del taller?
17. Cuenta de Google del taller para la hoja de seguimiento y para recibir archivos.

**Disposición**
18. ¿Puede dedicar una tarde a fotos y vídeo en el taller?
19. ¿Revisaría él las guías antes de publicarlas, con su nombre como autor?

---

## Fuentes

- Búsquedas en Bing España, 15 de noviembre de 2026, desde el navegador de la sesión.
- [Alarco Laser Studio](https://www.alarcolaserstudio.com)
- [Corte CNC y Láser, corte a medida](https://cortecncylaser.com/servicio-corte-laser-a-medida)
- [Personal Láser](https://www.personalaser.es)
- [Sitemap del WordPress actual](https://lasercom.es/page-sitemap.xml)
- Build local (`dist/`), `pnpm lighthouse` (informes en `.lighthouseci/`) y metadatos de `src/assets/editorial/` leídos con exiftool.
