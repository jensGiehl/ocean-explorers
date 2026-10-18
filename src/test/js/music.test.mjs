import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("../../main/resources/static/js/music.js", import.meta.url),
  "utf8",
);
const { OceanMusic } = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
);

class FakeAudioParameter {
  value = 0;
  events = [];

  setValueAtTime(value, time) {
    this.value = value;
    this.events.push({ type: "set", value, time });
  }

  linearRampToValueAtTime(value, time) {
    this.events.push({ type: "linear", value, time });
  }

  exponentialRampToValueAtTime(value, time) {
    this.events.push({ type: "exponential", value, time });
  }

  cancelScheduledValues(time) {
    this.events.push({ type: "cancel", time });
  }
}

class FakeAudioNode extends EventTarget {
  connections = [];
  disconnected = false;

  connect(destination) {
    this.connections.push(destination);
  }

  disconnect() {
    this.disconnected = true;
    this.connections = [];
  }
}

class FakeGain extends FakeAudioNode {
  gain = new FakeAudioParameter();
}

class FakeOscillator extends FakeAudioNode {
  frequency = new FakeAudioParameter();
  starts = [];
  stops = [];

  start(time) {
    this.starts.push(time);
  }

  stop(time) {
    this.stops.push(time);
  }
}

class FakeDocument extends EventTarget {
  hidden = false;

  setHidden(hidden) {
    this.hidden = hidden;
    this.dispatchEvent(new Event("visibilitychange"));
  }
}

function environment(t, preference) {
  const document = new FakeDocument();
  const stored = new Map(
    preference === undefined ? [] : [["oceanMusic", preference]],
  );
  const contexts = [];
  const intervals = new Map();
  const timeouts = new Map();
  let timerId = 0;

  class FakeAudioContext extends EventTarget {
    currentTime = 10;
    state = "suspended";
    destination = new FakeAudioNode();
    oscillators = [];
    gains = [];

    constructor() {
      super();
      contexts.push(this);
    }

    async resume() {
      this.state = "running";
      this.dispatchEvent(new Event("statechange"));
    }

    createGain() {
      const gain = new FakeGain();
      this.gains.push(gain);
      return gain;
    }

    createOscillator() {
      const oscillator = new FakeOscillator();
      this.oscillators.push(oscillator);
      return oscillator;
    }
  }

  const globals = {
    document,
    localStorage: {
      getItem: (key) => stored.get(key) ?? null,
      setItem: (key, value) => stored.set(key, value),
    },
    window: {
      AudioContext: FakeAudioContext,
      setInterval: (callback) => {
        const id = ++timerId;
        intervals.set(id, callback);
        return id;
      },
      clearInterval: (id) => intervals.delete(id),
      setTimeout: (callback) => {
        const id = ++timerId;
        timeouts.set(id, callback);
        return id;
      },
    },
  };

  for (const [name, value] of Object.entries(globals)) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, {
      configurable: true,
      writable: true,
      value,
    });
    t.after(() => {
      if (previous) Object.defineProperty(globalThis, name, previous);
      else delete globalThis[name];
    });
  }

  return { document, stored, contexts, intervals, timeouts };
}

function assertStopped(music, env, context, output) {
  assert.equal(music.timer, null);
  assert.equal(env.intervals.size, 0);
  assert.equal(music.output, null);
  assert.equal(music.voices.size, 0);
  for (const voice of context.oscillators) {
    assert.ok(voice.stops.at(-1) <= context.currentTime + 0.2);
  }
  assert.ok(
    output.gain.events.some(
      (event) => event.type === "linear" && event.value === 0,
    ),
  );
  for (const callback of env.timeouts.values()) callback();
  env.timeouts.clear();
  assert.equal(output.disconnected, true);
}

test("music defaults to off without starting an audio context", (t) => {
  const env = environment(t);
  const music = new OceanMusic();

  assert.equal(music.enabled, false);
  assert.equal(music.context, null);
  assert.equal(env.contexts.length, 0);
  assert.equal(env.intervals.size, 0);
});

test("music restores the saved preference without autoplay", (t) => {
  const env = environment(t, "true");
  const music = new OceanMusic();

  assert.equal(music.enabled, true);
  assert.equal(music.context, null);
  assert.equal(env.contexts.length, 0);
  assert.equal(env.intervals.size, 0);
});

test("disabled music never creates or schedules audio", async (t) => {
  const env = environment(t, "false");
  const music = new OceanMusic();

  await music.prepare();
  music.update(true);

  assert.equal(music.context, null);
  assert.equal(music.output, null);
  assert.equal(env.contexts.length, 0);
  assert.equal(env.intervals.size, 0);
});

test("active enabled music schedules audible tones and one timer", async (t) => {
  const env = environment(t, "true");
  const music = new OceanMusic();

  await music.prepare();
  music.update(true);
  const context = env.contexts[0];
  const output = music.output;

  assert.equal(context.state, "running");
  assert.equal(env.intervals.size, 1);
  assert.ok(context.oscillators.length > 0);
  assert.ok(output.connections.includes(context.destination));
  assert.ok(
    output.gain.events.some(
      (event) => event.type === "linear" && event.value > 0,
    ),
  );
  for (const voice of context.oscillators) {
    assert.equal(voice.type, "sine");
    assert.ok(voice.frequency.events[0].value > 0);
    assert.ok(voice.starts[0] >= context.currentTime);
    assert.ok(voice.stops[0] > voice.starts[0]);
    assert.ok(voice.connections[0].connections.includes(output));
  }

  music.update(true);
  assert.equal(env.intervals.size, 1);
  assert.equal(music.output, output);

  const initialVoices = context.oscillators.length;
  const tick = [...env.intervals.values()][0];
  for (let i = 0; i < 4; i++) {
    context.currentTime = music.nextNote;
    tick();
  }
  assert.ok(context.oscillators.length > initialVoices);
});

test("inactive game stops every voice, the timer and the output", async (t) => {
  const env = environment(t, "true");
  const music = new OceanMusic();
  await music.prepare();
  music.update(true);
  const context = env.contexts[0];
  const output = music.output;

  music.update(false);

  assertStopped(music, env, context, output);
  assert.equal(music.enabled, true);
  assert.equal(env.stored.get("oceanMusic"), "true");
});

test("visibilitychange stops music and hidden updates cannot restart it", async (t) => {
  const env = environment(t, "true");
  const music = new OceanMusic();
  await music.prepare();
  music.update(true);
  const context = env.contexts[0];
  const output = music.output;

  env.document.setHidden(true);

  assertStopped(music, env, context, output);
  const voicesBeforeHiddenUpdate = context.oscillators.length;
  music.update(true);
  assert.equal(music.output, null);
  assert.equal(env.intervals.size, 0);
  assert.equal(context.oscillators.length, voicesBeforeHiddenUpdate);

  env.document.setHidden(false);
  assert.equal(music.output, null);
  assert.equal(env.intervals.size, 0);

  music.update(true);
  assert.notEqual(music.output, null);
  assert.equal(env.intervals.size, 1);
});

test("disabling music stops audio and persists the preference", async (t) => {
  const env = environment(t, "true");
  const music = new OceanMusic();
  await music.prepare();
  music.update(true);
  const context = env.contexts[0];
  const output = music.output;

  music.setEnabled(false);

  assertStopped(music, env, context, output);
  assert.equal(music.enabled, false);
  assert.equal(env.stored.get("oceanMusic"), "false");
  music.update(true);
  assert.equal(music.output, null);
  assert.equal(env.intervals.size, 0);
  assert.equal(new OceanMusic().enabled, false);
});
