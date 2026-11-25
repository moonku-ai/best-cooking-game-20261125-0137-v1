// The chef: walks the kitchen, carries one thing, and works the station in
// front of them. Hands are the game's only inventory — one item, or one plate
// with its food on it — so every trip is a choice about what to carry next.
import { CHEF_SPEED, CHEF_RADIUS, INTERACT_REACH, CHOP_SECONDS, PLATE_COUNT, PLATE_RETURN_SECONDS } from './config.js';
import { nearestStation, collide, burnerSlots } from './world.js';
import { INGREDIENTS } from './config.js';
import { dishOnPlate, canAddToPlate } from './recipes.js';

export function makeChef() {
  return {
    x: 640, y: 690, vx: 0, vy: 0, facing: 'up',
    carry: null, // { kind: 'item', id, state } | { kind: 'plate', items: [] } | null
    chopping: null, // { stationId, progress } while E is held on a board
    platesClean: PLATE_COUNT,
    plateReturnIn: [], // seconds until each dirty plate comes back
    busy: 0, // seconds of animation lock after an action
  };
}

export function moveChef(chef, keys, dt) {
  let ax = 0;
  let ay = 0;
  if (keys.left) ax -= 1;
  if (keys.right) ax += 1;
  if (keys.up) ay -= 1;
  if (keys.down) ay += 1;
  const len = Math.hypot(ax, ay) || 1;
  const target = { x: (ax / len) * CHEF_SPEED, y: (ay / len) * CHEF_SPEED };
  const k = Math.min(1, dt * 12); // smooth acceleration, no ice-skating
  chef.vx += (target.x - chef.vx) * k;
  chef.vy += (target.y - chef.vy) * k;
  const pos = collide(chef.x + chef.vx * dt, chef.y + chef.vy * dt, CHEF_RADIUS);
  chef.x = pos.x;
  chef.y = pos.y;
  if (Math.abs(chef.vx) > 30 || Math.abs(chef.vy) > 30) {
    chef.facing = Math.abs(chef.vx) > Math.abs(chef.vy)
      ? (chef.vx > 0 ? 'right' : 'left')
      : (chef.vy > 0 ? 'down' : 'up');
  }
  if (chef.busy > 0) chef.busy -= dt;
}

