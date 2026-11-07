// Copyright (C) 2026 half144 and PS5 React contributors
// SPDX-License-Identifier: GPL-3.0-or-later
// Additional attribution term: see LICENSE-ATTRIBUTION.
#include "payloads.hpp"

// The preview runs the app itself: there is no payload loader to hand a program to.
namespace payloads {
bool send(const std::string&, const std::string&, std::string& error) {
  error = "payloads.send: the payload loader runs on a PS5 only.";
  return false;
}
}
