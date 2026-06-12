


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


CREATE SCHEMA IF NOT EXISTS "evolution_v4";


ALTER SCHEMA "evolution_v4" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "evolution_v4"."DeviceMessage" AS ENUM (
    'ios',
    'android',
    'web',
    'unknown',
    'desktop'
);


ALTER TYPE "evolution_v4"."DeviceMessage" OWNER TO "postgres";


CREATE TYPE "evolution_v4"."DifyBotType" AS ENUM (
    'chatBot',
    'textGenerator',
    'agent',
    'workflow'
);


ALTER TYPE "evolution_v4"."DifyBotType" OWNER TO "postgres";


CREATE TYPE "evolution_v4"."InstanceConnectionStatus" AS ENUM (
    'open',
    'close',
    'connecting'
);


ALTER TYPE "evolution_v4"."InstanceConnectionStatus" OWNER TO "postgres";


CREATE TYPE "evolution_v4"."OpenaiBotType" AS ENUM (
    'assistant',
    'chatCompletion'
);


ALTER TYPE "evolution_v4"."OpenaiBotType" OWNER TO "postgres";


CREATE TYPE "evolution_v4"."SessionStatus" AS ENUM (
    'opened',
    'closed',
    'paused'
);


ALTER TYPE "evolution_v4"."SessionStatus" OWNER TO "postgres";


CREATE TYPE "evolution_v4"."TriggerOperator" AS ENUM (
    'contains',
    'equals',
    'startsWith',
    'endsWith',
    'regex'
);


ALTER TYPE "evolution_v4"."TriggerOperator" OWNER TO "postgres";


CREATE TYPE "evolution_v4"."TriggerType" AS ENUM (
    'all',
    'keyword',
    'none',
    'advanced'
);


ALTER TYPE "evolution_v4"."TriggerType" OWNER TO "postgres";


CREATE TYPE "public"."condicao_saude" AS ENUM (
    'HIPERTENSO',
    'DIABETICO',
    'AMBOS',
    'NENHUM'
);


ALTER TYPE "public"."condicao_saude" OWNER TO "postgres";


CREATE TYPE "public"."funcao_usuario" AS ENUM (
    'ADMIN',
    'RECEPCAO',
    'ACS'
);


ALTER TYPE "public"."funcao_usuario" OWNER TO "postgres";


CREATE TYPE "public"."status_telefone" AS ENUM (
    'VALIDO',
    'INVALIDO',
    'PENDENTE',
    'INATIVO'
);


ALTER TYPE "public"."status_telefone" OWNER TO "postgres";


CREATE TYPE "public"."tipo_profissional" AS ENUM (
    'MEDICO',
    'ENFERMEIRO',
    'DENTISTA',
    'NUTRICAO'
);


ALTER TYPE "public"."tipo_profissional" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "evolution_v4"."Chat" (
    "id" "text" NOT NULL,
    "remoteJid" character varying(100) NOT NULL,
    "labels" "jsonb",
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone,
    "instanceId" "text" NOT NULL,
    "name" character varying(100)
);


ALTER TABLE "evolution_v4"."Chat" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "evolution_v4"."Chatwoot" (
    "id" "text" NOT NULL,
    "enabled" boolean DEFAULT true,
    "accountId" character varying(100),
    "token" character varying(100),
    "url" character varying(500),
    "nameInbox" character varying(100),
    "signMsg" boolean DEFAULT false,
    "signDelimiter" character varying(100),
    "number" character varying(100),
    "reopenConversation" boolean DEFAULT false,
    "conversationPending" boolean DEFAULT false,
    "mergeBrazilContacts" boolean DEFAULT false,
    "importContacts" boolean DEFAULT false,
    "importMessages" boolean DEFAULT false,
    "daysLimitImportMessages" integer,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" "text" NOT NULL,
    "logo" character varying(500),
    "organization" character varying(100),
    "ignoreJids" "jsonb"
);


ALTER TABLE "evolution_v4"."Chatwoot" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "evolution_v4"."Contact" (
    "id" "text" NOT NULL,
    "remoteJid" character varying(100) NOT NULL,
    "pushName" character varying(100),
    "profilePicUrl" character varying(500),
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone,
    "instanceId" "text" NOT NULL
);


