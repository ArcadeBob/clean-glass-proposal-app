-- CreateEnum
CREATE TYPE "ScoringType" AS ENUM ('LINEAR', 'EXPONENTIAL', 'THRESHOLD', 'CATEGORICAL', 'FORMULA');

-- CreateEnum
CREATE TYPE "DataType" AS ENUM ('NUMERIC', 'PERCENTAGE', 'CURRENCY', 'CATEGORICAL', 'BOOLEAN', 'DATE');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "MarketDataType" AS ENUM ('MATERIAL_PRICE', 'LABOR_RATE', 'ECONOMIC_INDICATOR', 'REGIONAL_MULTIPLIER', 'SEASONAL_FACTOR');

-- CreateTable
CREATE TABLE "risk_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "weight" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risk_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_factors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category_id" TEXT NOT NULL,
    "weight" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "scoringType" "ScoringType" NOT NULL DEFAULT 'LINEAR',
    "dataType" "DataType" NOT NULL DEFAULT 'NUMERIC',
    "minValue" DECIMAL(10,4),
    "maxValue" DECIMAL(10,4),
    "defaultValue" DECIMAL(10,4),
    "options" JSONB,
    "formula" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risk_factors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_assessments" (
    "id" TEXT NOT NULL,
    "proposal_id" TEXT NOT NULL,
    "totalRiskScore" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'LOW',
    "contingencyRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "recommendations" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risk_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_factor_assessments" (
    "id" TEXT NOT NULL,
    "risk_assessment_id" TEXT NOT NULL,
    "risk_factor_id" TEXT NOT NULL,
    "inputValue" DECIMAL(10,4),
    "textValue" TEXT,
    "calculatedScore" DECIMAL(5,2) NOT NULL,
    "weightedScore" DECIMAL(5,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risk_factor_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_data" (
    "id" TEXT NOT NULL,
    "dataType" "MarketDataType" NOT NULL,
    "region" TEXT,
    "value" DECIMAL(10,4) NOT NULL,
    "unit" TEXT,
    "effective_date" TIMESTAMP(3) NOT NULL,
    "source" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "risk_categories_name_key" ON "risk_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "risk_factors_name_category_id_key" ON "risk_factors"("name", "category_id");

-- CreateIndex
CREATE UNIQUE INDEX "risk_assessments_proposal_id_key" ON "risk_assessments"("proposal_id");

-- CreateIndex
CREATE UNIQUE INDEX "risk_factor_assessments_risk_assessment_id_risk_factor_id_key" ON "risk_factor_assessments"("risk_assessment_id", "risk_factor_id");

-- AddForeignKey
ALTER TABLE "risk_factors" ADD CONSTRAINT "risk_factors_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "risk_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_factor_assessments" ADD CONSTRAINT "risk_factor_assessments_risk_assessment_id_fkey" FOREIGN KEY ("risk_assessment_id") REFERENCES "risk_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_factor_assessments" ADD CONSTRAINT "risk_factor_assessments_risk_factor_id_fkey" FOREIGN KEY ("risk_factor_id") REFERENCES "risk_factors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
