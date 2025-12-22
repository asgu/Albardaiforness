'use client';

import { useState, useEffect } from 'react';
import { Input, Button, Card } from '@/components/ui';
import { personApi } from '@/lib/api';
import { useTranslations } from '@/i18n/useTranslations';
import styles from './AddRelativeModal.module.scss';

interface Person {
  id: string;
  firstName: string;
  lastName: string;
  birthYear?: number;
  deathYear?: number;
}

interface AddRelativeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (person: Person, relationType: string) => void;
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
  const [results, setResults] = useState<Person[]>([]);
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
      const response = await personApi.search({ q: searchQuery });
      setResults(response.data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (!isOpen) return null;

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
    <div className={styles.overlay} onClick={onClose}>
      <Card className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {t('common.add')} {getRelationTitle()}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.searchSection}>
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('search.placeholder')}
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
                {person.birthYear && (
                  <div className={styles.personDates}>
                    {person.birthYear}
                    {person.deathYear && ` - ${person.deathYear}`}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

