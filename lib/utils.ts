import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

/**
 * Adds a member to a group-payment document in Firestore
 * @param groupId - Firestore document ID of the group
 * @param member - GroupMember object
 */
export async function addMemberToGroupPayment(groupId: string, member: {
  id: string;
  name: string;
  phoneNumber: string;
  amount: number;
}) {
  const groupDocRef = doc(db, 'group-payment', groupId);
  await updateDoc(groupDocRef, {
    members: arrayUnion(member),
    totalAmount: member.amount, // This will need to be summed client-side for accuracy
  });
}
import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';

/**
 * Creates a group payment document in Firestore
 * @param group - PaymentGroup object
 * @returns Promise with Firestore document reference
 */
export async function createGroupPayment(group: {
  name: string;
  description: string;
  members: any[];
  totalAmount: number;
  createdAt: Date;
  createdBy: string;
}) {
  const docRef = await addDoc(collection(db, 'group-payment'), {
    ...group,
    createdAt: group.createdAt,
    createdBy: group.createdBy,
  });
  return docRef;
}
export const formatPhoneNumber = (text: string) => {
    // Remove all non-digit characters except +
    let cleaned = text.replace(/[^\d+]/g, '');
    
    // Ensure it starts with +233
    if (!cleaned.startsWith('+233')) {
      if (cleaned.startsWith('233')) {
        cleaned = '+' + cleaned;
      } else if (cleaned.startsWith('0')) {
        cleaned = '+233' + cleaned.substring(1);
      } else if (cleaned.startsWith('+')) {
        // Keep as is
      } else {
        cleaned = '+233' + cleaned;
      }
    }
    
    // Limit to +233 + 9 digits
    if (cleaned.length > 13) {
      cleaned = cleaned.substring(0, 13);
    }
    
    return cleaned;
  };