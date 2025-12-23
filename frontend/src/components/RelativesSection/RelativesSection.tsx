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
  onRemoveRelative?: (personId: string, personName: string) => void;
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
  onRemoveRelative,
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

    const parentsCount = (father ? 1 : 0) + (mother ? 1 : 0);
    const canAddParent = parentsCount < 2;

    return (
      <div className={styles.relativeSection}>
        <div className={styles.sectionHeader}>
          <h2>{title}</h2>
          {isEditing && onAddRelative && canAddParent && (
            <Button variant="secondary" onClick={onAddRelative} className={styles.compactButton}>
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
                isEditing={isEditing}
                onRemove={onRemoveRelative}
              />
            )}
          </div>
          <div className={styles.motherSlot}>
            {mother && (
              <RelativeCard 
                key={mother.id}
                person={mother}
                isAuthenticated={isAuthenticated}
                isEditing={isEditing}
                onRemove={onRemoveRelative}
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
          <Button variant="secondary" onClick={onAddRelative} className={styles.compactButton}>
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
                  isEditing={isEditing}
                  onRemove={onRemoveRelative}
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
                  isEditing={isEditing}
                  onRemove={onRemoveRelative}
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

