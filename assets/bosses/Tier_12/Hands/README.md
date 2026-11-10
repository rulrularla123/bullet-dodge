# 오류 보스 양손 구조

원본 검정 PNG 세 장을 그대로 보관하며, 런타임에서만 부품별로 잘라 관절에 연결합니다. 원본 파일과 SHA-256은 manifest.json에 기록했습니다.

- Part1_Arm → Part2_Arm → 손바닥 순서로 연결합니다.
- Hands.png의 위쪽 두 부품은 엄지, 중간 두 부품은 세 손가락의 두 마디, 아래 부품은 손바닥입니다.
- 위·아래 두 손은 서로 반전됩니다. 팔꿈치, 손목, 손가락을 움직일 수 있습니다.
- 손 본체는 원본 검정색입니다. 청록·분홍 잔상은 뒤에만 그립니다.
- 구현은 루트 error-hands.js에 있습니다. Preview.html에서 펼침·잡기·주먹·관절 표시를 확인할 수 있습니다.
- 게임의 검증 도구에서 ‘B12 양손 구조 미리보기’를 누르거나 ?errorHands=1&paused=1&errorPreview=1로 엽니다.
- 아직 3페이즈 진입 조건, 공격 패턴, 손의 충돌 판정은 연결하지 않았습니다.

오류 탄환 효과는 오류 웨이브/테스트 및 살아 있는 오류 보스 전투에 한정됩니다. 최종 보스 전투에서는 내부 단계 값이 12로 남더라도 효과가 이어지지 않도록 수정했습니다.

검증: 손 구조와 관절 연속성, 원본 크기/경로, 미리보기 정지·초기화, 오류 보스 이후 탄환·레이저 및 기존 오류 전투/보급품 관련 41개 시나리오 통과. 배포 빌드 306개 파일 생성 확인.

## 3페이즈 출현 연출

손이 먼저 비행기 외벽에 나타나 움켜쥡니다. 손목을 그 자리에 유지한 상태로 팔꿈치를 위아래로 솟게 해 두 차례에 걸쳐 팔을 꺼냅니다. 팔이 완전히 나온 뒤에 손을 떼어 안쪽으로 꺾인 대기 자세를 잡습니다. 첫 번째 팔은 원본 비율에서 20% 길어졌고, 두 번째 팔은 팔꿈치에서 안쪽으로 비스듬히 내려옵니다. 팔 뿌리는 비행기 몸체 안에 고정됩니다. 출현 후 손목과 손가락은 작게 움직입니다.

Preview.html의 ‘3페이즈 진입 재생’으로 다시 재생하고 ‘진입 시간’으로 중간 장면을 멈춰볼 수 있습니다. 게임 검증 도구에도 연결되어 있습니다. 기존 오류 보스의 체력이 0이 되면 실제 3페이즈 전투로 전환됩니다.

추가 검증: 손목이 외벽을 짚는 동안 위치가 유지되는지, 팔꿈치가 먼저 솟는지, 출현 전체 120fps 샘플에서 관절이 유한하고 끊김 없이 연결되는지 확인했습니다. 관련 시나리오 42개 통과.

## 실제 3페이즈 전투

