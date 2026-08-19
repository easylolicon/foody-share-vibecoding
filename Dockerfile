FROM node:24-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PNPM_HOME=/pnpm
ENV PATH=${PNPM_HOME}:${PATH}

RUN corepack enable && corepack prepare pnpm@11.21.0 --activate

COPY package.json .npmrc ./
RUN pnpm install --prod --no-frozen-lockfile

COPY src ./src
COPY database ./database
COPY views ./views
COPY public ./public

RUN mkdir -p /app/data /app/uploads

EXPOSE 3000

CMD ["sh", "-c", "pnpm run migrate && pnpm start"]
