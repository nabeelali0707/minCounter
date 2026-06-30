import './globals.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MathMatrix | Autonomous Research Portal',
  description: 'Distributed proving network and minimal counterexample leaderboard.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&family=Inter:wght@100..900&family=JetBrains+Mono:wght@100..800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body-md text-body-md selection:bg-secondary/30 selection:text-secondary antialiased">
        {children}
      </body>
    </html>
  );
}
