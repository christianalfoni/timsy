"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("@testing-library/react");
const __1 = require("..");
const states = (0, __1.createStates)({
    FOO: () => ({}),
    BAR: () => ({}),
});
const machine = (0, __1.createMachine)(states, {
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
        const { result } = (0, react_1.renderHook)(() => testHook());
        expect(result).toBe("hello world");
    });
});
//# sourceMappingURL=index.test.js.map