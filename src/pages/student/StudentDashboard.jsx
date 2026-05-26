import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import {
  BookOpen, Award, Calendar, Flame, Play, CheckCircle, FileText,
  Clock, Sparkles, Video, Tv, Search, FileDown, ArrowRight, Trophy, MessageSquare,
  CreditCard, Users, Send
} from 'lucide-react';
import Modal from '../../components/Modal';
import FileUpload from '../../components/FileUpload';
import Alert from '../../components/Alert';
import LoadingSpinner from '../../components/LoadingSpinner';

const StudentDashboard = ({ activeTab }) => {
  const { profile } = useAuth();

  // ── State ──────────────────────────────────────────────────────────────────
  const [allCourses, setAllCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [payments, setPayments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  
  // Discussions & Forums State
  const [discussions, setDiscussions] = useState([]);
  const [discussionReplies, setDiscussionReplies] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [newForumTitle, setNewForumTitle] = useState('');
  const [newForumContent, setNewForumContent] = useState('');
  const [isForumModalOpen, setIsForumModalOpen] = useState(false);
  const [forumReplyInput, setForumReplyInput] = useState('');
  const [forumSelectedCourse, setForumSelectedCourse] = useState('all');

  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const [courseDetailView, setCourseDetailView] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const [liveClasses, setLiveClasses] = useState([]);
  const [recordedClasses, setRecordedClasses] = useState([]);
  const [courseSubTab, setCourseSubTab] = useState('curriculum');
  const [activeVideoUrl, setActiveVideoUrl] = useState(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [selectedCheckoutCourse, setSelectedCheckoutCourse] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submitFileUrl, setSubmitFileUrl] = useState('');

  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // ── Chat State ─────────────────────────────────────────────────────────────
  const [chatStudents, setChatStudents] = useState([]);
  const [activeChatStudent, setActiveChatStudent] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  // ── Data Loading ───────────────────────────────────────────────────────────
  const loadStudentData = async (isSilent = false) => {
    if (!profile) return;
    if (!isSilent) setLoading(true);
    try {
      const { data: allCoursesData, error: allCoursesError } = await supabase.from('courses').select('*');
      if (allCoursesError) throw allCoursesError;
      setAllCourses(allCoursesData || []);

      const { data: enrollData, error: enrollError } = await supabase
        .from('enrollments').select('*, course:courses(*)').eq('student_id', profile.id);
      if (enrollError) throw enrollError;

      let enrichedEnrollments = enrollData || [];
      const cohortIds = enrichedEnrollments.map(e => e.cohort_id).filter(Boolean);
      if (cohortIds.length > 0) {
        try {
          const { data: cohortsData } = await supabase
            .from('cohorts').select('*').in('id', cohortIds);
          
          if (cohortsData && cohortsData.length > 0) {
            const centerIds = cohortsData.map(ch => ch.center_id).filter(Boolean);
            let centersData = [];
            if (centerIds.length > 0) {
              const { data: cData } = await supabase
                .from('training_centers').select('*').in('id', centerIds);
              centersData = cData || [];
            }

            enrichedEnrollments = enrichedEnrollments.map(e => {
              const ch = cohortsData.find(c => c.id === e.cohort_id);
              if (ch) {
                const center = centersData.find(cnt => cnt.id === ch.center_id) || null;
                return { ...e, cohort: { ...ch, center } };
              }
              return { ...e, cohort: null };
            });
          }
        } catch (cErr) {
          console.warn('Graceful degradation: Cohorts could not be resolved.', cErr.message);
        }
      }
      setEnrollments(enrichedEnrollments);

      const enrolledCourseIds = enrichedEnrollments.map(e => e.course_id);

      if (enrolledCourseIds.length > 0) {
        const { data: assignmentsData, error: assignError } = await supabase
          .from('assignments').select('*, course:courses(*)').in('course_id', enrolledCourseIds);
        if (assignError) throw assignError;
        setAssignments(assignmentsData || []);

        const { data: subData, error: subError } = await supabase
          .from('submissions').select('*, assignment:assignments(*, course:courses(*)), grades(*)').eq('student_id', profile.id);
        if (subError) throw subError;
        const subsWithGrades = (subData || []).map(sub => ({ ...sub, grade: sub.grades?.[0] || null }));
        setSubmissions(subsWithGrades);

        const { data: quizzesData, error: quizzesError } = await supabase
          .from('quizzes').select('*, course:courses(*)').in('course_id', enrolledCourseIds).eq('is_published', true);
        if (quizzesError) throw quizzesError;
        setQuizzes(quizzesData || []);

        if (quizzesData && quizzesData.length > 0) {
          const { data: questionsData, error: questionsError } = await supabase
            .from('quiz_questions').select('*').in('quiz_id', quizzesData.map(q => q.id));
          if (questionsError) throw questionsError;
          setQuizQuestions(questionsData || []);
        } else {
          setQuizQuestions([]);
        }

        const { data: attemptsData, error: attemptsError } = await supabase
          .from('quiz_attempts').select('*').eq('student_id', profile.id);
        if (attemptsError) throw attemptsError;
        setQuizAttempts(attemptsData || []);

        const { data: attData, error: attError } = await supabase
          .from('attendance').select('*, course:courses(*)').eq('student_id', profile.id);
        if (attError) throw attError;
        setAttendanceLogs(attData || []);

        const { data: materialsData, error: materialsError } = await supabase
          .from('materials').select('*, course:courses(*)').in('course_id', enrolledCourseIds);
        if (materialsError) throw materialsError;
        setMaterials(materialsData || []);

        const { data: liveData, error: liveError } = await supabase
          .from('live_classes').select('*').in('course_id', enrolledCourseIds);
        if (liveError) throw liveError;
        setLiveClasses(liveData || []);

        const { data: recData, error: recError } = await supabase
          .from('recorded_classes').select('*').in('course_id', enrolledCourseIds);
        if (recError) throw recError;
        setRecordedClasses(recData || []);
      } else {
        setAssignments([]); setSubmissions([]); setQuizzes([]);
        setQuizQuestions([]); setQuizAttempts([]); setAttendanceLogs([]);
        setMaterials([]); setLiveClasses([]); setRecordedClasses([]);
      }

      // Fetch certificates
      const { data: certsData, error: certsError } = await supabase
        .from('certificates').select('*, course:courses(*)').eq('student_id', profile.id);
      if (certsError) throw certsError;
      setCertificates(certsData || []);

      // Fetch discussions & replies
      if (enrolledCourseIds.length > 0) {
        const { data: discData, error: discError } = await supabase
          .from('discussions').select('*, author:users(*), course:courses(*)').in('course_id', enrolledCourseIds);
        if (discError) throw discError;
        setDiscussions(discData || []);

        const { data: repliesData, error: repliesError } = await supabase
          .from('discussion_replies').select('*, author:users(*)');
        if (repliesError) throw repliesError;
        setDiscussionReplies(repliesData || []);
      } else {
        setDiscussions([]);
        setDiscussionReplies([]);
      }

      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments').select('*, course:courses(*)').eq('student_id', profile.id);
      if (paymentsError) throw paymentsError;
      setPayments(paymentsData || []);

      // Automated Payment Reminders Check
      const unpaidCourses = allCoursesData.filter(c => c.fee > 0 && !enrolledCourseIds.includes(c.id));
      if (unpaidCourses.length > 0) {
        const { data: existingNotifs } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', profile.id)
          .eq('type', 'payment');
        
        const todayStr = new Date().toISOString().split('T')[0];
        
        for (const unpaid of unpaidCourses) {
          const hasReminderToday = (existingNotifs || []).some(n => 
            n.message.includes(unpaid.title) && 
            n.created_at.split('T')[0] === todayStr
          );
          
          if (!hasReminderToday) {
            await supabase.from('notifications').insert({
              user_id: profile.id,
              title: 'Fee Payment Pending',
              message: `Payment reminder: ₹${unpaid.fee} due for ${unpaid.title}. Enroll now!`,
              type: 'payment',
              link: '/student'
            });
          }
        }
      }
    } catch (err) {
      console.error('Error loading student data:', err.message);
      setAlert({ type: 'error', message: `Failed to load data: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentData(false);
    const interval = setInterval(() => loadStudentData(true), 5000);
    return () => clearInterval(interval);
  }, [profile]);

  useEffect(() => {
    if (activeQuiz && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (activeQuiz && timeLeft === 0) {
      handleQuizSubmission();
    }
  }, [activeQuiz, timeLeft]);

  // ── Chat Polling & Scroll Sync ─────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'chat') {
      loadChatStudents();
    }
  }, [activeTab]);

  useEffect(() => {
    let chatInterval;
    if (activeTab === 'chat' && activeChatStudent) {
      loadChatMessages(activeChatStudent.id, false);
      chatInterval = setInterval(() => {
        loadChatMessages(activeChatStudent.id, true);
      }, 3000);
    }
    return () => clearInterval(chatInterval);
  }, [activeTab, activeChatStudent]);

  useEffect(() => {
    if (activeTab === 'chat' && activeChatStudent) {
      scrollToBottom();
    }
  }, [chatMessages]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleEnroll = async (courseId) => {
    try {
      const { error } = await supabase.from('enrollments').insert({ student_id: profile.id, course_id: courseId, status: 'active' });
      if (error) throw error;
      setAlert({ type: 'success', message: 'Successfully enrolled!' });
      loadStudentData();
    } catch (err) {
      setAlert({ type: 'error', message: `Enrollment failed: ${err.message}` });
    }
  };

  const handleCompleteCourse = async (courseId) => {
    try {
      const enroll = enrollments.find(e => e.course_id === courseId);
      if (!enroll) return;

      // 1. Update enrollment status to 'completed'
      const { error: enrollError } = await supabase
        .from('enrollments')
        .update({ status: 'completed' })
        .eq('id', enroll.id);
      if (enrollError) throw enrollError;

      // 2. Compute dynamic academic grade
      let grade = 'A+';
      const courseSubmissions = submissions.filter(s => s.assignment?.course_id === courseId && s.status === 'graded');
      const courseAttempts = quizAttempts.filter(qa => {
        const q = quizzes.find(quiz => quiz.id === qa.quiz_id);
        return q && q.course_id === courseId;
      });
      
      let totalEarned = 0;
      let totalPossible = 0;
      
      courseSubmissions.forEach(s => {
        if (s.grade) {
          totalEarned += Number(s.grade.marks);
          totalPossible += Number(s.assignment?.max_marks || 100);
        }
      });
      
      courseAttempts.forEach(qa => {
        const q = quizzes.find(quiz => quiz.id === qa.quiz_id);
        if (q) {
          totalEarned += Number(qa.score || 0);
          totalPossible += Number(q.max_marks || 100);
        }
      });
      
      if (totalPossible > 0) {
        const pct = (totalEarned / totalPossible) * 100;
        if (pct >= 90) grade = 'A+';
        else if (pct >= 80) grade = 'A';
        else if (pct >= 70) grade = 'B';
        else grade = 'C';
      }

      // 3. Generate certificate number
      const certNum = `LMS-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}A`;

      // 4. Insert certificate (ignoring duplicate warnings if already issued)
      const { error: certError } = await supabase
        .from('certificates')
        .insert({
          student_id: profile.id,
          course_id: courseId,
          certificate_number: certNum,
          grade: grade,
          issued_at: new Date().toISOString()
        });

      if (certError && !certError.message?.includes('duplicate key') && !certError.message?.includes('unique constraint')) {
        console.warn('Certificate insert warning:', certError.message);
      }

      // 5. Send completion notification
      await supabase.from('notifications').insert({
        user_id: profile.id,
        title: 'Course Certificate Earned!',
        message: `Congratulations! You have earned a Completion Certificate for "${enroll.course?.title || 'Course'}" with grade ${grade}.`,
        type: 'success',
        link: '/student'
      });

      setAlert({ type: 'success', message: 'Congratulations! Course completed and certificate generated!' });
      loadStudentData();
    } catch (err) {
      setAlert({ type: 'error', message: `Failed to complete course: ${err.message}` });
    }
  };

  const startCheckout = (course) => {
    setSelectedCheckoutCourse(course);
    setPaymentMethod('UPI');
    setPaymentDetails('');
    setIsCheckoutModalOpen(true);
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!window.Razorpay) {
      setAlert({ type: 'error', message: 'Razorpay Payment Gateway failed to load. Please check your internet connection.' });
      return;
    }

    try {
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_LMSPlatformKey',
        amount: selectedCheckoutCourse.fee * 100, // Razorpay amount in paisa (1 INR = 100 Paisa)
        currency: 'INR',
        name: 'LMS Academy',
        description: `Enrollment fee for ${selectedCheckoutCourse.code} - ${selectedCheckoutCourse.title}`,
        image: '/logo.png',
        handler: async function (response) {
          try {
            setLoading(true);
            const { error: payError } = await supabase.from('payments').insert({
              student_id: profile.id, 
              course_id: selectedCheckoutCourse.id,
              amount: selectedCheckoutCourse.fee, 
              currency: 'INR',
              payment_method: 'Razorpay',
              gateway_order_id: response.razorpay_order_id || `order_${selectedCheckoutCourse.code}_${Date.now()}`,
              gateway_payment_id: response.razorpay_payment_id || `pay_${selectedCheckoutCourse.code}_${Date.now()}`,
              status: 'completed',
              receipt_url: `https://mockstorage.local/receipts/${selectedCheckoutCourse.code}_receipt.pdf`,
              paid_at: new Date().toISOString()
            });
            if (payError) throw payError;

            const { error: enrollError } = await supabase.from('enrollments').insert({
              student_id: profile.id, 
              course_id: selectedCheckoutCourse.id, 
              status: 'active'
            });
            if (enrollError) throw enrollError;

            await supabase.from('notifications').insert({
              user_id: profile.id, 
              title: 'Payment Success',
              message: `Payment of ₹${selectedCheckoutCourse.fee} via Razorpay was successful. Enrolled!`,
              type: 'payment', 
              link: '/student'
            });

            setAlert({ type: 'success', message: `Razorpay payment successful! Enrolled in ${selectedCheckoutCourse.title}.` });
            setIsCheckoutModalOpen(false);
            setSelectedCheckoutCourse(null);
            loadStudentData();
          } catch (err) {
            setAlert({ type: 'error', message: `Failed to record transaction: ${err.message}` });
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: profile.full_name,
          email: profile.email,
        },
        theme: {
          color: '#6366f1' // Brand Indigo color
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setAlert({ type: 'error', message: `Razorpay transaction failed: ${err.message}` });
    }
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (!submitFileUrl) { setAlert({ type: 'error', message: 'Please upload your assignment file first.' }); return; }
    try {
      const alreadySubmitted = submissions.find(s => s.assignment_id === selectedAssignment.id);
      let error;
      if (alreadySubmitted) {
        const { error: updateError } = await supabase.from('submissions')
          .update({ file_url: submitFileUrl, submitted_at: new Date().toISOString(), status: 'submitted' })
          .eq('id', alreadySubmitted.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase.from('submissions')
          .insert({ assignment_id: selectedAssignment.id, student_id: profile.id, file_url: submitFileUrl, status: 'submitted' });
        error = insertError;
      }
      if (error) throw error;
      setAlert({ type: 'success', message: 'Assignment submitted successfully!' });
      setIsSubmitModalOpen(false);
      setSubmitFileUrl('');
      loadStudentData();
    } catch (err) {
      setAlert({ type: 'error', message: `Submission failed: ${err.message}` });
    }
  };

  const startQuizAttempt = (quiz) => {
    setActiveQuiz(quiz);
    setQuizAnswers({});
    setTimeLeft(quiz.time_limit_minutes * 60);
  };

  const handleQuizSubmission = async () => {
    if (!activeQuiz) return;
    try {
      const questions = quizQuestions.filter(q => q.quiz_id === activeQuiz.id);
      let score = 0;
      questions.forEach(q => {
        const selected = quizAnswers[q.id];
        if (selected !== undefined && Number(selected) === q.correct_answer) score += q.marks;
      });
      const { error } = await supabase.from('quiz_attempts').insert({
        quiz_id: activeQuiz.id, student_id: profile.id,
        answers: quizAnswers, score, completed_at: new Date().toISOString()
      });
      if (error) throw error;
      setAlert({ type: 'success', message: `Quiz submitted! Score: ${score} / ${activeQuiz.max_marks}` });
      setActiveQuiz(null);
      loadStudentData();
    } catch (err) {
      setAlert({ type: 'error', message: `Quiz submission failed: ${err.message}` });
      setActiveQuiz(null);
    }
  };

  // ── Forum / Community Board Functions ──────────────────────────────────────
  const handlePostThread = async (e) => {
    e.preventDefault();
    if (!newForumTitle || !newForumContent) {
      setAlert({ type: 'error', message: 'Please fill in both the title and content fields.' });
      return;
    }
    const courseId = forumSelectedCourse === 'all' ? (enrolledCourses[0]?.id || '') : forumSelectedCourse;
    if (!courseId) {
      setAlert({ type: 'error', message: 'You must be enrolled in at least one course to start a discussion.' });
      return;
    }
    
    try {
      const { error } = await supabase.from('discussions').insert({
        course_id: courseId,
        author_id: profile.id,
        title: newForumTitle,
        content: newForumContent,
        is_pinned: false
      });
      if (error) throw error;
      setAlert({ type: 'success', message: 'Discussion thread posted!' });
      setNewForumTitle('');
      setNewForumContent('');
      setIsForumModalOpen(false);
      loadStudentData();
    } catch (err) {
      setAlert({ type: 'error', message: `Failed to post thread: ${err.message}` });
    }
  };

  const handlePostReply = async () => {
    if (!forumReplyInput) return;
    try {
      const { error } = await supabase.from('discussion_replies').insert({
        discussion_id: selectedThread.id,
        author_id: profile.id,
        content: forumReplyInput
      });
      if (error) throw error;
      setForumReplyInput('');
      loadStudentData();
    } catch (err) {
      setAlert({ type: 'error', message: `Failed to post reply: ${err.message}` });
    }
  };

  // ── Chat Functions ─────────────────────────────────────────────────────────
  const loadChatStudents = async () => {
    if (!profile) return;
    try {
      const { data, error } = await supabase.from('users').select('*').in('role', ['student', 'teacher']);
      if (error) throw error;
      setChatStudents((data || []).filter(s => s.id !== profile.id));
    } catch (err) {
      console.error('Error loading chat students:', err.message);
    }
  };

  const loadChatMessages = async (targetId, checkNew = false) => {
    if (!profile || !targetId) return;
    try {
      const { data, error } = await supabase.from('messages').select('*');
      if (error) throw error;
      
      let conversation;
      if (activeChatStudent?.isCohortChannel) {
        conversation = (data || []).filter(msg => msg.receiver_id === targetId)
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      } else {
        conversation = (data || []).filter(msg => 
          (msg.sender_id === profile.id && msg.receiver_id === targetId) ||
          (msg.sender_id === targetId && msg.receiver_id === profile.id)
        ).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      }
      
      if (checkNew && chatMessages.length > 0 && conversation.length > chatMessages.length) {
        const lastMsg = conversation[conversation.length - 1];
        if (lastMsg.sender_id !== profile.id) {
          const senderUser = chatStudents.find(s => s.id === lastMsg.sender_id);
          const name = senderUser ? senderUser.full_name : 'Classmate';
          const prefix = activeChatStudent?.isCohortChannel ? `[${activeChatStudent.full_name}] ${name}` : name;
          setAlert({
            type: 'info',
            message: `New message from ${prefix}: "${lastMsg.message_text.substring(0, 30)}${lastMsg.message_text.length > 30 ? '...' : ''}"`
          });
        }
      }
      setChatMessages(conversation);
    } catch (err) {
      console.error('Error loading chat messages:', err.message);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChatStudent) return;

    const newMessage = {
      sender_id: profile.id,
      receiver_id: activeChatStudent.id,
      message_text: chatInput.trim(),
      is_read: false
    };

    try {
      const { error } = await supabase.from('messages').insert(newMessage);
      if (error) throw error;
      setChatInput('');
      setAlert({ type: 'success', message: 'Message sent!' });
      await loadChatMessages(activeChatStudent.id, false);
    } catch (err) {
      console.error('Error sending message:', err.message);
      setAlert({ type: 'error', message: `Failed to send message: ${err.message}` });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ── Helper Functions ───────────────────────────────────────────────────────
  const getSubmissionStatus = (assignmentId) => {
    const sub = submissions.find(s => s.assignment_id === assignmentId);
    if (!sub) return { label: 'Not Submitted', chipClass: 'chip chip-gray' };
    if (sub.status === 'graded') return { label: 'Graded', chipClass: 'chip chip-green' };
    return { label: 'Submitted', chipClass: 'chip chip-indigo' };
  };

  const getCourseAttendanceStats = (courseId) => {
    const logs = attendanceLogs.filter(l => l.course_id === courseId);
    if (logs.length === 0) return { pct: 100, present: 0, absent: 0, total: 0 };
    const present = logs.filter(l => l.status === 'present' || l.status === 'late').length;
    const absent = logs.filter(l => l.status === 'absent').length;
    return { pct: Math.round((present / logs.length) * 100), present, absent, total: logs.length };
  };

  const getAIRecommendations = () => {
    const recommendations = [];
    enrolledCourses.forEach(course => {
      const attStats = getCourseAttendanceStats(course.id);
      if (attStats.pct < 75) {
        recommendations.push({ courseCode: course.code, priority: 'high', text: `Attendance in ${course.code} is ${attStats.pct}%. Review lecture recordings to stay on track.` });
      }
      let lowScores = 0;
      quizzes.filter(q => q.course_id === course.id).forEach(quiz => {
        const attempt = quizAttempts.find(a => a.quiz_id === quiz.id);
        if (attempt && (attempt.score / quiz.max_marks) * 100 < 70) lowScores++;
      });
      if (lowScores > 0) {
        recommendations.push({ courseCode: course.code, priority: 'medium', text: `Scored under 70% in ${lowScores} quiz(zes) for ${course.code}. Review course materials.` });
      }
    });
    if (recommendations.length === 0) {
      recommendations.push({ courseCode: 'ALL', priority: 'low', text: 'Excellent! Your attendance and quiz scores are looking great. Keep it up!' });
    }
    return recommendations;
  };

  const getProgressMetrics = (courseId) => {
    const courseAssignments = assignments.filter(a => a.course_id === courseId);
    const courseQuizzes = quizzes.filter(q => q.course_id === courseId);
    
    // Assignment Completion
    const submittedAssigns = submissions.filter(s => s.assignment?.course_id === courseId).length;
    const assignPct = courseAssignments.length > 0 ? Math.round((submittedAssigns / courseAssignments.length) * 100) : 100;
    
    // Quiz Completion
    const attemptedQuizzes = quizAttempts.filter(qa => {
      const q = quizzes.find(quiz => quiz.id === qa.quiz_id);
      return q && q.course_id === courseId;
    }).length;
    const quizPct = courseQuizzes.length > 0 ? Math.round((attemptedQuizzes / courseQuizzes.length) * 100) : 100;
    
    // Attendance Rate
    const attStats = getCourseAttendanceStats(courseId);
    const attPct = attStats.total > 0 ? attStats.pct : 100;
    
    // Weighted average: Assignments (40%), Quizzes (40%), Attendance (20%)
    const weightedAvg = Math.round((assignPct * 0.4) + (quizPct * 0.4) + (attPct * 0.2));
    
    return {
      assignPct,
      quizPct,
      attPct,
      overall: weightedAvg,
      totalAssigns: courseAssignments.length,
      submittedAssigns,
      totalQuizzes: courseQuizzes.length,
      attemptedQuizzes
    };
  };

  const calculateTotalXP = () => {
    const assignXP = submissions.length * 100;
    const quizXP = quizAttempts.length * 150;
    const presentLogs = attendanceLogs.filter(l => l.status === 'present' || l.status === 'late').length;
    const attXP = presentLogs * 50;
    return assignXP + quizXP + attXP + 500; // Base 500 XP
  };

  // ── Loading State ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <LoadingSpinner size="medium" message="Loading your dashboard..." />
      </div>
    );
  }

  // ── Computed Data ──────────────────────────────────────────────────────────
  const enrolledCourses = enrollments.map(e => e.course).filter(Boolean);
  const enrolledCourseIds = enrolledCourses.map(c => c.id);
  const availableCourses = allCourses.filter(c => !enrolledCourseIds.includes(c.id) && c.status === 'active');
  const filteredAvailableCourses = availableCourses.filter(c => {
    const q = searchQuery.toLowerCase();
    return c.title.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
  });

  const activeEnrolledCount = enrolledCourses.length;
  const assignmentsPendingCount = assignments.filter(a => {
    const sub = submissions.find(s => s.assignment_id === a.id);
    return !sub && new Date(a.deadline) > new Date();
  }).length;
  const completedAssessmentsCount = quizAttempts.length + submissions.filter(s => s.status === 'graded').length;

  // ── Style Helpers ──────────────────────────────────────────────────────────
  const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--shadow-sm)' };
  const sectionTitle = { fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14, margin: '0 0 14px' };
  const emptyBox = { padding: '36px 24px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13, background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)' };

  const pageTitle = {
    home: `Hi, ${profile?.full_name?.split(' ')[0] || 'Student'} 👋`,
    'my-courses': 'My Courses', grades: 'My Grades', quizzes: 'Quizzes',
    attendance: 'Attendance', payments: 'Payments', achievements: 'Achievements',
    chat: 'Student Chat',
    certificates: 'Certificate Dashboard',
  }[activeTab] || 'Dashboard';

  const pageSubtitle = {
    home: 'Track your progress, courses, and upcoming tasks.',
    'my-courses': 'View enrolled courses and browse the catalog.',
    grades: 'Review your marks and instructor feedback.',
    quizzes: 'Complete your assessments on time.',
    attendance: 'Monitor your class attendance records.',
    payments: 'View your payment history and receipts.',
    achievements: 'Your earned badges and milestones.',
    chat: 'Search and chat directly with your classmates.',
    certificates: 'View and print your verified course completion certificates.',
  }[activeTab] || '';

  const totalXP = calculateTotalXP();

  const statCards = [
    { label: 'Enrolled Courses', value: activeEnrolledCount,       icon: <BookOpen size={20}/>, bg: '#eff6ff', color: '#2563eb' },
    { label: 'Pending Tasks',    value: assignmentsPendingCount,   icon: <Clock size={20}/>,    bg: '#fef2f2', color: '#dc2626' },
    { label: 'Graded Tasks',     value: completedAssessmentsCount, icon: <CheckCircle size={20}/>, bg: '#ecfdf5', color: '#059669' },
    { label: 'Study Points',     value: `${totalXP} XP`,           icon: <Sparkles size={20}/>, bg: '#fffbeb', color: '#d97706' },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)', padding: '28px 32px', fontFamily: 'var(--font)' }}>

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>{pageTitle}</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-2)' }}>{pageSubtitle}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8 }}>
          <Sparkles size={14} color="#f59e0b" />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#92400e' }}>{totalXP} XP</span>
        </div>
      </div>

      {alert && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, width: 320, boxShadow: 'var(--shadow-lg)' }} className="animate-slide-up">
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        </div>
      )}

      {/* ══ QUIZ ATTEMPT ENVIRONMENT ══════════════════════════════════════════ */}
      {activeQuiz ? (
        <div style={{ maxWidth: 680, margin: '0 auto', ...card, padding: 28 }} className="animate-slide-up">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>{activeQuiz.title}</h3>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-2)' }}>{activeQuiz.description}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8 }}>
              <Clock size={14} color="#f59e0b" />
              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 16, color: '#92400e' }}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
          <div className="custom-scrollbar" style={{ maxHeight: '58vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {quizQuestions.filter(q => q.quiz_id === activeQuiz.id).map((q, idx) => (
              <div key={q.id} style={{ ...card, padding: '18px 20px' }}>
                <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Question {idx + 1} · {q.marks} pts
                </p>
                <p style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.5 }}>{q.question_text}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {q.options.map((opt, oIdx) => {
                    const isSel = quizAnswers[q.id] === oIdx;
                    return (
                      <button key={oIdx} type="button"
                        onClick={() => setQuizAnswers(prev => ({ ...prev, [q.id]: oIdx }))}
                        style={{ textAlign: 'left', padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font)', transition: 'all 0.15s', border: `1.5px solid ${isSel ? 'var(--accent)' : 'var(--border-2)'}`, background: isSel ? 'var(--accent-bg)' : 'var(--surface)', color: isSel ? 'var(--accent-text)' : 'var(--text)' }}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 20 }} onClick={handleQuizSubmission}>
            Submit Quiz
          </button>
        </div>

      ) : courseDetailView ? (
        /* ══ COURSE DETAIL VIEW ═══════════════════════════════════════════════ */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="animate-fade-in">
          <div style={{ ...card, padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span className="chip chip-indigo">{courseDetailView.code}</span>
              <h2 style={{ margin: '8px 0 4px', fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{courseDetailView.title}</h2>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)' }}>{courseDetailView.description || 'No description available.'}</p>
            </div>
            <button className="btn btn-secondary" onClick={() => setCourseDetailView(null)}>← Back</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px', gap: 20, alignItems: 'start' }}>
            {/* Left: Sub-tabs */}
            <div style={card}>
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 4px' }}>
                {[['curriculum','Curriculum'],['live','Live Classes'],['recordings','Recordings']].map(([id, label]) => (
                  <button key={id} onClick={() => setCourseSubTab(id)}
                    style={{ padding: '13px 16px', fontSize: 13, fontWeight: courseSubTab === id ? 700 : 500, color: courseSubTab === id ? 'var(--accent-text)' : 'var(--text-2)', background: 'none', border: 'none', borderBottom: `2px solid ${courseSubTab === id ? 'var(--accent)' : 'transparent'}`, cursor: 'pointer', fontFamily: 'var(--font)', transition: 'all 0.15s', marginBottom: -1 }}>
                    {label}
                  </button>
                ))}
              </div>
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* Curriculum sub-tab */}
                {courseSubTab === 'curriculum' && (
                  <>
                    <div>
                      <p style={sectionTitle}>Assignments</p>
                      {assignments.filter(a => a.course_id === courseDetailView.id).length === 0
                        ? <div style={emptyBox}>No assignments for this course yet.</div>
                        : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {assignments.filter(a => a.course_id === courseDetailView.id).map(assign => {
                              const sub = submissions.find(s => s.assignment_id === assign.id);
                              const status = getSubmissionStatus(assign.id);
                              const isOverdue = !sub && new Date(assign.deadline) < new Date();
                              return (
                                <div key={assign.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{assign.title}</span>
                                      <span className={status.chipClass}>{status.label}</span>
                                    </div>
                                    <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--text-2)' }}>{assign.description}</p>
                                    <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-3)' }}>
                                      <span>📅 {new Date(assign.deadline).toLocaleString()}</span>
                                      <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{assign.max_marks} pts max</span>
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                                    {sub?.status === 'graded' && (
                                      <div style={{ textAlign: 'center', padding: '6px 12px', background: 'var(--success-bg)', border: '1px solid #6ee7b7', borderRadius: 8 }}>
                                        <div style={{ fontSize: 10, color: '#065f46', fontWeight: 600, marginBottom: 2 }}>Grade</div>
                                        <div style={{ fontSize: 14, fontWeight: 800, color: '#059669' }}>{sub.grade?.marks}/{assign.max_marks}</div>
                                      </div>
                                    )}
                                    {!sub && !isOverdue && (
                                      <button className="btn btn-primary btn-sm" onClick={() => { setSelectedAssignment(assign); setSubmitFileUrl(''); setIsSubmitModalOpen(true); }}>Submit</button>
                                    )}
                                    {sub && sub.status !== 'graded' && (
                                      <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedAssignment(assign); setSubmitFileUrl(sub.file_url || ''); setIsSubmitModalOpen(true); }}>Resubmit</button>
                                    )}
                                    {isOverdue && <span className="chip chip-red">Overdue</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                      }
                    </div>
                    <div>
                      <p style={sectionTitle}>Learning Materials</p>
                      {materials.filter(m => m.course_id === courseDetailView.id).length === 0
                        ? <div style={emptyBox}>No materials published yet.</div>
                        : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {materials.filter(m => m.course_id === courseDetailView.id).map(mat => (
                              <div key={mat.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FileText size={16} color="var(--accent)" />
                                  </div>
                                  <div>
                                    <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{mat.title}</p>
                                    <p style={{ margin: 0, fontSize: 11, color: 'var(--text-3)' }}>{mat.file_type?.toUpperCase()} · {mat.file_size ? `${(mat.file_size / (1024 * 1024)).toFixed(2)} MB` : '—'}</p>
                                  </div>
                                </div>
                                <a href={mat.file_url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                                  <FileDown size={12} /> Download
                                </a>
                              </div>
                            ))}
                          </div>
                      }
                    </div>
                  </>
                )}

                {/* Live Classes sub-tab */}
                {courseSubTab === 'live' && (
                  <div>
                    <p style={sectionTitle}>Scheduled Live Sessions</p>
                    {liveClasses.filter(c => c.course_id === courseDetailView.id).length === 0
                      ? <div style={emptyBox}>No live sessions scheduled for this course.</div>
                      : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {liveClasses.filter(c => c.course_id === courseDetailView.id).map(session => (
                            <div key={session.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{session.title}</span>
                                  <span className={`chip ${session.status === 'live' ? 'chip-red' : session.status === 'completed' ? 'chip-gray' : 'chip-indigo'}`}>{session.status}</span>
                                </div>
                                <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--text-2)' }}>{session.description}</p>
                                <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-3)' }}>
                                  <span>📅 {new Date(session.scheduled_at).toLocaleString()}</span>
                                  <span>⏱ {session.duration_minutes} mins</span>
                                </div>
                              </div>
                              <a href={session.meeting_link} target="_blank" rel="noreferrer"
                                className={`btn btn-sm ${session.status === 'completed' ? 'btn-secondary' : 'btn-primary'}`}
                                style={session.status === 'completed' ? { pointerEvents: 'none', opacity: 0.5 } : {}}>
                                <Video size={12} /> Join
                              </a>
                            </div>
                          ))}
                        </div>
                    }
                  </div>
                )}

                {/* Recordings sub-tab */}
                {courseSubTab === 'recordings' && (
                  <div>
                    <p style={sectionTitle}>Recorded Lectures</p>
                    {recordedClasses.filter(c => c.course_id === courseDetailView.id).length === 0
                      ? <div style={emptyBox}>No recordings yet for this course.</div>
                      : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {recordedClasses.filter(c => c.course_id === courseDetailView.id).map(rec => (
                            <div key={rec.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 16px', border: '1px solid var(--border)', borderRadius: 10 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Tv size={18} color="var(--accent)" />
                                </div>
                                <div>
                                  <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{rec.title}</p>
                                  <p style={{ margin: 0, fontSize: 11, color: 'var(--text-3)' }}>{rec.duration_minutes || 0} mins · {new Date(rec.created_at).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <button className="btn btn-secondary btn-sm" onClick={() => setActiveVideoUrl(rec.video_url)}>
                                <Play size={12} style={{ fill: 'currentColor' }} /> Watch
                              </button>
                            </div>
                          ))}
                        </div>
                    }
                  </div>
                )}
              </div>
            </div>

            {/* Right: Feedback panel */}
            <div style={{ ...card, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Instructor Feedback</p>
              </div>
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {submissions.filter(s => s.assignment?.course_id === courseDetailView.id && s.status === 'graded').length === 0
                  ? <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: '16px 0' }}>No feedback yet.</p>
                  : submissions.filter(s => s.assignment?.course_id === courseDetailView.id && s.status === 'graded').map(sub => (
                      <div key={sub.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.assignment?.title}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>{sub.grade?.marks} pts</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-2)', fontStyle: 'italic', lineHeight: 1.5 }}>"{sub.grade?.feedback || 'No comments.'}"</p>
                      </div>
                    ))
                }
              </div>
            </div>
          </div>
        </div>

      ) : (
        <>
          {/* ══ HOME TAB ═══════════════════════════════════════════════════════ */}
          {activeTab === 'home' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fade-in">
              {/* Stat cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                {statCards.map((sc, i) => (
                  <div key={i} style={{ ...card, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 12, background: sc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: sc.color }}>
                      {sc.icon}
                    </div>
                    <div>
                      <p style={{ margin: '0 0 3px', fontSize: 11, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{sc.label}</p>
                      <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>{sc.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
                <div>
                  <p style={sectionTitle}>My Courses</p>
                  {enrolledCourses.length === 0
                    ? <div style={emptyBox}>Not enrolled in any courses. Go to "My Courses" to browse.</div>
                    : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                        {enrolledCourses.map(course => {
                          const enrollment = enrollments.find(e => e.course_id === course.id);
                          const isCompleted = enrollment?.status === 'completed';
                          const metrics = getProgressMetrics(course.id);
                          const canComplete = metrics.overall >= 100;
                          return (
                            <div key={course.id} style={{ ...card, padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span className="chip chip-indigo">{course.code}</span>
                                  <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 3 }}>⏱ {course.duration || '3 Months'}</span>
                                </div>
                                <h4 style={{ margin: '8px 0 4px', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{course.title}</h4>
                                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-2)' }}>{course.category || 'General'}</p>
                              </div>
                              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setCourseDetailView(course)}>
                                  <Play size={13} style={{ fill: 'white', marginRight: 4 }} /> Open
                                </button>
                                {isCompleted ? (
                                  <button className="btn btn-secondary" style={{ flex: 1, borderColor: '#059669', color: '#059669', cursor: 'default', background: 'rgba(5, 150, 105, 0.08)' }} disabled>
                                    Completed ✓
                                  </button>
                                ) : (
                                  <button className={`btn ${canComplete ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ flex: 1, ...(canComplete ? { background: '#059669', borderColor: '#059669', color: '#fff' } : { opacity: 0.5, cursor: 'not-allowed' }) }}
                                    disabled={!canComplete}
                                    onClick={() => handleCompleteCourse(course.id)}>
                                    Complete
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                  }

                  <div style={{ marginTop: 24 }}>
                    <p style={sectionTitle}>Course Progress Tracker</p>
                    {enrolledCourses.length === 0
                      ? <div style={emptyBox}>No active course progress to track.</div>
                      : <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {enrolledCourses.map(course => {
                            const metrics = getProgressMetrics(course.id);
                            return (
                              <div key={course.id} style={{ ...card, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{course.title} ({course.code})</span>
                                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent)' }}>{metrics.overall}%</span>
                                  </div>
                                  <div style={{ height: 8, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
                                    <div style={{ height: '100%', width: `${metrics.overall}%`, background: 'linear-gradient(90deg, var(--accent) 0%, #a855f7 100%)', borderRadius: 99, transition: 'width 0.5s' }} />
                                  </div>
                                  <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-3)' }}>
                                    <span>Assignments: {metrics.submittedAssigns}/{metrics.totalAssigns} ({metrics.assignPct}%)</span>
                                    <span>Quizzes: {metrics.attemptedQuizzes}/{metrics.totalQuizzes} ({metrics.quizPct}%)</span>
                                    <span>Attendance: {metrics.attPct}%</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                    }
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Cohort Programs Card */}
                  {enrollments.some(e => e.cohort) && (
                    <div style={card}>
                      <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <Calendar size={14} color="var(--accent)" />
                          <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Active Cohort</p>
                        </div>
                        <span className="chip chip-green" style={{ fontSize: 10 }}>Active</span>
                      </div>
                      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {enrollments.filter(e => e.cohort).map(e => {
                          const ch = e.cohort;
                          const start = new Date(ch.start_date);
                          const end = new Date(ch.end_date);
                          const today = new Date();
                          const totalDays = Math.max(1, (end - start) / (24 * 3600 * 1000));
                          const elapsedDays = Math.max(0, Math.min(totalDays, (today - start) / (24 * 3600 * 1000)));
                          const progressPercent = Math.round((elapsedDays / totalDays) * 100);

                          return (
                            <div key={ch.id} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                              <div>
                                <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{ch.name}</h4>
                                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-2)' }}>Course: <strong>{e.course?.title} ({e.course?.code})</strong></p>
                                {ch.center && (
                                  <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-3)' }}>
                                    🏫 {ch.center.name} ({ch.center.location})
                                  </p>
                                )}
                              </div>

                              {/* Progress bar */}
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11 }}>
                                  <span style={{ color: 'var(--text-3)' }}>Program Timeline</span>
                                  <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{progressPercent}% Complete</span>
                                </div>
                                <div style={{ height: 6, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${progressPercent}%`, background: 'var(--accent)', borderRadius: 99 }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: 'var(--text-3)' }}>
                                  <span>{start.toLocaleDateString()}</span>
                                  <span>{end.toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Fee Payment Reminders */}
                  {availableCourses.filter(c => c.fee > 0).length > 0 && (
                    <div style={card}>
                      <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 7 }}>
                        <CreditCard size={14} color="#ef4444" />
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Payment Reminders</p>
                      </div>
                      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {availableCourses.filter(c => c.fee > 0).map(course => (
                          <div key={course.id} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 12px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 8 }}>
                            <div>
                              <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: '#991b1b' }}>{course.title}</p>
                              <p style={{ margin: 0, fontSize: 12, color: '#b91c1c', fontWeight: 600 }}>Fee: ₹{course.fee}</p>
                            </div>
                            <button className="btn btn-sm btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444', color: '#fff', fontSize: 11, padding: '4px 8px', height: 26 }}
                              onClick={() => startCheckout(course)}>
                              Pay Now
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Deadlines */}
                  <div style={card}>
                    <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)' }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Upcoming Deadlines</p>
                    </div>
                    <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {assignments.filter(a => !submissions.find(s => s.assignment_id === a.id)).slice(0, 4).length === 0
                        ? <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: '12px 0' }}>No pending deadlines!</p>
                        : assignments.filter(a => !submissions.find(s => s.assignment_id === a.id)).slice(0, 4).map(item => (
                            <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 8 }}>
                              <FileText size={13} color="#f59e0b" style={{ marginTop: 2, flexShrink: 0 }} />
                              <div>
                                <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{item.title}</p>
                                <p style={{ margin: 0, fontSize: 11, color: 'var(--text-2)' }}>{item.course?.code} · {new Date(item.deadline).toLocaleDateString()}</p>
                              </div>
                            </div>
                          ))
                      }
                    </div>
                  </div>

                  {/* Study Advisor */}
                  <div style={card}>
                    <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 7 }}>
                      <Sparkles size={14} color="var(--accent)" />
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Study Advisor</p>
                    </div>
                    <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {getAIRecommendations().map((rec, idx) => {
                        const colors = { high: { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b' }, medium: { bg: '#fffbeb', border: '#fde68a', text: '#92400e' }, low: { bg: '#ecfdf5', border: '#6ee7b7', text: '#065f46' } };
                        const c = colors[rec.priority] || colors.low;
                        return (
                          <div key={idx} style={{ padding: '10px 12px', background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: c.text, textTransform: 'uppercase' }}>{rec.courseCode}</span>
                              <span style={{ fontSize: 9, fontWeight: 700, color: c.text, textTransform: 'uppercase' }}>{rec.priority}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: 12, color: c.text, lineHeight: 1.5 }}>{rec.text}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ MY COURSES TAB ════════════════════════════════════════════════ */}
          {activeTab === 'my-courses' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }} className="animate-fade-in">
              <div>
                <p style={sectionTitle}>Enrolled Courses ({enrolledCourses.length})</p>
                {enrolledCourses.length === 0
                  ? <div style={emptyBox}>Not enrolled in any courses yet.</div>
                  : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                      {enrolledCourses.map(course => {
                        const metrics = getProgressMetrics(course.id);
                        const enrollment = enrollments.find(e => e.course_id === course.id);
                        const isCompleted = enrollment?.status === 'completed';
                        const canComplete = metrics.overall >= 100;
                        return (
                          <div key={course.id} style={{ ...card, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <div style={{ padding: '18px 20px', flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className="chip chip-indigo">{course.code}</span>
                                <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 3 }}>⏱ {course.duration || '3 Months'}</span>
                              </div>
                              <h4 style={{ margin: '10px 0 6px', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{course.title}</h4>
                              <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--text-2)' }}>{course.description || 'No description.'}</p>
                              
                              {/* Integrated progress bar */}
                              <div style={{ marginTop: 10 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11 }}>
                                  <span style={{ color: 'var(--text-3)' }}>Overall Progress</span>
                                  <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{metrics.overall}%</span>
                                </div>
                                <div style={{ height: 6, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${metrics.overall}%`, background: 'var(--accent)', borderRadius: 99 }} />
                                </div>
                              </div>
                            </div>
                            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', gap: 10 }}>
                              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setCourseDetailView(course)}>
                                Open Course <ArrowRight size={13} />
                              </button>
                              {isCompleted ? (
                                <button className="btn btn-secondary" style={{ flex: 1, borderColor: '#059669', color: '#059669', cursor: 'default', background: 'rgba(5, 150, 105, 0.08)' }} disabled>
                                  Completed ✓
                                </button>
                              ) : (
                                <button className={`btn ${canComplete ? 'btn-primary' : 'btn-secondary'}`}
                                  style={{ flex: 1, ...(canComplete ? { background: '#059669', borderColor: '#059669', color: '#fff' } : { opacity: 0.5, cursor: 'not-allowed' }) }}
                                  disabled={!canComplete}
                                  onClick={() => handleCompleteCourse(course.id)}>
                                  Complete Course
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                }
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div>
                    <p style={{ ...sectionTitle, marginBottom: 2 }}>Course Catalog</p>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-2)' }}>Browse and enroll in available courses.</p>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Filter courses..."
                      style={{ height: 36, paddingLeft: 32, paddingRight: 12, fontSize: 13, fontFamily: 'var(--font)', border: '1px solid var(--border-2)', borderRadius: 8, outline: 'none', background: 'var(--surface)', color: 'var(--text)', width: 200, boxSizing: 'border-box' }}
                      onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
                      onBlur={e => { e.target.style.borderColor = 'var(--border-2)'; e.target.style.boxShadow = 'none'; }} />
                  </div>
                </div>
                {filteredAvailableCourses.length === 0
                  ? <div style={emptyBox}>No available courses match your search.</div>
                  : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                      {filteredAvailableCourses.map(course => (
                        <div key={course.id} style={{ ...card, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                          <div style={{ padding: '18px 20px', flex: 1 }}>
                            <span className="chip chip-gray">{course.code}</span>
                            <h4 style={{ margin: '10px 0 6px', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{course.title}</h4>
                            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-2)' }}>{course.description || 'No description.'}</p>
                          </div>
                          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{course.fee > 0 ? `₹${course.fee}` : 'Free'}</span>
                              <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 3 }}>⏱ {course.duration || '3 Months'}</span>
                            </div>
                            <button className="btn btn-primary btn-sm" onClick={() => course.fee > 0 ? startCheckout(course) : handleEnroll(course.id)}>
                              {course.fee > 0 ? 'Enroll & Pay' : 'Enroll Free'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                }
              </div>
            </div>
          )}

          {/* ══ GRADES TAB ════════════════════════════════════════════════════ */}
          {activeTab === 'grades' && (
            <div className="animate-fade-in">
              {submissions.length === 0
                ? <div style={emptyBox}>No submissions evaluated yet. Submit assignments to see grades here.</div>
                : <div style={card}>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="table-clean">
                        <thead>
                          <tr><th>Assignment</th><th>Course</th><th>Submitted</th><th>Max</th><th>Marks</th><th>Feedback</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                          {submissions.map(sub => {
                            const maxMarks = sub.assignment?.max_marks || 100;
                            const obtained = sub.grade?.marks != null ? sub.grade.marks : '—';
                            const feedback = sub.grade?.feedback || 'No comments.';
                            return (
                              <tr key={sub.id}>
                                <td style={{ fontWeight: 600 }}>{sub.assignment?.title || 'Unknown'}</td>
                                <td><span className="chip chip-indigo">{sub.assignment?.course?.code || 'N/A'}</span></td>
                                <td style={{ fontSize: 12 }}>{new Date(sub.submitted_at).toLocaleDateString()}</td>
                                <td style={{ fontWeight: 600 }}>{maxMarks}</td>
                                <td style={{ fontWeight: 800, color: obtained !== '—' ? '#059669' : 'var(--text-3)', fontSize: 15 }}>{obtained}</td>
                                <td><span style={{ fontSize: 12, color: 'var(--text-2)', fontStyle: 'italic' }} title={feedback}>{feedback.length > 38 ? feedback.substring(0, 38) + '…' : feedback}</span></td>
                                <td><span className={`chip ${sub.status === 'graded' ? 'chip-green' : 'chip-indigo'}`}>{sub.status}</span></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
              }
            </div>
          )}

          {/* ══ QUIZZES TAB ═══════════════════════════════════════════════════ */}
          {activeTab === 'quizzes' && (
            <div className="animate-fade-in">
              {quizzes.length === 0
                ? <div style={emptyBox}>No quizzes published for your courses yet.</div>
                : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                    {quizzes.map(quiz => {
                      const attempt = quizAttempts.find(a => a.quiz_id === quiz.id);
                      const isDue = quiz.deadline ? new Date(quiz.deadline) > new Date() : true;
                      return (
                        <div key={quiz.id} style={{ ...card, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <div>
                              <span className="chip chip-indigo" style={{ marginBottom: 6 }}>{quiz.course?.code}</span>
                              <h4 style={{ margin: '6px 0 4px', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{quiz.title}</h4>
                              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-2)' }}>{quiz.description}</p>
                            </div>
                            <span className={`chip ${attempt ? 'chip-green' : isDue ? 'chip-indigo' : 'chip-red'}`} style={{ flexShrink: 0, marginLeft: 8 }}>
                              {attempt ? 'Done' : isDue ? 'Pending' : 'Expired'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 20, paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-2)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={13}/> {quiz.time_limit_minutes} min</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Trophy size={13}/> {quiz.max_marks} pts</span>
                          </div>
                          {attempt
                            ? <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--success-bg)', border: '1px solid #6ee7b7', borderRadius: 8 }}>
                                <span style={{ fontSize: 12, color: '#065f46' }}>Your score</span>
                                <span style={{ fontSize: 14, fontWeight: 700, color: '#059669' }}>{attempt.score} / {quiz.max_marks}</span>
                              </div>
                            : isDue
                              ? <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => startQuizAttempt(quiz)}>Start Quiz</button>
                              : <button className="btn btn-secondary" style={{ width: '100%', opacity: 0.5 }} disabled>Deadline Passed</button>
                          }
                        </div>
                      );
                    })}
                  </div>
              }
            </div>
          )}

          {/* ══ ATTENDANCE TAB ════════════════════════════════════════════════ */}
          {activeTab === 'attendance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fade-in">
              <div>
                <p style={sectionTitle}>Attendance by Course</p>
                {enrolledCourses.length === 0
                  ? <div style={emptyBox}>Not enrolled in any courses.</div>
                  : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                      {enrolledCourses.map(course => {
                        const stats = getCourseAttendanceStats(course.id);
                        const isLow = stats.pct < 75;
                        return (
                          <div key={course.id} style={{ ...card, padding: 20 }}>
                            <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>{course.code}</span>
                            <h5 style={{ margin: '4px 0 14px', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{course.title}</h5>
                            <div style={{ marginBottom: 12 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                                <span style={{ color: 'var(--text-2)' }}>Attendance Rate</span>
                                <span style={{ fontWeight: 700, color: isLow ? '#f59e0b' : '#059669' }}>{stats.pct}%</span>
                              </div>
                              <div style={{ height: 6, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${stats.pct}%`, background: isLow ? '#f59e0b' : '#10b981', borderRadius: 99, transition: 'width 0.4s' }} />
                              </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, paddingTop: 10, borderTop: '1px solid var(--border)', textAlign: 'center', fontSize: 11 }}>
                              <div><div style={{ color: 'var(--text-3)', marginBottom: 2 }}>Present</div><div style={{ fontWeight: 700, color: 'var(--text)' }}>{stats.present}</div></div>
                              <div><div style={{ color: 'var(--text-3)', marginBottom: 2 }}>Absent</div><div style={{ fontWeight: 700, color: '#ef4444' }}>{stats.absent}</div></div>
                              <div><div style={{ color: 'var(--text-3)', marginBottom: 2 }}>Total</div><div style={{ fontWeight: 700, color: 'var(--text)' }}>{stats.total}</div></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                }
              </div>

              <div style={card}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Attendance History</p>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  {attendanceLogs.length === 0
                    ? <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No attendance records found.</div>
                    : <table className="table-clean">
                        <thead><tr><th>Date</th><th>Course</th><th>Status</th></tr></thead>
                        <tbody>
                          {attendanceLogs.map(log => (
                            <tr key={log.id}>
                              <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{new Date(log.date).toLocaleDateString()}</td>
                              <td>{log.course?.title}</td>
                              <td><span className={`chip ${log.status === 'present' ? 'chip-green' : log.status === 'absent' ? 'chip-red' : 'chip-amber'}`}>{log.status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                  }
                </div>
              </div>
            </div>
          )}

          {/* ══ PAYMENTS TAB ══════════════════════════════════════════════════ */}
          {activeTab === 'payments' && (
            <div className="animate-fade-in">
              {payments.length === 0
                ? <div style={emptyBox}>No payment transactions found.</div>
                : <div style={card}>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="table-clean">
                        <thead><tr><th>Date</th><th>Course</th><th>Order ID</th><th>Amount</th><th>Method</th><th>Receipt</th><th>Status</th></tr></thead>
                        <tbody>
                          {payments.map(pay => (
                            <tr key={pay.id}>
                              <td style={{ fontSize: 12 }}>{new Date(pay.paid_at || pay.created_at).toLocaleString()}</td>
                              <td style={{ fontWeight: 600 }}>{pay.course?.title} <span style={{ fontSize: 11, color: 'var(--text-2)' }}>({pay.course?.code})</span></td>
                              <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-2)' }}>{pay.gateway_order_id}</td>
                              <td style={{ fontWeight: 700 }}>₹{pay.amount}</td>
                              <td style={{ fontSize: 12 }}>{pay.payment_method}</td>
                              <td>
                                <button type="button" onClick={() => setSelectedReceipt(pay)}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--accent)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)', padding: 0 }}>
                                  <FileDown size={13}/> Receipt
                                </button>
                              </td>
                              <td><span className="chip chip-green">{pay.status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
              }
            </div>
          )}

          {/* ══ CERTIFICATES TAB ══════════════════════════════════════════════ */}
          {activeTab === 'certificates' && (
            <div className="animate-fade-in">
              {certificates.length === 0 ? (
                <div style={emptyBox}>
                  <Award size={48} style={{ color: 'var(--text-3)', marginBottom: 12 }} />
                  <p style={{ margin: 0 }}>No course completion certificates earned yet.</p>
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-3)' }}>
                    Complete all course requirements and your instructor will issue your certificate!
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                  {certificates.map(cert => (
                    <div key={cert.id} style={{ ...card, padding: 20, display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="chip chip-green">Issued</span>
                          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{new Date(cert.issued_at).toLocaleDateString()}</span>
                        </div>
                        <h4 style={{ margin: '10px 0 4px', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                          {cert.course?.title || 'Course Certificate'}
                        </h4>
                        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--text-2)' }}>
                          Grade Earned: <strong>{cert.grade || 'A'}</strong>
                        </p>
                        <p style={{ margin: 0, fontSize: 11, fontFamily: 'monospace', color: 'var(--text-3)' }}>
                          ID: {cert.certificate_number}
                        </p>
                      </div>
                      <button className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: 10 }}
                        onClick={() => setSelectedCertificate(cert)}>
                        View & Print
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ COMMUNITY TAB ═════════════════════════════════════════════════ */}
          {activeTab === 'community' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {selectedThread ? (
                // Thread Detail View
                <div style={{ ...card, padding: 24 }} className="animate-fade-in">
                  <button className="btn btn-secondary btn-sm" style={{ marginBottom: 16 }} onClick={() => setSelectedThread(null)}>
                    ← Back to Discussions
                  </button>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 20 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span className="chip chip-indigo">{selectedThread.course?.code}</span>
                        {selectedThread.is_pinned && <span className="chip chip-amber">📌 Pinned</span>}
                      </div>
                      <h3 style={{ margin: '4px 0 8px', fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{selectedThread.title}</h3>
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)' }}>
                        Posted by <strong>{selectedThread.author?.full_name || 'Anonymous'}</strong> · {new Date(selectedThread.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6, background: 'var(--surface-2)', padding: 16, borderRadius: 10, border: '1px solid var(--border)', marginBottom: 24 }}>
                    {selectedThread.content}
                  </div>

                  {/* Replies List */}
                  <div>
                    <h4 style={{ ...sectionTitle, marginBottom: 14 }}>Replies ({discussionReplies.filter(r => r.discussion_id === selectedThread.id).length})</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                      {discussionReplies.filter(r => r.discussion_id === selectedThread.id).length === 0 ? (
                        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic' }}>No replies yet. Be the first to answer!</p>
                      ) : (
                        discussionReplies.filter(r => r.discussion_id === selectedThread.id).map(reply => (
                          <div key={reply.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 14, background: 'var(--surface)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11, color: 'var(--text-3)' }}>
                              <strong>{reply.author?.full_name || 'Anonymous'}</strong>
                              <span>{new Date(reply.created_at).toLocaleString()}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{reply.content}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Reply Input Box */}
                    <div style={{ display: 'flex', gap: 10 }}>
                      <input type="text" value={forumReplyInput} onChange={e => setForumReplyInput(e.target.value)}
                        placeholder="Type your reply here..."
                        style={{ flex: 1, height: 38, padding: '0 12px', fontSize: 13, fontFamily: 'var(--font)', border: '1px solid var(--border-2)', borderRadius: 8, outline: 'none', background: 'var(--surface)', color: 'var(--text)' }} />
                      <button className="btn btn-primary" onClick={handlePostReply}>
                        <Send size={14} /> Reply
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // Thread List
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Filter Course:</label>
                      <select value={forumSelectedCourse} onChange={e => setForumSelectedCourse(e.target.value)}
                        style={{ height: 36, padding: '0 12px', fontSize: 12, border: '1px solid var(--border-2)', borderRadius: 8, outline: 'none', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer' }}>
                        <option value="all">All Courses</option>
                        {enrolledCourses.map(c => (
                          <option key={c.id} value={c.id}>{c.title} ({c.code})</option>
                        ))}
                      </select>
                    </div>
                    <button className="btn btn-primary" onClick={() => setIsForumModalOpen(true)}>
                      + New Discussion
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {discussions
                      .filter(d => forumSelectedCourse === 'all' || d.course_id === forumSelectedCourse)
                      .sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0))
                      .length === 0 ? (
                      <div style={emptyBox}>No discussion threads in this course forum yet.</div>
                    ) : (
                      discussions
                        .filter(d => forumSelectedCourse === 'all' || d.course_id === forumSelectedCourse)
                        .sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0))
                        .map(thread => {
                          const replyCount = discussionReplies.filter(r => r.discussion_id === thread.id).length;
                          return (
                            <div key={thread.id} style={{ ...card, padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'transform 0.15s' }}
                              onClick={() => setSelectedThread(thread)}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                  <span className="chip chip-indigo">{thread.course?.code}</span>
                                  {thread.is_pinned && <span className="chip chip-amber">📌 Pinned</span>}
                                </div>
                                <h4 style={{ margin: '4px 0 6px', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{thread.title}</h4>
                                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)' }}>
                                  Posted by {thread.author?.full_name || 'Anonymous'} · {new Date(thread.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-3)', fontSize: 12 }}>
                                <MessageSquare size={14} /> {replyCount} replies
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ ACHIEVEMENTS TAB ══════════════════════════════════════════════ */}
          {activeTab === 'achievements' && (
            <div className="animate-fade-in">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {[
                  { icon: <Sparkles size={22} />, title: 'Fast Starter',       desc: 'Completed first module within 2 hours', color: '#d97706', bg: '#fffbeb' },
                  { icon: <Flame size={22} />,    title: 'Consistent Learner', desc: 'Maintained a 5-day study streak',       color: '#dc2626', bg: '#fef2f2' },
                  { icon: <Award size={22} />,    title: 'Graded Specialist',  desc: 'Scored in graded assignments',          color: 'var(--accent)', bg: 'var(--accent-bg)' },
                ].map((badge, i) => (
                  <div key={i} style={{ ...card, padding: '24px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 14, background: badge.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: badge.color }}>
                      {badge.icon}
                    </div>
                    <div>
                      <h5 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{badge.title}</h5>
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{badge.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ STUDENT CHAT TAB ════════════════════════════════════════════ */}
          {activeTab === 'chat' && (
            <div className="animate-fade-in" style={{ display: 'flex', gap: 20, height: 'calc(100vh - 240px)', minHeight: 480 }}>
              {/* Left Pane: Classmates list */}
              <div style={{ ...card, width: 300, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                {/* Search Bar */}
                <div style={{ padding: 14, borderBottom: '1px solid var(--border)', position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
                  <input type="text" value={chatSearchQuery} onChange={e => setChatSearchQuery(e.target.value)}
                    placeholder="Search classmates..."
                    style={{ width: '100%', height: 36, paddingLeft: 32, paddingRight: 12, fontSize: 13, fontFamily: 'var(--font)', border: '1px solid var(--border-2)', borderRadius: 8, outline: 'none', background: 'var(--surface)', color: 'var(--text)', boxSizing: 'border-box' }}
                    onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border-2)'; e.target.style.boxShadow = 'none'; }} />
                </div>
                {/* Roster list */}
                <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
                  {/* Cohort Group Channels at the Top */}
                  {enrollments.filter(e => e.cohort).map(e => {
                    const ch = e.cohort;
                    const isActive = activeChatStudent?.id === ch.id && activeChatStudent?.isCohortChannel;
                    return (
                      <button key={`cohort-ch-${ch.id}`} onClick={() => setActiveChatStudent({
                        id: ch.id,
                        full_name: ch.name,
                        email: `Class Group Channel · ${e.course?.code || ''}`,
                        isCohortChannel: true,
                        last_login: null
                      })}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '12px 16px',
                          background: isActive ? 'var(--accent-bg)' : 'transparent',
                          border: 'none',
                          borderLeft: isActive ? '4px solid var(--accent)' : '4px solid transparent',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.2s',
                          boxSizing: 'border-box',
                          borderBottom: '1px solid var(--border)'
                        }}
                        onMouseEnter={e => {
                          if (!isActive) e.currentTarget.style.background = 'var(--surface-2)';
                        }}
                        onMouseLeave={e => {
                          if (!isActive) e.currentTarget.style.background = 'transparent';
                        }}>
                        {/* Group Icon Avatar */}
                        <div style={{
                          width: 38,
                          height: 38,
                          borderRadius: '50%',
                          background: isActive ? 'var(--accent)' : 'var(--accent-bg)',
                          color: isActive ? '#fff' : 'var(--accent-text)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: 14,
                          flexShrink: 0
                        }}>
                          🏫
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                            {ch.name}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                            Class Group Channel
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {chatStudents.filter(s => s.full_name.toLowerCase().includes(chatSearchQuery.toLowerCase())).length === 0 ? (
                    enrollments.filter(e => e.cohort).length === 0 && (
                      <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>
                        No classmates or group channels found.
                      </div>
                    )
                  ) : (
                    chatStudents.filter(s => s.full_name.toLowerCase().includes(chatSearchQuery.toLowerCase())).map(student => {
                      const isActive = activeChatStudent?.id === student.id && !activeChatStudent?.isCohortChannel;
                      const userInitials = student.full_name
                        ? student.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                        : 'U';
                      
                      // Calculate active status color
                      const isOnline = student.last_login && (new Date() - new Date(student.last_login)) < 15 * 60 * 1000;
                      
                      return (
                        <button key={student.id} onClick={() => setActiveChatStudent(student)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '10px 16px',
                            background: isActive ? 'var(--accent-bg)' : 'transparent',
                            border: 'none',
                            borderLeft: isActive ? '4px solid var(--accent)' : '4px solid transparent',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s',
                            boxSizing: 'border-box',
                          }}
                          onMouseEnter={e => {
                            if (!isActive) e.currentTarget.style.background = 'var(--surface-2)';
                          }}
                          onMouseLeave={e => {
                            if (!isActive) e.currentTarget.style.background = 'transparent';
                          }}>
                          {/* Avatar */}
                          <div style={{
                            width: 38,
                            height: 38,
                            borderRadius: '50%',
                            background: isActive ? 'var(--accent)' : 'var(--surface-3)',
                            color: isActive ? '#fff' : 'var(--text)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: 12,
                            position: 'relative',
                            flexShrink: 0
                          }}>
                            {userInitials}
                            {/* Online dot indicator */}
                            <span style={{
                              position: 'absolute',
                              bottom: 1,
                              right: 1,
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: isOnline ? '#10b981' : '#94a3b8',
                              border: '2px solid var(--surface)'
                            }} />
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 6 }}>
                              {student.full_name}
                              {student.role === 'teacher' && <span className="chip chip-green" style={{ fontSize: 9, padding: '2px 6px', margin: 0, height: 'fit-content' }}>Instructor</span>}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-2)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                              {student.email}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Pane: Chat Window */}
              <div style={{ ...card, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {activeChatStudent ? (
                  <>
                    {/* Chat Header */}
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface)' }}>
                      <div style={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        background: 'var(--accent-bg)',
                        color: 'var(--accent-text)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 12,
                      }}>
                        {activeChatStudent.isCohortChannel ? '🏫' : activeChatStudent.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {activeChatStudent.full_name}
                          {activeChatStudent.role === 'teacher' && <span className="chip chip-green" style={{ fontSize: 9, padding: '2px 6px', margin: 0, height: 'fit-content' }}>Instructor</span>}
                        </h4>
                        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-2)' }}>
                          {activeChatStudent.email}{!activeChatStudent.isCohortChannel && ` · ${activeChatStudent.last_login ? `Active ${new Date(activeChatStudent.last_login).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 'Offline'}`}
                        </p>
                      </div>
                    </div>

                    {/* Messages Area */}
                    <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', background: 'var(--bg)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {chatMessages.length === 0 ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--text-3)' }}>
                          <MessageSquare size={32} style={{ opacity: 0.5 }} />
                          <p style={{ margin: 0, fontSize: 13 }}>No messages in this conversation yet.</p>
                          <p style={{ margin: 0, fontSize: 11, opacity: 0.8 }}>Send a message below to start chatting!</p>
                        </div>
                      ) : (
                        chatMessages.map(msg => {
                          const isMe = msg.sender_id === profile.id;
                          return (
                            <div key={msg.id} style={{
                              display: 'flex',
                              justifyContent: isMe ? 'flex-end' : 'flex-start',
                              width: '100%',
                            }}>
                              <div style={{
                                maxWidth: '70%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: isMe ? 'flex-end' : 'flex-start',
                                gap: 4,
                              }}>
                                {!isMe && activeChatStudent.isCohortChannel && (
                                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', padding: '0 4px', marginBottom: 2 }}>
                                    {chatStudents.find(s => s.id === msg.sender_id)?.full_name || 'Classmate'}
                                  </span>
                                )}
                                <div style={{
                                  padding: '10px 14px',
                                  borderRadius: isMe ? '12px 12px 0 12px' : '12px 12px 12px 0',
                                  background: isMe ? 'var(--accent)' : 'var(--surface)',
                                  color: isMe ? '#ffffff' : 'var(--text)',
                                  fontSize: 13,
                                  fontWeight: 500,
                                  lineHeight: 1.5,
                                  boxShadow: 'var(--shadow-sm)',
                                  border: isMe ? 'none' : '1px solid var(--border)',
                                  wordBreak: 'break-word',
                                  whiteSpace: 'pre-wrap',
                                }}>
                                  {msg.message_text}
                                </div>
                                <span style={{ fontSize: 10, color: 'var(--text-3)', padding: '0 4px' }}>
                                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input Bar */}
                    <form onSubmit={handleSendMessage} style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', gap: 10 }}>
                      <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                        placeholder="Type a message..."
                        style={{ flex: 1, height: 40, padding: '0 14px', fontSize: 13, fontFamily: 'var(--font)', border: '1px solid var(--border-2)', borderRadius: 8, outline: 'none', background: 'var(--surface)', color: 'var(--text)', boxSizing: 'border-box' }}
                        onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
                        onBlur={e => { e.target.style.borderColor = 'var(--border-2)'; e.target.style.boxShadow = 'none'; }} />
                      <button type="submit" className="btn btn-primary" style={{ height: 40, padding: '0 20px' }}>
                        Send
                      </button>
                    </form>
                  </>
                ) : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, color: 'var(--text-3)', padding: 40, textAlign: 'center' }}>
                    <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                      <MessageSquare size={32} />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Your Conversations</h4>
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-2)', maxWidth: 280, lineHeight: 1.6 }}>
                        Select a classmate from the roster on the left to start a real-time secure conversation.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ══ MODALS ════════════════════════════════════════════════════════════ */}

      {/* Submit Assignment Modal */}
      <Modal isOpen={isSubmitModalOpen} onClose={() => setIsSubmitModalOpen(false)} title={`Submit: ${selectedAssignment?.title}`} size="md">
        <form onSubmit={handleSubmitAssignment} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)' }}>Course: <strong style={{ color: 'var(--text)' }}>{selectedAssignment?.course?.code}</strong></p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)' }}>Deadline: <strong style={{ color: 'var(--text)' }}>{selectedAssignment && new Date(selectedAssignment.deadline).toLocaleString()}</strong></p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)' }}>Max Points: <strong style={{ color: 'var(--accent)' }}>{selectedAssignment?.max_marks}</strong></p>
          </div>
          <div>
            <label className="label">Upload Submission (PDF, ZIP, Image)</label>
            <FileUpload folderPath="submissions" allowedTypes={['pdf','zip','png','jpg','doc','docx']}
              onUploadSuccess={url => setSubmitFileUrl(url)}
              onUploadError={err => setAlert({ type: 'error', message: err })} />
            {submitFileUrl && <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>✓ File uploaded successfully.</p>}
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>Submit Assignment</button>
        </form>
      </Modal>

      {/* Checkout Modal */}
      <Modal isOpen={isCheckoutModalOpen} onClose={() => setIsCheckoutModalOpen(false)} title={`Enroll: ${selectedCheckoutCourse?.title}`} size="sm">
        <form onSubmit={handleProcessPayment} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-2)' }}>Course Code</span>
              <span style={{ fontWeight: 650 }}>{selectedCheckoutCourse?.code}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border)', fontSize: 15 }}>
              <span style={{ color: 'var(--text-2)' }}>Total Payable Fee</span>
              <span style={{ fontWeight: 800, color: 'var(--accent)' }}>₹{selectedCheckoutCourse?.fee}</span>
            </div>
          </div>
          <div style={{ textAlign: 'center', padding: '10px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'var(--success-bg)', border: '1px solid #a7f3d0', borderRadius: 99, color: '#065f46', fontSize: 11, fontWeight: 700 }}>
              ✓ Razorpay Secured Payment
            </div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
              Clicking the button below will securely open the Razorpay payment window to complete your transaction.
            </p>
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>Pay with Razorpay</button>
        </form>
      </Modal>

      {/* Video Player Modal */}
      <Modal isOpen={!!activeVideoUrl} onClose={() => setActiveVideoUrl(null)} title="Lecture Recording" size="lg">
        <div style={{ aspectRatio: '16/9', background: '#000', borderRadius: 10, overflow: 'hidden' }}>
          {activeVideoUrl && (activeVideoUrl.includes('youtube.com') || activeVideoUrl.includes('youtu.be')) ? (
            <iframe style={{ width: '100%', height: '100%', border: 'none' }}
              src={`https://www.youtube.com/embed/${activeVideoUrl.includes('youtube.com') ? activeVideoUrl.split('v=')[1]?.split('&')[0] : activeVideoUrl.split('/').pop()}`}
              title="Lecture" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          ) : activeVideoUrl && activeVideoUrl.includes('vimeo.com') ? (
            <iframe style={{ width: '100%', height: '100%', border: 'none' }}
              src={`https://player.vimeo.com/video/${activeVideoUrl.split('/').pop()}`}
              title="Lecture" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
          ) : activeVideoUrl ? (
            <video src={activeVideoUrl} style={{ width: '100%', height: '100%' }} controls autoPlay />
          ) : null}
        </div>
      </Modal>

      {/* Receipt Modal */}
      <Modal isOpen={!!selectedReceipt} onClose={() => setSelectedReceipt(null)} title="Payment Receipt" size="md">
        {selectedReceipt && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div id="printable-invoice" style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ padding: '4px 10px', background: 'var(--accent)', borderRadius: 6, color: '#fff', fontWeight: 800, fontSize: 13 }}>LMS</div>
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Academy</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--text-3)' }}>Official Payment Receipt</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Receipt #</p>
                  <p style={{ margin: 0, fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: 'var(--accent)' }}>INV-{selectedReceipt.id?.substring(0, 8).toUpperCase() || 'N/A'}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Billed To</p>
                  <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{profile?.full_name}</p>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-2)' }}>{profile?.email}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Date</p>
                  <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{new Date(selectedReceipt.paid_at || selectedReceipt.created_at).toLocaleDateString()}</p>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-2)' }}>{new Date(selectedReceipt.paid_at || selectedReceipt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 16, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase' }}>Course</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 10, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: 12 }}>
                      <p style={{ margin: '0 0 2px', fontWeight: 600, color: 'var(--text)' }}>{selectedReceipt.course?.title}</p>
                      <p style={{ margin: 0, fontSize: 11, color: 'var(--text-3)', fontFamily: 'monospace' }}>{selectedReceipt.course?.code}</p>
                    </td>
                    <td style={{ padding: 12, textAlign: 'right', fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>₹{selectedReceipt.amount}</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, background: 'var(--success-bg)', border: '1px solid #6ee7b7', borderRadius: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#065f46' }}>✓ Payment Successful · {selectedReceipt.payment_method || 'UPI'}</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#059669' }}>₹{selectedReceipt.amount}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => {
                const printContents = document.getElementById('printable-invoice').innerHTML;
                const w = window.open('', '_blank');
                w.document.write(`<html><head><title>Receipt - LMS</title><style>body{font-family:system-ui,sans-serif;padding:40px;color:#1e293b;background:#fff}#inv{max-width:560px;margin:auto;border:1px solid #e2e8f0;padding:30px;border-radius:12px}table{width:100%;border-collapse:collapse}th,td{padding:10px 12px}p{margin:0}</style></head><body><div id="inv">${printContents}</div><script>window.onload=function(){window.print();window.close()}<\/script></body></html>`);
                w.document.close();
              }}>
                <FileDown size={15} /> Print / Save PDF
              </button>
              <button className="btn btn-secondary" onClick={() => setSelectedReceipt(null)}>Close</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Certificate Viewer Modal */}
      <Modal isOpen={!!selectedCertificate} onClose={() => setSelectedCertificate(null)} title="Course Certificate" size="lg">
        {selectedCertificate && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div id="printable-certificate" style={{
              background: '#fff',
              border: '20px double #c5a880',
              borderRadius: 8,
              padding: '40px 50px',
              textAlign: 'center',
              color: '#1a1a1a',
              fontFamily: '"Georgia", serif',
              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05)',
              position: 'relative'
            }}>
              <div style={{ position: 'absolute', top: 10, left: 10, right: 10, bottom: 10, border: '1px solid #c5a880', pointerEvents: 'none' }} />
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 20 }}>
                <span style={{ fontSize: 24, letterSpacing: '0.15em', color: '#c5a880', fontWeight: 600 }}>CERTIFICATE OF COMPLETION</span>
                <span style={{ height: '2px', width: '80px', background: '#c5a880' }} />
              </div>
              
              <p style={{ fontStyle: 'italic', fontSize: 15, margin: '20px 0 10px', color: '#666' }}>This certifies that</p>
              <h2 style={{ fontSize: 28, fontWeight: 700, margin: '10px 0', color: '#111', textDecoration: 'underline', textDecorationColor: '#c5a880' }}>
                {profile?.full_name}
              </h2>
              
              <p style={{ fontSize: 14, lineHeight: 1.6, margin: '10px auto', maxWidth: 460, color: '#555' }}>
                has successfully completed all academic requirements for the course
              </p>
              
              <h3 style={{ fontSize: 20, fontWeight: 700, margin: '15px 0', color: '#b45309' }}>
                {selectedCertificate.course?.title} ({selectedCertificate.course?.code})
              </h3>
              
              <p style={{ fontSize: 13, color: '#666', margin: '15px 0' }}>
                with a final performance grade of <strong style={{ color: '#111' }}>{selectedCertificate.grade || 'A'}</strong>
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 40, borderTop: '1px solid #eee', paddingTop: 20 }}>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ margin: '0 0 2px', fontSize: 10, textTransform: 'uppercase', color: '#999', letterSpacing: '0.05em' }}>Verification Code</p>
                  <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#c5a880' }}>
                    {selectedCertificate.certificate_number}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 2px', fontSize: 10, textTransform: 'uppercase', color: '#999', letterSpacing: '0.05em' }}>Issued On</p>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
                    {new Date(selectedCertificate.issued_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => {
                const printContents = document.getElementById('printable-certificate').innerHTML;
                const w = window.open('', '_blank');
                w.document.write(`<html><head><title>Certificate - ${profile.full_name}</title><style>body{display:flex;align-items:center;justify-content:center;height:90vh;font-family:"Georgia",serif;margin:0;background:#fafafa}#cert{width:700px;padding:30px;background:#fff;border:20px double #c5a880;border-radius:8px;text-align:center;position:relative}hr{border:none;height:1px;background:#e2e8f0;margin:20px 0}h2{font-size:32px;margin:10px 0;text-decoration:underline;text-decoration-color:#c5a880}</style></head><body><div id="cert">${printContents}</div><script>window.onload=function(){window.print();window.close()}<\/script></body></html>`);
                w.document.close();
              }}>
                Print Certificate
              </button>
              <button className="btn btn-secondary" onClick={() => setSelectedCertificate(null)}>Close</button>
            </div>
          </div>
        )}
      </Modal>

      {/* New Forum Discussion Thread Modal */}
      <Modal isOpen={isForumModalOpen} onClose={() => setIsForumModalOpen(false)} title="Start a New Discussion" size="md">
        <form onSubmit={handlePostThread} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Topic Title</label>
            <input type="text" value={newForumTitle} onChange={e => setNewForumTitle(e.target.value)}
              placeholder="e.g. Help with normalization assignment" required
              style={{ width: '100%', height: 38, padding: '0 12px', fontSize: 13, fontFamily: 'var(--font)', border: '1px solid var(--border-2)', borderRadius: 8, outline: 'none', background: 'var(--surface)', color: 'var(--text)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Details / Description</label>
            <textarea value={newForumContent} onChange={e => setNewForumContent(e.target.value)} rows={5}
              placeholder="Describe your issue or what you would like to discuss..." required
              style={{ width: '100%', padding: 12, fontSize: 13, fontFamily: 'var(--font)', border: '1px solid var(--border-2)', borderRadius: 8, outline: 'none', background: 'var(--surface)', color: 'var(--text)', resize: 'vertical' }} />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>Post Discussion</button>
        </form>
      </Modal>
    </div>
  );
};

export default StudentDashboard;
