/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AlertRules from './pages/AlertRules';
import Alerts from './pages/Alerts';
import Analytics from './pages/Analytics';
import Automation from './pages/Automation';
import Calendar from './pages/Calendar';
import Clients from './pages/Clients';
import Documentation from './pages/Documentation';
import EmailActivity from './pages/EmailActivity';
import Home from './pages/Home';
import Landing from './pages/Landing';
import NotificationCenter from './pages/NotificationCenter';
import Notifications from './pages/Notifications';
import Pricing from './pages/Pricing';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Users from './pages/Users';
import Vehicles from './pages/Vehicles';
import LegalNotice from './pages/LegalNotice';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import CookiePolicy from './pages/CookiePolicy';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AlertRules": AlertRules,
    "Alerts": Alerts,
    "Analytics": Analytics,
    "Automation": Automation,
    "Calendar": Calendar,
    "Clients": Clients,
    "Documentation": Documentation,
    "EmailActivity": EmailActivity,
    "Home": Home,
    "Landing": Landing,
    "Login": Login,
    "Register": Register,
    "AuthCallback": AuthCallback,
    "NotificationCenter": NotificationCenter,
    "Notifications": Notifications,
    "Pricing": Pricing,
    "Reports": Reports,
    "Settings": Settings,
    "Users": Users,
    "Vehicles": Vehicles,
    "LegalNotice": LegalNotice,
    "PrivacyPolicy": PrivacyPolicy,
    "TermsOfService": TermsOfService,
    "CookiePolicy": CookiePolicy,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    Layout: __Layout,
};