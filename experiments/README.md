# Preserved experiment history

These directories preserve local experiment source and reports. Keeping them in
Git does not install, register, schedule, or reactivate any experiment.

- [Learning corpus](learning-corpus/README.md): manual source-grounded capture
  tools plus inert compatibility endpoints for the continuous learning runtime
  retired on 21 October 2026. Its replacement five-day trial ended on 27 October.
- [Pi Durable recovery trials](pi-durable-trial/README.md): bounded coding and
  process-recovery experiments, including a historical LOGFILE publisher pilot.
  Commands here can make real coding or publication calls; run them only under
  a new task with authority for those effects.

The installed `capture-learning` skill still references the manual helper at
`learning-corpus/learning_corpus.py`; preserve that path. This does not authorize
background capture, automatic context injection, a checker, or a new schedule.

Reports describe observations at their recorded dates. Raw runs, transcripts,
SQLite state and external screenshots remain local or with their named owners;
this source archive is not a self-contained replay or a current operational
status report. The compressed learning-runtime archive contains historical
source and tests, not an approved installer. Generated Python caches and Pi
run/dependency directories stay outside Git.
