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

const OPTIONS_VISITED_KEY = "tkb_options_visited";
const isFirstVisit = localStorage.getItem(OPTIONS_VISITED_KEY) !== "true";
localStorage.setItem(OPTIONS_VISITED_KEY, "true");

const optionsBox = document.getElementById("optionsBox");
const optionsHeader = document.getElementById("optionsHeader");
if (optionsBox && optionsHeader) {
  let isExpanded = isFirstVisit
    ? true
    : localStorage.getItem("tkb_options_expanded") === "1";
  optionsBox.classList.toggle("expanded", isExpanded);

  optionsHeader.addEventListener("click", () => {
    isExpanded = !optionsBox.classList.contains("expanded");
    optionsBox.classList.toggle("expanded", isExpanded);
    localStorage.setItem("tkb_options_expanded", isExpanded ? "1" : "0");
  });
}

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

const STORAGE_KEY = isTeacherMode ? "tkb_saved_data_teacher" : "tkb_saved_data";

let currentMaxDay = 7;
let currentAfternoonPeriods = 2;
let currentTimeTarget = null;

const tkbMatrix = document.getElementById("tkbMatrix");
const btnMinusDay = document.getElementById("btnMinusDay");
const btnPlusDay = document.getElementById("btnPlusDay");
const btnMinusPeriod = document.getElementById("btnMinusPeriod");
const btnPlusPeriod = document.getElementById("btnPlusPeriod");
const overrideScheduleCheckbox = document.getElementById(
  "overrideScheduleCheckbox",
);
const clearScheduleBtn = document.getElementById("clearScheduleBtn");
const OVERRIDE_NOTICE_DISMISSED_KEY = "tkb_override_notice_dismissed";
const overrideWarningModal = document.getElementById("overrideWarningModal");
const confirmOverrideBtn = document.getElementById("confirmOverrideBtn");

function updateMatrixView() {
  if (!tkbMatrix) return;

  tkbMatrix.style.setProperty("--num-day-cols", currentMaxDay - 1);

  for (let d = 2; d <= 8; d++) {
    document.querySelectorAll(`.col-day[data-col="${d}"]`).forEach((el) => {
      if (d <= currentMaxDay) el.classList.remove("hidden-matrix-element");
      else el.classList.add("hidden-matrix-element");
    });
  }

  for (let p = 1; p <= 8; p++) {
    const rowEl = document.querySelector(`.m-row.row-aft[data-row="${p}"]`);
    if (rowEl) {
      if (p <= currentAfternoonPeriods)
        rowEl.classList.remove("hidden-matrix-element");
      else rowEl.classList.add("hidden-matrix-element");
    }
  }

  const dayDisplay = document.getElementById("dayCountDisplay");
  if (dayDisplay) dayDisplay.innerText = currentMaxDay;
  const periodDisplay = document.getElementById("periodCountDisplay");
  if (periodDisplay) periodDisplay.innerText = currentAfternoonPeriods;

  if (btnMinusDay) btnMinusDay.disabled = currentMaxDay <= 6;
  if (btnPlusDay) btnPlusDay.disabled = currentMaxDay >= 8;
  if (btnMinusPeriod) btnMinusPeriod.disabled = currentAfternoonPeriods <= 0;
  if (btnPlusPeriod) btnPlusPeriod.disabled = currentAfternoonPeriods >= 8;
}

if (clearScheduleBtn) {
  clearScheduleBtn.addEventListener("click", () => {
    if (
      confirm(
        "Bạn có chắc chắn muốn xóa toàn bộ dữ liệu bạn đã tự nhập trong bảng này không?",
      )
    ) {
      document.querySelectorAll(".matrix-input").forEach((input) => {
        input.value = "";
      });
      saveLocalData();
    }
  });
}

if (confirmOverrideBtn && overrideWarningModal) {
  confirmOverrideBtn.addEventListener("click", () => {
    const dontShow = document.getElementById("dontShowOverrideNoticeAgain");
    if (dontShow && dontShow.checked)
      localStorage.setItem(OVERRIDE_NOTICE_DISMISSED_KEY, "true");
    overrideWarningModal.classList.remove("active");
  });
}

