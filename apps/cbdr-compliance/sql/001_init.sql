-- Cross-Border Data Regulation (CBDR) Database Schema
-- PostgreSQL schema for GDPR compliance checking

-- ============================================================================
-- Core Tables
-- ============================================================================

-- Transfer request logs for audit trail
CREATE TABLE transfer_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id VARCHAR(255) UNIQUE NOT NULL,
    origin_country CHAR(2) NOT NULL,
    destination_country CHAR(2) NOT NULL,
    vendor_id VARCHAR(255) NOT NULL,
    controller VARCHAR(500) NOT NULL,
    purpose TEXT NOT NULL,
    data_categories TEXT[] NOT NULL,
    special_categories BOOLEAN NOT NULL DEFAULT FALSE,
    claimed_legal_basis VARCHAR(50) NOT NULL,
    decision VARCHAR(50) NOT NULL,
    legal_basis_resolved VARCHAR(50) NOT NULL,
    rationale TEXT NOT NULL,
    machine_rationale JSONB NOT NULL,
    audit_token VARCHAR(255) UNIQUE NOT NULL,
    client_ref VARCHAR(255),
    signature TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    transfer_date TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Vendor registry for attestations and certifications
CREATE TABLE vendors (
    vendor_id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    website VARCHAR(500),
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vendor attestations (SCC modules, BCRs, etc.)
CREATE TABLE vendor_attestations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id VARCHAR(255) NOT NULL REFERENCES vendors(vendor_id),
    program VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    attestation_id VARCHAR(255) UNIQUE NOT NULL,
    issued_date TIMESTAMP WITH TIME ZONE NOT NULL,
    expiry_date TIMESTAMP WITH TIME ZONE,
    modules TEXT[],
    certifications TEXT[],
    evidence_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Regulatory data sources (adequacy decisions, SCC updates, etc.)
CREATE TABLE regulatory_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL, -- 'adequacy', 'scc', 'guidance', 'framework'
    country_code CHAR(2),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    data JSONB NOT NULL,
    effective_date TIMESTAMP WITH TIME ZONE NOT NULL,
    expiry_date TIMESTAMP WITH TIME ZONE,
    source VARCHAR(500) NOT NULL,
    url TEXT,
    reference VARCHAR(255),
    impact VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'high', 'medium', 'low'
    affected_countries TEXT[],
    affected_vendors TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cache entries for performance optimization
CREATE TABLE cache_entries (
    cache_key VARCHAR(500) PRIMARY KEY,
    response_data JSONB NOT NULL,
    ttl_seconds INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    regulatory_version VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Webhook subscriptions for audit streams
CREATE TABLE webhook_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint_url TEXT NOT NULL,
    events TEXT[] NOT NULL,
    secret_token VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    retry_attempts INTEGER NOT NULL DEFAULT 3,
    last_delivery TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook delivery logs
CREATE TABLE webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES webhook_subscriptions(id),
    event_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'pending', 'delivered', 'failed'
    response_code INTEGER,
    response_body TEXT,
    attempts INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Transfer logs indexes
CREATE INDEX idx_transfer_logs_request_id ON transfer_logs(request_id);
CREATE INDEX idx_transfer_logs_audit_token ON transfer_logs(audit_token);
CREATE INDEX idx_transfer_logs_countries ON transfer_logs(origin_country, destination_country);
CREATE INDEX idx_transfer_logs_vendor ON transfer_logs(vendor_id);
CREATE INDEX idx_transfer_logs_created_at ON transfer_logs(created_at);
CREATE INDEX idx_transfer_logs_decision ON transfer_logs(decision);

-- Vendor attestations indexes
CREATE INDEX idx_vendor_attestations_vendor_id ON vendor_attestations(vendor_id);
CREATE INDEX idx_vendor_attestations_program ON vendor_attestations(program);
CREATE INDEX idx_vendor_attestations_status ON vendor_attestations(status);
CREATE INDEX idx_vendor_attestations_expiry ON vendor_attestations(expiry_date);

-- Regulatory data indexes
CREATE INDEX idx_regulatory_data_type ON regulatory_data(type);
CREATE INDEX idx_regulatory_data_country ON regulatory_data(country_code);
CREATE INDEX idx_regulatory_data_effective_date ON regulatory_data(effective_date);
CREATE INDEX idx_regulatory_data_impact ON regulatory_data(impact);

-- Cache entries indexes
CREATE INDEX idx_cache_entries_expires_at ON cache_entries(expires_at);
CREATE INDEX idx_cache_entries_regulatory_version ON cache_entries(regulatory_version);

-- Webhook indexes
CREATE INDEX idx_webhook_deliveries_subscription ON webhook_deliveries(subscription_id);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX idx_webhook_deliveries_created_at ON webhook_deliveries(created_at);

-- ============================================================================
-- Views for Common Queries
-- ============================================================================

-- Active vendor attestations view
CREATE VIEW active_vendor_attestations AS
SELECT 
    va.*,
    v.name as vendor_name,
    v.website as vendor_website
FROM vendor_attestations va
JOIN vendors v ON va.vendor_id = v.vendor_id
WHERE va.status = 'active' 
  AND (va.expiry_date IS NULL OR va.expiry_date > NOW())
  AND v.status = 'active';

-- Transfer decision summary view
CREATE VIEW transfer_decision_summary AS
SELECT 
    origin_country,
    destination_country,
    decision,
    legal_basis_resolved,
    COUNT(*) as count,
    DATE_TRUNC('day', created_at) as date
FROM transfer_logs
GROUP BY origin_country, destination_country, decision, legal_basis_resolved, DATE_TRUNC('day', created_at);

-- Regulatory data by country view
CREATE VIEW regulatory_data_by_country AS
SELECT 
    country_code,
    type,
    title,
    effective_date,
    expiry_date,
    impact,
    data
FROM regulatory_data
WHERE country_code IS NOT NULL
  AND (expiry_date IS NULL OR expiry_date > NOW())
ORDER BY effective_date DESC;

-- ============================================================================
-- Functions and Triggers
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_attestations_updated_at BEFORE UPDATE ON vendor_attestations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_regulatory_data_updated_at BEFORE UPDATE ON regulatory_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhook_subscriptions_updated_at BEFORE UPDATE ON webhook_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM cache_entries WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Initial Data
-- ============================================================================

-- Insert major cloud vendors
INSERT INTO vendors (vendor_id, name, website, description) VALUES
('aws', 'Amazon Web Services', 'https://aws.amazon.com', 'Cloud computing platform'),
('azure', 'Microsoft Azure', 'https://azure.microsoft.com', 'Cloud computing platform'),
('gcp', 'Google Cloud Platform', 'https://cloud.google.com', 'Cloud computing platform'),
('salesforce', 'Salesforce', 'https://salesforce.com', 'CRM and cloud platform'),
('snowflake', 'Snowflake', 'https://snowflake.com', 'Cloud data platform'),
('workday', 'Workday', 'https://workday.com', 'Enterprise cloud applications'),
('zendesk', 'Zendesk', 'https://zendesk.com', 'Customer service platform'),
('servicenow', 'ServiceNow', 'https://servicenow.com', 'Digital workflow platform'),
('hubspot', 'HubSpot', 'https://hubspot.com', 'Marketing and sales platform');

-- Insert EU-US Data Privacy Framework adequacy decision
INSERT INTO regulatory_data (type, country_code, title, description, data, effective_date, source, url, reference, impact) VALUES
('adequacy', 'US', 'EU-US Data Privacy Framework Adequacy Decision', 'European Commission adequacy decision for US under DPF', 
 '{"status": "adequate", "framework": "EU-US Data Privacy Framework", "effective_date": "2023-07-10"}',
 '2023-07-10T00:00:00Z', 'European Commission', 
 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023D1025',
 'Commission Implementing Decision (EU) 2023/1025', 'high');

-- Insert SCC 2021/914
INSERT INTO regulatory_data (type, title, description, data, effective_date, source, url, reference, impact) VALUES
('scc', 'Standard Contractual Clauses 2021/914', 'EU Commission implementing decision on standard contractual clauses', 
 '{"version": "2021/914", "modules": ["Module_One", "Module_Two", "Module_Three", "Module_Four"], "effective_date": "2021-06-27"}',
 '2021-06-27T00:00:00Z', 'European Commission',
 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32021D0914',
 'Commission Implementing Decision (EU) 2021/914', 'high');

-- ============================================================================
-- Permissions
-- ============================================================================

-- Create application user (adjust as needed for your environment)
-- CREATE USER cbdr_app WITH PASSWORD 'your_secure_password';
-- GRANT CONNECT ON DATABASE cbdr_compliance TO cbdr_app;
-- GRANT USAGE ON SCHEMA public TO cbdr_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO cbdr_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO cbdr_app;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO cbdr_app;
