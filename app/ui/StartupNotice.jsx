// ../pub-game-store/native/ui/StartupNotice.jsx
// The full-screen notice that stands between launch and the store: Padrino's message to the
// community, on the flat canvas the old welcome gate used. The Gate in index.jsx mounts it
// instead of the app, so nothing behind it can take focus; CONTINUAR is the only way in.
// The copy lives in the i18n catalogs (notice.*), so the same screen greets the player in
// their own language; the URLs stay plain text because the D-pad has no pointer to click them.

import '../assets/Inter-Regular.ttf';
import '../assets/JetBrainsMono-Regular.ttf';
import donacion from '../assets/donacion.png';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useT } from '../i18n/index.js';
import { Button2 } from './Button.jsx';
import { FocusScope, Image, Text, View } from '@ps5-react/core';

  // One paragraph per node, every one uniform: the engine takes that path whole (255 bytes),
  // while a nested span would split it into 63-byte pieces. The longest notice string is 107.
  var P = { fontFamily: "Inter-Regular", fontSize: 22, lineHeight: 34, color: "#eeeeee", textAlign: "center", width: 1400 };
  var TITLE = { fontFamily: "JetBrainsMono-Regular", fontSize: 30, lineHeight: 44, color: "#fab283", textAlign: "center", writingDirection: "ltr" };
  var LINK = { fontFamily: "JetBrainsMono-Regular", fontSize: 24, lineHeight: 34, color: "#fab283", textAlign: "center", writingDirection: "ltr" };
  // The QR image carries its own title, network and wallet address, so the notice only quotes
  // the link and lets the picture hold the rest. Its box matches the art's aspect ratio.
  var QR = { width: 400, height: 374 };
  function StartupNotice({ onDone }) {
    const t2 = useT();
    return /* @__PURE__ */ (0, jsx)(
      FocusScope,
      {
        trap: true,
        autoFocus: true,
        onBack: () => true,
        onAction: () => true,
        children: /* @__PURE__ */ (0, jsxs)(View, { style: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, zIndex: 60, backgroundColor: "#121110", direction: "ltr", alignItems: "center", justifyContent: "center", paddingVertical: 32 }, children: [
          /* @__PURE__ */ (0, jsxs)(View, { style: { width: 1400, alignItems: "center", gap: 16 }, children: [
            /* @__PURE__ */ (0, jsx)(Text, { style: TITLE, children: t2("notice.title") }),
            /* @__PURE__ */ (0, jsx)(Text, { style: P, children: t2("notice.hi") }),
            /* @__PURE__ */ (0, jsx)(Text, { style: P, children: t2("notice.thanks") }),
            /* @__PURE__ */ (0, jsx)(Text, { style: P, children: t2("notice.follow") }),
            /* @__PURE__ */ (0, jsx)(Text, { style: P, children: t2("notice.x.desc") }),
            /* @__PURE__ */ (0, jsx)(Text, { style: LINK, children: t2("notice.x.link") }),
            /* @__PURE__ */ (0, jsx)(Text, { style: P, children: t2("notice.tg.desc") }),
            /* @__PURE__ */ (0, jsx)(Text, { style: LINK, children: t2("notice.tg.link") }),
            /* @__PURE__ */ (0, jsx)(Text, { style: P, children: t2("notice.closing") }),
            /* @__PURE__ */ (0, jsx)(Image, { source: donacion, resizeMode: "contain", style: QR }),
            /* @__PURE__ */ (0, jsx)(Button2, { variant: "primary", size: "lg", label: t2("notice.continue"), autoFocus: true, onPress: onDone })
          ] })
        ] })
      }
    );
  }

export { StartupNotice };
