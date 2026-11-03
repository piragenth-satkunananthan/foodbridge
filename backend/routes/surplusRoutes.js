const router=require('express').Router();
const {protect,authorize}=require('../middleware/authMiddleware');
const {endpoint,fail}=require('../utils/domain');
const {classifyWasteItem}=require('../utils/wasteClassifier');
const {createPosting}=require('../services/postingService');
router.post('/',protect,authorize('donor'),endpoint(async(req,res)=>{
 const {itemType,condition,description,...details}=req.body;
 if(!['food','material'].includes(itemType)) fail(400,'itemType must be food or material');
 let kind,classification;
 if(itemType==='food') {
  if(!['edible','inedible'].includes(condition)) fail(400,'Donor must explicitly declare food condition');
  if(condition==='edible') {kind='donation';classification={pathway:'donation',basis:'donor-declared edible; recipient acceptance required'};}
  else {kind='wasteRequest';classification={pathway:'composting',basis:'donor-declared inedible food'};details.wasteCategory='organic';delete details.foodType;delete details.preparedTime;delete details.storageCondition;}
 } else {
  classification=classifyWasteItem({...details,description});
  if(classification.requiresConfirmation) return res.status(422).json({message:classification.reason,classification});
  kind='wasteRequest';details.wasteCategory=classification.category;
 }
 const post=await createPosting(details,req.user,kind);
 res.status(201).json({kind,classification,post});
}));
module.exports=router;
