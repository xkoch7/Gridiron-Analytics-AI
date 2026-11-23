import os
import joblib
import pandas as pd
import nflreadpy as nfl
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

MODEL_PATH = "fantasy_points_model.joblib"

def load_historical_data(seasons=None):
    if seasons is None:
        seasons = [2022, 2023, 2024, 2025]
    print(f"Loading player stats for seasons: {seasons}")
    df = nfl.load_player_stats(seasons=seasons, summary_level="week").to_pandas()
    df = df[df["position"].isin(["QB", "RB", "WR", "TE"])].copy()
    if "fantasy_points_ppr" not in df.columns:
        df["fantasy_points_ppr"] = (
            df["passing_yards"].fillna(0) * 0.04 +
            df["passing_tds"].fillna(0) * 4 -
            df["passing_interceptions"].fillna(0) * 2 +
            df["rushing_yards"].fillna(0) * 0.1 +
            df["rushing_tds"].fillna(0) * 6 +
            df["receiving_yards"].fillna(0) * 0.1 +
            df["receiving_tds"].fillna(0) * 6 +
            df["receptions"].fillna(0) * 1.0
        )
    return df

def create_features(df):
    df = df.sort_values(["player_id", "season", "week"]).copy()
    df["target"] = df["fantasy_points_ppr"]
    group = df.groupby("player_id")
    df["fp_last_1"] = group["fantasy_points_ppr"].shift(1)
    df["fp_last_3_avg"] = group["fantasy_points_ppr"].shift(1).rolling(3, min_periods=1).mean()
    df["fp_last_5_avg"] = group["fantasy_points_ppr"].shift(1).rolling(5, min_periods=1).mean()
    df["fp_season_avg"] = group["fantasy_points_ppr"].shift(1).expanding().mean()
    df["pos_qb"] = (df["position"] == "QB").astype(int)
    df["pos_rb"] = (df["position"] == "RB").astype(int)
    df["pos_wr"] = (df["position"] == "WR").astype(int)
    df["pos_te"] = (df["position"] == "TE").astype(int)
    feature_cols = [
        "fp_last_1", "fp_last_3_avg", "fp_last_5_avg", "fp_season_avg",
        "pos_qb", "pos_rb", "pos_wr", "pos_te"
    ]
    df = df.dropna(subset=feature_cols + ["target"])
    return df, feature_cols

def train_model():
    print("=== Training model ===")
    raw = load_historical_data()
    df, feature_cols = create_features(raw)
    X = df[feature_cols]
    y = df["target"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    print(f"Test MAE: {mae:.2f} fantasy points")
    joblib.dump({"model": model, "feature_cols": feature_cols}, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")
    return model, feature_cols

def generate_current_projections(model, feature_cols):
    print("=== Generating current projections ===")
    season = nfl.get_current_season()
    week = nfl.get_current_week()
    recent = load_historical_data(seasons=[season - 1, season])
    df, _ = create_features(recent)
    latest = df.sort_values("week").groupby("player_id").tail(1).copy()
    X_pred = latest[feature_cols]
    latest["projected_points"] = model.predict(X_pred).round(2)
    records = []
    for _, row in latest.iterrows():
        records.append({
            "player_id": row["player_id"],
            "name": row["player_display_name"],
            "position": row["position"],
            "team": row["team"],
            "insight_type": "ml_projection",
            "recommendation": f"Projected {row['projected_points']} pts",
            "confidence_score": float(row["projected_points"])
        })
    return records

def upload_projections(records):
    print(f"Uploading {len(records)} projections to Supabase...")
    try:
        supabase.table("player_insights").upsert(records).execute()
        print("Projections uploaded successfully!")
    except Exception as e:
        print(f"Upload error: {e}")

if __name__ == "__main__":
    model, feature_cols = train_model()
    records = generate_current_projections(model, feature_cols)
    upload_projections(records)

