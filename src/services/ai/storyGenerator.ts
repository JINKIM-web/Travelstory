import type { MemoryAnswer, PhotoAnalysis, StoryProject, StoryStyle, TravelScene, TravelStory } from '@/types'
import { newId, nowIso } from '@/utils/id'
import { chatJSON, hasOpenAI } from './client'

export const MEMORY_QUESTIONS = [
  { id: 'q1', question: '이번 여행에서 가장 잊지 못할 순간은 언제였나요?', hint: '기억 촉발' },
  { id: 'q2', question: '이 여행을 한 문장으로 표현한다면?', hint: '주제 정의' },
  { id: 'q3', question: '특별히 강조하고 싶은 사람이나 존재가 있나요?', hint: '선택' },
]

export const STORY_STYLES: { id: StoryStyle; label: string; desc: string }[] = [
  { id: 'plain', label: '담백한 기록', desc: '사실 위주로 간결하게' },
  { id: 'emotional', label: '감성 에세이', desc: '따뜻하고 서정적인 어조' },
  { id: 'literary', label: '문학적 서사', desc: '은유와 여운이 있는 문체' },
]

const STYLE_GUIDE: Record<StoryStyle, string> = {
  plain: '담백하고 간결한 기록체. 꾸밈을 줄이고 장면의 흐름을 또렷하게.',
  emotional: '따뜻하고 서정적인 감성 에세이체.',
  literary: '은유와 여운이 있는 문학적 서사체. 단, 사실을 왜곡하지 않는다.',
}

const SYSTEM = `당신은 여행 에세이 작가입니다. 입력(여행 정보, 사진 분석, 씬, 사용자의 기억)을 바탕으로 여행 전체를 하나의 이야기로 씁니다.
작성 원칙:
1. 사진 분석/사용자 기억에서 확인되지 않는 사실(고유명사, 음식 이름, 날씨, 사람, 사건)을 임의로 만들지 않는다.
2. 사용자가 입력한 정보와 기억을 항상 우선한다.
3. 사진 설명을 단순 나열하지 말고, 여행 전체의 흐름과 맥락 속에서 서술한다.
4. 한국어, 각 씬 섹션 본문은 2~4문장.
5. goldenQuote는 카드에 들어갈 한 문장(40자 이내).
6. 각 섹션은 반드시 해당 씬(sceneId)의 사진 분석 내용만 근거로 쓴다. 다른 씬의 내용을 섞지 않는다.
7. 시간대(아침/저녁), 날씨, 사람의 행동·감정, 음식 이름은 사진 분석 설명이나 사용자 기억에 있을 때만 쓴다. 확신이 없으면 구체적 표현 대신 일반적인 표현을 쓴다.
8. titleCandidates는 서로 다른 어조의 제목 3개.
JSON만 출력: {"title":string,"summary":string(2문장),"introduction":string,"sections":[{"sceneId":string,"heading":string,"body":string}],"closing":string,"goldenQuote":string,"titleCandidates":string[](3개),"tags":string[](3~4개, # 없이),"backgroundQuery":string(영어 2~4단어, 분위기/풍경 중심 Unsplash 검색어)}
sections는 입력 씬과 같은 개수·같은 순서이며 sceneId는 입력 값을 그대로 사용.`

interface RawStory {
  title?: string
  summary?: string
  introduction?: string
  sections?: { sceneId?: string; heading?: string; body?: string }[]
  closing?: string
  goldenQuote?: string
  tags?: string[]
  titleCandidates?: string[]
  backgroundQuery?: string
}

function mockStory(project: StoryProject, scenes: TravelScene[], memory: MemoryAnswer[]) {
  const answer = (id: string) => memory.find((m) => m.questionId === id)?.answer.trim()
  return {
    title: project.title,
    summary: answer('q2') ?? `${project.destination ?? '여행'}에서 보낸 ${scenes.length}개의 장면을 기록했습니다.`,
    introduction: project.description || '(데모 모드) OpenAI 키를 설정하면 AI가 여행 전체를 이야기로 풀어 씁니다.',
    sections: scenes.map((s) => ({
      sceneId: s.id,
      heading: s.title,
      body: s.description ?? `이 장면에는 ${s.photoIds.length}장의 사진이 담겨 있습니다. 직접 이야기를 적어 보세요.`,
    })),
    closing: answer('q1') ?? '',
    goldenQuote: answer('q2') ?? project.title,
    tags: [project.destination].filter((x): x is string => !!x),
    backgroundQuery: project.destination ? `${project.destination} landscape` : 'travel landscape',
  } satisfies RawStory
}

