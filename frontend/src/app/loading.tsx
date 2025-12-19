import Header from '@/components/Header/Header';
import { Loader } from '@/components/ui';

export default function Loading() {
  return (
    <>
      <Header />
      <Loader text="Caricamento..." fullScreen />
    </>
  );
}

