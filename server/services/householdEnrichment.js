const { Household, Member, Account } = require('../models');
const { Op } = require('sequelize');

/**
 * Clean and normalize household name for matching
 * @param {string} name - Raw household name
 * @returns {string} - Normalized name
 */
const normalizeHouseholdName = (name) => {
  if (!name || typeof name !== 'string') return '';
  
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // Normalize spaces
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars except spaces
    .trim();
};

/**
 * Find household using fuzzy matching with Op.iLike
 * @param {string} extractedName - Household name extracted by Claude
 * @returns {Promise<Object>} - Household record or null
 */
const findHouseholdFuzzy = async (extractedName) => {
  try {
    if (!extractedName) {
      return null;
    }

    const normalizedName = normalizeHouseholdName(extractedName);
    
    // Try exact match first
    let household = await Household.findOne({
      where: {
        name: {
          [Op.iLike]: extractedName
        }
      }
    });

    // If no exact match, try fuzzy matching
    if (!household) {
      household = await Household.findOne({
        where: {
          name: {
            [Op.iLike]: `%${normalizedName}%`
          }
        }
      });
    }

    // If still no match, try variations
    if (!household) {
      const variations = [
        `${normalizedName} family`,
        `${normalizedName}s`,
        `the ${normalizedName}`,
        `${normalizedName} household`
      ];

      for (const variation of variations) {
        household = await Household.findOne({
          where: {
            name: {
              [Op.iLike]: variation
            }
          }
        });
        if (household) break;
      }
    }

    return household;

  } catch (error) {
    console.error('Error finding household:', error);
    throw new Error(`Household search failed: ${error.message}`);
  }
};

/**
 * Map extracted updates to household model fields
 * @param {Object} updates - Extracted updates from Claude
 * @returns {Object} - Mapped update data
 */
const mapUpdatesToHouseholdFields = (updates) => {
  const fieldMap = {
    'income': 'annualIncome',
    'netWorth': 'netWorth',
    'goals': null, // Store in audioNotes for now
    'preferences': 'riskTolerance',
    'corrections': null // Store in audioNotes for now
  };

  const mappedUpdates = {};

  Object.keys(updates).forEach(key => {
    const mappedField = fieldMap[key];
    if (mappedField && updates[key]) {
      // Clean numeric values
      if (mappedField.includes('Income') || mappedField.includes('Worth')) {
        // Extract numeric value from strings like "$150,000" or "2.5 million"
        const numericValue = String(updates[key]).replace(/[^0-9.]/g, '');
        if (numericValue) {
          const num = parseFloat(numericValue);
          if (mappedField.includes('million')) {
            mappedUpdates[mappedField] = num * 1000000;
          } else {
            mappedUpdates[mappedField] = num;
          }
        }
      } else {
        mappedUpdates[mappedField] = updates[key];
      }
    }
  });

  return mappedUpdates;
};

/**
 * Update household with extracted data
 * @param {string} householdId - Household ID
 * @param {Object} extractedData - Data extracted by Claude
 * @param {string} transcript - Raw transcript
 * @returns {Promise<Object>} - Update result
 */
const updateHouseholdFromExtraction = async (householdId, extractedData, transcript) => {
  try {
    const household = await Household.findByPk(householdId);
    if (!household) {
      throw new Error('Household not found');
    }

    // Prepare update data (skip nulls)
    const updateData = {};
    
    // Map and add household updates
    if (extractedData.updates) {
      const mappedUpdates = mapUpdatesToHouseholdFields(extractedData.updates);
      Object.keys(mappedUpdates).forEach(key => {
        if (mappedUpdates[key] !== null && mappedUpdates[key] !== undefined) {
          updateData[key] = mappedUpdates[key];
        }
      });
    }

    // Append transcript to audioNotes (don't overwrite)
    if (transcript) {
      const timestamp = new Date().toISOString();
      const newNote = `[${timestamp}] Audio Transcript:\n${transcript}\n\n`;
      const existingNotes = household.audioNotes || '';
      updateData.audioNotes = newNote + existingNotes;
    }

    // Perform partial update
    await household.update(updateData);

    return {
      success: true,
      householdId: household.id,
      updatedFields: Object.keys(updateData),
      household: household.toJSON()
    };

  } catch (error) {
    console.error('Error updating household:', error);
    throw new Error(`Household update failed: ${error.message}`);
  }
};

