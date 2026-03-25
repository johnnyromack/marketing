CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'user',
    'gestor',
    'editor',
    'leitor'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;


--
-- Name: has_any_role(uuid, public.app_role[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_any_role(_user_id uuid, _roles public.app_role[]) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = ANY(_roles)
  )
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    action text NOT NULL,
    table_name text NOT NULL,
    record_id uuid,
    details jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: brindes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.brindes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    marca text NOT NULL,
    unidade text DEFAULT 'Geral'::text NOT NULL,
    descricao text NOT NULL,
    categoria text NOT NULL,
    fornecedor text,
    mes text NOT NULL,
    mes_numero integer NOT NULL,
    ano integer NOT NULL,
    quantidade integer DEFAULT 0 NOT NULL,
    valor_unitario numeric DEFAULT 0 NOT NULL,
    valor_orcado numeric DEFAULT 0 NOT NULL,
    valor_realizado numeric DEFAULT 0 NOT NULL,
    observacoes text,
    user_id uuid NOT NULL,
    status text DEFAULT 'rascunho'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: evento_custos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evento_custos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    evento_id uuid NOT NULL,
    tipo_custo text NOT NULL,
    descricao text NOT NULL,
    valor_orcado numeric DEFAULT 0 NOT NULL,
    valor_realizado numeric DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: eventos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.eventos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    marca text NOT NULL,
    unidade text DEFAULT 'Geral'::text NOT NULL,
    nome_evento text NOT NULL,
    data_evento date NOT NULL,
    categoria text NOT NULL,
    mes text NOT NULL,
    mes_numero integer NOT NULL,
    ano integer NOT NULL,
    orcamento_evento numeric DEFAULT 0 NOT NULL,
    observacoes text,
    user_id uuid NOT NULL,
    status text DEFAULT 'rascunho'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    endereco text,
    latitude numeric,
    longitude numeric
);


--
-- Name: fornecedores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fornecedores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    tipo text NOT NULL,
    cnpj text,
    contato text,
    email text,
    telefone text,
    observacoes text,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: marcas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.marcas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: midia_off; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.midia_off (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    marca text NOT NULL,
    unidade text DEFAULT 'Geral'::text NOT NULL,
    localizacao text NOT NULL,
    tipo_midia text NOT NULL,
    fornecedor text,
    mes text NOT NULL,
    mes_numero integer NOT NULL,
    ano integer NOT NULL,
    orcamento_off numeric DEFAULT 0 NOT NULL,
    valor_midia numeric DEFAULT 0 NOT NULL,
    valor_realizado numeric DEFAULT 0 NOT NULL,
    saving_midia numeric DEFAULT 0 NOT NULL,
    valor_producao numeric DEFAULT 0 NOT NULL,
    realizado_producao numeric DEFAULT 0 NOT NULL,
    saving_producao numeric DEFAULT 0 NOT NULL,
    observacoes text,
    user_id uuid NOT NULL,
    status text DEFAULT 'rascunho'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    latitude numeric,
    longitude numeric,
    data_contratacao date,
    data_veiculacao_inicio date,
    data_veiculacao_fim date,
    bonificacao boolean DEFAULT false NOT NULL
);


