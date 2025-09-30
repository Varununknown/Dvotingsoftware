const mongoose = require('mongoose');
const Election = require('./models/Election');
require('dotenv').config();

async function inspectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const elections = await Election.find({});
    console.log('Total elections:', elections.length);
    
    elections.forEach(e => {
      console.log(`\nElection: ${e.title} (${e._id})`);
      console.log('Status:', e.status);
      console.log('Candidates:', JSON.stringify(e.candidates, null, 2));
      console.log('Votes Map:', [...e.votes.entries()]);
      console.log('VoterCandidate Map:', [...e.voterCandidateMap.entries()]);
      console.log('Voters list length:', e.voters.length);
    });
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.connection.close();
  }
}

inspectDB();