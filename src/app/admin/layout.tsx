import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AdminHeader from '@/components/AdminHeader';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0B0E14] text-white">
      <Navbar />
      <AdminHeader />
      <div className="flex-1 w-full">{children}</div>
      <Footer />
    </div>
  );
}
