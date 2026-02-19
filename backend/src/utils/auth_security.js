const DEVICE_ID_RE = /^[A-Za-z0-9._:-]{8,128}$/;

const LEET_MAP = {
  "0": "o",
  "1": "i",
  "2": "z",
  "3": "e",
  "4": "a",
  "5": "s",
  "6": "g",
  "7": "t",
  "8": "b",
  "9": "g"
};

function normalizeToken(value) {
  if (typeof value !== "string") return "";
  const lowered = value.trim().toLowerCase();
  if (!lowered) return "";
  let mapped = "";
  for (let i = 0; i < lowered.length; i += 1) {
    const ch = lowered[i];
    mapped += Object.prototype.hasOwnProperty.call(LEET_MAP, ch) ? LEET_MAP[ch] : ch;
  }
  return mapped.replace(/[^a-z0-9]/g, "");
}

function findBlockedWord(username, words) {
  if (!Array.isArray(words) || words.length === 0) return "";
  const normalizedName = normalizeToken(username);
  if (!normalizedName) return "";

  for (let i = 0; i < words.length; i += 1) {
    const word = normalizeToken(words[i]);
    if (!word || word.length < 3) continue;
    if (normalizedName.includes(word)) return words[i];
  }
  return "";
}

export function compileBlockedRegex(pattern) {
  if (typeof pattern !== "string" || !pattern.trim()) return null;
  try {
    return new RegExp(pattern, "i");
  } catch (_err) {
    return null;
  }
}

export function validateUsernameSafety(username, options = {}) {
  const reservedWords = Array.isArray(options.reservedWords) ? options.reservedWords : [];
  const sensitiveWords = Array.isArray(options.sensitiveWords) ? options.sensitiveWords : [];
  const blockedRegex = options.blockedRegex instanceof RegExp ? options.blockedRegex : null;

  if (blockedRegex && blockedRegex.test(String(username || ""))) {
    return { ok: false, code: "username_blocked_pattern" };
  }

  const reservedHit = findBlockedWord(username, reservedWords);
  if (reservedHit) {
    return { ok: false, code: "username_blocked_reserved" };
  }

  const sensitiveHit = findBlockedWord(username, sensitiveWords);
  if (sensitiveHit) {
    return { ok: false, code: "username_blocked_sensitive" };
  }

  return { ok: true, code: "" };
}

export function normalizeDeviceId(value) {
  if (typeof value !== "string") return "";
  const normalized = value.trim();
  if (!DEVICE_ID_RE.test(normalized)) return "";
  return normalized;
}
