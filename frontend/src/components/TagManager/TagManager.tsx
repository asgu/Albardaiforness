'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from '@/i18n/useTranslations';
import { Card, Button, Input, Modal, ConfirmModal, LoadingState, ErrorState, EmptyState } from '@/ui';
import { tagApi } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { Tag } from '@/types';
import styles from './TagManager.module.scss';

export default function TagManager() {
  const { t } = useTranslations();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({ title: '' });

  const { data: tags = [], loading, error, execute: refetchTags } = useApi<Tag[]>(
    () => tagApi.getAll()
  );

  useEffect(() => {
    refetchTags();
  }, [refetchTags]);

  const handleAdd = async () => {
    try {
      await tagApi.create({ title: formData.title });
      setIsAddModalOpen(false);
      setFormData({ title: '' });
      refetchTags();
    } catch (error) {
      console.error('Error adding tag:', error);
    }
  };

  const handleEdit = async () => {
    if (!selectedTag) return;
    try {
      await tagApi.update(selectedTag.id, { title: formData.title });
      setIsEditModalOpen(false);
      setSelectedTag(null);
      setFormData({ title: '' });
      refetchTags();
    } catch (error) {
      console.error('Error editing tag:', error);
    }
  };

  const handleDelete = async () => {
    if (!tagToDelete) return;
    try {
      await tagApi.delete(tagToDelete.id);
      setTagToDelete(null);
      refetchTags();
    } catch (error) {
      console.error('Error deleting tag:', error);
    }
  };

  const openEditModal = (tag: Tag) => {
    setSelectedTag(tag);
    setFormData({ title: tag.title });
    setIsEditModalOpen(true);
  };

  if (loading) {
    return <LoadingState text={t('common.loading')} />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={refetchTags} />;
  }

  return (
    <Card className={styles.tagManager}>
      <div className={styles.header}>
        <h2>{t('gallery.tag')}</h2>
        <Button onClick={() => setIsAddModalOpen(true)}>
          {t('gallery.addTag')}
        </Button>
      </div>

      {!tags || tags.length === 0 ? (
        <EmptyState
          icon="🏷️"
          message={t('gallery.noTags')}
        />
      ) : (
        <div className={styles.list}>
          {tags.map((tag) => (
            <div key={tag.id} className={styles.item}>
              <span className={styles.itemTitle}>{tag.title}</span>
              <div className={styles.itemActions}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => openEditModal(tag)}
                >
                  {t('common.edit')}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setTagToDelete(tag)}
                >
                  {t('common.delete')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setFormData({ title: '' });
        }}
        title={t('gallery.addTag')}
      >
        <div className={styles.form}>
          <Input
            label={t('gallery.tagName')}
            value={formData.title}
            onChange={(e) => setFormData({ title: e.target.value })}
            fullWidth
          />
          <div className={styles.formActions}>
            <Button onClick={handleAdd} disabled={!formData.title}>
              {t('common.add')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setIsAddModalOpen(false);
                setFormData({ title: '' });
              }}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTag(null);
          setFormData({ title: '' });
        }}
        title={t('gallery.editTag')}
      >
        <div className={styles.form}>
          <Input
            label={t('gallery.tagName')}
            value={formData.title}
            onChange={(e) => setFormData({ title: e.target.value })}
            fullWidth
          />
          <div className={styles.formActions}>
            <Button onClick={handleEdit} disabled={!formData.title}>
              {t('common.save')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedTag(null);
                setFormData({ title: '' });
              }}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!tagToDelete}
        title={t('gallery.deleteTag')}
        message={t('gallery.confirmDeleteTag', { name: tagToDelete?.title || '' })}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setTagToDelete(null)}
      />
    </Card>
  );
}

