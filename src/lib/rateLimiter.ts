import { useState, useEffect, useCallback } from 'react';

/**
 * Action Types protected by Rate Limiter & Throttling
 */
export type RateLimitAction =
  | 'LOGIN'
  | 'OTP'
  | 'REVIEW'
  | 'BOOKING'
  | 'COMPLAINT'
  | 'AI_CHAT'
  | 'ADMIN_ACTION'
  | 'GLOBAL_API';

export interface RateLimitPolicy {
  maxRequests: number;
  windowSeconds: number;
  lockoutSeconds: number;
  label: string;
}

export interface RateLimitResult {
  isAllowed: boolean;
  remainingAttempts: number;
  resetInSeconds: number;
  lockoutUntil: number | null;
  errorMessage?: string;
}

interface ActionRecord {
  timestamps: number[];
  lockoutUntil: number | null;
  consecutiveLockouts: number;
}

// Configured security thresholds for ScrapGo platform
export const RATE_LIMIT_POLICIES: Record<RateLimitAction, RateLimitPolicy> = {
  LOGIN: {
    maxRequests: 5,
    windowSeconds: 60,
    lockoutSeconds: 60,
    label: 'Login Security',
  },
  OTP: {
    maxRequests: 3,
    windowSeconds: 180,
    lockoutSeconds: 180,
    label: 'OTP Dispatch',
  },
  REVIEW: {
    maxRequests: 3,
    windowSeconds: 3600,
    lockoutSeconds: 300,
    label: 'Customer Review Submission',
  },
  BOOKING: {
    maxRequests: 4,
    windowSeconds: 600,
    lockoutSeconds: 300,
    label: 'Scrap Pickup Booking',
  },
  COMPLAINT: {
    maxRequests: 3,
    windowSeconds: 600,
    lockoutSeconds: 300,
    label: 'Complaint / Ticket Registration',
  },
  AI_CHAT: {
    maxRequests: 15,
    windowSeconds: 180,
    lockoutSeconds: 120,
    label: 'ScrapBot AI Support Queries',
  },
  ADMIN_ACTION: {
    maxRequests: 10,
    windowSeconds: 60,
    lockoutSeconds: 120,
    label: 'Admin Authorization Action',
  },
  GLOBAL_API: {
    maxRequests: 60,
    windowSeconds: 60,
    lockoutSeconds: 60,
    label: 'General API Request Throttle',
  },
};

const STORAGE_KEY_PREFIX = 'scrapgo_rate_limit_v2_';

/**
 * Client Device / Browser Fingerprint Key
 */
function getDeviceKey(): string {
  try {
    let devId = localStorage.getItem('scrapgo_device_fingerprint');
    if (!devId) {
      devId = 'dev_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      localStorage.setItem('scrapgo_device_fingerprint', devId);
    }
    return devId;
  } catch {
    return 'fallback_device';
  }
}

/**
 * Get stored record for an action + target identifier
 */
function getRecord(action: RateLimitAction, identifier?: string): ActionRecord {
  const key = `${STORAGE_KEY_PREFIX}${action}_${identifier || getDeviceKey()}`;
  try {
    const data = localStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        timestamps: Array.isArray(parsed.timestamps) ? parsed.timestamps : [],
        lockoutUntil: typeof parsed.lockoutUntil === 'number' ? parsed.lockoutUntil : null,
        consecutiveLockouts: typeof parsed.consecutiveLockouts === 'number' ? parsed.consecutiveLockouts : 0,
      };
    }
  } catch (e) {
    console.warn('[RateLimiter] Error reading record:', e);
  }
  return { timestamps: [], lockoutUntil: null, consecutiveLockouts: 0 };
}

/**
 * Save record for an action + target identifier
 */
function saveRecord(action: RateLimitAction, record: ActionRecord, identifier?: string): void {
  const key = `${STORAGE_KEY_PREFIX}${action}_${identifier || getDeviceKey()}`;
  try {
    localStorage.setItem(key, JSON.stringify(record));
  } catch (e) {
    console.warn('[RateLimiter] Error saving record:', e);
  }
}

/**
 * Check if action is currently throttled or locked out
 */
