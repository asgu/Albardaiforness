import type { Metadata } from 'next';
import './globals.scss';
import { ReduxProvider } from '@/components/providers/ReduxProvider';

export const metadata: Metadata = {
  title: 'Albero - Family Tree',
  description: 'Генеалогическое древо семьи',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        <ReduxProvider>
          {children}
        </ReduxProvider>
      </body>
    </html>
  );
}

