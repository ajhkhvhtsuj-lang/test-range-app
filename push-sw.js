
/* テスト範囲ノート: push notifications */
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) {}

  const title = typeof data.title === 'string'
    ? data.title.slice(0, 80)
    : 'テスト範囲ノート';

  const body = typeof data.body === 'string'
    ? data.body.slice(0, 160)
    : '新しいお知らせがあります';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: './icon-192.png',
      badge: './icon-192.png',
      tag: typeof data.tag === 'string'
        ? data.tag
        : 'study-notice',
      renotify: false,
      data: { url: './index.html' }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  event.waitUntil((async () => {
    const url = new URL(
      './index.html',
      self.registration.scope
    ).href;

    const windows = await clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    });

    for (const win of windows) {
      if (win.url.startsWith(self.registration.scope)) {
        await win.focus();
        return;
      }
    }

    await clients.openWindow(url);
  })());
});
