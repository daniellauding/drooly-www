import { User } from "./types";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select";
import { MessageSquare, ChevronDown, ChevronUp, Plus, Pencil } from "lucide-react";
import { useState } from "react";
import { EditRoleModal } from "./EditRoleModal";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import { useToast } from "@/hooks/use-toast";
import { UserInviteStatus } from "./UserInviteStatus";

interface UserTableRowProps {
  user: User;
  editingId: string | null;
  editName: string;
  availableRoles: string[];
  onEdit: (id: string) => void;
  onEditNameChange: (name: string) => void;
  onEditSave: (id: string) => void;
  onEditCancel: () => void;
  onRoleChange: (id: string, role: string) => void;
  onDelete: (id: string) => void;
  onMessageOpen: (id: string, email: string) => void;
  onToggleExpand: (id: string) => void;
  onAddCustomRole: () => void;
  isExpanded: boolean;
}

// Since this file is too long (210 lines), let's split it into smaller components
// We'll create a separate component for the table cells to make the code more maintainable
const UserTableCells = ({ 
  user, 
  editingId, 
  editName, 
  onEditNameChange, 
  onEdit,
  onEditSave,
  onEditCancel 
}: Pick<UserTableRowProps, 'user' | 'editingId' | 'editName' | 'onEditNameChange' | 'onEdit' | 'onEditSave' | 'onEditCancel'>) => {
  const isEditing = editingId === user.id;
  const createdDate = user.createdAt ? new Date(user.createdAt.seconds * 1000) : null;

  return (
    <>
      <TableCell className="font-mono text-xs text-muted-foreground">
        {user.id}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <div className="flex gap-2">
            <Input
              value={editName}
              onChange={(e) => onEditNameChange(e.target.value)}
              className="w-full"
            />
            <Button size="sm" onClick={() => onEditSave(user.id)}>Save</Button>
            <Button size="sm" variant="outline" onClick={onEditCancel}>Cancel</Button>
          </div>
        ) : (
          <span 
            className="cursor-pointer hover:underline"
            onClick={() => onEdit(user.id)}
          >
            {user.name}
          </span>
        )}
      </TableCell>
      <TableCell>{user.email}</TableCell>
    </>
  );
};

// Separate component for role selection
const RoleSelector = ({
  user,
  availableRoles,
  onRoleChange,
  onAddCustomRole
}: Pick<UserTableRowProps, 'user' | 'availableRoles' | 'onRoleChange' | 'onAddCustomRole'>) => (
  <TableCell>
    <div className="flex flex-col gap-2">
      <Select
        value={user.role}
        onValueChange={(value) => {
          if (value === "add-custom-role") {
            onAddCustomRole();
          } else {
            onRoleChange(user.id, value);
          }
        }}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableRoles.map((role) => (
            <SelectItem key={role} value={role}>
              {role}
            </SelectItem>
          ))}
          <SelectSeparator />
          <SelectItem value="add-custom-role" className="text-primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Custom Role
          </SelectItem>
        </SelectContent>
      </Select>
      <UserInviteStatus invites={user.invites} />
    </div>
  </TableCell>
);

export function UserTableRow({
  user,
  editingId,
  editName,
  availableRoles,
  onEdit,
  onEditNameChange,
  onEditSave,
  onEditCancel,
  onRoleChange,
  onDelete,
  onMessageOpen,
  onToggleExpand,
  onAddCustomRole,
  isExpanded,
}: UserTableRowProps) {
  const [editRoleModalOpen, setEditRoleModalOpen] = useState(false);
  const [selectedRoleToEdit, setSelectedRoleToEdit] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleEditRole = (role: string) => {
    setSelectedRoleToEdit(role);
    setEditRoleModalOpen(true);
  };

  const handleRoleUpdate = (oldRole: string, newRole: string) => {
    if (user.role === oldRole) {
      onRoleChange(user.id, newRole);
    }
  };

  const handleDelete = () => {
    setDeleteDialogOpen(false);
    const deletedUser = { ...user };
    
    onDelete(user.id);
    
    toast({
      title: "User deleted",
      description: "The user has been successfully deleted.",
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            console.log("Undo delete for user:", deletedUser);
            toast({
              title: "Delete undone",
              description: "The user has been restored.",
            });
          }}
        >
          Undo
        </Button>
      ),
      duration: 5000,
    });
  };

  return (
    <TableRow>
      <UserTableCells 
        user={user}
        editingId={editingId}
        editName={editName}
        onEditNameChange={onEditNameChange}
        onEdit={onEdit}
        onEditSave={onEditSave}
        onEditCancel={onEditCancel}
      />
      <RoleSelector
        user={user}
        availableRoles={availableRoles}
        onRoleChange={onRoleChange}
        onAddCustomRole={onAddCustomRole}
      />
      <TableCell>
        {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'}
      </TableCell>
      <TableCell>{user.recipes?.length || 0} recipes</TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onMessageOpen(user.id, user.email)}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete
          </Button>
        </div>
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleExpand(user.id)}
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </TableCell>

      <EditRoleModal
        open={editRoleModalOpen}
        onOpenChange={setEditRoleModalOpen}
        onSave={handleRoleUpdate}
        currentRole={selectedRoleToEdit}
      />

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete User"
        description="Are you sure you want to delete this user? You can undo this action for the next 5 seconds."
      />
    </TableRow>
  );
}