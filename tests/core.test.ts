import { createMachine } from "timsy";

const states = {
  FOO: () => ({}),
  BAR: () => ({}),
};

describe("machine", () => {
  it("should create machine with function to spawn", () => {
    const spawn = createMachine(states, () => ({
      FOO: {},
      BAR: {},
    }));

    expect(typeof spawn).toBe("function");
  });
  it("should spawn machine with initial state", () => {
    const spawn = createMachine(states, () => ({
      FOO: {},
      BAR: {},
    }));

    expect(spawn({ state: "FOO" }).getState()).toEqual({ state: "FOO" });
  });
  it("should expose events as functions", () => {
    const spawn = createMachine(states, ({ FOO, BAR }) => ({
      FOO: {
        SWITCH: () => () => BAR(),
      },
      BAR: {
        SWITCH: () => () => FOO(),
      },
    }));

    const testMachine = spawn({ state: "FOO" });

    expect(typeof testMachine.events.SWITCH).toBe("function");
  });
  it("should handle event and transition", () => {
    const spawn = createMachine(states, ({ FOO, BAR }) => ({
      FOO: {
        SWITCH: () => () => BAR(),
      },
      BAR: {
        SWITCH: () => () => FOO(),
      },
    }));

    const testMachine = spawn({ state: "FOO" });
    expect(testMachine.getState()).toEqual({ state: "FOO" });
    testMachine.events.SWITCH();
    expect(testMachine.getState()).toEqual({ state: "BAR" });
  });
  it("should ignore event and keep state", () => {
    const spawn = createMachine(states, ({ FOO }) => ({
      FOO: {},
      BAR: {
        SWITCH: () => () => FOO(),
      },
    }));

    const testMachine = spawn({ state: "FOO" });
    expect(testMachine.getState()).toEqual({ state: "FOO" });
    testMachine.events.SWITCH();
    expect(testMachine.getState()).toEqual({ state: "FOO" });
  });
  it("should emit event on transitions", () => {
    expect.assertions(3);
    const spawn = createMachine(states, ({ FOO, BAR }) => ({
      FOO: {
        SWITCH: () => () => BAR(),
      },
      BAR: {
        SWITCH: () => () => FOO(),
      },
    }));

    const testMachine = spawn({ state: "FOO" });
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
    const spawn = createMachine(states, ({ FOO, BAR }) => ({
      FOO: {
        SWITCH: () => () => BAR(),
      },
      BAR: {
        SWITCH: () => () => FOO(),
      },
    }));

    const machine = spawn({ state: "FOO" });

    machine.onEnter("FOO", () => {
      expect(true).toBe(true);
    });
  });
  it("should trigger when entering state", () => {
    expect.assertions(1);
    const spawn = createMachine(states, ({ FOO, BAR }) => ({
      FOO: {
        SWITCH: () => () => BAR(),
      },
      BAR: {
        SWITCH: () => () => FOO(),
      },
    }));

    const machine = spawn({ state: "FOO" });

    machine.events.SWITCH();

    machine.onEnter("BAR", () => {
      expect(true).toBe(true);
    });
  });
  it("should trigger when entering either state", () => {
    expect.assertions(1);
    const spawn = createMachine(states, ({ FOO, BAR }) => ({
      FOO: {
        SWITCH: () => () => BAR(),
      },
      BAR: {
        SWITCH: () => () => FOO(),
      },
    }));

    const machine = spawn({ state: "FOO" });

    machine.onEnter(["FOO", "BAR"], () => {
      expect(true).toBe(true);
    });

    machine.events.SWITCH();
  });
  it("should trigger when entering state by event from state", () => {
    expect.assertions(3);
    const spawn = createMachine(states, ({ FOO, BAR }) => ({
      FOO: {
        SWITCH: () => () => BAR(),
      },
      BAR: {
        SWITCH: () => () => FOO(),
      },
    }));

    const machine = spawn({ state: "FOO" });

    machine.onTransition("FOO => SWITCH => BAR", (prev, params, current) => {
      expect(prev).toEqual({ state: "FOO" });
      expect(params).toEqual([]);
      expect(current).toEqual({ state: "BAR" });
    });

    machine.events.SWITCH();
  });
});
