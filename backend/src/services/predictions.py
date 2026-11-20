# Prediction logic lives here so routes stay thin.
# TODO: replace placeholders with real models trained on NFL stats.
import os
from typing import List
from dotenv import load_dotenv
from supabase import create_client

from src.models.schemas import PlayerProjection, Matchup, PropLine

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def get_player_projections() -> List[PlayerProjection]:
    response = (
        supabase.table("player_insights")
        .select("*")
        .eq("insight_type", "ml_projection")
        .order("confidence_score", desc=True)
        .execute()
    )

    results = []
    for row in response.data or []:
        results.append(
            PlayerProjection(
                player_id=str(row.get("player_id", "")),
                name=row.get("name", ""),
                team=row.get("team") or "FA",
                position=row.get("position") or "UNK",
                projected_points=float(row.get("confidence_score") or 0),
            )
        )
    return results


def get_start_sit() -> List[PlayerProjection]:
    return get_player_projections()[:40]


def get_matchups() -> List[Matchup]:
    return []


def get_game_lines() -> List[Matchup]:
    return []


def get_player_props() -> List[PropLine]:
    return []

