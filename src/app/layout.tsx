import type { Metadata } from 'next';
import Script from 'next/script';
import MobileBottomNav from '@/components/MobileBottomNav';
import { UserProvider } from '@/context/UserContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'Karma Scrims — Free Fire Esports Tournament Platform Nepal',
  description:
    'Compete in daily Free Fire Full Map Squad Scrims and Clash Squad duels. Fonepay verified payments, instant room release, real-time leaderboards, and guaranteed prize payouts.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        {/* PushAlert Unified Code */}
        <Script
          src="https://cdn.pushalert.co/unified_76773fc185ec5b697df65486a3168cd3.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="font-sans bg-[#0B0E14] text-gray-100 antialiased pb-16 md:pb-0">
        <UserProvider>
          {children}
          <MobileBottomNav />
        </UserProvider>
      </body>
    </html>
  );
}
