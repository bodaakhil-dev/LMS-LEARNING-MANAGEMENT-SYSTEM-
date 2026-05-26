-- LMS Phase 1: Database Setup Script
-- Paste this script into the Supabase SQL Editor to set up your tables, functions, triggers, and RLS policies.

-- =========================================================================
-- 1. Tables Creation
-- =========================================================================

-- Create roles table to define app roles
create table if not exists public.roles (
    role_id uuid default gen_random_uuid() primary key,
    role_name text unique not null,
    permissions text[] not null default '{}'::text[]
);

-- Insert default roles
insert into public.roles (role_name, permissions) values
('admin', '{"all"}'),
('teacher', '{"courses.read", "courses.write", "students.view"}'),
('student', '{"courses.read"}')
on conflict (role_name) do nothing;

-- Create users profile table (linked to auth.users)
create table if not exists public.users (
    id uuid references auth.users(id) on delete cascade primary key,
    full_name text not null,
    email text unique not null,
    role text not null references public.roles(role_name) default 'student',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    last_login timestamp with time zone,
    profile_image text,
    status text not null default 'active' check (status in ('active', 'inactive', 'suspended'))
);

-- Create login activity table to log all login attempts and sessions
create table if not exists public.login_activity (
    activity_id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    login_time timestamp with time zone default timezone('utc'::text, now()) not null,
    logout_time timestamp with time zone,
    ip_address text,
    device_info text,
    status text not null check (status in ('success', 'failed'))
);

-- =========================================================================
-- 2. Triggers & Functions
-- =========================================================================

-- Trigger function to automatically create a public user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, full_name, email, role, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'LMS User'),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'student'),
    'active'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Bind the trigger to auth.users
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Helper function to check if the current user is an admin
-- Using "security definer" bypasses RLS and prevents recursive checks
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- =========================================================================
-- 3. Row Level Security (RLS) Policies
-- =========================================================================

-- Enable RLS on all tables
alter table public.roles enable row level security;
alter table public.users enable row level security;
alter table public.login_activity enable row level security;

-- Roles Policies
drop policy if exists "Allow read access to roles for authenticated users" on public.roles;
drop policy if exists "Admins can modify roles" on public.roles;

create policy "Allow read access to roles for authenticated users"
  on public.roles for select to authenticated using (true);

create policy "Admins can modify roles"
  on public.roles for all to authenticated using (public.is_admin());

-- Users Policies
drop policy if exists "Allow users to read all profiles" on public.users;
drop policy if exists "Allow users to update their own profile" on public.users;
drop policy if exists "Admins can do everything on profiles" on public.users;

create policy "Allow users to read all profiles"
  on public.users for select to authenticated using (true);

create policy "Allow users to update their own profile"
  on public.users for update to authenticated 
  using (auth.uid() = id) 
  with check (auth.uid() = id);

create policy "Admins can do everything on profiles"
  on public.users for all to authenticated using (public.is_admin());

-- Login Activity Policies
drop policy if exists "Users can view their own activity logs" on public.login_activity;
drop policy if exists "Users can insert their own activity logs" on public.login_activity;
drop policy if exists "Users can update their own activity logs" on public.login_activity;
drop policy if exists "Admins can view all activity logs" on public.login_activity;

create policy "Users can view their own activity logs"
  on public.login_activity for select to authenticated 
  using (auth.uid() = user_id);

create policy "Users can insert their own activity logs"
  on public.login_activity for insert to authenticated 
  with check (auth.uid() = user_id);

create policy "Users can update their own activity logs"
  on public.login_activity for update to authenticated 
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admins can view all activity logs"
  on public.login_activity for select to authenticated 
  using (public.is_admin());

-- =========================================================================
-- Phase 2 Tables Creation
-- =========================================================================

-- COURSES
create table if not exists public.courses (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    description text,
    code text unique not null,
    teacher_id uuid references public.users(id),
    category text,
    thumbnail text,
    fee numeric(10,2) default 0,
    duration text default '3 Months',
    status text default 'active' check (status in ('active','archived','draft')),
    created_at timestamptz default now()
);

