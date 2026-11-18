import Phaser from 'phaser';

const hex = value => Number.parseInt(value.slice(1), 16);
const wrap = (value, period) => ((value % period) + period) % period;
const clamp = Phaser.Math.Clamp;
const smooth = (values, width, bottom, base, height, offset, frequency) => {
  values.length = 0;
  for (let x = 0; x <= width + 24; x += 24) {
    const phase = (x + offset) * frequency;
    values.push({ x, y: base - height * (.66 + Math.sin(phase) * .23 + Math.sin(phase * 2.23 + 1) * .14) });
  }
  values.push({ x: width + 24, y: bottom }, { x: 0, y: bottom });
  return values;
};

const skyThemes = {
  lobby: [0x1b4d80, 0x518cb1, 0xf2ba83, 0x354780, 0x235666, 0x163e55],
  clear: [0x408cb4, 0x92cce1, 0xf2dfb1, 0x618c9a, 0x568f87, 0x316d68],
  wet: [0x405b81, 0x688fa5, 0xc1d6c9, 0x637389, 0x557b85, 0x3c656b],
  sunset: [0x796eaa, 0xc995ae, 0xffcf9e, 0x887aab, 0x7589a1, 0x486b84],
};
const skyStrips = Object.fromEntries(Object.entries(skyThemes).map(([key, colors]) => {
  const [zenith, middle, horizon] = colors.map(Phaser.Display.Color.IntegerToColor);
  const strips = Array.from({ length: 30 }, (_, i) => {
    const ratio = i / 29, first = ratio < .57;
    const blend = first ? ratio / .57 : (ratio - .57) / .43;
    const color = Phaser.Display.Color.Interpolate.ColorWithColor(first ? zenith : middle, first ? middle : horizon, 100, blend * 100);
    return Phaser.Display.Color.GetColor(color.r, color.g, color.b);
  });
  return [key, strips];
}));
const obstacleIcons = {
  cat: '◆', line: '⌁', bird: '⌄', kite: '◇', balloon: '◉', window: '▦', carwind: '»', alleywind: '»',
};

function drawCloud(g, x, y, scale, tint, alpha) {
  g.fillStyle(tint, alpha);
  g.fillEllipse(x, y, 134 * scale, 25 * scale);
  g.fillEllipse(x - 22 * scale, y - 8 * scale, 53 * scale, 34 * scale);
  g.fillEllipse(x + 9 * scale, y - 15 * scale, 66 * scale, 47 * scale);
  g.fillEllipse(x + 43 * scale, y - 3 * scale, 39 * scale, 27 * scale);
}

function tree(g, x, ground, size, tint, alpha = 1) {
  g.fillStyle(tint, alpha);
  g.fillRect(x - size * .07, ground - size * .52, size * .14, size * .52);
  g.fillTriangle(x, ground - size, x - size * .33, ground - size * .18, x + size * .33, ground - size * .18);
  g.fillTriangle(x, ground - size * .8, x - size * .4, ground - size * .13, x + size * .4, ground - size * .13);
}

function postOffice(g, x, ground, size) {
  const y = ground - size * .53;
  g.fillStyle(0x133745, .2).fillEllipse(x, ground + 3, size * 1.4, size * .18);
  g.fillStyle(0xd28f72).fillRect(x - size * .37, y, size * .74, size * .53);
  g.fillStyle(0xffd3a1).fillRect(x - size * .37, y, size * .5, size * .53);
  g.fillStyle(0x8c4758).fillTriangle(x, y - size * .34, x - size * .48, y + 3, x + size * .48, y + 3);
  g.fillStyle(0xc36b65).fillTriangle(x, y - size * .34, x - size * .48, y + 3, x + size * .2, y + 3);
  g.fillStyle(0x875a62).fillRect(x - size * .08, ground - size * .27, size * .16, size * .27);
  g.fillStyle(0x59858d).fillRoundedRect(x - size * .29, y + size * .13, size * .15, size * .15, 3);
  g.fillStyle(0xffede0).fillRoundedRect(x - size * .11, y - size * .13, size * .22, size * .12, 3);
  g.lineStyle(1.3, 0x9f5963).lineBetween(x - size * .08, y - size * .10, x, y - size * .045)
    .lineBetween(x, y - size * .045, x + size * .08, y - size * .10);
}

class Airfield extends Phaser.Scene {
  constructor(options) {
    super('airfield');
    this.options = options;
    this.ridge = [];
  }

