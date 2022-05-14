# timsy

Agnostic functional state machine with epic type support

## Example

```ts
import { createStates, createMachine } from "timsy"

const states = createStates({
  FOO: () => ({}),
  BAR: () => ({}),
})

const spawn = createMachine(states, {
  FOO: {
    SWITCH: () => () => states.BAR(),
  },
  BAR: {
    SWITCH: () => () => states.FOO(),
  },
})

const machine = spawn(states.FOO())

machine.events.SWITCH()

const currentState = machine.getState()

const dispose = machine.subscribe((state, event, prevState) => {})
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
