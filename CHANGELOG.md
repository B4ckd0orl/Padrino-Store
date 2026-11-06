# Changelog — Padrino Store

Cada release de GitHub usa este archivo como cuerpo (`body`) del release.
El diálogo de actualización en la app lo parsea y muestra como lista.

**Formato:** una línea por cambio. El CI toma todo lo que hay bajo
"Próxima release" hasta "## Archivo" y lo publica como notas del release.

---

## Próxima release

### Tienda
- 86 juegos nuevos entran en la tienda con su ficha, sus capturas y sus enlaces de descarga
- Los juegos que se habían quedado sin enlaces recuperan los que siguen vivos: 827 enlaces comprobados uno a uno en 522 juegos
- Las tarjetas y las fichas muestran la valoración por estrellas de la PlayStation Store: el promedio con estrella dorada y, en la ficha, cuántas personas la han dado
- La ordenación y la gráfica "Mejor valorado" puntúan con esa valoración ponderada por el número de valoraciones, de modo que 4,9 estrellas de 40 personas no superan a 4,8 de 70 000; sin valoración de la tienda entra el Metacritic
- La pantalla Archivos recuerda el último disco visto: al volver se abre en el mismo mientras siga conectado, y si no, en el primero

### Descargas
- Cuando una fuente responde 429 o 5xx (servidor ocupado o limitando), la cola espera y vuelve a preguntar por su cuenta a los 3 minutos y a los 10, en vez de fallar; solo una tercera negativa seguida falla el trabajo
- Un archivo de menos de 1 KB se rechaza antes de escribirlo: no es ningún juego sino la página de error del host, y se avisa con los bytes exactos que envió

### Red
- Rootz vuelve a estar activo como fuente: sus enlaces se resuelven en la propia app, con un reintento si limita las peticiones y aviso claro si el archivo ya no existe

## Archivo

El historial de versiones anteriores vive en las releases de GitHub
(https://github.com/B4ckd0orl/Padrino-Store/releases).
