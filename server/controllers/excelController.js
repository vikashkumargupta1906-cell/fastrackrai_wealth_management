const xlsx = require("xlsx");
const { standardizeExcelWithClaude } = require("../services/claudeParser");
const { Household, Member, Account, BankDetail, sequelize } = require("../models");

// ─── Upload & Process Excel ────────────────────────────────────────────────────

const uploadExcel = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  let transaction;

  try {
    // 1. Parse Excel → raw JSON
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const rawJson = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {
      defval: null, // missing cells → null instead of undefined
    });

    if (!rawJson.length) {
      return res.status(400).json({ error: "Excel file is empty or unreadable." });
    }

    console.log(`Excel parsed: ${rawJson.length} rows found.`);

    // 2. Send to Claude for standardization
    const standardized = await standardizeExcelWithClaude(rawJson);

    if (!standardized?.households?.length) {
      return res.status(422).json({ error: "Claude could not extract any households from the file." });
    }

    // 3. Save everything inside a single transaction
    transaction = await sequelize.transaction();

    const savedHouseholds = [];

    for (const householdData of standardized.households) {
      const saved = await saveHousehold(householdData, transaction);
      savedHouseholds.push(saved);
    }

    await transaction.commit();

    console.log(`Successfully saved ${savedHouseholds.length} household(s).`);

    return res.status(201).json({
      success: true,
      message: `Successfully imported ${savedHouseholds.length} household(s).`,
      households: savedHouseholds.map((h) => ({
        id: h.id,
        name: h.name,
        membersCount: h.memberCount,
        accountsCount: h.accountCount,
        bankDetailsCount: h.bankDetailCount,
      })),
    });

  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("uploadExcel error:", error);
    return res.status(500).json({ error: error.message || "Internal server error." });
  }
};

// ─── Save a Single Household + Relations ──────────────────────────────────────

const saveHousehold = async (householdData, transaction) => {
  const {
    name,
    annualIncome,
    netWorth,
    liquidNetWorth,
    expenseRange,
    taxBracket,
    riskTolerance,
    timeHorizon,
    audioNotes,
    members = [],
    accounts = [],
    bankDetails = [],
  } = householdData;

  // Create Household
  const household = await Household.create(
    {
      name: name || "Unknown Household",
      annualIncome:     toDecimalOrNull(annualIncome),
      netWorth:         toDecimalOrNull(netWorth),
      liquidNetWorth:   toDecimalOrNull(liquidNetWorth),
      expenseRange:     toStringOrNull(expenseRange),
      taxBracket:       toStringOrNull(taxBracket),
      riskTolerance:    toStringOrNull(riskTolerance),
      timeHorizon:      toStringOrNull(timeHorizon),
      audioNotes:       toStringOrNull(audioNotes),
    },
    { transaction }
  );

  // Create Members
  const memberRecords = [];
  for (const m of members) {
    if (!m.firstName || !m.lastName) {
      console.warn(`Skipping member with missing name in household "${name}":`, m);
      continue;
    }

    const member = await Member.create(
      {
        householdId:  household.id,
        firstName:    m.firstName.trim(),
        lastName:     m.lastName.trim(),
        dob:          toDateOrNull(m.dob),
        email:        toEmailOrNull(m.email),
        phone:        toStringOrNull(m.phone),
        relationship: toStringOrNull(m.relationship),
        street:       toStringOrNull(m.street),
        city:         toStringOrNull(m.city),
        state:        toStringOrNull(m.state),
        zip:          toStringOrNull(m.zip),
      },
      { transaction }
    );
    memberRecords.push(member);
  }

  // Create Accounts
  const accountRecords = [];
  for (const a of accounts) {
    const account = await Account.create(
      {
        householdId:      household.id,
        accountNumber:    toStringOrNull(a.accountNumber),
        custodian:        toStringOrNull(a.custodian),
        accountType:      toStringOrNull(a.accountType),
        value:            toDecimalOrNull(a.value) ?? 0.00,
        ownershipPercent: toDecimalOrNull(a.ownershipPercent) ?? 100.00,
      },
      { transaction }
    );
    accountRecords.push(account);
  }

  // Create Bank Details
  const bankDetailRecords = [];
  for (const b of bankDetails) {
    const bankDetail = await BankDetail.create(
      {
        householdId:   household.id,
        bankName:      toStringOrNull(b.bankName),
        accountNumber: toBigIntOrNull(b.accountNumber),
        routingNumber: toStringOrNull(b.routingNumber),
      },
      { transaction }
    );
    bankDetailRecords.push(bankDetail);
  }

  return {
    id: household.id,
    name: household.name,
    memberCount: memberRecords.length,
    accountCount: accountRecords.length,
    bankDetailCount: bankDetailRecords.length,
  };
};

// ─── Type Helpers ──────────────────────────────────────────────────────────────

/**
 * Converts a value to a decimal number or null.
 * Handles strings like "$1,500,000" or "150,000".
 */
const toDecimalOrNull = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return isNaN(value) ? null : value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[$,\s]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
  return null;
};

/**
 * Converts value to string or null. Trims whitespace.
 */
const toStringOrNull = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const str = String(value).trim();
  return str === "" ? null : str;
};

/**
 * Parses a date string to YYYY-MM-DD for Sequelize DATEONLY.
 * Returns null if invalid.
 */
const toDateOrNull = (value) => {
  if (!value) return null;
  const str = String(value).trim();
  // Already in YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  // Try native Date parsing
  const d = new Date(str);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split("T")[0];
};

/**
 * Validates email format. Returns null if invalid.
 */
const toEmailOrNull = (value) => {
  const str = toStringOrNull(value);
  if (!str) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str) ? str : null;
};

/**
 * Converts value to BigInt-safe integer or null (for bank accountNumber).
 */
const toBigIntOrNull = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(String(value).replace(/\D/g, ""));
  return isNaN(num) ? null : num;
};

module.exports = { uploadExcel };