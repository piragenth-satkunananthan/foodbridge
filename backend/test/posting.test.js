const {test}=require('node:test');
const assert=require('node:assert/strict');
const {setup,user,foodBody,Donation,WasteRequest}=require('./helpers');
const api=setup();
test('posting validates complete date and quantity rules on creation and edits',async()=>{
 const donor=await user('donor');
 const posted=await api('POST','/donations',donor,foodBody());
 assert.equal(posted.status,201,JSON.stringify(posted.body));
 assert.equal(posted.body.quantityValue,20);
 for(const quantity of ['-5 kg','unknown','20','1e3 kg']) assert.equal((await api('POST','/donations',donor,foodBody({quantity}))).status,400);
 assert.equal((await api('PUT',`/donations/${posted.body._id}`,donor,{preparedTime:new Date(Date.now()+172800000).toISOString()})).status,400);
 assert.equal((await api('PUT',`/donations/${posted.body._id}`,donor,{availableTime:new Date(Date.now()+172800000).toISOString()})).status,400);
 assert.equal((await api('PUT',`/donations/${posted.body._id}`,donor,{status:'completed'})).status,400);
 const other=await user('donor');
 assert.equal((await api('PUT',`/donations/${posted.body._id}`,other,{quantity:'5 kg'})).status,404);
 assert.equal((await api('DELETE',`/donations/${posted.body._id}`,donor)).status,200);
 assert.equal((await Donation.findById(posted.body._id)).statusHistory.length,2);
});
test('waste instructions persist and invalid weight never enters the database',async()=>{
 const donor=await user('donor');
 const body={wasteCategory:'organic',quantity:'5 kg',district:'Colombo',pickupDeadline:new Date(Date.now()+3600000).toISOString(),specialInstructions:'Keep sealed'};
 assert.equal((await api('POST','/waste',donor,{...body,quantity:'-5 kg'})).status,400);
 const response=await api('POST','/waste',donor,body);
 assert.equal(response.status,201,JSON.stringify(response.body));
 assert.equal((await WasteRequest.findById(response.body._id)).specialInstructions,'Keep sealed');
 assert.equal((await api('PUT',`/waste/${response.body._id}`,donor,{quantity:20})).status,400);
});
