export type MaterialType = 'clay' | 'sand' | 'mixed' | 'rock';

export type VisualizationLayer =
  | 'realistic'
  | 'elevation'
  | 'slope'
  | 'saturation'
  | 'safety_factor';

export interface GeotechParameters {
  material_type: MaterialType;
  slope_multiplier: number;
  cohesion_kpa: number;
  friction_angle_deg: number;
  unit_weight_knm3: number;
  soil_depth_m: number;
  rainfall_intensity_mmh: number;
  rainfall_duration_h: number;
  initial_saturation: number;
  toe_erosion_factor: number;
  surcharge_kpa: number;
  drainage_efficiency: number;
}

export interface CellInspectionData {
  x: number;
  z: number;
  elevation_m: number;
  slope_deg: number;
  local_saturation: number;
  pore_pressure_kpa: number;
  safety_factor: number;
  zone_type: 'CREST' | 'MID_SLOPE' | 'TOE_EROSION' | 'VALLEY_ROAD';
}

export interface SimulationSummary {
  min_fs: number;
  mean_fs: number;
  max_slope_deg: number;
  mean_slope_deg: number;
  effective_saturation: number;
  pore_pressure_kpa: number;
  unstable_cells_pct: number;
  critical_warning_cells_pct: number;
  safe_cells_pct: number;
  stability_status: 'STABLE' | 'MARGINAL' | 'CRITICAL_FAILURE';
  sensitivity_curve: Array<{
    rainfall_mmh: number;
    critical_fs: number;
    mean_fs: number;
    saturation_pct: number;
  }>;
  equation_metadata: {
    model_name: string;
    formula: string;
    assumptions: string[];
    data_origin: string;
  };
}

export interface SavedScenario {
  id: string;
  name: string;
  timestamp: string;
  parameters: GeotechParameters;
  summary: SimulationSummary;
}

export interface AIResponse {
  provider: string;
  answer: string;
  used_parameters: Record<string, any>;
}