- error-phase3.js가 양손 전투 상태·공격·장판·안개를 관리합니다. game.js는 전투 전환, 공격 충돌, HUD와 보상 흐름을 연결합니다.
- 본체 체력을 소진하면 기존 탄환·레이저·노드·분열·파동·텔레포트·운석을 정리하고 출현 연출을 시작합니다. 진입 중에는 손이 무적입니다.
- 두 손은 각각 10,000 HP입니다. 본체와 팔은 공격 대상이 아니며, 손바닥과 손가락이 공격 대상입니다. 일반탄·관통탄은 손마다 한 번 맞고, 스킬 레이저는 기존 확정 틱 피해를 줍니다.
- 본체 양손은 0.95초간 관절로 힘을 모은 뒤 0.62초간 큰 호를 그리며 휘두르고 1.15초 동안 반동을 회수합니다. 팔꿈치를 고정된 방향으로 유지하고, 아래 손은 손가락까지 위 손과 반전됩니다. 세 번째 행동마다 0.95초간 손을 벌려 충전한 뒤 기존 Stage 01/02/03 PNG 레이저 모델을 재사용하며, 길이 500px·반폭 18px로 2.6초간 0.95rad 천천히 회전시켜 쏩니다. 끝부분은 투명하게 흩어지는 글리치 입자로 마감합니다. 손끝 휘두르기/레이저 접촉은 1 HP 피해입니다. 노출된 첫 번째·두 번째 팔 접촉은 방어막/피격 무적과 관계없이 즉사합니다(검증용 무적 제외). 진입 연출과 경고만 있는 구간은 제외합니다.
- 긁기와 레이저는 7.5초 동안 상태 이상 장판을 남깁니다. 불규칙한 검은 사각형과 청록·분홍 글리치 조각으로 표현하며, 장판 자체는 HP 피해 없이 오류 상태를 8초로 갱신합니다. 장판 최대 100개, 가장자리 작은 팔 최대 2개로 제한됩니다.
- 위/아래에서 나오는 팔도 본체 양손과 같은 3.6 스케일을 사용합니다. 1초간 위치를 예고한 뒤 손을 내밀고, 한 방향으로 약 310px를 1.5초 동안 길게 긁은 다음 회수합니다. 위/아래는 서로 반전되며 손끝 경로에서 장판이 생성됩니다. 이 팔들도 접촉 시 즉사합니다.
- 좌우 검은 글리치 안개는 각각 화면의 10%입니다. 중앙 80%가 이동 공간이며, 진입 경고가 끝난 후 안개 접촉은 방어막·피격 무적과 관계없이 즉사합니다. 검증용 무적 모드는 예외입니다.
- 안개의 플레이어 범위와 보스의 이동 영역은 독립적입니다. 보스 중심 이동 영역은 화면 X 65~84%, Y 26~74%이며, 몸체가 안개에 가려지지 않습니다. 안개 폭만 바꿔도 보스 이동 영역은 변하지 않습니다.
- 평소에는 범위 선을 그리지 않습니다. 검증 도구의 ‘이동 범위’는 안개 경계를, ‘보스 이동 범위’는 별도의 보스 중심 이동 영역을 표시합니다.
- 한 손이 다운되면 그 손은 공격을 멈춥니다. 두 손이 모두 다운되면 공격과 장판이 즉시 종료되고, 모든 팔과 안개가 사라지는 동시에 본체가 글리치로 삭제됩니다. 이후에만 기존 12단계 보상/회복/최종 보스 진행을 한 번 실행합니다.

테스트: ?phase=boss&tier=12&p3=1&simSeconds=11&paused=1&errorPreview=1 또는 검증 도구의 ‘B12 3페이즈 전투’. 관련 시나리오 55개, 30/60fps 반복 패턴·삭제·진입·양손 독립 피해·안개 즉사·무피해 장판·범위 표시 및 기존 오류/보급품 회귀 검증 통과. 배포 빌드 307개 파일 생성 확인. 이번 변경은 로컬에만 반영했습니다.

## 동작 검증과 발사 버그 수정

검증 도구에 ‘B12 양손 휘두르기’, ‘B12 손 레이저’, ‘B12 위·아래 팔’을 추가했습니다. 누르면 일시정지를 해제하고 해당 동작을 재생합니다. URL에서 handAttack=swing/laser/edge로도 지정할 수 있습니다.

양손 연출 미리보기에서도 일반 발사를 허용합니다. 기존 미리보기용 1,000,000초 발사 대기시간이 보스/웨이브/최종 보스/3페이즈로 넘어갈 때 남지 않도록 공통 종료 처리를 추가했습니다.

추가 검증: 반전된 두 손의 관절/손가락 좌표, 연속적인 회전 궤적과 일정한 뼈 길이, 레이저 각도·원뿔 충돌·총구 추적·장판 갱신, 본체와 위아래 팔의 즉사, 1.5초짜리 긴 긁기, 미리보기 발사 및 모든 다음 전투의 발사 복구를 확인했습니다. 관련 시나리오 62개 통과.

## 괴물 손가락·기존 모델·붙잡기

레이저는 새 원뿔형 도형을 그리지 않습니다. game.js의 renderHandLaserModel에서 기존 getLaserStrip과 Pink/Cyan PNG를 재사용합니다. 끝부분만 마스크로 흐리게 하고 글리치 조각을 더합니다. 모델/단계/길이별 최대 12개 마스크를 캐시합니다.

각 손가락의 첫 마디와 끝마디, 엄지의 두 마디를 별도로 회전시킵니다. 긁기는 순차적으로 갈고리를 세우고, 레이저는 손바닥 앞쪽 공간을 열어 발사하며, 붙잡기는 엄지가 반대편에서 닫히고 세 손가락이 기체를 감쌉니다. 위아래 팔은 맵 전체에서 무작위로 나오고 방향·길이·깊이·기울기·팔꿈치 굽힘 방향을 달리합니다. 경고 뒤 글리치 균열에서 나타나 긴 긁기를 한 번 수행합니다.

