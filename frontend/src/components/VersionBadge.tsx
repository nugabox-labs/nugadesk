import { useVersion } from '../hooks/useVersion'

export function VersionBadge() {
  const { data } = useVersion()
  if (!data) return null

  const isDev = data.mode === 'dev'
  const label = isDev ? `${data.version} Dev` : data.version

  return (
    <span
      className="badge"
      style={{
        backgroundColor: isDev ? '#d32f2f' : '#111111',
        color: '#ffffff',
      }}
      title={`git ${data.gitCommit}`}
    >
      {label}
    </span>
  )
}
