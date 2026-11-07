// Copyright (C) 2026 half144 and PS5 React contributors
// SPDX-License-Identifier: GPL-3.0-or-later
// Additional attribution term: see LICENSE-ATTRIBUTION.
#include "host_api.hpp"
#include "payloads.hpp"
#include <climits>
#include <cstring>

namespace {
// The loader runs what it is sent with every right, so only a plainly written program in the app's
// own space goes: a file in the app folder, or an absolute path under /app0, /download0 or /temp0.
bool program_path(JSContext* ctx, JSValueConst value, std::string& out) {
  if (!JS_IsString(value)) return false;
  std::size_t length = 0;
  const char* input = JS_ToCStringLen(ctx, &length, value);
  if (!input) return false;
  const bool absolute = length && input[0] == '/';
  const std::string logical = absolute ? std::string(input, length) : "/app0/" + std::string(input, length);
  const bool allowed = absolute
    ? (!std::strncmp(input, "/app0/", 6) || !std::strncmp(input, "/download0/", 11) || !std::strncmp(input, "/temp0/", 7))
    : !std::strchr(input, '/');
  char resolved[PATH_MAX];
  const bool ok = length && length < PATH_MAX && !std::memchr(input, 0, length) && allowed &&
                  host::resolve_path(logical.c_str(), resolved, sizeof resolved);
  if (ok) out = absolute ? logical : std::string(input, length);
  JS_FreeCString(ctx, input);
  return ok;
}
// ABI v22: (program, request?) -> undefined, once the loader has both.
JSValue send(JSContext* ctx, JSValueConst, int argc, JSValueConst* argv) {
  std::string program;
  if (argc < 1 || !program_path(ctx, argv[0], program))
    return JS_ThrowTypeError(ctx, "payloads.send: expected a program file in the app folder, or an absolute path under /app0, /download0 or /temp0");
  std::string request;
  if (argc > 1 && !JS_IsUndefined(argv[1]) && !JS_IsNull(argv[1])) {
    if (!JS_IsString(argv[1])) return JS_ThrowTypeError(ctx, "payloads.send: request must be a string");
    std::size_t size = 0;
    const char* text = JS_ToCStringLen(ctx, &size, argv[1]);
    if (!text) return JS_EXCEPTION;
    const bool fits = size <= 16 * 1024;
    if (fits) request.assign(text, size);
    JS_FreeCString(ctx, text);
    if (!fits) return JS_ThrowTypeError(ctx, "payloads.send: request must have at most 16384 bytes");
  }
  // The send waits on the loader reading the file: the stall watchdog names this call.
  const host::CallScope scope("payloads.send");
  std::string error;
  if (!payloads::send(program, request, error)) return JS_ThrowPlainError(ctx, "%s", error.c_str());
  return JS_UNDEFINED;
}
}

JSValue ps5_react_payload_api(JSContext* ctx) {
  JSValue api = JS_NewObject(ctx);
  JS_SetPropertyStr(ctx, api, "send", JS_NewCFunction(ctx, send, "send", 2));
  return api;
}