ALTER TABLE "evolution_v4"."Contact" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "evolution_v4"."Dify" (
    "id" "text" NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "botType" "evolution_v4"."DifyBotType" NOT NULL,
    "apiUrl" character varying(255),
    "apiKey" character varying(255),
    "expire" integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "debounceTime" integer,
    "ignoreJids" "jsonb",
    "triggerType" "evolution_v4"."TriggerType",
    "triggerOperator" "evolution_v4"."TriggerOperator",
    "triggerValue" "text",
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" "text" NOT NULL,
    "description" character varying(255)
);


ALTER TABLE "evolution_v4"."Dify" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "evolution_v4"."DifySetting" (
    "id" "text" NOT NULL,
    "expire" integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "debounceTime" integer,
    "ignoreJids" "jsonb",
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "difyIdFallback" character varying(100),
    "instanceId" "text" NOT NULL
);


ALTER TABLE "evolution_v4"."DifySetting" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "evolution_v4"."EvolutionBot" (
    "id" "text" NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "description" character varying(255),
    "apiUrl" character varying(255),
    "apiKey" character varying(255),
    "expire" integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "debounceTime" integer,
    "ignoreJids" "jsonb",
    "triggerType" "evolution_v4"."TriggerType",
    "triggerOperator" "evolution_v4"."TriggerOperator",
    "triggerValue" "text",
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" "text" NOT NULL
);


ALTER TABLE "evolution_v4"."EvolutionBot" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "evolution_v4"."EvolutionBotSetting" (
    "id" "text" NOT NULL,
    "expire" integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "debounceTime" integer,
    "ignoreJids" "jsonb",
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "botIdFallback" character varying(100),
    "instanceId" "text" NOT NULL
);


ALTER TABLE "evolution_v4"."EvolutionBotSetting" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "evolution_v4"."Flowise" (
    "id" "text" NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "description" character varying(255),
    "apiUrl" character varying(255),
    "apiKey" character varying(255),
    "expire" integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "debounceTime" integer,
    "ignoreJids" "jsonb",
    "triggerType" "evolution_v4"."TriggerType",
    "triggerOperator" "evolution_v4"."TriggerOperator",
    "triggerValue" "text",
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" "text" NOT NULL
);


ALTER TABLE "evolution_v4"."Flowise" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "evolution_v4"."FlowiseSetting" (
    "id" "text" NOT NULL,
    "expire" integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "debounceTime" integer,
    "ignoreJids" "jsonb",
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "flowiseIdFallback" character varying(100),
    "instanceId" "text" NOT NULL
);


ALTER TABLE "evolution_v4"."FlowiseSetting" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "evolution_v4"."Instance" (
    "id" "text" NOT NULL,
    "name" character varying(255) NOT NULL,
    "connectionStatus" "evolution_v4"."InstanceConnectionStatus" DEFAULT 'open'::"evolution_v4"."InstanceConnectionStatus" NOT NULL,
    "ownerJid" character varying(100),
    "profilePicUrl" character varying(500),
    "integration" character varying(100),
    "number" character varying(100),
    "token" character varying(255),
    "clientName" character varying(100),
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone,
    "profileName" character varying(100),
    "businessId" character varying(100),
    "disconnectionAt" timestamp without time zone,
    "disconnectionObject" "jsonb",
    "disconnectionReasonCode" integer
);


ALTER TABLE "evolution_v4"."Instance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "evolution_v4"."IntegrationSession" (
    "id" "text" NOT NULL,
    "sessionId" character varying(255) NOT NULL,
    "remoteJid" character varying(100) NOT NULL,
    "pushName" "text",
    "status" "evolution_v4"."SessionStatus" NOT NULL,
    "awaitUser" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" "text" NOT NULL,
    "parameters" "jsonb",
    "context" "jsonb",
    "botId" "text",
    "type" character varying(100)
);


ALTER TABLE "evolution_v4"."IntegrationSession" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "evolution_v4"."IsOnWhatsapp" (
    "id" "text" NOT NULL,
    "remoteJid" character varying(100) NOT NULL,
    "jidOptions" "text" NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL
);


ALTER TABLE "evolution_v4"."IsOnWhatsapp" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "evolution_v4"."Label" (
    "id" "text" NOT NULL,
    "labelId" character varying(100),
    "name" character varying(100) NOT NULL,
    "color" character varying(100) NOT NULL,
    "predefinedId" character varying(100),
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" "text" NOT NULL
);


ALTER TABLE "evolution_v4"."Label" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "evolution_v4"."Media" (
    "id" "text" NOT NULL,
    "fileName" character varying(500) NOT NULL,
    "type" character varying(100) NOT NULL,
    "mimetype" character varying(100) NOT NULL,
    "createdAt" "date" DEFAULT CURRENT_TIMESTAMP,
    "messageId" "text" NOT NULL,
    "instanceId" "text" NOT NULL
);


