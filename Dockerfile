FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ENV DATABASE_URL="postgresql://advisorflow:advisorflow@db:5432/advisorflow"
RUN cp prisma/schema.postgres.prisma prisma/schema.prisma && npx prisma generate && npm run build

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npm start"]
