# Design System Specification: Warm Editorial Memory Archive (TravelCanvasAI)

**Product:** TravelCanvasAI — AI 기반 감성 여행 기록 & 아카이브 플랫폼  
**Target:** Web (Desktop 1440px+) & Mobile (iOS / Android Web Responsive 390px)  
**Design Philosophy:** 아날로그 에디토리얼 잡지(Editorial Magazine)의 깊이 있는 감성과 최신 AI 인터랙션의 정교함을 결합한 따뜻한 여행 아카이브 시스템.

---

## 1. Brand Identity & Design Principles

### 1.1 Brand Essence
- **Core Value:** "사진만 올리면 AI가 지나간 여행을 하나의 이야기로 만들어준다."
- **Brand Personality:** 따뜻함(Warmth), 사색적(Contemplative), 정갈함(Refined), 문학적(Literary), 직관적(Effortless).
- **Visual Motif:** 필름 사진 프레임, 노을빛 테라코타, 종이 질감의 부드러운 샌드 린넨 서피스, 활자체 타이포그래피.

### 1.2 Design Principles
1. **Photo-First Editorial Layout:** 사진이 주인공이 되도록 프레임과 비율을 존중하며, 캡션과 메타데이터는 사진의 여백을 침범하지 않고 자연스럽게 감쌉니다.
2. **Tactile Hierarchy (물리적 질감과 계층):** 얇은 보더(`border-stone-200/60`), 부드러운 다층 그림자(`shadow-sm`, `shadow-md`), 카드형 모듈을 통해 실제 아카이브 서재를 탐색하는 듯한 감각을 제공합니다.
3. **Harmonious Dual Typography:** 감성적인 제목과 핵심 인용구에는 서정적인 세리프(Playfair Display / Noto Serif KR)를, 데이터와 기능 UI에는 가독성 높은 산세리프(Pretendard / Inter)를 유기적으로 배치합니다.
4. **AI As a Polite Curator:** AI 분석 결과는 기계적인 수치가 아닌, "감성 큐레이션", "사색적 리플렉션" 등의 문학적 어조와 친근한 뱃지로 전달합니다.

---

## 2. Color Palette & Tokens

### 2.1 Primary & Accent Colors
| Token Name | Hex Code | Tailwind Equivalent / Usage | 설명 |
| :--- | :--- | :--- | :--- |
| `primary` | `#E06D53` | `primary-500` / `terracotta` | 노을빛 테라코타 (핵심 액션 버튼, 브랜드 로고 포인트, 강조 태그) |
| `primary-hover` | `#C8583E` | `primary-600` | 주요 버튼 Hover 상태 |
| `primary-light` | `#FDF3F0` | `primary-50` | 테라코타 틴트 배경, 활성화된 필터/탭 배경 |
| `secondary` | `#4A6B63` | `sage-600` | 차분한 세이지 포레스트 그린 (자연/장소 태그, 평온한 무드) |
| `secondary-light` | `#EDF4F2` | `sage-50` | 세이지 그린 뱃지 배경 |
| `accent-gold` | `#D4A373` | `amber-500` | 골든아워 선셋, 별점 및 중요 씬 하이라이트 |

### 2.2 Surface & Neutral Colors
| Token Name | Hex Code | Tailwind Equivalent / Usage | 설명 |
| :--- | :--- | :--- | :--- |
| `surface-base` | `#F8F9FD` / `#FAF8F5` | `bg-stone-50` / `bg-[#FAF8F5]` | 전체 캔버스 배경 (따뜻한 웜 린넨 미색) |
| `surface-card` | `#FFFFFF` | `bg-white` | 프로젝트 카드, 모달, 패널 기본 배경 |
| `surface-container-low` | `#F5F2EC` | `bg-stone-100/70` | 세컨더리 섹션, 업로드 드롭존 배경 |
| `surface-container-high` | `#EAE5DC` | `bg-stone-200/80` | 비활성화 상태 인풋 및 디바이더 |
| `border-subtle` | `#E8E3DA` | `border-stone-200` | 기본 카드 및 그리드 구분선 |
| `border-focus` | `#E06D53` | `border-primary` | 포커스 링 및 선택 상태 아웃라인 |

