-- Add skill-specific columns to content_item table
ALTER TABLE content_item
    ADD COLUMN file_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN file_size BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN file_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN preview_content TEXT;
