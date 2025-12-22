'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { login, selectAuthLoading, selectAuthError } from '@/store/slices/authSlice';
import { Input, Button, Card } from '@/components/ui';
import { useTranslations } from '@/i18n/useTranslations';
import styles from './page.module.scss';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t } = useTranslations();
  const isLoading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    try {
      await dispatch(login({ username, password })).unwrap();
      router.push('/');
    } catch (err) {
      // Error is handled by Redux
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.loginCard}>
        <div className={styles.header}>
          <h1 className={styles.title}>{t('auth.login')}</h1>
          <p className={styles.subtitle}>{t('auth.loginSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t('auth.username')}
            required
            fullWidth
          />

          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('auth.password')}
            required
            fullWidth
          />

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            variant="primary" 
            fullWidth
            disabled={isLoading}
          >
            {isLoading ? t('auth.loggingIn') : t('auth.loginButton')}
          </Button>
        </form>
      </Card>
    </div>
  );
}

