import * as React from "react";
import { StateMachine } from "./core";

export function useMachine<T extends StateMachine<any, any>>(
  constructMachine: () => T,
  deps: unknown[]
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
    machine = React.useMemo(() => passedMachine(), deps);
  } else {
    machine = passedMachine;
  }

  const useSubscribe = React.useMemo(
    () =>
      (...params: any[]) => {
        // Support for React 18
        const subscriptionRef = React.useRef<{
          dispose: () => void;
          machine: T;
        } | null>(null);

        React.useEffect(() => {
          if (
            !subscriptionRef.current ||
            subscriptionRef.current.machine !== machine
          ) {
            subscriptionRef.current?.dispose();
            subscriptionRef.current = {
              // @ts-ignore
              dispose: machine.subscribe(...params),
              machine,
            };
          }

          return subscriptionRef.current.dispose;
        }, [machine]);
      },
    [machine]
  );

  return [
    React.useSyncExternalStore(machine.subscribe, machine.getState),
    machine.events,
    useSubscribe,
  ] as any;
}
