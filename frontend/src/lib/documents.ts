import { Clock, CheckCircle2, AlertCircle, FileQuestion } from 'lucide-react';

export type DocumentApprovalStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface DocumentStatusInfo {
  status: DocumentApprovalStatus;
  label: string;
  badgeClass: string;
  dotClass: string;
  icon: any;
  description: string;
}

export function hasAnyDocument(user: any): boolean {
  if (!user) return false;
  return Boolean(
    user.avatar ||
    user.birth_certificate_photo ||
    user.national_card_front ||
    user.national_card_back
  );
}

export function getDocumentApprovalStatus(user: any): DocumentApprovalStatus {
  if (!user) return 'none';
  if (!hasAnyDocument(user)) return 'none';

  const rawStatus = user.documents_status;
  if (rawStatus === 'approved') return 'approved';
  if (rawStatus === 'rejected') return 'rejected';
  // All uploaded documents start as pending until approved by Super Admin or Board Chair
  return 'pending';
}

export function getDocumentStatusInfo(user: any): DocumentStatusInfo {
  const status = getDocumentApprovalStatus(user);

  switch (status) {
    case 'approved':
      return {
        status: 'approved',
        label: 'تایید شده',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotClass: 'bg-emerald-500',
        icon: CheckCircle2,
        description: 'مدارک هویتی توسط مدیریت هیئت بررسی و تایید نهایی گردیده است.',
      };
    case 'rejected':
      return {
        status: 'rejected',
        label: 'رد شده (نیاز به اصلاح)',
        badgeClass: 'bg-red-50 text-red-700 border-red-200',
        dotClass: 'bg-red-500',
        icon: AlertCircle,
        description: user.documents_reject_reason
          ? `علت عدم تایید: ${user.documents_reject_reason}`
          : 'مدارک ارسالی مورد تایید واقع نشد. لطفاً تصاویر واضح و جدید بارگذاری فرمایید.',
      };
    case 'pending':
      return {
        status: 'pending',
        label: 'در انتظار تایید',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        dotClass: 'bg-amber-500',
        icon: Clock,
        description: 'مدارک بارگذاری شده و تا زمان بررسی توسط مدیر ارشد یا رییس هیئت در انتظار تایید است.',
      };
    case 'none':
    default:
      return {
        status: 'none',
        label: 'بدون مدرک',
        badgeClass: 'bg-slate-50 text-slate-500 border-slate-200',
        dotClass: 'bg-slate-400',
        icon: FileQuestion,
        description: 'هنوز هیچ مدرکی بارگذاری نشده است.',
      };
  }
}
