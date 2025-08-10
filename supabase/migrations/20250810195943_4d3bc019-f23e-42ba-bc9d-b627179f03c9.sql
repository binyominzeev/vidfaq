-- Fix function search path security warnings
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  username_base TEXT;
  final_username TEXT;
  counter INTEGER := 1;
BEGIN
  -- Extract username from email (part before @)
  username_base := split_part(NEW.email, '@', 1);
  
  -- Remove special characters and make lowercase
  username_base := lower(regexp_replace(username_base, '[^a-zA-Z0-9]', '', 'g'));
  
  -- Ensure username is not empty
  IF username_base = '' THEN
    username_base := 'user';
  END IF;
  
  final_username := username_base;
  
  -- Check if username exists and increment if needed
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    final_username := username_base || counter::text;
    counter := counter + 1;
  END LOOP;
  
  -- Insert profile
  INSERT INTO public.profiles (user_id, username, email, full_name, subdomain)
  VALUES (
    NEW.id, 
    final_username, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', final_username),
    final_username
  );
  
  -- Insert default subscription
  INSERT INTO public.subscriptions (user_id, plan_type, max_videos, max_subdomains)
  VALUES (NEW.id, 'free', 10, 1);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';