--
-- Name: midia_on; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.midia_on (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    marca text NOT NULL,
    unidade text DEFAULT 'Geral'::text NOT NULL,
    fornecedor text NOT NULL,
    mes text NOT NULL,
    mes_numero integer NOT NULL,
    ano integer NOT NULL,
    orcamento_on numeric DEFAULT 0 NOT NULL,
    valor_midia numeric DEFAULT 0 NOT NULL,
    valor_realizado numeric DEFAULT 0 NOT NULL,
    diario numeric DEFAULT 0 NOT NULL,
    observacoes text,
    user_id uuid NOT NULL,
    status text DEFAULT 'rascunho'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: orcamentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orcamentos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ano integer NOT NULL,
    mes_numero integer NOT NULL,
    mes text NOT NULL,
    marca text NOT NULL,
    unidade text,
    tipo text NOT NULL,
    valor_orcado numeric DEFAULT 0 NOT NULL,
    verba_extra numeric DEFAULT 0 NOT NULL,
    observacoes text,
    status text DEFAULT 'rascunho'::text NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    orcamento_campanha numeric DEFAULT 0 NOT NULL,
    orcamento_ano_vigente numeric DEFAULT 0 NOT NULL,
    orcamento_ano_seguinte numeric DEFAULT 0 NOT NULL,
    ano_vigente integer,
    ano_seguinte integer,
    CONSTRAINT orcamentos_status_check CHECK ((status = ANY (ARRAY['rascunho'::text, 'pendente'::text, 'aprovado'::text, 'rejeitado'::text]))),
    CONSTRAINT orcamentos_tipo_check CHECK ((tipo = ANY (ARRAY['midia_on'::text, 'midia_off'::text, 'eventos'::text, 'brindes'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text,
    full_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: publicidade_dados; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.publicidade_dados (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    month text NOT NULL,
    month_number integer NOT NULL,
    year integer NOT NULL,
    marca text NOT NULL,
    unidade text DEFAULT 'Matriz'::text NOT NULL,
    leads_real integer DEFAULT 0 NOT NULL,
    leads_orcado integer DEFAULT 0 NOT NULL,
    leads_a1 integer DEFAULT 0 NOT NULL,
    cac_real numeric(10,2) DEFAULT 0 NOT NULL,
    cac_orcado numeric(10,2) DEFAULT 0 NOT NULL,
    cac_a1 numeric(10,2) DEFAULT 0 NOT NULL,
    cpl_real numeric(10,2) DEFAULT 0 NOT NULL,
    cpl_orcado numeric(10,2) DEFAULT 0 NOT NULL,
    cpl_a1 numeric(10,2) DEFAULT 0 NOT NULL,
    cpl_prod_real numeric(10,2) DEFAULT 0 NOT NULL,
    cpl_prod_orcado numeric(10,2) DEFAULT 0 NOT NULL,
    cpl_prod_a1 numeric(10,2) DEFAULT 0 NOT NULL,
    invest_meta numeric(12,2) DEFAULT 0 NOT NULL,
    invest_google numeric(12,2) DEFAULT 0 NOT NULL,
    invest_off numeric(12,2) DEFAULT 0 NOT NULL,
    invest_eventos numeric(12,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    status text DEFAULT 'rascunho'::text NOT NULL,
    matriculas_real integer DEFAULT 0 NOT NULL,
    matriculas_orcado integer DEFAULT 0 NOT NULL,
    matriculas_a1 integer DEFAULT 0 NOT NULL,
    leads_prod_real integer DEFAULT 0 NOT NULL,
    leads_prod_orcado integer DEFAULT 0 NOT NULL,
    leads_prod_a1 integer DEFAULT 0 NOT NULL,
    num_eventos integer DEFAULT 0 NOT NULL,
    leads_eventos integer DEFAULT 0 NOT NULL,
    CONSTRAINT publicidade_dados_month_number_check CHECK (((month_number >= 1) AND (month_number <= 12))),
    CONSTRAINT publicidade_dados_year_check CHECK (((year >= 2020) AND (year <= 2100))),
    CONSTRAINT valid_status CHECK ((status = ANY (ARRAY['rascunho'::text, 'pendente'::text, 'aprovado'::text])))
);


--
-- Name: unidades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unidades (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    marca_id uuid NOT NULL,
    nome text NOT NULL,
    orcamento_proprio boolean DEFAULT false NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    endereco text,
    latitude numeric,
    longitude numeric
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'user'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    gestor_id uuid,
    must_change_password boolean DEFAULT false NOT NULL
);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: brindes brindes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brindes
    ADD CONSTRAINT brindes_pkey PRIMARY KEY (id);


--
-- Name: evento_custos evento_custos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evento_custos
    ADD CONSTRAINT evento_custos_pkey PRIMARY KEY (id);


--
-- Name: eventos eventos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eventos
    ADD CONSTRAINT eventos_pkey PRIMARY KEY (id);


--
-- Name: fornecedores fornecedores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fornecedores
    ADD CONSTRAINT fornecedores_pkey PRIMARY KEY (id);


--
-- Name: marcas marcas_nome_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marcas
    ADD CONSTRAINT marcas_nome_key UNIQUE (nome);


--
-- Name: marcas marcas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marcas
    ADD CONSTRAINT marcas_pkey PRIMARY KEY (id);


--
-- Name: midia_off midia_off_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.midia_off
    ADD CONSTRAINT midia_off_pkey PRIMARY KEY (id);


--
-- Name: midia_on midia_on_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.midia_on
    ADD CONSTRAINT midia_on_pkey PRIMARY KEY (id);


--
-- Name: orcamentos orcamentos_ano_mes_numero_marca_unidade_tipo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_ano_mes_numero_marca_unidade_tipo_key UNIQUE (ano, mes_numero, marca, unidade, tipo);


--
-- Name: orcamentos orcamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: publicidade_dados publicidade_dados_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publicidade_dados
    ADD CONSTRAINT publicidade_dados_pkey PRIMARY KEY (id);


--
-- Name: publicidade_dados publicidade_dados_user_id_month_number_year_marca_unidade_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publicidade_dados
    ADD CONSTRAINT publicidade_dados_user_id_month_number_year_marca_unidade_key UNIQUE (user_id, month_number, year, marca, unidade);


--
-- Name: unidades unidades_marca_id_nome_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unidades
    ADD CONSTRAINT unidades_marca_id_nome_key UNIQUE (marca_id, nome);


--
-- Name: unidades unidades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unidades
    ADD CONSTRAINT unidades_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_activity_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activity_logs_created_at ON public.activity_logs USING btree (created_at DESC);


--
-- Name: idx_activity_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activity_logs_user_id ON public.activity_logs USING btree (user_id);


--
-- Name: idx_brindes_marca_ano_mes; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_brindes_marca_ano_mes ON public.brindes USING btree (marca, ano, mes_numero);


--
-- Name: idx_evento_custos_evento_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evento_custos_evento_id ON public.evento_custos USING btree (evento_id);


--
-- Name: idx_eventos_marca_ano_mes; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_eventos_marca_ano_mes ON public.eventos USING btree (marca, ano, mes_numero);


--
-- Name: idx_midia_off_coordinates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_midia_off_coordinates ON public.midia_off USING btree (latitude, longitude) WHERE ((latitude IS NOT NULL) AND (longitude IS NOT NULL));


--
-- Name: idx_midia_off_marca_ano_mes; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_midia_off_marca_ano_mes ON public.midia_off USING btree (marca, ano, mes_numero);


--
-- Name: idx_midia_on_marca_ano_mes; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_midia_on_marca_ano_mes ON public.midia_on USING btree (marca, ano, mes_numero);


--
-- Name: idx_user_roles_gestor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_gestor ON public.user_roles USING btree (gestor_id);


--
-- Name: idx_user_roles_must_change_password; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_must_change_password ON public.user_roles USING btree (user_id) WHERE (must_change_password = true);


--
-- Name: brindes update_brindes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_brindes_updated_at BEFORE UPDATE ON public.brindes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: evento_custos update_evento_custos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_evento_custos_updated_at BEFORE UPDATE ON public.evento_custos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: eventos update_eventos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_eventos_updated_at BEFORE UPDATE ON public.eventos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: fornecedores update_fornecedores_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_fornecedores_updated_at BEFORE UPDATE ON public.fornecedores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: marcas update_marcas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_marcas_updated_at BEFORE UPDATE ON public.marcas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: midia_off update_midia_off_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_midia_off_updated_at BEFORE UPDATE ON public.midia_off FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: midia_on update_midia_on_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_midia_on_updated_at BEFORE UPDATE ON public.midia_on FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: orcamentos update_orcamentos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_orcamentos_updated_at BEFORE UPDATE ON public.orcamentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: publicidade_dados update_publicidade_dados_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_publicidade_dados_updated_at BEFORE UPDATE ON public.publicidade_dados FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: unidades update_unidades_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_unidades_updated_at BEFORE UPDATE ON public.unidades FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: evento_custos evento_custos_evento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evento_custos
    ADD CONSTRAINT evento_custos_evento_id_fkey FOREIGN KEY (evento_id) REFERENCES public.eventos(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: publicidade_dados publicidade_dados_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publicidade_dados
    ADD CONSTRAINT publicidade_dados_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: unidades unidades_marca_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unidades
    ADD CONSTRAINT unidades_marca_id_fkey FOREIGN KEY (marca_id) REFERENCES public.marcas(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_gestor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_gestor_id_fkey FOREIGN KEY (gestor_id) REFERENCES auth.users(id);


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: marcas Admins and editors can delete marcas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and editors can delete marcas" ON public.marcas FOR DELETE USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'editor'::public.app_role]));


--
-- Name: unidades Admins and editors can delete unidades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and editors can delete unidades" ON public.unidades FOR DELETE USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'editor'::public.app_role]));


--
-- Name: marcas Admins and editors can insert marcas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and editors can insert marcas" ON public.marcas FOR INSERT WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'editor'::public.app_role]));


--
-- Name: unidades Admins and editors can insert unidades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and editors can insert unidades" ON public.unidades FOR INSERT WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'editor'::public.app_role]));


--
-- Name: marcas Admins and editors can update marcas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and editors can update marcas" ON public.marcas FOR UPDATE USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'editor'::public.app_role]));


--
-- Name: unidades Admins and editors can update unidades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and editors can update unidades" ON public.unidades FOR UPDATE USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'editor'::public.app_role]));


--
-- Name: user_roles Admins and gestors can insert roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and gestors can insert roles" ON public.user_roles FOR INSERT WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (public.has_role(auth.uid(), 'gestor'::public.app_role) AND (role = ANY (ARRAY['gestor'::public.app_role, 'editor'::public.app_role, 'leitor'::public.app_role])) AND (gestor_id = auth.uid()))));


--
-- Name: brindes Admins can delete any brindes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete any brindes" ON public.brindes FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: publicidade_dados Admins can delete any data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete any data" ON public.publicidade_dados FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: eventos Admins can delete any eventos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete any eventos" ON public.eventos FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: midia_off Admins can delete any midia_off; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete any midia_off" ON public.midia_off FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: midia_on Admins can delete any midia_on; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete any midia_on" ON public.midia_on FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: orcamentos Admins can delete any orcamentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete any orcamentos" ON public.orcamentos FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can delete roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: fornecedores Admins can delete suppliers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete suppliers" ON public.fornecedores FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: evento_custos Admins can manage all evento_custos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all evento_custos" ON public.evento_custos USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: brindes Admins can update any brindes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update any brindes" ON public.brindes FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: publicidade_dados Admins can update any data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update any data" ON public.publicidade_dados FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: eventos Admins can update any eventos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update any eventos" ON public.eventos FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: midia_off Admins can update any midia_off; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update any midia_off" ON public.midia_off FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: midia_on Admins can update any midia_on; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update any midia_on" ON public.midia_on FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: orcamentos Admins can update any orcamentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update any orcamentos" ON public.orcamentos FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can update roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: brindes Admins can view all brindes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all brindes" ON public.brindes FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: publicidade_dados Admins can view all data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all data" ON public.publicidade_dados FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: eventos Admins can view all eventos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all eventos" ON public.eventos FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: activity_logs Admins can view all logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all logs" ON public.activity_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: midia_off Admins can view all midia_off; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all midia_off" ON public.midia_off FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: midia_on Admins can view all midia_on; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all midia_on" ON public.midia_on FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: orcamentos Admins can view all orcamentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all orcamentos" ON public.orcamentos FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: fornecedores Admins, gestors and editors can insert suppliers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins, gestors and editors can insert suppliers" ON public.fornecedores FOR INSERT WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'gestor'::public.app_role, 'editor'::public.app_role]));


--
-- Name: fornecedores Admins, gestors and editors can update suppliers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins, gestors and editors can update suppliers" ON public.fornecedores FOR UPDATE USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'gestor'::public.app_role, 'editor'::public.app_role]));


--
-- Name: marcas Authenticated users can view active marcas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view active marcas" ON public.marcas FOR SELECT USING (true);


--
-- Name: unidades Authenticated users can view active unidades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view active unidades" ON public.unidades FOR SELECT USING (true);


--
-- Name: fornecedores Authenticated users can view suppliers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view suppliers" ON public.fornecedores FOR SELECT TO authenticated USING (true);


--
-- Name: brindes Gestors can approve brindes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Gestors can approve brindes" ON public.brindes FOR UPDATE USING (((status = 'pendente'::text) AND public.has_role(auth.uid(), 'gestor'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = brindes.user_id) AND (user_roles.gestor_id = auth.uid()))))));


--
-- Name: eventos Gestors can approve eventos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Gestors can approve eventos" ON public.eventos FOR UPDATE USING (((status = 'pendente'::text) AND public.has_role(auth.uid(), 'gestor'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = eventos.user_id) AND (user_roles.gestor_id = auth.uid()))))));


--
-- Name: midia_off Gestors can approve midia_off; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Gestors can approve midia_off" ON public.midia_off FOR UPDATE USING (((status = 'pendente'::text) AND public.has_role(auth.uid(), 'gestor'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = midia_off.user_id) AND (user_roles.gestor_id = auth.uid()))))));


--
-- Name: midia_on Gestors can approve midia_on; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Gestors can approve midia_on" ON public.midia_on FOR UPDATE USING (((status = 'pendente'::text) AND public.has_role(auth.uid(), 'gestor'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = midia_on.user_id) AND (user_roles.gestor_id = auth.uid()))))));


--
-- Name: orcamentos Gestors can approve orcamentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Gestors can approve orcamentos" ON public.orcamentos FOR UPDATE USING ((((status = 'pendente'::text) AND public.has_role(auth.uid(), 'gestor'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = orcamentos.user_id) AND (user_roles.gestor_id = auth.uid()))))) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: publicidade_dados Gestors can approve subordinates data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Gestors can approve subordinates data" ON public.publicidade_dados FOR UPDATE USING ((((status = 'pendente'::text) AND public.has_role(auth.uid(), 'gestor'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = publicidade_dados.user_id) AND (user_roles.gestor_id = auth.uid()))))) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: brindes Gestors can view pending brindes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Gestors can view pending brindes" ON public.brindes FOR SELECT USING (((status = 'pendente'::text) AND public.has_role(auth.uid(), 'gestor'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = brindes.user_id) AND (user_roles.gestor_id = auth.uid()))))));


--
-- Name: publicidade_dados Gestors can view pending data from subordinates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Gestors can view pending data from subordinates" ON public.publicidade_dados FOR SELECT USING ((((status = 'pendente'::text) AND public.has_role(auth.uid(), 'gestor'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = publicidade_dados.user_id) AND (user_roles.gestor_id = auth.uid()))))) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: eventos Gestors can view pending eventos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Gestors can view pending eventos" ON public.eventos FOR SELECT USING (((status = 'pendente'::text) AND public.has_role(auth.uid(), 'gestor'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = eventos.user_id) AND (user_roles.gestor_id = auth.uid()))))));


--
-- Name: midia_off Gestors can view pending midia_off; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Gestors can view pending midia_off" ON public.midia_off FOR SELECT USING (((status = 'pendente'::text) AND public.has_role(auth.uid(), 'gestor'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = midia_off.user_id) AND (user_roles.gestor_id = auth.uid()))))));


--
-- Name: midia_on Gestors can view pending midia_on; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Gestors can view pending midia_on" ON public.midia_on FOR SELECT USING (((status = 'pendente'::text) AND public.has_role(auth.uid(), 'gestor'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = midia_on.user_id) AND (user_roles.gestor_id = auth.uid()))))));


--
-- Name: orcamentos Gestors can view pending orcamentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Gestors can view pending orcamentos" ON public.orcamentos FOR SELECT USING ((((status = 'pendente'::text) AND public.has_role(auth.uid(), 'gestor'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = orcamentos.user_id) AND (user_roles.gestor_id = auth.uid()))))) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: user_roles Gestors can view subordinate roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Gestors can view subordinate roles" ON public.user_roles FOR SELECT USING ((public.has_role(auth.uid(), 'gestor'::public.app_role) AND (gestor_id = auth.uid())));


--
-- Name: activity_logs Gestors can view subordinates logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Gestors can view subordinates logs" ON public.activity_logs FOR SELECT USING ((public.has_role(auth.uid(), 'gestor'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = activity_logs.user_id) AND (user_roles.gestor_id = auth.uid()))))));


--
-- Name: brindes Leitores can view approved brindes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Leitores can view approved brindes" ON public.brindes FOR SELECT USING (((status = 'aprovado'::text) AND public.has_role(auth.uid(), 'leitor'::public.app_role)));


--
-- Name: eventos Leitores can view approved eventos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Leitores can view approved eventos" ON public.eventos FOR SELECT USING (((status = 'aprovado'::text) AND public.has_role(auth.uid(), 'leitor'::public.app_role)));


--
-- Name: midia_off Leitores can view approved midia_off; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Leitores can view approved midia_off" ON public.midia_off FOR SELECT USING (((status = 'aprovado'::text) AND public.has_role(auth.uid(), 'leitor'::public.app_role)));


--
-- Name: midia_on Leitores can view approved midia_on; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Leitores can view approved midia_on" ON public.midia_on FOR SELECT USING (((status = 'aprovado'::text) AND public.has_role(auth.uid(), 'leitor'::public.app_role)));


--
-- Name: orcamentos Leitores can view approved orcamentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Leitores can view approved orcamentos" ON public.orcamentos FOR SELECT USING (((status = 'aprovado'::text) AND public.has_role(auth.uid(), 'leitor'::public.app_role)));


--
-- Name: publicidade_dados Leitores can view approved publicidade_dados; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Leitores can view approved publicidade_dados" ON public.publicidade_dados FOR SELECT USING (((status = 'aprovado'::text) AND public.has_role(auth.uid(), 'leitor'::public.app_role)));


--
-- Name: evento_custos Users can delete evento_custos for their eventos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete evento_custos for their eventos" ON public.evento_custos FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.eventos
  WHERE ((eventos.id = evento_custos.evento_id) AND (eventos.user_id = auth.uid())))));