export function checkRateLimit(action: RateLimitAction, identifier?: string): RateLimitResult {
  const policy = RATE_LIMIT_POLICIES[action];
  const now = Date.now();
  const record = getRecord(action, identifier);

  // 1. Check active lockout
  if (record.lockoutUntil && record.lockoutUntil > now) {
    const remainingSec = Math.ceil((record.lockoutUntil - now) / 1000);
    return {
      isAllowed: false,
      remainingAttempts: 0,
      resetInSeconds: remainingSec,
      lockoutUntil: record.lockoutUntil,
      errorMessage: `🛡️ Security Alert: Rate Limit exceed ho gaya hai (${policy.label}). Automated bot attacks se protection ke liye yeh action temporary lock hai. ${remainingSec} seconds baad dobara try karein.`,
    };
  }

  // Clear expired lockout
  if (record.lockoutUntil && record.lockoutUntil <= now) {
    record.lockoutUntil = null;
  }

  // 2. Filter timestamps within current rolling window
  const windowStart = now - policy.windowSeconds * 1000;
  const validTimestamps = record.timestamps.filter((ts) => ts > windowStart);

  // Update cleaned timestamps
  if (validTimestamps.length !== record.timestamps.length) {
    record.timestamps = validTimestamps;
    saveRecord(action, record, identifier);
  }

  const remainingAttempts = Math.max(0, policy.maxRequests - validTimestamps.length);
  const oldestTimestamp = validTimestamps[0] || now;
  const resetInSeconds = Math.max(1, Math.ceil((oldestTimestamp + policy.windowSeconds * 1000 - now) / 1000));

  if (validTimestamps.length >= policy.maxRequests) {
    // Trigger exponential / progressive lockout penalty
    const multiplier = Math.min(5, Math.pow(2, record.consecutiveLockouts)); // 1x, 2x, 4x...
    const lockoutDurationSec = policy.lockoutSeconds * multiplier;
    const newLockoutUntil = now + lockoutDurationSec * 1000;

    record.lockoutUntil = newLockoutUntil;
    record.consecutiveLockouts += 1;
    saveRecord(action, record, identifier);

    return {
      isAllowed: false,
      remainingAttempts: 0,
      resetInSeconds: lockoutDurationSec,
      lockoutUntil: newLockoutUntil,
      errorMessage: `🛑 Rate Limit Exceeded: ${policy.label} me bahut zyada rapid requests aayi hain. Bot protection active. Please wait ${lockoutDurationSec}s before retrying.`,
    };
  }

  return {
    isAllowed: true,
    remainingAttempts,
    resetInSeconds,
    lockoutUntil: null,
  };
}

/**
 * Record an action attempt. Triggers throttle / lockout if limit exceeded.
 */
export function recordAction(action: RateLimitAction, identifier?: string): RateLimitResult {
  const policy = RATE_LIMIT_POLICIES[action];
  const now = Date.now();
  const record = getRecord(action, identifier);

  // Clean old window entries
  const windowStart = now - policy.windowSeconds * 1000;
  const validTimestamps = record.timestamps.filter((ts) => ts > windowStart);

  validTimestamps.push(now);
  record.timestamps = validTimestamps;

  if (validTimestamps.length > policy.maxRequests) {
    const multiplier = Math.min(5, Math.pow(2, record.consecutiveLockouts));
    const lockoutDurationSec = policy.lockoutSeconds * multiplier;
    const newLockoutUntil = now + lockoutDurationSec * 1000;

    record.lockoutUntil = newLockoutUntil;
    record.consecutiveLockouts += 1;
    saveRecord(action, record, identifier);

    return {
      isAllowed: false,
      remainingAttempts: 0,
      resetInSeconds: lockoutDurationSec,
      lockoutUntil: newLockoutUntil,
      errorMessage: `🛑 Security Alert: Limit exceed hui! System anti-bot defense active ho gaya hai. ${lockoutDurationSec} seconds baad try karein.`,
    };
  }

  saveRecord(action, record, identifier);

  const remainingAttempts = Math.max(0, policy.maxRequests - validTimestamps.length);
  const resetInSeconds = policy.windowSeconds;

  return {
    isAllowed: true,
    remainingAttempts,
    resetInSeconds,
    lockoutUntil: null,
  };
}

/**
 * Reset lockout / attempts upon successful action (e.g. successful OTP or login)
 */
export function resetRateLimit(action: RateLimitAction, identifier?: string): void {
  const key = `${STORAGE_KEY_PREFIX}${action}_${identifier || getDeviceKey()}`;
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn('[RateLimiter] Error resetting record:', e);
  }
}

/**
 * React Hook for UI components to display real-time rate limit & countdown lockouts
 */
export function useRateLimiter(action: RateLimitAction, identifier?: string) {
  const [status, setStatus] = useState<RateLimitResult>(() => checkRateLimit(action, identifier));

  const refreshStatus = useCallback(() => {
    const res = checkRateLimit(action, identifier);
    setStatus(res);
  }, [action, identifier]);

  useEffect(() => {
    refreshStatus();

    // Auto tick down countdown every second if locked out
    const interval = setInterval(() => {
      const res = checkRateLimit(action, identifier);
      setStatus(res);
    }, 1000);

    return () => clearInterval(interval);
  }, [action, identifier, refreshStatus]);

  const executeWithThrottling = useCallback(
    <T>(callback: () => T | Promise<T>): { success: boolean; result?: T; error?: string } | Promise<{ success: boolean; result?: T; error?: string }> => {
      const check = checkRateLimit(action, identifier);
      if (!check.isAllowed) {
        return {
          success: false,
          error: check.errorMessage || 'Action throttled. Please wait.',
        };
      }

      // Record the attempt
      const recRes = recordAction(action, identifier);
      refreshStatus();

      if (!recRes.isAllowed) {
        return {
          success: false,
          error: recRes.errorMessage || 'Action throttled.',
        };
      }

      try {
        const res = callback();
        if (res instanceof Promise) {
          return res.then((data) => ({ success: true, result: data })).catch((err) => ({ success: false, error: err.message || 'Action failed' }));
        }
        return { success: true, result: res };
      } catch (err: any) {
        return { success: false, error: err.message || 'Action failed' };
      }
    },
    [action, identifier, refreshStatus]
  );

  return {
    isAllowed: status.isAllowed,
    remainingAttempts: status.remainingAttempts,
    resetInSeconds: status.resetInSeconds,
    errorMessage: status.errorMessage,
    refreshStatus,
    executeWithThrottling,
  };
}
