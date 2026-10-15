/**
 * Admin passkey. Only a hash is stored (default passkey hash below, or a custom one in localStorage).
 * Note: this is a convenience lock for a static site — edits made in the browser only affect this
 * browser until they are published, so visitors can never change the live website.
 */
const PASS_KEY = "cc-admin-passkey";
const LOCK_KEY = "cc-admin-lock";
export const DEFAULT_PASS_HASH = "2655d8283dcc2f93";

export function hashPasskey(pin: string) {
  const s = "cayo-coco-admin::" + pin;
  let h1 = 0x811c9dc5 | 0;
  let h2 = 0x01000193 | 0;
  for (let r = 0; r < 4096; r++) {
    for (let i = 0; i < s.length; i++) {
      h1 = Math.imul(h1 ^ s.charCodeAt(i), 16777619);
      h2 = Math.imul(h2 ^ (s.charCodeAt(i) + r), 2246822507);
    }
    h1 ^= h2 >>> 13;
    h2 ^= h1 << 7;
  }
  return (h1 >>> 0).toString(16).padStart(8, "0") + (h2 >>> 0).toString(16).padStart(8, "0");
}

const storedHash = () => {
  try {
    return localStorage.getItem(PASS_KEY) || DEFAULT_PASS_HASH;
  } catch {
    return DEFAULT_PASS_HASH;
  }
};

export const verifyPasskey = (pin: string) => hashPasskey(pin.trim()) === storedHash();
export const isDefaultPasskey = () => storedHash() === DEFAULT_PASS_HASH;

export function setPasskey(pin: string) {
  localStorage.setItem(PASS_KEY, hashPasskey(pin.trim()));
}

export function lockState(): { fails: number; until: number } {
  try {
    const v = JSON.parse(localStorage.getItem(LOCK_KEY) || "null");
    return v && typeof v.fails === "number" ? v : { fails: 0, until: 0 };
  } catch {
    return { fails: 0, until: 0 };
  }
}

/** After 5 wrong attempts, lock for 30s (growing to 2 minutes). */
export function registerFail() {
  const fails = lockState().fails + 1;
  const until = fails >= 5 ? Date.now() + 30_000 * Math.min(4, fails - 4) : 0;
  try {
    localStorage.setItem(LOCK_KEY, JSON.stringify({ fails, until }));
  } catch {
    /* ignore */
  }
  return { fails, until };
}

export function clearFails() {
  try {
    localStorage.removeItem(LOCK_KEY);
  } catch {
    /* ignore */
  }
}
