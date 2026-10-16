'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { pb } from '@/lib/pocketbase';
import RegisteredUsersSection from '@/app/components/RegisteredUsersSection';
import LogoutButton from '@/app/components/LogoutButton';
import AccountButton from '@/app/components/AccountButton';
import { Roles, formatRoleLabel, isSeniorManager } from '@/lib/roles';
import { ChevronRight, Home, Users, ArrowRight, ShieldAlert } from 'lucide-react';

export default function UsersPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current auth status from PocketBase authStore
    if (pb.authStore.isValid && pb.authStore.record) {
      setCurrentUser(pb.authStore.record);
    } else {
      setCurrentUser(null);
    }
    setLoading(false);

    // Subscribe to auth store changes
    const unsubscribe = pb.authStore.onChange((token, record) => {
      if (token && record) {
        setCurrentUser(record);
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-slate-600 font-medium animate-pulse text-sm">
          در حال بارگذاری اطلاعات کاربران...
        </div>
      </div>
    );
  }

  // If user is not logged in, show access barrier
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center border border-slate-100 space-y-5">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-amber-50/50">
            <ShieldAlert className="w-7 h-7 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 mb-2">
              نیاز به ورود به سامانه
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              برای مشاهده لیست کاربران ثبت‌نام شده و دسترسی به اطلاعات اعضا، لطفاً ابتدا وارد حساب کاربری خود شوید.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 pt-2">
            <Link
              href="/login"
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-200 transition text-sm"
            >
              ورود به حساب کاربری
            </Link>
            <Link
              href="/"
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition text-sm"
            >
              بازگشت به صفحه اصلی
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isSuperAdmin = isSeniorManager(currentUser);
  const isBoardChair = currentUser?.role === Roles.BOARD_CHAIR;
  const canAccessUsersPage = isSuperAdmin || isBoardChair;

  // Restrict access: Only Super Admin and Board Chair can view this page
  if (!canAccessUsersPage) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center border border-slate-100 space-y-5">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-red-50/50">
            <ShieldAlert className="w-7 h-7 text-red-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 mb-2">
              دسترسی محدود شده است
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              مشاهده لیست کاربران و اطلاعات اعضا منحصراً در اختیار <strong>مدیر ارشد</strong> و <strong>رییس هیئت</strong> می‌باشد. دسترسی سایر کاربران از سمت سرور محدود شده است.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow transition text-sm cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>بازگشت به داشبورد اصلی</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header & Breadcrumb Bar */}
        <div className="bg-white rounded-2xl p-4 sm:px-6 shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 hover:text-indigo-600 font-medium transition"
            >
              <Home className="w-4 h-4" />
              <span>داشبورد اصلی</span>
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-300 rotate-180" />
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>لیست کاربران و اعضا</span>
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
            <div className="text-right">
              <div className="text-xs text-slate-400">کاربر وارد شده:</div>
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <span>
                  {currentUser.first_name_fa} {currentUser.last_name_fa}
                </span>
                {isSuperAdmin && (
                  <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md font-bold border border-purple-200">
                    مدیر ارشد
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <AccountButton user={currentUser} />
              <LogoutButton />
            </div>
          </div>
        </div>

        {/* Dedicated Users List Section */}
        <div className="-mt-6">
          <RegisteredUsersSection currentUser={currentUser} />
        </div>
      </div>
    </div>
  );
}
