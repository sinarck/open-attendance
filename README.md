there are a lot of existing "attendance" solutions. but a lot of them are too complicated, closed-source, or lacking in certain features -- like geofencing (also their UIs aren't the prettiest thing ever).

so I made my own, and open attendance is the result. more info coming soon.

on vercel, use `vp run build:vercel` as the build command so convex and next deploy together. it explicitly wires `NEXT_PUBLIC_CONVEX_URL` into the next build.
