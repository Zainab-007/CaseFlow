/**
 * Automated Unit Tests for Kiosk Inactivity & Privacy Manager
 * Runs with Node.js built-in test runner: node --test frontend/tests/kioskInactivity.test.js
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';

// Mock browser environment for Node.js test runner
const mockStorage = new Map();
global.window = {
  location: { search: '' },
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: (event) => {}
};
global.sessionStorage = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear()
};
global.CustomEvent = class CustomEvent {
  constructor(name, detail) {
    this.name = name;
    this.detail = detail;
  }
};

// Import services
import { kioskSessionService } from '../src/services/kioskSessionService.js';
import { patientService } from '../src/services/patientService.js';
import { interviewService } from '../src/services/interviewService.js';

describe('Kiosk Inactivity Timeout & Privacy Manager', () => {
  beforeEach(() => {
    mockStorage.clear();
    kioskSessionService.stop();
    kioskSessionService.configure({
      timeoutMs: 300,
      warningMs: 100
    });
  });

  afterEach(() => {
    kioskSessionService.stop();
  });

  test('1. Inactivity detection transitions from ACTIVE to WARNING state', async () => {
    let enteredWarning = false;
    const unsub = kioskSessionService.subscribe((state) => {
      if (state.isWarning) enteredWarning = true;
    });

    kioskSessionService.start();
    assert.strictEqual(kioskSessionService.getState().isActive, true);
    assert.strictEqual(kioskSessionService.getState().isWarning, false);

    // Wait for warning threshold (timeoutMs - warningMs = 200ms)
    await new Promise((r) => setTimeout(r, 230));

    assert.strictEqual(enteredWarning, true, 'Should enter warning state after idle threshold');
    assert.strictEqual(kioskSessionService.getState().isWarning, true);
    unsub();
  });

  test('2. Timer resets on user interaction and dismisses warning', async () => {
    kioskSessionService.start();

    // Wait until warning triggers
    await new Promise((r) => setTimeout(r, 230));
    assert.strictEqual(kioskSessionService.getState().isWarning, true);

    // User interacts (clicks / touches screen / answers question)
    kioskSessionService.recordActivity();

    assert.strictEqual(kioskSessionService.getState().isWarning, false, 'Warning must be dismissed upon user activity');
    assert.strictEqual(kioskSessionService.getState().isActive, true, 'Timer must remain active and reset');
  });

  test('3. Countdown counts down during warning state', async () => {
    kioskSessionService.configure({
      timeoutMs: 400,
      warningMs: 250
    });

    kioskSessionService.start();
    await new Promise((r) => setTimeout(r, 180));

    const state = kioskSessionService.getState();
    assert.strictEqual(state.isWarning, true);
    assert.ok(state.remainingSeconds > 0, 'Should display positive countdown seconds');
  });

  test('4. Automatic expiry fires callback when countdown reaches zero', async () => {
    let expired = false;

    kioskSessionService.configure({
      timeoutMs: 150,
      warningMs: 80
    });

    kioskSessionService.start(() => {
      expired = true;
    });

    // Wait for full timeout to elapse
    await new Promise((r) => setTimeout(r, 260));

    assert.strictEqual(expired, true, 'Timeout callback must be invoked upon expiry');
    assert.strictEqual(kioskSessionService.getState().isWarning, false, 'Warning state resets after expiry');
  });

  test('5. Session cleanup clears active patient context and storage', () => {
    // Simulate active patient in session
    patientService.setCurrentPatientId('CF-PRIVACY-TEST-001');
    patientService.setPatientLanguage('hi');

    assert.strictEqual(patientService.getCurrentPatientId(), 'CF-PRIVACY-TEST-001');
    assert.strictEqual(sessionStorage.getItem('caseflow_patient_lang'), 'hi');

    // Trigger kiosk expiry
    kioskSessionService.expireSession();

    // Verify session storage and patient context are cleared
    assert.strictEqual(patientService.getCurrentPatientId(), null, 'Patient ID must be cleared');
    assert.strictEqual(sessionStorage.getItem('caseflow_patient_lang'), null, 'Language preference must be cleared');
    assert.strictEqual(sessionStorage.getItem('caseflow_current_patient_id'), null, 'Session key must be cleared');
  });

  test('6. Patient data isolation: subsequent patient starts completely clean', () => {
    // Patient 1 enters kiosk
    patientService.setCurrentPatientId('CF-PATIENT-1');
    patientService.setPatientLanguage('hi');
    assert.strictEqual(patientService.getCurrentPatientId(), 'CF-PATIENT-1');

    // Session times out
    kioskSessionService.expireSession();

    // Patient 2 arrives at kiosk
    const patient2InitialId = patientService.getCurrentPatientId();
    assert.strictEqual(patient2InitialId, null, 'New patient must not inherit previous patient ID');

    // Default language defaults to clean fallback
    const patient2Lang = patientService.getPatientLanguage();
    assert.strictEqual(patient2Lang, 'en', 'New patient must start with default unpolluted language');

    // Patient 2 sets new credentials
    patientService.setCurrentPatientId('CF-PATIENT-2');
    assert.strictEqual(patientService.getCurrentPatientId(), 'CF-PATIENT-2');
    assert.notStrictEqual(patientService.getCurrentPatientId(), 'CF-PATIENT-1');
  });
});
