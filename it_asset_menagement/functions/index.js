const { setGlobalOptions } = require("firebase-functions");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();

setGlobalOptions({ maxInstances: 10, region: "asia-southeast1" });

const TEAMS_WEBHOOK_URL =
  "https://defaultc172e49cae364c49b87c48a1df2152.f5.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/ac2ec09d843f4350bc32f4b44bb814e3/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=m0KGvHLiOsKCGd_POzaRQkwRMXFEa8rS_eAcs4Msz_c";

async function sendTeamsCard(title, color, facts) {
  const card = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          body: [
            {
              type: "Container",
              style: "emphasis",
              items: [
                {
                  type: "TextBlock",
                  text: title,
                  weight: "Bolder",
                  size: "Medium",
                  color: color,
                  wrap: true,
                },
              ],
            },
            {
              type: "FactSet",
              facts: facts.map((f) => ({ title: f.label, value: f.value })),
            },
            {
              type: "TextBlock",
              text: `🕐 ${new Date().toLocaleString("th-TH", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "Asia/Bangkok",
              })}`,
              size: "Small",
              isSubtle: true,
              spacing: "Small",
            },
          ],
        },
      },
    ],
  };

  const fetch = (await import("node-fetch")).default;
  const res = await fetch(TEAMS_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(card),
  });

  if (!res.ok) {
    throw new Error(`Teams webhook failed: ${res.status} ${await res.text()}`);
  }
}

// ── แจ้งเตือนเมื่อมีการแจ้งซ่อมใหม่ ──
exports.notifyRepairRequest = onDocumentCreated(
  "repair_requests/{docId}",
  async (event) => {
    const data = event.data.data();
    await sendTeamsCard("🔧 แจ้งปัญหา IT / แจ้งซ่อม", "Accent", [
      { label: "พนักงาน", value: `${data.empName} (${data.empId})` },
      { label: "แผนก", value: data.department || "-" },
      { label: "อุปกรณ์ / ปัญหา", value: data.assetName },
      { label: "อาการที่พบ", value: data.issue },
    ]);
  }
);

// ── แจ้งเตือนเมื่อมีคำขอเบิกอุปกรณ์ใหม่ ──
exports.notifySupplyRequest = onDocumentCreated(
  "supply_requests/{docId}",
  async (event) => {
    const data = event.data.data();
    await sendTeamsCard("📦 คำขอเบิกอุปกรณ์สำนักงาน", "Good", [
      { label: "พนักงาน", value: `${data.empName} (${data.empId})` },
      { label: "แผนก", value: data.department || "-" },
      { label: "อุปกรณ์ที่ขอเบิก", value: data.supplyName },
      { label: "จำนวน", value: `${data.requestedQty} ชิ้น` },
      { label: "หมายเหตุ", value: data.note || "-" },
    ]);
  }
);

// ── ตั้ง/รีเซ็ตรหัสผ่านให้บัญชีผู้ใช้ (SuperAdmin หรือ admin ที่มีสิทธิ์จัดการรหัสผ่าน) ──
exports.setUserPassword = onCall(async (request) => {
  const callerUid = request.auth && request.auth.uid;
  if (!callerUid) {
    throw new HttpsError("unauthenticated", "ต้องเข้าสู่ระบบก่อน");
  }

  const { targetUid, newPassword } = request.data || {};
  if (!targetUid || typeof newPassword !== "string" || newPassword.length < 6) {
    throw new HttpsError(
      "invalid-argument",
      "ข้อมูลไม่ถูกต้อง (รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร)"
    );
  }

  const dbRef = admin.firestore();

  // ตรวจสิทธิ์ผู้เรียก
  const callerSnap = await dbRef.collection("admin_users").doc(callerUid).get();
  if (!callerSnap.exists) {
    throw new HttpsError("permission-denied", "ไม่มีสิทธิ์ดำเนินการ");
  }
  const caller = callerSnap.data();
  const callerIsSuperAdmin = caller.isSuperAdmin === true;
  const callerCanManage =
    callerIsSuperAdmin || (caller.permissions && caller.permissions.canManagePasswords === true);
  if (!callerCanManage) {
    throw new HttpsError("permission-denied", "ไม่มีสิทธิ์รีเซ็ตรหัสผ่าน");
  }

  // ห้าม admin ที่ไม่ใช่ SuperAdmin ไปรีเซ็ตรหัสผ่านของ SuperAdmin
  const targetSnap = await dbRef.collection("admin_users").doc(targetUid).get();
  if (
    targetSnap.exists &&
    targetSnap.data().isSuperAdmin === true &&
    !callerIsSuperAdmin
  ) {
    throw new HttpsError(
      "permission-denied",
      "ไม่สามารถรีเซ็ตรหัสผ่านของ SuperAdmin ได้"
    );
  }

  try {
    await admin.auth().updateUser(targetUid, { password: newPassword });
  } catch (err) {
    throw new HttpsError("internal", "ตั้งรหัสผ่านไม่สำเร็จ: " + err.message);
  }

  return { success: true };
});