// One press of E (or a click) at the station in front of the chef.
// Returns an event for sound/feedback, or null.
export function interact(chef, stations, now) {
  const station = nearestStation(chef.x, chef.y, INTERACT_REACH + CHEF_RADIUS);
  if (!station) return null;
  const held = stations.held[station.id]; // item resting on this station, if any
  switch (station.kind) {
    case 'crate': {
      if (chef.carry) return { type: 'deny', why: 'hands-full' };
      chef.carry = { kind: 'item', id: station.item, state: 'raw' };
      return { type: 'pickup', item: station.item };
    }
    case 'board': {
      if (held) {
        // Take the chopped (or raw) item back off the board.
        if (chef.carry) return { type: 'deny', why: 'hands-full' };
        chef.carry = held;
        stations.held[station.id] = null;
        return { type: 'pickup', item: held.id };
      }
      if (!chef.carry || chef.carry.kind !== 'item') return { type: 'deny', why: 'need-item' };
      const def = INGREDIENTS[chef.carry.id];
      if (!def.chop) return { type: 'deny', why: 'no-chop' };
      if (chef.carry.state !== 'raw') return { type: 'deny', why: 'already-chopped' };
      stations.held[station.id] = chef.carry;
      chef.carry = null;
      return { type: 'place', station: station.id };
    }
    case 'stove': {
      const slots = burnerSlots();
      const slot = stations.burners.find((b) => !b.item);
      if (held) return { type: 'deny', why: 'hands-full' };
      if (!chef.carry || chef.carry.kind !== 'item') {
        // Empty hands: take a finished burner item, nearest burner first
        // (a burnt one too, so it can be thrown away).
        const done = stations.burners.find((b) => b.item && (b.item.state === 'cooked' || b.item.state === 'burnt'));
        if (!done) return { type: 'deny', why: 'nothing-ready' };
        chef.carry = done.item;
        done.item = null;
        done.progress = 0;
        return { type: 'pickup', item: chef.carry.id };
      }
      if (!slot) return { type: 'deny', why: 'burners-full' };
      const def = INGREDIENTS[chef.carry.id];
      if (!def.cook) return { type: 'deny', why: 'no-cook' };
      if (chef.carry.state === 'cooked') return { type: 'deny', why: 'already-cooked' };
      if (def.chop && chef.carry.state === 'raw') return { type: 'deny', why: 'chop-first' };
      slot.item = chef.carry;
      slot.progress = 0;
      slot.overcook = 0;
      slot.burnt = false;
      chef.carry = null;
      return { type: 'place', station: station.id };
    }
    case 'plate': {
      const plate = stations.plates[station.id]; // null when no plate rests here
      if (chef.carry && chef.carry.kind === 'plate') {
        // Put the carried plate down on an empty counter.
        if (plate) return { type: 'deny', why: 'counter-busy' };
        stations.plates[station.id] = chef.carry;
        chef.carry = null;
        return { type: 'place', station: station.id };
      }
      if (chef.carry && chef.carry.kind === 'item') {
        if (!plate) return { type: 'deny', why: 'need-plate' };
        if (!canAddToPlate(plate, chef.carry)) return { type: 'deny', why: 'not-in-recipe' };
        plate.items.push(chef.carry);
        chef.carry = null;
        const dish = dishOnPlate(plate);
        return dish ? { type: 'dish-ready', dish } : { type: 'place', station: station.id };
      }
      // Empty hands: pick the plate up — only when food is on it.
      if (!plate || plate.items.length === 0) return { type: 'deny', why: 'nothing-here' };
      chef.carry = plate;
      stations.plates[station.id] = null;
      return { type: 'pickup', item: 'plate' };
    }
    case 'plates': {
      if (chef.carry) return { type: 'deny', why: 'hands-full' };
      if (chef.platesClean <= 0) return { type: 'deny', why: 'no-plates' };
      chef.platesClean--;
      chef.carry = { kind: 'plate', items: [] };
      return { type: 'pickup', item: 'plate' };
    }
    case 'window': {
      if (!chef.carry || chef.carry.kind !== 'plate') return { type: 'deny', why: 'need-dish' };
      const dish = dishOnPlate(chef.carry);
      if (!dish) return { type: 'deny', why: 'not-a-dish' };
      // The plate stays in hand until main confirms an open order wants
      // this dish — a wrong dish is never thrown away by serving.
      return { type: 'serve', dish };
    }
    case 'trash': {
      if (!chef.carry) return null;
      const dropped = chef.carry;
      chef.carry = null;
      if (dropped.kind === 'plate') chef.plateReturnIn.push(PLATE_RETURN_SECONDS);
      return { type: 'trash', item: dropped };
    }
    default:
      return null;
  }
}

// Hold E on a board to chop what rests there. Returns events as it finishes.
export function holdChop(chef, stations, dt) {
  const station = nearestStation(chef.x, chef.y, INTERACT_REACH + CHEF_RADIUS);
  if (!station || station.kind !== 'board') {
    chef.chopping = null;
    return null;
  }
  const held = stations.held[station.id];
  if (!held || held.state !== 'raw' || !INGREDIENTS[held.id].chop) {
    chef.chopping = null;
    return null;
  }
  if (!chef.chopping || chef.chopping.stationId !== station.id) {
    chef.chopping = { stationId: station.id, progress: 0 };
  }
  chef.chopping.progress += dt / CHOP_SECONDS;
  if (chef.chopping.progress >= 1) {
    held.state = 'chopped';
    chef.chopping = null;
    return { type: 'chopped', item: held.id };
  }
  return null;
}

// Cook burners forward; returns events (done pings, burnt warnings).
export function tickBurners(stations, dt) {
  const events = [];
  for (const b of stations.burners) {
    if (!b.item) continue;
    const def = INGREDIENTS[b.item.id];
    b.progress += dt / def.cook;
    if (b.item.state !== 'cooked' && b.progress >= 1) {
      b.item.state = 'cooked';
      b.overcook = 0;
      events.push({ type: 'cooked', item: b.item.id });
    } else if (b.item.state === 'cooked') {
      b.overcook = (b.overcook || 0) + dt;
      if (b.overcook >= 5 && !b.burnt) {
        b.item.state = 'burnt';
        b.burnt = true;
        events.push({ type: 'burnt', item: b.item.id });
      }
    }
  }
  return events;
}

// Dirty plates come back to the clean stack.
export function tickPlates(chef, dt) {
  chef.plateReturnIn = chef.plateReturnIn.map((t) => t - dt).filter((t) => {
    if (t <= 0) {
      chef.platesClean++;
      return false;
    }
    return true;
  });
}
