#!/bin/bash
set -euo pipefail
# Delegate only our own empty subtree; never relocate host processes or disable
# cgroup isolation to work around Docker Desktop's unified hierarchy.
sudo mkdir -p /sys/fs/cgroup/iwons-judge0 /run/isolate/locks
printf '+cpu +memory +pids\n' | sudo tee /sys/fs/cgroup/iwons-judge0/cgroup.subtree_control >/dev/null
exec /api/docker-entrypoint.sh "$@"
