--
-- PostgreSQL database dump
--

-- Dumped from database version 14.15 (Homebrew)
-- Dumped by pg_dump version 14.15 (Homebrew)

-- Started on 2025-08-09 21:18:32 EDT

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
-- TOC entry 892 (class 1247 OID 103396)
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
-- TOC entry 889 (class 1247 OID 103382)
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
-- TOC entry 874 (class 1247 OID 103337)
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
-- TOC entry 901 (class 1247 OID 103446)
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
-- TOC entry 904 (class 1247 OID 103468)
-- Name: AuditLogResult; Type: TYPE; Schema: public; Owner: hs
--

CREATE TYPE public."AuditLogResult" AS ENUM (
    'success',
    'failure',
    'blocked'
);


ALTER TYPE public."AuditLogResult" OWNER TO hs;

--
-- TOC entry 886 (class 1247 OID 103374)
-- Name: DecisionType; Type: TYPE; Schema: public; Owner: hs
--

CREATE TYPE public."DecisionType" AS ENUM (
    'Technical',
    'Adaptive',
    'Both'
);


ALTER TYPE public."DecisionType" OWNER TO hs;

--
-- TOC entry 898 (class 1247 OID 103424)
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
-- TOC entry 895 (class 1247 OID 103410)
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
-- TOC entry 877 (class 1247 OID 103348)
-- Name: Priority; Type: TYPE; Schema: public; Owner: hs
--

CREATE TYPE public."Priority" AS ENUM (
    'Low',
    'Medium',
    'High'
);


ALTER TYPE public."Priority" OWNER TO hs;

--
-- TOC entry 880 (class 1247 OID 103356)
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
-- TOC entry 907 (class 1247 OID 103476)
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
-- TOC entry 883 (class 1247 OID 103366)
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
-- TOC entry 209 (class 1259 OID 103485)
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
-- TOC entry 215 (class 1259 OID 103513)
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
-- TOC entry 214 (class 1259 OID 103512)
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
-- TOC entry 4155 (class 0 OID 0)
-- Dependencies: 214
-- Name: Department_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public."Department_id_seq" OWNED BY public."Department".id;


--
-- TOC entry 211 (class 1259 OID 103493)
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
-- TOC entry 210 (class 1259 OID 103492)
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
-- TOC entry 4156 (class 0 OID 0)
-- Dependencies: 210
-- Name: District_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public."District_id_seq" OWNED BY public."District".id;


--
-- TOC entry 227 (class 1259 OID 103588)
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
-- TOC entry 229 (class 1259 OID 103603)
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
-- TOC entry 228 (class 1259 OID 103602)
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
-- TOC entry 4157 (class 0 OID 0)
-- Dependencies: 228
-- Name: MeetingAttendee_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public."MeetingAttendee_id_seq" OWNED BY public."MeetingAttendee".id;


--
-- TOC entry 226 (class 1259 OID 103587)
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
-- TOC entry 4158 (class 0 OID 0)
-- Dependencies: 226
-- Name: Meeting_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public."Meeting_id_seq" OWNED BY public."Meeting".id;


