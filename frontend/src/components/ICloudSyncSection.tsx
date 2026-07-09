import { useState } from 'react'

import { FaIcon } from './FaIcon'
import { ICloudConnectModal } from './ICloudConnectModal'
import { useIcloudDisconnect, useIcloudStatus, useIcloudSync } from '../hooks/useIcloud'
import { ApiError } from '../lib/api'

function formatWhen(value: string | null | undefined) {
  if (!value) return null
  return new Date(value).toLocaleString('ko-KR')
}

export function ICloudSyncSection() {
  const { data: status, isLoading } = useIcloudStatus()
  const disconnect = useIcloudDisconnect()
  const sync = useIcloudSync()
  const [showConnect, setShowConnect] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleSync() {
    setMessage(null)
    setError(null)
    sync.mutate(undefined, {
      onSuccess: (data) => setMessage(data.message),
      onError: (err) => {
        setError(err instanceof ApiError ? err.message : '동기화 요청에 실패했습니다.')
      },
    })
  }

  function handleDisconnect() {
    setMessage(null)
    setError(null)
    disconnect.mutate(undefined, {
      onError: (err) => {
        setError(err instanceof ApiError ? err.message : '연결 해제에 실패했습니다.')
      },
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="font-bold text-lg">iCloud 미리알림</h3>
        <p className="text-sm text-gray-500 mt-1">
          iCloud와 연결된 분류의 할일을 양방향으로 동기화합니다. 충돌 시{' '}
          <span className="font-semibold text-gray-700">최신 updated_at</span>이 우선합니다. 로컬
          변경은 {status?.auto_sync_debounce_seconds ?? 3}초 후 자동 반영되며, 백그라운드에서{' '}
          {status?.poll_interval_seconds ? Math.round(status.poll_interval_seconds / 60) : 5}분마다
          폴링합니다.
        </p>
      </div>

      <div className="rounded-[12px] border border-gray-200 bg-white p-4 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-[10px] bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
            <FaIcon name="cloud" />
          </span>
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <p className="text-sm text-gray-400">상태 확인 중...</p>
            ) : status?.connected ? (
              <>
                <p className="font-semibold text-gray-900">연결됨</p>
                <p className="text-sm text-gray-500 truncate">{status.apple_id_email}</p>
                <p className="text-sm text-gray-500 mt-1">
                  미리알림 리스트 {status.reminder_list_count ?? 0}개
                  {status.connected_at ? ` · 연결 ${formatWhen(status.connected_at)}` : ''}
                  {status.last_sync_at ? ` · 마지막 동기화 ${formatWhen(status.last_sync_at)}` : ''}
                </p>
                {status.last_sync_error && (
                  <p className="text-sm text-danger mt-1">마지막 오류: {status.last_sync_error}</p>
                )}
              </>
            ) : (
              <>
                <p className="font-semibold text-gray-900">연결되지 않음</p>
                <p className="text-sm text-gray-500">
                  Apple 로그인만으로 바로 가져오는 공개 API는 아직 없습니다. 앱 전용 암호로 CalDAV
                  연결 후 분류에 리스트를 매핑해 주세요.
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {status?.connected ? (
            <>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSync}
                disabled={sync.isPending}
              >
                {sync.isPending ? '동기화 중...' : '지금 동기화'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleDisconnect}
                disabled={disconnect.isPending}
              >
                연결 해제
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-primary" onClick={() => setShowConnect(true)}>
              iCloud 연결하기
            </button>
          )}
        </div>

        {message && <p className="text-sm text-gray-600">{message}</p>}
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>

      <div className="text-sm text-gray-500 space-y-2">
        <p className="font-semibold text-gray-700">자동 동기화</p>
        <ul className="list-disc list-inside space-y-1">
          <li>할일 생성·수정·삭제 후 {status?.auto_sync_debounce_seconds ?? 3}초 뒤 해당 분류가 동기화됩니다.</li>
          <li>
            백그라운드 폴링:{' '}
            {status?.poll_enabled === false
              ? '비활성화됨'
              : `${status?.poll_interval_seconds ?? 300}초 간격`}
          </li>
          <li>분류에 iCloud 리스트를 연결하면 즉시 동기화가 예약됩니다.</li>
        </ul>
      </div>

      {showConnect && (
        <ICloudConnectModal
          onClose={() => setShowConnect(false)}
          onConnected={(count) => setMessage(`연결되었습니다. 미리알림 리스트 ${count}개를 확인했습니다.`)}
        />
      )}
    </div>
  )
}
