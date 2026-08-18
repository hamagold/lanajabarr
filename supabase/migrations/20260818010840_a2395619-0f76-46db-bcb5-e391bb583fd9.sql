update auth.users
set encrypted_password = crypt('kurdkurd2026', gen_salt('bf')),
    updated_at = now()
where email = 'hamagoldm@gmail.com';