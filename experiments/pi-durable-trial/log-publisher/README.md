# LOGFILE publication through Pi Durable

> Historical pilot source and reports. Archiving this directory does not run the
> publisher or resume a heartbeat. `DAILY.md` records the later on-demand boundary;
> every real publication still needs its own task authority.

For the normal local command, recovery rules and daily-use handoff, see
[DAILY.md](DAILY.md). The following preserves the original one-off experiment.

A one-off local experiment around the existing `scripts/publish-logfile.mjs` in the designated website publisher checkout. Pi Durable 1.3.0 comes from the parent experiment’s pinned installation. No model, service or schedule is added. The existing heartbeat stays unchanged.

`node log-publisher/trial.mjs` from the parent experiment admits one task, starts the unchanged real publisher, then kills the observed task tree after the real Git push succeeds but before that command returns to the publisher. A replacement opens the same SQLite/task identity, reconciles the real remote commit, source and snapshot, and reruns the original publisher’s unchanged-input path to perform its deployment/live verification. Terminal reopening must schedule no publisher.

The transparent Git shim invokes the actual Git binary. Before commit it saves the full staged patch and waits for a matching `reviewed.json` digest, allowing the coding agent to inspect the exact authorised public change. After push it saves the external effect receipt and stops itself solely for the controlled interruption. The controller kills only its observed descendants using the parent experiment’s process-identity helpers. It supplies no post-crash repair or publisher implementation.

All run data is under the parent ignored `runs/logfile-*` folder. The run retains original publisher bytes, input/output snapshots, original/final LOGFILE, actual task records, transcripts, Git events, external reconciliation, process cleanup and proof. Public-log publication uses the existing authorised route; wrapper code remains local. The original absolute twenty-minute budget survives restart. The proof checks exactly one new content commit and successful push, one ID per newly authored top-level node, preserved source prose and existing IDs, unchanged heartbeat and publisher, a clean checkout and unchanged terminal reopening.

This covers interruption after a successful push and before the durable task records completion. It does not establish recovery at every import/staging/process-start boundary, after reboot, with concurrent writers, or automatic scheduled operation. An existing heartbeat already has a scheduler; this experiment does not replace it.
