# 광고주 정보 등록 - 상세 유스케이스

## Primary Actor
회원가입 완료 후 광고주 역할을 선택한 사용자

## Precondition
- 회원가입 완료 및 이메일 인증 완료
- 광고주 역할 선택됨
- 로그인 상태

## Trigger
회원가입 완료 후 광고주 정보 등록 페이지 접근

## Main Scenario
1. 광고주 정보 입력 폼 표시
2. 업체명 입력
3. 회사 주소 입력
4. 업장 전화번호 입력 (형식 검증)
5. 사업자등록번호 입력 (형식 검증)
6. 대표자명 입력
7. 사업 카테고리 선택
8. 입력 정보 유효성 검사
9. 광고주 프로필 DB 저장
10. 사업자등록번호 검증 프로세스 시작 (비동기)
11. 체험단 관리 권한 부여
12. 성공 메시지 표시 및 대시보드 이동

## Edge Cases
- 사업자등록번호 중복: 이미 등록된 번호 안내 후 재입력 유도
- 잘못된 사업자등록번호 형식: 형식 안내 및 예시 제공
- 전화번호 형식 오류: 표준 형식 안내 후 재입력
- 주소 정보 불완전: 필수 필드 누락 시 저장 불가
- 사업자 검증 실패: 재검증 요청 기능 제공

## Business Rules
- 사업자등록번호 형식 검증 (한국 표준: XXX-XX-XXXXX)
- 전화번호 형식 검증 (XXX-XXXX-XXXX 또는 XX-XXX-XXXX)
- 업체명 중복 허용 (서비스 차별화 가능)
- 사업자등록번호는 플랫폼 내 유니크해야 함
- 주소는 최소 시/군/구 이상 입력 요구
- 검증 실패 시 재등록 가능
- 광고주 등록 완료 전까지 체험단 등록 불가

## Sequence Diagram
```
@startuml
actor "User" as U
participant "Frontend" as FE
participant "Backend" as BE
participant "Database" as DB
participant "Business Verification Service" as BVS

U -> FE: 광고주 정보 등록 페이지 접근
FE -> U: 정보 입력 폼 표시

U -> FE: 회사 정보 입력\n(업체명, 주소, 전화번호)
FE -> FE: 입력값 형식 검증

U -> FE: 사업자등록번호 입력
FE -> FE: 사업자등록번호 형식 검증

U -> FE: 대표자명 및 카테고리 입력

FE -> BE: 광고주 정보 등록 요청

BE -> BE: 비즈니스 규칙 검증\n(형식, 중복 등)
BE -> DB: 광고주 프로필 저장
DB -> BE: 저장 완료 응답

BE -> BVS: 사업자등록번호 검증 요청\n(비동기 처리)

BVS -> BVS: 사업자등록번호 진위 확인
BVS -> DB: 검증 결과 업데이트

BE -> FE: 등록 완료 응답
FE -> U: 성공 메시지 및 대시보드 이동

@enduml
```
