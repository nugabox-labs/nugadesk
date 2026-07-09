import { InfoPageLayout } from '../components/InfoPageLayout'
import { PageShell } from '../components/PageShell'

export function AssetManagementPage() {
  return (
    <PageShell>
      <InfoPageLayout
        highlight="위험은 자신이 무엇을 하는지, 무엇을 갖고 있는지 모르는 데서 온다"
        columns={[
          {
            title: '자산',
            items: [
              { icon: '📊', label: '가계부' },
              { icon: '📱', label: '통신요금 가입 정보' },
              { icon: '⌚', label: '시계' },
              { icon: '🧴', label: '향수' },
              { icon: '🍷', label: '주류' },
            ],
          },
          {
            title: '자동차',
            items: [
              { icon: '🚗', label: '차량 관리 (QM6)' },
              { icon: '🚙', label: '차량 관리 (Tesla)' },
            ],
          },
        ]}
      />
    </PageShell>
  )
}
