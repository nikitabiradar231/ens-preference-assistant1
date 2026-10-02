import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ENS Preference Assistant | Portable User Preference AI',
  description: 'A web-based AI assistant reading validated, portable preference records directly from ENS names on Ethereum Sepolia.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
