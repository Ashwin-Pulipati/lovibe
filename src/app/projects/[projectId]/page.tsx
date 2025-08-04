import { getQueryClient, trpc } from "@/trpc/server";
import { ProjectView } from "../../../modules/projects/ui/views/project-view";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Bouncy } from "ldrs/react";

interface Props {
    params: Promise<{ projectId: string }>;
}

const Projects = async ({ params }: Props) => {
    const { projectId } = await params;

    const queryClient = getQueryClient();
    void queryClient.prefetchQuery(
        trpc.messages.getMany.queryOptions({ projectId })
    );
    void queryClient.prefetchQuery(
        trpc.projects.getOne.queryOptions({ id: projectId }));
    
    return (
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ErrorBoundary fallback={<p>Error!</p>}>
          <Suspense
            fallback={
              <div className="flex justify-center items-center h-screen w-screen">
                <Bouncy size="45" speed="1.75" color="oklch(0.58 0.23 336)" />
              </div>
            }
          >
            <ProjectView projectId={projectId} />
          </Suspense>
        </ErrorBoundary>
      </HydrationBoundary>
    );
}

export default Projects;