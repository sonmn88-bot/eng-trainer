#!/usr/bin/env python3
"""Phosphor Icons(MIT) 원본 SVG에서 필요한 아이콘만 뽑아 icons.js 한 파일로 만든다.

사용법:
  npm pack @phosphor-icons/core@2.1.1 && mkdir ph && tar xzf phosphor-icons-core-2.1.1.tgz -C ph
  python3 build_icons.py ph/package/assets icons.txt > shared/icons.js
icons.txt: 한 줄에 하나, "이름" 또는 "이름:weight" (weight = regular|fill|duotone|light|bold|thin)
"""
import re, sys, pathlib

assets = pathlib.Path(sys.argv[1])
names = [l.strip() for l in open(sys.argv[2]) if l.strip() and not l.startswith('#')]
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
print('''  function icon(name, cls) {
    if (!P[name]) return '';
    return '<svg class="ph ' + (cls || '') + '" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">' + P[name] + '<\\/svg>';
  }
  function hydrate(root) {
    (root || document).querySelectorAll('[data-icon]').forEach(function (el) {
      el.outerHTML = icon(el.getAttribute('data-icon'), el.getAttribute('class') || '');
    });
  }
  window.Icon = icon;
  window.Icon.hydrate = hydrate;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { hydrate(); });
  else hydrate();
})();''')
