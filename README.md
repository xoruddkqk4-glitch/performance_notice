# 수행평가 일정 공지

학급별 수행평가 일정을 학생에게 공유하고, 회장·권한 부여 사용자가 일정을 관리하는 웹앱입니다.

공개 페이지: <https://xoruddkqk4-glitch.github.io/performance_notice/>

## 주요 기능

- 학생용 공개 일정 페이지와 학기·학급별 공유 링크·QR 코드
- `List`, `Monthly`, `2 Weeks`, `Weekly`, `Daily` 일정 보기
- 과목별 파스텔 색상, 일정 상세 보기, 모바일 반응형 화면
- 회장 관리자 대시보드: 학기·학급 생성·선택·삭제, 일정 추가·수정·삭제
- 날짜 범위, 시작·종료 교시, 준비물, 양식 링크, 첨부 파일 입력
- Firebase Storage 첨부 파일 저장, Firestore 일정·학기·학급 데이터 저장
- 입력 권한 학생 계정 발급과 권한 삭제
- A4 가로 PDF 다운로드 및 학기·학급별 공유 QR 코드 포함
- 관리자 전용 Cloud Function을 통한 입력 권한 계정 완전 삭제

## 기술 구성

- React + Vite
- Firebase Authentication, Firestore, Storage, Cloud Functions (2nd Gen)
- GitHub Pages + GitHub Actions

## 로컬 실행

Node.js 22 이상과 pnpm이 필요합니다.

```bash
pnpm install
pnpm run dev
```

GitHub Pages용 정적 빌드는 다음 명령으로 확인합니다.

```bash
pnpm run build:pages
```

## Firebase 설정

Firebase 프로젝트 ID는 `performance-notice`입니다. 웹앱 Firebase 설정은 `app/firebase.ts`에 있습니다.

### Firestore와 Storage

규칙 파일은 다음 위치에 있습니다.

- `firebase/firestore.rules`
- `firebase/storage.rules`

규칙을 반영하려면 Firebase CLI 로그인 후 다음을 실행합니다.

```bash
firebase deploy --only firestore:rules,storage
```

### 입력 권한 계정 삭제 함수

`functions/index.js`의 `deleteEditor` Callable Function은 다음을 함께 처리합니다.

1. Firebase Authentication의 입력 권한 계정 삭제
2. Firestore `editors/{uid}` 문서 삭제

함수는 `asia-northeast3`(서울) 리전에 배포되며, 현재 회장 관리자 UID만 호출할 수 있습니다. 삭제는 되돌릴 수 없습니다.

함수 의존성을 설치하고 배포하는 방법은 다음과 같습니다.

```bash
cd functions
npm install
cd ..
firebase login --no-localhost
firebase deploy --only functions
```

Cloud Functions 배포에는 Firebase Blaze 요금제가 필요합니다.

## 관리자 설정

관리자 이메일과 UID는 `app/firebase.ts`에 정의되어 있습니다. Firebase Authentication에서 사용하는 실제 관리자 계정 UID와 일치해야 합니다.

관리자 비밀번호는 저장소에 넣지 말고 환경 변수로 관리합니다. 예시는 `.env.example`을 참고합니다.

```bash
ADMIN_PASSWORD=안전한_비밀번호
```

## 배포

`main` 브랜치에 푸시하면 `.github/workflows/deploy-pages.yml` 워크플로가 자동으로 GitHub Pages에 배포합니다.

```bash
git push github main
```

GitHub 저장소 설정에서 **Settings → Pages → Build and deployment → GitHub Actions**를 선택해야 합니다.

Firebase Authentication을 GitHub Pages에서 사용하려면 Firebase Console의 Authentication → Settings → Authorized domains에 다음 도메인을 추가합니다.

```text
xoruddkqk4-glitch.github.io
```

## 프로젝트 구조

```text
app/                 React 화면, Firebase 클라이언트 연결
functions/           Firebase Cloud Functions
firebase/            Firestore·Storage 보안 규칙
gh-pages-src/        GitHub Pages용 Vite 진입점
.github/workflows/   GitHub Pages 배포 워크플로
```

