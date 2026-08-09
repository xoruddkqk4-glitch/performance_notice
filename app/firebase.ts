import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBhAJP0BY44UzYU4RDGGzw_jNntNciO32k",
  authDomain: "performance-notice.firebaseapp.com",
  projectId: "performance-notice",
  storageBucket: "performance-notice.firebasestorage.app",
  messagingSenderId: "155882504877",
  appId: "1:155882504877:web:adbbc3bc4da99e4cfb3c24",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const editorApp = getApps().some((item) => item.name === "editor-provisioning")
  ? getApp("editor-provisioning")
  : initializeApp(firebaseConfig, "editor-provisioning");
export const firebaseAuth = getAuth(app);
export const editorProvisioningAuth = getAuth(editorApp);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
export const cloudFunctions = getFunctions(app, "asia-northeast3");

export const ADMIN_UID = "0ejtes6iimOXXkXnwmzDs002rmx1";
export const ADMIN_EMAIL = "taekyungk21@gmail.com";
