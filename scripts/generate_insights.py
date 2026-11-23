import os
from dotenv import load_dotenv
from supabase import create_client
import pandas as pd

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def generate_mvp_insights():
    print("Fetching player data for MVP analysis...")
    response = supabase.table("offensive_players").select("*").execute()
    
    if not response.data:
        print("No player data found in Supabase. Run sync_database.py first!")
        return

    df = pd.DataFrame(response.data)
    insights = []
    
    for _, row in df.iterrows():
        fp = float(row.get("fantasy_points_ppr", 0) or 0)
        
        # 1. Fantasy Start/Sit MVP Logic
        if fp > 15:
            fantasy_rec = "Must Start / Elite Option"
            gambling_tier = "Low Risk / Safe Profit Pick"
        elif fp > 8:
            fantasy_rec = "Solid Flex Play"
            gambling_tier = "Moderate Risk Value"
        else:
            fantasy_rec = "Bench / Waiver Watch"
            gambling_tier = "High Risk / High Reward Longshot"
            
        # Push Fantasy Insight
        insights.append({
            "player_id": row["player_id"],
            "name": row["name"],
            "position": row["position"],
            "team": row["team"],
            "insight_type": "fantasy_start",
            "recommendation": fantasy_rec,
            "confidence_score": fp
        })
        
        # Push Gambling Parlay Helper Insight
        insights.append({
            "player_id": row["player_id"],
            "name": row["name"],
            "position": row["position"],
            "team": row["team"],
            "insight_type": "gambling_parlay",
            "recommendation": gambling_tier,
            "confidence_score": fp
        })
    
    print(f"Uploading {len(insights)} MVP insights to Supabase...")
    try:
        supabase.table("player_insights").upsert(insights).execute()
        print("MVP AI/Analytics layer successfully generated and uploaded!")
    except Exception as e:
        print(f"Error uploading MVP insights: {e}")

if __name__ == "__main__":
    generate_mvp_insights()