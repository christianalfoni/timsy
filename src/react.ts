import * as React from "react";
import { PickState, StateMachine, createStates } from "./core";

export function useMachine<T extends StateMachine<any, any>>(
  constructMachine: () => T,
  deps?: unknown[]
): [ReturnType<T["getState"]>, T["events"], T["subscribe"]];
export function useMachine<T extends StateMachine<any, any>>(
  passedMachine: T
): [ReturnType<T["getState"]>, T["events"], T["subscribe"]];
export function useMachine<T extends StateMachine<any, any>>(
  passedMachine: T | (() => T),
  deps?: unknown[]
) {
  let machine: T;

  if (typeof passedMachine === "function") {
    machine = React.useMemo(() => passedMachine(), deps || []);
  } else {
    machine = passedMachine;
  }

  const useSubscribe = React.useMemo(
    () =>
      (...params: any[]) => {
        // @ts-ignore
        React.useEffect(() => machine.subscribe(...params), [machine]);
      },
    [machine]
  );

  return [
    React.useSyncExternalStore(machine.subscribe, machine.getState),
    machine.events,
    useSubscribe,
  ] as any;
}

type PromiseCallback = (...params: any[]) => Promise<any>;

let cachedMachine: any;

function createPromiseMachine<T extends PromiseCallback>() {
  function createMachine() {
    const [states, createMachine] = createStates({
      IDLE: () => ({}),
      PENDING: (params: Parameters<T>) => ({ params }),
      RESOLVED: (value: Awaited<ReturnType<T>>) => ({ value }),
      REJECTED: (error: unknown) => ({ error }),
    });

    return createMachine({
      IDLE: {
        execute:
          (...params: Parameters<T>) =>
          () =>
            states.PENDING(params),
      },
      PENDING: {
        resolve: (value: Awaited<ReturnType<T>>) => () =>
          states.RESOLVED(value),
        reject: (error: unknown) => () => states.REJECTED(error),
      },
      RESOLVED: {
        execute:
          (...params: Parameters<T>) =>
          () =>
            states.PENDING(params),
      },
      REJECTED: {
        execute:
          (...params: Parameters<T>) =>
          () =>
            states.PENDING(params),
      },
    });
  }

  return (
    cachedMachine ? cachedMachine : (cachedMachine = createMachine())
  ) as ReturnType<typeof createMachine>;
}

export const usePromise = <T extends PromiseCallback>(
  cb: T,
  deps: unknown[] = []
) => {
  const [state, events, useSubscribe] = useMachine(
    () =>
      createPromiseMachine<T>()({
        state: "IDLE",
      }),
    deps
  );

  useSubscribe("PENDING", ({ params }) => {
    cb(...params)
      .then(events.resolve)
      .catch(events.reject);
  });

  return [state, events.execute, useSubscribe] as const;
};
