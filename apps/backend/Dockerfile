FROM node:20

WORKDIR /app
COPY . .

RUN npm install -g pnpm && pnpm install && pnpm build

CMD ["node", "dist/main"]
