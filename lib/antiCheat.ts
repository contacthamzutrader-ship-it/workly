import { AntiCheatViolation, AntiCheatViolationType } from '@/types/interview';

export interface AntiCheatConfig {
  maxViolationsAllowed: number;
  enableFullscreenEnforcement: boolean;
  blockCopyPaste: boolean;
  blockDevToolsShortcuts: boolean;
  blockRightClick: boolean;
  enableRapidPasteDetector: boolean;
}

export const DEFAULT_ANTI_CHEAT_CONFIG: AntiCheatConfig = {
  maxViolationsAllowed: 4,
  enableFullscreenEnforcement: true,
  blockCopyPaste: true,
  blockDevToolsShortcuts: true,
  blockRightClick: true,
  enableRapidPasteDetector: true,
};

export const VIOLATION_PENALTIES: Record<AntiCheatViolationType, { penalty: number; message: string }> = {
  tab_switch: { penalty: 15, message: 'Tab switched or browser minimized during active assessment.' },
  window_blur: { penalty: 10, message: 'Window focus lost. Please stay focused on the test interface.' },
  copy_attempt: { penalty: 8, message: 'Copying assessment content is prohibited.' },
  paste_attempt: { penalty: 18, message: 'Pasting external text is prohibited to maintain code integrity.' },
  fullscreen_exit: { penalty: 12, message: 'Exited mandatory fullscreen mode.' },
  devtools_opened: { penalty: 25, message: 'Developer tools shortcut attempt detected.' },
  no_face_detected: { penalty: 5, message: 'No face detected in webcam proctoring view.' },
  multiple_faces_detected: { penalty: 20, message: 'Multiple people detected in webcam feed.' },
  rapid_bulk_paste: { penalty: 25, message: 'Suspicious instant text injection (AI clipboard injection detected).' },
  right_click_attempt: { penalty: 5, message: 'Right-click context menu disabled.' },
};

export class AntiCheatManager {
  private violations: AntiCheatViolation[] = [];
  private onViolationCallback?: (violation: AntiCheatViolation, totalViolations: AntiCheatViolation[]) => void;
  private onTerminateCallback?: (reason: string) => void;
  private config: AntiCheatConfig;
  private isActive: boolean = false;
  private cleanupFns: Array<() => void> = [];

  constructor(
    config: Partial<AntiCheatConfig> = {},
    onViolation?: (violation: AntiCheatViolation, totalViolations: AntiCheatViolation[]) => void,
    onTerminate?: (reason: string) => void
  ) {
    this.config = { ...DEFAULT_ANTI_CHEAT_CONFIG, ...config };
    this.onViolationCallback = onViolation;
    this.onTerminateCallback = onTerminate;
  }

  public start() {
    if (typeof window === 'undefined' || this.isActive) return;
    this.isActive = true;
    this.attachListeners();
  }

  public stop() {
    this.isActive = false;
    this.cleanupFns.forEach((fn) => fn());
    this.cleanupFns = [];
  }

  public getViolations(): AntiCheatViolation[] {
    return [...this.violations];
  }

  public calculateIntegrityScore(): number {
    const totalPenalty = this.violations.reduce((sum, v) => sum + v.penaltyPoints, 0);
    return Math.max(0, 100 - totalPenalty);
  }

  public getIntegrityVerdict(): 'Verified Clean' | 'Low Risk' | 'Moderate Risk' | 'High Suspicion' | 'Disqualified' {
    const score = this.calculateIntegrityScore();
    const count = this.violations.length;

    if (count >= this.config.maxViolationsAllowed || score < 40) return 'Disqualified';
    if (score >= 90 && count <= 1) return 'Verified Clean';
    if (score >= 75) return 'Low Risk';
    if (score >= 50) return 'Moderate Risk';
    return 'High Suspicion';
  }

  public recordViolation(type: AntiCheatViolationType, customDetails?: string) {
    if (!this.isActive) return;

    const penaltyInfo = VIOLATION_PENALTIES[type] || { penalty: 10, message: 'Unspecified security violation' };
    const now = Date.now();
    const formattedTime = new Date(now).toLocaleTimeString('en-US', { hour12: false });

    const violation: AntiCheatViolation = {
      id: `viol_${now}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      timestamp: now,
      formattedTime,
      details: customDetails || penaltyInfo.message,
      penaltyPoints: penaltyInfo.penalty,
    };

    this.violations.push(violation);

    if (this.onViolationCallback) {
      this.onViolationCallback(violation, this.violations);
    }

    if (this.violations.length >= this.config.maxViolationsAllowed) {
      if (this.onTerminateCallback) {
        this.onTerminateCallback('Assessment terminated: Maximum allowed security violations exceeded.');
      }
    }
  }

  private attachListeners() {
    // 1. Tab Switch / Visibility Change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        this.recordViolation('tab_switch', 'Candidate left the active interview tab.');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    this.cleanupFns.push(() => document.removeEventListener('visibilitychange', handleVisibilityChange));

    // 2. Window Blur (Focus Lost)
    const handleBlur = () => {
      this.recordViolation('window_blur', 'Browser window lost focus (potential app switching).');
    };
    window.addEventListener('blur', handleBlur);
    this.cleanupFns.push(() => window.removeEventListener('blur', handleBlur));

    // 3. Fullscreen Exit Detector
    if (this.config.enableFullscreenEnforcement) {
      const handleFullscreenChange = () => {
        if (!document.fullscreenElement) {
          this.recordViolation('fullscreen_exit', 'Exited secure full-screen assessment mode.');
        }
      };
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      this.cleanupFns.push(() => document.removeEventListener('fullscreenchange', handleFullscreenChange));
    }

    // 4. Right-Click Context Menu Blocking
    if (this.config.blockRightClick) {
      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        this.recordViolation('right_click_attempt', 'Right-click context menu blocked.');
      };
      document.addEventListener('contextmenu', handleContextMenu);
      this.cleanupFns.push(() => document.removeEventListener('contextmenu', handleContextMenu));
    }

    // 5. DevTools Keyboard Shortcuts Block
    if (this.config.blockDevToolsShortcuts) {
      const handleKeyDown = (e: KeyboardEvent) => {
        // F12 or Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+U
        if (
          e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) ||
          (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.key === 's' || e.key === 'S')) ||
          (e.metaKey && e.altKey && (e.key === 'i' || e.key === 'I' || e.key === 'j' || e.key === 'J' || e.key === 'c' || e.key === 'C'))
        ) {
          e.preventDefault();
          this.recordViolation('devtools_opened', 'Attempted to open inspect elements / source code.');
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      this.cleanupFns.push(() => window.removeEventListener('keydown', handleKeyDown));
    }

    // 6. Copy / Paste Interceptor
    if (this.config.blockCopyPaste) {
      const handleCopy = (e: ClipboardEvent) => {
        e.preventDefault();
        this.recordViolation('copy_attempt', 'Copying question text is prohibited.');
      };
      const handlePaste = (e: ClipboardEvent) => {
        // Intercept standard paste events
        const pastedText = e.clipboardData?.getData('text') || '';
        if (pastedText.length > 50) {
          e.preventDefault();
          this.recordViolation('paste_attempt', `Blocked paste of ${pastedText.length} characters.`);
        }
      };

      document.addEventListener('copy', handleCopy);
      document.addEventListener('paste', handlePaste);
      this.cleanupFns.push(() => {
        document.removeEventListener('copy', handleCopy);
        document.removeEventListener('paste', handlePaste);
      });
    }
  }
}
