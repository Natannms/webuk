

export type TripStatus = "planned" | "ongoing" | "completed" | "canceled";

export type EstimatedPeriod =
  | {
      kind: "dates";              // intervalo de datas específicas
      startDate: Date | null;     // pode ser null enquanto o usuário preenche
      endDate: Date | null;
      year?:number | null
    }
  | {
      kind: "months";             // meses/ano (ex.: “Jan–Fev/2026”)
      startDate: number | null;  // 1..12
      endDate: number | null;    // 1..12
      year?: number | null;
    };

export interface TripData {
  id?: string;               // id do doc no Firestore
  coupleId: string;          // casal dono da viagem
  ownerUserId: string;       // quem criou
  name: string;              // nome da viagem
  year: number;              // ano da viagem
  mainDestination: string;   // destino principal (cidade/praia)
  status: TripStatus;        // planned | ongoing | completed | canceled
  estimatedPeriod: EstimatedPeriod; // período estimado
  description?: string;      // notas/observações
  createdAt?: any;           // serverTimestamp() | Timestamp
  updatedAt?: any;           // serverTimestamp() | Timestamp
}

export type NewTripInput = Omit<
  TripData,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateTripInput = Partial<
  Omit<TripData, "id" | "coupleId" | "ownerUserId" | "createdAt">
> & { id: string };

export const TRIP_STATUSES: TripStatus[] = [
  "planned",
  "ongoing",
  "completed",
  "canceled",
];
