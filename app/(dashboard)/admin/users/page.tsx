'use client';

import * as React from 'react';
import { useRequireRole } from '@/hooks/use-auth';
import { useUsers } from '@/hooks/use-db';
import { db } from '@/lib/db';
import type { User, UserRole, TeacherStatus } from '@/types';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Search,
    MoreHorizontal,
    Shield,
    Trash2,
    CheckCircle,
    XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function UserManagementPage() {
    const { isAuthorized, loading: authLoading } = useRequireRole(['admin']);
    const allUsers = useUsers();

    const [searchQuery, setSearchQuery] = React.useState('');
    const [roleFilter, setRoleFilter] = React.useState<string>('all');
    const [statusFilter, setStatusFilter] = React.useState<string>('all');

    // User deletion state
    const [userToDelete, setUserToDelete] = React.useState<User | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

    if (authLoading) {
        return <div className="p-8">Loading...</div>;
    }

    if (!isAuthorized) {
        return null;
    }

    const filteredUsers = allUsers?.filter(user => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRole = roleFilter === 'all' || user.role === roleFilter;

        const matchesStatus = statusFilter === 'all' ||
            (user.role === 'teacher' && user.teacherStatus === statusFilter);

        return matchesSearch && matchesRole && matchesStatus;
    });

    const handleUpdateStatus = async (userId: string, status: TeacherStatus) => {
        try {
            await db.users.update(userId, { teacherStatus: status });
            toast.success(`User status updated to ${status}`);
        } catch {
            toast.error('Failed to update status');
        }
    };

    const handleUpdateRole = async (userId: string, role: UserRole) => {
        try {
            const updates: Partial<User> = { role };
            if (role === 'teacher' && !allUsers?.find(u => u.id === userId)?.teacherStatus) {
                updates.teacherStatus = 'pending';
            }
            await db.users.update(userId, updates);
            toast.success(`User role updated to ${role}`);
        } catch {
            toast.error('Failed to update role');
        }
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;

        try {
            // Delete user
            await db.users.delete(userToDelete.id);

            // Delete related data (best effort)
            if (userToDelete.role === 'teacher') {
                await db.teacherProfiles.where('userId').equals(userToDelete.id).delete();
                await db.availability.where('teacherId').equals(userToDelete.id).delete();
                await db.blockedSlots.where('teacherId').equals(userToDelete.id).delete();
            }

            toast.success('User and related data deleted');
            setIsDeleteDialogOpen(false);
            setUserToDelete(null);
        } catch {
            toast.error('Failed to delete user');
        }
    };

    const getStatusBadge = (user: User) => {
        if (user.role !== 'teacher') return null;

        switch (user.teacherStatus) {
            case 'approved':
                return <Badge className="bg-green-100 text-green-800 border-green-200">Approved</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
            case 'rejected':
                return <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
            default:
                return null;
        }
    };

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Platform Users</CardTitle>
                    <CardDescription>
                        Manage student and teacher accounts, approve registrations, or change roles.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or email..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="All Roles" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    <SelectItem value="student">Student</SelectItem>
                                    <SelectItem value="teacher">Teacher</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers && filteredUsers.length > 0 ? (
                                    filteredUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{user.name}</span>
                                                    <span className="text-xs text-muted-foreground">{user.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(user)}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-xs">
                                                {format(new Date(user.createdAt), 'MMM d, yyyy')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />

                                                        {user.role === 'teacher' && user.teacherStatus === 'pending' && (
                                                            <>
                                                                <DropdownMenuItem onClick={() => handleUpdateStatus(user.id, 'approved')}>
                                                                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                                                    Approve Teacher
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleUpdateStatus(user.id, 'rejected')}>
                                                                    <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                                                    Reject Teacher
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                            </>
                                                        )}

                                                        <DropdownMenuItem onClick={() => handleUpdateRole(user.id, user.role === 'student' ? 'teacher' : 'student')}>
                                                            <Shield className="mr-2 h-4 w-4" />
                                                            Make {user.role === 'student' ? 'Teacher' : 'Student'}
                                                        </DropdownMenuItem>

                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={() => {
                                                                setUserToDelete(user);
                                                                setIsDeleteDialogOpen(true);
                                                            }}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete User
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            No users found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the account for <strong>{userToDelete?.name}</strong> and all associated data, including lessons and profile information. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteUser}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete User
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
