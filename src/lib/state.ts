import {
  categoryKeys,
  isCategoryKey,
  type CategoryKey,
} from "./categories";

export type ViewKey = "list" | "map";

export interface AppState {
  category: CategoryKey;
  view: ViewKey;
}

export const defaultState: AppState = {
  category: categoryKeys[0],
  view: "list",
};

export function parseState(search: string): AppState {
  const params = new URLSearchParams(search);
  const category = params.get("category");
  const view = params.get("view");
  return {
    category: isCategoryKey(category) ? category : defaultState.category,
    view: view === "map" || view === "list" ? view : defaultState.view,
  };
}

export function stateUrl(state: AppState, currentUrl: string): string {
  const url = new URL(currentUrl);
  url.searchParams.set("category", state.category);
  url.searchParams.set("view", state.view);
  return `${url.pathname}?${url.searchParams.toString()}${url.hash}`;
}
