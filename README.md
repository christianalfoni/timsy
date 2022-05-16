# timsy

Agnostic functional state machine with epic type support

## Example

```ts
import { createStates } from "timsy"

const [states, createMachine] = createStates({
  FOO: () => ({}),
  BAR: () => ({}),
})

const runMachine = createMachine(states, {
  FOO: {
    SWITCH: () => () => states.BAR(),
  },
  BAR: {
    SWITCH: () => () => states.FOO(),
  },
})

const machine = runMachine(states.FOO())

machine.events.SWITCH()

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
  "FOO",
  "SWITCH",
  (state, eventParams) => {
    // When entering state by event
  }
)

const dispose = machine.subscribe(
  ["FOO", "BAR"],
  "SWITCH",
  (state, eventParams) => {
    // When entering either state by event
  }
)

const dispose = machine.subscribe(
  "FOO",
  "SWITCH",
  "BAR",
  (state, eventParams, prevState) => {
    // When entering state by event from state
  }
)

const dispose = machine.subscribe(
  ["FOO", "BAR"],
  "SWITCH",
  "BAZ"
  (state, eventParams, prevState) => {
    // When entering either state by event from state
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
