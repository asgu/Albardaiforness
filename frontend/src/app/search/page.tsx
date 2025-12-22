'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header/Header';
import SearchBox from '@/components/SearchBox/SearchBox';
import RelativeCard from '@/components/RelativeCard/RelativeCard';
import { personApi } from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentServer, selectServers } from '@/store/slices/serverSlice';
import { selectIsAuthenticated } from '@/store/slices/authSlice';
import { useTranslations } from '@/i18n/useTranslations';
import { Button, Loader } from '@/components/ui';
import { PersonSearchResult } from '@/types';
import styles from './page.module.scss';

function SearchContent() {
  const { t } = useTranslations();
  const searchParams = useSearchParams();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const query = searchParams.get('q') || '';
  const serverParam = searchParams.get('server');
  const id = searchParams.get('id') || '';
  const firstName = searchParams.get('firstName') || '';
  const lastName = searchParams.get('lastName') || '';
  const nickName = searchParams.get('nickName') || '';
  const birthYear = searchParams.get('birthYear');
  const deathYear = searchParams.get('deathYear');
  const gender = searchParams.get('gender') || '';
  const birthPlace = searchParams.get('birthPlace') || '';
  const occupation = searchParams.get('occupation') || '';
  const note = searchParams.get('note') || '';
  
  const currentServerCode = useAppSelector(selectCurrentServer);
  const servers = useAppSelector(selectServers);
  const currentServer = servers[currentServerCode];
  const [results, setResults] = useState<PersonSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSearchForm, setShowSearchForm] = useState(false);

  useEffect(() => {
    if (query || id || firstName || lastName || nickName || birthYear || deathYear || gender || birthPlace || occupation || note) {
      performSearch();
    }
  }, [query, serverParam, id, firstName, lastName, nickName, birthYear, deathYear, gender, birthPlace, occupation, note]);

  const performSearch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const server = serverParam || currentServer?.code;
      const params: any = { server };
      
      if (query) params.q = query;
      if (id) params.id = id;
      if (firstName) params.firstName = firstName;
      if (lastName) params.lastName = lastName;
      if (nickName) params.nickName = nickName;
      if (birthYear) params.birthYear = parseInt(birthYear);
      if (deathYear) params.deathYear = parseInt(deathYear);
      if (gender) params.gender = gender;
      if (birthPlace) params.birthPlace = birthPlace;
      if (occupation) params.occupation = occupation;
      if (note) params.note = note;
      
      const response = await personApi.search(params);
      setResults(response.data);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.response?.data?.message || t('search.searchError'));
    } finally {
      setLoading(false);
    }
  };

  const getSearchSummary = () => {
    const parts: string[] = [];
    if (query) parts.push(`"${query}"`);
    if (id) parts.push(`${t('person.id')}: ${id}`);
    if (firstName) parts.push(`${t('search.firstName')}: ${firstName}`);
    if (lastName) parts.push(`${t('search.lastName')}: ${lastName}`);
    if (nickName) parts.push(`${t('search.nickName')}: ${nickName}`);
    if (birthYear) parts.push(`${t('search.birthYear')}: ${birthYear}`);
    if (deathYear) parts.push(`${t('search.deathYear')}: ${deathYear}`);
    if (gender) parts.push(`${t('search.gender')}: ${gender === 'male' ? t('search.male') : t('search.female')}`);
    if (birthPlace) parts.push(`${t('search.birthPlace')}: ${birthPlace}`);
    if (occupation) parts.push(`${t('search.occupation')}: ${occupation}`);
    if (note) parts.push(`${t('search.note')}: ${note}`);
    return parts.join(', ');
  };

  return (
    <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1>{t('search.title')}</h1>
            <Button 
              variant="outline" 
              onClick={() => setShowSearchForm(!showSearchForm)}
            >
              {showSearchForm ? t('search.hideFilters') : t('search.editSearch')}
            </Button>
          </div>

          {showSearchForm && (
            <div className={styles.searchFormWrapper}>
              <SearchBox 
                initialValues={{
                  q: query,
                  id,
                  firstName,
                  lastName,
                  nickName,
                  birthYear: birthYear || '',
                  deathYear: deathYear || '',
                  birthPlace,
                  occupation,
                  note,
                  gender,
                }}
                isAuthenticated={isAuthenticated}
              />
            </div>
          )}
          
          {(query || id || firstName || lastName || nickName || birthYear || deathYear || gender || birthPlace || occupation || note) && (
            <div className={styles.searchInfo}>
              <p>{t('search.resultsFor')}: <strong>{getSearchSummary()}</strong></p>
              {serverParam && <p>{t('search.server')}: <strong>{serverParam}</strong></p>}
            </div>
          )}

          {loading && (
            <Loader text={t('search.searching')} />
          )}

          {error && (
            <div className={styles.error}>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && results.length === 0 && (query || id || firstName || lastName || nickName || birthYear || deathYear || gender || birthPlace || occupation || note) && (
            <div className={styles.noResults}>
              <p>{t('search.noResults')}</p>
            </div>
          )}

          {!loading && !error && results.length > 0 && (
            <div className={styles.results}>
              <p className={styles.count}>{t('search.found')} {results.length} {t('search.results')}</p>
              <div className={styles.resultsList}>
                {results.map((person) => (
                  <RelativeCard 
                    key={person.id} 
                    person={person}
                    isAuthenticated={isAuthenticated}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
  );
}

export default function SearchPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div>Loading...</div>}>
        <SearchContent />
      </Suspense>
    </>
  );
}

