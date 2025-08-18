import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
  } from "firebase/firestore";
  
  // ⚠️ Ajuste o caminho conforme sua base.
  // No seu exemplo anterior foi '../firebaseConfig'.
  // Se você usa '@/lib/firebaseConfig', altere abaixo.
  import { firestore } from "@/firebaseConfig";
  
  import {
    collection_prefix,
  } from "@/types/couples.interfaces"; // reaproveita o mesmo prefixo
  import {
    TripData,
    NewTripInput,
    UpdateTripInput,
    TripStatus,
  } from "@/types/trips.interfaces";
  
  export class TripService {
    private static TRIPS_COLLECTION = collection_prefix + "trips";
  
    /** Cria uma viagem */
    static async createTrip(input: NewTripInput): Promise<{ id?: string; error?: string }> {
      try {
        const colRef = collection(firestore, this.TRIPS_COLLECTION);
  
        const payload: Omit<TripData, "id"> = {
          ...input,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
  
        const docRef = await addDoc(colRef, payload);
        return { id: docRef.id };
      } catch (e) {
        console.error("TripService.createTrip error:", e);
        return { error: "Falha ao criar viagem" };
      }
    }
  
    /** Atualiza uma viagem */
    static async updateTrip(input: UpdateTripInput): Promise<{ success: boolean; error?: string }> {
      try {
        const { id, ...rest } = input;
        const ref = doc(firestore, this.TRIPS_COLLECTION, id);
        await updateDoc(ref, { ...rest, updatedAt: serverTimestamp() });
        return { success: true };
      } catch (e) {
        console.error("TripService.updateTrip error:", e);
        return { success: false, error: "Falha ao atualizar viagem" };
      }
    }
  
    /** Define/atualiza status da viagem */
    static async setStatus(id: string, status: TripStatus): Promise<{ success: boolean; error?: string }> {
      try {
        const ref = doc(firestore, this.TRIPS_COLLECTION, id);
        await updateDoc(ref, { status, updatedAt: serverTimestamp() });
        return { success: true };
      } catch (e) {
        console.error("TripService.setStatus error:", e);
        return { success: false, error: "Falha ao atualizar status" };
      }
    }
  
    /** Busca viagens do casal (ordenadas por createdAt desc) */
    static async getTripsByCouple(coupleId: string): Promise<TripData[]> {
      try {
        const q = query(
          collection(firestore, this.TRIPS_COLLECTION),
          where("coupleId", "==", coupleId),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        return snap.docs.map((d) => ({ id: d.id, ...(d.data() as TripData) }));
      } catch (e) {
        console.error("TripService.getTripsByCouple error:", e);
        return [];
      }
    }
  
    /** Busca 1 viagem */
    static async getTrip(id: string): Promise<TripData | null> {
      try {
        const ref = doc(firestore, this.TRIPS_COLLECTION, id);
        const d = await getDoc(ref);
        if (!d.exists()) return null;
        return { id: d.id, ...(d.data() as TripData) };
      } catch (e) {
        console.error("TripService.getTrip error:", e);
        return null;
      }
    }
  
    /** Exclui uma viagem */
    static async deleteTrip(id: string): Promise<{ success: boolean; error?: string }> {
      try {
        await deleteDoc(doc(firestore, this.TRIPS_COLLECTION, id));
        return { success: true };
      } catch (e) {
        console.error("TripService.deleteTrip error:", e);
        return { success: false, error: "Falha ao excluir viagem" };
      }
    }
  }
  