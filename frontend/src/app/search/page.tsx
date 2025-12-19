'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header/Header';
import { personApi } from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentServer, selectServers } from '@/store/slices/serverSlice';
import Link from 'next/link';
import { Card, Avatar } from '@/components/ui';
import { PersonSearchResult } from '@/types';
import styles from './page.module.scss';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const serverParam = searchParams.get('server');
  
  const currentServerCode = useAppSelector(selectCurrentServer);
  const servers = useAppSelector(selectServers);
  const currentServer = servers[currentServerCode];
  const [results, setResults] = useState<PersonSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query) {
      performSearch();
    }
  }, [query, serverParam]);

  const performSearch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const server = serverParam || currentServer?.code;
      const response = await personApi.search(query, server);
      setResults(response.data);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.response?.data?.message || 'Errore durante la ricerca');
    } finally {
      setLoading(false);
    }
  };

  const getPersonUrlId = (person: PersonSearchResult): string => {
    return person.originalId || person.id;
  };

  return (
    <main className={styles.main}>
        <div className={styles.container}>
          <h1>Ricerca</h1>
          
          {query && (
            <div className={styles.searchInfo}>
              <p>Risultati per: <strong>{query}</strong></p>
              {serverParam && <p>Server: <strong>{serverParam}</strong></p>}
            </div>
          )}

          {loading && (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Ricerca in corso...</p>
            </div>
          )}

          {error && (
            <div className={styles.error}>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && results.length === 0 && query && (
            <div className={styles.noResults}>
              <p>Nessun risultato trovato</p>
            </div>
          )}

          {!loading && !error && results.length > 0 && (
            <div className={styles.results}>
              <p className={styles.count}>Trovati {results.length} risultati</p>
              <div className={styles.resultsList}>
                {results.map((person) => (
                  <Link
                    key={person.id}
                    href={`/person/${getPersonUrlId(person)}`}
                    className={styles.resultLink}
                  >
                    <Card hoverable padding="md" className={styles.resultCard}>
                      <div className={styles.cardContent}>
                        <Avatar 
                          gender={person.gender}
                        />
                        <div className={styles.info}>
                          <h3>
                            {person.lastName.toUpperCase()} {person.firstName}
                            {person.nickName && (
                              <span className={styles.nickName}> "{person.nickName}"</span>
                            )}
                          </h3>
                          <p className={styles.dates}>
                            {person.birthYear || '?'} - {person.deathYear || '?'}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </Link>
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

