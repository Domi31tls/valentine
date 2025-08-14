import { Router } from 'express';
import { requireAuth } from '../utils/auth.js';
import { getAllUsers, createUser, deleteUser, updateUserRole, updateUserEmail, getUserByEmail } from '../models/User.js';
import { isRequired, validateEmail, validateEnum } from '../utils/api.js';
import type { AuthenticatedRequest } from '../utils/auth.js';

const router = Router();

/**
 * Middleware pour vérifier que l'utilisateur est admin
 */
const requireAdminRole = (req: AuthenticatedRequest, res: any, next: any) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  next();
};

/**
 * GET /api/users
 * Récupérer la liste de tous les utilisateurs (admin seulement)
 */
router.get('/', requireAuth, requireAdminRole, async (req: AuthenticatedRequest, res) => {
  try {
    console.log(`[${new Date().toISOString()}] GET /api/users - Admin: ${req.user?.email}`);
    
    const users = await getAllUsers();
    
    // Ne pas exposer les données sensibles
    const safeUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      last_login_at: user.last_login_at
    }));

    res.json({
      success: true,
      data: safeUsers
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

/**
 * POST /api/users
 * Créer un nouvel utilisateur (admin seulement)
 */
router.post('/', requireAuth, requireAdminRole, async (req: AuthenticatedRequest, res) => {
  try {
    console.log(`[${new Date().toISOString()}] POST /api/users - Admin: ${req.user?.email}`);
    
    const { email, role = 'editor' } = req.body;

    // Validation des données
    if (!isRequired(email)) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    if (!validateEnum(role, ['admin', 'editor'])) {
      return res.status(400).json({
        success: false,
        error: 'Role must be either "admin" or "editor"'
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Créer l'utilisateur
    const userId = await createUser(email, role as 'admin' | 'editor');

    console.log(`User created successfully: ${email} (${role}) by admin ${req.user?.email}`);

    res.status(201).json({
      success: true,
      data: { 
        id: userId,
        email,
        role,
        message: 'User created successfully'
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user'
    });
  }
});

/**
 * PUT /api/users/:id/role
 * Modifier le rôle d'un utilisateur (admin seulement)
 */
router.put('/:id/role', requireAuth, requireAdminRole, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;

    console.log(`[${new Date().toISOString()}] PUT /api/users/${userId}/role - Admin: ${req.user?.email}`);

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    if (!validateEnum(role, ['admin', 'editor'])) {
      return res.status(400).json({
        success: false,
        error: 'Role must be either "admin" or "editor"'
      });
    }

    // Empêcher de modifier son propre rôle
    if (userId === req.user?.id) {
      return res.status(403).json({
        success: false,
        error: 'Cannot modify your own role'
      });
    }

    const updated = await updateUserRole(userId, role as 'admin' | 'editor');
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log(`User role updated: ID ${userId} to ${role} by admin ${req.user?.email}`);

    res.json({
      success: true,
      data: { message: 'User role updated successfully' }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user role'
    });
  }
});

/**
 * PUT /api/users/:id/email
 * Modifier l'email d'un utilisateur (admin seulement)
 */
router.put('/:id/email', requireAuth, requireAdminRole, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.params.id;
    const { email } = req.body;

    console.log(`[${new Date().toISOString()}] PUT /api/users/${userId}/email - Admin: ${req.user?.email}`);

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    // Validation de l'email
    if (!isRequired(email)) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await getUserByEmail(email);
    if (existingUser && existingUser.id !== userId) {
      return res.status(409).json({
        success: false,
        error: 'This email is already in use by another user'
      });
    }

    const updated = await updateUserEmail(userId, email);
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log(`User email updated: ID ${userId} to ${email} by admin ${req.user?.email}`);

    res.json({
      success: true,
      data: { message: 'User email updated successfully' }
    });
  } catch (error) {
    console.error('Error updating user email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user email'
    });
  }
});

/**
 * DELETE /api/users/:id
 * Supprimer un utilisateur (admin seulement)
 */
router.delete('/:id', requireAuth, requireAdminRole, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.params.id;

    console.log(`[${new Date().toISOString()}] DELETE /api/users/${userId} - Admin: ${req.user?.email}`);

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    // Empêcher de supprimer son propre compte
    if (userId === req.user?.id) {
      return res.status(403).json({
        success: false,
        error: 'Cannot delete your own account'
      });
    }

    // Vérifier qu'il reste au moins un admin
    const allUsers = await getAllUsers();
    const admins = allUsers.filter(u => u.role === 'admin');
    const userToDelete = allUsers.find(u => u.id === userId);
    
    if (userToDelete?.role === 'admin' && admins.length <= 1) {
      return res.status(403).json({
        success: false,
        error: 'Cannot delete the last admin user'
      });
    }

    const deleted = await deleteUser(userId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log(`User deleted: ID ${userId} by admin ${req.user?.email}`);

    res.json({
      success: true,
      data: { message: 'User deleted successfully' }
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user'
    });
  }
});

export default router;
