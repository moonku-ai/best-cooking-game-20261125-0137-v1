// Keyboard and mouse. WASD or arrows to walk, E (or Space) to use the
// station in front of you, hold E on a chopping board to chop, P to pause,
// M to mute, R to restart after the shift ends. Clicking a station walks
// the chef toward it and uses it on arrival; clicking a button presses it.
export function makeInput() {
  return {
    keys: { up: false, down: false, left: false, right: false, interact: false },
    pressed: { interact: false, pause: false, mute: false, restart: false, start: false },
    click: null, // { x, y } in canvas pixels, consumed by main
    mouse: { x: 0, y: 0 },
  };
}

const KEYMAP = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  KeyE: 'interact', Space: 'interact',
};

export function bindInput(input, canvas, onFirstGesture) {
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    const dir = KEYMAP[e.code];
    if (dir) {
      input.keys[dir] = true;
      if (dir === 'interact') input.pressed.interact = true;
      e.preventDefault();
      onFirstGesture();
    } else if (e.code === 'KeyP' || e.code === 'Escape') {
      input.pressed.pause = true;
    } else if (e.code === 'KeyM') {
      input.pressed.mute = true;
    } else if (e.code === 'KeyR') {
      input.pressed.restart = true;
    } else if (e.code === 'Enter') {
      input.pressed.start = true;
    }
  });
  window.addEventListener('keyup', (e) => {
    const dir = KEYMAP[e.code];
    if (dir) input.keys[dir] = false;
  });
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    input.click = { x, y };
    input.mouse = { x, y };
    onFirstGesture();
  });
  canvas.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    input.mouse = {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  });
}

export function endFrame(input) {
  input.pressed.interact = false;
  input.pressed.pause = false;
  input.pressed.mute = false;
  input.pressed.restart = false;
  input.pressed.start = false;
  input.click = null;
}
