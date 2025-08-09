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
-- Name: Account; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public."Account" (
    id text NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_state text,
    "userId" integer NOT NULL
);


ALTER TABLE public."Account" OWNER TO hs;

--
-- Name: Department; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public."Department" (
    id integer NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    category text,
    school_id integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    level integer DEFAULT 0 NOT NULL,
    parent_id integer
);


ALTER TABLE public."Department" OWNER TO hs;

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

ALTER SEQUENCE public."Department_id_seq" OWNED BY public."Department".id;


--
-- Name: District; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public."District" (
    name text NOT NULL,
    address text,
    code text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    id integer NOT NULL
);


ALTER TABLE public."District" OWNER TO hs;

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

ALTER SEQUENCE public."District_id_seq" OWNED BY public."District".id;


--
-- Name: Meeting; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public."Meeting" (
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
    series_position integer
);


ALTER TABLE public."Meeting" OWNER TO hs;

--
-- Name: MeetingAttendee; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public."MeetingAttendee" (
    status text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    meeting_id integer NOT NULL,
    staff_id integer NOT NULL,
    id integer NOT NULL
);


ALTER TABLE public."MeetingAttendee" OWNER TO hs;

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

ALTER SEQUENCE public."MeetingAttendee_id_seq" OWNED BY public."MeetingAttendee".id;


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

ALTER SEQUENCE public."Meeting_id_seq" OWNED BY public."Meeting".id;


