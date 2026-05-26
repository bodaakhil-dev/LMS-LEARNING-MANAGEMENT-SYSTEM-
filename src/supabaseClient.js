import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if credentials are placeholder or default
const isMockMode = 
  !supabaseUrl || 
  !supabaseAnonKey || 
  supabaseUrl.includes('your-supabase-project') || 
  supabaseAnonKey.includes('your-supabase-anon-key');

let supabaseInstance;

if (isMockMode) {
  console.warn(
    'Supabase environment variables are missing or default. Falling back to Mock Storage client for local testing.'
  );

  // Define initial mock data
  const defaultUsers = [
    {
      id: 'mock-admin-uuid-1111',
      full_name: 'Admin User',
      email: 'admin@lms.com',
      role: 'admin',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      last_login: new Date().toISOString(),
      profile_image: null,
      status: 'active'
    },
    {
      id: 'mock-teacher-uuid-2222',
      full_name: 'Sarah Jenkins',
      email: 'teacher@lms.com',
      role: 'teacher',
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      last_login: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      profile_image: null,
      status: 'active'
    },
    {
      id: 'mock-student-uuid-3333',
      full_name: 'Alex Rivers',
      email: 'student@lms.com',
      role: 'student',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      last_login: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      profile_image: null,
      status: 'active'
    },
    {
      id: 'mock-student-uuid-4444',
      full_name: 'Emily Watson',
      email: 'emily@lms.com',
      role: 'student',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      last_login: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
      profile_image: null,
      status: 'active'
    },
    {
      id: 'mock-student-uuid-5555',
      full_name: 'Ryan Gosling',
      email: 'ryan@lms.com',
      role: 'student',
      created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      last_login: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      profile_image: null,
      status: 'active'
    },
    {
      id: 'mock-parent-uuid-6666',
      full_name: 'Robert Rivers',
      email: 'parent@lms.com',
      role: 'parent',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      last_login: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      profile_image: null,
      status: 'active'
    }
  ];

  const defaultActivities = [
    {
      activity_id: 'act-1',
      user_id: 'mock-admin-uuid-1111',
      login_time: new Date(Date.now() - 3600 * 1000).toISOString(),
      logout_time: null,
      ip_address: '192.168.1.5',
      device_info: 'Chrome / Windows',
      status: 'success'
    },
    {
      activity_id: 'act-2',
      user_id: 'mock-teacher-uuid-2222',
      login_time: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      logout_time: new Date(Date.now() - 22 * 3600 * 1000).toISOString(),
      ip_address: '192.168.1.12',
      device_info: 'Safari / macOS',
      status: 'success'
    },
    {
      activity_id: 'act-3',
      user_id: 'mock-student-uuid-3333',
      login_time: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      logout_time: null,
      ip_address: '172.16.0.4',
      device_info: 'Firefox / Linux',
      status: 'success'
    }
  ];

  const defaultCourses = [
    {
      id: 'mock-course-c1',
      title: 'CS 301: Advanced Database Design',
      code: 'DB-ADV',
      teacher_id: 'mock-teacher-uuid-2222',
      center_id: 'mock-center-1',
      category: 'Computer Science',
      thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=400&q=80',
      fee: 2999.00,
      duration: '3 Months',
      status: 'active',
      created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'mock-course-c2',
      title: 'CS 404: Modern Web Application Security',
      code: 'SEC-WEB',
      teacher_id: 'mock-teacher-uuid-2222',
      center_id: 'mock-center-2',
      category: 'Cybersecurity',
      thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=400&q=80',
      fee: 3999.00,
      duration: '6 Months',
      status: 'active',
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'mock-course-c3',
      title: 'AI 101: Introduction to Machine Learning',
      code: 'ML-INTRO',
      teacher_id: 'mock-teacher-uuid-2222',
      center_id: 'mock-center-2',
      category: 'Artificial Intelligence',
      thumbnail: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=400&q=80',
      fee: 4999.00,
      duration: '6 Months',
      status: 'active',
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const defaultEnrollments = [
    { id: 'mock-enroll-1', student_id: 'mock-student-uuid-3333', course_id: 'mock-course-c1', cohort_id: 'mock-cohort-1', enrolled_at: new Date().toISOString(), status: 'active' },
    { id: 'mock-enroll-2', student_id: 'mock-student-uuid-3333', course_id: 'mock-course-c2', cohort_id: 'mock-cohort-2', enrolled_at: new Date().toISOString(), status: 'active' },
    { id: 'mock-enroll-3', student_id: 'mock-student-uuid-3333', course_id: 'mock-course-c3', cohort_id: null, enrolled_at: new Date().toISOString(), status: 'active' }
  ];

  const defaultAssignments = [
    {
      id: 'mock-assign-1',
      course_id: 'mock-course-c1',
      teacher_id: 'mock-teacher-uuid-2222',
      title: 'Assignment 1: Relational Algebra Queries',
      description: 'Solve the 10 SQL relational algebraic problems listed in the attached file.',
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      max_marks: 100,
      file_url: 'https://mockstorage.local/lms-files/assignments/relational_algebra.pdf',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'mock-assign-2',
      course_id: 'mock-course-c2',
      teacher_id: 'mock-teacher-uuid-2222',
      title: 'Assignment 1: OWASP Top 10 Analysis',
      description: 'Analyze the vulnerable application and identify at least 3 critical vulnerabilities.',
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      max_marks: 50,
      file_url: 'https://mockstorage.local/lms-files/assignments/web_security.pdf',
      created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const defaultSubmissions = [
    {
      id: 'mock-sub-1',
      assignment_id: 'mock-assign-2',
      student_id: 'mock-student-uuid-3333',
      file_url: 'https://mockstorage.local/lms-files/submissions/owasp_report.pdf',
      submitted_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'submitted'
    }
  ];

  const defaultQuizzes = [
    {
      id: 'mock-quiz-q1',
      course_id: 'mock-course-c1',
      teacher_id: 'mock-teacher-uuid-2222',
      title: 'Relational Algebra Fundamentals',
      description: 'Quick assessment covering Selection, Projection, Joins, and set operators.',
      time_limit_minutes: 10,
      max_marks: 10,
      is_published: true,
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'mock-quiz-q2',
      course_id: 'mock-course-c2',
      teacher_id: 'mock-teacher-uuid-2222',
      title: 'OWASP Top 10 Core Concepts',
      description: 'Identify common web security vulnerabilities and their mitigations.',
      time_limit_minutes: 15,
      max_marks: 10,
      is_published: true,
      deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const defaultQuizQuestions = [
    {
      id: 'mock-qq-1',
      quiz_id: 'mock-quiz-q1',
      question_text: 'Which operation is used to filter rows in relational algebra?',
      options: ['Projection (π)', 'Selection (σ)', 'Join (⋈)', 'Union (∪)'],
      correct_answer: 1,
      marks: 5,
      sort_order: 1
    },
    {
      id: 'mock-qq-2',
      quiz_id: 'mock-quiz-q1',
      question_text: 'Which set operator requires both relations to be union-compatible?',
      options: ['Cartesian Product', 'Difference (-)', 'Intersection (∩) and Union (∪)', 'Division (÷)'],
      correct_answer: 2,
      marks: 5,
      sort_order: 2
    },
    {
      id: 'mock-qq-3',
      quiz_id: 'mock-quiz-q2',
      question_text: 'Which vulnerability class involves executing arbitrary SQL queries via untrusted inputs?',
      options: ['Cross-Site Scripting (XSS)', 'SQL Injection (SQLi)', 'Broken Object Level Authorization (BOLA)', 'Security Misconfiguration'],
      correct_answer: 1,
      marks: 5,
      sort_order: 1
    },
    {
      id: 'mock-qq-4',
      quiz_id: 'mock-quiz-q2',
      question_text: 'What is the primary defense against SQL Injection?',
      options: ['Web Application Firewall', 'Parameterized Queries / Prepared Statements', 'Using HTTPS', 'Encrypting the Database'],
      correct_answer: 1,
      marks: 5,
      sort_order: 2
    }
  ];

  const defaultAttendance = [
    { id: 'mock-att-1', course_id: 'mock-course-c1', student_id: 'mock-student-uuid-3333', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'present', marked_by: 'mock-teacher-uuid-2222', created_at: new Date().toISOString() },
    { id: 'mock-att-2', course_id: 'mock-course-c1', student_id: 'mock-student-uuid-3333', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'present', marked_by: 'mock-teacher-uuid-2222', created_at: new Date().toISOString() },
    { id: 'mock-att-3', course_id: 'mock-course-c2', student_id: 'mock-student-uuid-3333', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'present', marked_by: 'mock-teacher-uuid-2222', created_at: new Date().toISOString() },
    { id: 'mock-att-4', course_id: 'mock-course-c2', student_id: 'mock-student-uuid-3333', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'absent', marked_by: 'mock-teacher-uuid-2222', created_at: new Date().toISOString() }
  ];

  const defaultMaterials = [
    {
      id: 'mock-mat-1',
      course_id: 'mock-course-c1',
      teacher_id: 'mock-teacher-uuid-2222',
      title: 'Relational Calculus Cheat Sheet',
      description: 'Quick reference sheet on tuple and domain relational calculus formulas and notation.',
      file_url: 'https://mockstorage.local/lms-files/materials/calculus_cheat_sheet.pdf',
      file_type: 'pdf',
      file_size: 2457600,
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'mock-mat-2',
      course_id: 'mock-course-c2',
      teacher_id: 'mock-teacher-uuid-2222',
      title: 'Vulnerable App Set Up Guide',
      description: 'Set of slides detailing how to deploy the Web security testing laboratory environment locally.',
      file_url: 'https://mockstorage.local/lms-files/materials/setup_slides.ppt',
      file_type: 'ppt',
      file_size: 5120000,
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const defaultPayments = [
    {
      id: 'mock-pay-1',
      student_id: 'mock-student-uuid-3333',
      course_id: 'mock-course-c1',
      amount: 2999.00,
      currency: 'INR',
      payment_method: 'UPI',
      gateway_order_id: 'order_DBADV_123',
      gateway_payment_id: 'pay_DBADV_123',
      status: 'completed',
      receipt_url: 'https://mockstorage.local/lms-files/receipts/db_adv_receipt.pdf',
      paid_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'mock-pay-2',
      student_id: 'mock-student-uuid-3333',
      course_id: 'mock-course-c2',
      amount: 3999.00,
      currency: 'INR',
      payment_method: 'Card',
      gateway_order_id: 'order_SECWEB_456',
      gateway_payment_id: 'pay_SECWEB_456',
      status: 'completed',
      receipt_url: 'https://mockstorage.local/lms-files/receipts/sec_web_receipt.pdf',
      paid_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const defaultNotifications = [
    {
      id: 'mock-notif-1',
      user_id: 'mock-student-uuid-3333',
      title: 'New Quiz Published',
      message: 'A new quiz "Relational Algebra Fundamentals" has been published in CS 301.',
      type: 'quiz',
      is_read: false,
      link: '/student',
      created_at: new Date(Date.now() - 3600 * 1000).toISOString()
    },
    {
      id: 'mock-notif-2',
      user_id: 'mock-student-uuid-3333',
      title: 'Fee Payment Success',
      message: 'Your fee payment of INR 3999.00 for course SEC-WEB was successful.',
      type: 'payment',
      is_read: true,
      link: '/student',
      created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
    }
  ];

  const defaultMessages = [
    {
      id: 'mock-msg-1',
      sender_id: 'mock-student-uuid-4444',
      receiver_id: 'mock-student-uuid-3333',
      message_text: 'Hey Alex! Have you finished the Database design assignment yet?',
      created_at: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
      is_read: true
    },
    {
      id: 'mock-msg-2',
      sender_id: 'mock-student-uuid-3333',
      receiver_id: 'mock-student-uuid-4444',
      message_text: 'Hey Emily! Not yet, struggling with the 3NF normalization part.',
      created_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
      is_read: true
    },
    {
      id: 'mock-msg-3',
      sender_id: 'mock-student-uuid-4444',
      receiver_id: 'mock-student-uuid-3333',
      message_text: "Ah same, it's quite tricky! Let's discuss it tomorrow.",
      created_at: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
      is_read: false
    }
  ];

  const defaultTrainingCenters = [
    {
      id: 'mock-center-1',
      name: 'Mumbai Campus Center',
      location: 'Mumbai Branch',
      contact_email: 'mumbai@lms.com',
      created_at: new Date().toISOString()
    },
    {
      id: 'mock-center-2',
      name: 'Online Cloud Branch',
      location: 'Virtual',
      contact_email: 'cloud@lms.com',
      created_at: new Date().toISOString()
    }
  ];

  const defaultCohorts = [
    {
      id: 'mock-cohort-1',
      course_id: 'mock-course-c1',
      center_id: 'mock-center-1',
      name: 'CS-301 Spring 2026 Cohort A',
      start_date: '2026-01-15',
      end_date: '2026-06-15',
      status: 'active',
      created_at: new Date().toISOString()
    },
    {
      id: 'mock-cohort-2',
      course_id: 'mock-course-c2',
      center_id: 'mock-center-2',
      name: 'CS-404 Winter 2026 Cohort B',
      start_date: '2026-02-01',
      end_date: '2026-05-30',
      status: 'active',
      created_at: new Date().toISOString()
    }
  ];

  const defaultParentStudentLinks = [
    {
      id: 'mock-pslink-1',
      parent_id: 'mock-parent-uuid-6666',
      student_id: 'mock-student-uuid-3333',
      relationship: 'Father',
      created_at: new Date().toISOString()
    }
  ];

  const defaultDiscussions = [
    {
      id: 'mock-disc-1',
      course_id: 'mock-course-c1',
      author_id: 'mock-student-uuid-3333',
      title: 'Tips for Project 1?',
      content: 'Hey guys, does anyone have tips on normalising the tables for Phase 2? I am getting stuck on transitive dependencies.',
      is_pinned: false,
      created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'mock-disc-2',
      course_id: 'mock-course-c1',
      author_id: 'mock-teacher-uuid-2222',
      title: '🚨 Midterm Examination Information',
      content: 'The midterm will cover everything up to Normalization. Please review the cheat sheets and quizzes.',
      is_pinned: true,
      created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
    }
  ];

  const defaultDiscussionReplies = [
    {
      id: 'mock-reply-1',
      discussion_id: 'mock-disc-1',
      author_id: 'mock-student-uuid-4444',
      content: 'Try listing all the functional dependencies first! That helped me isolate the transitive ones.',
      created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'mock-reply-2',
      discussion_id: 'mock-disc-1',
      author_id: 'mock-teacher-uuid-2222',
      content: 'Alex, I also uploaded a video tutorial on Normalization under Materials. Be sure to check that out!',
      created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
    }
  ];

  const defaultCertificates = [
    {
      id: 'mock-cert-1',
      student_id: 'mock-student-uuid-3333',
      course_id: 'mock-course-c1',
      certificate_number: 'LMS-2026-8947A',
      grade: 'A+',
      issued_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
    }
  ];

  // Helper to sync mock DB
  const getMockDB = () => {
    const currentDBVersion = 'v7';
    if (localStorage.getItem('lms_db_version') !== currentDBVersion) {
      localStorage.removeItem('lms_mock_users');
      localStorage.removeItem('lms_mock_activities');
      localStorage.removeItem('lms_mock_courses');
      localStorage.removeItem('lms_mock_enrollments');
      localStorage.removeItem('lms_mock_assignments');
      localStorage.removeItem('lms_mock_submissions');
      localStorage.removeItem('lms_mock_grades');
      localStorage.removeItem('lms_mock_quizzes');
      localStorage.removeItem('lms_mock_quiz_questions');
      localStorage.removeItem('lms_mock_quiz_attempts');
      localStorage.removeItem('lms_mock_attendance');
      localStorage.removeItem('lms_mock_materials');
      localStorage.removeItem('lms_mock_payments');
      localStorage.removeItem('lms_mock_notifications');
      localStorage.removeItem('lms_mock_messages');
      localStorage.removeItem('lms_mock_training_centers');
      localStorage.removeItem('lms_mock_cohorts');
      localStorage.removeItem('lms_mock_parent_student_links');
      localStorage.removeItem('lms_mock_discussions');
      localStorage.removeItem('lms_mock_discussion_replies');
      localStorage.removeItem('lms_mock_certificates');
      localStorage.setItem('lms_db_version', currentDBVersion);
    }

    if (!localStorage.getItem('lms_mock_users')) {
      localStorage.setItem('lms_mock_users', JSON.stringify(defaultUsers));
    }
    if (!localStorage.getItem('lms_mock_activities')) {
      localStorage.setItem('lms_mock_activities', JSON.stringify(defaultActivities));
    }
    if (!localStorage.getItem('lms_mock_courses')) {
      localStorage.setItem('lms_mock_courses', JSON.stringify(defaultCourses));
    }
    if (!localStorage.getItem('lms_mock_enrollments')) {
      localStorage.setItem('lms_mock_enrollments', JSON.stringify(defaultEnrollments));
    }
    if (!localStorage.getItem('lms_mock_assignments')) {
      localStorage.setItem('lms_mock_assignments', JSON.stringify(defaultAssignments));
    }
    if (!localStorage.getItem('lms_mock_submissions')) {
      localStorage.setItem('lms_mock_submissions', JSON.stringify(defaultSubmissions));
    }
    if (!localStorage.getItem('lms_mock_grades')) {
      localStorage.setItem('lms_mock_grades', JSON.stringify([]));
    }
    if (!localStorage.getItem('lms_mock_quizzes')) {
      localStorage.setItem('lms_mock_quizzes', JSON.stringify(defaultQuizzes));
    }
    if (!localStorage.getItem('lms_mock_quiz_questions')) {
      localStorage.setItem('lms_mock_quiz_questions', JSON.stringify(defaultQuizQuestions));
    }
    if (!localStorage.getItem('lms_mock_quiz_attempts')) {
      localStorage.setItem('lms_mock_quiz_attempts', JSON.stringify([]));
    }
    if (!localStorage.getItem('lms_mock_attendance')) {
      localStorage.setItem('lms_mock_attendance', JSON.stringify(defaultAttendance));
    }
    if (!localStorage.getItem('lms_mock_materials')) {
      localStorage.setItem('lms_mock_materials', JSON.stringify(defaultMaterials));
    }
    if (!localStorage.getItem('lms_mock_payments')) {
      localStorage.setItem('lms_mock_payments', JSON.stringify(defaultPayments));
    }
    if (!localStorage.getItem('lms_mock_notifications')) {
      localStorage.setItem('lms_mock_notifications', JSON.stringify(defaultNotifications));
    }
    if (!localStorage.getItem('lms_mock_messages')) {
      localStorage.setItem('lms_mock_messages', JSON.stringify(defaultMessages));
    }
    if (!localStorage.getItem('lms_mock_training_centers')) {
      localStorage.setItem('lms_mock_training_centers', JSON.stringify(defaultTrainingCenters));
    }
    if (!localStorage.getItem('lms_mock_cohorts')) {
      localStorage.setItem('lms_mock_cohorts', JSON.stringify(defaultCohorts));
    }
    if (!localStorage.getItem('lms_mock_parent_student_links')) {
      localStorage.setItem('lms_mock_parent_student_links', JSON.stringify(defaultParentStudentLinks));
    }
    if (!localStorage.getItem('lms_mock_discussions')) {
      localStorage.setItem('lms_mock_discussions', JSON.stringify(defaultDiscussions));
    }
    if (!localStorage.getItem('lms_mock_discussion_replies')) {
      localStorage.setItem('lms_mock_discussion_replies', JSON.stringify(defaultDiscussionReplies));
    }
    if (!localStorage.getItem('lms_mock_certificates')) {
      localStorage.setItem('lms_mock_certificates', JSON.stringify(defaultCertificates));
    }
    return {
      users: JSON.parse(localStorage.getItem('lms_mock_users')),
      activities: JSON.parse(localStorage.getItem('lms_mock_activities')),
      session: JSON.parse(localStorage.getItem('lms_mock_session') || 'null')
    };
  };

  const saveMockDB = (data) => {
    if (data.users) localStorage.setItem('lms_mock_users', JSON.stringify(data.users));
    if (data.activities) localStorage.setItem('lms_mock_activities', JSON.stringify(data.activities));
    if (data.session !== undefined) localStorage.setItem('lms_mock_session', JSON.stringify(data.session));
  };

  // Initialize DB immediately
  getMockDB();

  // Mock listeners store
  const listeners = new Set();

  const notifyAuthStateChange = (event, session) => {
    listeners.forEach((callback) => callback(event, session));
  };

  // Mock Supabase Client implementation
  supabaseInstance = {
    auth: {
      async getSession() {
        const db = getMockDB();
        return { data: { session: db.session }, error: null };
      },
      async signInWithPassword({ email, password }) {
        const db = getMockDB();
        const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

        // For simplicity in testing, let passwords be 'password123'
        if (!user || password !== 'password123') {
          // Log failed activity
          if (user) {
            const failAct = {
              activity_id: `act-failed-${Date.now()}`,
              user_id: user.id,
              login_time: new Date().toISOString(),
              logout_time: null,
              ip_address: '127.0.0.1',
              device_info: 'Mock Client Browser',
              status: 'failed'
            };
            db.activities.unshift(failAct);
            saveMockDB(db);
          }
          return { data: { user: null, session: null }, error: new Error('Invalid login credentials') };
        }

        if (user.status === 'suspended') {
          return { data: { user: null, session: null }, error: new Error('Your account is suspended. Contact admin.') };
        }

        const session = {
          access_token: `mock-token-${user.id}-${Date.now()}`,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          user: {
            id: user.id,
            email: user.email,
            user_metadata: {
              full_name: user.full_name,
              role: user.role
            }
          }
        };

        db.session = session;
        user.last_login = new Date().toISOString();
        
        // Log success activity
        const successAct = {
          activity_id: `act-${Date.now()}`,
          user_id: user.id,
          login_time: new Date().toISOString(),
          logout_time: null,
          ip_address: '127.0.0.1',
          device_info: 'Mock Client Browser',
          status: 'success'
        };
        db.activities.unshift(successAct);
        
        saveMockDB(db);
        notifyAuthStateChange('SIGNED_IN', session);

        return { data: { user: session.user, session }, error: null };
      },
      async signUp({ email, password, options }) {
        const db = getMockDB();
        const exists = db.users.some((u) => u.email.toLowerCase() === email.toLowerCase());
        if (exists) {
          return { data: { user: null }, error: new Error('User already exists') };
        }

        const newUser = {
          id: `mock-user-uuid-${Date.now()}`,
          full_name: options?.data?.full_name || 'LMS User',
          email: email.toLowerCase(),
          role: options?.data?.role || 'student',
          created_at: new Date().toISOString(),
          last_login: null,
          profile_image: null,
          status: 'active'
        };

        db.users.push(newUser);
        saveMockDB(db);

        // Sign in automatically after sign up
        const session = {
          access_token: `mock-token-${newUser.id}-${Date.now()}`,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          user: {
            id: newUser.id,
            email: newUser.email,
            user_metadata: {
              full_name: newUser.full_name,
              role: newUser.role
            }
          }
        };
        db.session = session;
        newUser.last_login = new Date().toISOString();

        const successAct = {
          activity_id: `act-${Date.now()}`,
          user_id: newUser.id,
          login_time: new Date().toISOString(),
          logout_time: null,
          ip_address: '127.0.0.1',
          device_info: 'Mock Client Browser',
          status: 'success'
        };
        db.activities.unshift(successAct);

        saveMockDB(db);
        notifyAuthStateChange('SIGNED_IN', session);

        return { data: { user: session.user, session }, error: null };
      },
      async signOut() {
        const db = getMockDB();
        if (db.session) {
          // Log logout time
          const activeAct = db.activities.find(
            (act) => act.user_id === db.session.user.id && !act.logout_time && act.status === 'success'
          );
          if (activeAct) {
            activeAct.logout_time = new Date().toISOString();
          }
        }
        db.session = null;
        saveMockDB(db);
        notifyAuthStateChange('SIGNED_OUT', null);
        return { error: null };
      },
      onAuthStateChange(callback) {
        listeners.add(callback);
        // Fire initial event with current session
        const db = getMockDB();
        setTimeout(() => callback(db.session ? 'SIGNED_IN' : 'SIGNED_OUT', db.session), 0);
        return {
          data: {
            subscription: {
              unsubscribe() {
                listeners.delete(callback);
              }
            }
          }
        };
      },
      async resetPasswordForEmail(email, options) {
        // Just mock success
        return { data: {}, error: null };
      },
      async updateCurrentUser({ password }) {
        // Just mock success
        return { data: {}, error: null };
      }
    },
    from(table) {
      return {
        select(columns = '*') {
          let data = [];
          if (table === 'users') {
            data = [...getMockDB().users];
          } else if (table === 'login_activity') {
            data = [...getMockDB().activities];
          } else {
            data = JSON.parse(localStorage.getItem(`lms_mock_${table}`) || '[]');
          }

          // Mock joins resolution
          if (table === 'enrollments') {
            const users = JSON.parse(localStorage.getItem('lms_mock_users') || '[]');
            const courses = JSON.parse(localStorage.getItem('lms_mock_courses') || '[]');
            const cohorts = JSON.parse(localStorage.getItem('lms_mock_cohorts') || '[]');
            const centers = JSON.parse(localStorage.getItem('lms_mock_training_centers') || '[]');
            data = data.map(item => {
              const ch = cohorts.find(c => c.id === item.cohort_id) || null;
              const cohortWithCenter = ch ? {
                ...ch,
                center: centers.find(cnt => cnt.id === ch.center_id) || null
              } : null;
              return {
                ...item,
                student: users.find(u => u.id === item.student_id),
                course: courses.find(c => c.id === item.course_id),
                cohort: cohortWithCenter
              };
            });
          } else if (table === 'submissions') {
            const users = JSON.parse(localStorage.getItem('lms_mock_users') || '[]');
            const assignments = JSON.parse(localStorage.getItem('lms_mock_assignments') || '[]');
            data = data.map(item => ({
              ...item,
              student: users.find(u => u.id === item.student_id),
              assignment: assignments.find(a => a.id === item.assignment_id)
            }));
          } else if (table === 'assignments') {
            const courses = JSON.parse(localStorage.getItem('lms_mock_courses') || '[]');
            data = data.map(item => ({
              ...item,
              course: courses.find(c => c.id === item.course_id)
            }));
          } else if (table === 'grades') {
            const submissions = JSON.parse(localStorage.getItem('lms_mock_submissions') || '[]');
            data = data.map(item => ({
              ...item,
              submission: submissions.find(s => s.id === item.submission_id)
            }));
          } else if (table === 'courses') {
            const users = JSON.parse(localStorage.getItem('lms_mock_users') || '[]');
            const centers = JSON.parse(localStorage.getItem('lms_mock_training_centers') || '[]');
            data = data.map(item => ({
              ...item,
              teacher: users.find(u => u.id === item.teacher_id),
              center: centers.find(cn => cn.id === item.center_id) || null
            }));
          } else if (table === 'cohorts') {
            const courses = JSON.parse(localStorage.getItem('lms_mock_courses') || '[]');
            const centers = JSON.parse(localStorage.getItem('lms_mock_training_centers') || '[]');
            data = data.map(item => ({
              ...item,
              course: courses.find(c => c.id === item.course_id),
              center: centers.find(cn => cn.id === item.center_id) || null
            }));
          } else if (table === 'quizzes') {
            const courses = JSON.parse(localStorage.getItem('lms_mock_courses') || '[]');
            data = data.map(item => ({
              ...item,
              course: courses.find(c => c.id === item.course_id)
            }));
          } else if (table === 'quiz_attempts') {
            const users = JSON.parse(localStorage.getItem('lms_mock_users') || '[]');
            const quizzes = JSON.parse(localStorage.getItem('lms_mock_quizzes') || '[]');
            data = data.map(item => ({
              ...item,
              student: users.find(u => u.id === item.student_id),
              quiz: quizzes.find(q => q.id === item.quiz_id)
            }));
          } else if (table === 'attendance') {
            const users = JSON.parse(localStorage.getItem('lms_mock_users') || '[]');
            const courses = JSON.parse(localStorage.getItem('lms_mock_courses') || '[]');
            data = data.map(item => ({
              ...item,
              student: users.find(u => u.id === item.student_id),
              course: courses.find(c => c.id === item.course_id)
            }));
          } else if (table === 'materials') {
            const courses = JSON.parse(localStorage.getItem('lms_mock_courses') || '[]');
            data = data.map(item => ({
              ...item,
              course: courses.find(c => c.id === item.course_id)
            }));
          } else if (table === 'payments') {
            const users = JSON.parse(localStorage.getItem('lms_mock_users') || '[]');
            const courses = JSON.parse(localStorage.getItem('lms_mock_courses') || '[]');
            data = data.map(item => ({
              ...item,
              student: users.find(u => u.id === item.student_id),
              course: courses.find(c => c.id === item.course_id)
            }));
          } else if (table === 'certificates') {
            const users = JSON.parse(localStorage.getItem('lms_mock_users') || '[]');
            const courses = JSON.parse(localStorage.getItem('lms_mock_courses') || '[]');
            data = data.map(item => ({
              ...item,
              student: users.find(u => u.id === item.student_id),
              course: courses.find(c => c.id === item.course_id)
            }));
          } else if (table === 'discussions') {
            const users = JSON.parse(localStorage.getItem('lms_mock_users') || '[]');
            const courses = JSON.parse(localStorage.getItem('lms_mock_courses') || '[]');
            data = data.map(item => ({
              ...item,
              author: users.find(u => u.id === item.author_id),
              course: courses.find(c => c.id === item.course_id)
            }));
          } else if (table === 'discussion_replies') {
            const users = JSON.parse(localStorage.getItem('lms_mock_users') || '[]');
            data = data.map(item => ({
              ...item,
              author: users.find(u => u.id === item.author_id)
            }));
          } else if (table === 'parent_student_links') {
            const users = JSON.parse(localStorage.getItem('lms_mock_users') || '[]');
            data = data.map(item => ({
              ...item,
              parent: users.find(u => u.id === item.parent_id),
              student: users.find(u => u.id === item.student_id)
            }));
          }

          const builder = {
            data,
            error: null,
            eq(field, value) {
              this.data = this.data.filter((item) => item[field] === value);
              return this;
            },
            in(field, values) {
              this.data = this.data.filter((item) => values.includes(item[field]));
              return this;
            },
            order(field, { ascending = false } = {}) {
              this.data = [...this.data].sort((a, b) => {
                const valA = a[field] || '';
                const valB = b[field] || '';
                if (valA < valB) return ascending ? -1 : 1;
                if (valA > valB) return ascending ? 1 : -1;
                return 0;
              });
              return this;
            },
            async single() {
              if (this.data.length === 0) {
                return { data: null, error: new Error('No rows found') };
              }
              return { data: this.data[0], error: null };
            },
            then(onfulfilled) {
              return Promise.resolve({ data: this.data, error: this.error }).then(onfulfilled);
            }
          };
          return builder;
        },
        insert(records) {
          const items = Array.isArray(records) ? records : [records];
          
          if (table === 'login_activity') {
            const db = getMockDB();
            items.forEach((item) => {
              db.activities.unshift({
                activity_id: item.activity_id || `act-${Date.now()}-${Math.random()}`,
                login_time: new Date().toISOString(),
                logout_time: null,
                ip_address: '127.0.0.1',
                device_info: 'Mock Client Browser',
                status: 'success',
                ...item
              });
            });
            saveMockDB(db);
          } else if (table === 'users') {
            const db = getMockDB();
            items.forEach((item) => {
              db.users.push({
                id: item.id || `mock-user-uuid-${Date.now()}-${Math.random()}`,
                created_at: new Date().toISOString(),
                status: 'active',
                ...item
              });
            });
            saveMockDB(db);
          } else {
            const current = JSON.parse(localStorage.getItem(`lms_mock_${table}`) || '[]');
            items.forEach((item) => {
              current.push({
                id: item.id || `mock-${table}-uuid-${Date.now()}-${Math.random()}`,
                created_at: new Date().toISOString(),
                ...item
              });
            });
            localStorage.setItem(`lms_mock_${table}`, JSON.stringify(current));
          }

          return {
            select() { return this; },
            then(onfulfilled) {
              return Promise.resolve({ data: items, error: null }).then(onfulfilled);
            }
          };
        },
        update(updates) {
          const builder = {
            table,
            updates,
            filters: [],
            eq(field, value) {
              this.filters.push({ field, value });
              return this;
            },
            then(onfulfilled) {
              let updatedCount = 0;
              if (this.table === 'users') {
                const db = getMockDB();
                db.users = db.users.map((user) => {
                  let match = true;
                  this.filters.forEach((filter) => {
                    if (user[filter.field] !== filter.value) match = false;
                  });
                  if (match) {
                    updatedCount++;
                    return { ...user, ...this.updates };
                  }
                  return user;
                });
                saveMockDB(db);
              } else {
                let current = JSON.parse(localStorage.getItem(`lms_mock_${this.table}`) || '[]');
                current = current.map((item) => {
                  let match = true;
                  this.filters.forEach((filter) => {
                    if (item[filter.field] !== filter.value) match = false;
                  });
                  if (match) {
                    updatedCount++;
                    return { ...item, ...this.updates };
                  }
                  return item;
                });
                localStorage.setItem(`lms_mock_${this.table}`, JSON.stringify(current));
              }
              return Promise.resolve({ data: { count: updatedCount }, error: null }).then(onfulfilled);
            }
          };
          return builder;
        },
        delete() {
          const builder = {
            table,
            filters: [],
            eq(field, value) {
              this.filters.push({ field, value });
              return this;
            },
            then(onfulfilled) {
              let deletedCount = 0;
              if (this.table === 'users') {
                const db = getMockDB();
                const initialLen = db.users.length;
                db.users = db.users.filter((user) => {
                  let match = true;
                  this.filters.forEach((filter) => {
                    if (user[filter.field] !== filter.value) match = false;
                  });
                  return !match;
                });
                deletedCount = initialLen - db.users.length;
                saveMockDB(db);
              } else {
                let current = JSON.parse(localStorage.getItem(`lms_mock_${this.table}`) || '[]');
                const initialLen = current.length;
                current = current.filter((item) => {
                  let match = true;
                  this.filters.forEach((filter) => {
                    if (item[filter.field] !== filter.value) match = false;
                  });
                  return !match;
                });
                deletedCount = initialLen - current.length;
                localStorage.setItem(`lms_mock_${this.table}`, JSON.stringify(current));
              }
              return Promise.resolve({ data: { count: deletedCount }, error: null }).then(onfulfilled);
            }
          };
          return builder;
        }
      };
    },
    storage: {
      from(bucket) {
        return {
          async upload(path, file) {
            const url = `https://mockstorage.local/${bucket}/${path}`;
            return { data: { path, url }, error: null };
          },
          async download(path) {
            return { data: new Blob(['mock file content']), error: null };
          },
          getPublicUrl(path) {
            return { data: { publicUrl: `https://mockstorage.local/${bucket}/${path}` } };
          }
        };
      }
    }
  };
} else {
  // Use official Supabase client
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseInstance;
