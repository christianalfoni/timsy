import * as React from "react";
import {
  StateMachine,
  StateMachineCreator,
  TStateCreator,
  TTransitions,
} from "..";

export type UseTransitionEffectWithEvent<
  States extends Record<string, TStateCreator>,
  T extends TTransitions<States>
> = <
  SS extends keyof States | (keyof States)[],
  EE extends {
    [U in keyof T]: {
      [E in keyof T[U]]: E;
    }[keyof T[U]];
  }[keyof T]
>(
  current: SS,
  event: EE,
  effect: (
    state: SS extends (keyof States)[]
      ? ReturnType<States[SS[number]]>
      : SS extends keyof States
      ? ReturnType<States[SS]>
      : never,
    ...eventParams: SS extends (keyof States)[]
      ? Parameters<T[SS[number]][EE]>
      : SS extends keyof States
      ? Parameters<T[SS][EE]>
      : never
  ) => void
) => void;

type UseTransitionEffect<States extends Record<string, TStateCreator>> = <
  SS extends keyof States | (keyof States)[]
>(
  current: SS,
  effect: (
    state: SS extends (keyof States)[]
      ? ReturnType<States[SS[number]]>
      : SS extends keyof States
      ? ReturnType<States[SS]>
      : never
  ) => void | (() => void)
) => void;

const createUseTransitionEffect =
  <
    States extends Record<string, TStateCreator>,
    T extends TTransitions<States>
  >(
    machine: StateMachine<States, T>
  ): UseTransitionEffect<States> & UseTransitionEffectWithEvent<States, T> =>
  (...params: any[]) => {
    const state = params[0];
    const eventType = params[1];
    const cb = params[2] || params[1];

    if (typeof eventType === "string") {
      React.useEffect(
        () =>
          machine.subscribe((currentState, event) => {
            const isState = Array.isArray(state)
              ? state.includes(currentState.state)
              : currentState.state === state;
            if (isState && event.type === eventType) {
              cb(currentState, ...event.params);
            }
          }),
        []
      );
    } else {
      React.useEffect(() => {
        let subscriptionDisposer: (() => void) | undefined;
        const disposer = machine.subscribe((currentState, _, prevState) => {
          if (Array.isArray(state)) {
            const hasChangedWithinStates =
              state.includes(currentState.state) &&
              state.includes(prevState?.state);
            const hasChangedToState =
              state.includes(currentState.state) &&
              !state.includes(prevState?.state);

            if (hasChangedWithinStates) {
              return;
            }

            if (hasChangedToState) {
              subscriptionDisposer = cb(currentState);
            } else {
              subscriptionDisposer?.();
              subscriptionDisposer = undefined;
            }
          } else {
            const hasChangedToState =
              currentState.state === state && prevState?.state !== state;

            if (hasChangedToState) {
              subscriptionDisposer = cb(currentState);
            } else {
              subscriptionDisposer?.();
              subscriptionDisposer = undefined;
            }
          }
        });

        if (
          Array.isArray(state)
            ? state.includes(machine.getState().state)
            : machine.getState().state === state
        ) {
          subscriptionDisposer = cb(machine.getState());
        }

        return () => {
          disposer();
          subscriptionDisposer?.();
        };
      }, []);
    }
  };

export const useMachine = <T extends StateMachineCreator<any, any>>(
  spawn: T,
  initialState: ReturnType<ReturnType<T>["getState"]>
): T extends StateMachineCreator<infer States, infer Transitions>
  ? [
      ReturnType<ReturnType<T>["getState"]>,
      ReturnType<T>["events"],
      UseTransitionEffect<States> &
        UseTransitionEffectWithEvent<States, Transitions>
    ]
  : never => {
  const [machine] = React.useState(() => spawn(initialState));
  const [state, setState] = React.useState(machine.getState());
  const useTransitionEffect = React.useMemo(
    () => createUseTransitionEffect(machine),
    [machine]
  );

  React.useEffect(() => machine.subscribe(setState), []);

  return [state, machine.events, useTransitionEffect] as any;
};
