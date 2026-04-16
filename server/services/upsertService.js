const { Household, Member, Account } = require('../models');

// Helper function to clean data (remove null/undefined/empty values)
const cleanData = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const cleaned = {};
  Object.keys(data).forEach(key => {
    const value = data[key];
    // Skip null, undefined, empty strings, and empty arrays
    if (value !== null && value !== undefined && value !== '' && 
        (!Array.isArray(value) || value.length > 0)) {
      cleaned[key] = value;
    }
  });
  return cleaned;
};

// Helper function to map normalized column names to model fields
const mapHouseholdFields = (normalizedData) => {
  const fieldMap = {
    'household_name': 'name',
    'annual_income': 'annualIncome',
    'net_worth': 'netWorth',
    'liquid_net_worth': 'liquidNetWorth',
    'expense_range': 'expenseRange',
    'tax_bracket': 'taxBracket',
    'risk_tolerance': 'riskTolerance',
    'time_horizon': 'timeHorizon',
    'audio_notes': 'audioNotes'
  };
  
  const mapped = {};
  Object.keys(normalizedData).forEach(key => {
    const mappedKey = fieldMap[key] || key;
    mapped[mappedKey] = normalizedData[key];
  });
  return mapped;
};

const mapMemberFields = (normalizedData) => {
  const fieldMap = {
    'member_id': 'id',
    'household_id': 'householdId',
    'first_name': 'name',
    'last_name': 'name', // Combine first and last if needed
    'date_of_birth': 'dob',
    'relationship': 'relationship',
    'street': 'street',
    'city': 'city',
    'state': 'state',
    'zip': 'zip'
  };
  
  const mapped = {};
  Object.keys(normalizedData).forEach(key => {
    const mappedKey = fieldMap[key] || key;
    mapped[mappedKey] = normalizedData[key];
  });
  return mapped;
};

const mapAccountFields = (normalizedData) => {
  const fieldMap = {
    'account_id': 'id',
    'household_id': 'householdId',
    'member_id': 'householdId', // Map member_id to householdId for now
    'account_type': 'accountType',
    'account_number': 'accountNumber',
    'balance': 'value',
    'open_date': 'createdAt',
    'custodian': 'custodian',
    'ownership_percent': 'ownershipPercent'
  };
  
  const mapped = {};
  Object.keys(normalizedData).forEach(key => {
    const mappedKey = fieldMap[key] || key;
    mapped[mappedKey] = normalizedData[key];
  });
  return mapped;
};

// Main upsert function
const upsertExcelData = async (parsedSheets) => {
  const results = {
    households: { created: 0, updated: 0 },
    members: { created: 0, updated: 0 },
    accounts: { created: 0, updated: 0 },
    errors: []
  };
  
  try {
    // Process household sheet first
    const householdSheet = parsedSheets.find(sheet => sheet.sheetType === 'household');
    let householdId = null;
    
    if (householdSheet && householdSheet.data.length > 0) {
      const householdData = householdSheet.data[0]; // Take first household
      const mappedHousehold = mapHouseholdFields(householdData);
      const cleanedHousehold = cleanData(mappedHousehold);
      
      // Use findOrCreate for household (match by name)
      const [household, created] = await Household.findOrCreate({
        where: { name: cleanedHousehold.name },
        defaults: cleanedHousehold
      });
      
      householdId = household.id;
      if (created) {
        results.households.created++;
      } else {
        // Update existing household with new non-null data
        await household.update(cleanedHousehold);
        results.households.updated++;
      }
    }
    
    if (!householdId) {
      throw new Error('No household found or created');
    }
    
    // Process members sheet
    const membersSheet = parsedSheets.find(sheet => sheet.sheetType === 'member');
    if (membersSheet && membersSheet.data.length > 0) {
      const membersData = membersSheet.data.map(member => {
        const mappedMember = mapMemberFields(member);
        const cleanedMember = cleanData(mappedMember);
        cleanedMember.householdId = householdId; // Ensure householdId is set
        return cleanedMember;
      });
      
      // Use bulkCreate with updateOnDuplicate for members
      await Member.bulkCreate(membersData, {
        updateOnDuplicate: [
          'name', 'dob', 'email', 'phone', 'relationship', 
          'street', 'city', 'state', 'zip'
        ]
      });
      
      results.members.created = membersData.length;
    }
    
    // Process accounts sheet
    const accountsSheet = parsedSheets.find(sheet => sheet.sheetType === 'account');
    if (accountsSheet && accountsSheet.data.length > 0) {
      const accountsData = accountsSheet.data.map(account => {
        const mappedAccount = mapAccountFields(account);
        const cleanedAccount = cleanData(mappedAccount);
        cleanedAccount.householdId = householdId; // Ensure householdId is set
        return cleanedAccount;
      });
      
      // Use bulkCreate with updateOnDuplicate for accounts
      await Account.bulkCreate(accountsData, {
        updateOnDuplicate: [
          'accountNumber', 'custodian', 'accountType', 
          'value', 'ownershipPercent'
        ]
      });
      
      results.accounts.created = accountsData.length;
    }
    
    return {
      success: true,
      results,
      householdId
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      results
    };
  }
};

module.exports = {
  upsertExcelData,
  cleanData,
  mapHouseholdFields,
  mapMemberFields,
  mapAccountFields
};
