export type TStateCreator = (...params: any[]) => object;

export type TStateCreators = Record<string, TStateCreator>;

type TStateCreatorWithState<State extends TStateCreators> = {
  [K in keyof State]: (
    ...params: Parameters<State[K]>
  ) => ReturnType<State[K]> & { state: K };
};

export type TStateCreatorsWithState<T extends TStateCreators> = Record<
  string,
  TStateCreatorWithState<T>
>;

export interface IState {
  state: string;
}

export interface IEvent {
  type: string;
}

export type TTransitions<T extends TStateCreators> = {
  [S in keyof T]: {
    [event: string]: (
      ...params: any[]
    ) => (state: { state: S } & ReturnType<T[S]>) => ReturnType<T[keyof T]>;
  };
};

export type SubscribeTransitionWithEventAndFrom<
  States extends Record<string, TStateCreator>,
  T extends TTransitions<States>
> = <
  SS extends keyof States | (keyof States)[],
  EE extends {
    [U in keyof T]: {
      [E in keyof T[U]]: E;
    }[keyof T[U]];
  }[keyof T],
  SF extends keyof States
>(
  current: SS,
  event: EE,
  from: SF,
  effect: (
    state: SS extends (keyof States)[]
      ? ReturnType<States[SS[number]]>
      : SS extends keyof States
      ? ReturnType<States[SS]>
      : never,
    eventParams: SS extends (keyof States)[]
      ? Parameters<T[SS[number]][EE]>
      : SS extends keyof States
      ? Parameters<T[SS][EE]>
      : never,
    prevState: SF extends keyof States ? ReturnType<States[SF]> : never
  ) => void
) => void;

export type SubsribeTransitionWithEvent<
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
    eventParams: SS extends (keyof States)[]
      ? Parameters<T[SS[number]][EE]>
      : SS extends keyof States
      ? Parameters<T[SS][EE]>
      : never
  ) => void
) => void;

type SubscribeTransition<States extends Record<string, TStateCreator>> = <
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

export type Subscribe<
  State extends TStateCreators,
  T extends TTransitions<State>
> = (cb: Subscriber<State, T>) => void;

export type Subscriber<
  State extends TStateCreators,
  T extends TTransitions<State>
> = (
  state: {
    [S in keyof State]: { state: S } & ReturnType<State[S]>;
  }[keyof State],
  event: {
    [K in keyof T]: {
      [U in keyof T[K]]: {
        type: U;
        params: Parameters<T[K][U]>;
      };
    }[keyof T[K]];
  }[keyof T],
  prevState: {
    [S in keyof State]: { state: S } & ReturnType<State[S]>;
  }[keyof State]
) => void;

type TUnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (
  x: infer R
) => any
  ? R
  : never;

export type StateMachine<
  State extends TStateCreators,
  T extends TTransitions<State>
> = {
  dispose(): void;
  events: TUnionToIntersection<
    {
      [K in keyof T]: {
        [U in keyof T[K]]: (...params: Parameters<T[K][U]>) => void;
      };
    }[keyof T]
  >;
  getState(): {
    [S in keyof State]: ReturnType<TStateCreatorWithState<State>[S]>;
  }[keyof State];
  subscribe: Subscribe<State, T> &
    SubscribeTransition<State> &
    SubsribeTransitionWithEvent<State, T> &
    SubscribeTransitionWithEventAndFrom<State, T>;
};

export type StateMachineCreator<
  State extends TStateCreators,
  T extends TTransitions<State>
> = (
  initialState: ReturnType<TStateCreatorWithState<State>[keyof State]>
) => StateMachine<State, T>;

export function createStates<State extends TStateCreators>(
  states: State
): [
  TStateCreatorWithState<State>,
  <T extends TTransitions<State>>(
    transitions: T
  ) => StateMachineCreator<State, T>
] {
  const stateCreators = {} as TStateCreatorWithState<State>;

  for (const state in states) {
    // @ts-ignore
    stateCreators[state] = (...params) => ({
      ...states[state](...params),
      state: state,
    });
  }

  return [stateCreators, createMachine];
}

function createMachine<
  State extends TStateCreators,
  T extends TTransitions<State>
