/**
 * Person Types
 * Типы для работы с персонами в генеалогическом древе
 */

export type Gender = 'male' | 'female' | 'unknown';

export interface Person {
  id: string;
  originalId?: string;
  firstName: string;
  lastName: string;
  nickName?: string;
  maidenName?: string;
  gender: Gender;
  
  // Даты рождения
  birthDate?: string;
  birthYear?: number;
  birthMonth?: number;
  birthDay?: number;
  birthPlace?: string;
  
  // Даты смерти
  deathDate?: string;
  deathYear?: number;
  deathMonth?: number;
  deathDay?: number;
  deathPlace?: string;
  burialPlace?: string;
  
  // Дополнительная информация
  occupation?: string;
  note?: string;
  privateNote?: string;
  age?: number;
  
  // Медиа
  avatarMediaId?: string;
  avatarCrop?: any;
  
  // Связи
  motherId?: string;
  fatherId?: string;
  primaryServerId?: number;
  
  // Мета
  isPublic: boolean;
  isMerged?: boolean;
  mergedIntoId?: string;
  sourceDb?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  createdBy?: number;
  updatedBy?: number;
  
  // Связанные объекты
  primaryServer?: Server;
  avatarMedia?: Media;
  mother?: Person;
  father?: Person;
  children?: Person[];
  siblings?: Person[];
  spouses?: Marriage[];
}

export interface Marriage {
  id?: string;
  person?: Person;
  person1?: Person;
  person2?: Person;
  marriageYear?: number;
  marriageMonth?: number;
  marriageDay?: number;
  marriageDate?: string;
  marriagePlace?: string;
  divorceYear?: number;
  divorceMonth?: number;
  divorceDay?: number;
  divorceDate?: string;
  divorcePlace?: string;
  isCurrent?: boolean;
  notes?: string;
}

export interface Server {
  id: number;
  code: string;
  name: string;
  fullName: string;
  description?: string;
  color: string;
  domain?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Media {
  id: string;
  personId?: string;
  mediaType: 'photo' | 'document' | 'video' | 'audio' | 'other';
  filePath: string;
  thumbnailPath?: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  title?: string;
  description?: string;
  dateTaken?: string;
  location?: string;
  sortOrder: number;
  isPublic: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  uploadedBy?: number;
}

/**
 * Simplified Person для списков и карточек
 */
export interface PersonSummary {
  id: string;
  originalId?: string;
  firstName: string;
  lastName: string;
  nickName?: string;
  gender: Gender;
  birthYear?: number;
  deathYear?: number;
  avatarMediaId?: string;
}

/**
 * Person для результатов поиска
 */
export interface PersonSearchResult extends PersonSummary {
  birthPlace?: string;
  occupation?: string;
  primaryServer?: {
    code: string;
    color: string;
  };
}

