// ../pub-game-store/native/ui/StartupNotice.jsx
// The full-screen notice that stands between launch and the store: Padrino's message to the
// community, on the flat canvas the old welcome gate used. The Gate in index.jsx mounts it
// instead of the app, so nothing behind it can take focus; CONTINUAR is the only way in.

import '../assets/Inter-Regular.ttf';
import '../assets/JetBrainsMono-Regular.ttf';
import donacion from '../assets/donacion.png';
import { jsx, jsxs } from 'react/jsx-runtime';
import { Button2 } from './Button.jsx';
import { FocusScope, Image, Text, View } from '@ps5-react/core';

  // One paragraph per node, every one uniform: the engine takes that path whole (255 bytes),
  // while a nested span would split it into 63-byte pieces. The longest paragraph here is 241.
  var P = { fontFamily: "Inter-Regular", fontSize: 22, lineHeight: 34, color: "#eeeeee", textAlign: "center", width: 1400 };
  var LINK = { fontFamily: "JetBrainsMono-Regular", fontSize: 24, lineHeight: 34, color: "#fab283", textAlign: "center", writingDirection: "ltr" };
  // The QR image carries its own title, network and wallet address, so the notice only quotes
  // the link and lets the picture hold the rest. Its box matches the art's aspect ratio.
  var QR = { width: 400, height: 374 };
  function StartupNotice({ onDone }) {
    return /* @__PURE__ */ (0, jsx)(
      FocusScope,
      {
        trap: true,
        autoFocus: true,
        onBack: () => true,
        onAction: () => true,
        children: /* @__PURE__ */ (0, jsxs)(View, { style: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, zIndex: 60, backgroundColor: "#121110", direction: "ltr", alignItems: "center", justifyContent: "center", paddingVertical: 40 }, children: [
          /* @__PURE__ */ (0, jsxs)(View, { style: { width: 1400, alignItems: "center", gap: 20 }, children: [
            /* @__PURE__ */ (0, jsx)(Text, { style: P, children: "Hola, soy Padrino, creador de PADRINO STORE y de varios otros proyectos de código abierto." }),
            /* @__PURE__ */ (0, jsx)(Text, { style: P, children: "Escribo este mensaje para aclarar de forma definitiva que ni PADRINO STORE ni ninguno de los repositorios publicados en mi perfil oficial de GitHub contienen virus, ransomware, stealers, keyloggers ni ningún otro tipo de software malicioso." }),
            /* @__PURE__ */ (0, jsx)(Text, { style: P, children: "Esta aclaración surge a raíz de una difamación reciente iniciada por dos personas, quienes ya se retractaron y ofrecieron disculpas públicas; aun así, prefiero dejar el tema claro para tranquilidad de toda la comunidad." }),
            /* @__PURE__ */ (0, jsx)(Text, { style: P, children: "Gracias a todos por la confianza y por utilizar PADRINO STORE. Para mantenerte al tanto de novedades, actualizaciones y soporte, únete a nuestro canal oficial de Telegram:" }),
            /* @__PURE__ */ (0, jsx)(Text, { style: LINK, children: "→ t.me/padrinostores" }),
            /* @__PURE__ */ (0, jsx)(Text, { style: P, children: "Si valoras mi trabajo y deseas apoyar el desarrollo continuo de nuevos proyectos, te dejo abajo mi código QR y mi dirección de Wallet USDT. ¡Cualquier aporte suma y ayuda a que esto siga creciendo!" }),
            /* @__PURE__ */ (0, jsx)(Image, { source: donacion, resizeMode: "contain", style: QR }),
            /* @__PURE__ */ (0, jsx)(Button2, { variant: "primary", size: "lg", label: "CONTINUAR", autoFocus: true, onPress: onDone })
          ] })
        ] })
      }
    );
  }

export { StartupNotice };
