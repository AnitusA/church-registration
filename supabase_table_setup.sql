-- Create participants table for church registration system
-- Run this SQL in your Supabase SQL Editor

-- Create the participants table
CREATE TABLE IF NOT EXISTS participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    participant_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
    section TEXT,
    competitions TEXT[] DEFAULT '{}',
    secretary_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_participants_secretary_id ON participants(secretary_id);
CREATE INDEX IF NOT EXISTS idx_participants_participant_id ON participants(participant_id);
CREATE INDEX IF NOT EXISTS idx_participants_role ON participants(role);

-- Add RLS (Row Level Security) policies
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Policy to allow all operations for now (you can restrict this later)
CREATE POLICY "Allow all operations on participants" ON participants
    FOR ALL USING (true);

-- Alternative: More restrictive policy (uncomment if you want to use this instead)
-- CREATE POLICY "Users can view all participants" ON participants
--     FOR SELECT USING (true);

-- CREATE POLICY "Users can insert participants" ON participants
--     FOR INSERT WITH CHECK (true);

-- CREATE POLICY "Users can update their own participants" ON participants
--     FOR UPDATE USING (secretary_id = auth.uid()::text);

-- CREATE POLICY "Users can delete their own participants" ON participants
--     FOR DELETE USING (secretary_id = auth.uid()::text);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_participants_updated_at
    BEFORE UPDATE ON participants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing
INSERT INTO participants (participant_id, name, role, section, competitions, secretary_id)
VALUES 
    ('S001', 'John Doe', 'student', 'primary', '{"memory verse", "quiz"}', 'secretary-123'),
    ('S002', 'Jane Smith', 'student', 'junior', '{"speech competition"}', 'secretary-123'),
    ('T001', 'Teacher Mary', 'teacher', null, '{}', 'secretary-123')
ON CONFLICT (participant_id) DO NOTHING;

-- Verify the table was created correctly
SELECT * FROM participants;
