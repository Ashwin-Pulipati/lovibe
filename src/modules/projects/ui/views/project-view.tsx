"use client"
import { ResizableHandle, ResizablePanelGroup, ResizablePanel } from "@/components/ui/resizable"
import { MessagesContainer } from "../components/messages-container"
import { Suspense, useState } from "react"
import { Fragment } from "@/generated/prisma"

interface ProjectViewProps {
    projectId: string,
}

export const ProjectView = (
    {
        projectId,
    }: ProjectViewProps) => {
    const [activeFragment, setActiveFragment] = useState<Fragment | null>(null)
  return (
      <div className="h-screen">
          <ResizablePanelGroup direction="horizontal">
              <ResizablePanel
                  defaultSize={35}
                  minSize={20}
                  className="flex flex-col min-h-0"
              >
                  <Suspense fallback={<div>Loading messages...</div>}>
                      <MessagesContainer
                          projectId={projectId}
                          activeFragment={activeFragment}
                          setActiveFragment={setActiveFragment}
                      />
                  </Suspense>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel
                  defaultSize={65}
                  minSize={50}
              >
                  {/* {JSON.stringify(messages, null, 2)} */}
                  TODO: Preview
              </ResizablePanel>
          </ResizablePanelGroup>
    </div>
  );
}

export default ProjectView;