const GUIDE_VERSION = 3;

const lessons = {
  angle: { step: 1, title: '각도 맞추기', text: '각도를 움직여 점선이 어떻게 올라가는지 보세요.', target: '#readyAngle', area: '.prep-tuning:has(#readyAngle)' },
  power: { step: 1, title: '힘 조절하기', text: '힘을 바꿔 점선 끝의 착륙 지점을 움직여 보세요.', target: '#readyPower', area: '.prep-tuning:has(#readyPower)' },
  launch: { step: 2, title: '이륙하기', text: '점선 끝을 과녁에 가까이 맞추고 발사하세요.', target: '#battleLaunch' },
  takeoff: { step: 3, title: '방향 바꾸기', text: '비행기가 떠오르면 방향을 보정해 볼 거예요.' },
  correct: { step: 3, title: '방향 바꾸기', text: '비행을 잠시 멈췄어요. 방향 버튼을 하나 눌러 보세요.', target: '#upBtn', area: '.flight-pad' },
  coast: { step: 4, title: '속도 줄이기', text: '보정한 방향으로 날고 있어요.' },
  brake: { step: 4, title: '속도 줄이기', text: '제동을 누르면 속도를 줄이면서 착륙을 이어가요.', target: '#brakeBtn' },
  landing: { step: 4, title: '착륙 지점 확인', text: '과녁과 비행기가 어디에 닿는지 확인해 보세요.' },
  result: { step: 4, title: '연습 비행 완료!' },
};

const tips = {
  shop: { title: '격납고', text: '상점에서 새 기체를 구매하거나 뽑아 격납고를 채울 수 있어요.' },
  insurance: { title: '배송 보험', text: '보험을 켜면 비행마다 보험료를 내고 사고 손실의 70%를 보전받아요.' },
  express: { title: '특급 배송', text: '14초 이내에 4★ 이상이면 보수 +35%. 실패하면 위약금이 있어요.' },
  route: { title: '장거리 배송', text: '이번 의뢰는 과녁에 맞추는 대신 목표 거리를 넘겨야 해요.' },
};