--
-- Name: brindes Users can delete their own brindes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own brindes" ON public.brindes FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: publicidade_dados Users can delete their own data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own data" ON public.publicidade_dados FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: eventos Users can delete their own eventos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own eventos" ON public.eventos FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: midia_off Users can delete their own midia_off; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own midia_off" ON public.midia_off FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: midia_on Users can delete their own midia_on; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own midia_on" ON public.midia_on FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: orcamentos Users can delete their own orcamentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own orcamentos" ON public.orcamentos FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: evento_custos Users can insert evento_custos for their eventos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert evento_custos for their eventos" ON public.evento_custos FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.eventos
  WHERE ((eventos.id = evento_custos.evento_id) AND (eventos.user_id = auth.uid())))));


--
-- Name: brindes Users can insert their own brindes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own brindes" ON public.brindes FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: publicidade_dados Users can insert their own data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own data" ON public.publicidade_dados FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: eventos Users can insert their own eventos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own eventos" ON public.eventos FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: activity_logs Users can insert their own logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own logs" ON public.activity_logs FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: midia_off Users can insert their own midia_off; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own midia_off" ON public.midia_off FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: midia_on Users can insert their own midia_on; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own midia_on" ON public.midia_on FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: orcamentos Users can insert their own orcamentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own orcamentos" ON public.orcamentos FOR INSERT WITH CHECK (((auth.uid() = user_id) AND public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'gestor'::public.app_role, 'editor'::public.app_role])));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: evento_custos Users can update evento_custos for their draft eventos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update evento_custos for their draft eventos" ON public.evento_custos FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.eventos
  WHERE ((eventos.id = evento_custos.evento_id) AND (eventos.user_id = auth.uid()) AND (eventos.status = ANY (ARRAY['rascunho'::text, 'pendente'::text]))))));


--
-- Name: brindes Users can update their own draft brindes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own draft brindes" ON public.brindes FOR UPDATE USING (((auth.uid() = user_id) AND (status = ANY (ARRAY['rascunho'::text, 'pendente'::text]))));


--
-- Name: publicidade_dados Users can update their own draft data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own draft data" ON public.publicidade_dados FOR UPDATE USING (((auth.uid() = user_id) AND (status = ANY (ARRAY['rascunho'::text, 'pendente'::text]))));


--
-- Name: eventos Users can update their own draft eventos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own draft eventos" ON public.eventos FOR UPDATE USING (((auth.uid() = user_id) AND (status = ANY (ARRAY['rascunho'::text, 'pendente'::text]))));


--
-- Name: midia_off Users can update their own draft midia_off; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own draft midia_off" ON public.midia_off FOR UPDATE USING (((auth.uid() = user_id) AND (status = ANY (ARRAY['rascunho'::text, 'pendente'::text]))));


--
-- Name: midia_on Users can update their own draft midia_on; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own draft midia_on" ON public.midia_on FOR UPDATE USING (((auth.uid() = user_id) AND (status = ANY (ARRAY['rascunho'::text, 'pendente'::text]))));


--
-- Name: orcamentos Users can update their own draft orcamentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own draft orcamentos" ON public.orcamentos FOR UPDATE USING (((auth.uid() = user_id) AND (status = ANY (ARRAY['rascunho'::text, 'pendente'::text]))));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: orcamentos Users can view approved orcamentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view approved orcamentos" ON public.orcamentos FOR SELECT USING ((status = 'aprovado'::text));


--
-- Name: evento_custos Users can view evento_custos for their eventos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view evento_custos for their eventos" ON public.evento_custos FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.eventos
  WHERE ((eventos.id = evento_custos.evento_id) AND (eventos.user_id = auth.uid())))));


