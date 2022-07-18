# timsy

Agnostic functional state machine with epic type support

## Core API

```ts
import { createMachine } from "timsy"

const spawn = createMachine(
  // Define your states as factories, returning optional related
  // values to that state
  {
    FOO: () => ({}),
    BAR: () => ({}),
  },
  // Define your transitions with a callback providing the state
  // factories and expects a transitions declarations to be returned
  (states) => ({
    // Every state needs to be defined
    FOO: {
      // With optional events to be handled in the state. The handler
      // is defined by a function taking optional parameters, which
      // returns a function providing the current state, expecting to
      // the same or new state
      switch: () => () => states.BAR(),
    },
    BAR: {
      switch: () => () => states.FOO(),
    },
  })
)

// Spawn the machine giving the initial state object.
// Typing is inferred
const machine = spawn({ state: "FOO" })

// Call any events where typing is inferred
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
import { createMachine, useMachine, useEnter, match } from "timsy"

const spawnDataMachine = createMachine(
  {
    NOT_LOADED: () => ({}),
    LOADING: () => ({}),
    LOADED: (data: Data) => ({ data }),
    ERROR: (error: Error) => ({ error }),
  },
  (states) => ({
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
)

const DataComponent: React.FC = () => {
  const [state, events, machine] = useMachine(() =>
    spawnDataMachine({ state: "NOT_LOADED" })
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