### 2.3 Text & Content Colors
| Token Name | Hex Code | Tailwind Equivalent / Usage | 설명 |
| :--- | :--- | :--- | :--- |
| `text-primary` | `#1E232A` | `text-stone-900` / `#1E232A` | 헤드라인, 여행 제목, 주요 본문 |
| `text-secondary` | `#58606E` | `text-stone-600` | 설명 문구, 날짜, 장소 메타데이터 |
| `text-tertiary` | `#8C95A3` | `text-stone-400` | 타임스탬프, 사진 장수 카운터, 플레이스홀더 |
| `text-inverse` | `#FFFFFF` | `text-white` | 주요 액션 버튼 내부 텍스트, 다크 카드 텍스트 |

---

## 3. Typography Scale & Fonts

### 3.1 Font Families
- **Display / Editorial Serif:** `Playfair Display`, `Noto Serif KR`, `serif`  
  *용도: 여행 프로젝트 타이틀, 챕터 헤딩, 감성 인용구("Quote"), 로고 워드마크*
- **Body / Interface Sans-Serif:** `Pretendard`, `Inter`, `-apple-system`, `sans-serif`  
  *용도: 네비게이션, 입력 폼, 메타데이터, 버튼 텍스트, 시스템 안내 문구*

### 3.2 Type Scale
| Level | Font Family | Size / Line-Height | Weight | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Title** | Serif | 36px / 1.3 (2.25rem) | Bold (700) | `-0.02em` | 대시보드 웰컴 배너 헤더 |
| **Section Title** | Serif | 28px / 1.35 (1.75rem) | Bold (700) | `-0.01em` | 스토리 메인 타이틀, 씬 빌더 헤더 |
| **Card Title (H3)** | Serif | 20px / 1.4 (1.25rem) | SemiBold (600) | `-0.01em` | 프로젝트 카드 타이틀, 모달 제목 |
| **Quote Body** | Serif | 18px / 1.6 (1.125rem) | Medium (500) Italic | `0` | AI 문학적 리플렉션, 감성 인용구 |
| **Body Large** | Sans | 16px / 1.6 (1.0rem) | Regular (400) / 500 | `0` | 에디토리얼 스토리 본문 문단 |
| **Body Small** | Sans | 14px / 1.5 (0.875rem) | Regular (400) / 500 | `0` | 카드 메타정보(날짜/장소), 폼 라벨 |
| **Caption / Tag** | Sans | 12px / 1.4 (0.75rem) | Medium (500) / 600 | `+0.02em` | 씬 태그, 사진 장수 배지, 타임라인 시간 |

---

## 4. Spacing, Grid & Layout

### 4.1 Spacing Scale
- `space-1` (4px), `space-2` (8px), `space-3` (12px), `space-4` (16px), `space-6` (24px), `space-8` (32px), `space-12` (48px), `space-16` (64px)

### 4.2 Breakpoints & Containers
- **Desktop Grid:** `max-w-7xl` (1280px ~ 1400px), 좌우 패딩 `px-6` ~ `px-8`
- **Dashboard Layout:** 2열 반응형 프로젝트 카드 그리드 (`grid grid-cols-1 md:grid-cols-2 gap-6`)
- **Studio Layout (Desktop):** 2열 비대칭 스플릿 구조
  - *New Trip / Scene Builder:* 좌측 입력·분석 패널(380px) + 우측 씬 캔버스(Flex 1)
  - *Story & Export:* 좌측 스토리 에디토리얼 뷰어(Flex 1, max-w-3xl) + 우측 플로팅 스토리 카드 스튜디오(420px)
- **Mobile Frame:** 기준 폭 390px, 풀스크린 스택 내비게이션, 하단 세이프존 패딩 및 고정 하단 탭/바

### 4.3 Border Radius (`ROUND_EIGHT` & Rounded Elements)
- **Cards / Containers:** `rounded-2xl` (16px) — 프로젝트 카드, 빌더 컨테이너
- **Buttons / Inputs:** `rounded-xl` (12px) — 폼 필드, 주요 액션 버튼
- **Tags / Badges:** `rounded-full` (9999px) — 감성 태그, 카테고리 칩
- **Story Card Preview:** `rounded-[28px]` — 프리미엄 프레임 느낌 연출

### 4.4 Shadows & Elevation
- **Card Default:** `box-shadow: 0 1px 3px rgba(30, 35, 42, 0.05), 0 1px 2px rgba(30, 35, 42, 0.03)`
- **Card Hover:** `box-shadow: 0 10px 25px -5px rgba(30, 35, 42, 0.08), 0 8px 10px -6px rgba(30, 35, 42, 0.04)` (`transition-all duration-300 transform -translate-y-0.5`)
- **Floating Action Panel:** `box-shadow: 0 20px 35px -10px rgba(224, 109, 83, 0.15)`

