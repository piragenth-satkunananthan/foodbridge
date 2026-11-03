const Donation = require('../models/Donation');
const WasteRequest = require('../models/WasteRequest');
const Pickup = require('../models/Pickup');
const Organization = require('../models/Organization');
const User = require('../models/User');
const { parseQuantity } = require('../utils/quantity');
const { fail, text, district, coordinates, sameId } = require('../utils/domain');
const transaction = require('../utils/transaction');
const { createNotification, sendBulkNotifications } = require('../utils/notificationService');
const materials = ['plastic','glass','paper','metal','organic','non_recyclable'];
const fields = ['quantity','district','availableTime','pickupDeadline','photo','specialInstructions','location'];
function validatePosting(body, kind, existing) {
  const allowed = [...fields, ...(kind === 'donation' ? ['foodType','preparedTime','storageCondition'] : ['wasteCategory'])];
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key=>!allowed.includes(key))) fail(400,'Unsupported posting fields');
  const input = {...(existing?.toObject ? existing.toObject() : existing || {}),...body};
  const q = parseQuantity(input.quantity);
  if (!q || (kind === 'wasteRequest' && q.estimatedWeight)) fail(400,'Quantity requires a positive amount and supported mass unit (food also accepts portions)');
  const result = {quantity:input.quantity.trim(),quantityValue:q.amount,quantityUnit:q.unit,district:district(input.district)};
  const date = (value, label) => {
    if (!(typeof value === 'string' || value instanceof Date) || !Number.isFinite(new Date(value).getTime())) fail(400,`Invalid ${label}`);
    return new Date(value);
  };
  result.pickupDeadline = date(input.pickupDeadline,'pickup deadline');
  if(result.pickupDeadline <= new Date()) fail(400,'Pickup deadline must be in the future');
  result.availableTime = input.availableTime ? date(input.availableTime,'available time') : new Date();
  if(kind === 'donation') {
    result.foodType = text(input.foodType,'Food type',200);
    result.preparedTime = date(input.preparedTime,'preparation time');
    if(!input.availableTime && result.preparedTime > result.availableTime) result.availableTime = result.preparedTime;
    if(result.preparedTime > result.availableTime || result.preparedTime >= result.pickupDeadline) fail(400,'Preparation must precede availability and pickup deadline');
    if(!['refrigerated','room_temperature','frozen'].includes(input.storageCondition)) fail(400,'Invalid storage condition');
    result.storageCondition = input.storageCondition;
  } else {
    if(!materials.includes(input.wasteCategory)) fail(400,'Invalid waste category');
    result.wasteCategory = input.wasteCategory;
  }
  if(result.availableTime >= result.pickupDeadline) fail(400,'Availability must precede pickup deadline');
  if(input.specialInstructions !== undefined) {
    if(typeof input.specialInstructions !== 'string' || input.specialInstructions.length > 2000) fail(400,'Invalid special instructions');
    result.specialInstructions = input.specialInstructions;
  }
  if(input.photo !== undefined && input.photo !== null && input.photo !== '') {
    let url;
    try { url = new URL(input.photo); } catch { fail(400,'Photo must be an HTTP(S) URL'); }
    if(!['http:','https:'].includes(url.protocol)) fail(400,'Photo must be an HTTP(S) URL');
    result.photo = url.href;
  } else if(input.photo !== undefined) result.photo = null;
  if(input.location !== undefined) result.location = coordinates(input.location);
  return result;
}
const modelFor = kind => kind === 'donation' ? Donation : WasteRequest;
async function notifyPosted(post,kind) {
  await createNotification({recipientUser:post.donor,message:'Your surplus post is available for matching.',relatedType:kind,relatedId:post._id});
  const filter = {district:post.district,verificationStatus:'verified',accepting:true};
  if(kind === 'donation') Object.assign(filter,{type:{$in:['ngo','charity','shelter']},storageConditions:post.storageCondition});
  else filter.materialTypesHandled=post.wasteCategory;
  const organizations=await Organization.find(filter).select('linkedUser');
  const users=await User.find({_id:{$in:organizations.map(org=>org.linkedUser)},status:'active'}).select('_id');
  await sendBulkNotifications(users.map(u=>u._id),'A new surplus post is available in your district.',kind,post._id);
}
async function createPosting(body,user,kind) {
  const details=validatePosting(body,kind);
  const result=await modelFor(kind).create({...details,donor:user._id,isDemo:user.isDemo,statusHistory:[{status:'posted',actor:user._id}]});
  await notifyPosted(result,kind);
  return result;
}
async function changePosting(id,user,kind,body,cancel=false) {
  return transaction(async session=>{
    const post=await modelFor(kind).findOne({_id:id,donor:user._id}).session(session);
    if(!post) fail(404,'Post not found');
    if(post.status !== 'posted') fail(409,'Only unclaimed posts may be edited or cancelled');
    if(cancel) {post.status='cancelled';post.statusHistory.push({status:'cancelled',actor:user._id});}
    else Object.assign(post,validatePosting(body,kind,post));
    await post.save({session});
    return post;
  });
}
async function canReadPost(post,user,kind) {
  if(user.role === 'admin' || sameId(post.donor,user._id)) return true;
  const org = await Organization.findOne({linkedUser:user._id});
  if(org && sameId(post[kind==='donation'?'matchedRecipient':'matchedCollector'],org._id)) return true;
  return Boolean(await Pickup.exists({[kind]:post._id,volunteer:user._id}));
}
module.exports={validatePosting,createPosting,changePosting,canReadPost,notifyPosted};
