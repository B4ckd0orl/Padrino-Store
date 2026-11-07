// Copyright (C) 2026 half144 and PS5 React contributors
// SPDX-License-Identifier: GPL-3.0-or-later
// Additional attribution term: see LICENSE-ATTRIBUTION.
#pragma once
#include <string>

// Programs an app does not run itself go to the payload loader on 127.0.0.1:9021, which runs each
// one with the rest of the connection as its standard input. A payload outlives the call: unlike the
// helpers in payload_loader.hpp, nothing here waits for an answer.
namespace payloads {
// Sends `program` — a file in the app folder, or an absolute path under /app0, /download0 or
// /temp0 — with `request` after it, and returns once the loader holds both. False with `error`
// naming `payloads.send` when the file or the loader is not there.
bool send(const std::string& program, const std::string& request, std::string& error);
}