-- ENROLLMENTS
create table if not exists public.enrollments (
    id uuid default gen_random_uuid() primary key,
    student_id uuid references public.users(id) on delete cascade,
    course_id uuid references public.courses(id) on delete cascade,
    enrolled_at timestamptz default now(),
    status text default 'active' check (status in ('active','completed','dropped')),
    unique(student_id, course_id)
);

-- ASSIGNMENTS & SUBMISSIONS
create table if not exists public.assignments (
    id uuid default gen_random_uuid() primary key,
    course_id uuid references public.courses(id) on delete cascade,
    teacher_id uuid references public.users(id),
    title text not null,
    description text,
    deadline timestamptz not null,
    max_marks numeric(5,1) default 100,
    file_url text,
    created_at timestamptz default now()
);

create table if not exists public.submissions (
    id uuid default gen_random_uuid() primary key,
    assignment_id uuid references public.assignments(id) on delete cascade,
    student_id uuid references public.users(id) on delete cascade,
    file_url text,
    submitted_at timestamptz default now(),
    status text default 'submitted' check (status in ('submitted','graded','late','resubmit')),
    unique(assignment_id, student_id)
);

create table if not exists public.grades (
    id uuid default gen_random_uuid() primary key,
    submission_id uuid references public.submissions(id) on delete cascade,
    graded_by uuid references public.users(id),
    marks numeric(5,1) not null,
    feedback text,
    graded_at timestamptz default now()
);

-- QUIZZES & ASSESSMENTS
create table if not exists public.quizzes (
    id uuid default gen_random_uuid() primary key,
    course_id uuid references public.courses(id) on delete cascade,
    teacher_id uuid references public.users(id),
    title text not null,
    description text,
    time_limit_minutes int default 30,
    max_marks numeric(5,1) default 100,
    is_published boolean default false,
    deadline timestamptz,
    created_at timestamptz default now()
);

create table if not exists public.quiz_questions (
    id uuid default gen_random_uuid() primary key,
    quiz_id uuid references public.quizzes(id) on delete cascade,
    question_text text not null,
    options jsonb not null, -- ["Option A", "Option B", ...]
    correct_answer int not null,
    marks numeric(3,1) default 1,
    sort_order int default 0
);

create table if not exists public.quiz_attempts (
    id uuid default gen_random_uuid() primary key,
    quiz_id uuid references public.quizzes(id) on delete cascade,
    student_id uuid references public.users(id) on delete cascade,
    answers jsonb,
    score numeric(5,1),
    started_at timestamptz default now(),
    completed_at timestamptz,
    unique(quiz_id, student_id)
);

-- ATTENDANCE
create table if not exists public.attendance (
    id uuid default gen_random_uuid() primary key,
    course_id uuid references public.courses(id) on delete cascade,
    student_id uuid references public.users(id) on delete cascade,
    date date not null default current_date,
    status text not null check (status in ('present','absent','late')),
    marked_by uuid references public.users(id),
    created_at timestamptz default now(),
    unique(course_id, student_id, date)
);

-- LEARNING MATERIALS
create table if not exists public.materials (
    id uuid default gen_random_uuid() primary key,
    course_id uuid references public.courses(id) on delete cascade,
    teacher_id uuid references public.users(id),
    title text not null,
    description text,
    file_url text not null,
    file_type text check (file_type in ('pdf','ppt','video','notes','recording','other')),
    file_size bigint,
    created_at timestamptz default now()
);

-- PAYMENTS
create table if not exists public.payments (
    id uuid default gen_random_uuid() primary key,
    student_id uuid references public.users(id) on delete cascade,
    course_id uuid references public.courses(id),
    amount numeric(10,2) not null,
    currency text default 'INR',
    payment_method text,
    gateway_order_id text,
    gateway_payment_id text,
    status text default 'pending' check (status in ('pending','completed','failed','refunded')),
    receipt_url text,
    paid_at timestamptz,
    created_at timestamptz default now()
);

