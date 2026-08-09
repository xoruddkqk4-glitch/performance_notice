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
pages/               GitHub Pages용 Vite 진입점
.github/workflows/   GitHub Pages 배포 워크플로
```
