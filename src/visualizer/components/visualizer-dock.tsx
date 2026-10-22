"use client";

import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Shuffle,
  SlidersHorizontal,
} from 'lucide-react';
import { AlgoPreset, InputKind } from '../core/types';
import { DEFAULT_SPEEDS } from '../core/player';

interface VisualizerDockProps {
  stepIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  speedMs: number;
  soundEnabled: boolean;
  predictMode: boolean;
  isReducedMotion: boolean;
  presets: AlgoPreset[];
  activePresetName: string;
  inputKind: InputKind;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBack: () => void;
  onJumpTo: (index: number) => void;
  onReset: () => void;
  onSpeedChange: (speedMs: number) => void;
  onSoundToggle: () => void;
  onPredictToggle: (enabled: boolean) => void;
  onSelectPreset: (preset: AlgoPreset) => void;
  onRandomize: () => void;
  onApplyCustomInput: (rawInput: string) => void;
}

export function VisualizerDock({
  stepIndex,
  totalSteps,
  isPlaying,
  speedMs,
  soundEnabled,
  predictMode,
  isReducedMotion,
  presets,
  activePresetName,
  inputKind,
  onPlay,
  onPause,
  onStepForward,
  onStepBack,
  onJumpTo,
  onReset,
  onSpeedChange,
  onSoundToggle,
  onPredictToggle,
  onSelectPreset,
  onRandomize,
  onApplyCustomInput,
}: VisualizerDockProps) {
  const [showInputSheet, setShowInputSheet] = useState(false);
  const [customText, setCustomText] = useState('');
  const maxIndex = Math.max(0, totalSteps - 1);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customText.trim()) {
      onApplyCustomInput(customText.trim());
      setShowInputSheet(false);
    }
  };

  return (
    <div className="visualizer-control-dock" role="toolbar" aria-label="Playback controls and timeline">
      {/* Primary Row: Playback, Stepping, Scrubber, Speed & Sound */}
      <div className="dock-primary-row">
        <div className="playback-group">
          <button
            type="button"
            className="dock-btn secondary"
            onClick={onReset}
            title="Reset to beginning (R)"
            aria-label="Reset animation"
          >
            <RotateCcw size={16} aria-hidden="true" />
          </button>

          <button
            type="button"
            className="dock-btn secondary"
            onClick={onStepBack}
            disabled={stepIndex <= 0}
            title="Step back (Left Arrow)"
            aria-label="Step back"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>

          <button
            type="button"
            className={`dock-btn play-btn ${isPlaying ? 'active' : 'primary'}`}
            onClick={isPlaying ? onPause : onPlay}
            disabled={isReducedMotion}
            title={isReducedMotion ? 'Autoplay disabled under reduced motion' : 'Play or Pause (Space)'}
            aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
          >
            {isPlaying ? (
              <>
                <Pause size={18} aria-hidden="true" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play size={18} aria-hidden="true" />
                <span>Play</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="dock-btn secondary"
            onClick={onStepForward}
            disabled={stepIndex >= maxIndex}
            title="Step forward (Right Arrow)"
            aria-label="Step forward"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Timeline Scrubber */}
        <div className="scrubber-group">
          <label htmlFor="timeline-scrubber" className="visually-hidden">
            Timeline step scrubber
          </label>
          <input
            id="timeline-scrubber"
            type="range"
            min={0}
            max={maxIndex}
            value={stepIndex}
            onChange={e => onJumpTo(Number(e.target.value))}
            className="timeline-slider"
            aria-valuemin={0}
            aria-valuemax={maxIndex}
            aria-valuenow={stepIndex}
            aria-valuetext={`Step ${stepIndex + 1} of ${totalSteps}`}
          />
          <div className="scrubber-counter">
            <span className="current-step">{stepIndex + 1}</span>
            <span className="step-slash">/</span>
            <span className="total-step">{totalSteps}</span>
          </div>
        </div>

        {/* Speed Selector */}
        <div className="dock-option-group speed-group">
          <label htmlFor="dock-speed-select">Speed</label>
          <select
            id="dock-speed-select"
            value={speedMs}
            onChange={e => onSpeedChange(Number(e.target.value))}
            className="dock-select"
          >
            {DEFAULT_SPEEDS.map(s => (
              <option key={s.ms} value={s.ms}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sound Toggle */}
        <button
          type="button"
          className="dock-btn secondary sound-btn"
          onClick={onSoundToggle}
          title={soundEnabled ? 'Mute step audio' : 'Enable synthesized step audio'}
          aria-pressed={soundEnabled}
          aria-label={soundEnabled ? 'Mute audio' : 'Enable audio'}
        >
          {soundEnabled ? <Volume2 size={18} aria-hidden="true" /> : <VolumeX size={18} aria-hidden="true" />}
          <span className="sound-text">{soundEnabled ? 'Sound' : 'Muted'}</span>
        </button>

        {/* Mobile Input Toggle Button */}
        <button
          type="button"
          className="dock-btn secondary mobile-input-toggle"
          onClick={() => setShowInputSheet(s => !s)}
          aria-expanded={showInputSheet}
          aria-label="Toggle input panel"
        >
          <SlidersHorizontal size={16} aria-hidden="true" />
          <span>Input</span>
        </button>
      </div>

      {/* Secondary Row: Presets, Randomize, Custom Input, Predict Mode */}
      <div className={`dock-input-row ${showInputSheet ? 'expanded' : ''}`}>
        {/* Presets Select */}
        {presets.length > 0 && (
          <div className="dock-option-group preset-group">
            <label htmlFor="preset-select">Preset</label>
            <select
              id="preset-select"
              value={activePresetName}
              onChange={e => {
                const selected = presets.find(p => p.name === e.target.value);
                if (selected) onSelectPreset(selected);
              }}
              className="dock-select"
            >
              {presets.map(p => (
                <option key={p.name} value={p.name}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Randomize Button for numeric/array/tree algorithms */}
        {(inputKind === 'numbers' || inputKind === 'target-and-numbers' || inputKind === 'tree') && (
          <button
            type="button"
            className="dock-btn secondary randomize-btn"
            onClick={onRandomize}
            title="Generate reproducible random test input"
          >
            <Shuffle size={14} aria-hidden="true" />
            <span>Randomize</span>
          </button>
        )}

        {/* Custom Input Form */}
        <form onSubmit={handleCustomSubmit} className="dock-custom-form">
          <label htmlFor="custom-input-field" className="dock-field-label">
            Custom input
          </label>
          <input
            id="custom-input-field"
            type="text"
            value={customText}
            onChange={e => setCustomText(e.target.value)}
            placeholder={
              inputKind === 'target-and-numbers'
                ? 'Target | 10, 20, 30...'
                : inputKind === 'numbers' || inputKind === 'tree'
                ? 'e.g. 45, 12, 85, 32...'
                : inputKind === 'pattern-match'
                ? 'Text | Pattern'
                : 'Enter custom data...'
            }
            className="dock-custom-input"
          />
          <button type="submit" className="dock-btn secondary apply-btn" disabled={!customText.trim()}>
            Apply
          </button>
        </form>

        {/* Predict Mode Toggle */}
        <label className="predict-toggle-label">
          <input
            type="checkbox"
            role="switch"
            aria-label="Predict step"
            checked={predictMode}
            onChange={e => onPredictToggle(e.target.checked)}
          />
          <span>Predict step</span>
          <span className="predict-state" aria-hidden="true">{predictMode ? 'On' : 'Off'}</span>
        </label>
      </div>
    </div>
  );
}