>(transitions: T): StateMachineCreator<State, T> {
  return (initialState) => {
    let isDisposed = false;
    let currentState = initialState;

    const subscribers: Subscriber<State, T>[] = [];
    const events = {} as ReturnType<StateMachineCreator<State, T>>["events"];

    for (const state in transitions) {
      for (const event in transitions[state]) {
        // @ts-ignore
        events[event] = (...params) => {
          if (isDisposed) {
            return;
          }

          if (transitions[currentState.state][event]) {
            const prevState = currentState;
            // @ts-ignore
            currentState = transitions[currentState.state][event](...params)(
              // @ts-ignore
              currentState
            );
            subscribers.forEach((subscriber) =>
              // @ts-ignore
              subscriber(currentState, { params, type: event }, prevState)
            );
          }
        };
      }
    }

    const subscribe = (subscriber: Subscriber<State, T>) => {
      subscribers.push(subscriber);

      return () => {
        subscribers.splice(subscribers.indexOf(subscriber), 1);
      };
    };

    return {
      dispose() {
        subscribers.length = 0;
        isDisposed = true;
      },
      events,
      getState() {
        return currentState;
      },
      subscribe(...params: any[]) {
        const state = params[0];
        const eventType = params[1];
        const from = params[2];
        const cb = params[3] || params[2] || params[1];

        if (typeof state === "function") {
          return subscribe(state);
        }

        if (typeof from === "string") {
          subscribe((currentState, event, prevState) => {
            const isState = Array.isArray(state)
              ? state.includes(currentState.state)
              : currentState.state === state;
            if (
              isState &&
              event.type === eventType &&
              prevState?.state === from
            ) {
              cb(currentState, event.params, prevState);
            }
          });
        } else if (typeof eventType === "string") {
          subscribe((currentState, event) => {
            const isState = Array.isArray(state)
              ? state.includes(currentState.state)
              : currentState.state === state;
            if (isState && event.type === eventType) {
              cb(currentState, event.params);
            }
          });
        } else {
          let subscriptionDisposer: (() => void) | undefined;
          const disposer = subscribe((currentState, _, prevState) => {
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
              ? state.includes(currentState.state)
              : currentState.state === state
          ) {
            subscriptionDisposer = cb(currentState);
          }

          return () => {
            disposer();
            subscriptionDisposer?.();
          };
        }
      },
    };
  };
}

type TMatch<S extends IState, R = any> = {
  [SS in S["state"]]: (state: S & { state: SS }) => R;
};

type TPartialMatch<S extends IState, R = any> = {
  [SS in S["state"]]?: (state: S & { state: SS }) => R;
};

export function match<S extends IState, T extends TMatch<S>>(
  state: S,
  matches: T
): {
  [K in keyof T]: T[K] extends (...args: any[]) => infer R ? R : never;
}[keyof T];
export function match<S extends IState, T extends TPartialMatch<S>, U>(
  state: S,
  matches: T,
  _: (state: S & { state: Exclude<S["state"], keyof T> }) => U
):
  | {
      [K in keyof T]: T[K] extends (...args: any[]) => infer R ? R : never;
    }[keyof T]
  | U;

// FIXME: type enhancement
export function match(state: any, matches: any, _?: any) {
  if (_) {
    return (matches[state.state] || _)(state);
  }

  return matches[state.state](state);
}

export function matchProp<
  S extends IState,
  P extends {
    [K in keyof S]: keyof (S & { state: K });
  }[keyof S]
>(state: S, prop: P): S extends Record<P, unknown> ? S : undefined;

// FIXME: type enhancement
export function matchProp(state: any, prop: any) {
  // @ts-ignore
  return prop in state ? state : undefined;
}

export type PickState<S extends IState, T extends S["state"] = never> = [
  T
] extends [never]
  ? S
  : S extends { state: T }
  ? S
  : never;

export type States<T extends Record<string, (...params: any[]) => IState>> = {
  [K in keyof T]: ReturnType<T[K]>;
}[keyof T];

export const pickEvents = <
  T extends Record<string, (...params: any[]) => void>,
  TA extends (keyof T)[]
>(
  obj: T,
  ...keys: TA
): Pick<T, TA[number]> => {
  return Object.keys(obj)
    .filter((key) => keys.includes(key as keyof T))
    .reduce((aggr, key) => {
      // @ts-ignore
      aggr[key] = obj[key];

      return aggr;
    }, {} as any);
};
