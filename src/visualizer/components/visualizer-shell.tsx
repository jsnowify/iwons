"use client";

import React, { useReducer, useEffect, useRef, useState, useCallback, useTransition } from 'react';
import { AlgoDefinition, AlgoPreset, Step } from '../core/types';
import {
  createInitialPlayerState,
  playerReducer,
  DEFAULT_SPEEDS,
} from '../core/player';
import {
  parseNumberList,
  parseTargetAndNumbers,
  parsePatternMatch,
  parseGraphEdges,
  parseGridInput,
  generateRandomNumbers,
} from '../core/inputs';
import { createVisualizerAudio } from '@/lib/visualizer-audio';
import { useStore } from '@/store/use-store';
import { VisualizerTopBar } from './visualizer-top-bar';
import { VisualizerStage } from './visualizer-stage';
import { VisualizerDock } from './visualizer-dock';
import { VisualizerSidePanel } from './visualizer-side-panel';

interface VisualizerShellProps {
  algorithm: AlgoDefinition<any>;
}

export function VisualizerShell({ algorithm }: VisualizerShellProps) {
  const motionSetting = useStore(state => state.settings.motion);
  const [systemReducedMotion, setSystemReducedMotion] = useState(false);
  const isReducedMotion = systemReducedMotion || !motionSetting;

  // Active preset tracking
  const [activePreset, setActivePreset] = useState<AlgoPreset>(algorithm.presets[0]);
  const [inputError, setInputError] = useState<string | null>(null);

  // Compute steps from generator
  const computeSteps = useCallback((input: any): Step[] => {
    try {
      return algorithm.generate(input);
    } catch (err) {
      console.error('[Visualizer Generator Error]', err);
      return [];
    }
  }, [algorithm]);

  const [state, dispatch] = useReducer(
    playerReducer,
    computeSteps(algorithm.presets[0]?.input),
    initialSteps => createInitialPlayerState(initialSteps, { speedMs: 300, soundEnabled: false })
  );

  // Sound audio context
  const audio = useRef<ReturnType<typeof createVisualizerAudio> | null>(null);
  const soundedIndex = useRef(state.stepIndex);

  // Reduced motion query listener
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setSystemReducedMotion(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  // Stop playback immediately if reduced motion is active
  useEffect(() => {
    if (isReducedMotion && state.status === 'playing') {
      dispatch({ type: 'PAUSE' });
    }
  }, [isReducedMotion, state.status]);

  // Audio synthesizer lifecycle
  const unlockAudio = useCallback(() => {
    if (state.soundEnabled) {
      audio.current ??= createVisualizerAudio();
      audio.current.unlock();
    }
  }, [state.soundEnabled]);

  useEffect(() => {
    return () => {
      audio.current?.close();
      audio.current = null;
    };
  }, []);

  // Audio tick on step change
  useEffect(() => {
    if (state.stepIndex !== soundedIndex.current && state.soundEnabled) {
      const isComplete = state.stepIndex >= state.steps.length - 1;
      const currentStep = state.steps[state.stepIndex];
      if (currentStep) {
        audio.current?.tick(
          {
            cells: [{ id: '0', value: String(state.stepIndex), highlighted: true }],
            message: currentStep.caption,
            state: '',
          },
          isComplete
        );
      }
    }
    soundedIndex.current = state.stepIndex;
  }, [state.stepIndex, state.soundEnabled, state.steps]);

  // Autoplay playback timer loop
  useEffect(() => {
    if (state.status !== 'playing' || isReducedMotion || state.stepIndex >= state.steps.length - 1) {
      return;
    }

    const timer = setTimeout(() => {
      dispatch({ type: 'STEP_FORWARD' });
    }, state.speedMs);

    return () => clearTimeout(timer);
  }, [state.status, state.stepIndex, state.steps.length, state.speedMs, isReducedMotion]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not capture keys while an input or textarea is focused
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          unlockAudio();
          dispatch({ type: 'TOGGLE_PLAY' });
          break;
        case 'ArrowLeft':
          e.preventDefault();
          unlockAudio();
          dispatch({ type: 'STEP_BACK' });
          break;
        case 'ArrowRight':
          e.preventDefault();
          unlockAudio();
          dispatch({ type: 'STEP_FORWARD' });
          break;
        case 'Home':
          e.preventDefault();
          dispatch({ type: 'JUMP_TO', index: 0 });
          break;
        case 'End':
          e.preventDefault();
          dispatch({ type: 'JUMP_TO', index: state.steps.length - 1 });
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          dispatch({ type: 'RESET' });
          break;
        case '[': {
          e.preventDefault();
          // Slower speed
          const currIdx = DEFAULT_SPEEDS.findIndex(s => s.ms === state.speedMs);
          if (currIdx > 0) dispatch({ type: 'SET_SPEED', speedMs: DEFAULT_SPEEDS[currIdx - 1].ms });
          break;
        }
        case ']': {
          e.preventDefault();
          // Faster speed
          const currIdx = DEFAULT_SPEEDS.findIndex(s => s.ms === state.speedMs);
          if (currIdx < DEFAULT_SPEEDS.length - 1) {
            dispatch({ type: 'SET_SPEED', speedMs: DEFAULT_SPEEDS[currIdx + 1].ms });
          }
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.steps.length, state.speedMs, unlockAudio]);

  // Preset Selection Handler
  const handleSelectPreset = (preset: AlgoPreset) => {
    setActivePreset(preset);
    setInputError(null);
    const newSteps = computeSteps(preset.input);
    dispatch({ type: 'SET_STEPS', steps: newSteps });
  };

  // Randomize Handler
  const handleRandomize = () => {
    setInputError(null);
    if (algorithm.inputKind === 'numbers' || algorithm.inputKind === 'tree') {
      const randomArr = generateRandomNumbers(7, 10, 95, Math.floor(Math.random() * 10000) + 1);
      const newSteps = computeSteps(randomArr);
      dispatch({ type: 'SET_STEPS', steps: newSteps });
    } else if (algorithm.inputKind === 'target-and-numbers') {
      const numbers = generateRandomNumbers(8, 10, 95, Math.floor(Math.random() * 10000) + 1).sort(
        (a, b) => a - b
      );
      const target = numbers[Math.floor(Math.random() * numbers.length)];
      const newSteps = computeSteps({ target, numbers });
      dispatch({ type: 'SET_STEPS', steps: newSteps });
    }
  };

  // Custom Input Submission Handler
  const handleApplyCustomInput = (rawText: string) => {
    setInputError(null);
    try {
      if (algorithm.inputKind === 'numbers' || algorithm.inputKind === 'tree') {
        const parsed = parseNumberList(rawText, 1, 15);
        if (!parsed.success || !parsed.value) {
          setInputError(parsed.error ?? 'Invalid numbers.');
          return;
        }
        dispatch({ type: 'SET_STEPS', steps: computeSteps(parsed.value) });
      } else if (algorithm.inputKind === 'target-and-numbers') {
        const parsed = parseTargetAndNumbers(rawText);
        if (!parsed.success || !parsed.value) {
          setInputError(parsed.error ?? 'Invalid target and numbers.');
          return;
        }
        dispatch({ type: 'SET_STEPS', steps: computeSteps(parsed.value) });
      } else if (algorithm.inputKind === 'pattern-match') {
        const parsed = parsePatternMatch(rawText);
        if (!parsed.success || !parsed.value) {
          setInputError(parsed.error ?? 'Invalid text and pattern.');
          return;
        }
        dispatch({ type: 'SET_STEPS', steps: computeSteps(parsed.value) });
      } else if (algorithm.inputKind === 'graph') {
        const parsed = parseGraphEdges(rawText);
        if (!parsed.success || !parsed.value) {
          setInputError(parsed.error ?? 'Invalid graph edge list.');
          return;
        }
        dispatch({ type: 'SET_STEPS', steps: computeSteps(parsed.value) });
      } else if (algorithm.inputKind === 'grid') {
        const parsed = parseGridInput(rawText);
        if (!parsed.success || !parsed.value) {
          setInputError(parsed.error ?? 'Invalid grid input.');
          return;
        }
        dispatch({ type: 'SET_STEPS', steps: computeSteps(parsed.value) });
      }
    } catch (err) {
      setInputError('Could not process input. Please check the format.');
    }
  };

  const currentStep = state.steps[state.stepIndex] || {
    engine: algorithm.engine,
    caption: 'Ready to begin.',
    line: 0,
  };

  return (
    <div className="visualizer-shell-layout" data-theme-surface="paper">
      {/* Top Bar Zone */}
      <VisualizerTopBar algorithm={algorithm} />

      {inputError && (
        <div className="visualizer-input-error-banner" role="alert">
          <span>{inputError}</span>
          <button type="button" onClick={() => setInputError(null)} aria-label="Dismiss error">
            ×
          </button>
        </div>
      )}

      {/* 3-Zone Desktop Grid / Mobile Stack */}
      <div className="visualizer-main-grid">
        {/* Left Zone: Stage Canvas & Control Dock (60-65% width) */}
        <div className="visualizer-stage-zone">
          <VisualizerStage
            step={currentStep}
            stepIndex={state.stepIndex}
            totalSteps={state.totalFrames}
            isCompleted={state.status === 'completed'}
            onReplay={() => {
              dispatch({ type: 'RESET' });
              dispatch({ type: 'PLAY' });
            }}
            predictMode={state.predictMode}
          />

          <VisualizerDock
            stepIndex={state.stepIndex}
            totalSteps={state.totalFrames}
            isPlaying={state.status === 'playing'}
            speedMs={state.speedMs}
            soundEnabled={state.soundEnabled}
            predictMode={state.predictMode}
            isReducedMotion={isReducedMotion}
            presets={algorithm.presets}
            activePresetName={activePreset?.name || ''}
            inputKind={algorithm.inputKind}
            onPlay={() => {
              unlockAudio();
              dispatch({ type: 'PLAY' });
            }}
            onPause={() => dispatch({ type: 'PAUSE' })}
            onStepForward={() => {
              unlockAudio();
              dispatch({ type: 'STEP_FORWARD' });
            }}
            onStepBack={() => {
              unlockAudio();
              dispatch({ type: 'STEP_BACK' });
            }}
            onJumpTo={idx => dispatch({ type: 'JUMP_TO', index: idx })}
            onReset={() => dispatch({ type: 'RESET' })}
            onSpeedChange={s => dispatch({ type: 'SET_SPEED', speedMs: s })}
            onSoundToggle={() => {
              const nextSound = !state.soundEnabled;
              if (nextSound) {
                audio.current ??= createVisualizerAudio();
                audio.current.unlock();
              }
              dispatch({ type: 'SET_SOUND', enabled: nextSound });
            }}
            onPredictToggle={enabled => dispatch({ type: 'SET_PREDICT', enabled })}
            onSelectPreset={handleSelectPreset}
            onRandomize={handleRandomize}
            onApplyCustomInput={handleApplyCustomInput}
          />
        </div>

        {/* Right Zone: Side Panel (35-40% width) */}
        <VisualizerSidePanel
          step={currentStep}
          stepIndex={state.stepIndex}
          totalSteps={state.totalFrames}
          pseudocode={algorithm.pseudocode}
          algorithm={algorithm}
        />
      </div>
    </div>
  );
}
