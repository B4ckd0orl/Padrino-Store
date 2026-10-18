# Changelog — Padrino Store

Cada release de GitHub usa este archivo como cuerpo (`body`) del release.
El diálogo de actualización en la app lo parsea y muestra como lista.

**Formato:** una línea por cambio. El CI toma todo el archivo salvo la sección
"Archivo" (historial) y lo publica como notas del release.

---

## Próxima release

### Catálogo
- +1555 fuentes de descarga nuevas importadas de un catálogo complementario (rev. 31)
- +414 juegos nuevos (68 PS5 y 346 PS4) con carátula, género, fecha y tamaño
- 449 juegos sin fuentes vivas o con fuentes parciales reciben enlaces de respaldo
- Links de vikingfile con captura directa `/d/` se importan como descarga directa real
- Cada link de archive.org se verificó uno a uno contra su API antes de importar
- Nuevo tool `tools/catalog-import.mjs` para reimportar el catálogo cuando salga una revisión nueva

### Formato visible
- La ficha del juego muestra el formato de la fuente recomendada (FFPFSC, EXFAT, PKG, ZIP...)
- El botón de descarga indica el formato junto al proveedor y el tamaño
- El selector de fuentes y el diálogo "Antes de descargar" muestran el formato real de cada fuente
- Antes solo se veía una categoría genérica ("Imagen"/"Paquete") y los ZIP/RAR/7Z no etiquetaban nada
- "Formato" traducido a los 15 idiomas de la tienda

### Navegación y portada
- Foco de consola visible en todas las listas, con lista virtual para los catálogos largos y salto entre secciones con los gatillos
- Portada con sección "Para ti", Spotlight de grandes títulos y Top charts que rota por género
- La biblioteca abre en "Lanzamientos nuevos" y el buscador vuelve al teclado al borrar

### Ajustes
- Vibración mientras navegas: encendida o apagada, con intensidad al 0, 25, 50, 75 o 100
- Menos opciones de límite de velocidad (sin límite, 5, 10 y 25)
- app.log guarda las últimas 5 sesiones para diagnóstico

### Descargas y extracción
- Sets multi-volumen: solo se ofrecen completos, con validación del último volumen antes de instalar
- Al extraer, la app indica qué carpetas quedaron en el destino
- Paquetes PS5 reconocidos por su cabecera con el título leído del contenido, y el error real de instalación visible en Archivos
- Descargas finalizadas ya no aparecen como error y la cola avanza tras cancelar

### Datos del catálogo
- Sets multi-volumen corregidos: 851 enlaces inválidos retirados y unas 1160 etiquetas de volumen arregladas
- Retirados los sets que no traían su último volumen (esos juegos quedan sin fuentes hasta que aparezca el set completo)
- Fuentes .7z fantasma de Ghost of Yotei retiradas: la consola no las extrae

### Captura en el navegador
- Nuevos hosts en la captura: 1fichier, Datanodes, LinkVault, AkiraBox, FileKeeper y BuzzHeavier
- Captura exacta de vikingfile a través de LinkVault con comprobación del title id
- Solo se capturan enlaces nuevos de la página abierta; los rechazados se descartan y la sesión retoma sin repetirlos
- Nombres de archivo con espacios leídos correctamente

---

## Archivo

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
