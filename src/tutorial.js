const GUIDE_VERSION = 2;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function guidePosition(rect, viewport, card, gap = 13) {
  const inset = 12;
  const anchor = (rect.left + rect.right) / 2;
  const left = clamp(anchor - card.width / 2, inset, viewport.width - card.width - inset);
  const above = rect.top - card.height - gap;
  const below = rect.bottom + gap;
  const fitsAbove = above >= inset;
  const fitsBelow = below + card.height <= viewport.height - inset;
  const top = fitsAbove ? above : fitsBelow ? below : clamp(above, inset, viewport.height - card.height - inset);
  return { left, top };
}

export function createTutorial({ getState, save, closeMenu, canShow, isLobby, menuOpen, activeMenu, currentType }) {
  const query = selector => document.querySelector(selector);
  const guide = query('#fieldGuide');
  const focus = query('#guideFocus');
  const cue = query('#guideCue');
  const card = query('#guideCard');
  const badge = query('#guideBadge');
  const title = query('#guideTitle');
  const text = query('#guideText');
  const skip = query('#guideSkip');
  let stage = 'idle';
  let shown = '';
  let startedHint = 0;
  let contextual = null;
  let initialized = false;

  const lessons = {
    start: { area: '.lobby-panel', pointer: '#lobbyStart', shade: true },
    setup: { area: '#readyFlight', icon: '✈', title: '발사 준비' },
    flight: { area: '.flight-controls', icon: '↗', title: '비행 중 보정', text: '화살표로 방향을 보정하고, 제동으로 속도를 줄여요.' },
  };
  const tips = {
    shop: { area: '#dock', icon: '✈', title: '격납고', text: '잠금이 풀린 기체를 구매하면 바로 선택돼요.' },
    insurance: { area: '#dock', icon: '🛡', title: '배송 보험', text: '비행마다 보험료를 내고 사고 손실의 70%를 보전받아요.' },
    express: { area: '#lobbyExpress', icon: '⚡', title: '특급 배송', text: '14초 이내에 4★ 이상이면 보수 +35%. 실패하면 위약금이 있어요.' },
    route: { area: '#readyFlight', icon: '⚑', title: '장거리 배송', text: '착륙 위치보다 얼마나 멀리 날았는지가 중요해요.' },
  };

  function clear() {
    guide.hidden = true;
    shown = '';
  }

  function finish() {
    getState().tutorial.done = true;
    stage = 'idle';
    clear();
    save();
  }

  function showTip(key) {
    const progress = getState().tutorial;
    if (!progress || progress.tips[key]) return;
    progress.tips[key] = true;
    contextual = { key, expires: performance.now() + 4700 };
    save();
  }

  function present(key, lesson) {
    const area = query(lesson.area);
    const rect = area?.getBoundingClientRect();
    if (!rect?.width || !rect.height || rect.bottom <= 0 || rect.top >= innerHeight) return clear();
    if (shown !== key) {
      guide.className = lesson.shade ? 'guide-shaded' : '';
      guide.hidden = false;
      focus.hidden = !lesson.shade;
      cue.hidden = !lesson.pointer;
      card.classList.toggle('compact', !lesson.title);
      badge.hidden = !lesson.icon;
      badge.textContent = lesson.icon || '';
      title.textContent = lesson.title || '';
      text.textContent = lesson.text || '';
      skip.textContent = lessons[key] ? '건너뛰기' : '닫기';
      shown = key;
    }

    const left = clamp(rect.left - 6, 3, innerWidth - 7);
    const top = clamp(rect.top - 6, 3, innerHeight - 7);
    const right = clamp(rect.right + 6, left + 1, innerWidth - 3);
    const bottom = clamp(rect.bottom + 6, top + 1, innerHeight - 3);
    if (!focus.hidden) {
      Object.assign(focus.style, {
        left: left + 'px', top: top + 'px', width: right - left + 'px', height: bottom - top + 'px',
      });
      const button = query(lesson.pointer).getBoundingClientRect();
      cue.style.left = clamp(button.right - 48, 9, innerWidth - 52) + 'px';
      cue.style.top = clamp(button.top - 33, 7, innerHeight - 38) + 'px';
    }
    if (!lesson.title) return;
    const clipped = { left, top, right, bottom };
    const size = { width: card.offsetWidth, height: card.offsetHeight };
    const gap = key === 'setup' || key === 'route' ? Math.min(88, innerHeight * .105) : 13;
    const pos = guidePosition(clipped, { width: innerWidth, height: innerHeight }, size, gap);
    card.style.left = pos.left + 'px';
    card.style.top = pos.top + 'px';
  }

  function sync() {
    if (!initialized) return;
    if (!canShow()) {
      clear();
      return;
    }
    const now = performance.now();
    const state = getState();
    const atLobby = isLobby();
    if (stage === 'start' && !atLobby && state.current) stage = 'setup';
    if (stage === 'setup' && atLobby) stage = 'start';
    if (stage === 'setup' && state.flightState === 'flying') {
      stage = 'flight';
      startedHint = now;
    }
    if (stage === 'flight' && (state.flightState !== 'flying' || now - startedHint > 4300)) finish();

    if (stage === 'start' && !menuOpen()) return present('start', lessons.start);
    if (stage === 'setup') {
      const type = currentType();
      const instruction = type === 'accuracy'
        ? '과녁에 맞춰 각도와 힘을 조절한 뒤 날려 보세요.'
        : '희망 거리보다 멀리 날도록 각도와 힘을 조절해 보세요.';
      const previous = lessons.setup.text;
      lessons.setup.text = instruction;
      if (previous !== instruction) shown = '';
      return present('setup', lessons.setup);
    }
    if (stage === 'flight') return present('flight', lessons.flight);

    const tip = contextual;
    if (tip && now < tip.expires) {
      const appropriate = tip.key === 'route'
        ? !atLobby && state.flightState === 'ready'
        : atLobby && (tip.key === 'express' ? !menuOpen() : menuOpen() && activeMenu() === (tip.key === 'shop' ? 'shop' : 'play'));
      if (appropriate) return present(tip.key, tips[tip.key]);
    }
    contextual = null;
    clear();
  }

  function init() {
    const state = getState();
    const saved = state.tutorial;
    const veteran = state.round > 0 || (state.legacy?.lives || 1) > 1;
    state.tutorial = {
      version: GUIDE_VERSION,
      done: typeof saved?.done === 'boolean' ? saved.done : veteran,
      tips: saved?.tips && typeof saved.tips === 'object' ? saved.tips : {},
    };
    stage = state.tutorial.done ? 'idle' : 'start';
    initialized = true;
    save();
  }

  function replay() {
    getState().tutorial.done = false;
    contextual = null;
    stage = 'start';
    if (isLobby()) closeMenu();
    save();
    sync();
  }

  skip.onclick = () => {
    if (stage === 'idle') {
      contextual = null;
      clear();
    } else finish();
  };

  document.addEventListener('click', event => {
    if (!initialized || !canShow()) return;
    const button = event.target.closest?.('button');
    if (!button) return;
    if (button.matches('#leftBtn,#rightBtn,#upBtn,#downBtn,#brakeBtn') && stage === 'flight') {
      finish();
      return;
    }
    if (button.matches('#lobbyShop,[data-tab="shop"]') && isLobby()) showTip('shop');
    else if (button.matches('#lobbyPrepare,[data-tab="play"]') && isLobby()) showTip('insurance');
    else if (button.matches('#lobbyExpress') && isLobby() && getState().riskMode) showTip('express');
  });

  function routeReady() {
    if (stage === 'idle' && currentType() === 'distance') showTip('route');
  }

  return { init, sync, replay, routeReady };
}
