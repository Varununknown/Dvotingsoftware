// Seed script to add sample elections to the database for testing
const mongoose = require('mongoose');
const Election = require('./models/Election');
require('dotenv').config();

const sampleElections = [
  {
    title: 'General Election 2025',
    description: 'National Parliamentary Election for the term 2025-2030',
    startDate: new Date('2025-01-15'),
    endDate: new Date('2025-01-16'),
    status: 'active',
    candidates: [
      {
        id: '0',
        name: 'Rajesh Kumar',
        party: 'Progressive Party',
        photo: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=400',
        bio: 'Senior leader with 20 years of public service experience'
      },
      {
        id: '1',
        name: 'Priya Sharma',
        party: 'Unity Alliance',
        photo: 'https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=400',
        bio: 'Former civil servant focused on education and healthcare reform'
      },
      {
        id: '2',
        name: 'Arjun Patel',
        party: 'People\'s Front',
        photo: 'https://images.pexels.com/photos/2182973/pexels-photo-2182973.jpeg?auto=compress&cs=tinysrgb&w=400',
        bio: 'Young entrepreneur advocating for digital governance'
      }
    ],
    votes: new Map([
      ['0', 0], // Rajesh Kumar - will get real votes from blockchain
      ['1', 0], // Priya Sharma - will get real votes from blockchain  
      ['2', 0]  // Arjun Patel - will get real votes from blockchain
    ]),
    resultsReleased: false
  },
  {
    title: 'Municipal Election',
    description: 'Local council election for city development projects',
    startDate: new Date('2025-02-01'),
    endDate: new Date('2025-02-02'),
    status: 'upcoming',
    candidates: [
      {
        id: '3',
        name: 'Sarah Johnson',
        party: 'City First',
        photo: 'https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=400',
        bio: 'Local business owner with urban planning expertise'
      },
      {
        id: '4',
        name: 'David Chen',
        party: 'Green Initiative',
        photo: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=400',
        bio: 'Environmental engineer focused on sustainable development'
      }
    ],
    votes: new Map(),
    resultsReleased: false
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing elections
    await Election.deleteMany({});
    console.log('🗑️ Cleared existing elections');

    // Insert sample elections
    const createdElections = await Election.insertMany(sampleElections);
    console.log(`📊 Created ${createdElections.length} sample elections:`);
    
    createdElections.forEach(election => {
      console.log(`  - ${election.title} (${election.status})`);
    });

    console.log('🎉 Database seeded successfully!');
    
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();