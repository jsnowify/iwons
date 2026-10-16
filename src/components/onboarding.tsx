"use client";
import { useState } from "react";
import { ArrowRight, ShieldCheck, Code2, UserRound, Check } from "lucide-react";
import { useStore } from "@/store/use-store";
import { languageNames } from "@/lib/presentation";
import type { Language } from "@/lib/types";
import { Modal, Button, useToast } from "./ui";
export function Onboarding({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const store = useStore(),
    toast = useToast();
  const [step, setStep] = useState(0),
    [name, setName] = useState(
      store.profile.name === "Coder" ? "" : store.profile.name,
    ),
    [language, setLanguage] = useState<Language>(store.settings.language),
    [consent, setConsent] = useState(false);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        [
          "Make this space yours.",
          "Pick your starting language.",
          "Your practice. Your promise.",
        ][step]
      }
    >
      <div className="eyebrow accent" style={{ marginBottom: 24 }}>
        STEP {step + 1} OF 3 · WELCOME TO IWONS
      </div>
      {step === 0 ? (
        <div className="stack">
          <UserRound size={28} className="accent" />
          <p>Small, consistent practice adds up. Let’s start with your name.</p>
          <label>
            What should we call you?
            <input
              maxLength={32}
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </label>
        </div>
      ) : step === 1 ? (
        <div className="stack">
          <Code2 size={28} className="accent" />
          <p>
            Every problem has a starter in all four languages. You can switch
            whenever you like.
          </p>
          <div className="option-row">
            {Object.entries(languageNames).map(([key, label]) => (
              <button
                key={key}
                className={`option-button ${language === key ? "active" : ""}`}
                onClick={() => setLanguage(key as Language)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="stack">
          <ShieldCheck size={28} className="accent" />
          <p>
            Iwons Watch records focus changes, time away, editor pastes, typing
            bursts, and fullscreen exits while you solve.
          </p>
          <div className="screen-note">
            It cannot see other tabs, websites, apps, your camera, or your
            screen. Watch data stays on this device. It is an honor system, not
            proof of independent work.
          </div>
          <label className="check-row">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>
              I understand what Iwons Watch records and agree to enable it for
              my practice.
            </span>
          </label>
        </div>
      )}
      <div className="modal-actions">
        {step > 0 ? (
          <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
        ) : null}
        <Button
          disabled={step === 0 ? !name.trim() : step === 2 ? !consent : false}
          onClick={() => {
            if (step < 2) setStep((s) => s + 1);
            else {
              store.updateProfile({
                name: name.trim(),
                avatar: name.trim().slice(0, 1).toUpperCase(),
                onboarded: true,
              });
              store.updateSettings({ language });
              toast("Your space is ready. Make the first solve yours.");
              onClose();
            }
          }}
        >
          {step === 2 ? "Let’s solve" : "Continue"}
          {step === 2 ? <Check size={14} /> : <ArrowRight size={14} />}
        </Button>
      </div>
    </Modal>
  );
}
