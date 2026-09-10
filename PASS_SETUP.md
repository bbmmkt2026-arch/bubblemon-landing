# PASS 성인인증 연결 준비

`bbmkr.store`의 성인인증은 **PortOne V2 + KG이니시스 통합인증(PASS 단독 노출)** 기준으로 구현되어 있습니다.

PASS 앱은 웹사이트가 직접 API 키 하나만 받아 호출하는 구조가 아닙니다. 본인확인 서비스 계약과 운영 채널 개통이 먼저 필요합니다.

## 준비할 항목

1. PortOne 계정과 운영 상점
2. KG이니시스 통합인증 계약 및 운영 채널
3. 해당 채널에서 PASS 인증 사용 승인
4. 운영 도메인 `https://www.bbmkr.store` 등록
5. PortOne 관리자 콘솔에서 확인한 `Store ID`
6. 본인인증 채널의 `Channel Key`
7. PortOne V2 `API Secret`
8. 세션 서명용 32자 이상의 무작위 `AGE_SESSION_SECRET`

## Vercel 환경변수

다음 값을 Production 환경에 등록합니다.

```text
PORTONE_STORE_ID
PORTONE_CHANNEL_KEY
PORTONE_API_SECRET
AGE_SESSION_SECRET
```

`PORTONE_API_SECRET`과 `AGE_SESSION_SECRET`은 브라우저 코드나 저장소에 넣지 않고 Vercel 환경변수로만 관리합니다.

## 인증 완료 주소

PC 팝업과 모바일 리디렉션 모두 인증 완료 후 아래 주소로 돌아옵니다.

```text
https://www.bbmkr.store/
```

서버는 PortOne API에서 인증 상태와 생년월일을 다시 조회합니다. 청소년보호법 기준에 따라 19세가 되는 해의 1월 1일을 지난 사용자에게만 12시간짜리 서명 세션을 발급합니다. 생년월일, CI, DI, 휴대전화번호는 사이트에 저장하지 않습니다.
