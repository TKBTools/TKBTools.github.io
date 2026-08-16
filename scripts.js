if (window.location.pathname.endsWith(".html")) {
  const cleanUrl = window.location.pathname.slice(0, -5);
  window.history.replaceState(
    null,
    "",
    cleanUrl + window.location.search + window.location.hash,
  );
}

window.addEventListener("DOMContentLoaded", () => {
  fetch(`${BASE_API}/ping`).catch(() => {});
});

const isTeacherMode = document.getElementById("teacherList") !== null;
const BASE_API = "https://tkbtools-backend.onrender.com/api";
const ENDPOINTS = {
  extractTeachers: `${BASE_API}/extract-teachers`,
  processTeacher: `${BASE_API}/process-teacher`,
  processStudent: `${BASE_API}/process`,
};

const htmlElement = document.documentElement;
const themeInputs = document.querySelectorAll('input[name="theme-select"]');
const lightInput = document.getElementById("theme-light");
const darkInput = document.getElementById("theme-dark");
const osPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const savedTheme =
  localStorage.getItem("selected-theme-mode") ||
  (osPrefersDark ? "dark" : "light");

if (savedTheme === "dark") {
  darkInput.checked = true;
  htmlElement.setAttribute("data-theme", "dark");
} else {
  lightInput.checked = true;
  htmlElement.setAttribute("data-theme", "light");
}

themeInputs.forEach((input) => {
  input.addEventListener("change", (e) => {
    const val = e.target.value;
    htmlElement.setAttribute("data-theme", val);
    localStorage.setItem("selected-theme-mode", val);
  });
});

const fileInput = document.getElementById("pdfFile");
const dropZone = document.getElementById("dropZone");
const fileNameDisplay = document.getElementById("fileNameDisplay");
const classSelectionContainer = document.getElementById(
  "classSelectionContainer",
);
const classInput = document.getElementById("classInput");
const submitContainer = document.getElementById("submitContainer");
const uploadBtn = document.getElementById("uploadBtn");
const loadingBox = document.getElementById("loadingBox");
const resultCard = document.getElementById("resultCard");

dropZone.addEventListener("click", () => fileInput.click());

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  if (e.dataTransfer.files.length > 0) {
    fileInput.files = e.dataTransfer.files;
    fileInput.dispatchEvent(new Event("change"));
  }
});

const enableAfternoon = document.getElementById("enableAfternoon");
const afternoonSetup = document.getElementById("afternoonSetup");
const numPeriodsSelect = document.getElementById("numPeriods");
const STORAGE_KEY = isTeacherMode ? "tkb_saved_data_teacher" : "tkb_saved_data";

function renderAfternoonInputs(numPeriods) {
  for (let day = 2; day <= 7; day++) {
    const container = document.getElementById(`aft_container_${day}`);
    if (!container) continue;

    const existingValues = [];
    for (let i = 1; i <= 6; i++) {
      const input = document.getElementById(`aft_${day}_${i}`);
      existingValues.push(input ? input.value : "");
    }

    container.innerHTML = "";
    for (let i = 1; i <= numPeriods; i++) {
      const input = document.createElement("textarea");
      input.rows = 1;
      input.id = `aft_${day}_${i}`;

      if (numPeriods === 1) {
        input.placeholder = isTeacherMode ? "Ví dụ: 10A1" : "Ví dụ: Toán";
      } else {
        input.placeholder = `Ca ${i}`;
      }

      input.value = existingValues[i - 1] || "";
      container.appendChild(input);
    }
  }
}

function saveLocalData() {
  const tkbData = {
    enabled: enableAfternoon.checked,
    numPeriods: numPeriodsSelect.value,
    targetName: classInput.value,
    times: {},
    subjects: {},
  };

  for (let i = 1; i <= 6; i++) {
    tkbData.times[`start_${i}`] = document.getElementById(`start_${i}`).value;
    tkbData.times[`end_${i}`] = document.getElementById(`end_${i}`).value;
  }

  for (let day = 2; day <= 7; day++) {
    for (let p = 1; p <= 6; p++) {
      const el = document.getElementById(`aft_${day}_${p}`);
      if (el) {
        tkbData.subjects[`aft_${day}_${p}`] = el.value;
      }
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tkbData));
}

enableAfternoon.addEventListener("change", (e) => {
  if (e.target.checked) afternoonSetup.classList.remove("hidden");
  else afternoonSetup.classList.add("hidden");
  saveLocalData();
});

numPeriodsSelect.addEventListener("change", (e) => {
  const selectedNum = parseInt(e.target.value);
  for (let i = 1; i <= 6; i++) {
    const row = document.getElementById(`time_row_${i}`);
    if (i <= selectedNum) row.classList.remove("hidden");
    else row.classList.add("hidden");
  }
  renderAfternoonInputs(selectedNum);
  saveLocalData();
});