팔 접촉은 HP를 즉시 0으로 만들지만 게임 오버 화면을 즉시 띄우지는 않습니다. 1.85초 동안 손이 접촉 지점으로 뻗어 움켜쥐고, 기체를 당겨 압축한 뒤 픽셀로 흩뜨립니다. 다른 전투·입력·발사는 정지하고, 플레이어는 손바닥 뒤층과 손가락 앞층 사이에 그립니다. 압착 연출도 일시정지되며 재시작/다른 검증 장면으로 정상 복구됩니다. 안개 접촉은 기존 즉사 처리를 유지합니다.

검증 도구 ‘B12 붙잡기·압착’, 또는 ?phase=boss&tier=12&p3=1&handAttack=grab&simSeconds=1.1&paused=1&errorPreview=1로 중간 자세를 확인할 수 있습니다. 기존 레이저 PNG 재사용/캐시, 공격별 손가락 구조, 무작위 팔, 본체·상단·하단 팔의 포획→압착→게임오버, 일시정지/복구를 포함한 관련 시나리오 68개 통과.

## 압박·후방 팔 조정

양손의 대기/레이저 자세 간격을 넓혔습니다. 기존 PNG 레이저 사거리는 310→500px, 충전 1.15→0.95초, 지속 3.2→2.6초, 훑는 각도 0.6→0.95rad입니다. 끝부분은 하늘색·흰 파랑 글리치 조각과 푸른 안개로 연결됩니다. 검은 장판 바탕은 유지하고 색 분리·깜빡임 조각을 강화했습니다.

본체 휘두르기 각도는 1.55→2.05rad, 실제 휘두르기 시간은 0.9→0.62초로 바꿨습니다. 보스는 별도 이동 범위 안에서 플레이어 위치를 따라가며 궤도 오프셋과 가속/감속으로 압박합니다. X/Y 최고 속도는 160/210px/s이고, 조작/공격 판정과 위치가 함께 움직입니다.

팔은 위·아래뿐 아니라 플레이어의 뒤쪽인 왼쪽 안개에서도 나타납니다. 후방 팔은 세로 경고 뒤 원래 크기의 팔 관절 전체가 오른쪽으로 뻗어 한 번 길게 긁습니다. 위치·방향·자세는 무작위이며 세 방향을 합쳐 최대 2개입니다. 팔 접촉 시 붙잡기·압착은 동일하게 적용됩니다. 검증 도구 ‘B12 후방 팔’, 또는 handAttack=rear로 확인합니다.

관련 시나리오 72개 통과: 긴 레이저/하늘색 끝 조각, 큰 휘두르기·손 간격, 플레이어 추적·가속/속도 범위, 후방 팔 출현·회전 관절·압착, 실제 반복 공격 모든 프레임 관절 유한성 등.

## 관절 뒤집힘·레이저 회피·역방향 긁기 수정

휘두르기의 팔꿈치 굴곡 방향을 대기/조준 자세와 동일하게 맞췄습니다. 어깨가 먼저 움직이고 팔꿈치는 뒤늦게 펴졌다가 완전히 펴지기 전에 다시 접히며, 손목이 마지막에 따라옵니다. 어깨 회전은 1.7rad, 휘두르기는 0.78초, 복귀는 1.35초이며 손목은 ±1.05rad 안에서 움직입니다. 포획 중에도 원래 팔꿈치 방향을 유지합니다.

레이저는 1.35초 충전 중 마지막 0.45초 동안 발사 방향을 안정적으로 유지합니다. 사거리 500px는 그대로 두고, 3.8초 동안 최대 0.5rad를 훑으며 초당 0.14rad를 넘지 않습니다. 본체는 발사 중 X/Y 약 35/45px/s로 감속하고, 두 손의 레이저와 새 휘두르기는 겹치지 않도록 순서대로 대기합니다. 후방으로 갑자기 조준을 돌리지 않습니다.

위/아래 팔은 랜덤한 출현 위치를 유지하되 이동 방향만 뒤집던 동작과 랜덤한 팔꿈치 방향을 제거했습니다. 같은 손 자세와 일치하는 방향으로 한 번 쭉 긁고, 아래 손은 위 손을 세로 반전합니다. 실제 긁기 구간의 손목은 역주행하지 않습니다.

관련 시나리오 75개 통과: 준비→휘두르기→복귀 전 구간의 굴곡 방향/손목 한계, 발사 직전 예고 일치, 초당 레이저 회전 제한, 한 손씩 발사, 느려진 본체, 집중 이동보다 빠르지 않은 빔 끝 이동, 위/아래 팔의 단방향 긁기를 확인했습니다.


## 손 공격 다양화·장판 확산

