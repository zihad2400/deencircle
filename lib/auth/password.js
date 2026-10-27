import bcrypt from "bcrypt";

const ROUNDS = 12;

export async function hashPassword(plain) {
  if (typeof plain !== "string" || plain.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(plain, hash) {
  if (typeof plain !== "string" || typeof hash !== "string") return false;
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}
