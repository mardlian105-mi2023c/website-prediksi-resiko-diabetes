from flask import Flask, render_template, request
import joblib
import pandas as pd
import pickle
import numpy as np

app = Flask(__name__)

try:
    MODEL_PIPELINE = joblib.load("model/full_diabetes_pipeline.pkl")

    with open("model/target_encoders.pkl", "rb") as f:
        ENCODERS = pickle.load(f)

    TARGET_ENCODER = ENCODERS["diabetes_stage"]

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


@app.route("/", methods=["GET"])
def index():
    return render_template("dashboard.html")


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
            data_input = {
                "Age": int(request.form.get("Age")),
                "gender": request.form.get("gender"),
                "ethnicity": request.form.get("ethnicity"),
                "education_level": request.form.get("education_level"),
                "income_level": request.form.get("income_level"),
                "employment_status": request.form.get("employment_status"),
                "smoking_status": request.form.get("smoking_status"),
                "alcohol_consumption_per_week": int(
                    request.form.get("alcohol_consumption_per_week")
                ),
                "physical_activity_minutes_per_week": int(
                    request.form.get("physical_activity_minutes_per_week")
                ),
                "diet_score": float(request.form.get("diet_score")),
                "sleep_hours_per_day": float(request.form.get("sleep_hours_per_day")),
                "screen_time_hours_per_day": float(
                    request.form.get("screen_time_hours_per_day")
                ),
                "family_history_diabetes": int(
                    request.form.get("family_history_diabetes")
                ),
                "hypertension_history": int(request.form.get("hypertension_history")),
                "cardiovascular_history": int(
                    request.form.get("cardiovascular_history")
                ),
                "bmi": float(request.form.get("bmi")),
                "waist_to_hip_ratio": float(request.form.get("waist_to_hip_ratio")),
                "systolic_bp": int(request.form.get("systolic_bp")),
                "diastolic_bp": int(request.form.get("diastolic_bp")),
                "heart_rate": int(request.form.get("heart_rate")),
                "cholesterol_total": int(request.form.get("cholesterol_total")),
                "hdl_cholesterol": int(request.form.get("hdl_cholesterol")),
                "ldl_cholesterol": int(request.form.get("ldl_cholesterol")),
                "triglycerides": int(request.form.get("triglycerides")),
                "glucose_fasting": int(request.form.get("glucose_fasting")),
                "glucose_postprandial": int(request.form.get("glucose_postprandial")),
                "insulin_level": float(request.form.get("insulin_level")),
                "hba1c": float(request.form.get("hba1c")),
            }

            input_df = pd.DataFrame([data_input], columns=INPUT_COLUMNS)

            prediction_le = MODEL_PIPELINE.predict(input_df)[0]

            final_result = TARGET_ENCODER.inverse_transform(np.array([prediction_le]))[
                0
            ]

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
                "pesan": f"Terjadi kesalahan saat memproses data. Cek format input Anda (Pastikan semua kolom terisi dengan tipe data yang benar). Detail: {e}",
            }

    return render_template("index.html", result=result, input_columns=INPUT_COLUMNS)


if __name__ == "__main__":
    app.run(debug=True)
