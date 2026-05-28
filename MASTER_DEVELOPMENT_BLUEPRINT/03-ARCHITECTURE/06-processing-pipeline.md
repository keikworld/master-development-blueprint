# Processing Pipeline Pattern

## Why

Most features follow the same data flow: validate → transform → secure → store. This pattern makes every step explicit, testable, and swappable without changing the others.

## The Pattern

```
Input → [Validate] → [Normalize] → [Hash/Encrypt] → [Store]
            │             │              │              │
            ▼             ▼              ▼              ▼
        Reject bad   Consistent    Secure for     Persist for
        input        format        storage        later use
```

Each step has a single responsibility. Steps can be added, removed, or reordered without affecting others.

---

## Implementation

### Step 1: Validate

Check input meets requirements BEFORE any processing. Fail fast, fail safely.

```kotlin
fun validate(input: FactorInput): ValidationResult {
    val errors = mutableListOf<String>()

    if (input.value.isBlank()) errors.add("Factor value cannot be blank")
    if (input.value.length > MAX_INPUT_SIZE) errors.add("Input exceeds ${MAX_INPUT_SIZE} bytes")
    if (checkKnownWeak(input)) errors.add("Weak factor detected: ${input.type}")

    return if (errors.isEmpty()) ValidationResult.Valid
           else ValidationResult.Invalid(errors)
}
```

```javascript
function validateFactorInput(input) {
    const errors = [];
    if (!input.value || input.value.trim() === '') errors.push('Value cannot be blank');
    if (input.value.length > MAX_BYTES) errors.push(`Exceeds ${MAX_BYTES} bytes`);
    if (isWeakFactor(input)) errors.push('Weak factor detected');
    return errors.length === 0 ? { valid: true } : { valid: false, errors };
}
```

### Step 2: Normalize

Convert input to consistent format so the same input always produces the same digest.

```kotlin
fun normalize(value: String): String {
    return when (factorType) {
        Factor.PIN -> value.trim()                           // " 1234 " → "1234"
        Factor.COLOUR -> value.lowercase().replace("#", "")  // "#FF5733" → "ff5733"
        Factor.EMOJI -> value.trim()                          // Emojis are already canonical
        Factor.PATTERN -> value.replace(" ", "")              // Remove whitespace
        Factor.WORDS -> value.lowercase().trim()              // Case-insensitive
        else -> value.trim()
    }
}
```

### Step 3: Hash/Encrypt

Transform into irreversible, secure format. Never store raw input.

```kotlin
fun process(normalized: String, uuid: String, factorType: String): ByteArray {
    // Salted HMAC (not raw SHA-256)
    return FactorDigest.compute(
        factorType = factorType,
        uuid = uuid,
        data = normalized.encodeToByteArray()
    )
}
```

```javascript
function hash(digest) {
    // Constant-time: always compute, even if will fail
    return crypto.createHash('sha256').update(digest).digest();
}
```

### Step 4: Store

Persist the digest, NOT the raw input. Set TTL. Ensure retrieval is possible.

```kotlin
data class FactorRecord(
    val type: String,
    val digest: ByteArray,
    val createdAt: Long,
    val expiresAt: Long     // TTL-based expiry
)

interface FactorRepository {
    suspend fun store(uuid: String, factor: FactorRecord)
    suspend fun retrieve(uuid: String, type: String): FactorRecord?
    suspend fun delete(uuid: String, type: String)
}
```

---

## Full Pipeline (Example: FactorProcessor)

```kotlin
class FactorProcessor(private val doubleLayerEncryption: DoubleLayerEncryption) {

    suspend fun processFactor(
        factor: Factor,
        rawValue: String,
        uuid: String
    ): ProcessedFactor {
        // Step 1: Validate
        val validation = validateFactor(factor, rawValue)
        if (!validation.isValid) {
            throw FactorException(validation.errors.joinToString(", "))
        }

        // Step 2: Normalize
        val normalized = normalizeFactor(factor, rawValue)

        // Step 3: Hash (salted HMAC)
        val digest = computeSaltedDigest(factor, normalized, uuid)

        // Step 4: Encrypt (double-layer: PBKDF2 + KMS)
        val encrypted = doubleLayerEncryption.encrypt(digest, uuid)

        // Step 5: Prepare for storage (never store raw digest)
        return ProcessedFactor(
            type = factor.name,
            encryptedDigest = encrypted.wrappedKey,
            metadata = FactorMetadata(
                category = factor.category,
                securityLevel = factor.securityLevel,
                createdAt = currentTimeMillis(),
                expiresAt = currentTimeMillis() + TTL_24H
            )
        )
    }
}
```

---

## Benefits

| Concern | Without Pipeline | With Pipeline |
|---------|-----------------|---------------|
| Adding validation | Hunt through 15 files | Add one step function |
| Testing | Test the whole flow (slow, brittle) | Test each step in isolation |
| Changing encryption | Change every call site | Swap Step 3 implementation |
| Debugging failures | "Where did it fail?" log spelunking | Step knows its error codes |
| Adding a factor | Copy-paste a whole file, hoping it's right | Add validate/normalize/hash for new type |

---

## Applying To Any Project

```javascript
// Generic pipeline template
class ProcessingPipeline {
    constructor(steps) {
        this.steps = steps;  // Array of { name, handler }
    }

    async execute(input, context = {}) {
        let data = input;
        for (const step of this.steps) {
            try {
                data = await step.handler(data, context);
            } catch (err) {
                throw new PipelineError(`Step '${step.name}' failed: ${err.message}`, step.name);
            }
        }
        return data;
    }
}

// Usage
const authPipeline = new ProcessingPipeline([
    { name: 'validate', handler: validateInput },
    { name: 'normalize', handler: normalizeInput },
    { name: 'hash', handler: hashInput },
    { name: 'encrypt', handler: encryptInput },
    { name: 'store', handler: storeInput },
]);

const result = await authPipeline.execute(rawInput, { uuid, factorType });
```

---

## Anti-Patterns

| Anti-Pattern | Fix |
|-------------|-----|
| Steps mutate shared state | Each step receives input, returns output (pure functions) |
| Steps skip validation because "it was already validated upstream" | Every step validates its own input — defense in depth |
| Pipeline is hardcoded (can't reorder steps) | Array of step functions, configurable at construction |
| Error in step 3 leaves partial state | Either all steps succeed (commit) or none (rollback) |
| Pipeline only works synchronously | Async pipeline with Promise chain (each step awaits previous) |