--
-- Name: brindes Users can view their own brindes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own brindes" ON public.brindes FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: publicidade_dados Users can view their own data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own data" ON public.publicidade_dados FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: eventos Users can view their own eventos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own eventos" ON public.eventos FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: activity_logs Users can view their own logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own logs" ON public.activity_logs FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: midia_off Users can view their own midia_off; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own midia_off" ON public.midia_off FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: midia_on Users can view their own midia_on; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own midia_on" ON public.midia_on FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: orcamentos Users can view their own orcamentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own orcamentos" ON public.orcamentos FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: activity_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: brindes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.brindes ENABLE ROW LEVEL SECURITY;

--
-- Name: evento_custos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.evento_custos ENABLE ROW LEVEL SECURITY;

--
-- Name: eventos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;

--
-- Name: fornecedores; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

--
-- Name: marcas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.marcas ENABLE ROW LEVEL SECURITY;

--
-- Name: midia_off; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.midia_off ENABLE ROW LEVEL SECURITY;

--
-- Name: midia_on; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.midia_on ENABLE ROW LEVEL SECURITY;

--
-- Name: orcamentos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: publicidade_dados; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.publicidade_dados ENABLE ROW LEVEL SECURITY;

--
-- Name: unidades; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow gestors to view profiles of their subordinates
CREATE POLICY "Gestors can view subordinate profiles"
ON public.profiles
FOR SELECT
USING (
  public.has_role(auth.uid(), 'gestor'::app_role) 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = profiles.id 
    AND user_roles.gestor_id = auth.uid()
  )
);-- Insert profiles for existing users from user_roles that don't have profiles yet
INSERT INTO public.profiles (id, email, full_name)
SELECT 
  ur.user_id,
  COALESCE(
    (SELECT email FROM auth.users WHERE id = ur.user_id),
    'unknown@email.com'
  ),
  COALESCE(
    (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = ur.user_id),
    'Usuário'
  )
FROM public.user_roles ur
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = ur.user_id
);

-- Create or replace the trigger function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();-- Add column for "Anúncio Volante" (floating ads like sound cars, magazines, newspapers)
ALTER TABLE public.midia_off 
ADD COLUMN anuncio_volante BOOLEAN NOT NULL DEFAULT false;-- Criar tabela de tipos de custo
CREATE TABLE public.tipos_custo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tipos_custo ENABLE ROW LEVEL SECURITY;

-- Policies for tipos_custo
CREATE POLICY "Authenticated users can view tipos_custo"
ON public.tipos_custo FOR SELECT
USING (true);

CREATE POLICY "Admins and editors can insert tipos_custo"
ON public.tipos_custo FOR INSERT
WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'editor'::app_role]));

CREATE POLICY "Admins and editors can update tipos_custo"
ON public.tipos_custo FOR UPDATE
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'editor'::app_role]));

CREATE POLICY "Admins can delete tipos_custo"
ON public.tipos_custo FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Criar tabela de controle orçamentário
CREATE TABLE public.controle_orcamentario (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ano INTEGER NOT NULL,
  mes TEXT NOT NULL,
  mes_numero INTEGER NOT NULL,
  numero_chamado TEXT,
  fornecedor TEXT,
  descricao TEXT NOT NULL,
  marca TEXT NOT NULL,
  unidade TEXT DEFAULT 'Geral',
  status TEXT NOT NULL DEFAULT 'previsto',
  tipo_custo_id UUID REFERENCES public.tipos_custo(id),
  tipo_custo TEXT NOT NULL,
  valor NUMERIC NOT NULL DEFAULT 0,
  tipo_pagamento TEXT NOT NULL DEFAULT 'nota_fiscal',
  numero_documento TEXT,
  solicitante TEXT,
  data_solicitacao DATE,
  previsao_pagamento DATE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.controle_orcamentario ENABLE ROW LEVEL SECURITY;

-- Policies for controle_orcamentario
CREATE POLICY "Admins can view all controle_orcamentario"
ON public.controle_orcamentario FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own controle_orcamentario"
ON public.controle_orcamentario FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Gestors can view subordinates controle_orcamentario"
ON public.controle_orcamentario FOR SELECT
USING (has_role(auth.uid(), 'gestor'::app_role) AND EXISTS (
  SELECT 1 FROM user_roles WHERE user_roles.user_id = controle_orcamentario.user_id AND user_roles.gestor_id = auth.uid()
));

CREATE POLICY "Leitores can view approved controle_orcamentario"
ON public.controle_orcamentario FOR SELECT
USING (status = 'aprovado' AND has_role(auth.uid(), 'leitor'::app_role));

CREATE POLICY "Users can insert their own controle_orcamentario"
ON public.controle_orcamentario FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own controle_orcamentario"
ON public.controle_orcamentario FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any controle_orcamentario"
ON public.controle_orcamentario FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete their own controle_orcamentario"
ON public.controle_orcamentario FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any controle_orcamentario"
ON public.controle_orcamentario FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_controle_orcamentario_updated_at
BEFORE UPDATE ON public.controle_orcamentario
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tipos_custo_updated_at
BEFORE UPDATE ON public.tipos_custo
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default tipos de custo
INSERT INTO public.tipos_custo (nome, descricao) VALUES
('Agência', 'Custos com agências de publicidade e marketing'),
('Consultoria', 'Serviços de consultoria'),
('Tecnologia', 'Sistemas, softwares e infraestrutura'),
('Viagens', 'Despesas com viagens e deslocamentos'),
('Treinamento', 'Capacitação e desenvolvimento'),
('Material', 'Materiais diversos'),
('Outros', 'Outros custos não categorizados');-- Limpar dados de teste de orçamentos
DELETE FROM orcamentos;

-- Criar tabela de campanhas (registro mestre)
CREATE TABLE public.campanhas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  marca TEXT NOT NULL,
  unidade TEXT DEFAULT NULL,
  orcamento_total NUMERIC NOT NULL DEFAULT 0,
  mes_inicio INTEGER NOT NULL,
  ano_inicio INTEGER NOT NULL,
  mes_fim INTEGER NOT NULL,
  ano_fim INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'rascunho',
  observacoes TEXT DEFAULT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de distribuição por tipo de mídia
CREATE TABLE public.campanha_midia_distribuicao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campanha_id UUID NOT NULL REFERENCES public.campanhas(id) ON DELETE CASCADE,
  tipo_midia TEXT NOT NULL, -- midia_on, midia_off, eventos, brindes
  valor_alocado NUMERIC NOT NULL DEFAULT 0,
  observacoes TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campanha_id, tipo_midia)
);

-- Criar tabela de distribuição mensal (opcional por tipo de mídia)
CREATE TABLE public.campanha_mensal_distribuicao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  distribuicao_id UUID NOT NULL REFERENCES public.campanha_midia_distribuicao(id) ON DELETE CASCADE,
  mes INTEGER NOT NULL,
  ano INTEGER NOT NULL,
  valor_alocado NUMERIC NOT NULL DEFAULT 0,
  verba_extra NUMERIC NOT NULL DEFAULT 0,
  observacoes TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(distribuicao_id, mes, ano)
);

-- Enable RLS
ALTER TABLE public.campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campanha_midia_distribuicao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campanha_mensal_distribuicao ENABLE ROW LEVEL SECURITY;

-- Políticas para campanhas
CREATE POLICY "Users can insert their own campanhas" ON public.campanhas 
FOR INSERT WITH CHECK (auth.uid() = user_id AND has_any_role(auth.uid(), ARRAY['admin', 'gestor', 'editor']::app_role[]));

CREATE POLICY "Users can view their own campanhas" ON public.campanhas 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own draft campanhas" ON public.campanhas 
FOR UPDATE USING (auth.uid() = user_id AND status IN ('rascunho', 'pendente'));

CREATE POLICY "Users can delete their own campanhas" ON public.campanhas 
FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all campanhas" ON public.campanhas 
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update any campanhas" ON public.campanhas 
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete any campanhas" ON public.campanhas 
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Gestors can view pending campanhas" ON public.campanhas 
FOR SELECT USING (
  status = 'pendente' AND 
  has_role(auth.uid(), 'gestor'::app_role) AND 
  EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = campanhas.user_id AND user_roles.gestor_id = auth.uid())
);

CREATE POLICY "Gestors can approve campanhas" ON public.campanhas 
FOR UPDATE USING (
  status = 'pendente' AND 
  has_role(auth.uid(), 'gestor'::app_role) AND 
  EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = campanhas.user_id AND user_roles.gestor_id = auth.uid())
);

CREATE POLICY "Leitores can view approved campanhas" ON public.campanhas 
FOR SELECT USING (status = 'aprovado' AND has_role(auth.uid(), 'leitor'::app_role));

