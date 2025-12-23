'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/i18n/useTranslations';
import { Person } from '@/types';
import { personApi } from '@/lib/api';
import RelativesSection from '@/components/RelativesSection/RelativesSection';
import AddRelativeModal from '@/components/AddRelativeModal/AddRelativeModal';
import styles from './RelativeInfo.module.scss';

interface RelativeInfoProps {
  person: Person;
  isAuthenticated: boolean;
  isEditing: boolean;
}

export default function RelativeInfo({ person, isAuthenticated, isEditing }: RelativeInfoProps) {
  const { t } = useTranslations();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalRelationType, setModalRelationType] = useState<'father' | 'mother' | 'spouse' | 'child'>('father');

  const handleAddRelative = (relationType: 'father' | 'mother' | 'spouse' | 'child') => {
    setModalRelationType(relationType);
    setModalOpen(true);
  };

  const handleSelectRelative = async (selectedPerson: any, relationType: string) => {
    try {
      await personApi.addRelative(person.id, selectedPerson.id, relationType as 'father' | 'mother' | 'spouse' | 'child');
      setModalOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error adding relative:', error);
      alert(t('common.error'));
    }
  };

  return (
    <div className={styles.relativeInfo}>
      {/* Parents */}
      <RelativesSection 
        title={t('person.parents')}
        relatives={[person.father, person.mother].filter(Boolean) as Person[]}
        isParentsSection={true}
        isEditing={isEditing}
        isAuthenticated={isAuthenticated}
        onAddRelative={() => handleAddRelative('father')}
      />

      {/* Spouses */}
      <RelativesSection 
        title={t('person.spouses')}
        relatives={person.spouses}
        showMarriageInfo={true}
        isEditing={isEditing}
        isAuthenticated={isAuthenticated}
        onAddRelative={() => handleAddRelative('spouse')}
      />

      {/* Siblings */}
      {person.siblings && person.siblings.length > 0 && (
        <RelativesSection 
          title={`${t('person.siblings')}${person.siblings ? ` (${person.siblings.length})` : ''}`}
          relatives={person.siblings}
          isEditing={false}
          isAuthenticated={isAuthenticated}
        />
      )}

      {/* Children */}
      <RelativesSection 
        title={`${t('person.children')}${person.children ? ` (${person.children.length})` : ''}`}
        relatives={person.children}
        isEditing={isEditing}
        isAuthenticated={isAuthenticated}
        onAddRelative={() => handleAddRelative('child')}
      />

      {/* Add Relative Modal */}
      <AddRelativeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={handleSelectRelative}
        relationType={modalRelationType}
      />
    </div>
  );
}