export function createTutorial({ getState, save, canShow, isLobby, menuOpen, activeMenu, startPractice, exitPractice }) {
  const query = selector => document.querySelector(selector);
  const welcome = query('#tutorialWelcome');
  const start = query('#lobbyStart');
  const guide = query('#fieldGuide');
  const progress = query('#guideProgress');
  const title = query('#guideTitle');
  const text = query('#guideText');
  const stats = query('#guideStats');
  const exit = query('#guideExit');
  const angle = query('#readyAngle');
  const power = query('#readyPower');
  let phase = 'idle';
  let pauseAt = 0;
  let keyboardFlight = false;
  let highlighted = null;
  let tip = null;
  let initialized = false;
  let tipShown = false;

  function dismissWelcome() {
    welcome.hidden = true;
    start.classList.remove('tutorial-target');
  }

  function markDone() {
    if (!getState().tutorial.done) {
      getState().tutorial.done = true;
      save();
    }
  }

  function showLesson(next, keyboard = false) {
    const lesson = lessons[next];
    phase = next;
    highlighted?.classList.remove('tutorial-target');
    const area = lesson.area || lesson.target;
    highlighted = area ? query(area) : null;
    highlighted?.classList.add('tutorial-target');
    const target = lesson.target && query(lesson.target);
    guide.dataset.view = next === 'result' ? 'result' : 'lesson';
    progress.hidden = false;
    progress.setAttribute('aria-label', '연습 단계 ' + lesson.step + ' / 4');
    [...progress.children].forEach((pip, i) => pip.classList.toggle('lit', i < lesson.step));
    title.textContent = lesson.title;
    text.textContent = lesson.text || '';
    text.hidden = !lesson.text;
    stats.hidden = next !== 'result';
    exit.textContent = next === 'result' ? '로비로' : '연습 종료';
    guide.hidden = false;
    power.disabled = next === 'angle';
    if (keyboard) {
      if (target && !target.disabled) target.focus({ preventScroll: true });
      else if (next === 'result') exit.focus({ preventScroll: true });
    }
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
    initialized = true;
  }

  function begin() {
    const keyboard = document.activeElement?.matches(':focus-visible');
    tip = null;
    tipShown = false;
    dismissWelcome();
    startPractice(() => {
      showLesson('angle', keyboard);
    });
  }

  function leave() {
    const keyboard = document.activeElement?.matches(':focus-visible');
    markDone();
    phase = 'idle';
    highlighted?.classList.remove('tutorial-target');
    highlighted = null;
    power.disabled = false;
    guide.hidden = true;
    exitPractice(keyboard);
  }

  query('#tutorialSkip').onclick = () => {
    const keyboard = document.activeElement?.matches(':focus-visible');
    markDone();
    dismissWelcome();
    if (keyboard) start.focus({ preventScroll: true });
  };

  angle.addEventListener('change', () => {
    if (phase === 'angle') showLesson('power', angle.matches(':focus-visible'));
  });
  power.addEventListener('change', () => {
    if (phase !== 'power') return;
    const launch = query('#battleLaunch');
    launch.disabled = false;
    showLesson('launch', power.matches(':focus-visible'));
  });

  exit.onclick = () => {
    if (phase !== 'idle') leave();
    else if (tip) {
      tip = null;
      tipShown = false;
      guide.hidden = true;
    }
  };

  function complete(distance, target) {
    markDone();
    query('#guideDistance').textContent = Math.max(0, Math.round(distance)) + 'm';
    query('#guideError').textContent = Math.round(Math.abs(distance - target)) + 'm';
    showLesson('result', true);
  }

  function queueTip(key) {
    if (phase !== 'idle' || !getState().tutorial.done || getState().tutorial.tips[key]) return;
    tipShown = false;
    tip = { key, expires: performance.now() + 5300 };
  }

  function sync() {
    if (!initialized) return;
    if (phase !== 'idle') return;
    const visible = canShow();
    const invite = visible && isLobby() && !menuOpen() && !getState().tutorial.done;
    if (invite === welcome.hidden) {
      welcome.hidden = !invite;
      start.classList.toggle('tutorial-target', invite);
    }
    const showTip = tip && visible && performance.now() < tip.expires && (tip.key === 'route'
      ? !isLobby() && getState().flightState === 'ready'
      : isLobby() && (tip.key === 'express' ? !menuOpen() : menuOpen() && activeMenu() === (tip.key === 'shop' ? 'shop' : 'play')));
    if (!showTip) {
      if (tip && performance.now() >= tip.expires) tip = null;
      if (tipShown) guide.hidden = true;
      tipShown = false;
      return;
    }
    if (tipShown) return;
    const copy = tips[tip.key];
    guide.dataset.view = tip.key === 'route' ? 'route-tip' : 'lobby-tip';
    title.textContent = copy.title;
    text.textContent = copy.text;
    text.hidden = false;
    progress.hidden = stats.hidden = true;
    exit.textContent = '닫기';
    guide.hidden = false;
    tipShown = true;
    getState().tutorial.tips[tip.key] = true;
    save();
  }

  document.addEventListener('click', event => {
    if (!initialized || !canShow() || !isLobby()) return;
    const button = event.target.closest?.('button');
    if (button?.matches('#lobbyShop,[data-tab="shop"]')) queueTip('shop');
    if (button?.matches('#lobbyPrepare,[data-tab="play"]')) queueTip('insurance');
    if (button?.matches('#lobbyExpress') && getState().riskMode) queueTip('express');
  });

  document.addEventListener('keydown', event => {
    if (phase === 'idle' || event.defaultPrevented) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      leave();
    }
  });

  return {
    init, sync, begin, leave, complete,
    offerPractice: () => !getState().tutorial.done,
    canLaunch: () => phase === 'launch',
    canCorrect: () => phase === 'correct' || phase === 'landing',
    canBrake: () => phase === 'brake',
    waitingForInput: () => phase === 'correct' || phase === 'brake',
    routeReady: () => { if (getState().current?.type === 'distance') queueTip('route'); },
    launched() {
      keyboardFlight = document.activeElement?.matches(':focus-visible');
      showLesson('takeoff');
    },
    advanceFlight(elapsed, altitude, verticalSpeed) {
      if (phase === 'takeoff' && elapsed >= .33) showLesson('correct');
      else if (phase === 'coast' && (elapsed >= pauseAt || (altitude < 1.5 && verticalSpeed < 0))) showLesson('brake');
      else return false;
      return true;
    },
    focusFlightControl() {
      if (!keyboardFlight) return;
      const target = lessons[phase]?.target;
      if (target) query(target).focus({ preventScroll: true });
    },
    corrected(elapsed) {
      if (phase !== 'correct') return;
      keyboardFlight = document.activeElement?.matches(':focus-visible');
      pauseAt = elapsed + .42;
      showLesson('coast');
    },
    braked: () => showLesson('landing'),
  };
}
