/**
 * Gallery Types
 * Типы для галереи
 */

export interface Category {
  id: string;
  title: string;
  parentId?: string;
  parent?: Category;
  children?: Category[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Tag {
  id: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GalleryMedia {
  id: string;
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
  categoryId?: string;
  category?: Category;
  tags?: Tag[];
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  uploadedBy?: number;
}

export interface GalleryFilters {
  categoryId?: string;
  tagId?: string;
  search?: string;
  page?: number;
  limit?: number;
}
