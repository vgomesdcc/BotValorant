import { Discord, On } from "discordx";
import { initializeApp } from 'firebase/app';
import { query, orderBy, limit, DocumentData, getFirestore, collection, getDocs, CollectionReference, doc, setDoc, addDoc, deleteDoc } from 'firebase/firestore/lite';
import { UserInfo } from "./models/userInfo.js";
import { Global } from "../global/global.js";

@Discord()
export class Firebase {
    static users: UserInfo[] = [];
    private static usersRef: CollectionReference<DocumentData> | null = null;
    private static isInitialized = false;

    private static onInit: (() => void)[] = [];

    static addOnInitCallback(callback: () => void) {
        if (Firebase.isInitialized) {
            callback();
        } else {
            Firebase.onInit.push(callback);
        }
    }

    @On({ event: "ready" })
    async onReady() {
        // await Firebase.initDb();
    }

    static async addUser(userInfo: UserInfo) {
        if (Firebase.usersRef) {
            await setDoc(doc(Firebase.usersRef!, `${userInfo.id}`), userInfo.toFirestore());
            const user = Firebase.users.find(u => u.id === userInfo.id);
            if (!user) {
                Firebase.users.push(userInfo);
            } else {
                const index = Firebase.users.findIndex(u => u.id === userInfo.id);
                Firebase.users[index] = userInfo;
            }
        }
    }

    static getUser(id: string): UserInfo | undefined {
        return Firebase.users.find(u => u.id === id);
    }

    static async removeUser(id: string) {
        if (Firebase.usersRef) {
            await deleteDoc(doc(Firebase.usersRef, id));
        }
    }

    private static async initDb() {
        const firebaseConfig = {
            apiKey: "",
            authDomain: "",
            projectId: "",
            storageBucket: "",
            messagingSenderId: "",
            appId: "",
            measurementId: ""
        };
        const firebaseApp = initializeApp(firebaseConfig);
        const firestoreDb = getFirestore(firebaseApp);
        const serverId = Global.SERVER_ID;
        Firebase.usersRef = collection(firestoreDb, "servers", serverId, "users");
        const userDocs = await getDocs(Firebase.usersRef);
        userDocs.forEach(doc => {
            const userInfo = UserInfo.fromFirestore(doc);
            Firebase.users.push(userInfo);
        });
        console.log("Firebase initialized");
        Firebase.isInitialized = true;
        Firebase.onInit.forEach(callback => callback());
    }
}