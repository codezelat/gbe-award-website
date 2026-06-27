CREATE TYPE "public"."winner_article_type" AS ENUM('article', 'news');--> statement-breakpoint
CREATE TYPE "public"."winner_indexing_status" AS ENUM('noindex', 'index');--> statement-breakpoint
CREATE TYPE "public"."winner_recipient_type" AS ENUM('person', 'organization');--> statement-breakpoint
CREATE TABLE "winner_slug_aliases" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"winner_id" text NOT NULL,
	"alias" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "past_winners" ALTER COLUMN "market" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "past_winners" ALTER COLUMN "market" DROP NOT NULL;--> statement-breakpoint
UPDATE "past_winners" SET "market" = NULL;--> statement-breakpoint
ALTER TABLE "past_winners" ADD COLUMN "recipient_type" "winner_recipient_type";--> statement-breakpoint
ALTER TABLE "past_winners" ADD COLUMN "article_type" "winner_article_type" DEFAULT 'article';--> statement-breakpoint
ALTER TABLE "past_winners" ADD COLUMN "headline" text;--> statement-breakpoint
ALTER TABLE "past_winners" ADD COLUMN "standfirst" text;--> statement-breakpoint
ALTER TABLE "past_winners" ADD COLUMN "body" jsonb;--> statement-breakpoint
ALTER TABLE "past_winners" ADD COLUMN "industry" text;--> statement-breakpoint
ALTER TABLE "past_winners" ADD COLUMN "official_website_url" text;--> statement-breakpoint
ALTER TABLE "past_winners" ADD COLUMN "linkedin_url" text;--> statement-breakpoint
ALTER TABLE "past_winners" ADD COLUMN "facebook_url" text;--> statement-breakpoint
ALTER TABLE "past_winners" ADD COLUMN "instagram_url" text;--> statement-breakpoint
ALTER TABLE "past_winners" ADD COLUMN "ceremony_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "past_winners" ADD COLUMN "award_citation" text;--> statement-breakpoint
ALTER TABLE "past_winners" ADD COLUMN "achievement_highlights" text[];--> statement-breakpoint
ALTER TABLE "past_winners" ADD COLUMN "quote_text" text;--> statement-breakpoint
ALTER TABLE "past_winners" ADD COLUMN "quote_author" text;--> statement-breakpoint
ALTER TABLE "past_winners" ADD COLUMN "quote_author_role" text;--> statement-breakpoint
ALTER TABLE "past_winners" ADD COLUMN "hero_image_url" text;--> statement-breakpoint
ALTER TABLE "past_winners" ADD COLUMN "hero_image_alt" text;--> statement-breakpoint
ALTER TABLE "past_winners" ADD COLUMN "hero_image_caption" text;--> statement-breakpoint
ALTER TABLE "past_winners" ADD COLUMN "hero_image_credit" text;--> statement-breakpoint
ALTER TABLE "past_winners" ADD COLUMN "social_image_url" text;--> statement-breakpoint
ALTER TABLE "past_winners" ADD COLUMN "author_name" text;--> statement-breakpoint
ALTER TABLE "past_winners" ADD COLUMN "published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "past_winners" ADD COLUMN "content_updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "past_winners" ADD COLUMN "fact_checked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "past_winners" ADD COLUMN "indexing_status" "winner_indexing_status" DEFAULT 'noindex';--> statement-breakpoint
ALTER TABLE "past_winners" ADD COLUMN "source_notes" text[];--> statement-breakpoint
ALTER TABLE "winner_slug_aliases" ADD CONSTRAINT "winner_slug_aliases_winner_id_past_winners_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."past_winners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "winner_slug_aliases_alias_idx" ON "winner_slug_aliases" USING btree ("alias");--> statement-breakpoint
CREATE INDEX "winner_slug_aliases_winner_id_idx" ON "winner_slug_aliases" USING btree ("winner_id");--> statement-breakpoint
CREATE INDEX "past_winners_published_story_idx" ON "past_winners" USING btree ("published_at" DESC NULLS LAST) WHERE "past_winners"."status" = 'published' and "past_winners"."indexing_status" = 'index';
