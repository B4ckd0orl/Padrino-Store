# Changelog — Padrino Store

Cada release de GitHub usa este archivo como cuerpo (`body`) del release.
El diálogo de actualización en la app lo parsea y muestra como lista.

**Formato:** una línea por cambio. El CI toma todo el archivo salvo la sección
"Archivo" (historial) y lo publica como notas del release.

---

## Próxima release

### Descargas
- Se actualizaron los enlaces de descarga y se quitaron los que ya no funcionaban
- Hay muchos más juegos con descarga: +2915 juegos nuevos con su ficha y sus enlaces
- Los enlaces dicen ahora qué tipo de archivo son (RAR, PKG, imagen) y cómo usarlos
- Los PKG se instalan solos al terminar la descarga, sin pasos manuales
- Los títulos sin enlace válido ya no muestran fuentes que fallan

### Carátulas
- Se arreglaron las portadas: todas las fichas tienen portada y ninguna sale deformada
- Se sustituyeron portadas rotas o que no correspondían al juego
- Se retiraron imágenes que ya no cargaban
- Muchas portadas se cambiaron por una versión más grande y nítida

### Tienda
- Se mejoró la velocidad y la estabilidad de la app
- Nueva pantalla Info con el mensaje del Gran Padrino y los enlaces de Telegram y X
- Tetris Ultimate, SingStar Celebration, Maneater y Goosebumps: Dead of Night vuelven a la tienda
- Se corrigieron unas 1.750 fichas que tenían el desarrollador o la editorial revueltos

### Comprobaciones
- El catálogo y los enlaces pasan todas las validaciones sin errores
- Cada semana se comprueban solos los enlaces: los que ya no sirven quedan marcados como no disponibles y los que vuelven se activan otra vez

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
