# Orbit 
_Hyper-local ride-sharing mobile application, built for campuses_

Campuses, particularly large residential institutions, present a transportation challenge that commercial ride sharing platforms were never designed to address. Academic blocks, hostels, research facilities, and administrative buildings are spread across hundreds of acres, and the distances between them are significant enough to cause genuine daily inconvenience yet too short and too localised for services like Ola or Uber to operate economically. Students are left walking regardless of weather or time constraints, while fellow students with private vehicles travel the same routes daily with empty seats. This disconnect, though seemingly minor in isolation, accumulates into a systemic inefficiency that affects student productivity, punctuality, and overall campus experience on a daily basis.

This project introduces Orbit; a hyper-local ride-sharing mobile application built specifically for the university campus ecosystem. The core idea is straightforward: connect students who need transport with verified fellow students who own vehicles, forming a peer-to-peer mobility network governed entirely by institutional identity. The general-purpose ride-sharing platforms that prioritise scale and commercial viability, Orbit is designed around the specific spatial, social, and logistical characteristics of a single campus community. Because every participant is a confirmed member of the university, the platform achieves a level of inherent trust and mutual accountability that no open commercial service can replicate.

The system is built as three distinct but tightly integrated components, each addressing a specific layer of the problem. The mobile application, developed using React Native with the Expo framework, provides a single unified interface through which any student can function as either a rider or a driver depending on their immediate need. This flexibility is deliberate, on a campus, the same student may require a lift to an early morning lecture and be in a position to offer one the same afternoon. The backend server, built on Node.js and Express.js, manages authentication, ride lifecycle operations, and real-time communication between riders and drivers via Socket.io over persistent WebSocket connections. This architecture ensures that ride requests, acceptances, and location updates are propagated with minimal latency, which is critical in a time-sensitive campus context. A React.js web-based administrative panel completes the system, allowing university administration to review, approve, or reject both student registrations and driver applications before any user is granted access to the platform. This keeps institutional oversight embedded in the platform rather than treated as an afterthought.

Verification in Orbit follows a deliberate and unhurried manual model, which distinguishes it from consumer applications that prioritise frictionless onboarding. Students register by uploading a photograph of their university identity card along with filling in some details, which an administrator reviews through the admin panel before the account is activated. Students who wish to drive additionally submit their driving licence number, vehicle registration details, and photographs of both their vehicle and licence. This two-stage verification process is applied separately for general users and for drivers, ensures that the platform remains an exclusively institutional space, and that a meaningful human check exists at every point of entry. The administrative overhead this introduces is considered a worthwhile trade-off given the safety and accountability requirements of a campus transit app.

Ride matching and communication are handled in real time through six Socket.io events that together cover the full lifecycle of a ride transaction. When a rider submits a request, it is broadcast over WebSockets to all currently online drivers in the vicinity. Once a driver accepts the request, the driver's position is animated along actual road geometry using an open-source routing engine, providing riders with a realistic and continuously updated view of the approaching vehicle rather than a simple straight-line approximation on the map. Fares are calculated automatically at trip according to the formula f = 10 + 10d, where d represents the total distance travelled in kilometres, and the resulting amount is presented to both the rider and driver as a reference figure for offline settlement via cash or unified payment interface.

The application was developed and tested on two physical Android devices using the Expo development client, working through all primary user flows under real conditions rather than simulated environments. The testing process validated the complete end-to-end experience, from registration and admin approval through ride request, matching, live tracking, trip completion, fare calculation, and review submission. Orbit addresses a genuine and largely overlooked mobility problem within the university ecosystem, and the architecture has been designed with extensibility in mind. Future iterations of the platform can build upon this foundation to incorporate live location tracking, integrated digital payment processing, automated driver-to-rider matching algorithms, and deployment across multiple institutional campuses, moving from a single-university solution toward a replicable model for campus mobility at scale.

## What I built

| Experience | What it does |
| --- | --- |
| Student onboarding | Register with a university ID image; an admin approves or rejects the account with a reason. Rejected students can resubmit. |
| One app, two roles | A verified student can request a ride or apply to drive using the same account. Drivers submit vehicle and licence details for a second approval. |
| Ride lifecycle | A rider picks a GNDU destination and sees an estimate. A driver receives the request, accepts it, signals pickup, and completes the trip. Both screens update through Socket.IO events. |
| Campus route view | Predefined campus landmarks and device location feed a map. OSRM supplies road geometry for route previews and marker animation. |
| Admin review | A React web panel displays pending student IDs and driver documents with approval and rejection actions. |
| History and earnings | Completed rides feed the history and driver earnings views through the backend. |

The mobile app estimates fares using **₹10 base + ₹10 per kilometre**, rounded to the nearest rupee. The amount is displayed for offline settlement; there is no in app payment gateway.

## How the pieces connect

<img width="1271" height="489" alt="image" src="https://github.com/user-attachments/assets/3376215d-c934-476f-b36d-d964b5ed100d" />

The backend uses JWT authentication and bcrypt password hashing, stores uploaded verification images with Multer, and uses Socket.IO to forward ride events. After a driver accepts, the server sends the rider that driver's vehicle details and rating. The UI animates a marker on the OSRM route; it does **not** stream the driver's actual GPS coordinates.

**Stack:** React Native + Expo, React Navigation, Zustand, React Native Maps, Node.js, Express, Socket.IO, PostgreSQL (Supabase), React, Axios, OSRM.

## Walk through a ride

