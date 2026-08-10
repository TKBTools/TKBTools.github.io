const GAS_WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbzA3px9Q_nWMYShDSmefKBQB1GCzy4V4cdHRF9pQy5z9nb9vody0stUEBxuJPumrexU/exec";

const themeInputs = document.querySelectorAll('input[name="theme-select"]');
const htmlElement = document.documentElement;
themeInputs.forEach((input) => {
  if (input.value === htmlElement.getAttribute("data-theme"))
    input.checked = true;
  input.addEventListener("change", (e) => {
    htmlElement.setAttribute("data-theme", e.target.value);
    localStorage.setItem("selected-theme-mode", e.target.value);
  });
});

const fbFiles = document.getElementById("fbFiles");
const fileError = document.getElementById("fileError");
const form = document.getElementById("feedbackForm");
const submitContainer = document.getElementById("submitContainer");
const loadingBox = document.getElementById("loadingBox");
const successBox = document.getElementById("successBox");

fbFiles.addEventListener("change", () => {
  fileError.classList.add("hidden");
  const files = fbFiles.files;

  if (files.length > 5) {
    fileError.textContent = "Chỉ được phép upload tối đa 5 file.";
    fileError.classList.remove("hidden");
    fbFiles.value = "";
    return;
  }

  for (let i = 0; i < files.length; i++) {
    if (files[i].size > 10 * 1024 * 1024) {
      fileError.textContent = `File "${files[i].name}" vượt quá 10MB. Vui lòng chọn file nhỏ hơn.`;
      fileError.classList.remove("hidden");
      fbFiles.value = "";
      return;
    }
  }
});

const getBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      resolve({
        name: file.name,
        mimeType: file.type,
        base64: reader.result.split(",")[1],
      });
    };
    reader.onerror = (error) => reject(error);
  });
};

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  submitContainer.classList.add("hidden");
  loadingBox.classList.remove("hidden");

  const platform = navigator.platform || "Không xác định";
  const screenRes = `${window.screen.width}x${window.screen.height}`;
  const sysInfo = `Hệ điều hành: ${platform} | Màn hình: ${screenRes} | Trình duyệt: ${navigator.userAgent}`;

  try {
    const rawFiles = fbFiles.files;
    const base64Files = [];
    for (let i = 0; i < rawFiles.length; i++) {
      const fileData = await getBase64(rawFiles[i]);
      base64Files.push(fileData);
    }

    const payload = {
      name: document.getElementById("fbName").value.trim(),
      email: document.getElementById("fbEmail").value.trim(),
      type: document.getElementById("fbType").value,
      description: document.getElementById("fbDesc").value.trim(),
      sysInfo: sysInfo,
      files: base64Files,
    };

    const response = await fetch(GAS_WEB_APP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (result.status === "success") {
      loadingBox.classList.add("hidden");
      successBox.classList.remove("hidden");
      form.reset();
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    alert("Có lỗi xảy ra khi gửi phản hồi: " + error.message);
    submitContainer.classList.remove("hidden");
    loadingBox.classList.add("hidden");
  }
});
