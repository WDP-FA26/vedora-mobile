export const MIC_THRESHOLD_MIN_DB = -70
export const MIC_THRESHOLD_MAX_DB = -10
/** Default manual threshold at 40% of the [-70, -10] dB sensitivity range. */
export const DEFAULT_MIC_THRESHOLD_DB = -46
const NOISE_FLOOR_INITIAL_DB = -58
const NOISE_FLOOR_MIN_DB = -75
const NOISE_FLOOR_MAX_DB = -25
const AUTO_MIN_THRESHOLD_DB = -52
const AUTO_MAX_THRESHOLD_DB = -24
const AUTO_HEADROOM_DB = 10
const GATE_HYSTERESIS_DB = 6
export const GATE_HOLD_MS = 260
const MIN_DB = -100

export type VoiceMicSettings = {
  autoSensitivity: boolean
  thresholdDb: number
}

export type VoiceMicMeterSnapshot = {
  levelDb: number
  thresholdDb: number
  open: boolean
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function defaultVoiceMicSettings(): VoiceMicSettings {
  return {
    autoSensitivity: true,
    thresholdDb: DEFAULT_MIC_THRESHOLD_DB,
  }
}

export function pcm16RmsDb(samples: Int16Array): number {
  if (samples.length === 0) return MIN_DB
  let sum = 0
  for (let i = 0; i < samples.length; i += 1) {
    const normalized = samples[i] / 32768
    sum += normalized * normalized
  }
  const rms = Math.sqrt(sum / samples.length)
  if (rms <= 1e-5) return MIN_DB
  return Math.max(MIN_DB, 20 * Math.log10(rms))
}

/**
 * Discord-style input sensitivity noise gate with automatic ambient noise floor tracking,
 * hysteresis, and hangover hold so soft word endings are preserved while steady room/fan
 * noise is replaced with clean digital silence before reaching GPT-Live.
 */
export class VoiceNoiseGate {
  private auto: boolean
  private manualThresholdDb: number
  private noiseFloorDb = NOISE_FLOOR_INITIAL_DB
  private open = false
  private holdUntil = 0
  private lastLevelDb = MIN_DB

  constructor(settings: VoiceMicSettings = defaultVoiceMicSettings()) {
    this.auto = settings.autoSensitivity
    this.manualThresholdDb = clamp(settings.thresholdDb, MIC_THRESHOLD_MIN_DB, MIC_THRESHOLD_MAX_DB)
  }

  configure(settings: VoiceMicSettings): void {
    this.auto = settings.autoSensitivity
    this.manualThresholdDb = clamp(settings.thresholdDb, MIC_THRESHOLD_MIN_DB, MIC_THRESHOLD_MAX_DB)
  }

  reset(): void {
    this.noiseFloorDb = NOISE_FLOOR_INITIAL_DB
    this.open = false
    this.holdUntil = 0
    this.lastLevelDb = MIN_DB
  }

  effectiveThresholdDb(): number {
    if (!this.auto) return this.manualThresholdDb
    return clamp(this.noiseFloorDb + AUTO_HEADROOM_DB, AUTO_MIN_THRESHOLD_DB, AUTO_MAX_THRESHOLD_DB)
  }

  processDb(levelDb: number, now = Date.now()): boolean {
    const clampedDb = clamp(levelDb, MIN_DB, 0)
    this.lastLevelDb = clampedDb

    // Track ambient noise floor asymmetrically: fall quickly in silence, rise slowly on steady room noise
    // (capped below typical speech levels so loud speech bursts never drag the floor up).
    if (clampedDb < this.noiseFloorDb) {
      this.noiseFloorDb += (clampedDb - this.noiseFloorDb) * 0.08
    } else if (clampedDb <= NOISE_FLOOR_MAX_DB) {
      this.noiseFloorDb += (clampedDb - this.noiseFloorDb) * 0.015
    }
    this.noiseFloorDb = clamp(this.noiseFloorDb, NOISE_FLOOR_MIN_DB, NOISE_FLOOR_MAX_DB)

    const openDb = this.effectiveThresholdDb()
    const closeDb = openDb - GATE_HYSTERESIS_DB

    if (clampedDb >= openDb) {
      this.open = true
      this.holdUntil = now + GATE_HOLD_MS
      return true
    }

    if (this.open) {
      if (clampedDb >= closeDb) {
        this.holdUntil = now + GATE_HOLD_MS
        return true
      }
      if (now < this.holdUntil) {
        return true
      }
      this.open = false
    }

    return false
  }

  processSamples(samples: Int16Array, now = Date.now()): boolean {
    return this.processDb(pcm16RmsDb(samples), now)
  }

  snapshot(): VoiceMicMeterSnapshot {
    return {
      levelDb: this.lastLevelDb,
      thresholdDb: this.effectiveThresholdDb(),
      open: this.open,
    }
  }
}
