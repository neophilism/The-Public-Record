export const requestStates = ["unclaimed","adopted","draft","submitted_unverified","acknowledged","in_process","released","partially_released","denied","appealed","archived"] as const;
export type RequestState=(typeof requestStates)[number];
const transitions: Record<RequestState,readonly RequestState[]> = {
unclaimed:["adopted"],adopted:["draft","unclaimed"],draft:["submitted_unverified","unclaimed"],
submitted_unverified:["acknowledged","draft"],acknowledged:["in_process","released","partially_released","denied"],
in_process:["released","partially_released","denied"],released:["archived","appealed"],partially_released:["archived","appealed"],
denied:["appealed","archived"],appealed:["released","partially_released","denied","archived"],archived:[]
};
export function canTransition(from:RequestState,to:RequestState){return transitions[from].includes(to)}