afternoonSetup.addEventListener("input", saveLocalData);
classInput.addEventListener("input", saveLocalData);

function loadLocalData() {
  const savedData = localStorage.getItem(STORAGE_KEY);
  if (savedData) {
    const tkbData = JSON.parse(savedData);
    if (tkbData.targetName) {
      classInput.value = tkbData.targetName;
    }
    enableAfternoon.checked = tkbData.enabled;
    if (tkbData.enabled) afternoonSetup.classList.remove("hidden");
    else afternoonSetup.classList.add("hidden");

    numPeriodsSelect.value = tkbData.numPeriods;
    const selectedNum = parseInt(tkbData.numPeriods);
    for (let i = 1; i <= 6; i++) {
      const row = document.getElementById(`time_row_${i}`);
      if (i <= selectedNum) row.classList.remove("hidden");
      else row.classList.add("hidden");
    }

    renderAfternoonInputs(selectedNum);

    for (let i = 1; i <= 6; i++) {
      if (tkbData.times[`start_${i}`])
        document.getElementById(`start_${i}`).value =
          tkbData.times[`start_${i}`];
      if (tkbData.times[`end_${i}`])
        document.getElementById(`end_${i}`).value = tkbData.times[`end_${i}`];
    }

    for (let day = 2; day <= 7; day++) {
      for (let p = 1; p <= selectedNum; p++) {
        if (tkbData.subjects && tkbData.subjects[`aft_${day}_${p}`]) {
          const el = document.getElementById(`aft_${day}_${p}`);
          if (el) el.value = tkbData.subjects[`aft_${day}_${p}`];
        }
      }
    }
  } else {
    renderAfternoonInputs(2);
  }
}
loadLocalData();

fileInput.addEventListener("change", async () => {
  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];

    if (file.type !== "application/pdf") {
      alert("Lỗi: Vui lòng chỉ chọn tệp định dạng PDF!");
      resetFileInput();
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Lỗi: Kích thước tệp quá lớn. Vui lòng chọn tệp dưới 10MB!");
      resetFileInput();
      return;
    }

    if (isTeacherMode) {
      fileNameDisplay.innerText = `📂 Đang quét danh sách giáo viên...`;
      fileNameDisplay.classList.remove("hidden");
      classSelectionContainer.classList.add("hidden");
      submitContainer.classList.add("hidden");

      const formData = new FormData();
      formData.append("file", file);

      try {
        uploadBtn.disabled = true;
        const response = await fetch(ENDPOINTS.extractTeachers, {
          method: "POST",
          body: formData,
        });
        const data = await response.json();

        if (response.ok && data.teachers) {
          cachedFileId = data.file_id;
          const dataList = document.getElementById("teacherList");
          dataList.innerHTML = "";
          data.teachers.forEach((t) => {
            let option = document.createElement("option");
            option.value = t;
            dataList.appendChild(option);
          });

          fileNameDisplay.innerText = `📂 Tệp đã chọn: ${file.name} (Đã tìm thấy ${data.teachers.length} Giáo Viên)`;
          classSelectionContainer.classList.remove("hidden");
          submitContainer.classList.remove("hidden");
        } else {
          alert("Lỗi đọc file: " + data.error);
          resetFileInput();
        }
      } catch (err) {
        alert("Lỗi kết nối máy chủ khi lấy danh sách: " + err);
        resetFileInput();
      } finally {
        uploadBtn.disabled = false;
      }
    } else {
      fileNameDisplay.innerText = `📂 Tệp đã chọn: ${file.name}`;
      fileNameDisplay.classList.remove("hidden");
      classSelectionContainer.classList.remove("hidden");
      submitContainer.classList.remove("hidden");
    }
  } else {
    resetFileInput();
  }
});

let cachedFileId = null;

function resetFileInput() {
  fileInput.value = "";
  fileNameDisplay.classList.add("hidden");
  classSelectionContainer.classList.add("hidden");
  submitContainer.classList.add("hidden");
  cachedFileId = null;
}

let currentPdfUrl = null;
let currentApplyDate = "dd-mm-yyyy";

function b64toBlob(b64Data, contentType = "") {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  return new Blob(byteArrays, { type: contentType });
}

let currentAbortController = null;

