import { TreeItem } from "@/types";

import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
} from "./ui/sidebar";

import { ChevronRightIcon, FileIcon, FolderIcon } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible";

interface TreeViewProps {
  data: TreeItem[];
  value?: string | null;
  onSelect?: (value: string) => void;
}

export const TreeView = ({ data, value, onSelect }: TreeViewProps) => {
  return (
      <SidebarProvider>
      <div className="w-full flex">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {data.map((item, index) => (
                    <Tree
                      key={index}
                      item={item}
                      selectedValue={value}
                      onSelect={onSelect}
                      parentPath=""
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        <SidebarRail />
      </div>
    </SidebarProvider>
  );
};

interface TreeProps {
  item: TreeItem;
  selectedValue?: string | null;
  onSelect?: (value: string) => void;
  parentPath: string;
}

const Tree = ({ item, selectedValue, onSelect, parentPath }: TreeProps) => {
  const [name, ...items] = Array.isArray(item) ? item : [item];
  const currentPath = parentPath ? `${parentPath}/${name}` : name;
  const isSelected = selectedValue === currentPath;

  if (!items.length) {
    return (
      <SidebarMenuButton
        isActive={isSelected}
        onClick={() => onSelect?.(currentPath)}
        className={`
     w-full justify-start items-center gap-2
     hover:bg-gray-100
     data-[active=true]:bg-blue-100 data-[active=true]:text-blue-700
     data-[active=true]:font-semibold
    `}
      >
        <FileIcon className="h-4 w-4" />
        <span className="truncate">{name}</span>
      </SidebarMenuButton>
    );
  }

  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
        defaultOpen
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton className="w-full justify-start items-center gap-2 hover:bg-gray-100">
            <ChevronRightIcon className="transition-transform h-4 w-4" />
            <FolderIcon className="h-4 w-4" />
            <span className="truncate">{name}</span>
          </SidebarMenuButton>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <ul className="ml-4 border-l border-gray-200 pl-2">
            {items.map((subItem, index) => (
              <Tree
                key={index}
                item={subItem}
                selectedValue={selectedValue}
                onSelect={onSelect}
                parentPath={currentPath}
              />
            ))}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
};
