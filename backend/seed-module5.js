require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Organization = require('./models/Organization');
const Donation = require('./models/Donation');
const WasteRequest = require('./models/WasteRequest');
const Pickup = require('./models/Pickup');
const Notification = require('./models/Notification');
const ImpactRecord = require('./models/ImpactRecord');

const connectDB = require('./config/db');

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('Clearing existing collections...');

    await Promise.all([
      User.deleteMany({}),
      Organization.deleteMany({}),
      Donation.deleteMany({}),
      WasteRequest.deleteMany({}),
      Pickup.deleteMany({}),
      Notification.deleteMany({}),
      ImpactRecord.deleteMany({})
    ]);

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);
    const userPassHash = await bcrypt.hash('user123', salt);

    // 1. Admin User
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@foodbridge.com',
      password: passwordHash,
      role: 'admin',
      district: 'Colombo',
      contactNumber: '0771122334',
      verificationStatus: 'verified'
    });

    // 2. Donors
    const donor1 = await User.create({
      name: 'Grand Cinnamon Hotel',
      email: 'cinnamon@hotel.com',
      password: userPassHash,
      role: 'donor',
      district: 'Colombo',
      contactNumber: '0112345678',
      verificationStatus: 'verified'
    });

    const donor2 = await User.create({
      name: 'Royal Heritage Banquet',
      email: 'banquet@royal.com',
      password: userPassHash,
      role: 'donor',
      district: 'Kandy',
      contactNumber: '0812233445',
      verificationStatus: 'verified'
    });

    // 3. Recipient Users
    const recipientUser1 = await User.create({
      name: 'Sister Mary Care Home',
      email: 'carehome@ngo.org',
      password: userPassHash,
      role: 'recipient',
      district: 'Colombo',
      contactNumber: '0119988776',
      verificationStatus: 'verified'
    });

    const recipientUser2 = await User.create({
      name: 'Community Food Shelter',
      email: 'shelter@hope.org',
      password: userPassHash,
      role: 'recipient',
      district: 'Kandy',
      contactNumber: '0815566778',
      verificationStatus: 'pending' // Pending review
    });

    // 4. Recycler Users
    const recyclerUser1 = await User.create({
      name: 'EcoCycle Lanka',
      email: 'info@ecocycle.lk',
      password: userPassHash,
      role: 'recycler',
      district: 'Colombo',
      contactNumber: '0114433221',
      verificationStatus: 'verified'
    });

    const recyclerUser2 = await User.create({
      name: 'GreenEarth BioCompost',
      email: 'compost@greenearth.lk',
      password: userPassHash,
      role: 'recycler',
      district: 'Gampaha',
      contactNumber: '0332211445',
      verificationStatus: 'pending' // Pending review
    });

    // 5. Volunteer User
    const volunteer1 = await User.create({
      name: 'Saman Perera',
      email: 'saman@volunteer.org',
      password: userPassHash,
      role: 'volunteer',
      district: 'Colombo',
      contactNumber: '0714455667',
      verificationStatus: 'verified'
    });

    // 6. Organizations
    const org1 = await Organization.create({
      name: 'Sister Mary Care Home',
      type: 'shelter',
      registrationInfo: 'NGO-COL-2021-049',
      district: 'Colombo',
      verificationStatus: 'verified',
      verifiedAt: new Date(Date.now() - 86400000 * 5),
      verifiedBy: adminUser._id,
      linkedUser: recipientUser1._id
    });
    recipientUser1.organization = org1._id;
    await recipientUser1.save();

    const org2 = await Organization.create({
      name: 'Community Food Shelter',
      type: 'charity',
      registrationInfo: 'REG-KDY-2024-912',
      district: 'Kandy',
      verificationStatus: 'pending',
      linkedUser: recipientUser2._id
    });
    recipientUser2.organization = org2._id;
    await recipientUser2.save();

    const org3 = await Organization.create({
      name: 'EcoCycle Lanka (Pvt) Ltd',
      type: 'recycler',
      registrationInfo: 'WST-PVT-2023-887',
      district: 'Colombo',
      materialTypesHandled: ['plastic', 'glass', 'paper', 'metal'],
      verificationStatus: 'verified',
      verifiedAt: new Date(Date.now() - 86400000 * 10),
      verifiedBy: adminUser._id,
      linkedUser: recyclerUser1._id
    });
    recyclerUser1.organization = org3._id;
    await recyclerUser1.save();

    const org4 = await Organization.create({
      name: 'GreenEarth BioCompost Facility',
      type: 'composting_facility',
      registrationInfo: 'ENV-GMP-2025-110',
      district: 'Gampaha',
      materialTypesHandled: ['organic'],
      verificationStatus: 'pending',
      linkedUser: recyclerUser2._id
    });
    recyclerUser2.organization = org4._id;
    await recyclerUser2.save();

    // 7. Donations
    const donation1 = await Donation.create({
      donor: donor1._id,
      foodType: 'Cooked Buffet Rice & Curry',
      quantity: '60 plates',
      preparedTime: new Date(Date.now() - 3600000 * 3),
      storageCondition: 'refrigerated',
      pickupDeadline: new Date(Date.now() + 3600000 * 6),
      district: 'Colombo',
      specialInstructions: 'Ready in commercial food containers at back reception.',
      status: 'completed',
      matchedRecipient: org1._id
    });

    const donation2 = await Donation.create({
      donor: donor2._id,
      foodType: 'Fresh Breads & Pastries',
      quantity: '40 kg',
      preparedTime: new Date(Date.now() - 3600000 * 4),
      storageCondition: 'room_temperature',
      pickupDeadline: new Date(Date.now() + 3600000 * 8),
      district: 'Kandy',
      status: 'posted'
    });

    // 8. Waste Requests
    const waste1 = await WasteRequest.create({
      donor: donor1._id,
      wasteCategory: 'plastic',
      quantity: '85 kg',
      district: 'Colombo',
      pickupDeadline: new Date(Date.now() + 86400000 * 2),
      status: 'recycled',
      matchedCollector: org3._id
    });

    const waste2 = await WasteRequest.create({
      donor: donor2._id,
      wasteCategory: 'organic',
      quantity: '150 kg',
      district: 'Kandy',
      pickupDeadline: new Date(Date.now() + 86400000 * 1),
      status: 'posted'
    });

    // 9. Pickups
    await Pickup.create({
      donation: donation1._id,
      volunteer: volunteer1._id,
      receivingOrganization: org1._id,
      statusPipeline: 'completed',
      statusHistory: [
        { status: 'posted', timestamp: new Date(Date.now() - 3600000 * 5) },
        { status: 'matched', timestamp: new Date(Date.now() - 3600000 * 4) },
        { status: 'pickup_scheduled', timestamp: new Date(Date.now() - 3600000 * 3) },
        { status: 'picked_up', timestamp: new Date(Date.now() - 3600000 * 2) },
        { status: 'delivered_or_recycled', timestamp: new Date(Date.now() - 3600000 * 1) },
        { status: 'completed', timestamp: new Date() }
      ],
      routeLocation: { lat: 6.9271, lng: 79.8612 }
    });

    // 10. Impact Monthly History
    await ImpactRecord.create({
      mealsRescued: 2850,
      kgRecycled: { plastic: 650, glass: 320, paper: 410, metal: 190 },
      kgOrganicDiverted: 1200,
      districtsCovered: ['Colombo', 'Gampaha', 'Kandy'],
      period: '2026-09'
    });

    // 11. Initial Notifications
    await Notification.create({
      recipientUser: adminUser._id,
      message: 'New organization "GreenEarth BioCompost Facility" submitted registration details for verification.',
      relatedType: 'organization',
      relatedId: org4._id
    });

    await Notification.create({
      recipientUser: adminUser._id,
      message: 'New organization "Community Food Shelter" submitted registration details for verification.',
      relatedType: 'organization',
      relatedId: org2._id
    });

    console.log('✅ Demo database successfully seeded!');
    console.log('Admin login: admin@foodbridge.com / admin123');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
