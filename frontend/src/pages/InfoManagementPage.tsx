import { InfoPageLayout } from '../components/InfoPageLayout'
import { PageShell } from '../components/PageShell'

export function InfoManagementPage() {
  return (
    <PageShell>
      <InfoPageLayout
        highlight="기록하지 않으면 기억은 사라진다"
        columns={[
          { title: '계정', items: [{ icon: '🔑', label: '비밀번호 관리' }, { icon: '📧', label: '이메일 계정' }] },
          { title: '문서', items: [{ icon: '📄', label: '중요 서류' }, { icon: '🏥', label: '건강 기록' }] },
        ]}
      />
    </PageShell>
  )
}
