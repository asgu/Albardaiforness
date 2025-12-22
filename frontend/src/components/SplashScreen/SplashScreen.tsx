'use client';

import { Server } from '@/types';
import { Card, Button } from '@/ui';
import { useTranslations } from '@/i18n/useTranslations';
import styles from './SplashScreen.module.scss';

interface SplashScreenProps {
  onClose: () => void;
  serverInfo: Server | undefined;
}

export default function SplashScreen({ onClose, serverInfo }: SplashScreenProps) {
  const { t } = useTranslations();
  
  return (
    <div className={styles.splashOverlay} onClick={onClose}>
      <Card className={styles.splashScreen} onClick={(e) => e.stopPropagation()}>
        <div className={styles.splashRow} style={{ height: '40%' }}>
          <div className={styles.savorgnani}>
            <h2>{t('splash.title')}</h2>
            <div className={styles.emblem}>
              <span className={styles.emblemIcon}>⚜</span>
            </div>
            <h2 className={styles.years}>{t('splash.years')}</h2>
          </div>
        </div>
        
        <div className={styles.splashRow} style={{ height: '60%' }}>
          <div className={`${styles.forni} ${styles.diSopra}`}>
            <div className={styles.wrapper}>
              <div className={styles.pennant}></div>
              <h2>{t('splash.fornidiSopra')}</h2>
            </div>
          </div>
          <div className={`${styles.forni} ${styles.diSotto}`}>
            <div className={styles.wrapper}>
              <div className={styles.pennant}></div>
              <h2>{t('splash.fornidiSotto')}</h2>
            </div>
          </div>
        </div>

        <div className={styles.disclaimer}>
          <p>{t('splash.disclaimer')}</p>
        </div>

        <div className={styles.actions}>
          <Button onClick={onClose} variant="primary" fullWidth>
            {t('splash.enter')}
          </Button>
        </div>
      </Card>
    </div>
  );
}

