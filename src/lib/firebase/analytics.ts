import { getAnalytics, isSupported, Analytics } from "firebase/analytics";
import { app } from "./client";

export async function obterAnalytics(): Promise<Analytics | null> {
    if (typeof window === "undefined") {
        return null; // Don't run Analytics during NextJS SSR
    }

    const supported = await isSupported();
    if (supported) {
        return getAnalytics(app);
    }
    return null;
}
