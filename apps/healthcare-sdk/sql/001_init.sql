-- Healthcare database schema for HIPAA-compliant data management

-- Immutable append-only log of healthcare events
CREATE TABLE IF NOT EXISTS healthcare_events (
  id BIGSERIAL PRIMARY KEY,
  canon_tx_hash TEXT UNIQUE NOT NULL,
  block_number BIGINT NOT NULL,
  block_time TIMESTAMPTZ NOT NULL,
  patient_commit BYTEA NOT NULL,
  record_commit BYTEA NOT NULL,
  consent_commit BYTEA NOT NULL,
  provider_commit BYTEA NOT NULL,
  operation_type INTEGER NOT NULL CHECK (operation_type >= 0 AND operation_type <= 7),
  assurance_level INTEGER NOT NULL CHECK (assurance_level >= 0 AND assurance_level <= 4),
  evidence_uri TEXT NOT NULL,
  indexed_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Current patient consent status
CREATE TABLE IF NOT EXISTS patient_consent_status (
  patient_commit BYTEA PRIMARY KEY,
  has_consent BOOLEAN NOT NULL,
  last_updated_tx TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Record access tracking
CREATE TABLE IF NOT EXISTS record_access_log (
  record_commit BYTEA PRIMARY KEY,
  last_access_time TIMESTAMPTZ NOT NULL,
  last_access_tx TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Breach reports
CREATE TABLE IF NOT EXISTS breach_reports (
  id BIGSERIAL PRIMARY KEY,
  patient_commit BYTEA NOT NULL,
  record_commit BYTEA NOT NULL,
  reporter TEXT NOT NULL,
  canon_tx TEXT NOT NULL,
  evidence_uri TEXT NOT NULL,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Clinical trial participants
CREATE TABLE IF NOT EXISTS trial_participants (
  id BIGSERIAL PRIMARY KEY,
  patient_commit BYTEA NOT NULL,
  trial_id TEXT NOT NULL,
  consent_type TEXT NOT NULL,
  consent_granted BOOLEAN NOT NULL,
  consent_tx TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Healthcare provider activity
CREATE TABLE IF NOT EXISTS provider_activity (
  provider_address TEXT PRIMARY KEY,
  total_events BIGINT NOT NULL DEFAULT 0,
  last_activity TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit log for compliance
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  patient_id TEXT,
  provider_id TEXT,
  record_hash TEXT,
  purpose TEXT,
  canon_tx TEXT,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_healthcare_events_patient ON healthcare_events(patient_commit);
CREATE INDEX IF NOT EXISTS idx_healthcare_events_record ON healthcare_events(record_commit);
CREATE INDEX IF NOT EXISTS idx_healthcare_events_operation ON healthcare_events(operation_type);
CREATE INDEX IF NOT EXISTS idx_healthcare_events_block ON healthcare_events(block_number);
CREATE INDEX IF NOT EXISTS idx_healthcare_events_time ON healthcare_events(block_time);

CREATE INDEX IF NOT EXISTS idx_consent_status_updated ON patient_consent_status(updated_at);
CREATE INDEX IF NOT EXISTS idx_record_access_time ON record_access_log(last_access_time);
CREATE INDEX IF NOT EXISTS idx_breach_reports_patient ON breach_reports(patient_commit);
CREATE INDEX IF NOT EXISTS idx_breach_reports_time ON breach_reports(reported_at);
CREATE INDEX IF NOT EXISTS idx_trial_participants_trial ON trial_participants(trial_id);
CREATE INDEX IF NOT EXISTS idx_trial_participants_patient ON trial_participants(patient_commit);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_patient ON audit_log(patient_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);

-- Views for common queries
CREATE OR REPLACE VIEW consent_summary AS
SELECT 
  patient_commit,
  has_consent,
  last_updated_tx,
  updated_at
FROM patient_consent_status;

CREATE OR REPLACE VIEW recent_breaches AS
SELECT 
  patient_commit,
  record_commit,
  reporter,
  canon_tx,
  evidence_uri,
  reported_at
FROM breach_reports
WHERE reported_at >= NOW() - INTERVAL '30 days'
ORDER BY reported_at DESC;

CREATE OR REPLACE VIEW provider_stats AS
SELECT 
  provider_address,
  total_events,
  last_activity,
  created_at
FROM provider_activity
ORDER BY total_events DESC;

-- Functions for common operations
CREATE OR REPLACE FUNCTION get_patient_consent_status(patient_commit_param BYTEA)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT has_consent 
    FROM patient_consent_status 
    WHERE patient_commit = patient_commit_param
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_record_last_access(record_commit_param BYTEA)
RETURNS TIMESTAMPTZ AS $$
BEGIN
  RETURN (
    SELECT last_access_time 
    FROM record_access_log 
    WHERE record_commit = record_commit_param
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_breach_count_since(since_date TIMESTAMPTZ)
RETURNS BIGINT AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) 
    FROM breach_reports 
    WHERE reported_at >= since_date
  );
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) for HIPAA compliance
ALTER TABLE healthcare_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_consent_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE record_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE breach_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Create roles for different access levels
CREATE ROLE healthcare_provider;
CREATE ROLE healthcare_auditor;
CREATE ROLE healthcare_admin;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON healthcare_events TO healthcare_provider;
GRANT SELECT, INSERT, UPDATE ON patient_consent_status TO healthcare_provider;
GRANT SELECT, INSERT, UPDATE ON record_access_log TO healthcare_provider;
GRANT SELECT, INSERT, UPDATE ON trial_participants TO healthcare_provider;
GRANT SELECT, INSERT ON audit_log TO healthcare_provider;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO healthcare_auditor;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO healthcare_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO healthcare_admin;

-- Create policies for RLS
CREATE POLICY healthcare_provider_policy ON healthcare_events
  FOR ALL TO healthcare_provider
  USING (true);

CREATE POLICY healthcare_auditor_policy ON healthcare_events
  FOR SELECT TO healthcare_auditor
  USING (true);

CREATE POLICY healthcare_admin_policy ON healthcare_events
  FOR ALL TO healthcare_admin
  USING (true);

-- Apply similar policies to other tables
CREATE POLICY patient_consent_provider_policy ON patient_consent_status
  FOR ALL TO healthcare_provider
  USING (true);

CREATE POLICY record_access_provider_policy ON record_access_log
  FOR ALL TO healthcare_provider
  USING (true);

CREATE POLICY breach_reports_provider_policy ON breach_reports
  FOR ALL TO healthcare_provider
  USING (true);

CREATE POLICY trial_participants_provider_policy ON trial_participants
  FOR ALL TO healthcare_provider
  USING (true);

CREATE POLICY audit_log_provider_policy ON audit_log
  FOR ALL TO healthcare_provider
  USING (true);
