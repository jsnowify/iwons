"use client";
import { useAccount } from "./account-provider";
import { AuthLink } from "./auth-link";
import { AvatarEditor } from "./avatar-editor";
import { AccountAvatar } from "./account-avatar";
import { RecoveryPanel } from "./recovery-panel";
import { ExportDataPanel } from "./export-data-panel";
import { DeleteAccountPanel } from "./delete-account-panel";
import { LevelBadges } from "./level-badges";
import { ProfileEditor } from "./profile-editor";
import { ProfileStats, type CatalogLevel } from "./profile-stats";
import { Heatmap } from "./heatmap";

export function AccountProfile({ catalog }: { catalog: CatalogLevel[] }) {
  const account = useAccount();
  return <div className="content profile-content">
    <h1 className="profile-title">Your profile<span className="accent">.</span></h1>
    {!account.ready ? <p role="status">Loading your profile…</p> : <div className="profile-grid">
      <aside className="profile-side">
        <section className="card profile-identity" aria-label="Account">
          {account.user ? <>
            <AccountAvatar initial={account.user.avatar} url={account.user.avatarUrl} className="profile-avatar" />
            <div className="profile-names"><strong>{account.user.name}</strong><span className="muted">@{account.user.handle}</span></div>
          </> : <>
            <p><strong>Guest</strong></p>
            <p className="muted">Sign in to keep your progress across devices. Your stats below are saved on this device.</p>
            <AuthLink />
          </>}
        </section>
        <ProfileStats catalog={catalog} />
      </aside>
      <div className="profile-main">
        <section className="card" aria-labelledby="activity-heading">
          <div className="card-heading"><h2 id="activity-heading">Activity</h2><span className="muted">Accepted submissions</span></div>
          <Heatmap />
        </section>
        <LevelBadges />
      </div>
    </div>}
    {account.ready && account.user && account.credentialAccount ? <section className="profile-settings" aria-labelledby="settings-heading">
      <h2 id="settings-heading">Account settings</h2>
      <div className="settings-cards">
        <div className="card"><ProfileEditor key={`${account.user.handle}:${account.user.name}`} /></div>
        <div className="card"><AvatarEditor /></div>
        <div className="card"><RecoveryPanel /></div>
        <div className="card"><ExportDataPanel /></div>
        <div className="card"><DeleteAccountPanel /></div>
      </div>
    </section> : null}
  </div>;
}
