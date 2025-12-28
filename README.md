# RevoCity

RevoCity is a smart waste management platform designed to help cities monitor dustbin conditions, prioritize sanitation issues, and enable authorities to respond more efficiently.  
Citizens can upload dustbin images, the system evaluates the condition, verifies authenticity, assigns priority, logs complaints with location, and supports authorities through dashboards, live maps, analytics, and community engagement features.

---

## Project Overview

RevoCity focuses on improving public cleanliness through structured reporting, faster complaint resolution, data-driven insights, and citizen participation.  
The platform supports secure access, automated assessment, live visualization, authority workflows, rewards, and transparency features to make urban waste management more organized and effective.

---

## Key Features

### Bin Condition Assessment
- Detects bin status: clean, full, overflowing, or critical  
- Estimates hygiene and risk levels  
- Validates image authenticity with a percentage score  

### Complaint Management
- Citizens can report issues with images and location
- Automatic priority assignment
- Complaint tracking and status monitoring

### Health Risk Insights
- Identification of mosquito breeding risk
- Possible disease transmission risk indicators
- Odor and sanitation risk indicators

### Interactive Map and Visibility
- Google Maps integration
- Visual representation of bin locations and severity
- Hotspot and risk zone identification

### Engagement and Participation
- Reward and point system for verified contributions
- Community leaderboard highlighting active contributors

### Analytics and Insights
- Zone-based trends and historical records
- Overflow pattern detection
- Predictive cleanliness insights

### Authority Dashboard
- Complaint tracking and assignment
- SLA monitoring
- Escalation handling
- Role-based user management
- Cleanup proof verification

### Additional Capabilities
- Secure authentication with email/password
- Scan history for previously analyzed bins
- Light/Dark theme support
- Public transparency statistics

---

## Tech Stack

| Layer        | Technologies |
|-------------|--------------|
| Frontend    | React, TypeScript, Vite |
| Backend     | Firebase Firestore, Firebase Authentication, Firebase Storage |
| Processing  | Google-based image processing and assessment |
| Mapping     | Google Maps Platform |
| Deployment  | Vercel |
| Versioning  | GitHub |

---

## Project Structure

revocityai/

├── public/ # Static assets

├── src/ # Application source code

├── components/ # UI components

├── pages/ # Page views

├── assets/ # Media/resources

├── package.json

├── tsconfig.json

├── vite.config.ts

└── README.md


---

## Setup and Installation

```bash
**1. Clone the repository**

git clone https://github.com/vamshialle66/revocityai.git
cd revocityai

**2. Install dependencies**

npm install

**3. Environment Variables**

Create a .env file in the project root and configure:

VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_id
VITE_FIREBASE_APP_ID=your_app_id

VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key

**4. Run the project locally**

npm run dev


**Application runs at:**

(http://localhost:5173)



###Developed By

**Team REVOLX**
