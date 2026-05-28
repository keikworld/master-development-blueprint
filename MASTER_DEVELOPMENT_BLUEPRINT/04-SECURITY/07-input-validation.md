# Input Validation (Defense in Depth)

## Why

Every input is an attack vector. Validation is not "checking the format" — it's the first layer of defense against injection, buffer overflow, DoS via large payloads, and logic bypass.

**Rule:** Validate at EVERY layer, not just the API boundary. Never trust that "it was already validated upstream."

## The 5 Checks

Every input must pass ALL checks relevant to its type:

| Check | What It Prevents | Example |
|-------|-----------------|---------|
| **1. Existence** | Null/undefined crashes | `value == null || value === undefined` |
| **2. Type** | Type confusion, injection | `typeof value === 'string'` |
| **3. Size** | Buffer overflow, memory DoS | `value.length <= MAX_BYTES` |
| **4. Format** | Invalid structure, injection chars | Regex pattern, charset whitelist |
| **5. Semantic** | Business logic bypass | PIN is not "1234", password meets strength |

## Implementation

### Existence + Type Check (Always First)

```javascript
function requireString(value, name) {
    if (value === null || value === undefined) {
        throw new ValidationError(`${name} is required`);
    }
    if (typeof value !== 'string') {
        throw new ValidationError(`${name} must be a string`);
    }
    return value.trim();
}

function requireNumber(value, name) {
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
        throw new ValidationError(`${name} must be a finite number`);
    }
    return value;
}

function requireBoolean(value, name) {
    if (typeof value !== 'boolean') {
        throw new ValidationError(`${name} must be a boolean`);
    }
    return value;
}
```

### Size Check (DoS Protection)

```javascript
// Hard limits — enforced BEFORE any processing
const MAX_INPUT_SIZE = 1024 * 10;        // 10KB for most inputs
const MAX_FACTOR_SIZE = 1024 * 100;       // 100KB for factor values (voice data)
const MAX_DIGEST_SIZE = 64;               // 64 bytes for SHA-256 digests
const MAX_FACTORS_PER_REQUEST = 15;       // Prevent enrollment of 1000 factors

function checkSize(value, maxBytes, name) {
    const bytes = Buffer.byteLength(value, 'utf-8');
    if (bytes > maxBytes) {
        throw new ValidationError(
            `${name} exceeds ${maxBytes} bytes (got ${bytes})`,
            { max: maxBytes, actual: bytes }
        );
    }
}
```

```kotlin
// Kotlin (KMP) equivalent
const val MAX_SAFE_INPUT = 1024 * 10
const val MAX_FACTOR_VALUE = 1024 * 100

fun checkInputSize(data: ByteArray, maxBytes: Int, name: String) {
    if (data.size > maxBytes) {
        throw FactorValidationException(
            "$name exceeds ${maxBytes} bytes (got ${data.size})"
        )
    }
}
```

### Format Check (Sanitization)

```javascript
const FORMAT_RULES = {
    // PIN: exactly 4-8 digits
    pin: { regex: /^\d{4,8}$/, message: 'PIN must be 4-8 digits' },
    // UUID: standard format
    uuid: { regex: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, message: 'Invalid UUID format' },
    // Hex digest: 64 hex chars (SHA-256)
    digest: { regex: /^[0-9a-f]{64}$/i, message: 'Invalid digest format' },
    // No control characters (any field)
    noControl: { regex: /^[\x20-\x7E]*$/, message: 'Control characters not allowed' },
};

function checkFormat(value, rule, name) {
    if (!rule.regex.test(value)) {
        throw new ValidationError(`${name}: ${rule.message}`);
    }
}

// Composite: check multiple formats
function validateFactorType(value) {
    const VALID_TYPES = ['PIN', 'PATTERN', 'EMOJI', 'COLOUR', 'WORDS',
                         'VOICE', 'FACE', 'FINGERPRINT', 'RHYTHM_TAP',
                         'MOUSE_DRAW', 'STYLUS_DRAW', 'IMAGE_TAP',
                         'NFC', 'BALANCE'];
    if (!VALID_TYPES.includes(value)) {
        throw new ValidationError(`Unknown factor type: ${value}`);
    }
}
```

### Semantic Check (Business Logic)

