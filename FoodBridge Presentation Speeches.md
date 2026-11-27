# FoodBridge presentation speeches

Group I · SWT22022 · limit 30 minutes. Camera on and your own voice during your turn. Start your first slide with your full name and registration number. Total speaking time ≈ 27 minutes at 140 words per minute, leaving room for slide changes and any live demo.

## S. Piragenth (SEU/IS/22/ICT/075) · leader, opens · slides 1–7 · about 5.8 min (814 words)

### Slide 1 · FoodBridge

SPEAKER: S. Piragenth · about 40 seconds. Camera on.

“Hello, I am S. Piragenth, Registration Number SEU/IS/22/ICT/075, leader of Group I. Our project is FoodBridge, a smart food rescue and waste management platform built with the MERN stack: MongoDB, Express, React and Node.js.

It connects people who have surplus food with verified charities and shelters, with volunteers who carry it, and with recyclers and composting facilities for anything that cannot be eaten.

Each of us will present our own module. I start with the architecture and the database. The code is on GitHub and the application is live at foodbridge.piragenth.dev.”

TIMING PLAN (about 26 minutes, limit 30): Piragenth slides 1–7 ≈ 5.5 min · Iniyavan 8–10 ≈ 4.5 min · Hafsa 11–13 ≈ 4.5 min · Fathima Amna 14–16 ≈ 4.5 min · Alfan 17–19 ≈ 4.5 min · Piragenth 20–25 ≈ 4 min.

### Slide 2 · Surplus food and waste have no route to the right place in time

SPEAKER: S. Piragenth · about 45 seconds.

“Weddings, hotels and events produce edible surplus food and also recyclable or organic waste, but there is no simple way to route either one to the right place in time. Donors don’t know which verified NGO nearby can take the food before it spoils. NGOs can’t see what is available. Nobody organises the transport. And recyclable or organic waste ends up in general disposal.

Our objective is one ‘surplus post’. The system classifies it as food or as one of six waste streams, and routes it to a verified receiver using district-based smart matching.

There are five role-based portals, shown in the table, plus a public impact page that only counts confirmed activity.”

### Slide 3 · Three tiers: React client, Express API, MongoDB

SPEAKER: S. Piragenth · about 1 minute.

“This is our three-tier architecture, from left to right.

The React 18 client, built with Vite, renders one dashboard per role, and every API call goes through one file, api/client.js. Caddy handles HTTPS, and an Nginx container serves the React build and forwards /api to the backend. The application tier is Express 5 on Node.js 20: middleware, then routes, then controllers, and the business rules live in five services. On the right is MongoDB with Mongoose and eight collections.

Three decisions matter. First, MongoDB runs as a replica set, because a claim writes several documents, and MongoDB transactions need a replica set; if one write fails, nothing is kept. Second, only the API touches the database; the browser never decides who is allowed to do something. Third, everything ships as Docker containers on AWS EC2, deployed by GitHub Actions.”

### Slide 4 · One click, followed through every layer

SPEAKER: S. Piragenth · about 1 minute.

“Here is one request, step by step.

The React page calls api/client.js, which adds the JSON Web Token as a Bearer token. The request arrives over HTTPS, and /api is forwarded to Express on port 5000. Global middleware runs: helmet security headers, the rate limiter, the CORS whitelist, a check that the body is a JSON object, and a sanitiser that strips MongoDB operators. Then protect verifies the token and loads the user, and authorize checks the role.

The controller calls a service, the service runs its rules inside a transaction, and MongoDB commits all the writes or none. Errors come back with clear codes: 400 bad input, 403 not allowed, 409 conflict, 422 needs more information.

For example, a recipient’s claim re-checks eligibility, creates the pickup, marks the donation matched, reserves capacity and queues notifications, all in one transaction.”

### Slide 5 · Three kinds of state, each kept in one place

SPEAKER: S. Piragenth · about 1 minute.

“On the frontend, each kind of state lives in one place.

Global state is who is signed in. AuthContext holds the user and the token. The JWT is stored in localStorage and re-checked with GET /api/auth/me when the app loads, and a 401 response logs the user out.

