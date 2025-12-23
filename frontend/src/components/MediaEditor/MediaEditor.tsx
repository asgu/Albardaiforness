'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from '@/i18n/useTranslations';
import { Modal, Button, Input, Textarea, LoadingState } from '@/ui';
import { mediaApi, categoryApi, tagApi } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { GalleryMedia, Category, Tag } from '@/types';
import styles from './MediaEditor.module.scss';

interface MediaEditorProps {
  media: GalleryMedia;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function MediaEditor({ media, isOpen, onClose, onSave }: MediaEditorProps) {
  const { t } = useTranslations();
  const [formData, setFormData] = useState({
    title: media.title || '',
    description: media.description || '',
    isPublic: media.isPublic,
    categoryId: media.categoryId || '',
    tagIds: media.tags?.map(tag => tag.id) || [],
  });
  const [saving, setSaving] = useState(false);

  const { data: categories = [] } = useApi<Category[]>(() => categoryApi.getAll());
  const { data: tags = [] } = useApi<Tag[]>(() => tagApi.getAll());

  useEffect(() => {
    setFormData({
      title: media.title || '',
      description: media.description || '',
      isPublic: media.isPublic,
      categoryId: media.categoryId || '',
      tagIds: media.tags?.map(tag => tag.id) || [],
    });
  }, [media]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await mediaApi.update(media.id, {
        title: formData.title,
        description: formData.description,
        isPublic: formData.isPublic,
        categoryId: formData.categoryId || undefined,
        tags: formData.tagIds,
      } as any);
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving media:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleTagToggle = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter(id => id !== tagId)
        : [...prev.tagIds, tagId],
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('gallery.editMedia')} size="md">
      <div className={styles.editor}>
        <Input
          label={t('gallery.mediaTitle')}
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          fullWidth
        />

        <Textarea
          label={t('gallery.mediaDescription')}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
        />

        <div className={styles.formGroup}>
          <label>{t('gallery.mediaCategory')}</label>
          <select
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
          >
            <option value="">{t('gallery.noCategory')}</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.title}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>{t('gallery.mediaTags')}</label>
          <div className={styles.tagList}>
            {tags?.map((tag) => (
              <label key={tag.id} className={styles.tagItem}>
                <input
                  type="checkbox"
                  checked={formData.tagIds.includes(tag.id)}
                  onChange={() => handleTagToggle(tag.id)}
                />
                <span>{tag.title}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={formData.isPublic}
              onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
            />
            <span>{t('gallery.mediaPublic')}</span>
          </label>
        </div>

        <div className={styles.actions}>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? t('common.loading') : t('gallery.mediaSave')}
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {t('gallery.mediaCancel')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

