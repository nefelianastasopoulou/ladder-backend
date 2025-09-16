export interface Translations {
  // Common
  cancel: string;
  ok: string;
  save: string;
  delete: string;
  copyEmail: string;
  copied: string;
  edit: string;
  back: string;
  next: string;
  done: string;
  loading: string;
  error: string;
  success: string;
  
  // Settings
  settings: string;
  account: string;
  personalInformation: string;
  privacy: string;
  appPreferences: string;
  supportHelp: string;
  dataManagement: string;
  about: string;
  
  // Account settings
  changeEmail: string;
  changePassword: string;
  updateEmailDescription: string;
  updatePasswordDescription: string;
  logout: string;
  deleteAccount: string;
  signOutDescription: string;
  deleteAccountDescription: string;
  
  // Privacy settings
  communityPostsOnProfile: string;
  communityPostsDescription: string;
  communityPostsModalDescription: string;
  showActiveStatus: string;
  showActiveStatusDescription: string;
  
  // Privacy options
  displayForEveryone: string;
  displayOnlyForConnections: string;
  doNotDisplayAtAll: string;
  
  // Notifications
  emailNotifications: string;
  emailNotificationsDescription: string;
  pushNotifications: string;
  pushNotificationsDescription: string;
  
  // App preferences
  language: string;
  
  // Support & Help
  helpCenter: string;
  helpCenterDescription: string;
  contactSupport: string;
  contactSupportDescription: string;
  readTermsDescription: string;
  learnDataProtectionDescription: string;
  appVersionDescription: string;
  
  // Contact support options
  emailSupport: string;
  liveChat: string;
  
  // Data Management
  exportData: string;
  exportDataDescription: string;
  clearCache: string;
  clearCacheDescription: string;
  syncData: string;
  syncDataDescription: string;
  
  // About
  aboutLadder: string;
  aboutLadderDescription: string;
  
  // Modals
  logoutConfirmation: string;
  logoutConfirmationMessage: string;
  deleteAccountConfirmation: string;
  deleteAccountConfirmationMessage: string;
  accountDeleted: string;
  accountDeletedMessage: string;
  helpCenterInfo: string;
  helpCenterInfoMessage: string;
  emailSupportInfo: string;
  emailSupportInfoMessage: string;
  liveChatInfo: string;
  liveChatInfoMessage: string;
  exportDataInfo: string;
  exportDataInfoMessage: string;
  exportDataSuccessMessage: string;
  exportDataError: string;
  exportDataErrorMessage: string;
  cacheCleared: string;
  cacheClearedMessage: string;
  cacheClearError: string;
  cacheClearErrorMessage: string;
  syncDataInfo: string;
  syncDataInfoMessage: string;
  
  // Version info
  version: string;
  copyright: string;
  
  // Login & Signup
  login: string;
  signup: string;
  email: string;
  emailSignup: string;
  password: string;
  passwordSignup: string;
  confirmPassword: string;
  username: string;
  fullName: string;
  forgotPassword: string;
  dontHaveAccount: string;
  alreadyHaveAccount: string;
  signIn: string;
  createAccount: string;
  agreeToTerms: string;
  termsAndPrivacy: string;
  termsAndPrivacyAgreement: string;
  iAgreeToThe: string;
  termsOfService: string;
  and: string;
  privacyPolicy: string;
  welcomeToLadder: string;
  connectGrowFind: string;
  joinLadderStartJourney: string;
  
  // Navigation
  home: string;
  profile: string;
  community: string;
  messages: string;
  
  // Profile
  editProfile: string;
  bio: string;
  website: string;
  saveChanges: string;
  profileUpdated: string;
  profileUpdatedMessage: string;
  
  // Change Email
  currentPassword: string;
  newEmail: string;
  confirmNewEmail: string;
  emailChangeRequested: string;
  emailChangeRequestedMessage: string;
  verificationEmailSent: string;
  verificationEmailSentMessage: string;
  enterVerificationCode: string;
  verifyEmailChange: string;
  emailChangedSuccessfully: string;
  emailChangedSuccessfullyMessage: string;
  invalidVerificationCode: string;
  invalidVerificationCodeMessage: string;
  
  // Change Password
  newPassword: string;
  confirmNewPassword: string;
  passwordChangedSuccessfully: string;
  passwordChangedSuccessfullyMessage: string;
  passwordsDoNotMatch: string;
  passwordsDoNotMatchMessage: string;
  currentPasswordIncorrect: string;
  currentPasswordIncorrectMessage: string;
  
  // Post Opportunity
  postOpportunity: string;
  title: string;
  company: string;
  description: string;
  requirements: string;
  benefits: string;
  salary: string;
  employmentType: string;
  partTime: string;
  contract: string;
  internship: string;
  hybrid: string;
  onSite: string;
  post: string;
  opportunityPosted: string;
  opportunityPostedMessage: string;
  
  // Common validation
  required: string;
  invalidEmail: string;
  passwordTooShort: string;
  passwordsMustMatch: string;
  usernameRequired: string;
  emailRequired: string;
  passwordRequired: string;
  
  // Home screen
  welcome: string;
  findYourNextOpportunity: string;
  recentOpportunities: string;
  noOpportunitiesFound: string;
  loadMore: string;
  opportunityType: string;
  
  // Profile screen
  memberSince: string;
  connections: string;
  posts: string;
  myCommunityPosts: string;
  opportunities: string;
  
  // Community/Search screen
  searchPlaceholder: string;
  filterBy: string;
  allCategories: string;
  technology: string;
  design: string;
  business: string;
  
  // Post opportunity screen
  postNewOpportunity: string;
  jobTitle: string;
  companyName: string;
  jobLocation: string;
  jobDescription: string;
  salaryRange: string;
  workType: string;
  workLocation: string;
  submitOpportunity: string;
  opportunitySubmitted: string;
  opportunitySubmittedMessage: string;
  
  // Home screen categories and filters
  all: string;
  internships: string;
  hackathons: string;
  volunteering: string;
  scholarships: string;
  jobPositions: string;
  events: string;
  conferences: string;
  summerSchools: string;
  travelErasmus: string;
  clubsOrganizations: string;
  others: string;
  
  // Location filters
  remote: string;
  online: string;
  greece: string;
  europe: string;
  
  // Time filters
  thisWeek: string;
  thisMonth: string;
  next3Months: string;
  noDeadline: string;
  
  // Field filters
  healthcare: string;
  education: string;
  artsMedia: string;
  science: string;
  engineering: string;
  socialImpact: string;
  finance: string;
  marketing: string;
  other: string;
  
  // Duration filters
  oneTimeEvent: string;
  shortTerm: string;
  mediumTerm: string;
  longTerm: string;
  flexiblePartTime: string;
  fullTime: string;
  
  // Filter UI
  filters: string;
  location: string;
  deadline: string;
  field: string;
  duration: string;
  clearAll: string;
  applyFilters: string;
  
  // Search and results
  searchOpportunities: string;
  searchCommunity: string;
  noResultsFound: string;
  tryDifferentSearch: string;
  searching: string;
  searchResults: string;
  resultsFor: string;
  results: string;
  result: string;
  
  // Notifications
  notifications: string;
  allNotifications: string;
  followRequests: string;
  reminders: string;
  suggestedOpportunities: string;
  likes: string;
  comments: string;
  applicationUpdates: string;
  networkActivity: string;
  notificationOptions: string;
  markAsUnread: string;
  markAsRead: string;
  markAllAsRead: string;
  noNotifications: string;
  allCaughtUp: string;
  
  // Favourites
  favourites: string;
  savedOpportunities: string;
  noFavouritesYet: string;
  startExploring: string;
  loadingFavorites: string;
  
  // Profile
  followers: string;
  following: string;
  myApplications: string;
  myOpportunities: string;
  adminPanel: string;
  deleteUser: string;
  deleteUserConfirm: string;
  deleteUserSuccess: string;
  noPostsYet: string;
  postsWillAppearHere: string;
  noApplicationsYet: string;
  applicationsWillAppearHere: string;
  noOpportunitiesYet: string;
  opportunitiesWillAppearHere: string;
  loadingProfile: string;
  profileNotFound: string;
  retry: string;
  noBioYet: string;
  
  // Time formatting
  justNow: string;
  hourAgo: string;
  hoursAgo: string;
  yesterday: string;
  dayAgo: string;
  daysAgo: string;
  weekAgo: string;
  weeksAgo: string;
  monthAgo: string;
  monthsAgo: string;
  yearAgo: string;
  yearsAgo: string;

  // Community screen
  latestFromNetwork: string;
  beFirstToShare: string;
  chats: string;
  noChatsYet: string;
  startConversations: string;
  startConversationWithStudents: string;
}

