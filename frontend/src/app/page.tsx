'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { pb } from '@/lib/pocketbase';
import { TEHRAN_COUNTIES_FA, TEHRAN_COUNTIES } from '@/lib/validations/auth';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current auth status from PocketBase authStore
    if (pb.authStore.isValid && pb.authStore.record) {
      setUser(pb.authStore.record);
    } else {
      setUser(null);
    }
    setLoading(false);

    // Subscribe to auth store changes
    const unsubscribe = pb.authStore.onChange((token, record) => {
      if (token && record) {
        setUser(record);
      } else {
        setUser(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleLogout = () => {
    pb.authStore.clear();
    setUser(null);
    router.push('/login');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-slate-600 font-medium animate-pulse">
          در حال بارگذاری...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {user ? (
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-slate-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8 mb-8">
              <div>
                <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full mb-3">
                  حساب کاربری فعال
                </span>
                <h1 className="text-3xl font-bold text-slate-800 mb-1">
                  خوش آمدید، {user.first_name_fa} {user.last_name_fa}!
                </h1>
                <p className="text-slate-500 dir-ltr text-right text-sm">
                  {user.first_name_en} {user.last_name_en}
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold rounded-2xl shadow-md shadow-red-200 transition duration-150 cursor-pointer self-start md:self-auto"
              >
                خروج از حساب
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="block text-xs font-medium text-slate-400 mb-1">
                  کد ملی
                </span>
                <span className="text-lg font-bold text-slate-800 font-mono dir-ltr block text-right">
                  {user.national_id}
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="block text-xs font-medium text-slate-400 mb-1">
                  جنسیت
                </span>
                <span className="text-lg font-bold text-slate-800">
                  {user.gender === 'male' ? 'مرد' : 'زن'}
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="block text-xs font-medium text-slate-400 mb-1">
                  شهرستان استان تهران
                </span>
                <span className="text-lg font-bold text-slate-800">
                  {TEHRAN_COUNTIES_FA[user.region_county as keyof typeof TEHRAN_COUNTIES_FA] || user.region_county}
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="block text-xs font-medium text-slate-400 mb-1">
                  باشگاه ورزشی
                </span>
                <span className="text-lg font-bold text-slate-800">
                  {user.club || 'ثبت نشده'}
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 md:col-span-2">
                <span className="block text-xs font-medium text-slate-400 mb-1">
                  آدرس ایمیل
                </span>
                <span className="text-lg font-bold text-slate-800 dir-ltr block text-right">
                  {user.email}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 text-center border border-slate-100">
            <h1 className="text-3xl font-bold text-slate-800 mb-4">
              سامانه مدیریت ورزشکاران
            </h1>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              جهت استفاده از خدمات سامانه لطفا ابتدا وارد حساب کاربری خود شوید یا ثبت‌نام کنید.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl shadow-md shadow-indigo-200 transition duration-150"
              >
                ورود به سامانه
              </Link>
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-2xl transition duration-150"
              >
                ثبت‌نام ورزشکار جدید
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
