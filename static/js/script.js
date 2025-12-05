document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("predictionForm");
  const inputs = document.querySelectorAll("input, select");

  inputs.forEach((input) => {
    input.addEventListener("focus", function () {
      this.parentElement.classList.add("scale-105");
      this.parentElement.classList.add("transition-transform");
      this.parentElement.classList.add("duration-300");
    });

    input.addEventListener("blur", function () {
      this.parentElement.classList.remove("scale-105");
    });
  });

  if (form) {
    form.addEventListener("submit", function (e) {
      let isValid = true;
      const errorMessages = [];

      const numericFields = form.querySelectorAll('input[type="number"]');
      numericFields.forEach((field) => {
        const value = parseFloat(field.value);
        const fieldName = field.getAttribute("name");

        if (fieldName === "Age" && (value < 0 || value > 120)) {
          isValid = false;
          errorMessages.push("Umur harus antara 0-120 tahun");
          highlightError(field);
        }
        if (fieldName === "bmi" && (value < 10 || value > 60)) {
          isValid = false;
          errorMessages.push("BMI harus antara 10-60");
          highlightError(field);
        }
        if (fieldName === "diet_score" && (value < 1 || value > 10)) {
          isValid = false;
          errorMessages.push("Diet Score harus antara 1-10");
          highlightError(field);
        }
        if (fieldName === "hba1c" && (value < 3 || value > 20)) {
          isValid = false;
          errorMessages.push("HbA1c harus antara 3-20%");
          highlightError(field);
        }

        const binaryFields = [
          "family_history_diabetes",
          "hypertension_history",
          "cardiovascular_history",
        ];
        if (binaryFields.includes(fieldName) && value !== 0 && value !== 1) {
          isValid = false;
          errorMessages.push(`${fieldName.replace("_", " ")} harus 0 atau 1`);
          highlightError(field);
        }
      });

      if (!isValid) {
        e.preventDefault();
        showValidationError(errorMessages.join("<br>"));
        return false;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin mr-3"></i>Memproses Prediksi...';
      submitBtn.disabled = true;

      setTimeout(() => {
        const resultCard = document.querySelector(".result-card");
        if (resultCard) {
          resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        setTimeout(() => {
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
        }, 2000);
      }, 100);
    });
  }

  inputs.forEach((input) => {
    if (input.type === "number" && !input.classList.contains("no-format")) {
      input.addEventListener("blur", function () {
        if (this.value && this.value >= 1000) {
          this.value = parseFloat(this.value).toLocaleString("id-ID");
        }
      });
      input.addEventListener("focus", function () {
        if (this.value) {
          this.value = this.value.replace(/\./g, "");
        }
      });
    }

    if (input.name === "diet_score") {
      input.title =
        "1 = Pola makan sangat buruk\n10 = Pola makan sangat sehat dan seimbang";
    }
    if (input.name === "hba1c") {
      input.title = "Normal: <5.7%\nPre-Diabetes: 5.7-6.4%\nDiabetes: ≥6.5%";
    }
  });

  const weightInput = document.getElementById("weight");
  const heightInput = document.getElementById("height");
  const bmiInput = document.getElementById("bmi");

  if (weightInput && heightInput && bmiInput) {
    const calculateBMI = () => {
      const weight = parseFloat(weightInput.value);
      const height = parseFloat(heightInput.value) / 100;

      if (weight && height > 0) {
        const bmi = weight / (height * height);
        bmiInput.value = bmi.toFixed(1);
      }
    };

    weightInput.addEventListener("input", calculateBMI);
    heightInput.addEventListener("input", calculateBMI);
  }

  const textAreas = document.querySelectorAll("textarea");
  textAreas.forEach((textarea) => {
    const counter = document.createElement("div");
    counter.className = "text-xs text-gray-500 text-right mt-1";
    textarea.parentNode.appendChild(counter);

    textarea.addEventListener("input", function () {
      counter.textContent = `${this.value.length} karakter`;
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey && e.key === "Enter" && form) {
      form.submit();
    }
    if (e.key === "Escape") {
      const focused = document.activeElement;
      if (
        focused &&
        (focused.tagName === "INPUT" || focused.tagName === "SELECT")
      ) {
        focused.value = "";
      }
    }
  });
});

function highlightError(element) {
  element.classList.add("border-red-500", "bg-red-50");
  element.scrollIntoView({ behavior: "smooth", block: "center" });
  setTimeout(() => {
    element.classList.remove("border-red-500", "bg-red-50");
  }, 5000);
}

function showValidationError(message) {
  const existingAlert = document.querySelector(".validation-error-alert");
  if (existingAlert) {
    existingAlert.remove();
  }

  const alertDiv = document.createElement("div");
  alertDiv.className =
    "validation-error-alert p-4 mb-6 bg-red-50 border-l-4 border-red-500 rounded-lg";
  alertDiv.innerHTML = `
        <div class="flex items-center">
            <div class="p-2 rounded-full bg-red-100 mr-4">
                <i class="fas fa-exclamation-circle text-red-600"></i>
            </div>
            <div>
                <h4 class="font-bold text-gray-900">Validasi Gagal</h4>
                <p class="text-sm text-gray-700 mt-1">${message}</p>
            </div>
        </div>
    `;

  const form = document.getElementById("predictionForm");
  if (form) {
    form.parentNode.insertBefore(alertDiv, form);
    alertDiv.scrollIntoView({ behavior: "smooth", block: "start" });

    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.style.opacity = "0";
        alertDiv.style.transition = "opacity 0.5s";
        setTimeout(() => {
          if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
          }
        }, 500);
      }
    }, 10000);
  }
}

