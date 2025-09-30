const mongoose = require('mongoose');
const Election = require('./models/Election');
require('dotenv').config();

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Check if elections already exist
    const existingElections = await Election.countDocuments();
    console.log(`Found ${existingElections} existing elections`);
    
    if (existingElections > 0) {
      console.log('Elections already exist in database, skipping seed');
      return;
    }
    
    // Create sample election data
    const generalElection = new Election({
      title: 'General Election 2025',
      description: 'National Parliamentary Election for the term 2025-2030',
      startDate: new Date('2025-01-15'),
      endDate: new Date('2025-01-16'),
      status: 'active',
      candidates: [
        {
          name: 'Rajesh Kumar',
          party: 'Progressive Party',
          photo: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=400',
          bio: 'Senior leader with 20 years of public service experience'
        },
        {
          name: 'Priya Sharma',
          party: 'Unity Alliance',
          photo: 'https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=400',
          bio: 'Former civil servant focused on education and healthcare reform'
        },
        {
          name: 'Arjun Patel',
          party: 'People\'s Front',
          photo: 'https://images.pexels.com/photos/2182973/pexels-photo-2182973.jpeg?auto=compress&cs=tinysrgb&w=400',
          bio: 'Young entrepreneur advocating for digital governance'
        }
      ],
      votes: new Map([['1', 1250], ['2', 980], ['3', 850]])
    });
    
    const municipalElection = new Election({
      title: 'Municipal Election',
      description: 'Local council election for city development projects',
      startDate: new Date('2025-02-01'),
      endDate: new Date('2025-02-02'),
      status: 'upcoming',
      candidates: [
        {
          name: 'Sarah Johnson',
          party: 'City First',
          photo: 'https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=400',
          bio: 'Local business owner with urban planning expertise'
        },
        {
          name: 'David Chen',
          party: 'Green Initiative',
          photo: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=400',
          bio: 'Environmental engineer focused on sustainable development'
        }
      ],
      votes: new Map()
    });
    
    // Save the elections
    await Promise.all([
      generalElection.save(),
      municipalElection.save()
    ]);
    
    console.log('✅ Database seeded successfully!');
    
    // Verify the data was saved
    const elections = await Election.find({});
    console.log(`Found ${elections.length} elections after seeding`);
    
    // Print candidate IDs for reference
    elections.forEach(election => {
      console.log(`\nElection: ${election.title} (${election._id})`);
      election.candidates.forEach(candidate => {
        console.log(`- ${candidate.name}: ${candidate._id}`);
      });
    });
    
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    await mongoose.connection.close();
  }
}

seedDatabase();