const db = require('./database');

// Sample opportunities data
const sampleOpportunities = [
  {
    title: 'Software Engineering Internship',
    description: 'Join our team as a software engineering intern and work on exciting projects.',
    category: 'Internships',
    location: 'Athens',
    field: 'Technology',
    image: 'https://via.placeholder.com/300x200?text=Internship',
    created_at: new Date().toISOString()
  },
  {
    title: 'Hackathon 2024',
    description: 'Participate in our annual hackathon and showcase your coding skills.',
    category: 'Hackathons',
    location: 'Remote',
    field: 'Technology',
    image: 'https://via.placeholder.com/300x200?text=Hackathon',
    created_at: new Date().toISOString()
  },
  {
    title: 'Volunteer at Local NGO',
    description: 'Help make a difference in your community by volunteering with us.',
    category: 'Volunteering',
    location: 'Thessaloniki',
    field: 'Social Impact',
    image: 'https://via.placeholder.com/300x200?text=Volunteer',
    created_at: new Date().toISOString()
  },
  {
    title: 'Scholarship Program 2024',
    description: 'Apply for our scholarship program and get financial support for your studies.',
    category: 'Scholarships',
    location: 'Greece',
    field: 'Education',
    image: 'https://via.placeholder.com/300x200?text=Scholarship',
    created_at: new Date().toISOString()
  }
];

async function seedData() {
  console.log('🌱 Seeding database with sample data...');

  // Check if opportunities table exists and has data
  db.get('SELECT COUNT(*) as count FROM opportunities', (err, result) => {
    if (err) {
      console.error('❌ Error checking opportunities table:', err);
      return;
    }

    if (result.count > 0) {
      console.log('✅ Database already has data, skipping seed');
      return;
    }

    // Insert sample opportunities
    const insertQuery = `
      INSERT INTO opportunities (title, description, category, location, field, image, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    let inserted = 0;
    sampleOpportunities.forEach((opportunity, index) => {
      db.run(insertQuery, [
        opportunity.title,
        opportunity.description,
        opportunity.category,
        opportunity.location,
        opportunity.field,
        opportunity.image,
        opportunity.created_at
      ], function(err) {
        if (err) {
          console.error(`❌ Error inserting opportunity ${index + 1}:`, err);
        } else {
          inserted++;
          console.log(`✅ Inserted opportunity: ${opportunity.title}`);
        }

        // Check if all opportunities have been processed
        if (inserted + (sampleOpportunities.length - inserted) === sampleOpportunities.length) {
          console.log(`🎉 Successfully seeded ${inserted} opportunities!`);
          process.exit(0);
        }
      });
    });
  });
}

seedData();
