'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { pb } from '@/lib/pocketbase';
import LogoutButton from '@/app/components/LogoutButton';
import AccountButton from '@/app/components/AccountButton';
import { TEHRAN_COUNTIES_FA } from '@/lib/validations/auth';
import { Roles, formatRoleLabel, getRoleBadgeStyle, isSeniorManager } from '@/lib/roles';
import {
  Shield,
  Dumbbell,
  Building2,
  Briefcase,
  Users,
  ArrowLeft,
  UserCheck,
  LayoutGrid,
  Sparkles,
  BarChart3,
  ChevronLeft,
  User,
  Activity,
  FileText,
} from 'lucide-react';
import { getDocumentStatusInfo } from '@/lib/documents';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [totalUsersCount, setTotalUsersCount] = useState<number | null>(null);

  useEffect(() => {
    // Check current auth status from PocketBase authStore
    if (pb.authStore.isValid && pb.authStore.record) {
      setUser(pb.authStore.record);
      // Fetch total users count for the mosaic tile badge
      pb.collection('users')
        .getList(1, 1)
        .then((res) => setTotalUsersCount(res.totalItems))
        .catch(() => {});
    } else {
      setUser(null);
    }
    setLoading(false);

    // Subscribe to auth store changes
    const unsubscribe = pb.authStore.onChange((token, record) => {
      if (token && record) {
        setUser(record);
        pb.collection('users')
          .getList(1, 1)
          .then((res) => setTotalUsersCount(res.totalItems))
          .catch(() => {});
      } else {
        setUser(null);
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
          در حال بارگذاری داشبورد...
        </div>
      </div>
    );
  }

  const isSuperAdmin = isSeniorManager(user);
  const isBoardOrSuperAdmin = isSuperAdmin || user?.role === Roles.BOARD_CHAIR;
  const roleStyle = getRoleBadgeStyle(user?.role);
  const roleDisplay = formatRoleLabel(user?.role, user?.team_name);

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {user ? (
          <>
            {/* Top Dashboard Header Bar with Account & Logout buttons */}
            <div className="bg-white rounded-3xl shadow-sm p-6 sm:px-8 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="inline-block px-3 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full">
                    حساب کاربری فعال
                  </span>

                  {/* Role Badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-0.5 text-xs font-bold rounded-full ${roleStyle.badgeClass}`}
                  >
                    {user?.role === Roles.BOARD_CHAIR && <Building2 className="w-3.5 h-3.5 text-blue-700" />}
                    {user?.role === Roles.COMMITTEE_CHAIR && <Briefcase className="w-3.5 h-3.5 text-teal-700" />}
                    {user?.role === Roles.TEAM_MANAGER && <Users className="w-3.5 h-3.5 text-amber-700" />}
                    {(!user?.role || user?.role === Roles.ATHLETE) && <Dumbbell className="w-3.5 h-3.5 text-emerald-700" />}
                    <span>نقش: {roleDisplay}</span>
                    {isSuperAdmin && (
                      <span className="text-[10px] text-purple-900 bg-purple-200/60 px-1.5 py-0.2 rounded font-black">
                        بالاترین دسترسی
                      </span>
                    )}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 flex flex-wrap items-center gap-2">
                  <span>خوش آمدید، {user.first_name_fa} {user.last_name_fa}!</span>
                  {isSuperAdmin && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-purple-100 text-purple-800 border border-purple-200 shadow-sm">
                      مدیر ارشد
                    </span>
                  )}
                </h1>

                <p className="text-slate-400 dir-ltr text-right text-xs sm:text-sm mt-0.5 font-medium">
                  {user.first_name_en} {user.last_name_en} • {user.email}
                </p>
              </div>

              {/* Action Buttons: Account Details & Logout */}
              <div className="flex flex-wrap items-center gap-3 self-start md:self-auto border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 w-full md:w-auto">
                <AccountButton user={user} />
                <LogoutButton />
              </div>
            </div>

            {/* MOSAIC TILES / BUTTONS SECTION */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-lg sm:text-xl">
                  <LayoutGrid className="w-5 h-5 text-indigo-600" />
                  <h2>میز خدمت و دسترسی‌های سریع</h2>
                </div>
                <span className="text-xs text-slate-400 font-medium">کاشی‌های عملکردی سامانه</span>
              </div>

              {/* Mosaic Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 1. PRIMARY MOSAIC TILE: User Management (FOR SUPER ADMIN & BOARD CHAIR) OR Athlete Documents (FOR REGULAR USERS) */}
                {isBoardOrSuperAdmin ? (
                  <Link
                    href="/users"
                    className="group relative flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white shadow-xl shadow-indigo-950/20 hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-1.5 active:translate-y-0 active:scale-[0.99] transition-all duration-300 border border-indigo-700/40 overflow-hidden cursor-pointer md:col-span-2 lg:col-span-2"
                  >
                    {/* Subtle decorative glow */}
                    <div className="absolute -top-16 -left-16 w-44 h-44 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/30 transition-all duration-500" />
                    <div className="absolute -bottom-16 -right-16 w-44 h-44 bg-purple-500/20 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/30 transition-all duration-500" />

                    {/* Header of Mosaic Tile */}
                    <div className="relative z-10 flex items-start justify-between gap-4 mb-6">
                      <div className="flex items-center gap-3.5">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 ring-4 ring-white/10 group-hover:scale-105 group-hover:rotate-1 transition-transform duration-300">
                          <Users className="w-7 h-7" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 inline-flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-amber-300" />
                              <span>پنل نظارتی هیئت</span>
                            </span>

                            {isSuperAdmin && (
                              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/30">
                                مدیر ارشد
                              </span>
                            )}
                          </div>

                          <h3 className="text-xl sm:text-2xl font-black text-white mt-1 group-hover:text-indigo-200 transition-colors">
                            مدیریت اعضا و بررسی مدارک
                          </h3>
                        </div>
                      </div>

                      <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white/80 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shrink-0">
                        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                      </div>
                    </div>

                    {/* Body description of Mosaic Tile */}
                    <p className="relative z-10 text-slate-300 text-xs sm:text-sm leading-relaxed mb-6 line-clamp-2">
                      مشاهده لیست ورزشکاران، بررسی و تایید مدارک هویتی، جستجوی پیشرفته و {isSuperAdmin ? 'امکان تغییر نقش اعضا با دسترسی مدیر ارشد' : 'مدیریت و تایید مدارک با دسترسی رییس هیئت'}.
                    </p>

                    {/* Footer Stats of Mosaic Tile */}
                    <div className="relative z-10 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 text-indigo-200 font-medium">
                        <UserCheck className="w-4 h-4 text-emerald-400" />
                        <span>
                          {totalUsersCount !== null
                            ? `${totalUsersCount} کاربر ثبت‌نام شده در سامانه`
                            : 'مشاهده و مدیریت اعضا'}
                        </span>
                      </div>

                      <span className="inline-flex items-center gap-1 text-white font-bold group-hover:underline">
                        <span>ورود به پنل کاربران</span>
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </Link>
                ) : (
                  <div className="relative flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl shadow-indigo-950/20 border border-indigo-700/40 overflow-hidden md:col-span-2 lg:col-span-2">
                    <div className="relative z-10 flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-lg ring-4 ring-white/10">
                          <FileText className="w-7 h-7" />
                        </div>
                        <div>
                          {(() => {
                            const docInfo = getDocumentStatusInfo(user);
                            return (
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${docInfo.badgeClass}`}>
                                  {docInfo.label}
                                </span>
                              </div>
                            );
                          })()}
                          <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                            مدارک هویتی و پرسنلی
                          </h3>
                        </div>
                      </div>
                    </div>

                    <p className="relative z-10 text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
                      عکس پرسنلی، صفحه اول شناسنامه و پشت و روی کارت ملی شما تا زمان تایید توسط مدیر ارشد یا رییس هیئت در وضعیت «در انتظار تایید» قرار می‌گیرد.
                    </p>

                    <div className="relative z-10 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <span className="text-slate-300">
                        جهت مشاهده یا ویرایش تصاویر مدارک:
                      </span>
                      <AccountButton user={user} />
                    </div>
                  </div>
                )}

                {/* 2. SECONDARY MOSAIC TILE: Quick Access to Account Details Modal */}
                <div className="relative flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-white shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 ring-4 ring-indigo-50/50">
                      <Shield className="w-6 h-6 text-indigo-600" />
                    </div>

                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      شناسنامه فعال
                    </span>

                    <h3 className="text-lg font-bold text-slate-800 mt-2 mb-1">
                      حساب کاربری و هویت
                    </h3>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      مشاهده کد ملی، مشخصات فردی و سطح دسترسی سازمانی شما در سامانه.
                    </p>
                  </div>

                  <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between">
                    <span className="font-mono text-xs text-slate-600 font-semibold">{user.national_id}</span>
                    <AccountButton user={user} />
                  </div>
                </div>

                {/* 3. MOSAIC TILE: Clubs & Counties (Hidden for Senior Manager and Board Chair) */}
                {!isBoardOrSuperAdmin && (
                  <div className="relative flex flex-col justify-between p-6 rounded-3xl bg-white shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 ring-4 ring-blue-50/50">
                        <Building2 className="w-6 h-6 text-blue-600" />
                      </div>

                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        منطقه و حوزه
                      </span>

                      <h3 className="text-lg font-bold text-slate-800 mt-2 mb-1">
                        باشگاه و هیئت استان تهران
                      </h3>
                      <p className="text-slate-500 text-xs leading-relaxed">
                        باشگاه ورزشی: {user.club || 'ثبت نشده'}
                      </p>
                    </div>

                    <div className="pt-4 mt-6 border-t border-slate-100 text-xs text-slate-600 font-medium">
                      شهرستان:{' '}
                      <strong className="text-slate-800">
                        {TEHRAN_COUNTIES_FA[user.region_county as keyof typeof TEHRAN_COUNTIES_FA] || user.region_county}
                      </strong>
                    </div>
                  </div>
                )}

                {/* 4. MOSAIC TILE: Reports / Stats Overview */}
                <Link
                  href="/users"
                  className={`group relative flex flex-col justify-between p-6 rounded-3xl bg-gradient-to-br from-slate-50 to-indigo-50/40 shadow-xl shadow-slate-200/50 border border-indigo-100 hover:border-indigo-300 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer ${
                    isBoardOrSuperAdmin ? 'col-span-1 md:col-span-3' : 'md:col-span-2 lg:col-span-2'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center ring-4 ring-indigo-50 group-hover:scale-105 transition-transform">
                        <BarChart3 className="w-6 h-6 text-indigo-700" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                          آمار و گزارش اعضای ثبت‌نام شده
                        </h3>
                        <p className="text-slate-500 text-xs mt-0.5">
                          مشاهده تفکیک آماری ورزشکاران، مدیران تیم و کادر اجرایی هیئت بسکتبال
                        </p>
                      </div>
                    </div>

                    <div className="text-xs font-bold text-indigo-600 bg-white px-3 py-1.5 rounded-xl border border-indigo-100 shadow-sm flex items-center gap-1 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <span>مشاهده آمار</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
                    <span>دسترسی به فهرست، فیلترها و خروجی اطلاعات کاربران</span>
                    <span className="font-semibold text-indigo-700">کلیک برای ورود ←</span>
                  </div>
                </Link>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 text-center border border-slate-100 max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 ring-8 ring-indigo-50/50">
              <Shield className="w-8 h-8 text-indigo-600" />
            </div>

            <h1 className="text-3xl font-extrabold text-slate-800 mb-4">
              سامانه مدیریت بسکتبال
            </h1>
            <p className="text-slate-600 mb-8 max-w-md mx-auto leading-relaxed text-sm">
              به سامانه جامع مدیریت بسکتبال خوش آمدید. جهت استفاده از خدمات، مشاهده اعضا و مدیریت دسترسی‌ها لطفاً وارد حساب خود شوید.
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
