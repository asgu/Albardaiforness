'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/i18n/useTranslations';
import { Person, Marriage } from '@/types';
import { personApi } from '@/lib/api';
import { capitalizeWords } from '@/utils/string';
import RelativesSection from '@/components/RelativesSection/RelativesSection';
import AddRelativeModal from '@/components/AddRelativeModal/AddRelativeModal';
import { ConfirmModal } from '@/ui';
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
  const [confirmDelete, setConfirmDelete] = useState<{ relativeId: string; relativeName: string } | null>(null);

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

  const handleRemoveRelativeClick = (relativeId: string, relativeName: string) => {
    setConfirmDelete({ relativeId, relativeName });
  };

  const handleConfirmRemove = async () => {
    if (!confirmDelete) return;
    
    try {
      await personApi.removeRelative(person.id, confirmDelete.relativeId);
      setConfirmDelete(null);
      router.refresh();
    } catch (error) {
      console.error('Error removing relative:', error);
      alert(t('common.error'));
    }
  };

  const handleCancelRemove = () => {
    setConfirmDelete(null);
  };

  // Определяем детей от каждого супруга на основе motherId/fatherId
  const childrenBySpouse = useMemo(() => {
    if (!person.spouses || !person.children) return new Map<string, string[]>();

    const map = new Map<string, string[]>();
    
    // Для каждого ребенка определяем, от какого супруга он
    person.children.forEach(child => {
      // Если текущая персона - мужчина (отец), ищем детей по motherId
      if (person.gender === 'male' && child.motherId) {
        const motherId = child.motherId;
        if (!map.has(motherId)) {
          map.set(motherId, []);
        }
        map.get(motherId)!.push(child.id);
      }
      
      // Если текущая персона - женщина (мать), ищем детей по fatherId
      if (person.gender === 'female' && child.fatherId) {
        const fatherId = child.fatherId;
        if (!map.has(fatherId)) {
          map.set(fatherId, []);
        }
        map.get(fatherId)!.push(child.id);
      }
    });

    return map;
  }, [person.spouses, person.children, person.gender]);

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
        onRemoveRelative={handleRemoveRelativeClick}
      />

      {/* Spouses */}
      <RelativesSection 
        title={t('person.spouses')}
        relatives={person.spouses}
        showMarriageInfo={true}
        isEditing={isEditing}
        isAuthenticated={isAuthenticated}
        onAddRelative={() => handleAddRelative('spouse')}
        onRemoveRelative={handleRemoveRelativeClick}
        onSpouseHover={setHoveredSpouseId}
      />

      {/* Children */}
      <RelativesSection 
        title={`${t('person.children')}${person.children ? ` (${person.children.length})` : ''}`}
        relatives={person.children}
        isEditing={isEditing}
        isAuthenticated={isAuthenticated}
        onAddRelative={() => handleAddRelative('child')}
        onRemoveRelative={handleRemoveRelativeClick}
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

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        title={t('person.removeRelativeTitle')}
        message={t('person.removeRelativeMessage', { 
          name: confirmDelete?.relativeName || '' 
        })}
        confirmText={t('common.remove')}
        cancelText={t('common.cancel')}
        variant="danger"
        onConfirm={handleConfirmRemove}
        onCancel={handleCancelRemove}
      />
    </div>
  );
}

