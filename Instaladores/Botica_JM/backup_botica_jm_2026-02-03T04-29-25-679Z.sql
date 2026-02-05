--
-- PostgreSQL database dump
--

\restrict UfeKv6VRhwVovWIG8tBOpyIjZGTiqg9VoFaCo6VKkIcacGGvl6r2qMTJPZ2T307

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2026-02-02 23:29:26

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 892 (class 1247 OID 26026)
-- Name: EstadoCaja; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EstadoCaja" AS ENUM (
    'ABIERTA',
    'CERRADA'
);


ALTER TYPE public."EstadoCaja" OWNER TO postgres;

--
-- TOC entry 889 (class 1247 OID 26018)
-- Name: EstadoVenta; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EstadoVenta" AS ENUM (
    'COMPLETADO',
    'ANULADO',
    'PENDIENTE'
);


ALTER TYPE public."EstadoVenta" OWNER TO postgres;

--
-- TOC entry 886 (class 1247 OID 26002)
-- Name: MetodoPago; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."MetodoPago" AS ENUM (
    'EFECTIVO',
    'YAPE',
    'PLIN',
    'TARJETA',
    'TRANSFERENCIA',
    'CREDITO',
    'MULTIPLE'
);


ALTER TYPE public."MetodoPago" OWNER TO postgres;

--
-- TOC entry 880 (class 1247 OID 25988)
-- Name: Rol; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Rol" AS ENUM (
    'ADMIN',
    'CAJERO',
    'VENDEDOR'
);


ALTER TYPE public."Rol" OWNER TO postgres;

--
-- TOC entry 883 (class 1247 OID 25996)
-- Name: TipoCliente; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TipoCliente" AS ENUM (
    'CONTADO',
    'CREDITO'
);


ALTER TYPE public."TipoCliente" OWNER TO postgres;

--
-- TOC entry 895 (class 1247 OID 26032)
-- Name: TipoMovimiento; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TipoMovimiento" AS ENUM (
    'INGRESO',
    'EGRESO'
);


ALTER TYPE public."TipoMovimiento" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 246 (class 1259 OID 26241)
-- Name: bitacora; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bitacora (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    accion text NOT NULL,
    modulo text NOT NULL,
    fecha timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    detalles text
);


ALTER TABLE public.bitacora OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 26240)
-- Name: bitacora_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bitacora_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bitacora_id_seq OWNER TO postgres;

--
-- TOC entry 5217 (class 0 OID 0)
-- Dependencies: 245
-- Name: bitacora_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bitacora_id_seq OWNED BY public.bitacora.id;


--
-- TOC entry 236 (class 1259 OID 26167)
-- Name: caja; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.caja (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    fecha_apertura timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_cierre timestamp(3) without time zone,
    monto_inicial numeric(10,2) NOT NULL,
    monto_final numeric(10,2),
    diferencia numeric(10,2),
    estado public."EstadoCaja" DEFAULT 'ABIERTA'::public."EstadoCaja" NOT NULL,
    observaciones text
);


ALTER TABLE public.caja OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 26166)
-- Name: caja_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.caja_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.caja_id_seq OWNER TO postgres;

--
-- TOC entry 5218 (class 0 OID 0)
-- Dependencies: 235
-- Name: caja_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.caja_id_seq OWNED BY public.caja.id;


--
-- TOC entry 222 (class 1259 OID 26057)
-- Name: categorias; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categorias (
    id integer NOT NULL,
    nombre text NOT NULL,
    descripcion text
);


ALTER TABLE public.categorias OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 26056)
-- Name: categorias_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categorias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categorias_id_seq OWNER TO postgres;

--
-- TOC entry 5219 (class 0 OID 0)
-- Dependencies: 221
-- Name: categorias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categorias_id_seq OWNED BY public.categorias.id;


--
-- TOC entry 230 (class 1259 OID 26118)
-- Name: clientes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clientes (
    id integer NOT NULL,
    dni_ruc text,
    nombres text NOT NULL,
    apellidos text,
    telefono text,
    direccion text,
    tipo public."TipoCliente" DEFAULT 'CONTADO'::public."TipoCliente" NOT NULL,
    limite_credito numeric(10,2),
    saldo_pendiente numeric(10,2) DEFAULT 0 NOT NULL
);


