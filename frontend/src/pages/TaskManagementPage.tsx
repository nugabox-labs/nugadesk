import { InfoPageLayout } from '../components/InfoPageLayout'
import { PageShell } from '../components/PageShell'
import { TaskStatusGrid } from '../components/TaskStatusGrid'

export function TaskManagementPage() {
  return (
    <PageShell>
      <InfoPageLayout
        highlight="계획 없이 움직이면 무엇을 끝냈는지도 알 수 없다"
        columns={[
          { title: '분류', items: [{ icon: '📌', label: '중요 업무' }, { icon: '📅', label: '일정 관리' }] },
          { title: '메모', items: [{ icon: '📝', label: '아이디어 노트' }, { icon: '📋', label: '체크리스트' }] },
        ]}
      >
        <TaskStatusGrid />
      </InfoPageLayout>
    </PageShell>
  )
}
