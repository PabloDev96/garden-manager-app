import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../../config/firebase';

const subscribeAlertsUseCase = (uid, onData, onError) => {
    const q = query(collection(db, 'users', uid, 'alerts'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snap) => {
        const items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        onData(items);
    }, onError);
};

export default subscribeAlertsUseCase;