CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    location_name VARCHAR(150) NOT NULL,
    boundary GEOMETRY(Polygon, 4326),
    data_source VARCHAR(50) NOT NULL CHECK (data_source IN ('SYNTHETIC_DEMO', 'IMPORTED_DEM', 'FIELD_MEASURED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE simulation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    scenario_name VARCHAR(100) NOT NULL,
    parameters JSONB NOT NULL,
    min_fs NUMERIC(6,3) NOT NULL,
    mean_fs NUMERIC(6,3) NOT NULL,
    unstable_area_pct NUMERIC(5,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
