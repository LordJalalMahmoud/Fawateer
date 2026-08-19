'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserPlus, 
  ShieldCheck, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Mail,
  Users
} from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';

interface TeamManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_ADMINS = ['jalalmahmoud8000@gmail.com'];

export function TeamManagementModal({ isOpen, onClose }: TeamManagementModalProps) {
  const { user } = useAuth();
  const [adminEmails, setAdminEmails] = useState<string[]>(DEFAULT_ADMINS);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load authorized emails from Firestore
  useEffect(() => {
    if (!isOpen) return;

    async function loadAdmins() {
      setLoading(true);
      try {
        const docRef = doc(db, 'system', 'authorized_admins');
        const snap = await getDoc(docRef);
        if (snap.exists() && Array.isArray(snap.data()?.emails)) {
          const emails = snap.data().emails;
          if (!emails.includes('jalalmahmoud8000@gmail.com')) {
            emails.push('jalalmahmoud8000@gmail.com');
          }
          setAdminEmails(emails);
        } else {
          // Initialize in Firestore
          await setDoc(docRef, { emails: DEFAULT_ADMINS, updatedAt: new Date().toISOString() });
          setAdminEmails(DEFAULT_ADMINS);
        }
      } catch (err: any) {
        console.warn('Error loading admins from Firestore:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAdmins();
  }, [isOpen]);

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = newEmail.trim().toLowerCase();
    if (!formatted) return;

    if (!formatted.includes('@') || !formatted.includes('.')) {
      setStatusMessage({ type: 'error', text: 'يرجى إدخال بريد إلكتروني صحيح' });
      return;
    }

    if (adminEmails.includes(formatted)) {
      setStatusMessage({ type: 'error', text: 'هذا البريد مضاف بالفعل كمدير مصرح له' });
      return;
    }

    setSaving(true);
    setStatusMessage(null);

    const updated = [...adminEmails, formatted];
    setAdminEmails(updated);
    setNewEmail('');

    try {
      const docRef = doc(db, 'system', 'authorized_admins');
      await setDoc(docRef, {
        emails: updated,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email || 'admin',
      });
      setStatusMessage({ type: 'success', text: `تم منح صلاحية المدير للحساب (${formatted}) بنجاح!` });
    } catch (err: any) {
      console.error('Error saving admin email:', err);
      setStatusMessage({ type: 'error', text: `فشل الحفظ في Firestore: ${err?.message || err}` });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveEmail = async (emailToRemove: string) => {
    if (emailToRemove === 'jalalmahmoud8000@gmail.com') {
      alert('لا يمكن إزالة حساب المدير العام الرئيسي.');
      return;
    }

    if (!window.confirm(`هل أنت متأكد من سحب صلاحية المدير من الحساب (${emailToRemove})؟`)) {
      return;
    }

    setSaving(true);
    setStatusMessage(null);

    const updated = adminEmails.filter(e => e !== emailToRemove);
    setAdminEmails(updated);

    try {
      const docRef = doc(db, 'system', 'authorized_admins');
      await setDoc(docRef, {
        emails: updated,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email || 'admin',
      });
      setStatusMessage({ type: 'success', text: `تم سحب الصلاحية من (${emailToRemove})` });
    } catch (err: any) {
      console.error('Error removing admin email:', err);
      setStatusMessage({ type: 'error', text: 'حدث خطأ أثناء التحديث في Firebase' });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                إدارة الحسابات والمدراء المصرح لهم
              </h2>
              <p className="text-xs text-slate-500">
                إضافة حسابات Gmail المسموح لها بالدخول والتعديل على الفواتير
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Status Toast */}
          {statusMessage && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Add New Admin Form */}
          <form onSubmit={handleAddEmail} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <label className="block text-xs font-bold text-slate-700">
              إضافة بريد Gmail مصرح له بالتعديل
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="مثال: accountant@gmail.com"
                  className="w-full pl-3 pr-9 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                <span>إضافة مدير</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              أي بريد يتم إضافته هنا سيتمكن فوراً من تسجيل الدخول بـ Google وفتح لوحة الفواتير وتعديلها.
            </p>
          </form>

          {/* Current Authorized Admins List */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>قائمة المدراء المعتمدين ({adminEmails.length})</span>
              </h3>
              {loading && <span className="text-xs text-slate-400">جارِ التحميل...</span>}
            </div>

            <div className="space-y-2">
              {adminEmails.map((email) => {
                const isSuper = email === 'jalalmahmoud8000@gmail.com';
                const isCurrentUser = user?.email?.toLowerCase() === email.toLowerCase();

                return (
                  <div
                    key={email}
                    className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isSuper ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {email.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-semibold text-slate-800 font-mono truncate">
                            {email}
                          </span>
                          {isCurrentUser && (
                            <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded border border-blue-200">
                              حسابك الحالي
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {isSuper ? 'المدير العام (المالك)' : 'مدير معتمد (صلاحية كاملة)'}
                        </div>
                      </div>
                    </div>

                    {!isSuper && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEmail(email)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="سحب الصلاحية"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
}
