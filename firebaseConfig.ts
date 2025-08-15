// config/firebaseConfig.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import * as firebaseAuth from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
const reactNativePersistence = (firebaseAuth as any).getReactNativePersistence;

const firebaseConfig = {
    apiKey: "AIzaSyDFOgYn1PTwllKwRj0fW0c3PD4Er3PEh7U",
    authDomain: "ghrokrealtime.firebaseapp.com",
    databaseURL: "https://ghrokrealtime-default-rtdb.firebaseio.com",
    projectId: "ghrokrealtime",
    storageBucket: "ghrokrealtime.appspot.com",
    messagingSenderId: "536925599617",
    appId: "1:536925599617:web:55a189d7bb29c3ddf71a80",
    measurementId: "G-X2G01WD4PB"
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

const auth = firebaseAuth.initializeAuth(app, {
  persistence: reactNativePersistence(AsyncStorage),
});

export { app, auth, firestore };

