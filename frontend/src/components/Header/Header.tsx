'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCurrentServer, selectServerInfo } from '@/store/slices/serverSlice';
import { logout, selectIsAuthenticated } from '@/store/slices/authSlice';
import { Button, Input } from '@/components/ui';
import LanguageSwitcher from '@/components/LanguageSwitcher/LanguageSwitcher';
import { useTranslations } from '@/i18n/useTranslations';
import styles from './Header.module.scss';

export default function Header() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t } = useTranslations();
  const currentServer = useAppSelector(selectCurrentServer);
  const serverInfo = useAppSelector(selectServerInfo);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchExpanded, setShowSearchExpanded] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}&server=${currentServer}`);
      setSearchQuery('');
      setShowSearchExpanded(false);
    }
  };

  const handleSearchFocus = () => {
    setShowSearchExpanded(true);
  };

  const handleSearchBlur = () => {
    // Delay to allow clicking on search results
    setTimeout(() => {
      setShowSearchExpanded(false);
    }, 200);
  };

  return (
    <header className={styles.header} style={{ borderTopColor: serverInfo?.color || '#0ea5e9' }}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <Link href="/">
            <h1>Albero</h1>
            <span className={styles.cityName}>{serverInfo?.name || 'Albero'}</span>
          </Link>
        </div>

        <nav className={styles.nav}>
          <Link href="/">{t('common.home')}</Link>
          <Link href="/gallery">{t('common.gallery')}</Link>
          <Link href="/contacts">{t('common.contacts')}</Link>
          {isAuthenticated && (
            <Link href="/admin">{t('common.admin')}</Link>
          )}
        </nav>

        <div className={styles.rightSection}>
          <div className={`${styles.searchWrapper} ${showSearchExpanded ? styles.expanded : ''}`}>
            <form className={styles.searchForm} onSubmit={handleSearch}>
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                placeholder={t('header.searchPlaceholder')}
                className={styles.searchInput}
              />
            </form>
            
            {showSearchExpanded && (
              <div className={styles.searchDropdown}>
                <Link href={`/search?server=${currentServer}`} className={styles.advancedLink}>
                  {t('header.advancedSearch')}
                </Link>
              </div>
            )}
          </div>

          <div className={styles.actions}>
            <LanguageSwitcher />

            {isAuthenticated && (
              <Button onClick={handleLogout} variant="secondary">
                {t('common.logout')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

