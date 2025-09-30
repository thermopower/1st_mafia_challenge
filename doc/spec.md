# 기능 1~9 상세 유스케이스 명세

아래 명세는 doc/userflow.md의 데이터만을 근거로 작성했습니다. 각 항목은 간결 검토용 형식(Primary Actor, Precondition, Trigger, Main Scenario, Edge Cases, Business Rules)과 PlantUML 시퀀스 다이어그램을 포함합니다.

## 1) 회원가입 & 역할선택
- Primary actor: 사용자(인플루언서 또는 광고주)
- Precondition(사용자관점): 회원가입 화면에 접근했다.
- Trigger: 이름/전화번호/이메일/역할/인증방식 입력 후 제출 클릭.
- Main scenario
  1. FE가 입력값을 클라이언트 검증한다.
  2. FE가 BE에 가입 요청을 보낸다.
  3. BE가 값 유효성 재검증 후 DB에 사용자 최소 레코드를 생성한다.
  4. BE가 인증 메일/코드를 발송 처리한다(발송 결과에 따라 분기).
  5. FE는 역할에 따라 다음 화면(인플루언서/광고주 정보 등록)으로 전환한다.
- Edge cases
  - 잘못된 이메일/전화번호: FE/BE에서 즉시 검증 실패 메시지.
  - 과도한 재시도(레이트리밋): 일정 시간 후 재시도 안내.
  - 중복 제출: BE에서 멱등 처리, 중복 생성 방지.
- Business rules
  - 입력 필수: 이름, 전화번호, 이메일, 역할, 인증방식.
  - 인증 발송 성공 시에만 다음 단계 진입.

@startuml
participant user
participant fe
participant be
participant database
user -> fe: 가입 정보 입력/제출
fe -> be: POST /signup {name, email, phone, role, verification}
be -> database: INSERT users
database --> be: OK (user id)
be -> fe: 인증 발송 결과(성공/실패)
fe -> user: 다음 단계로 분기(인플루언서/광고주)
@enduml

## 2) 인플루언서 정보 등록
- Primary actor: 인플루언서 사용자
- Precondition(사용자관점): 로그인 완료, 인플루언서 경로로 진입했다.
- Trigger: 생년월일, 채널유형, 채널 URL 입력 후 제출 클릭.
- Main scenario
  1. FE가 날짜/URL 형식 검증.
  2. FE가 BE로 프로필/채널 등록 요청 전송.
  3. BE가 influencer_profiles upsert, influencer_channels insert.
  4. BE가 채널 검증 상태를 pending으로 저장한다.
  5. FE는 채널 상태(pending)와 진행 메시지를 표시한다.
- Edge cases
  - URL 형식 오류: FE 즉시 오류 표시.
  - 이미 등록된 동일 채널: BE에서 고유 제약 충돌 → “이미 등록된 채널”.
  - 생년월일 누락/형식 오류: 입력 보완 요청.
- Business rules
  - 채널 상태 초기값: pending.
  - 동일 사용자+채널유형+URL 중복 불가.

@startuml
participant user
participant fe
participant be
participant database
user -> fe: 생년월일/채널유형/URL 입력
fe -> be: POST /influencer/profile {dob}
be -> database: UPSERT influencer_profiles
database --> be: OK
fe -> be: POST /influencer/channels {type, url}
be -> database: INSERT influencer_channels(status=pending)
database --> be: OK
be --> fe: 등록 완료(pending)
fe --> user: 상태 표시(pending)
@enduml

## 3) 광고주 정보 등록
- Primary actor: 광고주 사용자
- Precondition(사용자관점): 로그인 완료, 광고주 경로로 진입했다.
- Trigger: 업체 위치/카테고리/사업자등록번호 입력 후 제출 클릭.
- Main scenario
  1. FE가 필수값 검증.
  2. FE가 BE로 광고주 프로필 등록 요청 전송.
  3. BE가 형식 검증 후 advertiser_profiles upsert.
  4. 사업자등록번호 중복 여부를 DB에서 확인(UNIQUE).
  5. FE는 결과를 표시하고 관리 권한 화면으로 이동.
