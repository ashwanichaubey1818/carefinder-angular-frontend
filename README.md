# CareFinder — Health Insurance Hospital Locator

CareFinder is a full-stack healthcare directory application that helps users discover hospitals based on location, insurance provider, emergency availability, rating and distance.

This repository contains the Angular frontend. It connects to the CareFinder Spring Boot REST API.

## Live deployment

- Frontend: https://carefinder-angular-frontend.ashwanichaubey1818.workers.dev
- Backend API: https://carefinder-springboot-backend.onrender.com
- API health: https://carefinder-springboot-backend.onrender.com/actuator/health
- Swagger UI: https://carefinder-springboot-backend.onrender.com/swagger-ui.html
- Cloud database: TiDB Cloud (MySQL compatible)

The live application uses an Angular frontend, Spring Boot REST API,
TiDB Cloud database, JWT authentication and Brevo transactional email
for secure password-reset delivery.

## Key Features

- Nationwide directory with 100 demonstration hospital profiles
- Search by hospital name, city or state
- Filter by insurance provider
- Emergency and 24×7 availability filters
- Minimum rating filter
- GPS-based hospital distance calculation
- Sort by recommendation, distance, rating or name
- Paginated hospital directory
- Detailed hospital profiles
- Interactive Leaflet and OpenStreetMap integration
- Google Maps directions
- Saved hospitals and recently viewed history
- Hospital comparison
- Emergency Hospital Finder with search radius
- Downloadable hospital comparison reports
- Responsive desktop, tablet and mobile interface

## Authentication and User Features

- User registration with form validation
- Secure Spring Boot and MySQL authentication
- JWT access and refresh tokens
- Automatic access-token refresh
- Remember-me support
- Protected routes using Angular guards
- Password reset
- User profile management
- Secure logout and session cleanup
- Backend-managed favorites and recently viewed hospitals

## CareFinder Assistant

- English and Hindi language support
- Hospital and city search
- Emergency and 24×7 hospital queries
- Voice input
- Browser chat history
- Public internet information fallback
- Hospital profile links
- Responsive chatbot interface

## Technologies

- Angular 22
- TypeScript
- HTML5
- CSS3
- Angular Signals
- Angular Reactive Forms
- Angular Router
- Angular SSR
- RxJS
- Leaflet
- OpenStreetMap
- Spring Boot REST API
- MySQL
- JWT Authentication

## Related Backend Repository

[CareFinder Spring Boot Backend](https://github.com/ashwanichaubey1818/carefinder-springboot-backend)

## Requirements

Install:

- Node.js
- npm
- Angular CLI
- CareFinder Spring Boot backend
- MySQL for the backend

## Installation

Clone the frontend repository:

```bash
git clone https://github.com//carefinder-angular-frontend.git
```

Open the project folder:

```bash
cd carefinder-angular-frontend
```

Install dependencies:

```bash
npm install
```

## Run Locally

Start the CareFinder backend first. It should be available at:

```text
http://localhost:8080
```

Start the Angular development server:

```bash
ng serve
```

Open:

```text
http://localhost:4200
```

## Production Build

Because Angular SSR prerendering loads hospital information, keep the backend running while creating the production build.

```bash
ng build
```

Build output:

```text
dist/health-insurance-locator
```

## Run the SSR Production Build on Windows

```powershell
$env:PORT="4200"
$env:NG_ALLOWED_HOSTS="localhost,127.0.0.1"
node .\dist\health-insurance-locator\server\server.mjs
```

Open:

```text
http://localhost:4200
```

## Testing

Run frontend tests:

```bash
ng test
```

Create a production build:

```bash
ng build
```

## Security

- Passwords are never stored in browser Local Storage.
- Authentication is handled by the Spring Boot backend.
- Access and refresh tokens are used for authenticated requests.
- Protected pages use Angular route guards.
- Do not commit passwords, tokens or private environment files.

## Demonstration Data Notice

Hospital, insurance, rating and availability information in this academic project is demonstration data.

Always confirm current treatment availability, insurance coverage and cashless eligibility directly with the hospital and insurance provider.

## Author

Ashwani Kumar
[![Frontend CI](https://github.com/ashwanichaubey1818/carefinder-angular-frontend/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/ashwanichaubey1818/carefinder-angular-frontend/actions/workflows/frontend-ci.yml)
