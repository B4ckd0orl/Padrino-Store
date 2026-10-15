// Adapted from Orbit Store 1.0.1 and 1.3.5 by saawant12 (https://github.com/saawant12/orbit-store-ps5).
// SPDX-License-Identifier: GPL-3.0-or-later
// Read-only browser capture; original corresponding source is recorded in README.md.
#include "browser_match.h"
#include "browser_scan.h"
#include <string.h>
_Static_assert(sizeof(((BrowserMatch *)0)->url) <= PROBE_MATCH_MAX, "Scanner overlap must cover encoded filenames");
static bool boundary(unsigned char c) {
    return c == 0 || c == ' ' || c == '\t' || c == '\r' || c == '\n' ||
           c == '"' || c == '\'' || c == '<' || c == '>';
}
/* One URL character at *position, in ASCII (step 1) or UTF-16LE (step 2). Vikingfile's verified
 * link is already in the network process once the verification passes, but as JSON, before a
 * click on the page's Download button (and its advertisements) makes a navigation URL of it
 * (Orbit Store 1.3.5). JSON's optional slash escape is decoded, once; no other escape is a
 * download address. */
static bool next_url_char(const unsigned char *bytes, size_t length, size_t step,
                          size_t *position, unsigned char *out) {
    if (*position > length || length - *position < step) return false;
    unsigned char c = bytes[*position];
    if (step == 2 && bytes[*position + 1]) return false;
    *position += step;
    if (c == '\\') {
        if (length - *position < step || bytes[*position] != '/' ||
            (step == 2 && bytes[*position + 1])) return false;
        *position += step;
        c = '/';
    }
    *out = c;
    return true;
}
bool browser_match(void *context, const unsigned char *bytes, size_t length) {
    BrowserMatch *match = context;
    for (size_t which = 0; which < 2; which++) {
    const char *prefix = browser_capture_prefixes[which];
    const size_t plen = strlen(prefix);
    for (size_t step = 1; step <= 2; step++) {
        for (size_t i = 0; (plen + 1) * step <= length && i <= length - (plen + 1) * step; i++) {
            if (bytes[i] != 'h' || (i >= step && !boundary(bytes[i - step]))) continue;
            size_t position = i;
            bool valid = true;
            for (size_t j = 0; j < plen; j++) {
                unsigned char c;
                if (!next_url_char(bytes, length, step, &position, &c) ||
                    c != (unsigned char)prefix[j]) { valid = false; break; }
            }
            if (!valid) continue;
            char candidate[sizeof match->url];
            memcpy(candidate, prefix, plen);
            for (size_t j = plen; j < sizeof candidate; j++) {
                unsigned char c;
                if (!next_url_char(bytes, length, step, &position, &c)) break;
                if (boundary(c)) {
                    candidate[j] = 0;
                    if (browser_capture_url(match->filename, candidate)) {
                        memcpy(match->url, candidate, j + 1);
                        return true;
                    }
                    if (c != '\'') break; /* Apostrophe may be inside an unescaped path. */
                }
                if (c < 33 || c > 126) break;
                candidate[j] = (char)c;
            }
        }
    }
    }
    return false;
}
