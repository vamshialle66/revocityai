import { supabase } from "@/integrations/supabase/client";

export type UserRole = "user" | "admin";

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

// Check if a user has admin role using edge function (bypasses RLS complexity)
export const isUserAdmin = async (firebaseUserId: string): Promise<boolean> => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-admin`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firebaseUid: firebaseUserId }),
      }
    );

    if (!response.ok) {
      console.error("Error checking admin status:", response.statusText);
      return false;
    }

    const data = await response.json();
    return data.isAdmin === true;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};

// Get user role using edge function
export const getUserRole = async (firebaseUserId: string): Promise<UserRole> => {
  const isAdmin = await isUserAdmin(firebaseUserId);
  return isAdmin ? "admin" : "user";
};

// Set user role (only admins can do this via RLS)
export const setUserRole = async (
  userId: string,
  role: UserRole
): Promise<{ success: boolean; error?: string }> => {
  try {
    // First check if user already has a role
    const { data: existing } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      // Update existing role
      const { error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);
      
      if (error) {
        return { success: false, error: error.message };
      }
    } else {
      // Insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });
      
      if (error) {
        return { success: false, error: error.message };
      }
    }
    
    return { success: true };
  } catch (error: any) {
    console.error("Error setting user role:", error);
    return { success: false, error: error.message };
  }
};

// Get all users with roles (for admin management)
export const getAllUserRoles = async (): Promise<UserRoleRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching user roles:", error);
      return [];
    }
    
    return (data || []).map(row => ({
      id: row.id,
      user_id: row.user_id,
      role: row.role as UserRole,
      created_at: row.created_at,
    }));
  } catch (error) {
    console.error("Error fetching user roles:", error);
    return [];
  }
};

// Remove user role (only admins can do this)
export const removeUserRole = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error("Error removing user role:", error);
    return { success: false, error: error.message };
  }
};
