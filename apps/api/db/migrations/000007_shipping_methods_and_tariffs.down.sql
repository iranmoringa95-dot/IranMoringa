-- Migration 000007 Down

DROP TABLE IF EXISTS shipping_tariff_rules;

ALTER TABLE product_variants 
DROP COLUMN IF EXISTS length_cm,
DROP COLUMN IF EXISTS width_cm,
DROP COLUMN IF EXISTS height_cm;
