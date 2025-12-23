'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from '@/i18n/useTranslations';
import { Card, Modal, ErrorModal } from '@/ui';
import { useAppSelector } from '@/store/hooks';
import { selectIsAuthenticated } from '@/store/slices/authSlice';
import { Media } from '@/types';
import { mediaApi } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import styles from './MediaGallery.module.scss';

interface TaggedPerson {
  id: string;
  personId: string;
  positionX: number | null;
  positionY: number | null;
  person: {
    id: string;
    originalId?: string;
    firstName: string;
    lastName: string;
    nickName?: string;
  };
}

interface MediaGalleryProps {
  personId: string;
  isEditing?: boolean;
}

export default function MediaGallery({ personId, isEditing = false }: MediaGalleryProps) {
  const { t } = useTranslations();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTags, setShowTags] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use useApi hook for fetching media
  const { data, loading, error: fetchError, execute: refetchMedia } = useApi<Media[]>(
    () => mediaApi.getByPersonId(personId)
  );
  const media = data || [];

  useEffect(() => {
    refetchMedia();
  }, [personId, refetchMedia]);

  useEffect(() => {
    if (fetchError) {
      setErrorMessage(fetchError);
    }
  }, [fetchError]);

  // Keyboard navigation
  useEffect(() => {
    if (!selectedMedia) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigatePrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMedia, currentIndex]);

  const photos = media.filter(m => m.mediaType === 'photo');

  const openMedia = (photo: Media, index: number) => {
    setSelectedMedia(photo);
    setCurrentIndex(index);
  };

  const navigateNext = () => {
    if (currentIndex < photos.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setSelectedMedia(photos[nextIndex]);
    }
  };

  const navigatePrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setSelectedMedia(photos[prevIndex]);
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    
    Array.from(files).forEach((file) => {
      formData.append('files', file);
    });
    formData.append('personId', personId);

    try {
      // Получить токен из localStorage
      const token = localStorage.getItem('authToken');
      const headers: HeadersInit = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (response.ok) {
        // Перезагрузить галерею через useApi
        await refetchMedia();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        setErrorMessage(errorData.error || t('media.uploadError'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      setErrorMessage(t('media.uploadError'));
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAuthenticated && isEditing) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isAuthenticated && isEditing && e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleDeleteMedia = async (mediaId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm(t('media.confirmDelete'))) {
      return;
    }

    setDeletingId(mediaId);
    try {
      // Получить токен из localStorage
      const token = localStorage.getItem('authToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/media/${mediaId}`, {
        method: 'DELETE',
        headers,
      });

      if (response.ok) {
        // Перезагрузить галерею через useApi
        await refetchMedia();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Delete failed' }));
        setErrorMessage(errorData.error || t('media.deleteError'));
      }
    } catch (error) {
      console.error('Delete error:', error);
      setErrorMessage(t('media.deleteError'));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <Card className={styles.gallery}>
        <h3 className={styles.title}>{t('media.gallery')}</h3>
        <div className={styles.loading}>{t('common.loading')}</div>
      </Card>
    );
  }

  if (media.length === 0) {
    return null;
  }

  const documents = media.filter(m => m.mediaType === 'document');

  return (
    <>
      {(photos.length > 0 || isAuthenticated) && (
        <Card 
          className={`${styles.gallery} ${isDragging ? styles.dragging : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <h3 className={styles.title}>
            {t('media.photos')} ({photos.length})
          </h3>
          <div className={styles.grid}>
            {/* Upload Button - First Item */}
            {isAuthenticated && isEditing && (
              <div 
                className={styles.uploadItem}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,application/pdf,.doc,.docx"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  style={{ display: 'none' }}
                />
                <div className={styles.uploadIcon}>
                  {uploading ? '⏳' : '+'}
                </div>
                <div className={styles.uploadText}>
                  {uploading ? t('common.loading') : t('media.uploadFiles')}
                </div>
              </div>
            )}

            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className={styles.photoItem}
                onClick={() => openMedia(photo, index)}
              >
                <img
                  src={photo.thumbnailPath || photo.filePath}
                  alt={photo.title || photo.fileName}
                  className={styles.thumbnail}
                />
                {photo.isPrimary && (
                  <div className={styles.primaryBadge}>
                    {t('media.primary')}
                  </div>
                )}
                {isAuthenticated && isEditing && (
                  <button
                    className={styles.deleteButton}
                    onClick={(e) => handleDeleteMedia(photo.id, e)}
                    disabled={deletingId === photo.id}
                    title={t('common.delete')}
                  >
                    {deletingId === photo.id ? '⏳' : '×'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {documents.length > 0 && (
        <Card className={styles.gallery}>
          <h3 className={styles.title}>
            {t('media.documents')} ({documents.length})
          </h3>
          <div className={styles.documentList}>
            {documents.map((doc) => (
              <div key={doc.id} className={styles.documentItemWrapper}>
                <a
                  href={doc.filePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.documentItem}
                >
                  <div className={styles.documentIcon}>📄</div>
                  <div className={styles.documentInfo}>
                    <div className={styles.documentName}>{doc.fileName}</div>
                    {doc.description && (
                      <div className={styles.documentDescription}>
                        {doc.description}
                      </div>
                    )}
                  </div>
                </a>
                {isAuthenticated && isEditing && (
                  <button
                    className={styles.deleteButtonDoc}
                    onClick={(e) => handleDeleteMedia(doc.id, e)}
                    disabled={deletingId === doc.id}
                    title={t('common.delete')}
                  >
                    {deletingId === doc.id ? '⏳' : '×'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Modal for full-size image */}
      <Modal
        isOpen={!!selectedMedia}
        onClose={() => setSelectedMedia(null)}
        title={selectedMedia?.title || selectedMedia?.fileName}
        size="xl"
      >
        {selectedMedia && (
          <div className={styles.modalImageContainer}>
            {/* Previous button */}
            {currentIndex > 0 && (
              <button
                className={`${styles.navButton} ${styles.navButtonPrev}`}
                onClick={navigatePrevious}
                aria-label="Previous image"
              >
                ‹
              </button>
            )}

            <div 
              className={styles.imageWrapper}
              onMouseEnter={() => setShowTags(true)}
              onMouseLeave={() => setShowTags(false)}
            >
              <img
                src={selectedMedia.filePath}
                alt={selectedMedia.title || selectedMedia.fileName}
                className={styles.fullImage}
              />
              
              {/* Tagged persons */}
              {showTags && selectedMedia.taggedPersons && selectedMedia.taggedPersons.length > 0 && (
                <>
                  {selectedMedia.taggedPersons.map((tag) => (
                    tag.positionX !== null && tag.positionY !== null && (
                      <div
                        key={tag.id}
                        className={styles.personTag}
                        style={{
                          left: `${tag.positionX}%`,
                          top: `${tag.positionY}%`,
                        }}
                      >
                        <div className={styles.tagMarker} />
                        <div className={styles.tagLabel}>
                          {tag.person.firstName} {tag.person.lastName}
                          {tag.person.nickName && ` "${tag.person.nickName}"`}
                        </div>
                      </div>
                    )
                  ))}
                </>
              )}
            </div>

            {/* Next button */}
            {currentIndex < photos.length - 1 && (
              <button
                className={`${styles.navButton} ${styles.navButtonNext}`}
                onClick={navigateNext}
                aria-label="Next image"
              >
                ›
              </button>
            )}

            {/* Image counter */}
            <div className={styles.imageCounter}>
              {currentIndex + 1} / {photos.length}
            </div>

            {selectedMedia.description && (
              <div className={styles.imageDescription}>
                {selectedMedia.description}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Error Modal */}
      <ErrorModal
        isOpen={!!errorMessage}
        title={t('common.error')}
        message={errorMessage || ''}
        onClose={() => setErrorMessage(null)}
      />
    </>
  );
}