/**
 * Process member updates
 * @param {string} householdId - Household ID
 * @param {Array} memberUpdates - Member update data from Claude
 * @returns {Promise<Object>} - Processing result
 */
const processMemberUpdates = async (householdId, memberUpdates) => {
  try {
    if (!memberUpdates || !Array.isArray(memberUpdates) || memberUpdates.length === 0) {
      return { success: true, updatedMembers: 0 };
    }

    let updatedCount = 0;

    for (const memberUpdate of memberUpdates) {
      if (!memberUpdate.name || !memberUpdate.field || !memberUpdate.value) {
        continue; // Skip invalid updates
      }

      // Find member by name within this household
      const member = await Member.findOne({
        where: {
          householdId,
          name: {
            [Op.iLike]: `%${memberUpdate.name}%`
          }
        }
      });

      if (member) {
        // Map field names
        const fieldMap = {
          'email': 'email',
          'phone': 'phone',
          'relationship': 'relationship',
          'address': 'street',
          'city': 'city',
          'state': 'state',
          'zip': 'zip'
        };

        const updateField = fieldMap[memberUpdate.field.toLowerCase()];
        if (updateField) {
          await member.update({ [updateField]: memberUpdate.value });
          updatedCount++;
        }
      }
    }

    return {
      success: true,
      updatedMembers: updatedCount
    };

  } catch (error) {
    console.error('Error processing member updates:', error);
    throw new Error(`Member update processing failed: ${error.message}`);
  }
};

/**
 * Process new accounts
 * @param {string} householdId - Household ID
 * @param {Array} newAccounts - New account data from Claude
 * @returns {Promise<Object>} - Processing result
 */
const processNewAccounts = async (householdId, newAccounts) => {
  try {
    if (!newAccounts || !Array.isArray(newAccounts) || newAccounts.length === 0) {
      return { success: true, createdAccounts: 0 };
    }

    const accountsToCreate = [];

    for (const accountData of newAccounts) {
      if (!accountData.type) {
        continue; // Skip invalid accounts
      }

      const account = {
        householdId,
        accountType: accountData.type,
        custodian: accountData.custodian || null,
        value: accountData.value ? parseFloat(String(accountData.value).replace(/[^0-9.]/g, '')) : 0,
        ownershipPercent: accountData.ownership ? parseFloat(String(accountData.ownership).replace(/[^0-9.]/g, '')) : 100
      };

      accountsToCreate.push(account);
    }

    if (accountsToCreate.length > 0) {
      await Account.bulkCreate(accountsToCreate);
    }

    return {
      success: true,
      createdAccounts: accountsToCreate.length
    };

  } catch (error) {
    console.error('Error processing new accounts:', error);
    throw new Error(`Account creation failed: ${error.message}`);
  }
};

/**
 * Main enrichment function
 * @param {Object} extractedData - Data extracted by Claude
 * @param {string} transcript - Raw transcript
 * @returns {Promise<Object>} - Complete enrichment result
 */
const enrichHouseholdFromExtraction = async (extractedData, transcript) => {
  try {
    // Find household using fuzzy matching
    const household = await findHouseholdFuzzy(extractedData.householdName);
    
    if (!household) {
      return {
        success: false,
        error: `No household found matching: ${extractedData.householdName}`,
        householdMatched: false
      };
    }

    // Update household with extracted data
    const householdUpdate = await updateHouseholdFromExtraction(
      household.id, 
      extractedData, 
      transcript
    );

    // Process member updates
    const memberResult = await processMemberUpdates(
      household.id, 
      extractedData.memberUpdates
    );

    // Process new accounts
    const accountResult = await processNewAccounts(
      household.id, 
      extractedData.newAccounts
    );

    return {
      success: true,
      householdId: household.id,
      householdMatched: true,
      householdUpdate,
      memberUpdates: memberResult,
      accountUpdates: accountResult,
      extractedData
    };

  } catch (error) {
    console.error('Household enrichment error:', error);
    return {
      success: false,
      error: error.message,
      householdMatched: false
    };
  }
};

module.exports = {
  enrichHouseholdFromExtraction,
  findHouseholdFuzzy,
  normalizeHouseholdName,
  mapUpdatesToHouseholdFields,
  updateHouseholdFromExtraction,
  processMemberUpdates,
  processNewAccounts
};
