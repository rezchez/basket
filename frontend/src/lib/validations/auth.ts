import { z } from 'zod';

export const TEHRAN_COUNTIES = [
  'Tehran',
  'Shemiranat',
  'Rey',
  'Eslamshahr',
  'Shahriar',
  'Varamin',
  'Damavand',
  'Firoozkooh',
  'Pakdasht',
  'Pardis',
  'Qarchak',
  'Robat Karim',
  'Malard',
  'Baharestan',
  'Pishva',
  'Qods',
] as const;

export const TEHRAN_COUNTIES_FA: Record<typeof TEHRAN_COUNTIES[number], string> = {
  Tehran: 'تهران',
  Shemiranat: 'شمیرانات',
  Rey: 'ری',
  Eslamshahr: 'اسلامشهر',
  Shahriar: 'شهریار',
  Varamin: 'ورامین',
  Damavand: 'دماوند',
  Firoozkooh: 'فیروزکوه',
  Pakdasht: 'پاکدشت',
  Pardis: 'پردیس',
  Qarchak: 'قرچک',
  'Robat Karim': 'رباط کریم',
  Malard: 'ملارد',
  Baharestan: 'بهارستان',
  Pishva: 'پیشوا',
  Qods: 'قدس',
};

/**
 * Validates 10-digit Iranian National ID using MOD 11 algorithm
 */
export function validateIranianNationalId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  const trimmed = id.trim();
  if (!/^\d{10}$/.test(trimmed)) return false;

  // Check for repetitive digits like 0000000000, 1111111111, etc.
  if (/^(\d)\1{9}$/.test(trimmed)) return false;

  const check = parseInt(trimmed.charAt(9), 10);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(trimmed.charAt(i), 10) * (10 - i);
  }

  const remainder = sum % 11;

  if (remainder < 2) {
    return check === remainder;
  } else {
    return check === 11 - remainder;
  }
}

// Regex patterns
const PERSIAN_REGEX = /^[\u0600-\u06FF\s]+$/;
const ENGLISH_REGEX = /^[a-zA-Z\s]+$/;

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, { message: 'لطفاً ایمیل خود را وارد کنید.' })
      .email({ message: 'فرمت ایمیل نامعتبر است.' }),

    password: z
      .string()
      .min(8, { message: 'رمز عبور باید حداقل ۸ کاراکتر باشد.' }),

    passwordConfirm: z
      .string()
      .min(1, { message: 'لطفاً تکرار رمز عبور را وارد کنید.' }),

    gender: z.enum(['male', 'female'], {
      message: 'لطفاً جنسیت معتبر را انتخاب کنید.',
    }),

    first_name_fa: z
      .string()
      .min(1, { message: 'لطفاً نام را به فارسی وارد کنید.' })
      .regex(PERSIAN_REGEX, { message: 'نام فقط باید شامل حروف فارسی باشد.' }),

    last_name_fa: z
      .string()
      .min(1, { message: 'لطفاً نام خانوادگی را به فارسی وارد کنید.' })
      .regex(PERSIAN_REGEX, { message: 'نام خانوادگی فقط باید شامل حروف فارسی باشد.' }),

    first_name_en: z
      .string()
      .min(1, { message: 'لطفاً نام را به انگلیسی وارد کنید.' })
      .regex(ENGLISH_REGEX, { message: 'نام انگلیسی فقط باید شامل حروف انگلیسی باشد.' }),

    last_name_en: z
      .string()
      .min(1, { message: 'لطفاً نام خانوادگی را به انگلیسی وارد کنید.' })
      .regex(ENGLISH_REGEX, { message: 'نام خانوادگی انگلیسی فقط باید شامل حروف انگلیسی باشد.' }),

    national_id: z
      .string()
      .min(1, { message: 'لطفاً کد ملی را وارد کنید.' })
      .refine(validateIranianNationalId, {
        message: 'کد ملی ۱۰ رقمی وارد شده نامعتبر است.',
      }),

    region_county: z.enum(TEHRAN_COUNTIES, {
      message: 'لطفاً یکی از شهرستان‌های استان تهران را انتخاب کنید.',
    }),

    club: z.string().optional(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'رمز عبور و تکرار آن مطابقت ندارند.',
    path: ['passwordConfirm'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  identity: z
    .string()
    .min(1, { message: 'لطفاً ایمیل یا کد ملی خود را وارد کنید.' })
    .refine(
      (val) => {
        const trimmed = val.trim();
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
        const isNationalId = /^\d{10}$/.test(trimmed);
        return isEmail || isNationalId;
      },
      {
        message: 'لطفاً یک آدرس ایمیل معتبر یا کد ملی ۱۰ رقمی وارد کنید.',
      }
    ),

  password: z
    .string()
    .min(1, { message: 'لطفاً رمز عبور را وارد کنید.' }),
});

export type LoginInput = z.infer<typeof loginSchema>;
