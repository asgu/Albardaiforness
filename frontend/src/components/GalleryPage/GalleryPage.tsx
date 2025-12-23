'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/i18n/useTranslations';
import { Card, Button, Modal, SearchInput, LoadingState, ErrorState, EmptyState, ErrorModal } from '@/ui';
import { mediaApi, categoryApi, tagApi } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { useAppSelector } from '@/store/hooks';
import { selectIsAuthenticated } from '@/store/slices/authSlice';
import { GalleryMedia, Category, Tag } from '@/types';
import MediaEditor from '@/components/MediaEditor/MediaEditor';
import styles from './GalleryPage.module.scss';

export default function GalleryPage() {
  const { t } = useTranslations();
  const router = useRouter();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedTag, setSelectedTag] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMedia, setSelectedMedia] = useState<GalleryMedia | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mediaToEdit, setMediaToEdit] = useState<GalleryMedia | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch categories
  const { data: categories = [], loading: categoriesLoading } = useApi<Category[]>(
    () => categoryApi.getAll()
  );

  // Fetch tags
  const { data: tags = [], loading: tagsLoading } = useApi<Tag[]>(
    () => tagApi.getAll()
  );

  // Fetch media
  const { 
    data: mediaResponse, 
    loading: mediaLoading, 
    error: mediaError,
    execute: fetchMedia 
  } = useApi<{ data: GalleryMedia[]; pagination: any }>(
    (params: any) => mediaApi.getAll(params)
  );

  useEffect(() => {
    fetchMedia({
      categoryId: selectedCategory,
      tagId: selectedTag,
      search: searchQuery || undefined,
      page: currentPage,
      limit: 20,
    });
  }, [selectedCategory, selectedTag, searchQuery, currentPage, fetchMedia]);

  const media = mediaResponse?.data || [];
  const pagination = mediaResponse?.pagination;

  const openMedia = (item: GalleryMedia, index: number) => {
    setSelectedMedia(item);
    setCurrentIndex(index);
  };

  const navigateNext = () => {
    if (currentIndex < media.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setSelectedMedia(media[nextIndex]);
    }
  };

  const navigatePrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setSelectedMedia(media[prevIndex]);
    }
  };

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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleCategoryChange = (categoryId: string | undefined) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
  };

  const handleTagChange = (tagId: string | undefined) => {
    setSelectedTag(tagId);
    setCurrentPage(1);
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0 || !isAuthenticated) return;

    setUploading(true);
    const formData = new FormData();
    
    Array.from(files).forEach((file) => {
      formData.append('files', file);
    });

    try {
      await mediaApi.upload(formData);
      fetchMedia({
        categoryId: selectedCategory,
        tagId: selectedTag,
        search: searchQuery || undefined,
        page: currentPage,
        limit: 20,
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      setErrorMessage(error.message || t('media.uploadError'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.galleryPage}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>{t('common.gallery')}</h1>
          <div className={styles.headerActions}>
            {isAuthenticated && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,application/pdf,.doc,.docx"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  style={{ display: 'none' }}
                />
                <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? t('common.loading') : t('gallery.uploadMedia')}
                </Button>
                <Button variant="secondary" onClick={() => router.push('/gallery/admin')}>
                  {t('common.admin')}
                </Button>
              </>
            )}
          </div>
        </div>

        <Card className={styles.filters}>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={handleSearch}
            placeholder={t('search.placeholder')}
            buttonText={t('common.search')}
            loading={mediaLoading}
          />

          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label>{t('gallery.category')}</label>
              <select
                value={selectedCategory || ''}
                onChange={(e) => handleCategoryChange(e.target.value || undefined)}
                disabled={categoriesLoading}
              >
                <option value="">{t('gallery.allCategories')}</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.title}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>{t('gallery.tag')}</label>
              <select
                value={selectedTag || ''}
                onChange={(e) => handleTagChange(e.target.value || undefined)}
                disabled={tagsLoading}
              >
                <option value="">{t('gallery.allTags')}</option>
                {tags?.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {mediaLoading && <LoadingState text={t('common.loading')} />}
        {mediaError && <ErrorState message={mediaError} onRetry={() => fetchMedia({})} />}

        {!mediaLoading && !mediaError && media.length === 0 && (
          <EmptyState
            icon="📷"
            message={t('search.noResults')}
          />
        )}

        {!mediaLoading && !mediaError && media.length > 0 && (
          <>
            <div className={styles.grid}>
              {media.map((item, index) => (
                <div
                  key={item.id}
                  className={styles.gridItem}
                  onClick={() => openMedia(item, index)}
                >
                  {item.mediaType === 'photo' ? (
                    <img
                      src={item.thumbnailPath || item.filePath}
                      alt={item.title || item.fileName}
                      className={styles.thumbnail}
                    />
                  ) : (
                    <div className={styles.documentThumb}>
                      <span className={styles.documentIcon}>📄</span>
                      <span className={styles.documentName}>
                        {item.title || item.fileName}
                      </span>
                    </div>
                  )}
                  {item.title && (
                    <div className={styles.itemTitle}>{item.title}</div>
                  )}
                  {isAuthenticated && (
                    <button
                      className={styles.editButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMediaToEdit(item);
                      }}
                      title={t('common.edit')}
                    >
                      ✏️
                    </button>
                  )}
                </div>
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className={styles.pagination}>
                <Button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  variant="secondary"
                  size="sm"
                >
                  &laquo; {t('common.previous')}
                </Button>
                <span className={styles.pageInfo}>
                  {t('gallery.page')} {currentPage} {t('gallery.of')} {pagination.totalPages}
                </span>
                <Button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages}
                  variant="secondary"
                  size="sm"
                >
                  {t('common.next')} &raquo;
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {selectedMedia && (
        <Modal isOpen={!!selectedMedia} onClose={() => setSelectedMedia(null)} size="full">
          <div className={styles.modalContentWrapper}>
            <button
              className={styles.navButton}
              onClick={navigatePrevious}
              disabled={currentIndex === 0}
            >
              &lt;
            </button>
            <div className={styles.modalImageContainer}>
              <img
                src={selectedMedia.filePath}
                alt={selectedMedia.title || selectedMedia.fileName}
                className={styles.modalImage}
              />
              {selectedMedia.title && (
                <div className={styles.modalTitle}>{selectedMedia.title}</div>
              )}
              {selectedMedia.description && (
                <div className={styles.modalDescription}>{selectedMedia.description}</div>
              )}
            </div>
            <button
              className={styles.navButton}
              onClick={navigateNext}
              disabled={currentIndex === media.length - 1}
            >
              &gt;
            </button>
            <div className={styles.mediaCounter}>
              {currentIndex + 1} / {media.length}
            </div>
          </div>
        </Modal>
      )}

      {mediaToEdit && (
        <MediaEditor
          media={mediaToEdit}
          isOpen={!!mediaToEdit}
          onClose={() => setMediaToEdit(null)}
          onSave={() => {
            setMediaToEdit(null);
            fetchMedia({
              categoryId: selectedCategory,
              tagId: selectedTag,
              search: searchQuery || undefined,
              page: currentPage,
              limit: 20,
            });
          }}
        />
      )}

      <ErrorModal
        isOpen={!!errorMessage}
        title={t('common.error')}
        message={errorMessage || ''}
        onClose={() => setErrorMessage(null)}
      />
    </div>
  );
}

