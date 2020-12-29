const LOGLEVEL_FATAL   = 0;
const LOGLEVEL_ERROR   = 1;
const LOGLEVEL_WARNING = 2;
const LOGLEVEL_INFO    = 3;
const LOGLEVEL_DEBUG   = 4;

const LOGLEVEL = LOGLEVEL_DEBUG;

const LOGLEVEL_FATAL_ENABLED   = LOGLEVEL >= LOGLEVEL_FATAL;
const LOGLEVEL_ERROR_ENABLED   = LOGLEVEL >= LOGLEVEL_ERROR;
const LOGLEVEL_WARNING_ENABLED = LOGLEVEL >= LOGLEVEL_WARNING;
const LOGLEVEL_INFO_ENABLED    = LOGLEVEL >= LOGLEVEL_INFO;
const LOGLEVEL_DEBUG_ENABLED   = LOGLEVEL >= LOGLEVEL_DEBUG;

export function fatal(...a) {
  if (LOGLEVEL_FATAL_ENABLED)
    console.error("[FATAL]: ", ...a);
}

export function error(...a) {
  if (LOGLEVEL_ERROR_ENABLED)
    console.error("[ERROR]: ", ...a);
}

export function warning(...a) {
  if (LOGLEVEL_WARNING_ENABLED)
    console.warn("[WARNING]: ", ...a);
}

export function info(...a) {
  if (LOGLEVEL_INFO_ENABLED)
    console.log("[INFO]:", ...a);
}

export function debug(...a) {
  if (LOGLEVEL_DEBUG_ENABLED)
    console.log("[DEBUG]:", ...a);
}
