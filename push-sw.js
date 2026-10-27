self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) { data = { body: event.data?.text() || '' }; }
  const title = String(data.title || 'テスト範囲ノート');
  const options = { body: String(data.body || '新しいお知らせがあります'), icon: './icon-192.png', badge: './icon-192.png', tag: String(data.tag || 'study-notification'), renotify: false, data: { url: data.url || './' } };
  event.waitUntil(self.registration.showNotification(title, options));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(async windows => {
    const target = new URL(event.notification.data?.url || './', self.registration.scope).href;
    for (const w of windows) { if (w.url.startsWith(self.registration.scope)) { await w.focus(); return; } }
    return clients.openWindow(target);
  }));
});
