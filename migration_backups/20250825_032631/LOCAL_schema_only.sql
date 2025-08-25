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

