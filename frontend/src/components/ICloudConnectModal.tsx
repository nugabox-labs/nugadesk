import { useState } from 'react'
import type { FormEvent } from 'react'

import { FaIcon } from './FaIcon'
import { useIcloudConnect } from '../hooks/useIcloud'
import { ApiError } from '../lib/api'

export function ICloudConnectModal({
  onClose,
  onConnected,
}: {
  onClose: () => void
  onConnected?: (listCount: number) => void
}) {
  const connect = useIcloudConnect()
  const [appleId, setAppleId] = useState('')
  const [appPassword, setAppPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    connect.mutate(
      { apple_id_email: appleId.trim(), app_specific_password: appPassword },
      {
        onSuccess: (data) => {
          onConnected?.(data.reminder_lists.length)
          onClose()
        },
        onError: (err) => {
          setError(err instanceof ApiError ? err.message : 'iCloud 연결에 실패했습니다.')
        },
      },
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="card w-full max-w-lg shadow-xl flex flex-col gap-5 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold">iCloud 미리알림 연결</h3>
            <p className="text-sm text-gray-500 mt-1">
              Apple은 웹 앱용 미리알림 OAuth를 아직 공개하지 않아, 1단계에서는 앱 전용 암호로 CalDAV
              연결을 확인합니다.
            </p>
          </div>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-700 shrink-0"
            onClick={onClose}
            aria-label="닫기"
          >
            <FaIcon name="xmark" />
          </button>
        </div>

        <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1.5 bg-gray-50 rounded-[10px] p-4">
          <li>
            <a
              href="https://account.apple.com/account/manage"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              Apple 계정 관리
            </a>
            에서 앱 전용 암호를 생성합니다.
          </li>
          <li>Apple ID(이메일)와 생성한 16자리 암호를 아래에 입력합니다.</li>
          <li>연결되면 미리알림 리스트 목록을 확인한 뒤, 다음 단계에서 동기화를 구현합니다.</li>
        </ol>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700" htmlFor="icloud-apple-id">
              Apple ID (이메일)
            </label>
            <input
              id="icloud-apple-id"
              type="email"
              className="input"
              placeholder="name@icloud.com"
              value={appleId}
              onChange={(e) => setAppleId(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700" htmlFor="icloud-app-password">
              앱 전용 암호
            </label>
            <input
              id="icloud-app-password"
              type="password"
              className="input"
              placeholder="xxxx-xxxx-xxxx-xxxx"
              value={appPassword}
              onChange={(e) => setAppPassword(e.target.value)}
              autoComplete="off"
              required
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="btn btn-primary" disabled={connect.isPending}>
              {connect.isPending ? '연결 확인 중...' : '연결하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