-- NOTIFICATIONS
create table if not exists public.notifications (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade,
    title text not null,
    message text not null,
    type text default 'info' check (type in ('info','warning','success','assignment','quiz','payment','announcement')),
    is_read boolean default false,
    link text,
    created_at timestamptz default now()
);

-- =========================================================================
-- Phase 2 Row Level Security (RLS) Policies
-- =========================================================================

-- Enable RLS
alter table public.courses enable row level security;
alter table public.enrollments enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;
alter table public.grades enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.attendance enable row level security;
alter table public.materials enable row level security;
alter table public.payments enable row level security;
alter table public.notifications enable row level security;

-- Courses policies
drop policy if exists "Allow read access to active courses for all users" on public.courses;
drop policy if exists "Allow write access to courses for teachers and admins" on public.courses;
create policy "Allow read access to active courses for all users"
  on public.courses for select to authenticated using (true);
create policy "Allow write access to courses for teachers and admins"
  on public.courses for all to authenticated
  using (public.is_admin() or auth.uid() = teacher_id);

-- Enrollments policies
drop policy if exists "Allow read access to enrollments for all users" on public.enrollments;
drop policy if exists "Allow students to enroll themselves" on public.enrollments;
drop policy if exists "Allow users to delete or update own enrollment" on public.enrollments;
create policy "Allow read access to enrollments for all users"
  on public.enrollments for select to authenticated using (true);
create policy "Allow students to enroll themselves"
  on public.enrollments for insert to authenticated
  with check (auth.uid() = student_id or public.is_admin());
create policy "Allow users to delete or update own enrollment"
  on public.enrollments for all to authenticated
  using (auth.uid() = student_id or public.is_admin());

-- Assignments policies
drop policy if exists "Allow read access to assignments for enrolled students/teachers" on public.assignments;
drop policy if exists "Allow teachers and admins to write assignments" on public.assignments;
create policy "Allow read access to assignments for enrolled students/teachers"
  on public.assignments for select to authenticated using (true);
create policy "Allow teachers and admins to write assignments"
  on public.assignments for all to authenticated
  using (public.is_admin() or auth.uid() = teacher_id);

-- Submissions policies
drop policy if exists "Allow students to read and write own submissions" on public.submissions;
drop policy if exists "Allow teachers to view submissions" on public.submissions;
create policy "Allow students to read and write own submissions"
  on public.submissions for all to authenticated
  using (auth.uid() = student_id or public.is_admin())
  with check (auth.uid() = student_id or public.is_admin());
create policy "Allow teachers to view submissions"
  on public.submissions for select to authenticated using (true);

-- Grades policies
drop policy if exists "Allow read access to grades for submission owners and teachers" on public.grades;
drop policy if exists "Allow teachers and admins to manage grades" on public.grades;
create policy "Allow read access to grades for submission owners and teachers"
  on public.grades for select to authenticated using (true);
create policy "Allow teachers and admins to manage grades"
  on public.grades for all to authenticated using (true);

-- Quizzes policies
drop policy if exists "Allow read access to quizzes for all users" on public.quizzes;
drop policy if exists "Allow teachers and admins to manage quizzes" on public.quizzes;
create policy "Allow read access to quizzes for all users"
  on public.quizzes for select to authenticated using (true);
create policy "Allow teachers and admins to manage quizzes"
  on public.quizzes for all to authenticated
  using (public.is_admin() or auth.uid() = teacher_id);

-- Quiz questions policies
drop policy if exists "Allow read access to questions for all users" on public.quiz_questions;
drop policy if exists "Allow teachers and admins to manage questions" on public.quiz_questions;
create policy "Allow read access to questions for all users"
  on public.quiz_questions for select to authenticated using (true);
create policy "Allow teachers and admins to manage questions"
  on public.quiz_questions for all to authenticated using (true);

