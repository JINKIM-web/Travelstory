# TravelCanvasAI 프로젝트 개발 명세서

**Version:** 1.2  
**목적:** AI 기반 여행 사진 스토리텔링 웹앱 MVP 개발

---

# 1. 서비스 정의

**TravelCanvasAI**는 여행을 다녀온 후 사진을 업로드하면 AI가 사진을 분석하여 여행의 장면(Scene)을 구성하고, 이를 하나의 **Travel Story**와 **AI Story Card**로 만들어주는 웹앱이다.

### 핵심 가치

> **사진만 올리면 AI가 지나간 여행을 하나의 이야기로 만들어준다.**

---

# 2. 핵심 제품 구조

## 2.1 Story Project

TravelCanvasAI의 최상위 콘텐츠 단위는 **Story Project**이다.

> **하나의 여행 = 하나의 Story Project**

각 프로젝트는 완전히 독립적으로 관리한다.

```text
Story Project
├── 여행 정보
├── 여행 사진
├── Photo Analysis
├── Travel Scenes
├── Travel Story
├── Story Card
└── Album
```

사용자는 여러 Story Project를 생성하고 각각 독립적으로:

- 열기
- 편집
- 저장
- 삭제

할 수 있다.

---

# 3. 핵심 사용자 흐름

```text
Dashboard
   ↓
새 여행 시작
   ↓
여행 정보 입력
   ↓
사진 업로드
   ↓
AI 사진 분석
   ↓
Scene 자동 구성
   ↓
AI Travel Story 생성
   ↓
Story 편집
   ↓
AI Story Card 생성
   ↓
저장 / 이미지 Export
```

---

# 4. MVP 기능 범위

## P0 — 반드시 구현

| 기능 | 주요 요구사항 |
|---|---|
| 프로젝트 관리 | 생성 / 조회 / 수정 / 삭제 |
| 프로젝트 목록 | 여러 여행 프로젝트를 Dashboard에서 관리 |
| 사진 업로드 | 다중 선택 / Drag & Drop / 미리보기 / 삭제 |
| 사진 저장 | IndexedDB |
| 프로젝트 정보 저장 | LocalStorage |
| Photo Analysis | AI를 이용한 사진 내용 분석 |
| Scene Builder | 사진을 여행 경험 단위로 그룹화 |
| AI Story | 여행 전체를 하나의 이야기로 생성 |
| Story Editor | AI 결과 수정 |
| Story Card | 여행 대표 이미지 + 제목 + 핵심 문장 + 배경 |
| Album | 실제 여행 사진을 프로젝트별로 관리 |
| Unsplash | Story Card 배경 이미지 |
| 이미지 Export | Story Card PNG/JPG 저장 |

## P1 — MVP 보강

- AI 대표 사진 선정
- AI 여행 제목 생성
- AI 여행 한 문장 생성
- Story 스타일 선택
- Story Card 템플릿 2~3개
- 사진 순서 변경

## P2 — MVP 이후

- 회원가입 / 로그인
- Supabase
- 클라우드 저장
- 공유 URL
- 가족/친구 공동 편집
- 소셜 기능
- GPS 자동 추적
- AI 여행 영상
- 포토북 제작
- 결제

---

# 5. 프로젝트 관리

## Dashboard

사용자가 생성한 모든 Story Project를 표시한다.

각 프로젝트 카드에는 다음을 표시한다.

- 대표 이미지
- 여행 제목
- 여행지
- 여행 기간
- 사진 수
- 마지막 수정일

지원 기능:

```text
새 여행 시작
프로젝트 열기
프로젝트 편집
프로젝트 삭제
```

---

## 프로젝트 독립성

모든 하위 데이터는 `projectId`로 연결한다.

```text
Project A
 ├── Photos
 ├── Analysis
 ├── Scenes
 ├── Story
 └── Story Card

Project B
 ├── Photos
 ├── Analysis
 ├── Scenes
 ├── Story
 └── Story Card
```

프로젝트 간 데이터가 섞이지 않아야 한다.

---

# 6. 데이터 모델

## StoryProject

```typescript
interface StoryProject {
  id: string;
  title: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  description?: string;

  photoIds: string[];
  sceneIds: string[];
  storyId?: string;
  storyCardId?: string;

  createdAt: string;
  updatedAt: string;
}
```

## TravelPhoto

```typescript
interface TravelPhoto {
  id: string;
  projectId: string;
  fileName: string;
  mimeType: string;
  width?: number;
  height?: number;
  capturedAt?: string;
  latitude?: number;
  longitude?: number;
}
```

실제 이미지 Blob은 IndexedDB에 저장한다.

## PhotoAnalysis

