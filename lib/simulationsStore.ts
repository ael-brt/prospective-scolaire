import { randomUUID } from "node:crypto";

export type SimulationStatus = "PENDING" | "RUNNING" | "DONE" | "ERROR";

export type Simulation = {
  id: string; // uuid
  tenantId: string;
  name: string;
  description?: string;
  status: SimulationStatus;
  parameters: any;
  createdBy: string;
  createdAt: Date;
};

let simulations: Simulation[] = [];

export function addSimulation(
  sim: Omit<Simulation, "id" | "createdAt" | "status">
): Simulation {
  const newSim: Simulation = {
    ...sim,
    id: randomUUID(),
    createdAt: new Date(),
    status: "PENDING",
  };
  simulations = [newSim, ...simulations];
  return newSim;
}

export function listSimulations(tenantId: string): Simulation[] {
  return simulations.filter((s) => s.tenantId === tenantId);
}

export function updateSimulationStatus(id: string, status: SimulationStatus): void {
  simulations = simulations.map((s) => (s.id === id ? { ...s, status } : s));
}
