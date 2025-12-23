'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/i18n/useTranslations';
import { Person, Marriage } from '@/types';
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
  const [hoveredSpouseId, setHoveredSpouseId] = useState<string | null>(null);

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

  // Определяем детей от каждой жены на основе дат браков
  const childrenBySpouse = useMemo(() => {
    if (!person.spouses || !person.children) return new Map<string, string[]>();

    const map = new Map<string, string[]>();
    
    // Сортируем браки по дате
    const sortedMarriages = [...person.spouses].sort((a, b) => {
      const yearA = a.marriageYear || 0;
      const yearB = b.marriageYear || 0;
      return yearA - yearB;
    });

    // Для каждого ребенка определяем, от какого брака он
    person.children.forEach(child => {
      if (!child.birthYear) return;

      // Находим брак, в период которого родился ребенок
      for (let i = 0; i < sortedMarriages.length; i++) {
        const marriage = sortedMarriages[i];
        const nextMarriage = sortedMarriages[i + 1];
        
        const marriageStart = marriage.marriageYear || 0;
        const marriageEnd = marriage.divorceYear || (nextMarriage?.marriageYear || Infinity);

        // Ребенок родился в период этого брака
        if (child.birthYear >= marriageStart && child.birthYear < marriageEnd) {
          const spouseId = marriage.person?.id;
          if (spouseId) {
            if (!map.has(spouseId)) {
              map.set(spouseId, []);
            }
            map.get(spouseId)!.push(child.id);
          }
          break;
        }
      }

      // Если не нашли подходящий брак, проверяем последний брак
      if (sortedMarriages.length > 0) {
        const lastMarriage = sortedMarriages[sortedMarriages.length - 1];
        const lastMarriageStart = lastMarriage.marriageYear || 0;
        
        if (child.birthYear >= lastMarriageStart) {
          const spouseId = lastMarriage.person?.id;
          if (spouseId) {
            if (!map.has(spouseId)) {
              map.set(spouseId, []);
            }
            // Проверяем, не добавили ли уже этого ребенка
            if (!map.get(spouseId)!.includes(child.id)) {
              map.get(spouseId)!.push(child.id);
            }
          }
        }
      }
    });

    return map;
  }, [person.spouses, person.children]);

  // Получаем список ID детей для подсветки
  const highlightedChildrenIds = hoveredSpouseId ? (childrenBySpouse.get(hoveredSpouseId) || []) : [];

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
        onSpouseHover={setHoveredSpouseId}
      />

      {/* Children */}
      <RelativesSection 
        title={`${t('person.children')}${person.children ? ` (${person.children.length})` : ''}`}
        relatives={person.children}
        isEditing={isEditing}
        isAuthenticated={isAuthenticated}
        onAddRelative={() => handleAddRelative('child')}
        highlightedIds={highlightedChildrenIds}
      />

      {/* Siblings */}
      {person.siblings !== undefined && (
        <RelativesSection 
          title={`${t('person.siblings')}${person.siblings && person.siblings.length > 0 ? ` (${person.siblings.length})` : ''}`}
          relatives={person.siblings}
          isEditing={false}
          isAuthenticated={isAuthenticated}
        />
      )}

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

