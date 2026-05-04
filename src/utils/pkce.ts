/**
 * Generates a cryptographically random code verifier for PKCE.
 * Returns a base64url-encoded string of 64 random bytes.
 */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(64)
  crypto.getRandomValues(array)
  return base64urlEncode(array)
}

/**
 * Generates a code challenge from a code verifier using SHA-256.
 * Returns the base64url-encoded SHA-256 hash of the verifier.
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return base64urlEncode(new Uint8Array(digest))
}

function base64urlEncode(buffer: Uint8Array): string {
  const bytes = Array.from(buffer)
  const base64 = btoa(String.fromCharCode(...bytes))
  // Convert standard base64 to base64url
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}
