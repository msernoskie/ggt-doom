import { useState } from "react";
import { useFindMany, useAction } from "@gadgetinc/react";
import { api } from "../api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Download, Trash2, Calendar, Clock, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { AutoForm, AutoBelongsToInput, AutoFileInput, AutoStringInput, AutoSubmit } from "@/components/auto";

export default function GameSavesPage() {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [saveToDelete, setSaveToDelete] = useState<string | null>(null);
  const [uploadFormOpen, setUploadFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all games for the upload form dropdown
  const [{ data: allGames, fetching: fetchingGames, error: gamesError }] = useFindMany(api.game, {
    select: {
      id: true,
      name: true,
      gameType: true
    }
  });

  // Fetch all game saves with their related game information
  const [{ data: gameSaves, fetching: fetchingSaves, error: savesError }, refetchSaves] = useFindMany(api.gameSaves, {
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      saveFile: {
        url: true,
        fileName: true
      },
      gameSave: {
        id: true,
        name: true,
        description: {
          markdown: true,
          truncatedHTML: true
        },
        gameType: true,
        swfFile: {
          url: true,
          fileName: true
        }
      }
    }
  });

  // Group saves by game
  const gamesSavesMap = new Map();
  gameSaves?.forEach(save => {
    if (save.gameSave) {
      const gameId = save.gameSave.id;
      if (!gamesSavesMap.has(gameId)) {
        gamesSavesMap.set(gameId, {
          game: save.gameSave,
          saves: []
        });
      }
      gamesSavesMap.get(gameId).saves.push(save);
    }
  });

  const gamesWithSaves = Array.from(gamesSavesMap.values());
  const fetching = fetchingGames || fetchingSaves;
  const error = gamesError || savesError;

  const refetch = () => {
    refetchSaves();
  };

  const [{ fetching: deleting }, deleteSave] = useAction(api.gameSaves.delete);

  const handleDeleteSave = async (saveId: string) => {
    try {
      await deleteSave({ id: saveId });
      toast.success("Game save deleted successfully!");
      refetch();
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

  if (fetching && !gameSaves && !allGames) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
          </div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error Loading Saves</CardTitle>
            <CardDescription className="text-red-600">
              We couldn't load your game saves. Please try refreshing the page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasAnySaves = gameSaves && gameSaves.length > 0;

  // Filter saves for download section
  const filteredSaves = gameSaves?.filter(save => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      save.gameSave?.name?.toLowerCase().includes(query) ||
      save.saveFile?.fileName?.toLowerCase().includes(query) ||
      save.name?.toLowerCase().includes(query) ||
      save.description?.toLowerCase().includes(query)
    );
  }) || [];

  const handleUploadSuccess = () => {
    toast.success("Game save uploaded successfully!");
    refetch();
    setUploadFormOpen(false);
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
              variant="outline"
              onClick={() => setUploadFormOpen(!uploadFormOpen)}
              className="border-purple-200 text-purple-700 hover:bg-purple-100"
            >
              <Plus className={`w-4 h-4 mr-1 transition-transform ${uploadFormOpen ? 'rotate-45' : ''}`} />
              {uploadFormOpen ? 'Cancel' : 'Upload Save'}
            </Button>
          </div>
        </CardHeader>
        {uploadFormOpen && (
          <CardContent className="space-y-4 border-t border-purple-200 bg-white">
            <AutoForm
              action={api.gameSaves.create}
              onSuccess={handleUploadSuccess}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Game
                  </label>
                  <AutoBelongsToInput field="gameSave" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Save Name (optional)
                  </label>
                  <AutoStringInput 
                    field="name" 
                    placeholder="e.g., Level 5 Boss Fight"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optional)
                  </label>
                  <AutoStringInput 
                    field="description" 
                    placeholder="e.g., Just before the final boss, full health and items"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 min-h-[80px]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Save File
                  </label>
                  <AutoFileInput field="saveFile" />
                </div>
                <div className="flex gap-2">
                  <AutoSubmit className="bg-purple-600 hover:bg-purple-700" />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setUploadFormOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </AutoForm>
          </CardContent>
        )}
      </Card>

      {/* Download Save Files Section */}
      {hasAnySaves && (
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-green-900">Download Save Files</CardTitle>
                <CardDescription className="text-green-700">
                  Select and download your saved game files ({gameSaves?.length || 0} total saves)
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                {filteredSaves.length} of {gameSaves?.length || 0} saves
              </Badge>
            </div>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search saves by game or file name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-green-200 focus:border-green-500 focus:ring-green-500"
              />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {filteredSaves.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No saves match your search criteria</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-green-200">
                <div className="bg-green-100 px-4 py-3 border-b border-green-200">
                  <div className="grid grid-cols-12 gap-4 text-sm font-medium text-green-900">
                    <div className="col-span-3">Game</div>
                    <div className="col-span-3">Save Name</div>
                    <div className="col-span-2">File Name</div>
                    <div className="col-span-2">Created</div>
                    <div className="col-span-2 text-right">Action</div>
                  </div>
                </div>
                <div className="bg-white">
                  {filteredSaves.map((save, index) => (
                    <div 
                      key={save.id} 
                      className={`px-4 py-3 grid grid-cols-12 gap-4 items-center hover:bg-green-50 transition-colors ${
                        index !== filteredSaves.length - 1 ? 'border-b border-gray-100' : ''
                      }`}
                    >
                      <div className="col-span-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {save.gameSave?.name || 'Unknown Game'}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getGameTypeColor(save.gameSave?.gameType || '')}`}
                          >
                            {save.gameSave?.gameType || 'Unknown'}
                          </Badge>
                        </div>
                      </div>
                      <div className="col-span-3">
                        <div>
                          <span className="text-sm font-medium text-gray-900 block">
                            {save.name || 'Unnamed Save'}
                          </span>
                          {save.description && (
                            <span className="text-xs text-gray-500 block truncate">
                              {save.description}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <span className="text-sm text-gray-600 truncate block">
                          {save.saveFile?.fileName || 'No file name'}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-sm text-gray-500">
                          {formatDate(save.createdAt)}
                        </span>
                      </div>
                      <div className="col-span-2 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadSave(save.saveFile)}
                          disabled={!save.saveFile?.url}
                          className="bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!hasAnySaves && !fetchingSaves && (
        <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <div className="text-6xl">🎯</div>
            <CardTitle className="text-2xl text-gray-700">No Game Saves Yet</CardTitle>
            <CardDescription className="text-lg max-w-md mx-auto">
              You haven't saved any games yet. Start playing and save your progress to see them here!
            </CardDescription>
          </CardContent>
        </Card>
      )}

      {/* Games with Saves */}
      {gamesWithSaves.length > 0 && (
        <div className="space-y-6">
          {gamesWithSaves.map(({ game, saves }) => (
            <Card key={game.id} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-2xl text-gray-900">{game.name}</CardTitle>
                      <Badge className={getGameTypeColor(game.gameType)}>
                        {game.gameType}
                      </Badge>
                    </div>
                    {game.description?.truncatedHTML && (
                      <CardDescription 
                        className="text-gray-600"
                        dangerouslySetInnerHTML={{ __html: game.description.truncatedHTML }}
                      />
                    )}
                    <div className="text-sm text-gray-500">
                      {saves.length} save{saves.length !== 1 ? 's' : ''} available
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <Accordion type="single" collapsible defaultValue="saves">
                  <AccordionItem value="saves" className="border-b-0">
                    <AccordionTrigger className="hover:no-underline px-6 py-4 hover:bg-gray-50">
                      <span className="font-medium">View All Saves ({saves.length})</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                      <div className="space-y-4">
                        {saves.map((save) => (
                          <div key={save.id} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="space-y-2">
                                {(save.name || save.description) && (
                                  <div className="space-y-1">
                                    {save.name && (
                                      <div className="font-medium text-gray-900">
                                        {save.name}
                                      </div>
                                    )}
                                    {save.description && (
                                      <div className="text-sm text-gray-600">
                                        {save.description}
                                      </div>
                                    )}
                                  </div>
                                )}
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>Created: {formatDate(save.createdAt)}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span>Updated: {formatDate(save.updatedAt)}</span>
                                  </div>
                                </div>
                                {save.saveFile?.fileName && (
                                  <div className="text-sm text-gray-500">
                                    File: {save.saveFile.fileName}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadSave(save.saveFile)}
                                  disabled={!save.saveFile?.url}
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  Download
                                </Button>

                                <AlertDialog open={deleteConfirmOpen && saveToDelete === save.id} onOpenChange={setDeleteConfirmOpen}>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setSaveToDelete(save.id)}
                                      disabled={deleting}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-4 h-4 mr-1" />
                                      Delete
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Game Save</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this saved game? This action cannot be undone and you'll lose your progress.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel onClick={() => setSaveToDelete(null)}>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => saveToDelete && handleDeleteSave(saveToDelete)}
                                        disabled={deleting}
                                        className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                                      >
                                        {deleting ? "Deleting..." : "Delete Save"}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}