'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginSchema, LoginInput } from '@/lib/validations/auth';
import { pb } from '@/lib/pocketbase';

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    setIsLoading(true);

    try {
      await pb.collection('users').authWithPassword(data.email, data.password);
      router.push('/');
      router.refresh();
    } catch (err: any) {
      console.error('Login error:', err);
      if (err?.response?.message || err?.message) {
        setServerError('ایمیل یا رمز عبور وارد شده اشتباه است.');
      } else {
        setServerError('خطایی در برقراری ارتباط با سرور رخ داده است.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            ورود به سامانه ورزشکاران
          </h1>
          <p className="text-sm text-slate-500">
            برای دسترسی به حساب کاربری خود، اطلاعات ورود را وارد کنید.
          </p>
        </div>

        {serverError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
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

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              رمز عبور <span className="text-red-500">*</span>
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl shadow-md shadow-indigo-200 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? 'در حال ورود...' : 'ورود به حساب'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-600">
          حساب کاربری ندارید؟{' '}
          <Link
            href="/register"
            className="font-semibold text-indigo-600 hover:text-indigo-800 underline transition"
          >
            ثبت‌نام کنید
          </Link>
        </div>
      </div>
    </div>
  );
}
