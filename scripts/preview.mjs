import { serve } from "./server.mjs";
const { server, url } = await serve("dist", Number(process.env.PORT || 4173));
console.log(`Cult preview: ${url}/preview/ (Ctrl+C to stop)`);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => server.close(() => process.exit(0)));
