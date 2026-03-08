ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'QPAY';

ALTER TABLE "Sale"
ADD COLUMN "paymentBreakdown" JSONB;

UPDATE "Sale"
SET "paymentBreakdown" = jsonb_build_array(
  jsonb_build_object(
    'method', "paymentMethod"::text,
    'amount', "total"
  )
)
WHERE "paymentBreakdown" IS NULL;