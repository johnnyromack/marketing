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




COMMIT;