--
-- Name: Role; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public."Role" (
    id integer NOT NULL,
    title text NOT NULL,
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


ALTER TABLE public."Role" OWNER TO hs;

--
-- Name: RoleHierarchy; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public."RoleHierarchy" (
    id integer NOT NULL,
    parent_role_id integer NOT NULL,
    child_role_id integer NOT NULL,
    hierarchy_level integer DEFAULT 1 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."RoleHierarchy" OWNER TO hs;

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

ALTER SEQUENCE public."RoleHierarchy_id_seq" OWNED BY public."RoleHierarchy".id;


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

ALTER SEQUENCE public."Role_id_seq" OWNED BY public."Role".id;


--
-- Name: School; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public."School" (
    name text NOT NULL,
    address text,
    code text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    district_id integer NOT NULL,
    id integer NOT NULL
);


ALTER TABLE public."School" OWNER TO hs;

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

ALTER SEQUENCE public."School_id_seq" OWNED BY public."School".id;


--
-- Name: Session; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "sessionToken" text NOT NULL,
    expires timestamp(3) without time zone NOT NULL,
    "userId" integer NOT NULL
);


ALTER TABLE public."Session" OWNER TO hs;

--
-- Name: Staff; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public."Staff" (
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


ALTER TABLE public."Staff" OWNER TO hs;

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

ALTER SEQUENCE public."Staff_id_seq" OWNED BY public."Staff".id;


--
-- Name: SystemSetting; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public."SystemSetting" (
    key text NOT NULL,
    value jsonb NOT NULL
);


ALTER TABLE public."SystemSetting" OWNER TO hs;

--
-- Name: VerificationToken; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public."VerificationToken" (
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."VerificationToken" OWNER TO hs;

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
-- Name: users; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text NOT NULL,
    name text,
    staff_id text,
    "hashedPassword" text,
    "emailVerified" timestamp(3) without time zone,
    image text,
    is_admin boolean DEFAULT false NOT NULL,
    two_factor_enabled boolean DEFAULT false NOT NULL,
    two_factor_secret text,
    backup_codes text[],
    login_notifications_enabled boolean DEFAULT true NOT NULL,
    suspicious_alerts_enabled boolean DEFAULT true NOT NULL,
    remember_devices_enabled boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    theme_preference text DEFAULT 'classic-light'::text
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
-- Name: Department id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Department" ALTER COLUMN id SET DEFAULT nextval('public."Department_id_seq"'::regclass);


--
-- Name: District id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."District" ALTER COLUMN id SET DEFAULT nextval('public."District_id_seq"'::regclass);


--
-- Name: Meeting id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Meeting" ALTER COLUMN id SET DEFAULT nextval('public."Meeting_id_seq"'::regclass);


--
-- Name: MeetingAttendee id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."MeetingAttendee" ALTER COLUMN id SET DEFAULT nextval('public."MeetingAttendee_id_seq"'::regclass);


--
-- Name: Role id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Role" ALTER COLUMN id SET DEFAULT nextval('public."Role_id_seq"'::regclass);


--
-- Name: RoleHierarchy id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."RoleHierarchy" ALTER COLUMN id SET DEFAULT nextval('public."RoleHierarchy_id_seq"'::regclass);


--
-- Name: School id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."School" ALTER COLUMN id SET DEFAULT nextval('public."School_id_seq"'::regclass);


--
-- Name: Staff id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Staff" ALTER COLUMN id SET DEFAULT nextval('public."Staff_id_seq"'::regclass);


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
-- Name: devices id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.devices ALTER COLUMN id SET DEFAULT nextval('public.devices_id_seq'::regclass);


--
-- Name: meeting_action_items id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_action_items ALTER COLUMN id SET DEFAULT nextval('public.meeting_action_items_id_seq'::regclass);


--
-- Name: meeting_agenda_items id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_agenda_items ALTER COLUMN id SET DEFAULT nextval('public.meeting_agenda_items_id_seq'::regclass);


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
-- Name: role_transitions id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.role_transitions ALTER COLUMN id SET DEFAULT nextval('public.role_transitions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: Account; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public."Account" (id, type, provider, "providerAccountId", refresh_token, access_token, expires_at, token_type, scope, id_token, session_state, "userId") FROM stdin;
\.


--
-- Data for Name: Department; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public."Department" (id, code, name, category, school_id, created_at, level, parent_id) FROM stdin;
1	TESTDEPT	Test Department	Test	1	2025-08-09 03:36:16.474	1	\N
3	EXEC	Executive Leadership	Administration	3	2025-08-09 04:07:23.01	1	\N
4	AP	Accounts Payable	Finance	3	2025-08-09 04:07:23.01	3	\N
5	DATA	Data Management	Administration	3	2025-08-09 04:07:23.01	3	\N
6	US_HUM	Upper School Humanities	Academic	3	2025-08-09 04:07:23.01	3	\N
7	HR	Human Resources	Administration	3	2025-08-09 04:07:23.01	3	\N
8	HEALTH	Health Services	Student Services	3	2025-08-09 04:07:23.01	3	\N
9	SYS	System Management	Administration	3	2025-08-09 04:07:23.01	0	\N
10	IT	Information Technology	Administration	3	2025-08-09 04:07:23.01	3	\N
11	ADMIN_SUPPORT	Administrative Support	Administration	3	2025-08-09 04:07:23.01	3	\N
12	GRANTS	Grants & Funding	Finance	3	2025-08-09 04:07:23.01	3	\N
13	BUS	Business & Finance	Administration	3	2025-08-09 04:07:23.01	2	\N
14	ELEM	Elementary Education	Academic	3	2025-08-09 04:07:23.01	3	\N
15	SEC	Security & Safety	Administration	3	2025-08-09 04:07:23.01	3	\N
16	SUPPORT	Student Support	Student Services	3	2025-08-09 04:07:23.01	2	\N
18	US_STEM	Upper School STEM	Academic	3	2025-08-09 04:07:23.01	3	\N
17	CURR	Curriculum Development	Academic	3	2025-08-09 04:07:23.01	2	\N
19	EXEC_SUPPORT	Executive Support	Administration	3	2025-08-09 04:07:23.01	3	\N
20	SPED	Special Education	Student Services	3	2025-08-09 04:07:23.01	2	\N
21	ELECTIVES	Electives & Arts	Academic	3	2025-08-09 04:07:23.01	3	\N
23	STEM	STEM	Academic	3	2025-08-09 04:07:23.01	2	\N
22	ASSESS	Assessment & Accountability	Academic	3	2025-08-09 04:07:23.01	2	\N
24	HUM	Humanities	Academic	3	2025-08-09 04:07:23.01	2	\N
25	ELEM_COACH	Elementary Coaching	Academic	3	2025-08-09 04:07:23.01	3	\N
26	ATTENDANCE	Attendance Services	Administration	3	2025-08-09 04:07:23.01	3	\N
27	PURCHASE	Purchasing	Finance	3	2025-08-09 04:07:23.01	3	\N
28	OPS	Operations	Administration	3	2025-08-09 04:07:23.01	2	\N
\.


--
-- Data for Name: District; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public."District" (name, address, code, created_at, id) FROM stdin;
Test District	Test Address	TESTDIST	2025-08-09 03:36:16.465	1
CJCP Somerset	Somerset, NJ	CJCPS	2025-08-09 04:07:22.984	2
\.


--
-- Data for Name: Meeting; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public."Meeting" (title, description, created_at, department_id, district_id, end_time, organizer_id, school_id, start_time, zoom_join_url, zoom_meeting_id, id, action_items, agenda, calendar_integration, decisions, is_continuation, meeting_type, notes, parent_meeting_id, repeat_type, status, template_id, is_series_master, repeat_end_date, repeat_end_type, repeat_exceptions, repeat_interval, repeat_month_day, repeat_month_week, repeat_month_weekday, repeat_occurrences, repeat_pattern, repeat_weekdays, series_id, series_position) FROM stdin;
\.


--
-- Data for Name: MeetingAttendee; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public."MeetingAttendee" (status, created_at, meeting_id, staff_id, id) FROM stdin;
\.


--
-- Data for Name: Role; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public."Role" (id, title, priority, category, department_id, created_at, is_leadership, level, parent_id, extension, is_coordinator, is_supervisor, room) FROM stdin;
1	Test Role	1	\N	1	2025-08-09 03:36:16.475	f	1	\N	\N	f	f	\N
3	US Supervisor - Electives	3	\N	21	2025-08-09 04:07:23.045	t	3	\N	\N	f	t	\N
6	Elementary Supervisor	3	\N	14	2025-08-09 04:07:23.045	t	3	\N	1122	f	t	122
18	Director of Special Education	2	\N	20	2025-08-09 04:07:23.045	t	2	\N	1695	f	t	130
13	Purchasing Specialist	3	\N	27	2025-08-09 04:07:23.045	f	3	\N	1501	f	f	3rd Floor
11	Business Administrator	2	\N	13	2025-08-09 04:07:23.045	t	2	\N	\N	f	t	\N
10	System Administrator	0	\N	9	2025-08-09 04:07:23.045	t	0	\N	9999	f	t	Server Room
14	Chronic Absenteeism Specialist	3	\N	26	2025-08-09 04:07:23.045	f	3	\N	1702	f	f	Main Office
15	Assistant Business Administrator	2	\N	13	2025-08-09 04:07:23.045	t	2	\N	1509	f	t	3rd Floor
7	Assistant Director of Student Support Services	2	\N	16	2025-08-09 04:07:23.045	t	2	\N	1201	f	t	201
4	Director of Operations	2	\N	28	2025-08-09 04:07:23.045	t	2	\N	1125	f	t	125
17	School Secretary	3	\N	11	2025-08-09 04:07:23.045	f	3	\N	1100	f	f	Main Office
9	Director of Curriculum - STEM	2	\N	23	2025-08-09 04:07:23.045	t	2	\N	1126	f	t	126
8	Head of Security	3	\N	15	2025-08-09 04:07:23.045	t	3	\N	1101	f	t	101
16	Supervisors - Curriculum/Professional Development	2	\N	17	2025-08-09 04:07:23.045	t	2	\N	1127	f	t	127
2	Director of Student Support Services	2	\N	16	2025-08-09 04:07:23.045	t	2	\N	1105	f	t	105
12	Business Specialist (Grants)	3	\N	12	2025-08-09 04:07:23.045	f	3	\N	1503	f	f	3rd Floor
5	Chief Education Officer	1	\N	3	2025-08-09 04:07:23.045	t	1	\N	1001	f	t	501
20	Executive Administrative Assistant	3	\N	19	2025-08-09 04:07:23.045	f	3	\N	1508	f	f	3rd Floor
21	IT Manager	3	\N	10	2025-08-09 04:07:23.046	t	3	\N	1650	f	t	600 hw
22	Academic Counselor	4	\N	16	2025-08-09 04:07:23.046	f	4	\N	1697	f	f	634
19	Accounts Payable Specialist	3	\N	4	2025-08-09 04:07:23.046	f	3	\N	1502	f	f	3rd Floor
23	HR Specialist	3	\N	7	2025-08-09 04:07:23.045	f	3	\N	1507	f	f	3rd Floor
24	Director of Accountability	2	\N	22	2025-08-09 04:07:23.046	t	2	\N	1696	f	t	130
25	School Counselor	4	\N	16	2025-08-09 04:07:23.046	f	4	\N	1103	f	f	104
26	Social Worker	4	\N	16	2025-08-09 04:07:23.046	f	4	\N	1104	f	f	104
27	School Nurse	3	\N	8	2025-08-09 04:07:23.046	f	3	\N	1694	f	f	630
28	Behavioral Specialist	4	\N	16	2025-08-09 04:07:23.046	f	4	\N	1701	f	f	TBD
29	Registrar & Data Management Specialist	3	\N	5	2025-08-09 04:07:23.045	f	3	\N	1506	f	f	3rd Floor
31	School Psychologist	4	\N	16	2025-08-09 04:07:23.046	f	4	\N	1704	f	f	123
30	Elementary Coach	3	\N	25	2025-08-09 04:07:23.046	t	3	\N	1131	f	t	131
32	US Supervisor - STEM	3	\N	18	2025-08-09 04:07:23.046	t	3	\N	1126	f	t	126
33	IT Specialist	3	\N	10	2025-08-09 04:07:23.046	f	3	\N	1652	f	f	200 hw
34	Director of Curriculum - Humanities	2	\N	24	2025-08-09 04:07:23.046	t	2	\N	1124	f	t	124
35	HR Payroll & Benefits Specialist	3	\N	7	2025-08-09 04:07:23.045	f	3	\N	1504	f	f	3rd Floor
36	US Supervisor - Humanities	3	\N	6	2025-08-09 04:07:23.046	t	3	\N	\N	f	t	\N
37	Teacher	4	\N	24	2025-08-09 04:07:23.046	f	4	\N	\N	f	f	\N
\.


--
-- Data for Name: RoleHierarchy; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public."RoleHierarchy" (id, parent_role_id, child_role_id, hierarchy_level, created_at) FROM stdin;
\.


--
-- Data for Name: School; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public."School" (name, address, code, created_at, district_id, id) FROM stdin;
Test School	Test School Address	TESTSCH	2025-08-09 03:36:16.472	1	1
Test School	Test School Address	TESTSCH	2025-08-09 04:03:35.894	1	2
CJCP Somerset Campus	Somerset, NJ	CJCPS-SOM	2025-08-09 04:07:23.004	2	3
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public."Session" (id, "sessionToken", expires, "userId") FROM stdin;
\.


--
-- Data for Name: Staff; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public."Staff" (id, user_id, department_id, role_id, manager_id, flags, endorsements, school_id, district_id, created_at, extension, hire_date, is_active, room) FROM stdin;
1	2	1	1	\N	{}	{}	1	1	2025-08-09 03:36:16.578	\N	\N	t	\N
2	3	1	1	\N	{}	{}	1	1	2025-08-09 03:36:16.578	\N	\N	t	\N
3	1	1	1	\N	{}	{}	1	1	2025-08-09 03:36:16.578	\N	\N	t	\N
\.


--
-- Data for Name: SystemSetting; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public."SystemSetting" (key, value) FROM stdin;
\.


--
-- Data for Name: VerificationToken; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public."VerificationToken" (identifier, token, expires) FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
a1591e2d-1c85-4996-937f-afcd28307227	80458aec995a94e3c08b8a4ad44ed7009deb3347f8a7057a4e648fcfe3b92a42	2025-08-08 23:36:15.666252-04	20250602124513_init	\N	\N	2025-08-08 23:36:15.636388-04	1
e0608000-d0fa-4618-9799-97a069f65bf0	187682417fe83af7fada906e899a50a1327eb0bce4af29cc92ad3d13e34039af	2025-08-08 23:36:15.705039-04	20250612214434_add_user_auth_fields	\N	\N	2025-08-08 23:36:15.66679-04	1
083f60d4-f583-48b9-87e1-b89074fecfaa	21323ec5d5c0831e8f1233b8d3254a43e4111e827779114d13719d685ac6742d	2025-08-08 23:36:15.706524-04	20250612214447_add_user_auth_fields	\N	\N	2025-08-08 23:36:15.705307-04	1
2d578355-cfcc-45cd-a148-238dc2eed562	c3ad675140bd22b390bdfccb5d7cfaa10f397d26fe05b0d89c41809cf99a336d	2025-08-08 23:36:15.708831-04	20250701174505_add_meeting_enhancements	\N	\N	2025-08-08 23:36:15.706767-04	1
b9732aac-1a4c-4af2-965c-f6346dce3099	7521b7a8b86f0119ba6fb793947dc009781915c2f400a6369c37a5b3b899d0ed	2025-08-08 23:36:15.722703-04	20250725024129_add_meeting_templates	\N	\N	2025-08-08 23:36:15.709192-04	1
639bc0d4-1f5e-40cd-83cc-0e06b4989a6c	95fc2037be10848f0f0fb58e398b984976001308a6ebf270acd8b954846fdaf4	2025-08-08 23:36:15.735939-04	20250804140520_add_meeting_agenda_system	\N	\N	2025-08-08 23:36:15.72302-04	1
87332b1d-817f-4643-841e-0a33682893e0	90c9abcc5e20705b6de2faa399d8b20fce8a10d7698dc890a9cf347dbfe27ba0	2025-08-08 23:36:15.738023-04	20250804212530_update_agenda_item_attachments	\N	\N	2025-08-08 23:36:15.736206-04	1
566e074b-5339-468e-ab20-f15f936032e0	401cf631ba815a67eac7a1b79e5598934ad71573333b7f1e85d58c84e75754a6	2025-08-08 23:36:15.741028-04	20250805033440_add_meeting_audit_log	\N	\N	2025-08-08 23:36:15.738292-04	1
9f9e6e96-8e73-4089-87d2-e74196ce4fdf	834bf82ee67656564a97d9f6a1cd18c69512c366d9830ea317ce82c76f4cf57b	2025-08-08 23:36:15.742695-04	20250805173317_add_cjcp_somerset_hierarchy	\N	\N	2025-08-08 23:36:15.741289-04	1
2a423b12-91da-4183-89d5-ef53c29a180c	9c247958e447c3ae1ddcc60c21a99d68ccdbe90c7fdaaf1dcfecaf2d2a580458	2025-08-08 23:36:15.751552-04	20250808014102_add_meeting_intelligence_features	\N	\N	2025-08-08 23:36:15.743004-04	1
3c54617f-76cf-4088-b307-97dbde10a20f	64b3a6f278437e67bfc46e495f982253a176ec4cfe6ab809ea283a15e8e2e073	2025-08-08 23:36:21.818116-04	20250809033621_add_logging_system_tables	\N	\N	2025-08-08 23:36:21.808133-04	1
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
-- Data for Name: dev_logs; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.dev_logs (id, "timestamp", level, message, category, component, function, file, line, stack, environment, context, metadata, performance, user_id, staff_id, session_id, user_agent, ip, path, method, status_code, duration, created_at, updated_at) FROM stdin;
dev-test-1754711257094	2025-08-09 03:47:37.094	INFO	Direct database logging test	system	\N	\N	\N	\N	\N	development	{"test":true,"timestamp":"2025-08-09T03:47:37.094Z"}	{"testType":"direct_db","version":"1.0.0"}	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	2025-08-09 03:47:37.103	2025-08-09 03:47:37.103
\.


--
-- Data for Name: devices; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.devices (id, user_id, device_id, device_name, device_type, device_os, browser, ip_address, last_active, is_trusted, created_at) FROM stdin;
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
-- Data for Name: role_transitions; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.role_transitions (id, role_id, from_staff_id, to_staff_id, transition_date, pending_tasks, transferred_items, notes, created_by) FROM stdin;
\.


--
-- Data for Name: security_logs; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.security_logs (id, "timestamp", level, message, category, action, result, risk_level, actor, target, context, metadata, compliance, location, user_id, staff_id, user_agent, ip, path, method, created_at, updated_at) FROM stdin;
audit-test-1754711257140	2025-08-09 03:47:37.14	INFO	Direct security log test	user_action	test_audit_system	success	low	{"userId":"1","email":"test@example.com","role":"Administrator"}	\N	{"test":true,"ip":"127.0.0.1"}	\N	\N	\N	1	\N	\N	\N	\N	\N	2025-08-09 03:47:37.141	2025-08-09 03:47:37.141
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.users (id, email, name, staff_id, "hashedPassword", "emailVerified", image, is_admin, two_factor_enabled, two_factor_secret, backup_codes, login_notifications_enabled, suspicious_alerts_enabled, remember_devices_enabled, created_at, updated_at, theme_preference) FROM stdin;
1	user3@test.com	User 3	\N	$2b$10$ihOiaeK0B4UIZAtsuzsbHuYaJ2tiuJFjqJhcuxP4wOJT.f9uV01Tm	\N	\N	f	f	\N	{}	t	t	t	2025-08-09 03:36:16.568	2025-08-09 03:36:16.568	classic-light
2	user2@test.com	User 2	\N	$2b$10$ihOiaeK0B4UIZAtsuzsbHuYaJ2tiuJFjqJhcuxP4wOJT.f9uV01Tm	\N	\N	f	f	\N	{}	t	t	t	2025-08-09 03:36:16.568	2025-08-09 03:36:16.568	classic-light
3	user1@test.com	User 1	\N	$2b$10$ihOiaeK0B4UIZAtsuzsbHuYaJ2tiuJFjqJhcuxP4wOJT.f9uV01Tm	\N	\N	f	f	\N	{}	t	t	t	2025-08-09 03:36:16.568	2025-08-09 03:36:16.568	classic-light
51	admin@school.edu	System Administrator	\N	\N	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 03:57:31.924	2025-08-09 03:59:04.567	standard
4	manar@cjcollegeprep.org	Mr. Anar	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.323	2025-08-09 04:07:23.323	classic-light
5	namin@cjcollegeprep.org	Ms. Nima Amin	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.323	2025-08-09 04:07:23.323	classic-light
6	bgrossmann@cjcollegeprep.org	Ms. Grossmann	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.323	2025-08-09 04:07:23.323	classic-light
7	sba@cjcollegeprep.org	Ms. Daubon	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.323	2025-08-09 04:07:23.323	classic-light
8	dvesper@cjcollegeprep.org	Dr. Vesper	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.323	2025-08-09 04:07:23.323	classic-light
9	lmignogno@cjcollegeprep.org	Ms. Mignogno	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.323	2025-08-09 04:07:23.323	classic-light
10	cmathews@cjcollegeprep.org	Dr. Mathews	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.323	2025-08-09 04:07:23.323	classic-light
12	fbarker@cjcollegeprep.org	Ms. Brown	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.323	2025-08-09 04:07:23.323	classic-light
13	sysadmin@cjcollegeprep.org	System Administrator	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	t	f	\N	\N	t	t	t	2025-08-09 04:07:23.323	2025-08-09 04:07:23.323	classic-light
14	mfirsichbaum@cjcollegeprep.org	Ms. Firsichbaum	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.323	2025-08-09 04:07:23.323	classic-light
15	purchasing@cjcollegeprep.org	Ms. Ramos	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.323	2025-08-09 04:07:23.323	classic-light
16	hr@cjcollegeprep.org	Ms. Goldstein	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.323	2025-08-09 04:07:23.323	classic-light
18	vsuslu@cjcollegeprep.org	Mr. Bright	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.323	2025-08-09 04:07:23.323	classic-light
17	nsercan@cjcollegeprep.org	Dr. Namik Sercan	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	t	f	\N	\N	t	t	t	2025-08-09 04:07:23.323	2025-08-09 04:07:23.323	classic-light
19	tsalley@cjcollegeprep.org	Ms. Salley	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.323	2025-08-09 04:07:23.323	classic-light
11	skaeli@cjcollegeprep.org	Ms. Kaeli	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.323	2025-08-09 04:07:23.323	classic-light
21	jantonacci@cjcollegeprep.org	Ms. Antonacci	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.323	2025-08-09 04:07:23.323	classic-light
20	cthomas@cjcollegeprep.org	Ms. Thomas	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.323	2025-08-09 04:07:23.323	classic-light
22	dcua@cjcollegeprep.org	Mr. Daryl	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.324	2025-08-09 04:07:23.324	classic-light
23	abicer@cjcollegeprep.org	Mr. Ahmet	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.324	2025-08-09 04:07:23.324	classic-light
24	bagudelo@cjcollegeprep.org	Ms. Bibiana	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.324	2025-08-09 04:07:23.324	classic-light
25	stayfur@cjcollegeprep.org	Mr. Tayfur	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.324	2025-08-09 04:07:23.324	classic-light
26	myilmaz@cjcollegeprep.org	Mr. Mert	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.324	2025-08-09 04:07:23.324	classic-light
27	amygettelfinger@cjcollegeprep.org	Ms. Gettelfinger	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.324	2025-08-09 04:07:23.324	classic-light
28	accountspayable@cjcollegeprep.org	Ms. Mancuso	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.324	2025-08-09 04:07:23.324	classic-light
30	hrdept@cjcollegeprep.org	Ms. LaLindez	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.324	2025-08-09 04:07:23.324	classic-light
29	mgibbs@cjcollegeprep.org	Ms. Gibbs	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.324	2025-08-09 04:07:23.324	classic-light
31	skeskin@cjcollegeprep.org	Ms. Keskin	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.324	2025-08-09 04:07:23.324	classic-light
32	cpagliuca@cjcollegeprep.org	Ms. Pagliuca	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.324	2025-08-09 04:07:23.324	classic-light
33	akahraman@cjcollegeprep.org	Mr. Kahraman	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.324	2025-08-09 04:07:23.324	classic-light
34	cquerijero@cjcollegeprep.org	Ms. Querijero	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.324	2025-08-09 04:07:23.324	classic-light
36	palvarez@cjcollegeprep.org	Ms. Alvarez	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.324	2025-08-09 04:07:23.324	classic-light
37	ldobrin@cjcollegeprep.org	Ms. Dobrin	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.324	2025-08-09 04:07:23.324	classic-light
52	scerone@cjcollegeprep.org	Ms. Cerone	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.324	2025-08-09 04:07:23.324	classic-light
42	jtadros@cjcollegeprep.org	Ms. Tadros	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.324	2025-08-09 04:07:23.324	classic-light
41	djacobs@cjcollegeprep.org	Ms. Jacobs	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.324	2025-08-09 04:07:23.324	classic-light
46	pespinoza@cjcollegeprep.org	Ms. Espinoza	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.324	2025-08-09 04:07:23.324	classic-light
47	braybon@cjcollegeprep.org	Ms. Raybon	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.324	2025-08-09 04:07:23.324	classic-light
48	mmontgomery@cjcollegeprep.org	Ms. Montgomery	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.324	2025-08-09 04:07:23.324	classic-light
49	imlladenovic@cjcollegeprep.org	Ms. Mladenovic	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.324	2025-08-09 04:07:23.324	classic-light
43	kbarkohani@cjcollegeprep.org	Ms. Barkohani	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.324	2025-08-09 04:07:23.324	classic-light
38	ktemplasky@cjcollegeprep.org	Mr. Tempalsky	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.324	2025-08-09 04:07:23.324	classic-light
40	rorhan@cjcollegeprep.org	Ms. Orhan	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.324	2025-08-09 04:07:23.324	classic-light
50	ekeating@cjcollegeprep.org	Ms. Keating	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.324	2025-08-09 04:07:23.324	classic-light
45	kmercedes@cjcollegeprep.org	Ms. Mercedes	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.324	2025-08-09 04:07:23.324	classic-light
39	asimon@cjcollegeprep.org	Ms. Simon	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.324	2025-08-09 04:07:23.324	classic-light
44	ahauser@cjcollegeprep.org	Ms. Hauser	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.324	2025-08-09 04:07:23.324	classic-light
35	ninanir@cjcollegeprep.org	Ms. Neval	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.324	2025-08-09 04:07:23.324	classic-light
53	fbrown@cjcollegeprep.org	Ms. Brown	\N	$2b$12$NeuQQD6kTqiFiC0/91eQB.c4en0DJuVejGrMr7s/c.ttrVYlFilCe	\N	\N	f	f	\N	\N	t	t	t	2025-08-09 04:07:23.324	2025-08-09 04:07:23.324	classic-light
\.


--
-- Name: Department_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public."Department_id_seq"', 28, true);


--
-- Name: District_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public."District_id_seq"', 2, true);


--
-- Name: MeetingAttendee_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public."MeetingAttendee_id_seq"', 1, false);


--
-- Name: Meeting_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public."Meeting_id_seq"', 1, false);


--
-- Name: RoleHierarchy_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public."RoleHierarchy_id_seq"', 1, false);


--
-- Name: Role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public."Role_id_seq"', 37, true);


--
-- Name: School_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public."School_id_seq"', 3, true);


--
-- Name: Staff_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public."Staff_id_seq"', 3, true);


--
-- Name: agenda_item_attachments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.agenda_item_attachments_id_seq', 1, false);


--
-- Name: agenda_item_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.agenda_item_comments_id_seq', 1, false);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 16, true);


--
-- Name: critical_audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.critical_audit_logs_id_seq', 1, false);


--
-- Name: devices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.devices_id_seq', 1, false);


--
-- Name: meeting_action_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.meeting_action_items_id_seq', 1, false);


--
-- Name: meeting_agenda_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.meeting_agenda_items_id_seq', 1, false);


--
-- Name: meeting_audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.meeting_audit_logs_id_seq', 1, false);


--
-- Name: meeting_notes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.meeting_notes_id_seq', 1, false);


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
-- Name: role_transitions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.role_transitions_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.users_id_seq', 53, true);


--
-- Name: Account Account_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY (id);


--
-- Name: Department Department_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_pkey" PRIMARY KEY (id);


--
-- Name: District District_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."District"
    ADD CONSTRAINT "District_pkey" PRIMARY KEY (id);


--
-- Name: MeetingAttendee MeetingAttendee_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."MeetingAttendee"
    ADD CONSTRAINT "MeetingAttendee_pkey" PRIMARY KEY (id);


--
-- Name: Meeting Meeting_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Meeting"
    ADD CONSTRAINT "Meeting_pkey" PRIMARY KEY (id);


--
-- Name: RoleHierarchy RoleHierarchy_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."RoleHierarchy"
    ADD CONSTRAINT "RoleHierarchy_pkey" PRIMARY KEY (id);


--
-- Name: Role Role_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_pkey" PRIMARY KEY (id);


--
-- Name: School School_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."School"
    ADD CONSTRAINT "School_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: Staff Staff_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Staff"
    ADD CONSTRAINT "Staff_pkey" PRIMARY KEY (id);


--
-- Name: SystemSetting SystemSetting_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."SystemSetting"
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
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: Account_provider_providerAccountId_key; Type: INDEX; Schema: public; Owner: hs
--

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON public."Account" USING btree (provider, "providerAccountId");


--
-- Name: Department_code_key; Type: INDEX; Schema: public; Owner: hs
--

CREATE UNIQUE INDEX "Department_code_key" ON public."Department" USING btree (code);


--
-- Name: RoleHierarchy_parent_role_id_child_role_id_key; Type: INDEX; Schema: public; Owner: hs
--

CREATE UNIQUE INDEX "RoleHierarchy_parent_role_id_child_role_id_key" ON public."RoleHierarchy" USING btree (parent_role_id, child_role_id);


--
-- Name: Role_title_key; Type: INDEX; Schema: public; Owner: hs
--

CREATE UNIQUE INDEX "Role_title_key" ON public."Role" USING btree (title);


--
-- Name: Session_sessionToken_key; Type: INDEX; Schema: public; Owner: hs
--

CREATE UNIQUE INDEX "Session_sessionToken_key" ON public."Session" USING btree ("sessionToken");


--
-- Name: VerificationToken_identifier_token_key; Type: INDEX; Schema: public; Owner: hs
--

CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON public."VerificationToken" USING btree (identifier, token);


--
-- Name: VerificationToken_token_key; Type: INDEX; Schema: public; Owner: hs
--

CREATE UNIQUE INDEX "VerificationToken_token_key" ON public."VerificationToken" USING btree (token);


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
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: hs
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_staff_id_key; Type: INDEX; Schema: public; Owner: hs
--

CREATE UNIQUE INDEX users_staff_id_key ON public.users USING btree (staff_id);


--
-- Name: Account Account_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Department Department_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Department Department_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MeetingAttendee MeetingAttendee_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."MeetingAttendee"
    ADD CONSTRAINT "MeetingAttendee_meeting_id_fkey" FOREIGN KEY (meeting_id) REFERENCES public."Meeting"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MeetingAttendee MeetingAttendee_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."MeetingAttendee"
    ADD CONSTRAINT "MeetingAttendee_staff_id_fkey" FOREIGN KEY (staff_id) REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Meeting Meeting_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Meeting"
    ADD CONSTRAINT "Meeting_department_id_fkey" FOREIGN KEY (department_id) REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Meeting Meeting_district_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Meeting"
    ADD CONSTRAINT "Meeting_district_id_fkey" FOREIGN KEY (district_id) REFERENCES public."District"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Meeting Meeting_organizer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Meeting"
    ADD CONSTRAINT "Meeting_organizer_id_fkey" FOREIGN KEY (organizer_id) REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Meeting Meeting_parent_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Meeting"
    ADD CONSTRAINT "Meeting_parent_meeting_id_fkey" FOREIGN KEY (parent_meeting_id) REFERENCES public."Meeting"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Meeting Meeting_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Meeting"
    ADD CONSTRAINT "Meeting_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Meeting Meeting_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Meeting"
    ADD CONSTRAINT "Meeting_template_id_fkey" FOREIGN KEY (template_id) REFERENCES public.meeting_templates(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: RoleHierarchy RoleHierarchy_child_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."RoleHierarchy"
    ADD CONSTRAINT "RoleHierarchy_child_role_id_fkey" FOREIGN KEY (child_role_id) REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RoleHierarchy RoleHierarchy_parent_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."RoleHierarchy"
    ADD CONSTRAINT "RoleHierarchy_parent_role_id_fkey" FOREIGN KEY (parent_role_id) REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Role Role_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_department_id_fkey" FOREIGN KEY (department_id) REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Role Role_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: School School_district_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."School"
    ADD CONSTRAINT "School_district_id_fkey" FOREIGN KEY (district_id) REFERENCES public."District"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Staff Staff_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Staff"
    ADD CONSTRAINT "Staff_department_id_fkey" FOREIGN KEY (department_id) REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Staff Staff_district_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Staff"
    ADD CONSTRAINT "Staff_district_id_fkey" FOREIGN KEY (district_id) REFERENCES public."District"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Staff Staff_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Staff"
    ADD CONSTRAINT "Staff_manager_id_fkey" FOREIGN KEY (manager_id) REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Staff Staff_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Staff"
    ADD CONSTRAINT "Staff_role_id_fkey" FOREIGN KEY (role_id) REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Staff Staff_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Staff"
    ADD CONSTRAINT "Staff_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Staff Staff_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Staff"
    ADD CONSTRAINT "Staff_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: agenda_item_attachments agenda_item_attachments_agenda_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.agenda_item_attachments
    ADD CONSTRAINT agenda_item_attachments_agenda_item_id_fkey FOREIGN KEY (agenda_item_id) REFERENCES public.meeting_agenda_items(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: agenda_item_attachments agenda_item_attachments_uploaded_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.agenda_item_attachments
    ADD CONSTRAINT agenda_item_attachments_uploaded_by_id_fkey FOREIGN KEY (uploaded_by_id) REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: agenda_item_comments agenda_item_comments_agenda_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.agenda_item_comments
    ADD CONSTRAINT agenda_item_comments_agenda_item_id_fkey FOREIGN KEY (agenda_item_id) REFERENCES public.meeting_agenda_items(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: agenda_item_comments agenda_item_comments_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.agenda_item_comments
    ADD CONSTRAINT agenda_item_comments_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: audit_logs audit_logs_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: critical_audit_logs critical_audit_logs_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.critical_audit_logs
    ADD CONSTRAINT critical_audit_logs_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: critical_audit_logs critical_audit_logs_target_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.critical_audit_logs
    ADD CONSTRAINT critical_audit_logs_target_staff_id_fkey FOREIGN KEY (target_staff_id) REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE SET NULL;


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
    ADD CONSTRAINT dev_logs_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE SET NULL;


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
    ADD CONSTRAINT meeting_action_items_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: meeting_action_items meeting_action_items_assigned_to_role_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_action_items
    ADD CONSTRAINT meeting_action_items_assigned_to_role_fkey FOREIGN KEY (assigned_to_role) REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: meeting_action_items meeting_action_items_completed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_action_items
    ADD CONSTRAINT meeting_action_items_completed_by_fkey FOREIGN KEY (completed_by) REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: meeting_action_items meeting_action_items_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_action_items
    ADD CONSTRAINT meeting_action_items_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public."Meeting"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: meeting_action_items meeting_action_items_parent_action_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_action_items
    ADD CONSTRAINT meeting_action_items_parent_action_id_fkey FOREIGN KEY (parent_action_id) REFERENCES public.meeting_action_items(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: meeting_agenda_items meeting_agenda_items_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_agenda_items
    ADD CONSTRAINT meeting_agenda_items_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public."Meeting"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: meeting_agenda_items meeting_agenda_items_parent_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_agenda_items
    ADD CONSTRAINT meeting_agenda_items_parent_item_id_fkey FOREIGN KEY (parent_item_id) REFERENCES public.meeting_agenda_items(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: meeting_agenda_items meeting_agenda_items_responsible_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_agenda_items
    ADD CONSTRAINT meeting_agenda_items_responsible_role_id_fkey FOREIGN KEY (responsible_role_id) REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: meeting_agenda_items meeting_agenda_items_responsible_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_agenda_items
    ADD CONSTRAINT meeting_agenda_items_responsible_staff_id_fkey FOREIGN KEY (responsible_staff_id) REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: meeting_audit_logs meeting_audit_logs_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_audit_logs
    ADD CONSTRAINT meeting_audit_logs_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public."Meeting"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: meeting_audit_logs meeting_audit_logs_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_audit_logs
    ADD CONSTRAINT meeting_audit_logs_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: meeting_audit_logs meeting_audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_audit_logs
    ADD CONSTRAINT meeting_audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: meeting_notes meeting_notes_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_notes
    ADD CONSTRAINT meeting_notes_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public."Meeting"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: meeting_notes meeting_notes_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_notes
    ADD CONSTRAINT meeting_notes_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: meeting_search meeting_search_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_search
    ADD CONSTRAINT meeting_search_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public."Meeting"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: meeting_templates meeting_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_templates
    ADD CONSTRAINT meeting_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: meeting_transcripts meeting_transcripts_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_transcripts
    ADD CONSTRAINT meeting_transcripts_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public."Meeting"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role_transitions role_transitions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.role_transitions
    ADD CONSTRAINT role_transitions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: role_transitions role_transitions_from_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.role_transitions
    ADD CONSTRAINT role_transitions_from_staff_id_fkey FOREIGN KEY (from_staff_id) REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: role_transitions role_transitions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.role_transitions
    ADD CONSTRAINT role_transitions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: role_transitions role_transitions_to_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.role_transitions
    ADD CONSTRAINT role_transitions_to_staff_id_fkey FOREIGN KEY (to_staff_id) REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: security_logs security_logs_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.security_logs
    ADD CONSTRAINT security_logs_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: security_logs security_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.security_logs
    ADD CONSTRAINT security_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

