import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Globe, Bot, Instagram, Youtube, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RecipeUrlDialog } from "./RecipeUrlDialog";
import { Recipe } from "@/types/recipe";

interface RecipeCreationOptionsProps {
  onRecipeImported: (recipe: Partial<Recipe>) => void;
}

export function RecipeCreationOptions({ onRecipeImported }: RecipeCreationOptionsProps) {
  const [showUrlDialog, setShowUrlDialog] = useState(false);

  return (
    <>
      <div className="mb-8 flex gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full">
              Create Recipe From <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuItem onClick={() => setShowUrlDialog(true)}>
              <Globe className="mr-2 h-4 w-4" />
              Web Scrape URL
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Bot className="mr-2 h-4 w-4" />
              AI Assistant
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Instagram className="mr-2 h-4 w-4" />
              Import from Instagram
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Youtube className="mr-2 h-4 w-4" />
              Import from YouTube
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <RecipeUrlDialog
        open={showUrlDialog}
        onOpenChange={setShowUrlDialog}
        onRecipeScraped={onRecipeImported}
      />
    </>
  );
}