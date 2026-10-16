'use client';

import { useState } from 'react';
import {
  User,
  Shield,
  Dumbbell,
  Building2,
  Briefcase,
  Users,
  Calendar,
  Mail,
  MapPin,
  CheckCircle2,
  Save,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { TEHRAN_COUNTIES_FA } from '@/lib/validations/auth';
import { Roles, formatRoleLabel, getRoleBadgeStyle, isSeniorManager } from '@/lib/roles';
import { pb } from '@/lib/pocketbase';
import ShamsiDatePicker, { formatShamsiDateDisplay } from '@/app/components/ShamsiDatePicker';
import AthleteDocumentsSection, { getDocumentUrl } from '@/app/components/AthleteDocumentsSection';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

interface AccountButtonProps {
  user: any;
}

export default function AccountButton({ user }: AccountButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [birthDate, setBirthDate] = useState<string>(user?.birth_date || '');
  const [hasChanged, setHasChanged] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!user) return null;

  const isSuperAdmin = isSeniorManager(user);
  const isBoardOrSuperAdmin = isSuperAdmin || user.role === Roles.BOARD_CHAIR;
  const roleStyle = getRoleBadgeStyle(user.role);
  const roleDisplay = formatRoleLabel(user.role, user.team_name);
  const avatarUrl = getDocumentUrl(user, 'avatar');

  const handleSaveBirthDate = async () => {
    setIsSaving(true);
    setFeedback(null);
    try {
      await pb.collection('users').update(user.id, {
        birth_date: birthDate,
      });

      // Update in-memory record
      user.birth_date = birthDate;
      setHasChanged(false);
      setFeedback({
        type: 'success',
        text: 'تاریخ تولد هجری شمسی با موفقیت ذخیره شد.',
      });
    } catch (err: any) {
      console.error('Error updating birth_date:', err);
      setFeedback({
        type: 'error',
        text: err?.message || 'خطا در ثبت تاریخ تولد. لطفاً مجدداً تلاش کنید.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="px-5 py-2.5 h-auto text-sm font-semibold rounded-2xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition duration-150 cursor-pointer gap-2"
        >
          <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center overflow-hidden">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="آواتار" className="w-full h-full object-cover" />
            ) : (
              <User className="w-3.5 h-3.5" />
            )}
          </div>
          <span>حساب کاربری</span>
          {isSuperAdmin && (
            <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md font-bold border border-purple-200">
              مدیر ارشد
            </span>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl p-6 text-right max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader className="text-right pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="عکس پرسنلی"
                className="w-12 h-12 rounded-2xl object-cover ring-4 ring-indigo-50 shadow-sm border border-slate-200"
              />
            ) : (
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base shadow-sm ring-4 ${
                  isSuperAdmin
                    ? 'bg-purple-700 text-white ring-purple-100'
                    : 'bg-indigo-600 text-white ring-indigo-50'
                }`}
              >
                {user.first_name_fa?.[0] || ''}{user.last_name_fa?.[0] || ''}
              </div>
            )}

            <div>
              <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span>
                  {user.first_name_fa} {user.last_name_fa}
                </span>
                {isSuperAdmin && (
                  <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-black border border-purple-200">
                    مدیر ارشد
                  </span>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400 dir-ltr text-right mt-0.5 font-medium">
                {user.first_name_en} {user.last_name_en}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Account Details Content */}
        <div className="space-y-4 my-2 text-sm">
          {/* Role and Status banner */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <div>
              <span className="text-xs text-slate-400 block mb-0.5">نقش و سطح دسترسی</span>
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                {roleDisplay}
              </span>
            </div>
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${roleStyle.badgeClass}`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>حساب فعال</span>
            </span>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-xs text-slate-400 block mb-1">کد ملی (۱۰ رقم)</span>
              <span className="font-mono font-bold text-slate-800 dir-ltr block text-right text-base">
                {user.national_id || 'ثبت نشده'}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-xs text-slate-400 block mb-1">جنسیت</span>
              <span className="font-bold text-slate-800 text-base">
                {user.gender === 'male' ? 'مرد' : 'زن'}
              </span>
            </div>

            {!isBoardOrSuperAdmin && (
              <>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-xs text-slate-400 block mb-1">شهرستان استان تهران</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {TEHRAN_COUNTIES_FA[user.region_county as keyof typeof TEHRAN_COUNTIES_FA] ||
                        user.region_county ||
                        '—'}
                    </span>
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-xs text-slate-400 block mb-1">باشگاه ورزشی</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user.club || 'ثبت نشده'}</span>
                  </span>
                </div>
              </>
            )}

            {/* SOLAR HIJRI BIRTH DATE PICKER CARD */}
            <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100 sm:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-indigo-950 font-bold flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>تاریخ تولد هجری شمسی</span>
                </label>
                {birthDate && (
                  <span className="text-[11px] font-bold text-indigo-700 bg-white px-2.5 py-0.5 rounded-full border border-indigo-200 shadow-2xs">
                    {formatShamsiDateDisplay(birthDate)}
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1">
                  <ShamsiDatePicker
                    value={birthDate}
                    onChange={(val) => {
                      setBirthDate(val);
                      setHasChanged(true);
                      setFeedback(null);
                    }}
                    placeholder="انتخاب تاریخ تولد هجری شمسی (مثال: ۱۳۷۸/۰۴/۱۵)"
                  />
                </div>

                {hasChanged && (
                  <Button
                    type="button"
                    onClick={handleSaveBirthDate}
                    disabled={isSaving}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs py-2 px-3.5 shrink-0 transition shadow-sm cursor-pointer gap-1.5"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>در حال ذخیره...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>ذخیره تاریخ</span>
                      </>
                    )}
                  </Button>
                )}
              </div>

              {feedback && (
                <div
                  className={`text-xs p-2 rounded-xl flex items-center gap-1.5 ${
                    feedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  )}
                  <span>{feedback.text}</span>
                </div>
              )}
            </div>

            {user.role === Roles.TEAM_MANAGER && (
              <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 sm:col-span-2">
                <span className="text-xs text-amber-700 block mb-1 font-semibold">
                  تیم تحت مدیریت
                </span>
                <span className="font-bold text-amber-900 text-base">
                  {user.team_name || 'مشخص نشده'}
                </span>
              </div>
            )}

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 sm:col-span-2">
              <span className="text-xs text-slate-400 block mb-1">آدرس پست الکترونیک (ایمیل)</span>
              <span className="font-mono text-slate-800 dir-ltr block text-right font-medium flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{user.email}</span>
              </span>
            </div>

            {/* ATHLETE IDENTIFICATION & PERSONAL DOCUMENTS */}
            {!isBoardOrSuperAdmin && (
              <div className="pt-4 border-t border-slate-200/80 sm:col-span-2">
                <AthleteDocumentsSection
                  user={user}
                  editable={true}
                  onUpdate={(updated) => {
                    Object.assign(user, updated);
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4 pt-3 border-t border-slate-100">
          <DialogClose asChild>
            <Button variant="outline" className="w-full rounded-xl">
              بستن
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
