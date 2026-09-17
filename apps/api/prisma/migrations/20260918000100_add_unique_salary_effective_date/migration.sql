-- Replace the lookup index with a uniqueness constraint so concurrent salary
-- submissions cannot create ambiguous records for the same effective date.
DROP INDEX "SalaryRecord_employeeId_effectiveFrom_idx";
CREATE UNIQUE INDEX "SalaryRecord_employeeId_effectiveFrom_key"
ON "SalaryRecord"("employeeId", "effectiveFrom");
