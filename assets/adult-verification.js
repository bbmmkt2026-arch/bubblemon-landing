(() => {
  'use strict';

  const verifyButton = document.getElementById('adult-verify');
  const exitButton = document.getElementById('adult-exit');
  const defaultButtonLabel = verifyButton.textContent;

  const showFailure = (message) => {
    verifyButton.disabled = false;
    verifyButton.textContent = defaultButtonLabel;
    window.alert(message);
  };

  const createIdentityVerificationId = () => {
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    const randomPart = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    return `bbmkr${randomPart}`;
  };

  const finishVerification = async (identityVerificationId) => {
    verifyButton.disabled = true;
    verifyButton.textContent = '인증 결과 확인 중';

    try {
      const response = await fetch('/api/age-verify', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identityVerificationId })
      });
      const result = await response.json().catch(() => ({}));

      if (response.status === 403 && result.code === 'UNDERAGE') {
        window.alert('19세 미만 청소년은 이용할 수 없습니다.');
        window.location.replace('https://www.naver.com/');
        return;
      }

      if (!response.ok || !result.verified) {
        throw new Error(result.message || '인증 결과를 확인할 수 없습니다.');
      }

      window.location.replace('/');
    } catch (error) {
      showFailure(error.message || '성인인증을 완료하지 못했습니다. 다시 시도해 주세요.');
    }
  };

  const startVerification = async () => {
    verifyButton.disabled = true;
    verifyButton.textContent = 'PASS 인증창 여는 중';

    try {
      if (!window.PortOne || typeof window.PortOne.requestIdentityVerification !== 'function') {
        throw new Error('성인인증 모듈을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      }

      const configResponse = await fetch('/api/age-config', {
        credentials: 'same-origin',
        cache: 'no-store'
      });
      const config = await configResponse.json().catch(() => ({}));
      if (!configResponse.ok || !config.storeId || !config.channelKey) {
        throw new Error('성인인증 서비스 연결이 준비되지 않았습니다.');
      }

      const identityVerificationId = createIdentityVerificationId();
      const isMobile = window.matchMedia('(max-width: 768px)').matches;
      const response = await window.PortOne.requestIdentityVerification({
        storeId: config.storeId,
        channelKey: config.channelKey,
        identityVerificationId,
        windowType: {
          pc: 'POPUP',
          mobile: 'REDIRECTION'
        },
        redirectUrl: `${window.location.origin}/`,
        bypass: {
          kcp_v2: {
            media_type: isMobile ? 'MC02' : 'MC01'
          }
        }
      });

      if (response && response.code) {
        throw new Error(response.message || '성인인증이 취소되었습니다.');
      }

      await finishVerification(response?.identityVerificationId || identityVerificationId);
    } catch (error) {
      showFailure(error.message || '성인인증을 시작하지 못했습니다. 다시 시도해 주세요.');
    }
  };

  exitButton.addEventListener('click', (event) => {
    event.preventDefault();
    window.location.replace('https://www.naver.com/');
  });

  verifyButton.addEventListener('click', startVerification);

  const redirectIdentityVerificationId = new URLSearchParams(window.location.search).get('identityVerificationId');
  if (redirectIdentityVerificationId) {
    window.history.replaceState(null, '', '/');
    finishVerification(redirectIdentityVerificationId);
  }
})();