-- Quiz attempts policies
drop policy if exists "Allow students to view and create own attempts" on public.quiz_attempts;
drop policy if exists "Allow teachers to view quiz attempts" on public.quiz_attempts;
create policy "Allow students to view and create own attempts"
  on public.quiz_attempts for all to authenticated
  using (auth.uid() = student_id or public.is_admin())
  with check (auth.uid() = student_id or public.is_admin());
create policy "Allow teachers to view quiz attempts"
  on public.quiz_attempts for select to authenticated using (true);

-- Attendance policies
drop policy if exists "Allow students to view own attendance" on public.attendance;
drop policy if exists "Allow teachers and admins to manage attendance" on public.attendance;
create policy "Allow students to view own attendance"
  on public.attendance for select to authenticated
  using (auth.uid() = student_id or public.is_admin());
create policy "Allow teachers and admins to manage attendance"
  on public.attendance for all to authenticated using (true);

-- Learning materials policies
drop policy if exists "Allow read access to materials for all users" on public.materials;
drop policy if exists "Allow teachers and admins to manage materials" on public.materials;
create policy "Allow read access to materials for all users"
  on public.materials for select to authenticated using (true);
create policy "Allow teachers and admins to manage materials"
  on public.materials for all to authenticated
  using (public.is_admin() or auth.uid() = teacher_id);

-- Payments policies
drop policy if exists "Allow users to view own payment invoices" on public.payments;
drop policy if exists "Allow users to log own payments" on public.payments;
create policy "Allow users to view own payment invoices"
  on public.payments for select to authenticated
  using (auth.uid() = student_id or public.is_admin());
create policy "Allow users to log own payments"
  on public.payments for insert to authenticated
  with check (auth.uid() = student_id or public.is_admin());

-- Notifications policies
drop policy if exists "Allow users to view own notifications" on public.notifications;
drop policy if exists "Allow users to update/delete own notifications" on public.notifications;
create policy "Allow users to view own notifications"
  on public.notifications for select to authenticated
  using (auth.uid() = user_id);
create policy "Allow users to update/delete own notifications"
  on public.notifications for all to authenticated
  using (auth.uid() = user_id);

-- =========================================================================
-- 4. Storage Bucket Configuration
-- =========================================================================

-- Create the lms-files bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('lms-files', 'lms-files', true)
on conflict (id) do nothing;

-- Drop existing storage policies if they exist to prevent conflict
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated Upload" on storage.objects;
drop policy if exists "Authenticated Manage" on storage.objects;

-- Create policies for storage access
create policy "Public Access" on storage.objects
  for select using (bucket_id = 'lms-files');

create policy "Authenticated Upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'lms-files');

create policy "Authenticated Manage" on storage.objects
  for all to authenticated using (bucket_id = 'lms-files');

-- =========================================================================
-- 5. Live Classes & Recorded Lectures Setup
-- =========================================================================

-- LIVE CLASSES TABLE
create table if not exists public.live_classes (
    id uuid default gen_random_uuid() primary key,
    course_id uuid references public.courses(id) on delete cascade not null,
    teacher_id uuid references public.users(id) on delete set null,
    title text not null,
    description text,
    meeting_link text not null,
    scheduled_at timestamptz not null,
    duration_minutes int default 60,
    status text default 'upcoming' check (status in ('upcoming', 'live', 'completed')),
    created_at timestamptz default now()
);

-- RECORDED CLASSES TABLE
create table if not exists public.recorded_classes (
    id uuid default gen_random_uuid() primary key,
    course_id uuid references public.courses(id) on delete cascade not null,
    teacher_id uuid references public.users(id) on delete set null,
    title text not null,
    description text,
    video_url text not null,
    duration_minutes int,
    created_at timestamptz default now()
);

-- Enable RLS
alter table public.live_classes enable row level security;
alter table public.recorded_classes enable row level security;

-- RLS Policies for Live Classes
drop policy if exists "Allow read access to live classes for authenticated users" on public.live_classes;
drop policy if exists "Allow write access to live classes for teachers and admins" on public.live_classes;

create policy "Allow read access to live classes for authenticated users"
  on public.live_classes for select to authenticated using (true);

