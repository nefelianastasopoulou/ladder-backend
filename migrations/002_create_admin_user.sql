-- Create admin user migration
-- This creates the initial admin user

-- Insert admin user (password is hashed for 'admin123')
INSERT INTO users (email, password, full_name, username, is_admin) 
VALUES (
  'nefelianastasopoulou12@gmail.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- admin123
  'Admin User',
  'admin',
  TRUE
) ON CONFLICT (email) DO NOTHING;
