const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;

export function validateUsername(username) {
  if (typeof username !== "string") return false;
  return USERNAME_RE.test(username);
}

export function validatePasswordStrength(password) {
  if (typeof password !== "string" || password.length < 8) return false;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasDigit = /\d/.test(password);
  return hasLetter && hasDigit;
}

export function isPowerOfTwo(n) {
  return Number.isInteger(n) && n > 0 && (n & (n - 1)) === 0;
}

function isFibonacciNumber(n) {
  if (!Number.isInteger(n) || n <= 0) return false;
  if (n === 1 || n === 2) return true;
  let a = 1;
  let b = 2;
  while (b < n) {
    const c = a + b;
    a = b;
    b = c;
  }
  return b === n;
}

export function isValidTileValue(value, ruleset) {
  if (!Number.isInteger(value) || value < 0) return false;
  if (value === 0) return true;
  if (ruleset === "fibonacci") return isFibonacciNumber(value);
  return isPowerOfTwo(value);
}

export function isValidBoard(board, width = 4, height = 4, ruleset = "pow2") {
  if (!Number.isInteger(width) || width <= 0) return false;
  if (!Number.isInteger(height) || height <= 0) return false;
  if (!Array.isArray(board) || board.length !== height) return false;

  for (let y = 0; y < height; y += 1) {
    const row = board[y];
    if (!Array.isArray(row) || row.length !== width) return false;
    for (let x = 0; x < width; x += 1) {
      if (!isValidTileValue(row[x], ruleset)) return false;
    }
  }
  return true;
}

export function boardEquals(a, b, width = 4, height = 4, ruleset = "pow2") {
  if (!isValidBoard(a, width, height, ruleset) || !isValidBoard(b, width, height, ruleset)) {
    return false;
  }
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (a[y][x] !== b[y][x]) return false;
    }
  }
  return true;
}
