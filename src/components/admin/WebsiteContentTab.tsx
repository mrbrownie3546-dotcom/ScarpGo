import React, { useState } from 'react';
import { useScrap } from '../../context/ScrapContext';
import { WebsiteContentItem } from '../../types/scrapgo';
import {
  FileText,
  Edit2,
  CheckCircle2,
  Plus,
  HelpCircle,
  Megaphone,
  Info,
  Phone,
  Layout,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

export const WebsiteContentTab: React.FC = () => {
  const { websiteContent, updateWebsiteContent, canPerform, currentAdmin } = useScrap();

  const [activeSection, setActiveSection] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<WebsiteContentItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const canEditContent = canPerform('manage_content', 'content').allowed;

  const filteredContent = websiteContent.filter(
    (item) => activeSection === 'all' || item.section === activeSection
  );

  const handleStartEdit = (item: WebsiteContentItem) => {
    if (!canEditContent) {
      setFeedback('Permission Denied: Only CONTENT_ADMIN and MAIN_ADMIN can edit website texts and banners.');
      setTimeout(() => setFeedback(null), 4000);
      return;
    }
    setEditingItem(item);
    setEditTitle(item.title);
    setEditSubtitle(item.subtitle || '');
    setEditBody(item.body || '');
    setEditActive(item.is_active);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    updateWebsiteContent(editingItem.id, {
      title: editTitle,
      subtitle: editSubtitle,
      body: editBody,
      is_active: editActive,
    });

    setEditingItem(null);
    setFeedback(`Content "${editTitle}" updated successfully!`);
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <FileText className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-black tracking-tight">Website Public Content & Banners</h2>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-600 text-white">
              Content Admin Portal
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Content Admins can manage public homepage copy, About Us, FAQs, informational banners, and category explanations.
            Content updates take effect immediately on the live app.
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl text-xs space-y-1">
          <div className="flex items-center justify-between gap-4 text-slate-400">
            <span>Editor Status:</span>
            <strong className={canEditContent ? 'text-emerald-400' : 'text-rose-400'}>
              {canEditContent ? 'AUTHORIZED' : 'READ-ONLY / BLOCKED'}
            </strong>
          </div>
          <div className="text-[10px] text-slate-400">
            Current: <strong>{currentAdmin.name}</strong> ({currentAdmin.adminRole})
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl text-xs font-bold bg-purple-50 text-purple-900 border border-purple-200 flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-xs opacity-70 hover:opacity-100">Dismiss</button>
        </div>
      )}

      {/* Sections filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
        {[
          { key: 'all', label: 'All Sections' },
          { key: 'banner', label: 'Announcement Banners' },
          { key: 'hero', label: 'Hero Section' },
          { key: 'how_it_works', label: 'How It Works' },
          { key: 'faq', label: 'Frequently Asked Questions' },
          { key: 'about', label: 'About ScrapHouse' },
          { key: 'contact', label: 'Contact Details' },
        ].map((sec) => (
          <button
            key={sec.key}
            onClick={() => setActiveSection(sec.key)}
            className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-colors ${
              activeSection === sec.key
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {/* Content items list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredContent.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  {item.section} • Order #{item.display_order}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 ${
                    item.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {item.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  <span>{item.is_active ? 'Visible' : 'Hidden'}</span>
                </span>
              </div>

              <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
              {item.subtitle && <p className="text-xs font-semibold text-slate-600 mt-0.5">{item.subtitle}</p>}
              {item.body && <p className="text-xs text-slate-500 mt-2 leading-relaxed">{item.body}</p>}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-400">
                Last modified: {new Date(item.updated_at).toLocaleDateString()} by {item.updated_by || 'Admin'}
              </span>

              <button
                type="button"
                disabled={!canEditContent}
                onClick={() => handleStartEdit(item)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors flex items-center gap-1.5 ${
                  !canEditContent
                    ? 'opacity-40 cursor-not-allowed text-slate-400 bg-slate-100'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                }`}
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Content</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Content Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">Edit Website Content</h3>
                <span className="text-xs text-slate-400">Section: <strong>{editingItem.section}</strong></span>
              </div>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-700 p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Headline / Question Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subtitle / Badge (Optional)</label>
                <input
                  type="text"
                  value={editSubtitle}
                  onChange={(e) => setEditSubtitle(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Body Text / Answer Explanation</label>
                <textarea
                  rows={4}
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activeToggle"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                />
                <label htmlFor="activeToggle" className="font-bold text-slate-700 cursor-pointer">
                  Publish & Make Visible on Website
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-xs transition-colors"
                >
                  Save & Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
