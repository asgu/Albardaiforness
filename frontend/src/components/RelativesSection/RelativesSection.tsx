'use client';

import { Person, Marriage } from '@/types';
import { Button } from '@/ui';
import RelativeCard from '@/components/RelativeCard/RelativeCard';
import styles from './RelativesSection.module.scss';

interface RelativesSectionProps {
  title: string;
  relatives?: Person[] | Marriage[];
  showMarriageInfo?: boolean;
  isParentsSection?: boolean;
  isEditing?: boolean;
  isAuthenticated?: boolean;
  onAddRelative?: () => void;
  onSpouseHover?: (spouseId: string | null) => void;
  highlightedIds?: string[];
}

export default function RelativesSection({ 
  title, 
  relatives,
  showMarriageInfo = false,
  isParentsSection = false,
  isEditing = false,
  isAuthenticated = false,
  onAddRelative,
  onSpouseHover,
  highlightedIds = []
}: RelativesSectionProps) {
  const hasRelatives = relatives && relatives.length > 0;

  // Don't show empty sections when not editing
  if (!hasRelatives && !isEditing) {
    return null;
  }

  const isMarriageArray = hasRelatives && relatives!.length > 0 && 'person' in relatives![0];

  // Special handling for parents section
  if (isParentsSection && !isMarriageArray) {
    const persons = (relatives as Person[]) || [];
    const father = persons.find(p => p.gender === 'male');
    const mother = persons.find(p => p.gender === 'female');

    // Don't show empty parents section when not editing
    if (!father && !mother && !isEditing) {
      return null;
    }

    return (
      <div className={styles.relativeSection}>
        <div className={styles.sectionHeader}>
          <h2>{title}</h2>
          {isEditing && onAddRelative && (
            <Button variant="secondary" onClick={onAddRelative}>
              + Aggiungi
            </Button>
          )}
        </div>
        <div className={`${styles.relatives} ${styles.parentsGrid}`}>
          <div className={styles.fatherSlot}>
            {father && (
              <RelativeCard 
                key={father.id}
                person={father}
                isAuthenticated={isAuthenticated}
              />
            )}
          </div>
          <div className={styles.motherSlot}>
            {mother && (
              <RelativeCard 
                key={mother.id}
                person={mother}
                isAuthenticated={isAuthenticated}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.relativeSection}>
      <div className={styles.sectionHeader}>
        <h2>{title}</h2>
        {isEditing && onAddRelative && (
          <Button variant="secondary" onClick={onAddRelative}>
            + Aggiungi
          </Button>
        )}
      </div>
      <div className={styles.relatives}>
        {hasRelatives && (
          <>
            {isMarriageArray ? (
              // Marriages with spouse info
              (relatives as { person: Person; marriageYear?: number; marriageDate?: string }[]).map((item, index) => (
                <RelativeCard 
                  key={index}
                  person={item.person}
                  marriageYear={item.marriageYear}
                  marriageDate={item.marriageDate}
                  showMarriageInfo={showMarriageInfo}
                  isAuthenticated={isAuthenticated}
                  onMouseEnter={() => onSpouseHover?.(item.person.id)}
                  onMouseLeave={() => onSpouseHover?.(null)}
                />
              ))
            ) : (
              // Regular persons
              (relatives as Person[]).map((person) => (
                <RelativeCard 
                  key={person.id}
                  person={person}
                  isAuthenticated={isAuthenticated}
                  isHighlighted={highlightedIds.includes(person.id)}
                />
              ))
            )}
          </>
        )}
        {!hasRelatives && isEditing && (
          <div className={styles.emptyState}>
            Nessun parente aggiunto
          </div>
        )}
      </div>
    </div>
  );
}

