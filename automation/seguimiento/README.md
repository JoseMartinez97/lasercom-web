# Seguimiento de presupuestos

Cada petición del formulario de presupuesto de la web se guarda en una hoja de Google del taller. Cada mañana llega **un solo correo** con lo pendiente:

- **Sin contestar**: peticiones que siguen como «Nueva» desde el día anterior.
- **Presupuestos por seguir**: estado «Presupuestada» desde hace 3 días o más.
- **Pedir reseña**: estado «Entregada» desde hace 2 días o más.

En los dos últimos casos el correo trae el mensaje para el cliente ya escrito, en su idioma, y un botón que abre WhatsApp con él. **Nunca se envía nada al cliente de forma automática**: solo sale si se pulsa el botón. Cada petición aparece como mucho 2 veces en el resumen, con 4 días de separación; al cambiar su estado empieza de nuevo.

## Cómo se usa en el día a día

1. Llega un WhatsApp o un correo desde la web. Al final del mensaje va su referencia, por ejemplo `(Ref. L261115-4K7)`, y la misma fila está ya en la hoja.
2. Ve cambiando el **Estado** de la fila: Nueva → Contestada → Presupuestada → Aceptada → Entregada → Reseña pedida (o Perdida). La fecha se apunta sola.
3. Si quieres el botón de WhatsApp en el correo, pega el teléfono del cliente en la columna **Teléfono** (lo tienes en el chat; busca la referencia).

La web solo guarda lo que el cliente escribe en el formulario y su nombre. El teléfono o el correo los añade el taller si quiere.

## Puesta en marcha (una vez, con la cuenta de Google del taller)

1. Crea una hoja de cálculo nueva en Google Drive, por ejemplo «Lasercom · peticiones».
2. Abre **Extensiones → Apps Script**, borra lo que haya y pega todo el contenido de `Code.gs`. Guarda.
3. En el desplegable de funciones elige `setup` y pulsa **Ejecutar**. Google pedirá permisos para la hoja, para enviar correo y para los activadores; acéptalos. Se crea la pestaña «Peticiones» con sus columnas, el resumen diario (8:00, hora de Madrid) y el apunte de fechas.
4. **Implementar → Nueva implementación → Aplicación web**:
   - Ejecutar como: **yo**
   - Quién tiene acceso: **cualquier usuario**

   Copia la dirección que termina en `/exec`.
5. En la web, pega esa dirección en `src/lib/leads.ts` (`leadsUrl`) y publica. Desde ese momento el formulario guarda las peticiones y añade la referencia al mensaje. Mientras esté vacía, el formulario funciona como siempre.

Para probarla, haz una petición desde la web y comprueba que aparece la fila.

## Pendiente

- **TODO, enlace de reseñas**: cuando tengas acceso al Perfil de Empresa de Google, en «Pedir reseñas» copia el enlace (`g.page/r/…`) y pégalo en `REVIEW_URL`, al principio de `Code.gs`. Después vuelve a implementar el script. Hasta entonces el resumen avisa de pedir la reseña, pero sin enlace.
- **Política de privacidad**: revisa que cubra guardar las peticiones de presupuesto en Google (Google actúa como encargado del tratamiento).

## Cambiar el comportamiento

Al principio de `Code.gs`, en `CONFIG`:

- `EMAIL`: a quién va el resumen. Vacío significa el dueño de la hoja.
- `UNANSWERED_DAYS`, `FOLLOW_UP_DAYS` y `REVIEW_DAYS`: los días antes de cada aviso.
- `MAX_REMINDERS` y `REMIND_EVERY_DAYS`: cuántas veces sale cada petición en el resumen y cada cuántos días.

Las pruebas de la lógica se lanzan con `node automation/seguimiento/test.mjs`, y también forman parte de `pnpm test`.
