import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { Users as UsersIcon, UserPlus, Shield, Mail, Search, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InviteUserModal from '@/components/users/InviteUserModal';
import EditUserPermissionsModal from '@/components/users/EditUserPermissionsModal';
import { useLanguage } from '@/components/LanguageProvider';

export default function UsersPage() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => apiClient.auth.me()
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.entities.User.list(),
    enabled: currentUser?.role === 'admin'
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
      toast.success(t('users.updateSuccess'));
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id) => apiClient.entities.User.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(t('users.deleteSuccess'));
    },
    onError: () => {
      toast.error(t('users.deleteError'));
    }
  });

  const handleDeleteUser = (user) => {
    if (window.confirm(t('users.confirmDelete', { name: user.full_name || user.email }))) {
      deleteUserMutation.mutate(user.id);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter || user.extended_role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900">{t('users.accessDenied')}</h2>
          <p className="text-slate-500 mt-2">{t('users.accessDeniedDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('users.title')}</h1>
            <p className="text-slate-500 mt-1">{t('users.subtitle')}</p>
          </div>
          <Button onClick={() => setShowInviteModal(true)} className="gap-2">
            <UserPlus className="w-4 h-4" />
            {t('users.inviteUser')}
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder={t('users.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder={t('users.role')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('users.allRoles')}</SelectItem>
                <SelectItem value="admin">{t('users.admin')}</SelectItem>
                <SelectItem value="manager">{t('users.manager')}</SelectItem>
                <SelectItem value="user">{t('users.user')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Users List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-1/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{user.full_name || t('users.noName')}</h3>
                        {user.role === 'admin' && (
                          <Badge className="bg-purple-100 text-purple-700">
                            <Shield className="w-3 h-3 mr-1" />
                            {t('users.admin')}
                          </Badge>
                        )}
                        {user.extended_role === 'manager' && (
                          <Badge className="bg-blue-100 text-blue-700">
                            {t('users.manager')}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </div>
                      {user.department && (
                        <p className="text-xs text-slate-400 mt-1">{t('users.department')}: {user.department}</p>
                      )}
                    </div>
                  </div>
                  {user.id !== currentUser?.id && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingUser(user)}
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        {t('users.edit')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={deleteUserMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                {user.permissions && user.permissions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                    {user.permissions.map((perm) => (
                      <Badge key={perm} variant="outline" className="text-xs">
                        {perm.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {filteredUsers.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <UsersIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">{t('users.noUsersFound')}</p>
          </div>
        )}
      </div>

      <InviteUserModal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />

      <EditUserPermissionsModal
        open={!!editingUser}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        onSave={(data) => updateUserMutation.mutate({ id: editingUser.id, data })}
        isLoading={updateUserMutation.isPending}
      />
    </div>
  );
}