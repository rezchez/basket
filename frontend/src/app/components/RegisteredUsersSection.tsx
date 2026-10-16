'use client';

import { useEffect, useState, useMemo } from 'react';
import { pb } from '@/lib/pocketbase';
import {
  Roles,
  RoleValue,
  ALL_ROLES,
  formatRoleLabel,
  getRoleBadgeStyle,
  isSeniorManager,
} from '@/lib/roles';
import { TEHRAN_COUNTIES_FA } from '@/lib/validations/auth';
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  Eye,
  Edit3,
  Loader2,
  RefreshCw,
  Building2,
  Briefcase,
  Dumbbell,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatShamsiDateDisplay } from '@/app/components/ShamsiDatePicker';
import AthleteDocumentsSection, { getDocumentUrl } from '@/app/components/AthleteDocumentsSection';
import { getDocumentApprovalStatus, getDocumentStatusInfo } from '@/lib/documents';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

export interface UserRecord {
  id: string;
  email: string;
  first_name_fa: string;
  last_name_fa: string;
  first_name_en?: string;
  last_name_en?: string;
  gender?: 'male' | 'female';
  national_id?: string;
  region_county?: string;
  club?: string;
  role?: string;
  team_name?: string;
  birth_date?: string;
  avatar?: string;
  birth_certificate_photo?: string;
  national_card_front?: string;
  national_card_back?: string;
  documents_status?: string;
  documents_reviewed_at?: string;
  documents_reviewer_name?: string;
  documents_reject_reason?: string;
  created?: string;
}

interface RegisteredUsersSectionProps {
  currentUser: any;
}