- Edge cases
  - 사업자등록번호 중복: “이미 등록된 사업자번호”.
  - 필수값 누락: 즉시 오류.
  - 서버 오류: 재시도 안내.
- Business rules
  - verification_status 초기값 pending.
  - 사업자등록번호 UNIQUE.

@startuml
participant user
participant fe
participant be
participant database
user -> fe: 위치/카테고리/사업자번호 입력
fe -> be: POST /advertiser/profile
be -> database: UPSERT advertiser_profiles
database --> be: UNIQUE 충돌 여부
be --> fe: 등록 성공/실패 응답
fe --> user: 결과 표시 및 관리 진입
@enduml

## 4) 탐색 & 체험단 목록 검색
- Primary actor: 사용자(인플루언서 중심)
- Precondition(사용자관점): 목록 화면에 접근했다.
- Trigger: 검색어/필터/정렬 선택.
- Main scenario
  1. FE가 선택값을 쿼리로 변환.
  2. FE가 BE에 모집중 캠페인 목록 요청.
  3. BE가 DB에서 status=recruiting 조건으로 조회, 정렬/필터 적용.
  4. FE가 카드 리스트를 렌더링.
- Edge cases
  - 결과 없음: 빈 상태 표시.
  - 잘못된 필터 값: 기본값으로 대체.
- Business rules
  - 목록에는 모집중(status=recruiting)만 표시.

@startuml
participant user
participant fe
participant be
participant database
user -> fe: 검색/필터/정렬 설정
fe -> be: GET /campaigns?status=recruiting&...
be -> database: SELECT campaigns WHERE status='recruiting'
database --> be: rows
be --> fe: 리스트 데이터
fe --> user: 카드 리스트 표시
@enduml

## 5) 체험단 상세
- Primary actor: 인플루언서 사용자
- Precondition(사용자관점): 상세 페이지에 진입했다.
- Trigger: 목록 카드 클릭.
- Main scenario
  1. FE가 BE에 캠페인 상세 요청.
  2. BE가 DB에서 기간/혜택/미션/매장/모집인원 조회.
  3. BE가 사용자의 인플루언서 등록 완료 여부 확인.
  4. FE가 상세 정보와 지원 버튼(조건부)을 표시.
- Edge cases
  - 캠페인 없음/종료: 알림 후 목록으로.
  - 권한 미충분(미등록 인플루언서): 등록 유도.
- Business rules
  - 상세는 존재하는 캠페인에 한해 표시.
  - 지원 버튼은 인플루언서 등록 완료시에만 노출.

@startuml
participant user
participant fe
participant be
participant database
user -> fe: 카드 클릭(상세 진입)
fe -> be: GET /campaigns/{id}
be -> database: SELECT campaigns by id
be -> database: SELECT influencer_profiles by user
database --> be: 캠페인/프로필
be --> fe: 상세 + 지원가능여부
fe --> user: 상세 표시/지원 버튼
@enduml

## 6) 체험단 지원
- Primary actor: 인플루언서 사용자
- Precondition(사용자관점): 상세 페이지에서 지원 버튼을 볼 수 있다.
- Trigger: 각오 한마디, 방문 예정일자 입력 후 제출.
- Main scenario
  1. FE가 필수값 검증.
  2. FE가 BE로 지원 생성 요청.
  3. BE가 기간 유효성 확인(end_date 전인지), 중복지원 여부 확인.
  4. BE가 applications 레코드 생성(status=applied) 및 감사 로그 기록.
  5. FE는 성공 메시지와 지원목록 갱신.
- Edge cases
  - 중복 지원: “이미 지원됨”.
  - 모집기간 종료: “모집 종료”.
  - 필수값 누락/형식 오류: 입력 보완 요청.
- Business rules
  - (campaign_id, influencer_id) 유니크.
  - planned_visit_date는 캠페인 기간 내여야 함(앱 레이어 검증).