- Main melee alternates SWING / THRUST / HOOK / RAKE, retaining every-third-cycle serialized laser. Thrust extends the original fixed-length elbow chain to a 285px wrist reach; never stretch the bones. Hook wraps through an arc; rake uses three independent fingertip ground trails. Thrust/hook contact can initiate the existing grab/crush. All styles preserve mirrored lower anatomy, negative elbow flexion and ±1.05rad wrist limits, including windup/recovery. Verification includes individual replay buttons.
- Replace main melee dashed path markers with faint future hand/glitch silhouettes. Ground grows from contact over 0.25–0.45s with stable, seeded black tile positions and staggered local growth; colored tears fade in with tiles. Match corruption contact to the expanding segment/width, retain 7.5s life and 100-pool cap.


## 팔 전체 피격·관절 재구성

양손은 이제 팔 전체·손목·손바닥·엄지·각 손가락 마디에서 피해를 받습니다. 판정 간격은 최대 16px, 반지름은 팔 20 / 손바닥 28 / 손가락 16px이며 한 공격이 같은 손의 여러 판정에 닿아도 한 번만 적용됩니다.

팔꿈치·손목의 원본 부품 끝을 검은 픽셀 관절로 겹쳐 연결했습니다. 손목은 전완 기준으로 보간하고 휘어잡기·긁기는 팔꿈치를 접었다 펴면서 어깨를 회전시킵니다. 고정된 V자 팔 전체를 회전시키는 모양을 줄이고 기존 뼈 길이와 아래 손 반전은 유지합니다.


## 휘두르기 새 동작

기존 굽힌 V자 휘두르기를 교체했습니다. 준비 중 팔을 먼저 펴고, 실제 휘두르기에서는 팔꿈치 굴곡 -0.09~ -0.28rad로 긴 팔을 유지하며 어깨를 중심으로 2.14rad를 쓸어냅니다. 손목이 뒤늦게 풀리고, 일반 휘두르기 전용 손가락은 타격 중 펼쳐졌다가 후속 동작에서 느슨하게 접힙니다. 별도의 휘어잡기·포획은 의도적으로 팔을 굽힙니다.

- Parallel hand revision supersedes serialized attack rules: each living main hand runs its own timer/cycle with no waiting on the other hand. Laser/laser and laser/melee overlap are allowed; preserve per-hand warning and angular limits. Capture preserves source palm heading, opens before gripping, closes opposing digits around a pocket 20px in front of the palm and layers the ship inside. Edge arms use constant full-length bones, translate from offscreen for emergence/retraction, and sweep a 285px wrist arc with open slash fingers; never scale bone length during entry.

- Contact/motion revision: remove the white square hit flash on palms. During melee/recovery, swept palm, thumb and both joints of every finger trigger the same fatal capture as arms; edge hands do so after their warning. Wall sweeps use a nearly straight joint-driven arm with a 1.3rad shoulder sweep and fixed bone lengths. Capture no longer oscillates wrist facing; it approaches over 0.55s, carries the ship into a palm pocket, and limits closing digit flexion below 2.1rad rather than reversing the distal joints. P3 player hull is clamped at bossBounds.left - 45px; this stops crossing behind the boss without moving its patrol bounds or restricting projectiles. Front-sector line appears only with verification player ranges.

- Choreography revision: THRUST is a narrow finger-spear, never a grab. It deals exactly 3 HP at most once per strike; arm/digit contact during stab warning, active and return must not invoke fatal capture. HOOK and paired WRAP use a separate staged hook profile with explicit proximal/distal closure and opposing thumb. Execution fingers curl both joints in the SAME direction, then thumb covers; wrist aligns within ±0.25rad of forearm after approach.
- Wall arms sweep 2.24rad with a further 0.16rad follow-through during offscreen withdrawal. Rear wall arms/roots/trails are rendered BEFORE the black fog; captured rear roots are clipped to arena space.
- Normal hands remain independent. Every ~22s after an initial 18s, both living hands perform alternating coordinated specials after current actions finish: GAP warns 1.6s, beams for 2.6s from both hands toward top/bottom bounds around map-center ±82px, using original PNG lasers of half-width 26 and leaving the center corridor open; WRAP warns 1.25s and sweeps hooked palms inward for 1.35s. Freeze boss drift for these specials only, retain warnings, stop any paired beam on hand death, then return to independent attacks. F2 has dedicated center-gap and two-hand claw buttons.

- Final choreography follow-up: during WRAP warning, boss approaches its front patrol edge at bounded speed, then stops for the active claw sweep. GAP holds the body still and uses map-height center for the guaranteed safe corridor. Closed execution fists foreshorten the projected digit lengths (0.52 fingers / 0.72 thumb at full closure) while upper/forearm lengths stay unchanged; the ship pocket moves inward with closure, and finger joint rotation remains anatomically continuous.
