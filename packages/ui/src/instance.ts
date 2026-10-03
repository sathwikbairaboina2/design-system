/** Random per module instance: two copies of @sathwik/ui at runtime would show two different ids. */
export const UI_INSTANCE_ID: string = Math.random().toString(36).slice(2, 10);
