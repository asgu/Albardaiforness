'use client';

import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { selectIsAuthenticated } from '@/store/slices/authSlice';
import Header from '@/components/Header/Header';
import PersonForm from '@/components/PersonForm/PersonForm';

export default function NewPersonPage() {
  const router = useRouter();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  // Redirect if not authenticated
  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  return (
    <>
      <Header />
      <PersonForm mode="create" />
    </>
  );
}