--
-- TOC entry 221 (class 1259 OID 103548)
-- Name: Permission; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public."Permission" (
    id integer NOT NULL,
    role_id integer NOT NULL,
    capability text NOT NULL,
    resource text,
    action text,
    conditions jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Permission" OWNER TO hs;

--
-- TOC entry 220 (class 1259 OID 103547)
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
-- TOC entry 4159 (class 0 OID 0)
-- Dependencies: 220
-- Name: Permission_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public."Permission_id_seq" OWNED BY public."Permission".id;


--
-- TOC entry 217 (class 1259 OID 103524)
-- Name: Role; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public."Role" (
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


ALTER TABLE public."Role" OWNER TO hs;

--
-- TOC entry 219 (class 1259 OID 103539)
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
-- TOC entry 218 (class 1259 OID 103538)
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
-- TOC entry 4160 (class 0 OID 0)
-- Dependencies: 218
-- Name: RoleHierarchy_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public."RoleHierarchy_id_seq" OWNED BY public."RoleHierarchy".id;


--
-- TOC entry 216 (class 1259 OID 103523)
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
-- TOC entry 4161 (class 0 OID 0)
-- Dependencies: 216
-- Name: Role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public."Role_id_seq" OWNED BY public."Role".id;


--
-- TOC entry 213 (class 1259 OID 103503)
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
-- TOC entry 212 (class 1259 OID 103502)
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
-- TOC entry 4162 (class 0 OID 0)
-- Dependencies: 212
-- Name: School_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public."School_id_seq" OWNED BY public."School".id;


--
-- TOC entry 236 (class 1259 OID 103644)
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
-- TOC entry 225 (class 1259 OID 103577)
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
-- TOC entry 224 (class 1259 OID 103576)
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
-- TOC entry 4163 (class 0 OID 0)
-- Dependencies: 224
-- Name: Staff_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public."Staff_id_seq" OWNED BY public."Staff".id;


--
-- TOC entry 237 (class 1259 OID 103651)
-- Name: SystemSetting; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public."SystemSetting" (
    key text NOT NULL,
    value jsonb NOT NULL
);


ALTER TABLE public."SystemSetting" OWNER TO hs;

--
-- TOC entry 240 (class 1259 OID 103670)
-- Name: VerificationToken; Type: TABLE; Schema: public; Owner: hs
--

CREATE TABLE public."VerificationToken" (
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."VerificationToken" OWNER TO hs;

--
-- TOC entry 261 (class 1259 OID 104984)
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
-- TOC entry 246 (class 1259 OID 103704)
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
-- TOC entry 245 (class 1259 OID 103703)
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
-- TOC entry 4164 (class 0 OID 0)
-- Dependencies: 245
-- Name: agenda_item_attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public.agenda_item_attachments_id_seq OWNED BY public.agenda_item_attachments.id;


--
-- TOC entry 248 (class 1259 OID 103714)
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
-- TOC entry 247 (class 1259 OID 103713)
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
-- TOC entry 4165 (class 0 OID 0)
-- Dependencies: 247
-- Name: agenda_item_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public.agenda_item_comments_id_seq OWNED BY public.agenda_item_comments.id;


--
-- TOC entry 235 (class 1259 OID 103635)
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
-- TOC entry 234 (class 1259 OID 103634)
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
-- TOC entry 4166 (class 0 OID 0)
-- Dependencies: 234
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- TOC entry 233 (class 1259 OID 103623)
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
-- TOC entry 232 (class 1259 OID 103622)
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
-- TOC entry 4167 (class 0 OID 0)
-- Dependencies: 232
-- Name: critical_audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public.critical_audit_logs_id_seq OWNED BY public.critical_audit_logs.id;


--
-- TOC entry 259 (class 1259 OID 103776)
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
-- TOC entry 242 (class 1259 OID 103676)
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
-- TOC entry 241 (class 1259 OID 103675)
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
-- TOC entry 4168 (class 0 OID 0)
-- Dependencies: 241
-- Name: devices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public.devices_id_seq OWNED BY public.devices.id;


--
-- TOC entry 252 (class 1259 OID 103734)
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
-- TOC entry 251 (class 1259 OID 103733)
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
-- TOC entry 4169 (class 0 OID 0)
-- Dependencies: 251
-- Name: meeting_action_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public.meeting_action_items_id_seq OWNED BY public.meeting_action_items.id;


--
-- TOC entry 244 (class 1259 OID 103688)
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
-- TOC entry 243 (class 1259 OID 103687)
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
-- TOC entry 4170 (class 0 OID 0)
-- Dependencies: 243
-- Name: meeting_agenda_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public.meeting_agenda_items_id_seq OWNED BY public.meeting_agenda_items.id;


--
-- TOC entry 250 (class 1259 OID 103724)
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
-- TOC entry 249 (class 1259 OID 103723)
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
-- TOC entry 4171 (class 0 OID 0)
-- Dependencies: 249
-- Name: meeting_audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public.meeting_audit_logs_id_seq OWNED BY public.meeting_audit_logs.id;


--
-- TOC entry 231 (class 1259 OID 103613)
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
-- TOC entry 230 (class 1259 OID 103612)
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
-- TOC entry 4172 (class 0 OID 0)
-- Dependencies: 230
-- Name: meeting_notes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public.meeting_notes_id_seq OWNED BY public.meeting_notes.id;


--
-- TOC entry 256 (class 1259 OID 103757)
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
-- TOC entry 255 (class 1259 OID 103756)
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
-- TOC entry 4173 (class 0 OID 0)
-- Dependencies: 255
-- Name: meeting_search_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public.meeting_search_id_seq OWNED BY public.meeting_search.id;


--
-- TOC entry 239 (class 1259 OID 103659)
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
-- TOC entry 238 (class 1259 OID 103658)
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
-- TOC entry 4174 (class 0 OID 0)
-- Dependencies: 238
-- Name: meeting_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public.meeting_templates_id_seq OWNED BY public.meeting_templates.id;


--
-- TOC entry 254 (class 1259 OID 103747)
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
-- TOC entry 253 (class 1259 OID 103746)
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
-- TOC entry 4175 (class 0 OID 0)
-- Dependencies: 253
-- Name: meeting_transcripts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public.meeting_transcripts_id_seq OWNED BY public.meeting_transcripts.id;


--
-- TOC entry 258 (class 1259 OID 103767)
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
-- TOC entry 257 (class 1259 OID 103766)
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
-- TOC entry 4176 (class 0 OID 0)
-- Dependencies: 257
-- Name: role_transitions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public.role_transitions_id_seq OWNED BY public.role_transitions.id;


--
-- TOC entry 260 (class 1259 OID 103785)
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
-- TOC entry 223 (class 1259 OID 103558)
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
-- TOC entry 222 (class 1259 OID 103557)
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
-- TOC entry 4177 (class 0 OID 0)
-- Dependencies: 222
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hs
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 3696 (class 2604 OID 105015)
-- Name: Department id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Department" ALTER COLUMN id SET DEFAULT nextval('public."Department_id_seq"'::regclass);


--
-- TOC entry 3691 (class 2604 OID 105016)
-- Name: District id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."District" ALTER COLUMN id SET DEFAULT nextval('public."District_id_seq"'::regclass);


--
-- TOC entry 3727 (class 2604 OID 105017)
-- Name: Meeting id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Meeting" ALTER COLUMN id SET DEFAULT nextval('public."Meeting_id_seq"'::regclass);


--
-- TOC entry 3730 (class 2604 OID 105018)
-- Name: MeetingAttendee id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."MeetingAttendee" ALTER COLUMN id SET DEFAULT nextval('public."MeetingAttendee_id_seq"'::regclass);


--
-- TOC entry 3707 (class 2604 OID 103551)
-- Name: Permission id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Permission" ALTER COLUMN id SET DEFAULT nextval('public."Permission_id_seq"'::regclass);


--
-- TOC entry 3703 (class 2604 OID 105019)
-- Name: Role id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Role" ALTER COLUMN id SET DEFAULT nextval('public."Role_id_seq"'::regclass);


--
-- TOC entry 3706 (class 2604 OID 105020)
-- Name: RoleHierarchy id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."RoleHierarchy" ALTER COLUMN id SET DEFAULT nextval('public."RoleHierarchy_id_seq"'::regclass);


--
-- TOC entry 3693 (class 2604 OID 105021)
-- Name: School id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."School" ALTER COLUMN id SET DEFAULT nextval('public."School_id_seq"'::regclass);


--
-- TOC entry 3722 (class 2604 OID 105022)
-- Name: Staff id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Staff" ALTER COLUMN id SET DEFAULT nextval('public."Staff_id_seq"'::regclass);


--
-- TOC entry 3756 (class 2604 OID 105023)
-- Name: agenda_item_attachments id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.agenda_item_attachments ALTER COLUMN id SET DEFAULT nextval('public.agenda_item_attachments_id_seq'::regclass);


--
-- TOC entry 3758 (class 2604 OID 105024)
-- Name: agenda_item_comments id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.agenda_item_comments ALTER COLUMN id SET DEFAULT nextval('public.agenda_item_comments_id_seq'::regclass);


--
-- TOC entry 3738 (class 2604 OID 105025)
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- TOC entry 3734 (class 2604 OID 105026)
-- Name: critical_audit_logs id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.critical_audit_logs ALTER COLUMN id SET DEFAULT nextval('public.critical_audit_logs_id_seq'::regclass);


--
-- TOC entry 3744 (class 2604 OID 105027)
-- Name: devices id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.devices ALTER COLUMN id SET DEFAULT nextval('public.devices_id_seq'::regclass);


--
-- TOC entry 3762 (class 2604 OID 105028)
-- Name: meeting_action_items id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_action_items ALTER COLUMN id SET DEFAULT nextval('public.meeting_action_items_id_seq'::regclass);


--
-- TOC entry 3748 (class 2604 OID 105029)
-- Name: meeting_agenda_items id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_agenda_items ALTER COLUMN id SET DEFAULT nextval('public.meeting_agenda_items_id_seq'::regclass);


--
-- TOC entry 3760 (class 2604 OID 105030)
-- Name: meeting_audit_logs id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_audit_logs ALTER COLUMN id SET DEFAULT nextval('public.meeting_audit_logs_id_seq'::regclass);


--
-- TOC entry 3733 (class 2604 OID 105031)
-- Name: meeting_notes id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_notes ALTER COLUMN id SET DEFAULT nextval('public.meeting_notes_id_seq'::regclass);


--
-- TOC entry 3769 (class 2604 OID 105032)
-- Name: meeting_search id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_search ALTER COLUMN id SET DEFAULT nextval('public.meeting_search_id_seq'::regclass);


--
-- TOC entry 3743 (class 2604 OID 105033)
-- Name: meeting_templates id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_templates ALTER COLUMN id SET DEFAULT nextval('public.meeting_templates_id_seq'::regclass);


--
-- TOC entry 3767 (class 2604 OID 105034)
-- Name: meeting_transcripts id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_transcripts ALTER COLUMN id SET DEFAULT nextval('public.meeting_transcripts_id_seq'::regclass);


--
-- TOC entry 3771 (class 2604 OID 105035)
-- Name: role_transitions id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.role_transitions ALTER COLUMN id SET DEFAULT nextval('public.role_transitions_id_seq'::regclass);


--
-- TOC entry 3719 (class 2604 OID 105036)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4097 (class 0 OID 103485)
-- Dependencies: 209
-- Data for Name: Account; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public."Account" (id, type, provider, "providerAccountId", refresh_token, access_token, expires_at, token_type, scope, id_token, session_state, "userId") FROM stdin;
\.


--
-- TOC entry 4103 (class 0 OID 103513)
-- Dependencies: 215
-- Data for Name: Department; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public."Department" (id, code, name, category, school_id, created_at, level, parent_id) FROM stdin;
2	SYS	System Management	Administration	2	2025-08-09 05:15:58.924	0	\N
3	SUPPORT	Student Support	Student Services	2	2025-08-09 05:15:58.925	2	\N
4	PURCHASE	Purchasing	Finance	2	2025-08-09 05:15:58.925	3	\N
5	GRANTS	Grants & Funding	Finance	2	2025-08-09 05:15:58.925	3	\N
6	AP	Accounts Payable	Finance	2	2025-08-09 05:15:58.925	3	\N
7	DATA	Data Management	Administration	2	2025-08-09 05:15:58.925	3	\N
8	ELEM	Elementary Education	Academic	2	2025-08-09 05:15:58.925	3	\N
9	HR	Human Resources	Administration	2	2025-08-09 05:15:58.925	3	\N
10	HEALTH	Health Services	Student Services	2	2025-08-09 05:15:58.925	3	\N
11	IT	Information Technology	Administration	2	2025-08-09 05:15:58.925	3	\N
12	EXEC	Executive Leadership	Administration	2	2025-08-09 05:15:58.924	1	\N
13	ADMIN_SUPPORT	Administrative Support	Administration	2	2025-08-09 05:15:58.924	3	\N
14	OPS	Operations	Administration	2	2025-08-09 05:15:58.924	2	\N
15	EXEC_SUPPORT	Executive Support	Administration	2	2025-08-09 05:15:58.924	3	\N
16	US_STEM	Upper School STEM	Academic	2	2025-08-09 05:15:58.924	3	\N
17	HUM	Humanities	Academic	2	2025-08-09 05:15:58.924	2	\N
18	ASSESS	Assessment & Accountability	Academic	2	2025-08-09 05:15:58.925	2	\N
19	SPED	Special Education	Student Services	2	2025-08-09 05:15:58.924	2	\N
20	BUS	Business & Finance	Administration	2	2025-08-09 05:15:58.924	2	\N
21	ELECTIVES	Electives & Arts	Academic	2	2025-08-09 05:15:58.925	3	\N
22	CURR	Curriculum Development	Academic	2	2025-08-09 05:15:58.925	2	\N
23	ELEM_COACH	Elementary Coaching	Academic	2	2025-08-09 05:15:58.924	3	\N
24	US_HUM	Upper School Humanities	Academic	2	2025-08-09 05:15:58.925	3	\N
25	ATTENDANCE	Attendance Services	Administration	2	2025-08-09 05:15:58.924	3	\N
26	SEC	Security & Safety	Administration	2	2025-08-09 05:15:58.924	3	\N
27	STEM	STEM	Academic	2	2025-08-09 05:15:58.924	2	\N
30	DO	District Office	\N	2	2025-08-09 06:28:56.943	0	\N
\.


--
-- TOC entry 4099 (class 0 OID 103493)
-- Dependencies: 211
-- Data for Name: District; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public."District" (name, address, code, created_at, id) FROM stdin;
CJCP Somerset	Somerset, NJ	CJCPS	2025-08-09 05:15:58.917	2
\.


--
-- TOC entry 4115 (class 0 OID 103588)
-- Dependencies: 227
-- Data for Name: Meeting; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public."Meeting" (title, description, created_at, department_id, district_id, end_time, organizer_id, school_id, start_time, zoom_join_url, zoom_meeting_id, id, action_items, agenda, calendar_integration, decisions, is_continuation, meeting_type, notes, parent_meeting_id, repeat_type, status, template_id, is_series_master, repeat_end_date, repeat_end_type, repeat_exceptions, repeat_interval, repeat_month_day, repeat_month_week, repeat_month_weekday, repeat_occurrences, repeat_pattern, repeat_weekdays, series_id, series_position) FROM stdin;
Deneme	Deneme meeting'i	2025-08-09 06:14:50.262	12	2	2025-08-09 13:30:00	54	2	2025-08-09 13:00:00	\N	\N	1	\N	\N	\N	\N	f	regular	\N	\N	\N	scheduled	\N	t	\N	\N	{}	\N	\N	\N	\N	\N	\N	{}	\N	1
\.


--
-- TOC entry 4117 (class 0 OID 103603)
-- Dependencies: 229
-- Data for Name: MeetingAttendee; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public."MeetingAttendee" (status, created_at, meeting_id, staff_id, id) FROM stdin;
pending	2025-08-09 06:14:50.262	1	27	1
pending	2025-08-09 06:14:50.262	1	4	2
pending	2025-08-09 06:14:50.262	1	26	3
pending	2025-08-09 06:14:50.262	1	29	4
pending	2025-08-09 06:14:50.262	1	7	5
\.


--
-- TOC entry 4109 (class 0 OID 103548)
-- Dependencies: 221
-- Data for Name: Permission; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public."Permission" (id, role_id, capability, resource, action, conditions, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4105 (class 0 OID 103524)
-- Dependencies: 217
-- Data for Name: Role; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public."Role" (id, title, key, priority, category, department_id, created_at, is_leadership, level, parent_id, extension, is_coordinator, is_supervisor, room) FROM stdin;
10	Business Specialist (Grants)	\N	3	\N	5	2025-08-09 05:15:58.955	f	3	\N	1503	f	f	3rd Floor
12	Director of Accountability	\N	2	\N	18	2025-08-09 05:15:58.955	t	2	\N	1696	f	t	130
3	Chief Education Officer	\N	1	\N	12	2025-08-09 05:15:58.955	t	1	\N	1001	f	t	501
17	Accounts Payable Specialist	\N	3	\N	6	2025-08-09 05:15:58.955	f	3	\N	1502	f	f	3rd Floor
16	Elementary Coach	\N	3	\N	23	2025-08-09 05:15:58.955	t	3	\N	1131	f	t	131
15	Director of Student Support Services	\N	2	\N	3	2025-08-09 05:15:58.955	t	2	\N	1105	f	t	105
5	US Supervisor - STEM	\N	3	\N	16	2025-08-09 05:15:58.955	t	3	\N	1126	f	t	126
6	Director of Operations	\N	2	\N	14	2025-08-09 05:15:58.955	t	2	\N	1125	f	t	125
13	US Supervisor - Electives	\N	3	\N	21	2025-08-09 05:15:58.955	t	3	\N	\N	f	t	\N
8	Director of Special Education	\N	2	\N	19	2025-08-09 05:15:58.955	t	2	\N	1695	f	t	130
4	System Administrator	\N	0	\N	2	2025-08-09 05:15:58.955	t	0	\N	9999	f	t	Server Room
7	Business Administrator	\N	2	\N	20	2025-08-09 05:15:58.955	t	2	\N	\N	f	t	\N
9	Elementary Supervisor	\N	3	\N	8	2025-08-09 05:15:58.955	t	3	\N	1122	f	t	122
11	Purchasing Specialist	\N	3	\N	4	2025-08-09 05:15:58.955	f	3	\N	1501	f	f	3rd Floor
14	School Secretary	\N	3	\N	13	2025-08-09 05:15:58.955	f	3	\N	1100	f	f	Main Office
2	Supervisors - Curriculum/Professional Development	\N	2	\N	22	2025-08-09 05:15:58.955	t	2	\N	1127	f	t	127
19	Assistant Director of Student Support Services	\N	2	\N	3	2025-08-09 05:15:58.956	t	2	\N	1201	f	t	201
20	Registrar & Data Management Specialist	\N	3	\N	7	2025-08-09 05:15:58.956	f	3	\N	1506	f	f	3rd Floor
18	Assistant Business Administrator	\N	2	\N	20	2025-08-09 05:15:58.955	t	2	\N	1509	f	t	3rd Floor
21	HR Payroll & Benefits Specialist	\N	3	\N	9	2025-08-09 05:15:58.956	f	3	\N	1504	f	f	3rd Floor
22	School Nurse	\N	3	\N	10	2025-08-09 05:15:58.956	f	3	\N	1694	f	f	630
23	HR Specialist	\N	3	\N	9	2025-08-09 05:15:58.956	f	3	\N	1507	f	f	3rd Floor
24	IT Manager	\N	3	\N	11	2025-08-09 05:15:58.956	t	3	\N	1650	f	t	600 hw
25	Head of Security	\N	3	\N	26	2025-08-09 05:15:58.956	t	3	\N	1101	f	t	101
26	US Supervisor - Humanities	\N	3	\N	24	2025-08-09 05:15:58.956	t	3	\N	\N	f	t	\N
27	Social Worker	\N	4	\N	3	2025-08-09 05:15:58.956	f	4	\N	1104	f	f	104
28	School Counselor	\N	4	\N	3	2025-08-09 05:15:58.956	f	4	\N	1103	f	f	104
29	IT Specialist	\N	3	\N	11	2025-08-09 05:15:58.956	f	3	\N	1652	f	f	200 hw
30	Academic Counselor	\N	4	\N	3	2025-08-09 05:15:58.956	f	4	\N	1697	f	f	634
31	School Psychologist	\N	4	\N	3	2025-08-09 05:15:58.956	f	4	\N	1704	f	f	123
33	Chronic Absenteeism Specialist	\N	3	\N	25	2025-08-09 05:15:58.956	f	3	\N	1702	f	f	Main Office
34	Behavioral Specialist	\N	4	\N	3	2025-08-09 05:15:58.956	f	4	\N	1701	f	f	TBD
35	Teacher	\N	4	\N	17	2025-08-09 05:15:58.956	f	4	\N	\N	f	f	\N
32	Director of Curriculum - STEM	\N	2	\N	27	2025-08-09 05:15:58.956	t	2	\N	1126	f	t	126
36	Executive Administrative Assistant	\N	3	\N	15	2025-08-09 05:15:58.956	f	3	\N	1508	f	f	3rd Floor
37	Director of Curriculum - Humanities	\N	2	\N	17	2025-08-09 05:15:58.956	t	2	\N	1124	f	t	124
38	Administrator	\N	0	executive	\N	2025-08-09 05:23:36.406	t	0	\N	\N	f	f	\N
\.


--
-- TOC entry 4107 (class 0 OID 103539)
-- Dependencies: 219
-- Data for Name: RoleHierarchy; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public."RoleHierarchy" (id, parent_role_id, child_role_id, hierarchy_level, created_at) FROM stdin;
1	4	3	1	2025-08-10 01:16:32.198
2	3	18	1	2025-08-10 01:16:32.206
3	3	12	1	2025-08-10 01:16:32.207
4	3	15	1	2025-08-10 01:16:32.208
5	3	6	1	2025-08-10 01:16:32.208
6	3	8	1	2025-08-10 01:16:32.209
7	3	7	1	2025-08-10 01:16:32.21
8	3	2	1	2025-08-10 01:16:32.21
9	3	19	1	2025-08-10 01:16:32.211
10	3	32	1	2025-08-10 01:16:32.211
11	3	37	1	2025-08-10 01:16:32.211
\.


--
-- TOC entry 4101 (class 0 OID 103503)
-- Dependencies: 213
-- Data for Name: School; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public."School" (name, address, code, created_at, district_id, id) FROM stdin;
CJCP Somerset Campus	Somerset, NJ	CJCPS-SOM	2025-08-09 05:15:58.922	2	2
\.


--
-- TOC entry 4124 (class 0 OID 103644)
-- Dependencies: 236
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public."Session" (id, "sessionToken", expires, "userId") FROM stdin;
\.


--
-- TOC entry 4113 (class 0 OID 103577)
-- Dependencies: 225
-- Data for Name: Staff; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public."Staff" (id, user_id, department_id, role_id, manager_id, flags, endorsements, school_id, district_id, created_at, extension, hire_date, is_active, room) FROM stdin;
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
16	40	5	10	\N	{active}	{}	2	2	2025-08-09 05:15:59.246	1503	\N	t	3rd Floor
17	18	9	21	\N	{active}	{}	2	2	2025-08-09 05:15:59.246	1504	\N	t	3rd Floor
18	11	17	37	\N	{active}	{}	2	2	2025-08-09 05:15:59.246	1124	\N	t	124
19	23	10	22	\N	{active}	{}	2	2	2025-08-09 05:15:59.246	1694	\N	t	630
20	14	8	9	\N	{active}	{}	2	2	2025-08-09 05:15:59.245	1122	\N	t	122
21	9	23	16	\N	{active}	{}	2	2	2025-08-09 05:15:59.246	1131	\N	t	131
22	30	21	13	\N	{active}	{}	2	2	2025-08-09 05:15:59.246	\N	\N	t	\N
23	21	11	29	\N	{active}	{}	2	2	2025-08-09 05:15:59.246	1652	\N	t	200 hw
24	26	11	29	\N	{active}	{}	2	2	2025-08-09 05:15:59.246	1652	\N	t	200 hw
25	37	26	25	\N	{active}	{}	2	2	2025-08-09 05:15:59.246	1101	\N	t	101
15	51	9	23	\N	{active}	{}	2	2	2025-08-09 05:15:59.246	1507	\N	t	3rd Floor
26	49	19	8	\N	{active}	{}	2	2	2025-08-09 05:15:59.246	1695	\N	t	130
27	15	24	26	\N	{active}	{}	2	2	2025-08-09 05:15:59.246	\N	\N	t	\N
28	10	13	14	\N	{active}	{}	2	2	2025-08-09 05:15:59.246	1100	\N	t	Main Office
29	27	11	29	\N	{active}	{}	2	2	2025-08-09 05:15:59.246	1652	\N	t	200 hw
30	33	3	30	\N	{active}	{}	2	2	2025-08-09 05:15:59.246	1697	\N	t	634
31	25	13	14	\N	{active}	{}	2	2	2025-08-09 05:15:59.246	1100	\N	t	Main Office
32	44	3	30	\N	{active}	{}	2	2	2025-08-09 05:15:59.246	1697	\N	t	634
33	39	3	28	\N	{active}	{}	2	2	2025-08-09 05:15:59.246	1103	\N	t	104
34	36	3	28	\N	{active}	{}	2	2	2025-08-09 05:15:59.246	1103	\N	t	104
35	32	11	29	\N	{active}	{}	2	2	2025-08-09 05:15:59.246	1652	\N	t	200 hw
36	48	3	28	\N	{active}	{}	2	2	2025-08-09 05:15:59.246	1103	\N	t	104
37	52	3	28	\N	{active}	{}	2	2	2025-08-09 05:15:59.246	1103	\N	t	104
38	42	3	28	\N	{active}	{}	2	2	2025-08-09 05:15:59.246	1103	\N	t	104
39	41	3	28	\N	{active}	{}	2	2	2025-08-09 05:15:59.246	1103	\N	t	104
40	46	3	27	\N	{active}	{}	2	2	2025-08-09 05:15:59.246	1104	\N	t	104
41	47	3	27	\N	{active}	{}	2	2	2025-08-09 05:15:59.246	1104	\N	t	104
42	43	3	27	\N	{active}	{}	2	2	2025-08-09 05:15:59.246	1104	\N	t	104
43	45	3	34	\N	{active}	{}	2	2	2025-08-09 05:15:59.246	1701	\N	t	TBD
44	50	3	31	\N	{active}	{}	2	2	2025-08-09 05:15:59.246	1704	\N	t	123
45	24	6	17	\N	{active}	{}	2	2	2025-08-09 05:15:59.246	1502	\N	t	3rd Floor
46	53	10	22	\N	{active}	{}	2	2	2025-08-09 05:15:59.246	1694	\N	t	630
47	35	11	24	\N	{active}	{}	2	2	2025-08-09 05:15:59.246	1650	\N	t	600 hw
48	13	4	11	\N	{active}	{}	2	2	2025-08-09 05:15:59.246	1501	\N	t	3rd Floor
49	7	27	32	\N	{active}	{}	2	2	2025-08-09 05:15:59.246	1126	\N	t	126
50	34	7	20	\N	{active}	{}	2	2	2025-08-09 05:15:59.246	1506	\N	t	3rd Floor
51	22	18	12	\N	{active}	{}	2	2	2025-08-09 05:15:59.246	1696	\N	t	130
52	54	10	22	\N	{active}	{}	2	2	2025-08-09 05:15:59.246	1694	\N	t	630
53	55	11	24	\N	{active}	{}	2	2	2025-08-09 05:15:59.246	1650	\N	t	600 hw
54	56	30	38	\N	{active,admin,leadership}	{}	2	2	2025-08-09 05:24:52.556	1000	2020-01-01 00:00:00	t	500
\.


--
-- TOC entry 4125 (class 0 OID 103651)
-- Dependencies: 237
-- Data for Name: SystemSetting; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public."SystemSetting" (key, value) FROM stdin;
\.


--
-- TOC entry 4128 (class 0 OID 103670)
-- Dependencies: 240
-- Data for Name: VerificationToken; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public."VerificationToken" (identifier, token, expires) FROM stdin;
\.


--
-- TOC entry 4149 (class 0 OID 104984)
-- Dependencies: 261
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
-- TOC entry 4134 (class 0 OID 103704)
-- Dependencies: 246
-- Data for Name: agenda_item_attachments; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.agenda_item_attachments (id, agenda_item_id, file_name, file_url, file_size, content_type, created_at, updated_at, uploaded_by_id) FROM stdin;
\.


--
-- TOC entry 4136 (class 0 OID 103714)
-- Dependencies: 248
-- Data for Name: agenda_item_comments; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.agenda_item_comments (id, agenda_item_id, staff_id, comment, created_at) FROM stdin;
\.


--
-- TOC entry 4123 (class 0 OID 103635)
-- Dependencies: 235
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.audit_logs (id, table_name, record_id, operation, field_changes, old_values, new_values, user_id, staff_id, source, description, ip_address, user_agent, metadata, created_at) FROM stdin;
1	users	56	UPDATE	\N	\N	\N	56	\N	WEB_UI	Theme changed to classic-light	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	2025-08-09 05:54:18
2	users	56	UPDATE	\N	\N	\N	56	\N	WEB_UI	Theme changed to classic-dark	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	2025-08-09 05:54:22.225
3	users	56	UPDATE	\N	\N	\N	56	\N	WEB_UI	Theme changed to midnight-blue	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	2025-08-09 05:54:25.698
4	users	56	UPDATE	\N	\N	\N	56	\N	WEB_UI	Theme changed to forest-green	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	2025-08-09 05:54:30.87
5	users	56	UPDATE	\N	\N	\N	56	\N	WEB_UI	Theme changed to warm-orange	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	2025-08-09 05:54:33.441
6	users	56	UPDATE	\N	\N	\N	56	\N	WEB_UI	Theme changed to tasarim	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	2025-08-09 05:54:36.354
7	users	56	UPDATE	\N	\N	\N	56	\N	WEB_UI	Theme changed to modern-purple	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	2025-08-09 05:54:39.577
8	users	56	UPDATE	\N	\N	\N	56	\N	WEB_UI	Theme changed to dark-mode	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	2025-08-09 05:54:42.366
9	users	56	UPDATE	\N	\N	\N	56	\N	WEB_UI	Theme changed to high-contrast	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	2025-08-09 05:54:45.138
10	users	56	UPDATE	\N	\N	\N	56	\N	WEB_UI	Theme changed to nature-green	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	2025-08-09 05:54:48.614
11	users	56	UPDATE	\N	\N	\N	56	\N	WEB_UI	Theme changed to standard	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	2025-08-09 05:55:05.415
12	users	56	UPDATE	\N	\N	\N	56	\N	WEB_UI	Theme changed to tasarim	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	2025-08-09 05:55:07.972
13	users	56	UPDATE	\N	\N	\N	56	54	WEB_UI	Layout changed to classic	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	2025-08-09 06:43:51.713
14	users	56	UPDATE	\N	\N	\N	56	54	WEB_UI	Layout changed to modern	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	2025-08-09 06:44:03.146
15	users	56	UPDATE	\N	\N	\N	56	54	WEB_UI	Layout changed to compact	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	2025-08-09 06:44:09.762
\.


--
-- TOC entry 4121 (class 0 OID 103623)
-- Dependencies: 233
-- Data for Name: critical_audit_logs; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.critical_audit_logs (id, "timestamp", category, action, user_id, staff_id, target_user_id, target_staff_id, ip_address, session_id, risk_score, success, error_message, metadata) FROM stdin;
\.


--
-- TOC entry 4147 (class 0 OID 103776)
-- Dependencies: 259
-- Data for Name: dev_logs; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.dev_logs (id, "timestamp", level, message, category, component, function, file, line, stack, environment, context, metadata, performance, user_id, staff_id, session_id, user_agent, ip, path, method, status_code, duration, created_at, updated_at) FROM stdin;
dev-test-1754711257094	2025-08-09 03:47:37.094	INFO	Direct database logging test	system	\N	\N	\N	\N	\N	development	{"test":true,"timestamp":"2025-08-09T03:47:37.094Z"}	{"testType":"direct_db","version":"1.0.0"}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-08-09 03:47:37.103	2025-08-09 03:47:37.103
\.


--
-- TOC entry 4130 (class 0 OID 103676)
-- Dependencies: 242
-- Data for Name: devices; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.devices (id, user_id, device_id, device_name, device_type, device_os, browser, ip_address, last_active, is_trusted, created_at) FROM stdin;
\.


--
-- TOC entry 4140 (class 0 OID 103734)
-- Dependencies: 252
-- Data for Name: meeting_action_items; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.meeting_action_items (id, meeting_id, agenda_item_id, title, description, assigned_to, due_date, completed_at, created_at, updated_at, assigned_to_role, carry_forward_count, completed_by, notes, parent_action_id, priority, status) FROM stdin;
\.


--
-- TOC entry 4132 (class 0 OID 103688)
-- Dependencies: 244
-- Data for Name: meeting_agenda_items; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.meeting_agenda_items (id, meeting_id, topic, problem_statement, staff_initials, responsible_staff_id, priority, purpose, proposed_solution, solution_type, decisions_actions, decision_type, status, future_implications, order_index, duration_minutes, created_at, updated_at, carried_forward, carry_forward_count, parent_item_id, responsible_role_id) FROM stdin;
1	1	Ilk madde	Bu madde searchh icin kullanılacak. Bakalım calisacak mi?	\N	54	Medium	Discussion	\N	\N	\N	\N	Pending	f	0	15	2025-08-09 06:17:16.308	2025-08-09 06:17:16.308	f	0	\N	\N
\.


--
-- TOC entry 4138 (class 0 OID 103724)
-- Dependencies: 250
-- Data for Name: meeting_audit_logs; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.meeting_audit_logs (id, meeting_id, user_id, staff_id, action, details, changes, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- TOC entry 4119 (class 0 OID 103613)
-- Dependencies: 231
-- Data for Name: meeting_notes; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.meeting_notes (id, meeting_id, staff_id, content, created_at) FROM stdin;
\.


--
-- TOC entry 4144 (class 0 OID 103757)
-- Dependencies: 256
-- Data for Name: meeting_search; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.meeting_search (id, meeting_id, content, search_text, metadata, created_at) FROM stdin;
\.


--
-- TOC entry 4127 (class 0 OID 103659)
-- Dependencies: 239
-- Data for Name: meeting_templates; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.meeting_templates (id, name, description, duration, agenda, attendees, is_active, created_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4142 (class 0 OID 103747)
-- Dependencies: 254
-- Data for Name: meeting_transcripts; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.meeting_transcripts (id, meeting_id, full_text, summary, key_points, ai_summary, speakers, timestamps, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4146 (class 0 OID 103767)
-- Dependencies: 258
-- Data for Name: role_transitions; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.role_transitions (id, role_id, from_staff_id, to_staff_id, transition_date, pending_tasks, transferred_items, notes, created_by) FROM stdin;
\.


--
-- TOC entry 4148 (class 0 OID 103785)
-- Dependencies: 260
-- Data for Name: security_logs; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.security_logs (id, "timestamp", level, message, category, action, result, risk_level, actor, target, context, metadata, compliance, location, user_id, staff_id, user_agent, ip, path, method, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4111 (class 0 OID 103558)
-- Dependencies: 223
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: hs
--

COPY public.users (id, email, name, staff_id, "hashedPassword", "emailVerified", image, is_admin, is_system_admin, is_school_admin, two_factor_enabled, two_factor_secret, backup_codes, login_notifications_enabled, suspicious_alerts_enabled, remember_devices_enabled, created_at, updated_at, theme_preference, layout_preference, custom_theme) FROM stdin;
6	sysadmin@cjcollegeprep.org	System Administrator	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	t	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.219	2025-08-09 05:15:59.219	standard	modern	\N
7	fbrown@cjcollegeprep.org	Ms. Brown	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
8	namin@cjcollegeprep.org	Ms. Nima Amin	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.219	2025-08-09 05:15:59.219	standard	modern	\N
9	amygettelfinger@cjcollegeprep.org	Ms. Gettelfinger	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
10	tsalley@cjcollegeprep.org	Ms. Salley	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
11	cthomas@cjcollegeprep.org	Ms. Thomas	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
13	purchasing@cjcollegeprep.org	Ms. Ramos	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
12	lmignogno@cjcollegeprep.org	Ms. Mignogno	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
14	mfirsichbaum@cjcollegeprep.org	Ms. Firsichbaum	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
15	cmathews@cjcollegeprep.org	Dr. Mathews	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
16	braybon@cjcollegeprep.org	Ms. Raybon	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
17	manar@cjcollegeprep.org	Mr. Anar	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
18	hr@cjcollegeprep.org	Ms. Goldstein	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
19	bgrossmann@cjcollegeprep.org	Ms. Grossmann	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
20	nsercan@cjcollegeprep.org	Dr. Namik Sercan	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	t	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.219	2025-08-09 05:15:59.219	standard	modern	\N
21	dcua@cjcollegeprep.org	Mr. Daryl	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
22	skaeli@cjcollegeprep.org	Ms. Kaeli	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
23	jantonacci@cjcollegeprep.org	Ms. Antonacci	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
26	bagudelo@cjcollegeprep.org	Ms. Bibiana	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
27	abicer@cjcollegeprep.org	Mr. Ahmet	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
25	pespinoza@cjcollegeprep.org	Ms. Espinoza	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
28	vsuslu@cjcollegeprep.org	Mr. Bright	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
29	fbarker@cjcollegeprep.org	Ms. Brown	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
30	mgibbs@cjcollegeprep.org	Ms. Gibbs	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
31	kmercedes@cjcollegeprep.org	Ms. Mercedes	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
24	accountspayable@cjcollegeprep.org	Ms. Mancuso	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
33	skeskin@cjcollegeprep.org	Ms. Keskin	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
34	cpagliuca@cjcollegeprep.org	Ms. Pagliuca	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
35	stayfur@cjcollegeprep.org	Mr. Tayfur	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
36	scerone@cjcollegeprep.org	Ms. Cerone	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
32	myilmaz@cjcollegeprep.org	Mr. Mert	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
38	sba@cjcollegeprep.org	Ms. Daubon	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
39	ahauser@cjcollegeprep.org	Ms. Hauser	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
40	smeyer@cjcollegeprep.org	Ms. Meyer	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
41	imlladenovic@cjcollegeprep.org	Ms. Mladenovic	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
42	kbarkohani@cjcollegeprep.org	Ms. Barkohani	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
43	asimon@cjcollegeprep.org	Ms. Simon	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
44	ninanir@cjcollegeprep.org	Ms. Neval	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
45	djacobs@cjcollegeprep.org	Ms. Jacobs	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
46	jtadros@cjcollegeprep.org	Ms. Tadros	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
48	palvarez@cjcollegeprep.org	Ms. Alvarez	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
49	dvesper@cjcollegeprep.org	Dr. Vesper	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
37	ktemplasky@cjcollegeprep.org	Mr. Tempalsky	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
50	ekeating@cjcollegeprep.org	Ms. Keating	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
51	hrdept@cjcollegeprep.org	Ms. LaLindez	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
53	cquerijero@cjcollegeprep.org	Ms. Querijero	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
52	ldobrin@cjcollegeprep.org	Ms. Dobrin	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
54	mmontgomery@cjcollegeprep.org	Ms. Montgomery	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
55	akahraman@cjcollegeprep.org	Mr. Kahraman	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
56	admin@school.edu	Admin User	\N	$2b$10$kBUvH7JxDYQixYgEiZJMAuAjuRfDlMGxwkbpKWyABvu/E80e1w6jq	\N	\N	t	f	f	f	\N	{}	t	t	t	2025-08-09 05:17:04.859	2025-08-09 06:44:09.754	tasarim	compact	\N
47	rorhan@cjcollegeprep.org	Ms. Orhan	\N	$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO	\N	\N	f	f	f	f	\N	{}	t	t	t	2025-08-09 05:15:59.22	2025-08-09 05:15:59.22	standard	modern	\N
\.


--
-- TOC entry 4178 (class 0 OID 0)
-- Dependencies: 214
-- Name: Department_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public."Department_id_seq"', 30, true);


--
-- TOC entry 4179 (class 0 OID 0)
-- Dependencies: 210
-- Name: District_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public."District_id_seq"', 2, true);


--
-- TOC entry 4180 (class 0 OID 0)
-- Dependencies: 228
-- Name: MeetingAttendee_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public."MeetingAttendee_id_seq"', 5, true);


--
-- TOC entry 4181 (class 0 OID 0)
-- Dependencies: 226
-- Name: Meeting_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public."Meeting_id_seq"', 1, true);


--
-- TOC entry 4182 (class 0 OID 0)
-- Dependencies: 220
-- Name: Permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public."Permission_id_seq"', 1, false);


--
-- TOC entry 4183 (class 0 OID 0)
-- Dependencies: 218
-- Name: RoleHierarchy_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public."RoleHierarchy_id_seq"', 11, true);


--
-- TOC entry 4184 (class 0 OID 0)
-- Dependencies: 216
-- Name: Role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public."Role_id_seq"', 38, true);


--
-- TOC entry 4185 (class 0 OID 0)
-- Dependencies: 212
-- Name: School_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public."School_id_seq"', 2, true);


--
-- TOC entry 4186 (class 0 OID 0)
-- Dependencies: 224
-- Name: Staff_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public."Staff_id_seq"', 54, true);


--
-- TOC entry 4187 (class 0 OID 0)
-- Dependencies: 245
-- Name: agenda_item_attachments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.agenda_item_attachments_id_seq', 1, false);


--
-- TOC entry 4188 (class 0 OID 0)
-- Dependencies: 247
-- Name: agenda_item_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.agenda_item_comments_id_seq', 1, false);


--
-- TOC entry 4189 (class 0 OID 0)
-- Dependencies: 234
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 16, true);


--
-- TOC entry 4190 (class 0 OID 0)
-- Dependencies: 232
-- Name: critical_audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.critical_audit_logs_id_seq', 1, false);


--
-- TOC entry 4191 (class 0 OID 0)
-- Dependencies: 241
-- Name: devices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.devices_id_seq', 1, false);


--
-- TOC entry 4192 (class 0 OID 0)
-- Dependencies: 251
-- Name: meeting_action_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.meeting_action_items_id_seq', 1, false);


--
-- TOC entry 4193 (class 0 OID 0)
-- Dependencies: 243
-- Name: meeting_agenda_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.meeting_agenda_items_id_seq', 1, false);


--
-- TOC entry 4194 (class 0 OID 0)
-- Dependencies: 249
-- Name: meeting_audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.meeting_audit_logs_id_seq', 1, false);


--
-- TOC entry 4195 (class 0 OID 0)
-- Dependencies: 230
-- Name: meeting_notes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.meeting_notes_id_seq', 1, false);


--
-- TOC entry 4196 (class 0 OID 0)
-- Dependencies: 255
-- Name: meeting_search_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.meeting_search_id_seq', 1, false);


--
-- TOC entry 4197 (class 0 OID 0)
-- Dependencies: 238
-- Name: meeting_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.meeting_templates_id_seq', 1, false);


--
-- TOC entry 4198 (class 0 OID 0)
-- Dependencies: 253
-- Name: meeting_transcripts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.meeting_transcripts_id_seq', 1, false);


--
-- TOC entry 4199 (class 0 OID 0)
-- Dependencies: 257
-- Name: role_transitions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.role_transitions_id_seq', 1, false);


--
-- TOC entry 4200 (class 0 OID 0)
-- Dependencies: 222
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hs
--

SELECT pg_catalog.setval('public.users_id_seq', 56, true);


--
-- TOC entry 3779 (class 2606 OID 103491)
-- Name: Account Account_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY (id);


--
-- TOC entry 3787 (class 2606 OID 103522)
-- Name: Department Department_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_pkey" PRIMARY KEY (id);


--
-- TOC entry 3782 (class 2606 OID 103501)
-- Name: District District_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."District"
    ADD CONSTRAINT "District_pkey" PRIMARY KEY (id);


--
-- TOC entry 3809 (class 2606 OID 103611)
-- Name: MeetingAttendee MeetingAttendee_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."MeetingAttendee"
    ADD CONSTRAINT "MeetingAttendee_pkey" PRIMARY KEY (id);


--
-- TOC entry 3807 (class 2606 OID 103601)
-- Name: Meeting Meeting_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Meeting"
    ADD CONSTRAINT "Meeting_pkey" PRIMARY KEY (id);


--
-- TOC entry 3797 (class 2606 OID 103556)
-- Name: Permission Permission_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Permission"
    ADD CONSTRAINT "Permission_pkey" PRIMARY KEY (id);


--
-- TOC entry 3794 (class 2606 OID 103546)
-- Name: RoleHierarchy RoleHierarchy_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."RoleHierarchy"
    ADD CONSTRAINT "RoleHierarchy_pkey" PRIMARY KEY (id);


--
-- TOC entry 3790 (class 2606 OID 103537)
-- Name: Role Role_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_pkey" PRIMARY KEY (id);


--
-- TOC entry 3784 (class 2606 OID 103511)
-- Name: School School_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."School"
    ADD CONSTRAINT "School_pkey" PRIMARY KEY (id);


--
-- TOC entry 3828 (class 2606 OID 103650)
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- TOC entry 3805 (class 2606 OID 103586)
-- Name: Staff Staff_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Staff"
    ADD CONSTRAINT "Staff_pkey" PRIMARY KEY (id);


--
-- TOC entry 3831 (class 2606 OID 103657)
-- Name: SystemSetting SystemSetting_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."SystemSetting"
    ADD CONSTRAINT "SystemSetting_pkey" PRIMARY KEY (key);


--
-- TOC entry 3896 (class 2606 OID 105014)
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 3848 (class 2606 OID 103712)
-- Name: agenda_item_attachments agenda_item_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.agenda_item_attachments
    ADD CONSTRAINT agenda_item_attachments_pkey PRIMARY KEY (id);


--
-- TOC entry 3852 (class 2606 OID 103722)
-- Name: agenda_item_comments agenda_item_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.agenda_item_comments
    ADD CONSTRAINT agenda_item_comments_pkey PRIMARY KEY (id);


--
-- TOC entry 3824 (class 2606 OID 103643)
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 3817 (class 2606 OID 103633)
-- Name: critical_audit_logs critical_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.critical_audit_logs
    ADD CONSTRAINT critical_audit_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 3882 (class 2606 OID 103784)
-- Name: dev_logs dev_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.dev_logs
    ADD CONSTRAINT dev_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 3838 (class 2606 OID 103686)
-- Name: devices devices_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_pkey PRIMARY KEY (id);


--
-- TOC entry 3863 (class 2606 OID 103745)
-- Name: meeting_action_items meeting_action_items_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_action_items
    ADD CONSTRAINT meeting_action_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3843 (class 2606 OID 103702)
-- Name: meeting_agenda_items meeting_agenda_items_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_agenda_items
    ADD CONSTRAINT meeting_agenda_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3856 (class 2606 OID 103732)
-- Name: meeting_audit_logs meeting_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_audit_logs
    ADD CONSTRAINT meeting_audit_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 3811 (class 2606 OID 103621)
-- Name: meeting_notes meeting_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_notes
    ADD CONSTRAINT meeting_notes_pkey PRIMARY KEY (id);


--
-- TOC entry 3871 (class 2606 OID 103765)
-- Name: meeting_search meeting_search_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_search
    ADD CONSTRAINT meeting_search_pkey PRIMARY KEY (id);


--
-- TOC entry 3833 (class 2606 OID 103669)
-- Name: meeting_templates meeting_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_templates
    ADD CONSTRAINT meeting_templates_pkey PRIMARY KEY (id);


--
-- TOC entry 3868 (class 2606 OID 103755)
-- Name: meeting_transcripts meeting_transcripts_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_transcripts
    ADD CONSTRAINT meeting_transcripts_pkey PRIMARY KEY (id);


--
-- TOC entry 3874 (class 2606 OID 103775)
-- Name: role_transitions role_transitions_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.role_transitions
    ADD CONSTRAINT role_transitions_pkey PRIMARY KEY (id);


--
-- TOC entry 3890 (class 2606 OID 103792)
-- Name: security_logs security_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.security_logs
    ADD CONSTRAINT security_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 3802 (class 2606 OID 103575)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3780 (class 1259 OID 103793)
-- Name: Account_provider_providerAccountId_key; Type: INDEX; Schema: public; Owner: hs
--

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON public."Account" USING btree (provider, "providerAccountId");


--
-- TOC entry 3785 (class 1259 OID 103794)
-- Name: Department_code_key; Type: INDEX; Schema: public; Owner: hs
--

CREATE UNIQUE INDEX "Department_code_key" ON public."Department" USING btree (code);


--
-- TOC entry 3795 (class 1259 OID 103798)
-- Name: Permission_capability_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX "Permission_capability_idx" ON public."Permission" USING btree (capability);


--
-- TOC entry 3798 (class 1259 OID 103799)
-- Name: Permission_resource_action_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX "Permission_resource_action_idx" ON public."Permission" USING btree (resource, action);


--
-- TOC entry 3799 (class 1259 OID 103800)
-- Name: Permission_role_id_capability_key; Type: INDEX; Schema: public; Owner: hs
--

CREATE UNIQUE INDEX "Permission_role_id_capability_key" ON public."Permission" USING btree (role_id, capability);


--
-- TOC entry 3792 (class 1259 OID 103797)
-- Name: RoleHierarchy_parent_role_id_child_role_id_key; Type: INDEX; Schema: public; Owner: hs
--

CREATE UNIQUE INDEX "RoleHierarchy_parent_role_id_child_role_id_key" ON public."RoleHierarchy" USING btree (parent_role_id, child_role_id);


--
-- TOC entry 3788 (class 1259 OID 103796)
-- Name: Role_key_key; Type: INDEX; Schema: public; Owner: hs
--

CREATE UNIQUE INDEX "Role_key_key" ON public."Role" USING btree (key);


--
-- TOC entry 3791 (class 1259 OID 103795)
-- Name: Role_title_key; Type: INDEX; Schema: public; Owner: hs
--

CREATE UNIQUE INDEX "Role_title_key" ON public."Role" USING btree (title);


--
-- TOC entry 3829 (class 1259 OID 103814)
-- Name: Session_sessionToken_key; Type: INDEX; Schema: public; Owner: hs
--

CREATE UNIQUE INDEX "Session_sessionToken_key" ON public."Session" USING btree ("sessionToken");


--
-- TOC entry 3834 (class 1259 OID 103816)
-- Name: VerificationToken_identifier_token_key; Type: INDEX; Schema: public; Owner: hs
--

CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON public."VerificationToken" USING btree (identifier, token);


--
-- TOC entry 3835 (class 1259 OID 103815)
-- Name: VerificationToken_token_key; Type: INDEX; Schema: public; Owner: hs
--

CREATE UNIQUE INDEX "VerificationToken_token_key" ON public."VerificationToken" USING btree (token);


--
-- TOC entry 3846 (class 1259 OID 103823)
-- Name: agenda_item_attachments_agenda_item_id_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX agenda_item_attachments_agenda_item_id_idx ON public.agenda_item_attachments USING btree (agenda_item_id);


--
-- TOC entry 3849 (class 1259 OID 103824)
-- Name: agenda_item_attachments_uploaded_by_id_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX agenda_item_attachments_uploaded_by_id_idx ON public.agenda_item_attachments USING btree (uploaded_by_id);


--
-- TOC entry 3850 (class 1259 OID 103825)
-- Name: agenda_item_comments_agenda_item_id_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX agenda_item_comments_agenda_item_id_idx ON public.agenda_item_comments USING btree (agenda_item_id);


--
-- TOC entry 3822 (class 1259 OID 103813)
-- Name: audit_logs_operation_created_at_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX audit_logs_operation_created_at_idx ON public.audit_logs USING btree (operation, created_at);


--
-- TOC entry 3825 (class 1259 OID 103811)
-- Name: audit_logs_table_name_created_at_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX audit_logs_table_name_created_at_idx ON public.audit_logs USING btree (table_name, created_at);


--
-- TOC entry 3826 (class 1259 OID 103812)
-- Name: audit_logs_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX audit_logs_user_id_created_at_idx ON public.audit_logs USING btree (user_id, created_at);


--
-- TOC entry 3812 (class 1259 OID 103807)
-- Name: critical_audit_logs_category_risk_score_timestamp_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX critical_audit_logs_category_risk_score_timestamp_idx ON public.critical_audit_logs USING btree (category, risk_score, "timestamp");


--
-- TOC entry 3813 (class 1259 OID 103803)
-- Name: critical_audit_logs_category_timestamp_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX critical_audit_logs_category_timestamp_idx ON public.critical_audit_logs USING btree (category, "timestamp");


--
-- TOC entry 3814 (class 1259 OID 103809)
-- Name: critical_audit_logs_category_user_id_timestamp_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX critical_audit_logs_category_user_id_timestamp_idx ON public.critical_audit_logs USING btree (category, user_id, "timestamp");


--
-- TOC entry 3815 (class 1259 OID 103806)
-- Name: critical_audit_logs_ip_address_timestamp_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX critical_audit_logs_ip_address_timestamp_idx ON public.critical_audit_logs USING btree (ip_address, "timestamp");


--
-- TOC entry 3818 (class 1259 OID 103805)
-- Name: critical_audit_logs_risk_score_timestamp_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX critical_audit_logs_risk_score_timestamp_idx ON public.critical_audit_logs USING btree (risk_score, "timestamp");


--
-- TOC entry 3819 (class 1259 OID 103810)
-- Name: critical_audit_logs_success_risk_score_timestamp_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX critical_audit_logs_success_risk_score_timestamp_idx ON public.critical_audit_logs USING btree (success, risk_score, "timestamp");


--
-- TOC entry 3820 (class 1259 OID 103808)
-- Name: critical_audit_logs_user_id_staff_id_timestamp_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX critical_audit_logs_user_id_staff_id_timestamp_idx ON public.critical_audit_logs USING btree (user_id, staff_id, "timestamp");


--
-- TOC entry 3821 (class 1259 OID 103804)
-- Name: critical_audit_logs_user_id_timestamp_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX critical_audit_logs_user_id_timestamp_idx ON public.critical_audit_logs USING btree (user_id, "timestamp");


--
-- TOC entry 3877 (class 1259 OID 103842)
-- Name: dev_logs_category_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX dev_logs_category_idx ON public.dev_logs USING btree (category);


--
-- TOC entry 3878 (class 1259 OID 103844)
-- Name: dev_logs_component_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX dev_logs_component_idx ON public.dev_logs USING btree (component);


--
-- TOC entry 3879 (class 1259 OID 103845)
-- Name: dev_logs_environment_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX dev_logs_environment_idx ON public.dev_logs USING btree (environment);


--
-- TOC entry 3880 (class 1259 OID 103841)
-- Name: dev_logs_level_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX dev_logs_level_idx ON public.dev_logs USING btree (level);


--
-- TOC entry 3883 (class 1259 OID 103846)
-- Name: dev_logs_status_code_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX dev_logs_status_code_idx ON public.dev_logs USING btree (status_code);


--
-- TOC entry 3884 (class 1259 OID 103840)
-- Name: dev_logs_timestamp_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX dev_logs_timestamp_idx ON public.dev_logs USING btree ("timestamp");


--
-- TOC entry 3885 (class 1259 OID 103843)
-- Name: dev_logs_user_id_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX dev_logs_user_id_idx ON public.dev_logs USING btree (user_id);


--
-- TOC entry 3836 (class 1259 OID 103817)
-- Name: devices_device_id_key; Type: INDEX; Schema: public; Owner: hs
--

CREATE UNIQUE INDEX devices_device_id_key ON public.devices USING btree (device_id);


--
-- TOC entry 3839 (class 1259 OID 103818)
-- Name: devices_user_id_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX devices_user_id_idx ON public.devices USING btree (user_id);


--
-- TOC entry 3858 (class 1259 OID 103830)
-- Name: meeting_action_items_assigned_to_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX meeting_action_items_assigned_to_idx ON public.meeting_action_items USING btree (assigned_to);


--
-- TOC entry 3859 (class 1259 OID 103831)
-- Name: meeting_action_items_assigned_to_role_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX meeting_action_items_assigned_to_role_idx ON public.meeting_action_items USING btree (assigned_to_role);


--
-- TOC entry 3860 (class 1259 OID 103833)
-- Name: meeting_action_items_due_date_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX meeting_action_items_due_date_idx ON public.meeting_action_items USING btree (due_date);


--
-- TOC entry 3861 (class 1259 OID 103829)
-- Name: meeting_action_items_meeting_id_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX meeting_action_items_meeting_id_idx ON public.meeting_action_items USING btree (meeting_id);


--
-- TOC entry 3864 (class 1259 OID 103832)
-- Name: meeting_action_items_status_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX meeting_action_items_status_idx ON public.meeting_action_items USING btree (status);


--
-- TOC entry 3840 (class 1259 OID 103819)
-- Name: meeting_agenda_items_meeting_id_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX meeting_agenda_items_meeting_id_idx ON public.meeting_agenda_items USING btree (meeting_id);


--
-- TOC entry 3841 (class 1259 OID 103822)
-- Name: meeting_agenda_items_parent_item_id_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX meeting_agenda_items_parent_item_id_idx ON public.meeting_agenda_items USING btree (parent_item_id);


--
-- TOC entry 3844 (class 1259 OID 103821)
-- Name: meeting_agenda_items_responsible_role_id_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX meeting_agenda_items_responsible_role_id_idx ON public.meeting_agenda_items USING btree (responsible_role_id);


--
-- TOC entry 3845 (class 1259 OID 103820)
-- Name: meeting_agenda_items_responsible_staff_id_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX meeting_agenda_items_responsible_staff_id_idx ON public.meeting_agenda_items USING btree (responsible_staff_id);


--
-- TOC entry 3853 (class 1259 OID 103828)
-- Name: meeting_audit_logs_created_at_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX meeting_audit_logs_created_at_idx ON public.meeting_audit_logs USING btree (created_at);


--
-- TOC entry 3854 (class 1259 OID 103826)
-- Name: meeting_audit_logs_meeting_id_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX meeting_audit_logs_meeting_id_idx ON public.meeting_audit_logs USING btree (meeting_id);


--
-- TOC entry 3857 (class 1259 OID 103827)
-- Name: meeting_audit_logs_user_id_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX meeting_audit_logs_user_id_idx ON public.meeting_audit_logs USING btree (user_id);


--
-- TOC entry 3869 (class 1259 OID 103836)
-- Name: meeting_search_meeting_id_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX meeting_search_meeting_id_idx ON public.meeting_search USING btree (meeting_id);


--
-- TOC entry 3865 (class 1259 OID 103835)
-- Name: meeting_transcripts_meeting_id_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX meeting_transcripts_meeting_id_idx ON public.meeting_transcripts USING btree (meeting_id);


--
-- TOC entry 3866 (class 1259 OID 103834)
-- Name: meeting_transcripts_meeting_id_key; Type: INDEX; Schema: public; Owner: hs
--

CREATE UNIQUE INDEX meeting_transcripts_meeting_id_key ON public.meeting_transcripts USING btree (meeting_id);


--
-- TOC entry 3872 (class 1259 OID 103838)
-- Name: role_transitions_from_staff_id_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX role_transitions_from_staff_id_idx ON public.role_transitions USING btree (from_staff_id);


--
-- TOC entry 3875 (class 1259 OID 103837)
-- Name: role_transitions_role_id_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX role_transitions_role_id_idx ON public.role_transitions USING btree (role_id);


--
-- TOC entry 3876 (class 1259 OID 103839)
-- Name: role_transitions_to_staff_id_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX role_transitions_to_staff_id_idx ON public.role_transitions USING btree (to_staff_id);


--
-- TOC entry 3886 (class 1259 OID 103853)
-- Name: security_logs_action_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX security_logs_action_idx ON public.security_logs USING btree (action);


--
-- TOC entry 3887 (class 1259 OID 103849)
-- Name: security_logs_category_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX security_logs_category_idx ON public.security_logs USING btree (category);


--
-- TOC entry 3888 (class 1259 OID 103848)
-- Name: security_logs_level_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX security_logs_level_idx ON public.security_logs USING btree (level);


--
-- TOC entry 3891 (class 1259 OID 103852)
-- Name: security_logs_result_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX security_logs_result_idx ON public.security_logs USING btree (result);


--
-- TOC entry 3892 (class 1259 OID 103851)
-- Name: security_logs_risk_level_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX security_logs_risk_level_idx ON public.security_logs USING btree (risk_level);


--
-- TOC entry 3893 (class 1259 OID 103847)
-- Name: security_logs_timestamp_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX security_logs_timestamp_idx ON public.security_logs USING btree ("timestamp");


--
-- TOC entry 3894 (class 1259 OID 103850)
-- Name: security_logs_user_id_idx; Type: INDEX; Schema: public; Owner: hs
--

CREATE INDEX security_logs_user_id_idx ON public.security_logs USING btree (user_id);


--
-- TOC entry 3800 (class 1259 OID 103801)
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: hs
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- TOC entry 3803 (class 1259 OID 103802)
-- Name: users_staff_id_key; Type: INDEX; Schema: public; Owner: hs
--

CREATE UNIQUE INDEX users_staff_id_key ON public.users USING btree (staff_id);


--
-- TOC entry 3897 (class 2606 OID 103854)
-- Name: Account Account_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3899 (class 2606 OID 103864)
-- Name: Department Department_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3900 (class 2606 OID 103869)
-- Name: Department Department_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3918 (class 2606 OID 103959)
-- Name: MeetingAttendee MeetingAttendee_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."MeetingAttendee"
    ADD CONSTRAINT "MeetingAttendee_meeting_id_fkey" FOREIGN KEY (meeting_id) REFERENCES public."Meeting"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3919 (class 2606 OID 103964)
-- Name: MeetingAttendee MeetingAttendee_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."MeetingAttendee"
    ADD CONSTRAINT "MeetingAttendee_staff_id_fkey" FOREIGN KEY (staff_id) REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3912 (class 2606 OID 103929)
-- Name: Meeting Meeting_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Meeting"
    ADD CONSTRAINT "Meeting_department_id_fkey" FOREIGN KEY (department_id) REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3913 (class 2606 OID 103934)
-- Name: Meeting Meeting_district_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Meeting"
    ADD CONSTRAINT "Meeting_district_id_fkey" FOREIGN KEY (district_id) REFERENCES public."District"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3914 (class 2606 OID 103939)
-- Name: Meeting Meeting_organizer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Meeting"
    ADD CONSTRAINT "Meeting_organizer_id_fkey" FOREIGN KEY (organizer_id) REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3915 (class 2606 OID 103944)
-- Name: Meeting Meeting_parent_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Meeting"
    ADD CONSTRAINT "Meeting_parent_meeting_id_fkey" FOREIGN KEY (parent_meeting_id) REFERENCES public."Meeting"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3916 (class 2606 OID 103949)
-- Name: Meeting Meeting_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Meeting"
    ADD CONSTRAINT "Meeting_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3917 (class 2606 OID 103954)
-- Name: Meeting Meeting_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Meeting"
    ADD CONSTRAINT "Meeting_template_id_fkey" FOREIGN KEY (template_id) REFERENCES public.meeting_templates(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3905 (class 2606 OID 103894)
-- Name: Permission Permission_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Permission"
    ADD CONSTRAINT "Permission_role_id_fkey" FOREIGN KEY (role_id) REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3903 (class 2606 OID 103884)
-- Name: RoleHierarchy RoleHierarchy_child_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."RoleHierarchy"
    ADD CONSTRAINT "RoleHierarchy_child_role_id_fkey" FOREIGN KEY (child_role_id) REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3904 (class 2606 OID 103889)
-- Name: RoleHierarchy RoleHierarchy_parent_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."RoleHierarchy"
    ADD CONSTRAINT "RoleHierarchy_parent_role_id_fkey" FOREIGN KEY (parent_role_id) REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3901 (class 2606 OID 103874)
-- Name: Role Role_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_department_id_fkey" FOREIGN KEY (department_id) REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3902 (class 2606 OID 103879)
-- Name: Role Role_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3898 (class 2606 OID 103859)
-- Name: School School_district_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."School"
    ADD CONSTRAINT "School_district_id_fkey" FOREIGN KEY (district_id) REFERENCES public."District"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3928 (class 2606 OID 104009)
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3906 (class 2606 OID 103899)
-- Name: Staff Staff_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Staff"
    ADD CONSTRAINT "Staff_department_id_fkey" FOREIGN KEY (department_id) REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3907 (class 2606 OID 103904)
-- Name: Staff Staff_district_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Staff"
    ADD CONSTRAINT "Staff_district_id_fkey" FOREIGN KEY (district_id) REFERENCES public."District"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3908 (class 2606 OID 103909)
-- Name: Staff Staff_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Staff"
    ADD CONSTRAINT "Staff_manager_id_fkey" FOREIGN KEY (manager_id) REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3909 (class 2606 OID 103914)
-- Name: Staff Staff_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Staff"
    ADD CONSTRAINT "Staff_role_id_fkey" FOREIGN KEY (role_id) REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3910 (class 2606 OID 103919)
-- Name: Staff Staff_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Staff"
    ADD CONSTRAINT "Staff_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3911 (class 2606 OID 103924)
-- Name: Staff Staff_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public."Staff"
    ADD CONSTRAINT "Staff_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3935 (class 2606 OID 104044)
-- Name: agenda_item_attachments agenda_item_attachments_agenda_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.agenda_item_attachments
    ADD CONSTRAINT agenda_item_attachments_agenda_item_id_fkey FOREIGN KEY (agenda_item_id) REFERENCES public.meeting_agenda_items(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3936 (class 2606 OID 104049)
-- Name: agenda_item_attachments agenda_item_attachments_uploaded_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.agenda_item_attachments
    ADD CONSTRAINT agenda_item_attachments_uploaded_by_id_fkey FOREIGN KEY (uploaded_by_id) REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3937 (class 2606 OID 104054)
-- Name: agenda_item_comments agenda_item_comments_agenda_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.agenda_item_comments
    ADD CONSTRAINT agenda_item_comments_agenda_item_id_fkey FOREIGN KEY (agenda_item_id) REFERENCES public.meeting_agenda_items(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3938 (class 2606 OID 104059)
-- Name: agenda_item_comments agenda_item_comments_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.agenda_item_comments
    ADD CONSTRAINT agenda_item_comments_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3926 (class 2606 OID 103999)
-- Name: audit_logs audit_logs_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3927 (class 2606 OID 104004)
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3922 (class 2606 OID 103979)
-- Name: critical_audit_logs critical_audit_logs_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.critical_audit_logs
    ADD CONSTRAINT critical_audit_logs_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3923 (class 2606 OID 103984)
-- Name: critical_audit_logs critical_audit_logs_target_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.critical_audit_logs
    ADD CONSTRAINT critical_audit_logs_target_staff_id_fkey FOREIGN KEY (target_staff_id) REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3924 (class 2606 OID 103989)
-- Name: critical_audit_logs critical_audit_logs_target_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.critical_audit_logs
    ADD CONSTRAINT critical_audit_logs_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3925 (class 2606 OID 103994)
-- Name: critical_audit_logs critical_audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.critical_audit_logs
    ADD CONSTRAINT critical_audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3954 (class 2606 OID 104139)
-- Name: dev_logs dev_logs_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.dev_logs
    ADD CONSTRAINT dev_logs_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3955 (class 2606 OID 104144)
-- Name: dev_logs dev_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.dev_logs
    ADD CONSTRAINT dev_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3930 (class 2606 OID 104019)
-- Name: devices devices_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3942 (class 2606 OID 104079)
-- Name: meeting_action_items meeting_action_items_agenda_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_action_items
    ADD CONSTRAINT meeting_action_items_agenda_item_id_fkey FOREIGN KEY (agenda_item_id) REFERENCES public.meeting_agenda_items(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3943 (class 2606 OID 104084)
-- Name: meeting_action_items meeting_action_items_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_action_items
    ADD CONSTRAINT meeting_action_items_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3944 (class 2606 OID 104089)
-- Name: meeting_action_items meeting_action_items_assigned_to_role_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_action_items
    ADD CONSTRAINT meeting_action_items_assigned_to_role_fkey FOREIGN KEY (assigned_to_role) REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3945 (class 2606 OID 104094)
-- Name: meeting_action_items meeting_action_items_completed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_action_items
    ADD CONSTRAINT meeting_action_items_completed_by_fkey FOREIGN KEY (completed_by) REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3946 (class 2606 OID 104099)
-- Name: meeting_action_items meeting_action_items_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_action_items
    ADD CONSTRAINT meeting_action_items_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public."Meeting"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3947 (class 2606 OID 104104)
-- Name: meeting_action_items meeting_action_items_parent_action_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_action_items
    ADD CONSTRAINT meeting_action_items_parent_action_id_fkey FOREIGN KEY (parent_action_id) REFERENCES public.meeting_action_items(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3931 (class 2606 OID 104024)
-- Name: meeting_agenda_items meeting_agenda_items_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_agenda_items
    ADD CONSTRAINT meeting_agenda_items_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public."Meeting"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3932 (class 2606 OID 104029)
-- Name: meeting_agenda_items meeting_agenda_items_parent_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_agenda_items
    ADD CONSTRAINT meeting_agenda_items_parent_item_id_fkey FOREIGN KEY (parent_item_id) REFERENCES public.meeting_agenda_items(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3933 (class 2606 OID 104034)
-- Name: meeting_agenda_items meeting_agenda_items_responsible_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_agenda_items
    ADD CONSTRAINT meeting_agenda_items_responsible_role_id_fkey FOREIGN KEY (responsible_role_id) REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3934 (class 2606 OID 104039)
-- Name: meeting_agenda_items meeting_agenda_items_responsible_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_agenda_items
    ADD CONSTRAINT meeting_agenda_items_responsible_staff_id_fkey FOREIGN KEY (responsible_staff_id) REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3939 (class 2606 OID 104064)
-- Name: meeting_audit_logs meeting_audit_logs_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_audit_logs
    ADD CONSTRAINT meeting_audit_logs_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public."Meeting"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3940 (class 2606 OID 104069)
-- Name: meeting_audit_logs meeting_audit_logs_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_audit_logs
    ADD CONSTRAINT meeting_audit_logs_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3941 (class 2606 OID 104074)
-- Name: meeting_audit_logs meeting_audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_audit_logs
    ADD CONSTRAINT meeting_audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3920 (class 2606 OID 103969)
-- Name: meeting_notes meeting_notes_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_notes
    ADD CONSTRAINT meeting_notes_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public."Meeting"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3921 (class 2606 OID 103974)
-- Name: meeting_notes meeting_notes_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_notes
    ADD CONSTRAINT meeting_notes_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3949 (class 2606 OID 104114)
-- Name: meeting_search meeting_search_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_search
    ADD CONSTRAINT meeting_search_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public."Meeting"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3929 (class 2606 OID 104014)
-- Name: meeting_templates meeting_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_templates
    ADD CONSTRAINT meeting_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3948 (class 2606 OID 104109)
-- Name: meeting_transcripts meeting_transcripts_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.meeting_transcripts
    ADD CONSTRAINT meeting_transcripts_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public."Meeting"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3950 (class 2606 OID 104119)
-- Name: role_transitions role_transitions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.role_transitions
    ADD CONSTRAINT role_transitions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3951 (class 2606 OID 104124)
-- Name: role_transitions role_transitions_from_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.role_transitions
    ADD CONSTRAINT role_transitions_from_staff_id_fkey FOREIGN KEY (from_staff_id) REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3952 (class 2606 OID 104129)
-- Name: role_transitions role_transitions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.role_transitions
    ADD CONSTRAINT role_transitions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3953 (class 2606 OID 104134)
-- Name: role_transitions role_transitions_to_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.role_transitions
    ADD CONSTRAINT role_transitions_to_staff_id_fkey FOREIGN KEY (to_staff_id) REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3956 (class 2606 OID 104149)
-- Name: security_logs security_logs_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.security_logs
    ADD CONSTRAINT security_logs_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3957 (class 2606 OID 104154)
-- Name: security_logs security_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hs
--

ALTER TABLE ONLY public.security_logs
    ADD CONSTRAINT security_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


-- Completed on 2025-08-09 21:18:33 EDT

--
-- PostgreSQL database dump complete
--

