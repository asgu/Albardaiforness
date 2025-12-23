import { notFound } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';
import Header from '@/components/Header/Header';
import FamilyTree from '@/components/FamilyTree/FamilyTree';
import { Person } from '@/types';
import styles from './page.module.scss';

// Делаем страницу полностью динамической (не кешируем)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getPerson(id: string, host?: string): Promise<Person | null> {
  // Отключаем кеширование на уровне Next.js
  noStore();
  
  try {
    const apiUrl = process.env.NODE_ENV === 'production'
      ? 'http://localhost:3300'
      : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3300');
    
    const headers: HeadersInit = {};
    
    // Передаем кастомный заголовок для определения сервера в API
    // (заголовок Host не работает с Node.js fetch)
    if (host) {
      headers['X-Server-Host'] = host;
    }
    
    const response = await fetch(`${apiUrl}/api/person/${id}`, {
      cache: 'no-store', // Не кешируем
      headers,
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching person:', error);
    return null;
  }
}

export default async function TreePage({ params }: { params: { id: string } }) {
  // Получаем host из headers (Next.js 15+)
  const { headers } = await import('next/headers');
  const headersList = headers();
  const host = headersList.get('host') || undefined;
  
  const person = await getPerson(params.id, host);

  if (!person) {
    notFound();
  }

  return (
    <>
      <Header />
      <main className={styles.main}>
        <FamilyTree person={person} />
      </main>
    </>
  );
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  // Получаем host из headers
  const { headers } = await import('next/headers');
  const headersList = headers();
  const host = headersList.get('host') || undefined;
  
  const person = await getPerson(params.id, host);

  if (!person) {
    return {
      title: 'Albero genealogico - Albero',
    };
  }

  return {
    title: `Albero genealogico - ${person.firstName} ${person.lastName}`,
    description: `Visualizza l'albero genealogico di ${person.firstName} ${person.lastName}`,
  };
}