ALTER TABLE public.clientes OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 26117)
-- Name: clientes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.clientes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clientes_id_seq OWNER TO postgres;

--
-- TOC entry 5220 (class 0 OID 0)
-- Dependencies: 229
-- Name: clientes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.clientes_id_seq OWNED BY public.clientes.id;


--
-- TOC entry 240 (class 1259 OID 26199)
-- Name: compras; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.compras (
    id integer NOT NULL,
    proveedor_id integer NOT NULL,
    fecha timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    total numeric(10,2) NOT NULL,
    numero_factura text
);


ALTER TABLE public.compras OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 26198)
-- Name: compras_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.compras_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.compras_id_seq OWNER TO postgres;

--
-- TOC entry 5221 (class 0 OID 0)
-- Dependencies: 239
-- Name: compras_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.compras_id_seq OWNED BY public.compras.id;


--
-- TOC entry 247 (class 1259 OID 26340)
-- Name: configuracion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.configuracion (
    id integer DEFAULT 1 NOT NULL,
    nombre_botica text DEFAULT 'Botica J&M'::text NOT NULL,
    lema text DEFAULT '¡Tu salud es nuestra prioridad!'::text,
    ruc text,
    direccion text,
    telefono text,
    correo text,
    pie_pagina_ticket text DEFAULT 'Gracias por su preferencia.'::text,
    dias_vencimiento_alerta integer DEFAULT 30 NOT NULL,
    backup_frecuencia_dias integer DEFAULT 1 NOT NULL,
    backup_habilitado boolean DEFAULT false NOT NULL,
    backup_hora text DEFAULT '03:00'::text NOT NULL,
    backup_ruta text,
    ultimo_backup timestamp(3) without time zone
);


ALTER TABLE public.configuracion OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 26213)
-- Name: detalle_compras; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detalle_compras (
    id integer NOT NULL,
    compra_id integer NOT NULL,
    producto_id integer NOT NULL,
    cantidad integer NOT NULL,
    precio_costo numeric(10,2) NOT NULL,
    lote text,
    vencimiento timestamp(3) without time zone
);


ALTER TABLE public.detalle_compras OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 26212)
-- Name: detalle_compras_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.detalle_compras_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.detalle_compras_id_seq OWNER TO postgres;

--
-- TOC entry 5222 (class 0 OID 0)
-- Dependencies: 241
-- Name: detalle_compras_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.detalle_compras_id_seq OWNED BY public.detalle_compras.id;


--
-- TOC entry 234 (class 1259 OID 26154)
-- Name: detalle_ventas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detalle_ventas (
    id integer NOT NULL,
    venta_id integer NOT NULL,
    producto_id integer NOT NULL,
    cantidad integer NOT NULL,
    precio_unitario numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    es_unidad boolean DEFAULT false NOT NULL
);


ALTER TABLE public.detalle_ventas OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 26153)
-- Name: detalle_ventas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.detalle_ventas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.detalle_ventas_id_seq OWNER TO postgres;

--
-- TOC entry 5223 (class 0 OID 0)
-- Dependencies: 233
-- Name: detalle_ventas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.detalle_ventas_id_seq OWNED BY public.detalle_ventas.id;


--
-- TOC entry 228 (class 1259 OID 26101)
-- Name: lotes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lotes (
    id integer NOT NULL,
    producto_id integer NOT NULL,
    codigo_lote text NOT NULL,
    fecha_vencimiento timestamp(3) without time zone NOT NULL,
    stock_inicial integer NOT NULL,
    stock_actual integer NOT NULL,
    fecha_ingreso timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.lotes OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 26100)
-- Name: lotes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lotes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lotes_id_seq OWNER TO postgres;

--
-- TOC entry 5224 (class 0 OID 0)
-- Dependencies: 227
-- Name: lotes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lotes_id_seq OWNED BY public.lotes.id;


--
-- TOC entry 238 (class 1259 OID 26183)
-- Name: movimientos_caja; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.movimientos_caja (
    id integer NOT NULL,
    caja_id integer NOT NULL,
    tipo public."TipoMovimiento" NOT NULL,
    monto numeric(10,2) NOT NULL,
    descripcion text NOT NULL,
    fecha timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.movimientos_caja OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 26182)
