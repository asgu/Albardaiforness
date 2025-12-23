/**
 * Person Utilities
 * Утилиты для работы с персонами
 */

import { Person, Gender } from '@/types';

/**
 * Получить ID для URL (приоритет originalId для SEO)
 */
export function getPersonUrlId(person: Person | { id: string; originalId?: string }): string {
  return person.originalId || person.id;
}

/**
 * Получить иконку по полу
 */
export function getGenderIcon(gender: Gender): string {
  switch (gender) {
    case 'male':
      return '♂';
    case 'female':
      return '♀';
    default:
      return '⚥';
  }
}

/**
 * Получить лейбл пола
 */
export function getGenderLabel(gender: Gender): string {
  switch (gender) {
    case 'male':
      return 'Maschio';
    case 'female':
      return 'Femmina';
    default:
      return 'Sconosciuto';
  }
}

/**
 * Форматировать дату (год/месяц/день)
 */
export function formatDate(
  year?: number,
  month?: number,
  day?: number,
  fullDate?: string
): string {
  if (fullDate) {
    try {
      const date = new Date(fullDate);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('it-IT', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
      }
    } catch (e) {
      // Fallback to parts if parsing fails
    }
  }

  // Форматируем дату единообразно: день/месяц/год
  if (year && month && day) {
    const d = day.toString().padStart(2, '0');
    const m = month.toString().padStart(2, '0');
    return `${d}/${m}/${year}`;
  }
  if (year && month) {
    const m = month.toString().padStart(2, '0');
    return `${m}/${year}`;
  }
  if (year) return `${year}`;
  return 'Sconosciuto';
}

/**
 * Форматировать имя (первая буква заглавная)
 */
export function formatName(name: string): string {
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Получить полное имя
 */
export function getFullName(person: Person): string {
  const parts = [person.firstName, person.lastName];
  if (person.nickName) {
    parts.splice(1, 0, `"${person.nickName}"`);
  }
  return parts.join(' ');
}

/**
 * Получить основное имя (без прозвища)
 */
export function getBasicName(person: Person): string {
  return `${person.firstName} ${person.lastName}`;
}

/**
 * Получить возраст
 */
export function getAge(person: Person): number | undefined {
  if (person.age !== undefined) return person.age;
  
  if (person.birthYear && person.deathYear) {
    return person.deathYear - person.birthYear;
  }
  
  if (person.birthYear) {
    return new Date().getFullYear() - person.birthYear;
  }
  
  return undefined;
}

/**
 * Проверить жив ли человек
 */
export function isAlive(person: Person): boolean {
  return !person.deathYear && !person.deathDate;
}

/**
 * Получить годы жизни (1900 - 1980)
 */
export function getLifeYears(person: Person | { birthYear?: number; deathYear?: number; deathDate?: string }): string {
  const birth = person.birthYear || '?';
  const death = person.deathYear || (!person.deathYear && !person.deathDate ? '' : '?');
  return death ? `${birth} - ${death}` : `${birth}`;
}

/**
 * Получить URL аватара или плейсхолдер
 */
export function getAvatarUrl(person: Person): string | undefined {
  if (person.avatarMedia?.thumbnailPath) {
    return person.avatarMedia.thumbnailPath;
  }
  if (person.avatarMedia?.filePath) {
    return person.avatarMedia.filePath;
  }
  return undefined;
}

/**
 * Получить всех детей (объединить от матери и отца)
 */
export function getAllChildren(person: Person): Person[] {
  const children: Person[] = [];
  
  if (person.children) {
    children.push(...person.children);
  }
  
  return children;
}

/**
 * Получить всех супругов
 */
export function getAllSpouses(person: Person): Person[] {
  if (!person.spouses) return [];
  return person.spouses.map((marriage) => marriage.person).filter((p): p is Person => !!p);
}

/**
 * Проверить есть ли родители
 */
export function hasParents(person: Person): boolean {
  return !!(person.mother || person.father);
}

/**
 * Проверить есть ли дети
 */
export function hasChildren(person: Person): boolean {
  return !!(person.children && person.children.length > 0);
}

/**
 * Проверить есть ли супруги
 */
export function hasSpouses(person: Person): boolean {
  return !!(person.spouses && person.spouses.length > 0);
}

/**
 * Получить братьев и сестер (дети тех же родителей, исключая саму персону)
 */
export function getSiblings(person: Person): Person[] {
  // Используем siblings из API, если они есть
  if (person.siblings) {
    return person.siblings;
  }
  
  // Fallback: если siblings нет в данных, возвращаем пустой массив
  // (API должен возвращать siblings, но на случай если их нет)
  return [];
}

