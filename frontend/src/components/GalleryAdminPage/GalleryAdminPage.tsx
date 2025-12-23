'use client';

import { useState } from 'react';
import { useTranslations } from '@/i18n/useTranslations';
import { useAppSelector } from '@/store/hooks';
import { selectIsAuthenticated } from '@/store/slices/authSlice';
import { useRouter } from 'next/navigation';
import { Button } from '@/ui';
import CategoryManager from '@/components/CategoryManager/CategoryManager';
import TagManager from '@/components/TagManager/TagManager';
import styles from './GalleryAdminPage.module.scss';

export default function GalleryAdminPage() {
  const { t } = useTranslations();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'categories' | 'tags'>('categories');

  if (!isAuthenticated) {
    router.push('/auth/login');
    return null;
  }

  return (
    <div className={styles.adminPage}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>{t('gallery.title')} - {t('common.admin')}</h1>
          <Button variant="secondary" onClick={() => router.push('/gallery')}>
            {t('common.back')}
          </Button>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'categories' ? styles.active : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            {t('gallery.manageCategories')}
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'tags' ? styles.active : ''}`}
            onClick={() => setActiveTab('tags')}
          >
            {t('gallery.manageTags')}
          </button>
        </div>

        <div className={styles.content}>
          {activeTab === 'categories' && <CategoryManager />}
          {activeTab === 'tags' && <TagManager />}
        </div>
      </div>
    </div>
  );
}