ALTER TABLE "evolution_v4"."Media" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "evolution_v4"."Message" (
    "id" "text" NOT NULL,
    "key" "jsonb" NOT NULL,
    "pushName" character varying(100),
    "participant" character varying(100),
    "messageType" character varying(100) NOT NULL,
    "message" "jsonb" NOT NULL,
    "contextInfo" "jsonb",
    "source" "evolution_v4"."DeviceMessage" NOT NULL,
    "messageTimestamp" integer NOT NULL,
    "chatwootMessageId" integer,
    "chatwootInboxId" integer,
    "chatwootConversationId" integer,
    "chatwootContactInboxSourceId" character varying(100),
    "chatwootIsRead" boolean,
    "instanceId" "text" NOT NULL,
    "webhookUrl" character varying(500),
    "sessionId" "text"
);


ALTER TABLE "evolution_v4"."Message" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "evolution_v4"."MessageUpdate" (
    "id" "text" NOT NULL,
    "keyId" character varying(100) NOT NULL,
    "remoteJid" character varying(100) NOT NULL,
    "fromMe" boolean NOT NULL,
    "participant" character varying(100),
    "pollUpdates" "jsonb",
    "status" character varying(30) NOT NULL,
    "messageId" "text" NOT NULL,
    "instanceId" "text" NOT NULL
);


ALTER TABLE "evolution_v4"."MessageUpdate" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "evolution_v4"."OpenaiBot" (
    "id" "text" NOT NULL,
    "assistantId" character varying(255),
    "model" character varying(100),
    "systemMessages" "jsonb",
    "assistantMessages" "jsonb",
    "userMessages" "jsonb",
    "maxTokens" integer,
    "expire" integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "debounceTime" integer,
    "ignoreJids" "jsonb",
    "triggerType" "evolution_v4"."TriggerType",
    "triggerOperator" "evolution_v4"."TriggerOperator",
    "triggerValue" "text",
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "openaiCredsId" "text" NOT NULL,
    "instanceId" "text" NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "botType" "evolution_v4"."OpenaiBotType" NOT NULL,
    "description" character varying(255),
    "functionUrl" character varying(500)
);


ALTER TABLE "evolution_v4"."OpenaiBot" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "evolution_v4"."OpenaiCreds" (
    "id" "text" NOT NULL,
    "apiKey" character varying(255),
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" "text" NOT NULL,
    "name" character varying(255)
);


ALTER TABLE "evolution_v4"."OpenaiCreds" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "evolution_v4"."OpenaiSetting" (
    "id" "text" NOT NULL,
    "expire" integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "debounceTime" integer,
    "ignoreJids" "jsonb",
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "openaiCredsId" "text" NOT NULL,
    "openaiIdFallback" character varying(100),
    "instanceId" "text" NOT NULL,
    "speechToText" boolean DEFAULT false
);


ALTER TABLE "evolution_v4"."OpenaiSetting" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "evolution_v4"."Proxy" (
    "id" "text" NOT NULL,
    "enabled" boolean DEFAULT false NOT NULL,
    "host" character varying(100) NOT NULL,
    "port" character varying(100) NOT NULL,
    "protocol" character varying(100) NOT NULL,
    "username" character varying(100) NOT NULL,
    "password" character varying(100) NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" "text" NOT NULL
);


ALTER TABLE "evolution_v4"."Proxy" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "evolution_v4"."Rabbitmq" (
    "id" "text" NOT NULL,
    "enabled" boolean DEFAULT false NOT NULL,
    "events" "jsonb" NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" "text" NOT NULL
);


ALTER TABLE "evolution_v4"."Rabbitmq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "evolution_v4"."Session" (
    "id" "text" NOT NULL,
    "sessionId" "text" NOT NULL,
    "creds" "text",
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "evolution_v4"."Session" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "evolution_v4"."Setting" (
    "id" "text" NOT NULL,
    "rejectCall" boolean DEFAULT false NOT NULL,
    "msgCall" character varying(100),
    "groupsIgnore" boolean DEFAULT false NOT NULL,
    "alwaysOnline" boolean DEFAULT false NOT NULL,
    "readMessages" boolean DEFAULT false NOT NULL,
    "readStatus" boolean DEFAULT false NOT NULL,
    "syncFullHistory" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" "text" NOT NULL
);


