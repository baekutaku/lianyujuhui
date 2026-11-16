--
-- PostgreSQL database dump
--

\restrict YcTbHQ9MwC6HvBow9Eyw3cMu56PzHkV1m9SG4FJu3QXgyAMAeFLnAb59sZ2EIB2

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.7

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

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: delete_content_item(text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.delete_content_item(p_item_type text, p_item_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
begin
  delete from public.translations
  where parent_type = p_item_type
    and parent_id = p_item_id;

  delete from public.media_assets
  where parent_type = p_item_type
    and parent_id = p_item_id;

  delete from public.item_relations
  where (parent_type = p_item_type and parent_id = p_item_id)
     or (child_type = p_item_type and child_id = p_item_id);

  delete from public.item_characters
  where item_type = p_item_type
    and item_id = p_item_id;

  delete from public.item_tags
  where item_type = p_item_type
    and item_id = p_item_id;

  if p_item_type = 'story' then
    delete from public.stories where id = p_item_id;
  elsif p_item_type = 'event' then
    delete from public.events where id = p_item_id;
  elsif p_item_type = 'phone_item' then
    delete from public.phone_items where id = p_item_id;
  elsif p_item_type = 'card' then
    delete from public.cards where id = p_item_id;
  elsif p_item_type = 'media_collection' then
    delete from public.media_collections where id = p_item_id;
  else
    raise exception 'Unsupported item type: %', p_item_type;
  end if;
end;
$$;


--
-- Name: set_current_timestamp_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_current_timestamp_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: anonymous_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.anonymous_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nickname text,
    content text NOT NULL,
    is_private boolean DEFAULT false NOT NULL,
    is_approved boolean DEFAULT false NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: calendar_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calendar_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    schedule_date date NOT NULL,
    note text,
    kind text DEFAULT 'event'::text NOT NULL,
    is_published boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    end_date date
);


--
-- Name: COLUMN calendar_entries.end_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.calendar_entries.end_date IS 'Optional inclusive end date for multi-day calendar entries';


--
-- Name: card_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.card_images (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    card_id uuid NOT NULL,
    url text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_detail_before boolean DEFAULT false NOT NULL,
    is_detail_after boolean DEFAULT false NOT NULL,
    is_list_default boolean DEFAULT false NOT NULL,
    is_list_hover boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: cards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    content_id text NOT NULL,
    origin_key text NOT NULL,
    server_id uuid NOT NULL,
    primary_character_id uuid NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    rarity text NOT NULL,
    attribute text NOT NULL,
    release_year integer NOT NULL,
    release_date date,
    thumbnail_url text,
    cover_image_url text,
    summary text,
    is_published boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    card_category text,
    CONSTRAINT cards_attribute_check CHECK ((attribute = ANY (ARRAY['drive'::text, 'affinity'::text, 'judgment'::text, 'creativity'::text]))),
    CONSTRAINT cards_card_category_check CHECK (((card_category IS NULL) OR (card_category = ANY (ARRAY['date'::text, 'main_story'::text, 'side_story'::text, 'birthday'::text, 'anniversary'::text, 'event'::text, 'charge'::text, 'free'::text, 'other'::text])))),
    CONSTRAINT cards_rarity_check CHECK ((rarity = ANY (ARRAY['nh'::text, 'n'::text, 'r'::text, 'sr'::text, 'er'::text, 'ser'::text, 'ssr'::text, 'sp'::text, 'ur'::text]))),
    CONSTRAINT cards_release_year_check CHECK (((release_year >= 2017) AND (release_year <= 2100)))
);


--
-- Name: characters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.characters (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    name_ko text NOT NULL,
    name_zh text,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT characters_key_check CHECK ((key = ANY (ARRAY['baiqi'::text, 'lizeyan'::text, 'zhouqiluo'::text, 'lingxiao'::text, 'xumo'::text])))
);


--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    content_id text NOT NULL,
    origin_key text NOT NULL,
    server_id uuid NOT NULL,
    primary_character_id uuid,
    title text NOT NULL,
    slug text NOT NULL,
    subtype text NOT NULL,
    release_year integer NOT NULL,
    start_date date,
    end_date date,
    thumbnail_url text,
    summary text,
    is_published boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    visibility text DEFAULT 'public'::text NOT NULL,
    event_scope text,
    access_password_hash text,
    access_hint text,
    CONSTRAINT events_release_year_check CHECK (((release_year >= 2017) AND (release_year <= 2100))),
    CONSTRAINT events_subtype_check CHECK ((subtype = ANY (ARRAY['birthday_baiqi'::text, 'birthday_mc'::text, 'anniversary_event'::text, 'game_event'::text, 'seasonal_event'::text, 'collaboration_event'::text, 'return_event'::text])))
);


--
-- Name: extra_mail_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.extra_mail_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    character_key text NOT NULL,
    source_no integer,
    title text NOT NULL,
    mail_date date NOT NULL,
    original_text text DEFAULT ''::text NOT NULL,
    translation_text text,
    occasion text,
    image_url text,
    is_published boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: extra_mail_relations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.extra_mail_relations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    mail_id uuid NOT NULL,
    target_type text NOT NULL,
    target_id uuid NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT extra_mail_relations_target_type_check CHECK ((target_type = ANY (ARRAY['card'::text, 'illustration'::text, 'story'::text, 'event'::text])))
);


--
-- Name: extra_pv_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.extra_pv_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    release_date date,
    release_year integer,
    character_keys text[] DEFAULT '{}'::text[] NOT NULL,
    video_cn_url text,
    video_kr_url text,
    original_text text,
    translation_text text,
    image_urls text[] DEFAULT '{}'::text[] NOT NULL,
    related_event_slug text,
    is_published boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    videos jsonb DEFAULT '[]'::jsonb NOT NULL
);


--
-- Name: extra_pv_relations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.extra_pv_relations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pv_id uuid NOT NULL,
    target_type text NOT NULL,
    target_id uuid NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT extra_pv_relations_target_type_check CHECK ((target_type = ANY (ARRAY['card'::text, 'illustration'::text, 'story'::text, 'phone_item'::text, 'event'::text])))
);