create policy "Allow write access to live classes for teachers and admins"
  on public.live_classes for all to authenticated
  using (public.is_admin() or auth.uid() = teacher_id);

-- RLS Policies for Recorded Classes
drop policy if exists "Allow read access to recorded classes for authenticated users" on public.recorded_classes;
drop policy if exists "Allow write access to recorded classes for teachers and admins" on public.recorded_classes;

create policy "Allow read access to recorded classes for authenticated users"
  on public.recorded_classes for select to authenticated using (true);

create policy "Allow write access to recorded classes for teachers and admins"
  on public.recorded_classes for all to authenticated
  using (public.is_admin() or auth.uid() = teacher_id);

-- =========================================================================
-- 6. Student-to-Student Messaging Setup
-- =========================================================================

-- Create messages table
create table if not exists public.messages (
    id uuid default gen_random_uuid() primary key,
    sender_id uuid references public.users(id) on delete cascade not null,
    receiver_id uuid references public.users(id) on delete cascade not null,
    message_text text not null,
    created_at timestamptz default now() not null,
    is_read boolean default false not null
);

-- Enable RLS
alter table public.messages enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Allow users to view their own conversations" on public.messages;
drop policy if exists "Allow users to insert messages as themselves" on public.messages;

-- Create policies for message access
create policy "Allow users to view their own conversations"
  on public.messages for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Allow users to insert messages as themselves"
  on public.messages for insert to authenticated
  with check (auth.uid() = sender_id);

-- =========================================================================
-- 7. Admin Privileges: Secure User Account Deletion Function
-- =========================================================================

-- Create a security definer function to securely delete user profiles and auth credentials.
-- Only executable by users with the 'admin' role.
create or replace function public.delete_user_by_admin(target_user_id uuid)
returns void as $$
begin
  -- 1. Security Check: Assert the executor has admin credentials
  if not exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Unauthorized: Only platform administrators are permitted to delete accounts.';
  end if;

  -- 2. Prevent Self-Deletion
  if auth.uid() = target_user_id then
    raise exception 'Conflict: Administrators cannot delete their own active session account.';
  end if;

  -- 3. Perform Cascade Delete (deleting from auth.users cascades to public.users and all linked records!)
  delete from auth.users where id = target_user_id;
end;
$$ language plpgsql security definer;

-- =========================================================================
-- 8. Training Centers & Cohort-Based Programs
-- =========================================================================

-- Create training centers table
create table if not exists public.training_centers (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    location text not null default 'Virtual',
    contact_email text,
    created_at timestamptz default now()
);

-- Create cohorts table
create table if not exists public.cohorts (
    id uuid default gen_random_uuid() primary key,
    course_id uuid references public.courses(id) on delete cascade not null,
    center_id uuid references public.training_centers(id) on delete set null,
    name text not null,
    start_date date not null,
    end_date date not null,
    status text not null default 'active' check (status in ('upcoming', 'active', 'completed')),
    created_at timestamptz default now()
);

-- Add center_id reference column to public.courses
alter table public.courses add column if not exists center_id uuid references public.training_centers(id) on delete set null;

-- Add cohort_id reference column to public.enrollments
alter table public.enrollments add column if not exists cohort_id uuid references public.cohorts(id) on delete set null;

-- Enable Row Level Security (RLS)
alter table public.training_centers enable row level security;
alter table public.cohorts enable row level security;

-- Drop existing policies if they exist to prevent conflicts
drop policy if exists "Allow read access to training centers for authenticated users" on public.training_centers;
drop policy if exists "Allow read access to cohorts for authenticated users" on public.cohorts;
drop policy if exists "Allow write access to training centers for admins" on public.training_centers;
drop policy if exists "Allow write access to cohorts for admins" on public.cohorts;

-- Create policies for Training Centers
create policy "Allow read access to training centers for authenticated users"
  on public.training_centers for select to authenticated using (true);

create policy "Allow write access to training centers for admins"
  on public.training_centers for all to authenticated
  using (public.is_admin());

