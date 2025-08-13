import { collection, query, where, getDocs, addDoc } from "firebase/firestore";

import { db } from './firebase';


export const getUserByPhone = async (phone: string) => {
    try {
        const q = query(
            collection(db, 'profiles'),
            where('phoneNumber', '==', phone)
        );
        const querySnapshot = await getDocs(q);
        let users:any = [];
        querySnapshot.forEach((doc) => {
            users.push({ id: doc.id, ...doc.data() });
        });
        return users[0];
    } catch (error) {
        return null;
        
    }
}

export const createANewTransactionRequest = async (transactionData: any) => {
    try {
        const transactionRef = collection(db, 'transactions');
        const docRef = await addDoc(transactionRef, transactionData);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error creating transaction:', error);
        return { success: false, error: 'Failed to create transaction' };
    }       
}