export interface InviteData {
    id?: string;
    inviterUserId: string;
    inviterEmail: string;
    invitedEmail: string;
    status: 'pending' | 'accepted' | 'expired';
    createdAt: any;
    acceptedAt?: any;
    expiresAt: any;
  }
  
  export interface CoupleData {
    id?: string;
    coupleId: string;
    members: string[];
    createdBy: string;
    createdAt: any;
    updatedAt: any;
    status: 'active' | 'inactive';
    settings: {
      sharedMedications: boolean;
      sharedReminders: boolean;
      crossNotifications: boolean;
    };
  }
  
  export interface UserCoupleData {
    userId: string;
    coupleId: string;
    role: 'creator' | 'member';
    joinedAt: any;
  }
  interface CheckInviteResult {
    exists: boolean;
    invites?: any[];
    error?: string;
  }
  export interface NotificationCouple {
    message: string
    status: 'read' | 'pending'
    senderId: string
    senderEmail?: string
    coupleId?: string
  }

  export const collection_prefix = "webuk_"