  preload() {
    this.options.progress(.82, '하늘 그리는 중');
  }

  create() {
    this.backdrop = this.add.graphics();
    this.terrain = this.add.graphics();
    this.details = this.add.graphics();
    this.weather = this.add.graphics();
    this.aircraft = this.add.graphics().setDepth(4);
    this.labels = Array.from({ length: 18 }, () =>
      this.add.text(0, 0, '', {
        fontFamily: 'system-ui, sans-serif', fontSize: '12px', fontStyle: 'bold',
        color: '#fff3d8', stroke: '#193948', strokeThickness: 3,
      }).setOrigin(.5).setDepth(3).setVisible(false));
    this.options.progress(.94, '활주로 점검 중');
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.planeDrift = this.reducedMotion ? .5 : 0;
    if (!this.reducedMotion) {
      this.tweens.add({
        targets: this, planeDrift: 1, duration: 2800, ease: 'Sine.inOut', yoyo: true, repeat: -1,
      });
    }
    // Signal readiness after Phaser renders its first usable frame.
    this.game.events.once(Phaser.Core.Events.POST_RENDER, () => this.options.onReady());
  }

  update(time, delta) {
    const { world, lobby, resize, update, frame } = this.options;
    update(delta);
    const view = frame();
    const parent = view.playing ? world : lobby;
    if (this.game.canvas.parentElement !== parent) parent.append(this.game.canvas);
    const width = Math.max(1, parent.clientWidth);
    const height = Math.max(1, parent.clientHeight);
    if (this.scale.width !== width || this.scale.height !== height) {
      this.scale.resize(width, height);
      resize();
    }
    this.labelIndex = 0;
    const t = this.reducedMotion && !view.playing ? 0 : time / 1000;
    this.drawScenery(width, height, view, t);
    if (view.playing) this.drawFlight(width, height, view, t);
    else this.drawHangar(width, height);
    for (let i = this.labelIndex; i < this.labels.length; i++) this.labels[i].setVisible(false);
  }

  label(text, x, y, color = '#fff3d8') {
    const label = this.labels[this.labelIndex++];
    if (label) label.setText(text).setPosition(x, y).setColor(color).setVisible(true);
  }

  drawScenery(w, h, view, t) {
    const mission = view.mission;
    const rainy = ['rain', 'snow', 'fog', 'storm'].includes(mission?.weather?.id);
    const sunset = mission?.region?.name === '노을 골목' || mission?.region?.name === '꽃길 언덕';
    const theme = !view.playing ? 'lobby' : rainy ? 'wet' : sunset ? 'sunset' : 'clear';
    const [, , , ridge, hill, field] = skyThemes[theme];
    const camera = view.playing ? view.cameraX : 0;
    const ground = view.playing ? view.project(0, 0).y : h * .83;
    const sky = this.backdrop.clear();
    // Solid color strips are supported by both renderers.
    skyStrips[theme].forEach((color, i) => {
      sky.fillStyle(color).fillRect(0, Math.floor(h * i / 30), w, Math.ceil(h / 30) + 1);
    });
    const sx = w * (view.playing ? .81 : .29), sy = h * (view.playing ? .25 : .37);
    const radius = clamp(Math.min(w, h) * (view.playing ? .058 : .13), 22, 96);
    sky.fillStyle(0xffdc9e, .12).fillCircle(sx, sy, radius * 1.45);
    sky.fillStyle(0xffdc9e, .18).fillCircle(sx, sy, radius * 1.17);
    sky.fillStyle(0xffe5b4, rainy ? .32 : .92).fillCircle(sx, sy, radius);
    for (let i = 0; i < 8; i++) {
      const x = wrap(i * (w + 360) / 8 - camera * .27 + t * (8 + i % 3), w + 360) - 175;
      drawCloud(sky, x, h * (.15 + (i % 4) * .12), .65 + (i % 4) * .36, 0xfff1da, .18 + (i % 3) * .11);
    }
    const land = this.terrain.clear();
    for (const [tint, height, offset, freq] of [
      [ridge, h * .36, camera * .42 + 45, .006],
      [hill, h * .24, camera * .76 + 170, .009],
      [field, h * .105, camera * 1.23 + 70, .013],
    ]) {
      land.fillStyle(tint).fillPoints(smooth(this.ridge, w, Math.max(h, ground) + 1, ground + 6, height, offset, freq), true);
    }
    if (ground < h) {
      land.fillStyle(field).fillRect(0, Math.max(0, ground), w, h);
      for (let i = 0; i < w / 42 + 3; i++) {
        const x = i * 42 - wrap(camera * 1.45, 42) - 20;
        const size = 15 + 9 * Math.sin((x + camera * 1.45) * .041) ** 2;
        tree(land, x, ground - 3, size, 0x1a6261, .39);
      }
      land.fillStyle(0x0f3b50, .23).fillRect(0, ground + 5, w, 2);
    }
  }