```typescript
interface PhotoAnalysis {
  id: string;
  projectId: string;
  photoId: string;

  location?: string;
  scene: string;
  objects: string[];
  activities: string[];
  mood?: string;
  description: string;

  importanceScore: number;
  confidence?: number;
}
```

## TravelScene

```typescript
interface TravelScene {
  id: string;
  projectId: string;

  title: string;
  date?: string;
  location?: string;

  photoIds: string[];
  description?: string;
  order: number;
}
```

## TravelStory

```typescript
interface TravelStory {
  id: string;
  projectId: string;

  title: string;
  summary: string;
  introduction?: string;

  sections: StorySection[];

  closing?: string;

  generatedAt: string;
  updatedAt: string;
}
```

---

# 7. AI 기능

## 7.1 Photo Analysis

사진에서 Story 생성에 필요한 정보를 추출한다.

분석 대상:

- 장소
- 주요 객체
- 활동
- 음식
- 자연/건축물
- 분위기
- 장면 유형
- 사진 설명
- 중요도

AI가 사진만으로 확인할 수 없는 사실을 임의로 생성하지 않는다.

---

## 7.2 Scene Builder

사진을 단순 나열하지 않고 여행의 경험 단위로 그룹화한다.

예:

```text
Day 1
 ├── 공항 / 이동
 ├── 호텔
 └── 저녁

Day 2
 ├── 해변
 ├── 카페
 └── 관광
```

---

## 7.3 Travel Story

Story 생성 입력:

```text
여행 정보
+ Photo Analysis
+ Scenes
+ 사용자 기억
```

결과:

- 여행 제목
- 여행 요약
- Scene별 이야기
- 마무리 문장

### AI 작성 원칙

1. 사진에서 확인되지 않는 사실을 임의로 생성하지 않는다.
2. 사용자가 입력한 정보를 우선한다.
3. 사진 설명을 단순 나열하지 않는다.
4. 전체 여행의 흐름과 맥락을 중심으로 작성한다.
5. 사용자가 Story를 직접 수정할 수 있어야 한다.

---

# 8. 사용자 기억 입력

AI가 사진만으로 알 수 없는 개인적인 기억을 보완하기 위해 간단한 질문을 제공한다.

예:

- 가장 기억에 남는 순간은?
- 이 여행을 한 문장으로 표현한다면?
- 특별히 강조하고 싶은 사람이 있는가?

MVP에서는 **2~3개의 질문**으로 제한한다.

---

# 9. AI Story Card

TravelCanvasAI의 대표 결과물이다.

구성:

```text
대표 여행 사진
+
여행지
+
여행 기간
+
AI 여행 제목
+
AI 핵심 문장
+
Unsplash 배경
```

Story Card는 프로젝트별로 독립 저장한다.

### Unsplash 사용 목적

Unsplash는 사용자의 실제 여행 사진을 대체하지 않는다.

**Story Card의 분위기를 표현하는 배경 이미지**로만 사용한다.

예:

```text
AI 분석
 ↓
"제주 / 바다 / 평온한 분위기"
 ↓
Unsplash 검색
 ↓
배경 이미지
```

---

# 10. Album

Album은 **실제 여행 사진을 보존하는 공간**이다.

Story와 역할을 분리한다.

| 기능 | 역할 |
|---|---|
| Album | 실제 여행 사진 보존 |
| AI Story | 여행 경험을 이야기로 재구성 |
| Story Card | 여행 이야기를 시각적 결과물로 표현 |

---

# 11. 저장 구조

MVP는 서버/DB를 사용하지 않는다.

## LocalStorage

저장 대상:

- 프로젝트 메타데이터
- Scene
- Story
- Story Card 설정
- 앱 설정

## IndexedDB

저장 대상:

- 원본 사진 Blob
- Thumbnail
- 이미지 관련 데이터

### 중요

사진 원본을 LocalStorage에 Base64로 저장하지 않는다.

---

# 12. 프로젝트 삭제

프로젝트 삭제 시 해당 프로젝트에 연결된 모든 데이터를 삭제한다.

```text
deleteProject(projectId)
      ↓
Project
Photos
Photo Analysis
Scenes
Story
Story Card
```

삭제 전 확인 UI를 표시한다.

프로젝트 간 데이터에는 영향을 주지 않는다.

---

# 13. 기술 스택

