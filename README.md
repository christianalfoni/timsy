# timsy

Agnostic functional state machine with epic type support

## Using Timsy with React

### Make state explicit

```tsx
import { createStates, States, match } from "timsy"

const [states] = createStates({
  NOT_LOADED: () => ({}),
  LOADING: () => ({}),
  LOADED: (data: Data) => ({ data }),
  ERROR: (error: Error) => ({ error }),
})

type DataState = States<typeof states>

const DataComponent: React.FC = () => {
  const [state, setState] = useState<DataState>(states.NOT_LOADED())

  return (
    <div>
      {match(state, {
        NOT_LOADED: () => (
          <button
            onClick={() => {
              fetch("/data")
                .then((response) => response.json())
                .then((data) => setState(states.LOADED(data)))
                .catch((error) => setState(states.ERROR(error)))
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

### Make state predictable

```tsx
import { createStates, useMachine, match } from "timsy"

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
  const [state, events, useTransitionEffect] = useMachine(() =>
    dataMachine(states.NOT_LOADED())
  )

  useTransitionEffect("LOADING", () => {
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
import { usePromise, match } from "timsy"

const DataComponent: React.FC = () => {
  const [state, load, useTransitionEffect] = usePromise(() =>
    fetch("/data").then((response) => response.json())
  )

  useTransitionEffect("RESOLVED", ({ value }) => {
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

const dispose = machine.subscribe("FOO", (state) => {
  // When entering state
  return () => {
    // When exiting state
  }
})

const dispose = machine.subscribe(["FOO", "BAR"], (state) => {
  // When first entering either state
  return () => {
    // When exiting to other state
  }
})

const dispose = machine.subscribe(
  "FOO => switch => BAR",
  (prev, eventParams, current) => {
    // When transition occurs
    return () => {
      // Dispose when transitioning again
    }
  }
)
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
