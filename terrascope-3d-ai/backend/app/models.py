from pydantic import BaseModel, Field
from typing import List, Optional, Literal

class GeotechParameters(BaseModel):
    material_type: Literal["clay", "sand", "mixed", "rock"] = "mixed"
    slope_multiplier: float = Field(1.0, ge=0.4, le=2.5, description="Multiplicador de gradiente topográfico")
    cohesion_kpa: float = Field(18.0, ge=0.0, le=150.0, description="Cohesión efectiva c' (kPa)")
    friction_angle_deg: float = Field(28.0, ge=5.0, le=55.0, description="Ángulo de fricción interna phi' (°)")
    unit_weight_knm3: float = Field(19.5, ge=14.0, le=28.0, description="Peso unitario del suelo gamma (kN/m³)")
    soil_depth_m: float = Field(3.5, ge=0.5, le=15.0, description="Espesor del estrato potencialmente deslizable z (m)")
    rainfall_intensity_mmh: float = Field(25.0, ge=0.0, le=200.0, description="Intensidad de lluvia (mm/h)")
    rainfall_duration_h: float = Field(6.0, ge=0.0, le=72.0, description="Duración del evento de lluvia (h)")
    initial_saturation: float = Field(0.35, ge=0.0, le=1.0, description="Grado de saturación inicial (0 a 1)")
    toe_erosion_factor: float = Field(0.0, ge=0.0, le=1.0, description="Factor de socavación en la base de la ladera")
    surcharge_kpa: float = Field(5.0, ge=0.0, le=100.0, description="Sobrecarga externa por estructuras/vías q (kPa)")
    drainage_efficiency: float = Field(0.4, ge=0.0, le=1.0, description="Eficiencia de drenaje subdrenante")

class SimulationSummary(BaseModel):
    min_fs: float
    mean_fs: float
    max_slope_deg: float
    mean_slope_deg: float
    effective_saturation: float
    pore_pressure_kpa: float
    unstable_cells_pct: float
    critical_warning_cells_pct: float
    safe_cells_pct: float
    stability_status: Literal["STABLE", "MARGINAL", "CRITICAL_FAILURE"]
    sensitivity_curve: List[dict]
    equation_metadata: dict

class AIQueryRequest(BaseModel):
    question: str
    parameters: GeotechParameters
    summary: SimulationSummary
    comparison_summary: Optional[SimulationSummary] = None
