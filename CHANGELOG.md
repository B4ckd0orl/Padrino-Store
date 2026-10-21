# Changelog — Padrino Store

Cada release de GitHub usa este archivo como cuerpo (`body`) del release.
El diálogo de actualización en la app lo parsea y muestra como lista.

**Formato:** una línea por cambio. El CI toma todo el archivo salvo la sección
"Archivo" (historial) y lo publica como notas del release.

---

## Próxima release

### Carátulas
- Se restauraron más de 5.000 portadas de respaldo que se habían perdido: si una portada principal falla o tarda, ahora aparece otra automáticamente
- Las portadas en formato webp que no cargaban en la consola ahora se muestran correctamente
- Se corrigió el fallo de la v1.22 donde muchas portadas desaparecían y solo quedaba el título

---

## Archivo

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
