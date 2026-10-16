'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, AlertTriangle, Loader2 } from 'lucide-react';
import { pb } from '@/lib/pocketbase';
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
import { Button } from '@/components/ui/button';

export default function LogoutButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirm = async () => {
    setIsLoggingOut(true);
    try {
      pb.authStore.clear();
      setIsOpen(false);
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          className="px-6 py-3 h-auto text-sm font-semibold rounded-2xl shadow-md shadow-red-200 transition duration-150 cursor-pointer self-start md:self-auto gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>خروج از حساب</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md p-6 text-right" dir="rtl">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-3">
          <div className="p-3 bg-red-100/80 text-red-600 rounded-2xl shrink-0 flex items-center justify-center ring-8 ring-red-50">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>

          <DialogHeader className="text-center sm:text-right space-y-1.5 flex-1">
            <DialogTitle className="text-xl font-bold text-slate-800">
              خروج از حساب کاربری
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600 leading-relaxed">
              آیا از خروج از حساب کاربری خود مطمئن هستید؟ برای دسترسی مجدد نیاز به ورود با مشخصات خود خواهید داشت.
            </DialogDescription>
          </DialogHeader>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2.5 sm:justify-end mt-4 pt-4 border-t border-slate-100">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              disabled={isLoggingOut}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              انصراف
            </Button>
          </DialogClose>

          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoggingOut}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-200 gap-2"
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>در حال خروج...</span>
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                <span>بله، خارج شو</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
