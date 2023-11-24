# 💰 예산 관리 어플리케이션
![283339964-a9d1c114-d60e-425f-85b0-ae4a93d0d3b8](https://hackmd.io/_uploads/H14s9PRNp.png)

## #️⃣ 프로젝트 소개

본 서비스는 사용자들이 개인 재무를 관리하고 지출을 추적하는 데 도움을 주는 애플리케이션입니다. 이 앱은 사용자들이 예산을 설정하고 지출을 모니터링하며 재무 목표를 달성하는 데 도움이 됩니다. 

<br>

## 🛠️ 기술 스택

<img src="https://img.shields.io/badge/Node.js-version_18-339933">&nbsp;
<img src="https://img.shields.io/badge/ Nest.js-version_10-E0234E">&nbsp;
<img src="https://img.shields.io/badge/TypeScript-version_5-3178C6">&nbsp;
<img src="https://img.shields.io/badge/TypeORM-version_0.3-fcad03">&nbsp;
<img src="https://img.shields.io/badge/MySQL-version_8-00758F">&nbsp;

<br>

## 🏷️ 목차

1. [:cd: 데이터베이스 모델링](#cd-데이터베이스-모델링)
2. [:earth_asia: API 명세](#earth_asia-API-명세)
3. [:bookmark_tabs: 구현 내용](#bookmark_tabs-구현-내용)


<br>

## :cd: 데이터베이스 모델링

- 유저 ↔️ 예산 `1:N`
    - 사용자는 매월 예산을 지정할 수 있습니다.
- 유저 ↔️ 지출 `1:N`
    - 사용자는 매일 지출을 등록할 수 있습니다.
- 유저 ↔️ 월별 지출 `1:N`
    - 사용자가 지출을 생성할 때마다 각 월에 해당하는 지출이 증가합니다.
    ![ERD](https://hackmd.io/_uploads/SylSHXaNT.png)





## :earth_asia: API 명세

> [`GitHub Wiki`로 이동! 🏃🏻‍💨](https://github.com/sayapin1/budget-control-application/wiki/REST-API)

<br>

## :bookmark_tabs: 구현 내용

#### 사용자

- 계정명, 비밀번호를 사용하여 회원가입하고, `bcrypt`로 비밀번호를 암호화합니다.
- `Cookie`와 `JWT` 기반으로 인증합니다.
- 로그인 이후 모든 `API` 요청에 대해 `JWT` 유효성을 검증합니다.
- 인증된 사용자는 사용자의 정보를 확인할 수 있습니다.

#### 예산

- 사용자가 설정한 예산을 반환할 수 있습니다.
- 해당 기간 별 `예산`을 설정합니다. 예산은 `카테고리`를 필수로 지정합니다.
- 사용자는 언제든지 설정한 예산을 변경할 수 있습니다.


##### 예산 설계(추천)

- 카테고리 별 예산 설정에 어려움이 있는 사용자를 위해 예산 비율 추천 기능이 존재합니다.
- `카테고리` 지정 없이 총액 (ex. 100만원) 을 입력하면, `카테고리` 별 예산을 자동 생성합니다.

#### 지출 기록

- 지출을 `생성`, `수정`, `읽기(상세)`, `읽기(목록)`, `삭제` , `합계제외` 할 수 있습니다.
- `생성한 유저`만 위 권한을 가집니다.
- 수정시 `합계제외` 처리를 하면 처리한 지출은 목록에는 포함되지만 합계에서는 제외됩니다.

#### 지출 컨설팅

##### 오늘 지출 추천

- 설정한 `월별` 예산을 만족하기 위해 오늘 지출 가능한 금액을 `총액` 과 `카테고리 별 금액`으로 제공합니다.
-  앞선 일자에서 과다 소비하였다 해서 오늘 예산을 극히 줄이는것이 아니라, 이후 일자에 부담을 분배합니다.
-  기간 전체 예산을 초과 하더라도 0원 또는 음수 의 예산을 추천받지 않습니다.
-  유저의 상황에 맞는 1 문장의 멘트를 노출합니다.
-  Scheduler를 사용해 매일 아침 8시에 알림이 발송됩니다.

##### 오늘 지출 안내

- 오늘 지출한 `총액`과 `카테고리 별 금액`을 알려줍니다.
- 오늘 기준 사용했으면 적절했을 금액과 오늘 기준 사용한 금액을 알려줍니다.
- 카테고리 별 적정 금액과 지출 금액의 차이를 `위험도`로 나타냅니다.
- Scheduler를 사용해 매일 저녁 8시에 알림이 발송됩니다.

#### 지출 통계

- `지난 달` 대비 `총액`, `카테고리 별 소비율`을 확인할 수 있습니다.
- `지난 요일` 대비 소비율을 확인할 수 있습니다. 
- `다른 유저` 대비 소비율을 확인할 수 있습니다.



