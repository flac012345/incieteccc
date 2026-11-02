import os
from google import genai
from google.genai import types
from .models import AIQueryRequest

SYSTEM_INSTRUCTION = """
Eres el Ingeniero Geotécnico y Geólogo Jefe del sistema TERRASCOPE 3D AI.
Reglas estrictas de comportamiento científico:
1. Basa tu análisis EXCLUSIVAMENTE en los parámetros geotécnicos y resultados del modelo de Talud Infinito provistos en el prompt.
2. NUNCA inventes mediciones de campo, ensayos SPT/CPT inexistentes ni probabilidades exactas de desastre.
3. Diferencia explícitamente entre:
   - Datos de entrada del escenario actual (Simulados/Sintéticos).
   - Resultados matemáticos del modelo Mohr-Coulomb (Factor de Seguridad FS, presión de poros u_w).
   - Hipótesis o recomendaciones de ingeniería (qué estudios reales harían falta: piezometría, sondeos, topografía LiDAR).
4. Recuerda siempre que FS < 1.0 indica inestabilidad teórica en el modelo de talud infinito, entre 1.0 y 1.3 estabilidad marginal, y >= 1.3 condición estable bajo las hipótesis del modelo.
"""

def query_geotech_assistant(req: AIQueryRequest) -> dict:
    api_key = os.getenv("GEMINI_API_KEY")
    context_block = f"""
    [ESTADO GEOTÉCNICO ACTUAL - ORIGEN DE DATOS: SIMULACIÓN SINTÉTICA CONTROLADA]
    - Tipo de material: {req.parameters.material_type}
    - Cohesión efectiva (c'): {req.parameters.cohesion_kpa} kPa
    - Ángulo de fricción interna (phi'): {req.parameters.friction_angle_deg}°
    - Peso unitario (gamma): {req.parameters.unit_weight_knm3} kN/m³
    - Espesor de estrato (z): {req.parameters.soil_depth_m} m
    - Intensidad de lluvia: {req.parameters.rainfall_intensity_mmh} mm/h durante {req.parameters.rainfall_duration_h} h
    - Saturación efectiva calculada: {req.summary.effective_saturation * 100:.1f}%
    - Presión de poros media (u_w): {req.summary.pore_pressure_kpa} kPa
    - Factor de Seguridad Crítico (Percentil 2): {req.summary.min_fs}
    - Factor de Seguridad Medio: {req.summary.mean_fs}
    - Área con FS < 1.0 (Inestable): {req.summary.unstable_cells_pct}%
    - Área con 1.0 <= FS < 1.3 (Marginal): {req.summary.critical_warning_cells_pct}%
    - Erosión basal aplicada: {req.parameters.toe_erosion_factor * 100:.0f}%
    - Sobrecarga externa (q): {req.parameters.surcharge_kpa} kPa
    """

    if req.comparison_summary:
        context_block += f"""
        [ESCENARIO DE COMPARACIÓN GUARDADO]
        - FS Crítico anterior: {req.comparison_summary.min_fs}
        - FS Medio anterior: {req.comparison_summary.mean_fs}
        - Área inestable anterior: {req.comparison_summary.unstable_cells_pct}%
        - Presión de poros anterior: {req.comparison_summary.pore_pressure_kpa} kPa
        """

    if not api_key or api_key == "tu_api_key_aqui":
        # Respuesta determinista de respaldo auditable cuando el usuario aún no configura su GEMINI_API_KEY
        return {
            "provider": "Deterministic Geotechnical Rule Engine (Sin GEMINI_API_KEY configurada en servidor)",
            "answer": (
                f"**Diagnóstico Técnico Auditable:**\n\n"
                f"1. **Estado de Estabilidad ($FS_{{crítico}} = {req.summary.min_fs}$):** "
                f"Con una cohesión $c' = {req.parameters.cohesion_kpa}\\text{{ kPa}}$ y ángulo de fricción $\\phi' = {req.parameters.friction_angle_deg}^\\circ$, "
                f"el terreno presenta un **{req.summary.unstable_cells_pct}\\%** de superficie con $FS < 1.0$.\n"
                f"2. **Efecto Hidráulico ($u_w = {req.summary.pore_pressure_kpa}\\text{{ kPa}}$):** "
                f"La lluvia de ${req.parameters.rainfall_intensity_mmh}\\text{{ mm/h}}$ durante ${req.parameters.rainfall_duration_h}\\text{{ h}}$ eleva la saturación al "
                f"**{req.summary.effective_saturation * 100:.1f}\\%**, reduciendo el esfuerzo normal efectivo $\\sigma'_n$ y abatiendo la resistencia al corte friccionante.\n"
                f"3. **Datos Reales Requeridos para Validación de Campo:** Se requiere levantamiento topográfico LiDAR de alta resolución (DEM $\\le 1\\text{{ m}}$), "
                f"sondeos geotécnicos para determinar la estratigrafía real, ensayos triaxiales CU/CD y lectura de piezómetros de cuerda vibrante."
            ),
            "used_parameters": req.parameters.model_dump()
        }

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"{context_block}\n\nPregunta del usuario: {req.question}",
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                temperature=0.2,
            ),
        )

        return {
            "provider": "Google Gemini 2.5 Flash (SDK oficial google-genai)",
            "answer": response.text,
            "used_parameters": req.parameters.model_dump()
        }
    except Exception as e:
        return {
            "provider": f"Error al consultar Gemini API: {str(e)} (Respaldo determinista activado)",
            "answer": (
                f"**Diagnóstico Geotécnico de Contingencia:**\n\n"
                f"• **Condición Global:** {req.summary.stability_status} con $FS_{{crítico}} = {req.summary.min_fs}$.\n"
                f"• **Presión de Poros:** {req.summary.pore_pressure_kpa} kPa a saturación efectiva del {req.summary.effective_saturation * 100:.1f}%.\n"
                f"• **Área Crítica:** {req.summary.unstable_cells_pct}% de la malla discretizada presenta $FS < 1.0$.\n"
                f"• **Acción recomendada:** Verificar drenajes superficiales e instrumentación piezométrica."
            ),
            "used_parameters": req.parameters.model_dump()
        }
