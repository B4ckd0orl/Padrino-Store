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
