/* ============================================
   Demo Clock — simulated time with speed multiplier
   ============================================ */

import { CLOCK_TICK_MS, DEFAULT_SPEED } from '../utils/constants.js';

/**
 * Creates a demo clock that can run at 1x, 10x, or 60x speed.
 *
 * The clock maintains a "sim time" that advances faster than
 * real time based on the speed multiplier.
 *
 * @param {Function} onTick - Called every real-world tick with { simNow, speed, realNow }
 * @returns {Object} Clock controller
 */
export function createDemoClock(onTick) {
  let speed = DEFAULT_SPEED;
  let running = false;
  let intervalId = null;

  // The sim epoch is the real timestamp when the clock was started/reset.
  // simOffset tracks accumulated sim time beyond real time.
  let simEpoch = Date.now();
  let simOffset = 0;

  function getSimNow() {
    const realElapsed = Date.now() - simEpoch;
    return simEpoch + simOffset + realElapsed * speed;
  }

  function tick() {
    if (onTick) {
      onTick({
        simNow: getSimNow(),
        speed,
        realNow: Date.now(),
      });
    }
  }

  function start() {
    if (running) return;
    running = true;
    simEpoch = Date.now();
    intervalId = setInterval(tick, CLOCK_TICK_MS);
    tick(); // immediate first tick
  }

  function stop() {
    if (!running) return;
    // Capture accumulated sim time before stopping
    simOffset = getSimNow() - Date.now();
    running = false;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function setSpeed(newSpeed) {
    if (running) {
      // Capture current sim time before changing speed
      simOffset = getSimNow() - Date.now();
      simEpoch = Date.now();
    }
    speed = newSpeed;
  }

  function reset() {
    simEpoch = Date.now();
    simOffset = 0;
    speed = DEFAULT_SPEED;
    tick();
  }

  function getState() {
    return {
      simNow: getSimNow(),
      speed,
      running,
    };
  }

  function destroy() {
    stop();
  }

  return {
    start,
    stop,
    setSpeed,
    reset,
    getSimNow,
    getState,
    destroy,
  };
}