-- Name: movimientos_caja_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.movimientos_caja_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.movimientos_caja_id_seq OWNER TO postgres;

--
-- TOC entry 5225 (class 0 OID 0)
-- Dependencies: 237
-- Name: movimientos_caja_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.movimientos_caja_id_seq OWNED BY public.movimientos_caja.id;


--
-- TOC entry 244 (class 1259 OID 26227)
-- Name: pagos_creditos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pagos_creditos (
    id integer NOT NULL,
    cliente_id integer NOT NULL,
    monto numeric(10,2) NOT NULL,
    fecha timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    observacion text
);


ALTER TABLE public.pagos_creditos OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 26226)
-- Name: pagos_creditos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pagos_creditos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pagos_creditos_id_seq OWNER TO postgres;

--
-- TOC entry 5226 (class 0 OID 0)
-- Dependencies: 243
-- Name: pagos_creditos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pagos_creditos_id_seq OWNED BY public.pagos_creditos.id;


--
-- TOC entry 226 (class 1259 OID 26080)
-- Name: productos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.productos (
    id integer NOT NULL,
    codigo text NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    categoria_id integer NOT NULL,
    proveedor_id integer,
    precio_compra numeric(10,2) NOT NULL,
    precio_venta numeric(10,2) NOT NULL,
    stock_actual integer DEFAULT 0 NOT NULL,
    stock_minimo integer DEFAULT 5 NOT NULL,
    estado boolean DEFAULT true NOT NULL,
    es_fraccionable boolean DEFAULT false NOT NULL,
    precio_unidad numeric(10,2),
    unidades_por_caja integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.productos OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 26079)
-- Name: productos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.productos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.productos_id_seq OWNER TO postgres;

--
-- TOC entry 5227 (class 0 OID 0)
-- Dependencies: 225
-- Name: productos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.productos_id_seq OWNED BY public.productos.id;


--
-- TOC entry 224 (class 1259 OID 26068)
-- Name: proveedores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.proveedores (
    id integer NOT NULL,
    ruc text NOT NULL,
    nombre text NOT NULL,
    telefono text,
    correo text,
    direccion text
);


ALTER TABLE public.proveedores OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 26067)
-- Name: proveedores_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.proveedores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.proveedores_id_seq OWNER TO postgres;

--
-- TOC entry 5228 (class 0 OID 0)
-- Dependencies: 223
-- Name: proveedores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.proveedores_id_seq OWNED BY public.proveedores.id;


--
-- TOC entry 220 (class 1259 OID 26038)
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nombre text NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    rol public."Rol" DEFAULT 'CAJERO'::public."Rol" NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    fecha_creacion timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 26037)
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_seq OWNER TO postgres;

--
-- TOC entry 5229 (class 0 OID 0)
-- Dependencies: 219
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- TOC entry 232 (class 1259 OID 26133)
-- Name: ventas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ventas (
    id integer NOT NULL,
    codigo_venta text NOT NULL,
    usuario_id integer NOT NULL,
    cliente_id integer,
    fecha timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    descuento numeric(10,2) DEFAULT 0 NOT NULL,
    total numeric(10,2) NOT NULL,
    metodo_pago public."MetodoPago" NOT NULL,
    estado public."EstadoVenta" DEFAULT 'COMPLETADO'::public."EstadoVenta" NOT NULL,
    monto_pagado numeric(10,2),
    fecha_limite timestamp(3) without time zone
);


ALTER TABLE public.ventas OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 26132)
-- Name: ventas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ventas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ventas_id_seq OWNER TO postgres;

--
-- TOC entry 5230 (class 0 OID 0)
-- Dependencies: 231
-- Name: ventas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ventas_id_seq OWNED BY public.ventas.id;


--
-- TOC entry 4976 (class 2604 OID 26244)
-- Name: bitacora id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bitacora ALTER COLUMN id SET DEFAULT nextval('public.bitacora_id_seq'::regclass);


--
-- TOC entry 4966 (class 2604 OID 26170)
-- Name: caja id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.caja ALTER COLUMN id SET DEFAULT nextval('public.caja_id_seq'::regclass);


--
-- TOC entry 4947 (class 2604 OID 26060)
-- Name: categorias id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias ALTER COLUMN id SET DEFAULT nextval('public.categorias_id_seq'::regclass);