---

## 5. Core Components

### 5.1 Buttons & Controls
- **Primary CTA:**
  - Background: `#E06D53` (`primary`)
  - Text: `#FFFFFF`, `font-medium`
  - Shape: `rounded-xl`, `px-5 py-3`
  - Hover: `#C8583E`, 미세한 스케일(`active:scale-[0.98]`)
- **Secondary / Ghost Button:**
  - Background: `bg-stone-100` 또는 `bg-transparent border border-stone-300`
  - Text: `text-stone-700`
  - Hover: `bg-stone-200/60`
- **Subtle Action Icon:**
  - Circle `p-2 rounded-full hover:bg-stone-100 text-stone-500`

### 5.2 Project Archive Card (대시보드 핵심 카드)
- 상단 16:10 비율의 대표 썸네일 이미지 (`overflow-hidden rounded-t-2xl relative`)
- 우측 상단 플로팅 칩: `AI Story Card 완성` / 사진 장수 카운트 (`48 Photos`)
- 카드 바디:
  - 지역 및 날짜 라벨 (아이콘 + 서브텍스트)
  - 세리프 서체의 감성적인 여행 타이틀
  - AI 생성 리플렉션 쿼트 (이탤릭, 배경 박스)
  - 하단 태그 클라우드 및 [프로젝트 열기] 버튼

### 5.3 Scene Builder Module (씬 빌더 카드)
- 상단: `SCENE 01` 넘버링, 시간/장소 메타태그, 접기/펼치기 아코디언 및 삭제 아이콘
- 씬 제목 (수정 가능한 인라인 인풋 지원)
- 키워드 뱃지: 감성 키워드 칩 (`#신사/정원`, `#소나기`, `#AI 핵심 하이라이트 씬`)
- 포토 스트립 그리드:
  - 다중 사진 썸네일 (가로 스크롤 또는 유동형 그리드)
  - `대표사진` 뱃지 지정 기능
  - 개별 사진 삭제 `x` 오버레이 버튼

### 5.4 AI Story Card (시그니처 아티팩트)
- **종횡비:** 4:5 또는 9:16 모바일 최적화 비율
- **프레임 스타일:**
  - `Editorial Modern`: 깔끔한 화이트 보더와 매거진 볼드 타이포
  - `Film Polaroid`: 하단 여백이 넉넉한 아날로그 폴라로이드 스타일
  - `Minimal Poster`: 감성적인 사진 풀블리드 + 미니멀 캡션
- **내부 요소:**
  - 헤더: `TRAVELCANVAS AI EDITION` 브랜드 각인
  - 중앙: 선별된 고화질 대표 여행 사진
  - 하단: AI Golden Quote ("길을 잃어도 괜찮았던, 초여름 바람의 속도대로 걸어간 날들") + 서명
- **익스포트 액션:** PNG 고해상도 다운로드, 링크 복사, Unsplash 배경 전환 옵션

---

## 6. Icons & Media Guidelines

- **Icon Set:** Lucide React / Feather Icons 기반 (선 두께 `stroke-width="1.75"`의 일관된 세련미 유지)
- **Image Style:**
  - 아날로그 35mm 필름 카메라 느낌, 골든아워 자연광 채광, 과도한 HDR 지양
  - 부드러운 콘트라스트와 따뜻한 색감(Warm Amber / Terracotta / Earthy Green)
- **Placeholder Rule:**
  - 임의의 외부 URL 대신 유효한 DataStore 에셋 또는 규격화된 Unsplash 여행 무드 테마 활용

---

## 7. Responsiveness & Touch Targets

- **Desktop (1024px ~ 1440px+):**
  - 마우스 호버 효과 활성화 (`hover:-translate-y-1`, `hover:shadow-lg`)
  - 넉넉한 여백과 2열 스튜디오 분할 워크스페이스
- **Mobile (390px ~ 430px):**
  - 터치 타겟 최소 높이 44px 보장 (`min-h-[44px]`)
  - 엄지손가락 동선을 고려한 하단 플로팅 바 (`[이미지 저장하기]`, `[스토리 전문]`)
  - 모바일 맞춤형 바텀시트 및 풀스크린 카드 뷰
