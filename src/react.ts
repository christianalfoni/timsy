import * as React from "react";
import {
  PickStateCreators,
  PickTransitions,
  StateMachine,
  Subscriber,
  TTransition,
  createStates,
} from "./core";

export const useSubscribe = <
  T extends StateMachine<any, any>,
  State extends PickStateCreators<T>,
  Transitions extends PickTransitions<T>
>(
  machine: T,
  cb: Subscriber<State, Transitions>,
  deps: any[] = []
) => {
  React.useEffect(
    // @ts-ignore
    () => machine.subscribe(cb),
    deps.concat(machine)
  );
};

export const useEnter = <
  T extends StateMachine<any, any>,
  State extends PickStateCreators<T>,
  SS extends keyof State | keyof State[]
>(
  machine: T,
  state: SS,
  cb: (
    current: SS extends string[]
      ? ReturnType<State[SS[number]]>
      : SS extends string
      ? ReturnType<State[SS]>
      : never
  ) => void | (() => void),
  deps: any[] = []
) => {
  React.useEffect(
    // @ts-ignore
    () => machine.onEnter(state, cb),
    deps.concat(machine)
  );
};

export const useTransition = <
  T extends StateMachine<any, any>,
  State extends PickStateCreators<T>,
  Transitions extends PickTransitions<T>,
  SS extends TTransition<Transitions> | TTransition<Transitions>[]
>(
  machine: T,
  current: SS,
  cb: SS extends
    | `${infer S} => ${infer A} => ${infer C}`
    | `${infer S} => ${infer A} => ${infer C}`[]
    ? (
        prev: ReturnType<State[S]>,
        eventParams: Parameters<Transitions[C][A]>,
        current: ReturnType<State[C]>
      ) => void | (() => void)
    : never,
  deps: any[] = []
) => {
  React.useEffect(
    // @ts-ignore
    () => machine.onTransition(current, cb),
    deps.concat(machine)
  );
};

export function useMachine<T extends StateMachine<any, any>>(
  passedMachine: T | (() => T),
  deps?: unknown[]
): [state: ReturnType<T["getState"]>, events: T["events"], machine: T] {
  let machine: T;

  if (typeof passedMachine === "function") {
    machine = React.useMemo(() => passedMachine(), deps || []);
  } else {
    machine = passedMachine;
  }

  const state = React.useSyncExternalStore(machine.subscribe, machine.getState);

  return React.useMemo(
    () => [state, machine.events, machine],
    [state, machine]
  );
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
  const [state, events, machine] = useMachine(
    () =>
      createPromiseMachine<T>()({
        state: "IDLE",
      }),
    deps
  );

  useEnter(machine, "PENDING", ({ params }) => {
    cb(...params)
      .then(machine.events.resolve)
      .catch(machine.events.reject);
  });

  return [state, events.execute, machine] as const;
};
