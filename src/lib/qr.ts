export function getQrTargetPath(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const uuidPattern = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
  if (new RegExp(`^${uuidPattern}$`).test(trimmed)) return `/qr/maquina/${trimmed}`;

  try {
    const url = new URL(trimmed, window.location.origin);
    const path = url.pathname;
    if (new RegExp(`^/qr/(maquina|loja)/${uuidPattern}$`).test(path)) {
      return path;
    }
  } catch {
    return null;
  }

  return null;
}
