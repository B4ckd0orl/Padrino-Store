<p align="center">
  <img src="app/sce_sys/pic0.png" alt="Padrino Store" width="100%">
</p>

<p align="center">
  <b>El catálogo de juegos que va derecho a tu PS5 — sin PC, sin vueltas.</b>
</p>

<p align="center">
  <a href="https://github.com/B4ckd0orl/Padrino-Store/releases/latest"><img src="https://img.shields.io/github/v/release/B4ckd0orl/Padrino-Store?style=for-the-badge&label=release&labelColor=1e1e1e&color=e09f3e" alt="Última release" width="170"></a>
  <a href="https://github.com/B4ckd0orl/Padrino-Store/releases"><img src="https://img.shields.io/github/downloads/B4ckd0orl/Padrino-Store/total?style=for-the-badge&label=downloads&labelColor=1e1e1e&color=e09f3e" alt="Descargas totales" width="185"></a>
  <a href="https://github.com/B4ckd0orl/Padrino-Store/actions/workflows/build.yml"><img src="https://img.shields.io/github/actions/workflow/status/B4ckd0orl/Padrino-Store/build.yml?branch=main&style=for-the-badge&label=build&labelColor=1e1e1e&color=e09f3e" alt="Estado del build" width="160"></a>
</p>

<p align="center">
  <a href="https://github.com/B4ckd0orl/Padrino-Store/releases/latest/download/PadrinoStore.exfat"><img src="https://img.shields.io/badge/Descargar-PadrinoStore.exfat-e09f3e?style=for-the-badge&labelColor=1e1e1e&color=1e1e1e" alt="Descargar PadrinoStore.exfat" width="400"></a>
  <br>
  <sub>Imagen para instalación con ShadowMount+ · También disponible <a href="https://github.com/B4ckd0orl/Padrino-Store/releases/latest/download/update-app.zip"><b>update-app.zip</b></a> para instalación por carpeta</sub>
</p>

---

## Qué es

Padrino Store es una aplicación homebrew para PS5 que funciona como tienda de juegos: navegás un catálogo de más de 2.400 títulos con portadas, puntuaciones y filtros, y los descargás directo al disco de la consola. Sin PC intermedia, sin pasos extra.

---

## Características

<table>
  <tr>
    <td width="50%" valign="top">
      <b>2.400+ juegos</b><br>
      Catálogo con portadas, Metacritic, tamaño y filtros por plataforma, estado y género. Curaduría editorial y destacados semanales.
    </td>
    <td width="50%" valign="top">
      <b>Descargas nativas</b><br>
      Directo al disco interno o a USB. Velocidad en vivo, gráficos de actividad, pausa/reanudar y cola con prioridad.
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <b>Multi-host con fallback</b><br>
      Cada juego trae varias fuentes. Si una cae, la app prueba la siguiente automáticamente.
    </td>
    <td width="50%" valign="top">
      <b>Favoritos y búsqueda</b><br>
      Wishlist persistente, historial de búsquedas y limpieza de archivos desde la pestaña Archivos.
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <b>17 idiomas</b><br>
      Español, English, Deutsch, Français, Português (Brasil y Portugal), русский, 日本語, 中文 (simplificado y tradicional), العربية, हिन्दी, Bahasa Indonesia, Italiano, فارسی, اردو y Bangla.
    </td>
    <td width="50%" valign="top">
      <b>Actualización en-app</b><br>
      Cuando sale versión nueva, la app te avisa. Tocás Install, se cierra sola y ya estás actualizado. Funciona con instalación por imagen y por carpeta.
    </td>
  </tr>
</table>

---

## Requisitos

