-- 1. Profiles updates for Roles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'client', 'freelancer'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS portal_access_email TEXT;

-- 2. Freelancers Table
CREATE TABLE IF NOT EXISTS public.freelancers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  location TEXT,
  bio TEXT,
  freelancer_type TEXT,
  skills TEXT[] DEFAULT '{}',
  hourly_rate DECIMAL(12,2) DEFAULT 0,
  project_rate DECIMAL(12,2) DEFAULT 0,
  availability TEXT DEFAULT 'Available' CHECK (availability IN ('Available', 'Partially Available', 'Busy', 'Unavailable', 'On Leave', 'Inactive')),
  availability_note TEXT,
  current_workload INTEGER DEFAULT 0,
  portfolio_url TEXT,
  instagram_url TEXT,
  linkedin_url TEXT,
  website_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_freelancers_updated_at ON public.freelancers;
CREATE TRIGGER update_freelancers_updated_at BEFORE UPDATE ON public.freelancers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 3. Modify tasks to link to freelancers
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS freelancer_id UUID REFERENCES public.freelancers(id) ON DELETE SET NULL;

-- 4. Milestones Table (for Client Portal projects)
CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'Upcoming' CHECK (status IN ('Upcoming', 'In Progress', 'Completed')),
  "order" INTEGER DEFAULT 0,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_milestones_updated_at ON public.milestones;
CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON public.milestones FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 5. Client Updates Table (distinct from internal notes)
CREATE TABLE IF NOT EXISTS public.client_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  is_visible_to_client BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_client_updates_updated_at ON public.client_updates;
CREATE TRIGGER update_client_updates_updated_at BEFORE UPDATE ON public.client_updates FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 6. Modify Files to have is_client_visible
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS is_client_visible BOOLEAN DEFAULT FALSE;

-- 7. Add RLS for Freelancers
ALTER TABLE public.freelancers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own freelancers" ON public.freelancers;
CREATE POLICY "Users can view own freelancers" ON public.freelancers FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own freelancers" ON public.freelancers;
CREATE POLICY "Users can insert own freelancers" ON public.freelancers FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own freelancers" ON public.freelancers;
CREATE POLICY "Users can update own freelancers" ON public.freelancers FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own freelancers" ON public.freelancers;
CREATE POLICY "Users can delete own freelancers" ON public.freelancers FOR DELETE USING (auth.uid() = user_id);

-- 8. Add RLS for Milestones
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own milestones" ON public.milestones;
CREATE POLICY "Users can view own milestones" ON public.milestones FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own milestones" ON public.milestones;
CREATE POLICY "Users can insert own milestones" ON public.milestones FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own milestones" ON public.milestones;
CREATE POLICY "Users can update own milestones" ON public.milestones FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own milestones" ON public.milestones;
CREATE POLICY "Users can delete own milestones" ON public.milestones FOR DELETE USING (auth.uid() = user_id);

-- 9. Add RLS for Client Updates
ALTER TABLE public.client_updates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own client_updates" ON public.client_updates;
CREATE POLICY "Users can view own client_updates" ON public.client_updates FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own client_updates" ON public.client_updates;
CREATE POLICY "Users can insert own client_updates" ON public.client_updates FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own client_updates" ON public.client_updates;
CREATE POLICY "Users can update own client_updates" ON public.client_updates FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own client_updates" ON public.client_updates;
CREATE POLICY "Users can delete own client_updates" ON public.client_updates FOR DELETE USING (auth.uid() = user_id);

-- 10. Client Portal RLS Policies (Overlapping policies using OR logic or new policies)
DROP POLICY IF EXISTS "Clients can view their projects" ON public.projects;
CREATE POLICY "Clients can view their projects" ON public.projects FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'client' 
      AND profiles.client_id = projects.client_id
  )
);

DROP POLICY IF EXISTS "Clients can view their invoices" ON public.invoices;
CREATE POLICY "Clients can view their invoices" ON public.invoices FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'client' 
      AND profiles.client_id = invoices.client_id
  )
);

DROP POLICY IF EXISTS "Clients can view their invoice items" ON public.invoice_items;
CREATE POLICY "Clients can view their invoice items" ON public.invoice_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.invoices 
    JOIN public.profiles ON profiles.client_id = invoices.client_id
    WHERE invoices.id = invoice_items.invoice_id
      AND profiles.user_id = auth.uid()
      AND profiles.role = 'client'
  )
);

DROP POLICY IF EXISTS "Clients can view their milestones" ON public.milestones;
CREATE POLICY "Clients can view their milestones" ON public.milestones FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.projects
    JOIN public.profiles ON profiles.client_id = projects.client_id
    WHERE projects.id = milestones.project_id
      AND profiles.user_id = auth.uid()
      AND profiles.role = 'client'
  )
);

DROP POLICY IF EXISTS "Clients can view their updates" ON public.client_updates;
CREATE POLICY "Clients can view their updates" ON public.client_updates FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'client' 
      AND profiles.client_id = client_updates.client_id
      AND client_updates.is_visible_to_client = TRUE
  )
);

DROP POLICY IF EXISTS "Clients can view their files" ON public.files;
CREATE POLICY "Clients can view their files" ON public.files FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'client' 
      AND profiles.client_id = files.client_id
      AND files.is_client_visible = TRUE
  )
);

DROP POLICY IF EXISTS "Clients can view their client record" ON public.clients;
CREATE POLICY "Clients can view their client record" ON public.clients FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'client' 
      AND profiles.client_id = clients.id
  )
);

-- 11. Trigger for auto-assigning client_id on user creation based on email matching portal_access_email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_client_id UUID;
BEGIN
  -- Check if this email is for a client portal
  SELECT id INTO v_client_id 
  FROM public.clients 
  WHERE portal_access_email = NEW.email 
  LIMIT 1;

  IF v_client_id IS NOT NULL THEN
    -- It's a client
    INSERT INTO public.profiles (user_id, email, full_name, role, client_id)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      'client',
      v_client_id
    );
  ELSE
    -- Normal admin user
    INSERT INTO public.profiles (user_id, email, full_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      'admin'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
