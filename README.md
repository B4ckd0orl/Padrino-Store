<p align="center">
  <img src="app/sce_sys/pic0.png" alt="Padrino Store — Fuck PS5 Edition. The world is yours." width="100%">
</p>

<p align="center">
  <b>El catálogo de juegos que va derecho a tu PS5 — sin PC, sin vueltas.</b>
</p>

<p align="center">
  <a href="https://github.com/B4ckd0orl/Padrino-Store/releases/latest"><img src="https://img.shields.io/github/v/release/B4ckd0orl/Padrino-Store?style=for-the-badge&label=release&labelColor=1e1e1e&color=e09f3e" alt="Última release" width="175"></a>
  <a href="https://github.com/B4ckd0orl/Padrino-Store/releases"><img src="https://img.shields.io/github/downloads/B4ckd0orl/Padrino-Store/total?style=for-the-badge&label=downloads&labelColor=1e1e1e&color=e09f3e" alt="Descargas totales" width="190"></a>
</p>

<p align="center">
  <a href="https://github.com/B4ckd0orl/Padrino-Store/releases/latest/download/PadrinoStore.exfat"><img src="https://img.shields.io/badge/Descargar-PadrinoStore.exfat-e09f3e?style=for-the-badge&labelColor=1e1e1e&color=1e1e1e" alt="Descargar PadrinoStore.exfat" width="420"></a>
</p>

<p align="center">
  <img src=".github/readme/divider.svg" width="420" alt="">
</p>

## Por qué Padrino Store

<table>
  <tr>
    <td width="50%" valign="top">
      <b>Catálogo gigante</b><br>
      Más de 1.800 juegos con portadas, puntuaciones, tamaños y filtros por plataforma, estado y tamaño.
    </td>
    <td width="50%" valign="top">
      <b>Descargas nativas</b><br>
      Directo al disco interno o a cualquier pendrive USB, con velocidad en vivo y gráficos de actividad.
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <b>Varios hosts</b><br>
      Cada juego trae sus fuentes. Si una cae, la app prueba la siguiente automáticamente.
    </td>
    <td width="50%" valign="top">
      <b>Favoritos y búsqueda</b><br>
      Guardás lo tuyo, buscás con teclado en pantalla y limpiás desde la pestaña Archivos.
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <b>13 idiomas</b><br>
      Español, English, Deutsch, Français, Português, русский, 日本語, 中文, العربية, हिन्दी y más.
    </td>
    <td width="50%" valign="top">
      <b>Se actualiza sola</b><br>
      Un diálogo, tocás Install, y ya. Nunca más conectarte a una PC para actualizar.
    </td>
  </tr>
</table>

<p align="center">
  <img src=".github/readme/divider.svg" width="420" alt="">
</p>

## Instalación en 4 pasos

<p align="center">
  <img src=".github/readme/steps.svg" width="100%" alt="1 Descargá el .exfat · 2 Copialo a homebrew/ · 3 Conectá el USB · 4 Abrí la app">
</p>

> [!IMPORTANT]
> Necesitás una **PS5 con jailbreak** corriendo
> **[ShadowMount+](https://github.com/drakmor/ShadowMountPlus)**, el payload que instala
> imágenes `.exfat` solito. Si ves su notificación al arrancar, estás listo.

<details>
<summary><b>Detalles de cada paso</b></summary>
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

4. **Abrí Padrino Store desde la pantalla de inicio.** Ahí está con su sticker.

¿Preferís FTP? Subí el `.exfat` al interior de la consola, también a una carpeta
`homebrew`: `/data/homebrew/PadrinoStore.exfat`.

</details>

<p align="center">
  <img src=".github/readme/divider.svg" width="420" alt="">
</p>

## Actualizaciones

La instalás a mano una sola vez. Después, cuando sale versión nueva, la app te lo avisa
segundos después de arrancar:

1. Se abre un diálogo con el changelog. Tocá **Install**.
2. La app descarga el paquete, lo verifica y lo coloca encima de la versión vieja.
3. Se cierra sola. Volvé a abrirla y ya estás en la nueva.

Necesita unos **600 MB libres** en el disco donde está instalada. El `update.zip` de cada
release es justamente ese paquete: vos nunca lo tocás.

<p align="center">
  <img src=".github/readme/divider.svg" width="420" alt="">
</p>

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

Borrá `PadrinoStore.exfat` de la carpeta `homebrew` **primero**, y después borrá el icono
de la pantalla de inicio. Al revés ShadowMount+ vuelve a encontrar el archivo y te repone
el icono.

</details>

<p align="center">
  <img src=".github/readme/divider.svg" width="420" alt="">
</p>

## Compilála vos mismo

<details>
<summary><b>Qué hay en este repo</b></summary>
<br>

| Carpeta | Contenido |
| --- | --- |
| `app/` | La aplicación: JSX, estado, assets, datos del catálogo y `app.json` (title id `PPSA99058`) |
| `ps5-react/` | El framework sobre el que corre |
| `packaging/make-exfat.sh` | Arma la imagen exFAT que instala ShadowMount+ |
| `.github/workflows/build.yml` | El build de CI |

</details>

<details>
<summary><b>Build</b></summary>
<br>

En CI corre en `ubuntu-24.04` con clang 18, y sólo desde **Run workflow**: un push no
construye nada. Cada run deja `PadrinoStore.exfat` y `update.zip` en una draft release
con el nombre de la versión de `app/version.js`.

El mismo build en local, en cualquier Linux con los paquetes del workflow (`clang-18`,
`llvm-18`, `cmake`, `ninja-build`, `nodejs`, `npm`, `zlib1g-dev`, `build-essential`,
`pkg-config`, `unzip`, `curl`, `exfatprogs` y Pillow de `ps5-react/requirements.txt`):

```sh
cd ps5-react
python3 tools/build_ps5.py --app-dir ../app --llvm /usr/bin
sudo ../packaging/make-exfat.sh dist/PPSA99058 ../PadrinoStore.exfat
```

La imagen es un volumen exFAT simple con la carpeta de la app en la raíz, clusters de
64 KiB y label `PADRINO`. Para sacar una versión: subí el número en `app/version.js` y
`app/app.json`, corré el workflow, probá la imagen de la draft en tu consola y publicá
la draft; eso crea el tag y las apps instaladas ofrecen exactamente esos archivos.

</details>

<p align="center">
  <img src=".github/readme/logo-mark.svg" width="72" alt="">
</p>

<p align="center">
  <sub>Padrino Store es un proyecto homebrew sin fines de lucro, sin afiliación ni respaldo
  de Sony Interactive Entertainment. PlayStation y PS5 son marcas de Sony Interactive
  Entertainment.</sub>
</p>
