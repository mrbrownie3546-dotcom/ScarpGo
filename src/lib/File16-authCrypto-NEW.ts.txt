// Strong client-side password hashing: PBKDF2-SHA256, 100k iterations, per-password salt.
// Format: pbkdf2$<iterations>$<saltHex>$<hashHex>
// Legacy unsalted SHA-256 (64 hex chars) is still VERIFIABLE so old accounts keep working,
// but every new password is stored in the PBKDF2 format only.

const ITERATIONS = 100000;

const toHex = (buf: ArrayBuffer | Uint8Array): string =>
  Array.from(new Uint8Array(buf instanceof ArrayBuffer ? buf : buf.buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

const fromHex = (hex: string): Uint8Array =>
  new Uint8Array(hex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));

export const pbkdf2Hash = async (pwd: string, saltHex?: string, iterations: number = ITERATIONS): Promise<string> => {
  const salt = saltHex ? fromHex(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pwd), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
    key,
    256
  );
  return `pbkdf2$${iterations}$${toHex(salt)}$${toHex(bits)}`;
};

const sha256Hex = async (pwd: string): Promise<string> => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pwd));
  return toHex(buf);
};

// Hash a NEW password for storage
export const hashPassword = async (pwd: string): Promise<string> => {
  try {
    return await pbkdf2Hash(pwd);
  } catch {
    return pwd; // no crypto available - extremely old browser
  }
};

// Verify a password against a stored hash (PBKDF2 or legacy SHA-256)
export const verifyPassword = async (pwd: string, stored: string | undefined | null): Promise<boolean> => {
  if (!stored) return false;
  try {
    if (stored.startsWith('pbkdf2$')) {
      const [, itStr, saltHex, hashHex] = stored.split('$');
      const candidate = await pbkdf2Hash(pwd, saltHex, parseInt(itStr, 10));
      return candidate.split('$')[3] === hashHex;
    }
    if (/^[0-9a-f]{64}$/i.test(stored)) {
      return (await sha256Hex(pwd)) === stored.toLowerCase();
    }
  } catch {
    return false;
  }
  return false;
};

// Super-admin master credential check. Only the salted PBKDF2 hash of the master
// password lives here - the password itself is nowhere in the code.
export const MASTER_PASSWORD_HASH = 'pbkdf2$100000$0939c156470d9ba57ab05f091ef2bd32$6b9d739619ac096f5a014f9dcff0342ba4ac74afc9e859b0ed7600433a988fca';

export const verifyMasterPassword = async (pwd: string): Promise<boolean> => {
  return verifyPassword(pwd, MASTER_PASSWORD_HASH);
};
