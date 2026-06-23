// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CHMS - Sistema de Gestão de Saúde Ocupacional',
  description: 'Sistema de Gestão de Saúde Ocupacional',
  // 🔥 ADICIONE ISSO:
  icons: {
    icon: '/favicon.ico',
    // Se for PNG:
    // icon: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
        />
        {/* 🔥 ADICIONE ISSO TAMBÉM (opcional, como fallback): */}
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