--
-- TOC entry 4957 (class 2604 OID 26121)
-- Name: clientes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes ALTER COLUMN id SET DEFAULT nextval('public.clientes_id_seq'::regclass);


--
-- TOC entry 4971 (class 2604 OID 26202)
-- Name: compras id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compras ALTER COLUMN id SET DEFAULT nextval('public.compras_id_seq'::regclass);


--
-- TOC entry 4973 (class 2604 OID 26216)
-- Name: detalle_compras id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_compras ALTER COLUMN id SET DEFAULT nextval('public.detalle_compras_id_seq'::regclass);


--
-- TOC entry 4964 (class 2604 OID 26157)
-- Name: detalle_ventas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_ventas ALTER COLUMN id SET DEFAULT nextval('public.detalle_ventas_id_seq'::regclass);


--
-- TOC entry 4955 (class 2604 OID 26104)
-- Name: lotes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lotes ALTER COLUMN id SET DEFAULT nextval('public.lotes_id_seq'::regclass);


--
-- TOC entry 4969 (class 2604 OID 26186)
-- Name: movimientos_caja id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientos_caja ALTER COLUMN id SET DEFAULT nextval('public.movimientos_caja_id_seq'::regclass);


--
-- TOC entry 4974 (class 2604 OID 26230)
-- Name: pagos_creditos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pagos_creditos ALTER COLUMN id SET DEFAULT nextval('public.pagos_creditos_id_seq'::regclass);


--
-- TOC entry 4949 (class 2604 OID 26083)
-- Name: productos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos ALTER COLUMN id SET DEFAULT nextval('public.productos_id_seq'::regclass);


--
-- TOC entry 4948 (class 2604 OID 26071)
-- Name: proveedores id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proveedores ALTER COLUMN id SET DEFAULT nextval('public.proveedores_id_seq'::regclass);


--
-- TOC entry 4943 (class 2604 OID 26041)
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- TOC entry 4960 (class 2604 OID 26136)
-- Name: ventas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ventas ALTER COLUMN id SET DEFAULT nextval('public.ventas_id_seq'::regclass);


--
-- TOC entry 5210 (class 0 OID 26241)
-- Dependencies: 246
-- Data for Name: bitacora; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bitacora (id, usuario_id, accion, modulo, fecha, detalles) FROM stdin;
\.


--
-- TOC entry 5200 (class 0 OID 26167)
-- Dependencies: 236
-- Data for Name: caja; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.caja (id, usuario_id, fecha_apertura, fecha_cierre, monto_inicial, monto_final, diferencia, estado, observaciones) FROM stdin;
1	1	2026-01-29 20:19:52.972	2026-02-02 23:29:13.429	50.00	185.30	-50.00	CERRADA	
2	1	2026-02-02 23:39:58.072	\N	100.00	\N	\N	ABIERTA	\N
\.


--
-- TOC entry 5186 (class 0 OID 26057)
-- Dependencies: 222
-- Data for Name: categorias; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categorias (id, nombre, descripcion) FROM stdin;
1	Medicamentos	Medicamentos generales
2	Vitaminas	Suplementos vitamínicos
3	Cuidado Personal	Productos de higiene y cuidado
4	Bebés	Productos para bebés
5	Primeros Auxilios	Botiquín y emergencias
\.


--
-- TOC entry 5194 (class 0 OID 26118)
-- Dependencies: 230
-- Data for Name: clientes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clientes (id, dni_ruc, nombres, apellidos, telefono, direccion, tipo, limite_credito, saldo_pendiente) FROM stdin;
1	12345678	Juan	Pérez García	987654321	Av. Principal 456	CREDITO	500.00	10.00
2	45475149	elvis	velasquez	937578894	jr salaverry 1078-celendin	CREDITO	1000.00	30.00
4	12345677	Joseph	Chavez	99999	jr salaverry 1078-celendinds	CREDITO	200.00	8.00
\.


--
-- TOC entry 5204 (class 0 OID 26199)
-- Dependencies: 240
-- Data for Name: compras; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.compras (id, proveedor_id, fecha, total, numero_factura) FROM stdin;
\.


