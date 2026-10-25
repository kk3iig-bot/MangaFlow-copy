import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AppShell from "@/components/AppShell";
import Home from "@/pages/Home";
import { FavoritesPage, HistoryPage } from "@/pages/Library";
import MangaDetails from "@/pages/MangaDetails";
import Reader from "@/pages/Reader";
import "./index.css";

function Router() {
  return <AppShell><Switch>
    <Route path="/" component={() => <Home />} />
    <Route path="/search" component={() => <Home mode="search" />} />
    <Route path="/favorites" component={FavoritesPage} />
    <Route path="/history" component={HistoryPage} />
    <Route path="/manga/:id">{params => <MangaDetails id={params.id} />}</Route>
    <Route path="/read/:mangaId/:chapterId">{params => <Reader mangaId={params.mangaId} chapterId={params.chapterId} />}</Route>
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch></AppShell>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="dark"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
