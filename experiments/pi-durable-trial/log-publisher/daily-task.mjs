import { spawn } from "node:child_process";
import { appendFileSync } from "node:fs";
import { defineTask } from "@earendil-works/pi-durable";

export const publicationTask = defineTask({
  name: "local.logfile-publication",
  version: 1,
  initial: () => ({ phase: "admit", attempts: 0 }),
  phases: {
    retry: async (task, runtime, context) => {
      await runtime.sleep(task.state.checkpoint.until, context);
      await runtime.commit(
        () => ({
          status: "running",
          checkpoint: {
            phase: "admit",
            attempts: task.state.checkpoint.attempts,
          },
        }),
        context,
      );
    },
    admit: async (task, runtime, context) => {
      await runtime.commit(
        () => ({
          status: "running",
          checkpoint: {
            phase: "publish",
            attempts: task.state.checkpoint.attempts + 1,
          },
        }),
        context,
      );
    },
    publish: async (task, runtime, context) => {
      const input = task.input;
      const attempts = task.state.checkpoint.attempts;
      const fail = async (message, kind) =>
        runtime.commit(
          () => ({
            status: "terminal",
            outcome: { status: "failed", error: { message, kind, attempts } },
          }),
          context,
        );
      if (Date.now() >= input.deadline)
        return fail(
          "Original daily-run deadline expired; use --retry.",
          "timeout",
        );
      if (attempts > 3)
        return fail(
          "Three publisher attempts exhausted; use --retry.",
          "blocked",
        );
      const args = [
        input.publisher,
        "--vault",
        input.vault,
        "--deadline",
        String(input.deadline),
        ...(input.retry ? ["--retry"] : []),
      ];
      const stdio = ["ignore", "pipe", "pipe"];
      const env = { ...process.env };
      if (env.CALLUM_LOG_LOCK_FD) {
        stdio.push(Number(env.CALLUM_LOG_LOCK_FD));
        env.CALLUM_LOG_LOCK_FD = "3";
      }
      let output = "";
      const child = spawn(input.bun, args, {
        cwd: input.workspace,
        stdio,
        env,
        detached: true,
      });
      const stop = () => {
        try {
          process.kill(-child.pid, "SIGKILL");
        } catch (error) {
          if (error.code !== "ESRCH") throw error;
        }
      };
      let timedOut = false;
      const timer = setTimeout(
        () => {
          timedOut = true;
          stop();
        },
        Math.max(1, input.deadline - Date.now()),
      );
      const signal = () => {
        stop();
        process.exitCode = 130;
      };
      process.once("SIGINT", signal);
      process.once("SIGTERM", signal);
      let exit;
      try {
        for (const stream of [child.stdout, child.stderr])
          stream.on("data", (bytes) => {
            appendFileSync(input.log, bytes);
            output = (output + bytes.toString()).slice(-65536);
          });
        exit = await new Promise((resolve) => {
          child.once("error", (error) => resolve({ error: error.message }));
          child.once("close", (code, signal) => resolve({ code, signal }));
        });
      } finally {
        clearTimeout(timer);
        process.removeListener("SIGINT", signal);
        process.removeListener("SIGTERM", signal);
      }
      const last = output
        .trim()
        .split("\n")
        .reverse()
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .find((value) => value?.status);
      if (!timedOut && exit.code === 0 && last?.status === "completed") {
        await runtime.commit(
          () => ({
            status: "terminal",
            outcome: { status: "completed", result: { ...last, attempts } },
          }),
          context,
        );
      } else {
        const kind = timedOut ? "timeout" : (last?.kind ?? "blocked");
        const message =
          last?.message ??
          exit.error ??
          `Publisher exited ${exit.code ?? exit.signal}. See ${input.log}`;
        if (
          kind === "transient" &&
          attempts < 3 &&
          Date.now() + 1000 < input.deadline
        ) {
          await runtime.commit(
            () => ({
              status: "running",
              checkpoint: {
                phase: "retry",
                attempts,
                until: Date.now() + 1000,
              },
            }),
            context,
          );
        } else await fail(message, kind);
      }
    },
  },
  abort: async (_task, runtime, context) =>
    runtime.commit(
      () => ({ status: "terminal", outcome: { status: "aborted" } }),
      context,
    ),
});