Server data uses our own hook, useAsync. It returns data, error, loading and reload. After an action such as a claim, the page simply calls reload, so the server stays the single source of truth and we did not need Redux.

Local state, such as form fields, filters and open dialogs, uses useState, and dialogs use the native HTML dialog element.

On the right, App.jsx has one guarded route tree per role, so a donor cannot open the admin pages, and all five dashboards share the same UI building blocks.”

### Slide 6 · Eight collections; the Pickup joins a post to its people

SPEAKER: S. Piragenth · about 50 seconds.

“This is the ER diagram: eight collections linked by ObjectId references.

A user owns at most one Organization, enforced by a unique index on linkedUser. A donor creates many Donations and many WasteRequests.

The central collection is Pickup. It links one post, a donation or a waste request, to the receiving organisation and to the volunteer. A post can have at most one active pickup, enforced by a partial unique index, so the same batch can never be claimed twice.

Notification and Complaint reference users. ImpactRecord is a monthly summary calculated from completed pickups, which is why its line is dashed.”

### Slide 7 · Key fields, and the indexes that enforce the rules

SPEAKER: S. Piragenth · about 45 seconds.

“This table shows the key fields, and the rule each schema carries.

User stores only a bcrypt hash of the password, and the email is unique. Organization stores capacityKg and reservedKg, so it can never claim more than it has room for. Donation and WasteRequest keep a statusHistory array: a timestamped audit trail of every change. Pickup has the one-active-pickup index, and ImpactRecord is unique per month. The isDemo flag marks our seeded demonstration data, so it never reaches the public impact figures.

Now I hand over to Iniyavan for Module 1.”

## K. Iniyavan (SEU/IS/22/ICT/070) · slides 8–10 · about 4.5 min (637 words)

### Slide 8 · One guided form posts food or waste

SPEAKER: K. Iniyavan · about 1 minute 10 seconds. Camera on. (Optional: show the donor portal live instead of the screenshot.)

“Hello, I am K. Iniyavan, Registration Number SEU/IS/22/ICT/070. I built Module 1, donor and surplus posting, and the first authentication and donation backend: the User and Donation models, the auth controller and the auth middleware.

This is the Post surplus dialog. The donor chooses edible food, food that is not fit to eat, or recyclable waste, and the fields change with the choice: food type, storage condition, preparation time, quantity, available-from time, pickup deadline and district.

My frontend components are DonorDashboard for statistics and active posts, PostForm for creating and editing, and PostDetails for a post’s timeline and its ranked matches. Everything is created through one endpoint, POST /api/surplus, plus endpoints to list, edit and cancel donations and waste requests, all protected for the donor role. In the database, each post writes one Donation or WasteRequest with its first history entry, plus the notifications, in one transaction.”

### Slide 9 · POST /api/surplus: branch, validate, save

SPEAKER: K. Iniyavan · about 1 minute 30 seconds.

“Now the code logic. This is a shortened version of the POST /api/surplus route.

The request says whether the item is food or material. If it is food, the donor must declare its condition. Edible food becomes a Donation. Food that is not fit to eat becomes a WasteRequest with the category ‘organic’, so it goes to composting. If it is material, the route calls classifyWasteItem from Module 3. If the classifier is not sure, the API returns HTTP 422 and asks the donor to clarify, instead of guessing.

Then createPosting is called. Before anything is saved, validatePosting checks the input and returns 400 for problems such as unknown fields, an unknown district, a pickup deadline in the past, a preparation time that is not before the available time and the deadline, an invalid storage condition or category, or a photo that is not an http or https link.

createPosting runs inside one database transaction. It saves the post with its first status-history entry, ‘posted’, and then creates notifications for the donor and for verified organisations in the same district. If the notification write fails, the whole post is rolled back, and we have a test that forces this failure to prove it.

Finally, safe edits: a donor can only edit or cancel a post while it is still unclaimed. Otherwise the API returns 409. Every edit runs the full validation again.

Next, I will explain the security layer, starting with the authentication code I wrote.”

