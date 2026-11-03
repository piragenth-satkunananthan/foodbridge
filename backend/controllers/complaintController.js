const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { endpoint, text, fail } = require('../utils/domain');
const { createNotification, sendBulkNotifications } = require('../utils/notificationService');
const createComplaint = endpoint(async (req,res) => {
  const {subject,description,relatedType='system',relatedId=null} = req.body;
  const complaint = await Complaint.create({reporter:req.user._id,subject:text(subject,'Subject',200),description:text(description,'Description',5000),relatedType,relatedId,history:[{status:'open',actor:req.user._id}]});
  const admins = await User.find({role:'admin',status:'active'}).select('_id');
  await sendBulkNotifications(admins.map(u=>u._id),'A new complaint requires review.','system',complaint._id);
  res.status(201).json({complaint});
});
const getComplaints = endpoint(async(req,res) => {
  const filter = req.user.role === 'admin' ? {} : {reporter:req.user._id};
  if(req.query.status) filter.status = req.query.status;
  res.json({complaints:await Complaint.find(filter).sort({createdAt:-1}).limit(100)});
});
const resolveComplaint = endpoint(async(req,res) => {
  const {status,note} = req.body;
  if(!['investigating','resolved','dismissed'].includes(status)) fail(400,'Invalid complaint status');
  const complaint = await Complaint.findByIdAndUpdate(req.params.id,{$set:{status},$push:{history:{status,note:text(note,'Resolution note'),actor:req.user._id,timestamp:new Date()}}},{new:true,runValidators:true});
  if(!complaint) fail(404,'Complaint not found');
  await createNotification({recipientUser:complaint.reporter,message:`Your complaint is ${status}.`,relatedType:'system',relatedId:complaint._id});
  res.json({complaint});
});
module.exports = {createComplaint,getComplaints,resolveComplaint};
