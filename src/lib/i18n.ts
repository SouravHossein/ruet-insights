import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      // Navigation
      'nav.dashboard': 'Dashboard',
      'nav.mapAnalytics': 'Map & Analytics',
      'nav.verification': 'Verification',
      'nav.adminPanel': 'Admin Panel',
      'nav.about': 'About',

      // Header
      'header.title': 'RUET Student Intelligence Dashboard',

      // Sidebar
      'sidebar.navigation': 'Navigation',
      'sidebar.management': 'Management',
      'sidebar.footer': '© 2025 RUET SID',

      // Common
      'common.loading': 'Loading...',
      'common.error': 'Error',
      'common.success': 'Success',
      'common.cancel': 'Cancel',
      'common.save': 'Save',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.view': 'View',
      'common.search': 'Search',
      'common.filter': 'Filter',
      'common.export': 'Export',
      'common.import': 'Import',

      // Dashboard
      'dashboard.title': 'Dashboard',
      'dashboard.welcome': 'Welcome to RUET Student Intelligence Dashboard',
      'dashboard.stats': 'Statistics',
      'dashboard.totalStudents': 'Total Students',
      'dashboard.verifiedStudents': 'Verified Students',
      'dashboard.pendingVerifications': 'Pending Verifications',
      'dashboard.districts': 'Districts',

      // Map Analytics
      'map.title': 'Map & Analytics',
      'map.description': 'Geographic distribution of RUET students',
      'map.selectDistrict': 'Select District',
      'map.studentsCount': 'Students Count',

      // Verification
      'verification.title': 'Student Verification',
      'verification.description': 'Verify student information using admission PDF',
      'verification.uploadPdf': 'Upload PDF',
      'verification.dragDrop': 'Drag and drop your PDF here, or click to select',
      'verification.processing': 'Processing...',
      'verification.verify': 'Verify Student',
      'verification.name': 'Name',
      'verification.roll': 'Roll Number',
      'verification.registration': 'Registration Number',
      'verification.hscRoll': 'HSC Roll',
      'verification.hscReg': 'HSC Registration',
      'verification.board': 'Board',
      'verification.district': 'District',
      'verification.verified': 'Verified',
      'verification.notVerified': 'Not Verified',

      // Admin Panel
      'admin.title': 'Admin Panel',
      'admin.description': 'Manage student data and verifications',
      'admin.students': 'Students',
      'admin.verifications': 'Verifications',
      'admin.settings': 'Settings',

      // About
      'about.title': 'About',
      'about.description': 'Learn more about RUET Student Intelligence Dashboard',

      // Theme
      'theme.light': 'Light',
      'theme.dark': 'Dark',
      'theme.toggle': 'Toggle theme',

      // Insights Panel
      'insights.topDistricts': 'শীর্ষ জেলা',
      'insights.byDepartment': 'বিভাগ অনুসারে',
      'insights.underrepresented': 'কম প্রতিনিধিত্ব',
      'insights.noData': 'এখনও কোন তথ্য নেই',
    }
  },
  bn: {
    translation: {
      // Navigation
      'nav.dashboard': 'ড্যাশবোর্ড',
      'nav.mapAnalytics': 'ম্যাপ এবং অ্যানালিটিক্স',
      'nav.verification': 'যাচাইকরণ',
      'nav.adminPanel': 'অ্যাডমিন প্যানেল',
      'nav.about': 'সম্পর্কে',

      // Header
      'header.title': 'রুয়েট স্টুডেন্ট ইন্টেলিজেন্স ড্যাশবোর্ড',

      // Sidebar
      'sidebar.navigation': 'নেভিগেশন',
      'sidebar.management': 'ব্যবস্থাপনা',
      'sidebar.footer': '© ২০২৫ রুয়েট এসআইডি',

      // Common
      'common.loading': 'লোড হচ্ছে...',
      'common.error': 'ত্রুটি',
      'common.success': 'সফল',
      'common.cancel': 'বাতিল',
      'common.save': 'সংরক্ষণ',
      'common.delete': 'মুছে ফেলুন',
      'common.edit': 'সম্পাদনা',
      'common.view': 'দেখুন',
      'common.search': 'অনুসন্ধান',
      'common.filter': 'ফিল্টার',
      'common.export': 'এক্সপোর্ট',
      'common.import': 'ইমপোর্ট',

      // Dashboard
      'dashboard.title': 'ড্যাশবোর্ড',
      'dashboard.welcome': 'রুয়েট স্টুডেন্ট ইন্টেলিজেন্স ড্যাশবোর্ডে স্বাগতম',
      'dashboard.stats': 'পরিসংখ্যান',
      'dashboard.totalStudents': 'মোট শিক্ষার্থী',
      'dashboard.verifiedStudents': 'যাচাইকৃত শিক্ষার্থী',
      'dashboard.pendingVerifications': 'অপেক্ষমান যাচাইকরণ',
      'dashboard.districts': 'জেলা',

      // Map Analytics
      'map.title': 'ম্যাপ এবং অ্যানালিটিক্স',
      'map.description': 'রুয়েট শিক্ষার্থীদের ভৌগলিক বিতরণ',
      'map.selectDistrict': 'জেলা নির্বাচন করুন',
      'map.studentsCount': 'শিক্ষার্থী সংখ্যা',

      // Verification
      'verification.title': 'শিক্ষার্থী যাচাইকরণ',
      'verification.description': 'ভর্তি PDF ব্যবহার করে শিক্ষার্থী তথ্য যাচাই করুন',
      'verification.uploadPdf': 'PDF আপলোড করুন',
      'verification.dragDrop': 'আপনার PDF এখানে টেনে আনুন, অথবা ক্লিক করে নির্বাচন করুন',
      'verification.processing': 'প্রক্রিয়াকরণ হচ্ছে...',
      'verification.verify': 'শিক্ষার্থী যাচাই করুন',
      'verification.name': 'নাম',
      'verification.roll': 'রোল নম্বর',
      'verification.registration': 'রেজিস্ট্রেশন নম্বর',
      'verification.hscRoll': 'এইচএসসি রোল',
      'verification.hscReg': 'এইচএসসি রেজিস্ট্রেশন',
      'verification.board': 'বোর্ড',
      'verification.district': 'জেলা',
      'verification.verified': 'যাচাইকৃত',
      'verification.notVerified': 'যাচাইকৃত নয়',

      // Admin Panel
      'admin.title': 'অ্যাডমিন প্যানেল',
      'admin.description': 'শিক্ষার্থী তথ্য এবং যাচাইকরণ পরিচালনা করুন',
      'admin.students': 'শিক্ষার্থী',
      'admin.verifications': 'যাচাইকরণ',
      'admin.settings': 'সেটিংস',

      // About
      'about.title': 'সম্পর্কে',
      'about.description': 'রুয়েট স্টুডেন্ট ইন্টেলিজেন্স ড্যাশবোর্ড সম্পর্কে আরও জানুন',

      // Theme
      'theme.light': 'লাইট',
      'theme.dark': 'ডার্ক',
      'theme.toggle': 'থিম টগল করুন',

      // Language
      'language.english': 'English',
      'language.bangla': 'বাংলা',
      'language.select': 'ভাষা নির্বাচন করুন',
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,

    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n;