### Slide 10 · Every request is checked in layers

SPEAKER: K. Iniyavan · about 1 minute 15 seconds.

“Security works in layers. On the left is the authentication middleware.

When a user logs in, the server signs a JSON Web Token with a secret that is stored in an environment variable. The token is valid for seven days. Passwords are hashed with bcrypt using a salt, and we accept passwords from 8 characters up to 72 bytes, which is bcrypt’s limit. Nobody can register as an administrator through the public form.

On every protected request, the protect middleware verifies the token, and then loads the user again from the database. This matters: we do not trust the token alone. If an administrator suspends an account, the next request is refused with 403 immediately, even though the token has not expired.

Then authorize checks the role. You can see an example at the bottom: only a recipient or an admin can call the claim endpoint. There are also ownership checks in the services. For example, only the people involved in a pickup can read its details; anyone else gets 403.

For input validation, the request body must be a JSON object, and a sanitiser removes MongoDB operators such as dollar-gt, which blocks NoSQL injection. The services also whitelist fields and check types, dates and allowed values.

Finally, hardening: helmet security headers, a CORS whitelist, and rate limits of 500 requests per 15 minutes, with only 50 on the login and register routes against password guessing.

Thank you. Now Hafsa will present Module 2.”

## Y. Hafsa (SEU/IS/22/ICT/001) · slides 11–13 · about 4.6 min (649 words)

### Slide 11 · Recipients see only food they can really take

SPEAKER: Y. Hafsa · about 1 minute 10 seconds. Camera on. (Optional: show the recipient portal live.)

“Hello, I am Y. Hafsa, Registration Number SEU/IS/22/ICT/001. I built Module 2, district-based smart matching, and the recipient dashboard.

This is the recipient feed. It only shows food this organisation can really take: the storage matches, the quantity fits its free capacity, the district is in its service area, and there is enough time to transport it. Each post shows a match score, the distance and the time left, and the list can be searched, filtered and sorted.

My components are RecipientDashboard with the feed and the claim dialog, Claims for confirming receipt, and OrgProfile, where the organisation enters the capacity and districts that the matching uses. The endpoints are under /api/match: the nearby feed, stats, my claims, claim, cancel-claim, and the ranking used on the donor’s page. A claim writes a Pickup and updates the Donation and the organisation’s reserved capacity.”

### Slide 12 · Hard filters first, then a weighted score

SPEAKER: Y. Hafsa · about 1 minute 30 seconds.

“Matching works in two stages.

Stage one is the eligibility function in eligibilityService. These are hard filters: if any one fails, the post is removed from the feed, and if someone tries to claim it anyway the API returns 409 with the reason.

One: the organisation must be verified by an admin, accepting requests, and its owner account must be active. Two: the quantity must fit in the free capacity, which is capacityKg minus reservedKg. Three: the post’s district must be in the organisation’s service districts. Four: for food, the organisation must be an NGO, charity or shelter, and it must support the storage condition and the food type. Five: there must be enough time to transport it. We estimate the minutes as the distance times 1.25 for road winding, divided by 30 kilometres per hour, times 60, plus 10 minutes for loading. If that would arrive after the pickup deadline, the post is not eligible.

Stage two only orders the eligible posts. The smart match score is a weighted sum. Proximity is 40 percent: 100 points within 5 kilometres, going down in bands to 30 points at 150 kilometres. Urgency is 35 percent: the closer the deadline, the higher the score, so food that will spoil soon rises to the top. Quantity is 15 percent and storage is 10 percent.

For distance we use the Haversine formula when both sides have GPS coordinates. Otherwise we use the distance between district centres from our table of all 25 Sri Lankan districts, and the interface labels it as an estimate.”

### Slide 13 · A claim is one transaction, so it can’t double-book

SPEAKER: Y. Hafsa · about 1 minute 15 seconds.

“This is the claim logic in allocationService. Everything happens inside one transaction.

First we load the organisation for the logged-in user, and the donation. If the donation is no longer ‘posted’, someone already claimed it, so we return 409. Then we run the eligibility check again. This is important because the feed the user saw might be a minute old; the capacity or the deadline may have changed. So we check again with fresh data inside the transaction.

