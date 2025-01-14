import { useAtom } from 'jotai';
import { createPersistedAtom } from './persist';

interface CounterState {
  count: number;
}

const counterAtom = createPersistedAtom<CounterState>('counter', {
  count: 0,
  //other fields
});


export const useCounter = () => {
  const [state, setState] = useAtom(counterAtom);
  
  return {
    count: state.count,
    increment: () => setState(v => ({...v, count: v.count + 1})),
    decrement: () => setState(v => ({...v, count: v.count - 1})),
    reset: () => setState(v => ({...v, count: 0}))
  };
};



