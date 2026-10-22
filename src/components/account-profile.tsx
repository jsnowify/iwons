"use client";
import { useAccount } from "./account-provider";
import { AuthLink } from "./auth-link";
import { AvatarEditor } from "./avatar-editor";
import { AccountAvatar } from "./account-avatar";
import { RecoveryPanel } from "./recovery-panel";
export function AccountProfile() {
  const account = useAccount();
  return <div className="content auth-content"><section className="card auth-card">
    <h1>Your profile<span className="accent">.</span></h1>
    {!account.ready ? <p role="status">Loading your profile…</p> : account.user ? <>
      {!account.credentialAccount ? <AccountAvatar initial={account.user.avatar} url={account.user.avatarUrl} /> : null}
      <dl className="auth-profile-details"><dt>Username</dt><dd>@{account.user.handle}</dd><dt>Display name</dt><dd>{account.user.name}</dd></dl>
      {account.credentialAccount ? <><AvatarEditor /><RecoveryPanel /></> : null}
    </> : <><p>Sign in to see your profile. You can keep practising as a guest.</p><AuthLink /></>}
  </section></div>;
}