If it is still eligible, we create a Pickup with the status ‘matched’, mark the donation as matched, add the weight to the organisation’s reservedKg, and queue notifications for the donor and for volunteers in the district.

What happens if two NGOs click Claim on the same batch at the same moment? Both transactions try to change the same donation. MongoDB only lets one of them commit. The other one retries, sees that the status is already ‘matched’, and gets a 409 error. As a final guard, the partial unique index on Pickup does not allow a second active pickup for the same post. Our test ‘simultaneous claims allocate once’ sends several claims at the same time with Promise.all and checks that exactly one succeeds.

An organisation can also release a claim before the food is collected. The cancel-claim endpoint closes the pickup, puts the post back to ‘posted’ so other organisations can see it, and gives back the reserved kilograms.

Thank you. Now Fathima Amna will present Module 3.”

## MA. Fathima Amna (SEU/IS/22/ICT/082) · slides 14–16 · about 4.5 min (633 words)

### Slide 14 · Collectors see only the materials they process

SPEAKER: MA. Fathima Amna · about 1 minute 10 seconds. Camera on. (Optional: show the recycler portal live.)

“Hello, I am MA. Fathima Amna, Registration Number SEU/IS/22/ICT/082. I built Module 3, smart waste classification and the recycler and collector portal.

A recycler or composting facility sees only materials it handles, inside its capacity and service area, like this 25-kilogram plastic request about 3 kilometres away. It can search, filter by material, sort by deadline and claim a batch.

My components are RecyclerDashboard with the feed and the claim dialog, the Claims view where the facility confirms the processing outcome, and ProcessingRecord, which shows the final record. The endpoints under /api/waste include classify, the recycler feed, claims and stats, claim and cancel-claim, confirm-recycled, the eligible collectors and the processing record. The feed reads WasteRequests that match the facility’s materials, and the confirmation stores the outcome.”

### Slide 15 · A cautious classifier routes six waste streams

SPEAKER: MA. Fathima Amna · about 1 minute 30 seconds.

“The core of Module 3 is the waste classifier and the routing table on the left.

There are six waste streams. Plastic, glass, paper and cardboard, and metal go to a recycler, and the outcome is ‘recycled’. Organic waste goes to a composting facility, and the outcome is ‘composted’. Non-recyclable waste goes to waste management, and the outcome is ‘disposed’. Disposal adds zero kilograms to the recycling and landfill-diversion figures, so we never count landfill as an environmental win. When the facility confirms, it must confirm the outcome that matches the category; otherwise the API returns 400.

On the right is the classifier, classifyWasteItem. It is rule-based, not machine learning, and it is deliberately cautious.

First, if the description mentions hazardous items such as batteries, medical or chemical waste, it does not classify them at all. It returns requiresConfirmation, because those items need special handling we do not support.

Second, if the donor chose a category, we use it. Otherwise we match keywords for each stream. For example, ‘PET’ and ‘polythene’ mean plastic, and ‘peels’ and ‘scraps’ mean organic.

Third, if no stream matches, or more than one stream matches, such as ‘plastic and glass bottles’, we do not guess. The route returns HTTP 422 and asks the donor to separate the materials or choose a category.

Claiming waste uses the same eligibility check as Module 2. The only difference is that the facility type must match the stream: a recycler for the four recyclable materials, a composting facility for organic, and waste management for non-recyclable.”

### Slide 16 · Business rules are tested on a real database

SPEAKER: MA. Fathima Amna · about 1 minute 15 seconds.

“Now testing and verification. We have three layers.

First, unit and schema tests, run with npm test. They check pure logic such as the classifier, the matching scores, quantity parsing and the impact calculations.

Second, HTTP integration tests, run with npm run test:api. This is our API testing. Instead of clicking through Postman by hand, the test script starts a disposable MongoDB replica set in Docker, starts the real Express app, sends real HTTP requests and checks the status codes and the database. Then it deletes the database, so our real data is never touched. There are ten test suites.

