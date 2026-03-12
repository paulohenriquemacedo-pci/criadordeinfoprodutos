ALTER TABLE public.modules
  ADD COLUMN research_perplexity text,
  ADD COLUMN research_perplexity_citations text[],
  ADD COLUMN research_gemini text,
  ADD COLUMN research_gemini_citations text[],
  ADD COLUMN research_qwen text,
  ADD COLUMN research_qwen_citations text[];