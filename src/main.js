const screen = document.querySelector('#bootScreen');
const meter = screen.querySelector('.boot-meter');
const message = document.querySelector('#bootText');
const percent = document.querySelector('#bootPercent');
const fill = document.querySelector('#bootFill');
const retry = document.querySelector('#bootRetry');
let ready = false;
let value = 0;

function progress(fraction, label) {
  value = Math.max(value, Math.round(fraction * 100));
  fill.style.width = value + '%';
  percent.textContent = value + '%';
  meter.setAttribute('aria-valuenow', String(value));
  message.textContent = label;
}

function loadFailed(error) {
  if (ready) return;
  console.error(error);
  message.textContent = '게임을 불러오지 못했습니다';
  retry.hidden = false;
}

retry.onclick = () => location.reload();
progress(.12, '게임 엔진 준비 중');
const timeout = setTimeout(() => loadFailed(new Error('Game initialization timed out')), 14000);

requestAnimationFrame(() => {
  import('./game.js').then(({ bootGame }) => {
    progress(.56, '저장 데이터 읽는 중');
    bootGame({
      progress,
      onReady() {
        ready = true;
        clearTimeout(timeout);
        progress(1, '이륙 준비 완료');
        setTimeout(() => {
          document.body.classList.remove('booting');
          screen.classList.add('departing');
          setTimeout(() => { screen.hidden = true; }, 260);
        }, 220);
      },
    });
  }).catch(error => {
    clearTimeout(timeout);
    loadFailed(error);
  });
});
