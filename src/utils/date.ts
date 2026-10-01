import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns'
import { ko } from 'date-fns/locale'

const parse = (s?: string) => {
  if (!s) return undefined
  const d = parseISO(s)
  return isValid(d) ? d : undefined
}

export function formatRange(start?: string, end?: string) {
  const s = parse(start)
  const e = parse(end)
  if (!s) return ''
  if (!e) return format(s, 'yyyy.MM.dd')
  const sameYear = s.getFullYear() === e.getFullYear()
  return `${format(s, 'yyyy.MM.dd')} - ${format(e, sameYear ? 'MM.dd' : 'yyyy.MM.dd')}`
}

export function formatAgo(iso: string) {
  const d = parse(iso)
  return d ? formatDistanceToNow(d, { addSuffix: true, locale: ko }) : ''
}

export function formatSceneDate(iso?: string) {
  const d = parse(iso)
  return d ? format(d, 'yyyy.MM.dd') : ''
}