if (btnMinusDay)
  btnMinusDay.addEventListener("click", () => {
    if (currentMaxDay > 6) {
      currentMaxDay--;
      updateMatrixView();
      saveLocalData();
    }
  });
if (btnPlusDay)
  btnPlusDay.addEventListener("click", () => {
    if (currentMaxDay < 8) {
      currentMaxDay++;
      updateMatrixView();
      saveLocalData();
    }
  });
if (btnMinusPeriod)
  btnMinusPeriod.addEventListener("click", () => {
    if (currentAfternoonPeriods > 0) {
      currentAfternoonPeriods--;
      updateMatrixView();
      saveLocalData();
    }
  });
if (btnPlusPeriod)
  btnPlusPeriod.addEventListener("click", () => {
    if (currentAfternoonPeriods < 8) {
      currentAfternoonPeriods++;
      updateMatrixView();
      saveLocalData();
    }
  });

if (clearScheduleBtn) {
  clearScheduleBtn.addEventListener("click", () => {
    if (!overrideScheduleCheckbox.checked) {
      alert("Bạn phải BẬT chức năng 'Ghi đè' để xóa nội dung tự điền.");
      return;
    }
    document.querySelectorAll(".matrix-input").forEach((input) => {
      input.value = "";
    });
    saveLocalData();
  });
}

document.querySelectorAll(".matrix-input").forEach((input) => {
  input.addEventListener("input", saveLocalData);
});
if (classInput) classInput.addEventListener("input", saveLocalData);

const timePickerModal = document.getElementById("timePickerModal");
const modalStartTime = document.getElementById("modalStartTime");
const modalEndTime = document.getElementById("modalEndTime");
const modalTimeCancelBtn = document.getElementById("modalTimeCancelBtn");
const modalTimeSaveBtn = document.getElementById("modalTimeSaveBtn");

document.querySelectorAll(".time-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    currentTimeTarget = e.currentTarget;
    const timeText = currentTimeTarget.innerText;
    const parts = timeText.split("→").map((s) => s.trim());
    modalStartTime.value = parts[0] || "";
    modalEndTime.value = parts[1] || "";
    timePickerModal.classList.add("active");
  });
});

if (modalTimeCancelBtn)
  modalTimeCancelBtn.addEventListener("click", () => {
    timePickerModal.classList.remove("active");
  });
if (modalTimeSaveBtn)
  modalTimeSaveBtn.addEventListener("click", () => {
    if (currentTimeTarget) {
      const s = modalStartTime.value || "--:--";
      const e = modalEndTime.value || "--:--";
      currentTimeTarget.innerText = `${s} → ${e}`;
      saveLocalData();
    }
    timePickerModal.classList.remove("active");
  });

