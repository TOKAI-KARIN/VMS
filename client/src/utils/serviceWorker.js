// Service Workerの登録
export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/sw.js`;

      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          // 登録成功
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) {
              return;
            }
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // 新しいコンテンツが利用可能
                  console.log('新しいコンテンツが利用可能です。ページを更新してください。');
                } else {
                  // 初回インストール
                  console.log('コンテンツがキャッシュされました。');
                }
              }
            };
          };
        })
        .catch((error) => {
          console.error('Service Workerの登録に失敗しました:', error);
        });
    });
  }
}

// Service Workerの登録解除
export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
} 