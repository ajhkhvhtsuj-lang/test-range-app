// テスト範囲ノート：通知登録UI。Supabase SQL と Edge Function の設定後に動作します。
(() => {
 'use strict';
 const URL = 'https://ugkywdddyvvnnggexypr.supabase.co';
 const KEY = 'sb_publishable_QlJjT5rd4PsV0-TKJenH_Q_kvtNSl5D';
 const client = window.supabase?.createClient(URL, KEY);
 const root = document.getElementById('content');
 if (!client || !root) return;
 const base64ToUint8Array = value => {
   const padding = '='.repeat((4 - value.length % 4) % 4);
   const raw = atob((value + padding).replace(/-/g, '+').replace(/_/g, '/'));
   return Uint8Array.from(raw, c => c.charCodeAt(0));
 };
 const supported = () => ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && window.isSecureContext);
 async function show() {
   if (root.querySelector('h1')?.textContent !== '設定' || root.querySelector('#push-settings')) return;
   const panel = document.createElement('section');
   panel.id = 'push-settings'; panel.className = 'panel';
   panel.innerHTML = '<h2>🔔 通知</h2><p class="muted">テスト前日・当日の朝と、グループチャットのお知らせを受け取るよ。iPhoneはSafariの共有メニューから「ホーム画面に追加」して、追加したアイコンから開いてね。</p><button class="primary" id="enable-study-push" type="button">通知をオンにする</button><p class="muted" id="push-status" role="status"></p>';
   root.appendChild(panel);
   const button = panel.querySelector('button');
   const status = panel.querySelector('#push-status');
   if (!supported()) { button.disabled = true; status.textContent = 'この開き方では通知を使えないよ。iPhoneはホーム画面に追加して開いてね。'; return; }
   if (Notification.permission === 'granted') status.textContent = '通知は許可済み。機種変更した場合はもう一度オンにしてね。';
   button.onclick = async () => {
     button.disabled = true; status.textContent = '設定中…';
     try {
       const {data:{user},error:authError} = await client.auth.getUser();
       if (authError || !user) throw new Error('先にログインしてね');
       const permission = await Notification.requestPermission();
       if (permission !== 'granted') throw new Error('通知が許可されなかったよ。端末の通知設定を確認してね');
       const registration = await navigator.serviceWorker.register('./push-sw.js', {scope:'./'});
       const ready = await navigator.serviceWorker.ready;
       const {data:config,error:configError} = await client.functions.invoke('push-public-key');
       if (configError || !config?.publicKey) throw new Error('通知の公開鍵を取得できません。Supabaseの設定を確認してね');
       let subscription = await ready.pushManager.getSubscription();
       if (!subscription) subscription = await ready.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:base64ToUint8Array(config.publicKey)});
       const {error} = await client.from('study_push_subscriptions').upsert({user_id:user.id,endpoint:subscription.endpoint,subscription:subscription.toJSON()}, {onConflict:'endpoint'});
       if (error) throw error;
       status.textContent = '通知をオンにできたよ！🔔';
     } catch(e) { status.textContent = '設定できませんでした：' + (e.message || '通信エラー'); }
     finally { button.disabled = false; }
   };
 }
 new MutationObserver(() => { if(root.querySelector('h1')?.textContent === '設定' && !root.querySelector('#push-settings')) show(); }).observe(root, {childList:true});
 document.querySelector('[data-tab="settings"]')?.addEventListener('click', () => setTimeout(show,0));
 show();
})();
