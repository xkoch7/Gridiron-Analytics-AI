import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def verify_insights():
    print("--- TOP GAMBLING PARLAY PICKS (SAFE PROFIT / LOW RISK) ---")
    parlay_res = (
        supabase.table("player_insights")
        .select("name, position, team, recommendation, confidence_score")
        .eq("insight_type", "gambling_parlay")
        .order("confidence_score", desc=True)
        .limit(10)
        .execute()
    )

    for pick in parlay_res.data:
        print(
            f"{pick['name']} ({pick['position']} - {pick['team']}) -> "
            f"{pick['recommendation']} | Score: {pick['confidence_score']}"
        )

    print("\n--- TOP FANTASY START RECOMMENDATIONS ---")
    fantasy_res = (
        supabase.table("player_insights")
        .select("name, position, team, recommendation, confidence_score")
        .eq("insight_type", "fantasy_start")
        .order("confidence_score", desc=True)
        .limit(10)
        .execute()
    )

    for pick in fantasy_res.data:
        print(
            f"{pick['name']} ({pick['position']} - {pick['team']}) -> "
            f"{pick['recommendation']} | Score: {pick['confidence_score']}"
        )

    print("\n--- SAMPLE HIGH RISK / HIGH REWARD LONGSHOTS ---")
    longshot_res = (
        supabase.table("player_insights")
        .select("name, position, team, recommendation, confidence_score")
        .eq("insight_type", "gambling_parlay")
        .eq("recommendation", "High Risk / High Reward Longshot")
        .limit(5)
        .execute()
    )

    for pick in longshot_res.data:
        print(
            f"{pick['name']} ({pick['position']} - {pick['team']}) -> "
            f"{pick['recommendation']} | Score: {pick['confidence_score']}"
        )


if __name__ == "__main__":
    verify_insights()