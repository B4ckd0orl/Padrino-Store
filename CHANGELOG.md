# Changelog — Padrino Store

Cada release de GitHub usa este archivo como cuerpo (`body`) del release.
El diálogo de actualización en la app lo parsea y muestra como lista.

**Formato:** una línea por cambio. El CI toma todo lo que hay bajo
"Próxima release" hasta "## Archivo" y lo publica como notas del release.

---

## Próxima release

### Tienda
- Corregido el kernel panic durante la actualización: la imagen vuelve a usar clusters de 64K, la única geometría con la que la consola lleva varias versiones sin dar problemas; la anterior (8K) dejaba la actualización colgada y reiniciaba la PS5
- Corregida la selección en Ajustes → Descargas: los botones de opción (velocidad, disco, borrar PKGs, modo PKG, vibración) ahora muestran el foco al navegar, que antes quedaba recortado y no se veía cuál estaba seleccionado

## Archivo

El historial de versiones anteriores vive en las releases de GitHub
(https://github.com/B4ckd0orl/Padrino-Store/releases).
