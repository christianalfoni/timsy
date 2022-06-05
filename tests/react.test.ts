import { act, renderHook, waitFor } from "@testing-library/react";
import { createStates } from "timsy";
import { useMachine, usePromise } from "timsy/react";

const [states, createMachine] = createStates({
  FOO: () => ({}),
  BAR: () => ({}),
  BAZ: () => ({}),
});

const machine = createMachine({
  FOO: {
    SWITCH: () => () => states.BAR(),
    SWITCH_SAME: () => (state) => state,
  },
  BAR: {
    SWITCH: () => () => states.FOO(),
    SWITCH_BAZ: () => () => states.BAZ(),
  },
  BAZ: {},
});

describe("hooks", () => {
  it("should consume a machine through a hook", async () => {
    const { result } = renderHook(() => useMachine(machine(states.FOO())));

    expect(result.current[0]).toEqual({ state: "FOO" });
  });
  it("should update hook state when machine changes state", async () => {
    const { result } = renderHook(() =>
      useMachine(() => machine(states.FOO()), [])
    );

    expect(result.current[0]).toEqual({ state: "FOO" });

    act(() => {
      result.current[1].SWITCH();
    });

    expect(result.current[0]).toEqual({ state: "BAR" });
  });
  it("should not reconcile when returning the same state", async () => {
    let reconcileCount = 0;
    const { result } = renderHook(() => {
      reconcileCount++;
      return useMachine(() => machine(states.FOO()), []);
    });

    expect(result.current[0]).toEqual({ state: "FOO" });

    act(() => {
      result.current[1].SWITCH_SAME();
    });

    expect(reconcileCount).toBe(1);
  });
  it("should trigger effect when transitioning into initial state", async () => {
    expect.assertions(1);
    renderHook(() => {
      const testMachine = useMachine(() => machine(states.FOO()), []);
      const [, , useSubscribe] = testMachine;

      useSubscribe("FOO", () => {
        expect(true).toBe(true);
      });

      return testMachine;
    });
  });
  it("should handle single state effect", async () => {
    let hasDisposedFooEffect = false;
    let hasRunBarEffect = false;
    const { result } = renderHook(() => {
      const testMachine = useMachine(() => machine(states.FOO()), []);
      const [, , useSubscribe] = testMachine;

      useSubscribe("FOO", () => () => {
        hasDisposedFooEffect = true;
      });
      useSubscribe("BAR", () => {
        hasRunBarEffect = true;
      });

      return testMachine;
    });

    act(() => {
      result.current[1].SWITCH();
    });

    expect(hasDisposedFooEffect);
    expect(hasRunBarEffect);
  });
  it("should handle multiple states effect", async () => {
    let hasDisposedFooBarEffect = false;
    let hasRunFooBarEffect = false;
    const { result } = renderHook(() => {
      const testMachine = useMachine(() => machine(states.FOO()), []);
      const [, , useSubscribe] = testMachine;

      useSubscribe(["FOO", "BAR"], () => {
        hasRunFooBarEffect = true;
        return () => {
          hasDisposedFooBarEffect = true;
        };
      });

      return testMachine;
    });

    expect(hasRunFooBarEffect).toBe(true);

    act(() => {
      result.current[1].SWITCH();
    });

    expect(hasDisposedFooBarEffect).toBe(false);
  });
  it("should handle state with event effect", async () => {
    let hasRunBarEffect = false;
    const { result } = renderHook(() => {
      const testMachine = useMachine(() => machine(states.FOO()), []);
      const [, , useSubscribe] = testMachine;

      useSubscribe("BAR", "SWITCH", () => {
        hasRunBarEffect = true;
      });

      return testMachine;
    });

    act(() => {
      result.current[1].SWITCH();
    });

    expect(hasRunBarEffect).toBe(true);
  });
  it("should handle multiple states with event effect", async () => {
    let runBarEffectCount = 0;
    const { result } = renderHook(() => {
      const testMachine = useMachine(() => machine(states.BAR()), []);
      const [, , useSubscribe] = testMachine;

      useSubscribe(["FOO", "BAR"], "SWITCH", () => {
        runBarEffectCount++;
      });

      return testMachine;
    });

    expect(runBarEffectCount).toBe(0);

    act(() => {
      result.current[1].SWITCH();
    });

    expect(runBarEffectCount).toBe(1);

    act(() => {
      result.current[1].SWITCH();
    });

    expect(runBarEffectCount).toBe(2);
  });
  it("should resolve promises", async () => {
    let runResolvedEffectCount = 0;
    const { result } = renderHook(() => {
      const testMachine = usePromise(async (name: string) => `hello ${name}`);
      const [, , useSubscribe] = testMachine;

      useSubscribe("RESOLVED", () => {
        runResolvedEffectCount++;
      });

      return testMachine;
    });

    expect(runResolvedEffectCount).toBe(0);

    act(() => {
      result.current[1]("Christian");
    });

    await waitFor(() => {
      expect(runResolvedEffectCount).toBe(1);

      expect(result.current[0]).toEqual({
        state: "RESOLVED",
        value: "hello Christian",
      });
    });
  });
});