ALTER TABLE "evolution_v4"."Setting" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "evolution_v4"."Sqs" (
    "id" "text" NOT NULL,
    "enabled" boolean DEFAULT false NOT NULL,
    "events" "jsonb" NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" "text" NOT NULL
);


ALTER TABLE "evolution_v4"."Sqs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "evolution_v4"."Template" (
    "id" "text" NOT NULL,
    "templateId" character varying(255) NOT NULL,
    "name" character varying(255) NOT NULL,
    "template" "jsonb" NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" "text" NOT NULL,
    "webhookUrl" character varying(500)
);


ALTER TABLE "evolution_v4"."Template" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "evolution_v4"."Typebot" (
    "id" "text" NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "url" character varying(500) NOT NULL,
    "typebot" character varying(100) NOT NULL,
    "expire" integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone,
    "triggerType" "evolution_v4"."TriggerType",
    "triggerOperator" "evolution_v4"."TriggerOperator",
    "triggerValue" "text",
    "instanceId" "text" NOT NULL,
    "debounceTime" integer,
    "ignoreJids" "jsonb",
    "description" character varying(255)
);


ALTER TABLE "evolution_v4"."Typebot" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "evolution_v4"."TypebotSetting" (
    "id" "text" NOT NULL,
    "expire" integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" "text" NOT NULL,
    "debounceTime" integer,
    "typebotIdFallback" character varying(100),
    "ignoreJids" "jsonb"
);


ALTER TABLE "evolution_v4"."TypebotSetting" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "evolution_v4"."Webhook" (
    "id" "text" NOT NULL,
    "url" character varying(500) NOT NULL,
    "enabled" boolean DEFAULT true,
    "events" "jsonb",
    "webhookByEvents" boolean DEFAULT false,
    "webhookBase64" boolean DEFAULT false,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" "text" NOT NULL,
    "headers" "jsonb"
);


ALTER TABLE "evolution_v4"."Webhook" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "evolution_v4"."Websocket" (
    "id" "text" NOT NULL,
    "enabled" boolean DEFAULT false NOT NULL,
    "events" "jsonb" NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" "text" NOT NULL
);


ALTER TABLE "evolution_v4"."Websocket" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "evolution_v4"."_prisma_migrations" (
    "id" character varying(36) NOT NULL,
    "checksum" character varying(64) NOT NULL,
    "finished_at" timestamp with time zone,
    "migration_name" character varying(255) NOT NULL,
    "logs" "text",
    "rolled_back_at" timestamp with time zone,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "applied_steps_count" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "evolution_v4"."_prisma_migrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."consultas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "paciente_id" "uuid" NOT NULL,
    "tipo_profissional" "public"."tipo_profissional" NOT NULL,
    "data_ultima_consulta" "date",
    "data_proxima_consulta" "date",
    "status_consulta" character varying(50) DEFAULT 'REALIZADA'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."consultas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."historico_mensagens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "data_envio" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "telefone_destino" "text" NOT NULL,
    "texto_enviado" "text" NOT NULL,
    "status" "text" DEFAULT 'ENVIADO'::"text",
    "usuario_id" "uuid" DEFAULT "auth"."uid"(),
    "paciente_id" "uuid",
    "consulta_id" "uuid",
    "mensagem_id" "text"
);


ALTER TABLE "public"."historico_mensagens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."logs_atividades" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "usuario_id" "uuid",
    "acao" character varying(100) NOT NULL,
    "detalhes" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."logs_atividades" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pacientes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nome_completo" character varying(255) NOT NULL,
    "cpf_cns" character varying(20) NOT NULL,
    "data_nascimento" "date" NOT NULL,
    "telefone" character varying(20),
    "endereco" "text",
    "status_telefone" "public"."status_telefone" DEFAULT 'PENDENTE'::"public"."status_telefone",
    "acs" character varying(100),
    "condicao" "public"."condicao_saude" DEFAULT 'NENHUM'::"public"."condicao_saude",
    "consentimento_msg" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pacientes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."perfis_usuarios" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nome" character varying(255) NOT NULL,
    "funcao" "public"."funcao_usuario" DEFAULT 'ACS'::"public"."funcao_usuario" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "email" "text",
    "senha" "text"
);


ALTER TABLE "public"."perfis_usuarios" OWNER TO "postgres";


