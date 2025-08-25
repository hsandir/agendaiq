--
-- PostgreSQL database dump
--

-- Dumped from database version 14.15 (Homebrew)
-- Dumped by pg_dump version 14.15 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: ActionItemStatus; Type: TYPE; Schema: public; Owner: hs
--

CREATE TYPE public."ActionItemStatus" AS ENUM (
    'Pending',
    'InProgress',
    'Completed',
    'Cancelled',
    'Deferred',
    'Overdue'
);


ALTER TYPE public."ActionItemStatus" OWNER TO hs;

--
-- Name: AgendaItemStatus; Type: TYPE; Schema: public; Owner: hs
--

CREATE TYPE public."AgendaItemStatus" AS ENUM (
    'Ongoing',
    'Resolved',
    'Assigned_to_local',
    'Pending',
    'Deferred',
    'CarriedForward'
);


ALTER TYPE public."AgendaItemStatus" OWNER TO hs;

--
-- Name: AuditCategory; Type: TYPE; Schema: public; Owner: hs
--

CREATE TYPE public."AuditCategory" AS ENUM (
    'AUTH',
    'SECURITY',
    'DATA_CRITICAL',
    'PERMISSION',
    'SYSTEM'
);


ALTER TYPE public."AuditCategory" OWNER TO hs;

--
-- Name: AuditLogCategory; Type: TYPE; Schema: public; Owner: hs
--

CREATE TYPE public."AuditLogCategory" AS ENUM (
    'user_action',
    'login_attempt',
    'permission_check',
    'data_access',
    'data_modification',
    'admin_action',
    'security_violation',
    'compliance',
    'export',
    'import'
);


ALTER TYPE public."AuditLogCategory" OWNER TO hs;

--
-- Name: AuditLogResult; Type: TYPE; Schema: public; Owner: hs
--

CREATE TYPE public."AuditLogResult" AS ENUM (
    'success',
    'failure',
    'blocked'
);


ALTER TYPE public."AuditLogResult" OWNER TO hs;

--
-- Name: DecisionType; Type: TYPE; Schema: public; Owner: hs
--

CREATE TYPE public."DecisionType" AS ENUM (
    'Technical',
    'Adaptive',
    'Both'
);


ALTER TYPE public."DecisionType" OWNER TO hs;

--
-- Name: DevLogCategory; Type: TYPE; Schema: public; Owner: hs
--

CREATE TYPE public."DevLogCategory" AS ENUM (
    'system',
    'database',
    'api',
    'auth',
    'performance',
    'error',
    'network',
    'cache',
    'external',
    'build'
);


ALTER TYPE public."DevLogCategory" OWNER TO hs;

--
-- Name: LogLevel; Type: TYPE; Schema: public; Owner: hs
--

CREATE TYPE public."LogLevel" AS ENUM (
    'TRACE',
    'DEBUG',
    'INFO',
    'WARN',
    'ERROR',
    'FATAL'
);


ALTER TYPE public."LogLevel" OWNER TO hs;

--
-- Name: Priority; Type: TYPE; Schema: public; Owner: hs
--

CREATE TYPE public."Priority" AS ENUM (
    'Low',
    'Medium',
    'High'
);


ALTER TYPE public."Priority" OWNER TO hs;

--
-- Name: Purpose; Type: TYPE; Schema: public; Owner: hs
--

CREATE TYPE public."Purpose" AS ENUM (
    'Information_Sharing',
    'Discussion',
    'Decision',
    'Reminder'
);


ALTER TYPE public."Purpose" OWNER TO hs;

--
-- Name: RiskLevel; Type: TYPE; Schema: public; Owner: hs
--

CREATE TYPE public."RiskLevel" AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);


ALTER TYPE public."RiskLevel" OWNER TO hs;

--
-- Name: SolutionType; Type: TYPE; Schema: public; Owner: hs
--

CREATE TYPE public."SolutionType" AS ENUM (
    'Technical',
    'Adaptive',
    'Both'
);


ALTER TYPE public."SolutionType" OWNER TO hs;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: department; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public.department (
    id integer NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    category text,
    school_id integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    level integer DEFAULT 0 NOT NULL,
    parent_id integer
);


ALTER TABLE public.department OWNER TO hs;

--
-- Name: Department_id_seq; Type: SEQUENCE; Schema: public; Owner: hs
--

CREATE SEQUENCE public."Department_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Department_id_seq" OWNER TO hs;

--
-- Name: Department_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public."Department_id_seq" OWNED BY public.department.id;


--
-- Name: district; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public.district (
    name text NOT NULL,
    address text,
    code text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    id integer NOT NULL
);


ALTER TABLE public.district OWNER TO hs;

--
-- Name: District_id_seq; Type: SEQUENCE; Schema: public; Owner: hs
--

CREATE SEQUENCE public."District_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."District_id_seq" OWNER TO hs;

--
-- Name: District_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public."District_id_seq" OWNED BY public.district.id;


--
-- Name: meeting_attendee; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public.meeting_attendee (
    status text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    meeting_id integer NOT NULL,
    staff_id integer NOT NULL,
    id integer NOT NULL,
    attended boolean DEFAULT false NOT NULL
);


ALTER TABLE public.meeting_attendee OWNER TO hs;

--
-- Name: MeetingAttendee_id_seq; Type: SEQUENCE; Schema: public; Owner: hs
--

CREATE SEQUENCE public."MeetingAttendee_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."MeetingAttendee_id_seq" OWNER TO hs;

--
-- Name: MeetingAttendee_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public."MeetingAttendee_id_seq" OWNED BY public.meeting_attendee.id;


--
-- Name: meeting; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public.meeting (
    title text NOT NULL,
    description text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    department_id integer NOT NULL,
    district_id integer NOT NULL,
    end_time timestamp(3) without time zone,
    organizer_id integer NOT NULL,
    school_id integer NOT NULL,
    start_time timestamp(3) without time zone,
    zoom_join_url text,
    zoom_meeting_id text,
    id integer NOT NULL,
    action_items text,
    agenda text,
    calendar_integration text,
    decisions text,
    is_continuation boolean DEFAULT false NOT NULL,
    meeting_type text,
    notes text,
    parent_meeting_id integer,
    repeat_type text,
    status text DEFAULT 'draft'::text NOT NULL,
    template_id integer,
    is_series_master boolean DEFAULT false NOT NULL,
    repeat_end_date timestamp(3) without time zone,
    repeat_end_type text,
    repeat_exceptions timestamp(3) without time zone[] DEFAULT (ARRAY[]::timestamp without time zone[])::timestamp(3) without time zone[],
    repeat_interval integer,
    repeat_month_day integer,
    repeat_month_week integer,
    repeat_month_weekday integer,
    repeat_occurrences integer,
    repeat_pattern text,
    repeat_weekdays integer[] DEFAULT ARRAY[]::integer[],
    series_id text,
    series_position integer,
    location text,
    zoom_link text,
    team_id text,
    repeat_until date
);


ALTER TABLE public.meeting OWNER TO hs;

--
-- Name: Meeting_id_seq; Type: SEQUENCE; Schema: public; Owner: hs
--

CREATE SEQUENCE public."Meeting_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Meeting_id_seq" OWNER TO hs;

--
-- Name: Meeting_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public."Meeting_id_seq" OWNED BY public.meeting.id;


