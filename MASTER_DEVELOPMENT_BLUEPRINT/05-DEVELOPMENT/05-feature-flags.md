# Feature Flag / Toggle System

## Why

Feature flags let you enable/disable features per environment, platform, or test config without changing code. No more `if (NODE_ENV === 'development')` scattered everywhere.

## The Pattern: Three Layers

```
Layer 1: Build-Time (gradle.properties or .env)
  → Disables features at compile time (platform-specific: no biometrics on web)
  → Zero runtime overhead for disabled features

Layer 2: Runtime Config (environment variables)
  → Controls features per deployment (dev gets experimental features, prod doesn't)

Layer 3: Test Override (programmatic)
  → Enables specific features for test cases
  → Reset between tests to prevent state leakage
```

## Layer 1: Build-Time Toggles

```kotlin
// gradle.properties
yourproject.feature.voice=false       # Voice not ready for mobile
yourproject.feature.nfc=true          # NFC ready
yourproject.feature.biometric=false   # Biometric blocked on this platform

// FactorConfig.kt — build-time filter
object FactorConfig {
    private val disabledAtBuild = setOf(
        "voice", "biometric"
    )

    fun availableFactors(allFactors: List<Factor>): List<Factor> {
        return allFactors.filter { it.name.lowercase() !in disabledAtBuild }
    }
}
```

```javascript
// .env — equivalent for Node.js
FEATURE_VOICE=false
FEATURE_NFC=true
FEATURE_BIOMETRIC=false
```

## Layer 2: Runtime Override

```kotlin
object FactorConfig {
    private val runtimeOverrides = mutableMapOf<Factor, Boolean>()

    // Called at startup from env config
    fun configureFromEnv(config: Map<String, String>) {
        Factor.entries.forEach { factor ->
            val key = "FACTOR_${factor.name}"
            config[key]?.let { value ->
                runtimeOverrides[factor] = value.toBoolean()
            }
        }
    }

    fun isEnabled(factor: Factor): Boolean {
        // Runtime override wins, then build-time default
        return runtimeOverrides[factor] ?: !disabledAtBuild.contains(factor.name.lowercase())
    }
}
```

## Layer 3: Test Override

```kotlin
// FactorTestSupport.kt — test-only helpers
object FactorTestSupport {
    /**
     * Enable only specific factors for a test.
     * Auto-resets on test teardown.
     */
    fun enableOnly(vararg factors: Factor) {
        Factor.entries.forEach { FactorConfig.override(it, it in factors) }
    }

    fun enableBasicFactors() {
        enableOnly(Factor.PIN, Factor.PATTERN, Factor.EMOJI, Factor.COLOR, Factor.WORDS)
    }

    fun resetDefaults() {
        FactorConfig.resetOverrides()
    }
}

// In a test:
@Test
fun `should verify PIN-only enrollment`() {
    FactorTestSupport.enableOnly(Factor.PIN)
    // ... test logic
    // Teardown auto-resets
}
```

```javascript
// JavaScript equivalent
class FeatureToggle {
    constructor() {
        this._overrides = new Map();
        this._defaults = this._loadDefaults();
    }

    _loadDefaults() {
        return {
            voice: process.env.FEATURE_VOICE === 'true',
            nfc: process.env.FEATURE_NFC !== 'false', // default true
            biometric: process.env.FEATURE_BIOMETRIC === 'true',
        };
    }

    isEnabled(feature) {
        if (this._overrides.has(feature)) return this._overrides.get(feature);
        return this._defaults[feature] ?? false;
    }

    // For testing
    _override(feature, enabled) {
        this._overrides.set(feature, enabled);
    }

    _reset() {
        this._overrides.clear();
    }
}
```

## Platform-Specific Filtering

```kotlin
object FactorConfig {
    // Platform constraints
    fun platformDisabledFactors(): Set<Factor> {
        return when (platform) {
            Platform.ANDROID -> setOf(Factor.STYLUS_DRAW)  // No stylus API
            Platform.IOS -> setOf(Factor.NFC)              // NFC restricted
            Platform.WEB -> setOf(Factor.FACE, Factor.FINGERPRINT)  // No biometric API
            Platform.DESKTOP -> emptySet()
        }
    }
}
```

## Override Chain (Priority: High → Low)

```
Test override (highest priority)
  → Runtime .env config
    → Platform-specific disabled
      → Build-time flags
        → Compile-time default (lowest priority)
```

## Test Presets

```kotlin
object FactorTestPresets {
    fun enableAll() = Factor.entries.forEach { FactorConfig.override(it, true) }
    fun disableAll() = Factor.entries.forEach { FactorConfig.override(it, false) }
    fun enableBasic() = enableOnly(PIN, PATTERN, EMOJI, COLOR, WORDS)
    fun enableBiometric() = enableOnly(FACE, FINGERPRINT, VOICE)
    fun enableBehavioral() = enableOnly(RHYTHM_TAP, MOUSE_DRAW, STYLUS_DRAW, IMAGE_TAP)

    // Smoke test preset — validates the toggle system itself
    fun smokeTest() {
        enableAll()
        assert(Factor.entries.all { FactorConfig.isEnabled(it) })
        disableAll()
        assert(Factor.entries.none { FactorConfig.isEnabled(it) })
        resetDefaults()
    }
}
```

## Anti-Patterns

| Anti-Pattern | Fix |
|-------------|-----|
| `if (NODE_ENV === 'development')` scattered globally | Centralized FeatureToggle class, one source of truth |
| Features disabled by commenting out code | Build-time flags — code stays, toggle controls visibility |
| Test state leaks between tests | `_reset()` / `resetForTesting()` in `@AfterEach` / `@BeforeEach` |
| No way to enable features per-platform | `platformDisabledFactors()` set per platform |
| Boolean toggles are binary (on/off) when you need more | Use `enum class FeatureState { ENABLED, DISABLED, BETA, DEPRECATED }` |

## Checklist

- [ ] Every feature has a named toggle (not scattered conditionals)
- [ ] Build-time flags for compile-time elimination
- [ ] Runtime env config for per-deployment control
- [ ] Test overrides with auto-reset
- [ ] Platform constraints mapped per target
- [ ] Presets for common test configurations
