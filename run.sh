docker compose -p webcoc-codeforge -f docker-compose.codeforge.yml up --build -d
npm ci 
npm run dev