Third, form validation. In the browser, fields use HTML validation such as required, type email and a minimum password length of 8. The server validates again and returns 400 or 422 with a message that is shown in the form.

The table shows some of the cases we test. If the notification write fails, the post is rolled back. When several organisations claim at the same time, exactly one succeeds. Ambiguous material gets 422. A volunteer cannot skip steps, and only the assigned volunteer can update a pickup. A stranger who tries to read a pickup gets 403. Nobody can register as an admin. And demo data or disposal is never counted as impact.

In our latest run, 33 HTTP tests and 8 unit tests passed with zero failures, and GitHub Actions runs all of them on every push before anything is deployed.

Thank you. Now Alfan will present Module 4.”

## AAM. Alfan Afky (SEU/IS/22/ICT/077) · slides 17–19 · about 4.2 min (581 words)

### Slide 17 · Volunteers move each job one recorded step at a time

SPEAKER: AAM. Alfan Afky · about 1 minute 10 seconds. Camera on. (Optional: show the volunteer portal live.)

“Hello, I am AAM. Alfan Afky, Registration Number SEU/IS/22/ICT/077. I built Module 4, volunteer, pickup and route tracking.

This is a volunteer’s active job. The progress bar shows Claimed, Assigned, Collected, Arrived and Confirmed. The cards show where to collect from and where to deliver to, with phone numbers, the deadline and the estimated travel time. The volunteer can record collection, open the route in OpenStreetMap, share their GPS location, or release the job. Contact details stay hidden on the open job board until a volunteer accepts.

VolunteerDashboard holds the job board, the active job, a dialog for each step with proof notes, and the history. My endpoints under /api/pickups cover open and active jobs, history, accept, status, cancel, location and confirm-receipt. Each step updates the Pickup and its source post together, in one transaction.”

### Slide 18 · Each step has one owner and one allowed order

SPEAKER: AAM. Alfan Afky · about 1 minute 30 seconds.

“This is the state machine in pickupService. It is the shared status pipeline from our proposal, and each step has exactly one owner.

The donor creates the post: Posted. An organisation claims it: Matched. A volunteer accepts the job: Pickup scheduled. The volunteer records collection: Picked up. The volunteer records arrival: Delivered or recycled. And finally the receiving organisation confirms receipt: Completed.

The code at the bottom shows how the order is enforced. The advance function has a map of the step that must come before each new step. First, assigned checks that the user is the volunteer assigned to this job, or an admin; anyone else gets 403. Then, if the current status is not the expected previous step, the API returns 409. So a volunteer cannot skip from accepted straight to arrived.

When recording collection, we also check that we are inside the availability window, before the deadline, and that the donor and the receiving organisation accounts are still active.

Every change appends a timestamped entry to statusHistory, updates the source post, and notifies the donor, the volunteer and the receiver, all in one transaction.

Two more rules. A volunteer can never mark a job completed. Only the receiving organisation can confirm it, or reject it with a reason, and a rejected delivery is not counted as impact. And jobs can end as cancelled, expired or rejected. A background job runs every 15 minutes and expires overdue posts and their pickups together. If a volunteer releases a job, a new unassigned pickup is created and other volunteers in the district are notified.”

### Slide 19 · One feature branch per module, merged through develop

SPEAKER: AAM. Alfan Afky · about 1 minute. (Optional: show the GitHub branches and pull requests page in the video.)

“Now version control. We used Git and GitHub with one feature branch per module.

The table shows each branch, its owner and the evidence in the history. Iniyavan worked on feature/donor-surplus and merged it through pull request 16. Hafsa worked on the recipient-matching branch, Fathima Amna on the waste-recycler branch, and I worked on feature/module-4-volunteer-pickup. My commit added the pickup controller, the Pickup model, the routes, the route utilities, a test file and the volunteer dashboard, about 2,500 lines across 8 files. Piragenth worked on the admin and impact branch and integrated the modules.

The flow is: each member works on a feature branch, opens a pull request into develop, which is our integration branch, and develop is then promoted to the production branch. A push to production triggers the deployment, which Piragenth will explain next.

