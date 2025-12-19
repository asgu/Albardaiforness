'use client';

import { useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentServer, selectServerInfo } from '@/store/slices/serverSlice';
import Header from '@/components/Header/Header';
import SearchBox from '@/components/SearchBox/SearchBox';
import SplashScreen from '@/components/SplashScreen/SplashScreen';
import styles from './page.module.scss';

export default function Home() {
  const currentServer = useAppSelector(selectCurrentServer);
  const serverInfo = useAppSelector(selectServerInfo);
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    // Проверяем localStorage - показывать ли splash screen
    const splashHidden = localStorage.getItem('splashScreenHidden');
    if (!splashHidden) {
      setShowSplash(true);
    }
  }, []);

  const handleCloseSplash = () => {
    setShowSplash(false);
    localStorage.setItem('splashScreenHidden', 'true');
  };

  return (
    <>
      <Header />
      {showSplash && <SplashScreen onClose={handleCloseSplash} serverInfo={serverInfo} />}
      <main className={styles.main}>
        <SearchBox />
      </main>
    </>
  );
}
