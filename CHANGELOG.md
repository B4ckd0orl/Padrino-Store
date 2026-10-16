# Changelog — Padrino Store

Cada release de GitHub usa este archivo como cuerpo (`body`) del release.
El diálogo de actualización en la app lo parsea y muestra como lista.

**Formato:** una línea por cambio. El CI toma todo el archivo salvo la sección
"Archivo" (historial) y lo publica como notas del release.

---

## Próxima release

### Bienvenida
- Eliminados los códigos QR de la primera apertura
- Nueva pantalla de bienvenida con mensaje de agradecimiento y links a Telegram y X
- Identidad del repo reiniciada a v0.1

### Música
- Música lo-fi de fondo ("Morning Coffee" de HoliznaCC0, CC0 / dominio público)
- Suena en loop durante toda la estadía en la tienda
- Volumen bajo para no molestar al navegar

### Interfaz
- Logo del sidebar: solo el icono (antes el texto "padrino" se comprimía y se veía distorsionado)
- Sidebar: etiquetas en oro al enfocar cada ícono (antes no aparecían)
- Ajustes: filas de Idioma, Datos y Vibración ahora muestran sus textos (bug `children` que no renderizaba)
- Filas seleccionadas en Idioma: texto oscuro sobre el oro (legibilidad)

### Antes de descargar
- Diálogo de tips renovado estilo Padrino (no el aspecto Overdrive)
- Badge de tipo de fuente: "Descarga directa" / "Se abre en el navegador"
- Tips en cards con borde y acento dorado
- Notas de fuente con icono y contorno

### Actualizaciones
- El changelog del release se muestra como lista con viñetas doradas
- Scroll si el changelog es largo (antes se cortaba a 4 líneas)
- Cada release de GitHub ahora incluye este archivo como notas

---

## Archivo

### v1.12
- Rediseño de consola: QR, KPI strip, Ajustes full-screen, icon rail
- Mover juegos a drive externo

### v1.11
- README profesional con métodos de instalación dual

### v1.10
- Rebrand visual al source (CI), paleta macOS Dark, sol + palmera
- Fix ShadowMount (titleId PPSA99059)
- Sync upstream v1.0.4, feature C3 Backup, persiano