CREATE POLICY "Users can view approved campanhas" ON public.campanhas 
FOR SELECT USING (status = 'aprovado');

-- Políticas para distribuição de mídia (baseadas na campanha pai)
CREATE POLICY "Users can manage their campanha midia" ON public.campanha_midia_distribuicao 
FOR ALL USING (EXISTS (SELECT 1 FROM campanhas WHERE campanhas.id = campanha_midia_distribuicao.campanha_id AND campanhas.user_id = auth.uid()));

CREATE POLICY "Admins can manage all campanha midia" ON public.campanha_midia_distribuicao 
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view approved campanha midia" ON public.campanha_midia_distribuicao 
FOR SELECT USING (EXISTS (SELECT 1 FROM campanhas WHERE campanhas.id = campanha_midia_distribuicao.campanha_id AND campanhas.status = 'aprovado'));

-- Políticas para distribuição mensal (baseadas na distribuição pai)
CREATE POLICY "Users can manage their mensal distribuicao" ON public.campanha_mensal_distribuicao 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM campanha_midia_distribuicao cmd 
    JOIN campanhas c ON c.id = cmd.campanha_id 
    WHERE cmd.id = campanha_mensal_distribuicao.distribuicao_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all mensal distribuicao" ON public.campanha_mensal_distribuicao 
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view approved mensal distribuicao" ON public.campanha_mensal_distribuicao 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM campanha_midia_distribuicao cmd 
    JOIN campanhas c ON c.id = cmd.campanha_id 
    WHERE cmd.id = campanha_mensal_distribuicao.distribuicao_id AND c.status = 'aprovado'
  )
);

-- Triggers for updated_at
CREATE TRIGGER update_campanhas_updated_at BEFORE UPDATE ON public.campanhas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campanha_midia_distribuicao_updated_at BEFORE UPDATE ON public.campanha_midia_distribuicao
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campanha_mensal_distribuicao_updated_at BEFORE UPDATE ON public.campanha_mensal_distribuicao
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();-- Adicionar campo tipo_orcamento à tabela tipos_custo
-- Valores possíveis: 'proprio' ou 'compartilhado'
ALTER TABLE public.tipos_custo 
ADD COLUMN tipo_orcamento TEXT NOT NULL DEFAULT 'proprio' 
CHECK (tipo_orcamento IN ('proprio', 'compartilhado'));-- Create table for monthly distribution of area budgets
CREATE TABLE public.orcamento_area_distribuicao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano INTEGER NOT NULL,
  valor_orcado NUMERIC NOT NULL DEFAULT 0,
  verba_extra NUMERIC NOT NULL DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(orcamento_id, mes, ano)
);

-- Enable RLS
ALTER TABLE public.orcamento_area_distribuicao ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their orcamento_area_distribuicao"
ON public.orcamento_area_distribuicao
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orcamentos o
    WHERE o.id = orcamento_id AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all orcamento_area_distribuicao"
ON public.orcamento_area_distribuicao
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert their orcamento_area_distribuicao"
ON public.orcamento_area_distribuicao
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orcamentos o
    WHERE o.id = orcamento_id AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can insert any orcamento_area_distribuicao"
ON public.orcamento_area_distribuicao
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update their orcamento_area_distribuicao"
ON public.orcamento_area_distribuicao
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM orcamentos o
    WHERE o.id = orcamento_id AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can update any orcamento_area_distribuicao"
ON public.orcamento_area_distribuicao
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete their orcamento_area_distribuicao"
ON public.orcamento_area_distribuicao
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM orcamentos o
    WHERE o.id = orcamento_id AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can delete any orcamento_area_distribuicao"
ON public.orcamento_area_distribuicao
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_orcamento_area_distribuicao_updated_at
BEFORE UPDATE ON public.orcamento_area_distribuicao
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();-- Fix Security Issues in RLS Policies

-- 1. FIX: fornecedores_contact_data_exposure
-- Change SELECT policy from "true" (all authenticated) to only admin/gestor/editor
DROP POLICY IF EXISTS "Authenticated users can view suppliers" ON fornecedores;

CREATE POLICY "Admins, gestors and editors can view suppliers" 
ON fornecedores 
FOR SELECT 
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'gestor'::app_role, 'editor'::app_role]));

-- 2. FIX: campanhas_budget_exposure
-- Remove the overly permissive "Users can view approved campanhas" policy
-- Only campaign owners, their gestors, leitores, and admins should see campaigns
DROP POLICY IF EXISTS "Users can view approved campanhas" ON campanhas;

-- Leitores already have a policy to view approved campaigns which is appropriate for their read-only role
-- The issue is the "Users can view approved campanhas" that allows ANY authenticated user to see all approved campaigns

-- 3. FIX: marcas_unrestricted_modification
-- Change DELETE policy to admin only (currently allows editors to delete)
DROP POLICY IF EXISTS "Admins and editors can delete marcas" ON marcas;

CREATE POLICY "Admins can delete marcas" 
ON marcas 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Also fix INSERT and UPDATE to include gestor role for consistency
DROP POLICY IF EXISTS "Admins and editors can insert marcas" ON marcas;
DROP POLICY IF EXISTS "Admins and editors can update marcas" ON marcas;

CREATE POLICY "Admins gestors and editors can insert marcas" 
ON marcas 
FOR INSERT 
WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'gestor'::app_role, 'editor'::app_role]));

CREATE POLICY "Admins gestors and editors can update marcas" 
ON marcas 
FOR UPDATE 
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'gestor'::app_role, 'editor'::app_role]));

-- 4. FIX: Similar issue with unidades table - editors can delete
DROP POLICY IF EXISTS "Admins and editors can delete unidades" ON unidades;

CREATE POLICY "Admins can delete unidades" 
ON unidades 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Also fix unidades INSERT and UPDATE to include gestor
DROP POLICY IF EXISTS "Admins and editors can insert unidades" ON unidades;
DROP POLICY IF EXISTS "Admins and editors can update unidades" ON unidades;

CREATE POLICY "Admins gestors and editors can insert unidades" 
ON unidades 
FOR INSERT 
WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'gestor'::app_role, 'editor'::app_role]));

CREATE POLICY "Admins gestors and editors can update unidades" 
ON unidades 
FOR UPDATE 
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'gestor'::app_role, 'editor'::app_role]));

-- 5. FIX: tipos_custo - same pattern, restrict delete to admin only
DROP POLICY IF EXISTS "Admins can delete tipos_custo" ON tipos_custo;

-- Already admin only, but let's also add gestor to insert/update for consistency
DROP POLICY IF EXISTS "Admins and editors can insert tipos_custo" ON tipos_custo;
DROP POLICY IF EXISTS "Admins and editors can update tipos_custo" ON tipos_custo;

CREATE POLICY "Admins can delete tipos_custo" 
ON tipos_custo 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins gestors and editors can insert tipos_custo" 
ON tipos_custo 
FOR INSERT 
WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'gestor'::app_role, 'editor'::app_role]));

CREATE POLICY "Admins gestors and editors can update tipos_custo" 
ON tipos_custo 
FOR UPDATE 
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'gestor'::app_role, 'editor'::app_role]));-- =====================================================
-- INTEGRAÇÃO META ADS E GOOGLE ADS
-- Tabelas para armazenar conexões OAuth e dados sincronizados
-- =====================================================

-- 1. Tabela de Integrações (conexões OAuth)
CREATE TABLE public.ads_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('meta', 'google')),
  account_id TEXT NOT NULL,
  account_name TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'error')),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform, account_id)
);

-- 2. Tabela de Campanhas Sincronizadas
CREATE TABLE public.ads_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID NOT NULL REFERENCES public.ads_integrations(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'UNKNOWN',
  objective TEXT,
  budget_daily NUMERIC DEFAULT 0,
  budget_lifetime NUMERIC DEFAULT 0,
  spend NUMERIC DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  cpc NUMERIC DEFAULT 0,
  cpm NUMERIC DEFAULT 0,
  start_date DATE,
  end_date DATE,
  marca TEXT,
  unidade TEXT,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(integration_id, external_id)
);

-- 3. Tabela de Anúncios/Criativos
CREATE TABLE public.ads_creatives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.ads_campaigns(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'UNKNOWN',
  format TEXT,
  preview_url TEXT,
  thumbnail_url TEXT,
  spend NUMERIC DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, external_id)
);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.ads_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads_creatives ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - ads_integrations
-- =====================================================

