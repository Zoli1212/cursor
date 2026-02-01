import { z } from "zod";
import { createTool } from "@inngest/agent-kit";

import { convex } from "@/lib/convex-client";

import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

interface UpdateFilesToolOptions {
  internalKey: string;
}

const paramsSchema = z.object({
  files: z
    .array(
      z.object({
        fileId: z.string().min(1, "File ID is required"),
        content: z.string(),
      })
    )
    .min(1, "Provide at least one file to update"),
});

export const createUpdateFilesTool = ({
  internalKey,
}: UpdateFilesToolOptions) => {
  return createTool({
    name: "updateFiles",
    description:
      "Update multiple files at once. Use this to batch update files. More efficient than updating files one by one.",
    parameters: z.object({
      files: z
        .array(
          z.object({
            fileId: z.string().describe("The ID of the file to update"),
            content: z.string().describe("The new content for the file"),
          })
        )
        .describe("Array of files to update with their new content"),
    }),
    handler: async (params, { step: toolStep }) => {
      const parsed = paramsSchema.safeParse(params);
      if (!parsed.success) {
        return `Error: ${parsed.error.issues[0].message}`;
      }

      const { files } = parsed.data;

      try {
        console.log("updateFiles tool called:", { fileCount: files.length });

        return await toolStep?.run("update-files", async () => {
          const results: { fileId: string; name: string; error?: string }[] = [];

          for (const file of files) {
            const existingFile = await convex.query(api.system.getFileById, {
              internalKey,
              fileId: file.fileId as Id<"files">,
            });

            if (!existingFile) {
              results.push({
                fileId: file.fileId,
                name: file.fileId,
                error: "File not found",
              });
              continue;
            }

            if (existingFile.type === "folder") {
              results.push({
                fileId: file.fileId,
                name: existingFile.name,
                error: "Cannot update a folder",
              });
              continue;
            }

            try {
              await convex.mutation(api.system.updateFile, {
                internalKey,
                fileId: file.fileId as Id<"files">,
                content: file.content,
              });

              results.push({
                fileId: file.fileId,
                name: existingFile.name,
              });
              console.log("File updated:", existingFile.name);
            } catch (err) {
              results.push({
                fileId: file.fileId,
                name: existingFile.name,
                error: err instanceof Error ? err.message : "Unknown error",
              });
            }
          }

          const updated = results.filter((r) => !r.error);
          const failed = results.filter((r) => r.error);

          let response = `Updated ${updated.length} file(s)`;
          if (updated.length > 0) {
            response += `: ${updated.map((r) => r.name).join(", ")}`;
          }
          if (failed.length > 0) {
            response += `. Failed: ${failed.map((r) => `${r.name} (${r.error})`).join(", ")}`;
          }

          return response;
        });
      } catch (error) {
        return `Error updating files: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
  });
};
