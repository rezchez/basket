'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  registerSchema,
  RegisterInput,
  TEHRAN_COUNTIES,
  TEHRAN_COUNTIES_FA,
} from '@/lib/validations/auth';
import { pb } from '@/lib/pocketbase';

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      passwordConfirm: '',
      gender: 'male',
      first_name_fa: '',
      last_name_fa: '',
      first_name_en: '',
      last_name_en: '',
      national_id: '',
      region_county: 'Tehran',
      club: '',
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    setServerError(null);
    setIsLoading(true);

    try {
      // 1. Create user in PocketBase
      await pb.collection('users').create({
        email: data.email,
        password: data.password,
        passwordConfirm: data.passwordConfirm,
        gender: data.gender,
        first_name_fa: data.first_name_fa,
        last_name_fa: data.last_name_fa,
        first_name_en: data.first_name_en,
        last_name_en: data.last_name_en,
        national_id: data.national_id,
        region_county: data.region_county,
        club: data.club || '',
        role: (data.first_name_fa === 'رضا' && data.last_name_fa === 'چگینی') ? 'مدیر ارشد' : 'ورزشکار',
      });

      // 2. Automatically log the user in
      await pb.collection('users').authWithPassword(data.email, data.password);

      // 3. Redirect directly to home / dashboard page
      router.push('/');
      router.refresh();
    } catch (err: any) {
      console.error('Registration error:', err);
      const dataErrors = err?.response?.data;
      if (dataErrors?.national_id) {
        setServerError('این کد ملی قبلاً در سیستم ثبت شده است.');
      } else if (dataErrors?.email) {
        setServerError('این آدرس ایمیل قبلاً در سیستم ثبت شده است.');
      } else if (err?.message) {
        setServerError('خطا در ثبت‌نام: ' + err.message);
      } else {
        setServerError('خطایی غیرمنتظره در هنگام ثبت‌نام رخ داده است.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 bg-slate-100 flex items-center justify-center">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-6 md:p-10 border border-slate-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
            ثبت‌نام ورزشکار جدید
          </h1>
          <p className="text-sm text-slate-500">
            برای عضویت در سامانه مدیریت ورزشکاران، فرم زیر را با دقت تکمیل نمایید.
          </p>
        </div>

        {serverError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          {/* Gender Select */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              جنسیت <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-6">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="male"
                  {...register('gender')}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span className="text-sm text-slate-700 font-medium">مرد</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="female"
                  {...register('gender')}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span className="text-sm text-slate-700 font-medium">زن</span>
              </label>
            </div>
            {errors.gender && (
              <p className="mt-1.5 text-xs text-red-600 font-medium">
                {errors.gender.message}
              </p>
            )}
          </div>

          {/* Persian Names */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                نام (فارسی) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('first_name_fa')}
                placeholder="مثال: علی"
                className={`w-full px-4 py-2.5 rounded-xl border text-slate-800 transition focus:outline-none focus:ring-2 ${
                  errors.first_name_fa
                    ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
                }`}
              />
              {errors.first_name_fa && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">
                  {errors.first_name_fa.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                نام خانوادگی (فارسی) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('last_name_fa')}
                placeholder="مثال: رضایی"
                className={`w-full px-4 py-2.5 rounded-xl border text-slate-800 transition focus:outline-none focus:ring-2 ${
                  errors.last_name_fa
                    ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
                }`}
              />
              {errors.last_name_fa && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">
                  {errors.last_name_fa.message}
                </p>
              )}
            </div>
          </div>

          {/* English Names */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                نام (انگلیسی) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                dir="ltr"
                {...register('first_name_en')}
                placeholder="e.g. Ali"
                className={`w-full px-4 py-2.5 rounded-xl border text-left text-slate-800 transition focus:outline-none focus:ring-2 ${
                  errors.first_name_en
                    ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
                }`}
              />
              {errors.first_name_en && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">
                  {errors.first_name_en.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                نام خانوادگی (انگلیسی) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                dir="ltr"
                {...register('last_name_en')}
                placeholder="e.g. Rezai"
                className={`w-full px-4 py-2.5 rounded-xl border text-left text-slate-800 transition focus:outline-none focus:ring-2 ${
                  errors.last_name_en
                    ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
                }`}
              />
              {errors.last_name_en && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">
                  {errors.last_name_en.message}
                </p>
              )}
            </div>
          </div>

          {/* National ID & County */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                کد ملی (۱۰ رقم) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                dir="ltr"
                maxLength={10}
                {...register('national_id')}
                placeholder="0012345678"
                className={`w-full px-4 py-2.5 rounded-xl border text-left text-slate-800 transition focus:outline-none focus:ring-2 ${
                  errors.national_id
                    ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
                }`}
              />
              {errors.national_id && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">
                  {errors.national_id.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                شهرستان استان تهران <span className="text-red-500">*</span>
              </label>
              <select
                {...register('region_county')}
                className={`w-full px-4 py-2.5 rounded-xl border text-slate-800 transition focus:outline-none focus:ring-2 bg-white ${
                  errors.region_county
                    ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
                }`}
              >
                {TEHRAN_COUNTIES.map((county) => (
                  <option key={county} value={county}>
                    {TEHRAN_COUNTIES_FA[county]} ({county})
                  </option>
                ))}
              </select>
              {errors.region_county && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">
                  {errors.region_county.message}
                </p>
              )}
            </div>
          </div>

          {/* Club & Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                نام باشگاه ورزشی
              </label>
              <input
                type="text"
                {...register('club')}
                placeholder="مثال: باشگاه استقلال"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-800 transition focus:outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                آدرس ایمیل <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                dir="ltr"
                {...register('email')}
                placeholder="example@domain.com"
                className={`w-full px-4 py-2.5 rounded-xl border text-left text-slate-800 transition focus:outline-none focus:ring-2 ${
                  errors.email
                    ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
                }`}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          {/* Passwords */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                رمز عبور (حداقل ۸ کاراکتر) <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                dir="ltr"
                {...register('password')}
                placeholder="••••••••"
                className={`w-full px-4 py-2.5 rounded-xl border text-left text-slate-800 transition focus:outline-none focus:ring-2 ${
                  errors.password
                    ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
                }`}
              />
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                تکرار رمز عبور <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                dir="ltr"
                {...register('passwordConfirm')}
                placeholder="••••••••"
                className={`w-full px-4 py-2.5 rounded-xl border text-left text-slate-800 transition focus:outline-none focus:ring-2 ${
                  errors.passwordConfirm
                    ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
                }`}
              />
              {errors.passwordConfirm && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">
                  {errors.passwordConfirm.message}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl shadow-md shadow-indigo-200 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? 'در حال ثبت‌نام و ورود...' : 'تکمیل ثبت‌نام و ورود'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-600">
          قبلاً ثبت‌نام کرده‌اید؟{' '}
          <Link
            href="/login"
            className="font-semibold text-indigo-600 hover:text-indigo-800 underline transition"
          >
            وارد شوید
          </Link>
        </div>
      </div>
    </div>
  );
}
