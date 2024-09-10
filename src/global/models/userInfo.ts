import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore/lite';

export class UserInfo {
    constructor(
        public readonly id: string,
    ) { }

    toFirestore(): DocumentData {
        return {
            id: this.id,
        };
    }

    static fromFirestore(
        snapshot: QueryDocumentSnapshot
    ): UserInfo {
        const data = snapshot.data();
        return new UserInfo(
            data.id,
        );
    }
}