'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCurrentServer, selectServerInfo } from '@/store/slices/serverSlice';
import { logout, selectIsAuthenticated } from '@/store/slices/authSlice';
import { Button, Input } from '@/ui';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <header 
      className={`${styles.header} ${isAuthenticated ? styles.authenticated : ''}`} 
      style={{ borderTopColor: serverInfo?.color || '#0ea5e9' }}
    >
      <div className={styles.container}>
        <div className={styles.logo}>
          <Link href="/">
            <h1>Albero</h1>
            <span className={styles.cityName}>{serverInfo?.name || 'Albero'}</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className={styles.nav}>
          <Link href="/">{t('common.home')}</Link>
          <Link href="/gallery">{t('common.gallery')}</Link>
          {!isAuthenticated && (
            <Link href="/contacts">{t('common.contacts')}</Link>
          )}
          {isAuthenticated && (
            <>
              <Link href="/person/new">{t('common.addPerson')}</Link>
              <Link href="/users">{t('common.users')}</Link>
              <Link href="/messages">{t('common.messages')}</Link>
            </>
          )}
        </nav>

        <div className={styles.rightSection}>
          {/* Desktop Search */}
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

          {/* Desktop Actions */}
          <div className={styles.actions}>
            <LanguageSwitcher />

            {isAuthenticated ? (
              <Button onClick={handleLogout} variant="secondary">
                {t('common.logout')}
              </Button>
            ) : (
              <Link href="/login">
                <Button variant="primary">
                  {t('common.login')}
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Burger Menu */}
          <button 
            className={styles.burgerButton}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className={styles.mobileMenu}>
          <nav className={styles.mobileNav}>
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>{t('common.home')}</Link>
            <Link href="/gallery" onClick={() => setMobileMenuOpen(false)}>{t('common.gallery')}</Link>
            {!isAuthenticated && (
              <Link href="/contacts" onClick={() => setMobileMenuOpen(false)}>{t('common.contacts')}</Link>
            )}
            {isAuthenticated && (
              <>
                <Link href="/person/new" onClick={() => setMobileMenuOpen(false)}>{t('common.addPerson')}</Link>
                <Link href="/users" onClick={() => setMobileMenuOpen(false)}>{t('common.users')}</Link>
                <Link href="/messages" onClick={() => setMobileMenuOpen(false)}>{t('common.messages')}</Link>
              </>
            )}
          </nav>

          <div className={styles.mobileActions}>
            <LanguageSwitcher />

            {isAuthenticated ? (
              <Button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} variant="secondary">
                {t('common.logout')}
              </Button>
            ) : (
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary">
                  {t('common.login')}
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

