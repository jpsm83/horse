/**
 * Checks if an IP address is localhost or private network
 */
export function isPrivateIP(ip: string | null): boolean {
  if (!ip) return true;
  
  // Localhost
  if (ip === "127.0.0.1" || ip === "::1" || ip === "localhost") return true;
  
  // Private network ranges
  if (ip.startsWith("192.168.") || ip.startsWith("10.")) return true;
  
  // 172.16.0.0 - 172.31.255.255
  if (ip.startsWith("172.")) {
    const parts = ip.split(".");
    if (parts.length >= 2) {
      const secondOctet = parseInt(parts[1], 10);
      if (secondOctet >= 16 && secondOctet <= 31) return true;
    }
  }
  
  return false;
}

/**
 * Extracts IP address from headers
 */
export function extractIP(headers: Headers): string | null {
  const forwardedFor = headers.get("x-forwarded-for");
  const realIp = headers.get("x-real-ip");
  const vercelForwarded = headers.get("x-vercel-forwarded-for");
  
  return (
    forwardedFor?.split(",")[0]?.trim() ||
    realIp ||
    vercelForwarded?.split(",")[0]?.trim() ||
    null
  );
}