export default function RegisteredUsersSection({ currentUser }: RegisteredUsersSectionProps) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [docFilter, setDocFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Modals state
  const [detailUser, setDetailUser] = useState<UserRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleValue>(Roles.ATHLETE);
  const [selectedTeamName, setSelectedTeamName] = useState('');
  const [savingRole, setSavingRole] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const canManageRoles = isSeniorManager(currentUser);
  const canReviewDocs = isSeniorManager(currentUser) || currentUser?.role === Roles.BOARD_CHAIR;

  const fetchUsers = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const records = await pb.collection('users').getFullList<UserRecord>({
        sort: '-created',
      });
      setUsers(records);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
      if (isManualRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtered users calculation
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role filter
      if (roleFilter !== 'all') {
        const uRole = u.role || Roles.ATHLETE;
        if (uRole !== roleFilter) return false;
      }

      // Document approval status filter
      if (docFilter !== 'all') {
        const docStatus = getDocumentApprovalStatus(u);
        if (docStatus !== docFilter) return false;
      }

      // Search term filter
      if (!searchTerm.trim()) return true;
      const term = searchTerm.trim().toLowerCase();
      const fullNameFa = `${u.first_name_fa || ''} ${u.last_name_fa || ''}`.toLowerCase();
      const fullNameEn = `${u.first_name_en || ''} ${u.last_name_en || ''}`.toLowerCase();
      const nationalId = (u.national_id || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const club = (u.club || '').toLowerCase();
      const teamName = (u.team_name || '').toLowerCase();
      const county = (TEHRAN_COUNTIES_FA[u.region_county as keyof typeof TEHRAN_COUNTIES_FA] || u.region_county || '').toLowerCase();

      return (
        fullNameFa.includes(term) ||
        fullNameEn.includes(term) ||
        nationalId.includes(term) ||
        email.includes(term) ||
        club.includes(term) ||
        teamName.includes(term) ||
        county.includes(term)
      );
    });
  }, [users, searchTerm, roleFilter, docFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = users.length;
    let athletes = 0;
    let superManagers = 0;
    let boardChairs = 0;
    let committeeChairs = 0;
    let teamManagers = 0;
    let pendingDocs = 0;

    users.forEach((u) => {
      const r = u.role || Roles.ATHLETE;
      if (r === Roles.ATHLETE) athletes++;
      else if (r === Roles.MANAGER_SUPER) superManagers++;
      else if (r === Roles.BOARD_CHAIR) boardChairs++;
      else if (r === Roles.COMMITTEE_CHAIR) committeeChairs++;
      else if (r === Roles.TEAM_MANAGER) teamManagers++;

      if (r !== Roles.MANAGER_SUPER && r !== Roles.BOARD_CHAIR) {
        if (getDocumentApprovalStatus(u) === 'pending') {
          pendingDocs++;
        }
      }
    });

    return { total, athletes, superManagers, boardChairs, committeeChairs, teamManagers, pendingDocs };
  }, [users]);

  // Open Details Modal
  const handleOpenDetail = (user: UserRecord) => {
    setDetailUser(user);
    setIsDetailOpen(true);
  };

  // Open Edit Role Modal (Only for Senior Manager)
  const handleOpenEdit = (user: UserRecord) => {
    setEditUser(user);
    setSelectedRole((user.role as RoleValue) || Roles.ATHLETE);
    setSelectedTeamName(user.team_name || '');
    setFeedbackMessage(null);
    setIsEditOpen(true);
  };

  // Save Role Changes
  const handleSaveRole = async () => {
    if (!editUser) return;
    setSavingRole(true);
    setFeedbackMessage(null);

    try {
      const payload: { role: string; team_name: string } = {
        role: selectedRole,
        team_name: selectedRole === Roles.TEAM_MANAGER ? selectedTeamName.trim() : '',
      };

      await pb.collection('users').update(editUser.id, payload);

      setFeedbackMessage({
        type: 'success',
        text: `نقش کاربر «${editUser.first_name_fa} ${editUser.last_name_fa}» با موفقیت به «${formatRoleLabel(
          selectedRole,
          payload.team_name
        )}» تغییر یافت.`,
      });

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editUser.id
            ? { ...u, role: selectedRole, team_name: payload.team_name }
            : u
        )
      );

      setTimeout(() => {
        setIsEditOpen(false);
      }, 1200);
    } catch (err: any) {
      console.error('Error updating role:', err);
      setFeedbackMessage({
        type: 'error',
        text: err?.message || 'خطا در ذخیره‌سازی نقش کاربر. لطفاً مجدداً تلاش کنید.',
      });
    } finally {
      setSavingRole(false);
    }
  };

  return (
    <div className="mt-12 bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md ring-1 ring-white/20">
              <Users className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                <span>کاربران ثبت‌نام شده</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-medium font-mono">
                  {users.length} کاربر
                </span>
              </h2>
              <p className="text-slate-400 text-xs md:text-sm mt-0.5">
                فهرست تمامی ورزشکاران و اعضای ثبت‌نام شده در سامانه مدیریت بسکتبال
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {canManageRoles && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-200 border border-purple-400/30 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-purple-300" />
                <span>دسترسی: مدیر ارشد (رضا چگینی)</span>
              </span>
            )}
            <button
              onClick={() => fetchUsers(true)}
              disabled={refreshing}
              title="تازه‌سازی لیست"
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="block text-[11px] text-slate-400 font-medium mb-1">ورزشکاران</span>
            <span className="text-lg font-bold text-emerald-400">{stats.athletes} نفر</span>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="block text-[11px] text-slate-400 font-medium mb-1">مدیران ارشد</span>
            <span className="text-lg font-bold text-purple-400">{stats.superManagers} نفر</span>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="block text-[11px] text-slate-400 font-medium mb-1">روسای هیئت</span>
            <span className="text-lg font-bold text-blue-400">{stats.boardChairs} نفر</span>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="block text-[11px] text-slate-400 font-medium mb-1">روسای کمیته</span>
            <span className="text-lg font-bold text-teal-400">{stats.committeeChairs} نفر</span>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="block text-[11px] text-slate-400 font-medium mb-1">مدیران تیم</span>
            <span className="text-lg font-bold text-amber-400">{stats.teamManagers} نفر</span>
          </div>
          <div
            onClick={() => setDocFilter(docFilter === 'pending' ? 'all' : 'pending')}
            title="فیلتر بر اساس مدارک در انتظار بررسی"
            className={`rounded-2xl p-3 border transition cursor-pointer ${
              docFilter === 'pending'
                ? 'bg-amber-500/25 border-amber-400 ring-2 ring-amber-400'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <span className="block text-[11px] text-amber-300 font-medium mb-1 flex items-center justify-between">
              <span>در انتظار تایید مدارک</span>
              {stats.pendingDocs > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </span>
            <span className="text-lg font-bold text-amber-400">{stats.pendingDocs} نفر</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/70 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو بر اساس نام، کد ملی، ایمیل، باشگاه، شهر..."
            className="w-full pr-10 pl-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
        </div>

        {/* Filters Group (Roles + Document Status) */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Document Status Filter */}
          <div className="inline-flex rounded-xl p-1 bg-white border border-slate-200 shadow-sm shrink-0">
            <button
              type="button"
              onClick={() => setDocFilter('all')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                docFilter === 'all'
                  ? 'bg-slate-900 text-white shadow'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              همه مدارک
            </button>
            <button
              type="button"
              onClick={() => setDocFilter('pending')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                docFilter === 'pending'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>در انتظار تایید ({stats.pendingDocs})</span>
            </button>
            <button
              type="button"
              onClick={() => setDocFilter('approved')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                docFilter === 'approved'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              تایید شده
            </button>
          </div>

          {/* Role Filter Tabs */}
          <div className="inline-flex rounded-xl p-1 bg-white border border-slate-200 shadow-sm shrink-0 overflow-x-auto">
            <button
              type="button"
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                roleFilter === 'all'
                  ? 'bg-slate-900 text-white shadow'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              همه ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter(Roles.ATHLETE)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                roleFilter === Roles.ATHLETE
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-100'
              }`}
            >
              ورزشکار ({stats.athletes})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter(Roles.TEAM_MANAGER)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                roleFilter === Roles.TEAM_MANAGER
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-600 hover:text-amber-700 hover:bg-slate-100'
              }`}
            >
              مدیر تیم ({stats.teamManagers})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter(Roles.BOARD_CHAIR)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                roleFilter === Roles.BOARD_CHAIR
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-600 hover:text-blue-700 hover:bg-slate-100'
              }`}
            >
              رییس هیئت ({stats.boardChairs})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter(Roles.COMMITTEE_CHAIR)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                roleFilter === Roles.COMMITTEE_CHAIR
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-slate-600 hover:text-teal-700 hover:bg-slate-100'
              }`}
            >
              رییس کمیته ({stats.committeeChairs})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter(Roles.MANAGER_SUPER)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                roleFilter === Roles.MANAGER_SUPER
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-600 hover:text-purple-700 hover:bg-slate-100'
              }`}
            >
              مدیر ارشد ({stats.superManagers})
            </button>
          </div>
        </div>
      </div>

      {/* Users Table / Grid */}
      <div className="p-6">
        {loading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="text-sm font-medium">در حال بارگذاری اطلاعات کاربران...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700">هیچ کاربری با مشخصات مورد نظر یافت نشد.</p>
            <p className="text-xs text-slate-400 mt-1">می‌توانید کلمه جستجو یا فیلتر نقش را تغییر دهید.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="pb-3.5 pr-2 font-medium">کاربر</th>
                  <th className="pb-3.5 px-3 font-medium">نقش سازمانی</th>
                  <th className="pb-3.5 px-3 font-medium">کد ملی</th>
                  <th className="pb-3.5 px-3 font-medium">شهرستان / باشگاه</th>
                  <th className="pb-3.5 px-3 font-medium">وضعیت مدارک</th>
                  <th className="pb-3.5 px-3 font-medium">ایمیل</th>
                  <th className="pb-3.5 pl-2 font-medium text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredUsers.map((user) => {
                  const roleLabel = formatRoleLabel(user.role, user.team_name);
                  const badgeStyle = getRoleBadgeStyle(user.role);
                  const isCurrentReza =
                    user.role === Roles.MANAGER_SUPER ||
                    (user.first_name_fa === 'رضا' && user.last_name_fa === 'چگینی');

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Name & Avatar */}
                      <td className="py-4 pr-2">
                        <div className="flex items-center gap-3">
                          {getDocumentUrl(user, 'avatar') ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={getDocumentUrl(user, 'avatar')!}
                              alt="عکس کاربر"
                              className="w-10 h-10 rounded-2xl object-cover shrink-0 shadow-sm border border-slate-200"
                            />
                          ) : (
                            <div
                              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${
                                isCurrentReza
                                  ? 'bg-purple-700 text-white ring-2 ring-purple-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {`${user.first_name_fa?.[0] || ''}${user.last_name_fa?.[0] || ''}`}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                              <span>
                                {user.first_name_fa} {user.last_name_fa}
                              </span>
                              {isCurrentReza && (
                                <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md font-bold border border-purple-200">
                                  مدیر ارشد
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 dir-ltr text-right">
                              {user.first_name_en} {user.last_name_en}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-4 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${badgeStyle.badgeClass}`}
                        >
                          {user.role === Roles.MANAGER_SUPER && <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />}
                          {user.role === Roles.BOARD_CHAIR && <Building2 className="w-3 h-3 text-blue-600" />}
                          {user.role === Roles.COMMITTEE_CHAIR && <Briefcase className="w-3 h-3 text-teal-600" />}
                          {user.role === Roles.TEAM_MANAGER && <Users className="w-3 h-3 text-amber-600" />}
                          {(!user.role || user.role === Roles.ATHLETE) && (
                            <Dumbbell className="w-3 h-3 text-emerald-600" />
                          )}
                          <span>{roleLabel}</span>
                        </span>
                      </td>

                      {/* National ID */}
                      <td className="py-4 px-3">
                        <span className="font-mono text-xs font-semibold text-slate-700 dir-ltr inline-block">
                          {user.national_id || '—'}
                        </span>
                      </td>

                      {/* County / Club */}
                      <td className="py-4 px-3">
                        {user.role === Roles.MANAGER_SUPER || user.role === Roles.BOARD_CHAIR ? (
                          <span className="text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md font-semibold border border-purple-200">
                            سراسری استان تهران
                          </span>
                        ) : (
                          <>
                            <div className="text-xs text-slate-800 font-medium">
                              {TEHRAN_COUNTIES_FA[user.region_county as keyof typeof TEHRAN_COUNTIES_FA] ||
                                user.region_county ||
                                '—'}
                            </div>
                            {user.club && (
                              <div className="text-[11px] text-slate-400">{user.club}</div>
                            )}
                          </>
                        )}
                      </td>

                      {/* Document Approval Status */}
                      <td className="py-4 px-3">
                        {user.role === Roles.MANAGER_SUPER || user.role === Roles.BOARD_CHAIR ? (
                          <span className="text-[11px] text-slate-400 font-medium">عدم نیاز</span>
                        ) : (
                          (() => {
                            const docInfo = getDocumentStatusInfo(user);
                            const DocIcon = docInfo.icon;
                            return (
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${docInfo.badgeClass}`}
                              >
                                <DocIcon className="w-3 h-3" />
                                <span>{docInfo.label}</span>
                              </span>
                            );
                          })()
                        )}
                      </td>

                      {/* Email */}
                      <td className="py-4 px-3">
                        <span className="text-xs text-slate-600 dir-ltr block text-right font-mono">
                          {user.email}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 pl-2 text-left">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(user)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                            title="مشاهده اطلاعات کامل"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">جزئیات</span>
                          </button>

                          {canManageRoles && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(user)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200 transition cursor-pointer"
                              title="تغییر نقش کاربر"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">تغییر نقش</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-2xl p-6 text-right max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader className="mb-4 text-right">
            <div className="flex items-center gap-3">
              {detailUser && getDocumentUrl(detailUser, 'avatar') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={getDocumentUrl(detailUser, 'avatar')!}
                  alt="عکس پرسنلی"
                  className="w-12 h-12 rounded-2xl object-cover ring-4 ring-indigo-50 shadow-sm border border-slate-200"
                />
              ) : (
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl ring-8 ring-indigo-50/50">
                  <Users className="w-6 h-6 text-indigo-600" />
                </div>
              )}
              <div>
                <DialogTitle className="text-xl font-bold text-slate-800">
                  شناسنامه و مشخصات کاربر
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  اطلاعات کامل ثبت شده در سامانه مدیریت ورزشکاران
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {detailUser && (
            <div className="space-y-4 my-2 text-sm">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-xs text-slate-400 block mb-0.5">نام و نام خانوادگی</span>
                  <span className="font-bold text-base text-slate-800">
                    {detailUser.first_name_fa} {detailUser.last_name_fa}
                  </span>
                  <span className="text-xs text-slate-400 block dir-ltr text-right mt-0.5">
                    {detailUser.first_name_en} {detailUser.last_name_en}
                  </span>
                </div>
                <div className="text-left">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                      getRoleBadgeStyle(detailUser.role).badgeClass
                    }`}
                  >
                    {formatRoleLabel(detailUser.role, detailUser.team_name)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-400 block mb-1">کد ملی</span>
                  <span className="font-mono font-bold text-slate-800 dir-ltr block text-right">
                    {detailUser.national_id || 'ثبت نشده'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-400 block mb-1">جنسیت</span>
                  <span className="font-bold text-slate-800">
                    {detailUser.gender === 'male' ? 'مرد' : 'زن'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-400 block mb-1">تاریخ تولد (هجری شمسی)</span>
                  <span className="font-bold text-slate-800">
                    {formatShamsiDateDisplay(detailUser.birth_date)}
                  </span>
                </div>

                {detailUser.role !== Roles.MANAGER_SUPER && detailUser.role !== Roles.BOARD_CHAIR && (
                  <>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-xs text-slate-400 block mb-1">شهرستان استان تهران</span>
                      <span className="font-bold text-slate-800">
                        {TEHRAN_COUNTIES_FA[detailUser.region_county as keyof typeof TEHRAN_COUNTIES_FA] ||
                          detailUser.region_county ||
                          '—'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-xs text-slate-400 block mb-1">باشگاه ورزشی</span>
                      <span className="font-bold text-slate-800">{detailUser.club || 'ثبت نشده'}</span>
                    </div>
                  </>
                )}

                {detailUser.role === Roles.TEAM_MANAGER && (
                  <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 col-span-2">
                    <span className="text-xs text-amber-700 block mb-1 font-medium">نام تیم ورزشی تحت مدیریت</span>
                    <span className="font-bold text-amber-900">{detailUser.team_name || 'مشخص نشده'}</span>
                  </div>
                )}

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 col-span-2">
                  <span className="text-xs text-slate-400 block mb-1">پست الکترونیک (ایمیل)</span>
                  <span className="font-mono text-slate-800 dir-ltr block text-right">
                    {detailUser.email}
                  </span>
                </div>

                {/* ATHLETE IDENTIFICATION & PERSONAL DOCUMENTS */}
                {detailUser.role !== Roles.MANAGER_SUPER && detailUser.role !== Roles.BOARD_CHAIR && (
                  <div className="pt-4 border-t border-slate-200/80 col-span-2">
                    <AthleteDocumentsSection
                      user={detailUser}
                      editable={canReviewDocs}
                      onUpdate={(updated) => {
                        setDetailUser(updated);
                        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 pt-4 border-t border-slate-100">
            <DialogClose asChild>
              <Button variant="outline" className="w-full rounded-xl">
                بستن
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT ROLE MODAL (SENIOR MANAGER ONLY) */}
      {canManageRoles && (
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-md p-6 text-right" dir="rtl">
            <DialogHeader className="mb-4 text-right">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl ring-8 ring-purple-50">
                  <ShieldCheck className="w-6 h-6 text-purple-700" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-slate-800">
                    تغییر نقش و سطح دسترسی
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    مدیریت سطح سازمانی کاربر در سامانه بسکتبال
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {editUser && (
              <div className="space-y-4 my-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm">
                  <span className="text-xs text-slate-400 block mb-0.5">کاربر انتخاب شده:</span>
                  <span className="font-bold text-slate-800">
                    {editUser.first_name_fa} {editUser.last_name_fa}
                  </span>{' '}
                  <span className="text-xs text-slate-500 font-mono dir-ltr inline-block">
                    ({editUser.email})
                  </span>
                </div>

                {/* Role Selector */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    انتخاب نقش جدید:
                  </label>
                  <div className="space-y-2">
                    {ALL_ROLES.map((r) => {
                      const isSelected = selectedRole === r;
                      return (
                        <label
                          key={r}
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="radio"
                              name="user_role"
                              value={r}
                              checked={isSelected}
                              onChange={() => setSelectedRole(r)}
                              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                            />
                            <span className="text-sm font-bold text-slate-800">{r}</span>
                          </div>
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                              getRoleBadgeStyle(r).badgeClass
                            }`}
                          >
                            {r}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Team Name Input (Shown when Role is TEAM_MANAGER) */}
                {selectedRole === Roles.TEAM_MANAGER && (
                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl animate-in fade-in duration-200">
                    <label className="block text-sm font-bold text-amber-900 mb-1.5">
                      نام تیم ورزشی <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={selectedTeamName}
                      onChange={(e) => setSelectedTeamName(e.target.value)}
                      placeholder="مثال: تیم مهرام، تیم نفت تهران، ..."
                      className="w-full px-4 py-2.5 rounded-xl border border-amber-300 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                    <p className="text-[11px] text-amber-700 mt-1.5">
                      عنوان نمایشی کاربر به صورت «مدیر تیم ({selectedTeamName || 'نام تیم'})» ذخیره خواهد شد.
                    </p>
                  </div>
                )}

                {/* Feedback Alert */}
                {feedbackMessage && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      feedbackMessage.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    {feedbackMessage.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span>{feedbackMessage.text}</span>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
              <DialogClose asChild>
                <Button variant="outline" disabled={savingRole} className="rounded-xl">
                  انصراف
                </Button>
              </DialogClose>
              <Button
                type="button"
                onClick={handleSaveRole}
                disabled={savingRole || (selectedRole === Roles.TEAM_MANAGER && !selectedTeamName.trim())}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-1.5"
              >
                {savingRole ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>در حال ذخیره...</span>
                  </>
                ) : (
                  <span>ذخیره تغییرات نقش</span>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
