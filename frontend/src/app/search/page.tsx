'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header/Header';
import SearchBox from '@/components/SearchBox/SearchBox';
import { personApi } from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentServer, selectServers } from '@/store/slices/serverSlice';
import Link from 'next/link';
import { Card, Avatar, Button, Loader } from '@/components/ui';
import { PersonSearchResult } from '@/types';
import styles from './page.module.scss';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const serverParam = searchParams.get('server');
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
    if (query || firstName || lastName || nickName || birthYear || deathYear || gender || birthPlace || occupation || note) {
      performSearch();
    }
  }, [query, serverParam, firstName, lastName, nickName, birthYear, deathYear, gender, birthPlace, occupation, note]);

  const performSearch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const server = serverParam || currentServer?.code;
      const params: any = { server };
      
      if (query) params.q = query;
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
      setError(err.response?.data?.message || 'Errore durante la ricerca');
    } finally {
      setLoading(false);
    }
  };

  const getPersonUrlId = (person: PersonSearchResult): string => {
    return person.originalId || person.id;
  };

  const getSearchSummary = () => {
    const parts: string[] = [];
    if (query) parts.push(`"${query}"`);
    if (firstName) parts.push(`Nome: ${firstName}`);
    if (lastName) parts.push(`Cognome: ${lastName}`);
    if (nickName) parts.push(`Soprannome: ${nickName}`);
    if (birthYear) parts.push(`Anno di nascita: ${birthYear}`);
    if (deathYear) parts.push(`Anno di morte: ${deathYear}`);
    if (gender) parts.push(`Sesso: ${gender === 'male' ? 'Maschio' : 'Femmina'}`);
    if (birthPlace) parts.push(`Luogo di nascita: ${birthPlace}`);
    if (occupation) parts.push(`Professione: ${occupation}`);
    if (note) parts.push(`Note: ${note}`);
    return parts.join(', ');
  };

  return (
    <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1>Ricerca</h1>
            <Button 
              variant="outline" 
              onClick={() => setShowSearchForm(!showSearchForm)}
            >
              {showSearchForm ? 'Nascondi filtri' : 'Modifica ricerca'}
            </Button>
          </div>

          {showSearchForm && (
            <div className={styles.searchFormWrapper}>
              <SearchBox 
                initialValues={{
                  q: query,
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
              />
            </div>
          )}
          
          {(query || firstName || lastName || nickName || birthYear || deathYear || gender || birthPlace || occupation || note) && (
            <div className={styles.searchInfo}>
              <p>Risultati per: <strong>{getSearchSummary()}</strong></p>
              {serverParam && <p>Server: <strong>{serverParam}</strong></p>}
            </div>
          )}

          {loading && (
            <Loader text="Ricerca in corso..." />
          )}

          {error && (
            <div className={styles.error}>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && results.length === 0 && (query || firstName || lastName || nickName || birthYear || deathYear || gender || birthPlace || occupation || note) && (
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

