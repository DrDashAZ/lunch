"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { UtensilsCrossed, Plus, Trash2, RotateCcw, ChefHat, Sparkles, Loader2 } from "lucide-react";

import { useLocalStorage } from "@/hooks/use-local-storage";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "./ui/badge";

type Restaurant = {
  id: string;
  name: string;
  blacklisted: boolean;
};

const formSchema = z.object({
  restaurantName: z.string().min(1, "Please enter a restaurant name.").max(50, "Name is too long."),
});

export function LunchRouletteClient() {
  const [restaurants, setRestaurants] = useLocalStorage<Restaurant[]>("restaurants", []);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      restaurantName: "",
    },
  });

  const activeRestaurants = useMemo(() => restaurants.filter(r => !r.blacklisted), [restaurants]);
  const hasBlacklisted = useMemo(() => restaurants.some(r => r.blacklisted), [restaurants]);

  function handleAddRestaurant(values: z.infer<typeof formSchema>) {
    const newRestaurant: Restaurant = {
      id: crypto.randomUUID(),
      name: values.restaurantName.trim(),
      blacklisted: false,
    };
    setRestaurants([...restaurants, newRestaurant]);
    form.reset();
  }

  function handleRemoveRestaurant(id: string) {
    setRestaurants(restaurants.filter((r) => r.id !== id));
  }

  function handleToggleBlacklist(id: string) {
    setRestaurants(
      restaurants.map((r) =>
        r.id === id ? { ...r, blacklisted: !r.blacklisted } : r
      )
    );
  }

  function handleResetBlacklist() {
    setRestaurants(restaurants.map((r) => ({ ...r, blacklisted: false })));
  }

  function handleGetSuggestion() {
    if (activeRestaurants.length < 2) {
      toast({
        variant: "destructive",
        title: "Not enough options!",
        description: "Please add at least two active restaurants to get a suggestion.",
      });
      return;
    }

    setDialogOpen(true);
    setIsLoading(true);
    setSuggestion(null);

    // Use a timeout to create a sense of anticipation
    setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * activeRestaurants.length);
        const randomRestaurant = activeRestaurants[randomIndex];
        setSuggestion(randomRestaurant.name);
        setIsLoading(false);
    }, 1500);
  }

  if (!isClient) {
    return null;
  }

  return (
    <div className="w-full space-y-8">
      <header className="text-center">
        <UtensilsCrossed className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-4xl md:text-5xl font-bold font-headline">Lunch Roulette</h1>
        <p className="mt-2 text-lg text-muted-foreground">Can't decide? Let fate pick your lunch.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Add a Restaurant</CardTitle>
          <CardDescription>Build your list of potential lunch spots.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddRestaurant)} className="flex items-start gap-4">
              <FormField
                control={form.control}
                name="restaurantName"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormControl>
                      <Input placeholder="e.g., The Cozy Diner" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" aria-label="Add restaurant">
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <CardTitle>Your Restaurants</CardTitle>
              <CardDescription>Manage your list here. Toggle to temporarily exclude a spot.</CardDescription>
            </div>
            {hasBlacklisted && (
              <Button variant="ghost" size="sm" onClick={handleResetBlacklist}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {restaurants.length > 0 ? (
              <ul className="space-y-3">
                <AnimatePresence>
                  {restaurants.map((restaurant) => (
                    <motion.li
                      key={restaurant.id}
                      layout
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${restaurant.blacklisted ? 'bg-muted/50' : 'bg-background'}`}
                    >
                      <Switch
                        id={`blacklist-${restaurant.id}`}
                        checked={restaurant.blacklisted}
                        onCheckedChange={() => handleToggleBlacklist(restaurant.id)}
                        aria-label={`Exclude ${restaurant.name}`}
                      />
                      <Label htmlFor={`blacklist-${restaurant.id}`} className={`flex-grow text-lg transition-all ${restaurant.blacklisted ? 'line-through text-muted-foreground' : ''}`}>
                        {restaurant.name}
                      </Label>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveRestaurant(restaurant.id)} aria-label={`Remove ${restaurant.name}`}>
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            ) : (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <p>Your restaurant list is empty.</p>
                <p className="text-sm">Add some spots to get started!</p>
              </div>
            )}
          </div>
        </CardContent>
        {restaurants.length > 0 && 
            <CardFooter className="flex-col items-stretch gap-4 pt-4">
                <Separator/>
                 <Button size="lg" onClick={handleGetSuggestion} disabled={activeRestaurants.length < 2}>
                    <Sparkles className="mr-2 h-5 w-5" />
                    What's for Lunch?
                </Button>
                {activeRestaurants.length < 2 && (
                    <p className="text-sm text-center text-muted-foreground">Add at least two active restaurants to play.</p>
                )}
            </CardFooter>
        }
      </Card>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl text-center">The Verdict Is In...</DialogTitle>
          </DialogHeader>
          <div className="min-h-[120px] flex items-center justify-center text-center">
            {isLoading ? (
              <div className="space-y-2">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">Spinning the wheel of fate...</p>
              </div>
            ) : (
              suggestion && (
                <div className="space-y-4 animate-in fade-in-50">
                    <DialogDescription>Your delicious destiny is:</DialogDescription>
                    <p className="text-3xl font-bold font-headline text-accent flex items-center justify-center gap-2">
                        <ChefHat className="h-8 w-8" />
                        {suggestion}
                    </p>
                </div>
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