ALTER TABLE ONLY "evolution_v4"."Chat"
    ADD CONSTRAINT "Chat_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "evolution_v4"."Chatwoot"
    ADD CONSTRAINT "Chatwoot_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "evolution_v4"."Contact"
    ADD CONSTRAINT "Contact_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "evolution_v4"."DifySetting"
    ADD CONSTRAINT "DifySetting_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "evolution_v4"."Dify"
    ADD CONSTRAINT "Dify_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "evolution_v4"."EvolutionBotSetting"
    ADD CONSTRAINT "EvolutionBotSetting_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "evolution_v4"."EvolutionBot"
    ADD CONSTRAINT "EvolutionBot_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "evolution_v4"."FlowiseSetting"
    ADD CONSTRAINT "FlowiseSetting_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "evolution_v4"."Flowise"
    ADD CONSTRAINT "Flowise_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "evolution_v4"."Instance"
    ADD CONSTRAINT "Instance_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "evolution_v4"."IntegrationSession"
    ADD CONSTRAINT "IntegrationSession_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "evolution_v4"."IsOnWhatsapp"
    ADD CONSTRAINT "IsOnWhatsapp_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "evolution_v4"."Label"
    ADD CONSTRAINT "Label_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "evolution_v4"."Media"
    ADD CONSTRAINT "Media_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "evolution_v4"."MessageUpdate"
    ADD CONSTRAINT "MessageUpdate_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "evolution_v4"."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "evolution_v4"."OpenaiBot"
    ADD CONSTRAINT "OpenaiBot_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "evolution_v4"."OpenaiCreds"
    ADD CONSTRAINT "OpenaiCreds_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "evolution_v4"."OpenaiSetting"
    ADD CONSTRAINT "OpenaiSetting_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "evolution_v4"."Proxy"
    ADD CONSTRAINT "Proxy_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "evolution_v4"."Rabbitmq"
    ADD CONSTRAINT "Rabbitmq_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "evolution_v4"."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "evolution_v4"."Setting"
    ADD CONSTRAINT "Setting_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "evolution_v4"."Sqs"
    ADD CONSTRAINT "Sqs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "evolution_v4"."Template"
    ADD CONSTRAINT "Template_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "evolution_v4"."TypebotSetting"
    ADD CONSTRAINT "TypebotSetting_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "evolution_v4"."Typebot"
    ADD CONSTRAINT "Typebot_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "evolution_v4"."Webhook"
    ADD CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "evolution_v4"."Websocket"
    ADD CONSTRAINT "Websocket_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "evolution_v4"."_prisma_migrations"
    ADD CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consultas"
    ADD CONSTRAINT "consultas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."historico_mensagens"
    ADD CONSTRAINT "historico_mensagens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."logs_atividades"
    ADD CONSTRAINT "logs_atividades_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pacientes"
    ADD CONSTRAINT "pacientes_cpf_cns_key" UNIQUE ("cpf_cns");



ALTER TABLE ONLY "public"."pacientes"
    ADD CONSTRAINT "pacientes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."perfis_usuarios"
    ADD CONSTRAINT "perfis_usuarios_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."perfis_usuarios"
    ADD CONSTRAINT "perfis_usuarios_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "Chatwoot_instanceId_key" ON "evolution_v4"."Chatwoot" USING "btree" ("instanceId");



CREATE UNIQUE INDEX "Contact_remoteJid_instanceId_key" ON "evolution_v4"."Contact" USING "btree" ("remoteJid", "instanceId");



CREATE UNIQUE INDEX "DifySetting_instanceId_key" ON "evolution_v4"."DifySetting" USING "btree" ("instanceId");



CREATE UNIQUE INDEX "EvolutionBotSetting_instanceId_key" ON "evolution_v4"."EvolutionBotSetting" USING "btree" ("instanceId");



CREATE UNIQUE INDEX "FlowiseSetting_instanceId_key" ON "evolution_v4"."FlowiseSetting" USING "btree" ("instanceId");



CREATE UNIQUE INDEX "Instance_name_key" ON "evolution_v4"."Instance" USING "btree" ("name");



CREATE UNIQUE INDEX "IsOnWhatsapp_remoteJid_key" ON "evolution_v4"."IsOnWhatsapp" USING "btree" ("remoteJid");



CREATE UNIQUE INDEX "Label_labelId_instanceId_key" ON "evolution_v4"."Label" USING "btree" ("labelId", "instanceId");



CREATE UNIQUE INDEX "Media_fileName_key" ON "evolution_v4"."Media" USING "btree" ("fileName");