--
-- Name: extra_touch_room_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.extra_touch_room_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    character_key text NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    release_date date,
    occasion text,
    video_url text NOT NULL,
    thumbnail_url text,
    original_text text,
    translation_text text,
    is_published boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: extra_touch_room_relations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.extra_touch_room_relations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    touch_room_id uuid NOT NULL,
    target_type text NOT NULL,
    target_id uuid NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT extra_touch_room_relations_target_type_check CHECK ((target_type = ANY (ARRAY['card'::text, 'illustration'::text, 'story'::text, 'event'::text])))
);


--
-- Name: guestbook_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guestbook_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nickname text,
    password_hash text NOT NULL,
    content text NOT NULL,
    is_private boolean DEFAULT false NOT NULL,
    is_approved boolean DEFAULT false NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    admin_reply text,
    admin_reply_updated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: home_hero_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.home_hero_images (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    image_url text NOT NULL,
    source_type text DEFAULT 'external'::text NOT NULL,
    object_key text,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT home_hero_images_source_type_check CHECK ((source_type = ANY (ARRAY['external'::text, 'r2'::text])))
);


--
-- Name: illustration_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.illustration_images (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    illustration_id uuid NOT NULL,
    url text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: illustrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.illustrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    image_url text NOT NULL,
    summary text,
    release_year integer,
    release_date date,
    source_url text,
    server_id uuid,
    primary_character_id uuid,
    is_published boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: image_derivatives; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.image_derivatives (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    source_url text NOT NULL,
    source_kind text DEFAULT 'external'::text NOT NULL,
    mirrored_original_url text,
    display_url text,
    thumb_url text,
    status text DEFAULT 'pending'::text NOT NULL,
    content_type text,
    width integer,
    height integer,
    original_bytes bigint,
    display_bytes bigint,
    thumb_bytes bigint,
    source_etag text,
    last_error text,
    last_checked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT image_derivatives_source_kind_check CHECK ((source_kind = ANY (ARRAY['r2_upload'::text, 'legacy_r2'::text, 'external'::text]))),
    CONSTRAINT image_derivatives_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'ready'::text, 'failed'::text])))
);


--
-- Name: TABLE image_derivatives; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.image_derivatives IS 'Derived image registry. Content tables keep clean source URLs; mirrors and resized files live here.';


--
-- Name: item_characters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.item_characters (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    item_type text NOT NULL,
    item_id uuid NOT NULL,
    character_id uuid NOT NULL,
    role_type text,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT item_characters_item_type_check CHECK ((item_type = ANY (ARRAY['card'::text, 'story'::text, 'event'::text, 'phone_item'::text])))
);


--
-- Name: item_relations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.item_relations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    parent_type text NOT NULL,
    parent_id uuid NOT NULL,
    child_type text NOT NULL,
    child_id uuid NOT NULL,
    relation_type text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT item_relations_child_type_check CHECK ((child_type = ANY (ARRAY['card'::text, 'story'::text, 'event'::text, 'phone_item'::text]))),
    CONSTRAINT item_relations_parent_type_check CHECK ((parent_type = ANY (ARRAY['card'::text, 'story'::text, 'event'::text, 'phone_item'::text])))
);


--
-- Name: item_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.item_tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    item_type text NOT NULL,
    item_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: maker_message_threads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.maker_message_threads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id text NOT NULL,
    title text,
    character_key text,
    character_name text,
    avatar_url text,
    preview text,
    payload_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: maker_moments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.maker_moments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id text NOT NULL,
    title text,
    author_key text,
    author_name text,
    author_avatar_url text,
    preview text,
    payload_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: media_assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.media_assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    parent_type text NOT NULL,
    parent_id uuid NOT NULL,
    media_type text NOT NULL,
    usage_type text NOT NULL,
    url text NOT NULL,
    youtube_video_id text,
    thumbnail_url text,
    title text,
    description text,
    width integer,
    height integer,
    file_size bigint,
    duration_seconds integer,
    is_primary boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT media_assets_media_type_check CHECK ((media_type = ANY (ARRAY['image'::text, 'youtube'::text, 'audio'::text, 'document'::text, 'embed'::text]))),
    CONSTRAINT media_assets_parent_type_check CHECK ((parent_type = ANY (ARRAY['card'::text, 'story'::text, 'event'::text, 'phone_item'::text]))),
    CONSTRAINT media_assets_usage_type_check CHECK ((usage_type = ANY (ARRAY['cover'::text, 'thumbnail'::text, 'pv'::text, 'pv_cn'::text, 'pv_kr'::text])))
);


--
-- Name: media_collections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.media_collections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    content_id text NOT NULL,
    origin_key text,
    server_id uuid,
    primary_character_id uuid,
    title text NOT NULL,
    slug text NOT NULL,
    subtype text,
    release_year integer,
    release_date date,
    thumbnail_url text,
    cover_image_url text,
    summary text,
    is_published boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: phone_article_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.phone_article_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    avatar_url text DEFAULT ''::text NOT NULL,
    nickname text DEFAULT ''::text NOT NULL,
    content text DEFAULT ''::text NOT NULL,
    like_count integer DEFAULT 0 NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_visible boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: phone_article_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.phone_article_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    publisher_id uuid NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    author_name text DEFAULT ''::text NOT NULL,
    image_url text DEFAULT ''::text NOT NULL,
    body text DEFAULT ''::text NOT NULL,
    subscriber_count integer DEFAULT 0 NOT NULL,
    like_count integer DEFAULT 0 NOT NULL,
    is_published boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    related_story_slug text,
    related_story_label text
);


--
-- Name: phone_article_publishers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.phone_article_publishers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    icon_url text DEFAULT ''::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: phone_item_choices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.phone_item_choices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    phone_item_id uuid NOT NULL,
    choice_group_key text NOT NULL,
    choice_key text NOT NULL,
    choice_label text NOT NULL,
    next_choice_key text,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: phone_item_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.phone_item_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    phone_item_id uuid NOT NULL,
    entry_type text NOT NULL,
    speaker_name text,
    speaker_avatar_url text,
    speaker_side text DEFAULT 'left'::text,
    title text,
    body text,
    media_url text,
    visible_if_choice_key text,
    choice_group_key text,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT phone_item_entries_speaker_side_check CHECK ((speaker_side = ANY (ARRAY['left'::text, 'right'::text, 'center'::text])))
);


