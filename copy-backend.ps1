# Copy essential backend files to root
Copy-Item "backend/database.js" -Destination "."
Copy-Item "backend/database.dev.js" -Destination "."
Copy-Item "backend/database.prod.js" -Destination "."
Copy-Item "backend/routes/*" -Destination "routes/" -Recurse
Copy-Item "backend/middleware/*" -Destination "middleware/" -Recurse
Copy-Item "backend/config/*" -Destination "config/" -Recurse
Copy-Item "backend/services/*" -Destination "services/" -Recurse
Copy-Item "backend/utils/*" -Destination "utils/" -Recurse
Copy-Item "backend/migrations/*" -Destination "migrations/" -Recurse
Copy-Item "backend/docs/*" -Destination "docs/" -Recurse
Copy-Item "backend/public/*" -Destination "public/" -Recurse
