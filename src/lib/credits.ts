import confetti from 'canvas-confetti';

const CREDITS_STORAGE_KEY = 'gm_chess_user_credits';
const INITIAL_FREE_CREDITS = 5;

type CreditChangeListener = (newBalance: number) => void;
const listeners = new Set<CreditChangeListener>();

export function getCredits(): number {
  if (typeof window === 'undefined') return INITIAL_FREE_CREDITS;
  const stored = localStorage.getItem(CREDITS_STORAGE_KEY);
  if (stored === null) {
    localStorage.setItem(CREDITS_STORAGE_KEY, String(INITIAL_FREE_CREDITS));
    return INITIAL_FREE_CREDITS;
  }
  const parsed = parseInt(stored, 10);
  return isNaN(parsed) ? INITIAL_FREE_CREDITS : parsed;
}

export function subscribeCredits(listener: CreditChangeListener) {
  listeners.add(listener);
  listener(getCredits());
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners(balance: number) {
  listeners.forEach((listener) => listener(balance));
}

export function addCredits(amount: number, reason: string = 'Reward'): number {
  const current = getCredits();
  const next = current + amount;
  localStorage.setItem(CREDITS_STORAGE_KEY, String(next));
  notifyListeners(next);

  // Trigger celebration effect if credits added from purchase or victory
  if (amount >= 3 && typeof window !== 'undefined') {
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore if canvas unavailable
    }
  }

  return next;
}

export function deductCredit(): boolean {
  const current = getCredits();
  if (current < 1) {
    return false;
  }
  const next = current - 1;
  localStorage.setItem(CREDITS_STORAGE_KEY, String(next));
  notifyListeners(next);
  return true;
}