function printResults() {
  const resultCard = document.querySelector(".result-card");
  if (resultCard) {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
            <html>
                <head>
                    <title>Hasil Prediksi Diabetes</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        .print-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                        .print-result { font-size: 24px; font-weight: bold; text-align: center; margin: 30px 0; }
                        .print-confidence { text-align: center; margin: 20px 0; }
                        .print-recommendation { margin-top: 30px; padding: 20px; border: 1px solid #ccc; border-radius: 5px; }
                        .print-footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
                        @media print {
                            body { -webkit-print-color-adjust: exact; }
                        }
                    </style>
                </head>
                <body>
                    <div class="print-header">
                        <h1>Sistem Prediksi Risiko Diabetes</h1>
                        <p>Tanggal: ${new Date().toLocaleDateString(
                          "id-ID"
                        )}</p>
                    </div>
                    <div class="print-result">
                        ${
                          resultCard.querySelector(".result-stage-text")
                            .textContent
                        }
                    </div>
                    <div class="print-confidence">
                        Tingkat Keyakinan Model: ${
                          resultCard.querySelector(".confidence-value")
                            .textContent
                        }
                    </div>
                    <div class="print-recommendation">
                        ${
                          resultCard.querySelector(".result-recommendation")
                            .innerHTML
                        }
                    </div>
                    <div class="print-footer">
                        <p>Hasil ini merupakan prediksi berdasarkan model machine learning dan bukan diagnosis medis.</p>
                        <p>Konsultasikan dengan profesional kesehatan untuk diagnosis yang akurat.</p>
                    </div>
                </body>
            </html>
        `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
}

function exportData() {
  const form = document.getElementById("predictionForm");
  if (form) {
    const formData = new FormData(form);
    const data = {};

    for (let [key, value] of formData.entries()) {
      data[key] = value;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `data-prediksi-diabetes-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast("Data berhasil diekspor", "success");
  }
}

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast-notification fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-50 transform translate-y-full transition-transform duration-300 ${
    type === "success"
      ? "bg-green-500"
      : type === "error"
      ? "bg-red-500"
      : "bg-blue-500"
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove("translate-y-full");
  }, 10);

  setTimeout(() => {
    toast.classList.add("translate-y-full");
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

function addUtilityButtons() {
  const resultCard = document.querySelector(".result-card");
  if (resultCard) {
    const buttonContainer = resultCard.querySelector(".text-center:last-child");
    if (buttonContainer) {
      const utilityDiv = document.createElement("div");
      utilityDiv.className = "flex justify-center gap-4 mt-4";
      utilityDiv.innerHTML = `
                <button onclick="printResults()" class="px-4 py-2 bg-white border border-gray-300 rounded-lg flex items-center hover:bg-gray-50">
                    <i class="fas fa-print mr-2"></i> Cetak Hasil
                </button>
                <button onclick="exportData()" class="px-4 py-2 bg-white border border-gray-300 rounded-lg flex items-center hover:bg-gray-50">
                    <i class="fas fa-download mr-2"></i> Ekspor Data
                </button>
            `;
      buttonContainer.insertBefore(
        utilityDiv,
        buttonContainer.querySelector("button")
      );
    }
  }
}

document.addEventListener("DOMContentLoaded", function () {
  addUtilityButtons();

  const tooltipIcons = document.querySelectorAll("[title]");
  tooltipIcons.forEach((icon) => {
    icon.addEventListener("mouseenter", function (e) {
      const tooltip = document.createElement("div");
      tooltip.className =
        "absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg";
      tooltip.textContent = this.title;
      tooltip.style.top = e.pageY - 40 + "px";
      tooltip.style.left = e.pageX - tooltip.offsetWidth / 2 + "px";
      tooltip.id = "custom-tooltip";
      document.body.appendChild(tooltip);
    });

    icon.addEventListener("mouseleave", function () {
      const tooltip = document.getElementById("custom-tooltip");
      if (tooltip) {
        tooltip.remove();
      }
    });
  });
});
