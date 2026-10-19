require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Donation = require('./models/Donation');
const WasteRequest = require('./models/WasteRequest');
const Notification = require('./models/Notification');
const connectDB = require('./config/db');
const generateToken = require('./config/generateToken');

async function runModule1Tests() {
  console.log('🧪 Starting FoodBridge Donor & Surplus Posting Integration Tests...\n');

  try {
    await connectDB();

    // 1. Setup test donor
    let donor = await User.findOne({ email: 'cinnamon@hotel.com' });
    if (!donor) {
      donor = await User.create({
        name: 'Cinnamon Grand Colombo',
        email: 'cinnamon@hotel.com',
        password: 'hashedpassword123',
        role: 'donor',
        district: 'Colombo',
        contactNumber: '+94 11 249 7272',
        verificationStatus: 'verified',
        status: 'active'
      });
    }

    const token = generateToken(donor._id, donor.role);
    console.log('✔ Test donor authenticated, JWT generated');

    // 2. Test Donation Model Validation
    const futureDate = new Date(Date.now() + 4 * 3600 * 1000); // 4 hours in future
    const preparedDate = new Date();

    const testDonation = await Donation.create({
      donor: donor._id,
      foodType: 'Buffet Surplus Rice & Curry',
      quantity: '40 plates',
      preparedTime: preparedDate,
      storageCondition: 'refrigerated',
      pickupDeadline: futureDate,
      district: 'Colombo',
      specialInstructions: 'Enter via rear kitchen loading dock'
    });

    if (testDonation._id && testDonation.status === 'posted') {
      console.log('✔ Food donation creation succeeded with status "posted"');
    } else {
      throw new Error('Food donation creation failed');
    }

    // 3. Test Donation Retrieval
    const found = await Donation.findById(testDonation._id).populate('donor', 'name district');
    if (found && found.foodType === 'Buffet Surplus Rice & Curry') {
      console.log('✔ Donation retrieval and donor population works');
    } else {
      throw new Error('Donation retrieval failed');
    }

    // 4. Test Donation Update
    found.specialInstructions = 'Updated instructions: Ask for Chef Nuwan';
    await found.save();
    const updated = await Donation.findById(testDonation._id);
    if (updated.specialInstructions.includes('Chef Nuwan')) {
      console.log('✔ Donation update works for active postings');
    } else {
      throw new Error('Donation update failed');
    }

    // 5. Test Waste Request Creation
    const testWaste = await WasteRequest.create({
      donor: donor._id,
      wasteCategory: 'organic',
      quantity: '25 kg',
      district: 'Colombo',
      pickupDeadline: futureDate,
      status: 'posted'
    });

    if (testWaste._id && testWaste.wasteCategory === 'organic') {
      console.log('✔ Waste collection request creation succeeded');
    } else {
      throw new Error('Waste request creation failed');
    }

    // 6. Test Donation Cancellation
    updated.status = 'cancelled';
    await updated.save();
    const cancelled = await Donation.findById(testDonation._id);
    if (cancelled.status === 'cancelled') {
      console.log('✔ Donation cancellation lifecycle status transition works');
    } else {
      throw new Error('Donation cancellation failed');
    }

    // Clean up test records
    await Donation.findByIdAndDelete(testDonation._id);
    await WasteRequest.findByIdAndDelete(testWaste._id);
    console.log('✔ Test cleanup completed');

    console.log('\n🎉 ALL FOODBRIDGE DONOR DISPATCH INTEGRATION TESTS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ FoodBridge donor dispatch test failed:', error);
    process.exit(1);
  }
}

runModule1Tests();
