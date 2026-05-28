# Cryptography Standards

## Algorithm Requirements

### Required Algorithms

| Purpose | Algorithm | Key Size | Notes |
|---------|-----------|----------|-------|
| **Symmetric encryption** | AES-256-GCM | 256 bits | Authenticated encryption (AEAD) |
| **Hashing** | SHA-256 | N/A | For digests, integrity checks |
| **Key derivation** | PBKDF2 | 256-bit output | 100,000+ iterations minimum |
| **Key rotation** | HKDF-SHA256 | 256-bit output | For daily key rotation |
| **Randomness** | CSPRNG | Variable | `crypto.randomBytes()` or `SecureRandom` |
| **Secret comparison** | Constant-time | N/A | `crypto.timingSafeEqual()` |

### Forbidden Algorithms

| Algorithm | Risk | Alternative |
|-----------|------|-------------|
| MD5 | Collision attacks | SHA-256 |
| SHA-1 | Collision attacks (SHAttered) | SHA-256 |
| DES | 56-bit key (brute-force) | AES-256-GCM |
| RC4 | Bias attacks | AES-256-GCM |
| ECB mode | Pattern leakage | GCM (or CBC + HMAC) |
| Math.random() | Predictable (not CSPRNG) | `crypto.randomBytes()` |

---

## Constant-Time Comparisons

**CRITICAL RULE:** Every comparison involving secrets, digests, tokens, or API keys MUST be constant-time.

### Why

Non-constant-time comparisons leak information through timing:
```javascript
// ❌ VULNERABLE — short-circuits on first mismatch
if (userInput !== secret) return false;  // Timing oracle!

// ✅ SECURE — always compares all bytes
if (!crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))) return false;
```

### Implementation

```javascript
// JavaScript (Backend)
const { constantTimeCompare } = require('../utils/constantTimeCompare');
// Uses: crypto.timingSafeEqual()

// Kotlin (SDK)
// import your project's constant-time utility
// Uses: ConstantTime.equals(a, b)
```

### What MUST use constant-time

- Factor digest comparisons
- API key verification
- JWT signature verification
- Password verification
- HMAC verification
- Token comparison
- Any comparison where one side is user-controlled

---

## Memory Wiping

**CRITICAL RULE:** All secrets MUST be wiped from memory after use.

```javascript
function processSecret(secret) {
    const buf = Buffer.from(secret, 'utf-8');
    try {
        const result = doSomething(buf);
        return result;
    } finally {
        buf.fill(0);  // ALWAYS wipe
    }
}
```

```kotlin
fun processSecret(secret: ByteArray): ByteArray {
    val digest = hashSecret(secret)
    return try {
        digest
    } finally {
        secret.fill(0)
        digest.fill(0)  // Wipe both input and output
    }
}
```

### When to wipe

- After crypto operations
- After API key/token validation
- After password comparison
- After JWT signing/verification
- After any operation involving raw secret material

---

## Key Management

### Hierarchy

```
Master Key (KMS / env var)
    │
    ▼
PBKDF2 (100K iterations)
    │
    ├── Encryption Key (AES-256-GCM)
    ├── Signing Key (HMAC-SHA256)
    └── Per-factor Salt (crypto.randomBytes(32))
```

### Storage

| Key Type | Storage | Encryption |
|----------|---------|------------|
| Master Key | Environment variable / KMS | N/A (root key) |
| Derived Keys | In-memory (wiped after use) | Derived per-session |
| Per-factor Salts | Redis (with TTL) | AES-256-GCM |
| KMS Keys | AWS KMS / Local KMS | HSM-backed |

### Rotation

```javascript
// Multi-version keys enable zero-downtime rotation
const keys = {
    v1: getKey('2026-01'),
    v2: getKey('2026-06')  // Current
};

// Verify with all versions, sign with current
function verify(token) {
    for (const version of Object.values(keys)) {
        if (tryVerify(token, version)) return true;
    }
    return false;
}
```

---

## CSPRNG Requirements

**ALL randomness for security purposes MUST use CSPRNG:**

```javascript
// ✅ CORRECT
const crypto = require('crypto');
const nonce = crypto.randomUUID();           // UUID v4
const key = crypto.randomBytes(32);          // 256-bit key
const pin = crypto.randomInt(0, 9999);       // 4-digit PIN
const shuffle = fisherYatesShuffle(array);   // CSPRNG-based

// ❌ FORBIDDEN
const nonce = Math.random().toString();      // Predictable!
const pin = Math.floor(Math.random() * 9999);// Predictable!
```

