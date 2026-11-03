const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { endpoint, text, fail } = require('../utils/domain');
const { queueNotifications } = require('../utils/notificationService');
const transaction = require('../utils/transaction');
const createComplaint = endpoint(async (req, res) => {
  const {
    subject,
    description,
    relatedType = 'system',
    relatedId = null
  } = req.body;
  const complaint = await transaction(async (session) => {
    const item = new Complaint({
      reporter: req.user._id,
      subject: text(subject, 'Subject', 200),
      description: text(description, 'Description', 5000),
      relatedType,
      relatedId,
      history: [{ status: 'open', actor: req.user._id }]
    });
    await item.save({ session });
    const admins = await User.find({ role: 'admin', status: 'active' })
      .select('_id')
      .session(session);
    await queueNotifications(
      admins.map((u) => u._id),
      'A new complaint requires review.',
      'system',
      item._id,
      session
    );
    return item;
  });
  res.status(201).json({ complaint });
});
const getComplaints = endpoint(async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { reporter: req.user._id };
  if (req.query.status) filter.status = req.query.status;
  res.json({
    complaints: await Complaint.find(filter).sort({ createdAt: -1 }).limit(100)
  });
});
const resolveComplaint = endpoint(async (req, res) => {
  const { status, note } = req.body;
  if (!['investigating', 'resolved', 'dismissed'].includes(status))
    fail(400, 'Invalid complaint status');
  const complaint = await transaction(async (session) => {
    const item = await Complaint.findById(req.params.id).session(session);
    if (!item) fail(404, 'Complaint not found');
    item.status = status;
    item.history.push({
      status,
      note: text(note, 'Resolution note'),
      actor: req.user._id,
      timestamp: new Date()
    });
    await item.save({ session });
    await queueNotifications(
      [item.reporter],
      `Your complaint is ${status}.`,
      'system',
      item._id,
      session
    );
    return item;
  });
  res.json({ complaint });
});
module.exports = { createComplaint, getComplaints, resolveComplaint };
