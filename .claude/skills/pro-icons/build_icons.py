#!/usr/bin/env python3
"""Phosphor Icons(MIT) 원본 SVG에서 필요한 아이콘만 뽑아 icons.js 한 파일로 만든다.

사용법:
  npm pack @phosphor-icons/core@2.1.1 && mkdir ph && tar xzf phosphor-icons-core-2.1.1.tgz -C ph
  python3 build_icons.py ph/package/assets icons.txt [emoji_map.txt] > shared/icons.js
icons.txt: 한 줄에 하나, "이름" 또는 "이름:weight" (weight = regular|fill|duotone|light|bold|thin)
emoji_map.txt(선택): "이모지 이름[:weight] 톤" — 화면에 그려지는 이모지를 해당 아이콘으로 자동 교체
"""
import re, sys, pathlib

assets = pathlib.Path(sys.argv[1])
names = [l.strip() for l in open(sys.argv[2]) if l.strip() and not l.startswith('#')]
emoji = []
if len(sys.argv) > 3:
    for l in open(sys.argv[3], encoding='utf-8'):
        if not l.strip() or l.startswith('#'): continue
        e, spec, tone = l.split()
        emoji.append((e.replace('\ufe0f', ''), spec, tone))
        if spec not in names: names.append(spec)
out = {}
for spec in names:
    name, _, weight = spec.partition(':')
    weight = weight or 'regular'
    f = assets / weight / (name + ('' if weight == 'regular' else '-' + weight) + '.svg')
    svg = f.read_text()
    inner = re.sub(r'^<svg[^>]*>|</svg>\s*$', '', svg.strip())
    key = name if weight == 'regular' else name + '-' + weight
    out[key] = inner.replace('</', '<\\/')

print('/* 자동 생성 파일 — 직접 고치지 말 것. .claude/skills/pro-icons/build_icons.py 로 다시 만든다.')
print('   Icons: Phosphor Icons (MIT) https://phosphoricons.com */')
print('(function () {')
print('  var P = {')
print(',\n'.join("    '%s': '%s'" % (k, v) for k, v in out.items()))
print('  };')
def key(spec):
    n, _, w = spec.partition(':')
    return n if not w or w == 'regular' else n + '-' + w
print('  var E = {')
print(',\n'.join("    '%s': ['%s', '%s']" % (e, key(spec), tone) for e, spec, tone in emoji))
print('  };')
print('''  function icon(name, cls) {
    if (!P[name]) return '';
    return '<svg class="ph ' + (cls || '') + '" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">' + P[name] + '<\\/svg>';
  }
  function hydrate(root) {
    (root || document).querySelectorAll('[data-icon]').forEach(function (el) {
      el.outerHTML = icon(el.getAttribute('data-icon'), el.getAttribute('class') || '');
    });
  }
  // 이모지 → 아이콘 자동 교체 (텍스트로 들어온 칭호·미션 문구 등도 화면에 그려질 때 바뀜)
  var keys = Object.keys(E).sort(function (a, b) { return b.length - a.length; });
  var RE = keys.length ? new RegExp('(' + keys.join('|') + ')' + String.fromCharCode(0xFE0F) + '?', 'g') : null;
  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, OPTION: 1, SELECT: 1, TITLE: 1, INPUT: 1, svg: 1, text: 1, NOSCRIPT: 1 };
  function convertText(node) {
    var t = node.nodeValue, p = node.parentNode;
    if (!RE || !t || !p || SKIP[p.nodeName] || p.isContentEditable) return;
    RE.lastIndex = 0;
    if (!RE.test(t)) return;
    if (p.closest && p.closest('[data-no-icon]')) return;
    var span = document.createElement('span');
    span.innerHTML = t.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; })
      .replace(RE, function (m, e) { var d = E[e]; return icon(d[0], 'ei t-' + d[1]); });
    var frag = document.createDocumentFragment();
    while (span.firstChild) frag.appendChild(span.firstChild);
    p.replaceChild(frag, node);
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) return convertText(root);
    if (root.nodeType !== 1 || SKIP[root.nodeName]) return;
    if (root.hasAttribute && root.hasAttribute('data-icon')) { hydrate(root.parentNode || document); return; }
    if (root.querySelector && root.querySelector('[data-icon]')) hydrate(root);
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), list = [], n;
    while ((n = tw.nextNode())) list.push(n);
    list.forEach(convertText);
  }
  function start() {
    hydrate();
    walk(document.body);
    new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        if (m.type === 'characterData') convertText(m.target);
        else m.addedNodes.forEach(walk);
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  window.Icon = icon;
  window.Icon.hydrate = hydrate;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();''')
