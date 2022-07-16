# timsy

Agnostic functional state machine with epic type support

## Core API

```ts
import { createStates } from "timsy"

const [states, createMachine] = createStates({
  FOO: () => ({}),
  BAR: () => ({}),
})

const runMachine = createMachine({
  FOO: {
    switch: () => () => states.BAR(),
  },
  BAR: {
    switch: () => () => states.FOO(),
  },
})

const machine = runMachine(states.FOO())

machine.events.switch()

const currentState = machine.getState()

const dispose = machine.subscribe((state, event, prevState) => {
  // Any change
})

const dispose = machine.onEnter("FOO", (state) => {
  // When entering state
  return () => {
    // When exiting state
  }
})

const dispose = machine.onEnter(["FOO", "BAR"], (state) => {
  // When first entering either state
  return () => {
    // When exiting to other state
  }
})

const dispose = machine.onTransition(
  "FOO => switch => BAR",
  (prev, eventParams, current) => {
    // When transition occurs
    return () => {
      // Dispose when transitioning again
    }
  }
)
```

## Using Timsy with React

```tsx
import { createStates, useMachine, useEnter, match } from "timsy"

const [states, createMachine] = createStates({
  NOT_LOADED: () => ({}),
  LOADING: () => ({}),
  LOADED: (data: Data) => ({ data }),
  ERROR: (error: Error) => ({ error }),
})

const dataMachine = createMachine({
  NOT_LOADED: {
    load: () => () => states.LOADING(),
  },
  LOADING: {
    loadSuccess: (data: Data) => () => states.LOADED(data),
    loadError: (error: Error) => () => states.ERROR(error),
  },
  LOADED: {},
  ERROR: {},
})

const DataComponent: React.FC = () => {
  const [state, events, machine] = useMachine(() =>
    dataMachine(states.NOT_LOADED())
  )

  useEnter(machine, "LOADING", () => {
    fetch("/data")
      .then((response) => response.json())
      .then(events.loadSuccess)
      .catch(events.loadError)
  })

  return (
    <div>
      {match(state, {
        NOT_LOADED: () => (
          <button
            onClick={() => {
              events.load()
            }}>
            Load Data
          </button>
        ),
        LOADING: () => "Loading...",
        LOADED: ({ data }) => JSON.stringify(data),
        ERROR: ({ error }) => `ops, ${error.message}`,
      })}
    </div>
  )
}
```

### Make promises safe

**usePromise** is a state machine handling any promise.

- Explicit promise state
- No over fetching
- No expired component lifecycle setting state
- No double render in React dev mode
- Consume directly or subscribe to transitions

```tsx
import { usePromise, match, useEnter } from "timsy"

const DataComponent: React.FC = () => {
  const [state, load, machine] = usePromise(() =>
    fetch("/data").then((response) => response.json())
  )

  useEnter(machine, "RESOLVED", ({ value }) => {
    // Pass resolved data into other state stores or react
    // to transitions
  })

  return (
    <div>
      {match(state, {
        IDLE: () => (
          <button
            onClick={() => {
              load()
            }}>
            Load Data
          </button>
        ),
        PENDING: () => "Loading...",
        RESOLVED: ({ value }) => JSON.stringify(value),
        REJECTED: ({ error }) => `ops, ${error.message}`,
      })}
    </div>
  )
}
```

## Publish

```ssh
yarn build
cd dist
# If you need to double-check what will be in the final publish package
npx npm-packlist
# publish via np or npm itself
npm publish
```