We used conventional commit messages such as feat with the module name, or fix with the area. GitHub Actions runs the tests on every push and every pull request, so broken code is caught before it is merged.

Thank you. Now Piragenth will present Module 5.”

## S. Piragenth (SEU/IS/22/ICT/075) · closes · slides 20–25 · about 3.7 min (517 words)

### Slide 20 · The admin portal keeps the network trustworthy

SPEAKER: S. Piragenth · about 50 seconds. Camera on. (Optional: show the admin portal live.)

“Hello again, I am S. Piragenth, Registration Number SEU/IS/22/ICT/075. I built Module 5: admin, verification, notifications and impact.

This is the verification page, one of six admin sections: Overview, Verification, Monitoring, Users, Complaints and Reports. The admin reviews an organisation and verifies or rejects it with remarks, and lists can be exported as CSV.

AdminDashboard and AdminPages hold these sections, and I also built the notification bell that every role uses; it polls every 60 seconds. The endpoints cover verification, statistics, users, reports, snapshots, notifications, complaints and the public impact page.”

### Slide 21 · Verify first, notify reliably, count only confirmed

SPEAKER: S. Piragenth · about 55 seconds.

“Module 5 follows three rules.

First, verification. An admin verifies or rejects with remarks, and the organisation and its user change in one transaction. Rejection is refused while a claim is active, and any profile edit sends the organisation back to pending.

Second, notifications are written with the same database session as the event, so a claim can never exist without its notifications.

Third, impact. The filter at the bottom counts only completed, receiver-confirmed, non-demo posts, and disposal adds nothing. We never invent numbers: meals are the declared portions or kilograms times 2.5, labelled as an estimate, and CO2 and tree equivalents return null because we have no validated model.”

### Slide 22 · A push to production is tested, then deployed

SPEAKER: S. Piragenth · about 55 seconds. (Optional: show the green GitHub Actions run and the live site.)

“We host on AWS EC2 with Docker Compose, deployed by GitHub Actions.

The pipeline runs the backend tests and the frontend build. Only if both pass, and only on the production branch, it connects over SSH, runs docker compose up with a rebuild, and calls /api/health.

Compose runs MongoDB as a health-checked replica set, the Node 20 backend on a port bound to localhost only, and Nginx for the frontend. Cloudflare sends traffic to a shared Caddy container that handles HTTPS. Our compose file joins our containers to Caddy’s network, so every deploy reconnects automatically. Secrets live in GitHub secrets and in the server’s environment, never in the code.”

### Slide 23 · Two ways to run FoodBridge on a laptop

SPEAKER: S. Piragenth · about 35 seconds.

“To run FoodBridge locally, the simplest way is Docker: clone the repository, run docker compose with the local file, and open localhost port 8080.

For development, copy .env.example to .env in the backend, then run npm ci and npm run dev in both the backend and the frontend. The key environment variables are on the right.

The one requirement is that MongoDB runs as a replica set, because our transactions need it. Without one, the API returns a clear 503 message.”

### Slide 24 · Who built what

SPEAKER: S. Piragenth · about 35 seconds.

“This is our contribution matrix, with each member’s registration number, module, deliverables and agreed share.

Iniyavan built the donor module, Hafsa the matching engine, Fathima Amna the waste classifier and recycler portal, and Alfan the volunteer pickup pipeline. I built Module 5, plus the architecture, integration, testing and deployment.

Our agreed percentages are: [read the five agreed percentages here].”

BEFORE RECORDING: replace every [__ %] on the slide and in this note with the percentages the group agrees. They must add up to 100%.

### Slide 25 · What works today, and what comes next

SPEAKER: S. Piragenth · about 35 seconds.

“To be honest about the limits: there is no map inside the app yet, only a link to OpenStreetMap, and our distances are estimates. Photos are links, notifications are in-app only, and a batch is claimed as a whole.

Next, we plan an in-app Leaflet map with routing, photo uploads, email and SMS notifications, splitting batches, Sinhala and Tamil, and automated browser tests.

Thank you for watching.”
