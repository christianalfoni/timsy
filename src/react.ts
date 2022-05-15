import * as React from "react";
import { StateMachine } from "./core";

export const useMachine = <T extends StateMachine<any, any>>(
  passedMachine: T | (() => T)
): [ReturnType<T["getState"]>, T["events"], T["subscribeTransition"]] => {
  const [machine] = React.useState(() =>
    typeof passedMachine === "function" ? passedMachine() : passedMachine
  );
  const [state, setState] = React.useState(machine.getState());
  const useTransitionEffect = React.useMemo(
    () =>
      (...params: any[]) =>
        // @ts-ignore
        React.useEffect(() => machine.subscribeTransition(...params), []),
    [machine]
  );

  React.useEffect(() => machine.subscribe(setState), []);

  return [state, machine.events, useTransitionEffect] as any;
};
