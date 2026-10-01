import { Link } from 'react-router-dom'
import { Archive, Calendar, ImageIcon, MapPin, Pencil, Sparkles, Trash2 } from 'lucide-react'
import type { StoryProject } from '@/types'
import { Chip, PhotoImg } from '@/components/common/ui'
import { LogoMark } from '@/components/common/Logo'
import { coverPhotoIdOf, useProjectData } from '@/stores/projectStore'
import { formatAgo, formatRange } from '@/utils/date'

export default function ProjectCard({
  project,
  onEdit,
  onDelete,
  onBackup,
}: {
  project: StoryProject
  onEdit: () => void
  onDelete: () => void
  onBackup: () => void
}) {
  const data = useProjectData(project.id)
  const hasStory = !!data.story
  const open = hasStory ? `/trips/${project.id}/story` : `/trips/${project.id}/build?step=2`
  const range = formatRange(project.startDate, project.endDate)
  const cover = coverPhotoIdOf(data)

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl bg-surface-lowest shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-card-hover">
      <Link to={open} className="relative block aspect-[4/3] overflow-hidden bg-surface-container" aria-label={`${project.title} 열기`}>
        {cover ? (
          <PhotoImg photoId={cover} className="h-full w-full transition duration-500 group-hover:scale-105" alt="" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-on-surface-variant">
            <LogoMark className="h-12 w-12 opacity-60" />
            <span className="text-sm font-medium">사진을 추가해 주세요</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent" />
        {hasStory ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 text-[13px] font-semibold text-primary shadow-sm">
            <Sparkles className="h-3.5 w-3.5" /> AI 스토리 완성
          </span>
        ) : (
          <span className="absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1.5 text-[13px] font-semibold text-white backdrop-blur">작성 중</span>
        )}
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-[13px] font-semibold text-white backdrop-blur">
          <ImageIcon className="h-3.5 w-3.5" /> {project.photoIds.length}장
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2 text-sm text-on-surface-variant">
          <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            {project.destination && (
              <span className="inline-flex items-center gap-1 font-medium">
                <MapPin className="h-4 w-4 text-primary" /> {project.destination}
              </span>
            )}
            {range && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-4 w-4" /> {range}
              </span>
            )}
          </span>
          <span className="shrink-0 text-xs">{formatAgo(project.updatedAt)}</span>
        </div>

        <h3 className="mt-2 line-clamp-2 text-[21px] font-extrabold leading-snug">
          <Link to={open} className="hover:text-primary">
            {project.title}
          </Link>
        </h3>

        <p className="mt-2 line-clamp-2 min-h-[3rem] font-serif text-[15px] italic leading-relaxed text-on-surface-variant">
          {data.story?.goldenQuote ? `“${data.story.goldenQuote}”` : '아직 AI 스토리가 없어요. 사진을 분석해 이야기를 만들어 보세요.'}
        </p>

        {data.story?.tags && data.story.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {data.story.tags.slice(0, 4).map((t) => (
              <Chip key={t}>#{t}</Chip>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center gap-1 pt-5">
          <Link
            to={open}
            className="inline-flex min-h-[44px] items-center rounded-full bg-primary px-6 text-[15px] font-semibold text-on-primary transition hover:bg-primary-container active:scale-[0.98]"
          >
            {hasStory ? '열어보기' : '이어서 만들기'}
          </Link>
          <span className="ml-auto flex">
            <IconButton label="백업 저장(.zip)" onClick={onBackup}>
              <Archive className="h-[18px] w-[18px]" />
            </IconButton>
            <IconButton label="프로젝트 정보 편집" onClick={onEdit}>
              <Pencil className="h-[18px] w-[18px]" />
            </IconButton>
            <IconButton label="프로젝트 삭제" onClick={onDelete} danger>
              <Trash2 className="h-[18px] w-[18px]" />
            </IconButton>
          </span>
        </div>
      </div>
    </article>
  )
}

function IconButton({ label, onClick, danger, children }: { label: string; onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant transition ${danger ? 'hover:bg-error-container hover:text-error' : 'hover:bg-surface-container'}`}
    >
      {children}
    </button>
  )
}
