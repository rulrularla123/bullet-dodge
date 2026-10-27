# Vercel 배포

이 폴더가 Vercel 프로젝트의 Root Directory입니다. 현재 게임은 정적 HTML/CSS/JavaScript이며 서버나 외부 패키지가 필요하지 않습니다.

## 설정

- Framework Preset: Other
- Build Command: `npm run build`
- Output Directory: `dist`
- `vercel.json`에 위 설정이 저장되어 있습니다.

`scripts/prepare-deploy.mjs`가 현재 게임의 실제 preload 목록을 읽어 게임 파일, 사용 중인 PNG와 배경 폴백 SVG만 모읍니다. 원본 파일은 수정하지 않고 배포용 `dist/`를 생성합니다. 디자인 문서, 참고 시안과 38MB짜리 전체 배경 SVG는 공개 출력에 포함되지 않습니다.

## 배포 전 확인

```sh
npm run build
python3 -m http.server 8080 --directory dist
```

브라우저에서 `http://localhost:8080`을 열어 확인합니다.

## 자동 배포

게임 전용 Git 저장소를 Vercel 프로젝트에 연결하면 지정한 프로덕션 브랜치로 푸시할 때 자동 배포할 수 있습니다. 상위 홈 디렉터리에 잡히는 다른 프로젝트 저장소를 이 게임에 사용하면 안 됩니다.

Vercel 계정 인증과 프로젝트 연결 전까지는 배포 준비 상태이며, 배포 성공 URL이 반환되어 확인되기 전에는 실제 공개된 것이 아닙니다.