function saveLocalData() {
  const tkbData = {
    targetName: classInput ? classInput.value : "",
    maxDay: currentMaxDay,
    afternoonPeriods: currentAfternoonPeriods,
    overrideEnabled: overrideScheduleCheckbox
      ? overrideScheduleCheckbox.checked
      : false,
    times: {},
    subjects: {},
  };

  document.querySelectorAll(".time-btn").forEach((btn) => {
    tkbData.times[btn.dataset.timeId] = btn.innerText;
  });
  document.querySelectorAll(".matrix-input").forEach((input) => {
    tkbData.subjects[
      `${input.dataset.day}_${input.dataset.period}_${input.classList.contains("morn-input") ? "M" : "A"}`
    ] = input.value;
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(tkbData));
}

function loadLocalData() {
  const savedData = localStorage.getItem(STORAGE_KEY);
  if (savedData) {
    const tkbData = JSON.parse(savedData);
    if (tkbData.targetName && classInput) classInput.value = tkbData.targetName;
    currentMaxDay = tkbData.maxDay || 7;
    currentAfternoonPeriods =
      tkbData.afternoonPeriods !== undefined ? tkbData.afternoonPeriods : 2;
    if (overrideScheduleCheckbox)
      overrideScheduleCheckbox.checked = tkbData.overrideEnabled || false;

    if (tkbData.times) {
      document.querySelectorAll(".time-btn").forEach((btn) => {
        if (tkbData.times[btn.dataset.timeId])
          btn.innerText = tkbData.times[btn.dataset.timeId];
      });
    }

    if (tkbData.subjects) {
      document.querySelectorAll(".matrix-input").forEach((input) => {
        const key = `${input.dataset.day}_${input.dataset.period}_${input.classList.contains("morn-input") ? "M" : "A"}`;
        if (tkbData.subjects[key]) input.value = tkbData.subjects[key];
      });
    }
  } else {
    currentMaxDay = 7;
    currentAfternoonPeriods = 2;
    if (overrideScheduleCheckbox) overrideScheduleCheckbox.checked = false;
  }
  updateMatrixView();
}
loadLocalData();

const noticeModal = document.getElementById("devNoticeModal");
const dismissBtn = document.getElementById("dismissNoticeBtn");
if (noticeModal && dismissBtn) {
  const isDismissed = localStorage.getItem("dev_notice_dismissed");
  if (!isDismissed) noticeModal.classList.add("active");
  dismissBtn.addEventListener("click", () => {
    localStorage.setItem("dev_notice_dismissed", "true");
    if (optionsBox) {
      optionsBox.classList.add("expanded");
      localStorage.setItem("tkb_options_expanded", "1");
    }
    noticeModal.classList.remove("active");
  });
}

let cachedFileId = null;
let currentPdfUrl = null;
let currentApplyDate = "dd-mm-yyyy";
let currentAbortController = null;

function resetFileInput() {
  fileInput.value = "";
  fileNameDisplay.classList.add("hidden");
  classSelectionContainer.classList.add("hidden");
  submitContainer.classList.add("hidden");
  cachedFileId = null;
}

function b64toBlob(b64Data, contentType = "") {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    byteArrays.push(new Uint8Array(byteNumbers));
  }
  return new Blob(byteArrays, { type: contentType });
}

