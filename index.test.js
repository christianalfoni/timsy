import { createMachine, createStates } from ".";
describe("states", () => {
  it("should instantiate states", () => {
    const states = createStates({
      FOO: () => ({}),
    });
    expect(states.FOO()).toEqual({ state: "FOO" });
  });
  it("should take params to produce state", () => {
    const states = createStates({
      FOO: (foo) => ({ foo }),
    });
    expect(states.FOO("bar")).toEqual({ state: "FOO", foo: "bar" });
  });
});
describe("machine", () => {
  it("should create machine with function to spawn", () => {
    const states = createStates({
      FOO: () => ({}),
      BAR: () => ({}),
    });
    const spawn = createMachine(states, {
      FOO: {},
      BAR: {},
    });
    expect(typeof spawn).toBe("function");
  });
  it("should spawn machine with initial state", () => {
    const states = createStates({
      FOO: () => ({}),
      BAR: () => ({}),
    });
    const spawn = createMachine(states, {
      FOO: {},
      BAR: {},
    });
    expect(spawn(states.FOO()).getState()).toEqual({ state: "FOO" });
  });
  it("should expose events as functions", () => {
    const states = createStates({
      FOO: () => ({}),
      BAR: () => ({}),
    });
    const spawn = createMachine(states, {
      FOO: {
        SWITCH: () => () => states.BAR(),
      },
      BAR: {
        SWITCH: () => () => states.FOO(),
      },
    });
    const testMachine = spawn(states.FOO());
    expect(typeof testMachine.events.SWITCH).toBe("function");
  });
  it("should handle event and transition", () => {
    const states = createStates({
      FOO: () => ({}),
      BAR: () => ({}),
    });
    const spawn = createMachine(states, {
      FOO: {
        SWITCH: () => () => states.BAR(),
      },
      BAR: {
        SWITCH: () => () => states.FOO(),
      },
    });
    const testMachine = spawn(states.FOO());
    expect(testMachine.getState()).toEqual({ state: "FOO" });
    testMachine.events.SWITCH();
    expect(testMachine.getState()).toEqual({ state: "BAR" });
  });
  it("should ignore event and keep state", () => {
    const states = createStates({
      FOO: () => ({}),
      BAR: () => ({}),
    });
    const spawn = createMachine(states, {
      FOO: {},
      BAR: {
        SWITCH: () => () => states.FOO(),
      },
    });
    const testMachine = spawn(states.FOO());
    expect(testMachine.getState()).toEqual({ state: "FOO" });
    testMachine.events.SWITCH();
    expect(testMachine.getState()).toEqual({ state: "FOO" });
  });
  it("should emit event on transitions", () => {
    expect.assertions(3);
    const states = createStates({
      FOO: () => ({}),
      BAR: () => ({}),
    });
    const spawn = createMachine(states, {
      FOO: {
        SWITCH: () => () => states.BAR(),
      },
      BAR: {
        SWITCH: () => () => states.FOO(),
      },
    });
    const testMachine = spawn(states.FOO());
    testMachine.subscribe((state, event, oldState) => {
      expect(state).toEqual({ state: "BAR" });
      expect(event).toEqual({ type: "SWITCH", params: [] });
      expect(oldState).toEqual({ state: "FOO" });
    });
    testMachine.events.SWITCH();
  });
});
//# sourceMappingURL=index.test.js.map