1. A student registers, uploads an ID card, and waits for admin approval. A prospective driver separately submits a licence and vehicle image.
2. An approved rider chooses a campus destination, reviews the route and estimated fare, and requests a ride.
3. The request reaches connected clients via Socket.IO. A driver accepts; the rider sees the driver's name, vehicle, plate number, and trip state.
4. The driver marks pickup and completion. The rider sees the fare summary, and the backend attempts to save the completed ride for history and earnings.

## Project structure

```text
orbit/
├── mobile/        # Expo app for students and drivers
├── backend/       # Express API, PostgreSQL, uploads, Socket.IO
└── admin-panel/   # React interface for manual approvals
```

## Local setup

Install Node.js and npm, provide a PostgreSQL database, and run the backend, mobile app, and admin panel in separate terminals. A physical phone must reach the backend on your computer's LAN address.

```bash
git clone https://github.com/mightysimran/capstone-orbit.git
cd capstone-orbit
cd backend && npm install
cd ../mobile && npm install
cd ../admin-panel && npm install
```

Create `backend/.env`:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
PORT=5000
```

Create `mobile/.env` (use your computer's LAN IP, not `localhost`, for a phone):

```dotenv
EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:5000/api
EXPO_PUBLIC_SOCKET_URL=http://YOUR_LAN_IP:5000
```

Run each component in its own terminal:

```bash
cd backend && npm run dev
cd mobile && npm start
cd admin-panel && npm start
```

The admin panel currently uses `http://localhost:5000` in its page components. The repository does not include database migrations or seed data, so a fresh clone also needs the expected PostgreSQL tables and an admin account before the full flow can run.

<img width="1037" height="570" alt="image" src="https://github.com/user-attachments/assets/0c6be656-53a6-46a1-9c11-e293903ffe83" />
<img width="1034" height="576" alt="image" src="https://github.com/user-attachments/assets/05ba7cc8-4a82-4e62-a5f7-f32fb466dd48" />
<img width="1042" height="581" alt="image" src="https://github.com/user-attachments/assets/fb70f0b3-18bb-4301-9da1-eb7f17ba93eb" />
<img width="1035" height="573" alt="image" src="https://github.com/user-attachments/assets/6039d9f4-b7cc-42f6-b6de-ce243c5abc60" />
<img width="1044" height="588" alt="image" src="https://github.com/user-attachments/assets/c1d3170d-4060-4584-af82-e6d97612e38a" />
<img width="1039" height="591" alt="image" src="https://github.com/user-attachments/assets/0248b3c4-b5e2-4614-b033-a5a94e07b78a" />
<img width="1037" height="577" alt="image" src="https://github.com/user-attachments/assets/1e292d2f-f3c0-410f-9973-d438e03fbbb6" />
<img width="1034" height="583" alt="image" src="https://github.com/user-attachments/assets/9924d05a-7a2a-4e97-b9b5-21611c18356c" />
<img width="1040" height="579" alt="image" src="https://github.com/user-attachments/assets/35131a70-538f-4147-bf4e-950819446366" />
<img width="1035" height="598" alt="image" src="https://github.com/user-attachments/assets/1d3a3c88-457d-41a0-a800-2822dd960218" />
<img width="1041" height="586" alt="image" src="https://github.com/user-attachments/assets/c4e52402-b3ac-442a-85f8-32cf7693ed68" />
<img width="1036" height="575" alt="image" src="https://github.com/user-attachments/assets/95929328-7b5f-4e98-b88d-265d942d75cb" />
<img width="1038" height="580" alt="image" src="https://github.com/user-attachments/assets/4b59507e-14f3-4751-9801-0984da33dce6" />
<img width="1039" height="581" alt="image" src="https://github.com/user-attachments/assets/a7f52366-f4f4-4a8f-aafc-dee7c495aee6" />
<img width="1038" height="580" alt="image" src="https://github.com/user-attachments/assets/02498958-a9d6-4e25-b664-d6653976ec63" />
<img width="1041" height="581" alt="image" src="https://github.com/user-attachments/assets/c0b90035-2f08-46ea-ba85-c0f8c6c35560" />
<img width="1039" height="582" alt="image" src="https://github.com/user-attachments/assets/987f0d0b-a08a-426c-9dab-e79a92b351ed" />
<img width="1042" height="579" alt="image" src="https://github.com/user-attachments/assets/9f8feaca-8fd2-43b6-a5d3-6848bd56f029" />
<img width="1041" height="582" alt="image" src="https://github.com/user-attachments/assets/b39f071d-048c-4982-b11b-43b40ff68489" />
<img width="1034" height="582" alt="image" src="https://github.com/user-attachments/assets/8780ecf4-2e3b-4c8c-8846-41cd57f8505c" />
<img width="1040" height="574" alt="image" src="https://github.com/user-attachments/assets/dfe14b67-1112-4945-b863-3e17d5e9d3c9" />
<img width="1040" height="579" alt="image" src="https://github.com/user-attachments/assets/ed90ee7b-aa27-4df0-9288-626f1cc75a18" />
<img width="1036" height="580" alt="image" src="https://github.com/user-attachments/assets/d1c61215-27d9-4251-bbaa-a743925040f5" />
<img width="1040" height="578" alt="image" src="https://github.com/user-attachments/assets/045a98fb-23bd-40ca-9ba8-f4b23bb6f070" />
<img width="1038" height="579" alt="image" src="https://github.com/user-attachments/assets/390c08b1-36d1-4073-bda1-1141b820721c" />
<img width="1037" height="576" alt="image" src="https://github.com/user-attachments/assets/ad746ee6-3e2d-4aa8-aa2e-cb277a06fe12" />
