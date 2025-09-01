import React, { useState } from "react";
import { useFindMany } from "@gadgetinc/react";
import { AutoForm, AutoInput, AutoBelongsToInput, AutoSubmit, SubmitResultBanner } from "@/components/auto";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "../api";

type SelectedGame = {
  id: string;
  name: string;
};

export default function UploadSavePage() {
  const [selectedGame, setSelectedGame] = useState<SelectedGame | null>(null);
  const [open, setOpen] = useState(false);

  // Fetch games for the dropdown
  const [{ data: games, fetching: fetchingGames, error: gamesError }] = useFindMany(api.game, {
    select: {
      id: true,
      name: true,
    },
    sort: {
      name: "Ascending",
    },
  });

  if (gamesError) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-red-600">Error loading games: {gamesError.toString()}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Save File
          </CardTitle>
          <CardDescription>
            Select a game and upload a save file associated with it. Save files will be securely stored and can be downloaded later.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Game Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Select Game
            </label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                  disabled={fetchingGames}
                >
                  {selectedGame ? (
                    <span className="flex items-center gap-2">
                      <span>{selectedGame.name}</span>
                      <span className="text-muted-foreground text-xs">ID: {selectedGame.id}</span>
                    </span>
                  ) : fetchingGames ? (
                    "Loading games..."
                  ) : (
                    "Select a game..."
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search games..." />
                  <CommandList>
                    <CommandEmpty>No games found.</CommandEmpty>
                    <CommandGroup>
                      {games?.map((game) => (
                        <CommandItem
                          key={game.id}
                          value={game.name}
                          onSelect={() => {
                            setSelectedGame({
                              id: game.id,
                              name: game.name,
                            });
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedGame?.id === game.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{game.name}</span>
                            <span className="text-xs text-muted-foreground">ID: {game.id}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Save File Upload Form */}
          {selectedGame && (
            <div className="border-t pt-6">
              <AutoForm action={api.gameSaves.create}>
                <div className="space-y-4">
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <div className="text-sm font-medium mb-1">Selected Game</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedGame.name} (ID: {selectedGame.id})
                    </div>
                  </div>

                  {/* Game relationship input - disabled to show selected game */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Game
                    </label>
                    <AutoBelongsToInput 
                      field="game" 
                      disabled 
                      defaultValue={selectedGame.id}
                    />
                  </div>

                  <AutoInput field="name" />
                  <AutoInput field="description" />
                  <AutoInput field="saveFile" />

                  <div className="flex flex-col gap-4">
                    <AutoSubmit className="w-full">Upload Save File</AutoSubmit>
                    <SubmitResultBanner />
                  </div>
                </div>
              </AutoForm>
            </div>
          )}

          {!selectedGame && (
            <div className="border-t pt-6">
              <div className="text-center text-muted-foreground py-8">
                Please select a game first to upload a save file.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}