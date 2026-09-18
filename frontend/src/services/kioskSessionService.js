/**
 * CaseFlow Kiosk Inactivity & Session Privacy Manager (SIH26047)
 *
 * Centralized manager for hospital self-service kiosks:
 * - Automatically tracks user inactivity across the patient intake flow.
 * - Displays a bilingual warning dialog before expiry with a live countdown.
 * - Resets timer on meaningful interaction (clicks, touch, keys, question submission).
 * - On expiry, clears all local patient context and returns to Welcome.
 * - Does NOT delete backend SQLite database records or affect doctor queue.
 */

import { patientService } from './patientService.js';
import { interviewService } from './interviewService.js';

const DEFAULT_TIMEOUT_MS = 120_000; // 2 minutes
const DEFAULT_WARNING_MS = 20_000;  // 20 seconds warning

class KioskSessionService {
  constructor() {
    this.timeoutMs = DEFAULT_TIMEOUT_MS;
    this.warningMs = DEFAULT_WARNING_MS;
    this.isActive = false;
    this.isWarning = false;
    this.remainingSeconds = 0;

    this._subscribers = new Set();
    this._inactivityTimer = null;
    this._countdownInterval = null;
    this._lastActivityTime = Date.now();
    this._onTimeoutCallback = null;
    this._boundActivityHandler = this._handleUserActivity.bind(this);

    this._readConfig();
  }

  _readConfig() {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const demoTimeout = params.get('demoTimeout');
        const demoWarning = params.get('demoWarning');
        if (demoTimeout) {
          this.timeoutMs = parseInt(demoTimeout, 10) * 1000;
        }
        if (demoWarning) {
          this.warningMs = parseInt(demoWarning, 10) * 1000;
        }
      } catch (e) {
        // Ignore URLSearchParams parse errors
      }

