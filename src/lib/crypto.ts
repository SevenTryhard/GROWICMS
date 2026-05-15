export function generarUuid(): string {
  return globalThis.crypto.randomUUID();
}

export function generarCodigoHex(bytes: number = 4): string {
  const buffer = new Uint8Array(bytes);
  globalThis.crypto.getRandomValues(buffer);
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
