# TravelCanvasAI 프로젝트 개발 계획

**근거 문서:** SPEC_프로젝트개발명세서.md (v1.2), design.md, Stitch 화면 5종(`public/images/stitch_emotional_travel_log_ui`)
**목표:** MVP — Photo → AI Analysis → Scene → Story → Story Card → Export, 다중 프로젝트 독립 관리

---

## 0. 문서 간 불일치 및 결정 사항 (착수 전 확정)

| # | 이슈 | 결정(안) |
|---|---|---|
| 1 | 색상 토큰: design.md는 `#E06D53`/`#FAF8F5`, Stitch `DESIGN.md`와 실제 화면은 `#9E3C26`(primary) / `#F8F9FF`(surface, 푸른빛 라벤더) | **실제 화면과 Stitch `DESIGN.md`를 기준**으로 토큰화. design.md의 `#E06D53`은 `primary-container`(#BE543C) 계열로 대체 |
| 2 | Stitch 화면에 MVP 밖 요소 존재: 알림 벨, 검색, 즐겨찾기, 공유 아이콘, 지도 탭, "자연 앰비언스 사운드", "하드커버 포토북 안내", 링크 복사, GPS 좌표, 마이/탐색 탭, 사용자 프로필 | SPEC §4 P2 및 §17-5에 따라 **UI에서 제외 또는 비활성 자리표시**. 구현 안 함 |
| 3 | 화면 문구에 "Aura Score 98%", "빛/감성 평점 4.8★", "소요시간 약 25초" 등 | 실제 AI 결과에서 산출 가능한 값만 표시(대표성 점수 = importanceScore 등). 근거 없는 수치는 제거 |
| 4 | 새 여행 만들기 4단계(여행정보 → 사진&씬 → 기억 질문 → 에세이)와 SPEC 라우팅(`/trips/new`, `/:id/photos`, `/story`, `/story-card`) | `/trips/new`를 **위저드(스텝 상태)** 로 구현, 완료 후 `/trips/:id/...`로 이동 |
| 5 | Story 화면(좌 뷰어 + 우 카드 스튜디오)과 `/story`·`/story-card` 분리 | 데스크톱은 한 레이아웃의 두 패널, 모바일은 탭(스토리 카드 / 타임라인 씬 / 앨범)으로 처리. 라우트는 SPEC대로 유지 |
| 6 | OpenAI 키가 `VITE_` 로 브라우저에 노출 | MVP는 SPEC대로 진행하되 **`services/ai`를 단일 어댑터로 격리**하여 Vercel Serverless 프록시로 교체 가능하게 설계. 공개 배포 전 프록시 전환 필수 |
| 7 | 이미지 비용/한도 | 업로드 시 클라이언트에서 긴 변 1024px로 리사이즈한 사본을 AI에 전송(원본은 IndexedDB 보관) |

---

## 1. 화면 ↔ 기능 매핑

| Stitch 화면 | 라우트 | 핵심 컴포넌트 |
|---|---|---|
| `dashboard_travelcanvasai` | `/trips` | HeroBanner(통계 3종), ProjectCard(대표이미지·뱃지·제목·리플렉션 인용·태그·열기/삭제), 필터 탭(전체/최근) |
| `ai_new_trip_scene_builder` | `/trips/new` | Stepper, ProjectInfoForm, PhotoDropzone, AnalysisSummary, SceneCard(인라인 제목 편집·키워드칩·포토스트립·대표사진·삭제·위아래 이동), MemoryQuestions(2~3개), "AI 스토리 생성" CTA |
| `ai_story_card_export` | `/trips/:id/story`, `/story-card` | StoryViewer(챕터·본문·사진·인라인 편집), StoryCardStudio(템플릿 3종, 무드 배경 전환, PNG 저장) |
| `mobile_story_card` | 동일(반응형 390px) | 상단 탭, 카드 뷰, 씬 요약 리스트, 하단 고정 액션바 |
| `travelcanvasai_logo` | 전역 | 로고 SVG/이미지 → `public/` |

공통: 상단 내비(내 여행 프로젝트 / 새 여행 만들기 / 갤러리 아카이브=Album), 푸터.

---

## 2. 기술 스택 / 초기 세팅

- Vite + React + TypeScript, Tailwind CSS, shadcn/ui, Zustand, React Router, date-fns, html-to-image, `idb`(IndexedDB 래퍼), lucide-react, `@dnd-kit`(P1 순서 변경 시)
- 폰트: Playfair Display, Noto Serif KR, Pretendard
- `tailwind.config`에 Stitch `DESIGN.md` 토큰(colors, typography, radius 16/12/full, shadow) 이식
- `.env.local`: `VITE_OPENAI_API_KEY`, `VITE_UNSPLASH_ACCESS_KEY` / `.gitignore`에 등록, `.env.example` 제공
- 폴더 구조는 SPEC §14 그대로
- 프로젝트 위치: `Travelstory/` 루트에 Vite 앱 생성(현재 `public/images`는 유지, 시안은 `design-reference/`로 이동 고려)

---

## 3. 개발 단계 (SPEC §17 순서: 프로젝트 → 사진 → 저장 → AI → Scene → Story → Card → Export)

각 단계는 독립 완료 가능하며 완료 기준(DoD)을 통과해야 다음으로 진행.

### Phase 0 — 기반 (0.5일)
- Vite 스캐폴딩, Tailwind 토큰, shadcn 설치, 라우터 골격, 공통 레이아웃(헤더/푸터/모바일 하단바)
- `types/` 에 SPEC §6 모델 전부 정의 (+ `StorySection`, `StoryCard`, `MemoryAnswer` 보완)
- **DoD:** 모든 라우트가 빈 페이지로 이동 가능, 토큰이 시안 색과 일치

### Phase 1 — 프로젝트 관리 + 저장 계층 (1일)
- `services/storage/localStorage.ts`: 프로젝트·씬·스토리·카드 설정 CRUD (키를 `projectId` 기준 네임스페이스화)
- `services/storage/indexedDB.ts`: photos / thumbnails 스토어(`projectId` 인덱스)
- Zustand 스토어 + persist 연동, `deleteProject(projectId)` 캐스케이드 삭제
- Dashboard: ProjectCard, 빈 상태, 삭제 확인 모달, 통계 배너
- **DoD:** 프로젝트 2개 생성 → 하나 삭제 → 다른 하나의 데이터 무변경

### Phase 2 — 새 여행 위저드 Step 1 + 사진 업로드 (1일)
- 여행 정보 폼(제목·여행지·기간·설명, date-fns 박싱 포맷)
- PhotoDropzone: 다중 선택/드래그앤드롭, 미리보기, 삭제, HEIC 처리 여부 결정(변환 라이브러리 `heic2any` 검토)
- 업로드 시 EXIF(촬영시각) 추출, 썸네일 생성, Blob 저장
- **DoD:** 새로고침 후에도 사진 유지, 사진 50장 업로드 시 UI 끊김 없음

### Phase 3 — AI 사진 분석 (1일)
- `photoAnalysis.ts`: 리사이즈본을 배치(예: 4~5장씩)로 OpenAI 비전 호출, JSON 스키마 강제(PhotoAnalysis), 동시성 제한·재시도
- 프롬프트 원칙: **사진에서 확인 불가한 사실 생성 금지**, 모르면 필드 생략/낮은 confidence
- 결과를 사진 단위로 저장 → 실패 건만 재시도 가능
- 진행률 UI, 에러 상태
- **DoD:** 분석 결과가 저장되고 실패 단계부터 재실행 가능

### Phase 4 — Scene Builder (1일)
- `sceneBuilder.ts`: capturedAt 정렬 + 분석 결과로 Day/장소/활동 단위 그룹화 → TravelScene 생성(제목·키워드·대표사진)
- SceneCard UI: 제목 인라인 편집, 대표사진 지정, 사진 삭제/씬 간 이동, 씬 순서 변경, 수동 씬 추가
- 촬영시각이 없는 사진의 처리 규칙(업로드 순서 + 분석 기반) 정의
- **DoD:** AI 결과를 사용자가 수정하고 저장 → 재진입 시 유지

### Phase 5 — 기억 질문 + Story 생성 (1일)
- MemoryQuestions 2~3개(가장 잊지 못할 순간 / 한 문장 표현 / 강조할 사람), 답변 저장
- `storyGenerator.ts`: 입력 = 여행 정보 + 분석 + 씬 + 기억(사용자 입력 우선). 출력 = 제목·요약·도입·씬별 섹션·마무리·**골든 쿼트 한 문장**·태그
- Story 뷰어 + 인라인 편집기, 재생성(섹션 단위), 저장
- 스타일 선택(P1: 담백/감성/에세이) 추가는 이 단계에서 옵션화
- **DoD:** 생성→수정→저장→재접속 유지, 사실 환각 점검 체크리스트 통과

### Phase 6 — Story Card + Unsplash + Export (1일)
- 템플릿 3종(Editorial Modern / Film Polaroid / Minimal Poster), 4:5·9:16
- 분석 결과 → 검색 키워드(예: "제주 바다 평온") → Unsplash 후보 → 배경 선택. **배경은 분위기 용도만, 실사진 대체 금지**, Unsplash 출처 표기·다운로드 트리거 호출 규정 준수
- html-to-image로 PNG/JPG 내보내기(고해상도 pixelRatio, 크로스오리진 이미지 `crossOrigin` 처리 검증)
- 카드 설정 `projectId`별 저장
- **DoD:** 내보낸 이미지가 화면과 동일, 폰트 누락 없음

### Phase 7 — Album + 반응형 마감 (0.5~1일)
- Album: 프로젝트별 원본 사진 그리드/라이트박스(스토리와 역할 분리)
- 모바일 390px 레이아웃(탭, 하단 고정 액션바, 터치 타겟 44px)
- 빈/로딩/에러 상태, 접근성(포커스, alt), 용량 부족 시 안내(`navigator.storage.estimate`)

### Phase 8 — QA 및 배포 (0.5~1일)
- SPEC §18 전체 시나리오를 E2E 수동 체크리스트로 수행(+ Playwright 스모크 1~2개)
- 프로젝트 격리 회귀 테스트(생성/편집/삭제 교차)
- Vercel 배포, 환경변수 설정, (공개 시) OpenAI 프록시 전환

**총 예상: 약 7~8일(1인 기준).** 수업 일정이 짧다면 Phase 0~6만 "데모 가능 MVP"로 먼저 마감하고 7~8은 이후 진행.

---

## 4. 데이터/아키텍처 원칙

- 모든 조회·수정·삭제 API 시그니처에 `projectId` 필수 → 격리 보장
- AI 파이프라인 4단계(분석 → 씬 → 스토리 → 카드)는 각 결과를 개별 저장하고 `status`(idle/running/done/error)를 가짐
- 외부 API·저장소는 `services/`에만 존재, 컴포넌트는 스토어 훅만 사용
- 사진 원본은 LocalStorage에 Base64 저장 금지(IndexedDB만)
- 이미지 URL은 `URL.createObjectURL` 사용 후 해제 관리(메모리 누수 방지)

---

## 5. 우선순위 정리

- **P0 (Phase 1~7 필수):** 프로젝트 CRUD, 업로드/저장, 분석, 씬, 스토리, 편집, 카드, Unsplash, Export, Album
- **P1 (여유 시):** 대표 사진 AI 선정(분석 점수로 기본 구현 가능), 스토리 스타일 선택, 템플릿 3종(권장 포함), 사진 순서 변경(dnd-kit)
- **P2 (제외):** 로그인/Supabase/공유/GPS/소셜/영상/포토북/결제/알림/검색/지도

## 6. 주요 리스크

| 리스크 | 대응 |
|---|---|
| 비전 API 비용·지연 (사진 수십 장) | 리사이즈, 배치 호출, 진행률 UI, 사진 수 상한(예: 50장) |
| 브라우저 저장 용량 | 썸네일/원본 분리, 상한 안내 |
| API 키 노출 | 어댑터 격리 + 배포 시 프록시 |
| AI 환각 | 프롬프트 제약, confidence 노출, 사용자 편집 우선 |
| html-to-image 폰트/CORS | Phase 6 초기에 스파이크로 먼저 검증 |
| HEIC 업로드 | 변환 라이브러리 도입 또는 JPG/PNG만 지원 명시 |

## 7. 다음 단계 제안

1. 위 §0의 결정 사항 확인(특히 색상 토큰·MVP 외 UI 제외)
2. Phase 0 착수: Vite 프로젝트 생성 및 토큰/라우팅 세팅
