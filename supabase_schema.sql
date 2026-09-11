-- Supabase Schema for CareDoc AI

create table documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  file_path text not null,
  doc_type text,              -- 'discharge_summary' | 'prescription'
  original_language text default 'en',
  status text default 'processing',  -- processing | ready | failed
  created_at timestamp default now()
);

create table extracted_summaries (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents not null,
  medications jsonb,
  follow_up jsonb,
  precautions jsonb,
  simplified_text text,
  verification_notes jsonb,   -- flags from the Verifier agent
  created_at timestamp default now()
);

create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents not null,
  role text not null,         -- 'user' | 'assistant'
  content text not null,
  citations jsonb,
  created_at timestamp default now()
);

-- Enable Row Level Security
alter table documents enable row level security;
alter table extracted_summaries enable row level security;
alter table chat_messages enable row level security;

-- Policies for documents
create policy "Users can view their own documents"
on documents for select
using ( auth.uid() = user_id );

create policy "Users can insert their own documents"
on documents for insert
with check ( auth.uid() = user_id );

create policy "Users can update their own documents"
on documents for update
using ( auth.uid() = user_id );

create policy "Users can delete their own documents"
on documents for delete
using ( auth.uid() = user_id );

-- Policies for extracted_summaries
create policy "Users can view summaries of their documents"
on extracted_summaries for select
using ( exists (select 1 from documents where documents.id = extracted_summaries.document_id and documents.user_id = auth.uid()) );

create policy "Service role can insert/update summaries"
on extracted_summaries for all
using ( true ); -- We will use the service role key from the backend to insert

-- Policies for chat_messages
create policy "Users can view messages for their documents"
on chat_messages for select
using ( exists (select 1 from documents where documents.id = chat_messages.document_id and documents.user_id = auth.uid()) );

create policy "Service role can insert messages"
on chat_messages for insert
with check ( true ); -- We will use the service role key from the backend to insert
