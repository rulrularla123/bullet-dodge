# 전기 레이저 애니메이션

사용자 전기 이펙트를 참고해 내장 image_gen으로 제작한 청록색 전기 빔. 7개의 서로 다른 프레임을 약 12 FPS로 반복한다.

- `Preview.html`: 화면 양끝까지 뻗는 애니메이션, 방향/속도 선택.
- `Electric_Laser_Loop.gif`: 어두운 배경의 반복 미리보기.
- `Electric_Laser_Spritesheet.png`: 투명 PNG 세로 시트, 1254 × 1064.
- `frames/`: 투명 PNG 7장, 각 1254 × 152.
- `manifest.json`: 프레임 크기와 재생 정보.
- `Electric_Original.png`: 사용자 원본 보존.
- `Electric_Laser_Generated_Source.png`: 생성 원본 보존.

## 게임 연결

현재 게임에는 연결하지 않은 신규 보스용 에셋이다. 생성 결과의 실제 전기 줄기 7개를 각각 추출해 정규 프레임으로 포장했다. PNG의 투명도를 유지했고 GIF에만 확인용 어두운 배경을 사용했다.

빔을 여러 조각으로 반복해서 붙이지 말고 매 프레임 전체를 총구에서 화면 끝까지 한 번 그린다. 실제 공격 판정 역시 같은 시작/끝 좌표를 사용한다. 총구 기준으로 자연스럽게 왼쪽으로 뻗도록 그리려면 아래 방식을 사용한다. 오른쪽 발사는 반대로 `edgeX = viewportWidth`를 지정한다.

```js
const frame = Math.floor(elapsedSeconds * 12.5) % 7;
const edgeX = -16; // 논리 화면 왼쪽 끝보다 16px 바깥까지
const length = muzzleX - edgeX;
ctx.save();
ctx.imageSmoothingEnabled = false;
ctx.translate(muzzleX, muzzleY);
ctx.scale(-1, 1);
ctx.drawImage(sheet, 0, frame * 152, 1254, 152,
  0, -beamHeight / 2, length, beamHeight);
ctx.restore();
```

빔 높이는 별도로 유지하고 길이만 화면 너비에 맞추므로 원본 이미지 너비가 사거리 제한이 되지 않는다. `beamHeight`는 전체 투명 프레임 높이이며 실제 밝은 전기 중심부보다 넓다. 명확한 위험 범위가 필요한 게임 연결 시에는 판정 폭과 예고 폭을 따로 정한다.

## 생성 방식 / 최종 프롬프트

내장 image_gen 사용. 사용자 PNG를 스타일 참조로 전달하고 다음 제작 프롬프트를 사용했다. 원래 요청은 8행이었으나 생성물에는 전기 빔 7개가 있어 실제 결과에 맞춰 7프레임으로 정리했다.

`Generation_Prompt.txt`에 실제 전달한 전체 프롬프트를 저장했다.

## 이동 규칙 전기선 색상

- `Electric_Laser_Blue_Spritesheet.png`: 파란색. 멈춰 있으면 통과 가능.
- `Electric_Laser_Red_Spritesheet.png`: 빨간색. 움직이는 동안 통과 가능.
- 두 시트 모두 1362 × 1155, 세로 7프레임(각 높이 165), 투명 RGBA입니다.
- 내장 image_gen으로 기존 시트를 색상 변경했습니다. 생성 프롬프트는 `Generation_Prompt_Blue.txt`, `Generation_Prompt_Red.txt`, 프레임 정보는 각각 `_manifest.json` 파일에 저장했습니다.
- 게임에서는 프레임을 회전해 위아래 끝을 잇는 선으로 그립니다.
