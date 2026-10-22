// Copyright (C) 2026 half144 and PS5 React contributors
// SPDX-License-Identifier: GPL-3.0-or-later
// Additional attribution term: see LICENSE-ATTRIBUTION.
//
// Opens Padrino Store from the payload loader (127.0.0.1:9021) on a console where the store is
// already installed — an exFAT image (ShadowMount+) or a data folder. The store itself cannot
// be a single .elf: the console only starts apps from their installed files, so this payload
// only performs the launch call, the same one relauncher.c makes after an update closes.
// Answers on stdout, which the loader shows in its log.
#include <signal.h>
#include <stdint.h>
#include <string.h>
#include <unistd.h>

typedef struct {
  uint32_t size, user_id, app_opt;
  uint64_t crash_report;
  uint32_t check_flag;
} LncAppParam;

int sceUserServiceInitialize(void*);
int sceUserServiceGetForegroundUser(int*);
int sceLncUtilGetAppId(const char* title_id);
int sceLncUtilLaunchApp(const char* title_id, const char** argv, LncAppParam* param);

#define TITLE_ID "PPSA99059"

static void say(const char* text) {
  write(STDOUT_FILENO, text, strlen(text));
}

int main(void) {
  // A killed app must not take the payload's socket down with it.
  signal(SIGPIPE, SIG_IGN);
  if (sceLncUtilGetAppId(TITLE_ID) >= 0) {
    say("padrino: the store is already open\n");
    return 0;
  }
  sceUserServiceInitialize(NULL);
  LncAppParam param = {sizeof param, 0, 0, 0, 0};
  sceUserServiceGetForegroundUser((int*)&param.user_id);
  const int result = sceLncUtilLaunchApp(TITLE_ID, NULL, &param);
  if (result < 0)
    say("padrino: launch failed - install the store image or folder first\n");
  else
    say("padrino: store launched\n");
  return result < 0;
}
