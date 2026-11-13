import type { Table } from "./holdem";
import type { AdvisorInput, AdvisorResult } from "./pokerAdvisor";

let worker: Worker | undefined;
let sequence = 0;
const jobs = new Map<
  number,
  { resolve: (value: unknown) => void; reject: (error: Error) => void }
>();
function compute<T>(request: object): Promise<T> {
  worker ??= new Worker(new URL("./poker.worker.ts", import.meta.url), {
    type: "module",
  });
  worker.onmessage = ({ data }) => {
    const job = jobs.get(data.id);
    if (!job) return;
    jobs.delete(data.id);
    if (data.error) job.reject(new Error(data.error));
    else job.resolve(data.result);
  };
  worker.onerror = () => {
    jobs.forEach((job) =>
      job.reject(
        new Error("The poker engine could not start. Reload and try again."),
      ),
    );
    jobs.clear();
    worker?.terminate();
    worker = undefined;
  };
  const id = ++sequence;
  return new Promise<T>((resolve, reject) => {
    jobs.set(id, { resolve: (value) => resolve(value as T), reject });
    worker!.postMessage({ ...request, id });
  });
}
export const calculateAdvisor = (input: AdvisorInput) =>
  compute<AdvisorResult>({ type: "advisor", input });
export const playOpponents = (table: Table) =>
  compute<Table>({ type: "table", table });
