import numpy as np
from .models import GeotechParameters, SimulationSummary

GAMMA_WATER = 9.81  # Peso unitario del agua en kN/m³

def evaluate_infinite_slope_stability(params: GeotechParameters) -> SimulationSummary:
    """
    Calcula el Factor de Seguridad (FS) mediante el modelo geotécnico de Talud Infinito
    acoplado con infiltración hidrostática relativa y sobrecarga superficial.
    
    Ecuación utilizada:
    FS = [ c' + ( (gamma * z + q) * cos²(beta) - u_w ) * tan(phi') ] / [ (gamma * z + q) * sin(beta) * cos(beta) ]
    Donde:
      u_w = m_w * gamma_w * z * cos²(beta) (Presión de poros intersticial)
      m_w = relación de nivel freático relativo (0.0 a 1.0)
    """
    # Generación determinista de la distribución de pendientes de la malla sintética (en grados)
    rng = np.random.default_rng(seed=42)
    base_slopes_deg = np.clip(rng.normal(loc=24.0, scale=8.5, size=(64, 64)) * params.slope_multiplier, 2.0, 68.0)

    # Incremento de pendiente local en el pie del talud por erosión basal
    toe_mask = np.zeros_like(base_slopes_deg)
    toe_mask[40:56, 15:48] = params.toe_erosion_factor * 14.0
    slopes_deg = np.clip(base_slopes_deg + toe_mask, 2.0, 75.0)
    slopes_rad = np.radians(slopes_deg)

    # Cálculo del grado de saturación relativa (m_w) por lluvia e infiltración
    infiltration_index = (params.rainfall_intensity_mmh * params.rainfall_duration_h) / 450.0
    effective_saturation = np.clip(
        params.initial_saturation + infiltration_index * (1.0 - 0.65 * params.drainage_efficiency),
        0.05,
        1.0
    )

    z = params.soil_depth_m
    gamma = params.unit_weight_knm3
    q = params.surcharge_kpa
    c_prime = params.cohesion_kpa
    tan_phi = np.tan(np.radians(params.friction_angle_deg))

    cos_b = np.cos(slopes_rad)
    sin_b = np.sin(slopes_rad)
    cos2_b = cos_b ** 2

    # Presión de poros u_w (kPa)
    u_w_matrix = effective_saturation * GAMMA_WATER * z * cos2_b
    mean_pore_pressure = float(np.mean(u_w_matrix))

    # Esfuerzo normal efectivo y esfuerzo cortante actuante
    total_vertical_stress = gamma * z + q
    effective_normal_stress = np.maximum((total_vertical_stress * cos2_b) - u_w_matrix, 0.1)
    shear_resistance = c_prime + effective_normal_stress * tan_phi
    driving_shear_stress = np.maximum(total_vertical_stress * sin_b * cos_b, 0.05)

    fs_matrix = np.clip(shear_resistance / driving_shear_stress, 0.15, 5.0)

    min_fs = float(np.percentile(fs_matrix, 2))  # Percentil 2 como FS crítico representativo
    mean_fs = float(np.mean(fs_matrix))
    unstable_pct = float(np.mean(fs_matrix < 1.0) * 100.0)
    warning_pct = float(np.mean((fs_matrix >= 1.0) & (fs_matrix < 1.3)) * 100.0)
    safe_pct = float(np.mean(fs_matrix >= 1.3) * 100.0)

    if min_fs < 1.0 or unstable_pct > 5.0:
        status = "CRITICAL_FAILURE"
    elif min_fs < 1.3 or warning_pct > 15.0:
        status = "MARGINAL"
    else:
        status = "STABLE"

    # Curva de sensibilidad: FS medio y crítico en función de la intensidad de lluvia (0 a 160 mm/h)
    sensitivity_curve = []
    for rain_val in [0, 20, 40, 60, 80, 100, 120, 160]:
        inf_idx = (rain_val * params.rainfall_duration_h) / 450.0
        sat_val = float(np.clip(params.initial_saturation + inf_idx * (1.0 - 0.65 * params.drainage_efficiency), 0.05, 1.0))
        u_temp = sat_val * GAMMA_WATER * z * cos2_b
        sigma_n_temp = np.maximum((total_vertical_stress * cos2_b) - u_temp, 0.1)
        fs_temp = np.clip((c_prime + sigma_n_temp * tan_phi) / driving_shear_stress, 0.15, 5.0)
        sensitivity_curve.append({
            "rainfall_mmh": rain_val,
            "critical_fs": round(float(np.percentile(fs_temp, 2)), 2),
            "mean_fs": round(float(np.mean(fs_temp)), 2),
            "saturation_pct": round(sat_val * 100, 1)
        })

    return SimulationSummary(
        min_fs=round(min_fs, 3),
        mean_fs=round(mean_fs, 3),
        max_slope_deg=round(float(np.max(slopes_deg)), 1),
        mean_slope_deg=round(float(np.mean(slopes_deg)), 1),
        effective_saturation=round(float(effective_saturation), 3),
        pore_pressure_kpa=round(mean_pore_pressure, 2),
        unstable_cells_pct=round(unstable_pct, 2),
        critical_warning_cells_pct=round(warning_pct, 2),
        safe_cells_pct=round(safe_pct, 2),
        stability_status=status,
        sensitivity_curve=sensitivity_curve,
        equation_metadata={
            "model_name": "Infinite Slope Mohr-Coulomb with Pore Water Pressure",
            "formula": "FS = [c' + ((γ·z + q)·cos²β - u_w)·tan(φ')] / [(γ·z + q)·sinβ·cosβ]",
            "assumptions": [
                "Superficie de falla planar paralela a la superficie del talud (z << longitud de la ladera).",
                "Suelo isotrópico dentro de cada celda discretizada.",
                "Flujo paralelo al talud con nivel freático relativo m_w.",
                "No contempla efectos tridimensionales de borde ni succión matricial en suelos no saturados."
            ],
            "data_origin": "SYNTHETIC_DEMO (Terreno procedimental calibrado)"
        }
    )
