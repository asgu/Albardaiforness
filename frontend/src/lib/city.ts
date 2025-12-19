/**
 * City configuration and domain mapping
 */

export interface City {
  code: string;
  name: string;
  domain: string;
  color: string;
}

export const CITIES: Record<string, City> = {
  albaro: {
    code: 'albaro',
    name: 'Albaro',
    domain: 'albardaiforness.org',
    color: '#0ea5e9',
  },
  fornezza: {
    code: 'fornezza',
    name: 'Fornezza',
    domain: 'fornezza.albardaiforness.org',
    color: '#10b981',
  },
  santa_maria: {
    code: 'santa_maria',
    name: 'Santa Maria',
    domain: 'santamaria.albardaiforness.org',
    color: '#f59e0b',
  },
};

/**
 * Get city code from hostname
 */
export function getCityFromHostname(hostname: string): string {
  // Remove port if present
  const host = hostname.split(':')[0];

  // Check for subdomain patterns
  if (host.includes('fornezza')) {
    return 'fornezza';
  }
  if (host.includes('santamaria') || host.includes('santa-maria')) {
    return 'santa_maria';
  }

  // Default to albaro for main domain or localhost
  return 'albaro';
}

/**
 * Get city configuration
 */
export function getCityConfig(cityCode: string): City {
  return CITIES[cityCode] || CITIES.albaro;
}

/**
 * Get all cities
 */
export function getAllCities(): City[] {
  return Object.values(CITIES);
}

