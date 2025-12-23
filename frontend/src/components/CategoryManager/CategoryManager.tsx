'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from '@/i18n/useTranslations';
import { Card, Button, Input, Modal, ConfirmModal, LoadingState, ErrorState, EmptyState } from '@/ui';
import { categoryApi } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { Category } from '@/types';
import styles from './CategoryManager.module.scss';

export default function CategoryManager() {
  const { t } = useTranslations();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ title: '', parentId: '' });

  const { data: categories = [], loading, error, execute: refetchCategories } = useApi<Category[]>(
    () => categoryApi.getAll()
  );

  useEffect(() => {
    refetchCategories();
  }, [refetchCategories]);

  const handleAdd = async () => {
    try {
      await categoryApi.create({
        title: formData.title,
        parentId: formData.parentId || undefined,
      });
      setIsAddModalOpen(false);
      setFormData({ title: '', parentId: '' });
      refetchCategories();
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const handleEdit = async () => {
    if (!selectedCategory) return;
    try {
      await categoryApi.update(selectedCategory.id, {
        title: formData.title,
        parentId: formData.parentId || undefined,
      });
      setIsEditModalOpen(false);
      setSelectedCategory(null);
      setFormData({ title: '', parentId: '' });
      refetchCategories();
    } catch (error) {
      console.error('Error editing category:', error);
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await categoryApi.delete(categoryToDelete.id);
      setCategoryToDelete(null);
      refetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const openEditModal = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      title: category.title,
      parentId: category.parentId || '',
    });
    setIsEditModalOpen(true);
  };

  if (loading) {
    return <LoadingState text={t('common.loading')} />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={refetchCategories} />;
  }

  return (
    <Card className={styles.categoryManager}>
      <div className={styles.header}>
        <h2>{t('gallery.category')}</h2>
        <Button onClick={() => setIsAddModalOpen(true)}>
          {t('gallery.addCategory')}
        </Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon="📁"
          message={t('gallery.noCategories')}
        />
      ) : (
        <div className={styles.list}>
          {categories.map((category) => (
            <div key={category.id} className={styles.item}>
              <div className={styles.itemInfo}>
                <span className={styles.itemTitle}>{category.title}</span>
                {category.parent && (
                  <span className={styles.itemParent}>
                    {t('gallery.parentCategory')}: {category.parent.title}
                  </span>
                )}
              </div>
              <div className={styles.itemActions}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => openEditModal(category)}
                >
                  {t('common.edit')}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setCategoryToDelete(category)}
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
          setFormData({ title: '', parentId: '' });
        }}
        title={t('gallery.addCategory')}
      >
        <div className={styles.form}>
          <Input
            label={t('gallery.categoryName')}
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            fullWidth
          />
          <div className={styles.formGroup}>
            <label>{t('gallery.parentCategory')}</label>
            <select
              value={formData.parentId}
              onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
            >
              <option value="">{t('gallery.noParent')}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.title}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formActions}>
            <Button onClick={handleAdd} disabled={!formData.title}>
              {t('common.add')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setIsAddModalOpen(false);
                setFormData({ title: '', parentId: '' });
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
          setSelectedCategory(null);
          setFormData({ title: '', parentId: '' });
        }}
        title={t('gallery.editCategory')}
      >
        <div className={styles.form}>
          <Input
            label={t('gallery.categoryName')}
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            fullWidth
          />
          <div className={styles.formGroup}>
            <label>{t('gallery.parentCategory')}</label>
            <select
              value={formData.parentId}
              onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
            >
              <option value="">{t('gallery.noParent')}</option>
              {categories
                .filter((cat) => cat.id !== selectedCategory?.id)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.title}
                  </option>
                ))}
            </select>
          </div>
          <div className={styles.formActions}>
            <Button onClick={handleEdit} disabled={!formData.title}>
              {t('common.save')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedCategory(null);
                setFormData({ title: '', parentId: '' });
              }}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!categoryToDelete}
        title={t('gallery.deleteCategory')}
        message={t('gallery.confirmDeleteCategory', { name: categoryToDelete?.title || '' })}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setCategoryToDelete(null)}
      />
    </Card>
  );
}