@startuml
participant user
participant fe
participant be
participant database
user -> fe: 각오/방문예정일 입력 후 제출
fe -> be: POST /applications
be -> database: SELECT campaigns by id
be -> database: SELECT applications WHERE (campaign,user)
be -> database: INSERT applications(status=applied)
be -> database: INSERT audit_logs(event='application_submitted')
database --> be: OK
be --> fe: 지원 성공
fe --> user: 성공 알림/목록 갱신
@enduml

## 7) 지원목록 (인플루언서용)
- Primary actor: 인플루언서 사용자
- Precondition(사용자관점): 로그인 상태, 지원목록에 접근했다.
- Trigger: 상태 필터 선택.
- Main scenario
  1. FE가 상태 필터를 쿼리로 구성.
  2. FE가 BE에 내 지원목록 요청.
  3. BE가 applications에서 내 레코드를 상태 기준으로 조회.
  4. FE가 리스트를 표시한다(신청완료/선정/반려).
- Edge cases
  - 결과 없음: 빈 상태 표시.
- Business rules
  - 본인 소유 데이터만 조회.

@startuml
participant user
participant fe
participant be
participant database
user -> fe: 상태 필터 선택
fe -> be: GET /me/applications?status=...
be -> database: SELECT applications WHERE user=me AND status in ...
database --> be: rows
be --> fe: 리스트
fe --> user: 상태별 목록 표시
@enduml

## 8) 광고주 체험단 관리(등록)
- Primary actor: 광고주 사용자
- Precondition(사용자관점): 로그인 상태, 체험단 관리 화면에 접근했다.
- Trigger: 신규 등록 다이얼로그에서 정보 입력 후 제출.
- Main scenario
  1. FE가 필수값 검증.
  2. FE가 BE로 캠페인 생성 요청.
  3. BE가 권한 확인(광고주), 기간 체크, 필수값 검증.
  4. BE가 campaigns 생성(status=recruiting).
  5. FE가 목록을 갱신한다.
- Edge cases
  - 권한 없음: 접근 거부.
  - 기간 역전(start>end): 입력 보완 요청.
- Business rules
  - 생성 시 status=recruiting.
  - recruit_count > 0, 기간 유효.

@startuml
participant user
participant fe
participant be
participant database
user -> fe: 신규 캠페인 정보 입력
fe -> be: POST /campaigns
be -> database: INSERT campaigns(status='recruiting')
database --> be: OK
be --> fe: 생성 성공
fe --> user: 목록 갱신
@enduml

## 9) 광고주 체험단 상세 & 모집 관리
- Primary actor: 광고주 사용자
- Precondition(사용자관점): 내 캠페인 상세 화면에 접근했다.
- Trigger: 모집종료 전환, 지원자 선정/반려 수행.
- Main scenario
  1. FE가 BE에 상세/지원자 리스트 요청.
  2. 광고주가 모집종료를 선택하면 BE가 campaigns.status=closed로 전환.
  3. 광고주가 지원자들을 선택/반려하면 BE가 applications.status를 selected/rejected로 갱신.
  4. FE는 결과를 반영해 상태를 갱신한다.
- Edge cases
  - 이미 종료된 모집: 중복 종료 불가.
  - 권한 없음: 접근 거부.
- Business rules
  - 모집종료 후에는 추가 지원 생성 불가.
  - 선정/반려는 해당 캠페인 지원자에 한해 가능.

@startuml
participant user
participant fe
participant be
participant database
user -> fe: 캠페인 상세/모집 관리 진입
fe -> be: GET /campaigns/{id}/applicants
be -> database: SELECT applications WHERE campaign=id
be --> fe: 지원자 리스트
user -> fe: 모집종료/선정/반려 명령
fe -> be: PATCH /campaigns/{id} status=closed
be -> database: UPDATE campaigns SET status='closed'
be --> fe: OK
fe -> be: PATCH /applications/{ids} status=selected/rejected
be -> database: UPDATE applications SET status=...
be --> fe: OK
fe --> user: 상태/결과 갱신
@enduml

