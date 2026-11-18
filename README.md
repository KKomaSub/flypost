# 날아라 우편국

종이비행기로 우편을 배달하는 2D 게임입니다. Phaser가 격납고와 비행 장면을 그리고 프레임을 처리합니다. 각도, 힘, 바람, 기류와 기체 성능은 게임의 비행 모델에서 계산합니다. 메뉴와 조작 버튼은 모바일 터치와 키보드 탐색을 지원합니다.

## 개발

Node.js 22.12 이상(22.x) 또는 24 이상이 필요합니다.

```sh
npm ci
npm run dev
```

## Cloudflare Pages

이 GitHub 저장소를 Pages 프로젝트에 연결하고 아래 값을 사용합니다.

| 설정 | 값 |
| --- | --- |
| 배포 브랜치 | `main` |
| 프로젝트 루트 | 저장소 루트 |
| 빌드 명령 | `npm run build` |
| 출력 디렉터리 | `dist` |
| 환경 변수 `NODE_VERSION` | `22` |

로컬에서 `npm run build` 후 `npm run preview`로 배포본을 확인할 수 있습니다. 직접 업로드를 사용하는 프로젝트는 빌드된 `dist/`를 업로드합니다. 엔진은 빌드 결과에 포함되며 별도 CDN, 서버 API, 비밀 키가 필요하지 않습니다.

## Android 앱으로 패키징

같은 `dist/`를 [Capacitor Android](https://capacitorjs.com/docs/android)의 `webDir`로 사용할 수 있습니다. 출시할 때 고유 앱 ID를 정하고 Android 프로젝트를 추가한 뒤, 새 빌드마다 `npx cap sync android`로 게임을 복사합니다. 이후 Android Studio에서 아이콘, 시작 화면, 뒤로 가기 동작과 기기별 화면을 점검하고 서명된 AAB를 빌드합니다.

게임은 브라우저의 로컬 저장소를 사용합니다. 같은 웹 주소에서는 기존 진행이 이어집니다. 다른 주소나 Android 앱으로 옮길 때는 게임 설정의 백업 내보내기·불러오기를 사용할 수 있습니다.
