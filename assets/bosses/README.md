# 보스 이미지 폴더

잡몹 이미지는 `../enemies/`, 보스 본체와 전용 부품은 이 폴더에서 관리합니다. 원본 크기·투명도·파일 내용은 그대로 보존했습니다.

```text
bosses/
├── Tier_01 ~ Tier_10/
│   └── Boss.png
├── Tier_04/
│   ├── Boss.png          # 호위기가 포함된 원본
│   ├── Boss_Body.png     # 게임에서 사용하는 분리 본체
│   └── Escorts/          # 호위기 2대, PNG와 SVG
├── Tier_12/
│   └── Boss.png          # 오류 보스 · 탄막/신호 분열
├── Final_Boss/
│   ├── Final_Boss_*.png  # 그림자·본모습·본체 원본
│   └── Escorts/          # 그림자·본모습 호위기
└── Chain_Boss/
    └── Parts/            # 머리·톱, 탄환 몸통, 칼 몸통, 칼
```

## 게임 진행 순서

기존 파일 번호를 유지해서 폴더 번호와 게임의 표시 단계가 다를 수 있습니다.

| 게임 단계 | 보스 | 폴더 |
|---|---|---|
| 1 | 기본 보스 | Tier_01 |
| 2 | 기본 보스 | Tier_02 |
| 3 | 기본 보스 | Tier_03 |
| 4 | 호위기 보스 | Tier_04 |
| 5 | 돌진 보스 | Tier_05 |
| 6 | EMP·혼란 보스 | Tier_10 |
| 7 | 미사일·폭발 보스 | Tier_06 |
| 8 | 점멸 레이저 보스 | Tier_07 |
| 9 | 연결형 보스 | Chain_Boss/Parts |
| 10 | 전류 보스 | Tier_09 |
| 11 | 레이저·돌진 편대 보스 | Tier_08 |
| 12 | 오류 보스 · 탄막/노드 분열 | Tier_12 |
| 최종 | 그림자 → 본모습 | Final_Boss |

오류 보스는 돌진 편대 다음인 **T12**이며 `Tier_12/Boss.png`와 전용 `ui/boss_bars/Tier_12_*.png`를 사용합니다. 잡몹 6종은 `../enemies/Tier_12/manifest.json`의 원본 패턴 대응표를 참조하세요.
