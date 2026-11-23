import { parseArgs } from "node:util";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { mkdirSync, existsSync, readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { BACKGROUND_CONTEXT as context } from "@earendil-works/chord/context";
import { createModels } from "@earendil-works/pi-ai/models";
import {
  Harness,
  createRegistry,
  defineExtension,
} from "@earendil-works/pi-durable";
import { openNodeSqliteStorage } from "@earendil-works/pi-durable/storage/sqlite/node";
import { publicationTask } from "./daily-task.mjs";

const { values } = parseArgs({
  options: {
    workspace: { type: "string" },
    vault: { type: "string" },
    status: { type: "boolean" },
    retry: { type: "boolean" },
    "budget-ms": { type: "string" },
  },
});
const budget = Number(values["budget-ms"] ?? 1200000);
if (!Number.isInteger(budget) || budget < 1000 || budget > 1200000)
  throw new Error("Budget must be 1000..1200000 milliseconds.");
const workspace = resolve(
  values.workspace ??
    join(homedir(), "Repos/callumflack/worktrees/callum-website-log-publisher"),
);
const vault = resolve(
  values.vault ?? join(homedir(), "Repos/callumflack/kb-2026/kb-2026"),
);
const { ensurePublicationLock, publicationPaths } = await import(
  pathToFileURL(join(workspace, "scripts/publication-process.mjs"))
);
const { atomicJson } = await import(
  pathToFileURL(join(workspace, "scripts/publication-state.mjs"))
);
const state = join(publicationPaths(workspace).stateDir, "pi");
const pointer = join(state, "active.json");
let active = existsSync(pointer) ? JSON.parse(readFileSync(pointer)) : null;
if (values.status) {
  console.log(
    JSON.stringify(
      {
        runner: active,
        publisher: existsSync(
          join(publicationPaths(workspace).stateDir, "active.json"),
        )
          ? JSON.parse(
              readFileSync(
                join(publicationPaths(workspace).stateDir, "active.json"),
              ),
            )
          : null,
      },
      null,
      2,
    ),
  );
} else {
  ensurePublicationLock(workspace);
  mkdirSync(state, { recursive: true, mode: 0o700 });
  // Reload after taking the shared lock: another invocation may have completed.
  active = existsSync(pointer) ? JSON.parse(readFileSync(pointer)) : null;
  if (
    active &&
    (active.input.workspace !== workspace || active.input.vault !== vault)
  )
    throw new Error("Daily state target differs; preserve and inspect.");
  if (
    active?.outcome &&
    active.outcome.status !== "completed" &&
    !values.retry
  ) {
    console.error(
      JSON.stringify({
        status: "failed",
        ...active.outcome.error,
        message: `${active.outcome.error?.message ?? active.outcome.status} Inspect --status and publisher.log; use --retry after resolving the cause.`,
      }),
    );
    process.exitCode = 1;
  } else {
    if (!active || active.outcome || values.retry) {
      const id = randomUUID();
      const directory = join(state, id);
      mkdirSync(directory, { mode: 0o700 });
      active = {
        directory,
        input: {
          workspace,
          vault,
          publisher: join(workspace, "scripts/publish-logfile.mjs"),
          bun: "bun",
          deadline: Date.now() + budget,
          retry: Boolean(values.retry),
          log: join(directory, "publisher.log"),
        },
      };
      atomicJson(pointer, active);
    }
    if ((active.opens ?? 0) >= 3) {
      active.blocked = {
        kind: "blocked",
        message:
          "Three worker openings exhausted; inspect --status, then use --retry.",
      };
      atomicJson(pointer, active);
      console.error(JSON.stringify({ status: "failed", ...active.blocked }));
      process.exit(1);
    }
    active.opens = (active.opens ?? 0) + 1;
    atomicJson(pointer, active);
    const registry = createRegistry();
    registry.install(
      defineExtension({ name: "local-logfile", tasks: [publicationTask] }),
    );
    const harness = await Harness.open(
      await openNodeSqliteStorage(join(active.directory, "state.sqlite")),
      { models: createModels(), registry },
      context,
    );
    try {
      if (!active.task) {
        // SQLite creation and the pointer are separate writes. Recover a task
        // created before a crash instead of admitting a duplicate.
        const inspection = await harness.inspect(context);
        if (inspection.tasks.length > 1)
          throw new Error("Unexpected tasks in daily-run database.");
        active.task = inspection.tasks[0]?.record.id;
        if (!active.task) {
          const root = await harness.root(context);
          active.task = await root.commit(
            (tx) =>
              tx.createTask(publicationTask, active.input, {
                ownership: { kind: "conversation" },
              }),
            context,
          );
        }
        atomicJson(pointer, active);
      }
      const inspected = (await harness.inspect(context)).tasks.find(
        (task) => task.record.id === active.task,
      );
      if (inspected?.state.kind === "blocked")
        throw new Error(
          `Pi task blocked: ${inspected.state.reason}; inspect state before --retry.`,
        );
      harness.resume();
      const record = await harness.waitForTask(active.task, context);
      active.outcome = record.state.outcome;
      atomicJson(join(active.directory, "result.json"), active);
      atomicJson(pointer, active);
      console.log(
        JSON.stringify({
          task: active.task,
          run: active.directory,
          ...active.outcome,
        }),
      );
      if (active.outcome.status !== "completed") process.exitCode = 1;
      await harness.waitForIdle(context);
    } finally {
      await harness.close(context);
    }
  }
}
