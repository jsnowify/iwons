# Local execution service only; this is not an Iwons application backend.
FROM judge0/judge0:1.13.1
USER root
RUN git clone --depth 1 --branch v2.2.1 https://github.com/ioi/isolate.git /tmp/isolate \
    && cd /tmp/isolate \
    && sed -i 's/syscall(SYS_quotactl_fd, cwd_fd, quota_op, box_uid, dq_ptr)/quotactl(quota_op, ".", box_uid, dq_ptr)/' rules.c \
    && make isolate default.cf \
    && install -m 4755 isolate /usr/local/bin/isolate \
    && install -m 644 default.cf /usr/local/etc/isolate \
    && sed -i 's|auto:/run/isolate/cgroup|/sys/fs/cgroup/iwons-judge0|' /usr/local/etc/isolate \
    && sed -i 's/--no-cg-timing//g; s/--cg-timing//g' /api/app/jobs/isolate_job.rb \
    && rm -rf /tmp/isolate
COPY entrypoint.sh /usr/local/bin/iwons-java-entrypoint
RUN chmod 755 /usr/local/bin/iwons-java-entrypoint
USER judge0
ENTRYPOINT ["/usr/local/bin/iwons-java-entrypoint"]
CMD ["/api/scripts/server"]