-- Users can view their own integrations
CREATE POLICY "Users can view their own integrations"
ON public.ads_integrations
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all integrations
CREATE POLICY "Admins can view all integrations"
ON public.ads_integrations
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Users can insert their own integrations
CREATE POLICY "Users can insert their own integrations"
ON public.ads_integrations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own integrations
CREATE POLICY "Users can update their own integrations"
ON public.ads_integrations
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can update any integration
CREATE POLICY "Admins can update any integration"
ON public.ads_integrations
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Users can delete their own integrations
CREATE POLICY "Users can delete their own integrations"
ON public.ads_integrations
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can delete any integration
CREATE POLICY "Admins can delete any integration"
ON public.ads_integrations
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- RLS POLICIES - ads_campaigns
-- =====================================================

-- Users can view campaigns from their integrations
CREATE POLICY "Users can view their campaigns"
ON public.ads_campaigns
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ads_integrations
    WHERE ads_integrations.id = ads_campaigns.integration_id
    AND ads_integrations.user_id = auth.uid()
  )
);

-- Admins can view all campaigns
CREATE POLICY "Admins can view all campaigns"
ON public.ads_campaigns
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Users can insert campaigns for their integrations
CREATE POLICY "Users can insert their campaigns"
ON public.ads_campaigns
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ads_integrations
    WHERE ads_integrations.id = ads_campaigns.integration_id
    AND ads_integrations.user_id = auth.uid()
  )
);

-- Users can update campaigns from their integrations
CREATE POLICY "Users can update their campaigns"
ON public.ads_campaigns
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.ads_integrations
    WHERE ads_integrations.id = ads_campaigns.integration_id
    AND ads_integrations.user_id = auth.uid()
  )
);

-- Admins can update any campaign
CREATE POLICY "Admins can update any campaign"
ON public.ads_campaigns
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Users can delete campaigns from their integrations
CREATE POLICY "Users can delete their campaigns"
ON public.ads_campaigns
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.ads_integrations
    WHERE ads_integrations.id = ads_campaigns.integration_id
    AND ads_integrations.user_id = auth.uid()
  )
);

-- Admins can delete any campaign
CREATE POLICY "Admins can delete any campaign"
ON public.ads_campaigns
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- RLS POLICIES - ads_creatives
-- =====================================================

-- Users can view creatives from their campaigns
CREATE POLICY "Users can view their creatives"
ON public.ads_creatives
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ads_campaigns
    JOIN public.ads_integrations ON ads_integrations.id = ads_campaigns.integration_id
    WHERE ads_campaigns.id = ads_creatives.campaign_id
    AND ads_integrations.user_id = auth.uid()
  )
);

-- Admins can view all creatives
CREATE POLICY "Admins can view all creatives"
ON public.ads_creatives
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Users can insert creatives for their campaigns
CREATE POLICY "Users can insert their creatives"
ON public.ads_creatives
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ads_campaigns
    JOIN public.ads_integrations ON ads_integrations.id = ads_campaigns.integration_id
    WHERE ads_campaigns.id = ads_creatives.campaign_id
    AND ads_integrations.user_id = auth.uid()
  )
);

-- Users can update creatives from their campaigns
CREATE POLICY "Users can update their creatives"
ON public.ads_creatives
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.ads_campaigns
    JOIN public.ads_integrations ON ads_integrations.id = ads_campaigns.integration_id
    WHERE ads_campaigns.id = ads_creatives.campaign_id
    AND ads_integrations.user_id = auth.uid()
  )
);

-- Admins can update any creative
CREATE POLICY "Admins can update any creative"
ON public.ads_creatives
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Users can delete creatives from their campaigns
CREATE POLICY "Users can delete their creatives"
ON public.ads_creatives
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.ads_campaigns
    JOIN public.ads_integrations ON ads_integrations.id = ads_campaigns.integration_id
    WHERE ads_campaigns.id = ads_creatives.campaign_id
    AND ads_integrations.user_id = auth.uid()
  )
);

-- Admins can delete any creative
CREATE POLICY "Admins can delete any creative"
ON public.ads_creatives
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- TRIGGERS FOR updated_at
-- =====================================================