--
-- TOC entry 5211 (class 0 OID 26340)
-- Dependencies: 247
-- Data for Name: configuracion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.configuracion (id, nombre_botica, lema, ruc, direccion, telefono, correo, pie_pagina_ticket, dias_vencimiento_alerta, backup_frecuencia_dias, backup_habilitado, backup_hora, backup_ruta, ultimo_backup) FROM stdin;
1	Botica J&M	¡Tu salud es nuestra prioridad!	10454751499	jr salaverry 1078-celendin	937578894	sivel8882@gmail.com	Gracias por su preferencia.	30	1	f	03:00	C:\\Users\\ELVIS\\Botica_JM	\N
\.


--
-- TOC entry 5206 (class 0 OID 26213)
-- Dependencies: 242
-- Data for Name: detalle_compras; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.detalle_compras (id, compra_id, producto_id, cantidad, precio_costo, lote, vencimiento) FROM stdin;
\.


--
-- TOC entry 5198 (class 0 OID 26154)
-- Dependencies: 234
-- Data for Name: detalle_ventas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.detalle_ventas (id, venta_id, producto_id, cantidad, precio_unitario, subtotal, es_unidad) FROM stdin;
1	1	8	1	18.00	18.00	f
2	2	4	1	15.00	15.00	f
3	3	5	1	45.00	45.00	f
4	4	3	1	0.50	0.50	t
5	5	3	1	0.50	0.50	t
6	6	3	3	0.50	1.50	t
7	7	3	2	0.50	1.00	t
8	8	1	2	25.00	50.00	f
40	40	8	1	18.00	18.00	f
41	40	7	1	6.00	6.00	f
42	40	6	1	8.00	8.00	f
43	40	10	4	0.20	0.80	t
44	41	3	6	0.50	3.00	t
45	41	8	1	18.00	18.00	f
46	42	5	1	45.00	45.00	f
47	43	4	1	15.00	15.00	f
48	44	6	1	8.00	8.00	f
\.


--
-- TOC entry 5192 (class 0 OID 26101)
-- Dependencies: 228
-- Data for Name: lotes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lotes (id, producto_id, codigo_lote, fecha_vencimiento, stock_inicial, stock_actual, fecha_ingreso) FROM stdin;
1	9	L-001	2026-01-31 00:00:00	0	0	2026-01-29 21:49:27.916
2	3	L-001	2026-02-05 00:00:00	23	23	2026-01-29 21:50:14.125
3	10	L-001	2026-04-30 00:00:00	4	4	2026-02-02 23:20:34.87
4	10	L-2026	2026-12-30 00:00:00	50	50	2026-02-03 03:49:55.707
\.


--
-- TOC entry 5202 (class 0 OID 26183)
-- Dependencies: 238
-- Data for Name: movimientos_caja; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.movimientos_caja (id, caja_id, tipo, monto, descripcion, fecha) FROM stdin;
\.


--
-- TOC entry 5208 (class 0 OID 26227)
-- Dependencies: 244
-- Data for Name: pagos_creditos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pagos_creditos (id, cliente_id, monto, fecha, observacion) FROM stdin;
1	1	5.00	2026-01-29 21:59:09.207	pago parcial
2	4	20.00	2026-02-02 23:27:36.956	yape
3	4	10.00	2026-02-02 23:27:53.512	yape
4	2	20.00	2026-02-03 03:34:47.235	\N
5	4	10.00	2026-02-03 03:42:36.675	\N
6	4	5.80	2026-02-03 03:42:48.146	\N
\.


