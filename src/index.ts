type TStateCreator = (...params: any[]) => object;

type TStateCreatorWithState<State extends Record<string, TStateCreator>> = {
  [K in keyof State]: (
    ...params: Parameters<State[K]>
  ) => ReturnType<State[K]> & { state: K };
};

export interface IState {
  state: string;
}

export interface IEvent {
  type: string;
}

type Transitions<T extends Record<string, TStateCreator>> = {
  [S in keyof T]: {
    [event: string]: (
      ...params: any[]
    ) => (state: { state: S } & ReturnType<T[S]>) => ReturnType<T[keyof T]>;
  };
};

export type Subscriber<
  State extends Record<string, TStateCreator>,
  T extends Transitions<State>
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
  State extends Record<string, TStateCreator>,
  T extends Transitions<State>
> = (
  initializer: () => ReturnType<TStateCreatorWithState<State>[keyof State]>
) => {
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
  subscribe: (subscriber: Subscriber<State, T>) => void;
};

export function createStates<State extends Record<string, TStateCreator>>(
  states: State
) {
  const stateCreators = {} as TStateCreatorWithState<State>;

  for (let state in states) {
    // @ts-ignore
    stateCreators[state] = (...params) => ({
      ...states[state](...params),
      state: state,
    });
  }

  return stateCreators;
}

export function createMachine<
  State extends Record<string, TStateCreator>,
  T extends Transitions<State>
>(_: State, transitions: T): StateMachine<State, T> {
  let isDisposed = false;

  const subscribers: Subscriber<State, T>[] = [];

  return (initializer) => {
    let currentState = initializer();
    const events = {} as ReturnType<StateMachine<State, T>>["events"];

    for (let state in transitions) {
      for (let event in transitions[state]) {
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

    return {
      dispose() {
        subscribers.length = 0;
        isDisposed = true;
      },
      events,
      getState() {
        return currentState;
      },
      subscribe(subscriber: Subscriber<State, T>) {
        subscribers.push(subscriber);

        return () => {
          subscribers.splice(subscribers.indexOf(subscriber), 1);
        };
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
export function match() {
  const state = arguments[0];
  const matches = arguments[1];
  const _ = arguments[2];

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
export function matchProp() {
  const state = arguments[0];
  const prop = arguments[1];
  // @ts-ignore
  return prop in state ? state : undefined;
}
