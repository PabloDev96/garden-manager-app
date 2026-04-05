import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

export default async function getCalendarCropsUseCase(uid) {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.data()?.calendarCrops ?? [];
}