export const translations: Record<string, Translations> = {
  en: {
    // Common
    cancel: 'Cancel',
    ok: 'OK',
    save: 'Save',
    delete: 'Delete',
    copyEmail: 'Copy Email',
    copied: 'Copied!',
    edit: 'Edit',
    back: 'Back',
    next: 'Next',
    done: 'Done',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    
    // Settings
    settings: 'Settings',
    account: 'Account',
    personalInformation: 'Personal Information',
    privacy: 'Privacy',
    appPreferences: 'App Preferences',
    supportHelp: 'Support & Help',
    dataManagement: 'Data Management',
    about: 'About',
    
    // Account settings
    changeEmail: 'Change email',
    changePassword: 'Change password',
    updateEmailDescription: 'Update your email address',
    updatePasswordDescription: 'Update your password',
    logout: 'Logout',
    deleteAccount: 'Delete Account',
    signOutDescription: 'Sign out of your account',
    deleteAccountDescription: 'Permanently delete your account',
    
    // Privacy settings
    communityPostsOnProfile: 'Community posts on profile',
    communityPostsDescription: 'Your community posts are always public in the forum. This setting only controls whether they appear on your profile page.',
    communityPostsModalDescription: 'Community posts are publicly visible in the community. This setting controls their visibility on your profile page.',
    showActiveStatus: 'Show active status',
    showActiveStatusDescription: 'Let others see when you\'re active in chats',
    
    // Privacy options
    displayForEveryone: 'Display for everyone',
    displayOnlyForConnections: 'Display only for connections',
    doNotDisplayAtAll: 'Do not display at all',
    
    // Notifications
    emailNotifications: 'Email notifications',
    emailNotificationsDescription: 'Receive notifications via email',
    pushNotifications: 'Push notifications',
    pushNotificationsDescription: 'Receive push notifications on your device',
    
    // App preferences
    language: 'Language',
    
    // Support & Help
    helpCenter: 'Help center',
    helpCenterDescription: 'Find answers to common questions and get support',
    contactSupport: 'Contact support',
    contactSupportDescription: 'Get help from our support team',
    readTermsDescription: 'Read our terms and conditions',
    learnDataProtectionDescription: 'Learn about data protection',
    appVersionDescription: 'App version and information',
    
    // Contact support options
    emailSupport: 'Email support',
    liveChat: 'Live chat',
    
    // Data Management
    exportData: 'Export data',
    exportDataDescription: 'Download your data in JSON format',
    clearCache: 'Clear cache',
    clearCacheDescription: 'This will free up storage space by clearing cached data',
    syncData: 'Sync data',
    syncDataDescription: 'Sync your data across all your devices',
    
    // About
    aboutLadder: 'About Ladder',
    aboutLadderDescription: `Ladder v1.0.0\n\nConnect, grow, and find your next opportunity.\n\n© ${new Date().getFullYear()} Ladder. All rights reserved.`,
    
    // Modals
    logoutConfirmation: 'Logout',
    logoutConfirmationMessage: 'Are you sure you want to logout?',
    deleteAccountConfirmation: 'Delete Account',
    deleteAccountConfirmationMessage: 'This action cannot be undone. All your data will be permanently deleted.',
    accountDeleted: 'Account Deleted',
    accountDeletedMessage: 'Your account has been deleted successfully.',
    helpCenterInfo: 'Help Center',
    helpCenterInfoMessage: 'Help center will open in a web browser.',
    emailSupportInfo: 'Email Support',
    emailSupportInfoMessage: 'Email support: careerladder.contact@gmail.com',
    liveChatInfo: 'Live Chat',
    liveChatInfoMessage: 'Live chat support will be available here.',
    exportDataInfo: 'Export Data',
    exportDataInfoMessage: 'Your data export will be prepared and sent to your email.',
    exportDataSuccessMessage: 'Your data has been exported successfully! You can save it to your device or share it.',
    exportDataError: 'Export Failed',
    exportDataErrorMessage: 'There was an error exporting your data. Please try again.',
    cacheCleared: 'Cache Cleared',
    cacheClearedMessage: 'Cache has been cleared successfully.',
    cacheClearError: 'Error',
    cacheClearErrorMessage: 'Failed to clear cache. Please try again.',
    syncDataInfo: 'Sync Data',
    syncDataInfoMessage: 'Data synchronization started. This may take a few moments.',
    
    // Version info
    version: 'Ladder v1.0.0',
    copyright: `© ${new Date().getFullYear()} Ladder. All rights reserved.`,
    
    // Login & Signup
    login: 'Login',
    signup: 'Sign Up',
    email: 'Email or username',
    emailSignup: 'Email',
    password: 'Password',
    passwordSignup: 'Create password',
    confirmPassword: 'Confirm password',
    username: 'Username',
    fullName: 'Full name',
    forgotPassword: 'Forgot Password?',
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: 'Already have an account?',
    signIn: 'Sign In',
    createAccount: 'Create Account',
    agreeToTerms: 'I agree to the Terms of Service and Privacy Policy',
    termsAndPrivacy: 'Terms and Privacy Policy Agreement',
    termsAndPrivacyAgreement: 'Terms and Privacy Policy Agreement',
    iAgreeToThe: 'I agree to the',
    termsOfService: 'Terms of Service',
    and: 'and',
    privacyPolicy: 'Privacy Policy',
    welcomeToLadder: 'Welcome to Ladder',
    connectGrowFind: '',
    joinLadderStartJourney: '',
    
    // Navigation
    home: 'Home',
    profile: 'Profile',
    community: 'Community',
    messages: 'Messages',
    
    // Profile
    editProfile: 'Edit Profile',
    bio: 'Bio',
    website: 'Website',
    saveChanges: 'Save Changes',
    profileUpdated: 'Profile Updated',
    profileUpdatedMessage: 'Your profile has been updated successfully!',
    
    // Change Email
    currentPassword: 'Current Password',
    newEmail: 'New Email',
    confirmNewEmail: 'Confirm New Email',
    emailChangeRequested: 'Email Change Requested',
    emailChangeRequestedMessage: 'Please enter your current password to continue.',
    verificationEmailSent: 'Verification Email Sent',
    verificationEmailSentMessage: 'A verification code has been sent to your new email address.',
    enterVerificationCode: 'Enter Verification Code',
    verifyEmailChange: 'Verify Email Change',
    emailChangedSuccessfully: 'Email Changed Successfully',
    emailChangedSuccessfullyMessage: 'Your email address has been updated successfully.',
    invalidVerificationCode: 'Invalid Verification Code',
    invalidVerificationCodeMessage: 'The verification code you entered is incorrect.',
    
    // Change Password
    newPassword: 'New Password',
    confirmNewPassword: 'Confirm New Password',
    passwordChangedSuccessfully: 'Password Changed Successfully',
    passwordChangedSuccessfullyMessage: 'Your password has been updated successfully.',
    passwordsDoNotMatch: 'Passwords Do Not Match',
    passwordsDoNotMatchMessage: 'The new password and confirmation do not match.',
    currentPasswordIncorrect: 'Current Password Incorrect',
    currentPasswordIncorrectMessage: 'The current password you entered is incorrect.',
    
    // Post Opportunity
    postOpportunity: 'Post Opportunity',
    title: 'Title',
    company: 'Company',
    description: 'Description',
    requirements: 'Requirements',
    benefits: 'Benefits',
    salary: 'Salary',
    employmentType: 'Employment Type',
    partTime: 'Part Time',
    contract: 'Contract',
    internship: 'Internship',
    hybrid: 'Hybrid',
    onSite: 'On Site',
    post: 'Post',
    opportunityPosted: 'Opportunity Posted',
    opportunityPostedMessage: 'Your opportunity has been posted successfully!',
    
    // Common validation
    required: 'This field is required',
    invalidEmail: 'Please enter a valid email address',
    passwordTooShort: 'Password must be at least 6 characters',
    passwordsMustMatch: 'Passwords must match',
    usernameRequired: 'Username is required',
    emailRequired: 'Email is required',
    passwordRequired: 'Password is required',
    
    // Home screen
    welcome: 'Welcome',
    findYourNextOpportunity: 'Find your next opportunity',
    recentOpportunities: 'Recent Opportunities',
    noOpportunitiesFound: 'No opportunities found',
    loadMore: 'Load More',
    opportunityType: 'Opportunity Type',
    
    // Profile screen
    memberSince: 'Member since',
    connections: 'Connections',
  posts: 'Posts',
  myCommunityPosts: 'My Posts',
  opportunities: 'Opportunities',
    
    // Community/Search screen
    searchPlaceholder: 'Search opportunities...',
    filterBy: 'Filter by',
    allCategories: 'All Categories',
    technology: 'Technology',
    design: 'Design',
    business: 'Business',
    
    // Post opportunity screen
    postNewOpportunity: 'Post New Opportunity',
    jobTitle: 'Job Title',
    companyName: 'Company Name',
    jobLocation: 'Job Location',
    jobDescription: 'Job Description',
    salaryRange: 'Salary Range',
    workType: 'Work Type',
    workLocation: 'Work Location',
    submitOpportunity: 'Submit Opportunity',
    opportunitySubmitted: 'Opportunity Submitted',
    opportunitySubmittedMessage: 'Your opportunity has been posted successfully!',
    
    // Home screen categories and filters
    all: 'All',
    internships: 'Internships',
    hackathons: 'Hackathons',
    volunteering: 'Volunteering',
    scholarships: 'Scholarships',
    jobPositions: 'Job Positions',
    events: 'Events',
    conferences: 'Conferences',
    summerSchools: 'Summer Schools',
    travelErasmus: 'Travel & Erasmus+',
    clubsOrganizations: 'Clubs & Organizations',
    others: 'Others',
    
    // Location filters
    remote: 'Remote',
    online: 'Online',
    greece: 'Greece',
    europe: 'Europe',
    
    // Time filters
    thisWeek: 'This week',
    thisMonth: 'This month',
    next3Months: 'Next 3 months',
    noDeadline: 'No deadline',
    
    // Field filters
    healthcare: 'Healthcare',
    education: 'Education',
    artsMedia: 'Arts & Media',
    science: 'Science',
    engineering: 'Engineering',
    socialImpact: 'Social Impact',
    finance: 'Finance',
    marketing: 'Marketing',
    other: 'Other',
    
    // Duration filters
    oneTimeEvent: 'One-time event',
    shortTerm: 'Short-term (1-4 weeks)',
    mediumTerm: 'Medium-term (1-3 months)',
    longTerm: 'Long-term (3+ months)',
    flexiblePartTime: 'Flexible/Part-time',
    fullTime: 'Full-time',
    
    // Filter UI
    filters: 'Filters',
    location: 'Location',
    deadline: 'Deadline',
    field: 'Field',
    duration: 'Duration',
    clearAll: 'Clear All',
    applyFilters: 'Apply Filters',
    
    // Search and results
    searchOpportunities: 'Search opportunities...',
    searchCommunity: 'Search...',
    noResultsFound: 'No results found',
    tryDifferentSearch: 'Try a different search term',
    searching: 'Searching...',
    searchResults: 'Search Results',
    resultsFor: 'results for',
    results: 'results',
    result: 'result',
    
    // Notifications
    notifications: 'Notifications',
    allNotifications: 'All',
    followRequests: 'Follow Requests',
    reminders: 'Reminders',
    suggestedOpportunities: 'Suggested Opportunities',
    likes: 'Likes',
    comments: 'Comments',
    applicationUpdates: 'Application Updates',
    networkActivity: 'Network Activity',
    notificationOptions: 'Notification Options',
    markAsUnread: 'Mark as unread',
    markAsRead: 'Mark as read',
    markAllAsRead: 'Mark all as read',
    noNotifications: 'No notifications',
    allCaughtUp: "You're all caught up! Check back later for new notifications.",
    
    // Favourites
    favourites: 'Favourites',
    savedOpportunities: 'saved opportunities',
    noFavouritesYet: 'No favourites yet',
    startExploring: 'Start exploring opportunities and save the ones you like!',
    loadingFavorites: 'Loading favorites...',
    
    // Profile
    followers: 'Followers',
    following: 'Following',
    myApplications: 'My Applications',
    myOpportunities: 'My Opportunities',
    adminPanel: 'Admin Panel',
    deleteUser: 'Delete',
    deleteUserConfirm: 'Are you sure you want to delete',
    deleteUserSuccess: 'User has been deleted.',
    noPostsYet: 'No posts yet',
    postsWillAppearHere: 'Your community posts will appear here',
    noApplicationsYet: 'No applications yet',
    applicationsWillAppearHere: 'Your applications will appear here',
    noOpportunitiesYet: 'No opportunities yet',
    opportunitiesWillAppearHere: 'Your opportunities will appear here',
    loadingProfile: 'Loading profile...',
    profileNotFound: 'Profile not found',
    retry: 'Retry',
    noBioYet: 'No bio yet',
    
    // Time formatting
    justNow: 'Just now',
    hourAgo: 'hour ago',
    hoursAgo: 'hours ago',
    yesterday: 'Yesterday',
    dayAgo: 'day ago',
    daysAgo: 'days ago',
    weekAgo: 'week ago',
    weeksAgo: 'weeks ago',
    monthAgo: 'month ago',
    monthsAgo: 'months ago',
    yearAgo: 'year ago',
    yearsAgo: 'years ago',

    // Community screen
    latestFromNetwork: 'Latest from your network',
    beFirstToShare: 'Be the first to share your experiences and connect with others!',
    chats: 'Chats',
    noChatsYet: 'No chats yet',
    startConversations: 'Start conversations...',
    startConversationWithStudents: 'Start conversations with other students and join group chats!',
  },
  el: {
    // Common
    cancel: 'Ακύρωση',
    ok: 'Εντάξει',
    save: 'Αποθήκευση',
    delete: 'Διαγραφή',
    copyEmail: 'Αντιγραφή Email',
    copied: 'Αντιγράφηκε!',
    edit: 'Επεξεργασία',
    back: 'Πίσω',
    next: 'Επόμενο',
    done: 'Τέλος',
    loading: 'Φόρτωση...',
    error: 'Σφάλμα',
    success: 'Επιτυχία',
    
    // Settings
    settings: 'Ρυθμίσεις',
    account: 'Λογαριασμός',
    personalInformation: 'Προσωπικά Στοιχεία',
    privacy: 'Απόρρητο',
    appPreferences: 'Προτιμήσεις Εφαρμογής',
    supportHelp: 'Υποστήριξη & Βοήθεια',
    dataManagement: 'Διαχείριση Δεδομένων',
    about: 'Σχετικά',
    
    // Account settings
    changeEmail: 'Αλλαγή email',
    changePassword: 'Αλλαγή κωδικού',
    updateEmailDescription: 'Αλλάξτε το email σας',
    updatePasswordDescription: 'Αλλάξτε τον κωδικό σας',
    logout: 'Αποσύνδεση',
    deleteAccount: 'Διαγραφή Λογαριασμού',
    signOutDescription: 'Αποσυνδεθείτε από τον λογαριασμό σας',
    deleteAccountDescription: 'Διαγράψτε οριστικά τον λογαριασμό σας',
    
    // Privacy settings
    communityPostsOnProfile: 'Εμφάνιση δημοσιεύσεων στο προφίλ',
    communityPostsDescription: 'Οι δημοσιεύσεις σας είναι πάντα δημόσιες στο φόρουμ. Αυτή η ρύθμιση ελέγχει μόνο αν εμφανίζονται στο προφίλ σας.',
    communityPostsModalDescription: 'Οι δημοσιεύσεις είναι δημόσια ορατές στην κοινότητα. Αυτή η ρύθμιση ελέγχει την ορατότητά τους στη σελίδα του προφίλ σας.',
    showActiveStatus: 'Εμφάνιση κατάστασης δραστηριότητας',
    showActiveStatusDescription: 'Επιτρέψτε σε άλλους να βλέπουν όταν είστε online',
    
    // Privacy options
    displayForEveryone: 'Για όλους',
    displayOnlyForConnections: 'Μόνο για συνδέσεις',
    doNotDisplayAtAll: 'Καθόλου',
    
    // Notifications
    emailNotifications: 'Email ειδοποιήσεις',
    emailNotificationsDescription: 'Ειδοποιήσεις μέσω email',
    pushNotifications: 'Push ειδοποιήσεις',
    pushNotificationsDescription: 'Ειδοποιήσεις στη συσκευή σας',
    
    // App preferences
    language: 'Γλώσσα',
    
    // Support & Help
    helpCenter: 'Βοήθεια',
    helpCenterDescription: 'Απαντήσεις σε κοινές ερωτήσεις και υποστήριξη',
    contactSupport: 'Επικοινωνία',
    contactSupportDescription: 'Βοήθεια από την ομάδα υποστήριξης',
    readTermsDescription: 'Διαβάστε τους όρους και τις προϋποθέσεις μας',
    learnDataProtectionDescription: 'Μάθετε για την προστασία δεδομένων',
    appVersionDescription: 'Έκδοση εφαρμογής και πληροφορίες',
    
    // Contact support options
    emailSupport: 'Email υποστήριξη',
    liveChat: 'Ζωντανή συνομιλία',
    
    // Data Management
    exportData: 'Εξαγωγή δεδομένων',
    exportDataDescription: 'Κατεβάστε τα δεδομένα σας',
    clearCache: 'Εκκαθάριση cache',
    clearCacheDescription: 'Ελευθερώστε χώρο αποθήκευσης',
    syncData: 'Συγχρονισμός',
    syncDataDescription: 'Συγχρονίστε τα δεδομένα σας',
    
    // About
    aboutLadder: 'Σχετικά με το Ladder',
    aboutLadderDescription: `Ladder v1.0.0\n\nΒρείτε την επόμενη ευκαιρία σας.\n\n© ${new Date().getFullYear()} Ladder. Όλα τα δικαιώματα διατηρούνται.`,
    
    // Modals
    logoutConfirmation: 'Αποσύνδεση',
    logoutConfirmationMessage: 'Θέλετε να αποσυνδεθείτε;',
    deleteAccountConfirmation: 'Διαγραφή Λογαριασμού',
    deleteAccountConfirmationMessage: 'Αυτή η ενέργεια δεν μπορεί να αναιρεθεί. Όλα τα δεδομένα σας θα διαγραφούν.',
    accountDeleted: 'Λογαριασμός Διαγράφηκε',
    accountDeletedMessage: 'Ο λογαριασμός σας διαγράφηκε επιτυχώς.',
    helpCenterInfo: 'Βοήθεια',
    helpCenterInfoMessage: 'Η βοήθεια θα ανοίξει σε έναν φυλλομετρητή.',
    emailSupportInfo: 'Email Υποστήριξη',
    emailSupportInfoMessage: 'Email: careerladder.contact@gmail.com',
    liveChatInfo: 'Ζωντανή Συνομιλία',
    liveChatInfoMessage: 'Η ζωντανή συνομιλία θα είναι διαθέσιμη εδώ.',
    exportDataInfo: 'Εξαγωγή Δεδομένων',
    exportDataInfoMessage: 'Τα δεδομένα σας θα προετοιμαστούν και θα σταλούν στο email σας.',
    exportDataSuccessMessage: 'Τα δεδομένα σας εξήχθησαν επιτυχώς! Μπορείτε να τα αποθηκεύσετε ή να τα μοιραστείτε.',
    exportDataError: 'Αποτυχία Εξαγωγής',
    exportDataErrorMessage: 'Υπήρξε σφάλμα κατά την εξαγωγή των δεδομένων σας. Παρακαλώ δοκιμάστε ξανά.',
    cacheCleared: 'Cache Εκκαθαρίστηκε',
    cacheClearedMessage: 'Το cache εκκαθαρίστηκε.',
    cacheClearError: 'Σφάλμα',
    cacheClearErrorMessage: 'Αποτυχία εκκαθάρισης cache. Δοκιμάστε ξανά.',
    syncDataInfo: 'Συγχρονισμός',
    syncDataInfoMessage: 'Ο συγχρονισμός ξεκίνησε. Αυτό μπορεί να πάρει λίγα λεπτά.',
    
    // Version info
    version: 'Ladder v1.0.0',
    copyright: `© ${new Date().getFullYear()} Ladder. Όλα τα δικαιώματα διατηρούνται.`,
    
    // Login & Signup
    login: 'Σύνδεση',
    signup: 'Εγγραφή',
    email: 'Email ή όνομα χρήστη',
    emailSignup: 'Email',
    password: 'Κωδικός',
    passwordSignup: 'Δημιουργία κωδικού',
    confirmPassword: 'Επιβεβαίωση κωδικού',
    username: 'Όνομα χρήστη',
    fullName: 'Ονοματεπώνυμο',
    forgotPassword: 'Ξεχάσατε τον κωδικό;',
    dontHaveAccount: 'Δεν έχετε λογαριασμό;',
    alreadyHaveAccount: 'Έχετε ήδη λογαριασμό;',
    signIn: 'Σύνδεση',
    createAccount: 'Δημιουργία Λογαριασμού',
    agreeToTerms: 'Συμφωνώ με τους Όρους Χρήσης και την Πολιτική Απορρήτου',
    termsAndPrivacy: 'Συμφωνία Όρων Χρήσης και Πολιτικής Απορρήτου',
    termsAndPrivacyAgreement: 'Συμφωνία Όρων Χρήσης και Πολιτικής Απορρήτου',
    iAgreeToThe: 'Συμφωνώ με τους',
    termsOfService: 'Όρους Χρήσης',
    and: 'και την',
    privacyPolicy: 'Πολιτική Απορρήτου',
    welcomeToLadder: 'Καλώς ήρθατε στο Ladder',
    connectGrowFind: '',
    joinLadderStartJourney: '',
    
    // Navigation
    home: 'Αρχική',
    profile: 'Προφίλ',
    community: 'Κοινότητα',
    messages: 'Μηνύματα',
    
    // Profile
    editProfile: 'Επεξεργασία Προφίλ',
    bio: 'Βιογραφικό',
    website: 'Ιστότοπος',
    saveChanges: 'Αποθήκευση Αλλαγών',
    profileUpdated: 'Προφίλ Ενημερώθηκε',
    profileUpdatedMessage: 'Το προφίλ σας ενημερώθηκε επιτυχώς!',
    
    // Change Email
    currentPassword: 'Τρέχων Κωδικός',
    newEmail: 'Νέο Email',
    confirmNewEmail: 'Επιβεβαίωση Νέου Email',
    emailChangeRequested: 'Αίτημα Αλλαγής Email',
    emailChangeRequestedMessage: 'Παρακαλώ εισάγετε τον τρέχοντα κωδικό σας για να συνεχίσετε.',
    verificationEmailSent: 'Email Επιβεβαίωσης Στάλθηκε',
    verificationEmailSentMessage: 'Ένας κωδικός επιβεβαίωσης στάλθηκε στη νέα διεύθυνση email σας.',
    enterVerificationCode: 'Εισάγετε Κωδικό Επιβεβαίωσης',
    verifyEmailChange: 'Επιβεβαίωση Αλλαγής Email',
    emailChangedSuccessfully: 'Email Άλλαξε Επιτυχώς',
    emailChangedSuccessfullyMessage: 'Η διεύθυνση email σας ενημερώθηκε επιτυχώς.',
    invalidVerificationCode: 'Μη Έγκυρος Κωδικός Επιβεβαίωσης',
    invalidVerificationCodeMessage: 'Ο κωδικός επιβεβαίωσης που εισάγατε είναι λανθασμένος.',
    
    // Change Password
    newPassword: 'Νέος Κωδικός',
    confirmNewPassword: 'Επιβεβαίωση Νέου Κωδικού',
    passwordChangedSuccessfully: 'Κωδικός Άλλαξε Επιτυχώς',
    passwordChangedSuccessfullyMessage: 'Ο κωδικός σας ενημερώθηκε επιτυχώς.',
    passwordsDoNotMatch: 'Οι Κωδικοί Δεν Ταιριάζουν',
    passwordsDoNotMatchMessage: 'Ο νέος κωδικός και η επιβεβαίωση δεν ταιριάζουν.',
    currentPasswordIncorrect: 'Τρέχων Κωδικός Λανθασμένος',
    currentPasswordIncorrectMessage: 'Ο τρέχων κωδικός που εισάγατε είναι λανθασμένος.',
    
    // Post Opportunity
    postOpportunity: 'Δημοσίευση Ευκαιρίας',
    title: 'Τίτλος',
    company: 'Εταιρεία',
    description: 'Περιγραφή',
    requirements: 'Απαιτήσεις',
    benefits: 'Οφέλη',
    salary: 'Μισθός',
    employmentType: 'Τύπος Απασχόλησης',
    partTime: 'Μερική Απασχόληση',
    contract: 'Συμβόλαιο',
    internship: 'Πρακτική',
    hybrid: 'Υβριδικά',
    onSite: 'Στο Γραφείο',
    post: 'Δημοσίευση',
    opportunityPosted: 'Ευκαιρία Δημοσιεύθηκε',
    opportunityPostedMessage: 'Η ευκαιρία σας δημοσιεύθηκε επιτυχώς!',
    
    // Common validation
    required: 'Αυτό το πεδίο είναι υποχρεωτικό',
    invalidEmail: 'Παρακαλώ εισάγετε μια έγκυρη διεύθυνση email',
    passwordTooShort: 'Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες',
    passwordsMustMatch: 'Οι κωδικοί πρέπει να ταιριάζουν',
    usernameRequired: 'Το όνομα χρήστη είναι υποχρεωτικό',
    emailRequired: 'Το email είναι υποχρεωτικό',
    passwordRequired: 'Ο κωδικός είναι υποχρεωτικός',
    
    // Home screen
    welcome: 'Καλώς ήρθες',
    findYourNextOpportunity: 'Βρείτε την επόμενη ευκαιρία σας',
    recentOpportunities: 'Πρόσφατες Ευκαιρίες',
    noOpportunitiesFound: 'Δεν βρέθηκαν ευκαιρίες',
    loadMore: 'Φόρτωση Περισσότερων',
    opportunityType: 'Τύπος Ευκαιρίας',
    
    // Profile screen
    memberSince: 'Μέλος από',
    connections: 'Συνδέσεις',
  posts: 'Δημοσιεύσεις',
  myCommunityPosts: 'Οι Δημοσιεύσεις Μου',
  opportunities: 'Ευκαιρίες',
    
    // Community/Search screen
    searchPlaceholder: 'Αναζήτηση ευκαιριών...',
    filterBy: 'Φίλτρο κατά',
    allCategories: 'Όλες οι Κατηγορίες',
    technology: 'Τεχνολογία',
    design: 'Σχεδιασμός',
    business: 'Επιχειρηματικότητα',
    
    // Post opportunity screen
    postNewOpportunity: 'Δημοσίευση Νέας Ευκαιρίας',
    jobTitle: 'Τίτλος Θέσης',
    companyName: 'Όνομα Εταιρείας',
    jobLocation: 'Τοποθεσία Θέσης',
    jobDescription: 'Περιγραφή Θέσης',
    salaryRange: 'Εύρος Μισθού',
    workType: 'Τύπος Εργασίας',
    workLocation: 'Τοποθεσία Εργασίας',
    submitOpportunity: 'Υποβολή Ευκαιρίας',
    opportunitySubmitted: 'Ευκαιρία Υποβλήθηκε',
    opportunitySubmittedMessage: 'Η ευκαιρία σας δημοσιεύθηκε επιτυχώς!',
    
    // Home screen categories and filters
    all: 'Όλα',
    internships: 'Πρακτικές',
    hackathons: 'Hackathons',
    volunteering: 'Εθελοντισμός',
    scholarships: 'Υποτροφίες',
    jobPositions: 'Θέσεις Εργασίας',
    events: 'Εκδηλώσεις',
    conferences: 'Συνέδρια',
    summerSchools: 'Θερινά Σχολεία',
    travelErasmus: 'Ταξίδια & Erasmus+',
    clubsOrganizations: 'Σύλλογοι & Οργανισμοί',
    others: 'Άλλα',
    
    // Location filters
    remote: 'Απομακρυσμένα',
    online: 'Online',
    greece: 'Ελλάδα',
    europe: 'Ευρώπη',
    
    // Time filters
    thisWeek: 'Αυτή την εβδομάδα',
    thisMonth: 'Αυτόν τον μήνα',
    next3Months: 'Επόμενους 3 μήνες',
    noDeadline: 'Χωρίς προθεσμία',
    
    // Field filters
    healthcare: 'Υγεία',
    education: 'Εκπαίδευση',
    artsMedia: 'Τέχνες & Μέσα',
    science: 'Επιστήμη',
    engineering: 'Μηχανική',
    socialImpact: 'Κοινωνική Επίδραση',
    finance: 'Οικονομικά',
    marketing: 'Μάρκετινγκ',
    other: 'Άλλο',
    
    // Duration filters
    oneTimeEvent: 'Μία φορά',
    shortTerm: 'Βραχυπρόθεσμα (1-4 εβδομάδες)',
    mediumTerm: 'Μεσοπρόθεσμα (1-3 μήνες)',
    longTerm: 'Μακροπρόθεσμα (3+ μήνες)',
    flexiblePartTime: 'Ευέλικτα/Μερικής απασχόλησης',
    fullTime: 'Πλήρης απασχόληση',
    
    // Filter UI
    filters: 'Φίλτρα',
    location: 'Τοποθεσία',
    deadline: 'Προθεσμία',
    field: 'Τομέας',
    duration: 'Διάρκεια',
    clearAll: 'Εκκαθάριση Όλων',
    applyFilters: 'Εφαρμογή Φίλτρων',
    
    // Search and results
    searchOpportunities: 'Αναζήτηση ευκαιριών...',
    searchCommunity: 'Αναζήτηση...',
    noResultsFound: 'Δεν βρέθηκαν αποτελέσματα',
    tryDifferentSearch: 'Δοκιμάστε διαφορετικό όρο αναζήτησης',
    searching: 'Αναζήτηση...',
    searchResults: 'Αποτελέσματα Αναζήτησης',
    resultsFor: 'αποτελέσματα για',
    results: 'αποτελέσματα',
    result: 'αποτέλεσμα',
    
    // Notifications
    notifications: 'Ειδοποιήσεις',
    allNotifications: 'Όλα',
    followRequests: 'Αιτήματα Ακολούθησης',
    reminders: 'Υπενθυμίσεις',
    suggestedOpportunities: 'Προτεινόμενες Ευκαιρίες',
    likes: 'Αγαπημένα',
    comments: 'Σχόλια',
    applicationUpdates: 'Ενημερώσεις Αιτήσεων',
    networkActivity: 'Δραστηριότητα Δικτύου',
    notificationOptions: 'Επιλογές Ειδοποιήσεων',
    markAsUnread: 'Σήμανση ως μη αναγνωσμένο',
    markAsRead: 'Σήμανση ως αναγνωσμένο',
    markAllAsRead: 'Σήμανση όλων ως αναγνωσμένα',
    noNotifications: 'Δεν υπάρχουν ειδοποιήσεις',
    allCaughtUp: 'Είστε ενημερωμένοι! Ελέγξτε αργότερα για νέες ειδοποιήσεις.',
    
    // Favourites
    favourites: 'Αγαπημένα',
    savedOpportunities: 'αποθηκευμένες ευκαιρίες',
    noFavouritesYet: 'Δεν υπάρχουν αγαπημένα ακόμα',
    startExploring: 'Ξεκινήστε να εξερευνάτε ευκαιρίες και αποθηκεύστε αυτές που σας αρέσουν!',
    loadingFavorites: 'Φόρτωση αγαπημένων...',
    
    // Profile
    followers: 'Ακόλουθοι',
    following: 'Ακολουθώ',
    myApplications: 'Οι Αιτήσεις Μου',
    myOpportunities: 'Οι Ευκαιρίες Μου',
    adminPanel: 'Πίνακας Διαχείρισης',
    deleteUser: 'Διαγραφή',
    deleteUserConfirm: 'Είστε σίγουροι ότι θέλετε να διαγράψετε',
    deleteUserSuccess: 'Ο χρήστης διαγράφηκε επιτυχώς.',
    noPostsYet: 'Δεν υπάρχουν δημοσιεύσεις ακόμα',
    postsWillAppearHere: 'Οι δημοσιεύσεις σας στην κοινότητα θα εμφανιστούν εδώ',
    noApplicationsYet: 'Δεν υπάρχουν αιτήσεις ακόμα',
    applicationsWillAppearHere: 'Οι αιτήσεις σας θα εμφανιστούν εδώ',
    noOpportunitiesYet: 'Δεν υπάρχουν ευκαιρίες ακόμα',
    opportunitiesWillAppearHere: 'Οι ευκαιρίες σας θα εμφανιστούν εδώ',
    loadingProfile: 'Φόρτωση προφίλ...',
    profileNotFound: 'Το προφίλ δεν βρέθηκε',
    retry: 'Επανάληψη',
    noBioYet: 'Δεν υπάρχει βιογραφικό ακόμα',
    
    // Time formatting
    justNow: 'Μόλις τώρα',
    hourAgo: 'ώρα πριν',
    hoursAgo: 'ώρες πριν',
    yesterday: 'Χθες',
    dayAgo: 'μέρα πριν',
    daysAgo: 'μέρες πριν',
    weekAgo: 'εβδομάδα πριν',
    weeksAgo: 'εβδομάδες πριν',
    monthAgo: 'μήνας πριν',
    monthsAgo: 'μήνες πριν',
    yearAgo: 'χρόνος πριν',
    yearsAgo: 'χρόνια πριν',

    // Community screen
    latestFromNetwork: 'Τελευταία από το δίκτυό σας',
    beFirstToShare: 'Γίνετε ο πρώτος που θα μοιραστεί τις εμπειρίες του και θα συνδεθεί με άλλους!',
    chats: 'Συνομιλίες',
    noChatsYet: 'Δεν υπάρχουν συνομιλίες ακόμα',
    startConversations: 'Ξεκινήστε συνομιλίες...',
    startConversationWithStudents: 'Ξεκινήστε συνομιλίες με άλλους φοιτητές και συμμετέχετε σε ομαδικές συνομιλίες!',
  },
};

export const getTranslation = (key: keyof Translations, language: string = 'en'): string => {
  return translations[language]?.[key] || translations.en?.[key] || key;
};