fileInput.addEventListener("change", async () => {
  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const ext = file.name.split(".").pop().toLowerCase();
    const validExts = isTeacherMode ? ["xlsx", "xls", "csv"] : ["pdf"];

    if (!validExts.includes(ext)) {
      alert(
        isTeacherMode
          ? "Lỗi: Bản giáo viên chỉ hỗ trợ tệp định dạng Excel (.xlsx, .xls, .csv)!"
          : "Lỗi: Bản học sinh chỉ hỗ trợ tệp định dạng .PDF!",
      );
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
        alert("Lỗi kết nối máy chủ: " + err);
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
    if (cachedFileId) formData.append("file_id", cachedFileId);
    else formData.append("file", fileInput.files[0]);
  } else {
    formData.append("class_name", inputName);
    formData.append("file", fileInput.files[0]);
  }

  const morningTimesPayload = [];
  for (let i = 0; i <= 5; i++) {
    const btn = document.querySelector(
      `.time-btn[data-time-id="morning_${i}"]`,
    );
    morningTimesPayload.push(btn ? btn.innerText : "—");
  }
  formData.append("morning_times", JSON.stringify(morningTimesPayload));

  const isOverride = overrideScheduleCheckbox
    ? overrideScheduleCheckbox.checked
    : false;
  formData.append("override_schedule", isOverride);

  const morningData = { schedule: {} };
  for (let day = 2; day <= 8; day++) {
    const daySubjects = [];
    if (day <= currentMaxDay) {
      for (let p = 1; p <= 5; p++) {
        const subjEl = document.querySelector(
          `.morn-input[data-day="${day}"][data-period="${p}"]`,
        );
        const val = subjEl ? subjEl.value.trim() : "";
        daySubjects.push(val !== "" ? val : "—");
      }
    } else {
      for (let p = 1; p <= 5; p++) daySubjects.push("—");
    }
    morningData.schedule[day] = daySubjects;
  }
  formData.append("morning_data", JSON.stringify(morningData));

  if (currentAfternoonPeriods > 0) {
    const aftTimesArray = [];
    for (let i = 1; i <= currentAfternoonPeriods; i++) {
      const btn = document.querySelector(
        `.time-btn[data-time-id="afternoon_${i}"]`,
      );
      aftTimesArray.push(btn ? btn.innerText : "—");
    }

    const afternoonData = { times: aftTimesArray, schedule: {} };
    for (let day = 2; day <= 8; day++) {
      const daySubjects = [];
      if (day <= currentMaxDay) {
        for (let p = 1; p <= currentAfternoonPeriods; p++) {
          const subjEl = document.querySelector(
            `.aft-input[data-day="${day}"][data-period="${p}"]`,
          );
          const val = subjEl ? subjEl.value.trim() : "";
          daySubjects.push(val !== "" ? val : "—");
        }
      } else {
        for (let p = 1; p <= currentAfternoonPeriods; p++)
          daySubjects.push("—");
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
      "Hệ thống AI đang phân tích cấu trúc lịch, vui lòng đợi thêm chút nhé...";
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
      currentApplyDate =
        data.apply_date && data.apply_date !== "dd/mm/yyyy"
          ? data.apply_date.replace(/\//g, "-")
          : "dd-mm-yyyy";
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
    if (error.name === "AbortError") return;
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

const copyBtn = document.getElementById("copyBtn");
if (copyBtn) {
  copyBtn.addEventListener("click", () => {
    const textToCopy = document.getElementById("shortText");
    textToCopy.select();
    navigator.clipboard.writeText(textToCopy.value).then(() => {
      copyBtn.innerText = "Đã sao chép! ✓";
      setTimeout(() => (copyBtn.innerText = "Sao chép"), 2000);
    });
  });
}

const downloadBtn = document.getElementById("downloadBtn");
if (downloadBtn) {
  downloadBtn.addEventListener("click", () => {
    const imgUrl = document.getElementById("tkbImage").src;
    const downloadLink = document.createElement("a");
    downloadLink.href = imgUrl;
    downloadLink.download = `TKB_${currentApplyDate}.png`;
    downloadLink.click();
  });
}

const downloadPdfBtn = document.getElementById("downloadPdfBtn");
if (downloadPdfBtn) {
  downloadPdfBtn.addEventListener("click", () => {
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
}

const printBtn = document.getElementById("printBtn");
if (printBtn) {
  printBtn.addEventListener("click", () => {
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
        if (!fallback) alert("Vui lòng cho phép Pop-up để mở cửa sổ in!");
      }
    };
    printFrame.src = currentPdfUrl;
  });
}

(function () {
  const previewImg = document.getElementById("tkbImage");
  const overlay = document.getElementById("lightboxOverlay");
  const lightboxImg = document.getElementById("lightboxImg");
  const closeBtn = document.getElementById("lightboxClose");

  if (!previewImg || !overlay || !lightboxImg || !closeBtn) return;
  const MIN_SCALE = 1;
  const MAX_SCALE = 4;
  let scale = 1,
    originX = 0,
    originY = 0,
    isDragging = false,
    startX = 0,
    startY = 0,
    lastTouchDist = null;

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
      scale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, scale + (e.deltaY < 0 ? 0.15 : -0.15)),
      );
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
    return Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY,
    );
  }
  overlay.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length === 2) lastTouchDist = getTouchDist(e.touches);
      else if (e.touches.length === 1 && scale > MIN_SCALE) {
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
        scale = Math.min(
          MAX_SCALE,
          Math.max(MIN_SCALE, scale + (newDist - lastTouchDist) * 0.01),
        );
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
  lightboxImg.addEventListener("dblclick", resetTransform);
})();

const cancelProcessBtn = document.getElementById("cancelProcessBtn");
if (cancelProcessBtn) {
  cancelProcessBtn.addEventListener("click", () => {
    if (currentAbortController) currentAbortController.abort();
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
