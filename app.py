from flask import Flask, render_template, request, redirect, url_for, flash
import joblib
import pandas as pd
import pickle
import numpy as np
import io

app = Flask(__name__)
app.secret_key = "supersecretkey"  # Diperlukan untuk menggunakan flash messages

# Lokasi penyimpanan file yang diupload (pastikan direktori ada)
UPLOAD_FOLDER = "uploads"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

try:
    # --- Pemuatan Model dan Encoder ---
    MODEL_PIPELINE = joblib.load("model/full_diabetes_pipeline.pkl")

    with open("model/target_encoders.pkl", "rb") as f:
        ENCODERS = pickle.load(f)

    TARGET_ENCODER = ENCODERS["diabetes_stage"]

    # Kolom input harus SAMA PERSIS dengan saat training
    INPUT_COLUMNS = [
        "Age",
        "gender",
        "ethnicity",
        "education_level",
        "income_level",
        "employment_status",
        "smoking_status",
        "alcohol_consumption_per_week",
        "physical_activity_minutes_per_week",
        "diet_score",
        "sleep_hours_per_day",
        "screen_time_hours_per_day",
        "family_history_diabetes",
        "hypertension_history",
        "cardiovascular_history",
        "bmi",
        "waist_to_hip_ratio",
        "systolic_bp",
        "diastolic_bp",
        "heart_rate",
        "cholesterol_total",
        "hdl_cholesterol",
        "ldl_cholesterol",
        "triglycerides",
        "glucose_fasting",
        "glucose_postprandial",
        "insulin_level",
        "hba1c",
    ]

except Exception as e:
    MODEL_PIPELINE = None
    print(f"ERROR memuat model: {e}")
# ----------------------------------------------------


# Halaman Utama (Bisa diarahkan ke index.html/dashboard.html)
@app.route("/", methods=["GET"])
def index():
    return render_template("dashboard.html")


# Halaman Prediksi Input Tunggal (Tidak Berubah)
@app.route("/predict", methods=["GET", "POST"])
def predict():
    if MODEL_PIPELINE is None:
        return render_template(
            "index.html",
            result={
                "status": "Error",
                "pesan": "Sistem Prediksi Tidak Tersedia: Komponen model hilang atau rusak.",
            },
            input_columns=INPUT_COLUMNS,
        )

    result = None

    if request.method == "POST":
        try:
            # Mengambil data dari form dan mengonversi tipenya
            data_input = {
                col: (
                    int(request.form.get(col))
                    if col
                    in [
                        "Age",
                        "alcohol_consumption_per_week",
                        "physical_activity_minutes_per_week",
                        "family_history_diabetes",
                        "hypertension_history",
                        "cardiovascular_history",
                        "systolic_bp",
                        "diastolic_bp",
                        "heart_rate",
                        "cholesterol_total",
                        "hdl_cholesterol",
                        "ldl_cholesterol",
                        "triglycerides",
                        "glucose_fasting",
                        "glucose_postprandial",
                    ]
                    else (
                        float(request.form.get(col))
                        if col
                        in [
                            "diet_score",
                            "sleep_hours_per_day",
                            "screen_time_hours_per_day",
                            "bmi",
                            "waist_to_hip_ratio",
                            "insulin_level",
                            "hba1c",
                        ]
                        else request.form.get(col)
                    )
                )
                for col in INPUT_COLUMNS
            }

            # Khusus untuk input kategorikal, kita memastikan nilainya ada (tidak None)
            # Jika ada kolom yang None, konversi tipe data akan gagal dan ditangkap di blok except

            input_df = pd.DataFrame([data_input], columns=INPUT_COLUMNS)

            # Prediksi
            prediction_le = MODEL_PIPELINE.predict(input_df)[0]
            final_result = TARGET_ENCODER.inverse_transform(np.array([prediction_le]))[
                0
            ]

            # Probabilitas
            proba = MODEL_PIPELINE.predict_proba(input_df)[0]
            risk_percent = f"{np.max(proba)*100:.2f}%"

            result = {
                "status": "Prediksi Berhasil",
                "tahap": final_result,
                "persen_risiko": risk_percent,
            }

        except Exception as e:
            result = {
                "status": "Error",
                "pesan": f"Terjadi kesalahan saat memproses data. Cek format input Anda. Detail: {e}",
            }

    return render_template("index.html", result=result, input_columns=INPUT_COLUMNS)


@app.route("/predict_file", methods=["GET", "POST"])
def predict_file():
    if MODEL_PIPELINE is None:
        flash(
            "Sistem Prediksi Tidak Tersedia: Komponen model hilang atau rusak.", "error"
        )
        return render_template("upload_file.html")

    if request.method == "POST":
        if "file" not in request.files:
            flash("Tidak ada bagian file dalam request", "error")
            return redirect(request.url)

        file = request.files["file"]

        if file.filename == "":
            flash("Tidak ada file terpilih", "error")
            return redirect(request.url)

        if file and file.filename.endswith(".csv"):
            try:
                stream = io.StringIO(file.stream.read().decode("UTF8"))
                input_df = pd.read_csv(stream)

                if not all(col in input_df.columns for col in INPUT_COLUMNS):
                    missing_cols = list(set(INPUT_COLUMNS) - set(input_df.columns))
                    flash(
                        f"Error: Kolom CSV tidak lengkap. Kolom yang hilang: {', '.join(missing_cols)}",
                        "error",
                    )
                    return render_template("upload_file.html", output=None)

                predictions_le = MODEL_PIPELINE.predict(input_df)
                predictions_label = TARGET_ENCODER.inverse_transform(predictions_le)

                probabilities = MODEL_PIPELINE.predict_proba(input_df)
                max_proba = np.max(probabilities, axis=1)

                # Tambahkan hasil
                result_df = pd.DataFrame(
                    {
                        "Predicted_Stage": predictions_label,
                        "Prediction_Confidence": [f"{p*100:.2f}%" for p in max_proba],
                    }
                )

                # Hanya tampilkan 2 kolom ini
                output_html = result_df.to_html(
                    classes="min-w-full border border-gray-200 rounded-lg text-center text-sm",
                    index=False,
                )

                flash(
                    f"Prediksi berhasil untuk {len(result_df)} baris data.", "success"
                )
                return render_template("upload_file.html", output=output_html)

            except Exception as e:
                flash(
                    f"Terjadi kesalahan saat memproses file atau prediksi. Detail: {e}",
                    "error",
                )
                return render_template("upload_file.html", output=None)

        else:
            flash("Format file tidak didukung. Harap upload file CSV (.csv)", "error")
            return redirect(request.url)

    return render_template("upload_file.html", output=None)


if __name__ == "__main__":
    app.run(debug=True)