--
-- Name: phone_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.phone_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    content_id text NOT NULL,
    origin_key text NOT NULL,
    server_id uuid NOT NULL,
    primary_character_id uuid,
    title text NOT NULL,
    slug text NOT NULL,
    subtype text NOT NULL,
    release_year integer NOT NULL,
    release_date date,
    summary text,
    is_published boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    preview_text text,
    embed_url text,
    content_json jsonb DEFAULT '{}'::jsonb,
    visibility text DEFAULT 'public'::text NOT NULL,
    CONSTRAINT phone_items_release_year_check CHECK (((release_year >= 2017) AND (release_year <= 2100))),
    CONSTRAINT phone_items_subtype_check CHECK ((subtype = ANY (ARRAY['moment'::text, 'message'::text, 'call'::text, 'video_call'::text, 'article'::text])))
);


--
-- Name: phone_profile_custom; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.phone_profile_custom (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_type text NOT NULL,
    owner_id text NOT NULL,
    title text,
    image_url text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    CONSTRAINT phone_profile_custom_owner_type_check CHECK ((owner_type = ANY (ARRAY['user'::text, 'guest'::text])))
);


--
-- Name: phone_profile_options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.phone_profile_options (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text,
    image_url text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by_user_id uuid,
    is_shared_custom boolean DEFAULT false NOT NULL
);


--
-- Name: phone_profile_selected; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.phone_profile_selected (
    owner_type text NOT NULL,
    owner_id text NOT NULL,
    source_type text NOT NULL,
    source_id uuid NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT phone_profile_selected_owner_type_check CHECK ((owner_type = ANY (ARRAY['user'::text, 'guest'::text]))),
    CONSTRAINT phone_profile_selected_source_type_check CHECK ((source_type = ANY (ARRAY['option'::text, 'custom'::text])))
);


--
-- Name: phone_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.phone_profiles (
    key text NOT NULL,
    display_name text NOT NULL,
    avatar_url text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: servers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.servers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    name text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT servers_key_check CHECK ((key = ANY (ARRAY['kr'::text, 'cn'::text])))
);


--
-- Name: site_updates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_updates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    category text DEFAULT 'update'::text NOT NULL,
    target_area text DEFAULT 'all'::text NOT NULL,
    is_published boolean DEFAULT true NOT NULL,
    is_pinned boolean DEFAULT false NOT NULL,
    published_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: stories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    content_id text NOT NULL,
    origin_key text NOT NULL,
    server_id uuid NOT NULL,
    primary_character_id uuid,
    title text NOT NULL,
    slug text NOT NULL,
    subtype text NOT NULL,
    release_year integer NOT NULL,
    release_date date,
    chapter_no integer,
    part_no integer,
    summary text,
    is_published boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    series_key text,
    universe_scope text,
    delivery_format text DEFAULT 'text'::text NOT NULL,
    visibility text DEFAULT 'public'::text NOT NULL,
    volume_no integer,
    main_season integer,
    main_kind text,
    route_scope text,
    manual_sort_order integer DEFAULT 0 NOT NULL,
    arc_title text,
    episode_title text,
    access_password_hash text,
    access_hint text,
    CONSTRAINT stories_release_year_check CHECK (((release_year >= 2017) AND (release_year <= 2100))),
    CONSTRAINT stories_subtype_check CHECK ((subtype = ANY (ARRAY['card_story'::text, 'asmr'::text, 'side_story'::text, 'main_story'::text, 'behind_story'::text, 'xiyue_story'::text, 'myhome_story'::text, 'company_project'::text]))),
    CONSTRAINT stories_visibility_check CHECK ((visibility = ANY (ARRAY['public'::text, 'protected'::text, 'private'::text])))
);


--
-- Name: tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    kind text DEFAULT 'story'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    key text,
    label text
);


--
-- Name: translations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.translations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    parent_type text NOT NULL,
    parent_id uuid NOT NULL,
    language_code text DEFAULT 'ko'::text NOT NULL,
    translation_type text DEFAULT 'full'::text NOT NULL,
    title text,
    body text NOT NULL,
    source_text text,
    translator_note text,
    contains_spoiler boolean DEFAULT false NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT translations_parent_type_check CHECK ((parent_type = ANY (ARRAY['story'::text, 'event'::text, 'phone_item'::text, 'card'::text]))),
    CONSTRAINT translations_translation_type_check CHECK ((translation_type = ANY (ARRAY['full'::text, 'summary'::text, 'annotated'::text, 'subtitle'::text])))
);


--
-- Name: anonymous_messages anonymous_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anonymous_messages
    ADD CONSTRAINT anonymous_messages_pkey PRIMARY KEY (id);


--
-- Name: calendar_entries calendar_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_entries
    ADD CONSTRAINT calendar_entries_pkey PRIMARY KEY (id);


--
-- Name: card_images card_images_card_id_url_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_images
    ADD CONSTRAINT card_images_card_id_url_key UNIQUE (card_id, url);


--
-- Name: card_images card_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_images
    ADD CONSTRAINT card_images_pkey PRIMARY KEY (id);


--
-- Name: cards cards_content_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cards
    ADD CONSTRAINT cards_content_id_key UNIQUE (content_id);


--
-- Name: cards cards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cards
    ADD CONSTRAINT cards_pkey PRIMARY KEY (id);


--
-- Name: cards cards_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cards
    ADD CONSTRAINT cards_slug_key UNIQUE (slug);


--
-- Name: characters characters_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.characters
    ADD CONSTRAINT characters_key_key UNIQUE (key);


--
-- Name: characters characters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.characters
    ADD CONSTRAINT characters_pkey PRIMARY KEY (id);


