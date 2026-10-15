<p align="center">
  <img src="app/sce_sys/pic0.png" alt="Padrino Store — Fuck PS5 Edition. The world is yours." width="100%">
</p>

<p align="center">
  <a href="https://github.com/B4ckd0orl/Padrino-Store/releases/latest"><img src="https://img.shields.io/github/v/release/B4ckd0orl/Padrino-Store?style=for-the-badge&label=release&labelColor=1e1e1e&color=e09f3e" alt="Última release" width="175"></a>
  <a href="https://github.com/B4ckd0orl/Padrino-Store/releases"><img src="https://img.shields.io/github/downloads/B4ckd0orl/Padrino-Store/total?style=for-the-badge&label=downloads&labelColor=1e1e1e&color=e09f3e" alt="Descargas totales" width="190"></a>
</p>

**Padrino Store** es un catálogo completo de juegos para tu PS5 con jailbreak: explorás,
elegís y descargás directo a la consola, sin PC en el medio. Interfaz oscura hecha para el
mando, actualizaciones que se instalan solas desde la propia app, y más de **1.800 títulos**
para picar.

## Qué te llevás

- **Catálogo grande, navegación corta.** Portadas, puntuaciones, tamaños y filtros de todo
  tipo (plataforma, estado, tamaño…) para encontrar algo y bajarlo en segundos.
- **Descargas nativas.** Directo al almacenamiento interno o a cualquier pendrive USB, con
  velocidad en vivo, gráficos de actividad y barra de espacio.
- **Varios hosts.** Cada juego trae sus fuentes; si una cae, la app prueba la siguiente.
- **Favoritos, historial de búsqueda** con teclado en pantalla y una págna de **Archivos**
  para ver y limpiar lo que tenés en tus discos.
- **13 idiomas**: English, Deutsch, Español, Français, Português (Brasil), Русский,
  Bahasa Indonesia, 日本語, 简体中文, العربية, اردو, हिन्दी, বাংলা.
- **Se actualiza sola.** Abre la app, aceptá el diálogo y listo: sin connectarte a una PC.
- **Todo con el control.** <kbd>L1</kbd> <kbd>R1</kbd> cambian de sección,
  <kbd>✕</kbd> confirma, <kbd>○</kbd> vuelve.

## Instalación

> [!IMPORTANT]
> Necesitás una **PS5 con jailbreak** corriendo
> **[ShadowMount+](https://github.com/drakmor/ShadowMountPlus)**, el payload que instala
> imágenes `.exfat` solito. Si te muestra su notificación al arrancar la consola, estás listo.

1. **Descargá `PadrinoStore.exfat`** desde la
   [última release](https://github.com/B4ckd0orl/Padrino-Store/releases/latest).
   Es el único archivo que necesitás: no lo descomprimas ni le cambies la extensión.

   <p align="center">
     <a href="https://github.com/B4ckd0orl/Padrino-Store/releases/latest/download/PadrinoStore.exfat"><img src="https://img.shields.io/badge/Descargar-PadrinoStore.exfat-e09f3e?style=for-the-badge&labelColor=1e1e1e" alt="Descargar PadrinoStore.exfat" width="330"></a>
   </p>

2. **Copialo a un pendrive exFAT**, dentro de una carpeta llamada exactamente `homebrew`
   en la raíz del disco:

   ```text
   Pendrive
   └── homebrew
       └── PadrinoStore.exfat
   ```

3. **Conectá el pendrive a la PS5.** ShadowMount+ detecta el archivo solo, lo monta e
   instala; te avisa con una notificación cuando termina. No hay que apretar nada.

4. **Abrí Padrino Store desde la pantalla de inicio.** Ahí está con su sticker.

¿Preferís FTP? Subí el `.exfat` al interior de la consola, también a una carpeta
`homebrew`: `/data/homebrew/PadrinoStore.exfat`.

## Actualizaciones

La instalás a mano una sola vez. Después, cuando sale versión nueva, la app te lo avisa
segundos después de arrancar:

1. Se abre un diálogo con el changelog. Tocá **Install**.
2. La app descarga el paquete, lo verifica y lo coloca encima de la versión vieja.
3. Se cierra sola. Volvé a abrirla y ya estás en la nueva.

Necesita unos **600 MB libres** en el disco donde está instalada. El `update.zip` de cada
release es justamente ese paquete: vos nunca lo tocás.

## Problemas típicos

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

Borrá `PadrinoStore.exfat` del carpeta `homebrew` **primero**, y después borrá el icono de
la pantalla de inicio. Al revés ShadowMount+ vuelve a encontrar el archivo y te repone el
icono.

</details>

## Compilála vos mismo

<details>
<summary><b>Qué hay en este repo</b></summary>
<br>

| Carpeta | Contenido |
| --- | --- |
| `app/` | La aplicación: JSX, estado, assets, datos del catálogo y `app.json` (title id `PPSA99058`) |
| `ps5-react/` | El framework sobre el que corre, de [half144/ps5-react](https://github.com/half144/ps5-react) |
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

## Créditos

- **[MyLuxy](https://github.com/MyLuxy)**, quien recuperó el código original de Overdrive
  y lo reconstruyó: Padrino Store se apoya en ese trabajo.
- **[ps5-react](https://github.com/half144/ps5-react)**, el framework que hace posible
  todo esto (GPL-3.0-or-later, con sus `LICENSE`, `LICENSE-ATTRIBUTION` y `NOTICE`).
- **[ShadowMount+](https://github.com/drakmor/ShadowMountPlus)** de drakmor, el payload
  que instala la imagen.

<sub>Padrino Store es un proyecto homebrew sin fines de lucro, sin afiliación ni respaldo
de Sony Interactive Entertainment. PlayStation y PS5 son marcas de Sony Interactive
Entertainment.</sub>
