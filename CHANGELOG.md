# Changelog — Padrino Store

Cada release de GitHub usa este archivo como cuerpo (`body`) del release.
El diálogo de actualización en la app lo parsea y muestra como lista.

**Formato:** una línea por cambio. El CI toma todo el archivo salvo la sección
"Archivo" (historial) y lo publica como notas del release.

---

## Próxima release

### Descargas
- Cada fuente indica ahora su formato y qué hace la consola con él: "RAR · Extraer", "PKG · Instalar", "EXFAT · Montar imagen"
- El formato se lee del propio enlace y de la etiqueta cuando el catálogo no lo declara, así que más fuentes se muestran con nombre
- Donde el formato no se puede saber de antemano se dice "Desconocido" y los tips previos a la descarga avisan que se confirma al iniciar la descarga

### Juegos nuevos
- +2915 juegos nuevos implementados en la tienda, con su ficha y sus fuentes de descarga

### Instalación PKG
- Los paquetes PKG se instalan automáticamente al terminar la descarga, sin pasos manuales

### Auto instalación de .binary
- Los archivos .binary se reconocen por su cabecera: si son un paquete PS5 se renombran e instalan solos

### Info
- Nueva pantalla Info en el sidebar con el mensaje de Gran Padrino y los avisos sobre firmware y carátulas
- Enlaces de Telegram y X que abren el navegador de la consola

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
