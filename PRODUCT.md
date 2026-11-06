# FoodBridge

<<<<<<< HEAD
<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

All five roles have equal product priority:

- Donors post surplus food and waste collection requests and follow their progress.
- Recipient organisations find suitable food and coordinate acceptance for the people they serve.
- Recyclers collect compatible waste and record processing outcomes.
- Volunteers accept pickup assignments and record collection and delivery.
- Administrators verify organisations, moderate accounts, monitor activity, and review reports.

Recipient and recycler jobs describe the intended workflow; their current dashboards do not yet provide browsing and claims. Equal priority does not imply equal implementation completeness.

## Product Purpose

Connect surplus food with recipient organisations and route waste to appropriate collectors in Sri Lanka. Coordinate posting, allocation, transport, and receiving-party confirmation while retaining a trustworthy record of outcomes.

Success means completed, confirmed food deliveries and recorded waste processing, with each role able to understand and complete its part of the workflow.

## Operating Context

- Coordination uses Sri Lankan districts, with location-based estimates where coordinates are available.
- Food posts include quantity, preparation and storage details, availability, and collection deadlines. Waste requests remain a separate workflow.
- Recipient and recycler organisations require admin verification. Backend claims depend on capacity, compatibility, service area, and account eligibility.
- Volunteers record collection and arrival; receiving organisations confirm acceptance or processing before completion contributes to impact.
- The public homepage, registration, sign-in, and community impact report support the five role-specific dashboards.

## Capabilities and Constraints

- Preserve the distinction between edible food donations and waste collection, including organic waste.
- Keep business rules and authorisation in the API. Interface availability must reflect implemented end-to-end workflows.
- Backend allocation uses whole batches; partial allocations are not supported.
- Report declared quantities and calculated estimates as such. Distance estimates are not road navigation; meal equivalents are not measured meals.
- Public impact includes confirmed, non-demo activity. Demonstration records must remain distinguishable from real activity.
- No validated emissions or water-savings model is configured. Do not invent these figures or imply environmental certification.
- Cloud photo upload and road routing remain unconfigured integrations. Existing photo URLs do not establish an upload service.
- Current recipient and recycler dashboard limitations must remain clear until the relevant interfaces are implemented and validated.
- Required languages and product-specific accessibility requirements remain undecided. Current interface copy is English; this is not a confirmed English-only requirement.

## Brand Commitments

Preserve the FoodBridge name. Product communication must accurately distinguish available features, unfinished workflows, estimates, demonstration data, and confirmed outcomes.

## Evidence on Hand

- `frontend/src/App.jsx`: public routes and the five role-specific dashboard routes.
- `frontend/src/pages/HomePage.jsx` and `frontend/src/pages/RegisterPage.jsx`: current public explanation and disclosures about unavailable organisation claims.
- `docs/BACKEND-API.md`: backend workflow contracts and integration limitations; backend support alone does not prove frontend readiness.
- `docs/BACKEND-REMEDIATION.md`: recorded backend validation and rollout limitations, not a claim of current end-to-end acceptance.
- `FoodBridge_Platform_Architecture_Proposal.pdf`: intended requirements; proposed capabilities are not evidence of implementation.
- `README.md`: project overview and setup instructions; reconcile capability claims against current code and workflow contracts.
- No customer testimonials, adoption figures, or independently verified impact claims were confirmed during init. Do not fabricate them.

## Product Principles

- Give donors, recipient organisations, recyclers, volunteers, and admins equal consideration in product decisions.
- Make each role's next action and its effect on the shared workflow clear.
- Preserve verification, food and waste separation, and receiving-party confirmation throughout the journey.
- Prefer truthful limitations and recoverable errors over invented results or implied capabilities.
- Keep recorded outcomes, estimates, and demonstration data distinct.
||||||| 2b1eacd
=======
## Platform
Web application for food sharing and separate waste collection in Sri Lanka.

## Audience and purpose
Donors, recipients, recyclers, volunteers and administrators. The homepage helps visitors understand the service and find their role. The user confirmed equal visibility for all five roles and delegated visual direction.

## Product truth
Donors list surplus food or waste with quantity, storage, district and collection details. Volunteers accept available pickups and record delivery. Recipient and recycler accounts support organisation registration and review; browsing and claiming are not available yet. Admin access requires sign-in. Community impact distinguishes recorded food deliveries from waste collection. Do not invent impact figures or availability.

## Stack
Existing React/Vite frontend, React Router, Lucide icons and CSS. Preserve authentication and role routing.

## Design constraints
Build a new homepage with ample space and responsive layout. Preserve FoodBridge's name, honest limitations, accessible controls and all five roles. Previously rejected compositions are not visual authority.
>>>>>>> develop
