# 인플루언서 정보 등록 - 상세 유스케이스

## Primary Actor
회원가입 완료 후 인플루언서 역할을 선택한 사용자

## Precondition
- 회원가입 완료 및 이메일 인증 완료
- 인플루언서 역할 선택됨
- 로그인 상태

## Trigger
회원가입 완료 후 인플루언서 정보 등록 페이지 접근

## Main Scenario
1. 인플루언서 정보 입력 폼 표시
2. 생년월일 입력 (만 14세 이상 검증)
3. SNS 채널명 입력 (인스타그램, 유튜브 등)
4. SNS 채널 URL 입력 및 형식 검증
5. 팔로워 수 입력 (숫자 검증)
6. 입력 정보 유효성 검사
7. 인플루언서 프로필 DB 저장
8. 채널 검증 프로세스 시작 (비동기)
9. 체험단 지원 권한 부여
10. 성공 메시지 표시 및 홈으로 이동

## Edge Cases
- 만 14세 미만: 가입 불가, 나이 확인 메시지
- 잘못된 SNS URL 형식: 형식 안내 후 재입력 유도
- 중복 채널명: 다른 인플루언서 사용중 안내
- 팔로워 수 비정상적 입력: 합리적 범위 검증 (0-1억)
- 채널 검증 실패: 재검증 요청 기능 제공

## Business Rules
- 생년월일 기준 만 14세 이상만 인플루언서 등록 가능
- SNS URL 형식 유효성 검사 (각 플랫폼별 패턴)
- 팔로워 수는 정수만 허용, 0 이상 100,000,000 이하
- 채널명 중복 불가 (플랫폼 내 유니크)
- 검증 실패 시 재등록 가능
- 인플루언서 등록 완료 전까지 체험단 지원 불가

## Sequence Diagram
```
@startuml
actor "User" as U
participant "Frontend" as FE
participant "Backend" as BE
participant "Database" as DB
participant "Verification Service" as VS

U -> FE: 인플루언서 정보 등록 페이지 접근
FE -> U: 정보 입력 폼 표시

U -> FE: 생년월일 입력
FE -> FE: 만 14세 이상 검증

U -> FE: SNS 채널 정보 입력\n(채널명, URL, 팔로워수)
FE -> FE: 입력값 유효성 검사

FE -> BE: 인플루언서 정보 등록 요청

BE -> BE: 비즈니스 규칙 검증\n(나이, 형식 등)
BE -> DB: 인플루언서 프로필 저장
DB -> BE: 저장 완료 응답

BE -> VS: 채널 검증 요청\n(비동기 처리)

VS -> VS: SNS 채널 접근성 검증
VS -> DB: 검증 결과 업데이트

BE -> FE: 등록 완료 응답
FE -> U: 성공 메시지 및 홈 이동

@enduml
```
