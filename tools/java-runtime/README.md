# Local Java execution service (not yet verified)

This optional Judge0 service is separate from Iwons' static, browser-only application. No application database or backend is introduced. Do not enable Java or generate Foundations content until the live browser probes pass.

The current machine has insufficient system-drive space. The attempted image download was stopped, its Redis/PostgreSQL images removed, its 40 build-cache records removed, and the five identified interrupted-pull/build leases released. Containerd cleanup plus filesystem trim recovered 6.5 GiB inside Docker. Windows still retains unused space in `docker_data.vhdx`; compacting it requires an Administrator session. The coding session is not elevated. Docker Desktop was stopped after cleanup. The existing `welcome-to-docker` image/container was preserved.

To reclaim the unused virtual-disk allocation, quit Docker Desktop and run `tools/java-runtime/compact-docker-disk.ps1` from an elevated PowerShell. The script uses Microsoft's read-only attachment and compaction commands; it does not delete the disk or its contents. It has not been executed in this session because Administrator privileges are unavailable. See [Microsoft's compact vdisk documentation](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/compact-vdisk).

The setup script now refuses to download images unless at least 20 GiB is available on the default Docker Desktop system drive. Free sufficient space before retrying. The image build, service startup, CORS restrictions and sandbox behavior are **unverified**, not ready for production.

```powershell
node scripts/setup-java-runtime.mjs
$env:IWONS_JUDGE_URL = 'http://127.0.0.1:2358'
node scripts/check-foundations-java.mjs
```

Judge0's published 1.13.1 image uses cgroup v1; this Docker Desktop engine uses v2. The prepared Dockerfile builds upstream Isolate 2.2.1 over the official image, removes the obsolete cgroup timing flags and delegates only an empty `iwons-judge0` subtree. It does not disable sandboxing or change the host's cgroup mode. A legacy-header quota syscall adjustment follows the [maintainer-authored compatibility patch](https://github.com/mrkushalsm/judge0/blob/master/patches/isolate-cgroup-v2.patch). This preparation still needs real compilation and sandbox tests.

The service binds only `127.0.0.1:2358`. Its generated credentials stay in ignored `artifacts/judge0-local/judge0.conf`; rerunning setup preserves them. Iwons sends source only to an explicitly configured endpoint. No endpoint has been enabled in the app's settings. File exercises remain unsupported until separately verified.

References: [Judge0 1.13.1 setup](https://github.com/judge0/judge0/releases/tag/v1.13.1), [Judge0's cgroup v2 issue](https://github.com/judge0/judge0/issues/543), [upstream Isolate 2.2.1](https://github.com/ioi/isolate/tree/v2.2.1). Judge0 and Isolate retain their upstream licenses.
