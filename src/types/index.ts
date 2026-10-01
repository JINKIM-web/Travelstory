// SPEC §6 데이터 모델. 모든 하위 데이터는 projectId 로 연결한다.

export type StoryStyle = 'plain' | 'emotional' | 'literary'

export type StepStatus = 'idle' | 'running' | 'done' | 'error'

export interface StoryProject {
  id: string
  title: string
  destination?: string
  startDate?: string
  endDate?: string
  description?: string

  photoIds: string[]
  sceneIds: string[]
  storyId?: string
  storyCardId?: string
  storyStyle?: StoryStyle

  /** AI 파이프라인 단계별 상태 (실패한 단계부터 재실행) */
  pipeline: {
    analysis: StepStatus
    scenes: StepStatus
    story: StepStatus
  }

  createdAt: string
  updatedAt: string
}

export interface TravelPhoto {
  id: string
  projectId: string
  fileName: string
  mimeType: string
  width?: number
  height?: number
  capturedAt?: string
  latitude?: number
  longitude?: number
}

export interface PhotoAnalysis {
  id: string
  projectId: string
  photoId: string

  location?: string
  scene: string
  objects: string[]
  activities: string[]
  mood?: string
  description: string

  importanceScore: number
  confidence?: number
}

export interface TravelScene {
  id: string
  projectId: string

  title: string
  date?: string
  location?: string
  keywords?: string[]

  photoIds: string[]
  coverPhotoId?: string
  description?: string
  order: number
}

export interface StorySection {
  id: string
  sceneId: string
  heading: string
  body: string
}

export interface TravelStory {
  id: string
  projectId: string

  title: string
  summary: string
  introduction?: string

  sections: StorySection[]

  closing?: string
  /** Story Card 에 쓰이는 AI 핵심 문장 */
  goldenQuote?: string
  tags?: string[]
  /** Unsplash 검색용 영어 키워드 */
  backgroundQuery?: string
  /** AI가 제안한 제목 후보 */
  titleCandidates?: string[]

  generatedAt: string
  updatedAt: string
}

export type StoryCardTemplate = 'editorial' | 'polaroid' | 'poster'

export interface StoryCard {
  id: string
  projectId: string

  template: StoryCardTemplate
  /** 4:5(기본) 또는 9:16 */
  ratio?: '4:5' | '9:16'
  /** 사용자가 "카드 발행"을 눌렀거나 이미지를 저장했는지 */
  published?: boolean
  coverPhotoId?: string
  title: string
  quote: string
  backgroundUrl?: string
  backgroundCredit?: string

  updatedAt: string
}

export interface MemoryAnswer {
  questionId: string
  question: string
  answer: string
}
