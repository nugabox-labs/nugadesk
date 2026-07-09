import { InfoPageLayout } from '../components/InfoPageLayout'

export function InfoManagementPage() {
  return (
    <InfoPageLayout
      icon="📚"
      title="정보 관리"
      description="정보 관리는 흩어진 개인 기록을 한 곳에 모아 두는 공간이다. 필요할 때 찾을 수 있어야 정보로서 가치가 있다."
      highlight="기록하지 않으면 기억은 사라진다"
      columns={[
        { title: '계정', items: [{ icon: '🔑', label: '비밀번호 관리' }, { icon: '📧', label: '이메일 계정' }] },
        { title: '문서', items: [{ icon: '📄', label: '중요 서류' }, { icon: '🏥', label: '건강 기록' }] },
      ]}
    />
  )
}
