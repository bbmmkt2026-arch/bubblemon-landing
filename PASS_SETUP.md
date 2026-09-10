# PASS 성인인증 연결 준비

`bbmkr.store`의 성인인증은 기존 `wevape.co.kr`에서 사용 중인 방식과 같은 **PortOne V2 + NHN KCP 본인인증** 기준으로 구현되어 있습니다. KCP의 휴대전화 본인확인 창에서 PASS 인증을 진행합니다.

PASS 앱은 웹사이트가 직접 API 키 하나만 받아 호출하는 구조가 아닙니다. 본인확인 서비스 계약과 운영 채널 개통이 먼저 필요합니다.

## 준비할 항목

1. `wevape.co.kr`이 사용하는 PortOne 운영 상점
2. 해당 상점의 NHN KCP 본인인증 운영 채널
3. KCP 관리자 페이지의 신규 연동방식(V2) 사용 설정
4. KCP 인증 결과 URL `checkout-service.prod.iamport.co` 설정
5. 기존 계약에서 `https://www.bbmkr.store` 추가 사용이 가능한지 확인
6. PortOne 관리자 콘솔에서 확인한 `Store ID`
7. 본인인증 채널의 `Channel Key`
8. PortOne V2 `API Secret`
9. 선택 사항: 세션 서명용 32자 이상의 무작위 `AGE_SESSION_SECRET`

`wevape.co.kr`의 공개 프런트엔드에서 Store ID와 Channel Key는 확인할 수 있습니다. 두 값은 브라우저용 식별자이므로 재사용할 수 있지만, 서버 검증에 필요한 API Secret은 공개되어 있지 않습니다. 실제 연결에는 같은 PortOne 계정의 운영용 API Secret이 반드시 필요합니다.

## Vercel 환경변수

다음 값을 Production 환경에 등록합니다.

```text
PORTONE_STORE_ID
PORTONE_CHANNEL_KEY
PORTONE_API_SECRET
AGE_SESSION_SECRET
```

`PORTONE_API_SECRET`과 `AGE_SESSION_SECRET`은 브라우저 코드나 저장소에 넣지 않고 Vercel 환경변수로만 관리합니다. `AGE_SESSION_SECRET`을 따로 등록하지 않으면 서버가 `PORTONE_API_SECRET`에서 세션 서명 전용 키를 파생합니다.

기존 운영 채널을 그대로 쓸 경우에는 PortOne 계정 관리자에게 다음 두 가지를 확인하면 됩니다.

```text
1. wevape.co.kr의 NHN KCP 본인인증 채널을 bbmkr.store에서도 사용해도 되는지
2. 해당 PortOne 상점의 V2 API Secret을 bbmkr.store Vercel 환경변수에 등록할 수 있는지
```

## 인증 완료 주소

PC 팝업과 모바일 리디렉션 모두 인증 완료 후 아래 주소로 돌아옵니다.

```text
https://www.bbmkr.store/
```

서버는 PortOne API에서 인증 상태와 생년월일을 다시 조회합니다. 청소년보호법 기준에 따라 19세가 되는 해의 1월 1일을 지난 사용자에게만 12시간짜리 서명 세션을 발급합니다. 생년월일, CI, DI, 휴대전화번호는 사이트에 저장하지 않습니다.

직접 PortOne 조회가 인증키 오류로 실패하면, 같은 운영 주체의 `wevape.co.kr` 성인인증 서버에서 해당 인증 건의 성인 판정 결과를 검증하는 보조 경로를 사용합니다. 브라우저가 위베이프 서버를 직접 신뢰하지 않고 `bbmkr.store` 서버가 HTTPS로 검증한 뒤 자체 서명 세션을 발급합니다.
