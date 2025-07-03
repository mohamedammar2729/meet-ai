import { inferRouterOutputs } from "@trpc/server";
// AppRouter we used to access the agentsRouter to get the type of the output of one agent
import type { AppRouter } from "@/trpc/routers/_app";

export type AgentsGetMany =inferRouterOutputs<AppRouter>['agents']['getMany']['items'];
export type AgentGetOne = inferRouterOutputs<AppRouter>["agents"]["getOne"];