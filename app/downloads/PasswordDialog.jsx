// A text field typed with an on-screen keyboard: four rows of ten keys
// (digits and letters, or symbols), then Shift, Symbols, Space and Apply. Used for an archive password the known ones
// do not open.
//   Cross types, Square deletes, Triangle shifts, L2 swaps letters and symbols, L1/R1 move the cursor,
//   Options or R2 applies, Circle goes back.

import '../assets/Inter-Regular.ttf';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useState } from 'react';
import { useT } from '../i18n/index.js';
import { useNavActions } from '../state/nav.jsx';
import { EASE_OUT } from '../ui/ease.js';
import { FocusScope, Text, View, motion, useIsFocused } from '@ps5-react/core';

  var LETTERS = ["1234567890", "qwertyuiop", "asdfghjkl_", "zxcvbnm.-/"];
  var SYMBOLS = ["!@#$%^&*()", "-_=+[]{};:", "'\",.<>/?\\|", "~`"];
  var KEY_W = 100;
  var KEY_H = 80;
  var GAP = 10;
  var ROW_W = 10 * KEY_W + 9 * GAP;
  var TEXT_MAX = 511;
  var SHOWN = 34;
  var dialogEnter = { type: "tween", duration: 0.3, ease: EASE_OUT };
  var keyTween = { type: "tween", duration: 0.1, ease: [0.4, 0, 0.2, 1] };
  var keyKey = (row, col) => `password:${row}:${col}`;
  function KeyLabel({ label, size, accent }) {
    const focused = useIsFocused();
    return jsx(Text, { style: { fontFamily: "Inter-Regular", fontSize: size, lineHeight: size + 10, color: focused ? "#0a0a0a" : accent ? "#fab283" : "#eeeeee" }, children: label });
  }
  function Key({ label, width = KEY_W, size = 36, accent = false, focusKey, autoFocus, onPress }) {
    return jsx(motion.View, {
      focusKey,
      autoFocus,
      onPress,
      initial: false,
      animate: { scale: 1 },
      transition: keyTween,
      whilePress: { scale: 0.95 },
      style: (state) => [
        { width, height: KEY_H, alignItems: "center", justifyContent: "center", borderRadius: 9, backgroundColor: accent ? "#1e1e1e" : "#141414" },
        state.focused ? { backgroundColor: "#fab283" } : null
      ],
      children: jsx(KeyLabel, { label, size, accent })
    });
  }
  function PasswordDialog({ title, detail, submit, onClose }) {
    const t2 = useT();
    const { focusLater } = useNavActions();
    const [field, setField] = (0, useState)({ text: "", cur: 0 });
    const [shift, setShift] = (0, useState)(false);
    const [symbols, setSymbols] = (0, useState)(false);
    const [error2, setError] = (0, useState)("");
    const rows = symbols ? SYMBOLS : LETTERS;
    const charAt = (row, col) => {
      const c = rows[row][col];
      return shift && !symbols ? c.toUpperCase() : c;
    };
    const type = (c) => setField(({ text, cur }) => text.length >= TEXT_MAX ? { text, cur } : { text: text.slice(0, cur) + c + text.slice(cur), cur: cur + 1 });
    const erase = () => setField(({ text, cur }) => cur > 0 ? { text: text.slice(0, cur - 1) + text.slice(cur), cur: cur - 1 } : { text, cur });
    const move = (step) => setField(({ text, cur }) => ({ text, cur: Math.max(0, Math.min(text.length, cur + step)) }));
    const apply = () => {
      try {
        submit(field.text);
        onClose();
      } catch (failure) {
        setError(failure.message);
      }
    };
    const toggleSymbols = (refocus) => {
      // The symbols page's last row is shorter: with L2 the focus may sit on a key past its end.
      if (refocus && !symbols) focusLater(keyKey(1, 0));
      setSymbols(!symbols);
    };
    const onAction = (action) => {
      if (action === "square") erase();
      else if (action === "triangle") setShift(!shift);
      else if (action === "l2") toggleSymbols(true);
      else if (action === "l1") move(-1);
      else if (action === "r1") move(1);
      else if (action === "options" || action === "r2") apply();
      return true;
    };
    const start = Math.max(0, field.cur - (SHOWN - 4));
    const before = field.text.slice(start, field.cur);
    const after = field.text.slice(field.cur, start + SHOWN);
    const text = { fontFamily: "Inter-Regular", fontSize: 36, lineHeight: 48, color: "#eeeeee" };
    return jsx(FocusScope, { trap: true, autoFocus: true, onBack: () => {
      onClose();
      return true;
    }, onAction, children: jsx(View, { style: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, zIndex: 50, alignItems: "center", justifyContent: "center", backgroundColor: "#0a0a0af2" }, children: jsxs(motion.View, { initial: { opacity: 0, y: 28 }, animate: { opacity: 1, y: 0 }, transition: dialogEnter, style: { alignItems: "center", gap: 18 }, children: [
      jsx(Text, { style: { width: ROW_W, textAlign: "center", fontFamily: "Inter-Regular", fontSize: 36, lineHeight: 48, color: "#eeeeee", numberOfLines: 1, ellipsizeMode: "tail" }, children: title }),
      jsx(Text, { style: { width: ROW_W, textAlign: "center", fontFamily: "Inter-Regular", fontSize: 22, lineHeight: 30, color: "#808080", numberOfLines: 2, ellipsizeMode: "tail" }, children: error2 || detail }),
      jsxs(View, { style: { width: 760, height: 84, flexDirection: "row", alignItems: "center", paddingHorizontal: 24, borderRadius: 9, borderWidth: 3, borderColor: "#fab283", backgroundColor: "#1e1e1e" }, children: [
        jsx(Text, { style: text, children: before }),
        jsx(View, { style: { width: 3, height: 44, backgroundColor: "#fab283" } }),
        jsx(Text, { style: text, children: after })
      ] }),
      jsxs(View, { style: { gap: GAP }, children: [
        rows.map((row, r) => jsx(View, { style: { flexDirection: "row", gap: GAP, justifyContent: "center" }, children: row.split("").map((_, c) => jsx(Key, { label: charAt(r, c), focusKey: keyKey(r, c), autoFocus: r === 1 && c === 0, onPress: () => type(charAt(r, c)) }, c)) }, r)),
        jsxs(View, { style: { flexDirection: "row", gap: GAP, justifyContent: "center" }, children: [
          jsx(Key, { label: shift ? "ABC" : "abc", width: 160, size: 28, accent: shift, focusKey: keyKey(4, 0), onPress: () => setShift(!shift) }),
          jsx(Key, { label: symbols ? "123 abc" : "!@#()", width: 160, size: 28, accent: symbols, focusKey: keyKey(4, 1), onPress: () => toggleSymbols(false) }),
          jsx(Key, { label: t2("keyboard.space"), width: 440, size: 28, focusKey: keyKey(4, 2), onPress: () => type(" ") }),
          jsx(Key, { label: t2("passwordDialog.apply"), width: 300, size: 28, accent: true, focusKey: keyKey(4, 3), onPress: apply })
        ] })
      ] }),
      jsx(Text, { style: { width: ROW_W, textAlign: "center", fontFamily: "Inter-Regular", fontSize: 21, lineHeight: 30, color: "#808080" }, children: t2("passwordDialog.controls") })
    ] }) }) });
  }

export { PasswordDialog };