--
-- TOC entry 5190 (class 0 OID 26080)
-- Dependencies: 226
-- Data for Name: productos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.productos (id, codigo, nombre, descripcion, categoria_id, proveedor_id, precio_compra, precio_venta, stock_actual, stock_minimo, estado, es_fraccionable, precio_unidad, unidades_por_caja) FROM stdin;
2	7751234567891	Ibuprofeno 400mg	Tabletas x 50	1	1	12.00	20.00	30	10	t	f	\N	1
9	dede	xxvvk	dsfsfk	1	\N	3.00	4.00	0	5	f	f	\N	1
1	7751234567890	Paracetamol 500mg	Tabletas x 100	1	1	15.00	25.00	48	10	t	f	\N	1
7	7751234567896	Algodón 100g	Bolsa	3	1	3.00	6.00	44	10	t	f	\N	1
3	7751234567892	Amoxicilina 500mg	Cápsulas x 21	1	1	18.00	32.00	12	5	t	t	0.50	21
8	7751234567897	Omeprazol 20mg	Cápsulas x 14	1	1	10.00	18.00	32	8	t	f	\N	1
5	7751234567894	Multivitamínico	Tabletas x 30	2	1	25.00	45.00	18	5	t	f	\N	1
4	7751234567893	Vitamina C 1000mg	Tabletas efervescentes x 10	2	1	8.00	15.00	38	10	t	f	\N	1
6	7751234567895	Alcohol 70%	Frasco 250ml	3	1	4.00	8.00	59	15	t	f	\N	1
10	45	paracetamol 500 mg	caja DE 100 unidades	1	\N	6.00	7.00	50	5	t	t	0.20	100
\.


--
-- TOC entry 5188 (class 0 OID 26068)
-- Dependencies: 224
-- Data for Name: proveedores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.proveedores (id, ruc, nombre, telefono, correo, direccion) FROM stdin;
1	20123456789	Distribuidora Farmacéutica S.A.	01-555-1234	ventas@distrifarm.com	Av. Industrial 123, Lima
\.


--
-- TOC entry 5184 (class 0 OID 26038)
-- Dependencies: 220
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id, nombre, username, password, rol, activo, fecha_creacion) FROM stdin;
1	Administrador	admin	$2b$10$dyDpz4yHb97QN9VPmrca4ephzIZegc0aPmSfLGJGDsVUhk0cnRiCO	ADMIN	t	2026-01-20 14:37:58.508
2	Cajero Principal	cajero	$2b$10$CVmPlntz6hKoXu.q6c6ElO/1GI52e4PoLRHO6sFVQhpZ6cuzJCOwi	CAJERO	t	2026-01-20 14:37:58.662
3	ELVIS SILVA VELASQUEZ	ELVIS	$2b$10$cXmZlTXEngZ2Yg8LhZNRQ.uwIt4kMabEfKQJVu0pi4iyfpz86AClK	VENDEDOR	t	2026-01-30 02:06:45.418
\.


--
-- TOC entry 5196 (class 0 OID 26133)
-- Dependencies: 232
-- Data for Name: ventas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ventas (id, codigo_venta, usuario_id, cliente_id, fecha, subtotal, descuento, total, metodo_pago, estado, monto_pagado, fecha_limite) FROM stdin;
1	VTA-1769718023076-988	1	1	2026-01-29 20:20:23.08	18.00	0.00	18.00	EFECTIVO	COMPLETADO	18.00	\N
2	VTA-1769718072704-570	1	1	2026-01-29 20:21:12.705	15.00	0.00	15.00	CREDITO	COMPLETADO	15.00	\N
3	VTA-1769719330601-516	1	\N	2026-01-29 20:42:10.603	45.00	0.00	45.00	YAPE	COMPLETADO	45.00	\N
4	VTA-1769722330674-449	1	\N	2026-01-29 21:32:10.676	0.50	0.00	0.50	EFECTIVO	COMPLETADO	0.50	\N
5	VTA-1769722767890-425	1	\N	2026-01-29 21:39:27.892	0.50	0.00	0.50	YAPE	COMPLETADO	0.50	\N
6	VTA-1769723842061-650	1	\N	2026-01-29 21:57:22.145	1.50	0.00	1.50	EFECTIVO	COMPLETADO	1.50	\N
7	VTA-1770073664486-299	1	\N	2026-02-02 23:07:44.491	1.00	0.00	1.00	EFECTIVO	COMPLETADO	1.00	\N
8	VTA-1770073724301-261	1	2	2026-02-02 23:08:44.303	50.00	0.00	50.00	CREDITO	COMPLETADO	50.00	\N
40	VTA-1770074720711-976	1	4	2026-02-02 23:25:20.715	32.80	0.00	32.80	CREDITO	COMPLETADO	32.80	\N
41	VTA-1770074754567-972	1	4	2026-02-02 23:25:54.569	21.00	0.00	21.00	CREDITO	COMPLETADO	21.00	\N
42	VTA-1770075651803-736	1	\N	2026-02-02 23:40:51.804	45.00	0.00	45.00	YAPE	COMPLETADO	45.00	\N
43	VTA-1770075664628-698	1	\N	2026-02-02 23:41:04.63	15.00	0.00	15.00	YAPE	COMPLETADO	15.00	\N
44	VTA-1770075671789-213	1	\N	2026-02-02 23:41:11.79	8.00	0.00	8.00	YAPE	ANULADO	8.00	\N
\.