export async function generateStory(
  project: StoryProject,
  scenes: TravelScene[],
  analyses: PhotoAnalysis[],
  memory: MemoryAnswer[],
  style: StoryStyle,
  prevId?: string,
): Promise<TravelStory> {
  let raw: RawStory
  if (!hasOpenAI) {
    raw = mockStory(project, scenes, memory)
  } else {
    const byPhoto = new Map(analyses.map((a) => [a.photoId, a]))
    const input = {
      trip: {
        title: project.title,
        destination: project.destination,
        period: [project.startDate, project.endDate],
        note: project.description,
      },
      memory: memory.filter((m) => m.answer.trim()).map((m) => ({ q: m.question, a: m.answer })),
      scenes: scenes.map((s) => ({
        sceneId: s.id,
        title: s.title,
        date: s.date,
        location: s.location,
        photos: s.photoIds.map((id) => {
          const a = byPhoto.get(id)
          return a && { scene: a.scene, mood: a.mood, description: a.description }
        }),
      })),
    }
    raw = await chatJSON<RawStory>(
      [
        { role: 'system', content: `${SYSTEM}\n문체: ${STYLE_GUIDE[style]}` },
        { role: 'user', content: JSON.stringify(input) },
      ],
      { temperature: 0.5 },
    )
  }

  const now = nowIso()
  return {
    id: prevId ?? newId(),
    projectId: project.id,
    title: raw.title || project.title,
    summary: raw.summary ?? '',
    introduction: raw.introduction,
    sections: scenes.map((s, i) => {
      const r = raw.sections?.find((x) => x.sceneId === s.id) ?? raw.sections?.[i]
      return { id: newId(), sceneId: s.id, heading: r?.heading || s.title, body: r?.body ?? '' }
    }),
    closing: raw.closing,
    goldenQuote: raw.goldenQuote,
    tags: raw.tags?.slice(0, 4),
    titleCandidates: raw.titleCandidates?.filter(Boolean).slice(0, 3),
    backgroundQuery: raw.backgroundQuery,
    generatedAt: now,
    updatedAt: now,
  }
}

const photoFacts = (scene: TravelScene, analyses: PhotoAnalysis[]) => {
  const byPhoto = new Map(analyses.map((a) => [a.photoId, a]))
  return scene.photoIds.map((id) => {
    const a = byPhoto.get(id)
    return a && { scene: a.scene, mood: a.mood, description: a.description }
  })
}

const SECTION_SYSTEM = `당신은 여행 에세이 작가입니다. 주어진 씬 하나에 대한 챕터를 다시 씁니다.
- 이 씬의 사진 분석과 사용자 기억에 있는 사실만 사용하고, 없는 고유명사/시간대/날씨/사람/음식을 만들지 않는다.
- 한국어 2~4문장. 이전 버전과 다른 표현으로 쓴다.
JSON만 출력: {"heading":string,"body":string}`

/** 한 챕터(씬)만 다시 쓴다. */
export async function regenerateSection(
  project: StoryProject,
  scene: TravelScene,
  analyses: PhotoAnalysis[],
  memory: MemoryAnswer[],
  style: StoryStyle,
  previous: { heading: string; body: string },
): Promise<{ heading: string; body: string }> {
  if (!hasOpenAI) return { heading: scene.title, body: scene.description ?? previous.body }
  const input = {
    trip: { title: project.title, destination: project.destination },
    memory: memory.filter((m) => m.answer.trim()).map((m) => ({ q: m.question, a: m.answer })),
    scene: { title: scene.title, date: scene.date, location: scene.location, photos: photoFacts(scene, analyses) },
    previous,
  }
  const r = await chatJSON<{ heading?: string; body?: string }>(
    [
      { role: 'system', content: `${SECTION_SYSTEM}
문체: ${STYLE_GUIDE[style]}` },
      { role: 'user', content: JSON.stringify(input) },
    ],
    { temperature: 0.6 },
  )
  return { heading: r.heading || previous.heading, body: r.body ?? previous.body }
}

const VERIFY_SYSTEM = `당신은 사실 검증가입니다. 각 챕터 본문이 해당 씬의 사진 분석, 사용자 기억, 여행 정보로 뒷받침되는지 점검합니다.
뒷받침되지 않는 구체적 주장(고유명사, 시간대, 날씨, 음식, 사람, 사건)만 issues에 짧은 한국어 문장으로 적고, 문제가 없으면 빈 배열을 둡니다. 표현의 미문은 문제로 보지 않습니다.
JSON만 출력: {"results":[{"sectionId":string,"issues":string[]}]}`

/** 스토리 문장이 사진 분석에 근거하는지 AI로 점검한다. (키가 없으면 빈 결과) */
export async function verifyStory(
  story: TravelStory,
  scenes: TravelScene[],
  analyses: PhotoAnalysis[],
  memory: MemoryAnswer[],
): Promise<Record<string, string[]>> {
  if (!hasOpenAI) return {}
  const input = {
    memory: memory.filter((m) => m.answer.trim()).map((m) => ({ q: m.question, a: m.answer })),
    sections: story.sections.map((s) => {
      const scene = scenes.find((x) => x.id === s.sceneId)
      return { sectionId: s.id, body: s.body, evidence: scene ? photoFacts(scene, analyses) : [] }
    }),
  }
  const res = await chatJSON<{ results?: { sectionId: string; issues?: string[] }[] }>(
    [
      { role: 'system', content: VERIFY_SYSTEM },
      { role: 'user', content: JSON.stringify(input) },
    ],
    { temperature: 0 },
  )
  const out: Record<string, string[]> = {}
  for (const r of res.results ?? []) if (r.issues?.length) out[r.sectionId] = r.issues
  return out
}
