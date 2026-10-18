const TAU = Math.PI * 2;
const clamp = (value, minimum, maximum) =>
  Math.min(maximum, Math.max(minimum, value));
const mix = (a, b, amount) => a + (b - a) * amount;
const random = (seed) => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return value - Math.floor(value);
};

export class OceanRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d", { alpha: false });
    this.width = 1;
    this.height = 1;
    this.lastLane = 1;
    this.brakingStarted = null;
    this.worldImage = this.loadImage("/images/ocean-world.png");
    this.explorerImage = this.loadImage("/images/explorer.png");
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
  }

  loadImage(source) {
    const image = new Image();
    image.decoding = "async";
    image.src = source;
    return image;
  }

  resize() {
    const bounds = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, bounds.width);
    this.height = Math.max(1, bounds.height);
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.width * this.pixelRatio);
    this.canvas.height = Math.round(this.height * this.pixelRatio);
    this.context.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
  }

  render({
    time = 0,
    distance = 0,
    lane = 1,
    progress = 0,
    answers = null,
    active = false,
    turbo = false,
    crashed = false,
  } = {}) {
    if (this.width < 2 || this.height < 2) return;
    this.time = Number.isFinite(time) ? time : 0;
    this.distance = Number.isFinite(distance) ? distance : 0;
    this.lane = clamp(Number.isFinite(lane) ? lane : 1, 0, 2);
    this.horizon = Math.min(
      this.height * 0.54,
      Math.max(this.height * 0.43, 285),
    );
    this.channelWidth = Math.min(this.width * 0.48, this.height * 0.88);
    this.canyon = clamp((this.distance - 1900) / 1100, 0, 1);
    this.deep = clamp((this.distance - 4300) / 1100, 0, 1);
    this.cinematic = !active && !crashed && answers?.length !== 3;
    this.turbo = turbo && active && !crashed;
    this.crashed = crashed;
    if (crashed) this.brakingStarted ??= this.time;
    else this.brakingStarted = null;
    this.braking = crashed
      ? clamp((this.time - this.brakingStarted) / 1.3, 0, 1)
      : 0;
    const ctx = this.context;
    ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    this.drawWater();
    this.drawLight();
    this.drawDistantWorld();
    this.drawAnimals();
    if (!this.cinematic) this.drawCurrents();
    this.drawScenery();
    this.drawParticles();
    this.answerPlates = [];
    if (answers?.length === 3) this.drawGates(answers, clamp(progress, 0, 1));
    if (this.turbo) this.drawBoost();
    this.drawExplorer();
    this.drawAnswerPlates();
    this.drawVignette();
    if (crashed) this.drawSafetyField();
    this.lastLane = this.lane;
  }

  destroy() {
    this.resizeObserver.disconnect();
  }

  channelAt(depth) {
    const p = clamp(depth, 0, 1.2);
    const bend =
      Math.sin(this.distance * 0.00028 + (1 - p) * 1.6) -
      Math.sin(this.distance * 0.00028);
    return {
      x: this.width * 0.5 + bend * this.width * 0.025 * (1 - p),
      y: this.horizon + (this.height - this.horizon) * Math.pow(p, 1.42),
      half: this.width * 0.013 + this.channelWidth * Math.pow(p, 0.93),
    };
  }

  laneAt(lane, depth) {
    const point = this.channelAt(depth);
    return { ...point, x: point.x + ((lane - 1) * point.half * 2) / 3 };
  }

  ellipse(x, y, rx, ry, fill, rotation = 0) {
    const ctx = this.context;
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rotation, 0, TAU);
    ctx.fillStyle = fill;
    ctx.fill();
  }

  polygon(points, fill) {
    const ctx = this.context;
    ctx.beginPath();
    points.forEach(([x, y], index) =>
      index ? ctx.lineTo(x, y) : ctx.moveTo(x, y),
    );
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }

  roundedRect(x, y, width, height, radius, fill, stroke = null, lineWidth = 1) {
    const ctx = this.context;
    ctx.beginPath();
    ctx.roundRect(
      x,
      y,
      width,
      height,
      Math.max(0, Math.min(radius, width / 2, height / 2)),
    );
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
  }

  drawWater() {
    const ctx = this.context;
    const w = this.width;
    const h = this.height;
    const water = ctx.createLinearGradient(0, 0, w * 0.35, h);
    water.addColorStop(0, this.deep > 0.5 ? "#092947" : "#06495b");
    water.addColorStop(0.38, this.deep > 0.5 ? "#10203f" : "#073747");
    water.addColorStop(1, "#03131f");
    ctx.fillStyle = water;
    ctx.fillRect(0, 0, w, h);
    if (this.worldImage.complete && this.worldImage.naturalWidth) {
      const scale = Math.max(
        w / this.worldImage.naturalWidth,
        h / this.worldImage.naturalHeight,
      );
      const dw = this.worldImage.naturalWidth * scale;
      const dh = this.worldImage.naturalHeight * scale;
      const drift = this.time ? Math.sin(this.time * 0.045) * w * 0.004 : 0;
      ctx.save();
      ctx.globalAlpha = 0.94 - this.deep * 0.25;
      ctx.drawImage(
        this.worldImage,
        (w - dw) * 0.5 + drift,
        (h - dh) * 0.5,
        dw,
        dh,
      );
      ctx.restore();
      const veil = ctx.createLinearGradient(0, 0, 0, h);
      veil.addColorStop(0, "rgba(2,23,39,.05)");
      veil.addColorStop(0.4, "rgba(2,26,39,.08)");
      veil.addColorStop(1, "rgba(2,17,30,.43)");
      ctx.fillStyle = veil;
      ctx.fillRect(0, 0, w, h);
    }
    if (this.canyon) {
      ctx.fillStyle = `rgba(6,23,39,${this.canyon * 0.15})`;
      ctx.fillRect(0, 0, w, h);
    }
    if (this.deep) {
      ctx.fillStyle = `rgba(20,8,54,${this.deep * 0.37})`;
      ctx.fillRect(0, 0, w, h);
    }
  }

  drawLight() {
    const ctx = this.context;
    const w = this.width;
    const h = this.height;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 5; i++) {
      const x = w * (0.27 + i * 0.105);
      const sway = this.time ? Math.sin(this.time * 0.12 + i) * w * 0.014 : 0;
      const gradient = ctx.createLinearGradient(x, 0, x - w * 0.2, h * 0.85);
      gradient.addColorStop(
        0,
        `rgba(143,247,231,${(0.075 - this.deep * 0.035) * (i % 2 ? 0.55 : 1)})`,
      );
      gradient.addColorStop(1, "rgba(121,241,229,0)");
      this.polygon(
        [
          [x + sway, 0],
          [x + w * 0.026 + sway, 0],
          [x - w * 0.1, h * 0.93],
          [x - w * 0.3, h * 0.93],
        ],
        gradient,
      );
    }
    ctx.restore();
  }

  drawDistantWorld() {
    const ctx = this.context;
    const w = this.width;
    const h = this.height;
    if (
      !this.worldImage.complete ||
      !this.worldImage.naturalWidth ||
      this.canyon
    ) {
      ctx.save();
      if (this.worldImage.naturalWidth)
        ctx.globalAlpha = this.canyon * (0.45 + this.deep * 0.3);
      for (const side of [-1, 1]) {
        ctx.save();
        ctx.translate(side < 0 ? 0 : w, 0);
        ctx.scale(side < 0 ? 1 : -1, 1);
        const rock = ctx.createLinearGradient(0, 0, w * 0.27, h);
        rock.addColorStop(0, "#02131f");
        rock.addColorStop(1, "#103b4c");
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(w * 0.055, 0);
        ctx.bezierCurveTo(
          w * 0.15,
          h * 0.25,
          w * 0.035,
          h * 0.26,
          w * 0.15,
          h * 0.42,
        );
        ctx.bezierCurveTo(w * 0.22, h * 0.56, w * 0.13, h * 0.71, w * 0.29, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fillStyle = rock;
        ctx.fill();
        for (let i = 0; i < 7; i++) {
          ctx.strokeStyle = "rgba(80,156,167,.13)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(0, h * (0.19 + i * 0.125));
          ctx.quadraticCurveTo(
            w * 0.08,
            h * (0.21 + i * 0.12),
            w * (0.05 + i * 0.024),
            h * (0.3 + i * 0.1),
          );
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.restore();
    }
    this.drawRuins(w * 0.84, h * 0.61, Math.min(w * 0.13, h * 0.23), 0.19);
  }

  drawCurrents() {
    const ctx = this.context;
    for (let lane = 0; lane < 3; lane++) {
      const selected = Math.abs(this.lane - lane) < 0.48;
      const glow = ctx.createLinearGradient(0, this.horizon, 0, this.height);
      glow.addColorStop(0, "rgba(73,227,229,0)");
      glow.addColorStop(0.4, `rgba(50,210,215,${selected ? 0.03 : 0.015})`);
      glow.addColorStop(1, `rgba(56,218,220,${selected ? 0.16 : 0.045})`);
      ctx.beginPath();
      for (let i = 0; i <= 35; i++) {
        const point = this.laneAt(lane, i / 35);
        ctx.lineTo(point.x - point.half / 3, point.y);
      }
      for (let i = 35; i >= 0; i--) {
        const point = this.laneAt(lane, i / 35);
        ctx.lineTo(point.x + point.half / 3, point.y);
      }
      ctx.closePath();
      ctx.fillStyle = glow;
      ctx.fill();
    }
    for (let boundary = 0; boundary <= 3; boundary++) {
      ctx.beginPath();
      for (let i = 0; i <= 50; i++) {
        const point = this.channelAt(i / 50);
        const x = point.x + ((boundary / 3) * 2 - 1) * point.half;
        if (i === 0) ctx.moveTo(x, point.y);
        else ctx.lineTo(x, point.y);
      }
      const line = ctx.createLinearGradient(0, this.horizon, 0, this.height);
      line.addColorStop(0, "rgba(114,244,238,0)");
      line.addColorStop(0.3, "rgba(114,244,238,.17)");
      line.addColorStop(
        1,
        boundary === 0 || boundary === 3
          ? "rgba(123,249,234,.65)"
          : "rgba(106,237,239,.48)",
      );
      ctx.strokeStyle = line;
      ctx.lineWidth = boundary === 0 || boundary === 3 ? 1.8 : 1.35;
      ctx.stroke();
    }
    for (let row = 0; row < 11; row++) {
      const p = 0.04 + ((row / 11 + this.distance * 0.0013) % 1) * 0.98;
      const far = this.channelAt(Math.max(0, p - 0.026));
      const near = this.channelAt(p);
      for (let lane = 0; lane < 3; lane++) {
        const selected = Math.abs(this.lane - lane) < 0.48;
        const x = near.x + ((lane - 1) * near.half * 2) / 3;
        const fx = far.x + ((lane - 1) * far.half * 2) / 3;
        const size = near.half * 0.12;
        ctx.beginPath();
        ctx.moveTo(x - size, near.y);
        ctx.quadraticCurveTo(fx, far.y, x + size, near.y);
        ctx.strokeStyle = `rgba(${selected ? "134,255,230" : "89,203,217"},${p * (selected ? 0.36 : 0.21)})`;
        ctx.lineWidth = 0.6 + p * 1.7;
        ctx.stroke();
      }
    }
  }

  drawScenery() {
    const items = [];
    const cycle = 1650;
    for (let i = 0; i < 30; i++) {
      const z =
        ((((i * cycle) / 30 + 70 - this.distance) % cycle) + cycle) % cycle;
      items.push({ z, seed: i, side: i % 2 ? 1 : -1 });
    }
    items.sort((a, b) => b.z - a.z);
    for (const item of items) {
      const p = 1 / (1 + item.z * 0.005);
      const channel = this.channelAt(p);
      const x =
        channel.x +
        item.side * channel.half * (1.2 + random(item.seed + 5) * 0.75);
      const size =
        this.height * Math.pow(p, 1.5) * (0.12 + random(item.seed + 19) * 0.1);
      if (x < -size || x > this.width + size) continue;
      this.context.save();
      this.context.globalAlpha = clamp(p * 1.5, 0.15, 0.9);
      if (item.seed % 11 === 3)
        this.drawProbe(x, channel.y, size * 0.67, item.seed);
      else if (item.seed % 13 === 7)
        this.drawRuins(x, channel.y, size * 1.15, 0.8);
      else if (item.seed % 3 === 0)
        this.drawKelp(x, channel.y + size * 0.08, size * 1.6, item.seed);
      else this.drawCoral(x, channel.y, size, item.seed);
      this.context.restore();
    }
  }

  drawCoral(x, y, size, seed) {
    const ctx = this.context;
    const violet = this.deep > 0.4;
    this.ellipse(
      x,
      y + size * 0.03,
      size * 0.65,
      size * 0.17,
      "rgba(1,16,27,.35)",
    );
    this.ellipse(
      x,
      y,
      size * 0.5,
      size * 0.18,
      violet ? "#29335c" : "#164b57",
      -0.07,
    );
    const colors = violet
      ? ["#9d76e4", "#5d68af", "#65d7cf"]
      : ["#d68b7f", "#c57572", "#b19b64", "#4ea598"];
    for (let branch = 0; branch < 5; branch++) {
      const ox = (branch - 2) * size * 0.13;
      const tip = -size * (0.35 + random(seed * 9 + branch) * 0.6);
      const tipX = ox + (random(seed + branch + 63) - 0.5) * size * 0.3;
      ctx.strokeStyle = colors[(seed + branch) % colors.length];
      ctx.lineWidth = Math.max(
        1.2,
        size * (0.042 + random(branch + seed) * 0.025),
      );
      ctx.beginPath();
      ctx.moveTo(x + ox, y);
      ctx.bezierCurveTo(
        x + ox - size * 0.1,
        y + tip * 0.4,
        x + tipX + size * 0.1,
        y + tip * 0.7,
        x + tipX,
        y + tip,
      );
      ctx.moveTo(x + mix(ox, tipX, 0.5), y + tip * 0.5);
      ctx.quadraticCurveTo(
        x + tipX + size * 0.22,
        y + tip * 0.54,
        x + tipX + size * 0.21,
        y + tip * 0.83,
      );
      ctx.moveTo(x + mix(ox, tipX, 0.3), y + tip * 0.3);
      ctx.quadraticCurveTo(
        x + tipX - size * 0.21,
        y + tip * 0.33,
        x + tipX - size * 0.2,
        y + tip * 0.63,
      );
      ctx.stroke();
      if (violet) {
        ctx.shadowColor = "#ab81f0";
        ctx.shadowBlur = size * 0.12;
        this.ellipse(
          x + tipX,
          y + tip,
          Math.max(1, size * 0.035),
          Math.max(1, size * 0.04),
          "#d4bcff",
        );
        ctx.shadowBlur = 0;
      }
    }
    if (seed % 2) {
      for (let i = 0; i < 4; i++) {
        const fx = x + (i - 1.5) * size * 0.2;
        const fy = y - size * (0.12 + random(seed + i) * 0.25);
        this.ellipse(
          fx,
          fy,
          size * 0.16,
          size * 0.065,
          violet ? "#7769ab" : "#ba9470",
          -0.1,
        );
        ctx.strokeStyle = violet ? "#b6a0e0" : "#dfb998";
        ctx.lineWidth = Math.max(0.7, size * 0.014);
        ctx.beginPath();
        ctx.ellipse(
          fx,
          fy,
          size * 0.13,
          size * 0.047,
          -0.1,
          Math.PI * 1.05,
          Math.PI * 1.9,
        );
        ctx.stroke();
      }
    }
  }

  drawKelp(x, y, size, seed) {
    const ctx = this.context;
    for (let i = 0; i < 5; i++) {
      const ox = (i - 2) * size * 0.1;
      const tall = size * (0.5 + random(seed + i * 3) * 0.5);
      const sway =
        (this.time ? Math.sin(this.time * 0.7 + seed + i * 0.6) : 0) *
        size *
        0.055;
      const tx = x + ox + sway;
      ctx.strokeStyle =
        this.deep > 0.5 ? "#42667c" : ["#187c77", "#26796e", "#349286"][i % 3];
      ctx.lineWidth = Math.max(1, size * 0.022);
      ctx.beginPath();
      ctx.moveTo(x + ox, y);
      ctx.bezierCurveTo(
        x + ox - size * 0.08,
        y - tall * 0.36,
        tx + size * 0.12,
        y - tall * 0.68,
        tx,
        y - tall,
      );
      ctx.stroke();
      for (let leaf = 1; leaf <= 4; leaf++) {
        const ly = y - (tall * leaf) / 5;
        const side = leaf % 2 ? 1 : -1;
        ctx.beginPath();
        ctx.moveTo(tx, ly);
        ctx.quadraticCurveTo(
          tx + side * size * 0.23,
          ly - size * 0.13,
          tx + side * size * 0.12,
          ly - size * 0.24,
        );
        ctx.quadraticCurveTo(tx + side * size * 0.03, ly - size * 0.17, tx, ly);
        ctx.fillStyle =
          this.deep > 0.5
            ? "#376c83"
            : ["#25897f", "#2b9c8b", "#196b6b"][i % 3];
        ctx.fill();
      }
    }
  }

  drawRuins(x, y, size, alpha) {
    const ctx = this.context;
    ctx.save();
    ctx.globalAlpha *= alpha;
    const stone = ctx.createLinearGradient(
      x - size * 0.5,
      y - size,
      x + size * 0.5,
      y,
    );
    stone.addColorStop(0, "#376873");
    stone.addColorStop(1, "#174350");
    ctx.strokeStyle = stone;
    ctx.lineWidth = size * 0.16;
    ctx.lineCap = "butt";
    ctx.beginPath();
    ctx.moveTo(x - size * 0.4, y);
    ctx.lineTo(x - size * 0.4, y - size * 0.56);
    ctx.bezierCurveTo(
      x - size * 0.4,
      y - size * 1.05,
      x + size * 0.4,
      y - size * 1.05,
      x + size * 0.4,
      y - size * 0.56,
    );
    ctx.lineTo(x + size * 0.4, y);
    ctx.stroke();
    for (const side of [-1, 1]) {
      this.roundedRect(
        x + side * size * 0.4 - size * 0.12,
        y - size * 0.1,
        size * 0.24,
        size * 0.12,
        size * 0.025,
        "#275766",
      );
      ctx.strokeStyle = "rgba(131,211,206,.28)";
      ctx.lineWidth = Math.max(0.8, size * 0.015);
      ctx.beginPath();
      ctx.moveTo(x + side * size * 0.4 - size * 0.03, y - size * 0.13);
      ctx.lineTo(x + side * size * 0.4 - size * 0.03, y - size * 0.55);
      ctx.stroke();
    }
    this.drawKelp(x - size * 0.4, y, size * 0.44, 52);
    if (this.deep > 0.3) {
      ctx.shadowColor = "#9f80ff";
      ctx.shadowBlur = size * 0.15;
      this.ellipse(x, y - size * 0.78, size * 0.045, size * 0.045, "#ad9ae8");
    }
    ctx.restore();
  }

  drawProbe(x, y, size, seed) {
    const ctx = this.context;
    ctx.save();
    ctx.translate(x, y - size * 0.35);
    ctx.rotate(-0.15 + random(seed) * 0.3);
    ctx.strokeStyle = "#496b71";
    ctx.lineWidth = Math.max(1, size * 0.035);
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * size * 0.2, 0);
      ctx.lineTo(side * size * 0.5, size * 0.35);
      ctx.lineTo(side * size * 0.65, size * 0.36);
      ctx.stroke();
    }
    const metal = ctx.createLinearGradient(-size * 0.3, 0, size * 0.3, 0);
    metal.addColorStop(0, "#294c5a");
    metal.addColorStop(0.4, "#739492");
    metal.addColorStop(1, "#29495b");
    this.ellipse(0, 0, size * 0.31, size * 0.23, metal, -0.2);
    ctx.strokeStyle = "#668f92";
    ctx.beginPath();
    ctx.moveTo(size * 0.06, -size * 0.19);
    ctx.lineTo(size * 0.06, -size * 0.65);
    ctx.stroke();
    this.ellipse(
      size * 0.06,
      -size * 0.65,
      size * 0.06,
      size * 0.03,
      "#acb39a",
    );
    this.ellipse(0, -size * 0.02, size * 0.14, size * 0.11, "#123a4d");
    ctx.shadowColor = "#81e9de";
    ctx.shadowBlur = size * 0.18;
    this.ellipse(0, -size * 0.025, size * 0.08, size * 0.065, "#8cddd3");
    ctx.restore();
  }

  drawAnimals() {
    const ctx = this.context;
    const w = this.width;
    const h = this.height;
    for (let school = 0; school < 3; school++) {
      const drift = this.time
        ? Math.sin(this.time * 0.045 + school) * w * 0.09
        : 0;
      const bx = w * [0.15, 0.81, 0.65][school] + drift;
      const by = h * [0.39, 0.3, 0.5][school];
      for (let i = 0; i < 8; i++) {
        const fx = bx + (random(i + school * 19) - 0.5) * w * 0.18;
        const fy = by + (random(i + 31 + school) - 0.5) * h * 0.07;
        const size = Math.min(w, h) * (0.007 + random(i + school) * 0.008);
        const wag = this.time ? Math.sin(this.time * 3 + i) * 0.2 : 0;
        ctx.save();
        ctx.translate(fx, fy);
        if (school % 2) ctx.scale(-1, 1);
        const color =
          school === 1 ? "rgba(224,193,117,.45)" : "rgba(128,201,202,.43)";
        this.ellipse(0, 0, size, size * 0.33, color, -0.1);
        this.polygon(
          [
            [-size * 0.7, 0],
            [-size * 1.35, -size * (0.5 + wag)],
            [-size * 1.35, size * (0.5 + wag)],
          ],
          color,
        );
        ctx.restore();
      }
    }
    const turtleX =
      w * 0.14 + (this.time ? Math.sin(this.time * 0.035) * w * 0.04 : 0);
    this.drawTurtle(
      turtleX,
      h * 0.51 + (this.time ? Math.sin(this.time * 0.6) * 3 : 0),
      Math.min(w * 0.055, h * 0.07),
    );
    const rayX =
      w * 0.79 + (this.time ? Math.sin(this.time * 0.025 + 2) * w * 0.06 : 0);
    this.drawRay(rayX, h * 0.43, Math.min(w * 0.065, h * 0.095));
  }

  drawTurtle(x, y, size) {
    const ctx = this.context;
    const flap = this.time ? Math.sin(this.time * 1.15) * 0.16 : 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.17);
    for (const side of [-1, 1]) {
      this.ellipse(
        -size * 0.2,
        side * size * 0.66,
        size * 0.58,
        size * 0.16,
        "#547e78",
        side * (0.65 + flap),
      );
      this.ellipse(
        -size * 0.72,
        side * size * 0.36,
        size * 0.3,
        size * 0.1,
        "#47776e",
        side * -0.5,
      );
    }
    this.ellipse(
      size * 0.95,
      -size * 0.025,
      size * 0.34,
      size * 0.22,
      "#8c9d7e",
    );
    const shell = ctx.createRadialGradient(
      -size * 0.12,
      -size * 0.15,
      size * 0.1,
      0,
      0,
      size,
    );
    shell.addColorStop(0, "#8d9a68");
    shell.addColorStop(1, "#365e53");
    this.ellipse(0, 0, size * 0.9, size * 0.58, shell);
    ctx.strokeStyle = "rgba(183,196,134,.39)";
    ctx.lineWidth = Math.max(0.6, size * 0.025);
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.7, size * 0.43, 0, 0, TAU);
    ctx.moveTo(-size * 0.5, -size * 0.3);
    ctx.lineTo(-size * 0.15, -size * 0.05);
    ctx.lineTo(size * 0.25, -size * 0.28);
    ctx.moveTo(-size * 0.15, -size * 0.05);
    ctx.lineTo(-size * 0.15, size * 0.3);
    ctx.stroke();
    this.ellipse(
      size * 1.11,
      -size * 0.07,
      size * 0.035,
      size * 0.035,
      "#142f32",
    );
    ctx.restore();
  }

  drawRay(x, y, size) {
    const ctx = this.context;
    const flap = this.time ? Math.sin(this.time * 0.9) * size * 0.12 : 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.1);
    const color = ctx.createLinearGradient(0, -size * 0.5, 0, size * 0.5);
    color.addColorStop(0, "#6b929c");
    color.addColorStop(1, "#244e65");
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.58);
    ctx.bezierCurveTo(
      -size * 0.2,
      -size * 0.3,
      -size * 0.75,
      -size * 0.2,
      -size * 1.2,
      size * 0.2 + flap,
    );
    ctx.bezierCurveTo(
      -size * 0.55,
      size * 0.2,
      -size * 0.5,
      size * 0.5,
      0,
      size * 0.42,
    );
    ctx.bezierCurveTo(
      size * 0.5,
      size * 0.5,
      size * 0.55,
      size * 0.2,
      size * 1.2,
      size * 0.2 + flap,
    );
    ctx.bezierCurveTo(
      size * 0.75,
      -size * 0.2,
      size * 0.2,
      -size * 0.3,
      0,
      -size * 0.58,
    );
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "#416b7d";
    ctx.lineWidth = Math.max(0.8, size * 0.035);
    ctx.beginPath();
    ctx.moveTo(0, size * 0.32);
    ctx.quadraticCurveTo(size * 0.1, size * 1.2, size * 0.4, size * 1.6);
    ctx.stroke();
    for (let i = 0; i < 6; i++)
      this.ellipse(
        (random(i + 7) - 0.5) * size,
        (random(i + 8) - 0.2) * size * 0.35,
        size * 0.025,
        size * 0.025,
        "rgba(182,222,219,.4)",
      );
    ctx.restore();
  }

  drawParticles() {
    const ctx = this.context;
    const h = this.height;
    for (let i = 0; i < 39; i++) {
      const p = random(i + 24);
      const x =
        random(i + 44) * this.width +
        (this.time ? Math.sin(this.time * 0.3 + i) * (3 + p * 8) : 0);
      const phase = (random(i + 68) + this.time * (0.006 + p * 0.015)) % 1;
      const y = h * (1.08 - phase * 1.16);
      const radius = 0.7 + p * 2.4;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, TAU);
      ctx.strokeStyle = `rgba(160,235,234,${0.08 + p * 0.2})`;
      ctx.lineWidth = 0.65;
      ctx.stroke();
      if (p > 0.7)
        this.ellipse(
          x - radius * 0.25,
          y - radius * 0.3,
          radius * 0.2,
          radius * 0.14,
          "rgba(212,255,249,.4)",
        );
    }
    if (this.deep) {
      ctx.save();
      ctx.globalAlpha = this.deep;
      for (let i = 0; i < 22; i++) {
        const x = random(i + 410) * this.width;
        const y = h * (0.36 + random(i + 92) * 0.6);
        const opacity = this.time
          ? 0.3 + Math.sin(this.time * 0.5 + i) * 0.12
          : 0.3;
        ctx.shadowColor = i % 2 ? "#a478ed" : "#77e9d9";
        ctx.shadowBlur = 9;
        this.ellipse(
          x,
          y,
          1.1 + random(i) * 1.5,
          1.1 + random(i) * 1.5,
          `rgba(${i % 2 ? "177,138,244" : "117,236,218"},${opacity})`,
        );
      }
      ctx.restore();
    }
  }

  drawGates(answers, progress) {
    const ctx = this.context;
    const depth = 0.42 + Math.pow(progress, 0.88) * 0.52;
    const channel = this.channelAt(depth);
    const laneWidth = (channel.half * 2) / 3;
    const gateWidth = laneWidth * 0.81;
    const gateHeight = clamp(
      gateWidth * 1.16,
      64,
      Math.max(64, this.height * 0.245),
    );
    const top = Math.max(
      Math.min(305, this.height * 0.54),
      channel.y - gateHeight,
    );
    const bottom = top + gateHeight;
    answers.forEach((answer, index) => {
      const x = channel.x + (index - 1) * laneWidth;
      const selected = Math.abs(this.lane - index) < 0.46;
      const postWidth = Math.max(1.6, gateWidth * 0.035);
      const shoulder = Math.min(gateWidth * 0.24, gateHeight * 0.4);
      this.ellipse(
        x,
        bottom + gateHeight * 0.045,
        gateWidth * 0.56,
        gateHeight * 0.065,
        selected ? "rgba(77,234,203,.17)" : "rgba(43,157,180,.1)",
      );
      const field = ctx.createLinearGradient(0, top, 0, bottom);
      field.addColorStop(
        0,
        selected ? "rgba(109,252,220,.11)" : "rgba(80,206,224,.05)",
      );
      field.addColorStop(1, "rgba(68,218,217,0)");
      this.roundedRect(
        x - gateWidth * 0.43,
        top + gateHeight * 0.05,
        gateWidth * 0.86,
        gateHeight * 0.91,
        shoulder,
        field,
      );
      ctx.save();
      ctx.shadowColor = selected ? "#82f9d6" : "#4aaec8";
      ctx.shadowBlur = Math.min(18, gateWidth * 0.17);
      ctx.beginPath();
      ctx.moveTo(x - gateWidth * 0.47, bottom);
      ctx.lineTo(x - gateWidth * 0.47, top + shoulder);
      ctx.quadraticCurveTo(
        x - gateWidth * 0.47,
        top,
        x - gateWidth * 0.47 + shoulder,
        top,
      );
      ctx.lineTo(x + gateWidth * 0.47 - shoulder, top);
      ctx.quadraticCurveTo(
        x + gateWidth * 0.47,
        top,
        x + gateWidth * 0.47,
        top + shoulder,
      );
      ctx.lineTo(x + gateWidth * 0.47, bottom);
      ctx.strokeStyle = "#173b51";
      ctx.lineWidth = postWidth * 3.7;
      ctx.stroke();
      ctx.strokeStyle = selected ? "#a3ffdf" : "#68cfda";
      ctx.lineWidth = postWidth;
      ctx.stroke();
      ctx.restore();
      for (const side of [-1, 1]) {
        this.roundedRect(
          x + side * gateWidth * 0.47 - postWidth * 1.9,
          bottom - postWidth * 1.7,
          postWidth * 3.8,
          postWidth * 2.3,
          postWidth * 0.6,
          "#2b5867",
          "#709f9d",
          0.6,
        );
        this.ellipse(
          x + side * gateWidth * 0.47,
          top + gateHeight * 0.65,
          postWidth * 0.55,
          postWidth * 1.4,
          selected ? "#d6ffb6" : "#f7d68d",
        );
      }
      const plateHeight = Math.max(
        gateHeight * 0.41,
        Math.min(52, laneWidth * 0.53),
      );
      const plateWidth = gateWidth * 0.97;
      const plateY = top + gateHeight * 0.12;
      this.answerPlates.push({
        answer,
        x,
        plateY,
        plateWidth,
        plateHeight,
        gateWidth,
        selected,
        progress,
      });
      if (selected && gateWidth > 35) {
        const markerY = bottom + gateHeight * 0.1;
        this.polygon(
          [
            [x, markerY - gateHeight * 0.065],
            [x + gateWidth * 0.065, markerY],
            [x, markerY + gateHeight * 0.065],
            [x - gateWidth * 0.065, markerY],
          ],
          "#b8ffe5",
        );
      }
    });
  }

  drawAnswerPlates() {
    const ctx = this.context;
    for (const {
      answer,
      x,
      plateY,
      plateWidth,
      plateHeight,
      gateWidth,
      selected,
      progress,
    } of this.answerPlates) {
      ctx.save();
      ctx.shadowColor = "rgba(0,10,24,.6)";
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 3;
      this.roundedRect(
        x - plateWidth / 2,
        plateY,
        plateWidth,
        plateHeight,
        Math.min(12, gateWidth * 0.09),
        selected ? "#e8fff4" : "#eff9f2",
        selected ? "#a5ffe0" : "#7db2bd",
        selected ? 2.4 : 1.4,
      );
      ctx.restore();
      const fontSize =
        progress > 0.65
          ? Math.max(32, plateHeight * 0.73)
          : Math.max(20, plateHeight * 0.75);
      ctx.font = `600 ${fontSize}px "Outfit", "Trebuchet MS", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#082f43";
      ctx.fillText(
        String(answer),
        x,
        plateY + plateHeight * 0.53,
        plateWidth * 0.86,
      );
    }
  }

  drawBoost() {
    const ctx = this.context;
    ctx.save();
    for (let i = 0; i < 28; i++) {
      const phase = (this.time * 1.1 + random(i + 22)) % 1;
      const angle = (i % 2 ? 1 : -1) * (0.55 + random(i + 6) * 0.9);
      const dx = Math.sin(angle) * this.width;
      const dy = (0.12 + random(i + 19) * 0.8) * this.height;
      const start = 0.32 + phase * 0.85;
      const length = 0.03 + phase * 0.12;
      ctx.strokeStyle = `rgba(163,251,241,${phase * 0.36})`;
      ctx.lineWidth = 0.7 + phase * 1.8;
      ctx.beginPath();
      ctx.moveTo(this.width * 0.5 + dx * start, this.horizon + dy * start);
      ctx.lineTo(
        this.width * 0.5 + dx * (start + length),
        this.horizon + dy * (start + length),
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  drawExplorer() {
    const ctx = this.context;
    const point = this.laneAt(this.lane, 0.89);
    const size = clamp(
      Math.min(this.width * 0.19, this.height * 0.22),
      52,
      148,
    );
    const bob = this.time && !this.crashed ? Math.sin(this.time * 1.8) * 2 : 0;
    const y = this.height * 0.865 + bob + this.braking * size * 0.05;
    ctx.save();
    ctx.translate(
      this.cinematic ? this.width * (this.width < 600 ? 0.72 : 0.74) : point.x,
      this.cinematic ? this.height * 0.64 + bob : y,
    );
    ctx.rotate(clamp((this.lane - this.lastLane) * 0.95, -0.13, 0.13));
    const beam = ctx.createLinearGradient(0, -size * 0.65, 0, -size * 2.5);
    beam.addColorStop(0, `rgba(216,255,207,${this.crashed ? 0.025 : 0.08})`);
    beam.addColorStop(1, "rgba(190,255,221,0)");
    if (!this.cinematic)
      this.polygon(
        [
          [-size * 0.27, -size * 0.58],
          [size * 0.27, -size * 0.58],
          [size * 0.7, -size * 2.55],
          [-size * 0.7, -size * 2.55],
        ],
        beam,
      );
    this.drawScooterBubbles(size);
    if (this.explorerImage.complete && this.explorerImage.naturalWidth) {
      const ratio =
        this.explorerImage.naturalWidth / this.explorerImage.naturalHeight;
      const imageHeight = this.cinematic
        ? Math.min(this.height * 0.64, (this.width * 0.4) / ratio)
        : Math.min(size * 2.1, (size * 1.5) / ratio);
      const imageWidth = imageHeight * ratio;
      ctx.save();
      ctx.shadowColor = "rgba(0,16,27,.3)";
      ctx.shadowBlur = 12;
      ctx.drawImage(
        this.explorerImage,
        -imageWidth / 2,
        -imageHeight * 0.67,
        imageWidth,
        imageHeight,
      );
      ctx.restore();
    } else this.drawExplorerIllustration(size);
    ctx.restore();
  }

  drawScooterBubbles(size) {
    const ctx = this.context;
    const amount = this.turbo ? 30 : 10;
    const length = this.turbo ? size * 2.15 : size * 1.1;
    for (let i = 0; i < amount; i++) {
      const phase =
        (this.time * (this.turbo ? 1.3 : 0.48) + random(i + 520)) % 1;
      const side = i % 2 ? 1 : -1;
      const x =
        side * size * 0.23 +
        (random(i + 5) - 0.5) *
          size *
          (0.11 + phase * (this.turbo ? 0.7 : 0.25));
      const y = size * 0.12 + phase * length;
      const radius = size * (0.014 + phase * 0.025) * (this.turbo ? 1.6 : 1);
      ctx.beginPath();
      ctx.ellipse(x, y, radius, radius * (this.turbo ? 1.25 : 1), 0, 0, TAU);
      ctx.strokeStyle = `rgba(194,255,247,${(1 - phase) * (this.turbo ? 0.8 : 0.38) * (1 - this.braking)})`;
      ctx.lineWidth = this.turbo ? 1.3 : 0.8;
      ctx.stroke();
    }
    if (this.turbo) {
      for (const side of [-1, 1]) {
        const jet = ctx.createLinearGradient(0, 0, 0, size * 1.7);
        jet.addColorStop(0, "rgba(191,255,241,.65)");
        jet.addColorStop(1, "rgba(94,230,224,0)");
        this.polygon(
          [
            [side * size * 0.25 - size * 0.065, 0],
            [side * size * 0.25 + size * 0.065, 0],
            [side * size * 0.25 + size * 0.19, size * 1.7],
            [side * size * 0.25 - size * 0.19, size * 1.7],
          ],
          jet,
        );
      }
    }
  }

  drawExplorerIllustration(size) {
    const ctx = this.context;
    ctx.save();
    ctx.scale(size, size);
    const limb = (points, width, color) => {
      ctx.beginPath();
      ctx.moveTo(...points[0]);
      ctx.bezierCurveTo(...points[1], ...points[2], ...points[3]);
      ctx.lineWidth = width;
      ctx.strokeStyle = color;
      ctx.stroke();
    };
    const finWave =
      this.time && !this.crashed ? Math.sin(this.time * 2.2) * 0.05 : 0;
    for (const side of [-1, 1]) {
      limb(
        [
          [side * 0.16, -0.04],
          [side * 0.2, 0.19],
          [side * 0.29, 0.27],
          [side * 0.26, 0.49 + side * finWave],
        ],
        0.16,
        "#132d43",
      );
      limb(
        [
          [side * 0.19, 0.06],
          [side * 0.24, 0.2],
          [side * 0.32, 0.27],
          [side * 0.28, 0.39 + side * finWave],
        ],
        0.045,
        "#4ca5ab",
      );
      ctx.beginPath();
      ctx.moveTo(side * 0.26 - 0.07, 0.42 + side * finWave);
      ctx.quadraticCurveTo(
        side * 0.31 - 0.14,
        0.63 + side * finWave,
        side * 0.34 - 0.11,
        0.74 + side * finWave,
      );
      ctx.quadraticCurveTo(
        side * 0.34,
        0.81 + side * finWave,
        side * 0.34 + 0.13,
        0.73 + side * finWave,
      );
      ctx.quadraticCurveTo(
        side * 0.31 + 0.15,
        0.59 + side * finWave,
        side * 0.26 + 0.07,
        0.42 + side * finWave,
      );
      ctx.closePath();
      ctx.fillStyle = "#efb85c";
      ctx.fill();
    }
    const suit = ctx.createLinearGradient(-0.34, -0.7, 0.3, 0);
    suit.addColorStop(0, "#183b52");
    suit.addColorStop(0.46, "#28677b");
    suit.addColorStop(1, "#102a40");
    this.ellipse(0, -0.36, 0.28, 0.39, suit);
    for (const side of [-1, 1]) {
      limb(
        [
          [side * 0.25, -0.58],
          [side * 0.4, -0.54],
          [side * 0.42, -0.37],
          [side * 0.39, -0.38],
        ],
        0.12,
        "#18374d",
      );
      limb(
        [
          [side * 0.3, -0.58],
          [side * 0.37, -0.52],
          [side * 0.36, -0.44],
          [side * 0.39, -0.41],
        ],
        0.055,
        "#ed8b7a",
      );
      this.ellipse(side * 0.39, -0.4, 0.058, 0.055, "#304858");
    }
    const tank = ctx.createLinearGradient(-0.13, 0, 0.13, 0);
    tank.addColorStop(0, "#b58245");
    tank.addColorStop(0.35, "#f0c378");
    tank.addColorStop(1, "#9d703f");
    this.roundedRect(-0.13, -0.68, 0.26, 0.54, 0.11, tank, "#153546", 0.025);
    this.roundedRect(-0.145, -0.53, 0.29, 0.055, 0.015, "#1e394b");
    this.roundedRect(-0.145, -0.28, 0.29, 0.055, 0.015, "#1e394b");
    limb(
      [
        [0.05, -0.72],
        [0.29, -0.87],
        [0.39, -0.6],
        [0.23, -0.53],
      ],
      0.035,
      "#071d2b",
    );
    this.ellipse(0, -0.91, 0.2, 0.23, "#202f3c");
    this.ellipse(0, -0.95, 0.17, 0.18, "#574035");
    ctx.beginPath();
    ctx.moveTo(0.09, -1.05);
    ctx.bezierCurveTo(0.4, -0.98, 0.18, -0.73, 0.4, -0.69);
    ctx.bezierCurveTo(0.25, -0.64, 0.1, -0.83, 0.09, -1.05);
    ctx.fillStyle = "#564034";
    ctx.fill();
    this.roundedRect(-0.205, -0.98, 0.41, 0.057, 0.02, "#edb562");
    this.roundedRect(-0.19, -0.82, 0.38, 0.05, 0.018, "#173b4e");
    limb(
      [
        [-0.4, -0.44],
        [-0.22, -0.43],
        [0.22, -0.43],
        [0.4, -0.44],
      ],
      0.045,
      "#a4bdbb",
    );
    const scooter = ctx.createLinearGradient(-0.53, -0.53, 0.53, -0.31);
    scooter.addColorStop(0, "#aa674d");
    scooter.addColorStop(0.35, "#f2ac75");
    scooter.addColorStop(1, "#8f5349");
    this.ellipse(0, -0.5, 0.53, 0.18, scooter);
    this.roundedRect(
      -0.15,
      -0.62,
      0.3,
      0.15,
      0.06,
      "#26485a",
      "#669ca4",
      0.016,
    );
    this.roundedRect(-0.085, -0.59, 0.17, 0.06, 0.015, "#91e5d0");
    for (const side of [-1, 1]) {
      this.ellipse(side * 0.4, -0.43, 0.13, 0.1, "#173d50");
      this.ellipse(side * 0.4, -0.43, 0.087, 0.065, "#416b75");
      this.ellipse(
        side * 0.4,
        -0.43,
        0.045,
        0.035,
        this.turbo ? "#c4ffed" : "#9ed1c7",
      );
      this.ellipse(side * 0.35, -0.59, 0.055, 0.028, "#fff0b7");
    }
    ctx.restore();
  }

  drawVignette() {
    const ctx = this.context;
    const w = this.width;
    const h = this.height;
    const edge = ctx.createRadialGradient(
      w * 0.5,
      h * 0.53,
      Math.min(w, h) * 0.24,
      w * 0.5,
      h * 0.5,
      Math.max(w, h) * 0.74,
    );
    edge.addColorStop(0, "rgba(0,9,24,0)");
    edge.addColorStop(1, "rgba(0,9,24,.28)");
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, w, h);
  }

  drawSafetyField() {
    const ctx = this.context;
    const point = this.laneAt(this.lane, 0.89);
    const radius =
      Math.min(this.width * 0.2, this.height * 0.22) *
      (0.8 + this.braking * 0.2);
    ctx.save();
    ctx.strokeStyle = `rgba(173,243,233,${0.15 + this.braking * 0.2})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(
      point.x,
      this.height * 0.85,
      radius * 0.75,
      radius,
      0,
      Math.PI * 0.9,
      Math.PI * 2.1,
    );
    ctx.stroke();
    ctx.fillStyle = `rgba(8,27,45,${this.braking * 0.14})`;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();
  }
}
