import * as React from 'react'
import { StateMachine } from "..";

export const useMachine = <T extends StateMachine<any, any>>(spawn: T, initialState: ReturnType<ReturnType<T>["getState"]>) => {
    const [machine] = React.useState(() => spawn(initialState))
    const [state, setState] = React.useState(machine.getState())
    const useTransitionEffect = React.useCallback(() => {
        
    }, [])
    
    React.useEffect(() => machine.subscribe(setState), [])
    
    return [state, machine.events, useTransitionEffect]
};
