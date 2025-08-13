import { collection, query, where, getDocs, addDoc, orderBy } from "firebase/firestore";

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
        const transactionRef = collection(db, 'tranferReferRequests');
        const docRef = await addDoc(transactionRef, transactionData);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error creating transaction:', error);
        return { success: false, error: 'Failed to create transaction' };
    }       
}

export const fetchAllTransactionsByUser = async (userId: string,) => {
    try {
        const q = query(
            collection(db, 'transactions'),
            where('senderId', '==', userId)
        );
        const querySnapshot = await getDocs(q);
        let transactions:any = [];
        querySnapshot.forEach((doc) => {
            transactions.push({ id: doc.id, ...doc.data() });
        });
        return transactions;
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }
}

export const fetchAllTransactionsForUser = async (userId: string) => {
    try {
        const q = query(
            collection(db, 'transferRequests'),
            where('recipientId', '==', userId),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        let transactions:any = [];
        querySnapshot.forEach((doc) => {
            transactions.push({ id: doc.id, ...doc.data() });
        });
        return transactions;
    } catch (error) {
        console.error('Error fetching recipient transactions:', error);
        return [];
    }
}

export const fetchTransactionsByStatus = async (userId: string, status: string) => {
    try {
        const q = query(
            collection(db, 'transactions'),
            where('senderId', '==', userId),
            where('status', '==', status)
        );
        const querySnapshot = await getDocs(q);
        let transactions:any = [];
        querySnapshot.forEach((doc) => {
            transactions.push({ id: doc.id, ...doc.data() });
        });
        return transactions;
    } catch (error) {
        console.error('Error fetching transactions by status:', error);
        return [];
    }
}