--
-- Name: events events_content_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_content_id_key UNIQUE (content_id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: events events_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_slug_key UNIQUE (slug);


--
-- Name: extra_mail_items extra_mail_items_character_key_source_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extra_mail_items
    ADD CONSTRAINT extra_mail_items_character_key_source_no_key UNIQUE (character_key, source_no);


--
-- Name: extra_mail_items extra_mail_items_character_key_title_mail_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extra_mail_items
    ADD CONSTRAINT extra_mail_items_character_key_title_mail_date_key UNIQUE (character_key, title, mail_date);


--
-- Name: extra_mail_items extra_mail_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extra_mail_items
    ADD CONSTRAINT extra_mail_items_pkey PRIMARY KEY (id);


--
-- Name: extra_mail_relations extra_mail_relations_mail_id_target_type_target_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extra_mail_relations
    ADD CONSTRAINT extra_mail_relations_mail_id_target_type_target_id_key UNIQUE (mail_id, target_type, target_id);


--
-- Name: extra_mail_relations extra_mail_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extra_mail_relations
    ADD CONSTRAINT extra_mail_relations_pkey PRIMARY KEY (id);


--
-- Name: extra_pv_items extra_pv_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extra_pv_items
    ADD CONSTRAINT extra_pv_items_pkey PRIMARY KEY (id);


--
-- Name: extra_pv_items extra_pv_items_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extra_pv_items
    ADD CONSTRAINT extra_pv_items_slug_key UNIQUE (slug);


--
-- Name: extra_pv_relations extra_pv_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extra_pv_relations
    ADD CONSTRAINT extra_pv_relations_pkey PRIMARY KEY (id);


--
-- Name: extra_pv_relations extra_pv_relations_pv_id_target_type_target_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extra_pv_relations
    ADD CONSTRAINT extra_pv_relations_pv_id_target_type_target_id_key UNIQUE (pv_id, target_type, target_id);


--
-- Name: extra_touch_room_items extra_touch_room_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extra_touch_room_items
    ADD CONSTRAINT extra_touch_room_items_pkey PRIMARY KEY (id);


--
-- Name: extra_touch_room_items extra_touch_room_items_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extra_touch_room_items
    ADD CONSTRAINT extra_touch_room_items_slug_key UNIQUE (slug);


--
-- Name: extra_touch_room_relations extra_touch_room_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extra_touch_room_relations
    ADD CONSTRAINT extra_touch_room_relations_pkey PRIMARY KEY (id);


--
-- Name: extra_touch_room_relations extra_touch_room_relations_touch_room_id_target_type_target_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extra_touch_room_relations
    ADD CONSTRAINT extra_touch_room_relations_touch_room_id_target_type_target_key UNIQUE (touch_room_id, target_type, target_id);


--
-- Name: guestbook_entries guestbook_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guestbook_entries
    ADD CONSTRAINT guestbook_entries_pkey PRIMARY KEY (id);


--
-- Name: home_hero_images home_hero_images_image_url_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.home_hero_images
    ADD CONSTRAINT home_hero_images_image_url_key UNIQUE (image_url);


--
-- Name: home_hero_images home_hero_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.home_hero_images
    ADD CONSTRAINT home_hero_images_pkey PRIMARY KEY (id);


--
-- Name: illustration_images illustration_images_illustration_id_url_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.illustration_images
    ADD CONSTRAINT illustration_images_illustration_id_url_key UNIQUE (illustration_id, url);


--
-- Name: illustration_images illustration_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.illustration_images
    ADD CONSTRAINT illustration_images_pkey PRIMARY KEY (id);


--
-- Name: illustrations illustrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.illustrations
    ADD CONSTRAINT illustrations_pkey PRIMARY KEY (id);


--
-- Name: image_derivatives image_derivatives_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.image_derivatives
    ADD CONSTRAINT image_derivatives_pkey PRIMARY KEY (id);


--
-- Name: image_derivatives image_derivatives_source_url_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.image_derivatives
    ADD CONSTRAINT image_derivatives_source_url_key UNIQUE (source_url);


--
-- Name: item_characters item_characters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_characters
    ADD CONSTRAINT item_characters_pkey PRIMARY KEY (id);


--
-- Name: item_relations item_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_relations
    ADD CONSTRAINT item_relations_pkey PRIMARY KEY (id);


--
-- Name: item_tags item_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_tags
    ADD CONSTRAINT item_tags_pkey PRIMARY KEY (id);


--
-- Name: maker_message_threads maker_message_threads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maker_message_threads
    ADD CONSTRAINT maker_message_threads_pkey PRIMARY KEY (id);


--
-- Name: maker_moments maker_moments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maker_moments
    ADD CONSTRAINT maker_moments_pkey PRIMARY KEY (id);


--
-- Name: media_assets media_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_assets
    ADD CONSTRAINT media_assets_pkey PRIMARY KEY (id);


--
-- Name: media_collections media_collections_content_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_collections
    ADD CONSTRAINT media_collections_content_id_key UNIQUE (content_id);


--
-- Name: media_collections media_collections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_collections
    ADD CONSTRAINT media_collections_pkey PRIMARY KEY (id);


--
-- Name: media_collections media_collections_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_collections
    ADD CONSTRAINT media_collections_slug_key UNIQUE (slug);


--
-- Name: phone_article_comments phone_article_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phone_article_comments
    ADD CONSTRAINT phone_article_comments_pkey PRIMARY KEY (id);


--
-- Name: phone_article_posts phone_article_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phone_article_posts
    ADD CONSTRAINT phone_article_posts_pkey PRIMARY KEY (id);


--
-- Name: phone_article_posts phone_article_posts_publisher_id_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phone_article_posts
    ADD CONSTRAINT phone_article_posts_publisher_id_slug_key UNIQUE (publisher_id, slug);


--
-- Name: phone_article_publishers phone_article_publishers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phone_article_publishers
    ADD CONSTRAINT phone_article_publishers_pkey PRIMARY KEY (id);


--
-- Name: phone_article_publishers phone_article_publishers_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phone_article_publishers
    ADD CONSTRAINT phone_article_publishers_slug_key UNIQUE (slug);


--
-- Name: phone_item_choices phone_item_choices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phone_item_choices
    ADD CONSTRAINT phone_item_choices_pkey PRIMARY KEY (id);


--
-- Name: phone_item_entries phone_item_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phone_item_entries
    ADD CONSTRAINT phone_item_entries_pkey PRIMARY KEY (id);


--
-- Name: phone_items phone_items_content_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phone_items
    ADD CONSTRAINT phone_items_content_id_key UNIQUE (content_id);


--
-- Name: phone_items phone_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phone_items
    ADD CONSTRAINT phone_items_pkey PRIMARY KEY (id);


--
-- Name: phone_items phone_items_subtype_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phone_items
    ADD CONSTRAINT phone_items_subtype_slug_key UNIQUE (subtype, slug);


--
-- Name: phone_profile_custom phone_profile_custom_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phone_profile_custom
    ADD CONSTRAINT phone_profile_custom_pkey PRIMARY KEY (id);


--
-- Name: phone_profile_options phone_profile_options_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phone_profile_options
    ADD CONSTRAINT phone_profile_options_pkey PRIMARY KEY (id);


--
-- Name: phone_profile_selected phone_profile_selected_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phone_profile_selected
    ADD CONSTRAINT phone_profile_selected_pkey PRIMARY KEY (owner_type, owner_id);


--
-- Name: phone_profiles phone_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phone_profiles
    ADD CONSTRAINT phone_profiles_pkey PRIMARY KEY (key);


--
-- Name: servers servers_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servers
    ADD CONSTRAINT servers_key_key UNIQUE (key);


--
-- Name: servers servers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servers
    ADD CONSTRAINT servers_pkey PRIMARY KEY (id);


--
-- Name: site_updates site_updates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_updates
    ADD CONSTRAINT site_updates_pkey PRIMARY KEY (id);


--
-- Name: stories stories_content_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stories
    ADD CONSTRAINT stories_content_id_key UNIQUE (content_id);


--
-- Name: stories stories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stories
    ADD CONSTRAINT stories_pkey PRIMARY KEY (id);


--
-- Name: stories stories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stories
    ADD CONSTRAINT stories_slug_key UNIQUE (slug);


--
-- Name: tags tags_kind_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_kind_slug_key UNIQUE (kind, slug);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: translations translations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.translations
    ADD CONSTRAINT translations_pkey PRIMARY KEY (id);


--
-- Name: anonymous_messages_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX anonymous_messages_created_at_idx ON public.anonymous_messages USING btree (created_at DESC);


--
-- Name: anonymous_messages_public_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX anonymous_messages_public_idx ON public.anonymous_messages USING btree (is_private, is_approved, is_deleted, created_at DESC);


--
-- Name: card_images_card_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX card_images_card_idx ON public.card_images USING btree (card_id, sort_order, created_at);


--
-- Name: card_images_one_detail_after_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX card_images_one_detail_after_idx ON public.card_images USING btree (card_id) WHERE (is_detail_after = true);


--
-- Name: card_images_one_detail_before_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX card_images_one_detail_before_idx ON public.card_images USING btree (card_id) WHERE (is_detail_before = true);


--
-- Name: card_images_one_list_default_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX card_images_one_list_default_idx ON public.card_images USING btree (card_id) WHERE (is_list_default = true);


--
-- Name: card_images_one_list_hover_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX card_images_one_list_hover_idx ON public.card_images USING btree (card_id) WHERE (is_list_hover = true);


--
-- Name: extra_mail_items_character_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX extra_mail_items_character_date_idx ON public.extra_mail_items USING btree (character_key, mail_date DESC);


--
-- Name: extra_mail_items_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX extra_mail_items_date_idx ON public.extra_mail_items USING btree (mail_date DESC);


--
-- Name: extra_mail_relations_mail_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX extra_mail_relations_mail_idx ON public.extra_mail_relations USING btree (mail_id, target_type, sort_order);


--
-- Name: extra_pv_items_release_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX extra_pv_items_release_date_idx ON public.extra_pv_items USING btree (release_date DESC);


--
-- Name: extra_pv_relations_pv_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX extra_pv_relations_pv_idx ON public.extra_pv_relations USING btree (pv_id, target_type, sort_order);


--
-- Name: extra_touch_room_character_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX extra_touch_room_character_idx ON public.extra_touch_room_items USING btree (character_key, release_date DESC);


--
-- Name: extra_touch_room_occasion_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX extra_touch_room_occasion_idx ON public.extra_touch_room_items USING btree (occasion);


--
-- Name: extra_touch_room_relations_item_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX extra_touch_room_relations_item_idx ON public.extra_touch_room_relations USING btree (touch_room_id, target_type, sort_order);


--
-- Name: extra_touch_room_release_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX extra_touch_room_release_date_idx ON public.extra_touch_room_items USING btree (release_date DESC);


--
-- Name: guestbook_entries_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX guestbook_entries_created_at_idx ON public.guestbook_entries USING btree (created_at DESC);


--
-- Name: guestbook_entries_public_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX guestbook_entries_public_idx ON public.guestbook_entries USING btree (is_private, is_approved, is_deleted, created_at DESC);


--
-- Name: home_hero_images_sort_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX home_hero_images_sort_idx ON public.home_hero_images USING btree (sort_order, created_at);


--
-- Name: idx_calendar_entries_schedule_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_calendar_entries_schedule_date ON public.calendar_entries USING btree (schedule_date);


--
-- Name: idx_cards_character_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cards_character_id ON public.cards USING btree (primary_character_id);


--
-- Name: idx_cards_origin_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cards_origin_key ON public.cards USING btree (origin_key);


--
-- Name: idx_cards_release_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cards_release_year ON public.cards USING btree (release_year);


--
-- Name: idx_cards_server_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cards_server_id ON public.cards USING btree (server_id);


--
-- Name: idx_events_character_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_character_id ON public.events USING btree (primary_character_id);


--
-- Name: idx_events_origin_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_origin_key ON public.events USING btree (origin_key);


--
-- Name: idx_events_release_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_release_year ON public.events USING btree (release_year);


--
-- Name: idx_events_server_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_server_id ON public.events USING btree (server_id);


--
-- Name: idx_events_subtype; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_subtype ON public.events USING btree (subtype);


--
-- Name: idx_item_characters_character; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_item_characters_character ON public.item_characters USING btree (character_id);


--
-- Name: idx_item_characters_item; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_item_characters_item ON public.item_characters USING btree (item_type, item_id);


--
-- Name: idx_item_relations_child; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_item_relations_child ON public.item_relations USING btree (child_type, child_id);


--
-- Name: idx_item_relations_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_item_relations_parent ON public.item_relations USING btree (parent_type, parent_id);


--
-- Name: idx_item_relations_relation_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_item_relations_relation_type ON public.item_relations USING btree (relation_type);


--
-- Name: idx_item_tags_item; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_item_tags_item ON public.item_tags USING btree (item_type, item_id, sort_order);


--
-- Name: idx_item_tags_tag; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_item_tags_tag ON public.item_tags USING btree (tag_id);


--
-- Name: idx_item_tags_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_item_tags_unique ON public.item_tags USING btree (item_type, item_id, tag_id);


--
-- Name: idx_media_assets_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_media_assets_parent ON public.media_assets USING btree (parent_type, parent_id);


--
-- Name: idx_media_assets_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_media_assets_type ON public.media_assets USING btree (media_type);


--
-- Name: idx_media_assets_usage; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_media_assets_usage ON public.media_assets USING btree (usage_type);


--
-- Name: idx_phone_article_comments_post_visible_sort; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_phone_article_comments_post_visible_sort ON public.phone_article_comments USING btree (post_id, is_visible, sort_order, created_at);


--
-- Name: idx_phone_article_posts_pub_published_sort; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_phone_article_posts_pub_published_sort ON public.phone_article_posts USING btree (publisher_id, is_published, sort_order, created_at DESC);


--
-- Name: idx_phone_article_publishers_active_sort; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_phone_article_publishers_active_sort ON public.phone_article_publishers USING btree (is_active, sort_order, created_at DESC);


--
-- Name: idx_phone_item_choices_group; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_phone_item_choices_group ON public.phone_item_choices USING btree (phone_item_id, choice_group_key, sort_order);


--
-- Name: idx_phone_item_choices_phone_item_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_phone_item_choices_phone_item_id ON public.phone_item_choices USING btree (phone_item_id);


--
-- Name: idx_phone_item_entries_phone_item_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_phone_item_entries_phone_item_id ON public.phone_item_entries USING btree (phone_item_id);


--
-- Name: idx_phone_item_entries_sort_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_phone_item_entries_sort_order ON public.phone_item_entries USING btree (phone_item_id, sort_order);


--
-- Name: idx_phone_items_character_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_phone_items_character_id ON public.phone_items USING btree (primary_character_id);


--
-- Name: idx_phone_items_origin_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_phone_items_origin_key ON public.phone_items USING btree (origin_key);


--
-- Name: idx_phone_items_release_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_phone_items_release_year ON public.phone_items USING btree (release_year);


--
-- Name: idx_phone_items_server_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_phone_items_server_id ON public.phone_items USING btree (server_id);


--
-- Name: idx_phone_items_subtype; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_phone_items_subtype ON public.phone_items USING btree (subtype);


--
-- Name: idx_phone_profile_custom_owner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_phone_profile_custom_owner ON public.phone_profile_custom USING btree (owner_type, owner_id, is_active, created_at DESC);


--
-- Name: idx_phone_profile_options_active_sort; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_phone_profile_options_active_sort ON public.phone_profile_options USING btree (is_active, sort_order, created_at DESC);


--
-- Name: idx_phone_profile_options_shared_custom; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_phone_profile_options_shared_custom ON public.phone_profile_options USING btree (is_shared_custom) WHERE ((is_active = true) AND (is_shared_custom = true));


--
-- Name: idx_stories_character_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stories_character_id ON public.stories USING btree (primary_character_id);


--
-- Name: idx_stories_main_kind; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stories_main_kind ON public.stories USING btree (main_kind);


--
-- Name: idx_stories_main_sort; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stories_main_sort ON public.stories USING btree (subtype, part_no, volume_no, main_season, chapter_no, manual_sort_order);


--
-- Name: idx_stories_origin_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stories_origin_key ON public.stories USING btree (origin_key);


--
-- Name: idx_stories_release_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stories_release_year ON public.stories USING btree (release_year);


--
-- Name: idx_stories_route_scope; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stories_route_scope ON public.stories USING btree (route_scope);


--
-- Name: idx_stories_server_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stories_server_id ON public.stories USING btree (server_id);


--
-- Name: idx_stories_subtype; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stories_subtype ON public.stories USING btree (subtype);


--
-- Name: idx_stories_visibility; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stories_visibility ON public.stories USING btree (visibility);


--
-- Name: idx_tags_name_lower; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_tags_name_lower ON public.tags USING btree (lower(name));


--
-- Name: idx_translations_language; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_translations_language ON public.translations USING btree (language_code);


--
-- Name: idx_translations_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_translations_parent ON public.translations USING btree (parent_type, parent_id);


--
-- Name: idx_translations_primary; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_translations_primary ON public.translations USING btree (is_primary);


--
-- Name: illustration_images_illustration_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX illustration_images_illustration_idx ON public.illustration_images USING btree (illustration_id, sort_order, created_at);


--
-- Name: illustration_images_one_primary_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX illustration_images_one_primary_idx ON public.illustration_images USING btree (illustration_id) WHERE (is_primary = true);


--
-- Name: illustrations_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX illustrations_created_at_idx ON public.illustrations USING btree (created_at DESC);


--
-- Name: illustrations_primary_character_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX illustrations_primary_character_idx ON public.illustrations USING btree (primary_character_id);


--
-- Name: illustrations_release_year_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX illustrations_release_year_idx ON public.illustrations USING btree (release_year DESC);


--
-- Name: image_derivatives_source_kind_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX image_derivatives_source_kind_idx ON public.image_derivatives USING btree (source_kind);


--
-- Name: image_derivatives_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX image_derivatives_status_idx ON public.image_derivatives USING btree (status);


--
-- Name: maker_message_threads_owner_deleted_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX maker_message_threads_owner_deleted_idx ON public.maker_message_threads USING btree (owner_id, is_deleted);


--
-- Name: maker_message_threads_owner_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX maker_message_threads_owner_idx ON public.maker_message_threads USING btree (owner_id);


--
-- Name: maker_message_threads_updated_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX maker_message_threads_updated_idx ON public.maker_message_threads USING btree (updated_at DESC, created_at DESC);


--
-- Name: maker_moments_owner_deleted_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX maker_moments_owner_deleted_idx ON public.maker_moments USING btree (owner_id, is_deleted);


--
-- Name: maker_moments_owner_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX maker_moments_owner_idx ON public.maker_moments USING btree (owner_id);


--
-- Name: maker_moments_updated_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX maker_moments_updated_idx ON public.maker_moments USING btree (updated_at DESC, created_at DESC);


--
-- Name: phone_profile_options_sort_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX phone_profile_options_sort_idx ON public.phone_profile_options USING btree (sort_order, created_at DESC);


--
-- Name: site_updates_public_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX site_updates_public_order_idx ON public.site_updates USING btree (is_published, is_pinned DESC, published_at DESC);


--
-- Name: tags_key_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tags_key_unique ON public.tags USING btree (key);


--
-- Name: tags_label_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tags_label_unique ON public.tags USING btree (label);


--
-- Name: uq_cards_origin_server; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_cards_origin_server ON public.cards USING btree (origin_key, server_id);


--
-- Name: uq_events_origin_server; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_events_origin_server ON public.events USING btree (origin_key, server_id);


--
-- Name: uq_phone_items_origin_server; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_phone_items_origin_server ON public.phone_items USING btree (origin_key, server_id);


--
-- Name: uq_stories_origin_server; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_stories_origin_server ON public.stories USING btree (origin_key, server_id);


--
-- Name: cards trg_cards_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_cards_updated_at BEFORE UPDATE ON public.cards FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: events trg_events_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: phone_items trg_phone_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_phone_items_updated_at BEFORE UPDATE ON public.phone_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: stories trg_stories_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_stories_updated_at BEFORE UPDATE ON public.stories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: translations trg_translations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_translations_updated_at BEFORE UPDATE ON public.translations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: card_images card_images_card_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_images
    ADD CONSTRAINT card_images_card_id_fkey FOREIGN KEY (card_id) REFERENCES public.cards(id) ON DELETE CASCADE;


--
-- Name: cards cards_primary_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cards
    ADD CONSTRAINT cards_primary_character_id_fkey FOREIGN KEY (primary_character_id) REFERENCES public.characters(id) ON DELETE RESTRICT;


--
-- Name: cards cards_server_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cards
    ADD CONSTRAINT cards_server_id_fkey FOREIGN KEY (server_id) REFERENCES public.servers(id) ON DELETE RESTRICT;


--
-- Name: events events_primary_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_primary_character_id_fkey FOREIGN KEY (primary_character_id) REFERENCES public.characters(id) ON DELETE SET NULL;


--
-- Name: events events_server_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_server_id_fkey FOREIGN KEY (server_id) REFERENCES public.servers(id) ON DELETE RESTRICT;


--
-- Name: extra_mail_relations extra_mail_relations_mail_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extra_mail_relations
    ADD CONSTRAINT extra_mail_relations_mail_id_fkey FOREIGN KEY (mail_id) REFERENCES public.extra_mail_items(id) ON DELETE CASCADE;


--
-- Name: extra_pv_relations extra_pv_relations_pv_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extra_pv_relations
    ADD CONSTRAINT extra_pv_relations_pv_id_fkey FOREIGN KEY (pv_id) REFERENCES public.extra_pv_items(id) ON DELETE CASCADE;


--
-- Name: extra_touch_room_relations extra_touch_room_relations_touch_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extra_touch_room_relations
    ADD CONSTRAINT extra_touch_room_relations_touch_room_id_fkey FOREIGN KEY (touch_room_id) REFERENCES public.extra_touch_room_items(id) ON DELETE CASCADE;


--
-- Name: illustration_images illustration_images_illustration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.illustration_images
    ADD CONSTRAINT illustration_images_illustration_id_fkey FOREIGN KEY (illustration_id) REFERENCES public.illustrations(id) ON DELETE CASCADE;


--
-- Name: illustrations illustrations_primary_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.illustrations
    ADD CONSTRAINT illustrations_primary_character_id_fkey FOREIGN KEY (primary_character_id) REFERENCES public.characters(id) ON DELETE SET NULL;


--
-- Name: illustrations illustrations_server_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.illustrations
    ADD CONSTRAINT illustrations_server_id_fkey FOREIGN KEY (server_id) REFERENCES public.servers(id) ON DELETE SET NULL;


--
-- Name: item_characters item_characters_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_characters
    ADD CONSTRAINT item_characters_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;


--
-- Name: item_tags item_tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_tags
    ADD CONSTRAINT item_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;


--
-- Name: media_collections media_collections_primary_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_collections
    ADD CONSTRAINT media_collections_primary_character_id_fkey FOREIGN KEY (primary_character_id) REFERENCES public.characters(id) ON DELETE SET NULL;


--
-- Name: media_collections media_collections_server_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_collections
    ADD CONSTRAINT media_collections_server_id_fkey FOREIGN KEY (server_id) REFERENCES public.servers(id) ON DELETE SET NULL;


--
-- Name: phone_article_comments phone_article_comments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phone_article_comments
    ADD CONSTRAINT phone_article_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.phone_article_posts(id) ON DELETE CASCADE;


--
-- Name: phone_article_posts phone_article_posts_publisher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phone_article_posts
    ADD CONSTRAINT phone_article_posts_publisher_id_fkey FOREIGN KEY (publisher_id) REFERENCES public.phone_article_publishers(id) ON DELETE CASCADE;


--
-- Name: phone_item_choices phone_item_choices_phone_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phone_item_choices
    ADD CONSTRAINT phone_item_choices_phone_item_id_fkey FOREIGN KEY (phone_item_id) REFERENCES public.phone_items(id) ON DELETE CASCADE;


--
-- Name: phone_item_entries phone_item_entries_phone_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phone_item_entries
    ADD CONSTRAINT phone_item_entries_phone_item_id_fkey FOREIGN KEY (phone_item_id) REFERENCES public.phone_items(id) ON DELETE CASCADE;


--
-- Name: phone_items phone_items_primary_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phone_items
    ADD CONSTRAINT phone_items_primary_character_id_fkey FOREIGN KEY (primary_character_id) REFERENCES public.characters(id) ON DELETE SET NULL;


--
-- Name: phone_items phone_items_server_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phone_items
    ADD CONSTRAINT phone_items_server_id_fkey FOREIGN KEY (server_id) REFERENCES public.servers(id) ON DELETE RESTRICT;


--
-- Name: stories stories_primary_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stories
    ADD CONSTRAINT stories_primary_character_id_fkey FOREIGN KEY (primary_character_id) REFERENCES public.characters(id) ON DELETE SET NULL;


--
-- Name: stories stories_server_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stories
    ADD CONSTRAINT stories_server_id_fkey FOREIGN KEY (server_id) REFERENCES public.servers(id) ON DELETE RESTRICT;


--
-- Name: site_updates No public delete site updates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "No public delete site updates" ON public.site_updates FOR DELETE USING (false);


--
-- Name: site_updates No public insert site updates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "No public insert site updates" ON public.site_updates FOR INSERT WITH CHECK (false);


--
-- Name: site_updates No public update site updates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "No public update site updates" ON public.site_updates FOR UPDATE USING (false) WITH CHECK (false);


--
-- Name: site_updates Public can read published site updates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can read published site updates" ON public.site_updates FOR SELECT USING ((is_published = true));


--
-- Name: card_images; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.card_images ENABLE ROW LEVEL SECURITY;

--
-- Name: extra_mail_items extra mail public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "extra mail public read" ON public.extra_mail_items FOR SELECT TO authenticated, anon USING ((is_published = true));


--
-- Name: extra_mail_relations extra mail relations public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "extra mail relations public read" ON public.extra_mail_relations FOR SELECT TO authenticated, anon USING ((EXISTS ( SELECT 1
   FROM public.extra_mail_items m
  WHERE ((m.id = extra_mail_relations.mail_id) AND (m.is_published = true)))));


--
-- Name: extra_pv_items extra pv public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "extra pv public read" ON public.extra_pv_items FOR SELECT TO authenticated, anon USING ((is_published = true));


--
-- Name: extra_pv_relations extra pv relations public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "extra pv relations public read" ON public.extra_pv_relations FOR SELECT TO authenticated, anon USING ((EXISTS ( SELECT 1
   FROM public.extra_pv_items pv
  WHERE ((pv.id = extra_pv_relations.pv_id) AND (pv.is_published = true)))));


--
-- Name: extra_touch_room_items extra touch room public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "extra touch room public read" ON public.extra_touch_room_items FOR SELECT TO authenticated, anon USING ((is_published = true));


--
-- Name: extra_touch_room_relations extra touch room relations public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "extra touch room relations public read" ON public.extra_touch_room_relations FOR SELECT TO authenticated, anon USING ((EXISTS ( SELECT 1
   FROM public.extra_touch_room_items item
  WHERE ((item.id = extra_touch_room_relations.touch_room_id) AND (item.is_published = true)))));


--
-- Name: extra_mail_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.extra_mail_items ENABLE ROW LEVEL SECURITY;

--
-- Name: extra_mail_relations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.extra_mail_relations ENABLE ROW LEVEL SECURITY;

--
-- Name: extra_pv_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.extra_pv_items ENABLE ROW LEVEL SECURITY;

--
-- Name: extra_pv_relations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.extra_pv_relations ENABLE ROW LEVEL SECURITY;

--
-- Name: extra_touch_room_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.extra_touch_room_items ENABLE ROW LEVEL SECURITY;

--
-- Name: extra_touch_room_relations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.extra_touch_room_relations ENABLE ROW LEVEL SECURITY;

--
-- Name: home_hero_images; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.home_hero_images ENABLE ROW LEVEL SECURITY;

--
-- Name: illustration_images; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.illustration_images ENABLE ROW LEVEL SECURITY;

--
-- Name: illustrations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.illustrations ENABLE ROW LEVEL SECURITY;

--
-- Name: image_derivatives; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.image_derivatives ENABLE ROW LEVEL SECURITY;

--
-- Name: maker_message_threads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.maker_message_threads ENABLE ROW LEVEL SECURITY;

--
-- Name: maker_moments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.maker_moments ENABLE ROW LEVEL SECURITY;

--
-- Name: phone_profile_custom; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.phone_profile_custom ENABLE ROW LEVEL SECURITY;

--
-- Name: phone_profile_options; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.phone_profile_options ENABLE ROW LEVEL SECURITY;

--
-- Name: phone_profile_options phone_profile_options_admin_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY phone_profile_options_admin_write ON public.phone_profile_options TO authenticated USING (true) WITH CHECK (true);


--
-- Name: phone_profile_options phone_profile_options_anon_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY phone_profile_options_anon_read ON public.phone_profile_options FOR SELECT TO authenticated, anon USING ((is_active = true));


--
-- Name: phone_profile_selected; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.phone_profile_selected ENABLE ROW LEVEL SECURITY;

--
-- Name: card_images public can read published card images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public can read published card images" ON public.card_images FOR SELECT TO authenticated, anon USING ((EXISTS ( SELECT 1
   FROM public.cards c
  WHERE ((c.id = card_images.card_id) AND (c.is_published = true)))));


--
-- Name: illustration_images public can read published illustration images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public can read published illustration images" ON public.illustration_images FOR SELECT TO authenticated, anon USING ((EXISTS ( SELECT 1
   FROM public.illustrations i
  WHERE ((i.id = illustration_images.illustration_id) AND (i.is_published = true)))));


--
-- Name: illustrations public can read published illustrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public can read published illustrations" ON public.illustrations FOR SELECT TO authenticated, anon USING ((is_published = true));


--
-- Name: home_hero_images public read active home hero images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public read active home hero images" ON public.home_hero_images FOR SELECT TO authenticated, anon USING ((is_active = true));


--
-- Name: image_derivatives public read image derivatives; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public read image derivatives" ON public.image_derivatives FOR SELECT USING (true);


--
-- PostgreSQL database dump complete
--

\unrestrict YcTbHQ9MwC6HvBow9Eyw3cMu56PzHkV1m9SG4FJu3QXgyAMAeFLnAb59sZ2EIB2

