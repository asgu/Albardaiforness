'use client';

import { useState } from 'react';
import { useTranslations } from '@/i18n/useTranslations';
import Header from '@/components/Header/Header';
import GallerySidebar from '@/components/GallerySidebar/GallerySidebar';
import GalleryContent from '@/components/GalleryContent/GalleryContent';
import styles from './GalleryLayout.module.scss';

export default function GalleryLayout() {
  const { t } = useTranslations();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedTag, setSelectedTag] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Header />
      <div className={styles.galleryLayout}>
        <GallerySidebar
          selectedCategory={selectedCategory}
          selectedTag={selectedTag}
          onCategorySelect={setSelectedCategory}
          onTagSelect={setSelectedTag}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <GalleryContent
          selectedCategory={selectedCategory}
          selectedTag={selectedTag}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
      </div>
    </>
  );
}

