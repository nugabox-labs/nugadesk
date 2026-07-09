import { InfoPageLayout } from '../components/InfoPageLayout'
import { TaskStatusGrid } from '../components/TaskStatusGrid'

export function TaskManagementPage() {
  return (
    <InfoPageLayout
      icon="🗂️"
      title="작업 관리"
      description="작업 관리는 해야 할 일들을 분류하고 진행 상황을 추적하는 공간이다. 무엇을 해야 하는지 명확히 알고 있어야 우선순위를 정할 수 있다."
      highlight="계획 없이 움직이면 무엇을 끝냈는지도 알 수 없다"
      columns={[
        { title: '분류', items: [{ icon: '📌', label: '중요 업무' }, { icon: '📅', label: '일정 관리' }] },
        { title: '메모', items: [{ icon: '📝', label: '아이디어 노트' }, { icon: '📋', label: '체크리스트' }] },
      ]}
    >
      <TaskStatusGrid />
    </InfoPageLayout>
  )
}
