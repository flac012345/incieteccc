from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from .models import GeotechParameters, SimulationSummary, AIQueryRequest
from .geotech_engine import evaluate_infinite_slope_stability
from .ai_service import query_geotech_assistant

load_dotenv()

app = FastAPI(
    title="TERRASCOPE 3D AI - Scientific Geotech API",
    version="1.0.0",
    description="API de cálculo de estabilidad de taludes e inteligencia artificial geotécnica."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {"status": "online", "engine": "Mohr-Coulomb Infinite Slope v1.0"}

@app.post("/api/simulate", response_model=SimulationSummary)
def run_simulation(params: GeotechParameters):
    return evaluate_infinite_slope_stability(params)

@app.post("/api/ai/analyze")
def analyze_with_ai(request: AIQueryRequest):
    return query_geotech_assistant(request)
