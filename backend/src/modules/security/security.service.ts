import { prisma } from '../../core/database/prisma';
import { AuditService } from '../audit/audit.service';
import crypto from 'crypto';

interface LoginAttemptRecord {
  count: number;
  firstAttemptAt: Date;
  blockedUntil: Date | null;
}

interface StepUpSession {
  token: string;
  userId: string;
  expiresAt: Date;
}

export interface SecurityEvent {
  id: string;
  type: 'BRUTE_FORCE_SUSPECT' | 'CONTEXT_TAMPERING' | 'STEP_UP_REAUTH' | 'IP_BLOCKED' | 'UNAUTHORIZED_DEVICE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: string;
  ipAddress: string;
  targetEmail?: string;
  userId?: string;
  createdAt: Date;
}

export class SecurityService {
  private static loginAttempts = new Map<string, LoginAttemptRecord>();
  private static blockedIps = new Set<string>();
  private static stepUpSessions = new Map<string, StepUpSession>();
  private static securityEvents: SecurityEvent[] = [];

  private static MAX_ATTEMPTS = 5;
  private static BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

  /**
   * Check if IP or email is currently blocked due to repeated failed logins
   */
  public static isLoginBlocked(ip: string, email: string): { blocked: boolean; remainingMinutes?: number } {
    if (this.blockedIps.has(ip)) {
      return { blocked: true, remainingMinutes: 999 };
    }

    const key = `${ip}_${email.toLowerCase().trim()}`;
    const record = this.loginAttempts.get(key);

    if (!record || !record.blockedUntil) {
      return { blocked: false };
    }

    const now = new Date();
    if (now < record.blockedUntil) {
      const remainingMs = record.blockedUntil.getTime() - now.getTime();
      return {
        blocked: true,
        remainingMinutes: Math.ceil(remainingMs / 60000)
      };
    }

    // Lockout expired, reset
    this.loginAttempts.delete(key);
    return { blocked: false };
  }

  /**
   * Record login attempt result. Blocks user/IP if threshold exceeded.
   */
  public static recordLoginAttempt(ip: string, email: string, success: boolean): void {
    const key = `${ip}_${email.toLowerCase().trim()}`;

    if (success) {
      this.loginAttempts.delete(key);
      return;
    }

    const record = this.loginAttempts.get(key) || {
      count: 0,
      firstAttemptAt: new Date(),
      blockedUntil: null
    };

    record.count += 1;

    if (record.count >= this.MAX_ATTEMPTS) {
      record.blockedUntil = new Date(Date.now() + this.BLOCK_DURATION_MS);
      this.loginAttempts.set(key, record);

      this.registerSecurityEvent({
        type: 'BRUTE_FORCE_SUSPECT',
        severity: 'HIGH',
        details: `Bloqueio automático por 15 minutos: ${record.count} tentativas incorretas consecutivas para ${email}.`,
        ipAddress: ip,
        targetEmail: email
      });

      AuditService.log({
        action: 'SECURITY_BRUTE_FORCE_LOCKOUT',
        resource: 'AUTH',
        details: `IP ${ip} bloqueado temporariamente por excesso de tentativas para o e-mail ${email}.`,
        ipAddress: ip,
        result: 'DENIED'
      });
      return;
    }

    this.loginAttempts.set(key, record);
  }

  /**
   * Generate Step-Up Reauthentication token valid for 5 minutes
   */
  public static createStepUpToken(userId: string): string {
    const token = `stepup_${crypto.randomBytes(24).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    this.stepUpSessions.set(token, {
      token,
      userId,
      expiresAt
    });

    this.registerSecurityEvent({
      type: 'STEP_UP_REAUTH',
      severity: 'MEDIUM',
      details: `Reautenticação step-up realizada com sucesso pelo usuário ID ${userId}.`,
      ipAddress: '127.0.0.1',
      userId
    });

    return token;
  }

  /**
   * Verify Step-Up Reauthentication token
   */
  public static verifyStepUpToken(userId: string, token: string): boolean {
    const session = this.stepUpSessions.get(token);
    if (!session) return false;

    if (session.userId !== userId) return false;
    if (new Date() > session.expiresAt) {
      this.stepUpSessions.delete(token);
      return false;
    }

    return true;
  }

  /**
   * Register security alert event
   */
  public static registerSecurityEvent(event: Omit<SecurityEvent, 'id' | 'createdAt'>): SecurityEvent {
    const fullEvent: SecurityEvent = {
      id: `sec_evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date(),
      ...event
    };

    this.securityEvents.unshift(fullEvent);
    if (this.securityEvents.length > 500) {
      this.securityEvents.pop();
    }
    return fullEvent;
  }

  /**
   * Helper alias for createStepUpToken
   */
  public static issueStepUpToken(userId: string, minutes: number = 5): string {
    return this.createStepUpToken(userId);
  }

  /**
   * Manually block an IP address
   */
  public static blockIp(ip: string, reason: string): void {
    this.blockedIps.add(ip);
    this.registerSecurityEvent({
      type: 'IP_BLOCKED',
      severity: 'CRITICAL',
      details: `IP ${ip} bloqueado permanentemente pela administração: ${reason}`,
      ipAddress: ip
    });
  }

  /**
   * Unblock an IP address
   */
  public static unblockIp(ip: string): void {
    this.blockedIps.delete(ip);
  }

  /**
   * Get Security Overview metrics
   */
  public static async getOverview() {
    const totalBlockedIps = this.blockedIps.size;
    const activeLockouts = Array.from(this.loginAttempts.values()).filter(r => r.blockedUntil && new Date() < r.blockedUntil).length;
    const recentEvents = this.securityEvents.slice(0, 15);
    const criticalEventsCount = this.securityEvents.filter(e => e.severity === 'CRITICAL' || e.severity === 'HIGH').length;

    return {
      activeLockouts,
      totalBlockedIps,
      criticalEventsCount,
      totalSecurityEvents: this.securityEvents.length,
      recentEvents,
      blockedIpsList: Array.from(this.blockedIps)
    };
  }

  public static listEvents(): SecurityEvent[] {
    return this.securityEvents;
  }
}
