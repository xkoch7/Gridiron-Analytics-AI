import os
from dotenv import load_dotenv
import nflreadpy as nfl
import polars as pl
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def sync_nfl_data():
    print("Fetching 2026 NFL player stats and rosters...")
    df_stats = nfl.load_player_stats()
    df_rosters = nfl.load_rosters()

    print(f"Loaded {len(df_stats)} player stat rows.")
    print(f"Loaded {len(df_rosters)} roster rows.")

    offense_df = (
        df_stats
        .filter(pl.col("position").is_in(["QB", "RB", "WR", "TE"]))
        .select([
            pl.col("player_id"),
            pl.col("player_display_name").alias("name"),
            pl.col("position"),
            pl.col("recent_team").alias("team"),
            pl.col("fantasy_points_ppr"),
        ])
        .unique(subset=["player_id"])
        .drop_nulls(subset=["player_id"])
    )

    records = offense_df.to_dicts()

    try:
        supabase.table("offensive_players").upsert(records).execute()
        print(f"Successfully upserted {len(records)} offensive player records!")
    except Exception as e:
        print(f"Error uploading to Supabase: {e}")


if __name__ == "__main__":
    sync_nfl_data()