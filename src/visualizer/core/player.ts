/**
 * Iwons Algorithm Visualizer - Player State Machine
 *
 * Deterministic player state machine managing playback, stepping,
 * scrubbing, speed controls, and frame capping.
 * Pure logic: no DOM, no side-effects, fully testable with oracles.
 */

import { Step, MAX_FRAMES_CAP } from './types';

export type PlayerStatus = 'idle' | 'playing' | 'paused' | 'completed';

export interface PlayerState {
  steps: Step[];
  stepIndex: number;
  status: PlayerStatus;
  speedMs: number;
  soundEnabled: boolean;
  predictMode: boolean;
  isCapped: boolean;
  totalFrames: number;
}

export type PlayerAction =
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'STEP_FORWARD' }
  | { type: 'STEP_BACK' }
  | { type: 'JUMP_TO'; index: number }
  | { type: 'RESET' }
  | { type: 'SET_SPEED'; speedMs: number }
  | { type: 'SET_SOUND'; enabled: boolean }
  | { type: 'SET_PREDICT'; enabled: boolean }
  | { type: 'SET_STEPS'; steps: Step[] };

export const DEFAULT_SPEEDS = [
  { label: '0.25x', ms: 1200 },
  { label: '0.5x', ms: 600 },
  { label: '1x', ms: 300 },
  { label: '2x', ms: 150 },
  { label: '4x', ms: 75 },
] as const;

export const DEFAULT_SPEED_MS = 300;

export function clamp(val: number, min: number, max: number): number {
  if (min > max) return min;
  return Math.max(min, Math.min(max, val));
}

/**
 * Enforces frame budget cap to protect user browser memory and render performance.
 */
export function capFrames(steps: Step[], cap: number = MAX_FRAMES_CAP): { cappedSteps: Step[]; isCapped: boolean } {
  if (steps.length <= cap) {
    return { cappedSteps: steps, isCapped: false };
  }
  // If steps exceed cap, sample deterministically while always preserving first and last steps
  const cappedSteps: Step[] = [steps[0]];
  const stepSize = (steps.length - 1) / (cap - 1);
  for (let i = 1; i < cap - 1; i++) {
    const originalIndex = Math.round(i * stepSize);
    cappedSteps.push(steps[originalIndex]);
  }
  cappedSteps.push(steps[steps.length - 1]);
  return { cappedSteps, isCapped: true };
}

export function createInitialPlayerState(
  initialSteps: Step[] = [],
  options?: { speedMs?: number; soundEnabled?: boolean; predictMode?: boolean }
): PlayerState {
  const { cappedSteps, isCapped } = capFrames(initialSteps);
  return {
    steps: cappedSteps,
    stepIndex: 0,
    status: 'idle',
    speedMs: options?.speedMs ?? DEFAULT_SPEED_MS,
    soundEnabled: options?.soundEnabled ?? false,
    predictMode: options?.predictMode ?? false,
    isCapped,
    totalFrames: cappedSteps.length,
  };
}

export function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  const maxIdx = Math.max(0, state.steps.length - 1);

  switch (action.type) {
    case 'PLAY': {
      if (state.steps.length <= 1) return { ...state, status: 'completed' };
      // If at end, wrap around to beginning on play
      const nextIndex = state.stepIndex >= maxIdx ? 0 : state.stepIndex;
      return {
        ...state,
        stepIndex: nextIndex,
        status: 'playing',
      };
    }

    case 'PAUSE': {
      return {
        ...state,
        status: state.status === 'playing' ? 'paused' : state.status,
      };
    }

    case 'TOGGLE_PLAY': {
      if (state.status === 'playing') {
        return { ...state, status: 'paused' };
      }
      const nextIndex = state.stepIndex >= maxIdx ? 0 : state.stepIndex;
      return {
        ...state,
        stepIndex: nextIndex,
        status: 'playing',
      };
    }

    case 'STEP_FORWARD': {
      if (state.stepIndex >= maxIdx) {
        return { ...state, status: 'completed' };
      }
      const next = state.stepIndex + 1;
      return {
        ...state,
        stepIndex: next,
        status: next >= maxIdx ? 'completed' : 'paused',
      };
    }

    case 'STEP_BACK': {
      if (state.stepIndex <= 0) {
        return { ...state, status: 'paused' };
      }
      return {
        ...state,
        stepIndex: state.stepIndex - 1,
        status: 'paused',
      };
    }

    case 'JUMP_TO': {
      const target = clamp(Math.round(action.index), 0, maxIdx);
      const isComplete = target >= maxIdx && maxIdx > 0;
      return {
        ...state,
        stepIndex: target,
        status: isComplete ? 'completed' : 'paused',
      };
    }

    case 'RESET': {
      return {
        ...state,
        stepIndex: 0,
        status: 'idle',
      };
    }

    case 'SET_SPEED': {
      const validSpeed = Math.max(20, Math.min(5000, action.speedMs));
      return {
        ...state,
        speedMs: validSpeed,
      };
    }

    case 'SET_SOUND': {
      return {
        ...state,
        soundEnabled: action.enabled,
      };
    }

    case 'SET_PREDICT': {
      return {
        ...state,
        predictMode: action.enabled,
        status: action.enabled && state.status === 'playing' ? 'paused' : state.status,
      };
    }

    case 'SET_STEPS': {
      const { cappedSteps, isCapped } = capFrames(action.steps);
      return {
        ...state,
        steps: cappedSteps,
        stepIndex: 0,
        status: 'idle',
        isCapped,
        totalFrames: cappedSteps.length,
      };
    }

    default:
      return state;
  }
}

