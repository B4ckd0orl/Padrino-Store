# Changelog — Padrino Store

Cada release de GitHub usa este archivo como cuerpo (`body`) del release.
El diálogo de actualización en la app lo parsea y muestra como lista.

**Formato:** una línea por cambio. El CI toma todo lo que hay bajo
"Próxima release" hasta "## Archivo" y lo publica como notas del release.

---

## Próxima release

### Tienda
- Catálogo ampliado: 935 juegos y 151 ediciones más (3.998 fichas en total), sin perder ninguna de las que ya había
- El catálogo se puede actualizar por la red: la app busca en segundo plano novedades publicadas y las aplica sola en el siguiente arranque, sin que ninguna lista cambie mientras la usas
- Las fichas que solo tenían enlaces caídos dejan de aparecer en las listas: solo se muestran juegos que de verdad se pueden descargar
- "Brain Training", "Quiz" y "Board Game" se unen a la tarjeta "Educational" de Géneros populares; los géneros sin dibujo propio siguen siendo filtro pero ya no abren tarjeta
- Corregida la cuadrícula de Homebrew: con el menú lateral se salía de pantalla y las filas se solapaban
- CUSA04384 (Lovers in a Dangerous Spacetime) recibió sus tres capturas en la página del juego

### Descargas
- Los juegos en PKG pueden bajarse en segundo plano: la consola los descarga con su propio gestor mientras usas la PS5 para otra cosa
- Antes de empezar un PKG, un diálogo pregunta dónde se descarga (en la app o en segundo plano) y una opción recuerda la elección; nuevo ajuste "Descargas de PKG" en Ajustes para cambiarla
- Si la consola rechaza un enlace, la app lo sirve con su propio servidor en la red local (o 127.0.0.1) y, si tampoco así, lo baja ella sola; ese servidor mantiene el enlace vivo aunque la app se cierre
- Una descarga pausada en un disco USB se reanuda aunque la consola le dé otro número al reiniciar
- Mejoras de extracción e identificación de archivos: progreso por cabeceras reales, extracción de longitud desconocida con barra completa, contraseñas RAR5 que faltan o están mal con aviso propio, falta de espacio explicada y el destino al terminar
- La cola de descargas guarda y recupera su estado completo entre sesiones
- La fila de descarga marca "Enviado a la PS5" cuando el paquete lo baja la propia consola, en vez de decir "Instalado" antes de tiempo
- Un archivo del catálogo etiquetado como "binary" pero nombrado PKG o Fpkg se trata como paquete a la hora del límite de firmware 11.60

### Red
- Los enlaces HTTPS se validan también en consolas con firmware antiguo: la app lleva el almacén de certificados de Mozilla junto al del sistema y los une al arrancar, así sitios como GitHub o los servidores de portadas dejan de fallar por certificados que el firmware viejo nunca recibió; si algo falla se usa solo el del sistema, como hasta ahora

### Idiomas
- Neerlandés (18 idiomas en total)
- Los plurales de portugués de Portugal y del chino tradicional ahora siguen sus reglas correctas

## Archivo

El historial de versiones anteriores vive en las releases de GitHub
(https://github.com/B4ckd0orl/Padrino-Store/releases).
