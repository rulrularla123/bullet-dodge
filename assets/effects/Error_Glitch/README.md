# 오류 / 글리치 효과

오류 보스 기믹은 `updateErrorBoss`, 노드/분열체/파동 시각화는 `renderErrorBossMechanics`에서 관리합니다.

실제 효과는 `game.js`의 `renderErrorSpriteFringe`, `renderErrorLine`, `renderErrorLaser`, `renderErrorVolley`, `renderErrorScreenEffect`에서 Canvas로 그립니다. 별도 스프라이트를 짧게 반복하지 않습니다.

- Pink #ff55b5 / Cyan #00eeff, 흰 피격 중심. 공격 수치·경고 시간 변경 없음.
- 잡몹은 5~9px 색상 분리(48% 잔상), 기체별 2~4개 수평 슬라이스 밀림과 5~9개 외곽 파편. 탄환·보스는 기존 강도 유지. 연속 레이저/전류, 개별 탄환 색상 위상.
- 화면 오류: 5초. 최대 5개 반투명 수평 구간과 12개 작은 데이터 블록, HUD 아래에만 표시. 일시정지 중 효과도 정지.
- 게임에서 T12 진입 시에만 적용하며 기존 단계의 공격은 그대로 유지.
- 시각 자료 참고: https://shaders.com/docs/components/glitch — RGB split, horizontal bands, scanlines. 구현은 프로젝트 전용 코드.

보스는 강화된 외곽 파편 탄환과 본체 수평 슬라이스를 사용합니다. 파동 피격 시 플레이어와 일반 탄환에 글리치가 옮으며, 화면 좌상단에 잔여 오류 시간과 명중률 50%가 표시됩니다. 노드 잠금/10초 개방/개별 HP와 분열체 대응 번호는 각각 표시합니다.

성능: 잔상은 원본 픽셀 크기의 색상 텍스처를 캐시하여 공유하고, 고정 방향 몸체 스탬프도 공유합니다. 동적 회전만 재사용 버퍼에 다시 그립니다. 화면 오류는 전체 화면 대신 영향받는 5개 줄만 작은 버퍼에 복사합니다. 캐시는 각각 128/64개로 제한됩니다.