--
-- Name: permission; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public.permission (
    id integer NOT NULL,
    role_id integer NOT NULL,
    capability text NOT NULL,
    resource text,
    action text,
    conditions jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.permission OWNER TO hs;

--
-- Name: Permission_id_seq; Type: SEQUENCE; Schema: public; Owner: hs
--

CREATE SEQUENCE public."Permission_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Permission_id_seq" OWNER TO hs;

--
-- Name: Permission_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public."Permission_id_seq" OWNED BY public.permission.id;


--
-- Name: role_hierarchy; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public.role_hierarchy (
    id integer NOT NULL,
    parent_role_id integer NOT NULL,
    child_role_id integer NOT NULL,
    hierarchy_level integer DEFAULT 1 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.role_hierarchy OWNER TO hs;

--
-- Name: RoleHierarchy_id_seq; Type: SEQUENCE; Schema: public; Owner: hs
--

CREATE SEQUENCE public."RoleHierarchy_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."RoleHierarchy_id_seq" OWNER TO hs;

--
-- Name: RoleHierarchy_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public."RoleHierarchy_id_seq" OWNED BY public.role_hierarchy.id;


--
-- Name: role; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public.role (
    id integer NOT NULL,
    title text NOT NULL,
    key text,
    priority integer DEFAULT 0 NOT NULL,
    category text,
    department_id integer,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_leadership boolean DEFAULT false NOT NULL,
    level integer DEFAULT 0 NOT NULL,
    parent_id integer,
    extension text,
    is_coordinator boolean DEFAULT false NOT NULL,
    is_supervisor boolean DEFAULT false NOT NULL,
    room text
);


ALTER TABLE public.role OWNER TO hs;

--
-- Name: Role_id_seq; Type: SEQUENCE; Schema: public; Owner: hs
--

CREATE SEQUENCE public."Role_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Role_id_seq" OWNER TO hs;

--
-- Name: Role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public."Role_id_seq" OWNED BY public.role.id;


--
-- Name: school; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public.school (
    name text NOT NULL,
    address text,
    code text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    district_id integer NOT NULL,
    id integer NOT NULL
);


ALTER TABLE public.school OWNER TO hs;

--
-- Name: School_id_seq; Type: SEQUENCE; Schema: public; Owner: hs
--

CREATE SEQUENCE public."School_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."School_id_seq" OWNER TO hs;

--
-- Name: School_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public."School_id_seq" OWNED BY public.school.id;


--
-- Name: staff; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public.staff (
    id integer NOT NULL,
    user_id integer NOT NULL,
    department_id integer NOT NULL,
    role_id integer NOT NULL,
    manager_id integer,
    flags text[],
    endorsements text[],
    school_id integer NOT NULL,
    district_id integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    extension text,
    hire_date timestamp(3) without time zone,
    is_active boolean DEFAULT true NOT NULL,
    room text
);


ALTER TABLE public.staff OWNER TO hs;

--
-- Name: Staff_id_seq; Type: SEQUENCE; Schema: public; Owner: hs
--

CREATE SEQUENCE public."Staff_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Staff_id_seq" OWNER TO hs;

--
-- Name: Staff_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public."Staff_id_seq" OWNED BY public.staff.id;


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO hs;

--
-- Name: account; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public.account (
    id text NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    provider_account_id text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_state text,
    user_id integer NOT NULL
);


ALTER TABLE public.account OWNER TO hs;

--
-- Name: agenda_item_attachments; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public.agenda_item_attachments (
    id integer NOT NULL,
    agenda_item_id integer NOT NULL,
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_size integer NOT NULL,
    content_type text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    uploaded_by_id integer NOT NULL
);


ALTER TABLE public.agenda_item_attachments OWNER TO hs;

--
-- Name: agenda_item_attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: hs
--

CREATE SEQUENCE public.agenda_item_attachments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.agenda_item_attachments_id_seq OWNER TO hs;

--
-- Name: agenda_item_attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public.agenda_item_attachments_id_seq OWNED BY public.agenda_item_attachments.id;


--
-- Name: agenda_item_comments; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public.agenda_item_comments (
    id integer NOT NULL,
    agenda_item_id integer NOT NULL,
    staff_id integer NOT NULL,
    comment text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.agenda_item_comments OWNER TO hs;

--
-- Name: agenda_item_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: hs
--

CREATE SEQUENCE public.agenda_item_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.agenda_item_comments_id_seq OWNER TO hs;

--
-- Name: agenda_item_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public.agenda_item_comments_id_seq OWNED BY public.agenda_item_comments.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    table_name text NOT NULL,
    record_id text NOT NULL,
    operation text NOT NULL,
    field_changes jsonb,
    old_values jsonb,
    new_values jsonb,
    user_id integer,
    staff_id integer,
    source text NOT NULL,
    description text,
    ip_address text,
    user_agent text,
    metadata jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO hs;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: hs
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.audit_logs_id_seq OWNER TO hs;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: critical_audit_logs; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public.critical_audit_logs (
    id integer NOT NULL,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    category public."AuditCategory" NOT NULL,
    action text NOT NULL,
    user_id integer,
    staff_id integer,
    target_user_id integer,
    target_staff_id integer,
    ip_address text,
    session_id text,
    risk_score integer DEFAULT 0 NOT NULL,
    success boolean DEFAULT true NOT NULL,
    error_message text,
    metadata jsonb
);


ALTER TABLE public.critical_audit_logs OWNER TO hs;

--
-- Name: critical_audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: hs
--

CREATE SEQUENCE public.critical_audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.critical_audit_logs_id_seq OWNER TO hs;

--
-- Name: critical_audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public.critical_audit_logs_id_seq OWNED BY public.critical_audit_logs.id;


--
-- Name: department_id_seq; Type: SEQUENCE; Schema: public; Owner: hs
--

CREATE SEQUENCE public.department_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.department_id_seq OWNER TO hs;

--
-- Name: department_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public.department_id_seq OWNED BY public.department.id;


--
-- Name: dev_logs; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public.dev_logs (
    id text NOT NULL,
    "timestamp" timestamp(3) without time zone NOT NULL,
    level public."LogLevel" NOT NULL,
    message text NOT NULL,
    category public."DevLogCategory" NOT NULL,
    component text,
    function text,
    file text,
    line integer,
    stack text,
    environment text DEFAULT 'development'::text NOT NULL,
    context text,
    metadata text,
    performance text,
    user_id integer,
    staff_id integer,
    session_id text,
    user_agent text,
    ip text,
    path text,
    method text,
    status_code integer,
    duration integer,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.dev_logs OWNER TO hs;

--
-- Name: devices; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public.devices (
    id integer NOT NULL,
    user_id integer NOT NULL,
    device_id text NOT NULL,
    device_name text NOT NULL,
    device_type text NOT NULL,
    device_os text,
    browser text,
    ip_address text,
    last_active timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_trusted boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.devices OWNER TO hs;

--
-- Name: devices_id_seq; Type: SEQUENCE; Schema: public; Owner: hs
--

CREATE SEQUENCE public.devices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.devices_id_seq OWNER TO hs;

--
-- Name: devices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public.devices_id_seq OWNED BY public.devices.id;


--
-- Name: district_id_seq; Type: SEQUENCE; Schema: public; Owner: hs
--

CREATE SEQUENCE public.district_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.district_id_seq OWNER TO hs;

--
-- Name: district_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public.district_id_seq OWNED BY public.district.id;


--
-- Name: meeting_action_items; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public.meeting_action_items (
    id integer NOT NULL,
    meeting_id integer NOT NULL,
    agenda_item_id integer,
    title text NOT NULL,
    description text,
    assigned_to integer NOT NULL,
    due_date timestamp(3) without time zone,
    completed_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    assigned_to_role integer,
    carry_forward_count integer DEFAULT 0 NOT NULL,
    completed_by integer,
    notes text,
    parent_action_id integer,
    priority public."Priority" DEFAULT 'Medium'::public."Priority" NOT NULL,
    status public."ActionItemStatus" DEFAULT 'Pending'::public."ActionItemStatus" NOT NULL
);


ALTER TABLE public.meeting_action_items OWNER TO hs;

--
-- Name: meeting_action_items_id_seq; Type: SEQUENCE; Schema: public; Owner: hs
--

CREATE SEQUENCE public.meeting_action_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.meeting_action_items_id_seq OWNER TO hs;

--
-- Name: meeting_action_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public.meeting_action_items_id_seq OWNED BY public.meeting_action_items.id;


--
-- Name: meeting_agenda_items; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public.meeting_agenda_items (
    id integer NOT NULL,
    meeting_id integer NOT NULL,
    topic text NOT NULL,
    problem_statement text,
    staff_initials text,
    responsible_staff_id integer,
    priority public."Priority" DEFAULT 'Medium'::public."Priority" NOT NULL,
    purpose public."Purpose" NOT NULL,
    proposed_solution text,
    solution_type public."SolutionType",
    decisions_actions text,
    decision_type public."DecisionType",
    status public."AgendaItemStatus" DEFAULT 'Pending'::public."AgendaItemStatus" NOT NULL,
    future_implications boolean DEFAULT false,
    order_index integer DEFAULT 0 NOT NULL,
    duration_minutes integer,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    carried_forward boolean DEFAULT false NOT NULL,
    carry_forward_count integer DEFAULT 0 NOT NULL,
    parent_item_id integer,
    responsible_role_id integer
);


ALTER TABLE public.meeting_agenda_items OWNER TO hs;

--
-- Name: meeting_agenda_items_id_seq; Type: SEQUENCE; Schema: public; Owner: hs
--

CREATE SEQUENCE public.meeting_agenda_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.meeting_agenda_items_id_seq OWNER TO hs;

--
-- Name: meeting_agenda_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public.meeting_agenda_items_id_seq OWNED BY public.meeting_agenda_items.id;


--
-- Name: meeting_attendee_id_seq; Type: SEQUENCE; Schema: public; Owner: hs
--

CREATE SEQUENCE public.meeting_attendee_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.meeting_attendee_id_seq OWNER TO hs;

--
-- Name: meeting_attendee_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public.meeting_attendee_id_seq OWNED BY public.meeting_attendee.id;


--
-- Name: meeting_audit_logs; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public.meeting_audit_logs (
    id integer NOT NULL,
    meeting_id integer NOT NULL,
    user_id integer NOT NULL,
    staff_id integer,
    action text NOT NULL,
    details text,
    changes jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.meeting_audit_logs OWNER TO hs;

--
-- Name: meeting_audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: hs
--

CREATE SEQUENCE public.meeting_audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.meeting_audit_logs_id_seq OWNER TO hs;

--
-- Name: meeting_audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public.meeting_audit_logs_id_seq OWNED BY public.meeting_audit_logs.id;


--
-- Name: meeting_id_seq; Type: SEQUENCE; Schema: public; Owner: hs
--

CREATE SEQUENCE public.meeting_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.meeting_id_seq OWNER TO hs;

--
-- Name: meeting_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public.meeting_id_seq OWNED BY public.meeting.id;


--
-- Name: meeting_notes; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public.meeting_notes (
    id integer NOT NULL,
    meeting_id integer NOT NULL,
    staff_id integer NOT NULL,
    content text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.meeting_notes OWNER TO hs;

--
-- Name: meeting_notes_id_seq; Type: SEQUENCE; Schema: public; Owner: hs
--

CREATE SEQUENCE public.meeting_notes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.meeting_notes_id_seq OWNER TO hs;

--
-- Name: meeting_notes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public.meeting_notes_id_seq OWNED BY public.meeting_notes.id;


--
-- Name: meeting_search; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public.meeting_search (
    id integer NOT NULL,
    meeting_id integer NOT NULL,
    content text NOT NULL,
    search_text text NOT NULL,
    metadata jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.meeting_search OWNER TO hs;

--
-- Name: meeting_search_id_seq; Type: SEQUENCE; Schema: public; Owner: hs
--

CREATE SEQUENCE public.meeting_search_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.meeting_search_id_seq OWNER TO hs;

--
-- Name: meeting_search_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public.meeting_search_id_seq OWNED BY public.meeting_search.id;


--
-- Name: meeting_templates; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public.meeting_templates (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    duration integer DEFAULT 60 NOT NULL,
    agenda text,
    attendees text[],
    is_active boolean DEFAULT true NOT NULL,
    created_by integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.meeting_templates OWNER TO hs;

--
-- Name: meeting_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: hs
--

CREATE SEQUENCE public.meeting_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.meeting_templates_id_seq OWNER TO hs;

--
-- Name: meeting_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public.meeting_templates_id_seq OWNED BY public.meeting_templates.id;


--
-- Name: meeting_transcripts; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public.meeting_transcripts (
    id integer NOT NULL,
    meeting_id integer NOT NULL,
    full_text text,
    summary text,
    key_points text[],
    ai_summary text,
    speakers jsonb,
    timestamps jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.meeting_transcripts OWNER TO hs;

--
-- Name: meeting_transcripts_id_seq; Type: SEQUENCE; Schema: public; Owner: hs
--

CREATE SEQUENCE public.meeting_transcripts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.meeting_transcripts_id_seq OWNER TO hs;

--
-- Name: meeting_transcripts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public.meeting_transcripts_id_seq OWNED BY public.meeting_transcripts.id;


--
-- Name: permission_id_seq; Type: SEQUENCE; Schema: public; Owner: hs
--

CREATE SEQUENCE public.permission_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.permission_id_seq OWNER TO hs;

--
-- Name: permission_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public.permission_id_seq OWNED BY public.permission.id;


--
-- Name: role_hierarchy_id_seq; Type: SEQUENCE; Schema: public; Owner: hs
--

CREATE SEQUENCE public.role_hierarchy_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.role_hierarchy_id_seq OWNER TO hs;

--
-- Name: role_hierarchy_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public.role_hierarchy_id_seq OWNED BY public.role_hierarchy.id;


--
-- Name: role_id_seq; Type: SEQUENCE; Schema: public; Owner: hs
--

CREATE SEQUENCE public.role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.role_id_seq OWNER TO hs;

--
-- Name: role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public.role_id_seq OWNED BY public.role.id;


--
-- Name: role_transitions; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public.role_transitions (
    id integer NOT NULL,
    role_id integer NOT NULL,
    from_staff_id integer NOT NULL,
    to_staff_id integer NOT NULL,
    transition_date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    pending_tasks jsonb,
    transferred_items jsonb,
    notes text,
    created_by integer NOT NULL
);


ALTER TABLE public.role_transitions OWNER TO hs;

--
-- Name: role_transitions_id_seq; Type: SEQUENCE; Schema: public; Owner: hs
--

CREATE SEQUENCE public.role_transitions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.role_transitions_id_seq OWNER TO hs;

--
-- Name: role_transitions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public.role_transitions_id_seq OWNED BY public.role_transitions.id;


--
-- Name: school_id_seq; Type: SEQUENCE; Schema: public; Owner: hs
--

CREATE SEQUENCE public.school_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.school_id_seq OWNER TO hs;

--
-- Name: school_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public.school_id_seq OWNED BY public.school.id;


--
-- Name: security_logs; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public.security_logs (
    id text NOT NULL,
    "timestamp" timestamp(3) without time zone NOT NULL,
    level public."LogLevel" NOT NULL,
    message text NOT NULL,
    category public."AuditLogCategory" NOT NULL,
    action text NOT NULL,
    result public."AuditLogResult" NOT NULL,
    risk_level public."RiskLevel" NOT NULL,
    actor text NOT NULL,
    target text,
    context text,
    metadata text,
    compliance text,
    location text,
    user_id integer NOT NULL,
    staff_id integer,
    user_agent text,
    ip text,
    path text,
    method text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.security_logs OWNER TO hs;

--
-- Name: session; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public.session (
    id text NOT NULL,
    session_token text NOT NULL,
    expires timestamp(3) without time zone NOT NULL,
    user_id integer NOT NULL
);


ALTER TABLE public.session OWNER TO hs;

--
-- Name: staff_id_seq; Type: SEQUENCE; Schema: public; Owner: hs
--

CREATE SEQUENCE public.staff_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.staff_id_seq OWNER TO hs;

--
-- Name: staff_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public.staff_id_seq OWNED BY public.staff.id;


--
-- Name: system_setting; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public.system_setting (
    key text NOT NULL,
    value jsonb NOT NULL
);


ALTER TABLE public.system_setting OWNER TO hs;

--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public.system_settings (
    id integer NOT NULL,
    key text NOT NULL,
    value text,
    value_type text DEFAULT 'string'::text,
    category text DEFAULT 'general'::text,
    description text,
    is_public boolean DEFAULT false,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.system_settings OWNER TO hs;

--
-- Name: system_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: hs
--

CREATE SEQUENCE public.system_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.system_settings_id_seq OWNER TO hs;

--
-- Name: system_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public.system_settings_id_seq OWNED BY public.system_settings.id;


--
-- Name: team_knowledge; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public.team_knowledge (
    id text NOT NULL,
    team_id text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    category text DEFAULT 'NOTE'::text NOT NULL,
    visibility text DEFAULT 'TEAM'::text NOT NULL,
    created_by integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    type text DEFAULT 'NOTE'::text,
    tags text[],
    url text,
    is_pinned boolean DEFAULT false,
    metadata jsonb,
    description text,
    is_public boolean DEFAULT false,
    views_count integer DEFAULT 0,
    downloads_count integer DEFAULT 0,
    created_by_staff_id integer
);


ALTER TABLE public.team_knowledge OWNER TO hs;

--
-- Name: team_knowledge_views; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public.team_knowledge_views (
    id integer NOT NULL,
    knowledge_id text NOT NULL,
    user_id integer NOT NULL,
    viewed_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.team_knowledge_views OWNER TO hs;

--
-- Name: team_knowledge_views_id_seq; Type: SEQUENCE; Schema: public; Owner: hs
--

CREATE SEQUENCE public.team_knowledge_views_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.team_knowledge_views_id_seq OWNER TO hs;

--
-- Name: team_knowledge_views_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public.team_knowledge_views_id_seq OWNED BY public.team_knowledge_views.id;


--
-- Name: team_members; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public.team_members (
    id text NOT NULL,
    team_id text NOT NULL,
    user_id integer NOT NULL,
    staff_id integer,
    role text DEFAULT 'MEMBER'::text NOT NULL,
    joined_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    left_at timestamp(3) without time zone,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.team_members OWNER TO hs;

--
-- Name: teams; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public.teams (
    id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    type text DEFAULT 'PROJECT'::text NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    purpose text NOT NULL,
    start_date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    end_date timestamp(3) without time zone,
    is_recurring boolean DEFAULT false NOT NULL,
    budget numeric(10,2),
    school_id integer,
    department_id integer,
    district_id integer,
    created_by integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    archived_at timestamp(3) without time zone,
    parent_team_id text,
    description text,
    is_active boolean DEFAULT true,
    metadata jsonb
);


ALTER TABLE public.teams OWNER TO hs;

--
-- Name: users; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text NOT NULL,
    name text,
    staff_id text,
    hashed_password text,
    email_verified timestamp(3) without time zone,
    image text,
    is_admin boolean DEFAULT false NOT NULL,
    is_system_admin boolean DEFAULT false NOT NULL,
    is_school_admin boolean DEFAULT false NOT NULL,
    two_factor_enabled boolean DEFAULT false NOT NULL,
    two_factor_secret text,
    backup_codes text[],
    login_notifications_enabled boolean DEFAULT true NOT NULL,
    suspicious_alerts_enabled boolean DEFAULT true NOT NULL,
    remember_devices_enabled boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    theme_preference text DEFAULT 'standard'::text,
    layout_preference text DEFAULT 'modern'::text,
    custom_theme jsonb
);


ALTER TABLE public.users OWNER TO hs;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: hs
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO hs;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: verification_token; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public.verification_token (
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.verification_token OWNER TO hs;

--
-- Name: agenda_item_attachments id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.agenda_item_attachments ALTER COLUMN id SET DEFAULT nextval('public.agenda_item_attachments_id_seq'::regclass);


--
-- Name: agenda_item_comments id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.agenda_item_comments ALTER COLUMN id SET DEFAULT nextval('public.agenda_item_comments_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: critical_audit_logs id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.critical_audit_logs ALTER COLUMN id SET DEFAULT nextval('public.critical_audit_logs_id_seq'::regclass);


--
-- Name: department id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.department ALTER COLUMN id SET DEFAULT nextval('public."Department_id_seq"'::regclass);


--
-- Name: devices id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.devices ALTER COLUMN id SET DEFAULT nextval('public.devices_id_seq'::regclass);


--
-- Name: district id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.district ALTER COLUMN id SET DEFAULT nextval('public."District_id_seq"'::regclass);


--
-- Name: meeting id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting ALTER COLUMN id SET DEFAULT nextval('public."Meeting_id_seq"'::regclass);


--
-- Name: meeting_action_items id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_action_items ALTER COLUMN id SET DEFAULT nextval('public.meeting_action_items_id_seq'::regclass);


--
-- Name: meeting_agenda_items id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_agenda_items ALTER COLUMN id SET DEFAULT nextval('public.meeting_agenda_items_id_seq'::regclass);


--
-- Name: meeting_attendee id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_attendee ALTER COLUMN id SET DEFAULT nextval('public."MeetingAttendee_id_seq"'::regclass);


--
-- Name: meeting_audit_logs id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_audit_logs ALTER COLUMN id SET DEFAULT nextval('public.meeting_audit_logs_id_seq'::regclass);


--
-- Name: meeting_notes id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_notes ALTER COLUMN id SET DEFAULT nextval('public.meeting_notes_id_seq'::regclass);


--
-- Name: meeting_search id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_search ALTER COLUMN id SET DEFAULT nextval('public.meeting_search_id_seq'::regclass);


--
-- Name: meeting_templates id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_templates ALTER COLUMN id SET DEFAULT nextval('public.meeting_templates_id_seq'::regclass);


--
-- Name: meeting_transcripts id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_transcripts ALTER COLUMN id SET DEFAULT nextval('public.meeting_transcripts_id_seq'::regclass);


--
-- Name: permission id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.permission ALTER COLUMN id SET DEFAULT nextval('public."Permission_id_seq"'::regclass);


--
-- Name: role id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.role ALTER COLUMN id SET DEFAULT nextval('public."Role_id_seq"'::regclass);


--
-- Name: role_hierarchy id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.role_hierarchy ALTER COLUMN id SET DEFAULT nextval('public."RoleHierarchy_id_seq"'::regclass);


--
-- Name: role_transitions id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.role_transitions ALTER COLUMN id SET DEFAULT nextval('public.role_transitions_id_seq'::regclass);


--
-- Name: school id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.school ALTER COLUMN id SET DEFAULT nextval('public."School_id_seq"'::regclass);


--
-- Name: staff id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.staff ALTER COLUMN id SET DEFAULT nextval('public."Staff_id_seq"'::regclass);


--
-- Name: system_settings id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.system_settings ALTER COLUMN id SET DEFAULT nextval('public.system_settings_id_seq'::regclass);


--
-- Name: team_knowledge_views id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.team_knowledge_views ALTER COLUMN id SET DEFAULT nextval('public.team_knowledge_views_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
67324500-2676-4c20-b5f3-5731aa6b5182	80458aec995a94e3c08b8a4ad44ed7009deb3347f8a7057a4e648fcfe3b92a42	2025-08-25 00:35:20.597088-04	20250602124513_init	\N	\N	2025-08-25 00:35:20.567863-04	1
faff4c9d-2bd2-4ea9-8e5d-78870d04626a	fd2889784fcc6c685c0e7482ec0a2751254760206bb0b58e4dacfcd1c654ef42	\N	20250823_add_missing_columns	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20250823_add_missing_columns\n\nDatabase error code: 42P01\n\nDatabase error:\nERROR: relation "User" does not exist\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P01), message: "relation \\"User\\" does not exist", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("namespace.c"), line: Some(436), routine: Some("RangeVarGetRelidExtended") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20250823_add_missing_columns"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20250823_add_missing_columns"\n             at schema-engine/commands/src/commands/apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:236	2025-08-25 00:37:35.806283-04	2025-08-25 00:35:20.694306-04	0
dd0e9713-a6be-42a8-be14-69e041c3c0cd	187682417fe83af7fada906e899a50a1327eb0bce4af29cc92ad3d13e34039af	2025-08-25 00:35:20.631346-04	20250612214434_add_user_auth_fields	\N	\N	2025-08-25 00:35:20.597571-04	1
3bb63484-7d65-49f7-93bd-a574ddb783cf	fd2889784fcc6c685c0e7482ec0a2751254760206bb0b58e4dacfcd1c654ef42	2025-08-25 00:37:35.818978-04	20250823_add_missing_columns		\N	2025-08-25 00:37:35.818978-04	0
73d3490c-147a-48ce-90db-a5bf5efe802b	21323ec5d5c0831e8f1233b8d3254a43e4111e827779114d13719d685ac6742d	2025-08-25 00:35:20.632736-04	20250612214447_add_user_auth_fields	\N	\N	2025-08-25 00:35:20.631625-04	1
82bd728e-94ef-4068-93fc-60ef7f10e73f	c3ad675140bd22b390bdfccb5d7cfaa10f397d26fe05b0d89c41809cf99a336d	2025-08-25 00:35:20.636051-04	20250701174505_add_meeting_enhancements	\N	\N	2025-08-25 00:35:20.632994-04	1
7f6fd0cb-a256-4c0f-bb5e-75bafea79381	7521b7a8b86f0119ba6fb793947dc009781915c2f400a6369c37a5b3b899d0ed	2025-08-25 00:35:20.650246-04	20250725024129_add_meeting_templates	\N	\N	2025-08-25 00:35:20.636375-04	1
0d44d927-a4d2-49d7-82cd-c2840ff4c826	707df1d63383199c7b4a446041f4d8f6a6153c7beac2b86452acf0530188f118	2025-08-25 00:37:44.120389-04	20250823_add_teams_safe	\N	\N	2025-08-25 00:37:44.069923-04	1
a6269082-2567-43a8-8bf0-16fd72f204cb	95fc2037be10848f0f0fb58e398b984976001308a6ebf270acd8b954846fdaf4	2025-08-25 00:35:20.667656-04	20250804140520_add_meeting_agenda_system	\N	\N	2025-08-25 00:35:20.650611-04	1
a1591e2d-1c85-4996-937f-afcd28307227	80458aec995a94e3c08b8a4ad44ed7009deb3347f8a7057a4e648fcfe3b92a42	2025-08-08 23:36:15.666252-04	20250602124513_init	\N	\N	2025-08-08 23:36:15.636388-04	1
a81076ff-8bdc-4558-95ef-b6f6fbcdc201	90c9abcc5e20705b6de2faa399d8b20fce8a10d7698dc890a9cf347dbfe27ba0	2025-08-25 00:35:20.669665-04	20250804212530_update_agenda_item_attachments	\N	\N	2025-08-25 00:35:20.667951-04	1
e0608000-d0fa-4618-9799-97a069f65bf0	187682417fe83af7fada906e899a50a1327eb0bce4af29cc92ad3d13e34039af	2025-08-08 23:36:15.705039-04	20250612214434_add_user_auth_fields	\N	\N	2025-08-08 23:36:15.66679-04	1
519e6540-dc46-417b-be78-6a514508bb07	401cf631ba815a67eac7a1b79e5598934ad71573333b7f1e85d58c84e75754a6	2025-08-25 00:35:20.673129-04	20250805033440_add_meeting_audit_log	\N	\N	2025-08-25 00:35:20.66992-04	1
083f60d4-f583-48b9-87e1-b89074fecfaa	21323ec5d5c0831e8f1233b8d3254a43e4111e827779114d13719d685ac6742d	2025-08-08 23:36:15.706524-04	20250612214447_add_user_auth_fields	\N	\N	2025-08-08 23:36:15.705307-04	1
fbd6f9d2-d48b-49de-8122-df27ea2168ec	834bf82ee67656564a97d9f6a1cd18c69512c366d9830ea317ce82c76f4cf57b	2025-08-25 00:35:20.675342-04	20250805173317_add_cjcp_somerset_hierarchy	\N	\N	2025-08-25 00:35:20.67333-04	1
2d578355-cfcc-45cd-a148-238dc2eed562	c3ad675140bd22b390bdfccb5d7cfaa10f397d26fe05b0d89c41809cf99a336d	2025-08-08 23:36:15.708831-04	20250701174505_add_meeting_enhancements	\N	\N	2025-08-08 23:36:15.706767-04	1
8ae54b3f-9615-4e6e-9a05-819a4003baff	9c247958e447c3ae1ddcc60c21a99d68ccdbe90c7fdaaf1dcfecaf2d2a580458	2025-08-25 00:35:20.685471-04	20250808014102_add_meeting_intelligence_features	\N	\N	2025-08-25 00:35:20.675591-04	1
b9732aac-1a4c-4af2-965c-f6346dce3099	7521b7a8b86f0119ba6fb793947dc009781915c2f400a6369c37a5b3b899d0ed	2025-08-08 23:36:15.722703-04	20250725024129_add_meeting_templates	\N	\N	2025-08-08 23:36:15.709192-04	1
f5c7dd9f-ebf5-4abd-bc98-09ace8d42808	64b3a6f278437e67bfc46e495f982253a176ec4cfe6ab809ea283a15e8e2e073	2025-08-25 00:35:20.692141-04	20250809033621_add_logging_system_tables	\N	\N	2025-08-25 00:35:20.685795-04	1
639bc0d4-1f5e-40cd-83cc-0e06b4989a6c	95fc2037be10848f0f0fb58e398b984976001308a6ebf270acd8b954846fdaf4	2025-08-08 23:36:15.735939-04	20250804140520_add_meeting_agenda_system	\N	\N	2025-08-08 23:36:15.72302-04	1
50c57c2a-3800-4a81-b082-fcf43560cebf	f2b5b29d5b60d7a095da7a5f1d183ce0185381c52c3f3b3ed952d7a95a4e14d2	2025-08-25 00:35:20.693084-04	20250809041308_add_layout_preference	\N	\N	2025-08-25 00:35:20.692358-04	1
87332b1d-817f-4643-841e-0a33682893e0	90c9abcc5e20705b6de2faa399d8b20fce8a10d7698dc890a9cf347dbfe27ba0	2025-08-08 23:36:15.738023-04	20250804212530_update_agenda_item_attachments	\N	\N	2025-08-08 23:36:15.736206-04	1
5d928c0f-c189-4a94-a962-d80cecfa6963	7deb07de4c9d0246a3265db4f99af42308f936dc62571e7f274e865cb07a34dc	2025-08-25 00:35:20.694103-04	20250819021000_add_meeting_location_zoom_link	\N	\N	2025-08-25 00:35:20.693299-04	1
566e074b-5339-468e-ab20-f15f936032e0	401cf631ba815a67eac7a1b79e5598934ad71573333b7f1e85d58c84e75754a6	2025-08-08 23:36:15.741028-04	20250805033440_add_meeting_audit_log	\N	\N	2025-08-08 23:36:15.738292-04	1
9f9e6e96-8e73-4089-87d2-e74196ce4fdf	834bf82ee67656564a97d9f6a1cd18c69512c366d9830ea317ce82c76f4cf57b	2025-08-08 23:36:15.742695-04	20250805173317_add_cjcp_somerset_hierarchy	\N	\N	2025-08-08 23:36:15.741289-04	1
2a423b12-91da-4183-89d5-ef53c29a180c	9c247958e447c3ae1ddcc60c21a99d68ccdbe90c7fdaaf1dcfecaf2d2a580458	2025-08-08 23:36:15.751552-04	20250808014102_add_meeting_intelligence_features	\N	\N	2025-08-08 23:36:15.743004-04	1
3c54617f-76cf-4088-b307-97dbde10a20f	64b3a6f278437e67bfc46e495f982253a176ec4cfe6ab809ea283a15e8e2e073	2025-08-08 23:36:21.818116-04	20250809033621_add_logging_system_tables	\N	\N	2025-08-08 23:36:21.808133-04	1
726b7bd9-9962-4c1d-9dba-76bf9bcb38ee	f2b5b29d5b60d7a095da7a5f1d183ce0185381c52c3f3b3ed952d7a95a4e14d2	\N	20250809041308_add_layout_preference	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20250809041308_add_layout_preference\n\nDatabase error code: 42701\n\nDatabase error:\nERROR: column "layout_preference" of relation "users" already exists\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42701), message: "column \\"layout_preference\\" of relation \\"users\\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("tablecmds.c"), line: Some(7053), routine: Some("check_for_column_name_collision") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20250809041308_add_layout_preference"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20250809041308_add_layout_preference"\n             at schema-engine/commands/src/commands/apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:236	2025-08-19 01:47:46.835023-04	2025-08-19 01:47:32.217356-04	0
e310ef6d-b340-4e4a-b36b-4e59ffcb2aba	f2b5b29d5b60d7a095da7a5f1d183ce0185381c52c3f3b3ed952d7a95a4e14d2	2025-08-19 01:47:46.83572-04	20250809041308_add_layout_preference		\N	2025-08-19 01:47:46.83572-04	0
\.


--
-- Data for Name: account; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.account (id, type, provider, provider_account_id, refresh_token, access_token, expires_at, token_type, scope, id_token, session_state, user_id) FROM stdin;
\.


--
-- Data for Name: agenda_item_attachments; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.agenda_item_attachments (id, agenda_item_id, file_name, file_url, file_size, content_type, created_at, updated_at, uploaded_by_id) FROM stdin;
\.


--
-- Data for Name: agenda_item_comments; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.agenda_item_comments (id, agenda_item_id, staff_id, comment, created_at) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.audit_logs (id, table_name, record_id, operation, field_changes, old_values, new_values, user_id, staff_id, source, description, ip_address, user_agent, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: critical_audit_logs; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.critical_audit_logs (id, "timestamp", category, action, user_id, staff_id, target_user_id, target_staff_id, ip_address, session_id, risk_score, success, error_message, metadata) FROM stdin;
\.


--
-- Data for Name: department; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.department (id, code, name, category, school_id, created_at, level, parent_id) FROM stdin;
2	SYS	System Management	Administration	2	2025-08-09 05:15:58.924	0	\N
3	SUPPORT	Student Support	Student Services	2	2025-08-09 05:15:58.924	2	\N
4	PURCHASE	Purchasing	Finance	2	2025-08-09 05:15:58.924	3	\N
5	GRANTS	Grants & Funding	Finance	2	2025-08-09 05:15:58.924	3	\N
6	AP	Accounts Payable	Finance	2	2025-08-09 05:15:58.924	3	\N
7	DATA	Data Management	Administration	2	2025-08-09 05:15:58.924	3	\N
8	ELEM	Elementary Education	Academic	2	2025-08-09 05:15:58.924	3	\N
9	HR	Human Resources	Administration	2	2025-08-09 05:15:58.924	3	\N
10	HEALTH	Health Services	Student Services	2	2025-08-09 05:15:58.924	3	\N
11	IT	Information Technology	Administration	2	2025-08-09 05:15:58.924	3	\N
12	EXEC	Executive Leadership	Administration	2	2025-08-09 05:15:58.924	1	\N
13	ADMIN_SUPPORT	Administrative Support	Administration	2	2025-08-09 05:15:58.924	3	\N
14	OPS	Operations	Administration	2	2025-08-09 05:15:58.924	2	\N
15	EXEC_SUPPORT	Executive Support	Administration	2	2025-08-09 05:15:58.924	3	\N
16	US_STEM	Upper School STEM	Academic	2	2025-08-09 05:15:58.924	3	\N
17	HUM	Humanities	Academic	2	2025-08-09 05:15:58.924	2	\N
18	ASSESS	Assessment & Accountability	Academic	2	2025-08-09 05:15:58.924	2	\N
19	SPED	Special Education	Student Services	2	2025-08-09 05:15:58.924	2	\N
20	BUS	Business & Finance	Administration	2	2025-08-09 05:15:58.924	2	\N
21	ELECTIVES	Electives & Arts	Academic	2	2025-08-09 05:15:58.924	3	\N
22	CURR	Curriculum Development	Academic	2	2025-08-09 05:15:58.924	2	\N
23	ELEM_COACH	Elementary Coaching	Academic	2	2025-08-09 05:15:58.924	3	\N
24	US_HUM	Upper School Humanities	Academic	2	2025-08-09 05:15:58.924	3	\N
25	ATTENDANCE	Attendance Services	Administration	2	2025-08-09 05:15:58.924	3	\N
26	SEC	Security & Safety	Administration	2	2025-08-09 05:15:58.924	3	\N
27	STEM	STEM	Academic	2	2025-08-09 05:15:58.924	2	\N
30	DO	District Office	\N	2	2025-08-09 05:15:58.924	0	\N
\.


--
-- Data for Name: dev_logs; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.dev_logs (id, "timestamp", level, message, category, component, function, file, line, stack, environment, context, metadata, performance, user_id, staff_id, session_id, user_agent, ip, path, method, status_code, duration, created_at, updated_at) FROM stdin;
dev-test-1754711257094	2025-08-09 03:47:37.094	INFO	Direct database logging test	system	\N	\N	\N	\N	\N	development	{"test":true,"timestamp":"2025-08-09T03:47:37.094Z"}	{"testType":"direct_db","version":"1.0.0"}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-08-09 03:47:37.103	2025-08-09 03:47:37.103
\.


--
-- Data for Name: devices; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.devices (id, user_id, device_id, device_name, device_type, device_os, browser, ip_address, last_active, is_trusted, created_at) FROM stdin;
\.


--
-- Data for Name: district; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.district (name, address, code, created_at, id) FROM stdin;
CJCP Somerset	Somerset, NJ	CJCPS	2025-08-09 05:15:58.917	2
\.


--
-- Data for Name: meeting; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.meeting (title, description, created_at, department_id, district_id, end_time, organizer_id, school_id, start_time, zoom_join_url, zoom_meeting_id, id, action_items, agenda, calendar_integration, decisions, is_continuation, meeting_type, notes, parent_meeting_id, repeat_type, status, template_id, is_series_master, repeat_end_date, repeat_end_type, repeat_exceptions, repeat_interval, repeat_month_day, repeat_month_week, repeat_month_weekday, repeat_occurrences, repeat_pattern, repeat_weekdays, series_id, series_position, location, zoom_link, team_id, repeat_until) FROM stdin;
Q1 Academic Performance Review	Comprehensive review of first quarter academic performance across all grade levels, including standardized test results, curriculum alignment, and teacher feedback	2024-03-10 10:00:00	2	2	2024-03-15 16:30:00	28	2	2024-03-15 14:00:00	\N	\N	15	\N	\N	\N	\N	f	\N	\N	\N	\N	COMPLETED	\N	f	\N	\N	{}	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	\N	team-academic	\N
Curriculum Alignment Workshop	Workshop focused on aligning curriculum with state standards and implementing new teaching methodologies for improved student outcomes	2024-04-15 10:00:00	2	2	2024-04-22 15:30:00	28	2	2024-04-22 13:00:00	\N	\N	16	\N	\N	\N	\N	f	\N	\N	\N	\N	COMPLETED	\N	f	\N	\N	{}	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	\N	team-academic	\N
Mid-Year Assessment Strategy Planning	Planning session for mid-year assessments, including developing new evaluation criteria and implementing data-driven instruction approaches	2024-11-25 10:00:00	2	2	2024-12-10 11:30:00	28	2	2024-12-10 09:00:00	\N	\N	17	\N	\N	\N	\N	f	\N	\N	\N	\N	SCHEDULED	\N	f	\N	\N	{}	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	\N	team-academic	\N
Emergency Preparedness Drill Evaluation	Post-drill evaluation meeting to assess emergency response procedures, identify areas for improvement, and update safety protocols	2024-03-20 10:00:00	3	2	2024-03-28 12:00:00	9	2	2024-03-28 10:00:00	\N	\N	18	\N	\N	\N	\N	f	\N	\N	\N	\N	COMPLETED	\N	f	\N	\N	{}	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	\N	team-operations	\N
Winter Facility Maintenance Planning	Planning meeting for winter facility maintenance, including HVAC system checks, building security updates, and snow removal procedures	2024-11-10 10:00:00	3	2	2024-11-20 16:00:00	9	2	2024-11-20 14:00:00	\N	\N	19	\N	\N	\N	\N	f	\N	\N	\N	\N	SCHEDULED	\N	f	\N	\N	{}	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	\N	team-operations	\N
Emergency Preparedness Follow-up Actions	Follow-up meeting to implement action items from previous emergency drill evaluation, including staff training updates and equipment procurement	2024-11-05 10:00:00	3	2	2024-11-15 13:00:00	9	2	2024-11-15 11:00:00	\N	\N	20	\N	\N	\N	\N	f	\N	\N	\N	\N	SCHEDULED	\N	f	\N	\N	{}	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	\N	team-operations	\N
Monthly Administrative Review	Monthly review of administrative processes, budget updates, staff performance evaluations, and operational efficiency metrics	2024-02-28 10:00:00	4	2	2024-03-05 17:00:00	18	2	2024-03-05 15:00:00	\N	\N	21	\N	\N	\N	\N	f	\N	\N	\N	\N	COMPLETED	\N	f	\N	\N	{}	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N
Parent-Teacher Conference Planning	Planning session for upcoming parent-teacher conferences, including scheduling, format decisions, and communication strategies	2024-04-01 10:00:00	2	2	2024-04-10 15:00:00	48	2	2024-04-10 13:30:00	\N	\N	22	\N	\N	\N	\N	f	\N	\N	\N	\N	COMPLETED	\N	f	\N	\N	{}	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N
Holiday Program Coordination	Coordination meeting for upcoming holiday programs, including event planning, volunteer coordination, and budget allocation	2024-11-15 10:00:00	5	2	2024-11-25 12:00:00	20	2	2024-11-25 10:00:00	\N	\N	23	\N	\N	\N	\N	f	\N	\N	\N	\N	SCHEDULED	\N	f	\N	\N	{}	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N
Technology Integration Training Workshop	Professional development workshop on integrating new educational technologies into classroom instruction and administrative processes	2024-11-20 10:00:00	3	2	2024-12-03 12:30:00	27	2	2024-12-03 08:30:00	\N	\N	24	\N	\N	\N	\N	f	\N	\N	\N	\N	IN_PROGRESS	\N	f	\N	\N	{}	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N
Administrative Review Follow-up	Follow-up to March administrative review meeting, addressing action items, budget adjustments, and policy implementations	2024-12-01 10:00:00	4	2	2024-12-15 16:30:00	18	2	2024-12-15 14:00:00	\N	\N	25	\N	\N	\N	\N	f	\N	\N	\N	\N	SCHEDULED	\N	f	\N	\N	{}	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N
Math Department (1/3)		2025-08-25 07:15:21.33	2	2	2025-08-25 14:00:00	999	2	2025-08-25 12:00:00	\N		26	\N	\N	\N	\N	f	regular	\N	\N	biweekly	draft	\N	t	2025-09-30 00:00:00	by	{}	1	\N	\N	\N	3	biweekly	{1}	series_1756106121327_c1fzuktkc	1	\N	\N	\N	\N
Math Department (2/3)		2025-08-25 07:15:21.375	2	2	2025-09-08 14:00:00	999	2	2025-09-08 12:00:00	\N		27	\N	\N	\N	\N	f	regular	\N	\N	biweekly	draft	\N	f	2025-09-30 00:00:00	by	{}	1	\N	\N	\N	3	biweekly	{1}	series_1756106121327_c1fzuktkc	2	\N	\N	\N	\N
Math Department (3/3)		2025-08-25 07:15:21.379	2	2	2025-09-22 14:00:00	999	2	2025-09-22 12:00:00	\N		28	\N	\N	\N	\N	f	regular	\N	\N	biweekly	draft	\N	f	2025-09-30 00:00:00	by	{}	1	\N	\N	\N	3	biweekly	{1}	series_1756106121327_c1fzuktkc	3	\N	\N	\N	\N
\.


--
-- Data for Name: meeting_action_items; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.meeting_action_items (id, meeting_id, agenda_item_id, title, description, assigned_to, due_date, completed_at, created_at, updated_at, assigned_to_role, carry_forward_count, completed_by, notes, parent_action_id, priority, status) FROM stdin;
\.


--
-- Data for Name: meeting_agenda_items; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.meeting_agenda_items (id, meeting_id, topic, problem_statement, staff_initials, responsible_staff_id, priority, purpose, proposed_solution, solution_type, decisions_actions, decision_type, status, future_implications, order_index, duration_minutes, created_at, updated_at, carried_forward, carry_forward_count, parent_item_id, responsible_role_id) FROM stdin;
13	15	Standardized Test Score Analysis	Q1 standardized test scores show inconsistencies across grade levels requiring detailed analysis and intervention strategies	\N	18	Medium	Discussion	\N	\N	\N	\N	Resolved	f	1	\N	2024-03-10 10:00:00	2024-03-15 16:30:00	f	0	\N	\N
14	15	Teacher Professional Development Needs Assessment	Identifying specific professional development needs based on classroom observations and student performance data	\N	48	Medium	Decision	\N	\N	\N	\N	Resolved	f	2	\N	2024-03-10 10:00:00	2024-03-15 16:30:00	f	0	\N	\N
15	15	Curriculum Pacing Guide Adjustments	Current pacing guides may need adjustments to ensure adequate coverage of essential standards before state testing	\N	28	Medium	Information_Sharing	\N	\N	\N	\N	Ongoing	f	3	\N	2024-03-10 10:00:00	2024-03-15 16:30:00	f	0	\N	\N
16	16	State Standards Mapping Review	Need to ensure all curriculum materials align with updated state standards and learning objectives	\N	28	Medium	Decision	\N	\N	\N	\N	Resolved	f	1	\N	2024-04-15 10:00:00	2024-04-22 15:30:00	f	0	\N	\N
17	16	Cross-Curricular Integration Strategies	Implementing strategies to integrate learning across different subject areas for deeper student understanding	\N	18	Medium	Discussion	\N	\N	\N	\N	Resolved	f	2	\N	2024-04-15 10:00:00	2024-04-22 15:30:00	f	0	\N	\N
18	18	Evacuation Procedure Effectiveness Review	Recent fire drill revealed bottlenecks in evacuation routes and timing issues that need to be addressed	\N	9	Medium	Discussion	\N	\N	\N	\N	Resolved	f	1	\N	2024-03-20 10:00:00	2024-03-28 12:00:00	f	0	\N	\N
19	18	Communication System Updates	Current emergency communication system needs improvements for better coordination during emergencies	\N	20	Medium	Decision	\N	\N	\N	\N	Resolved	f	2	\N	2024-03-20 10:00:00	2024-03-28 12:00:00	f	0	\N	\N
20	18	Staff Training Requirements Update	Need to update emergency response training requirements and schedule additional training sessions	\N	27	Medium	Information_Sharing	\N	\N	\N	\N	Assigned_to_local	f	3	\N	2024-03-20 10:00:00	2024-03-28 12:00:00	f	0	\N	\N
21	17	Mid-Year Benchmark Assessment Design	Design comprehensive mid-year assessments that accurately measure student progress and identify intervention needs	\N	28	Medium	Discussion	\N	\N	\N	\N	Pending	f	1	\N	2024-11-25 10:00:00	2024-11-25 10:00:00	f	0	\N	\N
22	17	Data Analysis Protocol Development	Establish protocols for analyzing assessment data and using results to inform instruction and intervention strategies	\N	18	Medium	Decision	\N	\N	\N	\N	Pending	f	2	\N	2024-11-25 10:00:00	2024-11-25 10:00:00	f	0	\N	\N
23	21	Budget Variance Analysis	Q1 budget shows variances in several categories that require analysis and potential reallocation	\N	18	Medium	Discussion	\N	\N	\N	\N	Resolved	f	1	\N	2024-02-28 10:00:00	2024-03-05 17:00:00	f	0	\N	\N
24	21	Staffing Level Assessment	Current staffing levels may be inadequate for projected enrollment increases in the next academic year	\N	48	Medium	Information_Sharing	\N	\N	\N	\N	CarriedForward	f	2	\N	2024-02-28 10:00:00	2024-03-05 17:00:00	f	0	\N	\N
25	24	New Learning Management System Training	Staff need comprehensive training on the new LMS platform being implemented district-wide	\N	27	Medium	Information_Sharing	\N	\N	\N	\N	Ongoing	f	1	\N	2024-11-20 10:00:00	2024-11-20 10:00:00	f	0	\N	\N
26	24	Digital Assessment Tools Implementation	Transition from paper-based to digital assessment tools requires training and change management support	\N	9	Medium	Discussion	\N	\N	\N	\N	Ongoing	f	2	\N	2024-11-20 10:00:00	2024-11-20 10:00:00	f	0	\N	\N
\.


--
-- Data for Name: meeting_attendee; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.meeting_attendee (status, created_at, meeting_id, staff_id, id, attended) FROM stdin;
ATTENDED	2025-08-25 03:09:17.936	15	18	51	f
ATTENDED	2025-08-25 03:09:17.936	15	28	52	f
ATTENDED	2025-08-25 03:09:17.936	15	48	53	f
ATTENDED	2025-08-25 03:09:17.936	16	18	54	f
ATTENDED	2025-08-25 03:09:17.936	16	28	55	f
ATTENDED	2025-08-25 03:09:17.936	16	48	56	f
ATTENDED	2025-08-25 03:09:17.937	18	9	57	f
ATTENDED	2025-08-25 03:09:17.937	18	20	58	f
ATTENDED	2025-08-25 03:09:17.937	18	27	59	f
ATTENDED	2025-08-25 03:09:17.937	21	9	60	f
ATTENDED	2025-08-25 03:09:17.937	21	18	61	f
ATTENDED	2025-08-25 03:09:17.937	21	20	62	f
ATTENDED	2025-08-25 03:09:17.937	21	48	63	f
ATTENDED	2025-08-25 03:09:17.938	22	9	64	f
ATTENDED	2025-08-25 03:09:17.938	22	20	65	f
ATTENDED	2025-08-25 03:09:17.938	22	48	66	f
pending	2025-08-25 07:15:21.33	26	27	67	f
pending	2025-08-25 07:15:21.33	26	26	68	f
pending	2025-08-25 07:15:21.33	26	13	69	f
pending	2025-08-25 07:15:21.375	27	27	70	f
pending	2025-08-25 07:15:21.375	27	26	71	f
pending	2025-08-25 07:15:21.375	27	13	72	f
pending	2025-08-25 07:15:21.379	28	27	73	f
pending	2025-08-25 07:15:21.379	28	26	74	f
pending	2025-08-25 07:15:21.379	28	13	75	f
\.


--
-- Data for Name: meeting_audit_logs; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.meeting_audit_logs (id, meeting_id, user_id, staff_id, action, details, changes, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: meeting_notes; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.meeting_notes (id, meeting_id, staff_id, content, created_at) FROM stdin;
1	15	28	Excellent discussion on standardized test analysis. Key action items: 1) Implement targeted intervention programs for underperforming students, 2) Provide additional professional development for teachers in data analysis, 3) Revise pacing guides to ensure adequate test preparation time. Follow-up meeting scheduled for curriculum alignment workshop.	2024-03-15 16:00:00
2	16	28	Productive workshop on curriculum alignment. Successfully mapped all grade levels to updated state standards. Identified opportunities for better cross-curricular integration. Next steps include piloting new integrated lesson plans and measuring student engagement outcomes.	2024-04-22 15:00:00
3	18	9	Emergency drill evaluation revealed several areas for improvement. Communication delays during evacuation need to be addressed. Approved budget for new emergency communication system and additional staff training. Will implement changes before next quarterly drill.	2024-03-28 11:30:00
4	21	18	Monthly administrative review covered budget variances and staffing concerns. Budget reallocation approved for technology upgrades. HR to begin recruitment process for additional teaching positions. Performance evaluations on track for completion by quarter end.	2024-03-05 16:30:00
5	22	48	Parent-teacher conference planning went smoothly. Decided on hybrid format with both in-person and virtual options. Communication templates finalized and scheduling system updated. Expecting high participation rates based on parent feedback surveys.	2024-04-10 14:45:00
\.


--
-- Data for Name: meeting_search; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.meeting_search (id, meeting_id, content, search_text, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: meeting_templates; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.meeting_templates (id, name, description, duration, agenda, attendees, is_active, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: meeting_transcripts; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.meeting_transcripts (id, meeting_id, full_text, summary, key_points, ai_summary, speakers, timestamps, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: permission; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.permission (id, role_id, capability, resource, action, conditions, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: role; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.role (id, title, key, priority, category, department_id, created_at, is_leadership, level, parent_id, extension, is_coordinator, is_supervisor, room) FROM stdin;
2	Supervisors - Curriculum/Professional Development	\N	2	\N	22	2025-08-09 05:15:58.955	t	2	\N	1127	f	t	127
3	Chief Education Officer	CHIEF_EDU_OFFICER	1	\N	12	2025-08-09 05:15:58.955	t	1	\N	1001	f	t	501
4	System Administrator	OPS_ADMIN	1	\N	2	2025-08-09 05:15:58.955	t	0	\N	9999	f	t	Server Room
5	US Supervisor - STEM	\N	3	\N	16	2025-08-09 05:15:58.955	t	3	\N	1126	f	t	126
6	Director of Operations	DIR_OPERATIONS	2	\N	14	2025-08-09 05:15:58.955	t	2	\N	1125	f	t	125
7	Business Administrator	BUS_ADMIN	2	\N	20	2025-08-09 05:15:58.955	t	2	\N	\N	f	t	\N
8	Director of Special Education	\N	2	\N	19	2025-08-09 05:15:58.955	t	2	\N	1695	f	t	130
9	Elementary Supervisor	\N	3	\N	8	2025-08-09 05:15:58.955	t	3	\N	1122	f	t	122
10	Business Specialist (Grants)	\N	3	\N	5	2025-08-09 05:15:58.955	f	3	\N	1503	f	f	3rd Floor
11	Purchasing Specialist	\N	3	\N	4	2025-08-09 05:15:58.955	f	3	\N	1501	f	f	3rd Floor
12	Director of Accountability	\N	2	\N	18	2025-08-09 05:15:58.955	t	2	\N	1696	f	t	130
13	US Supervisor - Electives	\N	3	\N	21	2025-08-09 05:15:58.955	t	3	\N	\N	f	t	\N
14	School Secretary	\N	3	\N	13	2025-08-09 05:15:58.955	f	3	\N	1100	f	f	Main Office
15	Director of Student Support Services	\N	2	\N	3	2025-08-09 05:15:58.955	t	2	\N	1105	f	t	105
16	Elementary Coach	\N	3	\N	23	2025-08-09 05:15:58.955	t	3	\N	1131	f	t	131
17	Accounts Payable Specialist	\N	3	\N	6	2025-08-09 05:15:58.955	f	3	\N	1502	f	f	3rd Floor
18	Assistant Business Administrator	ASST_BUS_ADMIN	2	\N	20	2025-08-09 05:15:58.955	t	2	\N	1509	f	t	3rd Floor
19	Assistant Director of Student Support Services	\N	2	\N	3	2025-08-09 05:15:58.955	t	2	\N	1201	f	t	201
20	Registrar & Data Management Specialist	\N	3	\N	7	2025-08-09 05:15:58.955	f	3	\N	1506	f	f	3rd Floor
21	HR Payroll & Benefits Specialist	\N	3	\N	9	2025-08-09 05:15:58.955	f	3	\N	1504	f	f	3rd Floor
22	School Nurse	\N	3	\N	10	2025-08-09 05:15:58.955	f	3	\N	1694	f	f	630
23	HR Specialist	\N	3	\N	9	2025-08-09 05:15:58.955	f	3	\N	1507	f	f	3rd Floor
24	IT Manager	\N	3	\N	11	2025-08-09 05:15:58.955	t	3	\N	1650	f	t	600 hw
25	Head of Security	\N	3	\N	26	2025-08-09 05:15:58.955	t	3	\N	1101	f	t	101
26	US Supervisor - Humanities	\N	3	\N	24	2025-08-09 05:15:58.955	t	3	\N	\N	f	t	\N
27	Social Worker	\N	4	\N	3	2025-08-09 05:15:58.955	f	4	\N	1104	f	f	104
28	School Counselor	\N	4	\N	3	2025-08-09 05:15:58.955	f	4	\N	1103	f	f	104
29	IT Specialist	\N	3	\N	11	2025-08-09 05:15:58.955	f	3	\N	1652	f	f	200 hw
30	Academic Counselor	\N	4	\N	3	2025-08-09 05:15:58.955	f	4	\N	1697	f	f	634
31	School Psychologist	\N	4	\N	3	2025-08-09 05:15:58.955	f	4	\N	1704	f	f	123
32	Director of Curriculum - STEM	\N	2	\N	27	2025-08-09 05:15:58.955	t	2	\N	1126	f	t	126
33	Chronic Absenteeism Specialist	\N	3	\N	25	2025-08-09 05:15:58.955	f	3	\N	1702	f	f	Main Office
34	Behavioral Specialist	\N	4	\N	3	2025-08-09 05:15:58.955	f	4	\N	1701	f	f	TBD
35	Teacher	TEACHER	4	\N	17	2025-08-09 05:15:58.955	f	4	\N	\N	f	f	\N
36	Executive Administrative Assistant	\N	3	\N	15	2025-08-09 05:15:58.955	f	3	\N	1508	f	f	3rd Floor
37	Director of Curriculum - Humanities	\N	2	\N	17	2025-08-09 05:15:58.955	t	2	\N	1124	f	t	124
38	Administrator	\N	0	executive	\N	2025-08-09 05:15:58.955	t	0	\N	\N	f	f	\N
39	Development Admin	DEV_ADMIN	0	ADMIN	\N	2025-08-09 05:15:58.955	t	0	\N	\N	f	t	\N
\.


--
-- Data for Name: role_hierarchy; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.role_hierarchy (id, parent_role_id, child_role_id, hierarchy_level, created_at) FROM stdin;
\.


--
-- Data for Name: role_transitions; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.role_transitions (id, role_id, from_staff_id, to_staff_id, transition_date, pending_tasks, transferred_items, notes, created_by) FROM stdin;
\.


--
-- Data for Name: school; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.school (name, address, code, created_at, district_id, id) FROM stdin;
CJCP Somerset Campus	Somerset, NJ	CJCPS-SOM	2025-08-09 05:15:58.922	2	2
\.


--
-- Data for Name: security_logs; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.security_logs (id, "timestamp", level, message, category, action, result, risk_level, actor, target, context, metadata, compliance, location, user_id, staff_id, user_agent, ip, path, method, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.session (id, session_token, expires, user_id) FROM stdin;
\.


--
-- Data for Name: staff; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.staff (id, user_id, department_id, role_id, manager_id, flags, endorsements, school_id, district_id, created_at, extension, hire_date, is_active, room) FROM stdin;
4	20	12	3	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1001	\N	t	501
5	38	20	18	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1509	\N	t	3rd Floor
6	28	3	15	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1105	\N	t	105
7	17	20	7	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	\N	\N	t	\N
8	6	2	4	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	9999	\N	t	Server Room
9	12	22	2	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1127	\N	t	127
10	8	14	6	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1125	\N	t	125
11	16	25	33	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1702	\N	t	Main Office
12	31	15	36	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1508	\N	t	3rd Floor
13	29	16	5	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1126	\N	t	126
14	19	3	19	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1201	\N	t	201
15	51	9	23	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1507	\N	t	3rd Floor
16	40	5	10	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1503	\N	t	3rd Floor
17	18	9	21	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1504	\N	t	3rd Floor
18	11	17	37	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1124	\N	t	124
19	23	10	22	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1694	\N	t	630
20	14	8	9	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1122	\N	t	122
21	9	23	16	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1131	\N	t	131
22	30	21	13	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	\N	\N	t	\N
23	21	11	29	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1652	\N	t	200 hw
24	26	11	29	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1652	\N	t	200 hw
25	37	26	25	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1101	\N	t	101
26	49	19	8	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1695	\N	t	130
27	15	24	26	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	\N	\N	t	\N
28	10	13	14	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1100	\N	t	Main Office
29	27	11	29	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1652	\N	t	200 hw
30	33	3	30	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1697	\N	t	634
31	25	13	14	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1100	\N	t	Main Office
32	44	3	30	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1697	\N	t	634
33	39	3	28	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1103	\N	t	104
34	36	3	28	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1103	\N	t	104
35	32	11	29	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1652	\N	t	200 hw
36	48	3	28	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1103	\N	t	104
37	52	3	28	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1103	\N	t	104
38	42	3	28	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1103	\N	t	104
39	41	3	28	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1103	\N	t	104
40	46	3	27	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1104	\N	t	104
41	47	3	27	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1104	\N	t	104
42	43	3	27	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1104	\N	t	104
43	45	3	34	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1701	\N	t	TBD
44	50	3	31	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1704	\N	t	123
45	24	6	17	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1502	\N	t	3rd Floor
46	53	10	22	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1694	\N	t	630
47	35	11	24	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1650	\N	t	600 hw
48	13	4	11	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1501	\N	t	3rd Floor
49	7	27	32	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1126	\N	t	126
50	34	7	20	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1506	\N	t	3rd Floor
51	22	18	12	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1696	\N	t	130
52	54	10	22	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1694	\N	t	630
53	55	11	24	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1650	\N	t	600 hw
999	60	2	4	\N	{active,admin,system}	{}	2	2	2025-08-25 06:55:45.28	0000	\N	t	Admin Office
\.


--
-- Data for Name: system_setting; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.system_setting (key, value) FROM stdin;
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.system_settings (id, key, value, value_type, category, description, is_public, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: team_knowledge; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.team_knowledge (id, team_id, title, content, category, visibility, created_by, created_at, updated_at, type, tags, url, is_pinned, metadata, description, is_public, views_count, downloads_count, created_by_staff_id) FROM stdin;
fb1ba468-2d45-48d6-b6bc-e1d0b48c8850	team-academic	Academic Standards Alignment Guide	Comprehensive guide for aligning curriculum and assessments with state academic standards. Includes mapping templates, timeline recommendations, and best practices for ensuring standards compliance across all grade levels.	NOTE	TEAM	20	2024-01-20 10:00:00	2024-04-22 15:30:00	GUIDE	{academic-standards,curriculum,alignment,compliance}	\N	t	\N	\N	f	28	12	4
d3fd282c-ad7f-4c87-b353-1a778c3359fb	team-academic	Data-Driven Instruction Toolkit	Complete toolkit for implementing data-driven instruction practices. Includes assessment templates, data analysis worksheets, intervention planning guides, and progress monitoring tools.	NOTE	TEAM	38	2024-02-15 10:00:00	2024-03-15 16:30:00	TEMPLATE	{data-analysis,instruction,assessment,toolkit}	\N	f	\N	\N	f	15	8	5
afb107d9-6324-49ae-acb4-4b8a7d3a9a11	team-academic	Professional Development Planning Framework	Framework for identifying, planning, and implementing professional development initiatives. Includes needs assessment tools, training calendars, and evaluation metrics for measuring effectiveness.	NOTE	TEAM	28	2024-03-01 10:00:00	2024-04-15 12:00:00	POLICY	{professional-development,training,framework,evaluation}	\N	t	\N	\N	f	22	6	6
cd064048-ca4b-4532-9a64-500eb1b34f1d	team-operations	Emergency Response Procedures Manual	Comprehensive manual covering all emergency response procedures including evacuation routes, communication protocols, staff responsibilities, and post-emergency procedures. Updated quarterly based on drill evaluations.	NOTE	TEAM	17	2024-02-10 10:00:00	2024-03-28 12:00:00	GUIDE	{emergency,safety,procedures,evacuation}	\N	t	\N	\N	f	45	18	7
3cd397b0-a4b7-45d3-9379-8ea476061e33	team-operations	Facility Maintenance Checklist	Detailed maintenance checklists for all school facilities including HVAC systems, electrical, plumbing, grounds, and safety equipment. Organized by frequency (daily, weekly, monthly, seasonal).	NOTE	TEAM	14	2024-02-20 10:00:00	2024-02-20 10:00:00	TEMPLATE	{maintenance,facilities,checklist,safety}	\N	f	\N	\N	f	18	9	20
998be56a-d96b-4efc-900e-600adb2559fb	team-operations	Budget Management Best Practices	Best practices for managing operational budgets including cost tracking, vendor management, emergency fund allocation, and financial reporting. Includes templates for budget planning and expense tracking.	NOTE	TEAM	15	2024-03-05 10:00:00	2024-03-05 10:00:00	DOCUMENT	{budget,finance,operations,management}	\N	t	\N	\N	f	31	14	27
\.


--
-- Data for Name: team_knowledge_views; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.team_knowledge_views (id, knowledge_id, user_id, viewed_at) FROM stdin;
\.


--
-- Data for Name: team_members; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.team_members (id, team_id, user_id, staff_id, role, joined_at, left_at, is_active) FROM stdin;
d2d3fb3b-3fa0-45b9-8fe5-de8a47dd1da3	team-academic	20	4	LEAD	2024-01-10 09:00:00	\N	t
e2048153-20ad-487d-8209-f1c253048f88	team-academic	38	5	MEMBER	2024-01-12 09:00:00	\N	t
dcace5ad-ba39-4241-9dc0-5510674f73fc	team-academic	28	6	MEMBER	2024-01-15 09:00:00	\N	t
35873ef2-eb59-4f25-9733-c18c087ba2a3	team-operations	17	7	LEAD	2024-02-05 10:00:00	\N	t
e4699e27-88fb-47e4-b3cf-14daa9c6fba5	team-operations	14	20	MEMBER	2024-02-07 10:00:00	\N	t
57c68817-372d-4161-96ef-914ea4ef6d71	team-operations	15	27	MEMBER	2024-02-10 10:00:00	\N	t
\.


--
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.teams (id, name, code, type, status, purpose, start_date, end_date, is_recurring, budget, school_id, department_id, district_id, created_by, created_at, updated_at, archived_at, parent_team_id, description, is_active, metadata) FROM stdin;
team-academic	Academic Excellence Committee	ACAD-EXCEL	PROJECT	ACTIVE	To enhance educational outcomes through curriculum development, assessment improvements, and teaching excellence initiatives	2025-08-25 03:09:17.89	\N	f	\N	\N	\N	\N	10	2024-01-10 09:00:00	2024-01-10 09:00:00	\N	\N	Committee focused on improving academic standards and student achievement across all grade levels	t	\N
team-operations	School Operations & Safety Committee	OPS-SAFETY	PROJECT	ACTIVE	To ensure safe, efficient, and well-maintained learning environments that support educational excellence	2025-08-25 03:09:17.896	\N	f	\N	\N	\N	\N	11	2024-02-05 10:00:00	2024-02-05 10:00:00	\N	\N	Responsible for school operations, facility management, safety protocols, and emergency preparedness	t	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.users (id, email, name, staff_id, hashed_password, email_verified, image, is_admin, is_system_admin, is_school_admin, two_factor_enabled, two_factor_secret, backup_codes, login_notifications_enabled, suspicious_alerts_enabled, remember_devices_enabled, created_at, updated_at, theme_preference, layout_preference, custom_theme) FROM stdin;
10	tsalley@cjcollegeprep.org	Ms. Salley	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
11	cthomas@cjcollegeprep.org	Ms. Thomas	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
13	purchasing@cjcollegeprep.org	Ms. Ramos	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
12	lmignogno@cjcollegeprep.org	Ms. Mignogno	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
14	mfirsichbaum@cjcollegeprep.org	Ms. Firsichbaum	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
15	cmathews@cjcollegeprep.org	Dr. Mathews	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
16	braybon@cjcollegeprep.org	Ms. Raybon	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
17	manar@cjcollegeprep.org	Mr. Anar	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
18	hr@cjcollegeprep.org	Ms. Goldstein	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
19	bgrossmann@cjcollegeprep.org	Ms. Grossmann	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
21	dcua@cjcollegeprep.org	Mr. Daryl	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
22	skaeli@cjcollegeprep.org	Ms. Kaeli	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
23	jantonacci@cjcollegeprep.org	Ms. Antonacci	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
26	bagudelo@cjcollegeprep.org	Ms. Bibiana	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
27	abicer@cjcollegeprep.org	Mr. Ahmet	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
25	pespinoza@cjcollegeprep.org	Ms. Espinoza	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
28	vsuslu@cjcollegeprep.org	Mr. Bright	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
29	fbarker@cjcollegeprep.org	Ms. Brown	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
30	mgibbs@cjcollegeprep.org	Ms. Gibbs	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
31	kmercedes@cjcollegeprep.org	Ms. Mercedes	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
24	accountspayable@cjcollegeprep.org	Ms. Mancuso	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
33	skeskin@cjcollegeprep.org	Ms. Keskin	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
34	cpagliuca@cjcollegeprep.org	Ms. Pagliuca	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
35	stayfur@cjcollegeprep.org	Mr. Tayfur	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
36	scerone@cjcollegeprep.org	Ms. Cerone	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
32	myilmaz@cjcollegeprep.org	Mr. Mert	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
51	hrdept@cjcollegeprep.org	Ms. LaLindez	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
53	cquerijero@cjcollegeprep.org	Ms. Querijero	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
52	ldobrin@cjcollegeprep.org	Ms. Dobrin	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
54	mmontgomery@cjcollegeprep.org	Ms. Montgomery	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
55	akahraman@cjcollegeprep.org	Mr. Kahraman	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
47	rorhan@cjcollegeprep.org	Ms. Orhan	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
6	sysadmin@cjcollegeprep.org	School System Administrator	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	t	f	t	f	\N	{}	t	t	t	2025-08-09 05:15:59.219	2025-08-10 22:18:16.611	standard	modern	\N
8	namin@cjcollegeprep.org	Ms. Nima Amin	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	t	f	\N	{}	t	t	t	2025-08-09 05:15:59.219	2025-08-10 22:18:16.611	standard	modern	\N
20	nsercan@cjcollegeprep.org	Dr. Namik Sercan	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	t	f	t	f	\N	{}	t	t	t	2025-08-09 05:15:59.219	2025-08-10 22:18:16.611	standard	modern	\N
7	fbrown@cjcollegeprep.org	Ms. Brown	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
9	amygettelfinger@cjcollegeprep.org	Ms. Gettelfinger	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
38	sba@cjcollegeprep.org	Ms. Daubon	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
39	ahauser@cjcollegeprep.org	Ms. Hauser	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
40	smeyer@cjcollegeprep.org	Ms. Meyer	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
41	imlladenovic@cjcollegeprep.org	Ms. Mladenovic	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
42	kbarkohani@cjcollegeprep.org	Ms. Barkohani	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
43	asimon@cjcollegeprep.org	Ms. Simon	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
44	ninanir@cjcollegeprep.org	Ms. Neval	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
45	djacobs@cjcollegeprep.org	Ms. Jacobs	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
46	jtadros@cjcollegeprep.org	Ms. Tadros	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
48	palvarez@cjcollegeprep.org	Ms. Alvarez	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
49	dvesper@cjcollegeprep.org	Dr. Vesper	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
37	ktemplasky@cjcollegeprep.org	Mr. Tempalsky	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
50	ekeating@cjcollegeprep.org	Ms. Keating	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-10 22:18:16.611	standard	modern	\N
60	admin@school.edu	Development Admin	\N	$2b$10$Yp7R3YxW2j1NCvMLX725xe.vQnWfTielzvIKRr0l5HEb/zewSj6cq	\N	\N	t	t	f	f	\N	\N	t	t	t	2025-08-25 01:19:28.428	2025-08-25 01:19:28.428	standard	modern	\N
\.


--
-- Data for Name: verification_token; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.verification_token (identifier, token, expires) FROM stdin;
\.


--
-- Name: Department_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public."Department_id_seq"', 1, true);


--
-- Name: District_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public."District_id_seq"', 3, true);


--
-- Name: MeetingAttendee_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public."MeetingAttendee_id_seq"', 75, true);


--
-- Name: Meeting_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public."Meeting_id_seq"', 28, true);


--
-- Name: Permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public."Permission_id_seq"', 138, true);


--
-- Name: RoleHierarchy_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public."RoleHierarchy_id_seq"', 11, true);


--
-- Name: Role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public."Role_id_seq"', 41, true);


--
-- Name: School_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public."School_id_seq"', 3, true);


--
-- Name: Staff_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public."Staff_id_seq"', 59, true);


--
-- Name: agenda_item_attachments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.agenda_item_attachments_id_seq', 1, false);


--
-- Name: agenda_item_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.agenda_item_comments_id_seq', 3, true);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 245, true);


--
-- Name: critical_audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.critical_audit_logs_id_seq', 1, false);


--
-- Name: department_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.department_id_seq', 1, false);


--
-- Name: devices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.devices_id_seq', 1, false);


--
-- Name: district_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.district_id_seq', 1, false);


--
-- Name: meeting_action_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.meeting_action_items_id_seq', 1, false);


--
-- Name: meeting_agenda_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.meeting_agenda_items_id_seq', 26, true);


--
-- Name: meeting_attendee_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.meeting_attendee_id_seq', 1, false);


--
-- Name: meeting_audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.meeting_audit_logs_id_seq', 4, true);


--
-- Name: meeting_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.meeting_id_seq', 1, false);


--
-- Name: meeting_notes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.meeting_notes_id_seq', 5, true);


--
-- Name: meeting_search_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.meeting_search_id_seq', 1, false);


--
-- Name: meeting_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.meeting_templates_id_seq', 1, false);


--
-- Name: meeting_transcripts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.meeting_transcripts_id_seq', 1, false);


--
-- Name: permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.permission_id_seq', 1, false);


--
-- Name: role_hierarchy_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.role_hierarchy_id_seq', 1, false);


--
-- Name: role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.role_id_seq', 1, false);


--
-- Name: role_transitions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.role_transitions_id_seq', 1, false);


--
-- Name: school_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.school_id_seq', 1, false);


--
-- Name: staff_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.staff_id_seq', 1, false);


--
-- Name: system_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.system_settings_id_seq', 1, false);


--
-- Name: team_knowledge_views_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.team_knowledge_views_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.users_id_seq', 63, true);


--
-- Name: account Account_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY (id);


--
-- Name: department Department_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.department
    ADD CONSTRAINT "Department_pkey" PRIMARY KEY (id);


--
-- Name: district District_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.district
    ADD CONSTRAINT "District_pkey" PRIMARY KEY (id);


--
-- Name: meeting_attendee MeetingAttendee_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_attendee
    ADD CONSTRAINT "MeetingAttendee_pkey" PRIMARY KEY (id);


--
-- Name: meeting Meeting_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting
    ADD CONSTRAINT "Meeting_pkey" PRIMARY KEY (id);


--
-- Name: permission Permission_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.permission
    ADD CONSTRAINT "Permission_pkey" PRIMARY KEY (id);


--
-- Name: role_hierarchy RoleHierarchy_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.role_hierarchy
    ADD CONSTRAINT "RoleHierarchy_pkey" PRIMARY KEY (id);


--
-- Name: role Role_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.role
    ADD CONSTRAINT "Role_pkey" PRIMARY KEY (id);


--
-- Name: school School_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.school
    ADD CONSTRAINT "School_pkey" PRIMARY KEY (id);


--
-- Name: session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: staff Staff_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT "Staff_pkey" PRIMARY KEY (id);


--
-- Name: system_setting SystemSetting_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.system_setting
    ADD CONSTRAINT "SystemSetting_pkey" PRIMARY KEY (key);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: agenda_item_attachments agenda_item_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.agenda_item_attachments
    ADD CONSTRAINT agenda_item_attachments_pkey PRIMARY KEY (id);


--
-- Name: agenda_item_comments agenda_item_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.agenda_item_comments
    ADD CONSTRAINT agenda_item_comments_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: critical_audit_logs critical_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.critical_audit_logs
    ADD CONSTRAINT critical_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: dev_logs dev_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.dev_logs
    ADD CONSTRAINT dev_logs_pkey PRIMARY KEY (id);


--
-- Name: devices devices_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_pkey PRIMARY KEY (id);


--
-- Name: meeting_action_items meeting_action_items_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_action_items
    ADD CONSTRAINT meeting_action_items_pkey PRIMARY KEY (id);


--
-- Name: meeting_agenda_items meeting_agenda_items_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_agenda_items
    ADD CONSTRAINT meeting_agenda_items_pkey PRIMARY KEY (id);


--
-- Name: meeting_audit_logs meeting_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_audit_logs
    ADD CONSTRAINT meeting_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: meeting_notes meeting_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_notes
    ADD CONSTRAINT meeting_notes_pkey PRIMARY KEY (id);


--
-- Name: meeting_search meeting_search_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_search
    ADD CONSTRAINT meeting_search_pkey PRIMARY KEY (id);


--
-- Name: meeting_templates meeting_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_templates
    ADD CONSTRAINT meeting_templates_pkey PRIMARY KEY (id);


--
-- Name: meeting_transcripts meeting_transcripts_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_transcripts
    ADD CONSTRAINT meeting_transcripts_pkey PRIMARY KEY (id);


--
-- Name: role_transitions role_transitions_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.role_transitions
    ADD CONSTRAINT role_transitions_pkey PRIMARY KEY (id);


--
-- Name: security_logs security_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.security_logs
    ADD CONSTRAINT security_logs_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: team_knowledge team_knowledge_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.team_knowledge
    ADD CONSTRAINT team_knowledge_pkey PRIMARY KEY (id);


--
-- Name: team_knowledge_views team_knowledge_views_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.team_knowledge_views
    ADD CONSTRAINT team_knowledge_views_pkey PRIMARY KEY (id);


--
-- Name: team_members team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_pkey PRIMARY KEY (id);


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: Account_provider_providerAccountId_key; Type: INDEX; Schema: public; Owner: hs
--

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON public.account USING btree (provider, provider_account_id);


--
-- Name: Department_code_key; Type: INDEX; Schema: public; Owner: hs
--

CREATE UNIQUE INDEX "Department_code_key" ON public.department USING btree (code);


--
-- Name: MeetingAttendee_meeting_id_staff_id_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX "MeetingAttendee_meeting_id_staff_id_idx" ON public.meeting_attendee USING btree (meeting_id, staff_id);


--
-- Name: MeetingAttendee_staff_id_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX "MeetingAttendee_staff_id_idx" ON public.meeting_attendee USING btree (staff_id);


--
-- Name: Meeting_department_id_start_time_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX "Meeting_department_id_start_time_idx" ON public.meeting USING btree (department_id, start_time);


--
-- Name: Meeting_organizer_id_start_time_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX "Meeting_organizer_id_start_time_idx" ON public.meeting USING btree (organizer_id, start_time);


--
-- Name: Meeting_school_id_start_time_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX "Meeting_school_id_start_time_idx" ON public.meeting USING btree (school_id, start_time);


--
-- Name: Meeting_start_time_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX "Meeting_start_time_idx" ON public.meeting USING btree (start_time);


--
-- Name: Meeting_status_start_time_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX "Meeting_status_start_time_idx" ON public.meeting USING btree (status, start_time);


--
-- Name: Meeting_team_id_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX "Meeting_team_id_idx" ON public.meeting USING btree (team_id);


--
-- Name: Permission_capability_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX "Permission_capability_idx" ON public.permission USING btree (capability);


--
-- Name: Permission_resource_action_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX "Permission_resource_action_idx" ON public.permission USING btree (resource, action);


--
-- Name: Permission_role_id_capability_key; Type: INDEX; Schema: public; Owner: hs
--

CREATE UNIQUE INDEX "Permission_role_id_capability_key" ON public.permission USING btree (role_id, capability);


--
-- Name: RoleHierarchy_parent_role_id_child_role_id_key; Type: INDEX; Schema: public; Owner: hs
--

CREATE UNIQUE INDEX "RoleHierarchy_parent_role_id_child_role_id_key" ON public.role_hierarchy USING btree (parent_role_id, child_role_id);


--
-- Name: Role_key_key; Type: INDEX; Schema: public; Owner: hs
--

CREATE UNIQUE INDEX "Role_key_key" ON public.role USING btree (key);


--
-- Name: Role_title_key; Type: INDEX; Schema: public; Owner: hs
--

CREATE UNIQUE INDEX "Role_title_key" ON public.role USING btree (title);


--
-- Name: Session_sessionToken_key; Type: INDEX; Schema: public; Owner: hs
--

CREATE UNIQUE INDEX "Session_sessionToken_key" ON public.session USING btree (session_token);


--
-- Name: VerificationToken_identifier_token_key; Type: INDEX; Schema: public; Owner: hs
--

CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON public.verification_token USING btree (identifier, token);


--
-- Name: VerificationToken_token_key; Type: INDEX; Schema: public; Owner: hs
--

CREATE UNIQUE INDEX "VerificationToken_token_key" ON public.verification_token USING btree (token);


--
-- Name: agenda_item_attachments_agenda_item_id_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX agenda_item_attachments_agenda_item_id_idx ON public.agenda_item_attachments USING btree (agenda_item_id);


--
-- Name: agenda_item_attachments_uploaded_by_id_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX agenda_item_attachments_uploaded_by_id_idx ON public.agenda_item_attachments USING btree (uploaded_by_id);


--
-- Name: agenda_item_comments_agenda_item_id_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX agenda_item_comments_agenda_item_id_idx ON public.agenda_item_comments USING btree (agenda_item_id);


--
-- Name: audit_logs_operation_created_at_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX audit_logs_operation_created_at_idx ON public.audit_logs USING btree (operation, created_at);


--
-- Name: audit_logs_table_name_created_at_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX audit_logs_table_name_created_at_idx ON public.audit_logs USING btree (table_name, created_at);


--
-- Name: audit_logs_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX audit_logs_user_id_created_at_idx ON public.audit_logs USING btree (user_id, created_at);


--
-- Name: critical_audit_logs_category_risk_score_timestamp_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX critical_audit_logs_category_risk_score_timestamp_idx ON public.critical_audit_logs USING btree (category, risk_score, "timestamp");


--
-- Name: critical_audit_logs_category_timestamp_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX critical_audit_logs_category_timestamp_idx ON public.critical_audit_logs USING btree (category, "timestamp");


--
-- Name: critical_audit_logs_category_user_id_timestamp_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX critical_audit_logs_category_user_id_timestamp_idx ON public.critical_audit_logs USING btree (category, user_id, "timestamp");


--
-- Name: critical_audit_logs_ip_address_timestamp_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX critical_audit_logs_ip_address_timestamp_idx ON public.critical_audit_logs USING btree (ip_address, "timestamp");


--
-- Name: critical_audit_logs_risk_score_timestamp_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX critical_audit_logs_risk_score_timestamp_idx ON public.critical_audit_logs USING btree (risk_score, "timestamp");


--
-- Name: critical_audit_logs_success_risk_score_timestamp_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX critical_audit_logs_success_risk_score_timestamp_idx ON public.critical_audit_logs USING btree (success, risk_score, "timestamp");


--
-- Name: critical_audit_logs_user_id_staff_id_timestamp_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX critical_audit_logs_user_id_staff_id_timestamp_idx ON public.critical_audit_logs USING btree (user_id, staff_id, "timestamp");


--
-- Name: critical_audit_logs_user_id_timestamp_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX critical_audit_logs_user_id_timestamp_idx ON public.critical_audit_logs USING btree (user_id, "timestamp");


--
-- Name: dev_logs_category_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX dev_logs_category_idx ON public.dev_logs USING btree (category);


--
-- Name: dev_logs_component_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX dev_logs_component_idx ON public.dev_logs USING btree (component);


--
-- Name: dev_logs_environment_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX dev_logs_environment_idx ON public.dev_logs USING btree (environment);


--
-- Name: dev_logs_level_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX dev_logs_level_idx ON public.dev_logs USING btree (level);


--
-- Name: dev_logs_status_code_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX dev_logs_status_code_idx ON public.dev_logs USING btree (status_code);


--
-- Name: dev_logs_timestamp_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX dev_logs_timestamp_idx ON public.dev_logs USING btree ("timestamp");


--
-- Name: dev_logs_user_id_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX dev_logs_user_id_idx ON public.dev_logs USING btree (user_id);


--
-- Name: devices_device_id_key; Type: INDEX; Schema: public; Owner: hs
--

CREATE UNIQUE INDEX devices_device_id_key ON public.devices USING btree (device_id);


--
-- Name: devices_user_id_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX devices_user_id_idx ON public.devices USING btree (user_id);


--
-- Name: idx_agenda_item_attachments_agenda_item_id; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX idx_agenda_item_attachments_agenda_item_id ON public.agenda_item_attachments USING btree (agenda_item_id);


--
-- Name: idx_agenda_item_comments_agenda_item_id; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX idx_agenda_item_comments_agenda_item_id ON public.agenda_item_comments USING btree (agenda_item_id);


--
-- Name: idx_agenda_item_comments_staff_id; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX idx_agenda_item_comments_staff_id ON public.agenda_item_comments USING btree (staff_id);


--
-- Name: idx_meeting_parent_meeting_id; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX idx_meeting_parent_meeting_id ON public.meeting USING btree (parent_meeting_id);


--
-- Name: idx_meeting_search_meeting_id; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX idx_meeting_search_meeting_id ON public.meeting_search USING btree (meeting_id);


--
-- Name: idx_meeting_series_id; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX idx_meeting_series_id ON public.meeting USING btree (series_id);


--
-- Name: idx_meeting_team_id; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX idx_meeting_team_id ON public.meeting USING btree (team_id);


--
-- Name: idx_meeting_template_id; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX idx_meeting_template_id ON public.meeting USING btree (template_id);


--
-- Name: idx_meeting_transcripts_meeting_id; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX idx_meeting_transcripts_meeting_id ON public.meeting_transcripts USING btree (meeting_id);


--
-- Name: idx_system_settings_category; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX idx_system_settings_category ON public.system_settings USING btree (category);


--
-- Name: idx_system_settings_key; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX idx_system_settings_key ON public.system_settings USING btree (key);


--
-- Name: idx_team_knowledge_is_public; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX idx_team_knowledge_is_public ON public.team_knowledge USING btree (is_public);


--
-- Name: idx_team_knowledge_team_id; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX idx_team_knowledge_team_id ON public.team_knowledge USING btree (team_id);


--
-- Name: idx_team_knowledge_type; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX idx_team_knowledge_type ON public.team_knowledge USING btree (type);


--
-- Name: idx_team_knowledge_views_knowledge_id; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX idx_team_knowledge_views_knowledge_id ON public.team_knowledge_views USING btree (knowledge_id);


--
-- Name: idx_team_knowledge_views_user_id; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX idx_team_knowledge_views_user_id ON public.team_knowledge_views USING btree (user_id);


--
-- Name: idx_teams_department_id; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX idx_teams_department_id ON public.teams USING btree (department_id);


--
-- Name: idx_teams_is_active; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX idx_teams_is_active ON public.teams USING btree (is_active);


--
-- Name: idx_teams_type; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX idx_teams_type ON public.teams USING btree (type);


--
-- Name: meeting_action_items_assigned_to_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX meeting_action_items_assigned_to_idx ON public.meeting_action_items USING btree (assigned_to);


--
-- Name: meeting_action_items_assigned_to_role_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX meeting_action_items_assigned_to_role_idx ON public.meeting_action_items USING btree (assigned_to_role);


--
-- Name: meeting_action_items_due_date_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX meeting_action_items_due_date_idx ON public.meeting_action_items USING btree (due_date);


--
-- Name: meeting_action_items_meeting_id_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX meeting_action_items_meeting_id_idx ON public.meeting_action_items USING btree (meeting_id);


--
-- Name: meeting_action_items_status_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX meeting_action_items_status_idx ON public.meeting_action_items USING btree (status);


--
-- Name: meeting_agenda_items_meeting_id_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX meeting_agenda_items_meeting_id_idx ON public.meeting_agenda_items USING btree (meeting_id);


--
-- Name: meeting_agenda_items_parent_item_id_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX meeting_agenda_items_parent_item_id_idx ON public.meeting_agenda_items USING btree (parent_item_id);


--
-- Name: meeting_agenda_items_responsible_role_id_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX meeting_agenda_items_responsible_role_id_idx ON public.meeting_agenda_items USING btree (responsible_role_id);


--
-- Name: meeting_agenda_items_responsible_staff_id_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX meeting_agenda_items_responsible_staff_id_idx ON public.meeting_agenda_items USING btree (responsible_staff_id);


--
-- Name: meeting_audit_logs_created_at_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX meeting_audit_logs_created_at_idx ON public.meeting_audit_logs USING btree (created_at);


--
-- Name: meeting_audit_logs_meeting_id_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX meeting_audit_logs_meeting_id_idx ON public.meeting_audit_logs USING btree (meeting_id);


--
-- Name: meeting_audit_logs_user_id_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX meeting_audit_logs_user_id_idx ON public.meeting_audit_logs USING btree (user_id);


--
-- Name: meeting_search_meeting_id_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX meeting_search_meeting_id_idx ON public.meeting_search USING btree (meeting_id);


--
-- Name: meeting_transcripts_meeting_id_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX meeting_transcripts_meeting_id_idx ON public.meeting_transcripts USING btree (meeting_id);


--
-- Name: meeting_transcripts_meeting_id_key; Type: INDEX; Schema: public; Owner: hs
--

CREATE UNIQUE INDEX meeting_transcripts_meeting_id_key ON public.meeting_transcripts USING btree (meeting_id);


--
-- Name: role_transitions_from_staff_id_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX role_transitions_from_staff_id_idx ON public.role_transitions USING btree (from_staff_id);


--
-- Name: role_transitions_role_id_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX role_transitions_role_id_idx ON public.role_transitions USING btree (role_id);


--
-- Name: role_transitions_to_staff_id_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX role_transitions_to_staff_id_idx ON public.role_transitions USING btree (to_staff_id);


--
-- Name: security_logs_action_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX security_logs_action_idx ON public.security_logs USING btree (action);


--
-- Name: security_logs_category_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX security_logs_category_idx ON public.security_logs USING btree (category);


--
-- Name: security_logs_level_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX security_logs_level_idx ON public.security_logs USING btree (level);


--
-- Name: security_logs_result_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX security_logs_result_idx ON public.security_logs USING btree (result);


--
-- Name: security_logs_risk_level_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX security_logs_risk_level_idx ON public.security_logs USING btree (risk_level);


--
-- Name: security_logs_timestamp_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX security_logs_timestamp_idx ON public.security_logs USING btree ("timestamp");


--
-- Name: security_logs_user_id_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX security_logs_user_id_idx ON public.security_logs USING btree (user_id);


--
-- Name: system_settings_key_key; Type: INDEX; Schema: public; Owner: hs
--

CREATE UNIQUE INDEX system_settings_key_key ON public.system_settings USING btree (key);


--
-- Name: team_knowledge_team_id_category_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX team_knowledge_team_id_category_idx ON public.team_knowledge USING btree (team_id, category);


--
-- Name: team_knowledge_views_knowledge_id_user_id_key; Type: INDEX; Schema: public; Owner: hs
--

CREATE UNIQUE INDEX team_knowledge_views_knowledge_id_user_id_key ON public.team_knowledge_views USING btree (knowledge_id, user_id);


--
-- Name: team_knowledge_visibility_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX team_knowledge_visibility_idx ON public.team_knowledge USING btree (visibility);


--
-- Name: team_members_team_id_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX team_members_team_id_idx ON public.team_members USING btree (team_id);


--
-- Name: team_members_team_id_user_id_key; Type: INDEX; Schema: public; Owner: hs
--

CREATE UNIQUE INDEX team_members_team_id_user_id_key ON public.team_members USING btree (team_id, user_id);


--
-- Name: team_members_user_id_is_active_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX team_members_user_id_is_active_idx ON public.team_members USING btree (user_id, is_active);


--
-- Name: teams_code_key; Type: INDEX; Schema: public; Owner: hs
--

CREATE UNIQUE INDEX teams_code_key ON public.teams USING btree (code);


--
-- Name: teams_created_by_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX teams_created_by_idx ON public.teams USING btree (created_by);


--
-- Name: teams_school_id_status_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX teams_school_id_status_idx ON public.teams USING btree (school_id, status);


--
-- Name: teams_type_status_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX teams_type_status_idx ON public.teams USING btree (type, status);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: hs
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_staff_id_key; Type: INDEX; Schema: public; Owner: hs
--

CREATE UNIQUE INDEX users_staff_id_key ON public.users USING btree (staff_id);


--
-- Name: account Account_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: department Department_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.department
    ADD CONSTRAINT "Department_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES public.department(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: department Department_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.department
    ADD CONSTRAINT "Department_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public.school(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: meeting_attendee MeetingAttendee_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_attendee
    ADD CONSTRAINT "MeetingAttendee_meeting_id_fkey" FOREIGN KEY (meeting_id) REFERENCES public.meeting(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: meeting_attendee MeetingAttendee_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_attendee
    ADD CONSTRAINT "MeetingAttendee_staff_id_fkey" FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: meeting Meeting_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting
    ADD CONSTRAINT "Meeting_department_id_fkey" FOREIGN KEY (department_id) REFERENCES public.department(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: meeting Meeting_district_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting
    ADD CONSTRAINT "Meeting_district_id_fkey" FOREIGN KEY (district_id) REFERENCES public.district(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: meeting Meeting_organizer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting
    ADD CONSTRAINT "Meeting_organizer_id_fkey" FOREIGN KEY (organizer_id) REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: meeting Meeting_parent_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting
    ADD CONSTRAINT "Meeting_parent_meeting_id_fkey" FOREIGN KEY (parent_meeting_id) REFERENCES public.meeting(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: meeting Meeting_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting
    ADD CONSTRAINT "Meeting_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public.school(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: meeting Meeting_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting
    ADD CONSTRAINT "Meeting_team_id_fkey" FOREIGN KEY (team_id) REFERENCES public.teams(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: meeting Meeting_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting
    ADD CONSTRAINT "Meeting_template_id_fkey" FOREIGN KEY (template_id) REFERENCES public.meeting_templates(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: permission Permission_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.permission
    ADD CONSTRAINT "Permission_role_id_fkey" FOREIGN KEY (role_id) REFERENCES public.role(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role_hierarchy RoleHierarchy_child_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.role_hierarchy
    ADD CONSTRAINT "RoleHierarchy_child_role_id_fkey" FOREIGN KEY (child_role_id) REFERENCES public.role(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: role_hierarchy RoleHierarchy_parent_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.role_hierarchy
    ADD CONSTRAINT "RoleHierarchy_parent_role_id_fkey" FOREIGN KEY (parent_role_id) REFERENCES public.role(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: role Role_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.role
    ADD CONSTRAINT "Role_department_id_fkey" FOREIGN KEY (department_id) REFERENCES public.department(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: role Role_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.role
    ADD CONSTRAINT "Role_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES public.role(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: school School_district_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.school
    ADD CONSTRAINT "School_district_id_fkey" FOREIGN KEY (district_id) REFERENCES public.district(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: staff Staff_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT "Staff_department_id_fkey" FOREIGN KEY (department_id) REFERENCES public.department(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: staff Staff_district_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT "Staff_district_id_fkey" FOREIGN KEY (district_id) REFERENCES public.district(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: staff Staff_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT "Staff_manager_id_fkey" FOREIGN KEY (manager_id) REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: staff Staff_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT "Staff_role_id_fkey" FOREIGN KEY (role_id) REFERENCES public.role(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: staff Staff_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT "Staff_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public.school(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: staff Staff_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT "Staff_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: team_knowledge TeamKnowledge_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.team_knowledge
    ADD CONSTRAINT "TeamKnowledge_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: team_knowledge TeamKnowledge_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.team_knowledge
    ADD CONSTRAINT "TeamKnowledge_team_id_fkey" FOREIGN KEY (team_id) REFERENCES public.teams(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: team_members TeamMember_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT "TeamMember_staff_id_fkey" FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: team_members TeamMember_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT "TeamMember_team_id_fkey" FOREIGN KEY (team_id) REFERENCES public.teams(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: team_members TeamMember_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT "TeamMember_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: teams Team_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT "Team_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: teams Team_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT "Team_department_id_fkey" FOREIGN KEY (department_id) REFERENCES public.department(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: teams Team_district_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT "Team_district_id_fkey" FOREIGN KEY (district_id) REFERENCES public.district(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: teams Team_parent_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT "Team_parent_team_id_fkey" FOREIGN KEY (parent_team_id) REFERENCES public.teams(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: teams Team_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT "Team_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public.school(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: agenda_item_attachments agenda_item_attachments_agenda_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.agenda_item_attachments
    ADD CONSTRAINT agenda_item_attachments_agenda_item_id_fkey FOREIGN KEY (agenda_item_id) REFERENCES public.meeting_agenda_items(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: agenda_item_attachments agenda_item_attachments_uploaded_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.agenda_item_attachments
    ADD CONSTRAINT agenda_item_attachments_uploaded_by_id_fkey FOREIGN KEY (uploaded_by_id) REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: agenda_item_comments agenda_item_comments_agenda_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.agenda_item_comments
    ADD CONSTRAINT agenda_item_comments_agenda_item_id_fkey FOREIGN KEY (agenda_item_id) REFERENCES public.meeting_agenda_items(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: agenda_item_comments agenda_item_comments_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.agenda_item_comments
    ADD CONSTRAINT agenda_item_comments_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: audit_logs audit_logs_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: critical_audit_logs critical_audit_logs_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.critical_audit_logs
    ADD CONSTRAINT critical_audit_logs_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: critical_audit_logs critical_audit_logs_target_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.critical_audit_logs
    ADD CONSTRAINT critical_audit_logs_target_staff_id_fkey FOREIGN KEY (target_staff_id) REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: critical_audit_logs critical_audit_logs_target_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.critical_audit_logs
    ADD CONSTRAINT critical_audit_logs_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: critical_audit_logs critical_audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.critical_audit_logs
    ADD CONSTRAINT critical_audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: dev_logs dev_logs_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.dev_logs
    ADD CONSTRAINT dev_logs_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: dev_logs dev_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.dev_logs
    ADD CONSTRAINT dev_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: devices devices_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: meeting_action_items meeting_action_items_agenda_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_action_items
    ADD CONSTRAINT meeting_action_items_agenda_item_id_fkey FOREIGN KEY (agenda_item_id) REFERENCES public.meeting_agenda_items(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: meeting_action_items meeting_action_items_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_action_items
    ADD CONSTRAINT meeting_action_items_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: meeting_action_items meeting_action_items_assigned_to_role_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_action_items
    ADD CONSTRAINT meeting_action_items_assigned_to_role_fkey FOREIGN KEY (assigned_to_role) REFERENCES public.role(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: meeting_action_items meeting_action_items_completed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_action_items
    ADD CONSTRAINT meeting_action_items_completed_by_fkey FOREIGN KEY (completed_by) REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: meeting_action_items meeting_action_items_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_action_items
    ADD CONSTRAINT meeting_action_items_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public.meeting(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: meeting_action_items meeting_action_items_parent_action_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_action_items
    ADD CONSTRAINT meeting_action_items_parent_action_id_fkey FOREIGN KEY (parent_action_id) REFERENCES public.meeting_action_items(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: meeting_agenda_items meeting_agenda_items_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_agenda_items
    ADD CONSTRAINT meeting_agenda_items_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public.meeting(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: meeting_agenda_items meeting_agenda_items_parent_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_agenda_items
    ADD CONSTRAINT meeting_agenda_items_parent_item_id_fkey FOREIGN KEY (parent_item_id) REFERENCES public.meeting_agenda_items(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: meeting_agenda_items meeting_agenda_items_responsible_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_agenda_items
    ADD CONSTRAINT meeting_agenda_items_responsible_role_id_fkey FOREIGN KEY (responsible_role_id) REFERENCES public.role(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: meeting_agenda_items meeting_agenda_items_responsible_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_agenda_items
    ADD CONSTRAINT meeting_agenda_items_responsible_staff_id_fkey FOREIGN KEY (responsible_staff_id) REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: meeting_audit_logs meeting_audit_logs_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_audit_logs
    ADD CONSTRAINT meeting_audit_logs_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public.meeting(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: meeting_audit_logs meeting_audit_logs_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_audit_logs
    ADD CONSTRAINT meeting_audit_logs_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: meeting_audit_logs meeting_audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_audit_logs
    ADD CONSTRAINT meeting_audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: meeting_notes meeting_notes_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_notes
    ADD CONSTRAINT meeting_notes_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public.meeting(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: meeting_notes meeting_notes_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_notes
    ADD CONSTRAINT meeting_notes_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: meeting_search meeting_search_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_search
    ADD CONSTRAINT meeting_search_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public.meeting(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: meeting_templates meeting_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_templates
    ADD CONSTRAINT meeting_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: meeting_transcripts meeting_transcripts_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_transcripts
    ADD CONSTRAINT meeting_transcripts_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public.meeting(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role_transitions role_transitions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.role_transitions
    ADD CONSTRAINT role_transitions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: role_transitions role_transitions_from_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.role_transitions
    ADD CONSTRAINT role_transitions_from_staff_id_fkey FOREIGN KEY (from_staff_id) REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: role_transitions role_transitions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.role_transitions
    ADD CONSTRAINT role_transitions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.role(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: role_transitions role_transitions_to_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.role_transitions
    ADD CONSTRAINT role_transitions_to_staff_id_fkey FOREIGN KEY (to_staff_id) REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: security_logs security_logs_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.security_logs
    ADD CONSTRAINT security_logs_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: security_logs security_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.security_logs
    ADD CONSTRAINT security_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: team_knowledge team_knowledge_created_by_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.team_knowledge
    ADD CONSTRAINT team_knowledge_created_by_staff_id_fkey FOREIGN KEY (created_by_staff_id) REFERENCES public.staff(id) ON DELETE SET NULL;


--
-- Name: team_knowledge_views team_knowledge_views_knowledge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.team_knowledge_views
    ADD CONSTRAINT team_knowledge_views_knowledge_id_fkey FOREIGN KEY (knowledge_id) REFERENCES public.team_knowledge(id) ON DELETE CASCADE;


--
-- Name: team_knowledge_views team_knowledge_views_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.team_knowledge_views
    ADD CONSTRAINT team_knowledge_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

