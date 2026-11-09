# Pixel Game Assets

Figma 원본 픽셀 이미지 43개를 저장했습니다.

## 등급 순서

오른쪽 열의 아래에서 위로 5개씩, 이후 왼쪽 열로 이동합니다. 아래쪽 5열이 Tier_01~Tier_05, 위쪽 3열이 Tier_06~Tier_08입니다.

- `enemies/Tier_01/` ~ `enemies/Tier_10/`: 잡몹 전용 폴더. 초기 Figma 8등급에 추가 제작 2등급을 포함합니다.
- `Enemy_01.png` ~ `Enemy_04.png`: 각 열의 아래에서 위로 첫 번째~네 번째 이미지
- `bosses/Tier_XX/Boss.png`: 각 열의 다섯 번째, 가장 위에 있는 보스 이미지
- `extras/Single_Sprite.png`: 맨 아래의 단독 이미지
- `bosses/Final_Boss/Final_Boss_Shadow.png`: Figma 오른쪽의 그림자 모습, 최종보스 공개 전 단계
- `bosses/Final_Boss/Final_Boss_Revealed.png`: Figma 왼쪽의 진짜 모습, 정체를 드러낸 최종보스
- 최종보스 진행: `Shadow` → `Revealed`
- `manifest.json`: 등급, 순번, 역할, Figma 노드와 파일 경로의 대응표

원본 이미지의 크기와 투명도를 유지했습니다. 게임에서 확대할 때는 픽셀 보간을 끄거나 웹에서는 `image-rendering: pixelated`를 적용하세요.

## 현재 폴더 구분

- `enemies/`: 잡몹 1~4단계 전용
- `bosses/`: 모든 보스 본체
- `bosses/Tier_04/Escorts/`, `bosses/Final_Boss/Escorts/`: 보스별 호위기
- `bosses/Chain_Boss/Parts/`: 연결형 보스의 머리·몸통·칼 부품
- [보스 폴더와 실제 진행 순서](bosses/README.md)
