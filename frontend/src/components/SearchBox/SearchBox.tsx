'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentServer } from '@/store/slices/serverSlice';
import { Input, Button, Card, GenderSelect, GenderValue } from '@/components/ui';
import InputWithHint from '@/components/ui/InputWithHint/InputWithHint';
import { useTranslations } from '@/i18n/useTranslations';
import styles from './SearchBox.module.scss';

interface SearchBoxProps {
  initialValues?: {
    q?: string;
    firstName?: string;
    lastName?: string;
    nickName?: string;
    birthYear?: string;
    deathYear?: string;
    birthPlace?: string;
    deathPlace?: string;
    occupation?: string;
    note?: string;
    gender?: string;
  };
}

export default function SearchBox({ initialValues }: SearchBoxProps = {}) {
  const router = useRouter();
  const currentServer = useAppSelector(selectCurrentServer);
  const { t } = useTranslations();
  const [query, setQuery] = useState(initialValues?.q || '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    firstName: initialValues?.firstName || '',
    lastName: initialValues?.lastName || '',
    nickName: initialValues?.nickName || '',
    birthYear: initialValues?.birthYear || '',
    deathYear: initialValues?.deathYear || '',
    birthPlace: initialValues?.birthPlace || '',
    deathPlace: initialValues?.deathPlace || '',
    occupation: initialValues?.occupation || '',
    note: initialValues?.note || '',
    gender: initialValues?.gender || '',
  });

  // Update filters when initialValues change
  useEffect(() => {
    if (initialValues) {
      setQuery(initialValues.q || '');
      setAdvancedFilters({
        firstName: initialValues.firstName || '',
        lastName: initialValues.lastName || '',
        nickName: initialValues.nickName || '',
        birthYear: initialValues.birthYear || '',
        deathYear: initialValues.deathYear || '',
        birthPlace: initialValues.birthPlace || '',
        deathPlace: initialValues.deathPlace || '',
        occupation: initialValues.occupation || '',
        note: initialValues.note || '',
        gender: initialValues.gender || '',
      });
    }
  }, [initialValues]);

  const handleSimpleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}&server=${currentServer}`);
    }
  };

  const handleAdvancedSearch = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.append('server', currentServer);
    
    Object.entries(advancedFilters).forEach(([key, value]) => {
      if (value.trim()) {
        params.append(key, value);
      }
    });

    router.push(`/search?${params.toString()}`);
  };

  const handleReset = () => {
    setQuery('');
    setAdvancedFilters({
      firstName: '',
      lastName: '',
      nickName: '',
      birthYear: '',
      deathYear: '',
      birthPlace: '',
      deathPlace: '',
      occupation: '',
      note: '',
      gender: '',
    });
  };

  return (
    <Card className={styles.searchBox}>
      {/* Advanced Search */}
      {showAdvanced && (
        <form onSubmit={handleAdvancedSearch} className={styles.advancedForm}>
          <div className={styles.formGrid}>
            <div className={styles.fullWidth}>
              <Input
                type="text"
                value={advancedFilters.firstName}
                onChange={(e) => setAdvancedFilters({...advancedFilters, firstName: e.target.value})}
                placeholder="NOME"
              />
            </div>

            <div className={styles.fullWidth}>
              <Input
                type="text"
                value={advancedFilters.lastName}
                onChange={(e) => setAdvancedFilters({...advancedFilters, lastName: e.target.value})}
                placeholder="COGNOME"
              />
            </div>

            <div className={styles.fullWidth}>
              <Input
                type="text"
                value={advancedFilters.nickName}
                onChange={(e) => setAdvancedFilters({...advancedFilters, nickName: e.target.value})}
                placeholder="SOPRANNOME"
              />
            </div>

             <div className={styles.fullWidth}>
              <GenderSelect
                value={(advancedFilters.gender || 'any') as GenderValue}
                onChange={(value) => setAdvancedFilters({...advancedFilters, gender: value === 'any' ? '' : value})}
              />
            </div>

            <InputWithHint
              type="text"
              value={advancedFilters.birthYear}
              onChange={(e) => setAdvancedFilters({...advancedFilters, birthYear: e.target.value})}
              placeholder="DATA DI NASCITA"
              hint="Esempi:\n1950 - anno esatto\n>1950 - dopo il 1950\n<1950 - prima del 1950\n1930-1950 - tra il 1930 e il 1950"
            />

            <InputWithHint
              type="text"
              value={advancedFilters.deathYear}
              onChange={(e) => setAdvancedFilters({...advancedFilters, deathYear: e.target.value})}
              placeholder="DATA DI MORTE"
              hint="Esempi:\n1950 - anno esatto\n>1950 - dopo il 1950\n<1950 - prima del 1950\n1930-1950 - tra il 1930 e il 1950"
            />

            <Input
              type="text"
              value={advancedFilters.birthPlace}
              onChange={(e) => setAdvancedFilters({...advancedFilters, birthPlace: e.target.value})}
              placeholder="LUOGO DI NASCITA"
            />

            <Input
              type="text"
              value={advancedFilters.deathPlace}
              onChange={(e) => setAdvancedFilters({...advancedFilters, deathPlace: e.target.value})}
              placeholder="LUOGO DI MORTE"
            />

            <div className={styles.fullWidth}>
              <Input
                type="text"
                value={advancedFilters.occupation}
                onChange={(e) => setAdvancedFilters({...advancedFilters, occupation: e.target.value})}
                placeholder="CONDIZIONE"
              />
            </div>

            <div className={styles.fullWidth}>
              <Input
                type="text"
                value={advancedFilters.note}
                onChange={(e) => setAdvancedFilters({...advancedFilters, note: e.target.value})}
                placeholder="NOTE"
              />
            </div>
          </div>

          <div className={styles.formActions}>
            <Button type="submit" variant="primary">
              CERCA
            </Button>
            <div className={styles.secondRow}>
              <Button type="button" onClick={handleReset} variant="secondary">
                CANCELLA
              </Button>
              <Button type="button" onClick={() => setShowAdvanced(false)} variant="outline">
                RICERCA AVANZATA
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Simple Search */}
      {!showAdvanced && (
        <form onSubmit={handleSimpleSearch} className={styles.simpleForm}>
          <div className={styles.searchInput}>
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setShowAdvanced(true)}
              placeholder={t('search.placeholder')}
              autoFocus
            />
          </div>
          <div className={styles.buttonRow}>
            <Button type="submit" variant="primary">
              {t('common.search')}
            </Button>
            <Button type="button" onClick={() => setShowAdvanced(true)} variant="outline">
              {t('search.advancedSearch')}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