--
-- TOC entry 5231 (class 0 OID 0)
-- Dependencies: 245
-- Name: bitacora_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bitacora_id_seq', 1, false);


--
-- TOC entry 5232 (class 0 OID 0)
-- Dependencies: 235
-- Name: caja_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.caja_id_seq', 2, true);


--
-- TOC entry 5233 (class 0 OID 0)
-- Dependencies: 221
-- Name: categorias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categorias_id_seq', 5, true);


--
-- TOC entry 5234 (class 0 OID 0)
-- Dependencies: 229
-- Name: clientes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.clientes_id_seq', 4, true);


--
-- TOC entry 5235 (class 0 OID 0)
-- Dependencies: 239
-- Name: compras_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.compras_id_seq', 1, false);


--
-- TOC entry 5236 (class 0 OID 0)
-- Dependencies: 241
-- Name: detalle_compras_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.detalle_compras_id_seq', 1, false);


--
-- TOC entry 5237 (class 0 OID 0)
-- Dependencies: 233
-- Name: detalle_ventas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.detalle_ventas_id_seq', 48, true);


--
-- TOC entry 5238 (class 0 OID 0)
-- Dependencies: 227
-- Name: lotes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lotes_id_seq', 4, true);


--
-- TOC entry 5239 (class 0 OID 0)
-- Dependencies: 237
-- Name: movimientos_caja_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.movimientos_caja_id_seq', 1, false);


--
-- TOC entry 5240 (class 0 OID 0)
-- Dependencies: 243
-- Name: pagos_creditos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pagos_creditos_id_seq', 6, true);


--
-- TOC entry 5241 (class 0 OID 0)
-- Dependencies: 225
-- Name: productos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.productos_id_seq', 10, true);


--
-- TOC entry 5242 (class 0 OID 0)
-- Dependencies: 223
-- Name: proveedores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.proveedores_id_seq', 1, true);


--
-- TOC entry 5243 (class 0 OID 0)
-- Dependencies: 219
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 3, true);


--
-- TOC entry 5244 (class 0 OID 0)
-- Dependencies: 231
-- Name: ventas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ventas_id_seq', 44, true);


--
-- TOC entry 5019 (class 2606 OID 26254)
-- Name: bitacora bitacora_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bitacora
    ADD CONSTRAINT bitacora_pkey PRIMARY KEY (id);


--
-- TOC entry 5009 (class 2606 OID 26181)
-- Name: caja caja_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.caja
    ADD CONSTRAINT caja_pkey PRIMARY KEY (id);


--
-- TOC entry 4991 (class 2606 OID 26066)
-- Name: categorias categorias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_pkey PRIMARY KEY (id);


--
-- TOC entry 5002 (class 2606 OID 26131)
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);


--
-- TOC entry 5013 (class 2606 OID 26211)
-- Name: compras compras_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compras
    ADD CONSTRAINT compras_pkey PRIMARY KEY (id);


--
-- TOC entry 5021 (class 2606 OID 26352)
-- Name: configuracion configuracion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.configuracion
    ADD CONSTRAINT configuracion_pkey PRIMARY KEY (id);


--
-- TOC entry 5015 (class 2606 OID 26225)
-- Name: detalle_compras detalle_compras_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_compras
    ADD CONSTRAINT detalle_compras_pkey PRIMARY KEY (id);


--
-- TOC entry 5007 (class 2606 OID 26165)
-- Name: detalle_ventas detalle_ventas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_ventas
    ADD CONSTRAINT detalle_ventas_pkey PRIMARY KEY (id);


--
-- TOC entry 4999 (class 2606 OID 26116)
-- Name: lotes lotes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lotes
    ADD CONSTRAINT lotes_pkey PRIMARY KEY (id);


--
-- TOC entry 5011 (class 2606 OID 26197)
-- Name: movimientos_caja movimientos_caja_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientos_caja
    ADD CONSTRAINT movimientos_caja_pkey PRIMARY KEY (id);


