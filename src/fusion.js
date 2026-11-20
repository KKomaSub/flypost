export const PLANE_GRADES = [
  { name: '일반', materials: 3 },
  { name: '희귀', materials: 4 },
  { name: '영웅', materials: 5 },
  { name: '전설', materials: 0 },
];

export function planeGrade(plane) {
  const grade = plane?.grade;
  return Number.isInteger(grade) && grade >= 0 && grade < PLANE_GRADES.length ? grade : 0;
}

export function planeGradeName(plane) {
  return PLANE_GRADES[planeGrade(plane)].name;
}

// The saved milestone count identifies rewards already issued, even under the old Lv.6, 11, ... schedule.
export function epicMilestoneReward(level, previouslyAwarded) {
  const saved = Number.isFinite(previouslyAwarded) ? Math.max(0, Math.floor(previouslyAwarded)) : 0;
  const total = Math.max(Math.floor(level / 5), saved);
  return { total, added: total - saved };
}

function enhancementTotal(plane) {
  return Object.values(plane.parts || {}).reduce((sum, value) => sum + value, 0);
}

function combinePlanes(def, material, grade) {
  const parts = {};
  for (const { plane } of material) {
    for (const [slot, level] of Object.entries(plane.parts || {})) {
      if (['wing','engine','stabilizer','armor'].includes(slot)) {
        parts[slot] = Math.max(parts[slot] || 0, level);
      }
    }
  }
  const maxDur = def.dur + grade * 2;
  return { grade, dur: maxDur, maxDur, parts };
}

// All changes are planned on a copy. The game commits the complete plan once after confirmation.
export function planPlaneFusion(owned, defs, selectedKey, request = {}) {
  const nextOwned = { ...owned };
  const steps = [];
  const rewards = [];
  let selectedPlaneKey = selectedKey;

  for (const def of defs) {
    if (request.id && request.id !== def.id) continue;
    let tokens = (owned[def.id] || []).map((plane, index) => ({ plane, index, fused: false }));
    let selected = tokens.find(token => selectedKey === def.id + ':' + token.index);
    const modelSteps = [];

    for (let grade = 0; grade < PLANE_GRADES.length - 1; grade++) {
      if (request.id && request.grade !== grade) continue;
      const need = PLANE_GRADES[grade].materials;
      const eligible = tokens.filter(token => planeGrade(token.plane) === grade)
        .sort((a, b) => Number(a === selected) - Number(b === selected)
          || enhancementTotal(a.plane) - enhancementTotal(b.plane)
          || a.plane.dur - b.plane.dur);
      const available = Math.floor(eligible.length / need);
      const batches = request.id ? Math.min(1, available) : available;
      if (!batches) continue;

      const used = new Set(eligible.slice(0, batches * need));
      const survivors = tokens.filter(token => !used.has(token));
      for (let batch = 0; batch < batches; batch++) {
        const material = eligible.slice(batch * need, (batch + 1) * need);
        const result = { plane: combinePlanes(def, material, grade + 1), fused: true };
        survivors.push(result);
        if (material.includes(selected)) selected = result;
      }
      tokens = survivors;
      modelSteps.push({ name: def.name, grade, batches, consumed: batches * need });
    }
    if (!modelSteps.length) continue;

    nextOwned[def.id] = tokens.map(token => token.plane);
    if (selected) selectedPlaneKey = def.id + ':' + tokens.indexOf(selected);
    steps.push(...modelSteps);
    for (let grade = 1; grade < PLANE_GRADES.length; grade++) {
      const count = tokens.filter(token => token.fused && planeGrade(token.plane) === grade).length;
      if (count) rewards.push({ name: def.name, grade, count });
    }
  }

  return { nextOwned, selectedPlaneKey, steps, rewards };
}
