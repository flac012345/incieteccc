import { GeotechParameters, CellInspectionData, SimulationSummary } from '../types/geotech';

const GAMMA_WATER = 9.81;

/**
 * Función de ruido pseudo-perlin determinista multi-octava para generar una cuenca montañosa realista
 * con ladera principal, escarpe superior, talud medio, zona de socavación basal, río y carretera en el valle.
 */
export function pseudoNoise2D(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

export function smoothNoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const u = fx * fx * (3.0 - 2.0 * fx);
  const v = fy * fy * (3.0 - 2.0 * fy);

  const a = pseudoNoise2D(ix, iy);
  const b = pseudoNoise2D(ix + 1, iy);
  const c = pseudoNoise2D(ix, iy + 1);
  const d = pseudoNoise2D(ix + 1, iy + 1);

  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
}

export function fbm(x: number, y: number): number {
  let value = 0.0;
  let amplitude = 0.5;
  let frequency = 1.0;
  for (let i = 0; i < 4; i++) {
    value += amplitude * smoothNoise(x * frequency, y * frequency);
    frequency *= 2.05;
    amplitude *= 0.5;
  }
  return value;
}

/**
 * Calcula la elevación (m), pendiente local (°), saturación y Factor de Seguridad (FS) en cualquier coordenada (x, z)
 * del dominio [-60, 60] x [-60, 60].
 */
export function evaluatePointGeotech(
  x: number,
  z: number,
  params: GeotechParameters
): CellInspectionData {
  // Normalización [-1, 1]
  const nx = x / 60;
  const nz = z / 60;

  // Morfología de ladera andina: alta elevación al norte/oeste (nx < 0), valle con río y carretera hacia nx > 0.35
  const slopeProfile = Math.max(0, (0.45 - nx) * 38.0 * params.slope_multiplier);
  const ridgeDetail = fbm((nx + 1.5) * 2.8, (nz + 1.5) * 2.8) * 14.0 * params.slope_multiplier;
  const gullyCarving = Math.exp(-Math.pow(nz * 2.2, 2)) * Math.max(0, 0.3 - nx) * -8.5;

  // Erosión en la base de la ladera (zona focalizada cerca de nx in [0.05, 0.32])
  const isToeZone = nx > 0.02 && nx < 0.32 && Math.abs(nz) < 0.55;
  const toeScour = isToeZone
    ? -params.toe_erosion_factor * 4.5 * Math.exp(-Math.pow((nx - 0.18) * 9, 2))
    : 0;

  // Cauce del río en el valle
  const riverChannel = Math.exp(-Math.pow((nx - 0.55) * 10, 2)) * -3.2;

  const elevation = Math.max(2.0, slopeProfile + ridgeDetail + gullyCarving + toeScour + riverChannel + 10.0);

  // Pendiente local mediante diferencias finitas centrales
  const delta = 0.8;
  const elevX1 = Math.max(
    2.0,
    Math.max(0, (0.45 - (x + delta) / 60) * 38.0 * params.slope_multiplier) +
      fbm(((x + delta) / 60 + 1.5) * 2.8, (nz + 1.5) * 2.8) * 14.0 * params.slope_multiplier
  );
  const elevZ1 = Math.max(
    2.0,
    Math.max(0, (0.45 - nx) * 38.0 * params.slope_multiplier) +
      fbm((nx + 1.5) * 2.8, ((z + delta) / 60 + 1.5) * 2.8) * 14.0 * params.slope_multiplier
  );

  const dzdx = (elevX1 - (slopeProfile + ridgeDetail)) / delta;
  const dzdz = (elevZ1 - (slopeProfile + ridgeDetail)) / delta;
  let slopeRad = Math.atan(Math.sqrt(dzdx * dzdx + dzdz * dzdz));

  if (isToeZone) {
    slopeRad += (params.toe_erosion_factor * 15.0 * Math.PI) / 180.0;
  }
  const slopeDeg = Math.min(72.0, Math.max(2.0, (slopeRad * 180.0) / Math.PI));
  const beta = (slopeDeg * Math.PI) / 180.0;

  // Saturación efectiva local (mayor acumulación hídrica en vaguadas centrales y pie de talud)
  const topographicWetnessBonus = Math.exp(-Math.pow(nz * 2.0, 2)) * 0.14;
  const infiltrationIndex = (params.rainfall_intensity_mmh * params.rainfall_duration_h) / 450.0;
  const localSaturation = Math.min(
    1.0,
    Math.max(
      0.05,
      params.initial_saturation +
        infiltrationIndex * (1.0 - 0.65 * params.drainage_efficiency) +
        topographicWetnessBonus
    )
  );

  // Ecuación de Talud Infinito (Mohr-Coulomb + Presión de Poros)
  const cosB = Math.cos(beta);
  const sinB = Math.sin(beta);
  const cos2B = cosB * cosB;

  const porePressure = localSaturation * GAMMA_WATER * params.soil_depth_m * cos2B;
  const totalStress = params.unit_weight_knm3 * params.soil_depth_m + params.surcharge_kpa;
  const effectiveNormal = Math.max(0.1, totalStress * cos2B - porePressure);
  const tanPhi = Math.tan((params.friction_angle_deg * Math.PI) / 180.0);

  const resistingShear = params.cohesion_kpa + effectiveNormal * tanPhi;
  const drivingShear = Math.max(0.08, totalStress * sinB * cosB);

  const fs = Math.min(5.0, Math.max(0.15, resistingShear / drivingShear));

  let zoneType: CellInspectionData['zone_type'] = 'MID_SLOPE';
  if (nx < -0.35) zoneType = 'CREST';
  else if (isToeZone) zoneType = 'TOE_EROSION';
  else if (nx > 0.35) zoneType = 'VALLEY_ROAD';

  return {
    x: Number(x.toFixed(1)),
    z: Number(z.toFixed(1)),
    elevation_m: Number(elevation.toFixed(2)),
    slope_deg: Number(slopeDeg.toFixed(1)),
    local_saturation: Number(localSaturation.toFixed(3)),
    pore_pressure_kpa: Number(porePressure.toFixed(2)),
    safety_factor: Number(fs.toFixed(2)),
    zone_type: zoneType,
  };
}