      if (typeof import.meta !== 'undefined' && import.meta.env) {
        if (import.meta.env.VITE_KIOSK_INACTIVITY_TIMEOUT_MS) {
          this.timeoutMs = parseInt(import.meta.env.VITE_KIOSK_INACTIVITY_TIMEOUT_MS, 10);
        }
        if (import.meta.env.VITE_KIOSK_WARNING_DURATION_MS) {
          this.warningMs = parseInt(import.meta.env.VITE_KIOSK_WARNING_DURATION_MS, 10);
        }
      }
    }
  }

  /**
   * Programmatic configuration for testing or demo environments
   */
  configure({ timeoutMs, warningMs, onTimeout } = {}) {
    if (timeoutMs != null) this.timeoutMs = timeoutMs;
    if (warningMs != null) this.warningMs = warningMs;
    if (onTimeout != null) this._onTimeoutCallback = onTimeout;
    if (this.isActive) {
      this.recordActivity();
    }
  }

  /**
   * Subscribe to timer state updates ({ isWarning, remainingSeconds, isActive })
   */
  subscribe(callback) {
    this._subscribers.add(callback);
    callback(this.getState());
    return () => this._subscribers.delete(callback);
  }

  _notify() {
    const state = this.getState();
    this._subscribers.forEach((cb) => {
      try {
        cb(state);
      } catch (err) {
        console.error('Error in kioskSession subscriber:', err);
      }
    });
  }

  getState() {
    return {
      isActive: this.isActive,
      isWarning: this.isWarning,
      remainingSeconds: this.remainingSeconds,
      timeoutMs: this.timeoutMs,
      warningMs: this.warningMs
    };
  }

  /**
   * Start monitoring inactivity for the active kiosk session
   */
  start(onTimeout = null) {
    if (onTimeout) {
      this._onTimeoutCallback = onTimeout;
    }
    this.isActive = true;
    this.isWarning = false;
    this.remainingSeconds = Math.ceil(this.warningMs / 1000);
    this._lastActivityTime = Date.now();

    this._attachDomListeners();
    this._scheduleTimers();
    this._notify();
  }

  /**
   * Stop inactivity monitoring (e.g. when on Welcome screen or Doctor portal)
   */
  stop() {
    this.isActive = false;
    this.isWarning = false;
    this._clearTimers();
    this._detachDomListeners();
    this._notify();
  }

  /**
   * Records a user activity event, resetting the inactivity timer
   */
  recordActivity() {
    if (!this.isActive) return;

    this._lastActivityTime = Date.now();

    // If warning dialog was showing, dismiss it and reset to active
    if (this.isWarning) {
      this.isWarning = false;
      this._notify();
    }

    this._scheduleTimers();
  }

  /**
   * Explicitly extend the session from the warning modal
   */
  extendSession() {
    this.recordActivity();
  }

  _handleUserActivity() {
    const now = Date.now();
    // Throttle activity recording to 200ms
    if (now - this._lastActivityTime > 200) {
      this.recordActivity();
    }
  }

  _attachDomListeners() {
    if (typeof window === 'undefined') return;
    const opts = { passive: true };
    window.addEventListener('pointerdown', this._boundActivityHandler, opts);
    window.addEventListener('touchstart', this._boundActivityHandler, opts);
    window.addEventListener('keydown', this._boundActivityHandler, opts);
    window.addEventListener('click', this._boundActivityHandler, opts);
    window.addEventListener('caseflow-patient-activity', this._boundActivityHandler);
  }

  _detachDomListeners() {
    if (typeof window === 'undefined') return;
    window.removeEventListener('pointerdown', this._boundActivityHandler);
    window.removeEventListener('touchstart', this._boundActivityHandler);
    window.removeEventListener('keydown', this._boundActivityHandler);
    window.removeEventListener('click', this._boundActivityHandler);
    window.removeEventListener('caseflow-patient-activity', this._boundActivityHandler);
  }

  _clearTimers() {
    if (this._inactivityTimer) {
      clearTimeout(this._inactivityTimer);
      this._inactivityTimer = null;
    }
    if (this._countdownInterval) {
      clearInterval(this._countdownInterval);
      this._countdownInterval = null;
    }
  }

  _scheduleTimers() {
    this._clearTimers();

    const timeUntilWarning = Math.max(0, this.timeoutMs - this.warningMs);

    this._inactivityTimer = setTimeout(() => {
      this._enterWarningState();
    }, timeUntilWarning);
  }

  _enterWarningState() {
    this.isWarning = true;
    const warningDurationSec = Math.max(1, Math.ceil(this.warningMs / 1000));
    this.remainingSeconds = warningDurationSec;
    this._notify();

    // Scale tick interval for sub-second tests or demos
    const tickIntervalMs = this.warningMs < 1000 ? Math.max(20, Math.floor(this.warningMs / warningDurationSec)) : 1000;

    this._countdownInterval = setInterval(() => {
      this.remainingSeconds -= 1;
      this._notify();

      if (this.remainingSeconds <= 0) {
        this._clearTimers();
        this.expireSession();
      }
    }, tickIntervalMs);
  }

  /**
   * Cleans up the active patient session for privacy and invokes timeout callback
   */
  expireSession() {
    this.isWarning = false;
    this._clearTimers();

    // 1. Clear active patient/session context from storage
    patientService.clearCurrentPatient();

    // 2. Clear in-memory interview session
    if (interviewService && typeof interviewService.clearSession === 'function') {
      interviewService.clearSession();
    }

    // 3. Dispatch session cleared event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('caseflow-session-cleared'));
    }

    this._notify();

    // 4. Trigger navigation callback
    if (typeof this._onTimeoutCallback === 'function') {
      this._onTimeoutCallback();
    }
  }

  /**
   * Manual session reset (e.g. from "Start Over" button)
   */
  resetSession() {
    this.expireSession();
  }
}

export const kioskSessionService = new KioskSessionService();