  drawHangar(w, h) {
    const g = this.details.clear();
    this.weather.clear();
    const portrait = h > w;
    const x = w * (portrait ? .67 : .29), y = h * (portrait ? .25 : .40);
    const size = clamp(Math.min(w, h) / 95, 3.2, 7.2);
    const drift = this.planeDrift;
    this.drawAircraft(x + drift * 12, y - drift * 13, -.22 - drift * .035, size, 0xfff0d9, 0xa4c6de);
    g.lineStyle(Math.max(2, size * .75), 0xfff5db, .35);
    for (let i = 0; i < 13; i++) {
      const dx = i * 17;
      g.lineBetween(x - size * 17 - dx, y + 23 + dx * .34, x - size * 17 - dx - 7, y + 25 + dx * .34);
    }
    postOffice(g, w * .15, h * .86, clamp(h * .14, 48, 125));
  }

  drawAircraft(x, y, angle, scale, tint, accent, view = {}) {
    const g = this.aircraft.clear().setPosition(x, y).setRotation(angle).setScale(scale);
    g.fillStyle(0x163244, .22).fillTriangle(31, 6, -22, -9, -16, 19);
    if (view.engineLevel) g.fillStyle(0xffbc62, .95).fillTriangle(-13, 0, -27 - view.engineLevel, -5, -29, 5);
    g.fillStyle(tint).fillTriangle(32, 0, -21, -16, -8, 0);
    g.fillStyle(accent).fillTriangle(32, 0, -8, 0, -21, 16);
    g.fillStyle(tint, .76).fillTriangle(32, 0, -18, 10, -4, 0);
    g.lineStyle(1.3, 0x29485f, .75).lineBetween(32, 0, -8, 0).lineBetween(-8, 0, -21, -16);
    if (view.wingLevel) g.lineStyle(1.7, 0x46d2d0).lineBetween(-15, -10, 10, -3);
    if (view.armorLevel) g.lineStyle(1.7, 0x76e0ca, .7).strokeEllipse(0, 0, 58, 35);
  }

  drawFlight(w, h, view, t) {
    const { project, mission, plane, flight } = view;
    const g = this.details.clear();
    const particles = this.weather.clear();
    const origin = project(0, 0);
    if (origin.x > -110 && origin.x < w + 110) postOffice(g, origin.x, origin.y, 67);

    if (mission) {
      this.drawMission(g, w, h, view, t);
      if (['rain', 'storm', 'snow'].includes(mission.weather.id)) {
        const snow = mission.weather.id === 'snow';
        for (let i = 0; i < 38; i++) {
          const x = wrap(i * 83 + t * (snow ? 22 : 64), w);
          const y = wrap(i * 61 + t * (snow ? 37 : 170), h);
          if (snow) particles.fillStyle(0xffffff, .68).fillCircle(x, y, 1 + i % 3);
          else particles.lineStyle(1, 0xe4f5ff, .4).lineBetween(x, y, x - 5, y + 13);
        }
      }
    }

    if (flight?.trail?.length > 1) {
      const trail = flight.trail;
      for (let i = 1; i < trail.length; i += 2) {
        const a = project(...trail[i - 1]), b = project(...trail[i]);
        g.lineStyle(2.4, 0xfff1c8, .15 + .69 * i / trail.length).lineBetween(a.x, a.y, b.x, b.y);
      }
    } else if (view.aiming) {
      const angle = view.aimAngle * Math.PI / 180;
      const speed = (55 + view.aimPower * .8) * view.aimSpeed / (mission.weight || 1);
      for (let i = 1; i <= 11; i++) {
        const sec = i * .073;
        const height = 2.7 + speed * Math.sin(angle) * .89 * sec - 9.6 * sec ** 2;
        if (height <= 0) break;
        const dot = project(speed * Math.cos(angle) * sec, height);
        g.fillStyle(0xfff0b8, 1 - i / 15).fillCircle(dot.x, dot.y, 3.4 - i * .18);
      }
    }
    const p = flight ? project(flight.x, Math.max(0, flight.y)) : project(0, 3);
    if (plane) this.drawAircraft(p.x, p.y, view.planeAngle, 1, hex(plane.color), hex(plane.accent), view);
    else this.aircraft.clear();
  }

