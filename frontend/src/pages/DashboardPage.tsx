import { Link } from 'react-router-dom'

import assetIcon from '../assets/dashboard/asset-management.svg'
import infoIcon from '../assets/dashboard/info-management.svg'
import taskIcon from '../assets/dashboard/task-management.svg'
import { TaskStatusGrid } from '../components/TaskStatusGrid'

const HUB_LINKS = [
  { to: '/tasks', icon: taskIcon, title: '작업 관리', caption: '할 일과 진행 상황 정리' },
  { to: '/assets', icon: assetIcon, title: '자산 관리', caption: '자산과 재무 목표 관리' },
  { to: '/info', icon: infoIcon, title: '정보 관리', caption: '개인 기록과 문서 모음' },
]

export function DashboardPage() {
  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {HUB_LINKS.map((hub) => (
          <Link key={hub.to} to={hub.to} className="card-flat flex flex-col gap-5 p-8">
            <img src={hub.icon} alt="" className="w-20 h-20" />
            <div className="flex flex-col gap-1">
              <span className="font-bold text-lg">{hub.title}</span>
              <span className="text-sm text-gray-500">{hub.caption}</span>
            </div>
          </Link>
        ))}
      </div>

      <TaskStatusGrid />
    </div>
  )
}
