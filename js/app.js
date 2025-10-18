// ==================== GLOBAL VARIABLES ====================
let editingActivityId = null;

// ==================== SYSTEM INITIALIZATION ====================
document.addEventListener("DOMContentLoaded", function () {
  loadAnnouncements();
  loadSavedData();
  loadActivities();
  loadUserProfile();
  setDailyReminder();

  // Event listeners
  document
    .getElementById("userLocation")
    .addEventListener("change", handleUserLocationChange);

  // Set default datetime
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  document.getElementById("activityDateTime").value = now
    .toISOString()
    .slice(0, 16);
});

// ==================== PROFIL SYSTEM ====================
function saveUserProfile() {
  const userName = document.getElementById("userName").value.trim();
  const locationSelect = document.getElementById("userLocation").value;
  const customLocation = document.getElementById("customUserLocation").value;

  const finalLocation =
    locationSelect === "Lainnya" ? customLocation : locationSelect;

  if (userName) {
    localStorage.setItem("userName", userName);
    localStorage.setItem("userLocation", finalLocation);
    showNotification(
      `Profil disimpan! 👤 ${userName} | 📍 ${
        finalLocation || "Belum dipilih"
      }`,
      "success"
    );
  } else {
    showNotification("Nama wajib diisi!", "error");
  }
}

function handleUserLocationChange() {
  const locationSelect = document.getElementById("userLocation");
  const customLocation = document.getElementById("customUserLocation");

  if (locationSelect.value === "Lainnya") {
    customLocation.style.display = "block";
    customLocation.required = true;
  } else {
    customLocation.style.display = "none";
    customLocation.required = false;
  }
}

function loadUserProfile() {
  const savedName = localStorage.getItem("userName");
  const savedLocation = localStorage.getItem("userLocation");

  if (savedName) {
    document.getElementById("userName").value = savedName;
  }

  if (savedLocation) {
    const locationSelect = document.getElementById("userLocation");
    const optionExists = Array.from(locationSelect.options).some(
      (option) => option.value === savedLocation
    );

    if (optionExists && savedLocation !== "Lainnya") {
      locationSelect.value = savedLocation;
    } else if (savedLocation && savedLocation !== "Lainnya") {
      locationSelect.value = "Lainnya";
      document.getElementById("customUserLocation").value = savedLocation;
      document.getElementById("customUserLocation").style.display = "block";
    }
  }
}

function useDefaultLocation() {
  const defaultLocation = localStorage.getItem("userLocation");
  if (defaultLocation) {
    document.getElementById("activityLocation").value = defaultLocation;
    showNotification(
      `Lokasi default diterapkan: ${defaultLocation}`,
      "success"
    );
  } else {
    showNotification("Belum setting lokasi default di profil!", "error");
  }
}

// ==================== ABSENSI SYSTEM ====================
function checkIn() {
  const now = new Date().toLocaleString("id-ID");
  localStorage.setItem("checkInTime", now);

  document.getElementById("status").textContent = `Checked-in: ${now}`;
  document.getElementById("checkInBtn").disabled = true;
  document.getElementById("checkOutBtn").disabled = false;

  showNotification("CHECK-IN BERHASIL! 🟢", "success");
}

function checkOut() {
  const now = new Date().toLocaleString("id-ID");
  localStorage.setItem("checkOutTime", now);

  document.getElementById("status").textContent += ` | Checked-out: ${now}`;
  document.getElementById("checkOutBtn").disabled = true;

  showNotification("CHECK-OUT BERHASIL! 🔴", "success");
}

