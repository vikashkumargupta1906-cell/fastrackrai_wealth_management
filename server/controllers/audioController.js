// controllers/audioController.js

// const fs = require('fs').promises;
const { Op } = require('sequelize'); // Import Sequelize operators for fuzzy searching
const { sequelize, Household, Member, Account, BankDetail } = require('../models');
const { 
  transcribeAudio, 
  enrichHouseholdData, 
  identifyHouseholdFromTranscript 
} = require('../services/aiServices');

const uploadAudio = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No audio file uploaded' });
    }

    //const filePath = req.file.path;
    const audioBuffer = req.file.buffer;
    const filename = req.file.originalname;

    try {
      // 1. Transcribe Audio immediately
      const transcript = await transcribeAudio(audioBuffer, filename);
      
      // 2. Identify the Household Name via AI
      const searchKey = await identifyHouseholdFromTranscript(transcript);
      
      if (!searchKey) {
        throw new Error("Could not identify a client name from the audio.");
      }

      // 3. Search Database for matching Household
      // We use Op.iLike (Postgres) or Op.like (MySQL/SQLite) to do a wildcard search
      // This matches "Walter" to "Benjamin Walter Household"
      const currentHousehold = await Household.findOne({
        where: {
          name: {
            [Op.like]: `%${searchKey}%` // Use Op.iLike if you are using PostgreSQL
          }
        },
        include: [
          { model: Member, as: 'members' },
          { model: Account, as: 'accounts' },
          { model: BankDetail, as: 'bankDetails' }
        ]
      });

      if (!currentHousehold) {
        throw new Error(`Household matching '${searchKey}' not found in database. Please upload their Excel data first.`);
      }

      const householdId = currentHousehold.id;
      const currentData = currentHousehold.get({ plain: true });

      // 4. Let Claude enrich the data based on the transcript and current DB state
      const updatedData = await enrichHouseholdData(currentData, transcript);

      // 5. Save updates back to Database using a Transaction
      const transaction = await sequelize.transaction();

      try {
        await Household.update(updatedData, { where: { id: householdId }, transaction });

        // Upsert Members
        if (updatedData.members) {
          for (const member of updatedData.members) {
            if (member.id) {
              await Member.update(member, { where: { id: member.id }, transaction });
            } else {
              await Member.create({ ...member, householdId }, { transaction });
            }
          }
        }

        // Upsert Accounts
        if (updatedData.accounts) {
          for (const account of updatedData.accounts) {
            if (account.id) {
              await Account.update(account, { where: { id: account.id }, transaction });
            } else {
              await Account.create({ ...account, householdId }, { transaction });
            }
          }
        }

        // Upsert Bank Details
        if (updatedData.bankDetails) {
          for (const bank of updatedData.bankDetails) {
            if (bank.id) {
              await BankDetail.update(bank, { where: { id: bank.id }, transaction });
            } else {
              await BankDetail.create({ ...bank, householdId }, { transaction });
            }
          }
        }

        await transaction.commit();
        //await fs.unlink(filePath); // Clean up file

        return res.json({
          success: true,
          message: `Successfully updated the ${currentHousehold.name} record.`,
          identifiedClient: searchKey,
          transcript: transcript,
          updatedData: updatedData
        });

      } catch (dbError) {
        await transaction.rollback();
        throw dbError;
      }

    } catch (processingError) {
      //await fs.unlink(filePath).catch(console.error);
      throw processingError;
    }

  } catch (error) {
    console.error('Audio processing error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { uploadAudio };