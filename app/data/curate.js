// Padrino Store — curación editorial.
// Editá estas listas y recompilá: no hace falta tocar ningún otro archivo.
// Los IDs son del catálogo (PPSA...); un ID inexistente se ignora sin romper nada.

  // Orden FIJO del hero del home (sin barajado).
  var HERO = ["PPSA23226", "PPSA14002", "PPSA18605", "PPSA22327", "PPSA07411", "PPSA04451"];

  // Posiciones fijas al inicio del rail "Popular ahora" (el resto lo rellena el algoritmo).
  var PINNED = {
    popular: ["PPSA02110", "PPSA02262", "PPSA02100", "PPSA04288", "PPSA15246", "PPSA01443"]
  };

  // Ocultos del catálogo, la búsqueda y los rails.
  var HIDDEN = [];

export { HERO, HIDDEN, PINNED };
