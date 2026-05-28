# Secure Memory Wiping

## Why

Secrets (keys, digests, passwords, tokens) sit in memory after use. If an attacker gains memory access (heartbleed, swap file, core dump, cold boot), they recover everything you didn't wipe. Wiping is not optional — it's a security requirement for any system handling secrets.

## The Rule

```
ALWAYS wipe secrets in a finally block.
NEVER rely on garbage collection (GC doesn't zero memory).
```

## Implementation Patterns

### Pattern 1: Buffer Wipe (Node.js)

```javascript
function processSecret(secret) {
    // Allocate
    const buf = Buffer.from(secret, 'utf-8');
    try {
        const result = doSomething(buf);
        return result;
    } finally {
        // ALWAYS wipe — executes even if doSomething throws
        buf.fill(0);
    }
}
```

### Pattern 2: ByteArray Wipe (Kotlin/KMP)

```kotlin
fun processSecret(secret: ByteArray): ByteArray {
    val digest = computeDigest(secret)
    return try {
        digest
    } finally {
        // Zero-fill BOTH input and output
        secret.fill(0)
        // Only wipe digest if we're not returning it
        // (caller wipes after use)
    }
}

// When caller is done:
fun verifyAndWipe(input: ByteArray) {
    try {
        verify(input)
    } finally {
        input.fill(0)   // Wipe after verification
    }
}
```

### Pattern 3: Multiple Sensitive Buffers

```kotlin
fun processFactors(factors: List<ByteArray>): ProcessedResult {
    val digests = mutableListOf<ByteArray>()
    try {
        factors.forEach { factor ->
            val digest = computeSaltedDigest(factor)
            digests.add(digest)
        }
        return buildResult(digests)
    } finally {
        // Wipe all inputs
        factors.forEach { it.fill(0) }
        // Wipe intermediates that won't be returned
        if (digests.isNotEmpty()) {
            digests.forEach { it.fill(0) }
        }
    }
}
```

### Pattern 4: String-Based Secrets (Less Ideal)

If you receive a string (e.g., from HTTP request), convert to Buffer as early as possible:

```javascript
function handleSecret(req, res) {
    const rawPin = req.body.pin;  // String in memory

    // Convert to buffer ASAP
    const pinBuffer = Buffer.from(rawPin, 'utf-8');

    try {
        const result = verifyPin(pinBuffer);
        return res.json({ success: result });
    } finally {
        pinBuffer.fill(0);
        // Note: rawPin string is still in memory (V8 may not GC immediately)
        // This is a limitation — prefer Buffer from the start
    }
}
```

## Where To Wipe (Inventory)

| Data Type | When To Wipe | Code Pattern |
|-----------|-------------|-------------|
| API Keys | After validation | `finally { keyBuffer.fill(0) }` |
| Passwords | After hash comparison | `finally { password.fill(0) }` |
| Factor Digests | After storage/verification | `finally { digest.fill(0) }` |
| Encryption Keys | After crypto operation | `finally { key.fill(0) }` |
| Session Tokens | After verification | `finally { token.fill(0) }` |
| Decrypted Data | After use | `finally { plaintext.fill(0) }` |
| JWT Secrets | After sign/verify | `finally { secret.fill(0) }` |

## Testing That Wiping Works

```javascript
// Test that memory is actually zeroed after use
const crypto = require('crypto');

function testWipe() {
    const original = crypto.randomBytes(32);
    const copy = Buffer.from(original);  // Snapshot before wipe

    processSecret(original);  // Should wipe original

    // Read back — should be all zeros
    for (let i = 0; i < original.length; i++) {
        if (original[i] !== 0) {
            throw new Error(`Memory wipe failed at byte ${i}: got ${original[i]}`);
        }
    }

    console.log('Memory wipe verified: all bytes zeroed');
}
```

## Kotlin/JS Caveat

```kotlin
// Kotlin/JS: fill() may not truly zero memory in JS engines
// The JS Int8Array.fill(0) sets to 0, but V8 may have optimized copies
// Workaround: use a fresh buffer and rely on scope to trigger GC
```

In Kotlin/JS, `ByteArray.fill(0)` sets the array elements to 0 in the JS TypedArray, but the underlying `ArrayBuffer` may have been detached or copied by V8 optimizations. The safest approach is to minimize the time secrets spend in memory and use short-lived, scoped variables.

## Anti-Patterns

| Anti-Pattern | Fix |
|-------------|-----|
| Rely on GC or `delete` to wipe secrets | GC doesn't zero memory. Use explicit `.fill(0)`. |
| Wipe the return value (caller needs it) | Return the value, let the caller wipe it. Only wipe what you own. |
| Wipe without try/finally (skipped on error) | Always `try { ... } finally { wipe }` |
| Only wipe the input, not intermediate buffers | Track EVERY buffer that held secret data |
| Wipe strings by reassigning (`secret = ''`) | Strings are immutable in JS/Kotlin. The old value persists in memory until GC. Use Buffer/ByteArray instead. |
| Not wiping in tests | Test includes a `verifyWipe()` assertion |

## Checklist

- [ ] Every secret is in a Buffer/ByteArray (not String)
- [ ] Every use of a secret has `try { } finally { fill(0) }`
- [ ] Intermediate buffers are tracked and wiped
- [ ] Secrets are not returned unnecessarily (caller wipes after use)
- [ ] Tests verify that buffers are zeroed after use
- [ ] Kotlin/JS secrets are scoped to minimize memory lifetime
