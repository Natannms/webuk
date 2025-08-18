// services/CoupleService.ts
import { collection_prefix, CoupleData, InviteData, NotificationCouple, UserCoupleData } from '@/types/couples.interfaces';
import {
  addDoc,
  arrayRemove,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import { firestore } from '../firebaseConfig';



export class CoupleService {
  // Collections com prefixo webuk_
  private static NOTIFICATION_COUPLE_COLLECTION = collection_prefix+'notification';
  private static INVITES_COLLECTION = collection_prefix+'invites';
  private static COUPLES_COLLECTION = collection_prefix+'couples';
  private static USER_COUPLES_COLLECTION = collection_prefix+'user_couples';

  /**
   * Convida um parceiro pelo email
   */
  static async invitePartner(
    inviterUserId: string,
    inviterEmail: string,
    invitedEmail: string
  ): Promise<{ success: boolean; error?: string; inviteId?: string }> {
    try {
      // Verificar se o usuário já está em um casal
      const userInCouple = await this.isUserInCouple(inviterUserId);
      if (userInCouple.inCouple) {
        return { success: false, error: 'Você já faz parte de um casal' };
      }

      // Verificar se já existe um convite pendente para este email
      const existingInvite = await this.getPendingInviteByEmail(invitedEmail);
      if (existingInvite) {
        return { success: false, error: 'Já existe um convite pendente para este email' };
      }

      // Verificar se não está convidando a si mesmo
      if (inviterEmail.toLowerCase() === invitedEmail.toLowerCase()) {
        return { success: false, error: 'Você não pode convidar a si mesmo' };
      }

      // Criar o convite
      const inviteData: InviteData = {
        inviterUserId,
        inviterEmail: inviterEmail.toLowerCase(),
        invitedEmail: invitedEmail.toLowerCase(),
        status: 'pending',
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
      };

      const docRef = await addDoc(
        collection(firestore, this.INVITES_COLLECTION),
        inviteData
      );

      return {
        success: true,
        inviteId: docRef.id
      };

    } catch (error) {
      console.error('Erro ao convidar parceiro:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Verifica se existe convite pendente para um email
   */
  static async getPendingInviteByEmail(email: string): Promise<InviteData | null> {
    try {
      const q = query(
        collection(firestore, this.INVITES_COLLECTION),
        where('invitedEmail', '==', email.toLowerCase()),
        where('status', '==', 'pending')
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as InviteData;

    } catch (error) {
      console.error('Erro ao buscar convite pendente:', error);
      return null;
    }
  }

  /**
   * Aceita um convite pendente
   */
  static async acceptInvite(
    userId: string,
    userEmail: string
  ): Promise<{ success: boolean; error?: string; coupleId?: string }> {
    try {
      // Verificar se o usuário já está em um casal
      const userInCouple = await this.isUserInCouple(userId);
      if (userInCouple.inCouple) {
        return { success: false, error: 'Você já faz parte de um casal' };
      }

      // Buscar convite pendente para este email
      const pendingInvite = await this.getPendingInviteByEmail(userEmail);
      if (!pendingInvite || !pendingInvite.id) {
        return { success: false, error: 'Convite não encontrado' };
      }

      // Verificar se o convite não expirou
      const now = new Date();
      const expiresAt = pendingInvite.expiresAt.toDate();
      if (now > expiresAt) {
        // Marcar convite como expirado
        await updateDoc(
          doc(firestore, this.INVITES_COLLECTION, pendingInvite.id),
          { status: 'expired' }
        );
        return { success: false, error: 'Convite expirado' };
      }

      // Criar o casal
      const coupleId = await this.createCouple(pendingInvite.inviterUserId, userId);
      if (!coupleId) {
        return { success: false, error: 'Erro ao criar casal' };
      }

      // Marcar convite como aceito
      await updateDoc(
        doc(firestore, this.INVITES_COLLECTION, pendingInvite.id),
        {
          status: 'accepted',
          acceptedAt: serverTimestamp()
        }
      );

      return {
        success: true,
        coupleId
      };

    } catch (error) {
      console.error('Erro ao aceitar convite:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }
 /**
  * notifica ao parceiro
  */
 private static async notificationCouple(creatorUserId:string, notification:NotificationCouple): Promise<{error?:string | null}> {
  try {
    await setDoc(
      doc(firestore, this.NOTIFICATION_COUPLE_COLLECTION, creatorUserId),
      notification
    );
    return {error: null}
  } catch (error) {
    console.error('Falha em notificação:', error);
    return {error: "Falha em notificação"};
  }
}
  /**
   * Cria um novo casal
   */
  private static async createCouple(creatorUserId: string, memberUserId: string): Promise<string | null> {
    try {
      // Gerar ID único para o casal
      const coupleId = this.generateCoupleId();

      // Criar documento do casal
      const coupleData: CoupleData = {
        coupleId,
        members: [creatorUserId, memberUserId],
        createdBy: creatorUserId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'active',
        settings: {
          sharedMedications: true,
          sharedReminders: true,
          crossNotifications: true
        }
      };

      await setDoc(
        doc(firestore, this.COUPLES_COLLECTION, coupleId),
        coupleData
      );

      // Criar registros de user-couple para ambos os usuários
      await this.addUserToCouple(creatorUserId, coupleId, 'creator');
      await this.addUserToCouple(memberUserId, coupleId, 'member');

      return coupleId;

    } catch (error) {
      console.error('Erro ao criar casal:', error);
      return null;
    }
  }

  /**
   * Adiciona usuário ao casal
   */
  private static async addUserToCouple(
    userId: string,
    coupleId: string,
    role: 'creator' | 'member'
  ): Promise<void> {
    const userCoupleData: UserCoupleData = {
      userId,
      coupleId,
      role,
      joinedAt: serverTimestamp()
    };

    await setDoc(
      doc(firestore, this.USER_COUPLES_COLLECTION, userId),
      userCoupleData
    );
  }

  /**
   * Verifica se usuário está em um casal
   */
  static async isUserInCouple(userId: string): Promise<{ inCouple: boolean; coupleId?: string }> {
    try {
      const userCoupleDoc = await getDoc(
        doc(firestore, this.USER_COUPLES_COLLECTION, userId)
      );

      if (!userCoupleDoc.exists()) {
        return { inCouple: false };
      }

      const data = userCoupleDoc.data() as UserCoupleData;
      return {
        inCouple: true,
        coupleId: data.coupleId
      };

    } catch (error) {
      console.error('Erro ao verificar se usuário está em casal:', error);
      return { inCouple: false };
    }
  }

  /**
   * Busca dados completos do casal
   */
  static async getCoupleData(coupleId: string): Promise<CoupleData | null> {
    try {
      const coupleDoc = await getDoc(
        doc(firestore, this.COUPLES_COLLECTION, coupleId)
      );

      if (!coupleDoc.exists()) {
        return null;
      }

      return {
        id: coupleDoc.id,
        ...coupleDoc.data()
      } as CoupleData;

    } catch (error) {
      console.error('Erro ao buscar dados do casal:', error);
      return null;
    }
  }

  /**
   * Sair do casal
   */
  static async leaveCouple(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const userInCouple = await this.isUserInCouple(userId);
      if (!userInCouple.inCouple || !userInCouple.coupleId) {
        return { success: false, error: 'Usuário não está em um casal' };
      }

      const coupleData = await this.getCoupleData(userInCouple.coupleId);
      if (!coupleData) {
        return { success: false, error: 'Casal não encontrado' };
      }

      // Remover usuário do casal
      await updateDoc(
        doc(firestore, this.COUPLES_COLLECTION, userInCouple.coupleId),
        {
          members: arrayRemove(userId),
          updatedAt: serverTimestamp()
        }
      );

      // Remover registro user-couple
      await deleteDoc(
        doc(firestore, this.USER_COUPLES_COLLECTION, userId)
      );

      // Se o casal ficou vazio, marcar como inativo
      const updatedMembers = coupleData.members.filter(id => id !== userId);
      if (updatedMembers.length === 0) {
        await updateDoc(
          doc(firestore, this.COUPLES_COLLECTION, userInCouple.coupleId),
          { status: 'inactive' }
        );
      }

      return { success: true };

    } catch (error) {
      console.error('Erro ao sair do casal:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Atualizar configurações do casal
   */
  static async updateCoupleSettings(
    coupleId: string,
    settings: Partial<CoupleData['settings']>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await updateDoc(
        doc(firestore, this.COUPLES_COLLECTION, coupleId),
        {
          [`settings.${Object.keys(settings)[0]}`]: Object.values(settings)[0],
          updatedAt: serverTimestamp()
        }
      );

      return { success: true };

    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Buscar convites enviados pelo usuário
   */
  static async getUserSentInvites(userId: string): Promise<InviteData[]> {
    try {
      const q = query(
        collection(firestore, this.INVITES_COLLECTION),
        where('inviterUserId', '==', userId)
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as InviteData[];

    } catch (error) {
      console.error('Erro ao buscar convites enviados:', error);
      return [];
    }
  }

  /**
   * Cancelar convite pendente
   */
  static async cancelInvite(inviteId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await updateDoc(
        doc(firestore, this.INVITES_COLLECTION, inviteId),
        {
          status: 'expired',
          updatedAt: serverTimestamp()
        }
      );

      return { success: true };

    } catch (error) {
      console.error('Erro ao cancelar convite:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Gera ID único para o casal
   */
  private static generateCoupleId(): string {
    return `couple_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Limpar convites expirados (função utilitária)
   */
  static async cleanExpiredInvites(): Promise<number> {
    try {
      const now = new Date();
      const q = query(
        collection(firestore, this.INVITES_COLLECTION),
        where('status', '==', 'pending')
      );

      const querySnapshot = await getDocs(q);
      let cleanedCount = 0;

      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data() as InviteData;
        if (data.expiresAt.toDate() < now) {
          await updateDoc(
            doc(firestore, this.INVITES_COLLECTION, docSnapshot.id),
            { status: 'expired' }
          );
          cleanedCount++;
        }
      }

      return cleanedCount;

    } catch (error) {
      console.error('Erro ao limpar convites expirados:', error);
      return 0;
    }
  }

  /**
* Busca todos os convites associados a um email (qualquer status)
*/
  static async checkReceivedInvites(email: string): Promise<InviteData[]> {
    try {
      const q = query(
        collection(firestore, this.INVITES_COLLECTION),
        where('invitedEmail', '==', email.toLowerCase()),
        where('status', '==', 'pending')
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return [];
      }

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as InviteData[];

    } catch (error) {
      console.error('Erro ao buscar convites por email:', error);
      return [];
    }
  }

}