CREATE UNIQUE INDEX "Media_messageId_key" ON "evolution_v4"."Media" USING "btree" ("messageId");



CREATE UNIQUE INDEX "OpenaiCreds_apiKey_key" ON "evolution_v4"."OpenaiCreds" USING "btree" ("apiKey");



CREATE UNIQUE INDEX "OpenaiCreds_name_key" ON "evolution_v4"."OpenaiCreds" USING "btree" ("name");



CREATE UNIQUE INDEX "OpenaiSetting_instanceId_key" ON "evolution_v4"."OpenaiSetting" USING "btree" ("instanceId");



CREATE UNIQUE INDEX "OpenaiSetting_openaiCredsId_key" ON "evolution_v4"."OpenaiSetting" USING "btree" ("openaiCredsId");



CREATE UNIQUE INDEX "Proxy_instanceId_key" ON "evolution_v4"."Proxy" USING "btree" ("instanceId");



CREATE UNIQUE INDEX "Rabbitmq_instanceId_key" ON "evolution_v4"."Rabbitmq" USING "btree" ("instanceId");



CREATE UNIQUE INDEX "Session_sessionId_key" ON "evolution_v4"."Session" USING "btree" ("sessionId");



CREATE UNIQUE INDEX "Setting_instanceId_key" ON "evolution_v4"."Setting" USING "btree" ("instanceId");



CREATE UNIQUE INDEX "Sqs_instanceId_key" ON "evolution_v4"."Sqs" USING "btree" ("instanceId");



CREATE UNIQUE INDEX "Template_name_key" ON "evolution_v4"."Template" USING "btree" ("name");



CREATE UNIQUE INDEX "Template_templateId_key" ON "evolution_v4"."Template" USING "btree" ("templateId");



CREATE UNIQUE INDEX "TypebotSetting_instanceId_key" ON "evolution_v4"."TypebotSetting" USING "btree" ("instanceId");



CREATE UNIQUE INDEX "Webhook_instanceId_key" ON "evolution_v4"."Webhook" USING "btree" ("instanceId");



CREATE UNIQUE INDEX "Websocket_instanceId_key" ON "evolution_v4"."Websocket" USING "btree" ("instanceId");



CREATE INDEX "idx_consultas_datas" ON "public"."consultas" USING "btree" ("data_ultima_consulta", "data_proxima_consulta");



CREATE INDEX "idx_consultas_paciente" ON "public"."consultas" USING "btree" ("paciente_id");



