# CareFinder — Health Insurance Hospital Locator

Professional Angular 22 frontend with a nationwide 100-hospital demonstration directory, responsive navigation, insurance filters, GPS distance calculation, map directions, accessible UI, persistent saved hospitals, and a complete frontend authentication demo.

## Hospital directory

- Exactly **100 curated demonstration profiles** across major Indian cities and regions.
- Search by hospital name, city or state.
- Filter by 8 insurance providers, emergency care, 24×7 availability, rating and GPS radius.
- Sort by recommendation, distance, rating or hospital name.
- Paginated results with 12 profiles per batch for a faster, cleaner directory.
- Detailed profiles with specialties, bed capacity, accreditation, listed insurers and map directions.
- SSR-safe Leaflet integration with browser-only loading and map cleanup.

> The included hospital, insurance, rating and availability information is demonstration data for an academic project. Confirm live details directly with the hospital and insurer before treatment.

## Authentication demo

- Create an account with validated name, email, Indian mobile number and password.
- Sign in with the same email and password.
- Use **Remember me** to keep the session after closing the browser.
- Reset the password through **Forgot password** using the registered email.
- Sign out from the navigation bar.
- Open the protected **My Profile** page after signing in.
- View name, email, mobile, city, preferred insurance, account status and member date.
- Edit profile details and keep the current session updated.
- View saved hospitals directly from the profile.

## UI improvements

- Redesigned responsive navigation with a logged-in profile card.
- Personalized welcome section on the home page.
- Consistent healthcare color palette, spacing, cards and buttons across every page.
- Redesigned search-first home page, hospital directory, hospital details and insurance pages.
- Shared responsive footer and better mobile navigation.
- WCAG-friendly focus states, semantic labels and reduced-motion support.

This frontend-only demo stores account data in the browser's local storage. For a production deployment, connect these forms to a secure backend API and never store passwords in local storage.

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:4200`.

If Angular reports that the CLI is outside a workspace, first move into the extracted project folder—the one containing `angular.json`—and run the commands there.

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.0.7.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
