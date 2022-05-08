import { renderHook } from "@testing-library/react";
import { createMachine, createStates } from "..";
const states = createStates({
    FOO: () => ({}),
    BAR: () => ({}),
});
const machine = createMachine(states, {
    FOO: {
        SWITCH: () => () => states.BAR(),
    },
    BAR: {
        SWITCH: () => () => states.FOO(),
    },
});
const testHook = () => "hello world";
describe("hooks", () => {
    it("should consume a machine through a hook", async () => {
        const { result } = renderHook(() => testHook());
        expect(result).toBe("hello world");
    });
});
//# sourceMappingURL=index.test.js.map