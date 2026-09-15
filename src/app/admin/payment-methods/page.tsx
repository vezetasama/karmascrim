'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import {
  QrCode,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';

export default function AdminPaymentMethodsPage() {
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<any>(null);

  // Form State
  const [name, setName] = useState('Fonepay QR / Direct Merchant');
  const [type, setType] = useState('FONEPAY');
  const [accountName, setAccountName] = useState('KARMA SCRIMS ESPORTS');
  const [accountNumber, setAccountNumber] = useState('9841234567');
  const [merchantDetails, setMerchantDetails] = useState('Fonepay Merchant ID: FONEPAY-KARMA-99');
  const [instructions, setInstructions] = useState('1. Open Mobile Banking or eSewa/Khalti app.\n2. Scan Fonepay QR or transfer to 9841234567.\n3. Enter exact entry fee amount.\n4. Take screenshot & note Transaction ID.');
  const [qrImageUrl, setQrImageUrl] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80');
  const [enabled, setEnabled] = useState(true);

  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    try {
      const res = await fetch('/api/admin/payment-methods');
      const data = await res.json();
      if (data.paymentMethods) {
        setMethods(data.paymentMethods);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedMethod(null);
    setName('Fonepay QR / Merchant');
    setType('FONEPAY');
    setAccountName('KARMA SCRIMS ESPORTS');
    setAccountNumber('9841234567');
    setMerchantDetails('Fonepay Merchant ID: FONEPAY-KARMA-99');
    setInstructions('1. Scan QR code below.\n2. Pay exact entry fee.\n3. Note transaction ID.');
    setQrImageUrl('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80');
    setEnabled(true);
  };

  const handleEdit = (m: any) => {
    setSelectedMethod(m);
    setName(m.name);
    setType(m.type);
    setAccountName(m.accountName);
    setAccountNumber(m.accountNumber);
    setMerchantDetails(m.merchantDetails || '');
    setInstructions(m.instructions || '');
    setQrImageUrl(m.qrImageUrl || '');
    setEnabled(m.enabled);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    const body = {
      id: selectedMethod?.id,
      name,
      type,
      accountName,
      accountNumber,
      merchantDetails,
      instructions,
      qrImageUrl,
      enabled,
    };

    try {
      const method = selectedMethod ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/payment-methods', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        setMsg(selectedMethod ? 'Payment method updated!' : 'Payment method added!');
        setModalOpen(false);
        fetchMethods();
      }
    } catch (e) {
      setMsg('Failed to save payment method');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;
    try {
      const res = await fetch(`/api/admin/payment-methods?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMsg('Payment method deleted.');
        fetchMethods();
      }
    } catch (e) {
      setMsg('Failed to delete payment method');
    }
  };

  const handleToggleEnabled = async (m: any) => {
    try {
      await fetch('/api/admin/payment-methods', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: m.id, enabled: !m.enabled }),
      });
      fetchMethods();
    } catch (e) {}
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0E14] text-white">
      <Navbar />

      <main className="flex-1 py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <Link href="/admin" className="text-xs text-gray-400 hover:text-white flex items-center gap-1 mb-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin Overview
            </Link>
            <h1 className="text-2xl font-black uppercase text-white">Fonepay & Payment Method Settings</h1>
            <p className="text-xs text-gray-400">Configure Fonepay QR code, merchant account details, and payment instructions</p>
          </div>

          <button
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl glow-btn-red text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Payment Method</span>
          </button>
        </div>

        {msg && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 text-xs flex items-center justify-between">
            <span>{msg}</span>
            <button onClick={() => setMsg(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Methods Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {methods.map((m) => (
            <div key={m.id} className="p-6 rounded-3xl bg-[#121722] border border-[#262F45] space-y-4">
              
              <div className="flex items-center justify-between border-b border-[#262F45] pb-3">
                <div className="flex items-center gap-2">
                  <QrCode className="w-6 h-6 text-[#FF9F1C]" />
                  <div>
                    <h3 className="text-base font-bold text-white">{m.name}</h3>
                    <span className="text-[10px] text-gray-400 font-mono">Type: {m.type}</span>
                  </div>
                </div>
                
                {/* Active Switch */}
                <button
                  onClick={() => handleToggleEnabled(m)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                    m.enabled
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-gray-800 text-gray-500 border-gray-700'
                  }`}
                >
                  {m.enabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {/* QR Image & Account details */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {m.qrImageUrl && (
                  <img
                    src={m.qrImageUrl}
                    alt={m.name}
                    className="w-32 h-32 rounded-xl object-cover border border-[#262F45]"
                  />
                )}
                <div className="text-xs space-y-1.5 flex-1">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase">Account Name</span>
                    <div className="font-bold text-white text-sm">{m.accountName}</div>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase">Account / Merchant Phone</span>
                    <div className="font-mono text-[#FF9F1C] font-extrabold text-sm">{m.accountNumber}</div>
                  </div>
                  {m.merchantDetails && (
                    <div className="text-[11px] text-gray-300 font-mono">{m.merchantDetails}</div>
                  )}
                </div>
              </div>

              {/* Instructions */}
              <div className="p-3 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-gray-300 whitespace-pre-line leading-relaxed font-sans">
                <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">User Payment Instructions:</span>
                {m.instructions}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => handleEdit(m)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs font-bold text-gray-300 hover:text-white flex items-center gap-1"
                >
                  <Edit className="w-3.5 h-3.5 text-[#FF2E4C]" /> Edit Details
                </button>
                <button
                  onClick={() => handleDelete(m.id)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#0B0E14] border border-red-500/40 text-xs font-bold text-red-400 hover:bg-red-950/30 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>

            </div>
          ))}
        </div>

        {/* MODAL FORM */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <div className="bg-[#121722] border border-[#262F45] w-full max-w-xl rounded-3xl p-6 shadow-2xl relative my-8">
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-[#0B0E14] text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-base font-bold text-white uppercase mb-4">
                {selectedMethod ? 'Edit Payment Method' : 'Add Payment Method'}
              </h2>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Display Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Fonepay QR / Direct Merchant"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">Account Name *</label>
                    <input
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="KARMA SCRIMS ESPORTS"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">Account / Merchant Phone *</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="9841234567"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Merchant Details / Code</label>
                  <input
                    type="text"
                    value={merchantDetails}
                    onChange={(e) => setMerchantDetails(e.target.value)}
                    placeholder="Fonepay Merchant Code: FONEPAY-KARMA-99"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">QR Code Image URL</label>
                  <input
                    type="text"
                    value={qrImageUrl}
                    onChange={(e) => setQrImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Payment Instructions</label>
                  <textarea
                    rows={4}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-[#0B0E14] text-gray-400 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-6 py-2 rounded-xl glow-btn-red text-white text-xs font-bold uppercase"
                  >
                    {actionLoading ? 'Saving...' : 'Save Payment Method'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