- **PS5 con jailbreak** corriendo
  **[ShadowMount+](https://github.com/drakmor/ShadowMountPlus)** (para instalación por imagen `.exfat`),
  o acceso FTP a `/data/` (para instalación por carpeta).
- Un **pendrive exFAT** (solo para el método por imagen).

---

## Instalación

Elegí el método según cómo quieras instalar:

<details>
<summary><b>Método A — Imagen .exfat con ShadowMount+ (recomendado)</b></summary>

<br>

1. **Descargá `PadrinoStore.exfat`** desde la
   [última release](https://github.com/B4ckd0orl/Padrino-Store/releases/latest).
   Es el único archivo que necesitás: no lo descomprimas ni le cambies la extensión.

2. **Copialo a un pendrive exFAT**, dentro de una carpeta llamada exactamente `homebrew`
   en la raíz del disco:

   ```text
   Pendrive
   └── homebrew
       └── PadrinoStore.exfat
   ```

3. **Conectá el pendrive a la PS5.** ShadowMount+ detecta el archivo solo, lo monta e
   instala; te avisa con una notificación cuando termina.

4. **Abrí Padrino Store desde la pantalla de inicio.**

> [!TIP]
> ¿Preferís FTP? Subí el `.exfat` al interior de la consola, también a una carpeta
> `homebrew`: `/data/homebrew/PadrinoStore.exfat`.

</details>

<details>
<summary><b>Método B — Carpeta por FTP</b></summary>

<br>

1. **Descargá `update-app.zip`** desde la
   [última release](https://github.com/B4ckd0orl/Padrino-Store/releases/latest).

2. **Conectate por FTP** a tu PS5 y navegá a `/data/homebrew/`.

3. **Extraé el zip** ahí dentro. Debe quedar una carpeta `PPSA99059` con su `eboot.bin`:

   ```text
   /data/homebrew/
   └── PPSA99059/
       ├── eboot.bin
       ├── sce_sys/
       ├── data/
       └── ...
   ```

4. **Abrí Padrino Store desde la pantalla de inicio** (o desde tu launcher de homebrew).

</details>

---

## Actualizaciones

La instalás a mano una sola vez. Después, cuando sale versión nueva, la app te lo avisa
segundos después de arrancar:

1. Se abre un diálogo con el changelog. Tocá **Install**.
2. La app descarga el paquete, lo verifica y lo coloca encima de la versión vieja.
3. Se cierra sola. Volvé a abrirla y ya estás en la nueva.

Funciona igual para instalación por imagen y por carpeta. Necesita unos **600 MB libres**
en el disco donde está instalada.

---

## Funciones internas

- **Backup**: exportá wishlist, historial de búsquedas y favoritos a un archivo JSON; importalos cuando quieras desde Ajustes → Datos.
- **Límite de velocidad**: elegí un tope de descarga desde Ajustes para dejar ancho de banda a otros dispositivos.
- **Interfaz de consola**: Descargas y Ajustes rediseñados con tarjetas, animaciones y panel de actividad en tiempo real.

---

## Solución de problemas

<details>
<summary><b>No veo el icono en la pantalla de inicio</b></summary>

<br>

- Confirmá que **ShadowMount+ esté corriendo** (aparece su notificación al iniciar).
- La carpeta tiene que llamarse **`homebrew`**, en minúsculas y en la **raíz** del pendrive.
- Revisá que el archivo termine en **`.exfat`**: si tu PC esconde extensiones puede haberte
  quedado `PadrinoStore.exfat.zip`, y eso no se instala.
- Esperá un minuto: ShadowMount+ espera a que termine de copiarse antes de montar.

</details>

<details>
<summary><b>Instalé por carpeta y no arranca</b></summary>

<br>

- Verificá que la carpeta se llame **`PPSA99059`** (no `update-app` ni otra).
- Confirmá que **`eboot.bin`** esté en la raíz de esa carpeta, no en un subdirectorio.
- Revisá permisos: el FTP debe haber copiado con lectura/escritura.

</details>

<details>
<summary><b>Padrino Store abre pero la página no carga</b></summary>

<br>

- Suele ser una copia dañada o incompleta de **`PadrinoStore.exfat`**. Borrá el archivo de
  la carpeta `homebrew` **y** el icono de la pantalla de inicio (como arriba), y descargalo
  otra vez desde la [última release](https://github.com/B4ckd0orl/Padrino-Store/releases/latest).
- Copialo de nuevo con **PS5Upload** (o el método que uses) y comprobá que el tamaño del
  archivo coincida con el que figura en GitHub.

</details>

<details>
<summary><b>Después de actualizar me sigue mostrando la versión vieja</b></summary>

<br>

La versión nueva ya está instalada, pero la consola todavía tiene la vieja cargada.
**Reiniciá la consola** y abrí la app de nuevo.

</details>

<details>
<summary><b>La actualización dice que no hay espacio</b></summary>

<br>

Se descarga al lado de la app instalada: liberá unos 600 MB en ese disco y reintentá.
Cuando pasa esto, todavía no se cambió nada.

</details>

<details>
<summary><b>¿Cómo la desinstalo?</b></summary>

<br>

**Por imagen**: borrá `PadrinoStore.exfat` de la carpeta `homebrew` **primero**, y después
borrá el icono de la pantalla de inicio. Al revés ShadowMount+ vuelve a encontrar el archivo
y te repone el icono.

**Por carpeta**: borrá la carpeta `PPSA99059` de `/data/homebrew/` y luego el icono.

</details>

---

## Compilálo vos

<details>
<summary><b>Estructura del repo</b></summary>

<br>

| Carpeta / archivo | Contenido |
| --- | --- |
| `app/` | La aplicación: JSX, estado, assets, datos del catálogo y `app.json` (title id `PPSA99059`) |
| `ps5-react/` | El framework sobre el que corre |
| `packaging/make-exfat.sh` | Arma la imagen exFAT que instala ShadowMount+ |
| `.github/workflows/build.yml` | El build de CI |

</details>

<details>
<summary><b>CI</b></summary>

<br>

En CI corre en `ubuntu-24.04` con clang 18. **Cada push a `main`** construye y publica
una release automáticamente: el tag es `v1.<run_number>` (siempre creciente), y la release
incluye `PadrinoStore.exfat`, `update.zip` (imagen) y `update-app.zip` (carpeta).

También podés disparar un build manual desde **Actions → Run workflow** eligiendo
cualquier rama (útil para hotfix sin tocar `main`).

</details>

<details>
<summary><b>Build local</b></summary>

<br>

En cualquier Linux con los paquetes del workflow (`clang-18`, `llvm-18`, `cmake`,
`ninja-build`, `nodejs`, `npm`, `zlib1g-dev`, `build-essential`, `pkg-config`, `unzip`,
`curl`, `exfatprogs` y Pillow de `ps5-react/requirements.txt`):

```sh
cd ps5-react
python3 tools/build_ps5.py --app-dir ../app --llvm /usr/bin
sudo ../packaging/make-exfat.sh dist/PPSA99059 ../PadrinoStore.exfat
```

La imagen es un volumen exFAT con la carpeta de la app en la raíz, clusters de 64 KiB
y label `PADRINO`.

</details>

---

<p align="center">
  <img src="app/sce_sys/icon0.png" width="72" alt="Padrino Store">
</p>

<p align="center">
  <sub>Padrino Store es un proyecto homebrew sin fines de lucro, sin afiliación ni respaldo
  de Sony Interactive Entertainment. PlayStation y PS5 son marcas de Sony Interactive
  Entertainment.</sub>
</p>
