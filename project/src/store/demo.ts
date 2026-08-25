import { useSyncExternalStore } from "react";

type State = { balance: number; transactions: {id:string; type:string; amount:number; status:string}[] };

let state: State = {
  balance: 1250,
  transactions: [
    {id:"TX-8491", type:"Deposit request", amount:500, status:"Pending"},
    {id:"TX-8201", type:"Win", amount:750, status:"Completed"},
  ]
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach(x => x());

export const demoStore = {
  get: () => state,
  subscribe: (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); },
  depositRequest: (amount:number) => {
    state = {...state, transactions:[{id:`TX-${Date.now()}`,type:"Deposit request",amount,status:"Pending"},...state.transactions]};
    emit();
  },
  adjustBalance: (amount:number) => { state = {...state,balance:Math.max(0,state.balance+amount)}; emit(); }
};

export function useDemoStore() {
  return useSyncExternalStore(demoStore.subscribe, demoStore.get, demoStore.get);
}