uploadBtn.addEventListener("click", async () => {
  if (fileInput.files.length === 0) return;

  const inputName = classInput.value.trim();
  if (!inputName) {
    alert(
      isTeacherMode
        ? "Vui lòng nhập/chọn tên giáo viên!"
        : "Vui lòng nhập tên lớp cần xử lý!",
    );
    return;
  }

  const formData = new FormData();

  if (isTeacherMode) {
    formData.append("teacher_name", inputName);
    if (cachedFileId) {
      formData.append("file_id", cachedFileId);
    } else {
      formData.append("file", fileInput.files[0]);
    }
  } else {
    formData.append("class_name", inputName);
    formData.append("file", fileInput.files[0]);
  }

  if (enableAfternoon.checked) {
    const numPeriods = parseInt(document.getElementById("numPeriods").value);
    const timesArray = [];

    for (let i = 1; i <= numPeriods; i++) {
      const start = document.getElementById(`start_${i}`).value;
      const end = document.getElementById(`end_${i}`).value;
      if (start && end) timesArray.push(`${start} → ${end}`);
      else timesArray.push("—");
    }

    const afternoonData = { times: timesArray, schedule: {} };
    for (let day = 2; day <= 7; day++) {
      const daySubjects = [];
      for (let p = 1; p <= numPeriods; p++) {
        const val = document.getElementById(`aft_${day}_${p}`).value.trim();
        daySubjects.push(val !== "" ? val : "—");
      }
      afternoonData.schedule[day] = daySubjects;
    }
    formData.append("afternoon_data", JSON.stringify(afternoonData));
  }

  uploadBtn.disabled = true;
  submitContainer.classList.add("hidden");
  loadingBox.classList.remove("hidden");
  resultCard.classList.add("hidden");
  currentAbortController = new AbortController();

  const loadingSub = document.querySelector(".loading-sub");
  const coldStartTimer = setTimeout(() => {
    loadingSub.innerText =
      "Máy chủ đang khởi động (có thể mất 30s - 1 phút). Vui lòng đợi và KHÔNG tắt trang...";
    loadingSub.style.color = "var(--accent-color)";
    loadingSub.style.fontWeight = "bold";
  }, 25000);

  try {
    const TARGET_URL = isTeacherMode
      ? ENDPOINTS.processTeacher
      : ENDPOINTS.processStudent;

    let response = await fetch(TARGET_URL, {
      method: "POST",
      body: formData,
      signal: currentAbortController.signal,
    });

    let data;

    if (response.status === 404 && isTeacherMode) {
      data = await response.json();
      if (data.error === "FILE_EXPIRED") {
        formData.delete("file_id");
        formData.append("file", fileInput.files[0]);

        response = await fetch(TARGET_URL, {
          method: "POST",
          body: formData,
          signal: currentAbortController.signal,
        });
        data = await response.json();
      }
    } else {
      data = await response.json();
    }

    clearTimeout(coldStartTimer);

    if (response.ok) {
      if (data.apply_date && data.apply_date !== "dd/mm/yyyy") {
        currentApplyDate = data.apply_date.replace(/\//g, "-");
      } else {
        currentApplyDate = "dd-mm-yyyy";
      }

      document.getElementById("shortText").value = data.shortened_text;
      document.getElementById("tkbImage").src =
        "data:image/png;base64," + data.image_base64;

      if (currentPdfUrl) URL.revokeObjectURL(currentPdfUrl);
      const pdfBlob = b64toBlob(data.pdf_base64, "application/pdf");
      currentPdfUrl = URL.createObjectURL(pdfBlob);

      resultCard.classList.remove("hidden");
      resultCard.scrollIntoView({ behavior: "smooth" });
    } else {
      alert("Lỗi từ máy chủ: " + data.error);
      submitContainer.classList.remove("hidden");
    }
  } catch (error) {
    clearTimeout(coldStartTimer);

    if (error.name === "AbortError") {
      console.log("Tiến trình đã bị người dùng hủy.");
      return;
    }

    alert("Không thể kết nối đến máy chủ: " + error);
    submitContainer.classList.remove("hidden");
  } finally {
    loadingBox.classList.add("hidden");
    uploadBtn.disabled = false;
    loadingSub.innerText = "Vui lòng đợi...";
    loadingSub.style.color = "var(--text-secondary)";
    loadingSub.style.fontWeight = "normal";
  }
});

document.getElementById("copyBtn").addEventListener("click", () => {
  const textToCopy = document.getElementById("shortText");
  textToCopy.select();
  navigator.clipboard.writeText(textToCopy.value).then(() => {
    const copyBtn = document.getElementById("copyBtn");
    copyBtn.innerText = "Đã sao chép! ✓";
    setTimeout(() => (copyBtn.innerText = "Sao chép"), 2000);
  });
});

document.getElementById("downloadBtn").addEventListener("click", () => {
  const imgUrl = document.getElementById("tkbImage").src;
  const downloadLink = document.createElement("a");
  downloadLink.href = imgUrl;

  downloadLink.download = `TKB_${currentApplyDate}.png`;

  downloadLink.click();
});

document.getElementById("downloadPdfBtn").addEventListener("click", () => {
  if (!currentPdfUrl) {
    alert("Chưa có file TKB để tải!");
    return;
  }
  const a = document.createElement("a");
  a.href = currentPdfUrl;

  a.download = `TKB_${currentApplyDate}.pdf`;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

document.getElementById("printBtn").addEventListener("click", () => {
  if (!currentPdfUrl) {
    alert("Chưa có file TKB để in!");
    return;
  }

  let printFrame = document.getElementById("__printFrame");
  if (!printFrame) {
    printFrame = document.createElement("iframe");
    printFrame.id = "__printFrame";
    printFrame.style.cssText =
      "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;";
    document.body.appendChild(printFrame);
  }

  printFrame.onload = () => {
    try {
      printFrame.contentWindow.focus();
      printFrame.contentWindow.print();
    } catch (e) {
      const fallback = window.open(currentPdfUrl, "_blank");
      if (!fallback) {
        alert("Vui lòng cho phép Pop-up để mở cửa sổ in!");
      }
    }
  };
  printFrame.src = currentPdfUrl;
});

(function () {
  const previewImg = document.getElementById("tkbImage");
  const overlay = document.getElementById("lightboxOverlay");
  const lightboxImg = document.getElementById("lightboxImg");
  const closeBtn = document.getElementById("lightboxClose");

  if (!previewImg || !overlay || !lightboxImg || !closeBtn) return;

  const MIN_SCALE = 1;
  const MAX_SCALE = 4;

  let scale = 1;
  let originX = 0;
  let originY = 0;
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let lastTouchDist = null;

  function applyTransform() {
    lightboxImg.style.transform = `translate(${originX}px, ${originY}px) scale(${scale})`;
  }

  function resetTransform() {
    scale = 1;
    originX = 0;
    originY = 0;
    applyTransform();
  }

  function openLightbox() {
    if (!previewImg.src) return;
    lightboxImg.src = previewImg.src;
    resetTransform();
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    overlay.classList.remove("active");
    document.body.style.overflow = "";
    resetTransform();
  }

  previewImg.addEventListener("click", openLightbox);
  closeBtn.addEventListener("click", closeLightbox);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("active"))
      closeLightbox();
  });

  overlay.addEventListener(
    "wheel",
    (e) => {
      if (!overlay.classList.contains("active")) return;
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.15 : -0.15;
      scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale + delta));
      if (scale === MIN_SCALE) {
        originX = 0;
        originY = 0;
      }
      applyTransform();
    },
    { passive: false },
  );

  lightboxImg.addEventListener("mousedown", (e) => {
    if (scale === MIN_SCALE) return;
    isDragging = true;
    lightboxImg.classList.add("dragging");
    startX = e.clientX - originX;
    startY = e.clientY - originY;
  });
  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    originX = e.clientX - startX;
    originY = e.clientY - startY;
    applyTransform();
  });
  window.addEventListener("mouseup", () => {
    isDragging = false;
    lightboxImg.classList.remove("dragging");
  });

  function getTouchDist(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  }

  overlay.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length === 2) {
        lastTouchDist = getTouchDist(e.touches);
      } else if (e.touches.length === 1 && scale > MIN_SCALE) {
        isDragging = true;
        startX = e.touches[0].clientX - originX;
        startY = e.touches[0].clientY - originY;
      }
    },
    { passive: false },
  );

  overlay.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length === 2 && lastTouchDist !== null) {
        e.preventDefault();
        const newDist = getTouchDist(e.touches);
        const diff = newDist - lastTouchDist;
        scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale + diff * 0.01));
        if (scale === MIN_SCALE) {
          originX = 0;
          originY = 0;
        }
        applyTransform();
        lastTouchDist = newDist;
      } else if (e.touches.length === 1 && isDragging) {
        e.preventDefault();
        originX = e.touches[0].clientX - startX;
        originY = e.touches[0].clientY - startY;
        applyTransform();
      }
    },
    { passive: false },
  );

  overlay.addEventListener("touchend", (e) => {
    if (e.touches.length < 2) lastTouchDist = null;
    if (e.touches.length === 0) isDragging = false;
  });

  lightboxImg.addEventListener("dblclick", () => resetTransform());
})();

const cancelProcessBtn = document.getElementById("cancelProcessBtn");
if (cancelProcessBtn) {
  cancelProcessBtn.addEventListener("click", () => {
    if (currentAbortController) {
      currentAbortController.abort();
    }

    loadingBox.classList.add("hidden");
    submitContainer.classList.remove("hidden");
    uploadBtn.disabled = false;
  });
}

const reprocessBtn = document.getElementById("reprocessBtn");
if (reprocessBtn) {
  reprocessBtn.addEventListener("click", () => {
    resultCard.classList.add("hidden");
    submitContainer.classList.remove("hidden");
    submitContainer.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}
