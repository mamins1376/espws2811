const LOGLEVEL_DISABLED = -1;
const LOGLEVEL_FATAL = 0;
const LOGLEVEL_ERROR = 1;
const LOGLEVEL_WARNING = 2;
const LOGLEVEL_INFO = 3;
const LOGLEVEL_DEBUG = 4;

const LOGLEVEL = LOGLEVEL_DEBUG;

export function fatal(...a) {
  if (LOGLEVEL >= LOGLEVEL_FATAL)
    console.error("[FATAL]: ", ...a);
}

export function error(...a) {
  if (LOGLEVEL >= LOGLEVEL_ERROR)
    console.error("[ERROR]: ", ...a);
}

export function warning(...a) {
  if (LOGLEVEL >= LOGLEVEL_WARNING)
    console.warn("[WARNING]: ", ...a);
}

export function info(...a) {
  if (LOGLEVEL >= LOGLEVEL_INFO)
  console.log("[INFO]:", ...a);
}

export function debug(...a) {
  if (LOGLEVEL >= LOGLEVEL_DEBUG)
  console.log("[DEBUG]:", ...a);
}
