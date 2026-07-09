import { InfoPageLayout } from '../components/InfoPageLayout'

export function AssetManagementPage() {
  return (
    <InfoPageLayout
      icon="💰"
      title="자산 관리"
      description="자산 관리는 경제적 내비게이션이다. 재무 목표는 목적지 설정과 같다. 나의 현위치를 알고 정확한 목적지를 찍고 간다면 시간과 수고를 덜 수 있지만, 목적지 없이 길을 방황만 하다가 목적지에 도착할 수 있는지 없는지 알 수 없다."
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
  )
}
