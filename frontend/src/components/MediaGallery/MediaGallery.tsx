'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from '@/i18n/useTranslations';
import { Card, Modal } from '@/ui';
import styles from './MediaGallery.module.scss';

interface Media {
  id: string;
  mediaType: 'photo' | 'document' | 'video' | 'audio' | 'other';
  filePath: string;
  fileName: string;
  thumbnailPath?: string;
  title?: string;
  description?: string;
  sortOrder: number;
  isPublic: boolean;
  isPrimary: boolean;
  dateTaken?: string;
  location?: string;
}

interface MediaGalleryProps {
  personId: string;
}

export default function MediaGallery({ personId }: MediaGalleryProps) {
  const { t } = useTranslations();
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        // In production, use relative path (Nginx proxies /api/ to backend)
        // In development, use full URL to localhost API
        const isProduction = typeof window !== 'undefined' && 
          (window.location.hostname.includes('albardaiforness.org') || 
           window.location.hostname.includes('alberodipreone.org') ||
           window.location.hostname.includes('alberodiraveo.org'));
        
        const apiUrl = isProduction ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3300');
        const response = await fetch(`${apiUrl}/api/media/person/${personId}`);
        
        if (response.ok) {
          const data = await response.json();
          setMedia(data);
        }
      } catch (error) {
        console.error('Error fetching media:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, [personId]);

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
      {photos.length > 0 && (
        <Card className={styles.gallery}>
          <h3 className={styles.title}>
            {t('media.photos')} ({photos.length})
          </h3>
          <div className={styles.grid}>
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
              <a
                key={doc.id}
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

            <img
              src={selectedMedia.filePath}
              alt={selectedMedia.title || selectedMedia.fileName}
              className={styles.fullImage}
            />

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
    </>
  );
}

