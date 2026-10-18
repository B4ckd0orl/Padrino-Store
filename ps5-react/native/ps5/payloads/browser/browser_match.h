// Adapted from upstream store code by gran padrino.
// SPDX-License-Identifier: GPL-3.0-or-later
// Read-only browser capture; original corresponding source is recorded in README.md.
#pragma once
#include <stdbool.h>
#include <stddef.h>
typedef struct { const char *filename; char url[544]; } BrowserMatch;
extern const char *const browser_capture_prefixes[2];
const char *browser_capture_prefix(const char *url);
bool browser_capture_url(const char *filename, const char *url);
bool browser_match(void *context, const unsigned char *bytes, size_t length);
