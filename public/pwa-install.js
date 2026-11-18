/* Install the existing online PWA without changing its notification service worker. */
(() => {
  const button = document.getElementById('installApp');
  const dialog = document.getElementById('installGuide');
  const instructions = document.getElementById('installInstructions');
  const closeButton = document.getElementById('installClose');
  if (!button || !dialog || !instructions || !closeButton) return;

  let deferredPrompt = null;
  const standaloneMedia = window.matchMedia?.('(display-mode: standalone)');
  const installed = () => Boolean(standaloneMedia?.matches || navigator.standalone);
  const supportsWebInstall = typeof navigator.install === 'function';

  function updateButton() {
    button.hidden = installed();
    button.textContent = supportsWebInstall || deferredPrompt ? '앱 설치' : '설치 방법';
  }

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredPrompt = event;
    updateButton();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    dialog.close?.();
    updateButton();
  });
  standaloneMedia?.addEventListener?.('change', updateButton);

  button.addEventListener('click', async () => {
    if (installed()) return;
    if (supportsWebInstall) {
      try {
        // Installation APIs need the user's click activation, before any await.
        await navigator.install();
        updateButton();
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
        // Fall back to the browser's installation menu instructions.
      }
    } else if (deferredPrompt) {
      const promptEvent = deferredPrompt;
      deferredPrompt = null;
      updateButton();
      try {
        await promptEvent.prompt();
        await promptEvent.userChoice;
      } catch {
        // Some browsers do not expose an install prompt; show manual guidance.
      }
      return;
    }

    const ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/i.test(ua)) {
      instructions.textContent = 'Safari에서 빠플을 열고 공유 버튼을 눌러 “홈 화면에 추가”를 선택해.';
    } else if (/SamsungBrowser/i.test(ua)) {
      instructions.textContent = '삼성 인터넷에서 빠플을 열고 메뉴(≡) → “현재 페이지 추가” → “홈 화면”을 선택해. 메뉴 이름은 버전에 따라 조금 다를 수 있어.';
    } else if (/Android/i.test(ua)) {
      instructions.textContent = 'Chrome에서 빠플을 열고 메뉴(⋮) → “앱 설치” 또는 “홈 화면에 추가”를 선택해.';
    } else {
      instructions.textContent = '브라우저 메뉴에서 “앱 설치”, “홈 화면에 추가” 또는 “바로가기 만들기”를 찾아 선택해.';
    }
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else window.alert(instructions.textContent);
  });

  closeButton.addEventListener('click', () => dialog.close());
  updateButton();
})();
