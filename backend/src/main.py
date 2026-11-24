from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.routes import betting, fantasy, teams
from src.core.config import settings

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(fantasy.router, prefix="/api/fantasy", tags=["fantasy"])
app.include_router(betting.router, prefix="/api/betting", tags=["betting"])
app.include_router(teams.router, prefix="/api/teams", tags=["teams"])


@app.get("/api/health")
def health():
    return {"status": "ok"}

