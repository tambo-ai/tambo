ALTER TABLE "messages" ADD CONSTRAINT "chk_messages_reasoning_max_len" CHECK ("messages"."reasoning" IS NULL
            OR (jsonb_typeof("messages"."reasoning"->'json') = 'array' AND
                jsonb_array_length("messages"."reasoning"->'json') <= 200));