-- Function for creating a project and adding the user as an admin, running as a security definer so that it bypasses RLS during creation
CREATE OR REPLACE FUNCTION create_project(p_name text, p_user_id uuid, role text)
RETURNS projects AS $$
DECLARE
  new_project projects%ROWTYPE;
BEGIN
  INSERT INTO projects(name)
  VALUES (p_name)
  RETURNING * INTO new_project;

  INSERT INTO project_members(project_id, user_id, role)
  VALUES (new_project.id, p_user_id, role);

  RETURN new_project;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
