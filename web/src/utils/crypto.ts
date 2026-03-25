/**
 * A simplified Web Crypto AES-GCM encryption wrapper for the hackathon demonstration.
 * 
 * In a real-world enterprise application, this `ENCRYPTION_KEY` would be derived 
 * directly from a user-memorized Master Password utilizing PBKDF2 or Argon2 hashing, 
 * guaranteeing zero-knowledge architecture.
 */

const DEMO_MASTER_KEY = 'financiero-local-demo-key-123456'; 

async function getEncryptionKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  // Pad the key to precisely 32 bytes for AES-256
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(DEMO_MASTER_KEY.padEnd(32, '0').slice(0, 32)),
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
  return keyMaterial;
}

export async function encryptData(text: string): Promise<string> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(text)
  );
  
  // Combine Initialization Vector (IV) and Ciphertext into a single Base64 string payload
  const encryptedBytes = new Uint8Array(encrypted);
  const combined = new Uint8Array(iv.length + encryptedBytes.length);
  combined.set(iv);
  combined.set(encryptedBytes, iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

export async function decryptData(cipherTextBase64: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const binaryStr = atob(cipherTextBase64);
    
    const combined = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
        combined[i] = binaryStr.charCodeAt(i);
    }
    
    // Extract the IV from the first 12 bytes
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      data
    );
    
    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch (e) {
    console.error("Decryption failed (Likely reading old unencrypted DB row)", e);
    return cipherTextBase64; // Fallback to plaintext to prevent breaking legacy rows
  }
}