---

## Salt Isolation (HMAC Keyed Per Level)

**Critical pattern:** Salts are isolated at 3 levels — app, user, and factor. Each level uses an HMAC key derived from the level above. This means:

- Same input by different users → different digest (user isolation)
- Same user, different factors → different digests (factor isolation)
- Compromised factor digest → attacker learns nothing about other factors

```
Level 1: APP_SALT (global, in config)
  └─ HMAC-SHA256(app_salt, "app_seed") → APP_KEY

Level 2: USER_KEY (per user, derived from UUID)
  └─ HMAC-SHA256(APP_KEY, uuid) → USER_SECRET

Level 3: FACTOR_KEY (per factor type)
  └─ HMAC-SHA256(USER_SECRET, factorType) + SHA-256(data) → FINAL_DIGEST
```

```javascript
function computeFactorDigest(data, uuid, factorType) {
    // Level 1: App-wide salt prevents rainbow table attacks
    const appSecret = hmac('sha256', APP_SALT, 'v1-app-key');

    // Level 2: Per-user secret ensures same factor value ≠ same digest
    const userSecret = hmac('sha256', appSecret, uuid);

    // Level 3: Per-factor isolation — compromising PIN digest
    // doesn't help attacker learn WORDS digest
    const factorSecret = hmac('sha256', userSecret, factorType);

    // Final: salted hash of the actual data
    const dataHash = crypto.createHash('sha256').update(data).digest();
    return hmac('sha256', factorSecret, dataHash);
}
```

```kotlin
// Kotlin equivalent
object FactorDigest {
    fun compute(data: ByteArray, uuid: String, factorType: String): ByteArray {
        val appSecret = hmacSha256(APP_SALT, "v1-app-key")
        val userSecret = hmacSha256(appSecret, uuid.toByteArray())
        val factorSecret = hmacSha256(userSecret, factorType.toByteArray())
        val dataHash = sha256(data)
        return hmacSha256(factorSecret, dataHash)
    }
}
```

## Encryption Pattern (Double Encryption — PBKDF2 + KMS)

```javascript
// Layer 1: PBKDF2 key derivation (password-based)
// Purpose: Slow down brute-force even if DB is compromised
const key = crypto.pbkdf2Sync(
    password, salt, 100000, 32, 'sha256'
);

// Layer 2: AES-256-GCM encryption (authenticated encryption)
// Purpose: Confidentiality + integrity (attacker can't tamper)
const iv = crypto.randomBytes(12);
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
const authTag = cipher.getAuthTag();

// Store: iv + authTag + encrypted
// Decrypt: verify authTag first, then decrypt

class DoubleLayerEncryption {
    constructor(kmsProvider) {
        this.kms = kmsProvider;
    }

    async encrypt(plaintext, uuid) {
        // Layer 1: User-derived key (PBKDF2, 100K iterations)
        const salt = crypto.randomBytes(32);
        const userKey = crypto.pbkdf2Sync(
            uuid, salt, 100000, 32, 'sha256'
        );

        // Layer 2: KMS wrapping (server-side key)
        const kmsKey = await this.kms.generateDataKey();
        // kmsKey = { plaintext: Buffer(32), ciphertext: Buffer }

        // Combine: AES-256-GCM with KMS key
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', kmsKey.plaintext, iv);
        const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
        const authTag = cipher.getAuthTag();

        // Wipe KMS plaintext immediately
        kmsKey.plaintext.fill(0);

        return {
            wrappedKey: kmsKey.ciphertext,  // Stored for decryption
            salt,                            // Stored for PBKDF2 derivation
            iv,                              // AES IV
            authTag,                         // GCM auth tag
            ciphertext: encrypted
        };
    }
}
```

## Digest Construction (Full Example)

```javascript
// Full digest computation for a factor enrollment
function buildDigest(data) {
    // Step 1: Hash raw data
    const dataHash = crypto.createHash('sha256').update(data).digest();

    // Step 2: Apply salt at all 3 levels
    const appKey = hmac(APP_SALT, 'v1-app-key');
    const userKey = hmac(appKey, uuid);
    const factorKey = hmac(userKey, factorType);

    // Step 3: Final HMAC digest
    const digest = hmac(factorKey, dataHash);

    // Step 4: Constant-time comparison template
    // Always: compareDigest(stored, computed)
    return digest;
}
```
