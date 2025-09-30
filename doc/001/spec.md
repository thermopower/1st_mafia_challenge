# 회원가입 & 역할선택 - 상세 유스케이스

## Primary Actor
신규 사용자 (아직 플랫폼에 가입하지 않은 사람)

## Precondition
- 사용자가 플랫폼 방문
- 인터넷 연결 가능
- 이메일 또는 소셜 로그인 지원

## Trigger
사용자가 "회원가입" 버튼 클릭

## Main Scenario
1. 사용자 정보 입력 폼 표시
2. 이름, 휴대폰번호, 이메일 입력
3. 약관 동의 체크박스 선택
4. 광고주/인플루언서 역할 선택
5. 이메일 인증 방식 선택
6. 입력 정보 유효성 검사
7. Supabase Auth 계정 생성
8. 사용자 프로필 기본 정보 저장
9. 선택된 역할 정보 저장
10. 인증 메일 발송
11. 역할별 정보 등록 페이지로 이동

## Edge Cases
- 중복 이메일: 이미 가입된 이메일 안내 후 재입력 유도
- 휴대폰번호 중복: 다른 계정 사용중 안내
- 인증 메일 미도착: 재발송 기능 제공, 스팸함 확인 안내
- 약관 미동의: 가입 진행 불가, 필수 체크 안내

## Business Rules
- 이메일 형식 유효성 검사 필수
- 휴대폰번호 형식 검증 (한국 번호 기준)
- 만 14세 미만 가입 불가
- 광고주/인플루언서 역할 중 하나만 선택 가능
- 이메일 인증 완료 전까지 서비스 일부 기능 제한
- 개인정보 보호법 준수

## Sequence Diagram
```
@startuml
actor "User" as U
participant "Frontend" as FE
participant "Backend" as BE
participant "Database" as DB
participant "Email Service" as ES

U -> FE: 회원가입 버튼 클릭
FE -> U: 회원가입 폼 표시

U -> FE: 사용자 정보 입력\n(이름, 휴대폰번호, 이메일)
FE -> FE: 입력값 유효성 검사

U -> FE: 약관 동의 체크
U -> FE: 역할 선택\n(광고주/인플루언서)
U -> FE: 인증 방식 선택\n(이메일/외부)

FE -> BE: 회원가입 요청\n(사용자 정보 + 역할 + 인증방식)

BE -> BE: 입력값 검증
BE -> DB: 사용자 프로필 생성
DB -> BE: 프로필 ID 반환

BE -> BE: Supabase Auth 계정 생성
BE -> ES: 인증 메일 발송 요청

ES -> U: 인증 메일 발송

BE -> FE: 가입 완료 응답\n(프로필 ID + 인증 대기 상태)

FE -> U: 가입 완료 메시지 표시
FE -> U: 역할별 정보 등록 페이지로 이동

@enduml
```
