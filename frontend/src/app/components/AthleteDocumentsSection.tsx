'use client';

import { useState, useRef } from 'react';
import {
  Camera,
  FileText,
  CreditCard,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Eye,
  Loader2,
  Image as ImageIcon,
  Clock,
  ShieldCheck,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import { pb } from '@/lib/pocketbase';
import { Roles } from '@/lib/roles';
import { getDocumentApprovalStatus, getDocumentStatusInfo, hasAnyDocument } from '@/lib/documents';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

export interface DocumentConfig {
  key: 'avatar' | 'birth_certificate_photo' | 'national_card_front' | 'national_card_back';
  title: string;
  subtitle: string;
  icon: any;
  aspectClass: string;
}

export const ATHLETE_DOCUMENTS: DocumentConfig[] = [
  {
    key: 'avatar',
    title: 'عکس پرسنلی (۳×۴)',
    subtitle: 'تصویر واضح با زمینه روشن و کیفیت مناسب',
    icon: Camera,
    aspectClass: 'aspect-[3/4]',
  },
  {
    key: 'birth_certificate_photo',
    title: 'صفحه اول شناسنامه',
    subtitle: 'تصویر کامل و خوانا از صفحه اول شناسنامه',
    icon: FileText,
    aspectClass: 'aspect-[4/3]',
  },
  {
    key: 'national_card_front',
    title: 'تصویر روی کارت ملی',
    subtitle: 'تصویر واضح از روی کارت هوشمند ملی',
    icon: CreditCard,
    aspectClass: 'aspect-[16/10]',
  },
  {
    key: 'national_card_back',
    title: 'تصویر پشت کارت ملی',
    subtitle: 'تصویر واضح از پشت کارت هوشمند ملی',
    icon: CreditCard,
    aspectClass: 'aspect-[16/10]',
  },
];

export function getDocumentUrl(user: any, key: string): string | null {
  if (!user || !user[key]) return null;
  const filename = user[key];
  if (typeof filename !== 'string' || !filename.trim()) return null;
  try {
    return pb.files.getURL(user, filename);
  } catch (err) {
    const baseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8088';
    return `${baseUrl}/api/files/users/${user.id}/${filename}`;
  }
}

interface AthleteDocumentsSectionProps {
  user: any;
  editable?: boolean;
  onUpdate?: (updatedUser: any) => void;
}

export default function AthleteDocumentsSection({
  user,
  editable = true,
  onUpdate,
}: AthleteDocumentsSectionProps) {
  const [currentUser, setCurrentUser] = useState(user);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    key: string;
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Review states (Super Admin & Board Chair)
  const [loadingReview, setLoadingReview] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [reviewFeedback, setReviewFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Check current authenticated user and reviewer permissions
  const authRecord = pb.authStore.record;
  const canReview =
    authRecord &&
    (authRecord.role === Roles.MANAGER_SUPER || authRecord.role === Roles.BOARD_CHAIR);
  const isViewingSelf = authRecord?.id === currentUser?.id;

  // Document approval status info
  const statusInfo = getDocumentStatusInfo(currentUser);
  const hasDocs = hasAnyDocument(currentUser);

  // File input refs
  const fileInputRefs = {
    avatar: useRef<HTMLInputElement>(null),
    birth_certificate_photo: useRef<HTMLInputElement>(null),
    national_card_front: useRef<HTMLInputElement>(null),
    national_card_back: useRef<HTMLInputElement>(null),
  };

  const handleFileSelect = async (docKey: DocumentConfig['key'], e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';

    if (file.size > 5 * 1024 * 1024) {
      setFeedback({
        key: docKey,
        type: 'error',
        text: 'حداکثر حجم مجاز تصویر ۵ مگابایت است.',
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      setFeedback({
        key: docKey,
        type: 'error',
        text: 'لطفاً یک فایل تصویری معتبر (JPG, PNG, WebP) انتخاب فرمایید.',
      });
      return;
    }

    setLoadingKey(docKey);
    setFeedback(null);
    setReviewFeedback(null);

    try {
      const formData = new FormData();
      formData.append(docKey, file);

      // CRITICAL: Any upload or update automatically puts the documents into "pending" state
      formData.append('documents_status', 'pending');
      formData.append('documents_reject_reason', '');

      const updatedRecord = await pb.collection('users').update(currentUser.id, formData);

      if (pb.authStore.record?.id === currentUser.id) {
        pb.authStore.save(pb.authStore.token, updatedRecord);
      }

      setCurrentUser(updatedRecord);
      onUpdate?.(updatedRecord);

      setFeedback({
        key: docKey,
        type: 'success',
        text: 'تصویر بارگذاری شد و در وضعیت «در انتظار تایید مدیر ارشد و رییس هیئت» قرار گرفت.',
      });
    } catch (err: any) {
      console.error(`Error uploading ${docKey}:`, err);
      setFeedback({
        key: docKey,
        type: 'error',
        text: err?.message || 'خطا در بارگذاری تصویر. لطفاً دوباره امتحان کنید.',
      });
    } finally {
      setLoadingKey(null);
    }
  };

  const handleRemove = async (docKey: DocumentConfig['key']) => {
    if (!confirm('آیا از حذف این مدرک اطمینان دارید؟')) return;

    setLoadingKey(docKey);
    setFeedback(null);
    setReviewFeedback(null);

    try {
      const formData = new FormData();
      formData.append(docKey, '');

      // Check remaining documents
      const remainingDocs = ATHLETE_DOCUMENTS.filter(
        (d) => d.key !== docKey && Boolean(currentUser[d.key])
      );

      if (remainingDocs.length === 0) {
        formData.append('documents_status', '');
      } else {
        formData.append('documents_status', 'pending');
      }

      const updatedRecord = await pb.collection('users').update(currentUser.id, formData);

      if (pb.authStore.record?.id === currentUser.id) {
        pb.authStore.save(pb.authStore.token, updatedRecord);
      }

      setCurrentUser(updatedRecord);
      onUpdate?.(updatedRecord);

      setFeedback({
        key: docKey,
        type: 'success',
        text: 'مدرک با موفقیت حذف گردید.',
      });
    } catch (err: any) {
      console.error(`Error removing ${docKey}:`, err);
      setFeedback({
        key: docKey,
        type: 'error',
        text: err?.message || 'خطا در حذف مدرک.',
      });
    } finally {
      setLoadingKey(null);
    }
  };

  // Review handlers for Super Admin and Board Chair
  const handleApprove = async () => {
    setLoadingReview(true);
    setReviewFeedback(null);
    try {
      const reviewer = pb.authStore.record;
      const reviewerName = reviewer
        ? `${reviewer.first_name_fa || ''} ${reviewer.last_name_fa || ''} (${reviewer.role})`
        : 'مدیریت هیئت';

      const nowShamsi = new Date().toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });

      const updatedRecord = await pb.collection('users').update(currentUser.id, {
        documents_status: 'approved',
        documents_reviewed_at: nowShamsi,
        documents_reviewer_name: reviewerName,
        documents_reject_reason: '',
      });

      setCurrentUser(updatedRecord);
      onUpdate?.(updatedRecord);
      setReviewFeedback({
        type: 'success',
        text: `مدارک کاربر با موفقیت توسط ${reviewerName} تایید شد.`,
      });
    } catch (err: any) {
      console.error('Error approving documents:', err);
      setReviewFeedback({
        type: 'error',
        text: err?.message || 'خطا در ثبت تاییدیه مدارک.',
      });
    } finally {
      setLoadingReview(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReasonInput.trim()) {
      alert('لطفاً دلیل عدم تایید مدارک را وارد فرمایید.');
      return;
    }

    setLoadingReview(true);
    setReviewFeedback(null);
    try {
      const reviewer = pb.authStore.record;
      const reviewerName = reviewer
        ? `${reviewer.first_name_fa || ''} ${reviewer.last_name_fa || ''} (${reviewer.role})`
        : 'مدیریت هیئت';

      const nowShamsi = new Date().toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });

      const updatedRecord = await pb.collection('users').update(currentUser.id, {
        documents_status: 'rejected',
        documents_reviewed_at: nowShamsi,
        documents_reviewer_name: reviewerName,
        documents_reject_reason: rejectReasonInput.trim(),
      });

      setCurrentUser(updatedRecord);
      onUpdate?.(updatedRecord);
      setIsRejectDialogOpen(false);
      setRejectReasonInput('');
      setReviewFeedback({
        type: 'success',
        text: 'مدارک رد شد و علت عدم تایید جهت اصلاح به کاربر ابلاغ گردید.',
      });
    } catch (err: any) {
      console.error('Error rejecting documents:', err);
      setReviewFeedback({
        type: 'error',
        text: err?.message || 'خطا در ثبت وضعیت رد مدارک.',
      });
    } finally {
      setLoadingReview(false);
    }
  };

  const handleResetToPending = async () => {
    setLoadingReview(true);
    setReviewFeedback(null);
    try {
      const updatedRecord = await pb.collection('users').update(currentUser.id, {
        documents_status: 'pending',
        documents_reject_reason: '',
      });

      setCurrentUser(updatedRecord);
      onUpdate?.(updatedRecord);
      setReviewFeedback({
        type: 'success',
        text: 'وضعیت مدارک به «در انتظار تایید» بازگردانی شد.',
      });
    } catch (err: any) {
      console.error('Error resetting document status:', err);
      setReviewFeedback({
        type: 'error',
        text: err?.message || 'خطا در بازگردانی وضعیت.',
      });
    } finally {
      setLoadingReview(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">
              مدارک هویتی و پرسنلی ورزشکار
            </h4>
            <p className="text-[11px] text-slate-500">
              عکس پرسنلی، صفحه اول شناسنامه و پشت و روی کارت ملی
            </p>
          </div>
        </div>

        {/* Upload Status Counter */}
        {(() => {
          const uploadedCount = ATHLETE_DOCUMENTS.filter(
            (d) => !!currentUser?.[d.key]
          ).length;
          return (
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border self-start sm:self-auto ${
                uploadedCount === 4
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {uploadedCount} از ۴ مدرک ثبت شده
            </span>
          );
        })()}
      </div>

      {/* APPROVAL STATUS BANNER */}
      {hasDocs && (
        <div
          className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            statusInfo.status === 'approved'
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              : statusInfo.status === 'rejected'
              ? 'bg-red-50/80 border-red-200 text-red-950'
              : 'bg-amber-50/80 border-amber-200 text-amber-950'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                statusInfo.status === 'approved'
                  ? 'bg-emerald-100 text-emerald-700'
                  : statusInfo.status === 'rejected'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {statusInfo.status === 'approved' && <CheckCircle2 className="w-4 h-4" />}
              {statusInfo.status === 'rejected' && <AlertCircle className="w-4 h-4" />}
              {statusInfo.status === 'pending' && <Clock className="w-4 h-4 animate-pulse" />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold">وضعیت تایید مدارک:</span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusInfo.badgeClass}`}
                >
                  {statusInfo.label}
                </span>
              </div>

              <p className="text-xs mt-1 leading-relaxed opacity-90">
                {statusInfo.description}
              </p>

              {currentUser.documents_reviewer_name && (
                <div className="text-[11px] mt-1.5 text-slate-600 flex items-center gap-2">
                  <span>بررسی‌کننده: <strong>{currentUser.documents_reviewer_name}</strong></span>
                  {currentUser.documents_reviewed_at && (
                    <span>• تاریخ: {currentUser.documents_reviewed_at}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REVIEW ACTION PANEL (FOR SENIOR MANAGER & BOARD CHAIR VIEWING AN ATHLETE) */}
      {canReview && !isViewingSelf && hasDocs && (
        <div className="p-3.5 bg-slate-900 text-white rounded-2xl shadow-sm border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-slate-100">
                پنل بررسی و تعیین وضعیت مدارک (مختص مدیر ارشد و رییس هیئت)
              </span>
            </div>
            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-md text-slate-300">
              دسترسی مدیریتی
            </span>
          </div>

          <p className="text-[11px] text-slate-300">
            شما به عنوان {authRecord?.role} می‌توانید صحت تصاویر و مدارک ورزشکار را بررسی و تایید یا رد فرمایید.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              disabled={loadingReview || statusInfo.status === 'approved'}
              onClick={handleApprove}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-xl h-8 px-3.5 font-semibold gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {loadingReview ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>تایید مدارک ورزشکار</span>
            </Button>

            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={loadingReview}
              onClick={() => {
                setRejectReasonInput(currentUser.documents_reject_reason || '');
                setIsRejectDialogOpen(true);
              }}
              className="bg-red-600 hover:bg-red-700 text-white text-xs rounded-xl h-8 px-3.5 font-semibold gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>رد مدارک و درخواست اصلاح</span>
            </Button>

            {statusInfo.status !== 'pending' && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={loadingReview}
                onClick={handleResetToPending}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 text-xs rounded-xl h-8 px-3 gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>تغییر به در انتظار بررسی</span>
              </Button>
            )}
          </div>

          {reviewFeedback && (
            <div
              className={`p-2 rounded-xl text-xs flex items-center gap-2 mt-2 ${
                reviewFeedback.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30'
                  : 'bg-red-500/20 text-red-200 border border-red-500/30'
              }`}
            >
              {reviewFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{reviewFeedback.text}</span>
            </div>
          )}
        </div>
      )}

      {/* Grid of Documents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {ATHLETE_DOCUMENTS.map((doc) => {
          const docUrl = getDocumentUrl(currentUser, doc.key);
          const isUploaded = !!docUrl;
          const isLoading = loadingKey === doc.key;
          const docFeedback = feedback?.key === doc.key ? feedback : null;
          const IconComponent = doc.icon;

          return (
            <div
              key={doc.key}
              className={`relative rounded-2xl border p-3.5 flex flex-col justify-between transition-all ${
                isUploaded
                  ? 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                  : 'bg-white border-dashed border-slate-300 hover:border-indigo-400'
              }`}
            >
              {/* Document Header */}
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                      isUploaded
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-800 leading-snug">
                      {doc.title}
                    </span>
                    <span className="block text-[10px] text-slate-400 line-clamp-1">
                      {doc.subtitle}
                    </span>
                  </div>
                </div>

                {isUploaded ? (
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${
                      statusInfo.status === 'approved'
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : statusInfo.status === 'rejected'
                        ? 'text-red-700 bg-red-50 border-red-200'
                        : 'text-amber-700 bg-amber-50 border-amber-200'
                    }`}
                  >
                    {statusInfo.status === 'approved' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                    {statusInfo.status === 'rejected' && <AlertCircle className="w-3 h-3 text-red-600" />}
                    {statusInfo.status === 'pending' && <Clock className="w-3 h-3 text-amber-600" />}
                    <span>{statusInfo.label}</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                    نیاز به بارگذاری
                  </span>
                )}
              </div>

              {/* Preview Box */}
              <div className="relative w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200/60 flex items-center justify-center min-h-[120px]">
                {isLoading ? (
                  <div className="py-8 flex flex-col items-center justify-center gap-2 text-indigo-600">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-xs font-semibold">در حال پردازش و ثبت...</span>
                  </div>
                ) : isUploaded ? (
                  <div className="group relative w-full h-32 overflow-hidden bg-slate-900/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={docUrl}
                      alt={doc.title}
                      className="w-full h-full object-contain object-center transition duration-200 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => setPreviewImage({ url: docUrl, title: doc.title })}
                        className="h-8 px-2.5 rounded-lg text-xs bg-white/95 text-slate-800 shadow cursor-pointer gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>بزرگ‌نمایی</span>
                      </Button>
                      {editable && (
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemove(doc.key)}
                          className="h-8 px-2.5 rounded-lg text-xs shadow cursor-pointer gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف</span>
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => editable && fileInputRefs[doc.key].current?.click()}
                    className={`w-full py-6 flex flex-col items-center justify-center text-slate-400 gap-1.5 transition ${
                      editable ? 'cursor-pointer hover:text-indigo-600 hover:bg-indigo-50/30' : ''
                    }`}
                  >
                    <UploadCloud className="w-7 h-7 stroke-[1.5]" />
                    <span className="text-xs font-medium">
                      {editable ? 'برای انتخاب فایل کلیک کنید' : 'فایلی بارگذاری نشده است'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      فرمت‌های مجاز: JPG, PNG, WebP (حداکثر ۵ مگابایت)
                    </span>
                  </div>
                )}
              </div>

              {/* Action Bar (when editable) */}
              {editable && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <input
                    ref={fileInputRefs[doc.key]}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => handleFileSelect(doc.key, e)}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                    onClick={() => fileInputRefs[doc.key].current?.click()}
                    className="w-full h-8 text-xs font-semibold rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer gap-1.5"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{isUploaded ? 'تغییر و جایگزینی تصویر' : 'انتخاب و بارگذاری تصویر'}</span>
                  </Button>
                </div>
              )}

              {/* Feedback Alert for this card */}
              {docFeedback && (
                <div
                  className={`mt-2 p-2 rounded-xl text-[11px] flex items-center gap-1.5 ${
                    docFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {docFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  )}
                  <span>{docFeedback.text}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Lightbox Modal for Enlarged View */}
      {previewImage && (
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent
            className="sm:max-w-2xl p-4 text-right bg-white overflow-hidden rounded-3xl"
            dir="rtl"
          >
            <DialogHeader className="pb-3 border-b border-slate-100">
              <DialogTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                <span>مشاهده {previewImage.title}</span>
              </DialogTitle>
            </DialogHeader>

            <div className="my-2 p-1 bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center max-h-[70vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[68vh] w-auto max-w-full object-contain rounded-xl"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <DialogClose asChild>
                <Button variant="outline" className="rounded-xl px-5 text-xs">
                  بستن پیش‌نمایش
                </Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Rejection Reason Modal (for Super Admin & Board Chair) */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-md p-6 text-right" dir="rtl">
          <DialogHeader className="mb-3 text-right">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 text-red-700 rounded-2xl">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-800">
                  رد مدارک و درخواست اصلاح
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  علت عدم تایید مدارک را جهت نمایش به ورزشکار یادداشت نمایید.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 my-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                توضیحات و علت رد مدارک: <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                placeholder="مثال: تصویر کارت ملی مات است، لطفاً مجدداً با نور کافی عکس بگیرید."
                className="w-full p-3 text-xs rounded-xl border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>
          </div>

          <DialogFooter className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
            <DialogClose asChild>
              <Button variant="outline" disabled={loadingReview} className="rounded-xl text-xs">
                انصراف
              </Button>
            </DialogClose>
            <Button
              type="button"
              disabled={loadingReview || !rejectReasonInput.trim()}
              onClick={handleReject}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs gap-1.5 cursor-pointer"
            >
              {loadingReview ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>در حال ثبت...</span>
                </>
              ) : (
                <span>ثبت قطعی رد مدارک</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
