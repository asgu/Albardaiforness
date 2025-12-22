import { Server } from '@/types';

export type ServerCode = 'albaro' | 'preone' | 'raveo';

// Дефолтные серверы (будут заменены данными из API)
export const DEFAULT_SERVERS: Record<ServerCode, Server> = {
  'albaro': {
    id: 1,
    code: 'albaro',
    name: 'Albaro',
    fullName: 'Albard ai Forness',
    domain: 'new.albardaiforness.org',
    color: '#0ea5e9',
    isActive: true,
  },
  'preone': {
    id: 2,
    code: 'preone',
    name: 'Preone',
    fullName: 'Albero di Preone',
    domain: 'new.alberodipreone.org',
    color: '#FFB6C1',
    isActive: true,
  },
  'raveo': {
    id: 4,
    code: 'raveo',
    name: 'Raveo',
    fullName: 'Albero di Raveo',
    domain: 'new.alberodiraveo.org',
    color: '#f59e0b',
    isActive: true,
  },
};

export function detectServerFromDomain(hostname: string): ServerCode {
  // Проверяем домен
  if (hostname.includes('preone')) {
    return 'preone';
  }
  if (hostname.includes('raveo')) {
    return 'raveo';
  }
  // По умолчанию Albaro
  return 'albaro';
}

export function getServerFromStorage(): ServerCode | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('selectedServer');
  return stored as ServerCode | null;
}

export function setServerToStorage(server: ServerCode): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('selectedServer', server);
}

export function getCurrentServer(hostname?: string): ServerCode {
  // Сначала проверяем localStorage
  const stored = getServerFromStorage();
  if (stored) return stored;

  // Затем определяем по домену
  if (hostname) {
    const detected = detectServerFromDomain(hostname);
    setServerToStorage(detected);
    return detected;
  }

  // По умолчанию
  return 'albaro';
}