```javascript
function checkSemantic(value, type) {
    switch (type) {
        case 'PIN':
            // Block weak/sequential PINs
            const weak = ['1234', '0000', '1111', '2580'];
            if (weak.includes(value)) {
                throw new ValidationError('Weak PIN: too common');
            }
            break;

        case 'WORDS':
            // Block single-word answers (too guessable)
            const wordCount = value.split(/\s+/).length;
            if (wordCount < 2) {
                throw new ValidationError('Must include at least 2 words');
            }
            break;

        case 'PASSWORD':
            // Minimum password complexity
            if (!/[A-Z]/.test(value)) throw new ValidationError('Needs uppercase');
            if (!/[a-z]/.test(value)) throw new ValidationError('Needs lowercase');
            if (!/[0-9]/.test(value)) throw new ValidationError('Needs number');
            break;
    }
}
```

### Pipeline: All 4 Checks Together

```javascript
function validateInput(value, rules, context) {
    // Order matters: existence → type → size → format → semantic
    // Fail fast at the simplest check

    // Step 1: Existence
    if (value == null) {
        throw new ValidationError(`${context.name} is required`);
    }

    // Step 2: Type
    if (typeof value !== rules.type) {
        throw new ValidationError(`${context.name} must be ${rules.type}`);
    }

    // Step 3: Size (before format — prevents regex DoS on huge input)
    if (rules.maxBytes && Buffer.byteLength(value, 'utf-8') > rules.maxBytes) {
        throw new ValidationError(`${context.name} exceeds ${rules.maxBytes} bytes`);
    }

    // Step 4: Format
    if (rules.format && !rules.format.test(value)) {
        throw new ValidationError(`${context.name}: ${rules.formatMessage}`);
    }

    // Step 5: Semantic
    if (rules.semantic) {
        rules.semantic(value);
    }

    return value.trim();  // Return normalized
}
```

## Middleware Integration

```javascript
// Express middleware that validates before handler
function validateRequestBody(schema) {
    return (req, res, next) => {
        const errors = [];

        for (const [field, rules] of Object.entries(schema)) {
            try {
                req.body[field] = validateInput(req.body[field], rules, { name: field });
            } catch (err) {
                errors.push(err.message);
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: errors.join('; ') }
            });
        }

        next();
    };
}

// Route usage
router.post('/v1/enrollment',
    validateRequestBody({
        uuid: { type: 'string', maxBytes: 36, format: FORMAT_RULES.uuid, formatMessage: 'Invalid UUID' },
        pin: { type: 'string', maxBytes: 10, format: FORMAT_RULES.pin, formatMessage: 'PIN must be 4-8 digits' },
        factorType: { type: 'string', maxBytes: 20, semantic: validateFactorType },
    }),
    enrollmentHandler
);
```

## Multi-Layer Validation (Defense in Depth)

```
Layer 1: API Gateway / Middleware
  → Reject malformed requests before reaching handler

Layer 2: Route Handler
  → Validate business logic, data relationships

Layer 3: Service Layer
  → Validate internal consistency, preconditions

Layer 4: Database Layer
  → Constraints, foreign keys, unique indexes (last resort)

Layer 5: Output Encoding
  → Escape output to prevent XSS, injection in responses
```

## Anti-Patterns

| Anti-Pattern | Fix |
|-------------|-----|
| Only validate at the API boundary | Every layer validates its own input (defense in depth) |
| Skip size check "because it's just a small field" | Always check size — even "small" fields can carry huge values |
| Return detailed validation errors in production | Return "Invalid input" (generic), log details server-side |
| Use `eval()` or `new Function()` to "validate" | Regex/parser validation only — never execute user input |
| Check size AFTER type coercion | Check size BEFORE any processing (huge string could OOM parser) |
| Case-insensitive comparison of PINs | PINs and passwords are case-sensitive (double the search space) |

## Checklist

- [ ] Every user input field checked: existence → type → size → format → semantic
- [ ] Size checked BEFORE regex/parsing (prevents ReDoS)
- [ ] Hard limits defined per field type (MAX_BYTES, MAX_LENGTH)
- [ ] Format checked via whitelist regex (not blacklist)
- [ ] Semantic checks for weak/common values
- [ ] Validation at EVERY layer (not just API boundary)
- [ ] Error messages are generic in production, detailed in logs
- [ ] All input is normalized after validation (trim, lowercase if applicable)
