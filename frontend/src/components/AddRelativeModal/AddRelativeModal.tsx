'use client';

import { useState, useEffect, useCallback } from 'react';
import { SearchInput, EmptyState, Modal } from '@/ui';
import { personApi } from '@/lib/api';
import { useTranslations } from '@/i18n/useTranslations';
import { PersonSummary } from '@/types';
import { useApi } from '@/hooks/useApi';
import styles from './AddRelativeModal.module.scss';

interface AddRelativeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (person: PersonSummary, relationType: string) => void;
  relationType: 'father' | 'mother' | 'spouse' | 'child';
}

export default function AddRelativeModal({
  isOpen,
  onClose,
  onSelect,
  relationType,
}: AddRelativeModalProps) {
  const { t } = useTranslations();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<PersonSummary[]>([]);

  // Wrapper function for search that handles both ID and text search
  const searchPersons = useCallback(async (query: string) => {
    const isNumericSearch = /^\d+$/.test(query.trim());
    
    if (isNumericSearch) {
      return await personApi.loadByIds([parseInt(query.trim())]);
    } else {
      return await personApi.search({ q: query });
    }
  }, []);

  const { data, loading, error, execute, reset } = useApi<PersonSummary[]>(searchPersons);

  useEffect(() => {
    if (data) {
      setResults(data);
    }
  }, [data]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setResults([]);
      reset();
    }
  }, [isOpen, reset]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    await execute(query);
  };

  const getRelationTitle = () => {
    switch (relationType) {
      case 'father': return t('person.father');
      case 'mother': return t('person.mother');
      case 'spouse': return t('person.spouse');
      case 'child': return t('person.children');
      default: return '';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t('common.add')} ${getRelationTitle()}`}
      size="md"
    >
      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        onSearch={handleSearch}
        placeholder={`${t('search.placeholder')} ${t('search.orSearchById')}`}
        buttonText={t('common.search')}
        loading={loading}
        className={styles.searchSection}
      />

      <div className={styles.results}>
        {error && (
          <div className={styles.error}>{error}</div>
        )}
        {results.length === 0 && !loading && searchQuery && !error && (
          <EmptyState
            icon="🔍"
            message={t('search.noResults')}
          />
        )}
        
        {results.map((person) => (
          <div
            key={person.id}
            className={styles.resultItem}
            onClick={() => {
              onSelect(person, relationType);
              onClose();
            }}
          >
            <div className={styles.personInfo}>
              <div className={styles.personName}>
                {person.firstName} {person.lastName}
              </div>
              <div className={styles.personMeta}>
                {(person.originalId || person.id) && (
                  <span className={styles.personId}>
                    ID: {person.originalId || person.id}
                  </span>
                )}
                {person.birthYear && (
                  <span className={styles.personDates}>
                    {person.birthYear}
                    {person.deathYear && ` - ${person.deathYear}`}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

