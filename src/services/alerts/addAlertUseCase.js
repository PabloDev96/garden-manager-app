import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';

const addAlertUseCase = async (uid, alert) => {
    await addDoc(collection(db, 'users', uid, 'alerts'), {
        ...alert,
        createdAt: serverTimestamp(),
    });
};

export default addAlertUseCase;