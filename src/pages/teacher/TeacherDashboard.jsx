import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import {
  BookOpen,
  Users,
  Award,
  Clock,
  Plus,
  Search,
  ExternalLink,
  CheckCircle,
  FileText,
  Edit2,
  Trash2,
  Calendar,
  X,
  FileDown,
  AlertCircle,
  Video,
  Play,
  Tv,
  Trophy,
  Check,
  ChevronRight,
  MessageSquare,
  Send
} from 'lucide-react';
import Modal from '../../components/Modal';
import FileUpload from '../../components/FileUpload';
import Alert from '../../components/Alert';
import LoadingSpinner from '../../components/LoadingSpinner';

const TeacherDashboard = ({ activeTab }) => {
  const { profile } = useAuth();
  
  // ── State Variables ────────────────────────────────────────────────────────
  const [courses, setCourses] = useState([]);
  const [teacherCohorts, setTeacherCohorts] = useState([]);
  const [selectedCohortFilter, setSelectedCohortFilter] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [materials, setMaterials] = useState([]);

  // Discussions & Forums State
  const [discussions, setDiscussions] = useState([]);
  const [discussionReplies, setDiscussionReplies] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [newForumTitle, setNewForumTitle] = useState('');
  const [newForumContent, setNewForumContent] = useState('');
  const [isForumModalOpen, setIsForumModalOpen] = useState(false);
  const [forumReplyInput, setForumReplyInput] = useState('');
  const [forumSelectedCourse, setForumSelectedCourse] = useState('all');

  // Chat State
  const [chatStudents, setChatStudents] = useState([]);
  const [activeChatStudent, setActiveChatStudent] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSearchQuery, setChatSearchQuery] = useState('');

  // Certificates State
  const [certificates, setCertificates] = useState([]);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [selectedCertStudent, setSelectedCertStudent] = useState(null);
  const [selectedCertEnrollment, setSelectedCertEnrollment] = useState(null);
  const [certGrade, setCertGrade] = useState('A+');
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Modals state
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);

  const [newMaterial, setNewMaterial] = useState({
    title: '',
    description: '',
    file_url: '',
    file_type: 'pdf',
    file_size: 0
  });

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [courseDetailView, setCourseDetailView] = useState(null);

  // Live classes and recordings states
  const [liveClasses, setLiveClasses] = useState([]);
  const [recordedClasses, setRecordedClasses] = useState([]);
  const [courseSubTab, setCourseSubTab] = useState('curriculum');

  // Live classes and recordings modals
  const [isLiveClassModalOpen, setIsLiveClassModalOpen] = useState(false);
  const [isRecordedClassModalOpen, setIsRecordedClassModalOpen] = useState(false);

  // Form states for Live and Recorded Classes
  const [newLiveClass, setNewLiveClass] = useState({
    title: '',
    description: '',
    meeting_link: '',
    scheduled_at: '',
    duration_minutes: 60,
    status: 'upcoming'
  });

  const [newRecordedClass, setNewRecordedClass] = useState({
    title: '',
    description: '',
    video_url: '',
    duration_minutes: 45
  });

  // Attendance Register states
  const [selectedAttendanceCourse, setSelectedAttendanceCourse] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMap, setAttendanceMap] = useState({});

  // Form states
  const [newCourse, setNewCourse] = useState({
    title: '',
    code: '',
    description: '',
    category: '',
    fee: 0,
    duration: '3 Months',
    status: 'active'
  });

  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    deadline: '',
    max_marks: 100,
    file_url: ''
  });

  const [gradeForm, setGradeForm] = useState({
    marks: '',
    feedback: ''
  });

  const [newQuiz, setNewQuiz] = useState({
    course_id: '',
    title: '',
    description: '',
    time_limit_minutes: 30,
    max_marks: 10,
    deadline: ''
  });

  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correct_answer: 0,
    marks: 5
  });

  const [searchQuery, setSearchQuery] = useState('');

  // ── Load Teacher Specific Data ─────────────────────────────────────────────
  const loadTeacherData = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      // 1. Fetch courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('teacher_id', profile.id);
      
      if (coursesError) throw coursesError;
      setCourses(coursesData || []);

      if (coursesData && coursesData.length > 0) {
        const courseIds = coursesData.map(c => c.id);

        // Set default course for attendance tab
        if (!selectedAttendanceCourse) {
          setSelectedAttendanceCourse(coursesData[0]);
        }

        // 2. Fetch assignments
        const { data: assignmentsData, error: assignError } = await supabase
          .from('assignments')
          .select('*')
          .in('course_id', courseIds);
        if (assignError) throw assignError;
        setAssignments(assignmentsData || []);

        // 3. Fetch enrollments with student users
        const { data: enrollData, error: enrollError } = await supabase
          .from('enrollments')
          .select('*, student:users(*), course:courses(*)')
          .in('course_id', courseIds);
        if (enrollError) throw enrollError;

        let enrichedEnrollments = enrollData || [];
        const cohortIds = enrichedEnrollments.map(e => e.cohort_id).filter(Boolean);
        if (cohortIds.length > 0) {
          try {
            const { data: cohortsData } = await supabase
              .from('cohorts').select('*').in('id', cohortIds);
            
            if (cohortsData && cohortsData.length > 0) {
              enrichedEnrollments = enrichedEnrollments.map(e => {
                const ch = cohortsData.find(c => c.id === e.cohort_id) || null;
                return { ...e, cohort: ch };
              });
            }
          } catch (cErr) {
            console.warn('Graceful degradation: Teacher cohorts join failed.', cErr.message);
          }
        }
        setEnrollments(enrichedEnrollments);

        // 4. Fetch submissions with grades joined
        const { data: subData, error: subError } = await supabase
          .from('submissions')
          .select('*, student:users(*), assignment:assignments(*), grades(*)')
          .in('assignment_id', assignmentsData.map(a => a.id));
        if (subError) throw subError;

        const subsWithGrades = (subData || []).map(sub => {
          const grade = sub.grades?.[0] || null;
          return {
            ...sub,
            grade
          };
        });
        setSubmissions(subsWithGrades);

        // 5. Fetch quizzes
        const { data: quizzesData, error: quizzesError } = await supabase
          .from('quizzes')
          .select('*, course:courses(*)')
          .eq('teacher_id', profile.id);
        if (quizzesError) throw quizzesError;
        setQuizzes(quizzesData || []);

        // 6. Fetch quiz questions
        if (quizzesData && quizzesData.length > 0) {
          const { data: questionsData, error: questionsError } = await supabase
            .from('quiz_questions')
            .select('*')
            .in('quiz_id', quizzesData.map(q => q.id));
          if (questionsError) throw questionsError;
          setQuizQuestions(questionsData || []);
        } else {
          setQuizQuestions([]);
        }

        // 7. Fetch quiz attempts
        const { data: attemptsData, error: attemptsError } = await supabase
          .from('quiz_attempts')
          .select('*, student:users(*), quiz:quizzes(*)');
        if (attemptsError) throw attemptsError;
        setQuizAttempts(attemptsData || []);

        // 8. Fetch attendance logs
        const { data: attData, error: attError } = await supabase
          .from('attendance')
          .select('*')
          .in('course_id', courseIds);
        if (attError) throw attError;
        setAttendanceLogs(attData || []);

        // 9. Fetch learning materials
        const { data: materialsData, error: matError } = await supabase
          .from('materials')
          .select('*')
          .in('course_id', courseIds);
        if (matError) throw matError;
        setMaterials(materialsData || []);

        // 10. Fetch live classes
        const { data: liveData, error: liveError } = await supabase
          .from('live_classes')
          .select('*')
          .in('course_id', courseIds);
        if (liveError) throw liveError;
        setLiveClasses(liveData || []);

        // 11. Fetch recorded classes
        const { data: recData, error: recError } = await supabase
          .from('recorded_classes')
          .select('*')
          .in('course_id', courseIds);
        if (recError) throw recError;
        setRecordedClasses(recData || []);

        // 12. Fetch Cohorts for teacher's courses
        const { data: cohortsData, error: cohortsError } = await supabase
          .from('cohorts')
          .select('*, course:courses(*), center:training_centers(*)')
          .in('course_id', courseIds);
        if (!cohortsError) {
          setTeacherCohorts(cohortsData || []);
        } else {
          console.error('Error fetching cohorts:', cohortsError.message);
        }

        // 13. Fetch discussions for teacher's courses
        const { data: discData, error: discError } = await supabase
          .from('discussions')
          .select('*, course:courses(*), author:users(*)')
          .in('course_id', courseIds);
        if (!discError) {
          setDiscussions(discData || []);
        }

        // 14. Fetch all discussion replies
        const { data: repliesData, error: repliesError } = await supabase
          .from('discussion_replies')
          .select('*, author:users(*)');
        if (!repliesError) {
          setDiscussionReplies(repliesData || []);
        }

        // 15. Fetch certificates issued for teacher's courses
        const { data: certsData, error: certsError } = await supabase
          .from('certificates')
          .select('*, course:courses(*), student:users(*)')
          .in('course_id', courseIds);
        if (!certsError) {
          setCertificates(certsData || []);
        }

      } else {
        setAssignments([]);
        setEnrollments([]);
        setSubmissions([]);
        setQuizzes([]);
        setQuizQuestions([]);
        setQuizAttempts([]);
        setAttendanceLogs([]);
        setMaterials([]);
        setLiveClasses([]);
        setRecordedClasses([]);
        setTeacherCohorts([]);
        setDiscussions([]);
        setDiscussionReplies([]);
        setCertificates([]);
      }
    } catch (err) {
      console.error('Error loading teacher data:', err.message);
      setAlert({ type: 'error', message: `Database error: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeacherData();
  }, [profile]);

  // Sync attendance map when course or date changes
  useEffect(() => {
    if (selectedAttendanceCourse && enrollments.length > 0) {
      const courseStudents = enrollments.filter(e => e.course_id === selectedAttendanceCourse.id);
      const tempMap = {};
      courseStudents.forEach(e => {
        const studentId = e.student_id;
        const logged = attendanceLogs.find(
          log => log.course_id === selectedAttendanceCourse.id && 
                 log.student_id === studentId && 
                 log.date === attendanceDate
        );
        tempMap[studentId] = logged ? logged.status : 'present';
      });
      setAttendanceMap(tempMap);
    }
  }, [selectedAttendanceCourse, attendanceDate, enrollments, attendanceLogs]);

  // ── Chat Polling & Forum Loading Triggers ──────────────────────────────────
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

  // ── Roster Chat Functions ──────────────────────────────────────────────────
  const loadChatStudents = async () => {
    if (!profile) return;
    try {
      const { data, error } = await supabase.from('users').select('*').eq('role', 'student');
      if (error) throw error;
      setChatStudents(data || []);
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
           const name = senderUser ? senderUser.full_name : 'Student';
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

  // ── Forum / Community Functions ────────────────────────────────────────────
  const handlePostThread = async (e) => {
    e.preventDefault();
    if (!newForumTitle || !newForumContent) {
      setAlert({ type: 'error', message: 'Please fill in both the title and content fields.' });
      return;
    }
    
    const courseId = forumSelectedCourse === 'all' ? (courses[0]?.id || '') : forumSelectedCourse;
    if (!courseId) {
      setAlert({ type: 'error', message: 'You must have at least one active course to start a discussion.' });
      return;
    }
    
    try {
      const { error } = await supabase.from('discussions').insert({
        course_id: courseId,
        author_id: profile.id,
        title: newForumTitle,
        content: newForumContent,
        is_pinned: true // Instructors can pin by default
      });
      if (error) throw error;
      setAlert({ type: 'success', message: 'Instructor discussion thread posted!' });
      setNewForumTitle('');
      setNewForumContent('');
      setIsForumModalOpen(false);
      loadTeacherData();
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
      loadTeacherData();
    } catch (err) {
      setAlert({ type: 'error', message: `Failed to post reply: ${err.message}` });
    }
  };

  const handleTogglePinThread = async (thread) => {
    try {
      const { error } = await supabase.from('discussions')
        .update({ is_pinned: !thread.is_pinned })
        .eq('id', thread.id);
      if (error) throw error;
      setAlert({ type: 'success', message: thread.is_pinned ? 'Thread unpinned successfully.' : 'Thread pinned successfully.' });
      if (selectedThread?.id === thread.id) {
        setSelectedThread(prev => ({ ...prev, is_pinned: !thread.is_pinned }));
      }
      loadTeacherData();
    } catch (err) {
      setAlert({ type: 'error', message: `Failed to update thread pin: ${err.message}` });
    }
  };

  const handleDeleteThread = async (threadId) => {
    if (!window.confirm('Are you sure you want to permanently delete this discussion thread and all its replies?')) return;
    try {
      await supabase.from('discussion_replies').delete().eq('discussion_id', threadId);
      const { error } = await supabase.from('discussions').delete().eq('id', threadId);
      if (error) throw error;
      setAlert({ type: 'success', message: 'Discussion thread deleted.' });
      setSelectedThread(null);
      loadTeacherData();
    } catch (err) {
      setAlert({ type: 'error', message: `Failed to delete thread: ${err.message}` });
    }
  };

  // ── Certificate Issuance ───────────────────────────────────────────────────
  const handleIssueCertificate = async (e) => {
    e.preventDefault();
    if (!selectedCertStudent || !certGrade) {
      setAlert({ type: 'error', message: 'Student and Grade are required fields.' });
      return;
    }
    
    const studentEnrollment = selectedCertEnrollment || enrollments.find(e => e.student_id === selectedCertStudent.id);
    if (!studentEnrollment) {
      setAlert({ type: 'error', message: 'No enrollment found for this student.' });
      return;
    }
    
    try {
      const certNum = `LMS-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}A`;
      const { error } = await supabase.from('certificates').insert({
        student_id: selectedCertStudent.id,
        course_id: studentEnrollment.course_id,
        certificate_number: certNum,
        grade: certGrade,
        issued_at: new Date().toISOString()
      });
      
      if (error) throw error;
      
      setAlert({ type: 'success', message: `Certificate successfully issued for ${selectedCertStudent.full_name}!` });
      setIsCertModalOpen(false);
      
      await triggerNotification(
        selectedCertStudent.id,
        'Course Certificate Earned!',
        `Congratulations! You have been awarded a Completion Certificate for "${studentEnrollment.course?.title || 'Course'}" with grade ${certGrade}.`,
        'success',
        '/student'
      );
      
      loadTeacherData();
    } catch (err) {
      setAlert({ type: 'error', message: `Failed to issue certificate: ${err.message}` });
    }
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  const triggerNotification = async (userId, title, message, type = 'info', link = '') => {
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
          link
        });
    } catch (err) {
      console.error('Failed to trigger notification:', err.message);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!newCourse.title || !newCourse.code) {
      setAlert({ type: 'error', message: 'Title and Course Code are required fields.' });
      return;
    }
    try {
      const { data, error } = await supabase
        .from('courses')
        .insert({
          ...newCourse,
          teacher_id: profile.id
        })
        .select();

      if (error) throw error;

      setCourses(prev => [...prev, ...(data || [])]);
      setAlert({ type: 'success', message: `Course "${newCourse.title}" successfully created.` });
      setIsCourseModalOpen(false);
      setNewCourse({ title: '', code: '', description: '', category: '', fee: 0, duration: '3 Months', status: 'active' });
    } catch (err) {
      setAlert({ type: 'error', message: `Failed to create course: ${err.message}` });
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!newAssignment.title || !newAssignment.deadline || !selectedCourse) {
      setAlert({ type: 'error', message: 'Title and Deadline are required fields.' });
      return;
    }
    try {
      const { data, error } = await supabase
        .from('assignments')
        .insert({
          course_id: selectedCourse.id,
          teacher_id: profile.id,
          title: newAssignment.title,
          description: newAssignment.description,
          deadline: new Date(newAssignment.deadline).toISOString(),
          max_marks: Number(newAssignment.max_marks),
          file_url: newAssignment.file_url
        })
        .select();

      if (error) throw error;

      setAssignments(prev => [...prev, ...(data || [])]);
      setAlert({ type: 'success', message: `Assignment "${newAssignment.title}" created successfully.` });
      setIsAssignmentModalOpen(false);
      setNewAssignment({ title: '', description: '', deadline: '', max_marks: 100, file_url: '' });

      // Notify all enrolled students
      const courseStudents = enrollments.filter(enroll => enroll.course_id === selectedCourse.id);
      courseStudents.forEach(enroll => {
        triggerNotification(
          enroll.student_id,
          'New Assignment Published',
          `A new assignment "${newAssignment.title}" has been published in ${selectedCourse.code}. Due: ${new Date(newAssignment.deadline).toLocaleDateString()}`,
          'assignment',
          '/student'
        );
      });

      loadTeacherData();
    } catch (err) {
      setAlert({ type: 'error', message: `Failed to create assignment: ${err.message}` });
    }
  };

  const handleGradeSubmission = async (e) => {
    e.preventDefault();
    if (!gradeForm.marks) {
      setAlert({ type: 'error', message: 'Marks field is required.' });
      return;
    }
    try {
      const marksNum = Number(gradeForm.marks);
      const maxMarks = selectedSubmission.assignment?.max_marks || 100;
      if (marksNum < 0 || marksNum > maxMarks) {
        setAlert({ type: 'error', message: `Marks must be between 0 and ${maxMarks}.` });
        return;
      }

      const { data: existingGrade } = await supabase
        .from('grades')
        .select('*')
        .eq('submission_id', selectedSubmission.id)
        .single();

      let error;
      if (existingGrade) {
        const { error: updateError } = await supabase
          .from('grades')
          .update({
            marks: marksNum,
            feedback: gradeForm.feedback,
            graded_by: profile.id,
            graded_at: new Date().toISOString()
          })
          .eq('id', existingGrade.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('grades')
          .insert({
            submission_id: selectedSubmission.id,
            marks: marksNum,
            feedback: gradeForm.feedback,
            graded_by: profile.id
          });
        error = insertError;
      }

      if (error) throw error;

      await supabase
        .from('submissions')
        .update({ status: 'graded' })
        .eq('id', selectedSubmission.id);

      setAlert({ type: 'success', message: 'Submission evaluated successfully.' });
      setIsGradeModalOpen(false);
      setGradeForm({ marks: '', feedback: '' });

      // Notify student
      triggerNotification(
        selectedSubmission.student_id,
        'Assignment Graded',
        `Your submission for "${selectedSubmission.assignment?.title}" has been graded: ${marksNum} / ${maxMarks}.`,
        'success',
        '/student'
      );

      loadTeacherData();
    } catch (err) {
      setAlert({ type: 'error', message: `Grading failed: ${err.message}` });
    }
  };

  // Quiz Actions
  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    if (!newQuiz.title || !newQuiz.course_id) {
      setAlert({ type: 'error', message: 'Title and Course selection are required.' });
      return;
    }
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .insert({
          ...newQuiz,
          teacher_id: profile.id,
          max_marks: Number(newQuiz.max_marks),
          time_limit_minutes: Number(newQuiz.time_limit_minutes),
          deadline: newQuiz.deadline ? new Date(newQuiz.deadline).toISOString() : null,
          is_published: false
        })
        .select();

      if (error) throw error;

      setQuizzes(prev => [...prev, ...(data || [])]);
      setAlert({ type: 'success', message: `Quiz "${newQuiz.title}" created successfully as draft.` });
      setIsQuizModalOpen(false);
      setNewQuiz({ course_id: '', title: '', description: '', time_limit_minutes: 30, max_marks: 10, deadline: '' });
      loadTeacherData();
    } catch (err) {
      setAlert({ type: 'error', message: `Failed to create quiz: ${err.message}` });
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.question_text || !newQuestion.optionA || !newQuestion.optionB) {
      setAlert({ type: 'error', message: 'Question text and at least options A & B are required.' });
      return;
    }
    try {
      const options = [
        newQuestion.optionA,
        newQuestion.optionB,
        newQuestion.optionC,
        newQuestion.optionD
      ].filter(Boolean);

      const { data, error } = await supabase
        .from('quiz_questions')
        .insert({
          quiz_id: selectedQuiz.id,
          question_text: newQuestion.question_text,
          options: options,
          correct_answer: Number(newQuestion.correct_answer),
          marks: Number(newQuestion.marks)
        })
        .select();

      if (error) throw error;

      setQuizQuestions(prev => [...prev, ...(data || [])]);
      setAlert({ type: 'success', message: 'MCQ question added successfully.' });
      setIsQuestionModalOpen(false);
      setNewQuestion({ question_text: '', optionA: '', optionB: '', optionC: '', optionD: '', correct_answer: 0, marks: 5 });
      loadTeacherData();
    } catch (err) {
      setAlert({ type: 'error', message: `Failed to add question: ${err.message}` });
    }
  };

  const handleTogglePublishQuiz = async (quiz) => {
    try {
      const { error } = await supabase
        .from('quizzes')
        .update({ is_published: !quiz.is_published })
        .eq('id', quiz.id);

      if (error) throw error;
      
      setQuizzes(prev => prev.map(q => q.id === quiz.id ? { ...q, is_published: !q.is_published } : q));
      setAlert({ type: 'success', message: `Quiz status set to ${!quiz.is_published ? 'Published' : 'Draft'}.` });

      if (!quiz.is_published) {
        // Notify all enrolled students
        const courseStudents = enrollments.filter(enroll => enroll.course_id === quiz.course_id);
        courseStudents.forEach(enroll => {
          triggerNotification(
            enroll.student_id,
            'New Quiz Assessment Published',
            `A new quiz "${quiz.title}" has been published. Check "My Quizzes" to attempt.`,
            'quiz',
            '/student'
          );
        });
      }
    } catch (err) {
      setAlert({ type: 'error', message: `Failed to toggle status: ${err.message}` });
    }
  };

  const handleUploadMaterial = async (e) => {
    e.preventDefault();
    if (!newMaterial.title || !newMaterial.file_url || !courseDetailView) {
      setAlert({ type: 'error', message: 'Title and file upload are required.' });
      return;
    }
    try {
      const { data, error } = await supabase
        .from('materials')
        .insert({
          course_id: courseDetailView.id,
          teacher_id: profile.id,
          title: newMaterial.title,
          description: newMaterial.description,
          file_url: newMaterial.file_url,
          file_type: newMaterial.file_type,
          file_size: Number(newMaterial.file_size)
        })
        .select();

      if (error) throw error;

      setMaterials(prev => [...prev, ...(data || [])]);
      setAlert({ type: 'success', message: `Material "${newMaterial.title}" uploaded successfully.` });
      setIsMaterialModalOpen(false);
      setNewMaterial({ title: '', description: '', file_url: '', file_type: 'pdf', file_size: 0 });

      // Notify all enrolled students
      const courseStudents = enrollments.filter(enroll => enroll.course_id === courseDetailView.id);
      courseStudents.forEach(enroll => {
        triggerNotification(
          enroll.student_id,
          'New Learning Material',
          `Instructor ${profile.full_name} uploaded new material "${newMaterial.title}" in ${courseDetailView.code}.`,
          'info',
          '/student'
        );
      });

      loadTeacherData();
    } catch (err) {
      setAlert({ type: 'error', message: `Failed to upload material: ${err.message}` });
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!window.confirm("Are you sure you want to delete this learning material?")) return;
    try {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', materialId);
      if (error) throw error;
      setMaterials(prev => prev.filter(m => m.id !== materialId));
      setAlert({ type: 'success', message: 'Learning material deleted successfully.' });
    } catch (err) {
      setAlert({ type: 'error', message: `Failed to delete material: ${err.message}` });
    }
  };

  // Live Class Actions
  const handleCreateLiveClass = async (e) => {
    e.preventDefault();
    if (!newLiveClass.title || !newLiveClass.meeting_link || !newLiveClass.scheduled_at || !courseDetailView) {
      setAlert({ type: 'error', message: 'Please fill in all required fields for scheduling a live class.' });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('live_classes')
        .insert({
          course_id: courseDetailView.id,
          teacher_id: profile.id,
          title: newLiveClass.title,
          description: newLiveClass.description,
          meeting_link: newLiveClass.meeting_link,
          scheduled_at: newLiveClass.scheduled_at,
          duration_minutes: Number(newLiveClass.duration_minutes),
          status: newLiveClass.status
        })
        .select();

      if (error) throw error;

      setLiveClasses(prev => [...prev, ...(data || [])]);
      setAlert({ type: 'success', message: `Live online class "${newLiveClass.title}" scheduled successfully.` });
      setIsLiveClassModalOpen(false);
      setNewLiveClass({
        title: '',
        description: '',
        meeting_link: '',
        scheduled_at: '',
        duration_minutes: 60,
        status: 'upcoming'
      });

      // Notify all enrolled students
      const courseStudents = enrollments.filter(enroll => enroll.course_id === courseDetailView.id);
      courseStudents.forEach(enroll => {
        triggerNotification(
          enroll.student_id,
          'Live Class Scheduled',
          `A new online live session "${newLiveClass.title}" has been scheduled for ${new Date(newLiveClass.scheduled_at).toLocaleString()} in ${courseDetailView.code}.`,
          'info',
          '/student'
        );
      });
      loadTeacherData();
    } catch (err) {
      setAlert({ type: 'error', message: `Failed to schedule live class: ${err.message}` });
    }
  };

  const handleDeleteLiveClass = async (id) => {
    if (!window.confirm("Are you sure you want to cancel and delete this scheduled live class?")) return;
    try {
      const { error } = await supabase
        .from('live_classes')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setLiveClasses(prev => prev.filter(c => c.id !== id));
      setAlert({ type: 'success', message: 'Live class session deleted successfully.' });
    } catch (err) {
      setAlert({ type: 'error', message: `Failed to delete live class: ${err.message}` });
    }
  };

  // Recorded Lecture Actions
  const handleCreateRecordedClass = async (e) => {
    e.preventDefault();
    if (!newRecordedClass.title || !newRecordedClass.video_url || !courseDetailView) {
      setAlert({ type: 'error', message: 'Please provide at least a title and a video link/URL.' });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('recorded_classes')
        .insert({
          course_id: courseDetailView.id,
          teacher_id: profile.id,
          title: newRecordedClass.title,
          description: newRecordedClass.description,
          video_url: newRecordedClass.video_url,
          duration_minutes: Number(newRecordedClass.duration_minutes)
        })
        .select();

      if (error) throw error;

      setRecordedClasses(prev => [...prev, ...(data || [])]);
      setAlert({ type: 'success', message: `Recorded lecture "${newRecordedClass.title}" added successfully.` });
      setIsRecordedClassModalOpen(false);
      setNewRecordedClass({
        title: '',
        description: '',
        video_url: '',
        duration_minutes: 45
      });

      // Notify students
      const courseStudents = enrollments.filter(enroll => enroll.course_id === courseDetailView.id);
      courseStudents.forEach(enroll => {
        triggerNotification(
          enroll.student_id,
          'New Recorded Lecture',
          `A new recorded lecture "${newRecordedClass.title}" is now available to view in ${courseDetailView.code}.`,
          'info',
          '/student'
        );
      });
      loadTeacherData();
    } catch (err) {
      setAlert({ type: 'error', message: `Failed to publish recorded lecture: ${err.message}` });
    }
  };

  const handleDeleteRecordedClass = async (id) => {
    if (!window.confirm("Are you sure you want to delete this recorded lecture?")) return;
    try {
      const { error } = await supabase
        .from('recorded_classes')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setRecordedClasses(prev => prev.filter(c => c.id !== id));
      setAlert({ type: 'success', message: 'Recorded lecture deleted successfully.' });
    } catch (err) {
      setAlert({ type: 'error', message: `Failed to delete recording: ${err.message}` });
    }
  };

  // Attendance Actions
  const handleSaveAttendance = async () => {
    if (!selectedAttendanceCourse) return;
    try {
      const recordsToInsert = Object.keys(attendanceMap).map(studentId => ({
        course_id: selectedAttendanceCourse.id,
        student_id: studentId,
        date: attendanceDate,
        status: attendanceMap[studentId],
        marked_by: profile.id
      }));

      // Clear existing records on that date
      const { error: delError } = await supabase
        .from('attendance')
        .delete()
        .eq('course_id', selectedAttendanceCourse.id)
        .eq('date', attendanceDate);

      if (delError) throw delError;

      if (recordsToInsert.length > 0) {
        const { error: insError } = await supabase
          .from('attendance')
          .insert(recordsToInsert);
        if (insError) throw insError;
      }

      setAlert({ type: 'success', message: 'Attendance records successfully logged.' });
      
      // Reload logs
      const { data: newLogs, error: logError } = await supabase
        .from('attendance')
        .select('*')
        .eq('course_id', selectedAttendanceCourse.id);
      if (!logError) {
        setAttendanceLogs(prev => [
          ...prev.filter(l => l.course_id !== selectedAttendanceCourse.id),
          ...(newLogs || [])
        ]);
      }
    } catch (err) {
      setAlert({ type: 'error', message: `Failed to log attendance: ${err.message}` });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted': return 'chip-indigo';
      case 'graded': return 'chip-green';
      case 'late': return 'chip-amber';
      case 'resubmit': return 'chip-red';
      default: return 'chip-gray';
    }
  };

  // ── Loading State ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <LoadingSpinner size="medium" message="Loading instructor dashboard..." />
      </div>
    );
  }

  // ── Computed Data ──────────────────────────────────────────────────────────
  const activeCoursesCount = courses.length;
  const enrolledStudentsCount = enrollments.length;
  const totalSubmissionsCount = submissions.length;
  const gradedSubmissionsCount = submissions.filter(s => s.status === 'graded').length;

  const filteredStudents = enrollments.filter(e => {
    const studentName = e.student?.full_name || '';
    const studentEmail = e.student?.email || '';
    const courseTitle = e.course?.title || '';
    const query = searchQuery.toLowerCase();
    
    const matchesQuery = studentName.toLowerCase().includes(query) || 
                         studentEmail.toLowerCase().includes(query) || 
                         courseTitle.toLowerCase().includes(query);
                         
    const matchesCohort = !selectedCohortFilter || e.cohort_id === selectedCohortFilter;
    
    return matchesQuery && matchesCohort;
  });

  const filteredSubmissions = submissions.filter(sub => {
    if (!selectedCohortFilter) return true;
    const enrollment = enrollments.find(e => e.student_id === sub.student_id && e.course_id === sub.assignment?.course_id);
    return enrollment?.cohort_id === selectedCohortFilter;
  });

  // ── Style Helpers ──────────────────────────────────────────────────────────
  const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--shadow-sm)' };
  const sectionTitle = { fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14, margin: '0 0 14px' };
  const emptyBox = { padding: '36px 24px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13, background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)' };

  const pageTitle = {
    home: `Hi, ${profile?.full_name?.split(' ')[0] || 'Teacher'} 👋`,
    courses: 'My Courses',
    students: 'Registered Students',
    quizzes: 'Assessments & Quizzes',
    attendance: 'Attendance Register',
    grades: 'Evaluate Grades',
  }[activeTab] || 'Dashboard';

  const pageSubtitle = {
    home: 'Review academic curricula, monitor student performance, and assign grades.',
    courses: 'Manage syllabus, learn materials, and schedule class rooms.',
    students: 'Search and inspect student enrollment listings.',
    quizzes: 'Design multiple-choice quizzes and track high scores.',
    attendance: 'Log daily class attendance for your student roster.',
    grades: 'Examine submitted coursework assignments and hand out marks.',
  }[activeTab] || '';

  const statCards = [
    { label: 'Active Courses', value: activeCoursesCount, icon: <BookOpen size={20}/>, bg: '#eff6ff', color: '#2563eb' },
    { label: 'Enrolled Students', value: enrolledStudentsCount, icon: <Users size={20}/>, bg: '#ecfdf5', color: '#059669' },
    { label: 'Received Tasks', value: totalSubmissionsCount, icon: <FileText size={20}/>, bg: '#fef2f2', color: '#dc2626' },
    { label: 'Graded Tasks', value: `${gradedSubmissionsCount} / ${totalSubmissionsCount}`, icon: <CheckCircle size={20}/>, bg: '#fffbeb', color: '#d97706' },
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
        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            onClick={() => setIsCourseModalOpen(true)}
            className="btn btn-primary"
            style={{ fontSize: 12, height: 38 }}
          >
            <Plus size={15} />
            Create Course
          </button>
        </div>
      </div>

      {alert && (
        <div style={{ marginBottom: 16 }}>
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        </div>
      )}

      {/* ══ COURSE ROOM DETAIL VIEW overlay ════════════════════════════════════ */}
      {courseDetailView ? (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Room Header Banner */}
          <div style={{ ...card, padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(180deg, #f8faff 0%, var(--surface) 100%)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span className="chip chip-indigo">{courseDetailView.code}</span>
                <span style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 3 }}>⏱ {courseDetailView.duration || '3 Months'}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{courseDetailView.fee > 0 ? `₹${courseDetailView.fee}` : 'Free'}</span>
              </div>
              <h3 style={{ margin: '4px 0', fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{courseDetailView.title}</h3>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-2)' }}>{courseDetailView.description || 'No course description provided.'}</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => {
                  setSelectedCourse(courseDetailView);
                  setIsAssignmentModalOpen(true);
                }}
                className="btn btn-primary btn-sm"
              >
                <Plus size={14} /> Add Assignment
              </button>
              <button 
                onClick={() => setCourseDetailView(null)}
                className="btn btn-secondary btn-sm"
              >
                Close Course Room
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr', gap: 24 }}>
            {/* Left Column: Sub Tabs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* Tab Bar Switcher */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: 16 }}>
                {[
                  { id: 'curriculum', label: 'Curriculum & Files' },
                  { id: 'live', label: 'Live Online Classes' },
                  { id: 'recordings', label: 'Recorded Lecture Archives' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setCourseSubTab(t.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      borderBottom: `2.5px solid ${courseSubTab === t.id ? 'var(--accent)' : 'transparent'}`,
                      color: courseSubTab === t.id ? 'var(--accent)' : 'var(--text-2)',
                      paddingBottom: 10,
                      fontWeight: courseSubTab === t.id ? 705 : 500,
                      fontSize: 12.5,
                      cursor: 'pointer',
                      fontFamily: 'var(--font)'
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Curriculum Sub Tab */}
              {courseSubTab === 'curriculum' && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  
                  {/* Course Assignments section */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <p style={sectionTitle}>Assignments In Curriculum</p>
                    {assignments.filter(a => a.course_id === courseDetailView.id).length === 0 ? (
                      <div style={emptyBox}>No assignments created for this course yet. Use "Add Assignment" above.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {assignments.filter(a => a.course_id === courseDetailView.id).map(assign => {
                          const assignSubs = submissions.filter(s => s.assignment_id === assign.id);
                          return (
                            <div key={assign.id} style={{ ...card, padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <h5 style={{ margin: '0 0 4px', fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>{assign.title}</h5>
                                <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text-2)' }}>{assign.description}</p>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 10, fontSize: 11, color: 'var(--text-3)' }}>
                                  <Calendar size={12}/> Due: {new Date(assign.deadline).toLocaleString()}
                                </span>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: 13, fontWeight: 750, color: 'var(--accent)', display: 'block' }}>{assign.max_marks} Marks Max</span>
                                <span className="chip chip-indigo" style={{ marginTop: 6 }}>
                                  {assignSubs.length} Student Submission(s)
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Course Learning Materials section */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={sectionTitle}>Learning Materials & Notes</p>
                      <button
                        onClick={() => {
                          setNewMaterial({ title: '', description: '', file_url: '', file_type: 'pdf', file_size: 0 });
                          setIsMaterialModalOpen(true);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ height: 28, fontSize: 11 }}
                      >
                        Upload Material
                      </button>
                    </div>
                    {materials.filter(m => m.course_id === courseDetailView.id).length === 0 ? (
                      <div style={emptyBox}>No study guides or files uploaded yet. Click Upload above to distribute.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {materials.filter(m => m.course_id === courseDetailView.id).map(mat => (
                          <div key={mat.id} style={{ ...card, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                                <FileText size={16} />
                              </div>
                              <div>
                                <h5 style={{ margin: '0 0 2px', fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}>{mat.title}</h5>
                                <p style={{ margin: 0, fontSize: 11, color: 'var(--text-2)' }}>{mat.description || 'No description provided.'}</p>
                                <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginTop: 4 }}>
                                  {mat.file_type} · {mat.file_size ? `${(mat.file_size / (1024 * 1024)).toFixed(2)} MB` : '0.00 MB'}
                                </span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <a
                                href={mat.file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-secondary btn-sm"
                                style={{ width: 32, height: 32, padding: 0 }}
                              >
                                <FileDown size={14} />
                              </a>
                              <button
                                onClick={() => handleDeleteMaterial(mat.id)}
                                className="btn btn-danger btn-sm"
                                style={{ width: 32, height: 32, padding: 0 }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Live Classes Sub Tab */}
              {courseSubTab === 'live' && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={sectionTitle}>Scheduled Live Sessions</p>
                    <button
                      onClick={() => {
                        setNewLiveClass({
                          title: '',
                          description: '',
                          meeting_link: '',
                          scheduled_at: '',
                          duration_minutes: 60,
                          status: 'upcoming'
                        });
                        setIsLiveClassModalOpen(true);
                      }}
                      className="btn btn-primary btn-sm"
                    >
                      <Plus size={13} /> Schedule Live Class
                    </button>
                  </div>
                  {liveClasses.filter(c => c.course_id === courseDetailView.id).length === 0 ? (
                    <div style={emptyBox}>No live meeting sessions scheduled yet. Click Schedule above to setup.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {liveClasses.filter(c => c.course_id === courseDetailView.id).map(session => (
                        <div key={session.id} style={{ ...card, padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <h5 style={{ margin: '0 0 2px', fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>{session.title}</h5>
                              <span className={`chip ${
                                session.status === 'live' ? 'chip-red animate-pulse' :
                                session.status === 'completed' ? 'chip-gray' : 'chip-indigo'
                              }`}>
                                {session.status}
                              </span>
                            </div>
                            <p style={{ margin: '4px 0 8px', fontSize: 12, color: 'var(--text-2)' }}>{session.description}</p>
                            <div style={{ display: 'flex', gap: 14, fontSize: 11.5, color: 'var(--text-3)' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12}/> {new Date(session.scheduled_at).toLocaleString()}</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12}/> {session.duration_minutes} Mins Duration</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <a
                              href={session.meeting_link}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-primary btn-sm"
                            >
                              <Video size={13} /> Start Class
                            </a>
                            <button
                              onClick={() => handleDeleteLiveClass(session.id)}
                              className="btn btn-secondary btn-sm"
                              style={{ width: 32, padding: 0 }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Recorded Lectures Sub Tab */}
              {courseSubTab === 'recordings' && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={sectionTitle}>Recorded Video Archives</p>
                    <button
                      onClick={() => {
                        setNewRecordedClass({
                          title: '',
                          description: '',
                          video_url: '',
                          duration_minutes: 45
                        });
                        setIsRecordedClassModalOpen(true);
                      }}
                      className="btn btn-primary btn-sm"
                    >
                      <Plus size={13} /> Publish Recording
                    </button>
                  </div>
                  {recordedClasses.filter(c => c.course_id === courseDetailView.id).length === 0 ? (
                    <div style={emptyBox}>No recorded video lectures stored in the archive. Publish a video link to begin.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {recordedClasses.filter(c => c.course_id === courseDetailView.id).map(rec => (
                        <div key={rec.id} style={{ ...card, padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--warning-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}>
                              <Tv size={18} />
                            </div>
                            <div>
                              <h5 style={{ margin: '0 0 2px', fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>{rec.title}</h5>
                              <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text-2)' }}>{rec.description}</p>
                              <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--text-3)', marginTop: 6, fontWeight: 550 }}>
                                <span><Clock size={11} style={{ marginRight: 2 }}/> {rec.duration_minutes || '0'} Mins</span>
                                <span>·</span>
                                <span>Added: {new Date(rec.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <a
                              href={rec.video_url}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary btn-sm"
                            >
                              <Play size={11} fill="var(--text-2)" style={{ marginRight: 4 }} /> Watch Video
                            </a>
                            <button
                              onClick={() => handleDeleteRecordedClass(rec.id)}
                              className="btn btn-danger btn-sm"
                              style={{ width: 32, padding: 0 }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Student Roster */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={sectionTitle}>Enrolled Student Roster</p>
              {enrollments.filter(e => e.course_id === courseDetailView.id).length === 0 ? (
                <div style={emptyBox}>No students enrolled in this course yet.</div>
              ) : (
                <div style={{ ...card, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {enrollments.filter(e => e.course_id === courseDetailView.id).map(enroll => (
                    <div key={enroll.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--surface-2)' }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: 'var(--accent-text)' }}>
                        {enroll.student?.full_name?.charAt(0).toUpperCase() || 'S'}
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{enroll.student?.full_name}</p>
                        <p style={{ margin: 0, fontSize: 10, color: 'var(--text-2)' }}>{enroll.student?.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* ══ HOME TAB ═══════════════════════════════════════════════════════ */}
          {activeTab === 'home' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              {/* Stat Cards Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                {statCards.map((c, i) => (
                  <div key={i} style={card} className="stat-card">
                    <div className="stat-icon" style={{ background: c.bg, color: c.color }}>
                      {c.icon}
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 650, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{c.label}</span>
                      <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', display: 'block', marginTop: 2 }}>{c.value}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sub Columns layout */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
                {/* Course Summary */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <p style={sectionTitle}>Course Roster Summary</p>
                  {courses.length === 0 ? (
                    <div style={emptyBox}>No active courses assigned to your profile. Click Create Course above to begin.</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                      {courses.map(course => {
                        const count = enrollments.filter(e => e.course_id === course.id).length;
                        return (
                          <div key={course.id} style={{ ...card, padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 150 }}>
                            <div>
                              <span className="chip chip-indigo" style={{ marginBottom: 8 }}>{course.code}</span>
                              <h4 style={{ margin: '4px 0', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{course.title}</h4>
                              <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text-2)' }}>{course.category || 'Curriculum'}</p>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                              <span style={{ fontSize: 11.5, color: 'var(--text-2)', fontWeight: 600 }}>{count} Students</span>
                              <button 
                                onClick={() => setCourseDetailView(course)}
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '0 8px', color: 'var(--accent)', fontWeight: 700, gap: 4 }}
                              >
                                View Room <ExternalLink size={12}/>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Grading Pending Tasks */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <p style={sectionTitle}>Grading Pending Tasks</p>
                  <div style={{ ...card, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', minHeight: 250 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {submissions.filter(s => s.status === 'submitted').length === 0 ? (
                        <div style={{ padding: '36px 12px', textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>
                          🎉 Great job! All student assignment submissions are fully graded.
                        </div>
                      ) : (
                        submissions.filter(s => s.status === 'submitted').slice(0, 3).map(sub => (
                          <div key={sub.id} style={{ padding: 10, background: 'var(--surface-2)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ overflow: 'hidden', paddingRight: 6 }}>
                              <p style={{ margin: '0 0 2px', fontSize: 12, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub.assignment?.title}</p>
                              <p style={{ margin: 0, fontSize: 10, color: 'var(--text-2)' }}>Student: {sub.student?.full_name}</p>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedSubmission(sub);
                                setGradeForm({ marks: '', feedback: '' });
                                setIsGradeModalOpen(true);
                              }}
                              className="btn btn-primary btn-sm"
                              style={{ height: 26, fontSize: 11, padding: '0 10px' }}
                            >
                              Grade
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    <button 
                      onClick={() => {}}
                      className="btn btn-secondary btn-sm"
                      style={{ width: '100%', marginTop: 14 }}
                    >
                      View Gradebook Table
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ COURSES TAB ═══════════════════════════════════════════════════ */}
          {activeTab === 'courses' && (
            <div className="animate-fade-in">
              {courses.length === 0 ? (
                <div style={{ ...emptyBox, maxWidth: 500, margin: '40px auto', padding: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                  <BookOpen size={48} color="var(--text-3)"/>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>No Assigned Courses</h4>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
                    You haven't setup or been assigned any courses yet. Add one to build assignments.
                  </p>
                  <button
                    onClick={() => setIsCourseModalOpen(true)}
                    className="btn btn-primary"
                  >
                    Create Course Now
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
                  {courses.map(course => {
                    const count = enrollments.filter(e => e.course_id === course.id).length;
                    return (
                      <div key={course.id} style={card}>
                        <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span className="chip chip-indigo">{course.code}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 3 }}>⏱ {course.duration || '3 Months'}</span>
                          </div>
                          <h4 style={{ margin: '4px 0 2px', fontSize: 14.5, fontWeight: 700, color: 'var(--text)' }}>{course.title}</h4>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-2)' }}>{course.category || 'Uncategorized'}</p>
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{course.fee > 0 ? `₹${course.fee}` : 'Free'}</span>
                          </div>
                        </div>
                        <div style={{ padding: 18, background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <span style={{ fontSize: 12, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Users size={14} color="var(--text-3)"/> {count} Students Enrolled
                          </span>
                          <button 
                            onClick={() => setCourseDetailView(course)}
                            className="btn btn-secondary btn-sm"
                            style={{ width: '100%', height: 32 }}
                          >
                            Open Course Room <ExternalLink size={12} style={{ marginLeft: 2 }}/>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══ STUDENTS TAB ══════════════════════════════════════════════════ */}
          {activeTab === 'students' && (
            <div className="animate-fade-in" style={{ ...card, overflow: 'hidden' }}>
              <div style={{ padding: 20, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Registered Students</h4>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <select
                    value={selectedCohortFilter}
                    onChange={(e) => setSelectedCohortFilter(e.target.value)}
                    className="input"
                    style={{ width: 180, height: 34, fontSize: 12 }}
                  >
                    <option value="">All Cohort Programs</option>
                    {teacherCohorts.map(ch => (
                      <option key={ch.id} value={ch.id}>{ch.name}</option>
                    ))}
                  </select>

                  <div style={{ position: 'relative', width: 220 }}>
                    <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input"
                      style={{ paddingLeft: 34, height: 34, fontSize: 12 }}
                      placeholder="Search student..."
                    />
                  </div>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                {filteredStudents.length === 0 ? (
                  <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No student enrollment records found.</div>
                ) : (
                  <table className="table-clean">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Email</th>
                        <th>Course</th>
                        <th>Cohort Program</th>
                        <th>Enrolled Date</th>
                        <th>Status</th>
                        <th>Certification</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map(enroll => (
                        <tr key={enroll.id}>
                          <td style={{ fontWeight: 600 }}>{enroll.student?.full_name}</td>
                          <td>{enroll.student?.email}</td>
                          <td><span className="chip chip-indigo">{enroll.course?.code}</span> {enroll.course?.title}</td>
                          <td>
                            {enroll.cohort ? (
                              <span className="chip chip-indigo" style={{ background: 'var(--accent-bg)', color: 'var(--accent-text)', border: '1px solid var(--accent)', fontSize: 11 }}>
                                🏫 {enroll.cohort.name}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-3)', fontSize: 12 }}>Unassigned</span>
                            )}
                          </td>
                          <td>{new Date(enroll.enrolled_at).toLocaleDateString()}</td>
                          <td>
                            <span className="chip chip-green">
                              {enroll.status}
                            </span>
                          </td>
                          <td>
                            {certificates.some(c => c.student_id === enroll.student_id && c.course_id === enroll.course_id) ? (
                              <span className="chip chip-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                                <Award size={12} /> Issued
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedCertStudent(enroll.student);
                                  setSelectedCertEnrollment(enroll);
                                  setCertGrade('A+');
                                  setIsCertModalOpen(true);
                                }}
                                className="btn btn-secondary btn-sm"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 28, fontSize: 11, padding: '0 10px' }}
                              >
                                <Award size={12} /> Issue Certificate
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ══ QUIZZES TAB ═══════════════════════════════════════════════════ */}
          {activeTab === 'quizzes' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={sectionTitle}>Quiz & Assessments</p>
                <button
                  onClick={() => setIsQuizModalOpen(true)}
                  className="btn btn-primary"
                  style={{ height: 34, fontSize: 12 }}
                >
                  <Plus size={14} /> Create Quiz
                </button>
              </div>

              {quizzes.length === 0 ? (
                <div style={emptyBox}>No assessments or quiz forms created. Click Create Quiz above to construct one.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                  {quizzes.map(quiz => {
                    const questionsCount = quizQuestions.filter(q => q.quiz_id === quiz.id).length;
                    const attemptsCount = quizAttempts.filter(a => a.quiz_id === quiz.id).length;
                    return (
                      <div key={quiz.id} style={{ ...card, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14 }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <span className="chip chip-indigo" style={{ marginBottom: 6 }}>{quiz.course?.code}</span>
                              <h5 style={{ margin: '4px 0', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{quiz.title}</h5>
                              <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text-2)' }}>{quiz.description}</p>
                            </div>
                            <button
                              onClick={() => handleTogglePublishQuiz(quiz)}
                              className={`chip ${quiz.is_published ? 'chip-green' : 'chip-gray'}`}
                              style={{ cursor: 'pointer', border: '1px solid var(--border)' }}
                            >
                              {quiz.is_published ? 'Published' : 'Draft'}
                            </button>
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 16, background: 'var(--surface-2)', padding: 10, borderRadius: 8, textAlign: 'center', fontSize: 11 }}>
                            <div><div style={{ color: 'var(--text-3)', marginBottom: 2 }}>Questions</div><div style={{ fontWeight: 700 }}>{questionsCount} MCQs</div></div>
                            <div><div style={{ color: 'var(--text-3)', marginBottom: 2 }}>Timer</div><div style={{ fontWeight: 700 }}>{quiz.time_limit_minutes} Mins</div></div>
                            <div><div style={{ color: 'var(--text-3)', marginBottom: 2 }}>Attempts</div><div style={{ fontWeight: 700 }}>{attemptsCount} Graded</div></div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                          <button
                            onClick={() => {
                              setSelectedQuiz(quiz);
                              setIsQuestionModalOpen(true);
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ flex: 1 }}
                          >
                            Add MCQ Question
                          </button>
                          <button
                            onClick={() => setSelectedQuiz(quiz)}
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--accent)', fontWeight: 700 }}
                          >
                            View Scores
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Quiz attempt scores report section */}
              {selectedQuiz && (
                <div className="animate-fade-in" style={{ ...card, overflow: 'hidden' }}>
                  <div style={{ padding: 18, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h5 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Quiz Performance: {selectedQuiz.title}</h5>
                    <button 
                      onClick={() => setSelectedQuiz(null)}
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: 11.5 }}
                    >
                      Close Report
                    </button>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    {quizAttempts.filter(a => a.quiz_id === selectedQuiz.id).length === 0 ? (
                      <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)', fontSize: 12.5 }}>No attempts logged for this quiz assessment.</div>
                    ) : (
                      <table className="table-clean">
                        <thead>
                          <tr>
                            <th>Student</th>
                            <th>Email</th>
                            <th>Completed</th>
                            <th>Score Gained</th>
                          </tr>
                        </thead>
                        <tbody>
                          {quizAttempts.filter(a => a.quiz_id === selectedQuiz.id).map(attempt => (
                            <tr key={attempt.id}>
                              <td style={{ fontWeight: 600 }}>{attempt.student?.full_name}</td>
                              <td>{attempt.student?.email}</td>
                              <td>{new Date(attempt.completed_at).toLocaleString()}</td>
                              <td style={{ fontWeight: 800, color: '#059669', fontSize: 14 }}>
                                {attempt.score} / {selectedQuiz.max_marks} Points
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ ATTENDANCE TAB ════════════════════════════════════════════════ */}
          {activeTab === 'attendance' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              <div style={{ ...card, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Daily Attendance Register</h4>
                  <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text-2)' }}>Select course and calendar date to update attendance status.</p>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <select
                    value={selectedAttendanceCourse?.id || ''}
                    onChange={(e) => setSelectedAttendanceCourse(courses.find(c => c.id === e.target.value))}
                    className="input"
                    style={{ width: 180, height: 34, fontSize: 12 }}
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.code}: {c.title}</option>
                    ))}
                  </select>

                  <select
                    value={selectedCohortFilter}
                    onChange={(e) => setSelectedCohortFilter(e.target.value)}
                    className="input"
                    style={{ width: 160, height: 34, fontSize: 12 }}
                  >
                    <option value="">All Cohorts</option>
                    {teacherCohorts
                      .filter(ch => !selectedAttendanceCourse || ch.course_id === selectedAttendanceCourse.id)
                      .map(ch => (
                        <option key={ch.id} value={ch.id}>{ch.name}</option>
                      ))}
                  </select>

                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="input"
                    style={{ width: 140, height: 34, fontSize: 12 }}
                  />

                  <button
                    onClick={handleSaveAttendance}
                    className="btn btn-primary btn-sm"
                    style={{ height: 34 }}
                  >
                    Save Attendance
                  </button>
                </div>
              </div>

              {selectedAttendanceCourse && (
                <div style={{ ...card, overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    {enrollments.filter(e => e.course_id === selectedAttendanceCourse.id && (!selectedCohortFilter || e.cohort_id === selectedCohortFilter)).length === 0 ? (
                      <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)' }}>No students found in the selected cohort for this course.</div>
                    ) : (
                      <table className="table-clean">
                        <thead>
                          <tr>
                            <th>Student</th>
                            <th>Email</th>
                            <th style={{ textAlign: 'center' }}>Roster Attendance Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {enrollments.filter(e => e.course_id === selectedAttendanceCourse.id && (!selectedCohortFilter || e.cohort_id === selectedCohortFilter)).map(enroll => {
                            const studentId = enroll.student_id;
                            const status = attendanceMap[studentId] || 'present';
                            return (
                              <tr key={enroll.id}>
                                <td style={{ fontWeight: 600 }}>{enroll.student?.full_name}</td>
                                <td>{enroll.student?.email}</td>
                                <td>
                                  <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                                    {['present', 'absent', 'late'].map(opt => (
                                      <button
                                        key={opt}
                                        type="button"
                                        onClick={() => setAttendanceMap(prev => ({ ...prev, [studentId]: opt }))}
                                        className={`chip`}
                                        style={{
                                          cursor: 'pointer',
                                          border: `1.5px solid ${status === opt ? 'var(--accent)' : 'var(--border-2)'}`,
                                          background: status === opt ? 'var(--accent-bg)' : 'var(--surface)',
                                          color: status === opt ? 'var(--accent-text)' : 'var(--text-2)',
                                          textTransform: 'uppercase',
                                          fontSize: 10,
                                          fontWeight: 700
                                        }}
                                      >
                                        {opt}
                                      </button>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ GRADEBOOK TAB ═════════════════════════════════════════════════ */}
          {activeTab === 'grades' && (
            <div className="animate-fade-in" style={{ ...card, overflow: 'hidden' }}>
              <div style={{ padding: 20, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Coursework Submissions Gradebook</h4>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <select
                    value={selectedCohortFilter}
                    onChange={(e) => setSelectedCohortFilter(e.target.value)}
                    className="input"
                    style={{ width: 180, height: 34, fontSize: 12 }}
                  >
                    <option value="">All Cohort Programs</option>
                    {teacherCohorts.map(ch => (
                      <option key={ch.id} value={ch.id}>{ch.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                {filteredSubmissions.length === 0 ? (
                  <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)' }}>No coursework submissions received to grade.</div>
                ) : (
                  <table className="table-clean">
                    <thead>
                      <tr>
                        <th>Student Details</th>
                        <th>Assignment Name</th>
                        <th>Date Submitted</th>
                        <th>Review Status</th>
                        <th>Marks Awarded</th>
                        <th>Reference File</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubmissions.map(sub => (
                        <tr key={sub.id}>
                          <td>
                            <div style={{ fontWeight: 700 }}>{sub.student?.full_name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{sub.student?.email}</div>
                          </td>
                          <td style={{ fontWeight: 600 }}>{sub.assignment?.title}</td>
                          <td style={{ fontSize: 11.5 }}>{new Date(sub.submitted_at).toLocaleString()}</td>
                          <td>
                            <span className={`chip ${
                              sub.status === 'graded' ? 'chip-green' : 'chip-indigo'
                            }`}>
                              {sub.status}
                            </span>
                          </td>
                          <td style={{ fontWeight: 800 }}>
                            {sub.grade ? `${sub.grade.marks} / ${sub.assignment?.max_marks}` : '—'}
                          </td>
                          <td>
                            {sub.file_url ? (
                              <a 
                                href={sub.file_url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="btn btn-secondary btn-sm"
                                style={{ height: 26, fontSize: 11, gap: 4 }}
                              >
                                <FileDown size={12} /> Download
                              </a>
                            ) : (
                              <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>No File Attached</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={() => {
                                setSelectedSubmission(sub);
                                setGradeForm({ 
                                  marks: sub.grade ? sub.grade.marks.toString() : '', 
                                  feedback: sub.grade ? sub.grade.feedback || '' : '' 
                                });
                                setIsGradeModalOpen(true);
                              }}
                              className="btn btn-primary btn-sm"
                            >
                              {sub.status === 'graded' ? 'Re-evaluate' : 'Grade Task'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
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
                        Posted by <strong>{selectedThread.author?.full_name || 'Instructor'}</strong> · {new Date(selectedThread.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleTogglePinThread(selectedThread)}>
                        {selectedThread.is_pinned ? 'Unpin Thread' : 'Pin Thread'}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteThread(selectedThread.id)}>
                        Delete
                      </button>
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
                        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic' }}>No replies yet. Post an answer below.</p>
                      ) : (
                        discussionReplies.filter(r => r.discussion_id === selectedThread.id).map(reply => (
                          <div key={reply.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 14, background: 'var(--surface)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11, color: 'var(--text-3)' }}>
                              <strong>{reply.author?.full_name || 'User'}</strong>
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
                        placeholder="Type your reply as Instructor here..."
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
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Filter Course Forum:</label>
                      <select value={forumSelectedCourse} onChange={e => setForumSelectedCourse(e.target.value)}
                        style={{ height: 36, padding: '0 12px', fontSize: 12, border: '1px solid var(--border-2)', borderRadius: 8, outline: 'none', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer' }}>
                        <option value="all">All Courses</option>
                        {courses.map(c => (
                          <option key={c.id} value={c.id}>{c.title} ({c.code})</option>
                        ))}
                      </select>
                    </div>
                    <button className="btn btn-primary" onClick={() => setIsForumModalOpen(true)}>
                      + New Discussion Thread
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
                                  Posted by {thread.author?.full_name || 'Instructor'} · {new Date(thread.created_at).toLocaleDateString()}
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

          {/* ══ STUDENT CHAT TAB ════════════════════════════════════════════ */}
          {activeTab === 'chat' && (
            <div className="animate-fade-in" style={{ display: 'flex', gap: 20, height: 'calc(100vh - 240px)', minHeight: 480 }}>
              {/* Left Pane: Classmates list */}
              <div style={{ ...card, width: 300, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                {/* Search Bar */}
                <div style={{ padding: 14, borderBottom: '1px solid var(--border)', position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
                  <input type="text" value={chatSearchQuery} onChange={e => setChatSearchQuery(e.target.value)}
                    placeholder="Search students..."
                    style={{ width: '100%', height: 36, paddingLeft: 32, paddingRight: 12, fontSize: 13, fontFamily: 'var(--font)', border: '1px solid var(--border-2)', borderRadius: 8, outline: 'none', background: 'var(--surface)', color: 'var(--text)', boxSizing: 'border-box' }}
                    onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border-2)'; e.target.style.boxShadow = 'none'; }} />
                </div>
                {/* Roster list */}
                <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
                  {/* Cohort Group Channels at the Top */}
                  {teacherCohorts.map(ch => {
                    const isActive = activeChatStudent?.id === ch.id && activeChatStudent?.isCohortChannel;
                    return (
                      <button key={`cohort-ch-${ch.id}`} onClick={() => setActiveChatStudent({
                        id: ch.id,
                        full_name: ch.name,
                        email: `Instructor Channel · ${ch.course?.code || ''}`,
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
                    teacherCohorts.length === 0 && (
                      <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>
                        No enrolled students or class group channels found.
                      </div>
                    )
                  ) : (
                    chatStudents.filter(s => s.full_name.toLowerCase().includes(chatSearchQuery.toLowerCase())).map(student => {
                      const isActive = activeChatStudent?.id === student.id && !activeChatStudent?.isCohortChannel;
                      const userInitials = student.full_name
                        ? student.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                        : 'S';
                      
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
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                              {student.full_name}
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
                        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{activeChatStudent.full_name}</h4>
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
                          <p style={{ margin: 0, fontSize: 13 }}>No messages in this secure channel yet.</p>
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
                    </div>

                    {/* Chat Input Bar */}
                    <form onSubmit={handleSendMessage} style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', gap: 10 }}>
                      <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                        placeholder="Type an official response..."
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
                      <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Instructor Secure Chat</h4>
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-2)', maxWidth: 280, lineHeight: 1.6 }}>
                        Select a cohort program group channel or an individual student roster profile to begin communication.
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

      {/* CREATE COURSE MODAL */}
      <Modal isOpen={isCourseModalOpen} onClose={() => setIsCourseModalOpen(false)} title="Create New Syllabus Course">
        <form onSubmit={handleCreateCourse} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="label">Course Title</label>
            <input
              type="text"
              required
              placeholder="e.g. CS 301: Advanced SQL Databases"
              value={newCourse.title}
              onChange={(e) => setNewCourse(prev => ({ ...prev, title: e.target.value }))}
              className="input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label className="label">Course Code Identifier</label>
              <input
                type="text"
                required
                placeholder="e.g. DB-ADV"
                value={newCourse.code}
                onChange={(e) => setNewCourse(prev => ({ ...prev, code: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="label">Course Category</label>
              <input
                type="text"
                placeholder="e.g. Computer Science"
                value={newCourse.category}
                onChange={(e) => setNewCourse(prev => ({ ...prev, category: e.target.value }))}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Course Syllabus Details</label>
            <textarea
              rows={3}
              placeholder="Provide a detailed syllabus outline or course guidelines..."
              value={newCourse.description}
              onChange={(e) => setNewCourse(prev => ({ ...prev, description: e.target.value }))}
              className="input"
              style={{ height: 'auto', padding: '10px 12px', resize: 'none' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <div>
              <label className="label">Course Enrollment Fee (INR)</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={newCourse.fee}
                onChange={(e) => setNewCourse(prev => ({ ...prev, fee: Number(e.target.value) }))}
                className="input"
              />
            </div>
            <div>
              <label className="label">Training Time Period (Duration)</label>
              <input
                type="text"
                placeholder="e.g. 3 Months"
                value={newCourse.duration}
                onChange={(e) => setNewCourse(prev => ({ ...prev, duration: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="label">Visibility & Access</label>
              <select
                value={newCourse.status}
                onChange={(e) => setNewCourse(prev => ({ ...prev, status: e.target.value }))}
                className="input"
              >
                <option value="active">Active (Enrollable)</option>
                <option value="draft">Draft (Private Room)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 8 }}
          >
            Create Course Room
          </button>
        </form>
      </Modal>

      {/* CREATE ASSIGNMENT MODAL */}
      <Modal isOpen={isAssignmentModalOpen} onClose={() => setIsAssignmentModalOpen(false)} title={`Add Assignment for ${selectedCourse?.code}`}>
        <form onSubmit={handleCreateAssignment} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="label">Assignment Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Normalization & Schema Design"
              value={newAssignment.title}
              onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
              className="input"
            />
          </div>

          <div>
            <label className="label">Instructions & Scoring Criteria</label>
            <textarea
              rows={3}
              placeholder="Provide detailed instructions or files checklist..."
              value={newAssignment.description}
              onChange={(e) => setNewAssignment(prev => ({ ...prev, description: e.target.value }))}
              className="input"
              style={{ height: 'auto', padding: '10px 12px', resize: 'none' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label className="label">Maximum Marks Weightage</label>
              <input
                type="number"
                min="1"
                required
                value={newAssignment.max_marks}
                onChange={(e) => setNewAssignment(prev => ({ ...prev, max_marks: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="label">Submission Deadline</label>
              <input
                type="datetime-local"
                required
                value={newAssignment.deadline}
                onChange={(e) => setNewAssignment(prev => ({ ...prev, deadline: e.target.value }))}
                className="input"
                style={{ color: 'var(--text-2)' }}
              />
            </div>
          </div>

          <div>
            <label className="label">Attach Study Reference Document (Optional)</label>
            <FileUpload 
              folderPath="assignments"
              allowedTypes={['pdf', 'zip', 'png', 'jpg', 'docx']}
              onUploadSuccess={(url) => setNewAssignment(prev => ({ ...prev, file_url: url }))}
              onUploadError={(err) => setAlert({ type: 'error', message: err })}
            />
            {newAssignment.file_url && (
              <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>
                ✓ Reference file linked successfully.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 8 }}
          >
            Create Assignment Task
          </button>
        </form>
      </Modal>

      {/* EVALUATE / GRADE MODAL */}
      <Modal isOpen={isGradeModalOpen} onClose={() => setIsGradeModalOpen(false)} title="Evaluate Coursework submission">
        <form onSubmit={handleGradeSubmission} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)' }}>Student: <strong style={{ color: 'var(--text)' }}>{selectedSubmission?.student?.full_name}</strong></p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)' }}>Assignment: <strong style={{ color: 'var(--text)' }}>{selectedSubmission?.assignment?.title}</strong></p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)' }}>Maximum Grade Points: <strong style={{ color: 'var(--accent)' }}>{selectedSubmission?.assignment?.max_marks}</strong></p>
            {selectedSubmission?.file_url && (
              <a 
                href={selectedSubmission.file_url} 
                target="_blank" 
                rel="noreferrer" 
                className="btn btn-secondary btn-sm"
                style={{ alignSelf: 'flex-start', marginTop: 6, fontSize: 11 }}
              >
                <FileDown size={12} /> Download Student Document
              </a>
            )}
          </div>

          <div>
            <label className="label">Awarded Score Marks</label>
            <input
              type="number"
              step="0.5"
              min="0"
              max={selectedSubmission?.assignment?.max_marks || 100}
              required
              placeholder={`Score / ${selectedSubmission?.assignment?.max_marks || 100}`}
              value={gradeForm.marks}
              onChange={(e) => setGradeForm(prev => ({ ...prev, marks: e.target.value }))}
              className="input"
            />
          </div>

          <div>
            <label className="label">Evaluation Feedback Notes</label>
            <textarea
              rows={3}
              placeholder="Provide encouraging and constructive evaluation notes..."
              value={gradeForm.feedback}
              onChange={(e) => setGradeForm(prev => ({ ...prev, feedback: e.target.value }))}
              className="input"
              style={{ height: 'auto', padding: '10px 12px', resize: 'none' }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 8 }}
          >
            Submit Score Evaluation
          </button>
        </form>
      </Modal>

      {/* CREATE QUIZ MODAL */}
      <Modal isOpen={isQuizModalOpen} onClose={() => setIsQuizModalOpen(false)} title="Create Assessment Quiz">
        <form onSubmit={handleCreateQuiz} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="label">Select Course Room</label>
            <select
              value={newQuiz.course_id}
              onChange={(e) => setNewQuiz(prev => ({ ...prev, course_id: e.target.value }))}
              className="input"
              required
            >
              <option value="">-- Choose Target Course --</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.code}: {c.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Quiz Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Midterm 1: Relational Database Algebra"
              value={newQuiz.title}
              onChange={(e) => setNewQuiz(prev => ({ ...prev, title: e.target.value }))}
              className="input"
            />
          </div>

          <div>
            <label className="label">Quiz Syllabus Instructions</label>
            <textarea
              rows={3}
              placeholder="List down details such as allowed attempts, syllabus scope..."
              value={newQuiz.description}
              onChange={(e) => setNewQuiz(prev => ({ ...prev, description: e.target.value }))}
              className="input"
              style={{ height: 'auto', padding: '10px 12px', resize: 'none' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            <div>
              <label className="label">Time Timer (Mins)</label>
              <input
                type="number"
                min="1"
                required
                value={newQuiz.time_limit_minutes}
                onChange={(e) => setNewQuiz(prev => ({ ...prev, time_limit_minutes: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="label">Total Marks Max</label>
              <input
                type="number"
                min="1"
                required
                value={newQuiz.max_marks}
                onChange={(e) => setNewQuiz(prev => ({ ...prev, max_marks: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="label">Due Deadline</label>
              <input
                type="datetime-local"
                value={newQuiz.deadline}
                onChange={(e) => setNewQuiz(prev => ({ ...prev, deadline: e.target.value }))}
                className="input"
                style={{ color: 'var(--text-2)' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 8 }}
          >
            Create Quiz Draft
          </button>
        </form>
      </Modal>

      {/* ADD MCQ QUESTION MODAL */}
      <Modal isOpen={isQuestionModalOpen} onClose={() => setIsQuestionModalOpen(false)} title={`Add MCQ to Assessment: ${selectedQuiz?.title}`}>
        <form onSubmit={handleAddQuestion} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="label">MCQ Question Statement</label>
            <textarea
              rows={2}
              required
              placeholder="e.g. Which normal form ensures zero transitive functional dependencies?"
              value={newQuestion.question_text}
              onChange={(e) => setNewQuestion(prev => ({ ...prev, question_text: e.target.value }))}
              className="input"
              style={{ height: 'auto', padding: '10px 12px', resize: 'none' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label className="label">Option A Option</label>
              <input
                type="text"
                required
                value={newQuestion.optionA}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, optionA: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="label">Option B Option</label>
              <input
                type="text"
                required
                value={newQuestion.optionB}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, optionB: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="label">Option C Option (Optional)</label>
              <input
                type="text"
                value={newQuestion.optionC}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, optionC: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="label">Option D Option (Optional)</label>
              <input
                type="text"
                value={newQuestion.optionD}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, optionD: e.target.value }))}
                className="input"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label className="label">Correct Choice Answer Option</label>
              <select
                value={newQuestion.correct_answer}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, correct_answer: e.target.value }))}
                className="input"
              >
                <option value={0}>Option A</option>
                <option value={1}>Option B</option>
                <option value={2}>Option C</option>
                <option value={3}>Option D</option>
              </select>
            </div>
            <div>
              <label className="label">Marks Weightage Value</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                required
                value={newQuestion.marks}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, marks: e.target.value }))}
                className="input"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 8 }}
          >
            Add Question to Assessment
          </button>
        </form>
      </Modal>

      {/* UPLOAD LEARNING MATERIAL MODAL */}
      <Modal isOpen={isMaterialModalOpen} onClose={() => setIsMaterialModalOpen(false)} title={`Upload Syllabus Material for ${courseDetailView?.code}`}>
        <form onSubmit={handleUploadMaterial} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="label">Material Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Relational Algebra Cheatsheet & Guide"
              value={newMaterial.title}
              onChange={(e) => setNewMaterial(prev => ({ ...prev, title: e.target.value }))}
              className="input"
            />
          </div>

          <div>
            <label className="label">Description / Summary</label>
            <textarea
              rows={3}
              placeholder="Short summary of files contents or instructions..."
              value={newMaterial.description}
              onChange={(e) => setNewMaterial(prev => ({ ...prev, description: e.target.value }))}
              className="input"
              style={{ height: 'auto', padding: '10px 12px', resize: 'none' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label className="label">Document File Type</label>
              <select
                value={newMaterial.file_type}
                onChange={(e) => setNewMaterial(prev => ({ ...prev, file_type: e.target.value }))}
                className="input"
              >
                <option value="pdf">PDF Document</option>
                <option value="ppt">PPT Slides</option>
                <option value="video">Video Lecture File</option>
                <option value="notes">Notes Text Sheet</option>
                <option value="recording">Recorded online Class</option>
                <option value="other">Other reference File</option>
              </select>
            </div>
            <div>
              <label className="label">Mock Size Value (Bytes)</label>
              <input
                type="number"
                min="0"
                value={newMaterial.file_size}
                onChange={(e) => setNewMaterial(prev => ({ ...prev, file_size: Number(e.target.value) }))}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Upload PDF/ZIP/Video Document</label>
            <FileUpload 
              folderPath="materials"
              allowedTypes={['pdf', 'ppt', 'pptx', 'mp4', 'mov', 'png', 'jpg', 'zip']}
              onUploadSuccess={(url) => setNewMaterial(prev => ({ ...prev, file_url: url }))}
              onUploadError={(err) => setAlert({ type: 'error', message: err })}
            />
            {newMaterial.file_url && (
              <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>
                ✓ Material document uploaded.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 8 }}
          >
            Publish Learning Material
          </button>
        </form>
      </Modal>

      {/* SCHEDULE LIVE CLASS MODAL */}
      <Modal isOpen={isLiveClassModalOpen} onClose={() => setIsLiveClassModalOpen(false)} title={`Schedule Live Class for ${courseDetailView?.code}`}>
        <form onSubmit={handleCreateLiveClass} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="label">Class Title Theme</label>
            <input
              type="text"
              required
              placeholder="e.g. Midterm Schema Design Q&A Workshop"
              value={newLiveClass.title}
              onChange={(e) => setNewLiveClass(prev => ({ ...prev, title: e.target.value }))}
              className="input"
            />
          </div>

          <div>
            <label className="label">Class Agenda & Discussion</label>
            <textarea
              rows={3}
              placeholder="Brief agenda of topics being handled live..."
              value={newLiveClass.description}
              onChange={(e) => setNewLiveClass(prev => ({ ...prev, description: e.target.value }))}
              className="input"
              style={{ height: 'auto', padding: '10px 12px', resize: 'none' }}
            />
          </div>

          <div>
            <label className="label">Meeting Link (Zoom / Meet / Teams URL)</label>
            <input
              type="url"
              required
              placeholder="https://meet.google.com/abc-defg-hij"
              value={newLiveClass.meeting_link}
              onChange={(e) => setNewLiveClass(prev => ({ ...prev, meeting_link: e.target.value }))}
              className="input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label className="label">Calendar Date & Time</label>
              <input
                type="datetime-local"
                required
                value={newLiveClass.scheduled_at}
                onChange={(e) => setNewLiveClass(prev => ({ ...prev, scheduled_at: e.target.value }))}
                className="input"
                style={{ color: 'var(--text-2)' }}
              />
            </div>
            <div>
              <label className="label">Class Duration (Minutes)</label>
              <input
                type="number"
                min="10"
                value={newLiveClass.duration_minutes}
                onChange={(e) => setNewLiveClass(prev => ({ ...prev, duration_minutes: Number(e.target.value) }))}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Stream Status State</label>
            <select
              value={newLiveClass.status}
              onChange={(e) => setNewLiveClass(prev => ({ ...prev, status: e.target.value }))}
              className="input"
            >
              <option value="upcoming">Upcoming Session</option>
              <option value="live">Live Stream Now</option>
              <option value="completed">Completed Session</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 8 }}
          >
            Schedule Live Class Session
          </button>
        </form>
      </Modal>

      {/* RECORDED CLASS MODAL */}
      <Modal isOpen={isRecordedClassModalOpen} onClose={() => setIsRecordedClassModalOpen(false)} title={`Publish Recording for ${courseDetailView?.code}`}>
        <form onSubmit={handleCreateRecordedClass} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="label">Recorded Lecture Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Normalization Forms (1NF, 2NF, 3NF)"
              value={newRecordedClass.title}
              onChange={(e) => setNewRecordedClass(prev => ({ ...prev, title: e.target.value }))}
              className="input"
            />
          </div>

          <div>
            <label className="label">Video Topics Description</label>
            <textarea
              rows={3}
              placeholder="Provide summary description of topics covered..."
              value={newRecordedClass.description}
              onChange={(e) => setNewRecordedClass(prev => ({ ...prev, description: e.target.value }))}
              className="input"
              style={{ height: 'auto', padding: '10px 12px', resize: 'none' }}
            />
          </div>

          <div>
            <label className="label">Video Source Link / URL (YouTube / Vimeo / Cloud)</label>
            <input
              type="text"
              required
              placeholder="https://www.youtube.com/watch?v=..."
              value={newRecordedClass.video_url}
              onChange={(e) => setNewRecordedClass(prev => ({ ...prev, video_url: e.target.value }))}
              className="input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label className="label">Video Length (Mins)</label>
              <input
                type="number"
                min="1"
                value={newRecordedClass.duration_minutes}
                onChange={(e) => setNewRecordedClass(prev => ({ ...prev, duration_minutes: Number(e.target.value) }))}
                className="input"
              />
            </div>
            <div>
              <label className="label">Or Upload Lecture MP4 Video</label>
              <FileUpload 
                folderPath="recordings"
                allowedTypes={['mp4', 'mkv', 'mov', 'webm']}
                onUploadSuccess={(url) => setNewRecordedClass(prev => ({ ...prev, video_url: url }))}
                onUploadError={(err) => setAlert({ type: 'error', message: err })}
              />
              {newRecordedClass.video_url && newRecordedClass.video_url.includes('recordings/') && (
                <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>
                  ✓ Video lecture file uploaded.
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 8 }}
          >
            Publish Recorded Video Lecture
          </button>
        </form>
      </Modal>

      {/* ISSUE CERTIFICATE MODAL */}
      <Modal isOpen={isCertModalOpen} onClose={() => setIsCertModalOpen(false)} title={`Issue Completion Certificate`}>
        <form onSubmit={handleIssueCertificate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)' }}>Recipient Student: <strong style={{ color: 'var(--text)' }}>{selectedCertStudent?.full_name}</strong></p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)' }}>Email: <strong style={{ color: 'var(--text)' }}>{selectedCertStudent?.email}</strong></p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)' }}>Course: <strong style={{ color: 'var(--text)' }}>{selectedCertEnrollment?.course?.title} ({selectedCertEnrollment?.course?.code})</strong></p>
          </div>
          <div>
            <label className="label">Performance Grade Evaluation</label>
            <select
              value={certGrade}
              onChange={(e) => setCertGrade(e.target.value)}
              className="input"
              style={{ width: '100%', height: 38 }}
            >
              <option value="A+">A+ (Distinction / Outstanding)</option>
              <option value="A">A (Excellent / First Class)</option>
              <option value="B">B (Very Good)</option>
              <option value="C">C (Good / Satisfactory)</option>
              <option value="D">D (Pass)</option>
            </select>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>
            Awarding this certificate will officially generate a verified certificate number and register it in the academic system logs. The student will be instantly notified and can view/print their certificate from their portal.
          </p>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }}>
             Generate & Issue Certificate
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default TeacherDashboard;