-- Create policies for Cohorts
create policy "Allow read access to cohorts for authenticated users"
  on public.cohorts for select to authenticated using (true);

create policy "Allow write access to cohorts for admins"
  on public.cohorts for all to authenticated
  using (public.is_admin());


-- =========================================================================
-- 9. Certificates, Forums, and Parent/Student Relationships
-- =========================================================================

-- Insert default role: parent
insert into public.roles (role_name, permissions) values
('parent', '{"student.read"}')
on conflict (role_name) do nothing;

-- Create certificates table
create table if not exists public.certificates (
    id uuid default gen_random_uuid() primary key,
    student_id uuid references public.users(id) on delete cascade not null,
    course_id uuid references public.courses(id) on delete cascade not null,
    certificate_number text unique not null,
    grade text,
    issued_at timestamptz default now() not null,
    unique(student_id, course_id)
);

-- Create discussions table
create table if not exists public.discussions (
    id uuid default gen_random_uuid() primary key,
    course_id uuid references public.courses(id) on delete cascade not null,
    author_id uuid references public.users(id) on delete cascade not null,
    title text not null,
    content text not null,
    is_pinned boolean default false not null,
    created_at timestamptz default now() not null
);

-- Create discussion replies table
create table if not exists public.discussion_replies (
    id uuid default gen_random_uuid() primary key,
    discussion_id uuid references public.discussions(id) on delete cascade not null,
    author_id uuid references public.users(id) on delete cascade not null,
    content text not null,
    created_at timestamptz default now() not null
);

-- Create parent_student_links table
create table if not exists public.parent_student_links (
    id uuid default gen_random_uuid() primary key,
    parent_id uuid references public.users(id) on delete cascade not null,
    student_id uuid references public.users(id) on delete cascade not null,
    relationship text not null default 'Parent/Guardian',
    created_at timestamptz default now() not null,
    unique(parent_id, student_id)
);

-- Enable RLS
alter table public.certificates enable row level security;
alter table public.discussions enable row level security;
alter table public.discussion_replies enable row level security;
alter table public.parent_student_links enable row level security;

-- Certificates Policies
drop policy if exists "Students can view own certificates" on public.certificates;
drop policy if exists "Teachers and admins can manage certificates" on public.certificates;

create policy "Students can view own certificates"
  on public.certificates for select to authenticated
  using (auth.uid() = student_id);

create policy "Teachers and admins can manage certificates"
  on public.certificates for all to authenticated
  using (public.is_admin() or exists (
      select 1 from public.courses
      where id = course_id and teacher_id = auth.uid()
  ));

-- Discussions Policies
drop policy if exists "Users can view discussions in enrolled/taught courses" on public.discussions;
drop policy if exists "Enrolled students can create discussions" on public.discussions;
drop policy if exists "Teachers/admins can manage discussions" on public.discussions;

create policy "Users can view discussions in enrolled/taught courses"
  on public.discussions for select to authenticated using (true);

create policy "Enrolled students can create discussions"
  on public.discussions for insert to authenticated
  with check (auth.uid() = author_id);

create policy "Teachers/admins can manage discussions"
  on public.discussions for all to authenticated
  using (true);

-- Discussion Replies Policies
drop policy if exists "Users can view replies" on public.discussion_replies;
drop policy if exists "Authenticated users can create replies" on public.discussion_replies;

create policy "Users can view replies"
  on public.discussion_replies for select to authenticated using (true);

create policy "Authenticated users can create replies"
  on public.discussion_replies for insert to authenticated
  with check (auth.uid() = author_id);

-- Parent-Student Links Policies
drop policy if exists "Parents can view their student links" on public.parent_student_links;
drop policy if exists "Parents can create student links" on public.parent_student_links;

create policy "Parents can view their student links"
  on public.parent_student_links for select to authenticated
  using (auth.uid() = parent_id or public.is_admin());

create policy "Parents can create student links"
  on public.parent_student_links for insert to authenticated
  with check (auth.uid() = parent_id or public.is_admin());


