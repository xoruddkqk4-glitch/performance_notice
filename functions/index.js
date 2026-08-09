const { getApps, initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const { HttpsError, onCall } = require("firebase-functions/v2/https");

if (!getApps().length) initializeApp();

const ADMIN_UID = "0ejtes6iimOXXkXnwmzDs002rmx1";

/** Permanently deletes an editor's Authentication account and editor profile. */
// Public invocation lets the browser reach the callable endpoint; each handler
// still verifies Firebase Authentication and its own authorization rules.
exports.deleteEditor = onCall({ region: "asia-northeast3", invoker: "public" }, async (request) => {
  if (request.auth?.uid !== ADMIN_UID) {
    throw new HttpsError("permission-denied", "관리자만 입력 권한 계정을 삭제할 수 있습니다.");
  }

  const uid = request.data?.uid;
  if (typeof uid !== "string" || !uid) {
    throw new HttpsError("invalid-argument", "삭제할 사용자 정보가 올바르지 않습니다.");
  }
  if (uid === ADMIN_UID) {
    throw new HttpsError("failed-precondition", "관리자 계정은 이 메뉴에서 삭제할 수 없습니다.");
  }

  await getAuth().deleteUser(uid);
  await getFirestore().doc(`editors/${uid}`).delete();
  return { deletedUid: uid };
});

/** Saves every schedule entry after verifying an administrator or active editor. */
exports.saveSchedules = onCall({ region: "asia-northeast3", invoker: "public" }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "로그인 후 일정을 저장할 수 있습니다.");
  }

  const assessments = request.data?.assessments;
  if (!Array.isArray(assessments)) {
    throw new HttpsError("invalid-argument", "일정 데이터 형식이 올바르지 않습니다.");
  }

  if (uid !== ADMIN_UID) {
    const editor = await getFirestore().doc(`editors/${uid}`).get();
    if (!editor.exists || editor.data()?.active !== true) {
      throw new HttpsError("permission-denied", "입력 권한이 있는 사용자만 일정을 저장할 수 있습니다.");
    }
  }

  await getFirestore().doc("appState/schedules").set({
    assessments,
    updatedAt: new Date().toISOString(),
  });
  return { savedCount: assessments.length };
});
