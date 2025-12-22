'use client';

import Loader from '@/ui/Loader/Loader';
import { useTranslations } from '@/i18n/useTranslations';

export default function Loading() {
  const { t } = useTranslations();
  return <Loader text={t('common.loading')} fullScreen />;
}

