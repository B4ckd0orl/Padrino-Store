# Changelog — Padrino Store

Cada release de GitHub usa este archivo como cuerpo (`body`) del release.
El diálogo de actualización en la app lo parsea y muestra como lista.

**Formato:** una línea por cambio. El CI toma todo el archivo salvo la sección
"Archivo" (historial) y lo publica como notas del release.

---

## Próxima release

### Actualizaciones
- El detector de actualizaciones no se rinde: si el listado oficial no responde a la primera lo reintenta solo y también comprueba un espejo del listado, así la consola se entera de cada versión nueva aunque GitHub falle un momento

### Tienda
- Catálogo ampliado a más de 2.400 juegos revisados y con enlaces activos (2.491 fichas), con las ediciones duplicadas dejando de contar dos veces la misma fila, y con nuestras portadas servidas desde la tienda
- 516 portadas nuevas: el total llega a 5.646, servidas desde la propia tienda
- Nueva fila "Añadidos recientemente" en el inicio y nuevo orden con el mismo nombre en el catálogo, para ver qué entró de último
- Filtro de realidad virtual en el catálogo: PS VR y PS VR2 como opciones propias
- Capturas de cada juego en su página (hasta tres por título), para verlo antes de descargarlo
- Los filtros del catálogo se recalculan de un solo paso: mover los controles responde al instante
- Nueva sección Homebrew: apps y juegos de la comunidad (prosperostore.net), cada uno descargado de la release de su desarrollador y verificado antes de instalarse; ocupa el lugar de "Lanzamientos" en el menú, recuerda dónde estabas al volver, muestra un spinner mientras carga y tiene filtro de Emuladores
- Las tarjetas de género ahora muestran dibujos pixelados en vez de tres portadas: la portada del apartado carga al instante
- "Sports" y "Sport" aparecían como dos tarjetas distintas en Géneros populares: ahora es una sola
- Las portadas dejan de parpadear y de atascar la memoria: solo las que están cerca de donde miras se mantienen cargadas (también la fila bajo "Géneros populares" mientras el foco está en "Te puede gustar"), y si el motor se queda sin espacio una portada reintenta sola en vez de quedarse en blanco
- Botón de información en cada fila de descarga para ir directo a la página del juego
- El orden de fuentes ahora prefiere los hosts que la consola ya confirmó (Vikingfile, DataNodes, FileKeeper) por encima de MediaFire, cuyos archivos suelen caer y que responde 429 cuando está saturada

### Descargas
- Si una descarga se corta, al reanudar la app calcula sola hasta dónde llegó y sigue desde ahí, sin repetir lo ya bajado
- La barra de progreso cuenta bytes reales, tanto al descargar como al instalar
- El progreso de extracción ahora cuenta los archivos extraídos en tiempo real y ya no se queda pegado en el 99 %
- Toda descarga queda identificada aunque venga de un enlace suelto: nombre, tamaño y tipo de archivo se reconocen solos
- Borrado automático de los PKGs ya instalados, con el nuevo ajuste "Borrar PKGs tras instalar" para no llenar el disco
- Si el paquete ya está instalado o no hay nada que extraer, la app lo avisa en lugar de quedarse esperando
- Antes de descargar se comprueba que la carpeta de destino se pueda escribir: si la consola no permite guardar ahí, se avisa enseguida
- Una contraseña incorrecta en archivos RAR5 ahora se detecta y se explica, en vez de un error críptico
- Se corrigió la instalación cuando la release pertenece a otra región: ahora se respeta el título id del paquete
- Las comprobaciones de cabeceras de los archivos se hacen en un hilo aparte: la app ya no se congela durante descargas rápidas
- Se extraen archivos 7z demasiado grandes para la memoria de la app usando el extractor externo (hasta 288 MiB), y los 7z con cabeceras grandes ya no fallan al extraerse
- Los errores de memoria ahora explican qué pasó y qué hacer
- Las descargas de FileKeeper y DataNodes que se quedan a 0 MB/s se reinician solas a los 90 segundos sin recibir datos
- Carpetas "backport" junto al juego ya no se confunden con el juego principal
- Cuando un archivo encontrado espera confirmación, la consola muestra una notificación con el nombre del juego
- El botón "Explorar juegos" de Descargas vacías abre la portada de la tienda, no la última sección visitada

### Idiomas
- Chino tradicional, con su propia fuente para que cada carácter se muestre correctamente, y portugués de Portugal (17 idiomas en total)

---

## Archivo

### v1.24
- Las 5.113 portadas de los juegos se descargaron y ahora viven en la propia tienda: cargan desde un único servidor estable, sin depender de CDNs externos

### v1.23
- Se quitó NBA 2K27 de la tienda
- Se restauraron más de 5.000 portadas de respaldo que se habían perdido: si una portada principal falla o tarda, ahora aparece otra automáticamente
- Las portadas en formato webp que no cargaban en la consola ahora se muestran correctamente
- Se corrigió el fallo de la v1.22 donde muchas portadas desaparecían y solo quedaba el título
- Se revisaron una por una las ~16.000 imágenes de la tienda: todas cargan y están en formatos compatibles con la consola
- Se quitaron más de 3.000 enlaces de portadas de respaldo que ya no funcionaban
- 48 fondos de juegos que dependían de sitios poco fiables ahora se sirven desde un CDN estable y 4 portadas sin respaldo recibieron copia de seguridad

### v1.22
- Se actualizaron los enlaces: +14.000 enlaces nuevos y se quitaron los que ya no funcionaban
- Se mejoró la estabilidad y la velocidad de las descargas: si un enlace falla, la app prueba el siguiente
- Cada semana se comprueban solos los enlaces: los caídos quedan marcados como no disponibles y los recuperados se reactivan
- 33 portadas que eran demasiado grandes para cargar se cambiaron por versiones más ligeras y nítidas
- Muchas portadas se cargan más rápido al volver a entrar en la tienda
- Se corrigieron unas 1.750 fichas que tenían el desarrollador o la editorial revueltos

### v1.9 y anteriores (histórico inicial)
- Eliminados los códigos QR de la primera apertura; nueva pantalla de bienvenida con links a Telegram y X
- Música lo-fi de fondo ("Morning Coffee" de HoliznaCC0, CC0 / dominio público), en loop y a volumen bajo
- Logo del sidebar solo con el icono; etiquetas en oro al enfocar cada ícono
- Ajustes: filas de Idioma, Datos y Vibración con sus textos (bug `children`)
- Diálogo de tips renovado estilo Padrino; badge "Descarga directa" / "Se abre en el navegador"
- Changelog del release como lista con viñetas doradas y scroll

### v1.12
- Rediseño de consola: QR, KPI strip, Ajustes full-screen, icon rail
- Mover juegos a drive externo

### v1.11
- README profesional con métodos de instalación dual

### v1.10
- Rebrand visual al source (CI), paleta macOS Dark, sol + palmera
- Fix ShadowMount (titleId PPSA99059)
- Sync upstream v1.0.4, feature C3 Backup, persiano
