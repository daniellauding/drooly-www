import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, deleteDoc, doc, updateDoc, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { CustomRoleModal } from "./CustomRoleModal";
import { UserMessageModal } from "./UserMessageModal";
import { UserTableRow } from "./UserTableRow";
import { UserRecipesList } from "./UserRecipesList";
import { InviteUsersModal } from "./InviteUsersModal";

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: { seconds: number };
  recipes?: any[];
}

export function BackofficeUsers() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [customRoleModalOpen, setCustomRoleModalOpen] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>("");
  const [expandedUsers, setExpandedUsers] = useState<string[]>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>([
    "user",
    "admin",
    "superadmin"
  ]);

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['admin-users', searchQuery],
    queryFn: async () => {
      console.log("Fetching users data with search:", searchQuery);
      const usersRef = collection(db, 'users');
      let q = query(usersRef);
      
      if (searchQuery) {
        q = query(usersRef, 
          where('email', '>=', searchQuery),
          where('email', '<=', searchQuery + '\uf8ff')
        );
      }
      
      const snapshot = await getDocs(q);
      
      const usersData = await Promise.all(snapshot.docs.map(async (doc) => {
        const recipesRef = collection(db, 'recipes');
        const recipesQuery = query(recipesRef, where('creatorId', '==', doc.id));
        const recipesSnapshot = await getDocs(recipesQuery);
        
        return {
          id: doc.id,
          ...doc.data(),
          recipes: recipesSnapshot.docs.map(recipeDoc => ({
            id: recipeDoc.id,
            ...recipeDoc.data()
          }))
        };
      }));

      return usersData as User[];
    }
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    
    try {
      await deleteDoc(doc(db, "users", id));
      toast({
        title: "User deleted",
        description: "The user has been successfully deleted."
      });
      refetch();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete user. Please try again."
      });
    }
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      await updateDoc(doc(db, "users", id), {
        role: newRole
      });
      toast({
        title: "Role updated",
        description: "The user's role has been successfully updated."
      });
      refetch();
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update role. Please try again."
      });
    }
  };

  const handleEdit = async (id: string) => {
    if (!editName.trim()) return;
    
    try {
      await updateDoc(doc(db, "users", id), {
        name: editName
      });
      toast({
        title: "User updated",
        description: "The user has been successfully updated."
      });
      setEditingId(null);
      refetch();
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user. Please try again."
      });
    }
  };

  const handleAddCustomRole = (role: string) => {
    if (!availableRoles.includes(role)) {
      setAvailableRoles(prev => [...prev, role]);
      toast({
        title: "Role added",
        description: `The role "${role}" has been added to the available roles.`
      });
    }
  };

  if (isLoading) return <div className="p-4">Loading users data...</div>;
  if (!users) return <div className="p-4">No users found.</div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={() => setCustomRoleModalOpen(true)}>
          Add Custom Role
        </Button>
        <Button onClick={() => setInviteModalOpen(true)}>
          Invite Users
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Recipes</TableHead>
            <TableHead>Actions</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <>
              <UserTableRow
                key={user.id}
                user={user}
                editingId={editingId}
                editName={editName}
                availableRoles={availableRoles}
                onEdit={(id) => {
                  setEditingId(id);
                  setEditName(user.name);
                }}
                onEditNameChange={setEditName}
                onEditSave={handleEdit}
                onEditCancel={() => setEditingId(null)}
                onRoleChange={handleRoleChange}
                onDelete={handleDelete}
                onMessageOpen={(id, email) => {
                  setSelectedUserId(id);
                  setSelectedUserEmail(email);
                  setMessageModalOpen(true);
                }}
                onToggleExpand={toggleUserExpansion}
                isExpanded={expandedUsers.includes(user.id)}
              />
              {expandedUsers.includes(user.id) && (
                <UserRecipesList recipes={user.recipes || []} />
              )}
            </>
          ))}
        </TableBody>
      </Table>

      <CustomRoleModal
        open={customRoleModalOpen}
        onOpenChange={setCustomRoleModalOpen}
        onSave={handleAddCustomRole}
      />

      <UserMessageModal
        open={messageModalOpen}
        onOpenChange={setMessageModalOpen}
        userId={selectedUserId}
        userEmail={selectedUserEmail}
      />

      <InviteUsersModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
      />
    </div>
  );
}
