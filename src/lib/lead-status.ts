export const leadStatuses = [
  "CREATED",
  "CONTATO FEITO",
  "SEM RESPOSTA",
  "TENTATIVA 2",
  "TENTATIVA 3",
  "CADASTRADO",
  "VENDA REALIZADA",
] as const;

export type LeadStatus = (typeof leadStatuses)[number];
