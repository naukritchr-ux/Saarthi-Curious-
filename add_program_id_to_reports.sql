-- Add program_id column to reports table
ALTER TABLE public.reports 
ADD COLUMN program_id INTEGER REFERENCES programs(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_reports_program_id ON public.reports(program_id);
