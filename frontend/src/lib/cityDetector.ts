export type ServerCode = 'albaro' | 'preone';

export interface Server {
  id: number;
  code: ServerCode;
  name: string;
  fullName: string;
  domain: string;
  color: string;
  isActive: boolean;
}

// Дефолтные серверы (будут заменены данными из API)
export const DEFAULT_SERVERS: Record<ServerCode, Server> = {
  'albaro': {
    id: 1,
    code: 'albaro',
    name: 'Albaro',
    fullName: 'Albard ai Forness',
    domain: 'albardaiforness.org',
    color: '#0ea5e9',
    isActive: true,
  },
  'preone': {
    id: 2,
    code: 'preone',
    name: 'Preone',
    fullName: 'Albero di Preone',
    domain: 'alberodipreone.org',
    color: '#10b981',
    isActive: true,
  },
};

export function detectServerFromDomain(hostname: string): ServerCode {
  // Проверяем домен
  if (hostname.includes('preone')) {
    return 'preone';
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

