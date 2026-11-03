const Pickup=require('../models/Pickup');
const Organization=require('../models/Organization');
const {endpoint,fail,sameId}=require('../utils/domain');
const {parseQuantity}=require('../utils/quantity');
const {getDistrictDistanceKm,estimateTransitMinutes}=require('../utils/routeUtils');
const {distanceFor}=require('../services/eligibilityService');
const service=require('../services/pickupService');
function parseQuantityMetrics(value) {const q=parseQuantity(value);return {meals:q?.meals||0,kg:q?.kg||0,estimatedWeight:q?.estimatedWeight||false};}
function populate(query) {
 return query.populate({path:'donation',populate:{path:'donor',select:'name email contactNumber district status'}}).populate({path:'wasteRequest',populate:{path:'donor',select:'name email contactNumber district status'}}).populate('volunteer','name contactNumber district').populate({path:'receivingOrganization',populate:{path:'linkedUser',select:'name contactNumber district status'}});
}
function enrich(doc,user) {
 const pickup=doc.toObject?doc.toObject():doc;
 const source=pickup.donation||pickup.wasteRequest;
 const org=pickup.receivingOrganization;
 const distance=source&&org?distanceFor(source,org):{distanceKm:null,distanceBasis:'unavailable'};
 const metrics=parseQuantityMetrics(source?.quantity);
 if(pickup.wasteRequest) metrics.meals=0;
 return {...pickup,metrics,routeDetails:{originDistrict:source?.district,destinationDistrict:org?.district,routeDistanceKm:distance.distanceKm,distanceBasis:distance.distanceBasis,transitTimeMinutes:distance.distanceKm===null?null:estimateTransitMinutes(distance.distanceKm*1.25),volunteerToOriginKm:source?getDistrictDistanceKm(user.district,source.district):null,originCoords:source?.location||null,destinationCoords:org?.location||null,currentLocation:pickup.routeLocation||null,locationUpdatedAt:pickup.locationUpdatedAt}};
}
const getOpenPickupJobs=endpoint(async(req,res)=>{
 let pickups=await populate(Pickup.find({statusPipeline:'matched',volunteer:null,active:true}));
 pickups=pickups.filter(p=>{
  const source=p.donation||p.wasteRequest,org=p.receivingOrganization;
  return source?.status==='matched' && source.pickupDeadline>new Date() && source.donor?.status==='active' && org?.verificationStatus==='verified' && org.linkedUser?.status==='active';
 });
 let jobs=pickups.map(p=>enrich(p,req.user));
 if(req.query.district && req.query.district!=='all') jobs=jobs.filter(p=>[p.routeDetails.originDistrict,p.routeDetails.destinationDistrict].includes(req.query.district));
 jobs.sort((a,b)=>a.routeDetails.volunteerToOriginKm-b.routeDetails.volunteerToOriginKm);
 // Contact details and organization credentials are disclosed only after assignment.
 jobs=jobs.map(p=>{for(const source of [p.donation,p.wasteRequest]) if(source?.donor){delete source.donor.email;delete source.donor.contactNumber;} if(p.receivingOrganization){delete p.receivingOrganization.registrationInfo;if(p.receivingOrganization.linkedUser) delete p.receivingOrganization.linkedUser.contactNumber;}return p;});
 res.json({success:true,count:jobs.length,volunteerDistrict:req.user.district,jobs});
});
const getMyActiveJobs=endpoint(async(req,res)=>{
 const jobs=await populate(Pickup.find({volunteer:req.user._id,active:true,statusPipeline:{$in:['pickup_scheduled','picked_up','delivered_or_recycled']}}));
 res.json({success:true,count:jobs.length,activeJobs:jobs.map(p=>enrich(p,req.user))});
});
const getPickupHistory=endpoint(async(req,res)=>{
 const jobs=await populate(Pickup.find({volunteer:req.user._id,active:false}).sort({updatedAt:-1}));
 res.json({success:true,count:jobs.length,history:jobs.map(p=>enrich(p,req.user))});
});
const getPickupById=endpoint(async(req,res)=>{
 const pickup=await populate(Pickup.findById(req.params.id));
 if(!pickup) fail(404,'Pickup not found');
 const source=pickup.donation||pickup.wasteRequest;
 if(req.user.role!=='admin' && !sameId(pickup.volunteer,req.user._id) && !sameId(source?.donor,req.user._id) && !sameId(pickup.receivingOrganization?.linkedUser,req.user._id)) fail(403,'Not a participant in this pickup');
 res.json({success:true,pickup:enrich(pickup,req.user)});
});
const responseFor=async(res,result,user)=>res.json({success:true,pickup:enrich(await populate(Pickup.findById(result.pickup._id)),user)});
const acceptPickupJob=endpoint(async(req,res)=>responseFor(res,await service.accept(req.params.id,req.user),req.user));
const updatePickupStatus=endpoint(async(req,res)=>responseFor(res,await service.advance(req.params.id,req.user,req.body),req.user));
const cancelPickupJob=endpoint(async(req,res)=>responseFor(res,await service.cancelAssignment(req.params.id,req.user,req.body),req.user));
const confirmPickupReceipt=endpoint(async(req,res)=>responseFor(res,await service.confirmReceipt(req.params.id,req.user,req.body),req.user));
const updatePickupLocation=endpoint(async(req,res)=>{
 const pickup=await service.updateLocation(req.params.id,req.user,req.body);
 res.json({success:true,routeLocation:pickup.routeLocation,locationUpdatedAt:pickup.locationUpdatedAt});
});
const getVolunteerStats=endpoint(async(req,res)=>{
 const jobs=await populate(Pickup.find({volunteer:req.user._id}));
 const completed=jobs.filter(p=>p.statusPipeline==='completed');
 const stats={completedMissions:completed.length,activeMissions:jobs.filter(p=>p.active).length,totalMissions:jobs.length,totalMealsTransported:0,totalKgDiverted:0,totalKmTraveled:0,distanceBasis:'estimated, not recorded travel',volunteerDistrict:req.user.district,volunteerName:req.user.name,verificationStatus:req.user.verificationStatus};
 for(const job of completed) {
  const source=job.donation||job.wasteRequest,q=parseQuantity(source?.quantity);
  if(job.donation) stats.totalMealsTransported+=q?.meals||0;
  if(job.donation || ['recycled','composted'].includes(job.processingOutcome)) stats.totalKgDiverted+=q?.kg||0;
  if(source&&job.receivingOrganization) stats.totalKmTraveled+=distanceFor(source,job.receivingOrganization).distanceKm*1.25;
 }
 stats.totalKgDiverted=Math.round(stats.totalKgDiverted*10)/10;stats.totalKmTraveled=Math.round(stats.totalKmTraveled*10)/10;
 res.json({success:true,stats});
});
module.exports={getOpenPickupJobs,getMyActiveJobs,getPickupHistory,getPickupById,acceptPickupJob,updatePickupStatus,cancelPickupJob,confirmPickupReceipt,updatePickupLocation,getVolunteerStats,parseQuantityMetrics};