--
-- TOC entry 5017 (class 2606 OID 26239)
-- Name: pagos_creditos pagos_creditos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pagos_creditos
    ADD CONSTRAINT pagos_creditos_pkey PRIMARY KEY (id);


--
-- TOC entry 4997 (class 2606 OID 26099)
-- Name: productos productos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_pkey PRIMARY KEY (id);


--
-- TOC entry 4993 (class 2606 OID 26078)
-- Name: proveedores proveedores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proveedores
    ADD CONSTRAINT proveedores_pkey PRIMARY KEY (id);


--
-- TOC entry 4987 (class 2606 OID 26055)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- TOC entry 5005 (class 2606 OID 26152)
-- Name: ventas ventas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ventas
    ADD CONSTRAINT ventas_pkey PRIMARY KEY (id);


--
-- TOC entry 4989 (class 1259 OID 26256)
-- Name: categorias_nombre_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX categorias_nombre_key ON public.categorias USING btree (nombre);


--
-- TOC entry 5000 (class 1259 OID 26259)
-- Name: clientes_dni_ruc_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX clientes_dni_ruc_key ON public.clientes USING btree (dni_ruc);


--
-- TOC entry 4995 (class 1259 OID 26258)
-- Name: productos_codigo_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX productos_codigo_key ON public.productos USING btree (codigo);


--
-- TOC entry 4994 (class 1259 OID 26257)
-- Name: proveedores_ruc_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX proveedores_ruc_key ON public.proveedores USING btree (ruc);


--
-- TOC entry 4988 (class 1259 OID 26255)
-- Name: usuarios_username_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX usuarios_username_key ON public.usuarios USING btree (username);


--
-- TOC entry 5003 (class 1259 OID 26260)
-- Name: ventas_codigo_venta_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ventas_codigo_venta_key ON public.ventas USING btree (codigo_venta);


--
-- TOC entry 5035 (class 2606 OID 26326)
-- Name: bitacora bitacora_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bitacora
    ADD CONSTRAINT bitacora_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5029 (class 2606 OID 26296)
-- Name: caja caja_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.caja
    ADD CONSTRAINT caja_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5031 (class 2606 OID 26306)
-- Name: compras compras_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compras
    ADD CONSTRAINT compras_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5032 (class 2606 OID 26311)
-- Name: detalle_compras detalle_compras_compra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_compras
    ADD CONSTRAINT detalle_compras_compra_id_fkey FOREIGN KEY (compra_id) REFERENCES public.compras(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5033 (class 2606 OID 26316)
-- Name: detalle_compras detalle_compras_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_compras
    ADD CONSTRAINT detalle_compras_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5027 (class 2606 OID 26291)
-- Name: detalle_ventas detalle_ventas_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_ventas
    ADD CONSTRAINT detalle_ventas_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5028 (class 2606 OID 26286)
-- Name: detalle_ventas detalle_ventas_venta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_ventas
    ADD CONSTRAINT detalle_ventas_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES public.ventas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5024 (class 2606 OID 26271)
-- Name: lotes lotes_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lotes
    ADD CONSTRAINT lotes_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5030 (class 2606 OID 26301)
-- Name: movimientos_caja movimientos_caja_caja_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientos_caja
    ADD CONSTRAINT movimientos_caja_caja_id_fkey FOREIGN KEY (caja_id) REFERENCES public.caja(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5034 (class 2606 OID 26321)
-- Name: pagos_creditos pagos_creditos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pagos_creditos
    ADD CONSTRAINT pagos_creditos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5022 (class 2606 OID 26261)
-- Name: productos productos_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5023 (class 2606 OID 26266)
-- Name: productos productos_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5025 (class 2606 OID 26276)
-- Name: ventas ventas_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ventas
    ADD CONSTRAINT ventas_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5026 (class 2606 OID 26281)
-- Name: ventas ventas_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ventas
    ADD CONSTRAINT ventas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT;


-- Completed on 2026-02-02 23:29:26

--
-- PostgreSQL database dump complete
--

\unrestrict UfeKv6VRhwVovWIG8tBOpyIjZGTiqg9VoFaCo6VKkIcacGGvl6r2qMTJPZ2T307