  drawMission(g, w, h, view, t) {
    const { mission, project, scale } = view;
    for (const zone of mission.zones) {
      const p = project(zone.x, 0), width = zone.w * scale;
      if (p.x + width < 0 || p.x > w) continue;
      const tint = zone.kind === 'up' ? 0x67e0eb : 0xb99be8;
      const height = Math.min(h, 135 * scale);
      g.fillStyle(tint, .14).fillRect(p.x, p.y - height, width, height);
      g.lineStyle(1, tint, .57).lineBetween(p.x, p.y - height, p.x, p.y)
        .lineBetween(p.x + width, p.y - height, p.x + width, p.y);
      this.label(zone.kind === 'up' ? '↑' : '↓', p.x + width / 2, p.y - height * .44, '#eafcff');
    }

    for (const obstacle of mission.obstacles) {
      const p = project(obstacle.x, 0);
      if (p.x < -55 || p.x > w + 55) continue;
      const alpha = obstacle.used ? .3 : 1;
      if (obstacle.kind === 'tree') tree(g, p.x, p.y, clamp(obstacle.height * scale, 18, 110), 0x205854, alpha);
      else if (obstacle.kind === 'pole') {
        const size = clamp(obstacle.height * scale, 18, 112);
        g.lineStyle(4, 0x896b74, alpha).lineBetween(p.x, p.y, p.x, p.y - size);
        g.lineStyle(3, 0x594d65, alpha).lineBetween(p.x - 10, p.y - size + 5, p.x + 10, p.y - size + 5);
      } else if (!obstacle.used) {
        const y = obstacle.kind === 'cat' ? p.y - 9 : project(obstacle.x, obstacle.alt).y;
        this.label(obstacleIcons[obstacle.kind] || '·', p.x, y);
      }
    }

    const ring = mission.luckyRing;
    if (ring && !ring.taken) {
      const p = project(ring.x, ring.y);
      g.fillStyle(0xffe49b, .2).fillCircle(p.x, p.y, 21);
      g.lineStyle(2.5, 0xffdc72).strokeCircle(p.x, p.y, 16 + Math.sin(t * 4) * 2);
      g.fillStyle(0xfff6dd).fillRoundedRect(p.x - 8, p.y - 5.5, 16, 11, 2);
      g.lineStyle(1.2, 0xa66b60).lineBetween(p.x - 7, p.y - 4, p.x, p.y + 1)
        .lineBetween(p.x, p.y + 1, p.x + 7, p.y - 4);
    }

    const exact = mission.type === 'accuracy';
    const goal = exact ? mission.target : mission.goal;
    const p = project(goal, 0);
    if (p.x < 0 || p.x > w) return;
    const top = clamp(p.y - (exact ? 115 : 137), 60, h - 80);
    for (let y = top; y < p.y - 28; y += 10) g.lineStyle(2, 0xffdb9f, .8).lineBetween(p.x, y, p.x, y + 5);
    if (exact) {
      g.fillStyle(0x6d465a, .35).fillEllipse(p.x, p.y + 5, 57, 20);
      for (const [r, color] of [[25, 0xfff2d8], [20, 0xcf5e60], [14, 0xfff3da], [8, 0xc64d55]]) {
        g.fillStyle(color).fillCircle(p.x, p.y - 4, r);
      }
      this.label('목표 ' + goal + 'm', p.x, p.y - 41);
    } else {
      g.lineStyle(3, 0xffe3ac).lineBetween(p.x, top, p.x, p.y + 4);
      g.fillStyle(0xee8a62).fillTriangle(p.x + 2, top + 2, p.x + 35, top + 11, p.x + 2, top + 23);
      this.label(goal + 'm', p.x, top - 11);
    }
  }
}

export function createFlightEngine(options) {
  const scene = new Airfield(options);
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: options.lobby,
    width: Math.max(1, options.lobby.clientWidth),
    height: Math.max(1, options.lobby.clientHeight),
    backgroundColor: '#254f70',
    audio: { noAudio: true },
    input: { keyboard: false, mouse: false, touch: false, gamepad: false },
    scale: { mode: Phaser.Scale.NONE },
    render: { antialias: true, powerPreference: 'low-power' },
    scene: [scene],
  });
}
