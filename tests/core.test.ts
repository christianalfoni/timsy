import { createStates } from "timsy";

describe("states", () => {
  it("should instantiate states", () => {
    const [states] = createStates({
      FOO: () => ({}),
    });
    expect(states.FOO()).toEqual({ state: "FOO" });
  });
  it("should take params to produce state", () => {
    const [states] = createStates({
      FOO: (foo: string) => ({ foo }),
    });
    expect(states.FOO("bar")).toEqual({ state: "FOO", foo: "bar" });
  });
});

describe("machine", () => {
  it("should create machine with function to spawn", () => {
    const [, createMachine] = createStates({
      FOO: () => ({}),
      BAR: () => ({}),
    });
    const spawn = createMachine({
      FOO: {},
      BAR: {},
    });
    expect(typeof spawn).toBe("function");
  });
  it("should spawn machine with initial state", () => {
    const [states, createMachine] = createStates({
      FOO: () => ({}),
      BAR: () => ({}),
    });
    const spawn = createMachine({
      FOO: {},
      BAR: {},
    });
    expect(spawn(states.FOO()).getState()).toEqual({ state: "FOO" });
  });
  it("should expose events as functions", () => {
    const [states, createMachine] = createStates({
      FOO: () => ({}),
      BAR: () => ({}),
    });
    const spawn = createMachine({
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
    const [states, createMachine] = createStates({
      FOO: () => ({}),
      BAR: () => ({}),
    });
    const spawn = createMachine({
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
    const [states, createMachine] = createStates({
      FOO: () => ({}),
      BAR: () => ({}),
    });
    const spawn = createMachine({
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
    const [states, createMachine] = createStates({
      FOO: () => ({}),
      BAR: () => ({}),
    });
    const spawn = createMachine({
      FOO: {
        SWITCH: () => () => states.BAR(),
      },
      BAR: {
        SWITCH: () => () => states.FOO(),
      },
    });
    const testMachine = spawn(states.FOO());
    testMachine.subscribe((current, event, prev) => {
      expect(prev).toEqual({ state: "FOO" });
      expect(event).toEqual({ type: "SWITCH", params: [] });
      expect(current).toEqual({ state: "BAR" });
    });
    testMachine.events.SWITCH();
  });
});

describe("transitions", () => {
  it("should trigger when entering initial state", () => {
    expect.assertions(1);
    const [states, createMachine] = createStates({
      FOO: () => ({}),
      BAR: () => ({}),
    });

    const machine = createMachine({
      FOO: {
        SWITCH: () => () => states.BAR(),
      },
      BAR: {
        SWITCH: () => () => states.FOO(),
      },
    })(states.FOO());

    machine.onEnter("FOO", () => {
      expect(true).toBe(true);
    });
  });
  it("should trigger when entering state", () => {
    expect.assertions(1);
    const [states, createMachine] = createStates({
      FOO: () => ({}),
      BAR: () => ({}),
    });

    const machine = createMachine({
      FOO: {
        SWITCH: () => () => states.BAR(),
      },
      BAR: {
        SWITCH: () => () => states.FOO(),
      },
    })(states.FOO());

    machine.events.SWITCH();

    machine.onEnter("BAR", () => {
      expect(true).toBe(true);
    });
  });
  it("should trigger when entering either state", () => {
    expect.assertions(1);
    const [states, createMachine] = createStates({
      FOO: () => ({}),
      BAR: () => ({}),
    });

    const machine = createMachine({
      FOO: {
        SWITCH: () => () => states.BAR(),
      },
      BAR: {
        SWITCH: () => () => states.FOO(),
      },
    })(states.FOO());

    machine.onEnter(["FOO", "BAR"], () => {
      expect(true).toBe(true);
    });

    machine.events.SWITCH();
  });
  it("should trigger when entering state by event from state", () => {
    expect.assertions(3);
    const [states, createMachine] = createStates({
      FOO: () => ({}),
      BAR: () => ({}),
    });

    const machine = createMachine({
      FOO: {
        SWITCH: () => () => states.BAR(),
      },
      BAR: {
        SWITCH: () => () => states.FOO(),
      },
    })(states.FOO());

    machine.onTransition("FOO => SWITCH => BAR", (prev, params, current) => {
      expect(prev).toEqual({ state: "FOO" });
      expect(params).toEqual([]);
      expect(current).toEqual({ state: "BAR" });
    });

    machine.events.SWITCH();
  });
});
