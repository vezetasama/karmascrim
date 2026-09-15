'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit3,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
  Upload,
  Link as LinkIcon,
  Eye,
  Loader2,
  Sparkles,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import { BannerItem } from '@/components/HeroSlider';

// Preset gaming / esports banner suggestions for instant use
const PRESET_BANNERS = [
  {
    name: 'Free Fire Fire & Ice Arena',
    url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&q=80',
  },
  {
    name: 'Esports Championship Stadium',
    url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1600&q=80',
  },
  {
    name: 'Cyber Neon Gaming Setup',
    url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1600&q=80',
  },
  {
    name: 'Tactical Battle Royale Night',
    url: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=1600&q=80',
  },
  {
    name: 'Futuristic Tournament Stage',
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1600&q=80',
  },
];

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    buttonText: '',
    buttonLink: '',
    imageUrl: '',
    isActive: true,
    sortOrder: 0,
  });

  // Upload State
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/banners');
      if (!res.ok) throw new Error('Failed to fetch banners.');
      const data = await res.json();
      setBanners(data.banners || []);
    } catch (err: any) {
      setError(err.message || 'Error loading banners');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingBanner(null);
    setFormData({
      title: 'NEPAL\'S ULTIMATE FREE FIRE SCRIMS',
      subtitle: 'Compete in Daily Full Map & Clash Squad Scrims. Win Cash Prizes!',
      buttonText: 'JOIN SCRIMS NOW',
      buttonLink: '/tournaments',
      imageUrl: PRESET_BANNERS[0].url,
      isActive: true,
      sortOrder: banners.length + 1,
    });
    setUploadError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (banner: BannerItem) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      buttonText: banner.buttonText || '',
      buttonLink: banner.buttonLink || '',
      imageUrl: banner.imageUrl || '',
      isActive: banner.isActive,
      sortOrder: banner.sortOrder,
    });
    setUploadError('');
    setIsModalOpen(true);
  };

  // Image Upload File Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB.');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const res = await fetch('/api/admin/banners/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setFormData((prev) => ({ ...prev, imageUrl: data.imageUrl }));
      setSuccessMsg('Image uploaded successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  // Save / Update Banner
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imageUrl.trim()) {
      setUploadError('Banner image is required.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const url = editingBanner
        ? `/api/admin/banners/${editingBanner.id}`
        : '/api/admin/banners';
      const method = editingBanner ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save banner.');

      setSuccessMsg(editingBanner ? 'Banner updated successfully!' : 'New banner added successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
      setIsModalOpen(false);
      fetchBanners();
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Active Status
  const handleToggleActive = async (banner: BannerItem) => {
    try {
      const res = await fetch(`/api/admin/banners/${banner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !banner.isActive }),
      });
      if (!res.ok) throw new Error('Failed to toggle status');
      fetchBanners();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Move Order
  const handleMoveOrder = async (banner: BannerItem, direction: 'up' | 'down') => {
    const sorted = [...banners].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = sorted.findIndex((b) => b.id === banner.id);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const targetBanner = sorted[targetIndex];

    try {
      // Swap order
      await Promise.all([
        fetch(`/api/admin/banners/${banner.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortOrder: targetBanner.sortOrder }),
        }),
        fetch(`/api/admin/banners/${targetBanner.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortOrder: banner.sortOrder }),
        }),
      ]);
      fetchBanners();
    } catch (err: any) {
      console.error(err);
    }
  };

  // Delete Banner
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    try {
      const res = await fetch(`/api/admin/banners/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete banner');
      setSuccessMsg('Banner deleted successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchBanners();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0E14] text-white">
      <Navbar />

      <main className="flex-1 py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/admin"
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Admin Command Center</span>
              </Link>
              <span className="text-gray-600">/</span>
              <span className="text-xs text-[#FF2E4C] font-bold uppercase">Homepage Banner Slider</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wide flex items-center gap-2">
              <ImageIcon className="w-7 h-7 text-[#FF2E4C]" />
              Homepage Banner & Hero Slider
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Manage the single-image hero banner displayed at the top of the Karma Scrims homepage.
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#FF2E4C] text-white font-extrabold text-xs uppercase tracking-wider hover:bg-[#D61F3B] shadow-lg shadow-[#FF2E4C]/30 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Banner</span>
          </button>
        </div>

        {/* Global Toast / Messages */}
        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs font-semibold flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Info Banner box */}
        <div className="p-5 rounded-2xl bg-[#121722] border border-[#262F45] mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FF9F1C]" />
              Single-Image Hero Banner Display
            </h3>
            <p className="text-xs text-gray-400">
              When <strong>1 banner</strong> is active, it renders cleanly as a static hero banner without carousel arrows or dots.
              If <strong>multiple banners</strong> are active, auto-rotation and slide navigation will automatically activate.
            </p>
          </div>
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs font-bold text-gray-300 hover:text-white hover:border-[#FF2E4C] transition-all"
          >
            <Eye className="w-3.5 h-3.5 text-[#FF2E4C]" />
            <span>Preview Homepage</span>
            <ExternalLink className="w-3 h-3 text-gray-500 ml-0.5" />
          </Link>
        </div>

        {/* BANNER LIST TABLE */}
        {loading ? (
          <div className="p-16 text-center bg-[#121722] rounded-3xl border border-[#262F45]">
            <Loader2 className="w-8 h-8 text-[#FF2E4C] animate-spin mx-auto mb-3" />
            <p className="text-xs text-gray-400">Loading banner items from database...</p>
          </div>
        ) : banners.length === 0 ? (
          <div className="p-12 text-center bg-[#121722] rounded-3xl border border-[#262F45] space-y-3">
            <ImageIcon className="w-12 h-12 text-gray-600 mx-auto" />
            <h3 className="text-base font-bold text-gray-300">No Banners Configured Yet</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Add a custom banner image to highlight tournaments, registration announcements, or brand updates.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF2E4C] text-white text-xs font-bold uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Banner</span>
            </button>
          </div>
        ) : (
          <div className="bg-[#121722] rounded-3xl border border-[#262F45] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-[#0B0E14] text-[#FF9F1C] uppercase text-[10px] font-bold border-b border-[#262F45]">
                  <tr>
                    <th className="p-4 text-center">Order</th>
                    <th className="p-4">Banner Preview</th>
                    <th className="p-4">Title & Subtitle</th>
                    <th className="p-4">Button Action</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262F45]">
                  {banners
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((banner, index) => (
                      <tr key={banner.id} className="hover:bg-[#1A2234] transition-colors">
                        
                        {/* Order Column */}
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className="font-mono font-bold text-white text-sm mr-1">
                              #{banner.sortOrder}
                            </span>
                            <div className="flex flex-col gap-0.5">
                              <button
                                disabled={index === 0}
                                onClick={() => handleMoveOrder(banner, 'up')}
                                className="p-1 rounded bg-[#0B0E14] hover:bg-[#FF2E4C] text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:bg-[#0B0E14] disabled:hover:text-gray-400"
                                title="Move Up"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                disabled={index === banners.length - 1}
                                onClick={() => handleMoveOrder(banner, 'down')}
                                className="p-1 rounded bg-[#0B0E14] hover:bg-[#FF2E4C] text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:bg-[#0B0E14] disabled:hover:text-gray-400"
                                title="Move Down"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Image Preview */}
                        <td className="p-4">
                          <div className="w-36 h-20 rounded-xl overflow-hidden bg-black border border-[#262F45] relative group">
                            <img
                              src={banner.imageUrl}
                              alt={banner.title || 'Banner'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </td>

                        {/* Title & Subtitle */}
                        <td className="p-4">
                          <div className="font-bold text-white text-sm line-clamp-1">
                            {banner.title || <span className="text-gray-500 italic">No Title</span>}
                          </div>
                          <div className="text-[11px] text-gray-400 line-clamp-2 mt-0.5">
                            {banner.subtitle || <span className="text-gray-600">No Subtitle</span>}
                          </div>
                        </td>

                        {/* Button Link */}
                        <td className="p-4">
                          {banner.buttonText ? (
                            <div>
                              <span className="px-2.5 py-1 rounded-lg bg-[#FF2E4C]/20 border border-[#FF2E4C]/40 text-[#FF2E4C] font-bold text-[10px] uppercase">
                                {banner.buttonText}
                              </span>
                              <div className="text-[10px] font-mono text-gray-400 mt-1 flex items-center gap-1">
                                <LinkIcon className="w-3 h-3 text-gray-500" />
                                {banner.buttonLink || '/'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-600 text-[11px]">No Button</span>
                          )}
                        </td>

                        {/* Status Toggle */}
                        <td className="p-4">
                          <button
                            onClick={() => handleToggleActive(banner)}
                            className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border flex items-center gap-1.5 transition-all ${
                              banner.isActive
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                                : 'bg-gray-800/60 text-gray-400 border-gray-700 hover:bg-gray-700'
                            }`}
                          >
                            {banner.isActive ? (
                              <>
                                <CheckCircle className="w-3 h-3 text-emerald-400" />
                                <span>Active</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 text-gray-500" />
                                <span>Disabled</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditModal(banner)}
                              className="p-2 rounded-xl bg-[#0B0E14] border border-[#262F45] text-gray-300 hover:text-white hover:border-[#FF9F1C] transition-colors"
                              title="Edit Banner"
                            >
                              <Edit3 className="w-4 h-4 text-[#FF9F1C]" />
                            </button>

                            <button
                              onClick={() => handleDelete(banner.id)}
                              className="p-2 rounded-xl bg-[#0B0E14] border border-[#262F45] text-gray-300 hover:text-red-400 hover:border-red-500/60 transition-colors"
                              title="Delete Banner"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL: ADD / EDIT BANNER */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <div className="bg-[#121722] border border-[#262F45] w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8">
              
              <div className="flex items-center justify-between border-b border-[#262F45] pb-4">
                <h2 className="text-xl font-bold uppercase text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-[#FF2E4C]" />
                  <span>{editingBanner ? 'Edit Homepage Banner' : 'Add New Homepage Banner'}</span>
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-white text-sm p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* 1. Image Preview & Upload Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                    Banner Image (Required)
                  </label>

                  {/* Live Banner Preview Box */}
                  <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-black border border-[#262F45] group">
                    {formData.imageUrl ? (
                      <>
                        <img
                          src={formData.imageUrl}
                          alt="Banner Preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                          <span className="text-[11px] text-emerald-400 font-bold bg-black/60 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                            ✓ Image Preview Ready
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2">
                        <ImageIcon className="w-8 h-8" />
                        <span className="text-xs">No image selected</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    
                    {/* Device Upload Input */}
                    <div>
                      <label className="text-[11px] font-semibold text-gray-400 block mb-1">
                        Upload from Device
                      </label>
                      <label className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#0B0E14] border border-[#262F45] hover:border-[#FF2E4C] cursor-pointer text-xs font-bold text-gray-300 transition-colors">
                        {uploading ? (
                          <Loader2 className="w-4 h-4 text-[#FF2E4C] animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 text-[#FF2E4C]" />
                        )}
                        <span>{uploading ? 'Uploading...' : 'Choose Image File'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Direct Image URL input */}
                    <div>
                      <label className="text-[11px] font-semibold text-gray-400 block mb-1">
                        Or Paste Image URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#FF2E4C]"
                      />
                    </div>
                  </div>

                  {uploadError && (
                    <p className="text-[11px] text-red-400 font-semibold mt-1">{uploadError}</p>
                  )}

                  {/* Preset Banner Selector */}
                  <div className="pt-2">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1.5">
                      Or Pick a Preset Gaming Banner:
                    </span>
                    <div className="grid grid-cols-5 gap-2">
                      {PRESET_BANNERS.map((preset, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setFormData({ ...formData, imageUrl: preset.url })}
                          className={`h-12 rounded-xl overflow-hidden border-2 transition-all relative ${
                            formData.imageUrl === preset.url
                              ? 'border-[#FF2E4C] ring-2 ring-[#FF2E4C]/50'
                              : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                          title={preset.name}
                        >
                          <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Banner Title & Subtitle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1">
                      Banner Title (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. NEPAL'S ULTIMATE FREE FIRE SCRIMS"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full p-3 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#FF2E4C]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1">
                      Subtitle / Tagline (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Daily Full Map & Clash Squad Battles"
                      value={formData.subtitle}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      className="w-full p-3 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#FF2E4C]"
                    />
                  </div>
                </div>

                {/* 3. Button Text & Link */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1">
                      Button Text (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. JOIN SCRIMS NOW"
                      value={formData.buttonText}
                      onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                      className="w-full p-3 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#FF2E4C]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1">
                      Button URL Link (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. /tournaments or /register"
                      value={formData.buttonLink}
                      onChange={(e) => setFormData({ ...formData, buttonLink: e.target.value })}
                      className="w-full p-3 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#FF2E4C]"
                    />
                  </div>
                </div>

                {/* 4. Active Status & Display Order */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#262F45]">
                  <div>
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1">
                      Display Order Priority
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                      className="w-full p-3 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white focus:outline-none focus:border-[#FF2E4C]"
                    />
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4 accent-[#FF2E4C] rounded"
                      />
                      <span className="text-xs font-bold text-white uppercase">
                        Enable Banner on Homepage
                      </span>
                    </label>
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#262F45]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs font-bold text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-[#FF2E4C] text-white text-xs font-extrabold uppercase tracking-wider hover:bg-[#D61F3B] disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingBanner ? 'Save Changes' : 'Publish Banner'}</span>
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
