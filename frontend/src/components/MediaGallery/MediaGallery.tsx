'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from '@/i18n/useTranslations';
import { Card } from '@/ui';
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

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3300';
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

  const photos = media.filter(m => m.mediaType === 'photo');
  const documents = media.filter(m => m.mediaType === 'document');

  return (
    <>
      {photos.length > 0 && (
        <Card className={styles.gallery}>
          <h3 className={styles.title}>
            {t('media.photos')} ({photos.length})
          </h3>
          <div className={styles.grid}>
            {photos.map((photo) => (
              <div
                key={photo.id}
                className={styles.photoItem}
                onClick={() => setSelectedMedia(photo)}
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
      {selectedMedia && (
        <div className={styles.modal} onClick={() => setSelectedMedia(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.closeButton}
              onClick={() => setSelectedMedia(null)}
            >
              ×
            </button>
            <img
              src={selectedMedia.filePath}
              alt={selectedMedia.title || selectedMedia.fileName}
              className={styles.fullImage}
            />
            {selectedMedia.description && (
              <div className={styles.imageDescription}>
                {selectedMedia.description}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

