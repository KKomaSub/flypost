export const RANDOM_WARMUP = 6;
export const RANDOM_LIMIT = 120;

export const CHALLENGE_TIERS = [
  { id:'standard', name:'표준', difficulty:.22, reward:{ type:'normal', count:1 }, stars:10, minSuccess:2 },
  { id:'skilled', name:'숙련', difficulty:.46, reward:{ type:'normal', count:2 }, stars:11, minSuccess:2 },
  { id:'expert', name:'전문', difficulty:.72, reward:{ type:'epic', count:1 }, stars:12, minSuccess:3 },
  { id:'extreme', name:'극한', difficulty:1, reward:{ type:'epic', count:2 }, stars:13, minSuccess:3 },
];

export function challengeTier(id) {
  return CHALLENGE_TIERS.find(tier => tier.id === id) || CHALLENGE_TIERS[0];
}

export function legacyStageTier(stage) {
  if (stage >= 40) return 'extreme';
  if (stage >= 21) return 'expert';
  if (stage >= 9) return 'skilled';
  return 'standard';
}

export function randomDifficulty(flights) {
  const progress = Math.max(0, Math.min(1, (flights - RANDOM_WARMUP) / (RANDOM_LIMIT - RANDOM_WARMUP)));
  return progress ** 1.27;
}

export function routeRequirements(difficulty) {
  const blend = (easy, hard) => easy * (1 - difficulty) + hard * difficulty;
  return {
    targetMin:blend(86,245), targetMax:blend(164,525),
    distance:blend(340,2250),
    accuracy:{ two:blend(112,25), three:blend(72,13), four:blend(36,6), five:blend(16,2.7) },
  };
}

export function distanceRules(goal, difficulty) {
  const blend = (easy, hard) => goal * (easy * (1 - difficulty) + hard * difficulty);
  return { two:blend(.53,.73), three:goal, four:blend(1.23,1.20), five:blend(1.45,1.37) };
}

export function nextRouteType(queue, random = Math.random) {
  if (queue.length === 0) {
    if (random() < .5) queue.push('accuracy','distance');
    else queue.push('distance','accuracy');
  }
  return queue[0];
}

export function challengeScore(scores) {
  return {
    stars:scores.reduce((total, score) => total + score, 0),
    successes:scores.filter(score => score >= 3).length,
  };
}

export function challengeCleared(scores, tier) {
  const {stars, successes} = challengeScore(scores);
  return scores.length === 3 && stars >= tier.stars && successes >= tier.minSuccess;
}

export function accuracyZones(target, difficulty, weather, random = Math.random) {
  const start = 65;
  const end = target - Math.max(60, Math.round(target * .18));
  const span = end - start;
  if (span < 34) return [];

  const activeWeather = weather === 'thermal' || weather === 'storm';
  if (!activeWeather && random() >= .32 + difficulty * .55) return [];
  const count = difficulty >= .72 && span >= 160 ? 2 : 1;
  const firstKind = activeWeather ? (weather === 'thermal' ? 'up' : 'down') : random() < .5 ? 'up' : 'down';
  const slot = span / count;
  return Array.from({length:count}, (_, i) => {
    const w = Math.min(48, slot * .7, 25 + random() * 14 + difficulty * 8);
    return {
      kind:i === 0 ? firstKind : firstKind === 'up' ? 'down' : 'up',
      x:start + slot * i + (slot - w) * (.15 + random() * .45),
      w,
      strength:7 + random() * 4 + difficulty * 4,
    };
  });
}
