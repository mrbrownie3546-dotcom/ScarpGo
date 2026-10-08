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

export interface BannedIpEntry {
  ip: string;
  deviceId: string;
  bannedAt: string;
  reason: string;
}

export interface LoginSecurityState {
  failedAttempts: number;
  lockoutUntil: number | null;
  consecutiveLockouts: number;
  totalFailedAttempts: number;
  isLocked: boolean;
  lockoutSeconds: number;
  isBanned: boolean;
  banReason?: string;
  userIp: string;
}

// Configured security thresholds for ScrapGo platform
export const RATE_LIMIT_POLICIES: Record<RateLimitAction, RateLimitPolicy> = {
  LOGIN: {
    maxRequests: 3, // 3 failed password attempts limit
    windowSeconds: 300,
    lockoutSeconds: 30, // 30 seconds lockout
    label: 'Login Security',
  },
  OTP: {
    maxRequests: 30,
    windowSeconds: 180,
    lockoutSeconds: 10,
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

const STORAGE_KEY_PREFIX = 'scrapgo_rate_limit_v3_';
const BANNED_IPS_KEY = 'scrapgo_banned_ips_v2';

/**
 * Get / Generate Client Device Fingerprint
 */
export function getDeviceKey(): string {
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
 * Get or simulate user IP address
 */
export function getUserIp(): string {
  try {
    let ip = localStorage.getItem('scrapgo_user_ip');
    if (!ip) {
      const dev = getDeviceKey();
      let hash = 0;
      for (let i = 0; i < dev.length; i++) {
        hash = (hash << 5) - hash + dev.charCodeAt(i);
        hash |= 0;
      }
      const p1 = 182 + Math.abs(hash % 15);
      const p2 = 73 + Math.abs((hash >> 2) % 100);
      const p3 = Math.abs((hash >> 4) % 250);
      const p4 = Math.abs((hash >> 6) % 250);
      ip = `${p1}.${p2}.${p3}.${p4}`;
      localStorage.setItem('scrapgo_user_ip', ip);
    }
    return ip;
  } catch {
    return '182.73.192.45';
  }
}

/**
 * Retrieve all banned IP entries
 */
export function getAllBannedIps(): BannedIpEntry[] {
  try {
    const raw = localStorage.getItem(BANNED_IPS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('[RateLimiter] Error reading banned IPs:', e);
  }
  return [];
}

/**
 * Check if current device or IP is banned
 */
export function checkIpBan(identifier?: string): { isBanned: boolean; ip: string; deviceId: string; reason?: string } {
  const ip = getUserIp();
  const devId = getDeviceKey();
  const list = getAllBannedIps();

  const found = list.find(
    (b) => b.ip === ip || b.deviceId === devId || (identifier && (b.deviceId === identifier || b.ip === identifier))
  );

  if (found) {
    return { isBanned: true, ip: found.ip, deviceId: found.deviceId, reason: found.reason };
  }
  return { isBanned: false, ip, deviceId: devId };
}

/**
 * Ban current IP or Device due to suspected bot/brute-force attack
 */
export function banCurrentIpOrDevice(reason: string = 'Automated Brute-Force Bot Attack Detected', identifier?: string): BannedIpEntry {
  const ip = getUserIp();
  const devId = getDeviceKey();
  const list = getAllBannedIps();

  let entry = list.find((b) => b.ip === ip || b.deviceId === devId);
  if (!entry) {
    entry = {
      ip,
      deviceId: identifier || devId,
      bannedAt: new Date().toISOString(),
      reason,
    };
    list.push(entry);
    try {
      localStorage.setItem(BANNED_IPS_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('[RateLimiter] Failed to save banned IP:', e);
    }
  }
  return entry;
}

/**
 * Unban a specific IP or Device
 */
export function unbanIpOrDevice(target: string): void {
  const list = getAllBannedIps().filter((b) => b.ip !== target && b.deviceId !== target);
  try {
    localStorage.setItem(BANNED_IPS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('[RateLimiter] Failed to unban IP:', e);
  }
}

/**
 * Persistent Password Attempt & Lockout State per role/identifier
 */
export function getLoginSecurityState(identifier: string = 'global'): LoginSecurityState {
  const ipCheck = checkIpBan(identifier);
  if (ipCheck.isBanned) {
    return {
      failedAttempts: 3,
      lockoutUntil: Date.now() + 86400000,
      consecutiveLockouts: 5,
      totalFailedAttempts: 10,
      isLocked: true,
      lockoutSeconds: 86400,
      isBanned: true,
      banReason: ipCheck.reason,
      userIp: ipCheck.ip,
    };
  }

  const recKey = `scrapgo_login_sec_v3_${identifier}`;
  let record = {
    failedAttempts: 0,
    lockoutUntil: null as number | null,
    consecutiveLockouts: 0,
    totalFailedAttempts: 0,
  };

  try {
    const data = localStorage.getItem(recKey);
    if (data) {
      const parsed = JSON.parse(data);
      record = {
        failedAttempts: typeof parsed.failedAttempts === 'number' ? parsed.failedAttempts : 0,
        lockoutUntil: typeof parsed.lockoutUntil === 'number' ? parsed.lockoutUntil : null,
        consecutiveLockouts: typeof parsed.consecutiveLockouts === 'number' ? parsed.consecutiveLockouts : 0,
        totalFailedAttempts: typeof parsed.totalFailedAttempts === 'number' ? parsed.totalFailedAttempts : 0,
      };
    }
  } catch (e) {
    console.warn('[RateLimiter] Error reading login security record:', e);
  }

  const now = Date.now();
  let isLocked = false;
  let lockoutSeconds = 0;

  if (record.lockoutUntil && record.lockoutUntil > now) {
    isLocked = true;
    lockoutSeconds = Math.ceil((record.lockoutUntil - now) / 1000);
  } else if (record.lockoutUntil && record.lockoutUntil <= now) {
    // Lockout countdown expired!
    // Keep failedAttempts = 3 so that any subsequent wrong password triggers another 30s lockout immediately
    record.lockoutUntil = null;
  }

  return {
    failedAttempts: record.failedAttempts,
    lockoutUntil: record.lockoutUntil,
    consecutiveLockouts: record.consecutiveLockouts,
    totalFailedAttempts: record.totalFailedAttempts,
    isLocked,
    lockoutSeconds,
    isBanned: false,
    userIp: ipCheck.ip,
  };
}

/**
 * Record a failed password entry attempt.
 * Enforces 3 consecutive attempts -> 30s lockout (and 30s on each subsequent failure).
 * Triggers IP Ban if brute-force attack threshold exceeded.
 */
export function recordFailedPasswordAttempt(identifier: string = 'global'): LoginSecurityState {
  const ipCheck = checkIpBan(identifier);
  if (ipCheck.isBanned) {
    return getLoginSecurityState(identifier);
  }

  const state = getLoginSecurityState(identifier);
  const now = Date.now();
  const recKey = `scrapgo_login_sec_v3_${identifier}`;

  const nextFailed = state.failedAttempts + 1;
  const nextTotal = state.totalFailedAttempts + 1;
  let nextConsecutive = state.consecutiveLockouts;
  let newLockoutUntil: number | null = null;
  let lockoutSeconds = 0;

  // Bot attack detection: If 8 total failed attempts or 4 consecutive lockouts -> Ban IP / Device
  if (nextTotal >= 8 || nextConsecutive >= 4) {
    banCurrentIpOrDevice('Automated Brute-Force Bot Attack (Excessive failed password attempts)', identifier);
    return getLoginSecurityState(identifier);
  }

  // 3 consecutive failed attempts -> 30s lockout (and 30s for each subsequent failure)
  if (nextFailed >= 3) {
    const LOCKOUT_DURATION_SEC = 30; // 30 Seconds lockout
    newLockoutUntil = now + LOCKOUT_DURATION_SEC * 1000;
    lockoutSeconds = LOCKOUT_DURATION_SEC;
    nextConsecutive += 1;
  }

  const updatedRecord = {
    failedAttempts: nextFailed,
    lockoutUntil: newLockoutUntil,
    consecutiveLockouts: nextConsecutive,
    totalFailedAttempts: nextTotal,
  };

  try {
    localStorage.setItem(recKey, JSON.stringify(updatedRecord));
  } catch (e) {
    console.warn('[RateLimiter] Error saving login security record:', e);
  }

  return {
    failedAttempts: nextFailed,
    lockoutUntil: newLockoutUntil,
    consecutiveLockouts: nextConsecutive,
    totalFailedAttempts: nextTotal,
    isLocked: newLockoutUntil !== null && newLockoutUntil > now,
    lockoutSeconds,
    isBanned: false,
    userIp: getUserIp(),
  };
}

/**
 * Record successful login - clears failed attempts and lockout status.
 */
export function recordSuccessfulLogin(identifier: string = 'global'): void {
  const recKey = `scrapgo_login_sec_v3_${identifier}`;
  try {
    localStorage.removeItem(recKey);
  } catch (e) {
    console.warn('[RateLimiter] Error resetting login security record:', e);
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
  // Check global IP Ban first
  const ipCheck = checkIpBan(identifier);
  if (ipCheck.isBanned) {
    return {
      isAllowed: false,
      remainingAttempts: 0,
      resetInSeconds: 86400,
      lockoutUntil: Date.now() + 86400000,
      errorMessage: `🚫 ACCESS DENIED: Your IP (${ipCheck.ip}) or Device is banned due to suspected bot / brute-force activity.`,
    };
  }

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
      errorMessage: `🛡️ Security Alert: Limit exceed ho gaya hai (${policy.label}). Automated bot attacks se protection ke liye yeh action temporary lock hai. ${remainingSec} seconds baad dobara try karein.`,
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
    const lockoutDurationSec = policy.lockoutSeconds;
    const newLockoutUntil = now + lockoutDurationSec * 1000;

    record.lockoutUntil = newLockoutUntil;
    record.consecutiveLockouts += 1;
    saveRecord(action, record, identifier);

    // If excessive lockouts occur, trigger IP ban
    if (record.consecutiveLockouts >= 4) {
      banCurrentIpOrDevice(`Rapid requests spam in ${policy.label}`, identifier);
    }

    return {
      isAllowed: false,
      remainingAttempts: 0,
      resetInSeconds: lockoutDurationSec,
      lockoutUntil: newLockoutUntil,
      errorMessage: `🛑 Security Alert: Limit exceed! ${policy.label} me rapid requests detect hui hain. Please wait ${lockoutDurationSec}s before retrying.`,
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
  const ipCheck = checkIpBan(identifier);
  if (ipCheck.isBanned) {
    return {
      isAllowed: false,
      remainingAttempts: 0,
      resetInSeconds: 86400,
      lockoutUntil: Date.now() + 86400000,
      errorMessage: `🚫 ACCESS DENIED: Your IP (${ipCheck.ip}) or Device is banned due to suspected bot attack.`,
    };
  }

  const policy = RATE_LIMIT_POLICIES[action];
  const now = Date.now();
  const record = getRecord(action, identifier);

  // Clean old window entries
  const windowStart = now - policy.windowSeconds * 1000;
  const validTimestamps = record.timestamps.filter((ts) => ts > windowStart);

  validTimestamps.push(now);
  record.timestamps = validTimestamps;

  if (validTimestamps.length > policy.maxRequests) {
    const lockoutDurationSec = policy.lockoutSeconds;
    const newLockoutUntil = now + lockoutDurationSec * 1000;

    record.lockoutUntil = newLockoutUntil;
    record.consecutiveLockouts += 1;
    saveRecord(action, record, identifier);

    if (record.consecutiveLockouts >= 4) {
      banCurrentIpOrDevice(`Automated spam detected in ${policy.label}`, identifier);
    }

    return {
      isAllowed: false,
      remainingAttempts: 0,
      resetInSeconds: lockoutDurationSec,
      lockoutUntil: newLockoutUntil,
      errorMessage: `🛑 Security Alert: Limit exceed hui! System anti-bot defense active. ${lockoutDurationSec} seconds baad try karein.`,
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

    const interval = setInterval(() => {
      const res = checkRateLimit(action, identifier);
      setStatus(res);
    }, 1000);

    return () => clearInterval(interval);
  }, [action, identifier, refreshStatus]);

  const executeWithThrottling = useCallback(
    <T>(
      callback: () => T | Promise<T>
    ): { success: boolean; result?: T; error?: string } | Promise<{ success: boolean; result?: T; error?: string }> => {
      const check = checkRateLimit(action, identifier);
      if (!check.isAllowed) {
        return {
          success: false,
          error: check.errorMessage || 'Action throttled. Please wait.',
        };
      }

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
