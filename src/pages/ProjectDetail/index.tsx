import { Link, Outlet, useLocation, useParams } from 'react-router-dom'
import { Calendar, ChevronLeft, Images, MapPin, Pencil } from 'lucide-react'
import { LogoMark } from '@/components/common/Logo'
import ProjectStepper, { type StepKey } from '@/components/project/ProjectStepper'
import { useProject } from '@/stores/projectStore'
import { formatRange } from '@/utils/date'

/** 주소 → 현재 진행 단계 (원본 앨범은 단계가 아니라서 undefined) */
const stepOf = (pathname: string): StepKey | undefined =>
  pathname.endsWith('/story') ? 4 : pathname.endsWith('/story-card') ? 5 : pathname.endsWith('/storybook') ? 6 : undefined

export default function ProjectDetail() {
  const { projectId } = useParams()
  const { pathname } = useLocation()
  const project = useProject(projectId)

  if (!project) {
    return (
      <div className="flex flex-col items-center py-24 text-center">
        <LogoMark className="h-14 w-14 opacity-60" />
        <p className="mt-4 text-xl font-bold">프로젝트를 찾을 수 없습니다.</p>
        <Link to="/trips" className="mt-4 rounded-full bg-primary px-6 py-3 font-semibold text-on-primary">
          내 여행으로 돌아가기
        </Link>
      </div>
    )
  }

  const range = formatRange(project.startDate, project.endDate)
  return (
    <div>
      <Link to="/trips" className="inline-flex items-center gap-1 text-[15px] font-semibold text-on-surface-variant hover:text-primary">
        <ChevronLeft className="h-4 w-4" /> 내 여행
      </Link>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[244px_minmax(0,1fr)] lg:gap-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <ProjectStepper projectId={project.id} current={stepOf(pathname)} />
        </aside>

        <div className="min-w-0">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-[26px] font-extrabold leading-tight md:text-[34px]">{project.title}</h1>
              <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-base text-on-surface-variant">
                {project.destination && (
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <MapPin className="h-[18px] w-[18px] text-primary" />
                    {project.destination}
                  </span>
                )}
                {range && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-[18px] w-[18px]" />
                    {range}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Images className="h-[18px] w-[18px]" />
                  사진 {project.photoIds.length}장
                </span>
              </p>
            </div>
            <Link
              to={`/trips/${project.id}/build?step=2`}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-outline-variant bg-surface-lowest px-5 text-[15px] font-semibold hover:bg-surface-low"
            >
              <Pencil className="h-4 w-4" /> 사진·씬 편집
            </Link>
          </header>

          <div className="mt-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
