'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentServer } from '@/store/slices/serverSlice';
import { Input, Button, Card, GenderSelect, GenderValue } from '@/components/ui';
import { useTranslations } from '@/i18n/useTranslations';
import styles from './SearchBox.module.scss';

export default function SearchBox() {
  const router = useRouter();
  const currentServer = useAppSelector(selectCurrentServer);
  const { t } = useTranslations();
  const [query, setQuery] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [advancedFilters, setAdvancedFilters] = useState({
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

            <Input
              type="text"
              value={advancedFilters.birthYear}
              onChange={(e) => setAdvancedFilters({...advancedFilters, birthYear: e.target.value})}
              placeholder="DATA DI NASCITA"
            />

            <Input
              type="text"
              value={advancedFilters.deathYear}
              onChange={(e) => setAdvancedFilters({...advancedFilters, deathYear: e.target.value})}
              placeholder="DATA DI MORTE"
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
            <Button type="button" onClick={handleReset} variant="secondary">
              CANCELLA
            </Button>
            <Button type="button" onClick={() => setShowAdvanced(false)} variant="outline">
              RICERCA AVANZATA
            </Button>
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
