'use client';

import { useState, useEffect } from 'react';
import { Input, Button } from '@/ui';
import { Modal } from '@/ui';
import { personApi } from '@/lib/api';
import { useTranslations } from '@/i18n/useTranslations';
import { PersonSummary } from '@/types';
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setResults([]);
    }
  }, [isOpen]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      // Проверяем, является ли запрос числом (ID)
      const isNumericSearch = /^\d+$/.test(searchQuery.trim());
      
      if (isNumericSearch) {
        // Поиск по ID
        const response = await personApi.loadByIds([parseInt(searchQuery.trim())]);
        setResults(response.data);
      } else {
        // Обычный текстовый поиск
        const response = await personApi.search({ q: searchQuery });
        setResults(response.data);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
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
      <div className={styles.searchSection}>
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={`${t('search.placeholder')} ${t('search.orSearchById')}`}
          fullWidth
        />
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? t('common.loading') : t('common.search')}
        </Button>
      </div>

      <div className={styles.results}>
        {results.length === 0 && !loading && searchQuery && (
          <div className={styles.noResults}>
            {t('search.noResults')}
          </div>
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

