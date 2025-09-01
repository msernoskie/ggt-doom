import { useState } from "react";
import { useAction, useFindMany } from "@gadgetinc/react";
import { Link } from "react-router";
import { api } from "../api";
import { AutoTable } from "@/components/auto";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Download, Trash2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

export default function GameSavesPage() {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [saveToDelete, setSaveToDelete] = useState<string | null>(null);
  const [expandedGames, setExpandedGames] = useState<Set<string>>(new Set());

  const [{ fetching: deleting }, deleteSave] = useAction(api.gameSaves.delete);

  const handleDeleteSave = async (saveId: string) => {
    try {
      await deleteSave({ id: saveId });
      toast.success("Game save deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete save. Please try again.");
    } finally {
      setDeleteConfirmOpen(false);
      setSaveToDelete(null);
    }
  };

  const handleDownloadSave = (saveFile: any) => {
    if (saveFile?.url) {
      window.open(saveFile.url, '_blank');
      toast.success("Download started!");
    } else {
      toast.error("Save file not available for download.");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getGameTypeColor = (gameType: string) => {
    switch (gameType) {
      case 'Flash':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'HTML5':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Native':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const toggleGameExpansion = (gameId: string) => {
    const newExpanded = new Set(expandedGames);
    if (newExpanded.has(gameId)) {
      newExpanded.delete(gameId);
    } else {
      newExpanded.add(gameId);
    }
    setExpandedGames(newExpanded);
  };

  // Get saves count for each game
  const [{ data: savesCounts }] = useFindMany(api.gameSaves, {
      id: true,
      game: { id: true }
    
  });

  const getSavesCount = (gameId: string) => {
    return savesCounts?.filter(save => save.game?.id === gameId).length || 0;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-gray-900">The Arcade Archive</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Manage your saved games and pick up where you left off. Your gaming progress is safely stored here!
        </p>
      </div>

      {/* Upload Save Section */}
      <Card className="border-2 border-dashed border-purple-200 bg-purple-50/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-purple-900">Upload Save File</CardTitle>
              <CardDescription className="text-purple-700">
                Upload a saved game file to continue your progress
              </CardDescription>
            </div>
            <Button
              asChild
              variant="outline"
              className="border-purple-200 text-purple-700 hover:bg-purple-100"
            >
              <Link to="/upload-save">
                <Plus className="w-4 h-4 mr-1" />
                Upload Save
              </Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Games Table */}
      <Card className="border-green-200 bg-green-50/30">
        <CardHeader>
          <CardTitle className="text-xl text-green-900">Your Games & Saves</CardTitle>
          <CardDescription className="text-green-700">
            Browse your games and manage their save files
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AutoTable
            model={api.game}
            selectable={false}
            select={{
              id: true,
              name: true,
              gameType: true,
              description: {
                truncatedHTML: true
              }
            }}
            columns={[
              "name",
              {
                header: "Type",
                render: ({ record }) => (
                  <Badge className={getGameTypeColor(record.gameType)}>
                    {record.gameType}
                  </Badge>
                )
              },
              {
                header: "Description",
                render: ({ record }) => (
                  <div 
                    className="max-w-md truncate text-sm text-gray-600"
                    dangerouslySetInnerHTML={{ 
                      __html: record.description?.truncatedHTML || "No description" 
                    }}
                  />
                )
              },
              {
                header: "Saves",
                render: ({ record }) => (
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                    {getSavesCount(record.id)} saves
                  </Badge>
                )
              },
              {
                header: "Actions",
                render: ({ record }) => (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleGameExpansion(record.id)}
                    className="text-green-700 border-green-300 hover:bg-green-100"
                  >
                    {expandedGames.has(record.id) ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-1" />
                        Hide Saves
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-1" />
                        View Saves
                      </>
                    )}
                  </Button>
                )
              }
            ]}
          />
        </CardContent>
      </Card>

      {/* Expanded Game Saves */}
      {Array.from(expandedGames).map((gameId) => (
        <Card key={gameId} className="border-green-200 bg-green-50/20">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
            <CardTitle className="text-lg text-green-900">Save Files</CardTitle>
          </CardHeader>
          <CardContent>
            <AutoTable
              model={api.gameSaves}
              filter={{ gameId: { equals: gameId } }}
              select={{
                id: true,
                name: true,
                description: true,
                createdAt: true,
                saveFile: {
                  url: true,
                  fileName: true
                },
                gameId: true
              }}
              columns={[
                {
                  header: "Save Name",
                  render: ({ record }) => (
                    <div>
                      <div className="font-medium text-gray-900">
                        {record.name || "Unnamed Save"}
                      </div>
                      {record.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {record.description}
                        </div>
                      )}
                    </div>
                  )
                },
                {
                  header: "File Name",
                  render: ({ record }) => (
                    <span className="text-sm text-gray-600 truncate block max-w-xs">
                      {record.saveFile?.fileName || "No file name"}
                    </span>
                  )
                },
                {
                  header: "Created",
                  render: ({ record }) => (
                    <span className="text-sm text-gray-500">
                      {formatDate(record.createdAt)}
                    </span>
                  )
                },
                {
                  header: "Actions",
                  render: ({ record }) => (
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadSave(record.saveFile)}
                        className="text-blue-600 border-blue-300 hover:bg-blue-50"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSaveToDelete(record.id);
                          setDeleteConfirmOpen(true);
                        }}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                        disabled={deleting}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  )
                }
              ]}
            />
          </CardContent>
        </Card>
      ))}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Game Save?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your game save file.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => saveToDelete && handleDeleteSave(saveToDelete)}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}