ALTER TABLE ONLY "evolution_v4"."Chat"
    ADD CONSTRAINT "Chat_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "evolution_v4"."Instance"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "evolution_v4"."Chatwoot"
    ADD CONSTRAINT "Chatwoot_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "evolution_v4"."Instance"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "evolution_v4"."Contact"
    ADD CONSTRAINT "Contact_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "evolution_v4"."Instance"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "evolution_v4"."DifySetting"
    ADD CONSTRAINT "DifySetting_difyIdFallback_fkey" FOREIGN KEY ("difyIdFallback") REFERENCES "evolution_v4"."Dify"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "evolution_v4"."DifySetting"
    ADD CONSTRAINT "DifySetting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "evolution_v4"."Instance"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "evolution_v4"."Dify"
    ADD CONSTRAINT "Dify_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "evolution_v4"."Instance"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "evolution_v4"."EvolutionBotSetting"
    ADD CONSTRAINT "EvolutionBotSetting_botIdFallback_fkey" FOREIGN KEY ("botIdFallback") REFERENCES "evolution_v4"."EvolutionBot"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "evolution_v4"."EvolutionBotSetting"
    ADD CONSTRAINT "EvolutionBotSetting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "evolution_v4"."Instance"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "evolution_v4"."EvolutionBot"
    ADD CONSTRAINT "EvolutionBot_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "evolution_v4"."Instance"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "evolution_v4"."FlowiseSetting"
    ADD CONSTRAINT "FlowiseSetting_flowiseIdFallback_fkey" FOREIGN KEY ("flowiseIdFallback") REFERENCES "evolution_v4"."Flowise"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "evolution_v4"."FlowiseSetting"
    ADD CONSTRAINT "FlowiseSetting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "evolution_v4"."Instance"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "evolution_v4"."Flowise"
    ADD CONSTRAINT "Flowise_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "evolution_v4"."Instance"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "evolution_v4"."IntegrationSession"
    ADD CONSTRAINT "IntegrationSession_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "evolution_v4"."Instance"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "evolution_v4"."Label"
    ADD CONSTRAINT "Label_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "evolution_v4"."Instance"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "evolution_v4"."Media"
    ADD CONSTRAINT "Media_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "evolution_v4"."Instance"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "evolution_v4"."Media"
    ADD CONSTRAINT "Media_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "evolution_v4"."Message"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "evolution_v4"."MessageUpdate"
    ADD CONSTRAINT "MessageUpdate_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "evolution_v4"."Instance"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "evolution_v4"."MessageUpdate"
    ADD CONSTRAINT "MessageUpdate_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "evolution_v4"."Message"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "evolution_v4"."Message"
    ADD CONSTRAINT "Message_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "evolution_v4"."Instance"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "evolution_v4"."Message"
    ADD CONSTRAINT "Message_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "evolution_v4"."IntegrationSession"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "evolution_v4"."OpenaiBot"
    ADD CONSTRAINT "OpenaiBot_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "evolution_v4"."Instance"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "evolution_v4"."OpenaiBot"
    ADD CONSTRAINT "OpenaiBot_openaiCredsId_fkey" FOREIGN KEY ("openaiCredsId") REFERENCES "evolution_v4"."OpenaiCreds"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "evolution_v4"."OpenaiCreds"
    ADD CONSTRAINT "OpenaiCreds_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "evolution_v4"."Instance"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "evolution_v4"."OpenaiSetting"
    ADD CONSTRAINT "OpenaiSetting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "evolution_v4"."Instance"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "evolution_v4"."OpenaiSetting"
    ADD CONSTRAINT "OpenaiSetting_openaiCredsId_fkey" FOREIGN KEY ("openaiCredsId") REFERENCES "evolution_v4"."OpenaiCreds"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "evolution_v4"."OpenaiSetting"
    ADD CONSTRAINT "OpenaiSetting_openaiIdFallback_fkey" FOREIGN KEY ("openaiIdFallback") REFERENCES "evolution_v4"."OpenaiBot"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "evolution_v4"."Proxy"
    ADD CONSTRAINT "Proxy_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "evolution_v4"."Instance"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "evolution_v4"."Rabbitmq"
    ADD CONSTRAINT "Rabbitmq_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "evolution_v4"."Instance"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "evolution_v4"."Session"
    ADD CONSTRAINT "Session_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "evolution_v4"."Instance"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "evolution_v4"."Setting"
    ADD CONSTRAINT "Setting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "evolution_v4"."Instance"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "evolution_v4"."Sqs"
    ADD CONSTRAINT "Sqs_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "evolution_v4"."Instance"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "evolution_v4"."Template"
    ADD CONSTRAINT "Template_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "evolution_v4"."Instance"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "evolution_v4"."TypebotSetting"
    ADD CONSTRAINT "TypebotSetting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "evolution_v4"."Instance"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "evolution_v4"."TypebotSetting"
    ADD CONSTRAINT "TypebotSetting_typebotIdFallback_fkey" FOREIGN KEY ("typebotIdFallback") REFERENCES "evolution_v4"."Typebot"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "evolution_v4"."Typebot"
    ADD CONSTRAINT "Typebot_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "evolution_v4"."Instance"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "evolution_v4"."Webhook"
    ADD CONSTRAINT "Webhook_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "evolution_v4"."Instance"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "evolution_v4"."Websocket"
    ADD CONSTRAINT "Websocket_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "evolution_v4"."Instance"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."consultas"
    ADD CONSTRAINT "consultas_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "public"."pacientes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."historico_mensagens"
    ADD CONSTRAINT "historico_mensagens_consulta_id_fkey" FOREIGN KEY ("consulta_id") REFERENCES "public"."consultas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."historico_mensagens"
    ADD CONSTRAINT "historico_mensagens_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "public"."pacientes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."historico_mensagens"
    ADD CONSTRAINT "historico_mensagens_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."logs_atividades"
    ADD CONSTRAINT "logs_atividades_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."perfis_usuarios"("id");



