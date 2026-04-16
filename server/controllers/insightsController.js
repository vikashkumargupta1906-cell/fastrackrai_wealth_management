const { Household, Member, Account } = require('../models');
const { Op } = require('sequelize');

/**
 * Get insights and analytics data
 * Returns aggregate data for charts and insights page
 */
const getInsights = async (req, res) => {
  try {
    // 1. Total households count
    const totalHouseholds = await Household.count();

    // 2. Total AUM (Assets Under Management) - sum of all account values
    const aumResult = await Account.findAll({
      attributes: [
        [Account.sequelize.fn('SUM', Account.sequelize.col('value')), 'totalAUM']
      ]
    });

    const totalAUM = parseFloat(aumResult[0]?.dataValues?.totalAUM) || 0;

    // 3. Income vs expense data per household
    const householdsIncomeExpense = await Household.findAll({
      attributes: [
        'id',
        'name',
        'annualIncome',
        'expenseRange',
        'netWorth'
      ],
      where: {
        annualIncome: {
          [Op.not]: null
        }
      },
      order: [['annualIncome', 'DESC']]
    });

    // Process income vs expense data
    const incomeExpenseData = householdsIncomeExpense.map(household => {
      const data = household.toJSON();
      
      // Estimate expense from expenseRange if available
      let estimatedExpense = null;
      if (data.expenseRange) {
        const expenseMatch = data.expenseRange.match(/\d+/);
        if (expenseMatch) {
          estimatedExpense = parseFloat(expenseMatch[0]) * 1000; // Convert K to actual value
        }
      }

      return {
        id: data.id,
        name: data.name,
        income: data.annualIncome,
        netWorth: data.netWorth,
        expenseRange: data.expenseRange,
        estimatedExpense: estimatedExpense,
        savingsRate: estimatedExpense ? ((data.annualIncome - estimatedExpense) / data.annualIncome) * 100 : null
      };
    });

    // 4. Account type distribution counts
    const accountTypeDistribution = await Account.findAll({
      attributes: [
        'accountType',
        [Account.sequelize.fn('COUNT', Account.sequelize.col('id')), 'count'],
        [Account.sequelize.fn('SUM', Account.sequelize.col('value')), 'totalValue']
      ],
      where: {
        accountType: {
          [Op.not]: null
        }
      },
      group: ['accountType'],
      order: [[Account.sequelize.literal('count'), 'DESC']]
    });

    // Process account type distribution
    const accountDistribution = accountTypeDistribution.map(result => {
      const data = result.dataValues;
      return {
        accountType: data.accountType,
        count: parseInt(data.count),
        totalValue: parseFloat(data.totalValue) || 0,
        averageValue: data.count > 0 ? (parseFloat(data.totalValue) / data.count) : 0
      };
    });

    // 5. Additional metrics for insights
    const totalMembers = await Member.count();
    
    // Average household metrics
    const avgHouseholdIncome = await Household.findAll({
      attributes: [
        [Household.sequelize.fn('AVG', Household.sequelize.col('annualIncome')), 'avgIncome'],
        [Household.sequelize.fn('AVG', Household.sequelize.col('netWorth')), 'avgNetWorth']
      ],
      where: {
        annualIncome: {
          [Op.not]: null
        }
      }
    });

    const avgMetrics = avgHouseholdIncome[0]?.dataValues || {};

    // 6. Net worth distribution (ranges)
    const netWorthRanges = [
      { label: '< $100K', min: 0, max: 100000 },
      { label: '$100K - $500K', min: 100000, max: 500000 },
      { label: '$500K - $1M', min: 500000, max: 1000000 },
      { label: '$1M - $5M', min: 1000000, max: 5000000 },
      { label: '> $5M', min: 5000000, max: null }
    ];

    const netWorthDistribution = await Promise.all(
      netWorthRanges.map(async range => {
        const whereClause = {
          netWorth: {
            [Op.not]: null
          }
        };

        if (range.min !== null) {
          whereClause.netWorth[Op.gte] = range.min;
        }
        if (range.max !== null) {
          whereClause.netWorth[Op.lt] = range.max;
        }

        const count = await Household.count({ where: whereClause });
        
        return {
          range: range.label,
          count: count,
          percentage: totalHouseholds > 0 ? (count / totalHouseholds) * 100 : 0
        };
      })
    );

    // 7. Account ownership distribution
    const ownershipDistribution = await Account.findAll({
      attributes: [
        'ownershipPercent',
        [Account.sequelize.fn('COUNT', Account.sequelize.col('id')), 'count']
      ],
      where: {
        ownershipPercent: {
          [Op.not]: null
        }
      },
      group: ['ownershipPercent'],
      order: [[Account.sequelize.literal('count'), 'DESC']]
    });

    const processedOwnership = ownershipDistribution.map(result => ({
      ownershipPercent: result.dataValues.ownershipPercent,
      count: parseInt(result.dataValues.count)
    }));

    return res.json({
      success: true,
      insights: {
        summary: {
          totalHouseholds,
          totalAUM,
          totalMembers,
          avgHouseholdIncome: parseFloat(avgMetrics.avgIncome) || 0,
          avgHouseholdNetWorth: parseFloat(avgMetrics.avgNetWorth) || 0
        },
        incomeExpense: incomeExpenseData,
        accountDistribution: accountDistribution,
        netWorthDistribution: netWorthDistribution,
        ownershipDistribution: processedOwnership
      },
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating insights:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate insights',
      insights: null
    });
  }
};

/**
 * Get top households by net worth
 */
const getTopHouseholds = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const households = await Household.findAll({
      attributes: [
        'id',
        'name',
        'netWorth',
        'annualIncome'
      ],
      where: {
        netWorth: {
          [Op.not]: null
        }
      },
      include: [
        {
          model: Account,
          as: 'accounts',
          attributes: ['value'],
          required: false
        }
      ],
      order: [['netWorth', 'DESC']],
      limit: parseInt(limit)
    });

    const topHouseholds = households.map(household => {
      const data = household.toJSON();
      const accountValue = data.accounts 
        ? data.accounts.reduce((sum, account) => sum + (parseFloat(account.value) || 0), 0)
        : 0;

      return {
        id: data.id,
        name: data.name,
        netWorth: data.netWorth,
        annualIncome: data.annualIncome,
        accountValue: accountValue
      };
    });

    return res.json({
      success: true,
      households: topHouseholds
    });

  } catch (error) {
    console.error('Error fetching top households:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch top households'
    });
  }
};

module.exports = {
  getInsights,
  getTopHouseholds
};