## [2026-09-14 11:49] 업데이트 이력 (Commit ID: ea2ab1d)
- **수정 내용**:
  - 에이전트 실행 규칙 및 스킬 적용 (`.agents/`, `AGENTS.md`, `GEMINI.md`)
  - GitHub 원격 저장소(`https://github.com/xoruddkqk4-glitch/performance_notice`) 연결 및 `main` 브랜치 동기화
  - Windows 환경 변수 실행 호환을 위해 `cross-env` 추가 및 `package.json` 스크립트(`dev`, `build`, `start`) 수정
  - pnpm 10 네이티브 빌드 허용 설정 (`pnpm-workspace.yaml`의 `allowBuilds` 승인)
  - Next.js SSR 예약어 충돌 해결: `pages/` 폴더를 `gh-pages-src/`로 분리 및 `vite.pages.config.ts` 빌드 루트 경로 갱신
  - `.gitignore`에 `*.tsbuildinfo` 무시 패턴 추가
- **검증 결과**:
  - `pnpm run build:pages` GitHub Pages 정적 배포 빌드 정상 통과 (`built in 603ms`)
  - `pnpm run dev` 로컬 개발 서버 실행 및 `http://localhost:3000/` 접속 시 HTTP 200 OK 정상 렌더링 확인 완료

## [2026-09-14 11:59] 업데이트 이력 (Commit ID: e3c8920)
- **수정 내용**:
  - 오늘 기준 다가오는 "다음 일정" 동적 계산 반영 (`app/page.tsx`)
  - 2주(2 Weeks) 뷰에서 이전/다음 이동 시 2주가 아닌 1주(7일) 단위로 이동하도록 개선 (학생 및 관리자 화면 공통 적용)
  - 관리자 로그인 시 `Cannot read properties of null (reading 'reset')` 비동기 이벤트 참조 에러 수정
  - 브라우저 탭 타이틀 및 설명의 학급명 하드코딩 제거 및 `수행평가 일정`으로 단일화 (`app/layout.tsx`)
- **검증 결과**:
  - `pnpm run build:pages` GitHub Pages 정적 배포 빌드 정상 통과 (`built in 1.18s`)
## [2026-10-16 09:02] 업데이트 이력 (Commit ID: 60a2b3b)
- **수정 내용**:
  - 관리자 일정 등록/수정 시 다중 첨부파일 업로드(`multiple`) 및 대기 파일 취소 기능 구현 (`app/page.tsx`, `app/globals.css`)
  - 기존 등록된 첨부파일 목록 확인 및 개별 파일 삭제 기능 구현 (Firebase Storage 객체 연동 삭제)
  - 첨부파일 용량 제한 및 안전 정책 적용: 파일당 최대 15MB, 일정당 총합 50MB 사전 검사 및 안내 문구 출력
  - Firebase Storage 보안 규칙에 15MB 용량 제한 조건 추가 (`firebase/storage.rules`)
  - 학생용 화면 편의 기능 강화:
    - 이미지 파일: 상세 모달 내 썸네일 표시 및 클릭 시 확대 라이트박스 뷰어 지원
    - PDF 파일: PDF 전용 배지 표시 및 다운로드 없이 즉시 읽을 수 있는 [미리보기 ↗] 새 탭 뷰어 지원
    - 과목 카드: 첨부파일 복수 등록 시 `첨부 N건 ↧` 버튼 연동
  - 기존 단일 첨부파일 일정 데이터에 대한 100% 하위 호환성 정규화 함수(`getAssessmentAttachments`) 적용
  - 일정 자체 삭제 시 연결된 모든 Storage 파일 자동 정리 연동
  - 계획서 즉시 적용 스킬(`apply`) 도입 (`.agents/skills/apply/`)
- **검증 결과**:
  - `pnpm exec tsc --noEmit` 정적 타입 검사 결과 `app/page.tsx` 오류 0건 통과
  - `node -c functions/index.js` 구문 검사 정상 통과