CREATE POLICY "Permitir Leitura Pública do Realtime" ON "public"."historico_mensagens" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Permitir atualização de autenticados" ON "public"."perfis_usuarios" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Permitir atualização para autenticados" ON "public"."consultas" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Permitir atualização para autenticados" ON "public"."pacientes" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Permitir deletar autenticados" ON "public"."perfis_usuarios" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Permitir inserção para autenticados" ON "public"."consultas" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Permitir inserção para autenticados" ON "public"."historico_mensagens" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Permitir inserção para autenticados" ON "public"."pacientes" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Permitir inserção para autenticados" ON "public"."perfis_usuarios" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Permitir leitura para autenticados" ON "public"."consultas" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Permitir leitura para autenticados" ON "public"."historico_mensagens" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Permitir leitura para autenticados" ON "public"."pacientes" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Permitir leitura para usuários autenticados" ON "public"."perfis_usuarios" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."consultas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."historico_mensagens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."logs_atividades" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pacientes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."perfis_usuarios" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."historico_mensagens";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";


















GRANT ALL ON TABLE "public"."consultas" TO "anon";
GRANT ALL ON TABLE "public"."consultas" TO "authenticated";
GRANT ALL ON TABLE "public"."consultas" TO "service_role";



GRANT ALL ON TABLE "public"."historico_mensagens" TO "anon";
GRANT ALL ON TABLE "public"."historico_mensagens" TO "authenticated";
GRANT ALL ON TABLE "public"."historico_mensagens" TO "service_role";



GRANT ALL ON TABLE "public"."logs_atividades" TO "anon";
GRANT ALL ON TABLE "public"."logs_atividades" TO "authenticated";
GRANT ALL ON TABLE "public"."logs_atividades" TO "service_role";



GRANT ALL ON TABLE "public"."pacientes" TO "anon";
GRANT ALL ON TABLE "public"."pacientes" TO "authenticated";
GRANT ALL ON TABLE "public"."pacientes" TO "service_role";



GRANT ALL ON TABLE "public"."perfis_usuarios" TO "anon";
GRANT ALL ON TABLE "public"."perfis_usuarios" TO "authenticated";
GRANT ALL ON TABLE "public"."perfis_usuarios" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































drop extension if exists "pg_net";

drop policy "Permitir Leitura Pública do Realtime" on "public"."historico_mensagens";

alter table "public"."consultas" drop constraint "consultas_paciente_id_fkey";

alter table "public"."historico_mensagens" drop constraint "historico_mensagens_consulta_id_fkey";

alter table "public"."historico_mensagens" drop constraint "historico_mensagens_paciente_id_fkey";

alter table "public"."logs_atividades" drop constraint "logs_atividades_usuario_id_fkey";

alter table "public"."consultas" alter column "tipo_profissional" set data type public.tipo_profissional using "tipo_profissional"::text::public.tipo_profissional;

alter table "public"."logs_atividades" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."pacientes" alter column "condicao" set default 'NENHUM'::public.condicao_saude;

alter table "public"."pacientes" alter column "condicao" set data type public.condicao_saude using "condicao"::text::public.condicao_saude;

alter table "public"."pacientes" alter column "status_telefone" set default 'PENDENTE'::public.status_telefone;

alter table "public"."pacientes" alter column "status_telefone" set data type public.status_telefone using "status_telefone"::text::public.status_telefone;

alter table "public"."perfis_usuarios" alter column "funcao" set default 'ACS'::public.funcao_usuario;

alter table "public"."perfis_usuarios" alter column "funcao" set data type public.funcao_usuario using "funcao"::text::public.funcao_usuario;

alter table "public"."consultas" add constraint "consultas_paciente_id_fkey" FOREIGN KEY (paciente_id) REFERENCES public.pacientes(id) ON DELETE CASCADE not valid;

alter table "public"."consultas" validate constraint "consultas_paciente_id_fkey";

alter table "public"."historico_mensagens" add constraint "historico_mensagens_consulta_id_fkey" FOREIGN KEY (consulta_id) REFERENCES public.consultas(id) ON DELETE CASCADE not valid;

alter table "public"."historico_mensagens" validate constraint "historico_mensagens_consulta_id_fkey";

alter table "public"."historico_mensagens" add constraint "historico_mensagens_paciente_id_fkey" FOREIGN KEY (paciente_id) REFERENCES public.pacientes(id) ON DELETE SET NULL not valid;

alter table "public"."historico_mensagens" validate constraint "historico_mensagens_paciente_id_fkey";

alter table "public"."logs_atividades" add constraint "logs_atividades_usuario_id_fkey" FOREIGN KEY (usuario_id) REFERENCES public.perfis_usuarios(id) not valid;

alter table "public"."logs_atividades" validate constraint "logs_atividades_usuario_id_fkey";


  create policy "Permitir Leitura Pública do Realtime"
  on "public"."historico_mensagens"
  as permissive
  for select
  to anon, authenticated
using (true);



