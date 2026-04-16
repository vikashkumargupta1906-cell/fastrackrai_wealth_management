const { Household, Member, Account, BankDetail } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all households with summary data
 * Returns: name, netWorth, memberCount, accountCount for listing page
 */
const getHouseholds = async (req, res) => {
  try {
    // Get all households with their associated members and accounts
    const households = await Household.findAll({
      attributes: [
        'id',
        'name',
        'netWorth',
        'annualIncome',
        'createdAt',
        'updatedAt'
      ],
      include: [
        {
          model: Member,
          as: 'members',
          attributes: ['id'],
          required: false // LEFT JOIN to include households without members
        },
        {
          model: Account,
          as: 'accounts',
          attributes: ['id', 'value'],
          required: false // LEFT JOIN to include households without accounts
        }
      ],
      order: [['name', 'ASC']]
    });

    // Transform data to include summary counts
    const householdSummaries = households.map(household => {
      const householdData = household.toJSON();
      
      // Calculate member count
      const memberCount = householdData.members ? householdData.members.length : 0;
      
      // Calculate account count
      const accountCount = householdData.accounts ? householdData.accounts.length : 0;
      
      // Calculate total account value
      const totalAccountValue = householdData.accounts 
        ? householdData.accounts.reduce((sum, account) => sum + (parseFloat(account.value) || 0), 0)
        : 0;
      
      // Use netWorth from household or calculate from accounts if netWorth is null
      const netWorth = householdData.netWorth || totalAccountValue;
      
      return {
        id: householdData.id,
        name: householdData.name,
        netWorth: netWorth,
        annualIncome: householdData.annualIncome,
        memberCount: memberCount,
        accountCount: accountCount,
        totalAccountValue: totalAccountValue,
        createdAt: householdData.createdAt,
        updatedAt: householdData.updatedAt
      };
    });

    return res.json({
      success: true,
      households: householdSummaries,
      count: householdSummaries.length
    });

  } catch (error) {
    console.error('Error fetching households:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch households',
      households: []
    });
  }
};

/**
 * Get household by ID with full details
 * Returns complete household data with members and accounts
 */
const getHouseholdById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Household ID is required'
      });
    }

    const household = await Household.findByPk(id, {
      include: [
        {
          model: Member,
          as: 'members',
          order: [['lastName', 'ASC'], ['firstName', 'ASC']]
        },
        {
          model: Account,
          as: 'accounts',
          order: [['createdAt', 'DESC']]
        },
        {
          model: BankDetail,
          as: 'bankDetails',
          order: [['bankName', 'ASC']]
        }
      ]
    });

    if (!household) {
      return res.status(404).json({
        success: false,
        error: 'Household not found'
      });
    }

    return res.json({
      success: true,
      household: household.toJSON()
    });

  } catch (error) {
    console.error('Error fetching household:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch household'
    });
  }
};

/**
 * Search households by name
 * Used for autocomplete or search functionality
 */
const searchHouseholds = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters long'
      });
    }

    const households = await Household.findAll({
      where: {
        name: {
          [Op.iLike]: `%${query.trim()}%`
        }
      },
      attributes: ['id', 'name'],
      limit: 10,
      order: [['name', 'ASC']]
    });

    return res.json({
      success: true,
      households: households,
      query: query.trim()
    });

  } catch (error) {
    console.error('Error searching households:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to search households'
    });
  }
};

/**
 * Update household by ID
 * Allows editing household fields from the UI
 */
const updateHousehold = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Household ID is required'
      });
    }

    // Validate household exists
    const household = await Household.findByPk(id);
    if (!household) {
      return res.status(404).json({
        success: false,
        error: 'Household not found'
      });
    }

    // Filter allowed fields to prevent updating sensitive fields
    const allowedFields = [
      'name',
      'annualIncome',
      'netWorth',
      'liquidNetWorth',
      'expenseRange',
      'taxBracket',
      'riskTolerance',
      'timeHorizon',
      'audioNotes'
    ];

    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key) && updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    });

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }

    // Update household with filtered data
    await household.update(filteredUpdates);

    // Return updated household with associations
    const updatedHousehold = await Household.findByPk(id, {
      include: [
        {
          model: Member,
          as: 'members',
          order: [['lastName', 'ASC'], ['firstName', 'ASC']]
        },
        {
          model: Account,
          as: 'accounts',
          order: [['createdAt', 'DESC']]
        },
        {
          model: BankDetail,
          as: 'bankDetails',
          order: [['bankName', 'ASC']]
        }
      ]
    });

    return res.json({
      success: true,
      household: updatedHousehold.toJSON(),
      updatedFields: Object.keys(filteredUpdates),
      message: 'Household updated successfully'
    });

  } catch (error) {
    console.error('Error updating household:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update household'
    });
  }
};

/**
 * Delete household by ID
 * Optional: allows deleting households from the UI
 */
const deleteHousehold = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Household ID is required'
      });
    }

    const household = await Household.findByPk(id);
    if (!household) {
      return res.status(404).json({
        success: false,
        error: 'Household not found'
      });
    }

    // Delete household (cascade delete will handle members and accounts if set up)
    await household.destroy();

    return res.json({
      success: true,
      message: 'Household deleted successfully',
      deletedHouseholdId: id
    });

  } catch (error) {
    console.error('Error deleting household:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete household'
    });
  }
};

module.exports = {
  getHouseholds,
  getHouseholdById,
  searchHouseholds,
  updateHousehold,
  deleteHousehold
};
