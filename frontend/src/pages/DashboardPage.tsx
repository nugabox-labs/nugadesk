import { Link } from 'react-router-dom'

import { FaIcon } from '../components/FaIcon'
import { PageShell } from '../components/PageShell'
import { TaskStatusGrid } from '../components/TaskStatusGrid'
import assetIcon from '../assets/dashboard/asset-management.svg'
import infoIcon from '../assets/dashboard/info-management.svg'
import taskIcon from '../assets/dashboard/task-management.svg'

const HUB_LINKS = [
  { to: '/tasks', icon: taskIcon, title: '작업 관리', caption: '할 일과 진행 상황 정리' },
  { to: '/assets', icon: assetIcon, title: '자산 관리', caption: '자산과 재무 목표 관리' },
  { to: '/info', icon: infoIcon, title: '정보 관리', caption: '개인 기록과 문서 모음' },
]

function HubCard({ to, icon, title, caption }: (typeof HUB_LINKS)[number]) {
  return (
    <Link
      to={to}
      className="dashboard-hub-card group flex items-center gap-3.5 p-4 sm:flex-col sm:items-center sm:text-center sm:gap-5 sm:p-8"
    >
      <span className="dashboard-hub-icon shrink-0 flex items-center justify-center w-12 h-12 sm:w-auto sm:h-auto rounded-[14px] bg-gray-50 group-hover:bg-primary-light transition-colors sm:bg-transparent sm:rounded-none">
        <img src={icon} alt="" className="w-8 h-8 sm:w-20 sm:h-20" />
      </span>
      <div className="flex-1 min-w-0 sm:flex-none sm:w-full">
        <span className="block font-bold text-base sm:text-lg text-gray-900">{title}</span>
        <span className="block text-sm text-gray-500 mt-0.5 truncate sm:whitespace-normal">{caption}</span>
      </div>
      <span className="shrink-0 sm:hidden flex items-center">
        <FaIcon name="chevron-right" className="text-gray-300" />
      </span>
    </Link>
  )
}

export function DashboardPage() {
  return (
    <PageShell compactMobile>
      <div className="flex flex-col gap-5 sm:gap-8">
        <section className="flex flex-col gap-2.5 sm:gap-4">
          <h2 className="text-xs font-semibold text-gray-400 tracking-tight px-0.5 sm:hidden">바로가기</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
            {HUB_LINKS.map((hub) => (
              <HubCard key={hub.to} {...hub} />
            ))}
          </div>
        </section>

        <TaskStatusGrid />
      </div>
    </PageShell>
  )
}
