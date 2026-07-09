import { useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import clsx from 'clsx'

import { FaIcon } from './FaIcon'
import { ICloudSyncSection } from './ICloudSyncSection'
import { MenuManagementSection } from './MenuManagementSection'
import { VersionBadge } from './VersionBadge'
import { useChangePassword, useLogout, useUpdateAvatar } from '../hooks/useAuth'
import { useUploadAvatar } from '../hooks/useUploads'
import { useVersion } from '../hooks/useVersion'
import { ApiError } from '../lib/api'
import { MAX_COLUMNS, MIN_COLUMNS, useSettingsStore } from '../store/settings'
import { useAuthStore } from '../store/auth'
import { useThemeStore, type ThemeMode } from '../store/theme'

export type SettingsSection = 'task' | 'integrations' | 'user' | 'system' | 'menu'

const SECTIONS: { id: SettingsSection; label: string; icon: string }[] = [
  { id: 'task', label: '작업', icon: 'folder-open' },
  { id: 'integrations', label: '연동', icon: 'cloud' },
  { id: 'menu', label: '메뉴 관리', icon: 'bars' },
  { id: 'user', label: '사용자', icon: 'circle-user' },
  { id: 'system', label: '시스템 설정', icon: 'sliders' },
]

const THEME_OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: 'system', label: '시스템' },
  { mode: 'light', label: '라이트' },
  { mode: 'dark', label: '다크' },
]

