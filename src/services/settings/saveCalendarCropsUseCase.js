import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

export default async function saveCalendarCropsUseCase(uid, cropNames) {
    await setDoc(doc(db, 'users', uid), { calendarCrops: cropNames }, { merge: true });
}