// ==================== KEGIATAN HARIAN SYSTEM ====================
function addActivity() {
  if (editingActivityId) {
    if (!confirm("Sedang mode edit! Batalkan edit dan tambah baru?")) {
      return;
    }
    resetActivityForm();
  }

  const datetime = document.getElementById("activityDateTime").value;
  const name = document.getElementById("activityName").value.trim();
  const person = document.getElementById("activityPerson").value.trim();
  const activityLocation = document
    .getElementById("activityLocation")
    .value.trim();
  const note = document.getElementById("activityNote").value.trim();

  if (!datetime || !name) {
    showNotification("Waktu dan Nama Kegiatan wajib diisi! 📝", "error");
    return;
  }

  const formattedDate = formatDateTime(datetime);

  const activity = {
    id: Date.now(),
    datetime: formattedDate,
    name: name,
    person: person || "-",
    location:
      activityLocation ||
      localStorage.getItem("userLocation") ||
      "Tidak ditentukan",
    note: note || "-",
  };

  saveActivityToStorage(activity);
  addActivityToTable(activity);
  resetActivityForm();

  showNotification("Kegiatan berhasil ditambahkan! ✅", "success");
}

function formatDateTime(datetimeString) {
  const date = new Date(datetimeString);
  return date.toLocaleString("id-ID", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function saveActivityToStorage(activity) {
  const existingActivities = JSON.parse(
    localStorage.getItem("dailyActivities") || "[]"
  );
  existingActivities.push(activity);
  localStorage.setItem("dailyActivities", JSON.stringify(existingActivities));
}

function addActivityToTable(activity) {
  const tbody = document.getElementById("activityBody");

  const row = document.createElement("tr");
  row.innerHTML = `
        <td>${activity.datetime}</td>
        <td>${activity.name}</td>
        <td>${activity.person}</td>
        <td>${activity.location}</td>
        <td>${activity.note}</td>
        <td>
            <button onclick="editActivity(${activity.id})" class="action-btn btn-edit">✏️</button>
            <button onclick="deleteActivity(${activity.id})" class="action-btn btn-delete">🗑️</button>
        </td>
    `;

  tbody.appendChild(row);
}

function loadActivities() {
  const activities = JSON.parse(
    localStorage.getItem("dailyActivities") || "[]"
  );
  document.getElementById("activityBody").innerHTML = "";
  activities.forEach((activity) => {
    addActivityToTable(activity);
  });
}

function editActivity(activityId) {
  const activities = JSON.parse(
    localStorage.getItem("dailyActivities") || "[]"
  );
  const activity = activities.find((a) => a.id === activityId);

  if (!activity) {
    showNotification("Kegiatan tidak ditemukan!", "error");
    return;
  }

  try {
    const date = new Date(activity.datetime);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    const formattedForInput = `${year}-${month}-${day}T${hours}:${minutes}`;
    document.getElementById("activityDateTime").value = formattedForInput;
  } catch (e) {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById("activityDateTime").value = now
      .toISOString()
      .slice(0, 16);
  }

  document.getElementById("activityName").value = activity.name;
  document.getElementById("activityPerson").value = activity.person;
  document.getElementById("activityLocation").value = activity.location;
  document.getElementById("activityNote").value = activity.note;

  editingActivityId = activityId;

  const addButton = document.querySelector('button[onclick="addActivity()"]');
  addButton.textContent = "UPDATE KEGIATAN ✅";
  addButton.setAttribute("onclick", "updateActivity()");
  addButton.style.background = "#28a745";

  showNotification("Edit mode: Ubah data dan tekan UPDATE", "warning");
}

function updateActivity() {
  if (!editingActivityId) {
    showNotification("Tidak ada kegiatan yang diedit!", "error");
    return;
  }

  const datetime = document.getElementById("activityDateTime").value;
  const name = document.getElementById("activityName").value.trim();
  const person = document.getElementById("activityPerson").value.trim();
  const activityLocation = document
    .getElementById("activityLocation")
    .value.trim();
  const note = document.getElementById("activityNote").value.trim();

  if (!datetime || !name) {
    showNotification("Waktu dan Nama Kegiatan wajib diisi! 📝", "error");
    return;
  }

  const formattedDate = formatDateTime(datetime);

  const activities = JSON.parse(
    localStorage.getItem("dailyActivities") || "[]"
  );
  const activityIndex = activities.findIndex((a) => a.id === editingActivityId);

  if (activityIndex !== -1) {
    activities[activityIndex] = {
      id: editingActivityId,
      datetime: formattedDate,
      name: name,
      person: person || "-",
      location: activityLocation || "Tidak ditentukan",
      note: note || "-",
    };

    localStorage.setItem("dailyActivities", JSON.stringify(activities));
    loadActivities();
    resetActivityForm();

    showNotification("Kegiatan berhasil diupdate! ✅", "success");
  } else {
    showNotification("Kegiatan tidak ditemukan!", "error");
  }

  editingActivityId = null;
}

function deleteActivity(activityId) {
  const activities = JSON.parse(
    localStorage.getItem("dailyActivities") || "[]"
  );
  const filteredActivities = activities.filter((a) => a.id !== activityId);
  localStorage.setItem("dailyActivities", JSON.stringify(filteredActivities));
  loadActivities();
  showNotification("Kegiatan dihapus! 🗑️", "success");
}

function clearAllActivities() {
  if (confirm("Yakin hapus semua kegiatan?")) {
    localStorage.removeItem("dailyActivities");
    document.getElementById("activityBody").innerHTML = "";
    showNotification("Semua kegiatan dihapus! 🗑️", "success");
  }
}

function resetActivityForm() {
  document.getElementById("activityDateTime").value = "";
  document.getElementById("activityName").value = "";
  document.getElementById("activityPerson").value = "";
  document.getElementById("activityLocation").value = "";
  document.getElementById("activityNote").value = "";

  const addButton = document.querySelector(
    'button[onclick="updateActivity()"]'
  );
  if (addButton) {
    addButton.textContent = "TAMBAH KEGIATAN ➕";
    addButton.setAttribute("onclick", "addActivity()");
    addButton.style.background = "";
  }

  editingActivityId = null;

  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  document.getElementById("activityDateTime").value = now
    .toISOString()
    .slice(0, 16);
}

// ==================== TASK MANAGER ====================
function addTask() {
  const taskInput = document.getElementById("taskInput");
  const task = taskInput.value.trim();

  if (!task) {
    showNotification("Tulis tugasnya dong bro! ✍️", "error");
    return;
  }

  const taskList = document.getElementById("taskList");
  const li = document.createElement("li");
  li.innerHTML = `
        <span>📌 ${task}</span>
        <button onclick="completeTask(this)">SELESAI ✅</button>
    `;

  taskList.appendChild(li);
  taskInput.value = "";
  showNotification("Tugas ditambahkan! 🎯", "success");
}

function completeTask(button) {
  const li = button.parentElement;
  li.style.opacity = "0.6";
  li.style.textDecoration = "line-through";
  button.textContent = "DIHAPUS ❌";
  button.onclick = function () {
    li.remove();
  };
}

// ==================== PENGUMUMAN SYSTEM ====================
async function loadAnnouncements() {
  try {
    showNotification("Memuat pengumuman...", "info");

    const dummyAnnouncements = [
      "Selamat datang di PKL Tracker!",
      "Jangan lupa check-in setiap hari",
      "Deadline laporan minggu depan",
      "Meeting rutin setiap Jumat jam 10:00",
    ];

    displayAnnouncements(dummyAnnouncements);
    showNotification("Pengumuman loaded! ✅", "success");
  } catch (error) {
    console.log("Gagal load pengumuman, pake data default");
    displayAnnouncements([
      "📢 Sistem pengumuman aktif!",
      "✅ Fitur PKL Tracker siap digunakan",
      "👨‍💼 Jangan lupa kirim laporan harian",
    ]);
  }
}

function displayAnnouncements(announcements) {
  const list = document.getElementById("announcementList");

  if (announcements.length > 0) {
    list.innerHTML = announcements
      .map((msg) => `<div>📢 ${msg}</div>`)
      .join("");
  } else {
    list.innerHTML = "<p>Tidak ada pengumuman baru</p>";
  }
}

// ==================== LAPORAN SYSTEM ====================
function generateDailyReport() {
  const today = new Date().toLocaleDateString("id-ID");
  const activities = JSON.parse(
    localStorage.getItem("dailyActivities") || "[]"
  );
  const checkIn = localStorage.getItem("checkInTime") || "Belum check-in";
  const checkOut = localStorage.getItem("checkOutTime") || "Belum check-out";
  const userName = localStorage.getItem("userName") || "Peserta PKL";
  const userLocation = localStorage.getItem("userLocation") || "Belum diatur";

  const activitiesReport =
    activities.length > 0
      ? activities
          .map(
            (act) =>
              `⏰ ${act.datetime}\n   📝 ${act.name}\n   👤 ${
                act.person
              }\n   📍 ${act.location || "Tidak ditentukan"}\n   📋 ${act.note}`
          )
          .join("\n\n")
      : "Tidak ada kegiatan tercatat";

  return `
LAPORAN HARIAN PKL - ${today}

👤 PESERTA: ${userName}
📍 LOKASI DEFAULT: ${userLocation}

⏰ ABSENSI:
🟢 Check-in: ${checkIn}
🔴 Check-out: ${checkOut}

📋 AKTIVITAS:
${activitiesReport}

✅ TUGAS SELESAI:
${getCompletedTasks()}

---
*PKL Tracker App*
    `.trim();
}

function generateDetailReport() {
  const today = new Date().toLocaleDateString("id-ID");
  const activities = JSON.parse(
    localStorage.getItem("dailyActivities") || "[]"
  );
  const checkIn = localStorage.getItem("checkInTime") || "Belum check-in";
  const checkOut = localStorage.getItem("checkOutTime") || "Belum check-out";
  const userName = localStorage.getItem("userName") || "Peserta PKL";

  const locationSummary = {};
  activities.forEach((act) => {
    const location = act.location || "Tidak ditentukan";
    locationSummary[location] = (locationSummary[location] || 0) + 1;
  });

  const locationReport =
    Object.keys(locationSummary).length > 0
      ? Object.entries(locationSummary)
          .map(([location, count]) => `   📍 ${location}: ${count} kegiatan`)
          .join("\n")
      : "   Tidak ada data lokasi";

  const activitiesReport =
    activities.length > 0
      ? activities
          .map(
            (act) =>
              `   ⏰ ${act.datetime}\n   📝 ${act.name}\n   👤 ${
                act.person
              }\n   📍 ${act.location || "Tidak ditentukan"}\n   📋 ${
                act.note
              }\n   ───────────────────`
          )
          .join("\n")
      : "   Tidak ada kegiatan tercatat";

  return `
📊 LAPORAN DETAIL PKL
===============================

👤 PESERTA: ${userName}
📅 TANGGAL: ${today}
⏰ WAKTU LAPORAN: ${new Date().toLocaleString("id-ID")}

===============================
⏰ ABSENSI:
===============================
🟢 Check-in: ${checkIn}
🔴 Check-out: ${checkOut}

⏱️ Total Jam Kerja: ${calculateWorkHours(checkIn, checkOut)}

===============================
📈 SUMMARY LOKASI:
===============================
${locationReport}

===============================
📋 DETAIL KEGIATAN:
===============================
${activitiesReport}

===============================
✅ TUGAS YANG DISELESAIKAN:
===============================
${getCompletedTasks()}

===============================
📝 CATATAN:
===============================
Laporan dibuat otomatis oleh PKL Tracker App
Total Kegiatan: ${activities.length} aktivitas

    `.trim();
}

function calculateWorkHours(checkIn, checkOut) {
  if (checkIn === "Belum check-in" || checkOut === "Belum check-out") {
    return "Tidak dapat dihitung";
  }

  try {
    const checkInTime = new Date(checkIn);
    const checkOutTime = new Date(checkOut);
    const diffMs = checkOutTime - checkInTime;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${diffHrs} jam ${diffMins} menit`;
  } catch (e) {
    return "Error menghitung";
  }
}

function getCompletedTasks() {
  const completed = [];
  const taskElements = document.querySelectorAll("#taskList li");

  taskElements.forEach((task) => {
    if (task.style.textDecoration === "line-through") {
      completed.push(task.textContent.replace("SELESAI ✅", "").trim());
    }
  });

  return completed.length > 0
    ? completed.map((task) => `• ${task}`).join("\n")
    : "Tidak ada tugas selesai";
}

function generateAndPreviewReport() {
  const report = generateDailyReport();
  showReportModal(report, "LAPORAN HARIAN");
}

function generateAndPreviewDetailReport() {
  const report = generateDetailReport();
  showReportModal(report, "LAPORAN DETAIL");
}

function showReportModal(report, title) {
  const modal = document.createElement("div");
  modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;

  modal.innerHTML = `
        <div style="
            background: white; 
            padding: 25px; 
            border-radius: 15px; 
            max-width: 500px; 
            max-height: 80vh; 
            overflow-y: auto;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        ">
            <h2 style="margin-top: 0; color: #333; text-align: center;">${title}</h2>
            <div style="
                background: #f8f9fa; 
                padding: 15px; 
                border-radius: 8px; 
                border: 1px solid #ddd;
                font-family: monospace;
                font-size: 11px;
                white-space: pre-wrap;
                max-height: 400px;
                overflow-y: auto;
            ">${report}</div>
            <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center;">
                <button onclick="sendReportToAdmin()" style="
                    padding: 12px 25px; 
                    background: #17a2b8; 
                    color: white; 
                    border: none; 
                    border-radius: 8px; 
                    cursor: pointer;
                    font-weight: bold;
                ">KIRIM KE ADMIN 📧</button>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
                    padding: 12px 25px; 
                    background: #6c757d; 
                    color: white; 
                    border: none; 
                    border-radius: 8px; 
                    cursor: pointer;
                ">TUTUP</button>
            </div>
        </div>
    `;

  document.body.appendChild(modal);
}

function sendReportToAdmin() {
  const report = generateDailyReport();
  const checkIn = localStorage.getItem("checkInTime");
  const activities = JSON.parse(
    localStorage.getItem("dailyActivities") || "[]"
  );

  if (!checkIn) {
    showNotification("Belum check-in hari ini! ❌", "error");
    return;
  }

  if (activities.length === 0) {
    if (!confirm("Belum ada kegiatan yang dicatat. Tetap kirim laporan?")) {
      return;
    }
  }

  const adminEmail = "gar.fariz01@gmail.com";
  const subject = `Laporan PKL - ${new Date().toLocaleDateString("id-ID")} - ${
    localStorage.getItem("userName") || "Peserta PKL"
  }`;
  const mailtoLink = `mailto:${adminEmail}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(report)}`;

  const modal = document.querySelector(
    'div[style*="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8);"]'
  );
  if (modal) modal.remove();

  window.open(mailtoLink, "_blank");
  showNotification(
    "📧 Buka email & kirim ke admin! Jangan lupa tekan SEND!",
    "success"
  );
}

// ==================== REMINDER SYSTEM ====================
function setDailyReminder() {
  const now = new Date();
  const night = new Date();
  night.setHours(20, 0, 0, 0);

  if (now > night) {
    night.setDate(night.getDate() + 1);
  }

  const timeout = night.getTime() - now.getTime();

  setTimeout(() => {
    if (Notification.permission === "granted") {
      new Notification("📋 Waktunya Laporan PKL!", {
        body: "Jangan lupa isi laporan harian dan kirim ke admin!",
        icon: "icon.png",
      });
    }
    showNotification(
      "🔔 REMINDER: Isi laporan harian dan kirim ke admin!",
      "warning"
    );
  }, timeout);
}

// ==================== UTILITIES ====================
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${
          type === "success"
            ? "#28a745"
            : type === "error"
            ? "#dc3545"
            : "#17a2b8"
        };
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 300px;
    `;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 4000);
}

function loadSavedData() {
  const checkInTime = localStorage.getItem("checkInTime");
  const checkOutTime = localStorage.getItem("checkOutTime");

  if (checkInTime) {
    document.getElementById(
      "status"
    ).textContent = `Checked-in: ${checkInTime}`;
    document.getElementById("checkInBtn").disabled = true;
  }

  if (checkOutTime) {
    document.getElementById(
      "status"
    ).textContent += ` | Checked-out: ${checkOutTime}`;
    document.getElementById("checkOutBtn").disabled = true;
  }
}