function TaskSection() {
  const taskColumns = useSettingsStore((s) => s.taskColumns)
  const setTaskColumns = useSettingsStore((s) => s.setTaskColumns)
  const columnOptions = Array.from({ length: MAX_COLUMNS - MIN_COLUMNS + 1 }, (_, i) => MIN_COLUMNS + i)

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-bold text-base">작업 현황 레이아웃 열 개수</h3>
      <p className="text-xs text-gray-500">
        대시보드와 작업 관리 페이지에서 작업 현황을 몇 열로 표시할지 정합니다. 모바일에서는 항상 1열로
        표시됩니다.
      </p>
      <div className="flex gap-2 mt-1">
        {columnOptions.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setTaskColumns(n)}
            className={clsx(
              'w-10 h-10 rounded-[10px] text-sm font-bold border',
              taskColumns === n
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100',
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

function UserSection() {
  const username = useAuthStore((s) => s.username)
  const avatarUrl = useAuthStore((s) => s.avatarUrl)
  const uploadAvatar = useUploadAvatar()
  const updateAvatar = useUpdateAvatar()
  const changePassword = useChangePassword()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setAvatarError(null)
    try {
      const { url } = await uploadAvatar.mutateAsync(file)
      updateAvatar.mutate(url)
    } catch (err) {
      setAvatarError(err instanceof ApiError ? err.message : '이미지 업로드에 실패했습니다.')
    }
  }

  function submitPassword(e: FormEvent) {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(false)
    if (newPassword !== confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.')
      return
    }
    changePassword.mutate(
      { current_password: currentPassword, new_password: newPassword },
      {
        onSuccess: () => {
          setPasswordSuccess(true)
          setCurrentPassword('')
          setNewPassword('')
          setConfirmPassword('')
        },
        onError: (err) => {
          setPasswordError(err instanceof ApiError ? err.message : '비밀번호 변경에 실패했습니다.')
        },
      },
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h3 className="font-bold text-base">프로필 이미지</h3>
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 shrink-0 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xl overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <FaIcon name="circle-user" />
            )}
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadAvatar.isPending}
          >
            {uploadAvatar.isPending ? '업로드 중...' : '사진 업로드'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        {avatarError && <p className="text-xs text-danger">{avatarError}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="font-bold text-base">아이디</h3>
        <p className="text-sm text-gray-700">{username}</p>
      </div>

      <form onSubmit={submitPassword} className="flex flex-col gap-2">
        <h3 className="font-bold text-base">비밀번호 변경</h3>
        <input
          type="password"
          className="input"
          placeholder="현재 비밀번호"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        <input
          type="password"
          className="input"
          placeholder="새 비밀번호"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          minLength={4}
          required
        />
        <input
          type="password"
          className="input"
          placeholder="새 비밀번호 확인"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          minLength={4}
          required
        />
        {passwordError && <p className="text-xs text-danger">{passwordError}</p>}
        {passwordSuccess && <p className="text-xs text-success">비밀번호가 변경되었습니다.</p>}
        <button type="submit" className="btn btn-primary btn-sm self-start" disabled={changePassword.isPending}>
          {changePassword.isPending ? '변경 중...' : '비밀번호 변경'}
        </button>
      </form>
    </div>
  )
}

function SystemSection() {
  const mode = useThemeStore((s) => s.mode)
  const setMode = useThemeStore((s) => s.setMode)
  const { data: version } = useVersion()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h3 className="font-bold text-base">테마</h3>
        <div className="flex gap-2">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.mode}
              type="button"
              onClick={() => setMode(opt.mode)}
              className={clsx(
                'px-3 h-9 rounded-[10px] text-sm font-semibold border',
                mode === opt.mode
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="font-bold text-base">버전 정보</h3>
        {version ? (
          <div className="flex flex-col gap-1.5">
            <VersionBadge />
            <p className="text-sm text-gray-700">
              버전 {version.version} ({version.mode === 'dev' ? 'Dev' : 'Prod'})
            </p>
            <p className="text-xs text-gray-500">커밋 {version.gitCommit}</p>
          </div>
        ) : (
          <p className="text-xs text-gray-400">불러오는 중...</p>
        )}
      </div>
    </div>
  )
}

function sectionLabel(id: SettingsSection) {
  return SECTIONS.find((s) => s.id === id)?.label ?? '설정'
}

function SectionContent({ section }: { section: SettingsSection }) {
  switch (section) {
    case 'task':
      return <TaskSection />
    case 'integrations':
      return <ICloudSyncSection />
    case 'menu':
      return <MenuManagementSection />
    case 'user':
      return <UserSection />
    case 'system':
      return <SystemSection />
  }
}

export function SettingsModal({
  onClose,
  initialSection = 'task',
}: {
  onClose: () => void
  initialSection?: SettingsSection
}) {
  const [section, setSection] = useState<SettingsSection>(initialSection)
  const [mobilePanel, setMobilePanel] = useState<'menu' | 'content'>('menu')
  const logout = useLogout()

  function openSection(id: SettingsSection) {
    setSection(id)
    setMobilePanel('content')
  }

  return (
    <div
      className="fixed inset-0 z-40 flex bg-black/40 lg:items-center lg:justify-center lg:p-4"
      onClick={onClose}
    >
      <div
        className="card w-full h-full lg:h-[min(760px,90vh)] lg:max-w-6xl flex flex-col overflow-hidden shadow-xl lg:rounded-[14px] rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모바일 헤더 */}
        <div className="lg:hidden flex items-center gap-2 px-4 py-3 border-b border-gray-200 shrink-0">
          {mobilePanel === 'content' ? (
            <button
              type="button"
              className="w-9 h-9 -ml-1 rounded-[10px] flex items-center justify-center text-gray-600 hover:bg-gray-100"
              onClick={() => setMobilePanel('menu')}
              aria-label="설정 메뉴로"
            >
              <FaIcon name="chevron-left" />
            </button>
          ) : null}
          <h2 className="flex-1 text-base font-bold truncate">
            {mobilePanel === 'menu' ? '설정' : sectionLabel(section)}
          </h2>
          <button
            type="button"
            className="text-sm font-semibold text-gray-500 hover:text-gray-800 px-2 py-1"
            onClick={onClose}
          >
            닫기
          </button>
        </div>

        {/* 데스크탑 헤더 */}
        <div className="hidden lg:flex items-center justify-between px-5 py-3 border-b border-gray-200 shrink-0">
          <h2 className="text-base font-bold">설정</h2>
          <button
            type="button"
            className="text-sm font-semibold text-gray-500 hover:text-gray-800"
            onClick={onClose}
          >
            닫기
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* 데스크탑 사이드 네비 */}
          <nav className="hidden lg:flex w-44 shrink-0 border-r border-gray-200 p-2.5 flex-col gap-0.5">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSection(s.id)}
                className={clsx(
                  'flex items-center gap-2 px-2.5 py-2 rounded-[10px] text-sm font-semibold text-left',
                  section === s.id ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50',
                )}
              >
                <span className="w-4 h-4 shrink-0 flex items-center justify-center text-sm leading-none">
                  <FaIcon name={s.icon} />
                </span>
                {s.label}
              </button>
            ))}

            <button
              type="button"
              className="mt-auto flex items-center gap-2 px-2.5 py-2 rounded-[10px] text-sm font-semibold text-left text-danger hover:bg-gray-50"
              onClick={() => logout.mutate()}
            >
              <span className="w-4 h-4 shrink-0 flex items-center justify-center text-sm leading-none">
                <FaIcon name="arrow-right-from-bracket" />
              </span>
              로그아웃
            </button>
          </nav>

          {/* 모바일: 섹션 목록 */}
          {mobilePanel === 'menu' && (
            <div className="lg:hidden flex-1 min-h-0 overflow-y-auto flex flex-col">
              <div className="flex flex-col gap-1 p-3">
                {SECTIONS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => openSection(s.id)}
                    className="flex items-center gap-3 px-3 py-3.5 rounded-[12px] text-left hover:bg-gray-50 active:bg-gray-100"
                  >
                    <span className="w-9 h-9 rounded-[10px] bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                      <FaIcon name={s.icon} />
                    </span>
                    <span className="flex-1 font-semibold text-gray-900">{s.label}</span>
                    <FaIcon name="chevron-right" className="text-gray-300 shrink-0" />
                  </button>
                ))}
              </div>
              <div className="mt-auto p-3 border-t border-gray-100">
                <button
                  type="button"
                  className="flex items-center gap-3 w-full px-3 py-3.5 rounded-[12px] text-left text-danger hover:bg-gray-50"
                  onClick={() => logout.mutate()}
                >
                  <span className="w-9 h-9 rounded-[10px] bg-red-50 flex items-center justify-center shrink-0">
                    <FaIcon name="arrow-right-from-bracket" />
                  </span>
                  <span className="font-semibold">로그아웃</span>
                </button>
              </div>
            </div>
          )}

          {/* 모바일: 섹션 내용 */}
          <div
            className={clsx(
              'flex-1 min-w-0 overflow-y-auto p-4 lg:p-5',
              mobilePanel === 'menu' && 'hidden lg:block',
            )}
          >
            <SectionContent section={section} />
          </div>
        </div>
      </div>
    </div>
  )
}
