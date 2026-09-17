import {
  Routes
} from '@angular/router';

import {
  Home
} from './pages/home/home';

import {
  Login
} from './pages/login/login';

import {
  Register
} from './pages/register/register';

import {
  ForgotPassword
} from './pages/forgot-password/forgot-password';

import {
  Hospitals
} from './pages/hospitals/hospitals';

import {
  HospitalDetails
} from './pages/hospital-details/hospital-details';

import {
  HospitalCompare
} from './pages/hospital-compare/hospital-compare';

import {
  Favorites
} from './pages/favorites/favorites';

import {
  RecentlyViewed
} from './pages/recently-viewed/recently-viewed';

import {
  Insurance
} from './pages/insurance/insurance';

import {
  Emergency
} from './pages/emergency/emergency';

import {
  About
} from './pages/about/about';

import {
  HowItWorks
} from './pages/how-it-works/how-it-works';

import {
  authGuard
} from './guards/auth.guard';

import {
  guestGuard
} from './guards/guest.guard';


export const routes:
  Routes = [
    /* =====================================
       PUBLIC ROUTES
    ====================================== */

    {
      path: '',

      component: Home
    },

    {
      path: 'hospitals',

      component: Hospitals
    },

    {
      path: 'hospital-details/:id',

      component: HospitalDetails
    },

    {
      path: 'compare',

      component: HospitalCompare
    },

    {
      path: 'insurance',

      component: Insurance
    },

    {
      path: 'emergency',

      component: Emergency
    },

    {
      path: 'about',

      component: About
    },

    {
      path: 'how-it-works',

      component: HowItWorks
    },


    /* =====================================
       GUEST-ONLY ROUTES
    ====================================== */

    {
      path: 'login',

      component: Login,

      canActivate: [
        guestGuard
      ]
    },

    {
      path: 'register',

      component: Register,

      canActivate: [
        guestGuard
      ]
    },

    {
      path: 'forgot-password',

      component: ForgotPassword,

      canActivate: [
        guestGuard
      ]
    },


    /* =====================================
       AUTHENTICATED USER ROUTES
    ====================================== */

    {
      path: 'favorites',

      component: Favorites,

      canActivate: [
        authGuard
      ]
    },

    {
      path: 'recently-viewed',

      component: RecentlyViewed,

      canActivate: [
        authGuard
      ]
    },

    {
      path: 'profile',

      canActivate: [
        authGuard
      ],

      loadComponent: () =>
        import(
          './pages/profile/profile'
        ).then(
          module =>
            module.Profile
        )
    },


    /* =====================================
       UNKNOWN ROUTE
    ====================================== */

    {
      path: '**',

      redirectTo: ''
    }
  ];