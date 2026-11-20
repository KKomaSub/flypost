import { PLANE_GRADES, planeGrade, planPlaneFusion } from './fusion.js';

export function createFusionUI({ getState, defs, commit, playSound }) {
  const element = id => document.getElementById(id);
  const workshop = element('planeFusion');
  const upgrades = element('partUpgrades');
  const tab = element('fusionTab');
  const upgradesTab = element('partUpgradesTab');
  const list = element('fusionInventory');
  const bulk = element('fusionBulk');
  const dialog = element('fusionDialog');
  const title = element('fusionTitle');
  const confirm = element('fusionConfirm');
  const close = element('fusionClose');
  const score = element('fusionScore');
  const scene = element('fusionScene');
  const summary = element('fusionSummary');
  const results = element('fusionResults');
  let request;
  let busy = false;

  function eligible() {
    const state = getState();
    return !state.gameOver && state.flightState !== 'flying';
  }

  function render() {
    if (workshop.hidden) return;
    const { owned } = getState();
    list.replaceChildren();
    let ready = false;
    for (const def of defs) {
      const counts = PLANE_GRADES.map(() => 0);
      for (const plane of owned[def.id] || []) counts[planeGrade(plane)]++;
      for (const [grade, count] of counts.entries()) {
        if (!count) continue;
        const rank = PLANE_GRADES[grade];
        const row = document.createElement('article');
        row.className = 'fusion-row';
        const badge = document.createElement('span');
        badge.className = 'fusion-badge';
        badge.dataset.grade = grade;
        badge.textContent = rank.name;
        const details = document.createElement('div');
        const name = document.createElement('strong');
        name.textContent = def.name;
        const inventory = document.createElement('small');
        inventory.textContent = rank.materials
          ? `보유 ${count}대 · ${rank.materials}대 → ${PLANE_GRADES[grade+1].name} 1대`
          : `보유 ${count}대 · 최고 등급`;
        details.append(name, inventory);
        row.append(badge, details);
        if (rank.materials) {
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = '합성';
          button.disabled = !eligible() || count < rank.materials;
          button.setAttribute('aria-label', `${def.name} ${rank.name} 합성`);
          button.onclick = () => preview({ id: def.id, grade });
          ready ||= !button.disabled;
          row.append(button);
        }
        list.append(row);
      }
    }
    bulk.disabled = !ready;
  }

  function switchPanel(fusing) {
    workshop.hidden = !fusing;
    upgrades.hidden = fusing;
    tab.setAttribute('aria-pressed', String(fusing));
    upgradesTab.setAttribute('aria-pressed', String(!fusing));
    if (fusing) render();
  }

  function describe(rows, values, text) {
    rows.replaceChildren();
    for (const value of values) {
      const item = document.createElement('li');
      item.textContent = text(value);
      rows.append(item);
    }
  }

  function plan() {
    const state = getState();
    return planPlaneFusion(state.owned, defs, state.selectedPlaneKey, request);
  }

  function showResults(rewards) {
    describe(results, rewards, reward => `${reward.name} · ${PLANE_GRADES[reward.grade].name} ${reward.count}대`);
    scene.dataset.grade = Math.max(...rewards.map(reward => reward.grade));
  }

  function preview(options = {}) {
    if (!eligible() || dialog.open) return;
    request = options;
    const next = plan();
    if (!next.steps.length) return;
    title.textContent = options.id ? '기체 합성' : '일괄 합성';
    describe(summary, next.steps, step =>
      `${step.name} · ${PLANE_GRADES[step.grade].name} ${step.consumed}대 → ${PLANE_GRADES[step.grade+1].name} ${step.batches}대`);
    showResults(next.rewards);
    dialog.dataset.phase = 'preview';
    score.hidden = false;
    confirm.hidden = false;
    close.textContent = '취소';
    dialog.showModal();
    close.focus();
    dialog.scrollTop = 0;
  }

  tab.onclick = () => switchPanel(true);
  upgradesTab.onclick = () => switchPanel(false);
  bulk.onclick = () => preview();
  close.onclick = () => { if (!busy) dialog.close(); };
  dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
  dialog.addEventListener('close', () => { if (!workshop.hidden) tab.focus({ preventScroll: true }); });
  confirm.onclick = () => {
    if (busy || !eligible()) return;
    const next = plan();
    if (!next.steps.length) { dialog.close(); return; }
    busy = true;
    dialog.dataset.phase = 'fusing';
    confirm.hidden = true;
    close.disabled = true;
    score.hidden = true;
    title.textContent = '합성 중';
    playSound('fusionStart');
    commit(next);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(() => {
      dialog.dataset.phase = 'result';
      title.textContent = '합성 완료';
      showResults(next.rewards);
      close.textContent = '확인';
      close.disabled = false;
      busy = false;
      playSound('fusionFinish');
      close.focus();
    }, reduced ? 0 : 960);
  };

  return { render };
}