CREATE TRIGGER update_ads_integrations_updated_at
BEFORE UPDATE ON public.ads_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ads_campaigns_updated_at
BEFORE UPDATE ON public.ads_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ads_creatives_updated_at
BEFORE UPDATE ON public.ads_creatives
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_ads_integrations_user_id ON public.ads_integrations(user_id);
CREATE INDEX idx_ads_integrations_platform ON public.ads_integrations(platform);
CREATE INDEX idx_ads_integrations_status ON public.ads_integrations(status);
CREATE INDEX idx_ads_campaigns_integration_id ON public.ads_campaigns(integration_id);
CREATE INDEX idx_ads_campaigns_status ON public.ads_campaigns(status);
CREATE INDEX idx_ads_campaigns_marca ON public.ads_campaigns(marca);
CREATE INDEX idx_ads_creatives_campaign_id ON public.ads_creatives(campaign_id);-- Create RPC function for dashboard aggregated totals (publicidade)
CREATE OR REPLACE FUNCTION public.get_publicidade_totals(
  p_status text DEFAULT 'aprovado',
  p_marca text DEFAULT NULL,
  p_unidade text DEFAULT NULL,
  p_year_from int DEFAULT NULL,
  p_year_to int DEFAULT NULL,
  p_month_from int DEFAULT NULL,
  p_month_to int DEFAULT NULL
)
RETURNS TABLE (
  total_leads_real bigint,
  total_leads_orcado bigint,
  total_leads_a1 bigint,
  total_matriculas_real bigint,
  total_matriculas_orcado bigint,
  total_matriculas_a1 bigint,
  total_leads_prod_real bigint,
  total_leads_prod_orcado bigint,
  total_leads_prod_a1 bigint,
  avg_cac_real numeric,
  avg_cac_orcado numeric,
  avg_cac_a1 numeric,
  avg_cpl_real numeric,
  avg_cpl_orcado numeric,
  avg_cpl_a1 numeric,
  avg_cpl_prod_real numeric,
  avg_cpl_prod_orcado numeric,
  avg_cpl_prod_a1 numeric,
  total_invest_meta numeric,
  total_invest_google numeric,
  total_invest_off numeric,
  total_invest_eventos numeric,
  total_invest numeric,
  row_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(SUM(leads_real), 0)::bigint as total_leads_real,
    COALESCE(SUM(leads_orcado), 0)::bigint as total_leads_orcado,
    COALESCE(SUM(leads_a1), 0)::bigint as total_leads_a1,
    COALESCE(SUM(matriculas_real), 0)::bigint as total_matriculas_real,
    COALESCE(SUM(matriculas_orcado), 0)::bigint as total_matriculas_orcado,
    COALESCE(SUM(matriculas_a1), 0)::bigint as total_matriculas_a1,
    COALESCE(SUM(leads_prod_real), 0)::bigint as total_leads_prod_real,
    COALESCE(SUM(leads_prod_orcado), 0)::bigint as total_leads_prod_orcado,
    COALESCE(SUM(leads_prod_a1), 0)::bigint as total_leads_prod_a1,
    COALESCE(AVG(cac_real), 0)::numeric as avg_cac_real,
    COALESCE(AVG(cac_orcado), 0)::numeric as avg_cac_orcado,
    COALESCE(AVG(cac_a1), 0)::numeric as avg_cac_a1,
    COALESCE(AVG(cpl_real), 0)::numeric as avg_cpl_real,
    COALESCE(AVG(cpl_orcado), 0)::numeric as avg_cpl_orcado,
    COALESCE(AVG(cpl_a1), 0)::numeric as avg_cpl_a1,
    COALESCE(AVG(cpl_prod_real), 0)::numeric as avg_cpl_prod_real,
    COALESCE(AVG(cpl_prod_orcado), 0)::numeric as avg_cpl_prod_orcado,
    COALESCE(AVG(cpl_prod_a1), 0)::numeric as avg_cpl_prod_a1,
    COALESCE(SUM(invest_meta), 0)::numeric as total_invest_meta,
    COALESCE(SUM(invest_google), 0)::numeric as total_invest_google,
    COALESCE(SUM(invest_off), 0)::numeric as total_invest_off,
    COALESCE(SUM(invest_eventos), 0)::numeric as total_invest_eventos,
    COALESCE(SUM(invest_meta + invest_google + invest_off + invest_eventos), 0)::numeric as total_invest,
    COUNT(*)::bigint as row_count
  FROM public.publicidade_dados
  WHERE status = p_status
    AND (p_marca IS NULL OR marca = p_marca)
    AND (p_unidade IS NULL OR unidade = p_unidade)
    AND (p_year_from IS NULL OR year >= p_year_from)
    AND (p_year_to IS NULL OR year <= p_year_to)
    AND (p_month_from IS NULL OR month_number >= p_month_from)
    AND (p_month_to IS NULL OR month_number <= p_month_to);
$$;

-- Create RPC function to get all approved publicidade data without row limit
CREATE OR REPLACE FUNCTION public.get_all_publicidade_dados(
  p_status text DEFAULT 'aprovado'
)
RETURNS SETOF public.publicidade_dados
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.publicidade_dados
  WHERE status = p_status
  ORDER BY year, month_number;
$$;

-- Create RPC function for midia totals
CREATE OR REPLACE FUNCTION public.get_midia_totals(
  p_ano int DEFAULT NULL
)
RETURNS TABLE (
  tipo text,
  total_orcado numeric,
  total_realizado numeric,
  total_saving numeric,
  row_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    'midia_on' as tipo,
    COALESCE(SUM(orcamento_on), 0)::numeric as total_orcado,
    COALESCE(SUM(valor_realizado), 0)::numeric as total_realizado,
    COALESCE(SUM(orcamento_on - valor_realizado), 0)::numeric as total_saving,
    COUNT(*)::bigint as row_count
  FROM public.midia_on
  WHERE (p_ano IS NULL OR ano = p_ano)
  
  UNION ALL
  
  SELECT 
    'midia_off' as tipo,
    COALESCE(SUM(orcamento_off), 0)::numeric as total_orcado,
    COALESCE(SUM(valor_realizado), 0)::numeric as total_realizado,
    COALESCE(SUM(saving_midia + saving_producao), 0)::numeric as total_saving,
    COUNT(*)::bigint as row_count
  FROM public.midia_off
  WHERE (p_ano IS NULL OR ano = p_ano)
  
  UNION ALL
  
  SELECT 
    'eventos' as tipo,
    COALESCE(SUM(orcamento_evento), 0)::numeric as total_orcado,
    COALESCE(SUM(ec.valor_realizado), 0)::numeric as total_realizado,
    COALESCE(SUM(orcamento_evento) - SUM(ec.valor_realizado), 0)::numeric as total_saving,
    COUNT(DISTINCT e.id)::bigint as row_count
  FROM public.eventos e
  LEFT JOIN public.evento_custos ec ON ec.evento_id = e.id
  WHERE (p_ano IS NULL OR e.ano = p_ano)
  
  UNION ALL
  
  SELECT 
    'brindes' as tipo,
    COALESCE(SUM(valor_orcado), 0)::numeric as total_orcado,
    COALESCE(SUM(valor_realizado), 0)::numeric as total_realizado,
    COALESCE(SUM(valor_orcado - valor_realizado), 0)::numeric as total_saving,
    COUNT(*)::bigint as row_count
  FROM public.brindes
  WHERE (p_ano IS NULL OR ano = p_ano);
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_publicidade_totals TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_publicidade_dados TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_midia_totals TO authenticated;-- Create a secure view for user roles that hides hierarchy information from regular users
-- This view only exposes the minimum necessary data for non-admin users

CREATE OR REPLACE VIEW public.user_roles_safe
WITH (security_invoker = on) AS
SELECT 
  id,
  user_id,
  role,
  created_at,
  must_change_password,
  -- Only expose gestor_id to admins and the gestor themselves
  CASE 
    WHEN has_role(auth.uid(), 'admin') THEN gestor_id
    WHEN auth.uid() = gestor_id THEN gestor_id
    ELSE NULL
  END as gestor_id
FROM public.user_roles;

-- Grant access to the view
GRANT SELECT ON public.user_roles_safe TO authenticated;

-- Add comment explaining the view purpose
COMMENT ON VIEW public.user_roles_safe IS 'Secure view of user_roles that hides hierarchy (gestor_id) from unauthorized users to prevent organizational mapping attacks';-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view approved orcamentos" ON public.orcamentos;

-- Create more restrictive policy: users can only see their own budgets or if they are admin/gestor
CREATE POLICY "Users can view own or managed orcamentos"
ON public.orcamentos
FOR SELECT
TO authenticated
USING (
  -- Users can see their own budgets
  user_id = auth.uid()
  -- Admins can see all budgets
  OR public.has_role(auth.uid(), 'admin')
  -- Gestors can see budgets from their subordinates
  OR (
    public.has_role(auth.uid(), 'gestor')
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.gestor_id = auth.uid()
      AND user_roles.user_id = orcamentos.user_id
    )
  )
);-- ============================================================
-- Migration: Merge Ad Insights Hub into Publicidade Raiz
-- Date: 2026-03-17
-- Description: Adds platform integration tables, alert system,
--              brand knowledge, and RPC functions from Ad Insights Hub
-- ============================================================

-- 1. Add new columns to existing tables
ALTER TABLE marcas ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE marcas ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE marcas ADD COLUMN IF NOT EXISTS daily_budget numeric DEFAULT 0;
ALTER TABLE marcas ADD COLUMN IF NOT EXISTS manual_balance numeric DEFAULT 0;
ALTER TABLE marcas ADD COLUMN IF NOT EXISTS last_balance_update timestamptz;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- 2. New tables: Platform Accounts & Campaigns
CREATE TABLE IF NOT EXISTS platform_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marca_id uuid REFERENCES marcas(id) ON DELETE CASCADE,
  platform text NOT NULL,
  account_id text NOT NULL,
  account_name text NOT NULL,
  balance numeric DEFAULT 0,
  currency text DEFAULT 'BRL',
  status text DEFAULT 'active',
  last_sync_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS platform_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES platform_accounts(id) ON DELETE CASCADE,
  campaign_external_id text NOT NULL,
  name text NOT NULL,
  status text DEFAULT 'unknown',
  objective text,
  daily_budget numeric,
  lifetime_budget numeric,
  start_date text,
  end_date text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS platform_campaign_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES platform_campaigns(id) ON DELETE CASCADE,
  date date NOT NULL,
  impressions numeric DEFAULT 0,
  clicks numeric DEFAULT 0,
  spend numeric DEFAULT 0,
  conversions numeric DEFAULT 0,
  ctr numeric DEFAULT 0,
  cpc numeric DEFAULT 0,
  roas numeric DEFAULT 0,
  revenue numeric DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS platform_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES platform_campaigns(id) ON DELETE CASCADE,
  ad_external_id text NOT NULL,
  name text NOT NULL,
  status text,
  type text,
  headline text,
  description text,
  final_url text,
  preview_url text,
  thumbnail_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS platform_ad_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid REFERENCES platform_ads(id) ON DELETE CASCADE,
  date date NOT NULL,
  impressions numeric DEFAULT 0,
  clicks numeric DEFAULT 0,
  spend numeric DEFAULT 0,
  conversions numeric DEFAULT 0,
  ctr numeric DEFAULT 0,
  cpc numeric DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS platform_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES platform_campaigns(id) ON DELETE CASCADE,
  keyword_external_id text NOT NULL,
  keyword_text text NOT NULL,
  match_type text,
  status text,
  quality_score integer,
  ad_group_external_id text,
  ad_group_name text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS platform_keyword_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id uuid REFERENCES platform_keywords(id) ON DELETE CASCADE,
  date date NOT NULL,
  impressions numeric DEFAULT 0,
  clicks numeric DEFAULT 0,
  spend numeric DEFAULT 0,
  conversions numeric DEFAULT 0,
  ctr numeric DEFAULT 0,
  cpc numeric DEFAULT 0,
  average_position numeric DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 3. Budget & Knowledge tables
CREATE TABLE IF NOT EXISTS platform_brand_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marca_id uuid NOT NULL REFERENCES marcas(id) ON DELETE CASCADE,
  platform text NOT NULL,
  month text NOT NULL,
  budget_amount numeric DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS brand_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marca_id uuid NOT NULL REFERENCES marcas(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  source_type text DEFAULT 'manual',
  source_url text,
  file_name text,
  file_path text,
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 4. Alert system tables
CREATE TABLE IF NOT EXISTS alert_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  whatsapp text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS alert_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marca_id uuid REFERENCES marcas(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES alert_contacts(id) ON DELETE CASCADE,
  low_balance_threshold numeric DEFAULT 500,
  critical_balance_threshold numeric DEFAULT 100,
  projection_days integer DEFAULT 7,
  alert_low_balance boolean DEFAULT true,
  alert_critical_balance boolean DEFAULT true,
  alert_new_deposit boolean DEFAULT true,
  alert_projection boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS alert_schedule_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean DEFAULT true,
  start_time time DEFAULT '08:00',
  end_time time DEFAULT '18:00',
  allowed_days integer[] DEFAULT '{1,2,3,4,5}',
  timezone text DEFAULT 'America/Sao_Paulo',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS alert_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES platform_accounts(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES alert_contacts(id) ON DELETE SET NULL,
  alert_type text NOT NULL,
  channel text NOT NULL,
  message text,
  status text DEFAULT 'sent',
  sent_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS pending_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES platform_accounts(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  message_whatsapp text,
  message_email_subject text,
  message_email_html text,
  status text DEFAULT 'pending',
  scheduled_for timestamptz,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 5. API Configuration table
CREATE TABLE IF NOT EXISTS api_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text NOT NULL UNIQUE,
  config_value text,
  description text,
  is_configured boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 6. Unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_accounts_unique ON platform_accounts(platform, account_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_campaigns_unique ON platform_campaigns(account_id, campaign_external_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_ads_unique ON platform_ads(campaign_id, ad_external_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_keywords_unique ON platform_keywords(campaign_id, keyword_external_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_metrics_unique ON platform_campaign_metrics(campaign_id, date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ad_metrics_unique ON platform_ad_metrics(ad_id, date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_keyword_metrics_unique ON platform_keyword_metrics(keyword_id, date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_brand_budgets_unique ON platform_brand_budgets(marca_id, platform, month);

-- 7. Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'platform_accounts', 'platform_campaigns', 'platform_ads',
    'platform_keywords', 'platform_brand_budgets', 'brand_knowledge',
    'alert_contacts', 'alert_settings', 'alert_schedule_settings', 'api_configurations'
  ])
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS update_%s_updated_at ON %I; CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      tbl, tbl, tbl, tbl
    );
  END LOOP;
END $$;

-- 8. Enable RLS on all new tables
ALTER TABLE platform_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_campaign_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_ad_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_keyword_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_brand_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_schedule_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_configurations ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies (following Publicidade Raiz patterns)
-- Read: all authenticated users; Write: admin, gestor, editor

-- Helper: create standard CRUD policies for a table
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'platform_accounts', 'platform_campaigns', 'platform_campaign_metrics',
    'platform_ads', 'platform_ad_metrics', 'platform_keywords', 'platform_keyword_metrics',
    'platform_brand_budgets', 'brand_knowledge',
    'alert_contacts', 'alert_settings', 'alert_schedule_settings',
    'alert_logs', 'pending_alerts'
  ])
  LOOP
    -- SELECT: any authenticated user
    EXECUTE format(
      'CREATE POLICY "Authenticated users can view %s" ON %I FOR SELECT TO authenticated USING (true);',
      tbl, tbl
    );
    -- INSERT: admin, gestor, editor
    EXECUTE format(
      'CREATE POLICY "Admin/gestor/editor can insert %s" ON %I FOR INSERT TO authenticated WITH CHECK (
        has_role(auth.uid(), ''admin''::app_role) OR
        has_role(auth.uid(), ''gestor''::app_role) OR
        has_role(auth.uid(), ''editor''::app_role)
      );',
      tbl, tbl
    );
    -- UPDATE: admin, gestor, editor
    EXECUTE format(
      'CREATE POLICY "Admin/gestor/editor can update %s" ON %I FOR UPDATE TO authenticated USING (
        has_role(auth.uid(), ''admin''::app_role) OR
        has_role(auth.uid(), ''gestor''::app_role) OR
        has_role(auth.uid(), ''editor''::app_role)
      );',
      tbl, tbl
    );
    -- DELETE: admin only
    EXECUTE format(
      'CREATE POLICY "Admin can delete %s" ON %I FOR DELETE TO authenticated USING (
        has_role(auth.uid(), ''admin''::app_role)
      );',
      tbl, tbl
    );
  END LOOP;
END $$;

-- api_configurations: admin only for write
CREATE POLICY "Authenticated users can view api_configurations" ON api_configurations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can insert api_configurations" ON api_configurations FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin can update api_configurations" ON api_configurations FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin can delete api_configurations" ON api_configurations FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 10. RPC Functions for metrics aggregation

CREATE OR REPLACE FUNCTION get_campaign_stats(
  p_brand_id uuid DEFAULT NULL,
  p_from_date text DEFAULT NULL,
  p_platform text DEFAULT NULL,
  p_to_date text DEFAULT NULL
)
RETURNS TABLE(total bigint, active bigint, paused bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint as total,
    COUNT(*) FILTER (WHERE pc.status = 'ENABLED' OR pc.status = 'ACTIVE')::bigint as active,
    COUNT(*) FILTER (WHERE pc.status = 'PAUSED')::bigint as paused
  FROM platform_campaigns pc
  JOIN platform_accounts pa ON pc.account_id = pa.id
  WHERE (p_brand_id IS NULL OR pa.marca_id = p_brand_id)
    AND (p_platform IS NULL OR pa.platform = p_platform);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_ad_stats(
  p_brand_id uuid DEFAULT NULL,
  p_from_date text DEFAULT NULL,
  p_platform text DEFAULT NULL,
  p_to_date text DEFAULT NULL
)
RETURNS TABLE(total bigint, active bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint as total,
    COUNT(*) FILTER (WHERE pad.status = 'ENABLED' OR pad.status = 'ACTIVE')::bigint as active
  FROM platform_ads pad
  JOIN platform_campaigns pc ON pad.campaign_id = pc.id
  JOIN platform_accounts pa ON pc.account_id = pa.id
  WHERE (p_brand_id IS NULL OR pa.marca_id = p_brand_id)
    AND (p_platform IS NULL OR pa.platform = p_platform);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_daily_metrics(
  p_brand_id uuid DEFAULT NULL,
  p_from_date date DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_platform text DEFAULT NULL,
  p_to_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  metric_date date,
  total_impressions numeric,
  total_clicks numeric,
  total_spend numeric,
  total_conversions numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cm.date as metric_date,
    COALESCE(SUM(cm.impressions), 0) as total_impressions,
    COALESCE(SUM(cm.clicks), 0) as total_clicks,
    COALESCE(SUM(cm.spend), 0) as total_spend,
    COALESCE(SUM(cm.conversions), 0) as total_conversions
  FROM platform_campaign_metrics cm
  JOIN platform_campaigns pc ON cm.campaign_id = pc.id
  JOIN platform_accounts pa ON pc.account_id = pa.id
  WHERE cm.date BETWEEN p_from_date AND p_to_date
    AND (p_brand_id IS NULL OR pa.marca_id = p_brand_id)
    AND (p_platform IS NULL OR pa.platform = p_platform)
  GROUP BY cm.date
  ORDER BY cm.date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_period_metrics(
  p_brand_id uuid DEFAULT NULL,
  p_from_date date DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_platform text DEFAULT NULL,
  p_to_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  total_impressions numeric,
  total_clicks numeric,
  total_spend numeric,
  total_conversions numeric,
  total_revenue numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(cm.impressions), 0) as total_impressions,
    COALESCE(SUM(cm.clicks), 0) as total_clicks,
    COALESCE(SUM(cm.spend), 0) as total_spend,
    COALESCE(SUM(cm.conversions), 0) as total_conversions,
    COALESCE(SUM(cm.revenue), 0) as total_revenue
  FROM platform_campaign_metrics cm
  JOIN platform_campaigns pc ON cm.campaign_id = pc.id
  JOIN platform_accounts pa ON pc.account_id = pa.id
  WHERE cm.date BETWEEN p_from_date AND p_to_date
    AND (p_brand_id IS NULL OR pa.marca_id = p_brand_id)
    AND (p_platform IS NULL OR pa.platform = p_platform);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Insert default API configuration keys
INSERT INTO api_configurations (config_key, description) VALUES
  ('GOOGLE_ADS_DEVELOPER_TOKEN', 'Token de desenvolvedor do Google Ads'),
  ('GOOGLE_ADS_CLIENT_ID', 'Client ID OAuth do Google Ads'),
  ('GOOGLE_ADS_CLIENT_SECRET', 'Client Secret OAuth do Google Ads'),
  ('META_APP_ID', 'App ID do Meta/Facebook'),
  ('META_APP_SECRET', 'App Secret do Meta/Facebook'),
  ('TIKTOK_APP_ID', 'App ID do TikTok Business'),
  ('TIKTOK_APP_SECRET', 'App Secret do TikTok Business'),
  ('ZAPI_INSTANCE_ID', 'ID da instância Z-API (WhatsApp)'),
  ('ZAPI_TOKEN', 'Token Z-API (WhatsApp)'),
  ('RESEND_API_KEY', 'API Key do Resend (Email)'),
  ('FIRECRAWL_API_KEY', 'API Key do Firecrawl (Web Scraping)'),
  ('ANTHROPIC_API_KEY', 'API Key da Anthropic (Claude)')
ON CONFLICT (config_key) DO NOTHING;
