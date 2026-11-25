-- ============================================================================
-- SQL SCHEMA: IAM, GRANULAR ROLES & WORKFORCE DIRECTORY
-- Save as: sql/iam_and_people_schema.sql
-- ============================================================================

-- 1. Extend users table with lifecycle & directory columns
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS emp_id VARCHAR(32),
  ADD COLUMN IF NOT EXISTS phone VARCHAR(32),
  ADD COLUMN IF NOT EXISTS reporting_manager VARCHAR(128),
  ADD COLUMN IF NOT EXISTS franchise_partner VARCHAR(128),
  ADD COLUMN IF NOT EXISTS location VARCHAR(128),
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS login_count_30d INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deactivated_by VARCHAR(128),
  ADD COLUMN IF NOT EXISTS deactivated_on DATE,
  ADD COLUMN IF NOT EXISTS deactivated_reason TEXT,
  ADD COLUMN IF NOT EXISTS access_expiry DATE,
  ADD COLUMN IF NOT EXISTS reactivation_requested BOOLEAN DEFAULT FALSE;

-- 2. Granular Role Permissions Table (View, Create, Edit, Delete, Export, Approve + Data Scope)
CREATE TABLE IF NOT EXISTS role_permissions_granular (
  id SERIAL PRIMARY KEY,
  role_id INT NOT NULL,
  role_name VARCHAR(64) NOT NULL,
  data_scope VARCHAR(32) DEFAULT 'Own Data',
  module_key VARCHAR(64) NOT NULL,
  can_view BOOLEAN DEFAULT TRUE,
  can_create BOOLEAN DEFAULT FALSE,
  can_edit BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  can_export BOOLEAN DEFAULT FALSE,
  can_approve BOOLEAN DEFAULT FALSE,
  last_modified_by VARCHAR(128),
  last_modified_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, module_key)
);

-- 3. Unified Audit Logs across Access, Roles, and User Directory
CREATE TABLE IF NOT EXISTS iam_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  domain VARCHAR(32) NOT NULL, -- 'ACCESS' | 'ROLE' | 'USER'
  target_id VARCHAR(64),
  target_name VARCHAR(128),
  action VARCHAR(255) NOT NULL,
  reason TEXT,
  actor_name VARCHAR(128) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

