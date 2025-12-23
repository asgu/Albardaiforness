'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from '@/i18n/useTranslations';
import { useApi } from '@/hooks/useApi';
import { categoryApi, tagApi } from '@/lib/api';
import { Category, Tag } from '@/types';
import { LoadingState, EmptyState } from '@/ui';
import styles from './GallerySidebar.module.scss';

interface GallerySidebarProps {
  selectedCategory?: string;
  selectedTag?: string;
  onCategorySelect: (categoryId?: string) => void;
  onTagSelect: (tagId?: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

enum SidebarView {
  CATEGORIES = 'CATEGORIES',
  TAGS = 'TAGS',
}

export default function GallerySidebar({
  selectedCategory,
  selectedTag,
  onCategorySelect,
  onTagSelect,
  isOpen,
}: GallerySidebarProps) {
  const { t } = useTranslations();
  const [activeView, setActiveView] = useState<SidebarView>(SidebarView.CATEGORIES);

  // Fetch categories
  const { data: categories, loading: categoriesLoading, error: categoriesError, execute: fetchCategories } = useApi<Category[]>(
    () => categoryApi.getAll()
  );

  // Fetch tags
  const { data: tags, loading: tagsLoading, error: tagsError, execute: fetchTags } = useApi<Tag[]>(
    () => tagApi.getAll()
  );

  // Load data on mount
  useEffect(() => {
    fetchCategories();
    fetchTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Build category tree
  const buildCategoryTree = (cats: Category[]): Category[] => {
    const map = new Map<string, Category>();
    const roots: Category[] = [];

    // First pass: create map
    cats.forEach(cat => {
      map.set(cat.id, { ...cat, children: [] });
    });

    // Second pass: build tree
    cats.forEach(cat => {
      const node = map.get(cat.id)!;
      if (cat.parentId) {
        const parent = map.get(cat.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const categoryTree = buildCategoryTree(categories || []);
  
  console.log('Categories loaded:', categories?.length, 'Tree roots:', categoryTree.length);

  const renderCategory = (category: Category, level = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isSelected = selectedCategory === category.id;

    return (
      <div key={category.id} className={styles.categoryItem} style={{ paddingLeft: `${level * 1.5}rem` }}>
        <div
          className={`${styles.categoryTitle} ${isSelected ? styles.active : ''}`}
          onClick={() => onCategorySelect(isSelected ? undefined : category.id)}
        >
          {hasChildren && <span className={styles.arrow}>▸</span>}
          <span className={styles.categoryName}>{category.title}</span>
        </div>
        {hasChildren && (
          <div className={styles.categoryChildren}>
            {category.children!.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
      <div className={styles.sidebarSwitcher}>
        <div
          className={`${styles.sidebarSwitcherItem} ${activeView === SidebarView.CATEGORIES ? styles.active : ''}`}
          onClick={() => {
            setActiveView(SidebarView.CATEGORIES);
            onTagSelect(undefined);
          }}
        >
          {t('gallery.categories')}
        </div>
        <div
          className={`${styles.sidebarSwitcherItem} ${activeView === SidebarView.TAGS ? styles.active : ''}`}
          onClick={() => {
            setActiveView(SidebarView.TAGS);
            onCategorySelect(undefined);
          }}
        >
          {t('gallery.tags')}
        </div>
      </div>

      <div className={styles.sidebarContent}>
        {activeView === SidebarView.CATEGORIES ? (
          categoriesLoading ? (
            <LoadingState text={t('common.loading')} />
          ) : categoryTree.length === 0 ? (
            <EmptyState message={t('gallery.noCategories')} />
          ) : (
            <div className={styles.categoryList}>
              {categoryTree.map(category => renderCategory(category))}
            </div>
          )
        ) : (
          tagsLoading ? (
            <LoadingState text={t('common.loading')} />
          ) : !tags || tags.length === 0 ? (
            <EmptyState message={t('gallery.noTags')} />
          ) : (
            <div className={styles.tagList}>
              {tags.map(tag => (
                <div
                  key={tag.id}
                  className={`${styles.tagItem} ${selectedTag === tag.id ? styles.active : ''}`}
                  onClick={() => onTagSelect(selectedTag === tag.id ? undefined : tag.id)}
                >
                  <span className={styles.tagName}>{tag.title}</span>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

