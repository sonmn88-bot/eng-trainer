// 서비스 워커: 재방문 속도 + 네트워크가 끊겨도 화면은 뜨게
// - 앱 파일(HTML/JS/CSS): 네트워크 먼저(배포하면 바로 반영), 3초 안에 안 오거나 끊기면 저장본
// - 단어·듣기 데이터(data/words, data/listening): 저장본 먼저 보여주고 뒤에서 새로 받아 둠(다음 방문에 반영)
// - 버전 고정 외부 파일(Firebase SDK 10.12.0, Pretendard 글꼴): 저장본 우선
// - Firebase DB·로그인 요청, 음원(audio/)은 손대지 않음
var CACHE = 'et-v1';
var CORE = ['./', 'index.html', 'vocab.html', 'shared/theme.css', 'shared/utils.js', 'shared/db.js', 'shared/icons.js', 'shared/srs.js', 'data/_index.js', 'review.html'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).catch(function () {}));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function put(req, res) {
  if (res && res.ok && (res.type === 'basic' || res.type === 'cors')) {
    var copy = res.clone();
    caches.open(CACHE).then(function (c) { c.put(req, copy); });
  }
  return res;
}

function networkFirst(req) {
  return new Promise(function (resolve) {
    var done = false;
    var fallback = function () {
      caches.match(req, { ignoreSearch: true }).then(function (hit) {
        if (hit && !done) { done = true; resolve(hit); }
      });
    };
    var timer = setTimeout(fallback, 3000);
    fetch(req).then(function (res) {
      clearTimeout(timer); put(req, res);
      if (!done) { done = true; resolve(res); }
    }).catch(function () {
      clearTimeout(timer);
      caches.match(req, { ignoreSearch: true }).then(function (hit) {
        if (!done) { done = true; resolve(hit || Response.error()); }
      });
    });
  });
}

function staleWhileRevalidate(req) {
  return caches.match(req).then(function (hit) {
    var net = fetch(req).then(function (res) { return put(req, res); }).catch(function () { return hit || Response.error(); });
    return hit || net;
  });
}

function cacheFirst(req) {
  return caches.match(req).then(function (hit) {
    return hit || fetch(req).then(function (res) { return put(req, res); });
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  var url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (/\/audio\//.test(url.pathname)) return;
    if (/\/data\/(words|listening)\//.test(url.pathname)) { e.respondWith(staleWhileRevalidate(req)); return; }
    e.respondWith(networkFirst(req));
    return;
  }
  if (/^https:\/\/www\.gstatic\.com\/firebasejs\/\d+\.\d+\.\d+\//.test(req.url) ||
      /^https:\/\/cdn\.jsdelivr\.net\/gh\/orioncactus\/pretendard\//.test(req.url)) {
    e.respondWith(cacheFirst(req));
  }
});