/**
 * Calcula el resumen estadístico completo en el cliente como respaldo inmediato o sincronizado con FastAPI
 */
export function computeLocalSummary(params: GeotechParameters): SimulationSummary {
  const fsList: number[] = [];
  const slopeList: number[] = [];
  const satList: number[] = [];
  const poreList: number[] = [];

  for (let ix = -50; ix <= 30; ix += 4) {
    for (let iz = -50; iz <= 50; iz += 4) {
      const cell = evaluatePointGeotech(ix, iz, params);
      fsList.push(cell.safety_factor);
      slopeList.push(cell.slope_deg);
      satList.push(cell.local_saturation);
      poreList.push(cell.pore_pressure_kpa);
    }
  }

  fsList.sort((a, b) => a - b);
  const minFs = fsList[Math.floor(fsList.length * 0.03)] || 1.0;
  const meanFs = fsList.reduce((a, b) => a + b, 0) / fsList.length;
  const maxSlope = Math.max(...slopeList);
  const meanSlope = slopeList.reduce((a, b) => a + b, 0) / slopeList.length;
  const meanSat = satList.reduce((a, b) => a + b, 0) / satList.length;
  const meanPore = poreList.reduce((a, b) => a + b, 0) / poreList.length;

  const unstablePct = (fsList.filter((v) => v < 1.0).length / fsList.length) * 100;
  const warningPct = (fsList.filter((v) => v >= 1.0 && v < 1.3).length / fsList.length) * 100;
  const safePct = (fsList.filter((v) => v >= 1.3).length / fsList.length) * 100;

  let status: SimulationSummary['stability_status'] = 'STABLE';
  if (minFs < 1.0 || unstablePct > 5.0) status = 'CRITICAL_FAILURE';
  else if (minFs < 1.3 || warningPct > 15.0) status = 'MARGINAL';

  const sensitivity_curve = [0, 20, 40, 60, 80, 100, 120, 160].map((rain) => {
    const tempParams = { ...params, rainfall_intensity_mmh: rain };
    const sampleCell = evaluatePointGeotech(0, 0, tempParams);
    const crestCell = evaluatePointGeotech(-12, 0, tempParams);
    return {
      rainfall_mmh: rain,
      critical_fs: Number(Math.min(sampleCell.safety_factor, crestCell.safety_factor * 0.85).toFixed(2)),
      mean_fs: Number(((sampleCell.safety_factor + crestCell.safety_factor) / 2).toFixed(2)),
      saturation_pct: Number((sampleCell.local_saturation * 100).toFixed(1)),
    };
  });

  return {
    min_fs: Number(minFs.toFixed(2)),
    mean_fs: Number(meanFs.toFixed(2)),
    max_slope_deg: Number(maxSlope.toFixed(1)),
    mean_slope_deg: Number(meanSlope.toFixed(1)),
    effective_saturation: Number(meanSat.toFixed(3)),
    pore_pressure_kpa: Number(meanPore.toFixed(2)),
    unstable_cells_pct: Number(unstablePct.toFixed(1)),
    critical_warning_cells_pct: Number(warningPct.toFixed(1)),
    safe_cells_pct: Number(safePct.toFixed(1)),
    stability_status: status,
    sensitivity_curve,
    equation_metadata: {
      model_name: 'Infinite Slope Mohr-Coulomb with Pore Water Pressure',
      formula: "FS = [c' + ((γ·z + q)·cos²β - u_w)·tan(φ')] / [(γ·z + q)·sinβ·cosβ]",
      assumptions: [
        'Superficie de falla planar paralela a la ladera.',
        'Infiltración vertical que genera nivel freático colgado proporcional a lluvia/drenaje.',
        'Datos topográficos sintéticos procedimentales (No apto para decisiones de evacuación civil).',
      ],
      data_origin: 'SYNTHETIC_DEMO',
    },
  };
}
