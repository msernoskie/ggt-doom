import { AutoForm, AutoTable, AutoInput, AutoSubmit, SubmitResultBanner } from "@/components/auto";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Edit, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router";
import { api } from "../api";
import { useAction } from "@gadgetinc/react";

export default function AdminPage() {
  const [{ fetching: deleting }, deleteGame] = useAction(api.game.delete);

  const handleDeleteGame = async (gameId: string, gameName: string) => {
    if (window.confirm(`Are you sure you want to delete "${gameName}"?`)) {
      try {
        await deleteGame({ id: gameId });
        toast.success(`Successfully deleted "${gameName}"`);
      } catch (error) {
        toast.error(`Failed to delete "${gameName}"`);
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return "Unknown";
    
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    if (fileUrl) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName || 'game.swf';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast.error("File not available for download");
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Flash Game Administration</h1>
        <p className="text-muted-foreground text-lg">
          Upload and manage Flash games for your platform
        </p>
      </div>

      <Separator />

      {/* Upload Section */}
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Upload New Flash Game
          </CardTitle>
          <CardDescription>
            Upload .swf files to add new Flash games to your collection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AutoForm
            action={api.game.create}
            defaultValues={{
              game: {
                gameType: "Flash"
              }
            }}
            onSuccess={(record) => {
              toast.success(`Successfully uploaded "${record.name}"`);
            }}
            onFailure={(error) => {
              toast.error(`Failed to upload game: ${error.message}`);
            }}
          >
            <SubmitResultBanner />
            <div className="space-y-6">
              <AutoInput field="name" />
              <AutoInput field="description" />
              <AutoInput field="swfFile" />
            </div>
            <div className="flex justify-end pt-4">
              <AutoSubmit />
            </div>
          </AutoForm>
        </CardContent>
      </Card>

      <Separator />

      {/* Games List Section */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Flash Games Library</CardTitle>
          <CardDescription>
            Manage your existing Flash game collection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AutoTable
            model={api.game}
            live
          />
        </CardContent>
      </Card>
    </div>
  );
}