| 영역 | 기술 | 이유 |
|---|---|---|
| Frontend | React | 컴포넌트 기반 UI |
| Build | Vite | 빠르고 단순한 MVP 개발 |
| Language | TypeScript | 데이터 구조 안정성 |
| Styling | Tailwind CSS | 빠른 UI 개발 |
| UI | shadcn/ui | 재사용 가능한 UI |
| State | Zustand | 간결한 상태 관리 |
| Metadata | LocalStorage | 간단한 로컬 데이터 저장 |
| Image Storage | IndexedDB | 대용량 이미지 저장 |
| AI | OpenAI API | 이미지 분석 + Story 생성 |
| Background | Unsplash API | Story Card 배경 |
| Image Export | Canvas / html-to-image | Story Card 이미지 생성 |
| Date | date-fns | 날짜 처리 |
| Routing | React Router | 프로젝트별 화면 관리 |
| Deployment | Vercel | 간편한 웹 배포 |

`dnd-kit`은 사진 순서 변경이 필요할 경우 추가한다.

---

# 14. 권장 프로젝트 구조

```text
src/
├── components/
│   ├── common/
│   ├── dashboard/
│   ├── project/
│   ├── photo/
│   ├── story/
│   ├── story-card/
│   └── album/
│
├── pages/
│   ├── Dashboard/
│   ├── NewProject/
│   ├── ProjectDetail/
│   ├── Story/
│   └── StoryCard/
│
├── services/
│   ├── ai/
│   │   ├── photoAnalysis.ts
│   │   ├── sceneBuilder.ts
│   │   └── storyGenerator.ts
│   ├── unsplash/
│   ├── storage/
│   │   ├── localStorage.ts
│   │   └── indexedDB.ts
│   └── image/
│
├── stores/
├── types/
├── hooks/
├── utils/
└── App.tsx
```

외부 API와 저장소 로직은 UI 컴포넌트와 분리한다.

---

# 15. 라우팅

```text
/
└── /trips
      ├── /new
      └── /:projectId
            ├── /photos
            ├── /story
            └── /story-card
```

모든 프로젝트 화면은 `projectId`를 기준으로 데이터를 조회한다.

---

# 16. API 및 보안

MVP에서는 외부 API를 사용한다.

```text
OpenAI API
Unsplash API
```

API Key는 `.env.local`에서 관리한다.

```env
VITE_OPENAI_API_KEY=
VITE_UNSPLASH_ACCESS_KEY=
```

`.env` 파일은 Git에 커밋하지 않는다.

### Production 전환 시

브라우저에 OpenAI API Key를 노출하지 않도록 별도의 서버/API 계층으로 이동한다.

---

# 17. 개발 원칙

### 1. 기능을 작은 단위로 개발한다.

```text
프로젝트
→ 사진
→ 저장
→ AI 분석
→ Scene
→ Story
→ Story Card
→ Export
```

### 2. 기존 기능을 임의로 변경하지 않는다.

변경 전 영향 범위를 확인한다.

### 3. 프로젝트 데이터를 반드시 격리한다.

모든 데이터 조회/수정/삭제는 `projectId`를 기준으로 한다.

### 4. AI 처리 단계를 분리한다.

```text
Photo Analysis
→ Scene Builder
→ Story Generator
→ Story Card
```

각 단계의 결과를 저장하여 실패한 단계부터 재실행할 수 있도록 한다.

### 5. MVP 범위를 임의로 확대하지 않는다.

P2 기능은 별도 요구사항이 없는 한 구현하지 않는다.

---

# 18. MVP 완료 기준

다음 전체 흐름이 정상적으로 동작해야 한다.

```text
새 여행 생성
 ↓
사진 여러 장 업로드
 ↓
사진 저장
 ↓
AI 사진 분석
 ↓
Scene 자동 구성
 ↓
사용자 기억 입력
 ↓
AI Story 생성
 ↓
Story 수정
 ↓
Story Card 생성
 ↓
Unsplash 배경 적용
 ↓
이미지 Export
 ↓
프로젝트 저장
 ↓
Dashboard에서 여러 여행 확인
 ↓
기존 프로젝트 재접속
 ↓
프로젝트 수정
 ↓
프로젝트 삭제
```

그리고 반드시 다음 조건을 만족해야 한다.

> **한 여행 프로젝트의 생성·편집·삭제가 다른 여행 프로젝트에 영향을 주지 않아야 한다.**

---

# 19. MVP에서 검증할 핵심 가설

TravelCanvasAI의 MVP는 다음 가설을 검증한다.

> **사용자는 여행 사진을 직접 정리하고 글을 쓰는 대신, 사진을 업로드하고 AI가 만들어준 여행 이야기를 수정·완성하는 경험을 가치 있게 느낀다.**

따라서 MVP의 최우선 기능은 **Photo → AI Analysis → Scene → Story → Story Card**이며, GPS·소셜·로그인·클라우드·포토북 등의 기능은 MVP에서 제외한다.